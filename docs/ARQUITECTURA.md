# Arquitectura técnica · Pauta Activa (v0.16, beta 0)

Documento de referencia para quien mantenga o revise el código. Complementa el `README.md` (uso y flujo de datos clínicos) y `CHANGELOG.md`.

## 1. Principios de diseño

- **Todo en el navegador.** No hay servidor ni backend: la aplicación es un sitio estático (GitHub Pages) y ningún dato del paciente sale del dispositivo. Las únicas peticiones de red son los propios ficheros de la app, las bibliotecas externas cargadas bajo demanda (jsPDF, qrcode-generator, Tesseract, pdf.js, desde cdnjs) y el formulario de sugerencias (Tally) que el usuario abre voluntariamente.
- **Sin dependencias de compilación.** JavaScript ES2022 nativo (módulos), CSS y HTML planos. Lo que hay en `app/` es exactamente lo que se sirve. No hay bundler ni framework; el "build" (`scripts/bump_version.py`) solo re-estampa los parámetros `?v=` de caché.
- **Datos como ficheros JSON versionados.** La base de conocimiento es un JSON generado a partir de bloques fuente (`data/ext/*.json`) por `scripts/merge_kb.py`, y revisable en hoja de cálculo (`export_revision.py` / `import_revision.py`).
- **Instalable y sin conexión.** PWA con `manifest.webmanifest` y `sw.js` (precache de la app y de los datos, estrategia "network first, cache fallback" para la base).

## 2. Estructura

```
app/
  index.html            página única (todas las vistas) + marcado inicial estático (SEO, sin JS)
  acerca.html           estado de la base, casos de validación ejecutados en el navegador
  legal.html            aviso legal, privacidad, accesibilidad, metodología, regulatorio
  novedades.html        registro de cambios para usuarios
  manifest.webmanifest, sw.js, robots.txt, sitemap.xml
  css/style.css         sistema de diseño (tokens en :root, claro/oscuro/alto contraste, modo paciente/profesional)
  js/
    version.js          APP_VERSION (semver)
    engine.js           motor puro (sin DOM): índice, búsqueda, evaluación, reglas, ventana horaria, plan, SPPB, zona…
    parser.js           lectura de listas pegadas / PDF (texto) → medicamentos
    ocr.js              foto u hoja escaneada → texto (Tesseract, bajo demanda)
    informes.js         PDF (jsPDF): informe clínico, plan del paciente, ficha del entrenador, tarjeta A5; texto para la historia
    i18n.js             diccionarios ES/EN/CA/GL y aplicación al DOM
    libs.js             carga perezosa de bibliotecas externas
    app.js              estado, interfaz, eventos, persistencia (localStorage), PWA
  data/
    kb.json             base de conocimiento (clases, principios, señales, reglas, reglas combinadas, combinaciones)
    ddi_curated.json    interacciones revisadas en español (209)
    ddi.json            interacciones DDInter 2.0 (pares por principio)
    marcas.json         nomenclátor AEMPS (presentaciones comercializadas, dosis, ATC, cn opcional)
    fichas.json         principio → URL de ficha técnica (CIMA)
    casos.json          casos clínicos de validación (viñetas con resultado esperado)
data/ext/               bloques fuente de la base (01…09, ddi_01…03); merge_kb.py los funde en kb.json
scripts/                merge_kb, build_cima (nomenclátor), build_ddi, export/import_revision, bump_version, build_artifact, test.mjs, ui_test.mjs
docs/                   auditorías y documentación técnica
```

## 3. Flujo de datos en la aplicación

