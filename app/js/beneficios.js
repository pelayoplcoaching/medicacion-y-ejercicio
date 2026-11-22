/* «Lo que el ejercicio hace por usted» (mejora grande 3): beneficios del ejercicio con cifras reales de revisiones
   sistemáticas, metaanálisis y ensayos, solo para lo que la persona ha marcado (más el ánimo para todos y las caídas
   desde los 65 años o tras una caída). Cada tarjeta: la cifra, qué significa en lenguaje llano, el tipo de estudio, la
   certeza cuando la revisión la da (GRADE) y la fuente con su DOI. Cifras comprobadas en PubMed el 21/11/2026, una a una,
   en el resumen de cada artículo. Contenido en español (como el resto del contenido clínico) y en borrador hasta la
   revisión clínica; la interfaz, en cinco idiomas. Se carga al pintar «Antes de empezar». */
import { idioma } from "./i18n.js?v=202611220031";

const F = (txt, doi) => ({ txt, doi });
/** Por situación: id de la situación (los de «Situación clínica») → tarjetas. «todos» y «mayores» se añaden solos. */
export const BENEFICIOS = {
  todos: [
    { id: "animo", cifra: "Igual", unidad: "que la psicoterapia (10 ensayos)", titulo: "Mejor ánimo", texto: "En personas con depresión, el ejercicio reduce los síntomas con un efecto moderado (certeza baja) y, en los 10 ensayos que lo comparan con psicoterapia, probablemente funciona igual de bien (certeza moderada).", estudio: "Revisión Cochrane de 73 ensayos", certeza: "baja a moderada", fuentes: [F("Clegg 2026, Cochrane", "10.1002/14651858.CD004366.pub7")] },
  ],
  mayores: [
    { id: "caidas", cifra: "−23 %", unidad: "caídas", titulo: "Menos caídas", texto: "En mayores que viven en su casa, el ejercicio reduce las caídas un 23 %: unas 195 caídas menos por cada 1000 personas en un año. Los programas de equilibrio y ejercicios funcionales las reducen un 24 %; combinados con fuerza, probablemente hasta un 34 %.", estudio: "Revisión Cochrane de 108 ensayos (23 407 personas)", certeza: "alta", fuentes: [F("Sherrington 2019, Cochrane", "10.1002/14651858.CD012424.pub2")] },
  ],
  diabetes: [
    { id: "hba1c", cifra: "−0,7", unidad: "puntos de HbA1c", titulo: "Mejor control del azúcar", texto: "En la diabetes tipo 2, el ejercicio estructurado baja la hemoglobina glicada 0,67 puntos de media. Con más de 150 minutos a la semana, 0,89 puntos; con 150 o menos, 0,36.", estudio: "Metaanálisis de 47 ensayos (8538 personas)", fuentes: [F("Umpierre 2011, JAMA", "10.1001/jama.2011.576")] },
  ],
  hipertension: [
    { id: "ta", cifra: "−4 a −8", unidad: "mmHg de tensión sistólica", titulo: "Tensión más baja", texto: "Todos los tipos de ejercicio bajan la tensión en reposo: aeróbico −4,5/−2,5 mmHg, fuerza −4,6/−3,0, los dos combinados −6,0/−2,5 y los isométricos (como la sentadilla apoyada en la pared) −8,2/−4,0.", estudio: "Metaanálisis de 270 ensayos (15 827 personas)", fuentes: [F("Edwards 2023, Br J Sports Med", "10.1136/bjsports-2022-106503")] },
    { id: "ta_hta", cifra: "−8/−5", unidad: "mmHg con hipertensión", titulo: "Más efecto si la tensión está alta", texto: "En personas con hipertensión, el ejercicio aeróbico regular bajó la tensión 8,3/5,2 mmHg, bastante más que en quienes la tenían normal.", estudio: "Metaanálisis de 93 ensayos (5223 personas)", fuentes: [F("Cornelissen 2013, J Am Heart Assoc", "10.1161/JAHA.112.004473")] },
  ],
  insuficiencia_cardiaca: [
    { id: "ic", cifra: "−30 %", unidad: "ingresos en el hospital", titulo: "Menos ingresos", texto: "La rehabilitación con ejercicio reduce los ingresos hospitalarios por cualquier causa en el primer año (16,5 % frente a 23,7 %: uno evitado por cada 14 personas), puede reducir los ingresos por la propia insuficiencia cardiaca y mejora la calidad de vida.", estudio: "Revisión Cochrane de 44 ensayos (5783 personas)", certeza: "moderada (ingresos)", fuentes: [F("Long 2019, Cochrane", "10.1002/14651858.CD003331.pub5")] },
  ],
  cardiopatia_isquemica: [
    { id: "ci", cifra: "−28 %", unidad: "infartos", titulo: "Menos infartos e ingresos", texto: "Tras un infarto, un stent o un bypass, la rehabilitación con ejercicio reduce los infartos un 28 % y los ingresos por cualquier causa un 42 % en el primer año; a largo plazo, posiblemente también la mortalidad cardiovascular.", estudio: "Revisión Cochrane de 85 ensayos (23 430 personas)", certeza: "alta (infartos), moderada (ingresos)", fuentes: [F("Dibben 2021, Cochrane", "10.1002/14651858.CD001800.pub4")] },
  ],
  fibrilacion_auricular: [
    { id: "fa", cifra: "40 % / 20 %", unidad: "sin fibrilación al año", titulo: "Menos fibrilación", texto: "En personas con fibrilación auricular con síntomas, 6 meses de ejercicio aeróbico duplicaron las que seguían sin fibrilación al año (40 % frente a 20 %) y redujeron los síntomas.", estudio: "Ensayo aleatorizado (120 personas)", fuentes: [F("Elliott 2023, JACC Clin Electrophysiol", "10.1016/j.jacep.2022.12.002")] },
    { id: "fa_vo2", cifra: "+3,8", unidad: "ml/kg/min de capacidad de esfuerzo", titulo: "Más capacidad de esfuerzo", texto: "La rehabilitación con ejercicio mejora la capacidad de esfuerzo (VO₂ pico). Con tan pocos ensayos no se puede saber su efecto en la mortalidad.", estudio: "Revisión Cochrane de 6 ensayos (421 personas)", certeza: "moderada", fuentes: [F("Risom 2017, Cochrane", "10.1002/14651858.CD011197.pub2")] },
  ],
  epoc_asma: [
    { id: "epoc", cifra: "+44 m", unidad: "en 6 minutos andando", titulo: "Menos falta de aire", texto: "En la EPOC, la rehabilitación respiratoria (ejercicio durante al menos 4 semanas) alivia la falta de aire y el cansancio más de lo que se considera clínicamente importante y mejora la calidad de vida.", estudio: "Revisión Cochrane de 65 ensayos (3822 personas)", certeza: "moderada (falta de aire)", fuentes: [F("McCarthy 2015, Cochrane", "10.1002/14651858.CD003793.pub3")] },
  ],
  renal: [
    { id: "renal", cifra: "−6", unidad: "mmHg de tensión sistólica", titulo: "Más forma y menos tensión", texto: "En la enfermedad renal crónica (también en diálisis o con trasplante), el ejercicio regular mejora la forma física y la capacidad de andar, baja la tensión (6 mmHg la sistólica) y el pulso en reposo y mejora la calidad de vida.", estudio: "Revisión Cochrane de 45 ensayos (1863 personas)", fuentes: [F("Heiwe 2011, Cochrane", "10.1002/14651858.CD003236.pub2")] },
  ],
  osteoporosis: [
    { id: "hueso", cifra: "+3,2 %", unidad: "de densidad ósea en la columna", titulo: "Frena la pérdida de hueso", texto: "Tras la menopausia, los programas de ejercicio combinados aumentaron la densidad de la columna un 3,2 % y la fuerza de piernas la del cuello del fémur un 1 %, frente a no hacer ejercicio. No se demostró un efecto directo en las fracturas.", estudio: "Revisión Cochrane de 43 ensayos (4320 mujeres)", certeza: "baja (calidad de los estudios)", fuentes: [F("Howe 2011, Cochrane", "10.1002/14651858.CD000333.pub2")] },
    { id: "fracturas", cifra: "−27 %", unidad: "fracturas por caídas", titulo: "Menos fracturas por caídas", texto: "En mayores, el ejercicio puede reducir las fracturas por caídas un 27 %.", estudio: "Revisión Cochrane de 108 ensayos", certeza: "baja", fuentes: [F("Sherrington 2019, Cochrane", "10.1002/14651858.CD012424.pub2")] },
  ],
  artrosis: [
    { id: "artrosis", cifra: "−12", unidad: "puntos de dolor (de 100), rodilla", titulo: "Menos dolor y más movilidad", texto: "En la artrosis de rodilla, el ejercicio reduce el dolor 12 puntos sobre 100 y mejora la función 10, un efecto comparable al de los antiinflamatorios; en la de cadera, 8 y 7 puntos, y la mejoría se mantiene meses después.", estudio: "Revisiones Cochrane: 44 ensayos en rodilla y 10 en cadera", certeza: "alta (dolor)", fuentes: [F("Fransen 2015, Cochrane (rodilla)", "10.1002/14651858.CD004376.pub3"), F("Fransen 2014, Cochrane (cadera)", "10.1002/14651858.CD007912.pub2")] },
  ],
  ictus: [
    { id: "ictus", cifra: "+2,4", unidad: "ml/kg/min de forma física", titulo: "Más forma y más fuerza", texto: "Tras un ictus, el ejercicio aeróbico mejora algo la forma física y la velocidad al andar (certeza moderada) y el de fuerza probablemente aumenta la fuerza de brazos y piernas (certeza moderada). En estos ensayos no cambió la mortalidad ni el riesgo de un nuevo ictus.", estudio: "Revisiones Cochrane: 53 ensayos de aeróbico y 27 de fuerza", certeza: "moderada", fuentes: [F("Kramer 2026, Cochrane (aeróbico)", "10.1002/14651858.CD016000"), F("Saunders 2025, Cochrane (fuerza)", "10.1002/14651858.CD016001")] },
  ],
  cancer: [
    { id: "cancer", cifra: "Moderado", unidad: "alivio del cansancio", titulo: "Menos cansancio", texto: "Durante el tratamiento del cáncer, el ejercicio aeróbico, el de fuerza y su combinación reducen el cansancio con un efecto moderado; después del tratamiento, también el yoga y el tai chi.", estudio: "Metaanálisis en red de 245 ensayos", fuentes: [F("Hilfiker 2018, Br J Sports Med", "10.1136/bjsports-2016-096422")] },
  ],
  obesidad: [
    { id: "visceral", cifra: "−6 %", unidad: "de grasa visceral sin bajar de peso", titulo: "Menos grasa de la que importa", texto: "Sin bajar de peso, el ejercicio reduce un 6 % la grasa que rodea los órganos (la que más se relaciona con la enfermedad) y la dieta apenas un 1 %. La dieta, en cambio, hace bajar más de peso.", estudio: "Metaanálisis de 117 estudios (4815 personas)", fuentes: [F("Verheggen 2016, Obes Rev", "10.1111/obr.12406")] },
  ],
  embarazo: [
    { id: "embarazo", cifra: "−38 %", unidad: "diabetes del embarazo", titulo: "Menos complicaciones del embarazo", texto: "Sin contraindicación médica, el ejercicio en el embarazo reduce la probabilidad de diabetes gestacional un 38 %, de hipertensión gestacional un 39 % y de preeclampsia un 41 %. Para reducirlas al menos un 25 % hacen falta unos 140 minutos a la semana de ejercicio moderado, como caminar rápido.", estudio: "Metaanálisis de 106 estudios (273 182 embarazadas)", certeza: "moderada a alta", fuentes: [F("Davenport 2018, Br J Sports Med", "10.1136/bjsports-2018-099355")] },
  ],
  epilepsia: [
    { id: "epilepsia", cifra: "+4,7", unidad: "puntos de calidad de vida", titulo: "Mejor calidad de vida", texto: "En personas con epilepsia, el ejercicio mejoró la calidad de vida, la forma física y el ánimo, y las crisis no aumentaron. Son estudios pequeños.", estudio: "Metaanálisis de 14 estudios (331 personas)", fuentes: [F("Duñabeitia 2022, Epilepsy Behav", "10.1016/j.yebeh.2022.108959")] },
  ],
  hepatopatia: [
    { id: "cirrosis", cifra: "+69 m", unidad: "en 6 minutos andando", titulo: "Más capacidad y menos cansancio", texto: "En la cirrosis, el ejercicio mejoró la capacidad de andar, el músculo del muslo y el cansancio; con suplementos de aminoácidos, más. Son pocos ensayos y pequeños.", estudio: "Metaanálisis de 8 ensayos (220 personas)", fuentes: [F("Hsieh 2024, Dig Dis Sci", "10.1007/s10620-024-08447-0")] },
  ],
  marcapasos: [
    { id: "dai", cifra: "−53 %", unidad: "probabilidad de descargas del DAI", titulo: "Más forma y menos descargas", texto: "En personas con desfibrilador (DAI) e insuficiencia cardiaca, entrenar mejoró la forma física y se asoció a menos descargas del desfibrilador.", estudio: "Metaanálisis de 6 ensayos", fuentes: [F("Pandey 2017, JACC Clin Electrophysiol", "10.1016/j.jacep.2016.06.008")] },
  ],
};
/* el oxígeno en casa va casi siempre con una enfermedad respiratoria: se le enseña la de la EPOC */
const ALIAS = { oxigeno: "epoc_asma" };
export const SIT = { todos: "Para todos", mayores: "Desde los 65", diabetes: "Diabetes", hipertension: "Hipertensión", insuficiencia_cardiaca: "Insuficiencia cardiaca", cardiopatia_isquemica: "Infarto, stent o angina", fibrilacion_auricular: "Fibrilación auricular", epoc_asma: "EPOC o asma", renal: "Enfermedad renal", osteoporosis: "Osteoporosis", artrosis: "Artrosis", ictus: "Ictus", cancer: "Cáncer", obesidad: "Obesidad", embarazo: "Embarazo", epilepsia: "Epilepsia", hepatopatia: "Hepatopatía", marcapasos: "Marcapasos o DAI" };
/** Qué grupos de tarjetas tocan: las situaciones marcadas (sin repetir), «mayores» desde los 65 o con caídas, y «todos». */
export function situaciones({ condiciones = [], edad = null, caidas = false } = {}) {
  const ids = [];
  for (const c of condiciones) { const id = ALIAS[c] || c; if (BENEFICIOS[id] && !ids.includes(id) && id !== "todos" && id !== "mayores") ids.push(id); }
  const orden = Object.keys(BENEFICIOS); ids.sort((x, y) => orden.indexOf(x) - orden.indexOf(y));
  if ((edad != null && edad >= 65) || caidas) ids.push("mayores");
  ids.push("todos");
  return ids;
}
export const tarjetas = (ids) => ids.flatMap((id) => (BENEFICIOS[id] || []).map((b) => ({ ...b, sit: id })));

