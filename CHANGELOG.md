# Changelog · Pauta Activa

Versionado semántico (`MAYOR.MENOR.PARCHE-fase`). La versión de la aplicación (`app/js/version.js`) es independiente de la versión de la base de conocimiento (`app/data/kb.json` → `version`, fecha de la última regeneración). El detalle para usuarios está en `app/novedades.html`.

## 1.1.4 · 2026-11-21 · Limpieza de la hoja de estilos y otras tres tandas (681-830)
- Limpieza (sin cambiar nada de lo que se ve; estilos calculados idénticos en 34 pantallas y estados): fuera 169 declaraciones que siempre pisaba otra posterior, reglas y bloques vacíos, un selector de una clase que ya no existe, fotogramas repetidos, 16 variables sin uso (6 propias y 10 reservas de color-mix sin uso) y las animaciones antiguas sustituidas por las pa-*. Las descripciones de las mejoras numeradas pasan a `docs/ESTILOS-MEJORAS.md` y en la hoja queda el número. Herramientas en `scripts/limpieza-css/` (analizador de declaraciones muertas y comparador de estilos calculados).
- Tanda 19: salidas de ventanas, hojas, menú y resultados (`transition-behavior: allow-discrete`), transiciones de vista de la lista (quitar, pausar, deshacer), del día del plan y del recorrido (`conTransicion` en `app.js`, nombres `--vtn`), pestañas fijas con línea de luz (`container-type: scroll-state`), tipografía viva con el eje de anchura de Archivo, cajas que crecen con el texto (`field-sizing`), centrado óptico (`text-box`), destello al saltar a un apartado (`:target`).
- Tanda 20: adaptación a contraste alto del sistema, colores forzados, transparencia reducida, pantallas P3, móvil en horizontal, app instalada, teclado, letra grande, pantallas pequeñas, tabletas (barra flotante), tinta electrónica y colores invertidos; grano fino en oscuro.
- Tanda 21: esquinas de visor (plan, de un vistazo, semáforo, cronómetro, capturas), rayado de las barras vacías, numeración de Legal, «Volver» de cristal, punto de estado y de novedad, y acabados por pantalla.
- Presupuestos: CSS 335 KB (antes de la limpieza, 362 KB con 150 mejoras menos; 62 KB con gzip).

## 1.1.3 · 2026-11-21 · Otras tres tandas: transiciones nativas, tacto, profundidad y detalles (531-680)
- CSS al final de `app/css/style.css` (bloque «OTRAS TRES TANDAS (531-680)»): tanda 16, plegables que deslizan su altura (`::details-content` + `interpolate-size`), transición entre páginas (`@view-transition`, la cabecera viaja con `view-transition-name`), pulsaciones con muelle, paralaje de la cabecera, línea de lectura en ventanas (`timeline-scope`); tanda 17, entradas por pantalla (resumen, compartir, Mi plan, sesión, SPPB, ventanas, páginas secundarias); tanda 18, lectura (equilibrio de títulos, guiones en pantallas estrechas, dígitos fijos), controles (`:user-invalid`, foco doble, sin destello al tocar), oscuro y detalles.
- JS: cambio de tema con círculo desde el botón y de idioma con fundido (View Transitions), dirección del contenido al cambiar de pestaña (`data-dir`), onda de pulsación con la API de animaciones (`--onda`, no reinicia las entradas), inclinación 3D (`--px`/`--py`), contador de suplementos que late.
- Arreglo: la elevación de los documentos al pasar el ratón no funcionaba (la animación de entrada pisaba el desplazamiento); ahora entran escalando.
- Presupuestos de `test.mjs`: CSS ≤ 370 KB (354 KB; 75 KB con gzip), precarga ≤ 3850 KB. Lista completa en el proyecto («claude/pauta-activa-mejoras-visuales-531-680.md»).

