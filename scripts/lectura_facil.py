#!/usr/bin/env python3
"""Lectura fácil (v1.0): reescritura de los textos del paciente peor puntuados por el índice INFLESZ (scripts/legibilidad.mjs),
manteniendo el contenido clínico: frases más cortas, verbos en lugar de sustantivos, menos paréntesis y siglas.
Idempotente: cada cambio se aplica en las fuentes (data/ext y app/data/kb.json) solo si el texto antiguo sigue ahí.
Uso: python3 scripts/lectura_facil.py [--simular]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_revision import Fuentes  # noqa: E402

# (clase, ámbito | "resumen", texto antiguo, texto nuevo)
CAMBIOS = [
    ("antiepilepticos_otros", "equilibrio", "Inestabilidad posible con lacosamida, perampanel y fenitoína: equilibrio con apoyo.", "Lacosamida, perampanel y fenitoína pueden hacerle perder el equilibrio. Haga los ejercicios de equilibrio con un apoyo cerca."),
    ("estimulantes_tdah", "aerobico", "Indicado. En competición, consulte la normativa antidopaje (requieren autorización de uso terapéutico).", "Puede hacer ejercicio aeróbico. Si compite, consulte la normativa antidopaje: estos fármacos necesitan una autorización de uso terapéutico."),
    ("antiagregantes", "general", "Evite añadir antiinflamatorios (ibuprofeno, naproxeno) para el dolor muscular: paracetamol como primera opción.", "Para el dolor muscular no añada antiinflamatorios como ibuprofeno o naproxeno. La primera opción es el paracetamol."),
    ("tuberculostaticos", "resumen", "La rifampicina acelera el metabolismo de muchos fármacos (anticoagulantes, anticonceptivos, estatinas, antidiabéticos). La pirazinamida sube el ácido úrico y la isoniazida puede dañar el hígado.", "La rifampicina hace que muchos fármacos pierdan efecto: anticoagulantes, anticonceptivos, estatinas y antidiabéticos. La pirazinamida sube el ácido úrico. La isoniazida puede dañar el hígado."),
    ("macrolidos", "fuerza", "Si toma estatina, cargas ligeras durante el tratamiento con claritromicina/eritromicina.", "Si toma una estatina, use cargas ligeras mientras dure el tratamiento con claritromicina o eritromicina."),
    ("antiparkinsonianos_otros", "resumen", "Complementos de la levodopa. Amantadina y biperideno tienen efectos anticolinérgicos (confusión, calor); rotigotina (parche) y safinamida se parecen a los agonistas dopaminérgicos.", "Complementan la levodopa. Amantadina y biperideno pueden dar confusión y calor. Rotigotina, en parche, y safinamida actúan como los agonistas dopaminérgicos."),
    ("relajantes_musculares", "aerobico", "Indicado a intensidad ligera-moderada, evitando el calor (tizanidina y ciclobenzaprina lo toleran peor).", "Puede hacer ejercicio aeróbico ligero o moderado. Evite el calor: con tizanidina y ciclobenzaprina se tolera peor."),
    ("broncodilatadores", "fuerza", "Muy recomendable, especialmente en EPOC (piernas y musculatura respiratoria).", "Muy recomendable, sobre todo si tiene EPOC. Trabaje las piernas y los músculos de la respiración."),
    ("bempedoico", "resumen", "Hipolipemiante sin efecto muscular (alternativa para intolerantes a estatinas). Sube el ácido úrico y puede favorecer tendinopatías raras.", "Baja el colesterol sin dañar el músculo; es una alternativa cuando las estatinas no se toleran. Sube el ácido úrico y, rara vez, puede dañar los tendones."),
    ("ic_nuevos", "fuerza", "Muy recomendable en insuficiencia cardíaca: cargas ligeras-moderadas, muchas repeticiones, sin apnea.", "Muy recomendable en la insuficiencia cardíaca. Use cargas ligeras o moderadas, con muchas repeticiones y sin aguantar la respiración."),
    ("antiepilepticos_otros", "resumen", "Complementan la lista de antiepilépticos. Zonisamida reduce la sudoración; perampanel y fenobarbital producen somnolencia y mareo; fenitoína y fenobarbital interfieren con muchos fármacos.", "Otros antiepilépticos. Zonisamida reduce el sudor. Perampanel y fenobarbital dan sueño y mareo. Fenitoína y fenobarbital alteran el efecto de muchos fármacos."),
    ("acetazolamida", "aerobico", "La capacidad de esfuerzo está reducida (acidosis): intensidad ligera-moderada.", "Con este fármaco se cansa antes, porque acidifica la sangre. Entrene a intensidad ligera o moderada."),
    ("antirretrovirales", "general", "Ritonavir y cobicistat bloquean el metabolismo de simvastatina y lovastatina (contraindicadas), atorvastatina (dosis baja), corticoides inhalados o intranasales como fluticasona y budesonida (síndrome de Cushing), y muchos otros. Cualquier fármaco nuevo, incluidos suplementos, debe revisarse con su médico de VIH.", "Ritonavir y cobicistat frenan la eliminación de muchos fármacos. Simvastatina y lovastatina están contraindicadas; atorvastatina solo a dosis baja. Los corticoides inhalados o nasales, como fluticasona y budesonida, pueden causar síndrome de Cushing. Consulte con su médico de VIH cualquier fármaco o suplemento nuevo."),
    ("antifungicos_azoles", "aerobico", "Sin limitación específica; reponga electrolitos en sesiones largas.", "Sin limitación específica. En sesiones largas, reponga agua y sales."),
    ("antifungicos_azoles", "general", "Voriconazol produce fotosensibilidad intensa y alteraciones visuales transitorias: protección solar estricta y cuidado al entrenar al aire libre.", "El voriconazol hace la piel muy sensible al sol y puede alterar la vista unos minutos. Protéjase del sol y tenga cuidado al entrenar al aire libre."),
    ("inmunoterapia_oncologica", "aerobico", "Indicado a intensidad ligera-moderada, con progresión según tolerancia.", "Puede hacer ejercicio aeróbico a intensidad ligera o moderada. Aumente poco a poco, según lo tolere."),
    ("macrolidos", "general", "Si toma estatinas (sobre todo simvastatina o atorvastatina), claritromicina y eritromicina multiplican el riesgo de daño muscular: evite el ejercicio de fuerza intenso durante el tratamiento y consulte ante dolor muscular generalizado.", "Si toma estatinas, sobre todo simvastatina o atorvastatina, la claritromicina y la eritromicina multiplican el riesgo de daño muscular. Mientras dure el tratamiento, evite la fuerza intensa. Consulte si nota dolor muscular por todo el cuerpo."),
    ("antianginosos_otros", "fuerza", "Cargas moderadas, sin apnea ni esfuerzos isométricos mantenidos.", "Use cargas moderadas. No aguante la respiración ni haga fuerza mantenida sin moverse."),
    ("inmunoterapia_oncologica", "fuerza", "Recomendable para conservar masa muscular durante el tratamiento.", "Recomendable: ayuda a conservar el músculo durante el tratamiento."),
    ("respiratorio_otros", "general", "Montelukast ayuda a prevenir el broncoespasmo por ejercicio; sin precauciones específicas.", "El montelukast ayuda a prevenir el broncoespasmo por ejercicio. No necesita precauciones especiales."),
    ("otros_antidepresivos", "resumen", "Antidepresivos sedantes, a menudo usados para dormir. Somnolencia matutina y, con trazodona, mareo al incorporarse.", "Antidepresivos que dan sueño; a menudo se usan para dormir. Pueden dar somnolencia por la mañana. Con trazodona, mareo al levantarse."),
    ("isglt2", "aerobico", "Indicado; especialmente beneficioso en insuficiencia cardíaca. Agua a mano en sesiones largas.", "Indicado, y especialmente beneficioso en la insuficiencia cardíaca. Lleve agua en las sesiones largas."),
    ("isrs_isrsn", "general", "Aumentan ligeramente el riesgo de sangrado; evite antiinflamatorios para el dolor muscular si además toma anticoagulantes o antiagregantes.", "Aumentan un poco el riesgo de sangrado. Si además toma anticoagulantes o antiagregantes, evite los antiinflamatorios para el dolor muscular."),
    ("antiepilepticos", "resumen", "Usados para epilepsia, dolor neuropático o ansiedad. Los efectos relevantes son mareo, inestabilidad y somnolencia, más marcados con pregabalina y gabapentina.", "Se usan para la epilepsia, el dolor de los nervios o la ansiedad. Pueden dar mareo, inestabilidad y sueño, sobre todo pregabalina y gabapentina."),
    ("tuberculostaticos", "general", "La rifampicina reduce el efecto de anticoagulantes, anticonceptivos, estatinas, antidiabéticos y muchos otros: no cambie ni añada ningún fármaco sin consultarlo.", "La rifampicina reduce el efecto de anticoagulantes, anticonceptivos, estatinas, antidiabéticos y muchos otros. No cambie ni añada ningún fármaco sin consultarlo."),
    ("otros_antidepresivos", "equilibrio", "Mareo postural (trazodona) y somnolencia: equilibrio con apoyo.", "La trazodona puede dar mareo al levantarse, y estos fármacos dan sueño. Haga el equilibrio con un apoyo cerca."),
    ("ezetimiba_otros_lipidos", "resumen", "Otros hipolipemiantes. Sin efectos relevantes sobre el ejercicio.", "Otros fármacos para el colesterol. No tienen efectos que importen para el ejercicio."),
    ("biologicos_jak", "aerobico", "Indicado; reduce la fatiga de las enfermedades inflamatorias.", "Indicado. Reduce el cansancio que producen las enfermedades inflamatorias."),
    ("macrolidos", "resumen", "Antibióticos que alargan el QT e interfieren con muchos fármacos (estatinas, anticoagulantes, colchicina). En uso crónico (EPOC, bronquiectasias) conviene tenerlo presente.", "Antibióticos que alargan el QT y alteran el efecto de muchos fármacos, como estatinas, anticoagulantes o colchicina. Si los toma de forma crónica, por EPOC o bronquiectasias, conviene tenerlo presente."),
    ("antiepilepticos", "equilibrio", "Pregabalina, gabapentina y carbamazepina pueden producir inestabilidad: trabaje el equilibrio con apoyo, sobre todo al subir la dosis.", "Pregabalina, gabapentina y carbamazepina pueden hacerle perder el equilibrio, sobre todo al subir la dosis. Haga los ejercicios de equilibrio con un apoyo cerca."),
    ("fluoroquinolonas", "general", "Evite el sol intenso (fotosensibilidad) y mantenga buena hidratación.", "Evite el sol fuerte: la piel se quema con más facilidad. Beba agua suficiente."),
    ("triptanes", "fuerza", "Sin limitación entre crisis; respiración continua (la apnea puede desencadenar cefalea).", "Entre crisis no hay limitación. Respire de forma continua: aguantar el aire puede provocar dolor de cabeza."),
    ("antiarritmicos_ic", "aerobico", "Intensidad ligera-moderada (debe poder hablar). Evite el ejercicio de alta intensidad por intervalos salvo autorización expresa.", "Intensidad ligera o moderada: debe poder hablar. No haga ejercicio de alta intensidad por intervalos salvo que su médico lo autorice."),
    ("respiratorio_otros", "resumen", "Otros fármacos respiratorios. Teofilina acelera el pulso y tiene margen estrecho (cafeína, infecciones y algunos antibióticos lo alteran); montelukast y roflumilast no afectan al ejercicio.", "Otros fármacos respiratorios. La teofilina acelera el pulso y tiene poco margen de seguridad: el café, las infecciones y algunos antibióticos la alteran. Montelukast y roflumilast no afectan al ejercicio."),
    ("alfabloqueantes", "fuerza", "Seguro. Especial cuidado al levantarse tras ejercicios tumbado (press, abdominales).", "Seguro. Levántese despacio después de los ejercicios tumbado, como el press o los abdominales."),
    ("deshabituacion", "aerobico", "Indicado; la capacidad aeróbica mejora rápidamente al dejar de fumar.", "Indicado. Al dejar de fumar, la capacidad para el ejercicio mejora en pocas semanas."),
    ("fibratos", "fuerza", "Progresión gradual, evitando el trabajo excéntrico intenso las primeras semanas.", "Aumente la carga poco a poco. Las primeras semanas evite el trabajo excéntrico intenso, como bajar pesos muy despacio o las bajadas largas."),
    ("fluoroquinolonas", "aerobico", "Solo actividades sin impacto (caminar, bici, nadar) a intensidad moderada.", "Solo actividades sin impacto: caminar, bici o nadar, a intensidad moderada."),
    ("idpp4", "general", "Solo producen hipoglucemia si se combinan con insulina o sulfonilureas.", "Solo bajan el azúcar en exceso si se combinan con insulina o sulfonilureas."),
    ("antiepilepticos_otros", "general", "Perampanel produce mareo, somnolencia e irritabilidad, sobre todo al inicio: evite actividades con riesgo de caída hasta conocer su tolerancia.", "El perampanel da mareo, sueño e irritabilidad, sobre todo al principio. Hasta saber cómo le sienta, evite actividades con riesgo de caída."),
    ("nitratos", "aerobico", "Ejercicio de intensidad ligera a moderada, con calentamiento largo (10 minutos) y enfriamiento progresivo. Evite esfuerzos máximos o bruscos salvo indicación expresa.", "Ejercicio de intensidad ligera o moderada. Caliente durante 10 minutos y termine despacio. No haga esfuerzos máximos ni bruscos salvo que su médico lo indique."),
    ("isrs_isrsn", "equilibrio", "Sin limitación específica. Posible mareo al inicio del tratamiento.", "Sin limitación específica. Al empezar el tratamiento puede notar mareo."),
    ("inmunosupresores_trasplante", "general", "Tacrolimus y ciclosporina tienen margen estrecho: deshidratación, antiinflamatorios, pomelo y muchos antibióticos o antifúngicos cambian sus niveles. Hidrátese bien, use paracetamol para el dolor y consulte cualquier fármaco o suplemento nuevo.", "Tacrolimus y ciclosporina tienen poco margen de seguridad. La deshidratación, los antiinflamatorios, el pomelo y muchos antibióticos o antifúngicos cambian sus niveles. Beba suficiente, use paracetamol para el dolor y consulte cualquier fármaco o suplemento nuevo."),
    ("melatonina_otros_sueno", "resumen", "Melatonina ayuda a regular el sueño sin efectos sobre el ejercicio; los antihistamínicos modernos (cetirizina, loratadina, bilastina, desloratadina) apenas dan sueño y son la opción para la alergia del deportista.", "La melatonina ayuda a regular el sueño y no afecta al ejercicio. Los antihistamínicos modernos, como cetirizina, loratadina, bilastina o desloratadina, apenas dan sueño: son la opción para la alergia si hace deporte."),
    ("digestivo_otros", "resumen", "Fármacos digestivos de uso frecuente. Metoclopramida puede dar somnolencia y síntomas parkinsonianos; domperidona alarga el QT; loperamida no debe usarse para 'aguantar' una gastroenteritis con fiebre.", "Fármacos digestivos de uso frecuente. La metoclopramida puede dar sueño y temblor o rigidez. La domperidona alarga el QT. La loperamida no sirve para «aguantar» una gastroenteritis con fiebre."),
    ("ieca_ara2", "general", "No tome antiinflamatorios (ibuprofeno, naproxeno, diclofenaco) de forma rutinaria para las agujetas: combinados con este fármaco y con deshidratación pueden dañar el riñón.", "No tome antiinflamatorios como ibuprofeno, naproxeno o diclofenaco de forma habitual para las agujetas. Junto con este fármaco y la deshidratación pueden dañar el riñón."),
    ("fibratos", "resumen", "Bajan los triglicéridos. Riesgo de daño muscular, especialmente combinados con estatinas.", "Bajan los triglicéridos. Pueden dañar el músculo, sobre todo si se combinan con estatinas."),
    ("digestivo_otros", "general", "Los antiácidos reducen la absorción de muchos fármacos (hierro, levotiroxina, quinolonas, bifosfonatos): sepárelos 2–4 horas.", "Los antiácidos impiden absorber bien muchos fármacos, como hierro, levotiroxina, quinolonas o bifosfonatos. Tómelos con 2–4 horas de separación."),
    ("metotrexato", "aerobico", "Indicado; mejora la fatiga de la enfermedad inflamatoria.", "Indicado. Mejora el cansancio que produce la enfermedad inflamatoria."),
    ("antiarritmicos_ic", "fuerza", "Seguro con cargas moderadas, repeticiones controladas y sin apnea.", "Seguro con cargas moderadas y repeticiones controladas. No aguante la respiración."),
]


def main(simular=False):
    F = Fuentes()
    hechos, pendientes = 0, []
    for cid, amb, viejo, nuevo in CAMBIOS:
        n = F.clase(cid, nuevo) if amb == "resumen" and any(c.get("resumen") == viejo for _, c, _ in F.clases() if c["id"] == cid) else (0 if amb == "resumen" else F.regla(cid, amb, viejo, nuevo=nuevo))
        if n: hechos += 1
        else:
            ya = any((c.get("resumen") == nuevo) if amb == "resumen" else any(r.get("texto") == nuevo for r in c.get(amb, []) + c.get(amb + "_add", [])) for _, c, _ in F.clases() if c["id"] == cid)
            if not ya: pendientes.append(f"{cid}/{amb}: «{viejo[:50]}…»")
    print(f"{hechos} textos reescritos; {len(pendientes)} no encontrados")
    for p in pendientes: print("  ·", p)
    if not simular and hechos:
        print(F.guardar(), "ficheros guardados")


if __name__ == "__main__":
    main("--simular" in sys.argv)
