# Arquitectura técnica · Pauta Activa (v1.1)

Documento de referencia para quien mantenga o revise el código. Complementa el `README.md` (uso y flujo de datos clínicos) y `CHANGELOG.md`.

## 1. Principios de diseño

- **Todo en el navegador.** No hay servidor ni backend: la aplicación es un sitio estático (GitHub Pages) y ningún dato del paciente sale del dispositivo. Las únicas peticiones de red son los propios ficheros de la app, las bibliotecas externas cargadas bajo demanda (jsPDF, qrcode-generator, Tesseract, pdf.js, desde cdnjs) y el formulario de sugerencias (Tally) que el usuario abre voluntariamente.
- **Sin dependencias de compilación.** JavaScript ES2022 nativo (módulos), CSS y HTML planos. Lo que hay en `app/` es exactamente lo que se sirve. No hay bundler ni framework; el "build" (`scripts/bump_version.py`) solo re-estampa los parámetros `?v=` de caché.
- **Datos como ficheros JSON versionados.** La base de conocimiento es un JSON generado a partir de bloques fuente (`data/ext/*.json`) por `scripts/merge_kb.py`, y revisable en hoja de cálculo (`export_revision.py` / `import_revision.py`).
- **Instalable y sin conexión.** PWA con `manifest.webmanifest` y `sw.js`: precarga mínima (app, datos, idiomas, maquetador de PDF e ilustraciones de `assets/img`; las capturas de la guía y la presentación se guardan al visitarlas). Lo que la página pide con `?v=` se precarga con esa dirección (no se descarga dos veces); lo demás se revalida. Datos con "caché primero y actualizar por detrás". La app pide almacenamiento persistente cuando hay datos, avisa en iPhone/iPad sin instalar y recuerda la copia cifrada cada 30 días.

## 2. Estructura