## 1.1.2 · 2026-11-21 · Tres tandas más: belleza, luz y movimiento futurista (381-530)
- CSS al final de `app/css/style.css` (bloque «TRES TANDAS MAS: BELLEZA, VISUAL Y MOVIMIENTO FUTURISTA», ASCII, sin color-mix): tanda 13, sistema de movimiento (tokens `--ease-salida`, `--ease-muelle`, fotogramas `pa-*` con `translate`/`scale`/`rotate` sueltos para no pisar los `transform`; entradas al cargar, hojas y ventanas con muelle o enfoque, menú en cascada, entradas ligadas al desplazamiento con `animation-timeline: view()` y tope de distancia `entry min(100%, Npx)`, barra de lectura con `scroll(root)`); tanda 14, luz, cristal y neón; tanda 15, detalles por pantalla.
- Todo movimiento es de una vez: se apaga con «reducir movimiento», al imprimir (solo `@media screen`) y en las pruebas automáticas (`html.pa-quieto`, que `app.js` pone si `navigator.webdriver`).
- JS: `contarCifra` (cifras del resumen y de la completitud), `latirSiCambia` (insignias, contador de la lista y casillas marcadas), luz que sigue al ratón (`--mx`/`--my`, clase `con-luz`, `@property --luz`), línea de tiempo del aviso (`--toast-ms`, clase `cuenta`).
- Arreglo: en alto contraste la barra de completitud se quedaba sin relleno.
- Presupuestos de `test.mjs`: CSS ≤ 325 KB (314 KB; 67 KB con gzip), precarga ≤ 3800 KB. Lista completa en el proyecto («claude/pauta-activa-mejoras-visuales-381-530.md»).

## 1.1.1 · 2026-11-21 · Tres tandas de 50 mejoras visuales (231-380)
- CSS al final de `app/css/style.css` (bloque «TRES TANDAS DE 50 MEJORAS VISUALES Y DE BELLEZA», sin color-mix, ASCII) y JS: grupo no repetido (`grupoVisible`), clases `sin-dosis` y `data-tipo` en la lista, buscador sin duplicados con resaltado e icono (`sinRepetidos`, `resaltar`), flecha de «Siguiente».
- Arreglos: horas de las tomas que se salían en el móvil (305), índice de Legal que tapaba el texto (352), botones-enlace subrayados (353), momentos cortados (238).
- Presupuestos de `test.mjs`: CSS ≤ 280 KB, precarga ≤ 3760 KB. Lista completa en el proyecto («claude/pauta-activa-mejoras-visuales-150.md»).

## 1.1.0 · 2026-11-21 · Suplementos y plantas medicinales
- Base: 15 grupos con `tipo` («suplemento» | «planta»; el principio puede precisarlo) y 53 productos (`data/ext/11_suplementos_plantas.json`, generado por `scripts/gen_suplementos_plantas.py`): suplementos deportivos (sustituye a la clase anterior; el id `multivitaminico` se conserva para las listas guardadas y deja de agrupar hierbas), vitaminas y minerales sueltos (zinc, E, K, B6), hipérico, plantas sedantes, CBD, plantas que suman sangrado (ginkgo, ajo, jengibre, cúrcuma, sauce, harpagofito), regaliz y laxantes de plantas, plantas diuréticas, suplementos para el azúcar, adaptógenas, menopausia, equinácea/propóleo, productos para adelgazar, prohormonas/SARMs/tribulus, levadura roja y Q10. 71 reglas por ámbito, señales nuevas `dopaje` y `hepatotoxico`, 3 reglas combinadas (antidopaje, hepatopatía + producto hepatotóxico, varios hepatotóxicos), alias de búsqueda en español e inglés (`alias`) y dosis habituales (`presets`).
- Interacciones: 114 nuevas (`data/ext/ddi_04_suplementos_plantas.json`, `scripts/gen_ddi_suplementos_plantas.py`); las 5 del hipérico que colgaban de «multivitamínico» pasan al hipérico. `ddi_curated.json` se publica compacto (−21 KB) y `add_ddi.py` lo escribe así.
- Todo lo nuevo va con `revisado: false`: la app lo muestra como «borrador · pendiente de revisión clínica» (reglas e interacciones; el pie de interacciones separa revisadas y pendientes) y `acerca.html` lo cuenta aparte.
- Nomenclátor: `build_cima.py` resuelve nombres botánicos por los `sinonimos` de la base; `scripts/remapear_plantas.py` reasigna 13 presentaciones ya publicadas (COLA DE CABALLO ARKOPHARMA dejaba de ser «ahorrador de potasio»; sen, cáscara, frángula y aloe → laxantes de plantas; Echinamed → equinácea).
- Interfaz: etiqueta «Suplemento»/«Planta» e icono propio (hoja, frasco) en la lista, el buscador, el informe y la ficha; plegable «¿Toma suplementos o plantas medicinales?» con 19 botones rápidos y contador; buscador «Medicamento, suplemento o planta»; textos en 5 idiomas.
- Correcciones: las unidades que ya llevan «/día» (g/día, mg/día, inhalaciones/día…) o son por hora (mcg/h) ya no se muestran como «g/día/día» (`unidadPorDia`, `unidadPorToma`); el ritmo sin edad ya no muestra «no se guíe por el pulso ()».
- Validación: 7 casos nuevos (25 → 32), 26 pruebas nuevas del motor y 6 de interfaz.
- Revisión clínica (mismo día): el autor revisó la hoja `data/revision/revision_pendientes_20261121.xlsx` (253 filas) sin cambios; `import_revision.py` marca como revisadas las 68 reglas, 3 combinadas y 114 interacciones (corregido: el OK de interacciones y combinadas no se aplicaba). La base no tiene ninguna regla ni interacción en borrador.

