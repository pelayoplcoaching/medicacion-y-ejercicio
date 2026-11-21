#!/usr/bin/env python3
"""Fuente editable del bloque de suplementos y plantas (v1.1). Genera data/ext/11_suplementos_plantas.json
(solo para la creación inicial; tras la revisión clínica, el JSON de data/ext es la fuente)
(uso: python3 scripts/gen_suplementos_plantas.py && python3 scripts/merge_kb.py) (bloque de la base: suplementos y plantas medicinales).
Todas las reglas nuevas van con revisado=False (pendientes de la revisión clínica del autor); las reglas ya
revisadas de la clase anterior de suplementos se conservan tal cual (revisado=True)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def R(nivel, texto, fuente, evidencia, si=None, revisado=False):
    r = {"nivel": nivel, "texto": texto, "fuente": fuente, "evidencia": evidencia, "revisado": revisado}
    if si:
        r["si"] = si
    return r


def P(pid, nombre, alias=None, unidad=None, presets=None, senales=None, sinonimos=None, umbral=None, marcas=None, tipo=None, nota=None):
    p = {"id": pid, "nombre": nombre, "marcas": marcas or []}
    if alias: p["alias"] = alias
    if unidad: p["unidad"] = unidad
    if presets: p["presets"] = presets
    if senales: p["senales_extra"] = senales
    if sinonimos: p["sinonimos"] = sinonimos
    if umbral is not None: p["umbral_mg"] = {"alta": umbral}
    if tipo: p["tipo"] = tipo
    if nota: p["nota"] = nota
    return p


HMPC = "EMA HMPC, monografía de la UE"
AIS = "AIS Sports Supplement Framework"
IOC = "IOC consensus 2018 (suplementos)"
SI = lambda pid, **kw: {"principio": pid, **kw}

clases = []

# ---------------------------------------------------------------- 1. Suplementos deportivos (sustituye a la clase anterior)
clases.append({
    "id": "suplementos_deportivos", "tipo": "suplemento",
    "nombre": "Suplementos deportivos (creatina, cafeína, proteína, beta-alanina, nitratos…)",
    "atc": [],
    "resumen": "No son fármacos, pero pueden interactuar con ellos. Con buena evidencia en el deporte hay pocos: creatina, cafeína, beta-alanina, bicarbonato y nitratos de la remolacha. Si compite, use productos con control de calidad por lotes.",
    "senales": [],
    "principios": [
        P("creatina", "Creatina monohidrato", alias=["Creatine"], unidad="g/día", presets=[3, 5]),
        P("cafeina", "Cafeína / pre-entrenos", alias=["Pre-entreno", "Guaraná", "Bebida energética", "Cafeína anhidra", "Caffeine"], unidad="mg/día", presets=[100, 200, 300], senales=["taquicardia", "hipertension"]),
        P("proteina_suplemento", "Proteína en polvo (suero, caseína, vegetal)", alias=["Whey", "Proteína de suero", "Batido de proteínas", "Protein powder"], unidad="g/día", presets=[20, 25, 30, 40]),
        P("multivitaminico", "Multivitamínico y minerales", alias=["Multivitaminas", "Complejo vitamínico"], marcas=["Supradyn", "Multicentrum"]),
        P("beta_alanina", "Beta-alanina", unidad="g/día", presets=[3.2, 4, 6.4]),
        P("bicarbonato_ergogenico", "Bicarbonato sódico (como suplemento deportivo)", alias=["Bicarbonato (deporte)"], unidad="g/día"),
        P("nitrato_remolacha", "Nitratos de la remolacha (zumo o concentrado)", alias=["Zumo de remolacha", "Remolacha (concentrado)", "Beetroot", "Beet juice"]),
        P("hmb", "HMB (hidroximetilbutirato)", unidad="g/día", presets=[3]),
        P("aminoacidos", "Aminoácidos (BCAA, EAA, leucina, glutamina)", alias=["BCAA", "Aminoácidos ramificados", "Leucina", "Glutamina", "EAA"], unidad="g/día"),
        P("colageno", "Colágeno hidrolizado / gelatina", alias=["Colágeno", "Collagen"], unidad="g/día", presets=[10, 15]),
        P("carnitina", "L-carnitina", alias=["Carnitina"], unidad="g/día"),
        P("arginina_citrulina", "Arginina / citrulina (óxido nítrico)", alias=["L-arginina", "Citrulina", "Citrulina malato", "Óxido nítrico"], unidad="g/día"),
    ],
    "general": [
        R("info", "Creatina (3–5 g/día) es segura con función renal normal y sube ligeramente la creatinina en los análisis sin dañar el riñón: avise a su médico de que la toma. Con enfermedad renal o con fármacos que afectan al riñón (metformina, IECA, AINE, litio, tacrolimus) consúltelo antes.",
          "Revisión clínica (ISSN 2017 creatina; FT de los fármacos citados)", "revision", SI("creatina"), revisado=True),
        R("precaucion", "Tiene una enfermedad del riñón: no tome creatina sin consultarlo. La creatinina de los análisis deja de servir para vigilar el riñón y no hay estudios suficientes de seguridad en su caso.",
          "ISSN position stand creatina 2017", "guia", SI("creatina", condicion="renal")),
        R("precaucion", "Cafeína y 'pre-entrenos' suben pulso y tensión. Evítelos o limítelos si toma estimulantes, antidepresivos IMAO, betabloqueantes para arritmias o fármacos que alargan el QT, y nunca combine varios estimulantes. Los pre-entrenos con sinefrina, yohimbina o DMAA no son seguros.",
          "FT AEMPS 4.4", "ft", SI("cafeina"), revisado=True),
        R("info", "Para rendir basta con unos 3 mg de cafeína por kilo, entre 30 y 60 minutos antes. Más cantidad no rinde más y da temblor, nervios y palpitaciones. No la tome por la tarde si duerme mal. Hay cafeína en el guaraná, el mate, la cola y las bebidas energéticas.",
          "ISSN cafeína 2021 · " + IOC, "guia", SI("cafeina")),
        R("info", "Con enfermedad renal avanzada, la proteína total diaria debe pactarse con su médico. Si toma levodopa, separe el batido de la toma.",
          "Revisión clínica (ISSN 2017 creatina; FT de los fármacos citados)", "revision", SI("proteina_suplemento"), revisado=True),
        R("info", "Para ganar músculo basta con llegar a unos 1,6 g de proteína por kilo y día, sumando la comida; más no aporta. Repártala en 3 o 4 tomas de 20 a 40 g. El batido es comida, no medicina: no es imprescindible.",
          "ISSN proteína 2017 · Morton 2018 (metaanálisis)", "guia", SI("proteina_suplemento")),
        R("info", "Un multivitamínico no mejora el rendimiento si come variado. Si toma acenocumarol (Sintrom), elija uno sin vitamina K o tómelo siempre igual. Sepárelo 2 a 4 horas de la levotiroxina, de antibióticos como ciprofloxacino o doxiciclina y de los fármacos para el hueso: el calcio, el hierro y el magnesio que lleva impiden que se absorban.",
          "FT AEMPS 4.5 (acenocumarol, levotiroxina, quinolonas, bifosfonatos)", "ft", SI("multivitaminico")),
        R("info", "Si además toma plantas (hipérico, ginkgo, ginseng, valeriana…), añádalas una a una a la lista: la aplicación las reconoce por separado y avisa de sus interacciones.",
          "Revisión clínica", "revision", SI("multivitaminico")),
        R("info", "La beta-alanina da un hormigueo en la piel de la cara y las manos durante unos minutos. Es inofensivo y se evita repartiendo la dosis en tomas pequeñas (de 0,8 a 1,6 g) o con la forma de liberación lenta.",
          "ISSN beta-alanina 2015 · " + AIS + " (grupo A)", "guia", SI("beta_alanina")),
        R("precaucion", "El bicarbonato como suplemento (unos 0,2 a 0,3 g por kilo, de 1 a 3 horas antes) suele dar diarrea y dolor de tripa. Aporta mucha sal: no lo use si tiene hipertensión, insuficiencia cardíaca o enfermedad del riñón.",
          "ISSN bicarbonato 2021 · " + AIS + " (grupo A)", "guia", SI("bicarbonato_ergogenico")),
        R("info", "La remolacha puede teñir de rojo la orina y las heces: es inofensivo. Pero si tras un esfuerzo muy duro la orina sale oscura, como el café, no es la remolacha: consulte. Los nitratos bajan un poco la tensión y los colutorios antisépticos anulan su efecto.",
          AIS + " (grupo A) · " + IOC, "guia", SI("nitrato_remolacha")),
        R("info", "El HMB es seguro a 3 g al día. En quien ya entrena su efecto es pequeño; puede ayudar a conservar músculo en mayores o tras un encamamiento, siempre junto con proteína y ejercicio de fuerza.",
          "ISSN HMB 2013", "guia", SI("hmb")),
        R("info", "Si ya toma suficiente proteína, los aminoácidos sueltos (BCAA, glutamina) no añaden nada. Si toma levodopa, sepárelos de la toma: compiten con ella y le quitan efecto.",
          "FT AEMPS 4.5 (levodopa) · ISSN proteína 2017", "ft", SI("aminoacidos")),
        R("info", "El colágeno es seguro y no tiene interacciones relevantes. Su beneficio en tendones y articulaciones es pequeño y poco probado; lo que de verdad ayuda al tendón es la carga progresiva con ejercicio.",
          "Revisión clínica (" + IOC + ")", "revision", SI("colageno")),
        R("precaucion", "La L-carnitina apenas mejora el rendimiento. Si toma acenocumarol (Sintrom) o warfarina, puede subir el INR: avise y adelante el siguiente control.",
          "Revisión clínica (casos publicados con acenocumarol)", "revision", SI("carnitina")),
        R("precaucion", "Arginina y citrulina dilatan los vasos y bajan algo la tensión. No las combine con nitratos para el corazón ni con sildenafilo o tadalafilo sin consultar. Tras un infarto, la arginina no se recomienda.",
          "Revisión clínica (ensayo VINTAGE MI 2006)", "revision", SI("arginina_citrulina")),
    ],
    "aerobico": [
        R("info", "La cafeína sube un poco el pulso en reposo y en esfuerzo: si se guía por pulsómetro, sus zonas saldrán algo más altas. Con calor, baje la dosis y beba más agua.",
          "ISSN cafeína 2021", "guia", SI("cafeina")),
        R("info", "Pruebe el bicarbonato primero en un entrenamiento, nunca el día de una competición: las molestias de tripa pueden obligarle a parar.",
          "ISSN bicarbonato 2021", "guia", SI("bicarbonato_ergogenico")),
        R("info", "Los nitratos de la remolacha ayudan algo en esfuerzos de resistencia de 10 a 40 minutos. Tómelos 2 o 3 horas antes; el efecto es mayor en personas poco entrenadas.",
          AIS + " (grupo A)", "guia", SI("nitrato_remolacha")),
    ],
    "fuerza": [
        R("info", "La creatina ayuda a ganar fuerza y músculo cuando se combina con entrenamiento de fuerza, también en mayores. Es normal ganar 1 o 2 kg de agua en el músculo las primeras semanas.",
          "ISSN position stand creatina 2017", "guia", SI("creatina")),
        R("info", "Tras la sesión de fuerza, una toma de 20 a 40 g de proteína (comida o batido) ayuda a recuperar. En mayores conviene la parte alta.",
          "ISSN proteína 2017", "guia", SI("proteina_suplemento")),
    ],
    "equilibrio": [],
    "fuentes": ["ISSN position stand creatine 2017", "ISSN caffeine 2021", "ISSN protein 2017", "ISSN beta-alanine 2015", "ISSN sodium bicarbonate 2021", "ISSN HMB 2013", AIS, IOC],
    "combinable": True,
})

# ---------------------------------------------------------------- 2. Vitaminas y minerales sueltos
clases.append({
    "id": "vitaminas_minerales_sueltos", "tipo": "suplemento",
    "nombre": "Vitaminas y minerales sueltos (zinc, vitamina E, vitamina K, vitamina B6)",
    "atc": [],
    "resumen": "Son útiles si hay una carencia. A dosis altas o durante meses pueden dar problemas: la vitamina K anula el efecto del acenocumarol, la vitamina E suma sangrado, el zinc hace perder cobre y el exceso de vitamina B6 daña los nervios.",
    "senales": [],
    "principios": [
        P("zinc", "Zinc", umbral=25, presets=[10, 15, 25]),
        P("vitamina_e", "Vitamina E (tocoferol)", alias=["Tocoferol", "Vitamin E"], umbral=300),
        P("vitamina_k", "Vitamina K (K1 o K2, menaquinona)", alias=["Vitamina K2", "Menaquinona", "MK-7", "Vitamin K"]),
        P("vitamina_b6", "Vitamina B6 (piridoxina)", alias=["Piridoxina", "Pyridoxine", "Vitamin B6"], umbral=12),
    ],
    "general": [
        R("precaucion", "El zinc impide que se absorban algunos antibióticos (ciprofloxacino, levofloxacino, doxiciclina): tómelo al menos 2 horas antes o de 4 a 6 horas después. Tomado durante meses por encima de 25 mg al día hace perder cobre, con anemia y hormigueos.",
          "FT AEMPS 4.5 (quinolonas, tetraciclinas) · EFSA (nivel máximo de zinc)", "ft", SI("zinc")),
        R("precaucion", "Por encima de 300 mg al día (unas 450 UI), la vitamina E puede aumentar el sangrado si toma anticoagulantes o antiagregantes. No ha demostrado proteger el corazón ni mejorar el rendimiento.",
          "EFSA (nivel máximo de vitamina E) · NIH ODS (vitamina E)", "guia", SI("vitamina_e")),
        R("precaucion", "Si toma acenocumarol (Sintrom) o warfarina, no empiece ni deje la vitamina K por su cuenta: anula su efecto y el INR baja. Muchos productos para los huesos llevan vitamina K2. Con apixabán, rivaroxabán, edoxabán o dabigatrán no interfiere.",
          "FT AEMPS 4.5 (acenocumarol)", "ft", SI("vitamina_k")),
        R("info", "La vitamina B6 en dosis altas durante meses (por encima de 12 mg al día) puede dañar los nervios: hormigueo, entumecimiento y peor equilibrio. Revise la etiqueta: algunos complejos vitamínicos llevan mucho más.",
          "EFSA 2023 (nivel máximo de vitamina B6)", "guia", SI("vitamina_b6")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [
        R("precaucion", "Con dosis altas de vitamina B6, vigile hormigueos o torpeza en pies y manos. Si aparecen, déjela y consulte; mientras tanto, haga los ejercicios de equilibrio con un apoyo cerca.",
          "EFSA 2023 (nivel máximo de vitamina B6)", "guia", SI("vitamina_b6", dosis="alta")),
    ],
    "fuentes": ["EFSA, niveles máximos tolerables de vitaminas y minerales", "NIH Office of Dietary Supplements"],
    "combinable": True,
})

# ---------------------------------------------------------------- 3. Hipérico
clases.append({
    "id": "hiperico", "tipo": "planta",
    "nombre": "Hipérico (hierba de San Juan)",
    "atc": [],
    "resumen": "Planta para el ánimo con muchas interacciones. Hace que el cuerpo elimine antes muchos fármacos, que así pierden efecto: por ejemplo, los anticoagulantes y los anticonceptivos. Con antidepresivos puede dar un exceso de serotonina.",
    "senales": ["serotoninergico", "fotosensibilidad"],
    "principios": [
        P("hiperico", "Hipérico (hierba de San Juan)", alias=["Hierba de San Juan", "Hypericum", "Corazoncillo", "St John's wort"], sinonimos=["hypericum perforatum"]),
    ],
    "general": [
        R("alerta", "El hipérico reduce el efecto de muchos fármacos: anticoagulantes, anticonceptivos (riesgo de embarazo), inmunosupresores de trasplante, antivirales, digoxina y algunos fármacos del cáncer y del corazón. Antes de tomarlo, consulte. Si ya lo toma, no lo deje de golpe sin avisar: los niveles de sus otros fármacos subirían.",
          HMPC + " (hipérico) 4.5", "guia"),
        R("precaucion", "Con antidepresivos como la sertralina, con triptanes o con tramadol puede dar un exceso de serotonina. Los signos son temblor, sudor, fiebre y agitación. No los mezcle sin que se lo indique su médico.",
          HMPC + " (hipérico) 4.5", "guia"),
    ],
    "aerobico": [
        R("info", "El hipérico aumenta la sensibilidad de la piel al sol. Si entrena al aire libre, use protector solar alto y ropa que cubra, sobre todo en las horas centrales del día.",
          HMPC + " (hipérico) 4.4", "guia"),
    ],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Hypericum perforatum L., herba)"],
    "combinable": True,
})

# ---------------------------------------------------------------- 4. Plantas sedantes
clases.append({
    "id": "plantas_sedantes", "tipo": "planta",
    "nombre": "Plantas para dormir o calmar (valeriana, pasiflora, melisa, tila, lúpulo, amapola de California)",
    "atc": [],
    "resumen": "Dan una sedación leve que se suma a la de los fármacos para dormir, la ansiedad o el dolor, y a la del alcohol. Lo importante es no mezclarlas con otros sedantes sin consultar y cuidar el equilibrio por la mañana.",
    "senales": ["sedacion"],
    "principios": [
        P("valeriana", "Valeriana", alias=["Valeriana officinalis", "Valerian"], sinonimos=["valeriana officinalis"]),
        P("pasiflora", "Pasiflora", alias=["Passiflora", "Flor de la pasión", "Passionflower"], sinonimos=["passiflora incarnata"]),
        P("melisa", "Melisa (toronjil)", alias=["Toronjil", "Melissa", "Lemon balm"], sinonimos=["melissa officinalis"]),
        P("tila", "Tila (tilo)", alias=["Tilo", "Infusión de tila", "Linden"]),
        P("lupulo", "Lúpulo", alias=["Humulus lupulus", "Hops"]),
        P("amapola_california", "Amapola de California (eschscholzia)", alias=["Eschscholzia"]),
    ],
    "general": [
        R("precaucion", "Estas plantas suman su efecto al de los fármacos para dormir o para la ansiedad (lorazepam, zolpidem…), los antihistamínicos que dan sueño, los opioides, los antiepilépticos y el alcohol. No las añada a esos fármacos sin consultar. Si las toma de noche, compruebe que por la mañana está despejado antes de conducir o entrenar.",
          HMPC + " (valeriana, pasiflora, melisa) 4.5/4.7", "guia"),
        R("info", "Son de las plantas más seguras. La valeriana puede tardar unas semanas en notarse. Una infusión de tila o melisa por la noche no suele dar problemas.",
          HMPC + " (valeriana, tila, melisa)", "guia"),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [
        R("precaucion", "Si las toma por la noche, evite los ejercicios de equilibrio exigentes a primera hora de la mañana y hágalos con un apoyo cerca. En mayores, sumadas a otros sedantes aumentan las caídas.",
          "Revisión clínica", "revision"),
    ],
    "fuentes": [HMPC + " (Valerianae radix, Passiflorae herba, Melissae folium, Tiliae flos, Lupuli flos)"],
    "combinable": True,
})

# ---------------------------------------------------------------- 5. CBD
clases.append({
    "id": "cbd", "tipo": "planta",
    "nombre": "CBD de venta libre (aceites y cápsulas de cannabidiol)",
    "atc": [],
    "resumen": "El CBD de venta libre no es inocuo: da somnolencia, puede alterar las enzimas del hígado y cambia los niveles de varios fármacos. Los productos no siempre llevan lo que dice la etiqueta y algunos contienen THC.",
    "senales": ["sedacion", "dopaje", "hepatotoxico"],
    "principios": [
        P("cbd", "CBD (aceite de cannabidiol de venta libre)", alias=["Aceite de CBD", "CBD", "Cannabidiol (venta libre)"]),
    ],
    "general": [
        R("precaucion", "El CBD aumenta el efecto de los sedantes, los opioides y el alcohol. Sube los niveles de tacrolimus y everolimus, puede subir el INR con acenocumarol o warfarina y, con valproato, aumenta el riesgo de daño en el hígado. Si toma alguno de ellos, consulte antes.",
          "FT AEMPS Epidyolex (cannabidiol) 4.4/4.5 · casos publicados (warfarina)", "ft"),
        R("info", "El CBD de venta libre no se controla como un medicamento: la cantidad real puede ser distinta de la etiqueta y algunos productos llevan THC, que da positivo en un control antidopaje y afecta a la conducción.",
          "AMA/WADA, lista de prohibiciones (S8 cannabinoides)", "guia"),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": ["Ficha técnica de Epidyolex (cannabidiol)", "AMA/WADA, lista de prohibiciones"],
    "combinable": True,
})

# ---------------------------------------------------------------- 6. Plantas que suman sangrado
clases.append({
    "id": "plantas_antiagregantes", "tipo": "planta",
    "nombre": "Plantas que pueden sumar sangrado (ginkgo, ajo, jengibre, cúrcuma, sauce, harpagofito)",
    "atc": [],
    "resumen": "Pueden frenar un poco las plaquetas. Solas apenas tienen importancia, pero junto a un anticoagulante, un antiagregante o un antiinflamatorio aumentan los hematomas y el sangrado.",
    "senales": [],
    "principios": [
        P("ginkgo", "Ginkgo biloba", alias=["Ginkgo"], senales=["sangrado"], sinonimos=["ginkgo biloba"]),
        P("ajo_suplemento", "Ajo en cápsulas o extracto", alias=["Ajo negro", "Aceite de ajo", "Allium sativum", "Garlic"]),
        P("jengibre", "Jengibre (cápsulas o extracto)", alias=["Zingiber", "Ginger"]),
        P("curcuma", "Cúrcuma / curcumina", alias=["Curcumina", "Turmeric"], senales=["hepatotoxico"]),
        P("sauce", "Corteza de sauce (salicina)", alias=["Sauce blanco", "Salicina", "Salix", "Willow bark"]),
        P("harpagofito", "Harpagofito (garra del diablo)", alias=["Garra del diablo", "Harpagophytum", "Devil's claw"]),
    ],
    "general": [
        R("precaucion", "Si toma anticoagulantes (Sintrom, apixabán, rivaroxabán…), antiagregantes (aspirina, clopidogrel) o antiinflamatorios, consulte antes de tomar estas plantas en cápsulas o extractos. Avise si va a operarse o a sacarse una muela: suele indicarse dejarlas unas 2 semanas antes. Como condimento en la comida no hay problema.",
          HMPC + " (ginkgo, ajo, jengibre, cúrcuma, sauce) 4.4/4.5 · ASA (suplementos antes de la cirugía)", "guia"),
        R("info", "El ginkgo no ha demostrado mejorar la memoria ni prevenir la demencia en personas sanas. Si tiene epilepsia, consulte antes de tomarlo.",
          HMPC + " (ginkgo) 4.4 · ensayo GEM 2008", "guia", SI("ginkgo")),
        R("precaucion", "Se han descrito casos de daño en el hígado con cápsulas de cúrcuma, sobre todo las de alta absorción (con piperina o pimienta negra). Si nota cansancio intenso, orina oscura o color amarillo en la piel o los ojos, déjela y consulte.",
          "LiverTox (NIH), cúrcuma · notificaciones de hepatitis (Italia, 2019)", "base", SI("curcuma")),
        R("precaucion", "La corteza de sauce contiene salicilatos, parientes de la aspirina. No la tome si es alérgico a la aspirina o tiene asma que empeora con antiinflamatorios, ni junto con aspirina, otros antiinflamatorios o anticoagulantes.",
          HMPC + " (corteza de sauce) 4.3/4.5", "guia", SI("sauce")),
        R("precaucion", "El harpagofito puede irritar el estómago: no lo tome si tiene úlcera o mucha acidez, ni junto con antiinflamatorios o corticoides sin consultar. Con anticoagulantes se han descrito hematomas.",
          HMPC + " (harpagofito) 4.3/4.4", "guia", SI("harpagofito")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Ginkgo folium, Allii sativi bulbus, Zingiberis rhizoma, Curcumae longae rhizoma, Salicis cortex, Harpagophyti radix)", "LiverTox (NIH)"],
    "combinable": True,
})

# ---------------------------------------------------------------- 7. Regaliz y laxantes de plantas
clases.append({
    "id": "plantas_potasio", "tipo": "planta",
    "nombre": "Regaliz y laxantes de plantas (sen, cáscara sagrada, frángula, aloe)",
    "atc": [],
    "resumen": "Hacen perder potasio. Con diuréticos, corticoides o digoxina el potasio puede bajar tanto que aparezcan calambres, debilidad o arritmias, más aún si suda mucho al hacer ejercicio. El regaliz además sube la tensión.",
    "senales": ["hipopotasemia"],
    "principios": [
        P("regaliz", "Regaliz (raíz, extracto o regaliz negro)", alias=["Regaliz de palo", "Palo dulce", "Orozuz", "Glycyrrhiza", "Licorice", "Liquorice"], senales=["hipertension"], sinonimos=["glycyrrhiza glabra"]),
        P("laxantes_plantas", "Laxantes de plantas (sen, cáscara sagrada, frángula, aloe)", alias=["Sen", "Sena", "Hojas de sen", "Cáscara sagrada", "Frángula", "Aloe (látex)", "Senna"], senales=["deshidratacion"],
          sinonimos=["cassia angustifolia", "rhamnus frangula", "rhamnus frangula l", "rhamnus purshiana", "rhamnus purshiana dc", "cascara sagrada", "aloe ferox", "senosidos"]),
    ],
    "general": [
        R("precaucion", "El regaliz retiene sal y agua, sube la tensión y baja el potasio, incluso a dosis moderadas si se toma a diario. No lo tome si tiene hipertensión o enfermedad del corazón o del riñón, ni junto con diuréticos, corticoides o digoxina. No pase de 4 semanas seguidas.",
          HMPC + " (raíz de regaliz) 4.3/4.4/4.5 · SCF 2003 (ácido glicirrícico)", "guia", SI("regaliz")),
        R("precaucion", "Use los laxantes de plantas solo unos días (no más de 1 o 2 semanas) y no a diario. Tomados de forma continuada bajan el potasio, sobre todo con diuréticos, corticoides o regaliz, y son peligrosos si toma digoxina o fármacos para el ritmo del corazón. Si necesita un laxante a menudo, mejor fibra, agua y movimiento.",
          HMPC + " (sen, frángula, cáscara sagrada) 4.2/4.4/4.5", "guia", SI("laxantes_plantas")),
    ],
    "aerobico": [
        R("precaucion", "Si suda mucho (calor, sesiones largas), la pérdida de potasio se suma. Si tiene calambres que no ceden, debilidad o palpitaciones, pare y consulte: puede ser el potasio bajo.",
          "Revisión clínica", "revision"),
    ],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Liquiritiae radix, Sennae folium, Frangulae cortex, Rhamni purshianae cortex, Aloe)", "SCF 2003, ácido glicirrícico"],
    "combinable": True,
})

# ---------------------------------------------------------------- 8. Plantas diuréticas
clases.append({
    "id": "plantas_diureticas", "tipo": "planta",
    "nombre": "Plantas diuréticas (cola de caballo, diente de león, abedul, ortosifón)",
    "atc": [],
    "resumen": "Aumentan la orina. Con calor y ejercicio favorecen la deshidratación, suman su efecto al de los diuréticos y pueden subir el litio en sangre.",
    "senales": ["deshidratacion"],
    "principios": [
        P("plantas_diureticas", "Planta diurética (cola de caballo, diente de león, abedul, ortosifón)", alias=["Cola de caballo", "Diente de león", "Abedul", "Ortosifón", "Té de Java", "Equisetum", "Drenante", "Horsetail", "Dandelion"],
          sinonimos=["equisetum arvense", "taraxacum officinale", "betula pendula", "orthosiphon stamineus"]),
    ],
    "general": [
        R("precaucion", "No las tome si tiene edemas por enfermedad del corazón o del riñón, ni junto con litio (puede subir hasta niveles tóxicos) o con diuréticos sin consultar. Los 'drenantes' para adelgazar solo hacen perder agua, no grasa.",
          HMPC + " (cola de caballo, abedul, ortosifón) 4.3/4.4 · casos publicados con litio", "guia"),
    ],
    "aerobico": [
        R("precaucion", "Beba antes, durante y después del ejercicio, sobre todo con calor. Si la orina es muy oscura o escasa, o se marea al levantarse, está deshidratado.",
          "ACSM 2007 (reposición de líquidos en el ejercicio)", "guia"),
    ],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Equiseti herba, Taraxaci folium, Betulae folium, Orthosiphonis folium)"],
    "combinable": True,
})

# ---------------------------------------------------------------- 9. Suplementos para el azúcar
clases.append({
    "id": "suplementos_glucosa", "tipo": "planta",
    "nombre": "Suplementos para el azúcar (berberina, canela, cromo)",
    "atc": [],
    "resumen": "Se venden para bajar el azúcar. Si ya toma fármacos para la diabetes pueden sumar su efecto y provocar bajadas, más aún al hacer ejercicio. No sustituyen al tratamiento.",
    "senales": [],
    "principios": [
        P("berberina", "Berberina", alias=["Berberis"]),
        P("canela", "Canela en cápsulas (cassia)", alias=["Canela de China", "Cinnamomum cassia", "Cinnamon"]),
        P("cromo", "Cromo (picolinato de cromo)", alias=["Picolinato de cromo", "Chromium"], tipo="suplemento"),
    ],
    "general": [
        R("precaucion", "Si se inyecta insulina o toma gliclazida, glimepirida o repaglinida, estos suplementos pueden sumar su efecto. Mida la glucosa más a menudo las primeras semanas y lleve azúcar cuando entrene. No deje su tratamiento por ellos.",
          "NIH ODS (cromo) · NCCIH (canela, berberina)", "base"),
        R("precaucion", "La berberina hace que algunos fármacos se acumulen, como la ciclosporina o el tacrolimus. Da molestias de estómago y estreñimiento. Consulte antes si toma medicación a diario.",
          "Revisión clínica (estudios con ciclosporina) · NCCIH", "revision", SI("berberina")),
        R("info", "La canela cassia en cápsulas lleva cumarina, que a dosis altas puede dañar el hígado. Como especia en la comida no hay problema; si toma cápsulas, mejor canela de Ceilán.",
          "EFSA 2008 (cumarina)", "guia", SI("canela")),
        R("info", "El cromo puede reducir la absorción de la levotiroxina: sepárelos 3 o 4 horas.",
          "NIH ODS (cromo)", "base", SI("cromo")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": ["NIH Office of Dietary Supplements", "NCCIH", "EFSA 2008, cumarina"],
    "combinable": True,
})

# ---------------------------------------------------------------- 10. Adaptógenas
clases.append({
    "id": "plantas_adaptogenas", "tipo": "planta",
    "nombre": "Plantas energizantes y adaptógenas (ginseng, rhodiola, ashwagandha)",
    "atc": [],
    "resumen": "Se venden contra el cansancio o el estrés. El ginseng puede acelerar el pulso y quitar el sueño; la ashwagandha da sueño, puede alterar el tiroides y se ha relacionado con casos de daño en el hígado.",
    "senales": [],
    "principios": [
        P("ginseng", "Ginseng (Panax)", alias=["Ginseng coreano", "Ginseng rojo", "Panax ginseng", "Ginseng siberiano (eleuterococo)"], senales=["taquicardia"], sinonimos=["panax ginseng"]),
        P("rhodiola", "Rhodiola rosea", alias=["Rodiola", "Rhodiola"]),
        P("ashwagandha", "Ashwagandha (withania)", alias=["Withania somnifera", "Ginseng indio"], senales=["sedacion", "hepatotoxico"]),
    ],
    "general": [
        R("precaucion", "El ginseng puede dar nerviosismo, insomnio y palpitaciones, sobre todo con café, pre-entrenos u otros estimulantes. Puede bajar el azúcar si toma fármacos para la diabetes y restar efecto a la warfarina o el acenocumarol. No lo tome por la tarde.",
          HMPC + " (ginseng) 4.4/4.5 · NCCIH", "guia", SI("ginseng")),
        R("info", "La rhodiola se tolera bien y no tiene interacciones relevantes conocidas; su efecto sobre el cansancio es modesto. Puede dar algo de nerviosismo o insomnio si se toma por la tarde.",
          HMPC + " (rhodiola)", "guia", SI("rhodiola")),
        R("precaucion", "La ashwagandha da sueño y se suma a otros sedantes. Puede subir las hormonas del tiroides: no la tome con levotiroxina o fármacos para el tiroides sin control. Se han descrito casos de daño en el hígado. No la tome en el embarazo ni con inmunosupresores.",
          "LiverTox (NIH), ashwagandha · NIH ODS", "base", SI("ashwagandha")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Ginseng radix, Rhodiolae roseae rhizoma)", "LiverTox (NIH)"],
    "combinable": True,
})

# ---------------------------------------------------------------- 11. Menopausia
clases.append({
    "id": "plantas_menopausia", "tipo": "planta",
    "nombre": "Plantas para la menopausia (isoflavonas de soja, trébol rojo, cimicífuga)",
    "atc": [],
    "resumen": "Tienen un efecto hormonal suave. Las isoflavonas pueden restar absorción a la levotiroxina y no se recomiendan tras un cáncer de mama sin consultar; la cimicífuga se ha relacionado con casos de daño en el hígado.",
    "senales": [],
    "principios": [
        P("isoflavonas", "Isoflavonas de soja o trébol rojo", alias=["Soja (isoflavonas)", "Trébol rojo", "Fitoestrógenos", "Genisteína", "Soy isoflavones", "Red clover"]),
        P("cimicifuga", "Cimicífuga (black cohosh)", alias=["Black cohosh", "Actaea racemosa", "Cimicifuga racemosa"], senales=["hepatotoxico"], sinonimos=["cimicifuga racemosa"]),
    ],
    "general": [
        R("precaucion", "Si toma levotiroxina, separe las isoflavonas al menos 4 horas. Si ha tenido cáncer de mama o toma tamoxifeno o un inhibidor de la aromatasa, no las tome sin consultarlo con su oncólogo.",
          "EFSA 2015 (isoflavonas en la posmenopausia) · FT AEMPS 4.5 (levotiroxina)", "guia", SI("isoflavonas")),
        R("precaucion", "Se han descrito casos de daño en el hígado. No la tome si tiene una enfermedad del hígado; déjela y consulte si nota cansancio intenso, orina oscura o piel u ojos amarillos. Tras un cáncer de mama, consulte antes.",
          HMPC + " (cimicífuga) 4.4", "guia", SI("cimicifuga")),
    ],
    "aerobico": [],
    "fuerza": [
        R("info", "Ninguna de estas plantas protege el hueso. En la menopausia, lo que lo fortalece es el ejercicio de fuerza y de impacto, con calcio y vitamina D suficientes.",
          "Revisión clínica", "revision"),
    ],
    "equilibrio": [],
    "fuentes": [HMPC + " (Cimicifugae rhizoma)", "EFSA 2015, isoflavonas"],
    "combinable": True,
})

# ---------------------------------------------------------------- 12. Defensas
clases.append({
    "id": "plantas_inmunes", "tipo": "planta",
    "nombre": "Equinácea, propóleo y jalea real",
    "atc": [],
    "resumen": "Se toman 'para las defensas'. La equinácea no conviene con enfermedades autoinmunes ni con fármacos que bajan las defensas; el propóleo y la jalea real pueden dar alergias graves, sobre todo con asma.",
    "senales": [],
    "principios": [
        P("equinacea", "Equinácea", alias=["Echinacea"], sinonimos=["echinacea purpurea", "echinacea purpurea tintura parte aerea", "echinacea purpurea tintura raiz"]),
        P("propoleo_jalea", "Propóleo / jalea real", alias=["Propóleo", "Própolis", "Jalea real", "Propolis", "Royal jelly"]),
    ],
    "general": [
        R("precaucion", "No tome equinácea si tiene una enfermedad de las defensas, como artritis reumatoide, lupus o esclerosis múltiple. Tampoco si toma fármacos que bajan las defensas o si es alérgico a la margarita o la manzanilla. No pase de 10 días seguidos.",
          HMPC + " (equinácea) 4.2/4.3/4.4", "guia", SI("equinacea")),
        R("precaucion", "El propóleo y la jalea real pueden provocar alergias e incluso crisis de asma graves. Si tiene alergia al polen, a las picaduras de abeja o a la miel, no los tome.",
          "NCCIH (propóleo, jalea real) · casos de anafilaxia publicados", "base", SI("propoleo_jalea")),
        R("alerta", "Tiene asma o EPOC: evite el propóleo y la jalea real. Se han descrito crisis de asma graves con ellos.",
          "NCCIH (jalea real) · casos de anafilaxia publicados", "base", SI("propoleo_jalea", condicion="epoc_asma")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": [HMPC + " (Echinaceae purpureae herba)", "NCCIH"],
    "combinable": True,
})

# ---------------------------------------------------------------- 13. Adelgazantes
clases.append({
    "id": "productos_adelgazantes", "tipo": "suplemento",
    "nombre": "Productos para adelgazar y quemagrasas (sinefrina, té verde concentrado, fucus, glucomanano, garcinia, yohimbina)",
    "atc": [],
    "resumen": "Su eficacia es escasa y algunos no son seguros. Los estimulantes (sinefrina, yohimbina) suben el pulso y la tensión; el té verde concentrado y la garcinia pueden dañar el hígado; el fucus lleva mucho yodo.",
    "senales": [],
    "principios": [
        P("sinefrina", "Sinefrina (naranja amarga)", alias=["Naranja amarga", "Citrus aurantium", "Quemagrasas", "Termogénico", "Bitter orange", "Fat burner"], senales=["taquicardia", "hipertension"]),
        P("te_verde_extracto", "Extracto de té verde (EGCG)", alias=["Té verde en cápsulas", "EGCG", "Camellia sinensis", "Green tea extract"], senales=["hepatotoxico"]),
        P("fucus", "Fucus y algas ricas en yodo (kelp)", alias=["Fucus vesiculosus", "Kelp", "Alga kombu", "Bladderwrack"], sinonimos=["fucus vesiculosus", "fucus vesiculosus exto seco"]),
        P("glucomanano", "Glucomanano y fibras saciantes", alias=["Konjac", "Goma guar"]),
        P("garcinia", "Garcinia cambogia", alias=["Garcinia"], senales=["hepatotoxico"]),
        P("yohimbina", "Yohimbina (yohimbe)", alias=["Yohimbe"], senales=["taquicardia", "hipertension"]),
    ],
    "general": [
        R("info", "La AEMPS detecta a menudo productos 'naturales' para adelgazar con fármacos ocultos (sibutramina, diuréticos, laxantes…). Desconfíe de los que prometen resultados rápidos y compre en farmacia o marcas con control de calidad.",
          "AEMPS (alertas de productos ilegales)", "guia"),
        R("precaucion", "La sinefrina sube el pulso y la tensión, más aún con cafeína. No la tome si tiene hipertensión, arritmias o enfermedad del corazón, ni con antidepresivos IMAO, estimulantes o descongestionantes. Se han descrito infartos e ictus en personas jóvenes.",
          "Revisión clínica (casos publicados)", "revision", SI("sinefrina")),
        R("alerta", "La yohimbina está prohibida en los alimentos y complementos de la UE por sus riesgos: sube la tensión y el pulso, da ansiedad y se suma a antidepresivos y estimulantes. No la tome.",
          "Reglamento (UE) 2019/650 (yohimbe)", "guia", SI("yohimbina")),
        R("precaucion", "En cápsulas o extractos concentrados, el té verde puede dañar el hígado, sobre todo en ayunas o por encima de 800 mg de EGCG al día. También lleva cafeína. Como bebida, unas tazas al día no plantean problema.",
          "EFSA 2018 (catequinas del té verde) · Reglamento (UE) 2022/2340", "guia", SI("te_verde_extracto")),
        R("precaucion", "Se han descrito casos de daño grave en el hígado con garcinia, y su efecto sobre el peso es mínimo. No la tome si tiene una enfermedad del hígado o toma fármacos que lo cargan.",
          "LiverTox (NIH), garcinia", "base", SI("garcinia")),
        R("precaucion", "El fucus y algas como el kelp llevan mucho yodo y pueden alterar el tiroides (por exceso o por defecto). No los tome si tiene problemas de tiroides o toma levotiroxina, amiodarona o litio.",
          "NIH ODS (yodo)", "base", SI("fucus")),
        R("info", "Tome el glucomanano con un vaso grande de agua: en seco puede atascarse en la garganta. Retrasa la absorción de otros fármacos; sepárelo al menos 2 horas, sobre todo de la levotiroxina, la digoxina y los fármacos para la diabetes.",
          "Reglamento (UE) 432/2012 (advertencia del glucomanano) · Revisión clínica", "guia", SI("glucomanano")),
    ],
    "aerobico": [
        R("precaucion", "Con estimulantes para adelgazar, evite el ejercicio intenso y con calor: el pulso y la tensión suben más de lo normal. Si nota palpitaciones, dolor en el pecho o mareo, pare.",
          "Revisión clínica", "revision", SI("sinefrina")),
        R("precaucion", "Con estimulantes para adelgazar, evite el ejercicio intenso y con calor: el pulso y la tensión suben más de lo normal. Si nota palpitaciones, dolor en el pecho o mareo, pare.",
          "Revisión clínica", "revision", SI("yohimbina")),
    ],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": ["EFSA 2018, catequinas del té verde", "Reglamento (UE) 2019/650", "Reglamento (UE) 2022/2340", "Reglamento (UE) 432/2012", "LiverTox (NIH)", "NIH ODS"],
    "combinable": True,
})

# ---------------------------------------------------------------- 14. Prohormonas
clases.append({
    "id": "suplementos_hormonales", "tipo": "suplemento",
    "nombre": "Prohormonas y potenciadores de testosterona (DHEA, SARMs, tribulus)",
    "atc": [],
    "resumen": "Riesgo real de positivo en un control antidopaje y de efectos sobre las hormonas, el hígado y el corazón. Muchos productos llevan anabolizantes que no figuran en la etiqueta.",
    "senales": ["dopaje"],
    "principios": [
        P("prohormonas_dhea", "DHEA, prohormonas y SARMs", alias=["DHEA", "Prohormonas", "Androstenediona", "SARMs", "Ostarina"], senales=["hepatotoxico", "hipertension"]),
        P("tribulus", "Tribulus terrestris y boosters de testosterona", alias=["Tribulus", "Booster de testosterona", "Testosterone booster"]),
    ],
    "general": [
        R("alerta", "DHEA, prohormonas y SARMs están prohibidos en el deporte con licencia, en cualquier momento. Pueden dañar el hígado, subir la tensión y el colesterol, frenar sus propias hormonas y aumentar el riesgo de trombosis. No los tome; si ya lo hace, dígaselo a su médico para controlarlo.",
          "AMA/WADA, lista de prohibiciones (S1 anabolizantes) · " + AIS + " (grupo D)", "guia", SI("prohormonas_dhea")),
        R("precaucion", "El tribulus y los 'boosters' no suben la testosterona de forma útil y están entre los productos con más riesgo de llevar anabolizantes ocultos. Si compite, evítelos.",
          AIS + " (grupo D) · " + IOC, "guia", SI("tribulus")),
    ],
    "aerobico": [],
    "fuerza": [],
    "equilibrio": [],
    "fuentes": ["AMA/WADA, lista de prohibiciones", AIS, IOC],
    "combinable": True,
})

# ---------------------------------------------------------------- 15. Levadura roja y Q10
clases.append({
    "id": "suplementos_colesterol", "tipo": "suplemento",
    "nombre": "Levadura roja de arroz y coenzima Q10",
    "atc": [],
    "resumen": "La levadura roja contiene monacolina K, la misma molécula que la lovastatina: es una estatina 'natural' con sus mismos riesgos. La coenzima Q10 es segura, aunque no ha demostrado evitar el dolor muscular de las estatinas.",
    "senales": [],
    "principios": [
        P("levadura_roja", "Levadura roja de arroz (monacolina K)", alias=["Monacolina", "Arroz de levadura roja", "Red yeast rice"], senales=["miopatia", "estatina"]),
        P("coenzima_q10", "Coenzima Q10 (ubiquinona, ubiquinol)", alias=["CoQ10", "Q10", "Ubiquinol", "Ubidecarenona"]),
    ],
    "general": [
        R("precaucion", "No tome levadura roja junto con una estatina: sería duplicar el mismo fármaco. Tiene sus mismos riesgos (daño muscular y del hígado) y sus mismas interacciones (claritromicina, antifúngicos, pomelo, fibratos). En la UE no puede pasar de 3 mg de monacolinas al día.",
          "Reglamento (UE) 2022/860 (monacolinas) · EFSA 2018", "guia", SI("levadura_roja")),
        R("info", "La coenzima Q10 se tolera bien. Puede bajar un poco la tensión y restar efecto al acenocumarol o la warfarina: si los toma, avise y adelante el control del INR.",
          "NCCIH (coenzima Q10) · casos publicados con warfarina", "base", SI("coenzima_q10")),
    ],
    "aerobico": [],
    "fuerza": [
        R("precaucion", "Como con las estatinas, si tras el ejercicio nota un dolor muscular desproporcionado, debilidad u orina oscura, pare y consulte.",
          "FT AEMPS 4.4 (lovastatina)", "ft", SI("levadura_roja")),
    ],
    "equilibrio": [],
    "fuentes": ["Reglamento (UE) 2022/860", "EFSA 2018, monacolinas", "NCCIH"],
    "combinable": True,
})

senales_nuevas = {
    "dopaje": "Riesgo de positivo en un control antidopaje (si compite con licencia)",
    "hepatotoxico": "Se ha relacionado con casos de daño en el hígado",
}

reglas_combinadas = [
    {"id": "dopaje_suplementos", "si": {"senal": "dopaje", "min": 1}, "nivel": "precaucion",
     "titulo": "Suplementos con riesgo en un control antidopaje",
     "texto": "Si compite con licencia federativa, usted responde de cualquier sustancia que aparezca en su control, aunque venga de un suplemento contaminado. Evite los productos señalados y use solo suplementos con control por lotes (Informed Sport, Kölner Liste o similar). Ante la duda, consulte la lista de la AMA o a su federación.",
     "ambitos": ["general"], "fuente": "AMA/WADA, Código Mundial Antidopaje · " + IOC, "evidencia": "guia", "revisado": False},
    {"id": "hepatotoxico_hepatopatia", "si": {"senal": "hepatotoxico", "min": 1, "condicion": "hepatopatia"}, "nivel": "alerta",
     "titulo": "Enfermedad del hígado y suplementos que pueden dañarlo",
     "texto": "Tiene una enfermedad del hígado y toma algún producto que se ha relacionado con casos de daño hepático (aparece señalado en su lista). No siga tomándolo sin consultar con su médico, y pida un control de las enzimas del hígado.",
     "ambitos": ["general"], "fuente": "LiverTox (NIH)", "evidencia": "base", "revisado": False},
    {"id": "hepatotoxico_multiple", "si": {"senal": "hepatotoxico", "min": 2}, "nivel": "precaucion",
     "titulo": "Varios productos que pueden cargar el hígado",
     "texto": "Toma {n} productos que se han relacionado con casos de daño en el hígado, y el riesgo se suma. Coméntelo con su médico. Señales de alarma: cansancio intenso, orina oscura y piel u ojos amarillos.",
     "ambitos": ["general"], "fuente": "LiverTox (NIH)", "evidencia": "base", "revisado": False},
]

# omega-3: alias de suplemento sobre el principio existente
parches = [
    {"id": "ezetimiba_otros_lipidos", "principios_add": [
        {"id": "omega3", "nombre": "Omega-3 (icosapento de etilo)", "marcas": ["Vazkepa", "Omacor"], "alias": ["Aceite de pescado", "Aceite de krill", "Omega 3 (suplemento)", "Fish oil"]}]},
]

out = {"nota": "Suplementos y plantas medicinales (v1.1). Reglas nuevas pendientes de revisión clínica (revisado=false).",
       "senales_nuevas": senales_nuevas, "clases": clases, "reglas_combinadas": reglas_combinadas, "clases_parche": parches}
dest = ROOT / "data/ext/11_suplementos_plantas.json"
if dest.exists() and dest.read_text(encoding="utf-8").count('"revisado": true') > 3 and "--forzar" not in sys.argv:
    sys.exit(f"{dest.name} ya tiene filas revisadas por el clínico (import_revision.py escribe en él): edite el JSON, no este script (o use --forzar).")
dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
n_p = sum(len(c["principios"]) for c in clases)
n_r = sum(len(c[a]) for c in clases for a in ("general", "aerobico", "fuerza", "equilibrio"))
print(f"{dest}: {len(clases)} clases, {n_p} principios, {n_r} reglas, {len(reglas_combinadas)} combinadas")
