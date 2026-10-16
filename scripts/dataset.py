#!/usr/bin/env python3
"""Dataset publicable (v1.0): empaqueta la base de conocimiento para depositarla en Zenodo (DOI) o adjuntarla a una release.

Genera dist/dataset/pauta-activa-dataset-<versión>/ con:
  kb.json, ddi_curated.json, casos.json      ← los ficheros tal cual usa la aplicación
  reglas.csv                                  ← una fila por regla (grupo, principio, ámbito, nivel, texto, condición, fuente, evidencia)
  principios.csv                              ← principios activos con grupo, ATC, umbral de dosis alta y ficha técnica
  interacciones.csv                           ← las interacciones revisadas con fuente
  README.md, LICENSE                          ← descripción, método, cita y licencia (CC BY-NC-SA 4.0)
y el zip correspondiente. No llama a ninguna API: la publicación la hace el autor (Zenodo → New upload, o la integración GitHub-Zenodo al crear una release).
Uso: python3 scripts/dataset.py
"""
import csv
import json
import re
import shutil
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = json.loads((ROOT / "app/data/kb.json").read_text(encoding="utf-8"))
DDI = json.loads((ROOT / "app/data/ddi_curated.json").read_text(encoding="utf-8"))
CASOS = json.loads((ROOT / "app/data/casos.json").read_text(encoding="utf-8"))
APP_VERSION = re.search(r'APP_VERSION = "([^"]+)"', (ROOT / "app/js/version.js").read_text(encoding="utf-8")).group(1)
nombre = f"pauta-activa-dataset-{KB['version']}"
OUT = ROOT / "dist/dataset" / nombre
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)
for f in ("kb.json", "ddi_curated.json", "casos.json"):
    shutil.copy(ROOT / "app/data" / f, OUT / f)
shutil.copy(ROOT / "LICENSE", OUT / "LICENSE")


def csv_out(path, cab, filas):
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:
        w = csv.writer(fh, delimiter=";")
        w.writerow(cab)
        w.writerows(filas)


filas, n_reglas = [], 0
for c in KB["clases"]:
    for amb in ("general", "aerobico", "fuerza", "equilibrio"):
        for r in c.get(amb, []):
            filas.append([c["id"], c["nombre"], "", amb, r["nivel"], r["texto"], json.dumps(r.get("si"), ensure_ascii=False) if r.get("si") else "", r.get("fuente", ""), r.get("evidencia", ""), "sí" if r.get("revisado") else ""])
        for pr in c["principios"]:
            for r in pr.get(amb, []):
                filas.append([c["id"], c["nombre"], pr["id"], amb, r["nivel"], r["texto"], json.dumps(r.get("si"), ensure_ascii=False) if r.get("si") else "", r.get("fuente", ""), r.get("evidencia", ""), "sí" if r.get("revisado") else ""])
for r in KB.get("reglas_combinadas", []):
    filas.append(["(combinada)", r["titulo"], r["id"], ",".join(r.get("ambitos", [])), r["nivel"], r["texto"], json.dumps(r.get("si"), ensure_ascii=False), r.get("fuente", ""), r.get("evidencia", ""), "sí" if r.get("revisado") else ""])
csv_out(OUT / "reglas.csv", ["grupo_id", "grupo", "principio_id", "ambito", "nivel", "texto", "condicion", "fuente", "evidencia", "revisada"], filas)
csv_out(OUT / "principios.csv", ["principio_id", "nombre", "grupo_id", "grupo", "atc_grupo", "umbral_dosis_alta", "unidad", "ficha_tecnica"],
        [[pr["id"], pr["nombre"], c["id"], c["nombre"], "|".join(c.get("atc", [])), (pr.get("umbral_mg") or {}).get("alta", ""), pr.get("unidad", "mg"), pr.get("ficha", "")] for c in KB["clases"] for pr in c["principios"]])
csv_out(OUT / "interacciones.csv", ["a", "b", "nivel", "efecto", "accion", "fuente", "revisada"], [[x["a"], x["b"], x["nivel"], x["efecto"], x.get("accion", ""), x.get("fuente", ""), "sí" if x.get("revisado") else ""] for x in DDI["interacciones"]])

n_pr = sum(len(c["principios"]) for c in KB["clases"])
readme = f"""# Pauta Activa · base de conocimiento medicación–ejercicio (v{KB['version']})

Base de conocimiento en español sobre los efectos de la medicación habitual en el ejercicio físico (aeróbico, fuerza y equilibrio),
las precauciones por situación clínica y las interacciones fármaco–fármaco relevantes para entrenar. Es la base que usa la aplicación
web **Pauta Activa · Medicación y Ejercicio** (https://medicacionyejercicio.fuerzabasadaenevidencia.com), versión de la aplicación {APP_VERSION}.

## Contenido
- `kb.json`: {len(KB['clases'])} grupos terapéuticos, {n_pr} principios activos, {len(filas) - len(KB.get('reglas_combinadas', []))} reglas por ámbito y {len(KB.get('reglas_combinadas', []))} reglas combinadas (situación clínica × medicación), {len(KB.get('senales', {}))} señales del motor y {len(KB.get('combinaciones', []))} combinaciones a dosis fijas.
- `ddi_curated.json`: {len(DDI['interacciones'])} interacciones revisadas con mecanismo, recomendación y fuente por fila.
- `casos.json`: {len(CASOS['casos'])} casos clínicos de validación (viñetas anonimizadas con el resultado esperado).
- `reglas.csv`, `principios.csv`, `interacciones.csv`: las mismas tablas en formato plano (separador «;», UTF-8 con BOM, abre en Excel).

## Método
Cada regla lleva `fuente` (sección de la ficha técnica de la AEMPS, guía con año o criterios Beers/STOPP-START), `evidencia`
(`ft` ficha técnica · `guia` guía o consenso · `criterios` Beers/STOPP-START · `base` base de interacciones · `revision` criterio clínico)
y `revisado`. Marco: ACSM Guidelines for Exercise Testing and Prescription (11.ª ed.), guías ESC/ADA/KDIGO/GOLD, criterios Beers 2023,
fichas técnicas del CIMA (AEMPS). Los niveles son `info`, `precaucion` y `alerta`; las interacciones, `mayor`, `moderada` y `menor`.
El motor que aplica las reglas (dosis, edad, situación, combinaciones) es código abierto (MIT) en el repositorio.

## Limitaciones
Herramienta informativa, no producto sanitario: no sustituye la valoración individual ni modifica tratamientos. Revisión clínica
realizada por el autor con asistencia de un modelo de lenguaje; el muestreo de revisión y las correcciones constan en `docs/`.

## Cómo citar
Fernández Cidón, P. ({date.today().year}). *Pauta Activa: base de conocimiento medicación–ejercicio* (versión {KB['version']}) [Conjunto de datos]. Zenodo. DOI: (pendiente de asignar en la primera publicación)

## Licencia
Contenido: CC BY-NC-SA 4.0 · Código del motor: MIT. Autor: Pelayo Fernández Cidón (Medicina Interna; Fuerza Basada en Evidencia). Generado el {date.today().isoformat()}.
"""
(OUT / "README.md").write_text(readme, encoding="utf-8")
zip_path = shutil.make_archive(str(OUT), "zip", OUT.parent, OUT.name)
print(f"{OUT.relative_to(ROOT)}: {len(filas)} reglas, {n_pr} principios, {len(DDI['interacciones'])} interacciones → {Path(zip_path).relative_to(ROOT)}")