## 1.0.2 · 2026-10-16
- Combinaciones a dosis fijas: una presentación del nomenclátor cuyo componente suelto ya está incluido en un principio combinado de la base (Entresto → sacubitrilo/valsartán + valsartán; inhaladores LABA/ICS + ICS) ya no añade el componente dos veces (75 presentaciones afectadas). En la lista, las combinaciones se muestran con una cabecera con la marca y cada principio debajo, con una × que quita la combinación entera.
- Vivifrail automático: el nivel (A 0–3 · B 4–6 · C 7–9 · D 10–12) se calcula del SPPB, tanto del test guiado como del campo manual, y se puede cambiar a mano; el resultado del SPPB lo muestra.

## 1.0.1 · 2026-10-16
- Muestreo clínico de la base (349 textos: todas las reglas de atención, el bloque 10, 10 % aleatorio por grupo, las 60 combinadas y las 99 interacciones mayores): vericiguat + nitratos deja de ser contraindicación (interacción moderada; regla reescrita), ibuprofeno al menos 30 min después de la aspirina, afirmaciones sin evidencia retiradas (craving «durante horas», recurrencias de herpes), 4 reglas de atención que eran recomendaciones pasan a precaución, 53 reglas de beneficio del ejercicio citan guías en vez de la ficha técnica. `docs/MUESTREO-CLINICO-2026-10-16.md`, `scripts/muestreo_v1.py`.
- Revisión jurídica (`docs/REVISION-JURIDICA-2026-10-16.md`): el veredicto describe la medicación («Su medicación añade N puntos de atención…») en lugar de declarar la aptitud de la persona; `legal.html` con finalidad prevista y razonamiento MDCG 2019-11, identificación LSSI del prestador (colegiación), roles RGPD del modo profesional y del canal de sugerencias, cookies, derechos, atribución del nomenclátor.

