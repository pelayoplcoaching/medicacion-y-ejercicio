/* Metas de la vida diaria (mejora grande 9): la persona elige hasta 3 metas de su día a día (subir escaleras, levantarse
   del suelo, llevar la compra, caminar 30 minutos, jugar con los nietos, andar seguro, vestirse, viajar) y el plan se
   ordena alrededor de ellas: tarjeta «Mis metas» arriba de «Mi plan» con cuatro hitos que se marcan al conseguirlos, la
   prueba de forma física que las mide (con su último resultado) y una insignia en los ejercicios de la sesión que las
   trabajan. Los hitos son pasos funcionales, no cifras clínicas. Los textos de la interfaz van en los cinco idiomas
   dentro del módulo; el contenido de las metas, en español como el resto de explicadores. Se guarda en el estado. */
import { t, idioma } from "./i18n.js?v=202611222111";

/* ---------- las metas ---------- */
export const MAX_METAS = 3;
export const METAS = [
  { id: "escaleras", corto: "Escaleras", titulo: "Subir escaleras sin pararme", por: "fuerza de piernas y resistencia", icono: "M4 20h4v-4h4v-4h4V8h4",
    hitos: ["Subo un tramo agarrado a la barandilla, a mi ritmo.", "Subo un piso entero parando una vez como mucho.", "Subo un piso sin parar, usando la barandilla solo para rozarla.", "Subo dos pisos sin parar y al llegar puedo hablar."],
    pruebas: ["silla", "paso2", "andar6"], ej: ["Levantarse de la silla", "Sentadilla a la silla", "Elevación de talones", "Marcha, bici o elíptica", "Marcha a paso cómodo"] },
  { id: "suelo", corto: "Del suelo", titulo: "Levantarme del suelo yo solo", por: "fuerza de piernas y de brazos, y equilibrio", icono: "M4 20h16M12 16V5M8 9l4-4 4 4",
    hitos: ["Me arrodillo y me levanto apoyándome en una silla.", "Bajo al suelo y vuelvo a subir con la ayuda de una silla.", "Me levanto del suelo apoyando solo una mano en la rodilla.", "Me levanto del suelo sin apoyarme en nada."],
    pruebas: ["silla", "levantarse"], ej: ["Levantarse de la silla", "Sentadilla a la silla", "Puente de glúteo o marcha en el sitio", "Empuje (flexiones en pared o inclinadas)", "Levantarse y sentarse"] },
  { id: "compra", corto: "La compra", titulo: "Llevar la compra a casa", por: "fuerza de brazos y de agarre, y piernas", icono: "M6 8h12l-1.2 12H7.2L6 8zM9 8a3 3 0 0 1 6 0",
    hitos: ["Llevo una bolsa ligera (2–3 kg) de la cocina al salón.", "Llevo una bolsa de 3–5 kg en cada mano por casa.", "Subo desde el portal con dos bolsas de unos 5 kg.", "Vuelvo de la tienda con la compra de varios días."],
    pruebas: ["brazo", "silla"], ej: ["Flexión de brazos con botella o banda", "Remo con banda elástica", "Bisagra de cadera", "Levantarse de la silla", "Press de hombro ligero"] },
  { id: "caminar", corto: "Caminar", titulo: "Caminar 30 minutos seguidos", por: "resistencia", icono: "M5 19c0-4 3-6 7-6s7-2 7-6M3 19h4M17 7h4",
    hitos: ["Camino 10 minutos seguidos a paso cómodo.", "Camino 20 minutos seguidos.", "Camino 30 minutos seguidos y puedo ir hablando.", "Camino 30 minutos a paso ligero, con alguna cuesta."],
    pruebas: ["paso2", "andar6"], ej: ["Marcha, bici o elíptica", "Marcha a paso cómodo", "Elevación de talones"] },
  { id: "nietos", corto: "Nietos", titulo: "Jugar con mis nietos", por: "agilidad, fuerza y equilibrio", icono: "M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6z",
    hitos: ["Me agacho a coger un juguete y me levanto con apoyo.", "Me agacho y me levanto sin apoyo varias veces seguidas.", "Camino deprisa y cambio de dirección sin perder el equilibrio.", "Juego un buen rato en el parque sin acabar agotado."],
    pruebas: ["levantarse", "silla"], ej: ["Sentadilla a la silla", "Levantarse de la silla", "Giros lentos y alcances", "Marcha talón-punta", "Marcha, bici o elíptica"] },
  { id: "seguro", corto: "Andar seguro", titulo: "Andar seguro, sin miedo a caerme", por: "equilibrio y fuerza de piernas", icono: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
    hitos: ["Me sostengo sobre un pie 10 segundos con un apoyo cerca.", "Camino 10 pasos en línea, talón con punta, junto a la pared.", "Me sostengo sobre un pie 20 segundos sin apoyarme.", "Salgo a la calle sin estar pendiente de caerme."],
    pruebas: ["levantarse", "silla"], ej: ["Apoyo sobre un pie", "Marcha talón-punta", "Giros lentos y alcances", "Elevación de talones", "Equilibrio (5 min)"] },
  { id: "vestirse", corto: "Vestirme", titulo: "Vestirme y calzarme con facilidad", por: "flexibilidad y equilibrio", icono: "M9 4L4 7l2 4 2-1v10h8V10l2 1 2-4-5-3a3 3 0 0 1-6 0z",
    hitos: ["Me pongo los zapatos sentado sin esfuerzo.", "Llego a abrocharme por detrás o a rascarme la espalda.", "Me pongo los calcetines sentado, sin ayudas.", "Me pongo los pantalones de pie, apoyado en la pared."],
    pruebas: ["sentado", "espalda"], ej: ["Bisagra de cadera", "Giros lentos y alcances", "Enfriamiento", "Apoyo sobre un pie"] },
  { id: "viajar", corto: "Viajar", titulo: "Viajar y hacer excursiones", por: "resistencia y fuerza de piernas", icono: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
    hitos: ["Paseo una hora, con paradas.", "Aguanto una mañana de visita con algún descanso.", "Subo una cuesta larga a mi ritmo.", "Hago una excursión de medio día."],
    pruebas: ["andar6", "paso2", "silla"], ej: ["Marcha, bici o elíptica", "Marcha a paso cómodo", "Levantarse de la silla", "Elevación de talones"] },
];
export const POR_ID = Object.fromEntries(METAS.map((m) => [m.id, m]));

