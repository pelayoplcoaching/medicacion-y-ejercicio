# Changelog · Pauta Activa

Versionado semántico (`MAYOR.MENOR.PARCHE-fase`). La versión de la aplicación (`app/js/version.js`) es independiente de la versión de la base de conocimiento (`app/data/kb.json` → `version`, fecha de la última regeneración). El detalle para usuarios está en `app/novedades.html`.

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