## 1.0.0 · 2026-10-16 (versión 1.0)
Diez mejoras finales antes de la primera versión estable; sale la etiqueta «beta».
- «De un vistazo» en la pantalla del informe con la misma jerarquía que la primera cara del PDF del paciente (puede hacer / con cuidado / evite, plan semanal, ritmo); listas, filas y ritmo compartidos entre app, PDF e historia.
- Informe de evolución para la reevaluación (modo profesional): adherencia frente al plan, minutos y RPE por semana, síntomas y glucemias del diario, comparativa SPPB / FC en reposo / medicación con la foto tomada al prescribir; texto para la historia, PDF de una cara y «renovar la prescripción» con historial.
- Aviso de cambios al actualizar la base: la app guarda una huella del informe (y de cada paciente guardado) y, cuando llega una base nueva, muestra qué avisos aparecen, desaparecen o cambian de texto.
- Pantalla de consulta (≥ 960 px, modo profesional): dos columnas sin pestañas, con la columna de medicación y datos fija y el informe completo seguido.
- Ilustraciones propias de los 18 ejercicios (`app/js/pictos.js`) en la sesión guiada y el plan; hoja «Mi sesión» imprimible desde el navegador sin librerías.
- Lectura fácil: índice INFLESZ de los 685 textos que lee el paciente (`scripts/legibilidad.mjs`) con comprobación en `test.mjs`; 50 textos reescritos en las fuentes (media 55,8 → 57,8).
- Estadísticas de la consulta: pacientes guardados, edad, fármacos y avisos por paciente, situaciones, grupos, principios, efectos, interacciones, cribado y prescripciones; CSV anonimizado y resumen para la memoria del servicio.
- Base ampliada con la fábrica de contenido: 38 principios frecuentes del nomenclátor con reglas propias y ficha (`data/ext/10_v1_principios.json`; 354 → 392 principios); casos de validación 13 → 25 (negativos y uno por situación clínica).
- Compartir y publicar: enlace de solo lectura (`#ver=`) con «hacer una copia», evento de reevaluación en el calendario, `scripts/dataset.py` (JSON + CSV + README + licencia) y `CITATION.cff` / `.zenodo.json` para el DOI.
- Presentación: `presentacion.html` (qué es, para quién, qué hace, lo que no es, cómo empezar), capturas nuevas, versión 1.0 en acerca/legal, etiqueta «beta» retirada.
- Pruebas: motor 150, interfaz 153; axe 0 incidencias en 9 páginas/escenarios.

## 0.19.1-beta.3 · 2026-10-16
- PDF del paciente rediseñado tras la primera entrega a un paciente real: la primera cara concentra lo básico y lo más útil (prescriptor, cribado, puede/con cuidado/evite, lo esencial, plan semanal y ritmo); la segunda, su semana, cuándo entrenar y las señales de alarma; las siguientes, su medicación una por una (resumen + las reglas más relevantes), su situación e interacciones. Máximo 4 caras: si se exceden, el documento se vuelve a maquetar con menos detalle (3 → 0 reglas por fármaco). Eliminadas las secciones por tipo de ejercicio (todas las reglas de todos los fármacos) y la lista de alarmas duplicada; las interacciones de DDInter sin texto no se incluyen en el documento del paciente.
- Pie de página de los PDF en dos líneas (no se solapa con el número de página); la cabecera no pisa el número de documento con letra grande.

## 0.19.0-beta.3 · 2026-10-15 (beta 3 · consulta y centros)
- Consulta con varios pacientes por sesión (modo profesional): barra «Paciente en consulta» con guardar, cargar y «Siguiente paciente» (guarda y vacía); los pacientes se guardan como listas en el dispositivo, sin nombres reales.
- Plantillas de prescripción por perfil (10: insuficiencia cardíaca, diabetes con insulina, mayor frágil y prefrágil, cardiopatía isquémica, oncológico, hipertenso activo, EPOC con oxígeno, osteoporosis, FA anticoagulada) que rellenan situación clínica, cribado, días de ejercicio, Vivifrail y plazo de reevaluación.
- Exportación FHIR R4 básica (`Bundle` con `Patient`, `Practitioner`, `Observation` LOINC, `Condition`, `MedicationStatement` con ATC y horario, `CarePlan` FITT) para integrar en historia clínica; versión en texto plano del informe (lo esencial + historia) para lectores de pantalla; los PDF llevan título, autor, asunto, palabras clave e idioma en los metadatos.
- Interfaz en euskera (quinto idioma; guarda del idioma y hash CSP actualizados).
- Recordatorios locales: notificación los días de ejercicio a la hora elegida (sin servidores: mientras la app está abierta o al abrirla) y aviso de reevaluación vencida en modo profesional; clic en la notificación abre la app.
- Las 209 interacciones curadas llevan fuente por fila (`scripts/fuentes_ddi.py`), visible en la tarjeta y en el PDF clínico.
- Fábrica de contenido asistida por IA: `scripts/propuesta_ia.py` genera el encargo (estructura, señales, fuentes exigidas, ficha técnica de CIMA) para que un modelo proponga un grupo, un principio o una interacción, y `scripts/validar_bloque.py` comprueba la propuesta (estructura, niveles, longitud, fuente y evidencia) antes de fusionarla con `merge_kb.py`; sin llamadas a ninguna API.
- Pruebas: motor 128, interfaz 134.