```
app/
  index.html            página única (todas las vistas) + marcado inicial estático (SEO, sin JS)
  acerca.html           estado de la base, casos de validación ejecutados en el navegador
  legal.html            aviso legal, privacidad, accesibilidad, metodología, regulatorio
  novedades.html        registro de cambios para usuarios
  manifest.webmanifest, sw.js, robots.txt, sitemap.xml
  css/style.css         sistema de diseño (tokens en :root, claro/oscuro/alto contraste, modo paciente/profesional)
                        (cada mejora numerada lleva solo su número; qué hace cada una, en docs/ESTILOS-MEJORAS.md)
  js/
    version.js          APP_VERSION (semver)
    engine.js           motor puro (sin DOM): índice, búsqueda, evaluación, reglas, ventana horaria, plan, SPPB, zona…
    parser.js           lectura de listas pegadas / PDF (texto) → medicamentos
    ocr.js              foto u hoja escaneada → texto (Tesseract, bajo demanda)
    informes.js         textos derivados que se ven en pantalla (prescripción, vistazo, ritmo, plan) y texto para la historia
    pdf.js              PDF (jsPDF): informe clínico, plan del paciente, evolución, ficha del entrenador, tarjeta A5; infografías (vistazo con QR, fichas de mecanismo, calendario, barra de intensidad) y máximo de 4 caras con detalle decreciente (v1.2.18).
    semana.js           anillos de la semana (moverse, fuerza, equilibrio), racha amable y mapa de 12 semanas (bajo demanda, v1.2)
    voz.js              entrenador por voz de la sesión guiada (síntesis del navegador, bajo demanda, v1.2)
    porque.js           «¿Por qué?»: 15 explicadores animados de mecanismos (escenas SVG con sus estilos, contenido en español con fuentes de la base; bajo demanda, v1.2)
    movimiento.js       ejercicios animados: dos posturas por pictograma que se alternan (SMIL), errores frecuentes y cuidados por ejercicio (bajo demanda, v1.2)
    aprende.js          «Aprende»: 10 lecciones de 2 minutos con 3 preguntas, fuentes con DOI y progreso local (bajo demanda, v1.2)
    pruebas.js          Pruebas de forma física (Senior Fitness Test): baremos por edad y sexo, cronómetro, contador y voz; textos en 5 idiomas dentro del módulo (bajo demanda, v1.2)
    metas.js            Metas de la vida diaria: 8 metas, 4 hitos cada una, pruebas que las miden e insignias en los ejercicios; textos en 5 idiomas (bajo demanda, v1.2)
    mes.js              Resumen del mes: cálculo comparado con el mes anterior e imagen 1080 × 1350 en canvas para compartir (familia o médico); textos en 5 idiomas (bajo demanda, v1.2)
    calor.js            «Hoy hace calor»: consejo por nivel de calor elegido por la persona (sin ubicación), agua, ropa, fármacos con calor y señales de alarma (bajo demanda, v1.2)
    constantes.js       Mis constantes: gráficas SVG de glucosa, tensión y pulso del diario con franjas, lectura al pasar y tabla; valores para comentar con el médico (bajo demanda, v1.2)
    pastillero.js       Mi pastillero: tomas por momentos del día, lo no diario aparte, línea del día con la ventana de entrenamiento y hoja de la semana para imprimir; textos en 5 idiomas (bajo demanda, v1.2)
    fhir.js             exportación FHIR R4 (Bundle de colección); sale de app.js en la v1.2.11 (bajo demanda)
    mapa.js             Mapa de interacciones: tabla de cruces o red de arcos con gravedad por color, forma y trazo, filtros, «Dónde se concentran» y ficha de cada cruce; textos en 5 idiomas (bajo demanda, v1.2)
    simula.js           «¿Qué cambia si…?»: escenarios con el motor que le pasa app.js, comparación antes/después, avisos de retirada por grupo y resumen para copiar; textos en 5 idiomas (bajo demanda, v1.2)
    consulta.js         estadísticas, CSV y resumen de la consulta (modo profesional); sale de app.js en la v1.2.13 (bajo demanda)
    beneficios.js       «Lo que el ejercicio hace por usted»: 21 tarjetas de beneficios por situación con cifra, estudio, certeza y DOI (contenido en borrador); interfaz en 5 idiomas (bajo demanda, v1.2)
    dosis.js            «¿Cuánto movimiento hace falta?»: dosis y respuesta (Arem 2015 por minutos, Paluch 2022 por pasos) con su media del diario, deslizador y gráfica SVG; interfaz en 5 idiomas (bajo demanda, v1.2)
    habitos.js          «Alcohol, tabaco y café con su medicación»: 28 reglas con su fuente (fichas técnicas, EFSA, PubMed) que cruzan tres hábitos con la lista, la edad y la situación (contenido en borrador); interfaz en 5 idiomas (bajo demanda, v1.2)
    conversa.js         «Guía de conversación» (modo profesional): consejo breve en 1, 5 y 20-30 minutos con las 5 Aes, barreras, nota para la historia y hoja imprimible para el paciente (contenido en borrador); interfaz en 5 idiomas (bajo demanda, v1.2)
                        Se carga con import() la primera vez que se pide un PDF (no viaja en la carga inicial)
    sesion.js           sesión guiada: chequeo previo, bloques con cronómetro y entrenador por voz; sale de app.js en la v1.3.0 (bajo demanda)
    ocasional.js        SPPB guiado, escáner de códigos de barras, copia cifrada y paso a otro dispositivo; salen de app.js en la v1.3.0 (bajo demanda)
    pro.js              informe de evolución y casos (exportar, importar, CSV, caso de prueba) del modo profesional; salen de app.js en la v1.3.0 (bajo demanda)
    tour.js             recorrido guiado de la primera visita; sale de app.js en la v1.3.0 (bajo demanda)
    centro.js           centro de herramientas: catálogo de 34 herramientas por grupos, buscador único (herramientas, medicamentos, lecciones, explicaciones, ejercicios, glosario), favoritas y «Para usted hoy»; textos en 5 idiomas (bajo demanda, v1.3)
    i18n.js             diccionario español (respaldo de todas las claves) y aplicación al DOM
    i18n/en|ca|gl|eu.js diccionarios de los demás idiomas; se descargan solo al elegirlos (index.html precarga el activo)
    libs.js             carga perezosa de bibliotecas externas
    app.js              estado, interfaz, eventos, persistencia (localStorage), PWA
  data/
    kb.json             base de conocimiento (clases, principios, señales, reglas, reglas combinadas, combinaciones)
    ddi_curated.json    interacciones curadas en español (318; las de suplementos y plantas, en borrador)
    ddi.json            interacciones DDInter 2.0 (pares por principio)
    marcas.json         nomenclátor AEMPS (presentaciones comercializadas, dosis, ATC, cn opcional)
    fichas.json         principio → URL de ficha técnica (CIMA)
    casos.json          casos clínicos de validación (viñetas con resultado esperado)
data/ext/               bloques fuente de la base (01…11, ddi_02…04); merge_kb.py los funde en kb.json y add_ddi.py añade las interacciones.
                        El 11 (suplementos y plantas) y el ddi_04 se generan con scripts/gen_suplementos_plantas.py y gen_ddi_suplementos_plantas.py
scripts/                merge_kb, build_cima (nomenclátor), build_ddi, export/import_revision, bump_version, build_artifact, test.mjs, ui_test.mjs, artifact_test.mjs, axe_test.mjs, visual_test.mjs, pruebas.mjs (todas a la vez)
docs/                   auditorías y documentación técnica
```

