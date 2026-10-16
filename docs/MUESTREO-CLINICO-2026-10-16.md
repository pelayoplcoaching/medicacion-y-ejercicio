# Muestreo clínico de la base · versión 1.0 (16/10/2026)

**Quién y cómo.** Lectura regla a regla realizada por Claude (modelo de lenguaje) a petición del autor clínico, Pelayo Fernández Cidón, con criterio de médico internista y farmacología clínica, contrastando cada texto con lo que recogen las fichas técnicas (CIMA/AEMPS) y las guías citadas en la propia regla. **No sustituye el muestreo del autor**: es una segunda lectura sistemática que deja por escrito qué se ha mirado, qué se ha corregido y por qué, para que el autor pueda confirmarlo o revertirlo con la hoja de revisión (`scripts/export_revision.py` → `import_revision.py`). Las correcciones se aplicaron en las fuentes con `scripts/muestreo_v1.py` (idempotente) y la base se regeneró con `merge_kb.py`; las 150 pruebas del motor y los 25 casos de validación siguen pasando.

## Muestra

| Conjunto | Criterio | Reglas leídas |
|---|---|---|
| Reglas de nivel **atención** | todas | 41 |
| Bloque 10 (38 principios nuevos de la 1.0) | todas sus reglas | 37 |
| Resto de reglas por ámbito | 10 % aleatorio por grupo (semilla 20261016), mínimo 1 por grupo | 112 |
| Reglas combinadas (situación × medicación) | todas | 60 |
| Interacciones de nivel **mayor** | todas | 99 |
| **Total** | | **349 textos** (≈ 46 % de la base: 654 reglas + 60 combinadas + 209 interacciones) |

## Hallazgos

### A. Errores de contenido (corregidos)
1. **Vericiguat + nitratos** estaba como contraindicación («Hipotensión grave. Contraindicado») tanto en la regla de atención del grupo `ic_nuevos` como en la interacción mayor. La ficha técnica de vericiguat contraindica otros estimuladores de la guanilato ciclasa (riociguat) y **no recomienda** los inhibidores de la PDE5; con nitratos de acción prolongada no hubo señal de riesgo en VICTORIA y la nitroglicerina sublingual no está bien estudiada. Corrección: la regla pasa a advertir de PDE5 y riociguat y a pedir precaución con la nitroglicerina de rescate; la interacción vericiguat + nitratos baja a **moderada** con el texto ajustado, y vericiguat + PDE5 queda como mayor con la acción «no recomendado».
2. **Antiagregantes + AINE**: la acción decía «ibuprofeno al menos 2 h después de la aspirina». La recomendación regulatoria (FDA 2006, recogida en fichas técnicas) es ibuprofeno **al menos 30 minutos después** de la aspirina de liberación inmediata (o 8 horas antes). Corregido.
3. **Deshabituación tabáquica**: «el ejercicio reduce el deseo de fumar durante horas» exagera la evidencia (los metaanálisis muestran un efecto de hasta una hora tras 10–20 minutos de ejercicio). Reescrito y con su fuente (Taylor 2007; Haasova 2013).
4. **Antivirales del herpes**: se retira la afirmación «el ejercicio regular se asocia a menos recurrencias de herpes», sin evidencia sólida.

### B. Nivel de aviso (corregido)
Cuatro reglas marcadas como **atención** eran en realidad recomendaciones prioritarias de entrenamiento, no riesgos: aGLP-1/fuerza, bifosfonatos/equilibrio, anabólicos óseos/equilibrio y hormonoterapia de próstata/general. Con nivel «atención» inflaban el veredicto («N puntos de atención») sin que hubiera nada que consultar antes de entrenar. Pasan a **precaución**; las reglas de atención quedan en 37, todas de riesgo real (hipoglucemia, sangrado, tendón, QT, hiponatremia, crisis suprarrenal, agranulocitosis, miocarditis, caídas por sedantes en mayores, etc.). Se mantienen como atención las de equilibrio con anticoagulantes y con anticolinesterásicos/levodopa, porque allí la caída sí es el riesgo.