## 0.18.0-beta.2 · 2026-10-15 (beta 2 · validación)
- Revisión clínica cerrada: las 617 reglas y las 60 reglas combinadas llevan fuente, nivel de evidencia y estado «revisada» (`docs/REVISION-CLINICA-2026-10-15.md`, `scripts/revision_beta2.py`); correcciones en insulina (umbrales de glucosa del consenso), benzodiacepinas en mayores y paracetamol; glosario ampliado y textos de ayuda revisados.
- Feedback dentro de la app: hoja con tipo, texto y datos técnicos (versión, pantalla, pasos recientes, errores, navegador, lista anonimizada) que prerrellena el formulario; «copiar informe» y «enviar por correo». El aviso de error inesperado abre la hoja con el error ya escrito.
- Copia de seguridad cifrada (`.pauta`, AES-GCM 256 con clave derivada por PBKDF2-SHA-256, 250 000 iteraciones) con restauración fusionando o sustituyendo; ayuda «?» explicando que nadie puede abrirla sin la contraseña.
- «Pasar a otro dispositivo»: código QR o enlace `#sync=` con todos los datos comprimidos (deflate) y codificados; al abrirlo en el otro dispositivo se copian (con confirmación si ya había datos); lectura del QR con la cámara en escritorio.
- Formulario de sugerencias (Tally) con campos ocultos nuevos (`app`, `pantalla`, `texto`, `tipo`, `errores`, `pasos`, `navegador`) y texto prerrellenado.
- Pruebas de interfaz: 122.

## 0.17.0-beta.1 · 2026-10-15 (beta 1 · experiencia de uso)
- Cabecera limpia: solo «¿Cómo funciona?», idioma y un menú «Más» (tamaño de letra en tres niveles, tema, glosario, guía rápida, novedades, sugerencias, acerca de, legal, instalar).
- Recorrido en tres pasos (sus datos → su medicación → su plan) fijo en la parte superior en móvil, con estado y botón «Siguiente» que lleva al paso pendiente.
- Medidor «Su plan está al N %» con el siguiente paso recomendado, por qué importa y botón directo; lista de todo lo que falta.
- Un solo botón «Más formas de añadir» que abre una hoja con las vías (buscar, foto de la hoja, foto de una caja, PDF, pegar, dictar, escanear) explicadas con icono y una frase; «Añadir mi primer medicamento» en el estado vacío.
- Tarjeta de medicamento: icono del grupo, nombre, dosis en chip editable, tomas (desayuno/comida/cena/noche) tocables, pausar y quitar con deshacer.
- Veredicto primero: frase en lenguaje llano y acciones «Ver mi plan», «Descargar», «Compartir» y «?» (qué significan los niveles); pestañas con contador de avisos e icono, navegación por teclado (flechas, Inicio, Fin).
- Barra de navegación inferior en móvil (Datos · Medicación · Informe · Mi plan) con insignias.
- Ayuda contextual «?» en datos, edad, caídas, pulso en reposo, SPPB, situación clínica, cribado y niveles; glosario de términos (RPE, FC de reserva, SPPB…) con términos marcados en el texto.
- Recorrido guiado sobre los elementos reales la primera vez (y desde «¿Cómo funciona?»), con «Saltar».
- Accesibilidad: tres tamaños de letra, objetivos táctiles de 44–48 px, «Escuchar este apartado» en cada pestaña, foco visible y árbol de accesibilidad comprobado; márgenes para que la barra fija no tape lo que se desplaza; insignias legibles en oscuro.
- Estados y micro-interacciones: estado vacío con una sola acción, progreso al generar PDF o leer una foto, confirmación con deshacer al vaciar; `guia.html` con seis capturas y preguntas frecuentes.
- Pruebas de interfaz: 112 (28 nuevas); axe 0 incidencias en claro/oscuro/alto contraste × paciente/profesional, legal.html y guia.html.

