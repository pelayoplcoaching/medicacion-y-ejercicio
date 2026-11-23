/* Panel de caídas y carga anticolinérgica (segunda tanda de mejoras grandes, 14; modo profesional). Bajo demanda (data-abre="frid").
   Para la revisión de la medicación de una persona con riesgo de caídas: qué fármacos de la lista están en las 14 clases de
   STOPPFall (con las diferencias dentro de cada clase, cuándo plantear la retirada, si conviene escalonarla y qué vigilar después),
   la carga anticolinérgica según la escala CRIDECO (CALS), cuántos sedan o bajan la tensión según las señales de la base, y paso
   al simulador de retirada.
   CONTENIDO CLÍNICO NUEVO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA.
   - STOPPFall: Seppala et al., Age Ageing 2021 (consenso Delphi de 24 expertos; texto completo en PMC, leído el 22/11/2026). Las 14
     clases, las diferencias entre subclases (tabla 1) y la guía de retirada (tabla 2) son las del artículo, traducidas. La ASIGNACIÓN
     de cada familia de la base a una clase es de esta aplicación y está por revisar.
   - CALS: Ramos et al., J Pers Med 2022 (texto completo en PMC). La escala tiene 217 fármacos; aquí están los 101 principios de
     la base que figuran en ella, con su puntuación tal como sale en el artículo (emparejados por nombre, uno a uno).
     Suma de 3 o más = carga clínicamente relevante (el propio artículo). Formas tópicas, óticas, oftálmicas y nasales, fuera.
   - Sedantes, hipotensores y efecto anticolinérgico «según la base»: las señales ya revisadas; anticoagulantes: su familia en la base
     (que ya dice que con ellos una caída puede tener consecuencias graves). No son una escala.
   Contenido en español, como la base; la interfaz, en cinco idiomas. */
import { idioma, t } from "./i18n.js?v=202611230800";