/* ---------- estado ---------- */
/** Deja solo lo que se sabe interpretar: hasta 3 metas conocidas y, por meta, 4 fechas de hito (o null). */
export function sanear(x) {
  if (!x || typeof x !== "object") return null;
  const ids = [...new Set((Array.isArray(x.ids) ? x.ids : []).filter((id) => POR_ID[id]))].slice(0, MAX_METAS);
  const hitos = {};
  for (const id of ids) { const h = Array.isArray(x.hitos?.[id]) ? x.hitos[id] : []; hitos[id] = [0, 1, 2, 3].map((k) => (Number.isFinite(Number(h[k])) && Number(h[k]) > 0 ? Number(h[k]) : null)); }
  return { ids, hitos };
}
/** Cuántos hitos lleva (seguidos desde el primero) y cuál es el siguiente (4 = todos). */
export function progreso(estado, id) {
  const h = estado?.hitos?.[id] || [];
  let n = 0; while (n < 4 && h[n]) n++;
  return { n, siguiente: n, completa: n === 4, hechos: h.filter(Boolean).length };
}
/** Marca (o desmarca) un hito y devuelve el estado nuevo. Marcar uno marca también los anteriores (son pasos seguidos). */
export function marcar(estado, id, k, on = true, ahora = Date.now()) {
  const e = sanear(estado) || { ids: [], hitos: {} };
  if (!e.ids.includes(id)) return e;
  const h = [...(e.hitos[id] || [null, null, null, null])];
  if (on) for (let i = 0; i <= k; i++) h[i] ||= ahora; else for (let i = k; i < 4; i++) h[i] = null;
  e.hitos[id] = h; return e;
}
/** Elige o quita una meta (máximo 3). */
export function alternar(estado, id) {
  const e = sanear(estado) || { ids: [], hitos: {} };
  if (e.ids.includes(id)) { e.ids = e.ids.filter((x) => x !== id); delete e.hitos[id]; }
  else if (e.ids.length < MAX_METAS && POR_ID[id]) { e.ids.push(id); e.hitos[id] = [null, null, null, null]; }
  return e;
}
/** Metas elegidas que trabaja un ejercicio (por su nombre en la sesión). */
export const metasDe = (estado, nombre) => (estado?.ids || []).filter((id) => POR_ID[id]?.ej.includes(nombre));