## 0.16.0-beta.0 · 2026-10-15 (beta 0)
- Contenido clínico: 10 situaciones nuevas (hipertensión, cardiopatía isquémica, fibrilación auricular, aneurisma de aorta, ictus, cáncer, artrosis, epilepsia, hepatopatía, obesidad) con reglas combinadas y fuente; 4 clases nuevas (buspirona, butilescopolamina, laxantes, corticoides inhalados) y parches a nicorandil, entacapona, trihexifenidilo e ipratropio; 15 interacciones revisadas más (209). Base: 112 clases · 354 principios · 60 reglas combinadas.
- Zona de intensidad individual: FCmáx por Tanaka y zonas por FC de reserva (Karvonen) con la FC en reposo del paciente; método RPE/prueba del habla cuando el pulso no es válido (betabloqueantes, FA, marcapasos), límite con DAI y techo de intensidad moderada según situación. Tarjeta en el apartado aeróbico, en los PDF y en la historia.
- SPPB guiado (Guralnik 1994): equilibrio, marcha 4 m y 5 levantadas con cronómetro, saltos automáticos y puntuación 0–12; el resultado ajusta la fragilidad y aparece en el informe clínico y en la historia.
- Carga de precauciones por fármaco: ranking con barras (atención ×3, precaución, combinación, interacción) para conversar sobre desprescripción.
- Dos PDF nuevos: ficha para el entrenador/fisioterapeuta (sin dosis ni diagnóstico) y tarjeta A5 para la nevera (semana, ritmo, esencial, alarma, QR).
- Escáner de código de barras (EAN-13 farmacéutico → código nacional) preparado: se activa cuando el nomenclátor incluya `cn` (`build_cima.py` ya lo emite).
- Tema de alto contraste; FC en reposo en «Sus datos»; 3 casos de validación más (13); `comprobarCaso` avisa de principios desconocidos.
- Documentación técnica: `docs/ARQUITECTURA.md` y `docs/BETA-CHECKLIST.md`.

## 0.15.0-alfa · 2026-10-15 (alfa 15)
- Cribado preparticipación (algoritmo ACSM 2015) con tres preguntas; resultado en el veredicto, Lo esencial, PDF e historia clínica.
- Prescriptor en modo profesional (nombre, especialidad, centro, nº colegiado) y fecha de reevaluación con aviso al vencer; cabecera, número de documento, QR y bloque de firma en los PDF.
- Casos de validación clínica (`app/data/casos.json`, 10 viñetas) ejecutados en las pruebas y en «Acerca de»; «Guardar como caso de prueba» en modo profesional.
- Nivel de evidencia por regla (ficha técnica / guía / criterios / base / revisión / sin fuente) y columna EVIDENCIA en la hoja de revisión.
- Exportar e importar caso anonimizado (JSON con huella SHA-256), lista de medicación en CSV.
- Páginas legales (`legal.html`): aviso legal, privacidad, declaración de accesibilidad, metodología y limitaciones, posicionamiento regulatorio.
- Índice lateral del informe en escritorio e «Imprimir el plan».
- Auditoría Lighthouse (`docs/lighthouse-2026-10-15.md`): móvil 92/100/100/100, escritorio 100/100/100/100; CLS 0.
- Versionado formal: `version.js`, este CHANGELOG, etiqueta `v0.15.0-alfa`.

## 0.14.0-alfa · 2026-10-15 (alfa 14)
- Chequeo previo a la sesión, conciliación de la lista, constantes en el diario (+CSV), mis días de ejercicio, variantes más fácil/difícil con claves; pictogramas, iconos por grupo terapéutico, tendencia de 8 semanas, transición de pestañas, anillo del cronómetro, indicador sin conexión.

## 0.13.0-alfa · 2026-10-15 (alfa 13)
- Pestaña Mi plan, sesión guiada con cronómetro, progresión, «Añadir tal cual» para productos fuera de la base.

## Anteriores
Alfa 1–12 (2026-10-14 a 2026-10-15): ver `app/novedades.html`.
