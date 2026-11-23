/* «¿Cuánto movimiento hace falta?» (mejora grande 4): explorable de dosis y respuesta. Dos vistas:
   - Minutos a la semana: estudio conjunto de 6 cohortes (Arem 2015; 661 137 personas, 14 años de seguimiento), riesgo de
     morir por cualquier causa frente a no hacer nada, por grupos de actividad de ocio (7,5 MET-h/semana = 150 minutos
     de actividad moderada). Se usan solo las cifras del resumen: nada; menos de 150 min (−20 %); 150-299 (−31 %);
     300-449 (−37 %); 450-749 (−39 %, la meseta) y 1500 o más (−31 %, sin perjuicio). Entre 750 y 1499 el resumen no da
     cifra: se dibuja discontinuo y se dice.
   - Pasos al día: metaanálisis de 15 cohortes (Paluch 2022; 47 471 adultos): medianas de los cuartos (3553, 5801, 7842 y
     10 901 pasos; HR 0,60, 0,55 y 0,47 frente al primero) y la meseta por edad (6000-8000 desde los 60 años;
     8000-10 000 antes).
   Su punto: la media de minutos a la semana de su diario (últimas 4 semanas); con el deslizador, «¿y si…?». Son estudios
   de observación: asociación, no prueba de causa (se dice). Gráficas según la guía de visualización (una serie sin
   leyenda, líneas de 2 px, puntos con anillo, rejilla fina, cruz y globo al pasar, tabla). Interfaz en cinco idiomas. */
import { t, idioma } from "./i18n.js?v=202611231104";
import { tC } from "./tr.js?v=202611231104";

export const MINUTOS = [
  { desde: 0, hasta: 0, x: 0, hr: 1, k: "g0" },
  { desde: 1, hasta: 149, x: 75, hr: 0.8, k: "g1" },
  { desde: 150, hasta: 299, x: 225, hr: 0.69, k: "g2" },
  { desde: 300, hasta: 449, x: 375, hr: 0.63, k: "g3" },
  { desde: 450, hasta: 749, x: 600, hr: 0.61, k: "g4" },
  { desde: 750, hasta: 1499, x: 1125, hr: 0.61, k: "g5" }, // 5 a 10 veces el mínimo (40-<75 MET-h/semana): HR 0,61 (IC 95 % 0,58-0,64), tabla del texto completo (validación externa, 23/11/2026); el resumen no lo da
  { desde: 1500, hasta: Infinity, x: 1650, hr: 0.69, k: "g6" },
];
export const PASOS = [{ x: 3553, hr: 1 }, { x: 5801, hr: 0.6 }, { x: 7842, hr: 0.55 }, { x: 10901, hr: 0.47 }];
export const MESETA = { mayores: [6000, 8000], jovenes: [8000, 10000] };
export const FUENTES = tC({
  minutos: { txt: "Arem H, et al. Leisure time physical activity and mortality: a detailed pooled analysis of the dose-response relationship. JAMA Intern Med. 2015;175:959-67", doi: "10.1001/jamainternmed.2015.0533" },
  pasos: { txt: "Paluch AE, et al. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health. 2022;7:e219-e228", doi: "10.1016/S2468-2667(21)00302-9" },
});
/* la gráfica de minutos va por grupos, a intervalos iguales (son grupos, no una curva continua); el de 750-1499 no tiene cifra */
export const SLOTS = [{ a: 0, b: 0, etq: "0" }, { a: 1, b: 149, etq: "<150" }, { a: 150, b: 299, etq: "150+" }, { a: 300, b: 449, etq: "300+" }, { a: 450, b: 749, etq: "450+" }, { a: 750, b: 1499, etq: "750+" }, { a: 1500, b: 1800, etq: "1500+" }];
/** Posición de unos minutos en el eje de grupos (con un poco de recorrido dentro de cada grupo). */
export function posMinutos(min) {
  const m = Math.max(0, Math.min(1800, Math.round(min || 0))), i = SLOTS.findIndex((x) => m >= x.a && m <= x.b), s = SLOTS[i];
  return s.a === s.b ? i : i - 0.4 + (0.8 * (m - s.a)) / (s.b - s.a);
}
/** % menos riesgo (redondeado) de un HR. */
export const menos = (hr) => Math.round((1 - hr) * 100);
/** Grupo de minutos a la semana; entre 750 y 1499 no hay cifra en el resumen (null). */
export function grupoMinutos(min) {
  const m = Math.max(0, Math.round(min || 0));
  return MINUTOS.find((g) => m >= g.desde && m <= g.hasta) || null;
}
/** Cuarto de pasos más parecido (por la mediana más cercana). */
export const grupoPasos = (p) => PASOS.reduce((a, b) => (Math.abs(b.x - p) < Math.abs(a.x - p) ? b : a));
/** Media de minutos a la semana de las últimas 4 semanas del diario (sesiones registradas). */
export function minutosSemana(diario, hoy = new Date()) {
  const lim = new Date(hoy); lim.setHours(0, 0, 0, 0); lim.setDate(lim.getDate() - 27);
  const iso = `${lim.getFullYear()}-${String(lim.getMonth() + 1).padStart(2, "0")}-${String(lim.getDate()).padStart(2, "0")}`;
  const total = (diario || []).filter((x) => x.fecha >= iso).reduce((n, x) => n + (Number(x.min) || 0), 0);
  return Math.round(total / 4);
}

