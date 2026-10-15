#!/usr/bin/env python3
"""Genera app/data/ddi.json a partir de los CSV de DDInter 2.0.

Uso:
    python3 scripts/build_ddi.py                      # lee todos los CSV de data/raw/ddinter/
    python3 scripts/build_ddi.py C:\\Users\\yo\\Downloads  # o una carpeta / ficheros concretos

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
import glob
import json
import sys
from collections import Counter
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
    sin_mapa = Counter()
    for path in paths:
        print(f"Leyendo {path} …")
        with open(path, newline="", encoding="utf-8-sig") as fh:
            lector = csv.DictReader(fh)
            if not lector.fieldnames or "Drug_A" not in lector.fieldnames:
                print(f"  (se omite: cabecera inesperada {lector.fieldnames})")
                continue
            for row in lector:
                leidos += 1
                nivel = NIVEL.get(row.get("Level", "").strip().lower())
                if not nivel:
                    continue
                ids_a = en_to_ids.get(norm(row["Drug_A"]), ())
                ids_b = en_to_ids.get(norm(row["Drug_B"]), ())
                if not ids_a:
                    sin_mapa[row["Drug_A"]] += 1
                if not ids_b:
                    sin_mapa[row["Drug_B"]] += 1
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
    print(f"Filas leídas: {leidos:,}  →  pares conservados: {len(pares):,}  →  {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")
    if sin_mapa:
        print("\nFármacos de DDInter más frecuentes sin equivalente en la base (candidatos a añadir o a mapear en nombres_es_en.json):")
        for n, c in sin_mapa.most_common(30):
            print(f"  {c:6,}  {n}")


def expandir(args):
    """Acepta ficheros, carpetas o patrones (PowerShell no expande *.csv)."""
    if not args:
        args = [str(ROOT / "data" / "raw" / "ddinter")]
    out = []
    for a in args:
        p = Path(a)
        if p.is_dir():
            out += sorted(str(x) for x in p.glob("*.csv"))
        elif any(ch in a for ch in "*?"):
            out += sorted(glob.glob(a))
        elif p.exists():
            out.append(str(p))
        else:
            print(f"No existe: {a}")
    out = [x for x in out if "ddinter" in Path(x).name.lower()] or out
    if not out:
        sys.exit("No se encontró ningún CSV. Descargue los ficheros ddinter_downloads_code_*.csv de https://ddinter.scbdd.com/download/ "
                 "y páselos como argumento (o guárdelos en data/raw/ddinter/).")
    return out


if __name__ == "__main__":
    main(expandir(sys.argv[1:]))
