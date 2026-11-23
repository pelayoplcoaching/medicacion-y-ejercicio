#!/usr/bin/env python3
"""Contenido clínico en inglés (segunda tanda de mejoras grandes, 20).

La traducción vive en scripts/trad_en/memoria.json ({ huella: { es, en } }, huella = FNV-1a de 32 bits del texto en español).
Como la clave es la huella del texto, si un texto de la base cambia deja de tener traducción y la aplicación lo enseña en
español hasta que se traduzca: nunca queda una traducción vieja pegada a un texto nuevo.

  python3 scripts/contenido_en.py pendientes [carpeta]   lista lo que falta por traducir y lo reparte en lotes es-NN.json
  python3 scripts/contenido_en.py anadir <carpeta>       incorpora a la memoria los lotes traducidos (en-NN.json junto a es-NN.json)
  python3 scripts/contenido_en.py montar                 escribe app/data/en/contenido.json con lo que se usa hoy

TRADUCCIÓN SIN REVISIÓN CLÍNICA: la aplicación lo dice mientras esté en inglés."""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
MEM = ROOT / "scripts/trad_en/memoria.json"
AMBITOS = ["general", "aerobico", "fuerza", "equilibrio"]


def fnv(s):
    h = 0x811C9DC5
    for b in s.encode("utf-8"):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def textos():
    """Todo lo que la aplicación enseña en español y sale de la base, las interacciones revisadas o los módulos: [(grupo, texto)], sin repetir."""
    kb = json.loads((APP / "data/kb.json").read_text(encoding="utf-8"))
    ddi = json.loads((APP / "data/ddi_curated.json").read_text(encoding="utf-8"))
    out, vistos = [], set()

    def add(grupo, s):
        if isinstance(s, str) and s.strip() and s not in vistos:
            vistos.add(s)
            out.append((grupo, s))

    add("aviso", kb.get("aviso"))
    for n in kb["niveles"].values():
        add("nivel", n["etiqueta"])
    for v in kb["senales"].values():
        add("senal", v)
    for c in kb["clases"]:
        add("clase", c["nombre"])
        add("resumen", c["resumen"])
        for a in AMBITOS:
            for r in c.get(a, []):
                add("regla", r["texto"])
        for p in c["principios"]:
            add("principio", p["nombre"])
            add("nota", p.get("nota"))
            for h in (p.get("horario") or {}).get("evitar", []):
                add("motivo", h.get("motivo"))
    for r in kb["reglas_combinadas"]:
        add("comb_titulo", r["titulo"])
        add("comb_texto", r["texto"])
    for n in (ddi.get("niveles") or {}).values():
        add("nivel", n.get("etiqueta") if isinstance(n, dict) else n)
    for x in ddi["interacciones"]:
        add("ddi_efecto", x.get("efecto"))
        add("ddi_accion", x.get("accion"))
    mods = json.loads(subprocess.run(["node", str(ROOT / "scripts/contenido_modulos.mjs")], check=True, capture_output=True, text=True).stdout)
    for m, lista in mods.items():
        for s in lista:
            add("mod_" + m, s)
    return out, kb["version"]


def memoria():
    return json.loads(MEM.read_text(encoding="utf-8")) if MEM.exists() else {}


NUM = re.compile(r"\d+(?:[.,]\d+)?")
norm_num = lambda s: sorted(x.replace(",", ".") for x in NUM.findall(s))


def comprobar(es, en):
    """Avisos de una pareja: marcadores {…} y cifras deben conservarse."""
    av = []
    if sorted(re.findall(r"\{[a-z_]+\}", es)) != sorted(re.findall(r"\{[a-z_]+\}", en)):
        av.append("marcadores")
    if norm_num(es) != norm_num(en):
        av.append(f"cifras {norm_num(es)} ≠ {norm_num(en)}")
    if not en.strip() or len(en) > 2.2 * len(es) + 20 or len(en) < 0.35 * len(es) - 10:
        av.append("longitud")
    return av


def main():
    orden = sys.argv[1] if len(sys.argv) > 1 else "montar"
    tx, version = textos()
    mem = memoria()
    if orden == "pendientes":
        falta = [(g, s) for g, s in tx if fnv(s) not in mem]
        print(f"{len(tx)} textos en uso · {len(tx) - len(falta)} traducidos · {len(falta)} pendientes ({sum(len(s) for _, s in falta)} caracteres)")
        if len(sys.argv) > 2 and falta:
            d = Path(sys.argv[2]); d.mkdir(parents=True, exist_ok=True)
            lote, n, k = [], 0, 1
            for g, s in falta:
                if lote and n + len(s) > 9000:
                    (d / f"es-{k:02d}.json").write_text(json.dumps(lote, ensure_ascii=False, indent=0), encoding="utf-8"); k += 1; lote, n = [], 0
                lote.append(s); n += len(s)
            if lote:
                (d / f"es-{k:02d}.json").write_text(json.dumps(lote, ensure_ascii=False, indent=0), encoding="utf-8")
            print(f"{k} lotes en {d}")
    elif orden == "anadir":
        d = Path(sys.argv[2]); nuevos = avisos = 0
        for f in sorted(d.glob("es-*.json")):
            g = d / f.name.replace("es-", "en-")
            if not g.exists():
                continue
            es, en = json.loads(f.read_text(encoding="utf-8")), json.loads(g.read_text(encoding="utf-8"))
            assert len(es) == len(en), f"{g.name}: {len(en)} traducciones para {len(es)} textos"
            for a, b in zip(es, en):
                av = comprobar(a, b)
                if av:
                    avisos += 1; print(f"⚠ {g.name}: {'; '.join(av)}\n   ES: {a[:150]}\n   EN: {b[:150]}")
                mem[fnv(a)] = {"es": a, "en": b}; nuevos += 1
        MEM.parent.mkdir(parents=True, exist_ok=True)
        MEM.write_text(json.dumps(mem, ensure_ascii=False, indent=0, sort_keys=True), encoding="utf-8")
        print(f"{nuevos} textos incorporados · {avisos} con avisos · memoria: {len(mem)}")
    else:
        h, falta = {}, 0
        for _, s in tx:
            k = fnv(s)
            assert k not in h or mem.get(k, {}).get("es") == s, f"choque de huella: {s[:60]}"
            if k in mem and mem[k]["es"] == s:
                h[k] = mem[k]["en"]
            else:
                falta += 1
        sal = APP / "data/en/contenido.json"; sal.parent.mkdir(parents=True, exist_ok=True)
        sal.write_text(json.dumps({"version": version, "n": len(h), "total": len(tx), "h": h}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"app/data/en/contenido.json: {len(h)} de {len(tx)} textos ({falta} sin traducir) · {sal.stat().st_size // 1024} KB · base {version}")


if __name__ == "__main__":
    main()