const TXT = {
  es: { titulo: "Caídas y carga anticolinérgica", borrador: "Borrador pendiente de revisión clínica", intro: "Para revisar la medicación de una persona con riesgo de caídas. No decide por usted: ordena lo que hay en la lista.", sin_meds: "Añada la medicación para ver el panel.", c_frid: "en clases de STOPPFall", c_cals: "carga anticolinérgica (CALS)", c_sed: "con efecto sedante", c_hipo: "que bajan la tensión", relevante: "clínicamente relevante (3 o más)", no_relevante: "por debajo de 3",
    h_stopp: "Fármacos que aumentan el riesgo de caídas (STOPPFall)", ninguno_stopp: "Ningún fármaco de la lista está en las clases de STOPPFall.", dentro: "Dentro de la clase", retirar: "Plantear la retirada si hay", indic: "Y según para qué se da", como: "Cómo retirar y qué vigilar", escal: "Retirada escalonada", e_si: "en general, sí", e_valorar: "valorar caso a caso", e_no: "en general, no hace falta", vigilar: "Vigilar después", simular_uno: "Probar a retirar {x} en el simulador",
    h_cals: "Carga anticolinérgica (escala CRIDECO)", ninguno_cals: "Ningún fármaco de la lista figura en la escala.", farmaco: "Fármaco", puntos: "Puntos", total: "Total", potencia: "Potencia", p3: "alta", p2: "media", p1: "baja", h_senales: "Según las señales de la base", sedantes: "Con efecto sedante", hipotensores: "Que bajan la tensión", s_acod: "Anticoagulantes (una caída puede ser más grave)", s_anticol: "Con efecto anticolinérgico", ninguno: "ninguno",
    simular: "Probar a retirar en el simulador", copiar: "Copiar para la historia", copiado: "Copiado.", copia_error: "No se ha podido copiar.", limites: "Límites", fuentes: "Fuentes", nota_grupo: "entrada agrupada: mire el fármaco concreto",
  },
  en: { titulo: "Falls and anticholinergic load", borrador: "Draft pending clinical review", intro: "For reviewing the medication of a person at risk of falls. It does not decide for you: it sorts what is on the list.", sin_meds: "Add the medication to see the panel.", c_frid: "in STOPPFall classes", c_cals: "anticholinergic load (CALS)", c_sed: "with sedative effect", c_hipo: "that lower blood pressure", relevante: "clinically relevant (3 or more)", no_relevante: "below 3",
    h_stopp: "Fall-risk-increasing drugs (STOPPFall)", ninguno_stopp: "No drug on the list is in the STOPPFall classes.", dentro: "Within the class", retirar: "Consider withdrawal if there is", indic: "And depending on the indication", como: "How to withdraw and what to monitor", escal: "Stepwise withdrawal", e_si: "in general, yes", e_valorar: "consider case by case", e_no: "in general, not needed", vigilar: "Monitor afterwards", simular_uno: "Try withdrawing {x} in the simulator",
    h_cals: "Anticholinergic load (CRIDECO scale)", ninguno_cals: "No drug on the list appears in the scale.", farmaco: "Drug", puntos: "Points", total: "Total", potencia: "Potency", p3: "high", p2: "medium", p1: "low", h_senales: "According to the knowledge-base signals", sedantes: "With sedative effect", hipotensores: "That lower blood pressure", s_acod: "Anticoagulants (a fall can be more serious)", s_anticol: "With anticholinergic effect", ninguno: "none",
    simular: "Try withdrawing in the simulator", copiar: "Copy for the record", copiado: "Copied.", copia_error: "Could not copy.", limites: "Limitations", fuentes: "Sources", nota_grupo: "grouped entry: check the specific drug",
  },
  ca: { titulo: "Caigudes i càrrega anticolinèrgica", borrador: "Esborrany pendent de revisió clínica", intro: "Per revisar la medicació d'una persona amb risc de caigudes. No decideix per vosaltres: ordena el que hi ha a la llista.", sin_meds: "Afegiu la medicació per veure el panell.", c_frid: "en classes de STOPPFall", c_cals: "càrrega anticolinèrgica (CALS)", c_sed: "amb efecte sedant", c_hipo: "que baixen la pressió", relevante: "clínicament rellevant (3 o més)", no_relevante: "per sota de 3",
    h_stopp: "Fàrmacs que augmenten el risc de caigudes (STOPPFall)", ninguno_stopp: "Cap fàrmac de la llista és a les classes de STOPPFall.", dentro: "Dins de la classe", retirar: "Plantejar la retirada si hi ha", indic: "I segons per a què es dona", como: "Com retirar i què vigilar", escal: "Retirada esglaonada", e_si: "en general, sí", e_valorar: "valorar cas a cas", e_no: "en general, no cal", vigilar: "Vigilar després", simular_uno: "Provar de retirar {x} al simulador",
    h_cals: "Càrrega anticolinèrgica (escala CRIDECO)", ninguno_cals: "Cap fàrmac de la llista figura a l'escala.", farmaco: "Fàrmac", puntos: "Punts", total: "Total", potencia: "Potència", p3: "alta", p2: "mitjana", p1: "baixa", h_senales: "Segons els senyals de la base", sedantes: "Amb efecte sedant", hipotensores: "Que baixen la pressió", s_acod: "Anticoagulants (una caiguda pot ser més greu)", s_anticol: "Amb efecte anticolinèrgic", ninguno: "cap",
    simular: "Provar de retirar al simulador", copiar: "Copiar per a la història", copiado: "Copiat.", copia_error: "No s'ha pogut copiar.", limites: "Límits", fuentes: "Fonts", nota_grupo: "entrada agrupada: mireu el fàrmac concret",
  },
  gl: { titulo: "Caídas e carga anticolinérxica", borrador: "Borrador pendente de revisión clínica", intro: "Para revisar a medicación dunha persoa con risco de caídas. Non decide por vostede: ordena o que hai na lista.", sin_meds: "Engada a medicación para ver o panel.", c_frid: "en clases de STOPPFall", c_cals: "carga anticolinérxica (CALS)", c_sed: "con efecto sedante", c_hipo: "que baixan a tensión", relevante: "clinicamente relevante (3 ou máis)", no_relevante: "por debaixo de 3",
    h_stopp: "Fármacos que aumentan o risco de caídas (STOPPFall)", ninguno_stopp: "Ningún fármaco da lista está nas clases de STOPPFall.", dentro: "Dentro da clase", retirar: "Formular a retirada se hai", indic: "E segundo para que se dá", como: "Como retirar e que vixiar", escal: "Retirada graduada", e_si: "en xeral, si", e_valorar: "valorar caso a caso", e_no: "en xeral, non fai falta", vigilar: "Vixiar despois", simular_uno: "Probar a retirar {x} no simulador",
    h_cals: "Carga anticolinérxica (escala CRIDECO)", ninguno_cals: "Ningún fármaco da lista figura na escala.", farmaco: "Fármaco", puntos: "Puntos", total: "Total", potencia: "Potencia", p3: "alta", p2: "media", p1: "baixa", h_senales: "Segundo os sinais da base", sedantes: "Con efecto sedante", hipotensores: "Que baixan a tensión", s_acod: "Anticoagulantes (unha caída pode ser máis grave)", s_anticol: "Con efecto anticolinérxico", ninguno: "ningún",
    simular: "Probar a retirar no simulador", copiar: "Copiar para a historia", copiado: "Copiado.", copia_error: "Non se puido copiar.", limites: "Límites", fuentes: "Fontes", nota_grupo: "entrada agrupada: mire o fármaco concreto",
  },
  eu: { titulo: "Erorikoak eta karga antikolinergikoa", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Erortzeko arriskua duen pertsona baten botikak berrikusteko. Ez du zure ordez erabakitzen: zerrendan dagoena ordenatzen du.", sin_meds: "Gehitu botikak panela ikusteko.", c_frid: "STOPPFall klaseetan", c_cals: "karga antikolinergikoa (CALS)", c_sed: "efektu lasaigarriarekin", c_hipo: "tentsioa jaisten dutenak", relevante: "klinikoki garrantzitsua (3 edo gehiago)", no_relevante: "3tik behera",
    h_stopp: "Erortzeko arriskua handitzen duten botikak (STOPPFall)", ninguno_stopp: "Zerrendako botika bat ere ez dago STOPPFall klaseetan.", dentro: "Klasearen barruan", retirar: "Kentzea planteatu hau badago", indic: "Eta zertarako ematen den kontuan hartuta", como: "Nola kendu eta zer zaindu", escal: "Pixkanakako kentzea", e_si: "oro har, bai", e_valorar: "kasuz kasu baloratu", e_no: "oro har, ez da behar", vigilar: "Gero zaindu", simular_uno: "Probatu {x} kentzea simulagailuan",
    h_cals: "Karga antikolinergikoa (CRIDECO eskala)", ninguno_cals: "Zerrendako botika bat ere ez dago eskalan.", farmaco: "Botika", puntos: "Puntuak", total: "Guztira", potencia: "Potentzia", p3: "altua", p2: "ertaina", p1: "baxua", h_senales: "Oinarriko seinaleen arabera", sedantes: "Efektu lasaigarriarekin", hipotensores: "Tentsioa jaisten dutenak", s_acod: "Antikoagulatzaileak (erorikoa larriagoa izan daiteke)", s_anticol: "Efektu antikolinergikoarekin", ninguno: "bat ere ez",
    simular: "Probatu kentzea simulagailuan", copiar: "Kopiatu historiarako", copiado: "Kopiatuta.", copia_error: "Ezin izan da kopiatu.", limites: "Mugak", fuentes: "Iturriak", nota_grupo: "taldekako sarrera: begiratu botika zehatza",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Las 14 clases de STOPPFall. clases / pids / senal: cómo se reconoce en la base (asignación de la aplicación).
   dif: diferencias dentro de la clase (tabla 1). cuando: síntomas con los que plantear la retirada; indic: según la indicación;
   escal: ¿retirada escalonada? ("si" = en general necesaria, "valorar", "no" = en general no necesaria); vigilar: tras la retirada (tabla 2).
   Los anticolinérgicos están en la lista, pero la tabla 2 del artículo no les dedica fila. */
export const STOPPFALL = [
  { id: "bzd", n: "Benzodiacepinas", clases: ["benzodiacepinas"], cuando: "somnolencia de día, deterioro cognitivo o torpeza psicomotora", indic: "en sus dos indicaciones: insomnio y ansiedad", escal: "si", vigilar: "ansiedad, insomnio y agitación; valorar también delirium, convulsiones y confusión" },
  { id: "z", n: "Fármacos relacionados con las benzodiacepinas (hipnóticos Z)", clases: ["hipnoticos_z"], cuando: "somnolencia de día, deterioro cognitivo o torpeza psicomotora", indic: "en sus dos indicaciones: insomnio y ansiedad", escal: "si", vigilar: "ansiedad, insomnio y agitación; valorar también delirium, convulsiones y confusión" },
  { id: "antipsicoticos", n: "Antipsicóticos", clases: ["antipsicoticos", "antipsicoticos_clozapina", "antipsicoticos_depot"], pids: ["sulpirida"], dif: "El riesgo varía con su efecto sedante, anticolinérgico y sobre los receptores alfa.", cuando: "efectos extrapiramidales o cardiacos, sedación, mareo o visión borrosa", indic: "si se dan por síntomas conductuales y psicológicos de la demencia o para dormir; posiblemente, en el trastorno bipolar", escal: "si", vigilar: "reaparición de los síntomas (psicosis, agresividad, agitación, delirios, alucinaciones); valorar también el insomnio" },
  { id: "opioides", n: "Opioides", clases: ["opioides"], pids: ["metadona", "codeina_antitusiva"], dif: "Los potentes, más que los débiles.", cuando: "reacciones lentas, peor equilibrio o síntomas sedantes", indic: "si se dan por dolor crónico; posiblemente, también por dolor agudo", escal: "si", vigilar: "reaparición del dolor; valorar también síntomas musculoesqueléticos, inquietud, síntomas digestivos, ansiedad, insomnio, sudoración, enfado y escalofríos" },
  { id: "antidepresivos", n: "Antidepresivos", clases: ["isrs_isrsn", "triciclicos", "otros_antidepresivos", "otros_antidepresivos_2"], dif: "Los tricíclicos, más que el resto; el riesgo varía con el efecto sedante, la tendencia a la hipotensión ortostática y la actividad anticolinérgica.", cuando: "hiponatremia, hipotensión ortostática, mareo, síntomas sedantes, taquicardia o arritmia", indic: "si se dan por depresión, según el tiempo sin síntomas y los antecedentes, o para dormir; posiblemente, por dolor neuropático o ansiedad", escal: "si", vigilar: "reaparición de la depresión, ansiedad, irritabilidad e insomnio; valorar también cefalea, malestar y síntomas digestivos" },
  { id: "anticolinergicos", n: "Anticolinérgicos", clases: ["antiespasmodicos"], pids: ["biperideno", "trihexifenidilo"], dif: "Los de actividad anticolinérgica alta, más que los débiles." },
  { id: "antiepilepticos", n: "Antiepilépticos", clases: ["antiepilepticos", "antiepilepticos_otros"], dif: "Los de generaciones antiguas, más que los nuevos; el riesgo varía con el efecto sedante.", cuando: "ataxia, somnolencia o peor equilibrio; posiblemente, mareo", indic: "si se dan por ansiedad o dolor neuropático", escal: "valorar", vigilar: "reaparición de las crisis; valorar también ansiedad, inquietud, insomnio y cefalea" },
  { id: "diureticos", n: "Diuréticos", senal: "diuretico", dif: "Los del asa, más que el resto.", cuando: "hipotensión ortostática, hipotensión o alteraciones de los electrolitos; posiblemente, incontinencia urinaria", indic: "posiblemente, si se dan por hipertensión", escal: "valorar", vigilar: "insuficiencia cardiaca, hipertensión y signos de retención de líquidos" },
  { id: "alfa_hta", n: "Alfabloqueantes usados como antihipertensivos", pids: ["doxazosina", "terazosina"], cuando: "hipotensión, hipotensión ortostática o mareo", escal: "valorar", vigilar: "hipertensión; valorar también palpitaciones y cefalea" },
  { id: "alfa_prostata", n: "Alfabloqueantes para la hiperplasia de próstata", pids: ["tamsulosina", "silodosina", "alfuzosina"], dif: "Los no selectivos, más que los selectivos.", cuando: "hipotensión, hipotensión ortostática o mareo", escal: "no", vigilar: "reaparición de los síntomas" },
  { id: "centrales", n: "Antihipertensivos de acción central", clases: ["antihipertensivos_centrales"], cuando: "hipotensión, hipotensión ortostática o síntomas sedantes", escal: "valorar", vigilar: "hipertensión" },
  { id: "antihistaminicos", n: "Antihistamínicos sedantes", clases: ["antihistaminicos_sedantes"], dif: "Los de primera generación, más que los de segunda; el riesgo varía con el efecto sedante y la actividad anticolinérgica.", cuando: "confusión, somnolencia, mareo o visión borrosa", indic: "en todas sus indicaciones: para dormir o sedar, picor crónico y síntomas alérgicos", escal: "valorar", vigilar: "reaparición de los síntomas; valorar también insomnio y ansiedad" },
  { id: "vasodilatadores", n: "Vasodilatadores usados en cardiopatías", clases: ["nitratos"], pids: ["nicorandil"], cuando: "hipotensión, hipotensión ortostática o mareo", escal: "valorar", vigilar: "síntomas de angina de pecho" },
  { id: "vejiga", n: "Fármacos para la vejiga hiperactiva y la incontinencia de urgencia", clases: ["anticolinergicos_urinarios"], pids: ["mirabegron"], dif: "El riesgo varía con la actividad anticolinérgica.", cuando: "mareo, confusión, visión borrosa, somnolencia o QT largo", escal: "valorar", vigilar: "reaparición de los síntomas" },
];
/** Lo que la guía de retirada dice para todas las clases (primera fila de la tabla 2) y cómo leerla (sus notas al pie). */
export const SIEMPRE = {
  retirar: "En cualquiera de ellos, plantear la retirada si no hay indicación o existe una alternativa más segura.",
  vigilar: "Tras cualquier retirada: las caídas y los cambios en los síntomas (por ejemplo, hipotensión ortostática, visión borrosa o mareo), con un seguimiento a la medida de cada persona.",
  nota: "Se recoge lo que eligió más del 70 % del panel; tras «posiblemente» o «valorar también», lo que eligió entre el 30 y el 70 %.",
};

/* Escala CRIDECO (CALS), Ramos 2022: puntuación → principios de la base que figuran en ella. */
const CALS_TXT = {
  3: "amitriptilina biperideno clomipramina clorfenamina clozapina dexclorfeniramina difenhidramina fesoterodina hidroxizina nortriptilina oxibutinina solifenacina tizanidina tolterodina trihexifenidilo",
  2: "amantadina baclofeno carbamazepina ciclobenzaprina metadona olanzapina olanzapina_depot oxcarbazepina paroxetina quetiapina tramadol zuclopentixol",
  1: "alprazolam amisulprida ampicilina antihistaminico_no_sedante aripiprazol aripiprazol_depot atenolol azatioprina bisacodilo bupropion captopril celecoxib ciclosporina cinarizina citalopram clonazepam clorazepato clortalidona codeina codeina_antitusiva desvenlafaxina dexametasona dextrometorfano diazepam digoxina diltiazem domperidona entacapona escitalopram famotidina fenobarbital fentanilo fluoxetina furosemida haloperidol hidralazina hidrocortisona hidromorfona ipratropio lama levodopa litio loperamida lorazepam metformina metilprednisolona mononitrato_isosorbida metocarbamol metoclopramida metoprolol metotrexato mirtazapina morfina nifedipino oxicodona paliperidona paliperidona_depot pramipexol prednisolona prednisona pseudoefedrina risperidona risperidona_depot rotigotina sertralina sumatriptan tapentadol teofilina trazodona valproato venlafaxina warfarina ziprasidona zolmitriptan",
};
export const CALS = Object.fromEntries(Object.entries(CALS_TXT).flatMap(([s, l]) => l.split(" ").map((pid) => [pid, Number(s)])));
/** Entradas agrupadas de la base (varios fármacos en una): la puntuación es la de los que figuran en la escala. */
export const CALS_GRUPO = { lama: "tiotropio, glicopirronio, umeclidinio y aclidinio puntúan 1", antihistaminico_no_sedante: "cetirizina, loratadina y desloratadina puntúan 1; bilastina y ebastina no figuran en la escala",
  /* validación externa del 23/11/2026, cotejada con la tabla 4 de Ramos 2022 */
  famotidina: "la famotidina puntúa 1; la ranitidina puntúa 2", bisacodilo: "solo el bisacodilo figura en la escala (1); los senósidos y el picosulfato, no", cinarizina: "solo la cinarizina figura en la escala (1); la flunarizina, no",
  entacapona: "solo la entacapona figura en la escala (1); la opicapona, no", pseudoefedrina: "solo la pseudoefedrina figura en la escala (1); la fenilefrina, no", levodopa: "la escala recoge la levodopa con carbidopa (1); con benserazida no figura" };
export const UMBRAL_CALS = 3;

export const LIMITES = [
  "STOPPFall es un consenso de 24 expertos europeos (método Delphi). Su efecto en la prevención de caídas está por evaluar en estudios de intervención, y sus autores lo plantean dentro de una estrategia multifactorial, no como medida aislada.",
  "El consenso no valoró las dosis, las combinaciones ni las interacciones.",
  "La asignación de cada fármaco de la lista a una clase de STOPPFall la hace esta aplicación por su familia: compruébela. En los antihistamínicos solo se marcan los sedantes, que son los que recoge la guía de retirada.",
  "La escala CRIDECO tiene 217 fármacos; aquí solo se puntúan los que están en la base de la aplicación. Un fármaco sin puntos puede no figurar en la escala o no estar emparejado. No se cuentan las formas tópicas, óticas, oftálmicas ni nasales, y la suma no tiene en cuenta la dosis.",
];
export const FUENTES = [
  { txt: "Seppala et al. STOPPFall (Screening Tool of Older Persons Prescriptions in older adults with high fall risk): a Delphi study by the EuGMS Task and Finish Group on Fall-Risk-Increasing Drugs. Age Ageing 2021", doi: "10.1093/ageing/afaa249" },
  { txt: "Ramos et al. CRIDECO Anticholinergic Load Scale: an updated anticholinergic burden scale. J Pers Med 2022", doi: "10.3390/jpm12020207" },
];

/** Analiza la lista. items = res.items ({ principio, clase, senales }). Devuelve { stopp: [clase con meds: [{ pid, nombre }]] (solo las que tienen alguno),
    nFrid, cals: { filas: [{ pid, nombre, s, grupo }], total, relevante }, sedantes, hipotensores, anticol, anticoag: [nombres] }. */
export function panel(items = []) {
  const med = (it) => ({ pid: it.principio.id, nombre: it.principio.nombre });
  const de = (c) => items.filter((it) => (c.clases || []).includes(it.clase?.id) || (c.pids || []).includes(it.principio.id) || (c.senal && it.senales?.has(c.senal)));
  const stopp = STOPPFALL.map((c) => ({ id: c.id, n: c.n, dif: c.dif || "", cuando: c.cuando || "", indic: c.indic || "", escal: c.escal || "", vigilar: c.vigilar || "", meds: de(c).map(med) })).filter((c) => c.meds.length);
  const filas = items.filter((it) => CALS[it.principio.id]).map((it) => ({ ...med(it), s: CALS[it.principio.id], grupo: CALS_GRUPO[it.principio.id] || "" })).sort((a, b) => b.s - a.s || a.nombre.localeCompare(b.nombre, "es"));
  const total = filas.reduce((n, f) => n + f.s, 0), con = (s) => items.filter((it) => it.senales?.has(s)).map((it) => it.principio.nombre);
  return { stopp, nFrid: new Set(stopp.flatMap((c) => c.meds.map((m) => m.pid))).size, cals: { filas, total, relevante: total >= UMBRAL_CALS }, sedantes: con("sedacion"), hipotensores: con("hipotension"), anticol: con("anticolinergico"), anticoag: items.filter((it) => it.clase?.id === "anticoagulantes").map((it) => it.principio.nombre) };
}
/** Texto para pegar en la historia clínica. */
export function textoHistoria(P) {
  const L = [`${tx("titulo")} (Pauta Activa)`];
  L.push(`STOPPFall: ${P.nFrid ? P.stopp.map((c) => `${c.n}: ${c.meds.map((m) => m.nombre).join(", ")}`).join("; ") : tx("ninguno")}.`);
  L.push(`CALS: ${P.cals.total} (${P.cals.relevante ? tx("relevante") : tx("no_relevante")})${P.cals.filas.length ? ": " + P.cals.filas.map((f) => `${f.nombre} ${f.s}`).join(", ") : ""}.`);
  L.push(`${tx("sedantes")}: ${P.sedantes.join(", ") || tx("ninguno")}. ${tx("hipotensores")}: ${P.hipotensores.join(", ") || tx("ninguno")}.`);
  return L.join("\n");
}

const CSS = `
.fr-dlg { width: min(860px, calc(100vw - 16px)); }
.fr-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.fr-intro { margin: 0 0 12px; color: var(--muted); }
.fr-cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.fr-cifras li { padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.fr-cifras li.aviso { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.fr-cifras b { display: block; font-family: var(--mono); font-size: 1.7rem; line-height: 1; }
.fr-cifras span { display: block; margin-top: 4px; font-size: .8rem; line-height: 1.25; }
.fr-cifras small { display: block; font-size: .74rem; font-weight: 700; }
.fr-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.fr-clases { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.fr-clases > li { padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.fr-clases > li > b { display: block; line-height: 1.3; }
.fr-meds { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; padding: 0; list-style: none; }
.fr-chip { min-height: 34px; padding: 3px 12px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--fg); font: inherit; font-size: .88rem; font-weight: 700; cursor: pointer; }
.fr-chip:hover { border-color: var(--accent); }
.fr-det { margin: 0; display: grid; gap: 3px; font-size: .88rem; }
.fr-det div { display: block; }
.fr-det dt { display: inline; font-weight: 700; }
.fr-det dt::after { content: ": "; }
.fr-det dd { display: inline; margin: 0; color: var(--muted); }
.fr-como { margin-top: 6px; }
.fr-como summary { cursor: pointer; font-size: .86rem; font-weight: 700; color: var(--accent-deep, var(--accent)); padding: 4px 0; }
.fr-como .fr-det { margin-top: 4px; }
.fr-nota { margin: 8px 0 0; font-size: .86rem; color: var(--muted); }
.fr-tabla { width: 100%; border-collapse: collapse; }
.fr-tabla th, .fr-tabla td { padding: 6px 8px; border-top: 1px solid var(--line); text-align: left; }
.fr-tabla thead th { border-top: 0; font-size: .78rem; color: var(--muted); }
.fr-tabla td:nth-child(2), .fr-tabla th:nth-child(2) { width: 5.5em; font-family: var(--mono); font-weight: 700; text-align: right; }
.fr-tabla tfoot td, .fr-tabla tfoot th { border-top: 2px solid var(--line-strong); font-weight: 700; }
.fr-tabla small { display: block; color: var(--muted); font-size: .76rem; font-weight: 400; }
.fr-senales { margin: 0; display: grid; gap: 6px; }
.fr-senales div { display: grid; grid-template-columns: minmax(0, 15em) minmax(0, 1fr); gap: 10px; padding: 8px 12px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .92rem; }
.fr-senales dt { font-weight: 700; } .fr-senales dd { margin: 0; }
.fr-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }
.fr-lista { margin: 0; padding-left: 1.2em; display: grid; gap: 5px; font-size: .84rem; color: var(--muted); }
.fr-lista a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
.fr-vacio { margin: 0; padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); }
.fr-dlg button:focus-visible, .fr-dlg a:focus-visible, .fr-dlg summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (max-width: 520px) { .fr-cifras { grid-template-columns: repeat(2, minmax(0, 1fr)); } .fr-senales div { grid-template-columns: minmax(0, 1fr); gap: 2px; } }
@media (forced-colors: active) { .fr-cifras li.aviso { border-width: 3px; } }
/* 875: medidor de la carga anticolinergica, con el umbral marcado */
.fr-medidor { display: flex; gap: 4px; margin: 26px 0 4px; }
.fr-medidor i { position: relative; flex: 1 1 0; height: 14px; border-radius: 4px; background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--line-strong); }
.fr-medidor i.on { background: var(--accent); box-shadow: none; }
.fr-medidor i.on.u { background: var(--precaucion); }
.fr-medidor i[data-u]::before { content: attr(data-u); position: absolute; left: -2px; top: -20px; font: 700 .74rem/1 var(--mono); color: var(--muted); }
.fr-medidor i[data-u]::after { content: ""; position: absolute; left: -3px; top: -6px; bottom: -6px; width: 2px; border-radius: 2px; background: var(--line-strong); }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .fr-medidor i.on { animation: fr-llena .3s ease-out both; } html:not(.pa-quieto) .fr-medidor i.on:nth-child(n+2) { animation-delay: .06s; } html:not(.pa-quieto) .fr-medidor i.on:nth-child(n+3) { animation-delay: .12s; } html:not(.pa-quieto) .fr-medidor i.on:nth-child(n+4) { animation-delay: .18s; } }
@keyframes fr-llena { from { opacity: 0; scale: .6 1; } }
/* 876: la potencia de cada farmaco, en tres puntos */
.fr-pot { display: inline-block; width: 34px; height: 8px; margin-right: 8px; vertical-align: 1px; --c1: var(--accent); --c2: var(--line-strong); --c3: var(--line-strong); background: radial-gradient(circle 4px at 4px 50%, var(--c1) 94%, transparent), radial-gradient(circle 4px at 17px 50%, var(--c2) 94%, transparent), radial-gradient(circle 4px at 30px 50%, var(--c3) 94%, transparent); }
.fr-pot[data-s="2"] { --c2: var(--accent); }
.fr-pot[data-s="3"] { --c1: var(--precaucion); --c2: var(--precaucion); --c3: var(--precaucion); }
.fr-tabla td:nth-child(2), .fr-tabla th:nth-child(2) { width: 7em; white-space: nowrap; }
@media (forced-colors: active) { .fr-pot { display: none; } .fr-medidor i.on { background: Highlight; } }
@media print { .fr-pot, .fr-medidor { display: none; } }
`;

let dlg = null, A = null, P = null;
const cu = () => dlg.querySelector("#fr-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function crear() {
  if (!document.getElementById("fr-css")) { const st = document.createElement("style"); st.id = "fr-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "frid"; dlg.className = "ficha alta fr-dlg"; dlg.setAttribute("aria-labelledby", "fr-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="fr-cab-t"></p><button type="button" class="btn-sec sm" id="fr-cerrar"></button></div><div class="ficha-cuerpo" id="fr-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#fr-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", async (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    if (ev.target.closest("[data-simula], [data-pruebas]")) { dlg.close(); return; } // el simulador y las pruebas los abre la aplicación
    if (ev.target.closest('[data-fr="copiar"]')) { try { await navigator.clipboard.writeText(textoHistoria(P)); A.toast(tx("copiado"), { ms: 3000 }); } catch { A.toast(tx("copia_error"), { ms: 4000 }); } }
  });
}
const fila = (k, v) => (v ? `<div><dt>${tx(k)}</dt><dd>${v}</dd></div>` : "");
function clase(c) {
  const chips = `<ul class="fr-meds">${c.meds.map((m) => `<li><button type="button" class="fr-chip" data-simula="${esc(m.pid)}" title="${esc(tx("simular_uno", { x: m.nombre }))}" aria-label="${esc(tx("simular_uno", { x: m.nombre }))}">${esc(m.nombre)}</button></li>`).join("")}</ul>`;
  const escal = c.escal ? tx("e_" + c.escal) : "";
  const como = c.indic || escal || c.vigilar ? `<details class="fr-como"><summary>${tx("como")}</summary><dl class="fr-det">${fila("indic", c.indic && c.indic + ".")}${fila("escal", escal && escal + ".")}${fila("vigilar", c.vigilar && c.vigilar + ".")}</dl></details>` : "";
  return `<li data-id="${c.id}"><b>${c.n}</b>${chips}<dl class="fr-det">${fila("dentro", c.dif)}${fila("retirar", c.cuando && c.cuando + ".")}</dl>${como}</li>`;
}
/** Medidor de la carga anticolinérgica: una casilla por punto (hasta el doble del umbral, o el total si es mayor); las que llegan al umbral van en ámbar. Solo adorno: el total y su lectura están en la tabla. */
const medidor = (c) => { const n = Math.max(UMBRAL_CALS * 2, c.total); return `<div class="fr-medidor" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < c.total ? "on" : ""}${i >= UMBRAL_CALS - 1 ? " u" : ""}"${i === UMBRAL_CALS - 1 ? ` data-u="${UMBRAL_CALS}+"` : ""}></i>`).join("")}</div>`; };
function pintar() {
  dlg.querySelector("#fr-cab-t").textContent = tx("titulo");
  if (!A.estado.meds.length) { cu().innerHTML = `<p class="fr-borrador">${tx("borrador")}</p><p class="fr-vacio">${tx("sin_meds")}</p>`; return; }
  const lista = (id, l) => `<dd id="${id}">${esc(l.join(", ")) || tx("ninguno")}</dd>`;
  cu().innerHTML = `<p class="fr-borrador">${tx("borrador")}</p><p class="fr-intro">${tx("intro")}</p>
    <ul class="fr-cifras" id="fr-cifras"><li${P.nFrid ? ' class="aviso"' : ""}><b id="fr-n-frid">${P.nFrid}</b><span>${tx("c_frid")}</span></li><li${P.cals.relevante ? ' class="aviso"' : ""}><b id="fr-n-cals">${P.cals.total}</b><span>${tx("c_cals")}</span><small>${P.cals.relevante ? tx("relevante") : tx("no_relevante")}</small></li><li><b id="fr-n-sed">${P.sedantes.length}</b><span>${tx("c_sed")}</span></li><li><b id="fr-n-hipo">${P.hipotensores.length}</b><span>${tx("c_hipo")}</span></li></ul>
    <h3>${tx("h_stopp")}</h3>
    ${P.stopp.length ? `<ul class="fr-clases" id="fr-stopp">${P.stopp.map(clase).join("")}</ul><p class="fr-nota" id="fr-siempre">${SIEMPRE.retirar} ${SIEMPRE.vigilar}</p><p class="fr-nota">${SIEMPRE.nota}</p>` : `<p class="fr-vacio" id="fr-stopp-0">${tx("ninguno_stopp")}</p>`}
    <h3>${tx("h_cals")}</h3>
    ${P.cals.filas.length ? `<table class="fr-tabla" id="fr-cals"><thead><tr><th scope="col">${tx("farmaco")}</th><th scope="col">${tx("puntos")}</th><th scope="col">${tx("potencia")}</th></tr></thead><tbody>${P.cals.filas.map((f) => `<tr><th scope="row">${esc(f.nombre)}${f.grupo ? `<small>${tx("nota_grupo")} (${f.grupo})</small>` : ""}</th><td><span class="fr-pot" data-s="${f.s}" aria-hidden="true"></span>${f.s}</td><td>${tx("p" + f.s)}</td></tr>`).join("")}</tbody><tfoot><tr><th scope="row">${tx("total")}</th><td>${P.cals.total}</td><td>${P.cals.relevante ? tx("relevante") : tx("no_relevante")}</td></tr></tfoot></table>${medidor(P.cals)}` : `<p class="fr-vacio" id="fr-cals-0">${tx("ninguno_cals")}</p>`}
    <h3>${tx("h_senales")}</h3>
    <dl class="fr-senales"><div><dt>${tx("sedantes")}</dt>${lista("fr-sed", P.sedantes)}</div><div><dt>${tx("hipotensores")}</dt>${lista("fr-hipo", P.hipotensores)}</div><div><dt>${tx("s_anticol")}</dt>${lista("fr-anticol", P.anticol)}</div><div><dt>${tx("s_acod")}</dt>${lista("fr-acod", P.anticoag)}</div></dl>
    <div class="fr-acc"><button type="button" class="btn" data-simula="">${tx("simular")}</button><button type="button" class="btn-sec" data-fr="copiar">${tx("copiar")}</button><button type="button" class="btn-sec" data-pruebas="">${t("sft.menu")}</button></div>
    <h3>${tx("limites")}</h3><ul class="fr-lista" id="fr-limites">${LIMITES.map((x) => `<li>${x}</li>`).join("")}</ul>
    <h3>${tx("fuentes")}</h3><ul class="fr-lista">${FUENTES.map((f) => `<li>${f.txt}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a></li>`).join("")}</ul>`;
}
/** Abre la ventana. */
export function abrir(api) {
  A = api;
  if (!dlg) crear();
  let items = []; try { items = api.estado.meds.length ? api.res().items : []; } catch {}
  P = panel(items);
  dlg.querySelector("#fr-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#fr-cerrar").focus();
}