## 3. Flujo de datos en la aplicación

1. `app.js` carga `kb.json`, `ddi_curated.json`, `marcas.json`, `fichas.json` (en dos fases: lo necesario para el primer render y el resto en `requestIdleCallback`) y construye el índice (`construirIndice`): principio/clase por id, entradas de búsqueda normalizadas (principios, marcas, combinaciones, presentaciones del nomenclátor), dosis habituales por principio y mapa código nacional → presentación.
2. El estado del usuario (`estado`: edad, caídas, situaciones, medicación con dosis y tomas, horas de las tomas, plan, cribado, prescriptor, FC en reposo, SPPB…) vive en memoria y se persiste en `localStorage` (`medex.estado`); listas guardadas en `medex.perfiles`; diario de sesiones en `medex.diario`.
3. Cada cambio llama a `render()`: `evaluar(datos, meds, ctx)` devuelve `res` con los ítems resueltos (principio, clase, dosis diaria, categoría de dosis, señales), las reglas por ámbito (general/aeróbico/fuerza/equilibrio), las reglas combinadas disparadas (situación × señal/clase), las interacciones (curadas + DDInter) y el perfil de señales acumuladas. Sobre `res` se derivan: veredicto, Lo esencial (`loEsencial`), chips de contexto, ventana horaria (`ventanaEntrenamiento`), zona de intensidad (`zonaIntensidad`), carga por fármaco (`impactoPorFarmaco`), plan semanal (`planSemana`, `sesionTipo`), chequeo previo a la sesión (`chequeoPrevio`) y cribado ACSM (`cribadoACSM`).
4. Los PDF se generan en el cliente con jsPDF a partir del mismo `res` + `ctx` (`pdf.js`, cargado bajo demanda, que reutiliza las funciones de `informes.js`); el texto para la historia clínica (`textoHistoria`) usa las mismas funciones.
5. El enlace compartible (`#lista=…`) codifica el estado (sin nombre ni datos identificativos) en base64url; al abrirlo se restaura.

## 4. Modelo de la base de conocimiento (`kb.json`)

- `clases[]`: `{ id, nombre, resumen, atc[], principios[], reglas[] }`. Una regla: `{ ambito, nivel (info|precaucion|alerta), texto, condicion?, fuente?, revisado?, evidencia? }`.
- `principios[]` dentro de cada clase: `{ id, nombre, marcas[], unidad?, umbral_mg?, senales[], ficha?, nota?, reglas? }`.
- `senales`: diccionario id → etiqueta (hipotensión, hipoglucemia, sangrado, sedación, caídas, QT, calor…). Las señales son el vocabulario común entre fármacos, reglas combinadas, chequeo previo, constantes a registrar y ficha del entrenador.
- `reglas_combinadas[]`: `{ id, si: { senal?/senales?, clases?, condicion?, min? }, nivel, titulo, texto, ambitos[], fuente }`. Se disparan por combinación de medicación y situación clínica.
- `combinaciones[]`: presentaciones a dosis fija con varios componentes.
- `condiciones`: las situaciones clínicas que el usuario marca (18) más las derivadas en modo profesional (FG, FEVI, NYHA, DAI, SPPB/Vivifrail → fragilidad).

