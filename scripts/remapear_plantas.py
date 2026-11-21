#!/usr/bin/env python3
"""Reasigna en app/data/marcas.json las presentaciones de plantas que el nomenclátor había clasificado solo por su
código ATC (p. ej. COLA DE CABALLO → «ahorradores de potasio», SEN/CÁSCARA → «laxantes», ECHINAMED → «resfriado»)
a los principios de plantas de la base (laxantes_plantas, plantas_diureticas, equinacea, fucus…), usando los
«sinonimos» botánicos de kb.json. build_cima.py ya lo hace al regenerar el nomenclátor; este script aplica lo mismo
al marcas.json publicado sin descargarlo de nuevo.

Uso: python3 scripts/remapear_plantas.py [--dry-run]
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_cima as bc  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MARCAS = ROOT / "app/data/marcas.json"


def main(dry=False):
    kb = json.loads(bc.KB.read_text(encoding="utf-8"))
    bc.cargar_prefijos_botanicos(kb)
    tipos = {p["id"]: (p.get("tipo") or c.get("tipo")) for c in kb["clases"] for p in c["principios"]}
    marcas = json.loads(MARCAS.read_text(encoding="utf-8"))
    cambios = 0
    for m in marcas:
        if m.get("principios") or not m.get("pa") or not m.get("clase"):
            continue
        pids = []
        for trozo in m["pa"].split("+"):
            n = " ".join(re.sub(r"[,;:()]", " ", bc.quitar_acentos(trozo)).split())
            for k, v in bc.PREFIJOS_BOTANICOS:
                if n.startswith(k) and tipos.get(v) in ("planta", "suplemento"):
                    if v not in pids:
                        pids.append(v)
                    break
        if not pids:
            continue
        print(f"  {m['nombre']:<55} {m['clase']:<20} → {' + '.join(pids)}")
        dosis = m.get("dosis") if len(pids) == 1 else None
        nuevo = {"nombre": m["nombre"], "principios": pids, **({"dosis": dosis} if dosis else {}), **({"cn": m["cn"]} if m.get("cn") else {})}
        m.clear(); m.update(nuevo)
        cambios += 1
    print(f"{cambios} presentaciones reasignadas")
    if cambios and not dry:
        MARCAS.write_text(json.dumps(marcas, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"Escrito {MARCAS}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
