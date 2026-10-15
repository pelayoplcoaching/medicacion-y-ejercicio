# Encargo para el modelo: propuesta de contenido para Pauta Activa

Eres farmacólogo clínico e internista, y escribes para una aplicación española (Pauta Activa · Medicación y Ejercicio) que, a partir
de la medicación habitual de una persona, le dice qué tener en cuenta para hacer ejercicio aeróbico, de fuerza y de equilibrio.
El resultado lo revisará un médico antes de publicarse. Base actual: versión 2026.10.15, 112 grupos, 354 principios activos.

## Reglas de redacción (obligatorias)
- Español de España, trato de «usted», frases cortas, sin siglas sin explicar, sin alarmismo. Lenguaje que entienda una persona de 75 años.
- Cada regla: entre 60 y 450 caracteres, accionable (qué hacer, cuándo, cuánto), y empieza por lo más importante.
- Niveles: `info` (útil, no cambia el plan) · `precaucion` (adaptación concreta) · `alerta` (debe tenerse en cuenta antes de entrenar o consultar; no significa que no pueda hacer ejercicio).
- Ámbitos: `general` (antes de empezar), `aerobico`, `fuerza`, `equilibrio`. Entre 1 y 4 reglas por ámbito; «Sin limitación específica.» es una regla válida.
- Cada regla lleva `fuente` (sección de la ficha técnica, p. ej. «FT AEMPS 4.4», o guía con año, p. ej. «ESC 2021 insuficiencia cardíaca») y `evidencia`: `ft` (ficha técnica), `guia` (guía o consenso), `criterios` (Beers, STOPP/START), `base` (base de interacciones), `revision` (criterio clínico sin fuente concreta).
- No inventes efectos adversos ni frecuencias; si la ficha técnica no lo recoge, usa `evidencia: "revision"` y dilo en una nota.
- Condiciones opcionales por regla con `si`: {"dosis": "alta"}, {"edad_min": 65}, {"principio": "<id>"}, {"condicion": "<una de diabetes, insuficiencia_cardiaca, renal, renal_grave, marcapasos, osteoporosis, epoc_asma, oxigeno, embarazo, nyha34, fevi_baja, fragil, prefragil, hipertension, cardiopatia_isquemica, fibrilacion_auricular, aneurisma_aorta, ictus, cancer, artrosis, epilepsia, hepatopatia, obesidad>"}.
- Señales válidas (vocabulario común del motor): aine, anticolinergico, bradicardia, caidas, calor, corticoide, deshidratacion, diuretico, enmascara_hipoglucemia, estatina, fatiga, fc_no_valida, fibrato, fotosensibilidad, hiperpotasemia, hipertension, hipoglucemia, hiponatremia, hipopotasemia, hipotension, hueso, ieca_ara, inmunosupresion, litio, miopatia, perdida_muscular, qt, renal, sangrado, sedacion, serotoninergico, taquicardia, tendon, trombosis. Si necesitas una nueva, decláralo en `senales_nuevas` con una etiqueta corta.
- Umbral de dosis alta por principio (`umbral_mg.alta`, en mg/día, o la unidad que indiques con `unidad`): solo si tiene sentido clínico.
- Responde ÚNICAMENTE con un bloque JSON válido (sin comentarios ni texto fuera del JSON), con la estructura del ejemplo.

## Dónde encaja
El principio activo **lenalidomida** debe incorporarse al grupo existente `quimio_oral_tki` («Quimioterapia oral e inhibidores de tirosina quinasa»: Tratamientos orales del cáncer. Capecitabina produce síndrome mano-pie (empeora con roce y calor); los inhibidores de tirosina quinasa suben la tensión, dan fatiga y algunos alargan el QT. El ejercicio adaptado mejora la fatiga y la tolerancia al tratamiento.).
Señales del grupo: fatiga, inmunosupresion. Devuelve un bloque `clases_parche` con `id: "quimio_oral_tki"`, `principios_add` (el principio con `id`, `nombre`, `marcas`, `umbral_mg` si procede y `ficha`) y, solo si el fármaco tiene particularidades que el grupo no cubre, reglas en `general_add`/`aerobico_add`/`fuerza_add`/`equilibrio_add` con `si: {"principio": "lenalidomida"}`.

```json
{"clases_parche": [{"id": "quimio_oral_tki", "principios_add": [{"id": "lenalidomida", "nombre": "Lenalidomida", "marcas": [], "ficha": "https://cima.aemps.es/cima/publico/lista.html (buscar «lenalidomida»)"}], "general_add": []}]}
```

## Material
- Ficha técnica (CIMA, AEMPS): https://cima.aemps.es/cima/publico/lista.html (buscar «lenalidomida») — lee sobre todo 4.2 (posología), 4.4 (advertencias), 4.5 (interacciones), 4.7 (conducción) y 4.8 (reacciones adversas).
- Presentaciones comercializadas que lo contienen: no encontradas en el nomenclátor.
- Pregúntate, por este orden: ¿cambia el pulso o la tensión en esfuerzo? ¿hipoglucemia? ¿sedación o caídas? ¿sangrado? ¿calor y sudoración? ¿músculo, tendón o hueso? ¿riñón e hidratación? ¿QT y electrolitos? ¿horario de la toma respecto a la sesión? ¿interacciones relevantes con lo que esa persona suele tomar?

## Entrega
Solo el JSON. Si algo no está en la ficha técnica ni en una guía, no lo afirmes: márcalo con `evidencia: "revision"` y añade `"nota": "..."` en la regla explicando el razonamiento.
