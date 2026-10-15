# Pauta Activa · Medicación y Ejercicio

Aplicación web para introducir la medicación habitual (con dosis) y obtener:

1. Qué tener en cuenta al hacer ejercicio **aeróbico, de fuerza y de equilibrio**, fármaco por fármaco y según la dosis.
2. Avisos por **combinación** de fármacos (hipotensores acumulados, sedantes, "triple whammy", etc.).
3. **Interacciones fármaco–fármaco**: capa curada en español (prioritaria) + DDInter 2.0.

Todo se calcula en el navegador. No hay servidor ni se envía ningún dato: la lista de medicación solo se guarda en el `localStorage` del propio dispositivo.

## Estructura

```
app/                 ← la aplicación (estática, sin build)
  index.html
  css/style.css
  js/engine.js       ← motor de reglas (sin dependencias; se puede probar con Node)
  js/app.js          ← interfaz
  data/kb.json       ← BASE DE CONOCIMIENTO fármaco–ejercicio (editable a mano)
  data/ddi_curated.json  ← interacciones revisadas en español (editable a mano)
  data/ddi.json      ← generado por scripts/build_ddi.py (DDInter 2.0)
  data/marcas.json   ← generado por scripts/build_cima.py (nomenclátor AEMPS)
  data/fichas.json   ← id de principio → URL de la ficha técnica (también de build_cima.py)
scripts/
  build_ddi.py       ← CSV de DDInter → ddi.json (solo pares entre fármacos de kb.json)
  build_cima.py      ← nomenclátor CIMA → marcas.json (nombres comerciales + dosis por comprimido)
  build_artifact.py  ← empaqueta app/ en dist/artifact.html para publicarlo en claude.ai
  nombres_es_en.json ← mapa id ↔ nombre inglés para cruzar con DDInter
```

## Dominio y despliegue

Sitio publicado con GitHub Pages (workflow en `.github/workflows/pages.yml`, carpeta `app/`). Dominio personalizado: `medicacionyejercicio.fuerzabasadaenevidencia.com` (registro CNAME en IONOS → `pelayoplcoaching.github.io`; configurado en Settings → Pages → Custom domain). Metaetiquetas SEO / Open Graph / Twitter y `manifest.webmanifest` (instalable como app) en `app/index.html`; imagen para redes en `app/assets/og.png`.

## Sin conexión

`app/sw.js` guarda la aplicación, la base de conocimiento y las librerías de CDN al primer uso. El nombre de la caché lleva el sello de versión (`bump_version.py`), así que cada despliegue descarga la versión nueva en segundo plano y muestra «Hay una versión nueva · Actualizar». Las librerías externas (pdf.js, jsPDF, Tesseract) se cargan bajo demanda desde `js/libs.js`.

## Versión, pruebas y validación

- Versión de la aplicación en `app/js/version.js` (semver, `0.18.0-beta.2`) y registro de cambios en `CHANGELOG.md`; la base de conocimiento lleva su propia fecha de versión (`app/data/kb.json`). Cada versión publicada se etiqueta en git (`v0.16.0-beta.0`).
- `app/data/casos.json`: casos clínicos de validación (viñetas anonimizadas con el resultado esperado). Se ejecutan en `scripts/test.mjs` y en `acerca.html`; en modo profesional, «Guardar como caso de prueba» genera uno nuevo a partir de la lista actual.
- Revisión clínica: `docs/REVISION-CLINICA-2026-10-15.md` (método, fuentes, correcciones y lo que queda); `scripts/revision_beta2.py` la aplica de forma idempotente.
- Documentación técnica: `docs/ARQUITECTURA.md` (estructura, flujo de datos, modelo de la base, persistencia) y `docs/BETA-CHECKLIST.md` (lo que falta para la beta).
- Auditorías: `docs/lighthouse-2026-10-15.md` (rendimiento, accesibilidad, buenas prácticas, SEO) y axe-core (0 incidencias WCAG 2.1 AA en claro/oscuro × paciente/profesional).

```bash
node scripts/test.mjs   # motor, lector, datos, idiomas, cribado ACSM y casos de validación; ejecútelo antes de cada commit
```

## Ejecutar en local

```bash
cd app && python3 -m http.server 8080
# abrir http://localhost:8080
```
(Hace falta un servidor porque los datos se cargan con `fetch`; abrir el `index.html` directamente no funciona.)

## Regenerar los datos

**DDInter** (una vez, y cuando quiera actualizar):
1. Descargue los CSV de https://ddinter.scbdd.com/download/ (`ddinter_downloads_code_*.csv`) a `data/raw/ddinter/`.
2. `python3 scripts/build_ddi.py data/raw/ddinter/*.csv`