export const TXT = {
  es: { intro: "Lo que han encontrado las revisiones de ensayos para su situación: la cifra, lo que significa y de dónde sale.", borrador: "Borrador pendiente de revisión clínica", certeza: "Certeza {c}", ver_mas: "Ver las {n} tarjetas", ver_menos: "Ver menos", marque: "Marque su situación clínica en «Sus datos» para ver los beneficios que más le tocan.", n: "{n} beneficios", n1: "1 beneficio", fuente: "Fuente" },
  en: { intro: "What reviews of trials have found for your situation: the figure, what it means and where it comes from.", borrador: "Draft pending clinical review", certeza: "Certainty {c}", ver_mas: "See all {n} cards", ver_menos: "See less", marque: "Tick your clinical situation in “Your details” to see the benefits that matter most to you.", n: "{n} benefits", n1: "1 benefit", fuente: "Source" },
  ca: { intro: "El que han trobat les revisions d'assajos per a la seva situació: la xifra, què vol dir i d'on surt.", borrador: "Esborrany pendent de revisió clínica", certeza: "Certesa {c}", ver_mas: "Veure les {n} targetes", ver_menos: "Veure'n menys", marque: "Marqui la seva situació clínica a «Les seves dades» per veure els beneficis que més li toquen.", n: "{n} beneficis", n1: "1 benefici", fuente: "Font" },
  gl: { intro: "O que atoparon as revisións de ensaios para a súa situación: a cifra, o que significa e de onde sae.", borrador: "Borrador pendente de revisión clínica", certeza: "Certeza {c}", ver_mas: "Ver as {n} tarxetas", ver_menos: "Ver menos", marque: "Marque a súa situación clínica en «Os seus datos» para ver os beneficios que máis lle tocan.", n: "{n} beneficios", n1: "1 beneficio", fuente: "Fonte" },
  eu: { intro: "Saiakuntzen berrikuspenek zure egoerarako aurkitu dutena: zifra, zer esan nahi duen eta nondik datorren.", borrador: "Zirriborroa, berrikuspen klinikoaren zain", certeza: "Ziurtasuna: {c}", ver_mas: "Ikusi {n} txartelak", ver_menos: "Ikusi gutxiago", marque: "Markatu zure egoera klinikoa «Zure datuak» atalean zuri gehien dagozkizun onurak ikusteko.", n: "{n} onura", n1: "Onura 1", fuente: "Iturria" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
.ben-intro { margin: 0 0 6px; color: var(--muted); font-size: .9rem; }
.ben-borrador { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 12px; padding: 3px 10px; border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .76rem; font-weight: 700; }
.ben-rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
.ben-t { position: relative; display: grid; align-content: start; gap: 6px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-lg); background: linear-gradient(165deg, var(--surface), var(--surface-2)); overflow: hidden; }
.ben-t::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 3px; background: linear-gradient(90deg, var(--accent), var(--info)); opacity: .8; }
.ben-sit { justify-self: start; padding: 2px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep); font-size: .72rem; font-weight: 700; letter-spacing: .02em; }
.ben-cifra { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; margin: 2px 0 0; }
.ben-cifra b { font: 800 1.9rem/1 var(--mono); color: var(--accent-deep); letter-spacing: -.02em; }
.ben-cifra span { font-size: .82rem; color: var(--muted); font-weight: 600; }
.ben-t h4 { margin: 0; font-size: 1rem; }
.ben-t p { margin: 0; font-size: .88rem; line-height: 1.45; }
.ben-pie { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: center; margin-top: 4px; font-size: .76rem; color: var(--muted); }
.ben-cert { padding: 1px 8px; border-radius: 999px; background: var(--info-soft); color: var(--info-ink); font-weight: 700; }
.ben-fuentes { display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: .76rem; }
.ben-fuentes a { color: var(--accent-deep); text-underline-offset: 2px; }
.ben-mas { margin-top: 10px; }
.ben-rejilla.cerrada > li:nth-child(n+5) { display: none; }
.ben-marque { margin: 10px 0 0; font-size: .84rem; color: var(--muted); }
:root[data-theme="contrast"] .ben-t { background: var(--surface); }
:root[data-theme="contrast"] .ben-t::before { display: none; }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .ben-t { animation: ben-entra .45s var(--ease-salida) both; }
  html:not(.pa-quieto) .ben-t:nth-child(2) { animation-delay: 60ms; }
  html:not(.pa-quieto) .ben-t:nth-child(3) { animation-delay: 120ms; }
  html:not(.pa-quieto) .ben-t:nth-child(n+4) { animation-delay: 180ms; }
}
@keyframes ben-entra { from { opacity: 0; transform: translateY(8px); } }
`;
function estilos() { if (!document.getElementById("ben-css")) { const st = document.createElement("style"); st.id = "ben-css"; st.textContent = CSS; document.head.append(st); } }
export const tarjetaHtml = (b) => `<li class="ben-t" data-ben="${b.id}"><span class="ben-sit">${esc(SIT[b.sit] || b.sit)}</span>
  <p class="ben-cifra"><b>${esc(b.cifra)}</b><span>${esc(b.unidad)}</span></p><h4>${esc(b.titulo)}</h4><p>${esc(b.texto)}</p>
  <div class="ben-pie"><span>${esc(b.estudio)}</span>${b.certeza ? `<span class="ben-cert">${esc(tx("certeza", { c: b.certeza }))}</span>` : ""}</div>
  <div class="ben-fuentes">${b.fuentes.map((f) => `<a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">${esc(f.txt)}</a>`).join("")}</div></li>`;
/** Pinta las tarjetas en «cont». c: { condiciones, edad, caidas }. Devuelve el número de tarjetas. */
export function pintar(cont, c = {}) {
  estilos();
  const ids = situaciones(c), T = tarjetas(ids), soloGenerales = ids.every((id) => id === "todos" || id === "mayores");
  cont.innerHTML = `<p class="ben-intro">${tx("intro")}</p><p class="ben-borrador">${tx("borrador")}</p>
    <ul class="ben-rejilla${T.length > 4 ? " cerrada" : ""}">${T.map(tarjetaHtml).join("")}</ul>
    ${T.length > 4 ? `<button type="button" class="btn-sec sm ben-mas" aria-expanded="false">${tx("ver_mas", { n: T.length })}</button>` : ""}
    ${soloGenerales ? `<p class="ben-marque">${tx("marque")}</p>` : ""}`;
  cont.querySelector(".ben-mas")?.addEventListener("click", (ev) => {
    const ul = cont.querySelector(".ben-rejilla"), abierta = ul.classList.toggle("cerrada") === false;
    ev.currentTarget.setAttribute("aria-expanded", String(abierta));
    ev.currentTarget.textContent = abierta ? tx("ver_menos") : tx("ver_mas", { n: T.length });
  });
  return T.length;
}