### C. Trazabilidad de fuentes (corregido)
Hallazgo sistemático: **62 reglas** que afirman un beneficio del ejercicio («muy recomendable», «el ejercicio regular mejora…») llevaban como fuente una sección de la ficha técnica, que no dice eso. La ficha técnica documenta efectos adversos e interacciones; el beneficio del ejercicio viene de guías y revisiones. Se reasignó la fuente y el nivel de evidencia en 53 de ellas (las 9 restantes mezclan el beneficio con una precaución específica del fármaco que sí está en la ficha y conservan `ft`): ACSM GETP 11.ª ed., OMS 2020, ESC 2021 (IC), EULAR 2018, ECCO 2023, EACS 2023, Firth 2019 (salud física en enfermedad mental), Schuch 2016 / NICE NG222 (depresión), Geneen 2017 Cochrane (dolor crónico), Osborne 2022 / SPARX (Parkinson), Beck 2017 ESSA (hueso), EAU 2024 (suelo pélvico), Endocrine Society 2018 (testosterona), entre otras. Dos reglas de insulina y lurasidona completan su fuente (Riddell 2017; criterio clínico). Distribución final de evidencia: ficha técnica 313 · guía 185 · revisión 144 · criterios 12.

### D. Leído y confirmado sin cambios (muestra)
- **Atención**: umbrales de glucosa con insulina (< 90 → 10–20 g; 90–125 → 10 g si aeróbico; > 250 → cetonas), cetoacidosis euglucémica con iSGLT2, tendón con quinolonas (y ≥ 60 años / corticoides), nitratos + PDE5, litio (sodio/sudor, AINE), desmopresina (restricción hídrica 1 h antes y 8 h después), hidrocortisona sustitutiva (dosis extra 5–10 mg para esfuerzo prolongado; crisis suprarrenal), antitiroideos y metamizol (agranulocitosis), clozapina (miocarditis en las primeras 8 semanas), inmunoterapia (miocarditis/neumonitis/miositis), antiarrítmicos IC (proarritmia con FC alta), triptanes (contraindicación en cardiopatía isquémica), benzodiacepinas en mayores («≈ 50 % más» de fractura de cadera, Beers 2023), antipsicóticos y golpe de calor, triple whammy.
- **Bloque 10**: lovastatina (CYP3A4; contraindicaciones de la ficha), ziprasidona/amisulprida (QT; amisulprida renal), eslicarbazepina (hiponatremia), cenobamato (sedación progresiva, inducción de anticonceptivos), guanfacina (bradicardia/hipotensión, rebote), terazosina (primera dosis), aceclofenaco (riesgo cardiovascular tipo diclofenaco, PRAC 2013), indometacina (Beers), modafinilo (lista AMA, en competición), carteolol (absorción sistémica del colirio), roxadustat (HTA, potasio, trombosis), apomorfina (30–60 min tras la inyección), valganciclovir (mielotoxicidad), nintedanib (diarrea; rehabilitación respiratoria en FPI).
- **Combinadas (60/60)**: coherentes con ESC 2021/2024, ACSM GETP 11, KDIGO 2024, GOLD/GINA 2024, ILAE 2016, EASL 2019, ACOG 2020, OARSI 2019, ACC/AHA 2022 (aorta). Los umbrales de tensión (≥ 180/110 no entrenar; ≥ 160/100 solo ligera-moderada) coinciden con ACSM.
- **Interacciones mayores (99)**: 96 correctas en mecanismo, nivel y acción (dabigatrán 2 h antes del verapamilo; sildenafilo ≤ 25 mg/48 h con potenciadores; azatioprina al 25 % con alopurinol; simvastatina ≤ 20 mg con amiodarona/verapamilo/diltiazem; colchicina con macrólidos y azoles; domperidona contraindicada con macrólidos/azoles; rifampicina e inductores; hipérico). Las 3 restantes son las corregidas en A.

## Qué queda para el autor
- ~~Confirmar (o revertir) con la hoja de revisión las 4 bajadas de nivel y las 3 reescrituras de texto.~~ Confirmadas por el autor el 16/10/2026 (`revision_20261016.xlsx`, ESTADO = OK).
- Decidir si las reglas «Sin limitación específica» con evidencia `revision` (≈ 100) deben llevar fuente ACSM genérica o seguir como criterio clínico; no afectan al informe.
- Muestreo propio del 10 % de las reglas no leídas aquí (≈ 350) a lo largo de la 1.x; la app ya avisa de cualquier cambio en la base a cada usuario.
- Mantener la regla de la casa: una ficha técnica solo se cita para efectos adversos, dosis e interacciones; los beneficios del ejercicio se citan por guía o revisión.
