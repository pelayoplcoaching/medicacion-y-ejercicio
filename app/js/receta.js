/* Receta de ejercicio por enfermedad (segunda tanda de mejoras grandes, 16). Bajo demanda (data-abre="receta"; data-arg = id de la situación).
   Para cada una de las 18 situaciones clínicas: una tabla FITT (frecuencia, intensidad, tiempo y tipo) de referencia, lo específico de esa
   situación, lo que añade su guía y una hoja para imprimir.
   CÓMO SE HA HECHO (para no inventar pautas):
   - La tabla parte de la recomendación general de la OMS 2020 para adultos, también con enfermedades crónicas (Bull et al.), que la
     aplicación ya usa en sus lecciones revisadas.
   - Las celdas que cambian con cada situación son un RESUMEN de la regla ya revisada de la base (kb.reglas_combinadas) o de una fuente
     comprobada el 23/11/2026 en PubMed o en su web oficial: Pescatello 2004 (hipertensión), Donnelly 2009 (obesidad), KDIGO 2024 (riñón).
   - «Lo específico» es el texto de la base, tal cual, con su fuente. «Qué añade su guía» son frases de resúmenes comprobados
     (Kanaley 2022, Brooke-Wavell 2022, Campbell 2019, Mottola 2018).
   CONTENIDO CLÍNICO NUEVO (el resumen en celdas y las frases de las guías): BORRADOR PENDIENTE DE REVISIÓN CLÍNICA.
   Contenido en español, como la base; la interfaz, en cinco idiomas. */
import { idioma, t } from "./i18n.js?v=202611230223";
import { ALARMA } from "./engine.js?v=202611230223";
import { APP_VERSION } from "./version.js?v=202611230223";

