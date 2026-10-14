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

## Cómo está organizada la base de conocimiento (`kb.json`)

Cada **clase** tiene:
- `principios`: lista de principios activos con `marcas` (sinónimos para la búsqueda), `unidad` (por defecto mg) y `umbral_mg.alta` (dosis diaria, en mg o equivalente, a partir de la cual se considera "dosis alta").
- `senales`: etiquetas de efecto que se acumulan entre fármacos (p. ej. `hipotension`, `sedacion`, `sangrado`). Las usan las `reglas_combinadas`.
- `general`, `aerobico`, `fuerza`, `equilibrio`: listas de recomendaciones `{nivel, texto, si}`. `nivel` ∈ info | precaucion | alerta. `si` condiciona la regla: `{"dosis":"alta"}`, `{"edad_min":65}`, `{"principio":"venlafaxina"}`, `{"caidas":true}`.
- `fuentes`: referencias que se muestran al pie.

Un principio puede añadir `senales_extra` (p. ej. citalopram → `qt`).

`reglas_combinadas` se disparan por recuento de señales (`{"senal":"hipotension","min":2}`), por presencia simultánea (`{"todas":["ieca_ara","diuretico","aine"]}`) y opcionalmente por edad.

## Funciones

- Búsqueda por marca o principio activo, lista pegada en texto o **PDF de medicación** (pdf.js) o **foto de la hoja de medicación** (OCR con Tesseract.js en español, también para PDF escaneados). Todo se procesa en el navegador; nada se envía a ningún servidor. El modelo de OCR (~2 MB) se descarga la primera vez.
- Informe en pantalla por ámbito (antes de empezar, aeróbico, fuerza, equilibrio, interacciones).
- **Dos PDF descargables** (jsPDF): resumen clínico para el médico y resumen en lenguaje sencillo para el paciente.

## Pendiente de revisión clínica (v0)

- Todos los textos de `kb.json` y `ddi_curated.json` son un borrador generado para revisión; en particular los **umbrales de dosis** (`umbral_mg.alta`) se fijaron de forma orientativa en la mitad superior del rango habitual.
- Faltan clases: antibióticos distintos de quinolonas, antirretrovirales, quimioterapia oral, inmunosupresores (tacrolimus, ciclosporina), anticonceptivos/THS, antimigrañosos (triptanes), antiarrítmicos clase I, nuevos anticoagulantes en situaciones especiales, suplementos deportivos.
- DDInter solo aporta nivel (mayor/moderada/menor); mecanismo y recomendación hay que añadirlos a mano en `ddi_curated.json` para los pares que se quieran explicar.
- Variables de contexto que todavía no se piden: función renal, insuficiencia cardíaca, neuropatía, fragilidad (Vivifrail).
