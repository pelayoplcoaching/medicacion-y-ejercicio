#!/usr/bin/env python3
"""Fusiona los bloques de data/ext/*.json en app/data/kb.json y valida el resultado.

Cada bloque puede traer: senales_nuevas {id: texto}, clases [...], reglas_combinadas [...].
Una clase con el mismo id que una existente la SUSTITUYE (así se pueden corregir clases desde un bloque).
Uso: python3 scripts/merge_kb.py [--dry-run]
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "app" / "data" / "kb.json"
EXT = sorted(p for p in (ROOT / "data" / "ext").glob("*.json") if not p.name.startswith("ddi_"))
NIVELES = {"info", "precaucion", "alerta"}
AMBITOS = ["general", "aerobico", "fuerza", "equilibrio"]


def main(dry=False):
    kb = json.loads(KB.read_text(encoding="utf-8"))
    clases = {c["id"]: c for c in kb["clases"]}
    reglas = {r["id"]: r for r in kb["reglas_combinadas"]}
    n_cl = n_re = 0
    for path in EXT:
        blk = json.loads(path.read_text(encoding="utf-8"))
        for sid, txt in blk.get("senales_nuevas", {}).items():
            kb["senales"].setdefault(sid, txt)
        for c in blk.get("clases", []):
            if c["id"] in clases:
                print(f"  sustituye clase {c['id']} ({path.name})")
            clases[c["id"]] = c
            n_cl += 1
        for r in blk.get("reglas_combinadas", []):
            reglas[r["id"]] = r
            n_re += 1
        for parche in blk.get("clases_parche", []):
            c = clases.get(parche["id"])
            if not c:
                print(f"  AVISO: parche para clase inexistente {parche['id']}")
                continue
            for amb in AMBITOS:
                for r in parche.get(amb + "_add", []):
                    if r["texto"] not in {x["texto"] for x in c.setdefault(amb, [])}:
                        c[amb].append(r)
            if "horario" in parche:
                c["horario"] = parche["horario"]
            for pr in parche.get("principios_add", []):
                if pr["id"] not in {x["id"] for x in c["principios"]}:
                    c["principios"].append(pr)
        for pid, h in blk.get("principios_horario", {}).items():
            for c in clases.values():
                for pr in c["principios"]:
                    if pr["id"] == pid:
                        pr["horario"] = h
    kb["clases"] = list(clases.values())
    kb["reglas_combinadas"] = list(reglas.values())
    combos = {c["nombre"]: c for c in kb.get("combinaciones", [])}
    for path in EXT:
        for c in json.loads(path.read_text(encoding="utf-8")).get("combinaciones", []):
            combos[c["nombre"]] = c
    kb["combinaciones"] = list(combos.values())

    # --- validación ---
    errores = []
    senales = set(kb["senales"])
    pids = {}
    for c in kb["clases"]:
        for k in ("id", "nombre", "resumen", "principios", "senales"):
            if k not in c:
                errores.append(f"clase {c.get('id')}: falta '{k}'")
        for s in c.get("senales", []):
            if s not in senales:
                errores.append(f"clase {c['id']}: señal desconocida '{s}'")
        for p in c.get("principios", []):
            if p["id"] in pids:
                errores.append(f"principio duplicado '{p['id']}' en {c['id']} y {pids[p['id']]}")
            pids[p["id"]] = c["id"]
            for s in p.get("senales_extra", []):
                if s not in senales:
                    errores.append(f"principio {p['id']}: señal desconocida '{s}'")
            if not re.fullmatch(r"[a-z0-9_]+", p["id"]):
                errores.append(f"principio id no válido '{p['id']}'")
        for amb in AMBITOS:
            for r in c.get(amb, []):
                if r.get("nivel") not in NIVELES:
                    errores.append(f"clase {c['id']}/{amb}: nivel inválido {r.get('nivel')}")
                if not r.get("texto"):
                    errores.append(f"clase {c['id']}/{amb}: regla sin texto")
                si = r.get("si") or {}
                if "principio" in si and pids.get(si["principio"]) != c["id"]:
                    errores.append(f"clase {c['id']}/{amb}: condición principio '{si['principio']}' no pertenece a la clase")
    for r in kb["reglas_combinadas"]:
        si = r.get("si", {})
        for s in si.get("todas", []) + ([si["senal"]] if "senal" in si else []):
            if s not in senales:
                errores.append(f"regla {r['id']}: señal desconocida '{s}'")
        if r.get("nivel") not in NIVELES:
            errores.append(f"regla {r['id']}: nivel inválido")
    for c in kb["combinaciones"]:
        for comp in c["componentes"]:
            if comp["pid"] not in pids:
                errores.append(f"combinación {c['nombre']}: principio desconocido '{comp['pid']}'")
    if errores:
        print("\n".join("ERROR " + e for e in errores))
        sys.exit(1)

    kb["version"] = f"{date.today():%Y.%m.%d}"
    kb["fecha"] = date.today().isoformat()
    n_p = sum(len(c["principios"]) for c in kb["clases"])
    print(f"Bloques: {len(EXT)} · clases añadidas/sustituidas: {n_cl} · reglas: {n_re}")
    print(f"Resultado: {len(kb['clases'])} clases · {n_p} principios activos · {len(kb['reglas_combinadas'])} reglas combinadas · {len(kb['senales'])} señales · {len(kb['combinaciones'])} combinaciones")
    if not dry:
        KB.write_text(json.dumps(kb, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Escrito {KB}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
