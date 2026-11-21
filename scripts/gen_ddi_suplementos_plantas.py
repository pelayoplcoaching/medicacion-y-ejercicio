#!/usr/bin/env python3
"""Fuente editable de las interacciones de suplementos y plantas (v1.1). Genera data/ext/ddi_04_suplementos_plantas.json
(solo para la creación inicial; tras la revisión clínica, el JSON de data/ext es la fuente)
(uso: python3 scripts/gen_ddi_suplementos_plantas.py && python3 scripts/add_ddi.py data/ext/ddi_04_suplementos_plantas.json): interacciones de suplementos y plantas con fármacos (revisado=false)."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HMPC = "EMA HMPC (hipérico, inductor CYP3A4/P-gp)"
L = []


def D(a, b, nivel, efecto, accion, fuente):
    L.append({"a": a, "b": b, "nivel": nivel, "efecto": efecto, "accion": accion, "fuente": fuente, "revisado": False})


# ---- Hipérico: inductor potente (CYP3A4, P-gp) y serotoninérgico
D("hiperico", "clase:anticoagulantes", "mayor", "El hipérico acelera la eliminación del anticoagulante y le quita efecto (riesgo de trombosis o ictus). Al dejarlo, el efecto vuelve a subir.",
  "Evite el hipérico. Si ya lo toma, no lo deje sin avisar: hay que vigilar y ajustar el anticoagulante.", "FT AEMPS 4.5 (acenocumarol, apixabán, rivaroxabán, dabigatrán) · " + HMPC)
D("hiperico", "clase:hormonas_sexuales", "mayor", "Reduce el efecto de los anticonceptivos hormonales: riesgo de embarazo y sangrados irregulares.",
  "Evite el hipérico o use además preservativo durante el tratamiento y 28 días después.", "FT AEMPS 4.5 (anticonceptivos hormonales) · " + HMPC)
D("hiperico", "clase:isrs_isrsn", "mayor", "Hipérico + antidepresivo serotoninérgico: riesgo de síndrome serotoninérgico (temblor, sudor, fiebre, agitación).",
  "No los combine. Si toma un antidepresivo, no añada hipérico.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:triciclicos", "moderada", "Suma efecto serotoninérgico y reduce los niveles del antidepresivo.", "Evite la combinación salvo indicación médica.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:otros_antidepresivos", "moderada", "Suma efecto serotoninérgico (mirtazapina, trazodona) y puede restar efecto.", "Evite la combinación salvo indicación médica.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:triptanes", "moderada", "Riesgo de exceso de serotonina con los triptanes.", "Evite el hipérico si usa triptanes con frecuencia.", "FT AEMPS 4.5 (triptanes) · " + HMPC)
D("hiperico", "tramadol", "moderada", "Riesgo de síndrome serotoninérgico y menor efecto analgésico.", "Evite la combinación.", "FT AEMPS 4.5 (tramadol) · " + HMPC)
D("hiperico", "metadona", "moderada", "Baja los niveles de metadona: puede aparecer síndrome de abstinencia.", "No lo combine sin control de su unidad de tratamiento.", "FT AEMPS 4.5 (metadona) · " + HMPC)
D("hiperico", "clase:inmunosupresores_trasplante", "mayor", "Baja mucho los niveles de tacrolimus, ciclosporina y everolimus: riesgo de rechazo del trasplante.",
  "Contraindicado. No tome hipérico si es trasplantado.", "FT AEMPS 4.5 (tacrolimus, ciclosporina) · " + HMPC)
D("hiperico", "clase:antirretrovirales", "mayor", "Baja los niveles de los antirretrovirales: riesgo de fracaso del tratamiento y resistencias.", "Contraindicado.", "FT AEMPS 4.5 (antirretrovirales) · " + HMPC)
D("hiperico", "clase:quimio_oral_tki", "mayor", "Baja los niveles de muchos tratamientos orales del cáncer (imatinib, inhibidores de tirosina cinasa): pierden eficacia.", "Contraindicado durante el tratamiento.", "FT AEMPS 4.5 (imatinib y otros) · " + HMPC)
D("hiperico", "digoxina", "moderada", "Reduce los niveles de digoxina.", "Evítelo; si lo toma o lo deja, avise para controlar la digoxina.", "FT AEMPS 4.5 (digoxina) · " + HMPC)
D("hiperico", "ivabradina", "moderada", "Reduce el efecto de la ivabradina.", "Evite el hipérico.", "FT AEMPS 4.5 (ivabradina) · " + HMPC)
D("hiperico", "clase:calcioantagonistas_dhp", "moderada", "Reduce los niveles del calcioantagonista: la tensión puede subir.", "Evítelo o controle la tensión.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:calcioantagonistas_no_dhp", "moderada", "Reduce los niveles de verapamilo y diltiazem.", "Evítelo o controle tensión y pulso.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:estatinas", "moderada", "Reduce los niveles de simvastatina y atorvastatina: bajan menos el colesterol.", "Evítelo o controle el colesterol.", "FT AEMPS 4.5 (simvastatina, atorvastatina) · " + HMPC)
D("hiperico", "clase:antiepilepticos", "moderada", "Puede bajar los niveles de algunos antiepilépticos: riesgo de crisis.", "No lo combine sin consultar a su neurólogo.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:antiepilepticos_otros", "moderada", "Puede bajar los niveles de algunos antiepilépticos: riesgo de crisis.", "No lo combine sin consultar a su neurólogo.", "FT AEMPS 4.5 · " + HMPC)
D("hiperico", "clase:hormonoterapia_cancer_mama", "moderada", "Puede reducir la eficacia del tratamiento hormonal del cáncer de mama.", "Evite el hipérico.", "Revisión clínica · " + HMPC)

# ---- Vitaminas
D("vitamina_k", "acenocumarol", "mayor", "La vitamina K anula el efecto del acenocumarol: el INR baja y aumenta el riesgo de trombosis.",
  "No empiece ni deje la vitamina K (también K2 'para los huesos') sin avisar a quien le controla el Sintrom.", "FT AEMPS 4.5 (acenocumarol)")
D("vitamina_k", "warfarina", "mayor", "La vitamina K anula el efecto de la warfarina: el INR baja.", "No empiece ni deje la vitamina K sin avisar a quien le controla el INR.", "FT AEMPS 4.5 (warfarina)")
D("vitamina_e", "clase:anticoagulantes", "moderada", "A dosis altas (más de 300 mg al día) la vitamina E puede aumentar el sangrado.", "Evite dosis altas; vigile hematomas y sangrados.", "EFSA (vitamina E) · NIH ODS")
D("vitamina_e", "clase:antiagregantes", "menor", "A dosis altas la vitamina E puede sumar algo de sangrado.", "Evite dosis altas.", "NIH ODS (vitamina E)")
D("zinc", "clase:fluoroquinolonas", "moderada", "El zinc impide que se absorba el antibiótico.", "Tome el antibiótico 2 horas antes o 4–6 horas después del zinc.", "FT AEMPS 4.5 (ciprofloxacino, levofloxacino)")
D("zinc", "doxiciclina", "moderada", "El zinc reduce la absorción de doxiciclina.", "Separe las tomas al menos 2–3 horas.", "FT AEMPS 4.5 (doxiciclina)")
D("multivitaminico", "levotiroxina", "moderada", "El calcio, el hierro y el magnesio del multivitamínico reducen la absorción de levotiroxina.", "Separe al menos 4 horas.", "FT AEMPS 4.5 (levotiroxina)")
D("multivitaminico", "clase:fluoroquinolonas", "moderada", "Los minerales del multivitamínico impiden que se absorba el antibiótico.", "Tome el antibiótico 2 horas antes o 4–6 horas después.", "FT AEMPS 4.5 (quinolonas)")
D("multivitaminico", "clase:bifosfonatos", "moderada", "El calcio y otros minerales impiden la absorción del bifosfonato oral.", "Tome el bifosfonato en ayunas y el multivitamínico al menos 30–60 minutos después.", "FT AEMPS 4.5 (bifosfonatos)")
D("multivitaminico", "acenocumarol", "menor", "Algunos multivitamínicos llevan vitamina K, que reduce el efecto del acenocumarol.", "Elija uno sin vitamina K o tómelo siempre igual; avise si lo empieza o lo deja.", "FT AEMPS 4.5 (acenocumarol)")

# ---- Plantas que suman sangrado
D("ginkgo", "clase:anticoagulantes", "moderada", "El ginkgo puede aumentar el riesgo de sangrado.", "Evítelo; si lo toma, vigile hematomas, sangrado de encías u orina o heces oscuras.", "EMA HMPC (ginkgo) 4.5 · FT AEMPS 4.5")
D("ginkgo", "clase:heparinas", "moderada", "El ginkgo puede aumentar el riesgo de sangrado.", "Evítelo mientras use heparina.", "EMA HMPC (ginkgo) 4.5")
D("ginkgo", "clase:antiagregantes", "moderada", "Suma efecto sobre las plaquetas: más hematomas y sangrado.", "Evítelo o consúltelo.", "EMA HMPC (ginkgo) 4.5")
D("ginkgo", "clase:aines", "moderada", "Suma riesgo de sangrado, sobre todo digestivo.", "Evite tomar antiinflamatorios a menudo si toma ginkgo.", "EMA HMPC (ginkgo) 4.5 · casos publicados")
D("ginkgo", "clase:antiepilepticos", "moderada", "El ginkgo podría bajar el umbral de las crisis y los niveles de algunos antiepilépticos.", "Consulte a su neurólogo antes de tomarlo.", "EMA HMPC (ginkgo) 4.4")
D("ajo_suplemento", "clase:anticoagulantes", "moderada", "El ajo en cápsulas puede aumentar el riesgo de sangrado.", "Consúltelo; como condimento no hay problema.", "EMA HMPC (ajo) 4.5")
D("ajo_suplemento", "clase:antirretrovirales", "moderada", "El ajo en cápsulas reduce los niveles de algunos antirretrovirales.", "Evite las cápsulas de ajo durante el tratamiento.", "EMA HMPC (ajo) 4.5")
D("jengibre", "clase:anticoagulantes", "menor", "El jengibre en cápsulas podría sumar algo de sangrado.", "Consúltelo si toma dosis altas; como condimento no hay problema.", "EMA HMPC (jengibre) 4.4")
D("curcuma", "clase:anticoagulantes", "moderada", "La cúrcuma en cápsulas puede subir el INR y aumentar el sangrado.", "Evítela o avise para adelantar el control.", "Revisión clínica (casos publicados) · EMA HMPC (cúrcuma)")
D("curcuma", "clase:antiagregantes", "menor", "La cúrcuma en cápsulas puede sumar algo de efecto sobre las plaquetas.", "Consúltelo si toma dosis altas.", "EMA HMPC (cúrcuma) 4.4")
D("sauce", "clase:anticoagulantes", "moderada", "Los salicilatos del sauce suman riesgo de sangrado.", "Evite la corteza de sauce.", "EMA HMPC (corteza de sauce) 4.5")
D("sauce", "clase:antiagregantes", "moderada", "Salicilatos parecidos a la aspirina: suman efecto y molestias de estómago.", "Evite la corteza de sauce.", "EMA HMPC (corteza de sauce) 4.5")
D("sauce", "clase:aines", "moderada", "Suma efecto antiinflamatorio y riesgo de úlcera y sangrado.", "No los combine.", "EMA HMPC (corteza de sauce) 4.5")
D("harpagofito", "clase:anticoagulantes", "moderada", "Se han descrito hematomas al combinarlo con anticoagulantes.", "Consúltelo antes de tomarlo.", "Revisión clínica (casos publicados) · EMA HMPC (harpagofito)")

# ---- Regaliz y laxantes de plantas (potasio)
for b, n in (("clase:diureticos_asa", "furosemida, torasemida"), ("clase:tiazidas", "hidroclorotiazida, indapamida")):
    D("regaliz", b, "moderada", f"Regaliz + diurético ({n}): el potasio puede bajar mucho (calambres, debilidad, arritmias).", "Evite el regaliz o pida un control de potasio.", "EMA HMPC (raíz de regaliz) 4.5")
    D("laxantes_plantas", b, "moderada", f"Laxante de plantas + diurético ({n}): pérdida de potasio y de líquidos.", "Úselo solo unos días; si lo necesita a menudo, pida un control de potasio.", "EMA HMPC (sen, frángula) 4.5")
D("regaliz", "clase:digoxina", "mayor", "El potasio bajo por el regaliz aumenta la toxicidad de la digoxina (arritmias).", "No tome regaliz si toma digoxina.", "EMA HMPC (raíz de regaliz) 4.5")
D("laxantes_plantas", "clase:digoxina", "mayor", "El potasio bajo por el laxante aumenta la toxicidad de la digoxina.", "Evite los laxantes de plantas; consulte otra opción.", "EMA HMPC (sen, frángula) 4.5")
D("regaliz", "clase:corticoides", "moderada", "Ambos retienen sal y bajan el potasio; el regaliz además potencia al corticoide.", "Evite el regaliz durante el tratamiento.", "EMA HMPC (raíz de regaliz) 4.5")
D("laxantes_plantas", "clase:corticoides", "moderada", "Suma pérdida de potasio.", "Úselo solo unos días.", "EMA HMPC (sen, frángula) 4.5")
D("regaliz", "clase:ieca_ara2", "menor", "El regaliz sube la tensión y contrarresta el tratamiento.", "Evite tomar regaliz a diario.", "EMA HMPC (raíz de regaliz) 4.5")
D("regaliz", "clase:sotalol_dronedarona", "mayor", "Potasio bajo + fármaco que alarga el QT: riesgo de arritmia grave.", "No tome regaliz.", "EMA HMPC (raíz de regaliz) 4.5 · CredibleMeds (QT)")
D("laxantes_plantas", "clase:sotalol_dronedarona", "mayor", "Potasio bajo + fármaco que alarga el QT: riesgo de arritmia grave.", "Evite los laxantes de plantas.", "EMA HMPC (sen) 4.5 · CredibleMeds (QT)")

# ---- Plantas diuréticas
D("plantas_diureticas", "litio", "mayor", "Las plantas diuréticas pueden subir el litio hasta niveles tóxicos (temblor, confusión, vómitos).", "No las tome si toma litio.", "Revisión clínica (casos publicados con litio)")
D("plantas_diureticas", "clase:diureticos_asa", "moderada", "Suma pérdida de líquidos y sales.", "No las añada sin consultar; hidrátese bien al entrenar.", "EMA HMPC (cola de caballo) 4.4")
D("plantas_diureticas", "clase:tiazidas", "moderada", "Suma pérdida de líquidos y sales.", "No las añada sin consultar; hidrátese bien al entrenar.", "EMA HMPC (cola de caballo) 4.4")

# ---- CBD
D("cbd", "tacrolimus", "moderada", "El CBD puede subir los niveles de tacrolimus.", "Evítelo o pida niveles en sangre.", "FT AEMPS Epidyolex (cannabidiol) 4.5 · casos publicados")
D("cbd", "everolimus", "moderada", "El CBD sube los niveles de everolimus.", "Evítelo o pida niveles en sangre.", "FT AEMPS Epidyolex (cannabidiol) 4.5")
D("cbd", "valproato", "moderada", "CBD + valproato: más riesgo de daño en el hígado.", "Consúltelo; requiere análisis del hígado.", "FT AEMPS Epidyolex (cannabidiol) 4.4/4.5")
D("cbd", "acenocumarol", "moderada", "El CBD puede subir el INR.", "Avise y adelante el control del INR.", "Revisión clínica (casos publicados con warfarina)")
D("cbd", "warfarina", "moderada", "El CBD puede subir el INR.", "Avise y adelante el control del INR.", "Revisión clínica (casos publicados con warfarina)")

# ---- Adaptógenas
D("ginseng", "acenocumarol", "moderada", "El ginseng puede reducir el efecto del anticoagulante.", "Evítelo o avise para controlar el INR.", "EMA HMPC (ginseng) 4.5 · NCCIH")
D("ginseng", "warfarina", "moderada", "El ginseng puede reducir el efecto de la warfarina.", "Evítelo o avise para controlar el INR.", "EMA HMPC (ginseng) 4.5 · NCCIH")
D("ginseng", "clase:insulina", "menor", "El ginseng puede bajar algo más el azúcar.", "Mida la glucosa más a menudo al empezar.", "EMA HMPC (ginseng) 4.5")
D("ginseng", "clase:sulfonilureas", "menor", "El ginseng puede bajar algo más el azúcar.", "Mida la glucosa más a menudo al empezar.", "EMA HMPC (ginseng) 4.5")
D("ashwagandha", "levotiroxina", "moderada", "La ashwagandha puede subir las hormonas del tiroides.", "Evítela o pida un control de tiroides.", "NIH ODS (ashwagandha) · casos publicados")
D("ashwagandha", "clase:antitiroideos", "moderada", "La ashwagandha puede subir las hormonas del tiroides y contrarrestar el tratamiento.", "No la tome.", "NIH ODS (ashwagandha) · casos publicados")
D("ashwagandha", "clase:inmunosupresores_trasplante", "moderada", "Puede estimular las defensas y contrarrestar al inmunosupresor.", "No la tome si es trasplantado.", "NIH ODS (ashwagandha)")

# ---- Azúcar
D("berberina", "clase:inmunosupresores_trasplante", "moderada", "La berberina sube los niveles de ciclosporina y tacrolimus.", "Evítela o pida niveles en sangre.", "Revisión clínica (estudios con ciclosporina)")
D("berberina", "clase:insulina", "menor", "Suma efecto para bajar el azúcar.", "Mida la glucosa más a menudo al empezar y antes de entrenar.", "NCCIH (berberina)")
D("berberina", "clase:sulfonilureas", "menor", "Suma efecto para bajar el azúcar.", "Mida la glucosa más a menudo al empezar y antes de entrenar.", "NCCIH (berberina)")
D("cromo", "levotiroxina", "menor", "El cromo reduce la absorción de la levotiroxina.", "Separe 3–4 horas.", "NIH ODS (cromo)")
D("cromo", "clase:insulina", "menor", "El cromo podría bajar algo más el azúcar.", "Mida la glucosa más a menudo al empezar.", "NIH ODS (cromo)")

# ---- Menopausia y defensas
D("isoflavonas", "levotiroxina", "menor", "La soja reduce la absorción de la levotiroxina.", "Separe al menos 4 horas.", "FT AEMPS 4.5 (levotiroxina)")
D("isoflavonas", "clase:hormonoterapia_cancer_mama", "moderada", "Las isoflavonas tienen efecto estrogénico y podrían contrarrestar el tratamiento.", "No las tome sin consultar a su oncólogo.", "Revisión clínica · EFSA 2015 (isoflavonas)")
D("equinacea", "clase:inmunosupresores_trasplante", "moderada", "La equinácea estimula las defensas y puede contrarrestar al inmunosupresor.", "No la tome.", "EMA HMPC (equinácea) 4.3/4.5")
D("equinacea", "clase:biologicos_jak", "moderada", "La equinácea estimula las defensas y puede contrarrestar el tratamiento.", "No la tome sin consultar.", "EMA HMPC (equinácea) 4.3/4.5")
D("equinacea", "clase:farme_sinteticos", "menor", "La equinácea no se recomienda en enfermedades autoinmunes en tratamiento.", "Consúltelo antes.", "EMA HMPC (equinácea) 4.3")

# ---- Adelgazantes
D("sinefrina", "cafeina", "moderada", "Sinefrina + cafeína: el pulso y la tensión suben mucho más que con cada uno por separado.", "Evite la combinación (muy frecuente en los 'quemagrasas').", "Revisión clínica (casos publicados)")
D("sinefrina", "clase:estimulantes_tdah", "mayor", "Suma de estimulantes: taquicardia, hipertensión, arritmias.", "No los combine.", "Revisión clínica · FT AEMPS 4.5 (estimulantes)")
D("sinefrina", "moclobemida", "mayor", "Con un antidepresivo IMAO, la sinefrina puede disparar la tensión.", "No los combine.", "FT AEMPS 4.5 (moclobemida)")
D("sinefrina", "pseudoefedrina", "moderada", "Suma de estimulantes: taquicardia e hipertensión.", "No los combine.", "Revisión clínica")
D("yohimbina", "clase:estimulantes_tdah", "mayor", "Suma de estimulantes: taquicardia, hipertensión, ansiedad.", "No tome yohimbina.", "Revisión clínica · Reglamento (UE) 2019/650")
D("yohimbina", "moclobemida", "mayor", "Con un antidepresivo IMAO, la yohimbina puede disparar la tensión.", "No tome yohimbina.", "Revisión clínica")
D("yohimbina", "clase:isrs_isrsn", "moderada", "La yohimbina aumenta la ansiedad y la tensión y altera el efecto del antidepresivo.", "No tome yohimbina.", "Revisión clínica")
D("fucus", "levotiroxina", "moderada", "El yodo del fucus altera el tiroides y descontrola la dosis de levotiroxina.", "No lo tome sin control de su médico.", "NIH ODS (yodo)")
D("fucus", "clase:antitiroideos", "moderada", "El yodo del fucus contrarresta el tratamiento del hipertiroidismo.", "No lo tome.", "NIH ODS (yodo)")
D("fucus", "clase:amiodarona", "moderada", "La amiodarona ya lleva mucho yodo: el fucus suma riesgo de alterar el tiroides.", "No lo tome.", "NIH ODS (yodo) · FT AEMPS 4.4 (amiodarona)")
D("fucus", "litio", "moderada", "Yodo + litio: más riesgo de hipotiroidismo.", "No lo tome sin consultar.", "NIH ODS (yodo)")
D("glucomanano", "levotiroxina", "menor", "La fibra retrasa y reduce la absorción de la levotiroxina.", "Separe al menos 4 horas.", "FT AEMPS 4.5 (levotiroxina)")
D("glucomanano", "clase:digoxina", "menor", "La fibra puede reducir la absorción de la digoxina.", "Separe al menos 2 horas.", "Revisión clínica")
D("te_verde_extracto", "metotrexato", "moderada", "Dos productos que pueden dañar el hígado.", "Evite el extracto de té verde; la bebida en cantidad moderada no plantea problema.", "EFSA 2018 (catequinas del té verde)")

# ---- Prohormonas
D("prohormonas_dhea", "clase:anticoagulantes", "moderada", "Los anabolizantes aumentan el efecto del anticoagulante (sangrado).", "No los tome; si ya lo hace, avise para controlar el INR.", "Revisión clínica")
D("prohormonas_dhea", "clase:hormonoterapia_cancer_mama", "mayor", "La DHEA y las prohormonas se transforman en hormonas sexuales y contrarrestan el tratamiento.", "Contraindicado.", "Revisión clínica")
D("prohormonas_dhea", "clase:hormonoterapia_prostata", "mayor", "Las prohormonas se transforman en testosterona y contrarrestan el tratamiento.", "Contraindicado.", "Revisión clínica")
D("prohormonas_dhea", "testosterona", "moderada", "Duplica el efecto hormonal: más riesgo de efectos adversos.", "No los combine.", "Revisión clínica")

# ---- Levadura roja y Q10
D("levadura_roja", "clase:estatinas", "mayor", "La levadura roja es una estatina (monacolina K = lovastatina): sería tomar dos estatinas.", "No los combine. Deje la levadura roja si le pautan una estatina.", "Reglamento (UE) 2022/860 · EFSA 2018 (monacolinas)")
D("levadura_roja", "claritromicina", "mayor", "La claritromicina dispara los niveles de monacolina K: riesgo de daño muscular grave.", "Suspenda la levadura roja mientras dure el antibiótico.", "FT AEMPS 4.3/4.5 (lovastatina)")
D("levadura_roja", "itraconazol", "mayor", "El itraconazol dispara los niveles de monacolina K: riesgo de daño muscular grave.", "Suspenda la levadura roja durante el tratamiento.", "FT AEMPS 4.3/4.5 (lovastatina)")
D("levadura_roja", "ciclosporina", "mayor", "La ciclosporina sube mucho los niveles de monacolina K: riesgo de daño muscular.", "No la tome.", "FT AEMPS 4.5 (lovastatina)")
D("coenzima_q10", "acenocumarol", "menor", "La coenzima Q10 podría reducir el efecto del anticoagulante.", "Avise si la empieza o la deja.", "NCCIH (coenzima Q10) · casos publicados")
D("coenzima_q10", "warfarina", "menor", "La coenzima Q10 podría reducir el efecto de la warfarina.", "Avise si la empieza o la deja.", "NCCIH (coenzima Q10) · casos publicados")

# ---- Suplementos deportivos
D("carnitina", "acenocumarol", "moderada", "La L-carnitina puede subir el INR.", "Avise y adelante el control.", "Revisión clínica (casos publicados con acenocumarol)")
D("carnitina", "warfarina", "moderada", "La L-carnitina puede subir el INR.", "Avise y adelante el control.", "Revisión clínica (casos publicados)")
D("arginina_citrulina", "clase:pde5", "moderada", "Arginina o citrulina + sildenafilo/tadalafilo: la tensión puede bajar demasiado.", "No los combine sin consultar.", "Revisión clínica")
D("arginina_citrulina", "clase:nitratos", "moderada", "Suma efecto vasodilatador: mareo y bajada de tensión.", "No los combine sin consultar.", "Revisión clínica")
D("nitrato_remolacha", "clase:pde5", "menor", "Los nitratos de la remolacha suman un pequeño efecto sobre la tensión.", "Evite tomarlos juntos el mismo día si se marea.", "Revisión clínica")
D("nitrato_remolacha", "clase:nitratos", "menor", "Suma un pequeño efecto sobre la tensión.", "Si se marea, no los tome el mismo día.", "Revisión clínica")
D("aminoacidos", "levodopa", "moderada", "Los aminoácidos compiten con la levodopa y le quitan efecto.", "Sepárelos de las tomas de levodopa.", "FT AEMPS 4.5 (levodopa)")
D("cafeina", "clase:fluoroquinolonas", "menor", "Ciprofloxacino frena la eliminación de la cafeína: más nervios, insomnio y palpitaciones.", "Reduzca la cafeína mientras dure el antibiótico.", "FT AEMPS 4.5 (ciprofloxacino)")
D("cafeina", "teofilina", "moderada", "Suma de efectos estimulantes: taquicardia, temblor, insomnio.", "Limite la cafeína y evite los pre-entrenos.", "FT AEMPS 4.5 (teofilina)")
D("cafeina", "litio", "menor", "La cafeína aumenta la eliminación del litio; si la deja de golpe, el litio puede subir.", "Mantenga un consumo de cafeína estable y avise si lo cambia.", "FT AEMPS 4.5 (litio)")
D("cafeina", "clozapina", "moderada", "La cafeína sube los niveles de clozapina.", "Mantenga un consumo estable; evite los pre-entrenos.", "FT AEMPS 4.5 (clozapina)")

dest = ROOT / "data/ext/ddi_04_suplementos_plantas.json"
if dest.exists() and dest.read_text(encoding="utf-8").count('"revisado": true') > 0 and "--forzar" not in sys.argv:
    sys.exit(f"{dest.name} ya tiene filas revisadas por el clínico (import_revision.py escribe en él): edite el JSON, no este script (o use --forzar).")
dest.write_text(json.dumps(L, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{dest}: {len(L)} interacciones")