export const TXT = {
  es: { titulo: "¿Cuánto movimiento hace falta?", min: "Minutos a la semana", pasos: "Pasos al día", su_min: "Usted: {n} min/semana (media de sus últimas 4 semanas)", sin_diario: "Todavía no hay sesiones en su diario: mueva el deslizador para explorar.", y_si: "¿Y si hiciera…?", y_si_p: "¿Y si caminara…?", min_sem: "{n} min a la semana", min_dia: "unos {n} min al día", pasos_dia: "{n} pasos al día", frase_0: "Sin actividad: es el punto de partida con el que se compara todo.", frase_g: "Las personas que hacían {r} tenían un {p} % menos de riesgo de morir durante el seguimiento que las que no hacían nada.", frase_gap: "Entre 750 y 1500 minutos el estudio no da la cifra en su resumen; el beneficio ya no aumenta.", frase_p: "Con unos {n} pasos al día, el riesgo de morir fue un {p} % menor que con unos 3550.", frase_p0: "Unos 3550 pasos al día es el grupo con el que se comparan los demás.", siguiente: "Si llegara a {r}: {p} % menos.", ideas_t: "Lo que dicen las cifras", idea1: "El salto mayor es pasar de nada a algo: −20 % con menos de 150 minutos.", idea2: "Con 150-300 minutos (lo que recomiendan las guías), −31 %.", idea3: "A partir de 450-750 minutos ya no aumenta; y hacer mucho más tampoco perjudicó.", idea_p1: "Más pasos, menos riesgo, hasta una meseta que depende de la edad.", idea_p2: "Desde los 60 años: hasta unos 6000-8000 pasos al día. Antes: 8000-10 000.", meseta: "Meseta {a}-{b}", tabla: "Ver los datos en una tabla", t_grupo: "Grupo", t_riesgo: "Menos riesgo", nada: "Nada", menos_150: "Menos de 150", r_menos150: "menos de 150 minutos a la semana", r_150: "150-299 minutos a la semana", r_300: "300-449 minutos a la semana", r_450: "450-749 minutos a la semana", r_750: "750-1499 minutos a la semana", r_1500: "1500 minutos o más a la semana", observ: "Son estudios de observación: muestran asociación, no prueban que el ejercicio sea la causa. Las cifras son de grupos, no una predicción para usted.", estudio_min: "Análisis conjunto de 6 cohortes (661 137 personas, 14 años de seguimiento). Son minutos de actividad moderada en el tiempo libre; los de actividad intensa cuentan el doble.", estudio_p: "Metaanálisis de 15 cohortes (47 471 adultos, 7 años)", usted: "Usted", y_eje: "% menos riesgo", sin_dato: "sin cifra" },
  en: { titulo: "How much movement do you need?", min: "Minutes a week", pasos: "Steps a day", su_min: "You: {n} min/week (average of your last 4 weeks)", sin_diario: "No sessions in your diary yet: move the slider to explore.", y_si: "What if you did…?", y_si_p: "What if you walked…?", min_sem: "{n} min a week", min_dia: "about {n} min a day", pasos_dia: "{n} steps a day", frase_0: "No activity: the starting point everything is compared with.", frase_g: "People who did {r} had a {p}% lower risk of dying during follow-up than those who did nothing.", frase_gap: "Between 750 and 1500 minutes the study gives no figure in its abstract; the benefit no longer increases.", frase_p: "With about {n} steps a day, the risk of dying was {p}% lower than with about 3550.", frase_p0: "About 3550 steps a day is the group the others are compared with.", siguiente: "If you reached {r}: {p}% lower.", ideas_t: "What the figures say", idea1: "The biggest jump is going from nothing to something: −20% with less than 150 minutes.", idea2: "With 150-300 minutes (what guidelines recommend), −31%.", idea3: "From 450-750 minutes it no longer increases; and doing much more did no harm.", idea_p1: "More steps, lower risk, up to a plateau that depends on age.", idea_p2: "From age 60: up to about 6000-8000 steps a day. Younger: 8000-10 000.", meseta: "Plateau {a}-{b}", tabla: "See the data in a table", t_grupo: "Group", t_riesgo: "Lower risk", nada: "None", menos_150: "Under 150", r_menos150: "less than 150 minutes a week", r_150: "150-299 minutes a week", r_300: "300-449 minutes a week", r_450: "450-749 minutes a week", r_750: "750-1499 minutes a week", r_1500: "1500 minutes or more a week", observ: "These are observational studies: they show association, they do not prove exercise is the cause. The figures are for groups, not a prediction for you.", estudio_min: "Pooled analysis of 6 cohorts (661 137 people, 14 years of follow-up). These are minutes of moderate leisure-time activity; minutes of vigorous activity count double.", estudio_p: "Meta-analysis of 15 cohorts (47 471 adults, 7 years)", usted: "You", y_eje: "% lower risk", sin_dato: "no figure" },
  ca: { titulo: "Quant moviment cal?", min: "Minuts a la setmana", pasos: "Passos al dia", su_min: "Vostè: {n} min/setmana (mitjana de les seves últimes 4 setmanes)", sin_diario: "Encara no hi ha sessions al seu diari: mogui el control lliscant per explorar.", y_si: "I si en fes…?", y_si_p: "I si caminés…?", min_sem: "{n} min a la setmana", min_dia: "uns {n} min al dia", pasos_dia: "{n} passos al dia", frase_0: "Sense activitat: és el punt de partida amb què es compara tot.", frase_g: "Les persones que feien {r} tenien un {p} % menys de risc de morir durant el seguiment que les que no en feien gens.", frase_gap: "Entre 750 i 1500 minuts l'estudi no dona la xifra al resum; el benefici ja no augmenta.", frase_p: "Amb uns {n} passos al dia, el risc de morir va ser un {p} % menor que amb uns 3550.", frase_p0: "Uns 3550 passos al dia és el grup amb què es comparen els altres.", siguiente: "Si arribés a {r}: un {p} % menys.", ideas_t: "El que diuen les xifres", idea1: "El salt més gran és passar de res a alguna cosa: −20 % amb menys de 150 minuts.", idea2: "Amb 150-300 minuts (el que recomanen les guies), −31 %.", idea3: "A partir de 450-750 minuts ja no augmenta; i fer-ne molt més tampoc no va perjudicar.", idea_p1: "Més passos, menys risc, fins a una meseta que depèn de l'edat.", idea_p2: "Des dels 60 anys: fins a uns 6000-8000 passos al dia. Abans: 8000-10 000.", meseta: "Meseta {a}-{b}", tabla: "Veure les dades en una taula", t_grupo: "Grup", t_riesgo: "Menys risc", nada: "Res", menos_150: "Menys de 150", r_menos150: "menys de 150 minuts a la setmana", r_150: "150-299 minuts a la setmana", r_300: "300-449 minuts a la setmana", r_450: "450-749 minuts a la setmana", r_750: "750-1499 minuts a la setmana", r_1500: "1500 minuts o més a la setmana", observ: "Són estudis d'observació: mostren associació, no proven que l'exercici en sigui la causa. Les xifres són de grups, no una predicció per a vostè.", estudio_min: "Anàlisi conjunta de 6 cohorts (661 137 persones, 14 anys de seguiment). Són minuts d'activitat moderada en el temps lliure; els d'activitat intensa compten el doble.", estudio_p: "Metaanàlisi de 15 cohorts (47 471 adults, 7 anys)", usted: "Vostè", y_eje: "% menys risc", sin_dato: "sense xifra" },
  gl: { titulo: "Canto movemento fai falta?", min: "Minutos á semana", pasos: "Pasos ao día", su_min: "Vostede: {n} min/semana (media das súas últimas 4 semanas)", sin_diario: "Aínda non hai sesións no seu diario: mova o deslizador para explorar.", y_si: "E se fixese…?", y_si_p: "E se camiñase…?", min_sem: "{n} min á semana", min_dia: "uns {n} min ao día", pasos_dia: "{n} pasos ao día", frase_0: "Sen actividade: é o punto de partida co que se compara todo.", frase_g: "As persoas que facían {r} tiñan un {p} % menos de risco de morrer durante o seguimento ca as que non facían nada.", frase_gap: "Entre 750 e 1500 minutos o estudo non dá a cifra no seu resumo; o beneficio xa non aumenta.", frase_p: "Con uns {n} pasos ao día, o risco de morrer foi un {p} % menor ca con uns 3550.", frase_p0: "Uns 3550 pasos ao día é o grupo co que se comparan os demais.", siguiente: "Se chegase a {r}: un {p} % menos.", ideas_t: "O que din as cifras", idea1: "O salto maior é pasar de nada a algo: −20 % con menos de 150 minutos.", idea2: "Con 150-300 minutos (o que recomendan as guías), −31 %.", idea3: "A partir de 450-750 minutos xa non aumenta; e facer moito máis tampouco prexudicou.", idea_p1: "Máis pasos, menos risco, ata unha meseta que depende da idade.", idea_p2: "Desde os 60 anos: ata uns 6000-8000 pasos ao día. Antes: 8000-10 000.", meseta: "Meseta {a}-{b}", tabla: "Ver os datos nunha táboa", t_grupo: "Grupo", t_riesgo: "Menos risco", nada: "Nada", menos_150: "Menos de 150", r_menos150: "menos de 150 minutos á semana", r_150: "150-299 minutos á semana", r_300: "300-449 minutos á semana", r_450: "450-749 minutos á semana", r_750: "750-1499 minutos á semana", r_1500: "1500 minutos ou máis á semana", observ: "Son estudos de observación: amosan asociación, non proban que o exercicio sexa a causa. As cifras son de grupos, non unha predición para vostede.", estudio_min: "Análise conxunta de 6 cohortes (661 137 persoas, 14 anos de seguimento). Son minutos de actividade moderada no tempo libre; os de actividade intensa contan o dobre.", estudio_p: "Metaanálise de 15 cohortes (47 471 adultos, 7 anos)", usted: "Vostede", y_eje: "% menos risco", sin_dato: "sen cifra" },
  eu: { titulo: "Zenbat mugimendu behar da?", min: "Minutuak astean", pasos: "Urratsak egunean", su_min: "Zu: {n} min/astean (azken 4 asteetako batez bestekoa)", sin_diario: "Oraindik ez dago saiorik zure egunerokoan: mugitu graduatzailea arakatzeko.", y_si: "Eta egingo bazenu…?", y_si_p: "Eta ibiliko bazina…?", min_sem: "{n} min astean", min_dia: "{n} min inguru egunean", pasos_dia: "{n} urrats egunean", frase_0: "Jarduerarik gabe: dena horrekin alderatzen da.", frase_g: "{r} egiten zutenek % {p} arrisku txikiagoa zuten jarraipenean hiltzeko, ezer egiten ez zutenek baino.", frase_gap: "750 eta 1500 minutu artean azterlanak ez du zifrarik ematen laburpenean; onura ez da gehiago handitzen.", frase_p: "Egunean {n} urrats ingururekin, hiltzeko arriskua % {p} txikiagoa izan zen 3550 ingururekin baino.", frase_p0: "Egunean 3550 urrats inguru da besteak alderatzeko taldea.", siguiente: "{r} lortuko bazenu: % {p} gutxiago.", ideas_t: "Zifrek esaten dutena", idea1: "Jauzirik handiena ezerezetik zerbaitera pasatzea da: −% 20, 150 minutu baino gutxiagorekin.", idea2: "150-300 minuturekin (gidek gomendatzen dutena), −% 31.", idea3: "450-750 minututik aurrera ez da handitzen; eta askoz gehiago egiteak ere ez zuen kalterik egin.", idea_p1: "Urrats gehiago, arrisku txikiagoa, adinaren araberako goi-ordoki bateraino.", idea_p2: "60 urtetik aurrera: egunean 6000-8000 urrats inguru arte. Lehenago: 8000-10 000.", meseta: "Goi-ordokia {a}-{b}", tabla: "Ikusi datuak taula batean", t_grupo: "Taldea", t_riesgo: "Arrisku txikiagoa", nada: "Ezer ez", menos_150: "150 baino gutxiago", r_menos150: "astean 150 minutu baino gutxiago", r_150: "astean 150-299 minutu", r_300: "astean 300-449 minutu", r_450: "astean 450-749 minutu", r_750: "astean 750-1499 minutu", r_1500: "astean 1500 minutu edo gehiago", observ: "Behaketa-azterlanak dira: lotura erakusten dute, ez dute frogatzen ariketa kausa denik. Zifrak taldeenak dira, ez zuretzako iragarpena.", estudio_min: "6 kohorteren analisi bateratua (661 137 pertsona, 14 urteko jarraipena). Aisialdiko jarduera moderatuko minutuak dira; jarduera biziko minutuek bikoitza balio dute.", estudio_p: "15 kohorteren metaanalisia (47 471 heldu, 7 urte)", usted: "Zu", y_eje: "% arrisku txikiagoa", sin_dato: "zifrarik ez" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
const RANGO = { g1: "r_menos150", g2: "r_150", g3: "r_300", g4: "r_450", g5: "r_750", g6: "r_1500" };
const ETQ = { g0: () => tx("nada"), g1: () => tx("menos_150"), g2: () => "150-299", g3: () => "300-449", g4: () => "450-749", g5: () => "750-1499", g6: () => "≥1500" };
const num = (n) => Number(n).toLocaleString(idioma() === "en" ? "en-GB" : "es-ES");
/** Frase de su grupo de minutos y la del siguiente escalón. */
export function fraseMinutos(min) {
  const g = grupoMinutos(min);
  if (!g) return { frase: tx("frase_gap"), sig: "" };
  if (g.k === "g0") return { frase: tx("frase_0"), sig: tx("siguiente", { r: tx("r_menos150"), p: menos(MINUTOS[1].hr) }) };
  const i = MINUTOS.indexOf(g), s = MINUTOS[i + 1];
  return { frase: tx("frase_g", { r: tx(RANGO[g.k]), p: menos(g.hr) }), sig: s && menos(s.hr) > menos(g.hr) ? tx("siguiente", { r: tx(RANGO[s.k]), p: menos(s.hr) }) : "" };
}
export function frasePasos(p) {
  const g = grupoPasos(p);
  return g.hr === 1 ? tx("frase_p0") : tx("frase_p", { n: num(Math.round(g.x / 50) * 50), p: menos(g.hr) });
}

/* ---------- gráfica: una serie, puntos con anillo, cruz y globo ---------- */
const M = { i: 40, d: 14, a: 18, b: 32 };
/** SVG de la curva. o: { w, h, pts: [{x, y, etq}], xMax, xMin, yMax, ticksX, fmtX, usted, banda, hueco: [i] (tramo i→i+1 discontinuo) }. */
export function grafica(o) {
  const W = o.w || 600, H = o.h || 250, xMin = o.xMin ?? 0, sx = (x) => M.i + ((Math.min(x, o.xMax) - xMin) / (o.xMax - xMin)) * (W - M.i - M.d), sy = (y) => H - M.b - (y / o.yMax) * (H - M.a - M.b);
  const rej = [0, 10, 20, 30, 40, 50, 60].filter((v) => v <= o.yMax).map((v) => `<line class="ds-rej" x1="${M.i}" x2="${W - M.d}" y1="${sy(v).toFixed(1)}" y2="${sy(v).toFixed(1)}"/><text class="ds-ey" x="${M.i - 8}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`).join("");
  const tx_ = o.ticksX.map((v) => `<text class="ds-ex" x="${sx(v).toFixed(1)}" y="${H - M.b + 18}" text-anchor="middle">${o.fmtX(v)}</text>`).join("");
  const banda = o.banda ? `<rect class="ds-banda" x="${sx(o.banda[0]).toFixed(1)}" y="${M.a}" width="${(sx(o.banda[1]) - sx(o.banda[0])).toFixed(1)}" height="${H - M.a - M.b}"/><text class="ds-banda-t" x="${((sx(o.banda[0]) + sx(o.banda[1])) / 2).toFixed(1)}" y="${M.a + 14}" text-anchor="middle">${tx("meseta", { a: num(o.banda[0]), b: num(o.banda[1]) })}</text>` : "";
  let lineas = "";
  for (let i = 0; i < o.pts.length - 1; i++) {
    const a = o.pts[i], b = o.pts[i + 1];
    lineas += `<line class="ds-l${(o.hueco || []).includes(i) ? " ds-hueco" : ""}" x1="${sx(a.x).toFixed(1)}" y1="${sy(a.y).toFixed(1)}" x2="${sx(b.x).toFixed(1)}" y2="${sy(b.y).toFixed(1)}"/>`;
  }
  const puntos = o.pts.map((p, i) => `<circle class="ds-p" data-i="${i}" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="5"/>`).join("");
  const usted = o.usted != null ? `<line class="ds-usted" x1="${sx(o.usted).toFixed(1)}" x2="${sx(o.usted).toFixed(1)}" y1="${M.a}" y2="${H - M.b}"/><text class="ds-usted-t" x="${Math.min(sx(o.usted) + 6, W - M.d - 40).toFixed(1)}" y="${H - M.b - 8}">${tx("usted")}</text>` : "";
  const aria = o.pts.map((p) => `${p.etq}: ${p.y === null ? tx("sin_dato") : `−${p.y} %`}`).join("; ");
  return { W, H, svg: `<svg class="ds-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${tx("y_eje")}. ${aria}"><text class="ds-ey ds-ytit" x="${M.i}" y="10">${tx("y_eje")}</text>${banda}${rej}<line class="ds-base" x1="${M.i}" x2="${W - M.d}" y1="${sy(0)}" y2="${sy(0)}"/>${tx_}${lineas}${usted}${puntos}<line class="ds-foco" y1="${M.a}" y2="${H - M.b}" x1="0" x2="0" visibility="hidden"/></svg>`, sx, sy };
}
function activar(caja, o, g) {
  const svg = caja.querySelector(".ds-svg"), tip = caja.querySelector(".ds-tip"), foco = svg.querySelector(".ds-foco"), W = g.W, H = g.H;
  const mover = (ev) => {
    const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * W;
    let mejor = 0; o.pts.forEach((p, i) => { if (Math.abs(g.sx(p.x) - x) < Math.abs(g.sx(o.pts[mejor].x) - x)) mejor = i; });
    const p = o.pts[mejor], px = g.sx(p.x);
    foco.setAttribute("x1", px); foco.setAttribute("x2", px); foco.setAttribute("visibility", "visible");
    svg.querySelectorAll(".ds-p").forEach((c) => c.classList.toggle("on", Number(c.dataset.i) === mejor));
    tip.innerHTML = `<b>−${p.y} %</b><span>${p.etq}</span>`; tip.hidden = false;
    tip.style.left = `${Math.min(Math.max((px / W) * 100, 12), 88)}%`; tip.style.top = `${(g.sy(p.y) / H) * 100}%`;
  };
  svg.addEventListener("pointermove", mover); svg.addEventListener("pointerdown", mover);
  svg.addEventListener("pointerleave", () => { foco.setAttribute("visibility", "hidden"); tip.hidden = true; svg.querySelectorAll(".ds-p.on").forEach((c) => c.classList.remove("on")); });
}

const CSS = `
.ds-dlg { --ds-1: #593ede; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="contrast"]) .ds-dlg { --ds-1: #8b7cf6; } }
:root[data-theme="dark"] .ds-dlg { --ds-1: #8b7cf6; }
.ds-vistas { display: flex; gap: 6px; margin: 0 0 12px; }
.ds-vistas button { min-height: 40px; padding: 6px 14px; border-radius: 999px; border: 1.5px solid var(--line-strong); background: var(--surface); color: var(--fg); font: 600 .9rem var(--font); cursor: pointer; }
.ds-vistas button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
.ds-frase { margin: 0 0 4px; font-size: 1.02rem; line-height: 1.45; font-weight: 600; }
.ds-sig { margin: 0 0 10px; color: var(--muted); font-size: .9rem; }
.ds-su { margin: 0 0 10px; font-size: .84rem; color: var(--muted); }
.ds-control { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 4px 12px; margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.ds-control label { grid-column: 1 / -1; font-weight: 700; font-size: .9rem; }
.ds-control input[type=range] { width: 100%; accent-color: var(--ds-1); }
:root:not([data-theme="contrast"]) .ds-control input[type="range"] { background: linear-gradient(90deg, var(--ds-1) var(--p, 0%), var(--surface-2) var(--p, 0%)); box-shadow: inset 0 0 0 1px var(--line); }
.ds-control output { font: 800 1.05rem var(--mono); color: var(--fg); white-space: nowrap; }
.ds-control small { grid-column: 1 / -1; color: var(--muted); }
@media (max-width: 480px) { .ds-control { grid-template-columns: 1fr; } }
.ds-graf { position: relative; margin: 0 0 6px; }
.ds-svg { display: block; max-width: 100%; height: auto; overflow: visible; touch-action: pan-y; }
.ds-rej { stroke: var(--line); stroke-width: 1; }
.ds-base { stroke: var(--line-strong); stroke-width: 1; }
.ds-ey, .ds-ex { fill: var(--muted); font: 600 11px var(--mono); }
.ds-ytit { font-family: var(--font); }
.ds-l { stroke: var(--ds-1); stroke-width: 2; stroke-linecap: round; }
.ds-l.ds-hueco { stroke-dasharray: 4 5; opacity: .7; }
.ds-p { fill: var(--ds-1); stroke: var(--surface); stroke-width: 2; transform-box: fill-box; transform-origin: center; }
.ds-p.on { r: 7; }
.ds-banda { fill: var(--surface-2); stroke: var(--line); stroke-width: 1; }
.ds-banda-t { fill: var(--muted); font: 700 11px var(--font); paint-order: stroke; stroke: var(--surface-2); stroke-width: 4px; stroke-linejoin: round; }
.ds-usted { stroke: var(--fg); stroke-width: 1.5; stroke-dasharray: 3 4; }
.ds-usted-t { fill: var(--fg); font: 800 12px var(--font); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
.ds-foco { stroke: var(--muted); stroke-width: 1; }
.ds-tip { position: absolute; transform: translate(-50%, calc(-100% - 12px)); display: grid; gap: 1px; padding: 6px 10px; border-radius: var(--r-sm); background: var(--surface); border: 1px solid var(--line-strong); box-shadow: 0 8px 20px -10px rgba(0, 0, 0, .4); font-size: .8rem; pointer-events: none; white-space: nowrap; }
.ds-tip b { font: 800 .95rem var(--mono); }
.ds-ideas { margin: 10px 0; padding: 10px 12px; border-left: 4px solid var(--ds-1); border-radius: var(--r-sm); background: var(--surface-2); }
.ds-ideas h4 { margin: 0 0 4px; font-size: .9rem; }
.ds-ideas ul { margin: 0; padding-left: 18px; display: grid; gap: 3px; font-size: .88rem; }
.ds-tabla table { width: 100%; border-collapse: collapse; font-size: .86rem; }
.ds-tabla th, .ds-tabla td { padding: 5px 8px; border-bottom: 1px solid var(--line); text-align: left; }
.ds-tabla td:last-child, .ds-tabla th:last-child { text-align: right; font-family: var(--mono); }
.ds-tabla tr.ds-su-fila td { font-weight: 800; }
.ds-fuente { margin: 10px 0 0; font-size: .78rem; color: var(--muted); }
.ds-fuente a { color: inherit; }
.ds-observ { margin: 8px 0 0; font-size: .8rem; color: var(--muted); }
@media (forced-colors: active) { .ds-l { stroke: Highlight; } .ds-p { fill: Highlight; } .ds-usted { stroke: CanvasText; } }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .ds-dlg[open] .ds-l { animation: ds-traza .6s var(--ease-salida) both; }
  html:not(.pa-quieto) .ds-dlg[open] .ds-p { animation: ds-pop .4s var(--ease-salida) both; animation-delay: .25s; }
  html:not(.pa-quieto) .ds-frase { animation: ds-entra .3s var(--ease-salida) both; }
}
@keyframes ds-traza { from { opacity: 0; } }
@keyframes ds-pop { from { opacity: 0; transform: scale(.4); } }
@keyframes ds-entra { from { opacity: 0; transform: translateY(4px); } }
`;
let dlg = null, ctx = {}, vista = "min", valMin = 0, valPasos = 5000;
const cu = () => dlg.querySelector("#ds-cuerpo");
function crear() {
  if (!document.getElementById("ds-css")) { const st = document.createElement("style"); st.id = "ds-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "dosis"; dlg.className = "ficha ds-dlg"; dlg.setAttribute("aria-labelledby", "ds-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="ds-cab-t"></p><button type="button" class="btn-sec sm" id="ds-cerrar"></button></div><div class="ficha-cuerpo" id="ds-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#ds-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  cu().addEventListener("click", (ev) => { const b = ev.target.closest("[data-ds-vista]"); if (b) { vista = b.dataset.dsVista; pintar(); cu().querySelector(`[data-ds-vista="${vista}"]`)?.focus(); } });
  let rz = 0; window.addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (dlg.open && cu().querySelector(".ds-graf")) actualizar(); }); });
  cu().addEventListener("input", (ev) => {
    const r = ev.target.closest("input[type=range]"); if (!r) return;
    if (vista === "min") valMin = Number(r.value); else valPasos = Number(r.value);
    actualizar();
  });
}
const SLOT_DE = { g0: 0, g1: 1, g2: 2, g3: 3, g4: 4, g5: 5, g6: 6 };
const ptsMin = () => MINUTOS.map((g) => ({ x: SLOT_DE[g.k], y: menos(g.hr), etq: g.k === "g0" ? tx("nada") : `${ETQ[g.k]()} min` }));
const ptsPasos = () => PASOS.map((p) => ({ x: p.x, y: menos(p.hr), etq: tx("pasos_dia", { n: num(p.x) }) }));
function opciones(w) {
  const dim = { w, h: w < 480 ? 230 : 250 };
  return vista === "min"
    ? { ...dim, pts: ptsMin(), xMin: -0.4, xMax: 6.4, yMax: 50, ticksX: [0, 1, 2, 3, 4, 5, 6], fmtX: (v) => SLOTS[v].etq, usted: posMinutos(valMin) }
    : { ...dim, pts: ptsPasos(), xMin: 2000, xMax: 12000, yMax: 60, ticksX: w < 480 ? [2000, 4000, 6000, 8000, 10000, 12000] : [2000, 4000, 6000, 8000, 10000, 12000], fmtX: (v) => `${v / 1000}k`, usted: valPasos, banda: ctx.edad != null && ctx.edad < 60 ? MESETA.jovenes : MESETA.mayores };
}
function actualizar() {
  const c = cu(), caja = c.querySelector(".ds-graf"), o = opciones(Math.round(Math.max(300, Math.min(640, caja.clientWidth || 600)))), g = grafica(o);
  const r0 = c.querySelector("input[type=range]"); r0.style.setProperty("--p", `${((r0.value - r0.min) / (r0.max - r0.min)) * 100}%`);
  c.querySelector(".ds-graf").innerHTML = `${g.svg}<div class="ds-tip" hidden></div>`;
  activar(c.querySelector(".ds-graf"), o, g);
  if (vista === "min") {
    const f = fraseMinutos(valMin);
    c.querySelector(".ds-frase").textContent = f.frase; c.querySelector(".ds-sig").textContent = f.sig;
    c.querySelector("output").textContent = tx("min_sem", { n: num(valMin) });
    c.querySelector(".ds-control small").textContent = tx("min_dia", { n: num(Math.round(valMin / 7)) });
    const r = c.querySelector("input[type=range]"); r.setAttribute("aria-valuetext", tx("min_sem", { n: num(valMin) }));
    const gm = grupoMinutos(valMin); c.querySelectorAll(".ds-tabla tbody tr").forEach((tr) => tr.classList.toggle("ds-su-fila", !!gm && tr.dataset.k === gm.k));
  } else {
    c.querySelector(".ds-frase").textContent = frasePasos(valPasos); c.querySelector(".ds-sig").textContent = "";
    c.querySelector("output").textContent = tx("pasos_dia", { n: num(valPasos) });
    const r = c.querySelector("input[type=range]"); r.setAttribute("aria-valuetext", tx("pasos_dia", { n: num(valPasos) }));
    const gp = grupoPasos(valPasos); c.querySelectorAll(".ds-tabla tbody tr").forEach((tr) => tr.classList.toggle("ds-su-fila", Number(tr.dataset.x) === gp.x));
  }
}
function pintar() {
  const esMin = vista === "min", F = esMin ? FUENTES.minutos : FUENTES.pasos;
  const filas = esMin ? MINUTOS.map((g) => `<tr data-k="${g.k}"><td>${g.k === "g0" ? tx("nada") : `${ETQ[g.k]()} min`}</td><td>${g.k === "g0" ? "—" : `−${menos(g.hr)} %`}</td></tr>`).join("") + `<tr><td>750-1499 min</td><td>${tx("sin_dato")}</td></tr>`
    : PASOS.map((p) => `<tr data-x="${p.x}"><td>${tx("pasos_dia", { n: num(p.x) })}</td><td>${p.hr === 1 ? "—" : `−${menos(p.hr)} %`}</td></tr>`).join("");
  cu().innerHTML = `<div class="ds-vistas" role="group" aria-label="${tx("titulo")}"><button type="button" data-ds-vista="min" aria-pressed="${esMin}">${tx("min")}</button><button type="button" data-ds-vista="pasos" aria-pressed="${!esMin}">${tx("pasos")}</button></div>
    ${esMin ? `<p class="ds-su">${ctx.diarioN ? tx("su_min", { n: num(ctx.minutos) }) : tx("sin_diario")}</p>` : ""}
    <p class="ds-frase" aria-live="polite"></p><p class="ds-sig"></p>
    <div class="ds-control"><label for="ds-rango">${esMin ? tx("y_si") : tx("y_si_p")}</label><input id="ds-rango" type="range" min="${esMin ? 0 : 2000}" max="${esMin ? 1800 : 14000}" step="${esMin ? 10 : 100}" value="${esMin ? valMin : valPasos}"><output for="ds-rango"></output><small></small></div>
    <div class="ds-graf"></div>
    <div class="ds-ideas"><h4>${tx("ideas_t")}</h4><ul>${(esMin ? ["idea1", "idea2", "idea3"] : ["idea_p1", "idea_p2"]).map((k) => `<li>${tx(k)}</li>`).join("")}</ul></div>
    <details class="ds-tabla"><summary>${tx("tabla")}</summary><table><thead><tr><th scope="col">${tx("t_grupo")}</th><th scope="col">${tx("t_riesgo")}</th></tr></thead><tbody>${filas}</tbody></table></details>
    <p class="ds-fuente">${esMin ? tx("estudio_min") : tx("estudio_p")}. <a href="https://doi.org/${F.doi}" target="_blank" rel="noopener">${F.txt}</a></p>
    <p class="ds-observ">${tx("observ")}</p>`;
  actualizar();
}
/** Abre el explorable. c: { diario, edad }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = { ...c, minutos: minutosSemana(c.diario), diarioN: (c.diario || []).length };
  valMin = Math.min(1800, ctx.minutos); vista = "min";
  dlg.querySelector("#ds-cab-t").textContent = tx("titulo");
  dlg.querySelector("#ds-cerrar").textContent = t("ficha.cerrar");
  if (!dlg.open) dlg.showModal();
  pintar(); // ya abierta: la gráfica se dibuja al ancho real de su caja
  cu().scrollTop = 0;
}
