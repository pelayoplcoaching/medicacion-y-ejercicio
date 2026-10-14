#!/usr/bin/env python3
"""Genera app/data/ddi.json a partir de los CSV de DDInter 2.0.

Uso:
    python3 scripts/build_ddi.py data/raw/ddinter/*.csv

Descarga previa (una sola vez): https://ddinter.scbdd.com/download/
Descargue los ficheros "ddinter_downloads_code_X.csv" (uno por letra ATC: A, B, D, H, L, P, R, V)
y guárdelos en data/raw/ddinter/.

Formato esperado de cada CSV (cabecera): DDInterID_A,Drug_A,DDInterID_B,Drug_B,Level
Level ∈ {Major, Moderate, Minor, Unknown}

Licencia de los datos: CC BY-NC-SA 4.0 (uso no comercial, atribución y compartir igual).

Salida: app/data/ddi.json → {"version":..., "fuente":..., "pares": [[id_a, id_b, nivel], ...]}
Solo se conservan los pares en los que AMBOS fármacos están en la base de conocimiento (kb.json),
lo que mantiene el fichero pequeño (<100 KB) y cargable en el navegador.
"""
import csv
import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "app" / "data" / "kb.json"
MAP = ROOT / "scripts" / "nombres_es_en.json"
OUT = ROOT / "app" / "data" / "ddi.json"

NIVEL = {"major": "mayor", "moderate": "moderada", "minor": "menor"}


def norm(s: str) -> str:
    return " ".join(s.lower().replace("-", " ").split())


def main(paths):
    kb = json.loads(KB.read_text(encoding="utf-8"))
    mapa = json.loads(MAP.read_text(encoding="utf-8"))
    mapa.pop("_nota", None)

    # nombre inglés normalizado → id de principio (puede haber varios ids por nombre; se guardan todos)
    en_to_ids: dict[str, set[str]] = {}
    for clase in kb["clases"]:
        for p in clase["principios"]:
            pid = p["id"]
            nombres = mapa.get(pid, pid.capitalize())
            if isinstance(nombres, str):
                nombres = [nombres]
            for n in nombres:
                en_to_ids.setdefault(norm(n), set()).add(pid)

    pares: dict[tuple[str, str], str] = {}
    leidos = 0
    for path in paths:
        with open(path, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                leidos += 1
                nivel = NIVEL.get(row.get("Level", "").strip().lower())
                if not nivel:
                    continue
                ids_a = en_to_ids.get(norm(row["Drug_A"]), ())
                ids_b = en_to_ids.get(norm(row["Drug_B"]), ())
                for a in ids_a:
                    for b in ids_b:
                        if a == b:
                            continue
                        key = tuple(sorted((a, b)))
                        # si aparece dos veces, conservar el nivel más grave
                        orden = {"mayor": 3, "moderada": 2, "menor": 1}
                        if orden[nivel] > orden.get(pares.get(key, ""), 0):
                            pares[key] = nivel

    salida = {
        "version": date.today().isoformat(),
        "fuente": "DDInter 2.0 (ddinter.scbdd.com), CC BY-NC-SA 4.0",
        "pares": [[a, b, n] for (a, b), n in sorted(pares.items())],
    }
    OUT.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Filas leídas: {leidos:,}  →  pares conservados: {len(pares):,}  →  {OUT}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