/* ---------- textos de la interfaz en los cinco idiomas ---------- */
export const TXT = {
  es: { titulo: "Mis metas", intro: "¿Para qué quiere estar en forma? Elija hasta 3 metas de su día a día: el plan le señalará los ejercicios que las trabajan, con cuatro hitos para ver cómo avanza y la prueba que las mide.", vacio_t: "¿Para qué quiere estar en forma?", vacio_x: "Elija hasta 3 metas de su día a día y el plan le señalará los ejercicios que las trabajan.", todas: "Ver todas", cambiar: "Cambiar", max: "Puede elegir hasta 3.", elegidas: "{n} de 3 elegidas", listo: "Listo", trabaja: "Trabaja {x}", hitos: "Hitos", proximo: "Próximo hito", conseguido: "Lo he conseguido", cumplida: "¡Meta cumplida! Puede mantenerla o elegir otra.", hito_ok: "¡Hito conseguido!", deshacer: "Deshacer", mide: "Se mide con", sin_prueba: "Aún no ha hecho las pruebas de forma física.", hacer_pruebas: "Hacer las pruebas", en_plan: "En su plan la trabajan", quitar: "Quitar esta meta", volver: "Mis metas", ver: "Ver la meta", badge: "Trabaja su meta: {x}", el: "el {d}", elegir: "Elegir", elegida: "Elegida" },
  en: { titulo: "My goals", intro: "What do you want to be fit for? Choose up to 3 everyday goals: your plan will flag the exercises that work on them, with four milestones to track your progress and the test that measures them.", vacio_t: "What do you want to be fit for?", vacio_x: "Choose up to 3 everyday goals and your plan will flag the exercises that work on them.", todas: "See all", cambiar: "Change", max: "You can choose up to 3.", elegidas: "{n} of 3 chosen", listo: "Done", trabaja: "Works on {x}", hitos: "Milestones", proximo: "Next milestone", conseguido: "I've done it", cumplida: "Goal achieved! You can keep it or choose another.", hito_ok: "Milestone reached!", deshacer: "Undo", mide: "Measured with", sin_prueba: "You haven't done the fitness tests yet.", hacer_pruebas: "Do the tests", en_plan: "In your plan, these work on it", quitar: "Remove this goal", volver: "My goals", ver: "See the goal", badge: "Works on your goal: {x}", el: "on {d}", elegir: "Choose", elegida: "Chosen" },
  ca: { titulo: "Les meves metes", intro: "Per a què vol estar en forma? Triï fins a 3 metes del seu dia a dia: el pla li assenyalarà els exercicis que les treballen, amb quatre fites per veure com avança i la prova que les mesura.", vacio_t: "Per a què vol estar en forma?", vacio_x: "Triï fins a 3 metes del seu dia a dia i el pla li assenyalarà els exercicis que les treballen.", todas: "Veure-les totes", cambiar: "Canviar", max: "En pot triar fins a 3.", elegidas: "{n} de 3 triades", listo: "Fet", trabaja: "Treballa {x}", hitos: "Fites", proximo: "Pròxima fita", conseguido: "Ho he aconseguit", cumplida: "Meta complerta! La pot mantenir o triar-ne una altra.", hito_ok: "Fita aconseguida!", deshacer: "Desfer", mide: "Es mesura amb", sin_prueba: "Encara no ha fet les proves de forma física.", hacer_pruebas: "Fer les proves", en_plan: "Al seu pla la treballen", quitar: "Treure aquesta meta", volver: "Les meves metes", ver: "Veure la meta", badge: "Treballa la seva meta: {x}", el: "el {d}", elegir: "Triar", elegida: "Triada" },
  gl: { titulo: "As miñas metas", intro: "Para que quere estar en forma? Escolla ata 3 metas do seu día a día: o plan sinalaralle os exercicios que as traballan, con catro fitos para ver como avanza e a proba que as mide.", vacio_t: "Para que quere estar en forma?", vacio_x: "Escolla ata 3 metas do seu día a día e o plan sinalaralle os exercicios que as traballan.", todas: "Ver todas", cambiar: "Cambiar", max: "Pode escoller ata 3.", elegidas: "{n} de 3 escollidas", listo: "Feito", trabaja: "Traballa {x}", hitos: "Fitos", proximo: "Próximo fito", conseguido: "Conseguino", cumplida: "Meta cumprida! Pode mantela ou escoller outra.", hito_ok: "Fito conseguido!", deshacer: "Desfacer", mide: "Mídese con", sin_prueba: "Aínda non fixo as probas de forma física.", hacer_pruebas: "Facer as probas", en_plan: "No seu plan trabállana", quitar: "Quitar esta meta", volver: "As miñas metas", ver: "Ver a meta", badge: "Traballa a súa meta: {x}", el: "o {d}", elegir: "Escoller", elegida: "Escollida" },
  eu: { titulo: "Nire helburuak", intro: "Zertarako nahi duzu sasoian egon? Aukeratu eguneroko bizitzako 3 helburu gehienez: planak horiek lantzen dituzten ariketak adieraziko dizkizu, aurrerapena ikusteko lau mugarrirekin eta horiek neurtzen dituen probarekin.", vacio_t: "Zertarako nahi duzu sasoian egon?", vacio_x: "Aukeratu eguneroko bizitzako 3 helburu gehienez, eta planak horiek lantzen dituzten ariketak adieraziko dizkizu.", todas: "Ikusi denak", cambiar: "Aldatu", max: "3 aukera ditzakezu gehienez.", elegidas: "{n} / 3 aukeratuta", listo: "Eginda", trabaja: "Lantzen du: {x}", hitos: "Mugarriak", proximo: "Hurrengo mugarria", conseguido: "Lortu dut", cumplida: "Helburua beteta! Mantendu dezakezu edo beste bat aukeratu.", hito_ok: "Mugarria lortuta!", deshacer: "Desegin", mide: "Honekin neurtzen da", sin_prueba: "Oraindik ez dituzu sasoi fisikoko probak egin.", hacer_pruebas: "Egin probak", en_plan: "Zure planean hauek lantzen dute", quitar: "Kendu helburu hau", volver: "Nire helburuak", ver: "Ikusi helburua", badge: "Zure helburua lantzen du: {x}", el: "{d}", elegir: "Aukeratu", elegida: "Aukeratuta" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}

/* ---------- piezas ---------- */
const ic = (d, clase = "mt-i") => `<svg class="${clase}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const fecha = (ms) => new Date(ms).toLocaleDateString(idioma(), { day: "numeric", month: "short" });
const barra = (p) => `<span class="mt-barra" aria-hidden="true">${[0, 1, 2, 3].map((k) => `<i class="${k < p.n ? "on" : k === p.n ? "sig" : ""}"></i>`).join("")}</span>`;
/** Último resultado de cada prueba que mide la meta (si hay pruebas guardadas), con su nivel para su edad. */
function medidas(meta, c) {
  const S = c.pruebas, hist = c.sft?.hist || [];
  if (!S || !hist.length) return [];
  return meta.pruebas.map((id) => {
    const con = hist.filter((h) => h.r?.[id] != null); if (!con.length) return null;
    const u = con[con.length - 1], a = con.length > 1 ? con[con.length - 2] : null, cl = S.clasificar(id, u.r[id], u.edad, u.sexo);
    const d = a ? u.r[id] - a.r[id] : 0, mejor = id === "levantarse" ? d < 0 : d > 0;
    return { id, txt: `${S.PRUEBAS[id].corto}: ${S.fmt(id, u.r[id])}${cl?.nivel ? ` · ${S.tx(cl.nivel)}` : ""}`, tendencia: !a || !d ? "" : mejor ? "▲" : "▼", mejor };
  }).filter(Boolean);
}

const CSS = `
.metas-plan { margin: 12px 0 14px; }
.mt-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 8px; }
.mt-cab h3 { margin: 0; }
.mt-lista { display: grid; gap: 10px; }
.mt-card { position: relative; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 62%); }
.mt-card.completa { border-color: var(--info); background: linear-gradient(135deg, var(--info-soft), var(--surface) 62%); }
.mt-card-cab { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.mt-ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--accent); color: var(--accent-fg); box-shadow: 0 6px 16px -8px var(--accent); }
.mt-card.completa .mt-ic { background: var(--info); color: var(--surface); }
.mt-i { width: 22px; height: 22px; }
.mt-tit { display: block; padding: 0; border: 0; background: none; color: var(--fg); font: inherit; font-weight: 700; font-size: .98rem; line-height: 1.25; text-align: left; cursor: pointer; }
.mt-tit:hover { color: var(--accent-deep); text-decoration: underline; text-underline-offset: 3px; }
.mt-por { display: block; font-size: .78rem; color: var(--muted); }
.mt-n { font: 800 .95rem var(--mono); color: var(--accent-deep); white-space: nowrap; }
.mt-barra { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin: 10px 0 8px; }
.mt-barra i { height: 8px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line-strong); }
.mt-barra i.on { border-color: transparent; background: linear-gradient(90deg, var(--accent), var(--marca-clara)); }
.mt-card.completa .mt-barra i.on { background: var(--info); }
.mt-barra i.sig { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.mt-prox { margin: 0; font-size: .93rem; }
.mt-prox small { display: block; font-family: var(--mono); font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.mt-acc { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin-top: 8px; }
.mt-mide { font-size: .8rem; color: var(--muted); }
.mt-mide .d-mejor { color: var(--info-ink); font-weight: 700; }
.mt-mide .d-peor { color: var(--precaucion-ink); font-weight: 700; }
.mt-vacio { padding: 14px; border: 1.5px dashed var(--accent); border-radius: var(--r-md); background: var(--surface); }
.mt-vacio b { display: block; font-size: 1rem; }
.mt-vacio p { margin: 2px 0 0; font-size: .9rem; color: var(--muted); }
.mt-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.mt-chips .chip-btn { display: inline-flex; align-items: center; gap: 6px; }
.mt-chips .mt-i { width: 16px; height: 16px; }
.meta-badge { display: inline-flex; align-items: center; gap: 4px; margin: 2px 0 0 6px; padding: 1px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep); font-size: .72rem; font-weight: 700; line-height: 1.6; vertical-align: middle; white-space: nowrap; }
.meta-badge .mt-i { width: 12px; height: 12px; }
.mt-dlg .mt-intro { margin: 0 0 10px; font-size: .95rem; color: var(--muted); }
.mt-opciones { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; }
.mt-op { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 10px; align-items: center; width: 100%; min-height: 64px; padding: 10px 12px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.mt-op:hover:not(:disabled) { border-color: var(--accent); }
.mt-op[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
.mt-op:disabled { opacity: .55; cursor: default; }
.mt-op .mt-ic { width: 40px; height: 40px; }
.mt-op b { display: block; font-size: .93rem; line-height: 1.25; }
.mt-op small { display: block; font-size: .76rem; color: var(--muted); }
.mt-op .mt-marca { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line-strong); display: grid; place-items: center; font-size: .8rem; font-weight: 800; color: transparent; }
.mt-op[aria-pressed="true"] .mt-marca { border-color: var(--accent); background: var(--accent); color: var(--accent-fg); }
.mt-estado { margin: 10px 0 0; font-size: .85rem; color: var(--muted); text-align: center; }
.mt-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 12px; }
.mt-hitos { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; counter-reset: hito; }
.mt-hitos li { position: relative; }
.mt-hitos label { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; align-items: start; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); cursor: pointer; }
.mt-hitos input { width: 22px; height: 22px; margin: 1px 0 0; accent-color: var(--accent); }
.mt-hitos li.on label { border-color: var(--accent); background: var(--accent-soft); }
.mt-hitos small { display: block; color: var(--muted); font-size: .76rem; }
.mt-det-cab { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: center; margin: 0 0 6px; }
.mt-det-cab .mt-ic { width: 52px; height: 52px; border-radius: 16px; }
.mt-det-cab .mt-i { width: 28px; height: 28px; }
.mt-dlg .mt-det-cab h2 { margin: 0; }
.mt-medidas { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 4px; font-size: .92rem; }
.mt-ejs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
:root[data-theme="contrast"] .mt-card, :root[data-theme="contrast"] .mt-card.completa { background: var(--surface); }
@media (forced-colors: active) { .mt-barra i.on { background: Highlight; } .mt-op[aria-pressed="true"] { outline: 2px solid Highlight; } }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .mt-barra i.on { animation: mt-llena .6s var(--ease-salida, ease-out) both; transform-origin: left center; }
  html:not(.pa-quieto) .mt-barra i.sig { animation: mt-sig .5s ease-out .3s both; }
  html:not(.pa-quieto) .mt-card.recien .mt-ic { animation: mt-pop .6s var(--ease-muelle, ease-out) both; }
}
@keyframes mt-llena { from { transform: scaleX(0); } }
@keyframes mt-sig { from { box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 4px var(--accent-soft); } }
@keyframes mt-pop { 40% { transform: scale(1.18) rotate(-6deg); } }
@media print { .metas-plan .mt-acc button, .meta-badge { display: none !important; } }
`;
function estilos() { if (typeof document !== "undefined" && !document.getElementById("mt-css")) { const st = document.createElement("style"); st.id = "mt-css"; st.textContent = CSS; document.head.append(st); } }

/* ---------- tarjeta de «Mi plan» ---------- */
/** HTML de la tarjeta «Mis metas» (vacía: invita a elegir con atajos a cuatro metas). recien = id de la meta que acaba de avanzar. */
export function tarjeta(c, { recien = null } = {}) {
  estilos();
  const e = sanear(c.metas);
  if (!e?.ids.length) return `<div class="mt-vacio"><b>${tx("vacio_t")}</b><p>${tx("vacio_x")}</p><div class="mt-chips">${METAS.slice(0, 4).map((m) => `<button type="button" class="chip chip-btn" data-meta-elegir="${m.id}">${ic(m.icono)}${m.titulo}</button>`).join("")}<button type="button" class="btn-sec sm" data-metas="">${tx("todas")}</button></div></div>`;
  return `<div class="mt-cab"><h3>${tx("titulo")}</h3><button type="button" class="btn-sec sm" data-metas="">${tx("cambiar")}</button></div>
    <div class="mt-lista">${e.ids.map((id) => {
      const m = POR_ID[id], p = progreso(e, id), med = medidas(m, c);
      return `<div class="mt-card${p.completa ? " completa" : ""}${recien === id ? " recien" : ""}" data-meta="${id}">
        <div class="mt-card-cab"><span class="mt-ic">${ic(m.icono)}</span><span><button type="button" class="mt-tit" data-meta-ver="${id}">${m.titulo}</button><span class="mt-por">${tx("trabaja", { x: m.por })}</span></span><span class="mt-n" aria-label="${tx("hitos")}: ${p.n}/4">${p.n}/4</span></div>
        ${barra(p)}
        ${p.completa ? `<p class="mt-prox">${tx("cumplida")}</p>` : `<p class="mt-prox"><small>${tx("proximo")}</small>${m.hitos[p.n]}</p>`}
        <div class="mt-acc">${p.completa ? "" : `<button type="button" class="btn sm" data-meta-hito="${id}" data-k="${p.n}">✓ ${tx("conseguido")}</button>`}${med.length ? `<span class="mt-mide">${tx("mide")}: ${med.map((x) => `${x.txt}${x.tendencia ? ` <span class="${x.mejor ? "d-mejor" : "d-peor"}">${x.tendencia}</span>` : ""}`).join(" · ")}</span>` : ""}</div>
      </div>`;
    }).join("")}</div>`;
}
/** Insignias en los ejercicios de la sesión que trabajan alguna meta elegida. */
export function insignias(raiz, c) {
  estilos();
  const e = sanear(c.metas); if (!raiz || !e?.ids.length) return 0;
  let n = 0;
  raiz.querySelectorAll(".bloques li").forEach((li) => {
    const nombre = li.querySelector("[data-ejercicio]")?.dataset.ejercicio; if (!nombre || li.querySelector(".meta-badge")) return;
    const ms = metasDe(e, nombre); if (!ms.length) return;
    const b = li.querySelector("span > b"); if (!b) return;
    b.insertAdjacentHTML("afterend", ms.map((id) => `<span class="meta-badge" title="${tx("badge", { x: POR_ID[id].titulo })}">${ic(POR_ID[id].icono)}${POR_ID[id].corto}</span>`).join(""));
    n++;
  });
  return n;
}

/* ---------- ventana: elegir metas y ver cada una ---------- */
let dlg = null, ctx = {};
const cu = () => dlg.querySelector("#mt-cuerpo");
function crear() {
  estilos();
  dlg = document.createElement("dialog");
  dlg.id = "metas"; dlg.className = "ficha mt-dlg"; dlg.setAttribute("aria-labelledby", "mt-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="mt-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="mt-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="mt-cuerpo" aria-live="polite"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#mt-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
function guardar(e) { ctx.metas = e; ctx.guardar?.(e); }
function lista() {
  const e = sanear(ctx.metas) || { ids: [], hitos: {} }, lleno = e.ids.length >= MAX_METAS;
  cu().innerHTML = `<p class="mt-intro">${tx("intro")}</p>
    <ul class="mt-opciones">${METAS.map((m) => { const on = e.ids.includes(m.id); return `<li><button type="button" class="mt-op" data-op="${m.id}" aria-pressed="${on}"${!on && lleno ? " disabled" : ""}><span class="mt-ic">${ic(m.icono)}</span><span><b>${m.titulo}</b><small>${tx("trabaja", { x: m.por })}</small></span><span class="mt-marca" aria-hidden="true">✓</span></button></li>`; }).join("")}</ul>
    <p class="mt-estado" role="status">${tx("elegidas", { n: e.ids.length })}${lleno ? ` · ${tx("max")}` : ""}</p>
    <div class="mt-acciones"><button type="button" class="btn" data-listo>${tx("listo")}</button></div>`;
  cu().querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => { guardar(alternar(ctx.metas, b.dataset.op)); lista(); cu().querySelector(`[data-op="${b.dataset.op}"]`)?.focus(); }));
  cu().querySelector("[data-listo]").addEventListener("click", () => dlg.close());
}
function detalle(id) {
  const m = POR_ID[id], e = sanear(ctx.metas); if (!m || !e?.ids.includes(id)) return lista();
  const h = e.hitos[id], med = medidas(m, ctx);
  cu().innerHTML = `<div class="mt-det-cab"><span class="mt-ic">${ic(m.icono)}</span><div><h2>${m.titulo}</h2><span class="mt-por">${tx("trabaja", { x: m.por })}</span></div></div>
    ${barra(progreso(e, id))}
    <h3>${tx("hitos")}</h3>
    <ol class="mt-hitos">${m.hitos.map((x, k) => `<li class="${h[k] ? "on" : ""}"><label><input type="checkbox" data-k="${k}"${h[k] ? " checked" : ""}><span>${x}${h[k] ? `<small>${tx("el", { d: fecha(h[k]) })}</small>` : ""}</span></label></li>`).join("")}</ol>
    <h3>${tx("mide")}</h3>
    ${med.length ? `<ul class="mt-medidas">${med.map((x) => `<li>${x.txt}${x.tendencia ? ` <span class="${x.mejor ? "d-mejor" : "d-peor"}">${x.tendencia}</span>` : ""}</li>`).join("")}</ul>` : `<p class="mt-mide">${tx("sin_prueba")}</p>`}
    <div class="mt-acciones" style="justify-content:flex-start"><button type="button" class="btn-sec sm" data-pruebas="">${tx("hacer_pruebas")}</button></div>
    <h3>${tx("en_plan")}</h3>
    <div class="mt-ejs">${m.ej.map((x) => `<button type="button" class="chip chip-btn" data-ejercicio="${x}">${x}</button>`).join("")}</div>
    <div class="mt-acciones"><button type="button" class="btn-sec sm" data-volver>${tx("volver")}</button><button type="button" class="btn-sec sm" data-quitar>${tx("quitar")}</button></div>`;
  cu().querySelectorAll(".mt-hitos input").forEach((c) => c.addEventListener("change", () => { const k = Number(c.dataset.k); guardar(marcar(ctx.metas, id, k, c.checked)); detalle(id); if (c.checked) ctx.vibrar?.([20, 60, 20]); cu().querySelector(`.mt-hitos input[data-k="${k}"]`)?.focus(); }));
  cu().querySelector("[data-pruebas]").addEventListener("click", () => dlg.close());
  cu().querySelector("[data-volver]").addEventListener("click", lista);
  cu().querySelector("[data-quitar]").addEventListener("click", () => { guardar(alternar(ctx.metas, id)); lista(); });
}
/** Abre la ventana: la lista para elegir o, con id, el detalle de una meta. c: { metas, sft, pruebas, guardar, vibrar }. */
export function abrir(c = {}, id = null) {
  if (!dlg) crear();
  ctx = c;
  dlg.querySelector("#mt-cab-t").textContent = tx("titulo");
  if (id && POR_ID[id]) detalle(id); else lista();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
