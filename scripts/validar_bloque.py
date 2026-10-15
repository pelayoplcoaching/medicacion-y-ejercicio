#!/usr/bin/env python3
"""Valida un bloque propuesto (por un modelo o a mano) antes de copiarlo a data/ext/ y fusionarlo con merge_kb.py.

Comprueba estructura, niveles, ámbitos, señales y condiciones conocidas, fuente y evidencia en cada regla, longitud y
estilo de los textos, ids únicos frente a la base y referencias de interacciones. Devuelve código 1 si hay errores.

Uso:
    python3 scripts/validar_bloque.py data/propuestas/lenalidomida.json
    python3 scripts/validar_bloque.py data/propuestas/ddi_apixaban_claritromicina.json --ddi
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = json.loads((ROOT / "app/data/kb.json").read_text(encoding="utf-8"))
AMBITOS = ["general", "aerobico", "fuerza", "equilibrio"]
NIVELES = {"info", "precaucion", "alerta"}
EVIDENCIAS = {"ft", "guia", "criterios", "base", "revision"}
CONDICIONES = {"diabetes", "insuficiencia_cardiaca", "renal", "renal_grave", "marcapasos", "osteoporosis", "epoc_asma", "oxigeno", "embarazo", "nyha34", "fevi_baja", "fragil", "prefragil",
               "hipertension", "cardiopatia_isquemica", "fibrilacion_auricular", "aneurisma_aorta", "ictus", "cancer", "artrosis", "epilepsia", "hepatopatia", "obesidad"}
CLASES = {c["id"]: c for c in KB["clases"]}
PRINCIPIOS = {pr["id"] for c in KB["clases"] for pr in c["principios"]}
SENALES = set(KB["senales"])
ID_RE = re.compile(r"^[a-z0-9_]+$")
errores, avisos = [], []


def err(m): errores.append(m)
def aviso(m): avisos.append(m)


def validar_regla(r, donde, senales_ok, maximo=480):
    if not isinstance(r, dict) or "texto" not in r or "nivel" not in r:
        err(f"{donde}: regla sin texto o nivel"); return
    if r["nivel"] not in NIVELES: err(f"{donde}: nivel «{r['nivel']}» no válido")
    t = r["texto"].strip()
    if len(t) < 40 and not re.match(r"^(Sin limitación|Sin precauciones|Indicado|Seguro|Recomendable)", t): err(f"{donde}: texto demasiado corto ({len(t)}): «{t[:50]}»")
    if len(t) > maximo: err(f"{donde}: texto demasiado largo ({len(t)} > {maximo})")
    if not r.get("fuente"): err(f"{donde}: falta «fuente»")
    if r.get("evidencia") not in EVIDENCIAS: err(f"{donde}: «evidencia» ausente o no válida ({r.get('evidencia')})")
    if re.search(r"\b(tú|tu|te)\b", t, re.I): aviso(f"{donde}: parece tuteo («{t[:60]}…»); la app usa «usted»")
    if re.search(r"[A-Z]{4,}", t) and not re.search(r"ACSM|NYHA|FEVI|SPPB|HIIT|EPOC|IECA|ARA|DAI|AINE|ISRS|TDAH|VIH|LHRH|GLP|SGLT|DPP|CGRP|PDE|QT|INR|TAR", t): aviso(f"{donde}: sigla sin explicar «{re.search(r'[A-Z]{4,}', t).group(0)}»")
    si = r.get("si")
    if si:
        if not isinstance(si, dict): err(f"{donde}: «si» debe ser un objeto")
        else:
            for k, v in si.items():
                if k == "dosis" and v != "alta": err(f"{donde}: si.dosis solo admite «alta»")
                elif k == "edad_min" and not isinstance(v, (int, float)): err(f"{donde}: si.edad_min debe ser número")
                elif k == "principio" and not ID_RE.match(str(v)): err(f"{donde}: si.principio «{v}» no es un id válido")
                elif k == "condicion" and v not in CONDICIONES: err(f"{donde}: si.condicion «{v}» desconocida")
                elif k in ("senal", "senales", "todas", "cualquiera"):
                    for sn in ([v] if isinstance(v, str) else v):
                        if sn not in senales_ok: err(f"{donde}: señal «{sn}» desconocida")
                elif k not in ("dosis", "edad_min", "principio", "condicion", "min", "sin_condicion", "senal", "senales", "todas", "cualquiera", "clases"): aviso(f"{donde}: clave «{k}» en «si» no habitual")


def validar_clase(c, nueva, senales_ok):
    cid = c.get("id", "?")
    if not ID_RE.match(cid): err(f"clase «{cid}»: id no válido (minúsculas, números y _)")
    if nueva and cid in CLASES: aviso(f"clase «{cid}» ya existe: el bloque la SUSTITUIRÁ entera al fusionar")
    for k in ("nombre", "resumen"):
        if nueva and not c.get(k): err(f"clase «{cid}»: falta «{k}»")
    if nueva and not c.get("atc"): aviso(f"clase «{cid}»: sin códigos ATC (no se clasificarán presentaciones del nomenclátor)")
    for sn in c.get("senales", []):
        if sn not in senales_ok: err(f"clase «{cid}»: señal «{sn}» desconocida")
    for pr in c.get("principios", []) + c.get("principios_add", []):
        pid = pr.get("id", "?")
        if not ID_RE.match(pid): err(f"principio «{pid}»: id no válido")
        if pid in PRINCIPIOS and nueva: aviso(f"principio «{pid}» ya existe en la base")
        if not pr.get("nombre"): err(f"principio «{pid}»: falta nombre")
        u = pr.get("umbral_mg", {}).get("alta") if isinstance(pr.get("umbral_mg"), dict) else None
        if pr.get("umbral_mg") and not isinstance(u, (int, float)): err(f"principio «{pid}»: umbral_mg.alta debe ser número")
        for amb in AMBITOS:
            for i, r in enumerate(pr.get(amb, []) or []): validar_regla(r, f"{cid}/{pid}/{amb}#{i}", senales_ok)
    n = 0
    for amb in AMBITOS:
        for i, r in enumerate(c.get(amb if nueva else amb + "_add", []) or []): validar_regla(r, f"{cid}/{amb}#{i}", senales_ok); n += 1
    if nueva and n == 0: err(f"clase «{cid}»: sin reglas")
    if nueva and n > 20: aviso(f"clase «{cid}»: {n} reglas; conviene no pasar de 4 por ámbito")


def validar_ddi(lista):
    if not isinstance(lista, list): err("un bloque de interacciones debe ser una lista"); return
    for i, x in enumerate(lista):
        for k in ("a", "b", "nivel", "efecto", "accion", "fuente"):
            if not x.get(k): err(f"ddi#{i}: falta «{k}»")
        if x.get("nivel") not in ("mayor", "moderada", "menor"): err(f"ddi#{i}: nivel «{x.get('nivel')}» no válido")
        for k in ("a", "b"):
            v = x.get(k, "")
            if v.startswith("clase:"):
                if v[6:] not in CLASES: err(f"ddi#{i}: clase «{v}» desconocida")
            elif v and v not in PRINCIPIOS: err(f"ddi#{i}: principio «{v}» no está en la base")
        if len(x.get("efecto", "")) > 300 or len(x.get("accion", "")) > 300: aviso(f"ddi#{i}: textos largos")


def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    p = Path(sys.argv[1]); d = json.loads(p.read_text(encoding="utf-8"))
    if "--ddi" in sys.argv or isinstance(d, list):
        validar_ddi(d)
    else:
        senales_ok = SENALES | set(d.get("senales_nuevas", {}))
        for c in d.get("clases", []): validar_clase(c, True, senales_ok)
        for c in d.get("clases_parche", []):
            if c.get("id") not in CLASES: err(f"parche para clase inexistente «{c.get('id')}»")
            validar_clase(c, False, senales_ok)
        for r in d.get("reglas_combinadas", []):
            for k in ("id", "si", "nivel", "titulo", "texto", "ambitos", "fuente"):
                if not r.get(k): err(f"combinada «{r.get('id', '?')}»: falta «{k}»")
            validar_regla({**r, "evidencia": r.get("evidencia", "guia")}, f"combinada {r.get('id', '?')}", senales_ok, maximo=600)
        if not any(k in d for k in ("clases", "clases_parche", "reglas_combinadas")): err("el bloque no tiene clases, clases_parche ni reglas_combinadas")
    for a in avisos: print("  aviso:", a)
    for e in errores: print("  ERROR:", e)
    print(f"{len(errores)} errores · {len(avisos)} avisos")
    if not errores: print("Válido. Siguiente paso: copiar a data/ext/<nn>_<nombre>.json (o ddi_<nn>_<nombre>.json + scripts/add_ddi.py) y ejecutar scripts/merge_kb.py y node scripts/test.mjs")
    sys.exit(1 if errores else 0)


if __name__ == "__main__":
    main()