const TXT = {
  es: { titulo: "Receta de ejercicio por enfermedad", borrador: "Borrador pendiente de revisión clínica", intro: "La dosis de ejercicio de referencia para cada situación y lo que cambia con ella. Es orientativa: no sustituye la valoración de su médico.", sus: "Sus situaciones", otras: "Otras situaciones", todas: "Elija una situación", dosis: "Dosis de referencia", th_f: "Frecuencia", th_i: "Intensidad", th_t: "Tiempo", th_tipo: "Tipo", aer: "Aeróbico", fue: "Fuerza", eq: "Equilibrio", leyenda: "En negrita, lo que cambia con esta situación; el resto es la recomendación general de la OMS.", manda: "Lo específico de abajo manda sobre la tabla.",
    especifico: "Lo específico de esta situación", ademas: "En su caso, además", guia: "Qué añade su guía", alarma: "Pare y consulte si nota", imprimir: "Imprimir mi receta", plan: "Ver mi plan", cien: "Verlo en cifras", fuentes: "Fuentes", fuente: "Fuente", hoja_fecha: "Fecha", hoja_nombre: "Nombre", hoja_pie: "Orientativa: no sustituye la valoración de su médico. Pauta Activa", n_sit: "{n} situaciones en la hoja",
  },
  en: { titulo: "Exercise prescription by condition", borrador: "Draft pending clinical review", intro: "The reference dose of exercise for each condition and what changes with it. It is a guide: it does not replace your doctor's assessment.", sus: "Your conditions", otras: "Other conditions", todas: "Choose a condition", dosis: "Reference dose", th_f: "Frequency", th_i: "Intensity", th_t: "Time", th_tipo: "Type", aer: "Aerobic", fue: "Strength", eq: "Balance", leyenda: "In bold, what changes with this condition; the rest is the general WHO recommendation.", manda: "The specifics below take precedence over the table.",
    especifico: "Specific to this condition", ademas: "In your case, also", guia: "What its guideline adds", alarma: "Stop and seek advice if you notice", imprimir: "Print my prescription", plan: "See my plan", cien: "See it in figures", fuentes: "Sources", fuente: "Source", hoja_fecha: "Date", hoja_nombre: "Name", hoja_pie: "A guide: it does not replace your doctor's assessment. Pauta Activa", n_sit: "{n} conditions on the sheet",
  },
  ca: { titulo: "Recepta d'exercici per malaltia", borrador: "Esborrany pendent de revisió clínica", intro: "La dosi d'exercici de referència per a cada situació i el que canvia amb ella. És orientativa: no substitueix la valoració del vostre metge.", sus: "Les vostres situacions", otras: "Altres situacions", todas: "Trieu una situació", dosis: "Dosi de referència", th_f: "Freqüència", th_i: "Intensitat", th_t: "Temps", th_tipo: "Tipus", aer: "Aeròbic", fue: "Força", eq: "Equilibri", leyenda: "En negreta, el que canvia amb aquesta situació; la resta és la recomanació general de l'OMS.", manda: "L'específic de sota mana sobre la taula.",
    especifico: "L'específic d'aquesta situació", ademas: "En el vostre cas, a més", guia: "Què hi afegeix la seva guia", alarma: "Atureu-vos i consulteu si noteu", imprimir: "Imprimir la meva recepta", plan: "Veure el meu pla", cien: "Veure-ho en xifres", fuentes: "Fonts", fuente: "Font", hoja_fecha: "Data", hoja_nombre: "Nom", hoja_pie: "Orientativa: no substitueix la valoració del vostre metge. Pauta Activa", n_sit: "{n} situacions al full",
  },
  gl: { titulo: "Receita de exercicio por enfermidade", borrador: "Borrador pendente de revisión clínica", intro: "A dose de exercicio de referencia para cada situación e o que cambia con ela. É orientativa: non substitúe a valoración do seu médico.", sus: "As súas situacións", otras: "Outras situacións", todas: "Elixa unha situación", dosis: "Dose de referencia", th_f: "Frecuencia", th_i: "Intensidade", th_t: "Tempo", th_tipo: "Tipo", aer: "Aeróbico", fue: "Forza", eq: "Equilibrio", leyenda: "En negra, o que cambia con esta situación; o resto é a recomendación xeral da OMS.", manda: "O específico de abaixo manda sobre a táboa.",
    especifico: "O específico desta situación", ademas: "No seu caso, ademais", guia: "Que engade a súa guía", alarma: "Pare e consulte se nota", imprimir: "Imprimir a miña receita", plan: "Ver o meu plan", cien: "Velo en cifras", fuentes: "Fontes", fuente: "Fonte", hoja_fecha: "Data", hoja_nombre: "Nome", hoja_pie: "Orientativa: non substitúe a valoración do seu médico. Pauta Activa", n_sit: "{n} situacións na folla",
  },
  eu: { titulo: "Ariketa-errezeta gaixotasunaren arabera", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Egoera bakoitzerako erreferentziazko ariketa-dosia eta harekin aldatzen dena. Orientagarria da: ez du zure medikuaren balorazioa ordezkatzen.", sus: "Zure egoerak", otras: "Beste egoera batzuk", todas: "Aukeratu egoera bat", dosis: "Erreferentziazko dosia", th_f: "Maiztasuna", th_i: "Intentsitatea", th_t: "Denbora", th_tipo: "Mota", aer: "Aerobikoa", fue: "Indarra", eq: "Oreka", leyenda: "Letra lodiz, egoera honekin aldatzen dena; gainerakoa OMEren gomendio orokorra da.", manda: "Beheko berariazkoak agintzen du taularen gainetik.",
    especifico: "Egoera honen berariazkoa", ademas: "Zure kasuan, gainera", guia: "Zer gehitzen duen bere gidak", alarma: "Gelditu eta kontsultatu hau nabaritzen baduzu", imprimir: "Inprimatu nire errezeta", plan: "Ikusi nire plana", cien: "Ikusi zifretan", fuentes: "Iturriak", fuente: "Iturria", hoja_fecha: "Data", hoja_nombre: "Izena", hoja_pie: "Orientagarria: ez du zure medikuaren balorazioa ordezkatzen. Pauta Activa", n_sit: "{n} egoera orrian",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/** Recomendación general de la OMS 2020 para adultos (también con enfermedades crónicas) y, desde los 65 años, equilibrio. */
export const BASE = {
  aer: { f: "Repartido en la semana, como mejor le venga", i: "Moderada (o intensa)", t: "150–300 minutos a la semana (o 75–150 si es intensa)", tipo: "Caminar a paso ligero, bicicleta, nadar, bailar", t_sin: "150–300 minutos a la semana" },
  fue: { f: "Al menos 2 días a la semana", i: "Moderada o mayor", t: "Los grandes grupos musculares", tipo: "Propio peso, bandas, mancuernas o máquinas" },
  eq: { f: "3 o más días a la semana, desde los 65 años", i: "—", t: "—", tipo: "Actividad variada que combine equilibrio y fuerza" },
};
/** Tiempo general cuando la situación fija su propia intensidad (no se ofrece la variante «intensa»). Vive en BASE.aer.t_sin para que se pueda traducir. */
export const T_SIN_INTENSA = BASE.aer.t_sin;
export const FUENTES = {
  oms: { txt: "Bull et al. Guía de la OMS 2020 de actividad física y sedentarismo. Br J Sports Med 2020", doi: "10.1136/bjsports-2020-102955" },
  pescatello: { txt: "Pescatello et al. ACSM position stand: exercise and hypertension. Med Sci Sports Exerc 2004", doi: "10.1249/01.mss.0000115224.88514.3a" },
  donnelly: { txt: "Donnelly et al. ACSM position stand: physical activity for weight loss and prevention of weight regain. Med Sci Sports Exerc 2009", doi: "10.1249/MSS.0b013e3181949333" },
  kanaley: { txt: "Kanaley et al. Exercise/physical activity in individuals with type 2 diabetes: ACSM consensus statement. Med Sci Sports Exerc 2022", doi: "10.1249/MSS.0000000000002800" },
  brooke: { txt: "Brooke-Wavell et al. Strong, steady and straight: UK consensus statement on exercise for osteoporosis. Br J Sports Med 2022", doi: "10.1136/bjsports-2021-104634" },
  campbell: { txt: "Campbell et al. Exercise guidelines for cancer survivors: consensus statement. Med Sci Sports Exerc 2019", doi: "10.1249/MSS.0000000000002116" },
  mottola: { txt: "Mottola et al. 2019 Canadian guideline for physical activity throughout pregnancy. Br J Sports Med 2018", doi: "10.1136/bjsports-2018-100056" },
  kdigo: { txt: "KDIGO 2024. Clinical practice guideline for the evaluation and management of chronic kidney disease. Kidney Int 2024", doi: "10.1016/j.kint.2023.10.018" },
  pedersen: { txt: "Pedersen y Saltin. Exercise as medicine: evidence for prescribing exercise as therapy in 26 different chronic diseases. Scand J Med Sci Sports 2015", doi: "10.1111/sms.12581" },
};
/* Las 18 situaciones. k = clave del nombre en el diccionario de la aplicación; reglas = reglas revisadas de la base que se muestran tal cual;
   c = celdas de la tabla que cambian (resumen de esas reglas, o de la fuente indicada en «f»); eq: false = sin fila de equilibrio;
   notas = frases de la guía propia (con su fuente); cien = caja de «De cada 100 personas». */
export const SITUACIONES = [
  { id: "diabetes", k: "sit.diabetes", reglas: ["diabetes_pies"], cien: "dm2", c: { aer: { tipo: "Con pérdida de sensibilidad en los pies: bicicleta, natación o elíptica antes que correr" } },
    notas: [{ f: "kanaley", x: ["En la diabetes tipo 2 valen las recomendaciones generales de actividad física, con pocas excepciones.", "Reduzca el tiempo sentado e interrúmpalo con pausas activas frecuentes.", "También ayudan los ejercicios de flexibilidad y de equilibrio."] }] },
  { id: "insuficiencia_cardiaca", k: "sit.ic", reglas: ["ic_ejercicio"], cien: "ic", c: { aer: { i: "Por la sensación de esfuerzo: debe poder hablar" } } },
  { id: "renal", k: "sit.renal.pac", reglas: [], f: "kdigo", c: { aer: { i: "Moderada", t: "Al menos 150 minutos a la semana, o hasta donde lo permita su tolerancia cardiovascular y física" } } },
  { id: "marcapasos", k: "sit.marcapasos", reglas: ["marcapasos_fc", "dai_fc"], c: { aer: { i: "Por la sensación de esfuerzo; con DAI, 10–20 latidos por debajo de la frecuencia de detección" }, fue: { tipo: "Sin cargar ni estirar con fuerza el hombro del dispositivo las primeras 6–8 semanas" } } },
  { id: "osteoporosis", k: "sit.osteoporosis", reglas: ["osteoporosis_plan"], c: { aer: { tipo: "Impacto moderado: caminar rápido, escaleras" }, fue: { tipo: "Piernas y extensores de la espalda; sin flexiones de columna con carga" }, eq: { tipo: "Equilibrio para prevenir caídas" } },
    notas: [{ f: "brooke", x: ["Fuerza e impacto para el hueso, fuerza y equilibrio para evitar caídas, y ejercicios de extensión de la columna para la postura.", "Evite las posturas con mucha flexión de la columna, al hacer ejercicio y en el día a día.", "Con fractura vertebral o varias fracturas por traumatismos leves, el impacto no debe pasar, en general, del de caminar a paso ligero.", "Si hay riesgo de caídas, empiece por fuerza y equilibrio."] }] },
  { id: "epoc_asma", k: "sit.epoc", reglas: ["epoc_plan"], c: { aer: { i: "Por la escala de disnea: debe poder hablar frases cortas" }, fue: { tipo: "Sobre todo piernas" } } },
  { id: "oxigeno", k: "sit.oxigeno", reglas: ["oxigeno_cond"], c: { aer: { tipo: "Intervalos cortos, con el oxígeno al flujo pautado para el esfuerzo" }, fue: { tipo: "Sobre todo piernas" } } },
  { id: "embarazo", k: "sit.embarazo", reglas: ["embarazo"], eq: false, c: { aer: { i: "Moderada", t: "150 minutos a la semana", tipo: "Sin contacto ni riesgo de caída" } },
    notas: [{ f: "mottola", x: ["En la guía canadiense, los beneficios de la actividad física en el embarazo son moderados y no se identificaron daños."] }] },
  { id: "hipertension", k: "sit.hipertension", reglas: ["hipertension_cond"], f: "pescatello", c: { aer: { f: "La mayoría de los días, mejor todos", i: "Moderada (40–<60 % de la reserva)", t: "30 minutos o más al día, seguidos o sumando ratos", tipo: "Sobre todo resistencia aeróbica" }, fue: { i: "Moderada, sin cargas máximas y sin aguantar el aire", tipo: "Como complemento del aeróbico" } },
    notas: [{ f: "pescatello", x: ["Tras una sesión de ejercicio aeróbico, la bajada de la tensión puede durar hasta 22 horas."] }] },
  { id: "cardiopatia_isquemica", k: "sit.cardiopatia", reglas: ["cardiopatia_isquemica"], cien: "ci", c: { aer: { i: "Ligera-moderada al empezar; progrese despacio", tipo: "Con calentamiento y enfriamiento de al menos 10 minutos" }, fue: { i: "Sin esfuerzos máximos, isométricos intensos ni aguantar la respiración" } } },
  { id: "fibrilacion_auricular", k: "sit.fa", reglas: ["fibrilacion_auricular"], cien: "fa", c: { aer: { i: "Moderada, por la sensación de esfuerzo o la prueba del habla (el pulso no sirve)" } } },
  { id: "aneurisma_aorta", k: "sit.aneurisma", reglas: ["aneurisma_aorta"], c: { aer: { i: "Moderada" }, fue: { i: "Ligera: la carga máxima la fija su cardiólogo o cirujano vascular", tipo: "Sin pesos pesados, isométricos intensos ni aguantar la respiración" } } },
  { id: "ictus", k: "sit.ictus", reglas: ["ictus"], c: { fue: { tipo: "También el lado afectado" }, eq: { tipo: "Siempre con apoyo" } } },
  { id: "cancer", k: "sit.cancer", reglas: ["cancer_cond"], c: { aer: { f: "3 sesiones a la semana", t: "30 minutos por sesión" }, fue: { f: "2 sesiones a la semana", tipo: "Sin cargar un segmento con metástasis en el hueso" } },
    notas: [{ f: "campbell", x: ["Evite la inactividad: el ejercicio es, en general, seguro para quien tiene o ha tenido un cáncer.", "Con dosis concretas de ejercicio aeróbico, de fuerza o de ambos mejoran la ansiedad, el ánimo, el cansancio, la función física y la calidad de vida."] }] },
  { id: "artrosis", k: "sit.artrosis", reglas: ["artrosis"], c: { aer: { tipo: "Bajo impacto: bicicleta, piscina, caminar" }, fue: { tipo: "Cuádriceps y glúteo" } } },
  { id: "epilepsia", k: "sit.epilepsia", reglas: ["epilepsia_cond"], c: { aer: { tipo: "Si no lleva un año sin crisis: no solo en el agua, ni en altura, ni con máquinas peligrosas" } } },
  { id: "hepatopatia", k: "sit.hepatopatia", reglas: ["hepatopatia_cond"], c: { aer: { i: "Moderada" }, fue: { i: "Sin esfuerzos intensos ni aguantar la respiración si hay varices o ascitis" } } },
  { id: "obesidad", k: "sit.obesidad", reglas: ["obesidad_cond"], f: "donnelly", c: { aer: { t: "150–250 minutos a la semana para no ganar peso; más de 250 para perderlo de forma significativa y mantenerlo", tipo: "Caminar, bicicleta o piscina: cargan menos las articulaciones" }, fue: { f: "2–3 días a la semana" } },
    notas: [{ f: "donnelly", x: ["La fuerza no aumenta por sí sola la pérdida de peso, pero puede aumentar la masa magra y la pérdida de grasa."] }] },
];
export const situacion = (id) => SITUACIONES.find((s) => s.id === id) || null;
const COLS = ["f", "i", "t", "tipo"];
/** Tabla FITT de una situación: [{ fila: "aer" | "fue" | "eq", celdas: [{ col, txt, propio }] }] (propio = cambia con la situación). */
export function tabla(id) {
  const s = situacion(id); if (!s) return [];
  return ["aer", "fue", "eq"].filter((f) => f !== "eq" || s.eq !== false).map((f) => ({ fila: f, celdas: COLS.map((col) => { const propio = s.c?.[f]?.[col]; return { col, txt: propio || (f === "aer" && col === "t" && s.c?.aer?.i ? BASE.aer.t_sin : BASE[f][col]), propio: !!propio }; }) }));
}
/** Fuentes que respaldan la receta de una situación: la OMS, la suya propia (si la hay) y las de sus notas. */
export const fuentesDe = (id) => { const s = situacion(id); return s ? [...new Set(["oms", s.f, ...(s.notas || []).map((n) => n.f), "pedersen"].filter(Boolean))].map((k) => FUENTES[k]) : []; };
/** Reglas revisadas de la base para una situación: las propias (siempre) y las que han saltado en esta lista (res.combinadas) y la nombran. */
export function reglasDe(id, kb, combinadas = []) {
  const s = situacion(id); if (!s) return { propias: [], ademas: [] };
  const propias = s.reglas.map((r) => kb.reglas_combinadas.find((x) => x.id === r)).filter(Boolean).map((r) => ({ id: r.id, titulo: r.titulo, texto: r.texto, fuente: r.fuente || "" }));
  const toca = (si) => JSON.stringify(si).split('"').includes(id) || (id === "renal" && JSON.stringify(si).includes('"renal_grave"'));
  const ademas = combinadas.filter((c) => !s.reglas.includes(c.regla.id) && toca(c.regla.si)).map((c) => ({ id: c.regla.id, titulo: c.regla.titulo, texto: c.texto, fuente: c.regla.fuente || "" }));
  return { propias, ademas };
}

const CSS = `
.rx-dlg { width: min(900px, calc(100vw - 16px)); }
.rx-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.rx-intro { margin: 0 0 12px; color: var(--muted); }
.rx-grupo { margin: 0 0 4px; font-size: .78rem; font-weight: 700; color: var(--muted); }
.rx-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; padding: 0; list-style: none; }
.rx-chips button { min-height: 38px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--fg); font: inherit; font-size: .9rem; cursor: pointer; }
.rx-chips button.mia { border-color: var(--accent); font-weight: 700; }
.rx-chips button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--surface); font-weight: 700; }
.rx-dlg h3 { margin: 4px 0 8px; font-size: 1.2rem; }
.rx-dlg h4 { margin: 16px 0 6px; font-size: .95rem; }
.rx-tabla { width: 100%; border-collapse: collapse; font-size: .9rem; }
.rx-tabla th, .rx-tabla td { padding: 7px 8px; border-top: 1px solid var(--line); text-align: left; vertical-align: top; }
.rx-tabla thead th { border-top: 0; font-size: .74rem; color: var(--muted); }
.rx-tabla tbody th { white-space: nowrap; color: var(--accent-deep, var(--accent)); }
.rx-tabla td.propio { font-weight: 700; }
.rx-tabla td:not(.propio) { color: var(--muted); }
.rx-nota { margin: 6px 0 0; font-size: .82rem; color: var(--muted); }
.rx-regla { margin: 0 0 8px; padding: 10px 12px; border-left: 4px solid var(--accent); border-radius: var(--r-sm); background: var(--surface-2); }
.rx-regla b { display: block; margin-bottom: 2px; }
.rx-regla p { margin: 0; line-height: 1.45; }
.rx-regla small { display: block; margin-top: 4px; color: var(--muted); font-size: .78rem; }
.rx-lista { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; }
.rx-lista.sm { font-size: .84rem; color: var(--muted); }
.rx-lista a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
.rx-acc { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 14px 0 0; }
.rx-acc small { color: var(--muted); }
.rx-dlg button:focus-visible, .rx-dlg a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (max-width: 640px) {
  .rx-tabla thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .rx-tabla, .rx-tabla tbody, .rx-tabla tr, .rx-tabla th, .rx-tabla td { display: block; }
  .rx-tabla tr { padding: 8px 0; border-top: 1px solid var(--line-strong); }
  .rx-tabla th, .rx-tabla td { border: 0; padding: 2px 0; }
  .rx-tabla td::before { content: attr(data-th) ": "; font-weight: 400; color: var(--muted); }
}
#rx-hoja { display: none; }
@media print {
  body.rx-imprime > *:not(#rx-hoja) { display: none !important; }
  body.rx-imprime #rx-hoja { display: block; color: #000; background: #fff; font: 11pt/1.4 system-ui, sans-serif; }
  #rx-hoja h1 { margin: 0 0 4pt; font-size: 19pt; } #rx-hoja h2 { margin: 16pt 0 4pt; font-size: 14pt; break-after: avoid; } #rx-hoja h3 { margin: 10pt 0 3pt; font-size: 11pt; break-after: avoid; }
  #rx-hoja table { width: 100%; border-collapse: collapse; break-inside: avoid; } #rx-hoja th, #rx-hoja td { padding: 4pt 5pt; border: 1px solid #777; text-align: left; vertical-align: top; font-size: 10pt; }
  #rx-hoja td.propio { font-weight: 700; } #rx-hoja p { margin: 3pt 0; } #rx-hoja ul { margin: 2pt 0; padding-left: 14pt; } #rx-hoja small { font-size: 8.5pt; color: #444; }
  #rx-hoja footer { margin-top: 14pt; padding-top: 5pt; border-top: 1px solid #777; font-size: 9pt; color: #444; }
}
/* 868-869: cada modalidad de la receta con su icono y las letras F, I, T, T en cada celda */
.rx-tabla tbody th { position: relative; padding-left: 38px; }
.rx-tabla tbody th::before, .rx-tabla tbody th::after { content: ""; position: absolute; left: 4px; top: 5px; width: 26px; height: 26px; border-radius: 8px; }
.rx-tabla tbody th::before { background: var(--accent-soft); }
.rx-tabla tbody th::after { background: var(--accent-deep, var(--accent)); -webkit-mask: var(--rx-ic) center / 16px no-repeat; mask: var(--rx-ic) center / 16px no-repeat; }
.rx-tabla tr[data-f="aer"] { --rx-ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='13' cy='4.5' r='1.6'/%3E%3Cpath d='M9 21l2-6-2-3 1-4 4 2 3 1M11 15l3 2 1 4M8 11l2-3'/%3E%3C/svg%3E"); }
.rx-tabla tr[data-f="fue"] { --rx-ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12'/%3E%3C/svg%3E"); }
.rx-tabla tr[data-f="eq"] { --rx-ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='4.5' r='1.6'/%3E%3Cpath d='M5 9h14M12 9v6M12 15l-3 6M12 15l3 6'/%3E%3C/svg%3E"); }
.rx-tabla td::before { content: attr(data-th); display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 5px; background: var(--surface-2); color: var(--muted); font-family: var(--mono); font-size: .66rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; vertical-align: 1px; }
.rx-tabla td.propio::before { background: var(--accent); color: var(--surface); }
@media (max-width: 640px) { .rx-tabla tr { padding: 10px 12px; margin: 0 0 8px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); } .rx-tabla tbody th { font-size: 1rem; } }
@media (min-width: 641px) { .rx-tabla td::before { display: none; } }
@media print { .rx-tabla tbody th::before, .rx-tabla tbody th::after, .rx-tabla td::before { display: none; } .rx-tabla tbody th { padding-left: 8px; } }
@media (forced-colors: active) { .rx-tabla tbody th::after { background: CanvasText; } }
`;

let dlg = null, A = null, sel = null;
const cu = () => dlg.querySelector("#rx-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mias = () => { const c = new Set(A?.estado?.condiciones || []); return SITUACIONES.filter((s) => c.has(s.id)).map((s) => s.id); };
const combinadas = () => { try { return A.estado.meds.length ? A.res().combinadas : []; } catch { return []; } };
function crear() {
  if (!document.getElementById("rx-css")) { const st = document.createElement("style"); st.id = "rx-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "receta"; dlg.className = "ficha alta rx-dlg"; dlg.setAttribute("aria-labelledby", "rx-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="rx-cab-t"></p><button type="button" class="btn-sec sm" id="rx-cerrar"></button></div><div class="ficha-cuerpo" id="rx-cuerpo"></div>`;
  document.body.append(dlg);
  if (!document.getElementById("rx-hoja")) { const h = document.createElement("section"); h.id = "rx-hoja"; h.setAttribute("aria-hidden", "true"); document.body.append(h); }
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#rx-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const ch = ev.target.closest("[data-rx-sit]"); if (ch) { sel = ch.dataset.rxSit; pintar(); cu().querySelector("#rx-ficha")?.scrollIntoView({ block: "nearest" }); cu().querySelector(`[data-rx-sit="${sel}"]`)?.focus(); return; }
    const b = ev.target.closest("[data-rx]"); if (!b) return;
    if (b.dataset.rx === "imprimir") imprimir();
    else if (b.dataset.rx === "plan") { dlg.close(); A.irTab("plan"); }
  });
}
const th = () => `<thead><tr><th scope="col"></th>${COLS.map((c) => `<th scope="col">${tx("th_" + c)}</th>`).join("")}</tr></thead>`;
const tablaHtml = (id, cls = "rx-tabla") => `<table class="${cls}">${th()}<tbody>${tabla(id).map((r) => `<tr data-f="${r.fila}"><th scope="row">${tx(r.fila)}</th>${r.celdas.map((c) => `<td data-th="${esc(tx("th_" + c.col))}"${c.propio ? ' class="propio"' : ""}>${c.txt}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const reglaHtml = (r) => `<div class="rx-regla" data-regla="${r.id}"><b>${esc(r.titulo)}</b><p>${esc(r.texto)}</p>${r.fuente ? `<small>${tx("fuente")}: ${esc(r.fuente)}</small>` : ""}</div>`;
const enlace = (f) => `<li>${f.txt}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a></li>`;
function ficha(id) {
  const s = situacion(id), R = reglasDe(id, A.datos.kb, combinadas());
  return `<section id="rx-ficha" data-id="${id}"><h3>${t(s.k)}</h3>
    <h4>${tx("dosis")}</h4>${tablaHtml(id)}<p class="rx-nota">${tx("leyenda")} <b>${tx("manda")}</b></p>
    ${R.propias.length ? `<h4>${tx("especifico")}</h4><div id="rx-propias">${R.propias.map(reglaHtml).join("")}</div>` : ""}
    ${R.ademas.length ? `<h4>${tx("ademas")}</h4><div id="rx-ademas">${R.ademas.map(reglaHtml).join("")}</div>` : ""}
    ${(s.notas || []).length ? `<h4>${tx("guia")}</h4><ul class="rx-lista" id="rx-guia">${s.notas.flatMap((n) => n.x).map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
    <h4>${tx("alarma")}</h4><ul class="rx-lista" id="rx-alarma">${ALARMA.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    <div class="rx-acc"><button type="button" class="btn" data-rx="imprimir">${tx("imprimir")}</button><button type="button" class="btn-sec" data-rx="plan">${tx("plan")}</button>${s.cien ? `<button type="button" class="btn-sec" data-abre="cien" data-arg="${s.cien}">${tx("cien")}</button>` : ""}<small id="rx-n">${tx("n_sit", { n: String(paraHoja(mias(), id).length) })}</small></div>
    <h4>${tx("fuentes")}</h4><ul class="rx-lista sm" id="rx-fuentes">${fuentesDe(id).map(enlace).join("")}</ul></section>`;
}
/** Situaciones que van a la hoja: las marcadas en los datos y, si la que se está viendo no lo está, también esa. */
export const paraHoja = (marcadas, vista) => [...new Set([...marcadas, ...(vista ? [vista] : [])])];
function imprimir() {
  const hoja = document.getElementById("rx-hoja"), ids = paraHoja(mias(), sel), comb = combinadas();
  hoja.innerHTML = `<h1>${tx("titulo")}</h1><p>${tx("hoja_fecha")}: ${new Date().toLocaleDateString(idioma())} · ${tx("hoja_nombre")}: ______________________________</p><p><small>${tx("leyenda")} ${tx("manda")}</small></p>
    ${ids.map((id) => { const s = situacion(id), R = reglasDe(id, A.datos.kb, comb); return `<h2>${t(s.k)}</h2>${tablaHtml(id, "")}${[...R.propias, ...R.ademas].map((r) => `<h3>${esc(r.titulo)}</h3><p>${esc(r.texto)}</p>`).join("")}${(s.notas || []).length ? `<ul>${s.notas.flatMap((n) => n.x).map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}`; }).join("")}
    <h2>${tx("alarma")}</h2><ul>${ALARMA.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    <footer>${tx("hoja_pie")} · v${APP_VERSION}</footer>`;
  document.body.classList.add("rx-imprime");
  const fin = () => { document.body.classList.remove("rx-imprime"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch { fin(); } }, 120);
}
function pintar() {
  dlg.querySelector("#rx-cab-t").textContent = tx("titulo");
  const m = new Set(mias()), chip = (s) => `<li><button type="button" data-rx-sit="${s.id}" aria-pressed="${sel === s.id}"${m.has(s.id) ? ' class="mia"' : ""}>${t(s.k)}</button></li>`;
  const sus = SITUACIONES.filter((s) => m.has(s.id)), otras = SITUACIONES.filter((s) => !m.has(s.id));
  cu().innerHTML = `<p class="rx-borrador">${tx("borrador")}</p><p class="rx-intro">${tx("intro")}</p>
    ${sus.length ? `<p class="rx-grupo">${tx("sus")}</p><ul class="rx-chips" id="rx-sus">${sus.map(chip).join("")}</ul>` : ""}
    <p class="rx-grupo">${sus.length ? tx("otras") : tx("todas")}</p><ul class="rx-chips" id="rx-otras">${otras.map(chip).join("")}</ul>
    ${sel ? ficha(sel) : ""}`;
}
/** Abre la ventana (arg = id de una situación; sin él, la primera de las marcadas en los datos). */
export function abrir(api, arg) {
  A = api;
  if (!dlg) crear();
  dlg.querySelector("#rx-cerrar").textContent = api.cerrar();
  sel = situacion(arg) ? arg : mias()[0] || null;
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#rx-cerrar").focus();
}
