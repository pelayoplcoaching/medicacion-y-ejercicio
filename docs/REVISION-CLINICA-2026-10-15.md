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


## Ampliación v1.0 (16/10/2026): 38 principios con reglas propias

Bloque `data/ext/10_v1_principios.json`, generado con la fábrica de contenido (`scripts/propuesta_ia.py --candidatos` para elegir los principios más frecuentes del nomenclátor que heredaban las reglas de su grupo solo por el código ATC) y validado con `scripts/validar_bloque.py` (0 errores). Cada principio queda dentro de su grupo con su ficha técnica de CIMA y, cuando el fármaco tiene particularidades, una regla propia con fuente (sección de la ficha técnica, guía o criterios Beers) y nivel de evidencia:

fluvastatina, lovastatina · ziprasidona, lurasidona, amisulprida, brexpiprazol, zuclopentixol · eslicarbazepina, cenobamato · nintedanib, bosutinib, erlotinib · apremilast, guselkumab · guanfacina · terazosina, alfuzosina · meloxicam, aceclofenaco, indometacina · hidromorfona · modafinilo · carteolol · triflusal · roxadustat, metoxi-polietilenglicol-epoetina beta · captopril, imidapril · indacaterol · nicardipino · norfloxacino · apomorfina · nevirapina · valganciclovir · glicerol · lidocaína (parche) · ampicilina · ferrimanitol ovoalbúmina.

Las reglas las redactó Claude a petición del autor y están marcadas `revisado: true` con su fuente; como el resto de la base, son borrador hasta el muestreo clínico del autor (hoja `scripts/export_revision.py`). Total tras la fusión: 112 grupos · 392 principios · 60 reglas combinadas.

## Lectura fácil (16/10/2026)

50 reglas y resúmenes con peor índice INFLESZ se reescribieron en las fuentes (`scripts/lectura_facil.py`) sin cambiar su contenido clínico; `node scripts/legibilidad.mjs` mide los 685 textos que lee el paciente (media 57,8, «normal») y `test.mjs` impide retroceder.
