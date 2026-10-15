# Cierre de la revisión clínica · 15/10/2026 (beta 2)

## Qué se ha hecho
- Lectura completa de las **617 reglas** por fármaco/grupo y de las **60 reglas combinadas** de la base (`app/data/kb.json`, versión 2026.10.15), contrastándolas con las fuentes que la aplicación declara (fichas técnicas AEMPS, ACSM GETP 11.ª ed. ap. A, ADA Standards of Care 2024 y consenso Riddell 2017 para diabetes tipo 1, ESC 2020 cardiología del deporte, ESC 2021 IC, GINA/GOLD 2024, Beers 2023 y STOPP/START v3, OMS 2020, ACSM 2019 ejercicio y cáncer, Vivifrail, KDIGO 2024, Endocrine Society 2016).
- Cada regla lleva ahora **fuente**, **nivel de evidencia** (`ft` ficha técnica 332 · `guia` 136 · `criterios` 11 · `revision` 138) y estado **revisada**. Las reglas combinadas que no tenían fuente (49) la tienen.
- Correcciones de contenido:
  - Insulina: umbrales de glucosa previos al ejercicio unificados con el consenso (< 90 mg/dL: 10–20 g y esperar; 90–125: 10 g si aeróbico; 126–250: empezar; > 250: cetonas); se eliminan dos reglas redundantes y la orientación de ajuste de dosis del consenso pasa a nivel «precaución».
  - Benzodiacepinas en mayores: «duplican el riesgo» → «aumentan claramente (en torno a un 50 % más)», acorde con los metaanálisis.
  - Paracetamol: dosis máxima matizada (3 g/día continuados sin consultar; 4 g en adultos sanos).
- Textos de ayuda contextual revisados; glosario ampliado (Karvonen, FC de reserva, Tanaka, Vivifrail, ACOD, Beers, STOPP/START, lpm) y corregida la definición de SPPB (≤ 6 frágil · 7–9 prefrágil · ≥ 10 robusto).

## Cómo se ha hecho y qué queda
- La asignación se ejecuta con `scripts/revision_beta2.py` (idempotente; aplica sobre `data/ext/*.json` y `app/data/kb.json` y regenera la base). La hoja `data/revision/revision_20261015.xlsx` recoge el resultado para auditoría: columna «Fuente» y «EVIDENCIA» rellenas.
- **Esta revisión la ha realizado el asistente (Claude) a petición de Pelayo Fernández Cidón, autor clínico de la base.** El estado «revisada» refleja esa lectura y el contraste con las fuentes citadas; la responsabilidad clínica es del autor. Recomendación: muestreo del 10 % de reglas por grupo (≈ 60) y de todas las de nivel «atención» (≈ 50) por el autor antes de la 1.0; cualquier discrepancia se corrige con la hoja de revisión (`import_revision.py`).
- Pendiente de fuentes externas: regenerar el nomenclátor AEMPS (`scripts/build_cima.py`) y revisar las 209 interacciones curadas con el mismo método (fuente por fila), previsto para beta 3.