Licencia de DDInter: CC BY-NC-SA 4.0 (uso no comercial, citar la fuente).

**Nomenclátor AEMPS** (nombres comerciales y dosis por comprimido). Hay que ejecutarlo en un ordenador con acceso a internet (no hace falta clave):
```bash
git clone https://github.com/pelayoplcoaching/medicacion-y-ejercicio.git   # o git pull si ya lo tiene
cd medicacion-y-ejercicio
python3 scripts/build_cima.py            # descarga prescripcion.zip de la AEMPS y escribe app/data/marcas.json
node scripts/test.mjs                    # comprueba que todo sigue en orden
git add app/data/marcas.json && git commit -m "Nomenclátor AEMPS" && git push
```
Si la descarga falla, baje https://listadomedicamentos.aemps.gob.es/prescripcion.zip con el navegador y ejecute `python3 scripts/build_cima.py ~/Descargas/prescripcion.zip`.
El script detecta solas las etiquetas del XML; con `--inspeccionar` muestra la estructura sin escribir nada, y al terminar lista los principios activos frecuentes que aún no están en `kb.json`. Las presentaciones cuyo principio activo no está en la base se clasifican por su **código ATC** (campo `atc` de cada clase, prefijo más largo que coincida) y aparecen en la app como principios «sintéticos» (`atc:<nombre>`) que heredan las reglas del grupo, con una nota visible de que no hay reglas específicas revisadas. Conviene repetirlo cada pocos meses (el nomenclátor cambia a diario).

## Pruebas

```bash
node scripts/test.mjs            # motor, parser, base de conocimiento, idiomas, casos de validación, zona de intensidad, SPPB (126 comprobaciones)
npm i -D playwright && npx playwright install chromium
node scripts/ui_test.mjs         # flujo completo en Chromium contra un servidor local (122 comprobaciones)
```
Ambas se ejecutan en GitHub Actions en cada cambio (`.github/workflows/tests.yml`).

## Ampliar la base de conocimiento

Los bloques de ampliación viven en `data/ext/0*.json` (clases y reglas) y `data/ext/ddi_*.json` (interacciones). Para incorporarlos:

```bash
python3 scripts/merge_kb.py            # fusiona data/ext/0*.json en app/data/kb.json y valida (ids, señales, niveles)
python3 scripts/build_artifact.py      # empaqueta y sella la versión
```
Una clase con el mismo `id` en un bloque sustituye a la existente: es la forma de corregir una clase sin tocar `kb.json` a mano. Las interacciones nuevas se añaden con el fichero `ddi_*.json` correspondiente (ver `scripts/`).

Cobertura actual: 112 clases, 354 principios activos, 60 reglas combinadas (situación clínica × medicación) y ~50 combinaciones a dosis fijas (`kb.combinaciones`: una marca → varios componentes con su dosis) (incluye cardiovascular completo, diabetes, psiquiatría, neurología, dolor, infecciosos, inmunosupresores, oncología oral, urología, oftalmología, suplementos). Fuente de la lista de fármacos comercializados en España: nomenclátor AEMPS (`build_cima.py`). Marco para los efectos sobre el ejercicio: ACSM *Guidelines for Exercise Testing and Prescription* (Apéndice A, efectos de los fármacos sobre FC, TA, ECG y capacidad de esfuerzo), fichas técnicas AEMPS, criterios Beers/STOPP-START y guías de cada especialidad; todo el contenido es un borrador pendiente de revisión clínica.

## ¿Cuándo entrenar?

Cada clase (o principio) puede llevar `horario: {evitar: [{desde, hasta, nivel, motivo}], preferir: [...]}` en horas respecto a la toma (bloque `data/ext/06_horarios.json`). El motor (`ventanaEntrenamiento`) combina las tomas de cada fármaco (`momentos`: desayuno/comida/cena/noche, con horas editables) y pinta el día de 6:00 a 23:00 en verde/ámbar/rojo; rojo = evitar (p. ej. 0–3 h tras una benzodiacepina, pico de insulina rápida), ámbar = precaución, verde = preferible (periodo ON de levodopa). El lector de PDF anota cada "1" de la hoja de la CAM con su columna (`1@desayuno`) por posición horizontal.

## Cómo está organizada la base de conocimiento (`kb.json`)