Suplementos y plantas (v1.1): una clase con `tipo: "suplemento" | "planta"` (un principio puede precisar el suyo con `tipo`) no es un medicamento; la interfaz le pone etiqueta e icono propios (`tipoProducto`). Los principios admiten `alias` (nombres comunes en español e inglés que entran en el buscador y el lector de listas como si fueran marcas, sin mostrarse como marcas), `presets` (dosis habituales cuando no hay presentación en el nomenclátor) y `sinonimos` (nombres botánicos para que `build_cima.py` y `remapear_plantas.py` asignen las presentaciones del nomenclátor). Señales propias: `dopaje` y `hepatotoxico`.

Principios "sintéticos" (`atc:<nombre>`): presentaciones del nomenclátor cuyo principio no está en la base, clasificadas por código ATC en una clase; heredan las reglas del grupo con una nota visible.

## 5. Pruebas y calidad

- `node scripts/test.mjs` — motor, lector, integridad de datos, idiomas (paridad de claves y uso en `app.js`), casos de validación, zona de intensidad, SPPB. Se ejecuta antes de cada commit.
- `node scripts/ui_test.mjs` — flujo completo en Chromium (Playwright) contra un servidor local: medicación, pegar/leer, informe, Mi plan, conciliación, cribado, SPPB, zona, modo profesional, persistencia, idiomas, accesibilidad básica, sin errores de consola.
- `node scripts/axe_test.mjs [prefijo]` — axe-core (WCAG 2.1 A y AA) en 85 escenarios: claro, oscuro y alto contraste, móvil y escritorio, paciente y profesional, cada ventana y las páginas estáticas; servidor propio (8803) y 4 escenarios a la vez. Lighthouse (`docs/lighthouse-*.md`).
- `node scripts/artifact_test.mjs` — prueba de humo de `dist/artifact.html` (el artefacto de claude.ai): arranca, sin errores de JavaScript y con el lector de listas, la sesión guiada y el pastillero respondiendo dentro del empaquetado. Servidor propio (8804).
- `node scripts/visual_test.mjs [--base <commit>] [--solo <texto>] [--estricto]` — capturas de 32 pantallas de esta versión y de otra (HEAD por defecto), con fecha, azar y animaciones fijos, comparadas píxel a píxel; informe en `.visual/index.html` (fuera del repositorio). Servidores propios (8801 y 8802).
- `node scripts/pruebas.mjs` — las cuatro anteriores a la vez, cada una con su servidor (unos 2 min y medio); salidas en `.pruebas/`. `ui_test.mjs` corre además en paralelo sus bloques independientes (escritorio e inglés; sin conexión). Las pruebas con navegador desplazan la fecha al lunes si es domingo (descanso del plan tipo).
- GitHub Actions (`.github/workflows/tests.yml`): base coherente, `test.mjs`, `ui_test.mjs`, `artifact_test.mjs` y `axe_test.mjs` en cada cambio.
- `acerca.html` ejecuta los casos de validación en el navegador del usuario, de modo que cualquiera puede comprobar que la base publicada supera sus propias viñetas.

## 6. Persistencia y privacidad

Claves de `localStorage`: `medex.estado`, `medex.perfiles`, `medex.diario`, `medex.prescriptor`, `medex.recientes`, `medex.variantes`, `medex.tema`, `medex.letra`, `medex.guia`, `medex.visto`, `medex.util`, `medex.sinresultado`, `medex.ultimoerror`. Nada se envía a ningún servidor; el formulario de sugerencias recibe solo la lista de principios/dosis y la versión (sin edad ni situaciones), y lo abre el usuario. La exportación de casos lleva una huella SHA-256 para detectar alteraciones; no incluye identificadores.

## 7. Versionado y despliegue

`app/js/version.js` (semver con sufijo de fase) + `CHANGELOG.md` + etiqueta git `vX.Y.Z-fase`. La base lleva su propia versión (fecha de regeneración, `kb.version`). `scripts/bump_version.py` actualiza los `?v=`, los `modulepreload`, los `import()` dinámicos (pdf.js, i18n/xx.js), la precarga del idioma del script en línea y su huella sha256 en la CSP; `sw.js` cambia su nombre de caché con cada versión. `test.mjs` vigila el presupuesto de peso, que la precarga esté completa y que el sello y la huella CSP coincidan. Despliegue: push a `main` → GitHub Pages sirve `app/`.