1. `app.js` carga `kb.json`, `ddi_curated.json`, `marcas.json`, `fichas.json` (en dos fases: lo necesario para el primer render y el resto en `requestIdleCallback`) y construye el índice (`construirIndice`): principio/clase por id, entradas de búsqueda normalizadas (principios, marcas, combinaciones, presentaciones del nomenclátor), dosis habituales por principio y mapa código nacional → presentación.
2. El estado del usuario (`estado`: edad, caídas, situaciones, medicación con dosis y tomas, horas de las tomas, plan, cribado, prescriptor, FC en reposo, SPPB…) vive en memoria y se persiste en `localStorage` (`medex.estado`); listas guardadas en `medex.perfiles`; diario de sesiones en `medex.diario`.
3. Cada cambio llama a `render()`: `evaluar(datos, meds, ctx)` devuelve `res` con los ítems resueltos (principio, clase, dosis diaria, categoría de dosis, señales), las reglas por ámbito (general/aeróbico/fuerza/equilibrio), las reglas combinadas disparadas (situación × señal/clase), las interacciones (curadas + DDInter) y el perfil de señales acumuladas. Sobre `res` se derivan: veredicto, Lo esencial (`loEsencial`), chips de contexto, ventana horaria (`ventanaEntrenamiento`), zona de intensidad (`zonaIntensidad`), carga por fármaco (`impactoPorFarmaco`), plan semanal (`planSemana`, `sesionTipo`), chequeo previo a la sesión (`chequeoPrevio`) y cribado ACSM (`cribadoACSM`).
4. Los PDF se generan en el cliente con jsPDF a partir del mismo `res` + `ctx` (`informes.js`); el texto para la historia clínica (`textoHistoria`) usa las mismas funciones.
5. El enlace compartible (`#lista=…`) codifica el estado (sin nombre ni datos identificativos) en base64url; al abrirlo se restaura.

## 4. Modelo de la base de conocimiento (`kb.json`)

- `clases[]`: `{ id, nombre, resumen, atc[], principios[], reglas[] }`. Una regla: `{ ambito, nivel (info|precaucion|alerta), texto, condicion?, fuente?, revisado?, evidencia? }`.
- `principios[]` dentro de cada clase: `{ id, nombre, marcas[], unidad?, umbral_mg?, senales[], ficha?, nota?, reglas? }`.
- `senales`: diccionario id → etiqueta (hipotensión, hipoglucemia, sangrado, sedación, caídas, QT, calor…). Las señales son el vocabulario común entre fármacos, reglas combinadas, chequeo previo, constantes a registrar y ficha del entrenador.
- `reglas_combinadas[]`: `{ id, si: { senal?/senales?, clases?, condicion?, min? }, nivel, titulo, texto, ambitos[], fuente }`. Se disparan por combinación de medicación y situación clínica.
- `combinaciones[]`: presentaciones a dosis fija con varios componentes.
- `condiciones`: las situaciones clínicas que el usuario marca (18) más las derivadas en modo profesional (FG, FEVI, NYHA, DAI, SPPB/Vivifrail → fragilidad).

Principios "sintéticos" (`atc:<nombre>`): presentaciones del nomenclátor cuyo principio no está en la base, clasificadas por código ATC en una clase; heredan las reglas del grupo con una nota visible.

## 5. Pruebas y calidad

- `node scripts/test.mjs` — motor, lector, integridad de datos, idiomas (paridad de claves y uso en `app.js`), casos de validación, zona de intensidad, SPPB. Se ejecuta antes de cada commit.
- `node scripts/ui_test.mjs` — flujo completo en Chromium (Playwright) contra un servidor local: medicación, pegar/leer, informe, Mi plan, conciliación, cribado, SPPB, zona, modo profesional, persistencia, idiomas, accesibilidad básica, sin errores de consola.
- axe-core (WCAG 2.1 AA) en claro/oscuro × paciente/profesional y `legal.html`; Lighthouse (`docs/lighthouse-*.md`).
- `acerca.html` ejecuta los casos de validación en el navegador del usuario, de modo que cualquiera puede comprobar que la base publicada supera sus propias viñetas.

## 6. Persistencia y privacidad

Claves de `localStorage`: `medex.estado`, `medex.perfiles`, `medex.diario`, `medex.prescriptor`, `medex.recientes`, `medex.variantes`, `medex.tema`, `medex.letra`, `medex.guia`, `medex.visto`, `medex.util`, `medex.sinresultado`, `medex.ultimoerror`. Nada se envía a ningún servidor; el formulario de sugerencias recibe solo la lista de principios/dosis y la versión (sin edad ni situaciones), y lo abre el usuario. La exportación de casos lleva una huella SHA-256 para detectar alteraciones; no incluye identificadores.

## 7. Versionado y despliegue

`app/js/version.js` (semver con sufijo de fase) + `CHANGELOG.md` + etiqueta git `vX.Y.Z-fase`. La base lleva su propia versión (fecha de regeneración, `kb.version`). `scripts/bump_version.py` actualiza los `?v=` y los `modulepreload`; `sw.js` cambia su nombre de caché con cada versión. Despliegue: push a `main` → GitHub Pages sirve `app/`.
