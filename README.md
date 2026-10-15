# Medicación y Ejercicio

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
scripts/
  build_ddi.py       ← CSV de DDInter → ddi.json (solo pares entre fármacos de kb.json)
  build_cima.py      ← nomenclátor CIMA → marcas.json (nombres comerciales + dosis por comprimido)
  build_artifact.py  ← empaqueta app/ en dist/artifact.html para publicarlo en claude.ai
  nombres_es_en.json ← mapa id ↔ nombre inglés para cruzar con DDInter
```

## Dominio y despliegue

Sitio publicado con GitHub Pages (workflow en `.github/workflows/pages.yml`, carpeta `app/`). Dominio personalizado: `medicacionyejercicio.fuerzabasadaenevidencia.com` (registro CNAME en IONOS → `pelayoplcoaching.github.io`; configurado en Settings → Pages → Custom domain). Metaetiquetas SEO / Open Graph / Twitter y `manifest.webmanifest` (instalable como app) en `app/index.html`; imagen para redes en `app/assets/og.png`.

## Pruebas

```bash
node scripts/test.mjs   # 34 comprobaciones de lector, búsqueda, motor y datos; ejecútelo antes de cada commit
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

**Nomenclátor AEMPS** (nombres comerciales):
```bash
python3 scripts/build_cima.py
```
Descarga `prescripcion.zip` de la AEMPS y genera `marcas.json` solo con las presentaciones cuyo principio activo está en `kb.json`. Si la AEMPS cambia las etiquetas del XML, ajuste `TAGS` en el script.

## Ampliar la base de conocimiento

Los bloques de ampliación viven en `data/ext/0*.json` (clases y reglas) y `data/ext/ddi_*.json` (interacciones). Para incorporarlos:

```bash
python3 scripts/merge_kb.py            # fusiona data/ext/0*.json en app/data/kb.json y valida (ids, señales, niveles)
python3 scripts/build_artifact.py      # empaqueta y sella la versión
```
Una clase con el mismo `id` en un bloque sustituye a la existente: es la forma de corregir una clase sin tocar `kb.json` a mano. Las interacciones nuevas se añaden con el fichero `ddi_*.json` correspondiente (ver `scripts/`).

Cobertura actual: ~100 clases, ~320 principios activos y ~50 combinaciones a dosis fijas (`kb.combinaciones`: una marca → varios componentes con su dosis) (incluye cardiovascular completo, diabetes, psiquiatría, neurología, dolor, infecciosos, inmunosupresores, oncología oral, urología, oftalmología, suplementos). Fuente de la lista de fármacos comercializados en España: nomenclátor AEMPS (`build_cima.py`). Marco para los efectos sobre el ejercicio: ACSM *Guidelines for Exercise Testing and Prescription* (Apéndice A, efectos de los fármacos sobre FC, TA, ECG y capacidad de esfuerzo), fichas técnicas AEMPS, criterios Beers/STOPP-START y guías de cada especialidad; todo el contenido es un borrador pendiente de revisión clínica.

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