Cada **clase** tiene:
- `principios`: lista de principios activos con `marcas` (sinónimos para la búsqueda), `unidad` (por defecto mg) y `umbral_mg.alta` (dosis diaria, en mg o equivalente, a partir de la cual se considera "dosis alta").
- `combinable: true` indica que los fármacos de la clase suelen pautarse juntos (p. ej. tacrolimus + micofenolato) y no se marcan como duplicidad.
- `senales`: etiquetas de efecto que se acumulan entre fármacos (p. ej. `hipotension`, `sedacion`, `sangrado`). Las usan las `reglas_combinadas`.
- `general`, `aerobico`, `fuerza`, `equilibrio`: listas de recomendaciones `{nivel, texto, si}`. `nivel` ∈ info | precaucion | alerta. `si` condiciona la regla: `{"dosis":"alta"}`, `{"edad_min":65}`, `{"principio":"venlafaxina"}`, `{"caidas":true}`.
- `fuentes`: referencias que se muestran al pie.

Un principio puede añadir `senales_extra` (p. ej. citalopram → `qt`).

`reglas_combinadas` se disparan por recuento de señales, por condición clínica del usuario (`{"condicion":"renal"}` o `{"sin_condicion":"diabetes"}`; valores: diabetes, insuficiencia_cardiaca, renal, renal_grave, marcapasos, osteoporosis, epoc_asma, oxigeno, embarazo, nyha34, fevi_baja, fragil, prefragil) (`{"senal":"hipotension","min":2}`), por presencia simultánea (`{"todas":["ieca_ara","diuretico","aine"]}`) y opcionalmente por edad.

## Funciones

- Búsqueda por marca o principio activo, lista pegada en texto o **PDF de medicación** (pdf.js) o **foto de la hoja de medicación** (OCR con Tesseract.js en español, también para PDF escaneados). Todo se procesa en el navegador; nada se envía a ningún servidor. El modelo de OCR (~2 MB) se descarga la primera vez.
- Informe en pantalla por ámbito (antes de empezar, aeróbico, fuerza, equilibrio, interacciones).
- **Dos PDF descargables** (jsPDF): resumen clínico para el médico y resumen en lenguaje sencillo para el paciente.

## Modo paciente / profesional

El selector "Soy paciente / Soy profesional sanitario" cambia qué datos se piden (preguntas sencillas de movilidad frente a FG, FEVI, NYHA, SPPB/Vivifrail y FC de detección del DAI) y el orden y nombre de los PDF. Lo que quede en blanco no se usa. De los datos numéricos se derivan condiciones (`renal` si FG < 45, `renal_grave` si < 30, `nyha34`, `fevi_baja`, `fragil`/`prefragil` por SPPB, Vivifrail o las preguntas del paciente) que disparan reglas y adaptan la prescripción FITT del informe clínico.

## Pendiente de revisión clínica (v0)

- Todos los textos de `kb.json` y `ddi_curated.json` son un borrador generado para revisión; en particular los **umbrales de dosis** (`umbral_mg.alta`) se fijaron de forma orientativa en la mitad superior del rango habitual.
- Faltan clases: antibióticos distintos de quinolonas, antirretrovirales, quimioterapia oral, inmunosupresores (tacrolimus, ciclosporina), anticonceptivos/THS, antimigrañosos (triptanes), antiarrítmicos clase I, nuevos anticoagulantes en situaciones especiales, suplementos deportivos.
- DDInter solo aporta nivel (mayor/moderada/menor); mecanismo y recomendación hay que añadirlos a mano en `ddi_curated.json` para los pares que se quieran explicar.
- Variables de contexto que todavía no se piden: función renal, insuficiencia cardíaca, neuropatía, fragilidad (Vivifrail).

## Revisión clínica de la base

La base es un borrador hasta que un clínico la revise. Flujo:

```bash
python3 scripts/export_revision.py                       # → data/revision/revision_<fecha>.xlsx
# el revisor rellena las columnas amarillas (ESTADO: OK / CAMBIAR / ELIMINAR, TEXTO NUEVO, COMENTARIO)
python3 scripts/import_revision.py data/revision/revision_<fecha>.xlsx --simular   # muestra qué cambiaría
python3 scripts/import_revision.py data/revision/revision_<fecha>.xlsx             # aplica en data/ext y kb.json, regenera la base
```

Los cambios se aplican en las **fuentes** (`data/ext/*.json`, `app/data/kb.json`, `app/data/ddi_curated.json`), no solo en la salida, y los comentarios se recogen en `data/revision/comentarios_<fecha>.md`. El archivo puede editarse en Excel o subirse a Google Drive (se convierte en Google Sheets); para importarlo, descargarlo de nuevo como Excel.
