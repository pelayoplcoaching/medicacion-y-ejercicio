/* Mis constantes (mejora grande 13): gráficas de la glucosa (antes y después), la tensión sistólica y el pulso al terminar
   que se anotan en el diario de sesiones, con las franjas de su situación (las mismas cifras que usan las reglas de la
   base: ADA 2024 para la glucosa alrededor del ejercicio, ESC 2024 y ACSM para la tensión; Tanaka 2001 y ACSM 2011 para
   el pulso) y una lista de valores para comentar con su médico, sin diagnosticar. Cada gráfica tiene lectura al pasar el
   dedo o el ratón y su tabla. Textos de la interfaz en los cinco idiomas dentro del módulo. Se carga al abrirlo. */
import { t, idioma } from "./i18n.js?v=202611222111";

/* ---------- datos ---------- */
const DIA = 864e5;
const deISO = (s) => { const [a, m, d] = String(s).split("-").map(Number); return new Date(a, m - 1, d, 12).getTime(); };
const num = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
/** Las constantes del diario, en orden de fecha: glucosa (antes y después), tensión sistólica y pulso al terminar. */
export function series(diario) {
  const xs = (diario || []).filter((x) => x?.const && typeof x.fecha === "string").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const out = { glucosa: [], ta: [], fc: [] };
  for (const x of xs) {
    const f = deISO(x.fecha), c = x.const, ga = num(c.glucosa_antes), gd = num(c.glucosa_despues);
    if (ga != null || gd != null) out.glucosa.push({ f, fecha: x.fecha, antes: ga, despues: gd });
    if (num(c.ta) != null) out.ta.push({ f, fecha: x.fecha, v: num(c.ta) });
    if (num(c.fc) != null) out.fc.push({ f, fecha: x.fecha, v: num(c.fc) });
  }
  return out;
}
export const hayDatos = (diario) => { const s = series(diario); return s.glucosa.length + s.ta.length + s.fc.length > 0; };
/** Pulso máximo estimado (Tanaka 2001: 208 − 0,7 × edad) y zonas de esfuerzo moderado (64-76 %) y vigoroso (77-95 %) del ACSM. */
export const fcMax = (edad) => (edad == null || !Number.isFinite(Number(edad)) ? null : Math.round(208 - 0.7 * Number(edad)));
/** Franjas de cada gráfica (de abajo arriba): [desde, hasta, nivel, clave del texto]. Sin edad o con fármacos que invalidan el pulso, el pulso va sin franjas. */
export function franjas(id, { edad = null, fcNoValida = false } = {}) {
  if (id === "glucosa") return [[0, 70, "alerta", "g_baja"], [70, 90, "precaucion", "g_justa"], [90, 250, "info", "g_bien"], [250, 600, "precaucion", "g_alta"]];
  if (id === "ta") return [[0, 90, "precaucion", "t_baja"], [90, 160, "info", "t_bien"], [160, 180, "precaucion", "t_media"], [180, 300, "alerta", "t_alta"]];
  const m = fcMax(edad);
  if (!m || fcNoValida) return [];
  return [[Math.round(m * 0.64), Math.round(m * 0.77), "info", "f_moderada"], [Math.round(m * 0.77), Math.round(m * 0.96), "precaucion", "f_vigorosa"]];
}
const DOMINIO = { glucosa: [40, 320], ta: [70, 220], fc: [40, 190] };
const UNIDAD = { glucosa: "mg/dL", ta: "mmHg", fc: "lpm" };
/** Valores para comentar con su médico (sin diagnosticar): [{ id, nivel, clave, n, fechas }]. */
export function avisos(S, { edad = null } = {}) {
  const out = [], m = fcMax(edad);
  const add = (id, nivel, clave, filas) => { if (filas.length) out.push({ id, nivel, clave, n: filas.length, fechas: filas.map((x) => x.fecha) }); };
  const g = S.glucosa.flatMap((x) => [x.antes, x.despues].filter((v) => v != null).map((v) => ({ v, fecha: x.fecha })));
  add("glucosa", "alerta", "a_g_baja", g.filter((x) => x.v < 70));
  add("glucosa", "precaucion", "a_g_alta", g.filter((x) => x.v > 250));
  add("ta", "alerta", "a_t_alta", S.ta.filter((x) => x.v >= 180));
  add("ta", "precaucion", "a_t_media", S.ta.filter((x) => x.v >= 160 && x.v < 180));
  add("ta", "precaucion", "a_t_baja", S.ta.filter((x) => x.v < 90));
  if (m) add("fc", "precaucion", "a_f_alta", S.fc.filter((x) => x.v > m));
  return out;
}

/* ---------- textos de la interfaz en los cinco idiomas ---------- */
export const TXT = {
  es: { titulo: "Mis constantes", intro: "Lo que ha anotado al registrar sus sesiones, con las franjas que usa la aplicación para su situación.", glucosa: "Glucosa", ta: "Tensión (sistólica)", fc: "Pulso al terminar", antes: "Antes", despues: "Después", g_baja: "Bajada de azúcar", g_justa: "Justa para empezar", g_bien: "Bien para moverse", g_alta: "Alta: compruebe cetonas", t_baja: "Baja", t_bien: "Bien", t_media: "Solo ligera o moderada", t_alta: "No entrene: consulte", f_moderada: "Esfuerzo moderado", f_vigorosa: "Esfuerzo vigoroso", max: "Su máximo estimado: {n} lpm", fc_no: "Con su medicación el pulso no sirve para medir el esfuerzo: guíese por cómo respira. Se enseñan los valores, sin franjas.", fc_edad: "Ponga su edad en Datos para ver sus zonas de pulso.", insulina: "Si usa insulina o sulfonilureas: por debajo de 90, tome 10–20 g de hidratos rápidos y espere; entre 90 y 125, 10 g si va a hacer aeróbico.", vacio_t: "Aún no ha anotado constantes", vacio_x: "Al registrar una sesión puede anotar {x}. Aquí verá cómo van.", vacio_nada: "Con su medicación y su situación, la aplicación no pide anotar constantes.", comentar: "Para comentar con su médico", comentar_x: "No es un diagnóstico: llévelo a su próxima consulta.", nada: "Ningún valor fuera de las franjas.", a_g_baja: "Glucosa por debajo de 70 mg/dL", a_g_alta: "Glucosa por encima de 250 mg/dL", a_t_alta: "Tensión de 180 mmHg o más", a_t_media: "Tensión entre 160 y 179 mmHg", a_t_baja: "Tensión por debajo de 90 mmHg", a_f_alta: "Pulso por encima de su máximo estimado", tabla: "Ver en tabla", fecha: "Fecha", valor: "Valor", ultimo: "Último: {v}", n_med: "{n} mediciones", n_med1: "1 medición", copiar: "Copiar para el médico", copiado: "Copiado.", fuentes: "Fuentes", desde: "desde el {d}" },
  en: { titulo: "My readings", intro: "What you noted when logging your sessions, with the bands the app uses for your situation.", glucosa: "Glucose", ta: "Blood pressure (systolic)", fc: "Pulse at the end", antes: "Before", despues: "After", g_baja: "Low sugar", g_justa: "Borderline to start", g_bien: "Fine for exercise", g_alta: "High: check ketones", t_baja: "Low", t_bien: "Fine", t_media: "Light or moderate only", t_alta: "Don't train: see your doctor", f_moderada: "Moderate effort", f_vigorosa: "Vigorous effort", max: "Your estimated maximum: {n} bpm", fc_no: "With your medication, pulse doesn't measure effort: go by your breathing. Values are shown without bands.", fc_edad: "Enter your age in Details to see your pulse zones.", insulina: "If you use insulin or sulfonylureas: below 90, take 10–20 g of fast carbohydrate and wait; between 90 and 125, 10 g before aerobic exercise.", vacio_t: "No readings noted yet", vacio_x: "When you log a session you can note {x}. You'll see how they go here.", vacio_nada: "With your medication and situation, the app doesn't ask you to note readings.", comentar: "To discuss with your doctor", comentar_x: "This is not a diagnosis: take it to your next appointment.", nada: "No values outside the bands.", a_g_baja: "Glucose below 70 mg/dL", a_g_alta: "Glucose above 250 mg/dL", a_t_alta: "Blood pressure of 180 mmHg or more", a_t_media: "Blood pressure between 160 and 179 mmHg", a_t_baja: "Blood pressure below 90 mmHg", a_f_alta: "Pulse above your estimated maximum", tabla: "See as a table", fecha: "Date", valor: "Value", ultimo: "Latest: {v}", n_med: "{n} readings", n_med1: "1 reading", copiar: "Copy for the doctor", copiado: "Copied.", fuentes: "Sources", desde: "since {d}" },
  ca: { titulo: "Les meves constants", intro: "El que ha anotat en registrar les sessions, amb les franges que fa servir l'aplicació per a la seva situació.", glucosa: "Glucosa", ta: "Pressió (sistòlica)", fc: "Pols en acabar", antes: "Abans", despues: "Després", g_baja: "Baixada de sucre", g_justa: "Justa per començar", g_bien: "Bé per moure's", g_alta: "Alta: comprovi cetones", t_baja: "Baixa", t_bien: "Bé", t_media: "Només lleugera o moderada", t_alta: "No entreni: consulti", f_moderada: "Esforç moderat", f_vigorosa: "Esforç vigorós", max: "El seu màxim estimat: {n} ppm", fc_no: "Amb la seva medicació el pols no serveix per mesurar l'esforç: guiï's per com respira. Es mostren els valors, sense franges.", fc_edad: "Posi la seva edat a Dades per veure les seves zones de pols.", insulina: "Si fa servir insulina o sulfonilurees: per sota de 90, prengui 10–20 g d'hidrats ràpids i esperi; entre 90 i 125, 10 g si farà aeròbic.", vacio_t: "Encara no ha anotat constants", vacio_x: "En registrar una sessió pot anotar {x}. Aquí veurà com van.", vacio_nada: "Amb la seva medicació i la seva situació, l'aplicació no demana anotar constants.", comentar: "Per comentar amb el seu metge", comentar_x: "No és un diagnòstic: porti-ho a la propera consulta.", nada: "Cap valor fora de les franges.", a_g_baja: "Glucosa per sota de 70 mg/dL", a_g_alta: "Glucosa per sobre de 250 mg/dL", a_t_alta: "Pressió de 180 mmHg o més", a_t_media: "Pressió entre 160 i 179 mmHg", a_t_baja: "Pressió per sota de 90 mmHg", a_f_alta: "Pols per sobre del seu màxim estimat", tabla: "Veure en taula", fecha: "Data", valor: "Valor", ultimo: "Últim: {v}", n_med: "{n} mesures", n_med1: "1 mesura", copiar: "Copiar per al metge", copiado: "Copiat.", fuentes: "Fonts", desde: "des del {d}" },
  gl: { titulo: "As miñas constantes", intro: "O que anotou ao rexistrar as súas sesións, coas bandas que usa a aplicación para a súa situación.", glucosa: "Glicosa", ta: "Tensión (sistólica)", fc: "Pulso ao rematar", antes: "Antes", despues: "Despois", g_baja: "Baixada de azucre", g_justa: "Xusta para comezar", g_bien: "Ben para moverse", g_alta: "Alta: comprobe cetonas", t_baja: "Baixa", t_bien: "Ben", t_media: "Só lixeira ou moderada", t_alta: "Non adestre: consulte", f_moderada: "Esforzo moderado", f_vigorosa: "Esforzo vigoroso", max: "O seu máximo estimado: {n} lpm", fc_no: "Coa súa medicación o pulso non serve para medir o esforzo: guíese por como respira. Amósanse os valores, sen bandas.", fc_edad: "Poña a súa idade en Datos para ver as súas zonas de pulso.", insulina: "Se usa insulina ou sulfonilureas: por debaixo de 90, tome 10–20 g de hidratos rápidos e agarde; entre 90 e 125, 10 g se vai facer aeróbico.", vacio_t: "Aínda non anotou constantes", vacio_x: "Ao rexistrar unha sesión pode anotar {x}. Aquí verá como van.", vacio_nada: "Coa súa medicación e a súa situación, a aplicación non pide anotar constantes.", comentar: "Para comentar co seu médico", comentar_x: "Non é un diagnóstico: léveo á súa próxima consulta.", nada: "Ningún valor fóra das bandas.", a_g_baja: "Glicosa por debaixo de 70 mg/dL", a_g_alta: "Glicosa por riba de 250 mg/dL", a_t_alta: "Tensión de 180 mmHg ou máis", a_t_media: "Tensión entre 160 e 179 mmHg", a_t_baja: "Tensión por debaixo de 90 mmHg", a_f_alta: "Pulso por riba do seu máximo estimado", tabla: "Ver en táboa", fecha: "Data", valor: "Valor", ultimo: "Último: {v}", n_med: "{n} medicións", n_med1: "1 medición", copiar: "Copiar para o médico", copiado: "Copiado.", fuentes: "Fontes", desde: "desde o {d}" },
  eu: { titulo: "Nire konstanteak", intro: "Saioak erregistratzean idatzi duzuna, aplikazioak zure egoerarako erabiltzen dituen tarteekin.", glucosa: "Glukosa", ta: "Tentsioa (sistolikoa)", fc: "Pultsua amaitzean", antes: "Aurretik", despues: "Ondoren", g_baja: "Azukre-jaitsiera", g_justa: "Hasteko justu", g_bien: "Mugitzeko ondo", g_alta: "Altua: egiaztatu zetonak", t_baja: "Baxua", t_bien: "Ondo", t_media: "Arina edo ertaina bakarrik", t_alta: "Ez entrenatu: kontsultatu", f_moderada: "Ahalegin ertaina", f_vigorosa: "Ahalegin bizia", max: "Zure gehienezko estimatua: {n} tpm", fc_no: "Zure botikekin pultsuak ez du balio ahalegina neurtzeko: gidatu arnasketaren arabera. Balioak tarterik gabe erakusten dira.", fc_edad: "Jarri zure adina Datuetan zure pultsu-eremuak ikusteko.", insulina: "Intsulina edo sulfonilureak erabiltzen badituzu: 90etik behera, hartu 10–20 g karbohidrato azkar eta itxaron; 90 eta 125 artean, 10 g aerobikoa egingo baduzu.", vacio_t: "Oraindik ez duzu konstanterik idatzi", vacio_x: "Saio bat erregistratzean idatz dezakezu: {x}. Hemen ikusiko duzu nola doazen.", vacio_nada: "Zure botikekin eta egoerarekin, aplikazioak ez du konstanterik idazteko eskatzen.", comentar: "Medikuarekin hitz egiteko", comentar_x: "Ez da diagnostikoa: eraman hurrengo kontsultara.", nada: "Ez dago tartetik kanpoko baliorik.", a_g_baja: "Glukosa 70 mg/dL-tik behera", a_g_alta: "Glukosa 250 mg/dL-tik gora", a_t_alta: "Tentsioa 180 mmHg edo gehiago", a_t_media: "Tentsioa 160 eta 179 mmHg artean", a_t_baja: "Tentsioa 90 mmHg-tik behera", a_f_alta: "Pultsua zure gehienezko estimatutik gora", tabla: "Ikusi taulan", fecha: "Data", valor: "Balioa", ultimo: "Azkena: {v}", n_med: "{n} neurketa", n_med1: "neurketa 1", copiar: "Kopiatu medikuarentzat", copiado: "Kopiatuta.", fuentes: "Iturriak", desde: "{d}(e)tik" },
};
const nMed = (n) => (n === 1 ? tx("n_med1") : tx("n_med", { n }));
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
export const FUENTES = [
  { txt: "ADA Standards of Care 2024 (glucosa alrededor del ejercicio; bajada de azúcar por debajo de 70 mg/dL) · Riddell 2017, Lancet Diabetes Endocrinol" },
  { txt: "ESC 2024, guía de hipertensión arterial · ACSM, Guidelines for Exercise Testing and Prescription, 11.ª ed." },
  { txt: "Tanaka et al. Age-predicted maximal heart rate revisited. J Am Coll Cardiol 2001", doi: "10.1016/s0735-1097(00)01054-8" },
  { txt: "Garber et al. ACSM position stand: quantity and quality of exercise. Med Sci Sports Exerc 2011", doi: "10.1249/MSS.0b013e318213fefb" },
];

/* ---------- gráfica (SVG; lectura al pasar el dedo o el ratón) ---------- */
const fechaCorta = (f) => new Date(f).toLocaleDateString(idioma(), { day: "numeric", month: "short" });
const W = 340, H = 190, PL = 36, PR = 12, PT = 10, PB = 26;
/** Puntos de una gráfica: [{ f, v, s (serie 1 o 2) }]. */
export function puntos(id, S) {
  if (id === "glucosa") return S.glucosa.flatMap((x) => [x.antes != null ? { f: x.f, v: x.antes, s: 1 } : null, x.despues != null ? { f: x.f + 3600e3, v: x.despues, s: 2 } : null].filter(Boolean));
  return S[id].map((x) => ({ f: x.f, v: x.v, s: 1 }));
}
export function grafica(id, S, c = {}) {
  const P = puntos(id, S); if (!P.length) return { svg: "", pts: [] };
  const fr = franjas(id, c), m = fcMax(c.edad);
  let [y0, y1] = DOMINIO[id];
  if (id === "fc" && m) y1 = Math.max(y1, m + 10);
  const vs = P.map((p) => p.v); y0 = Math.min(y0, Math.floor(Math.min(...vs) / 10) * 10); y1 = Math.max(y1, Math.ceil(Math.max(...vs) / 10) * 10);
  let f0 = Math.min(...P.map((p) => p.f)), f1 = Math.max(...P.map((p) => p.f));
  if (f1 - f0 < 6 * DIA) { const mid = (f0 + f1) / 2; f0 = mid - 3 * DIA; f1 = mid + 3 * DIA; }
  const X = (f) => PL + ((f - f0) / (f1 - f0)) * (W - PL - PR), Y = (v) => PT + (1 - (v - y0) / (y1 - y0)) * (H - PT - PB);
  const out = [];
  for (const [a, b, nivel, k] of fr) {
    const ya = Y(Math.min(b, y1)), yb = Y(Math.max(a, y0)); if (yb - ya <= 0) continue;
    out.push(`<rect class="ct-b ct-b-${nivel}" x="${PL}" y="${ya.toFixed(1)}" width="${W - PL - PR}" height="${(yb - ya).toFixed(1)}"/>`);
    if (yb - ya >= 13) out.push(`<text class="ct-bl" x="${PL + 5}" y="${(ya + 11).toFixed(1)}">${tx(k)}</text>`);
  }
  const ticks = [...new Set([y0, ...fr.flatMap(([a, b]) => [a, b]).filter((v) => v > y0 && v < y1), y1])].sort((a, b) => a - b);
  for (const v of ticks) out.push(`<path class="ct-g" d="M${PL} ${Y(v).toFixed(1)}H${W - PR}"/><text class="ct-tk" x="${PL - 5}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${v}</text>`);
  out.push(`<text class="ct-tk" x="${PL}" y="${H - 8}">${fechaCorta(f0)}</text><text class="ct-tk" x="${W - PR}" y="${H - 8}" text-anchor="end">${fechaCorta(f1)}</text>`);
  for (const s of [1, 2]) {
    const ps = P.filter((p) => p.s === s); if (!ps.length) continue;
    if (ps.length > 1) out.push(`<polyline class="ct-l ct-s${s}" points="${ps.map((p) => `${X(p.f).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ")}"/>`);
    out.push(ps.map((p) => `<circle class="ct-p ct-s${s}" cx="${X(p.f).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="4.5"/>`).join(""));
    const u = ps[ps.length - 1];
    out.push(`<text class="ct-ult" x="${Math.min(X(u.f), W - PR - 2).toFixed(1)}" y="${(Y(u.v) - 9).toFixed(1)}" text-anchor="${X(u.f) > W - 40 ? "end" : "middle"}">${u.v}</text>`);
  }
  out.push(`<path class="ct-cruz" d="M0 ${PT}V${H - PB}" hidden/><circle class="ct-foco" r="7" hidden/>`);
  const etiqueta = `${tx(id)} · ${nMed(P.length)} · ${tx("ultimo", { v: `${P[P.length - 1].v} ${UNIDAD[id]}` })}`;
  return { svg: `<svg class="ct-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${etiqueta}">${out.join("")}</svg>`, pts: P.map((p) => ({ ...p, x: X(p.f), y: Y(p.v) })) };
}
/** Lectura al pasar el dedo o el ratón: el punto más cercano en horizontal, con su fecha y valor. */
function activar(caja, id, pts) {
  const svg = caja.querySelector("svg"), tip = caja.querySelector(".ct-tip"), cruz = svg?.querySelector(".ct-cruz"), foco = svg?.querySelector(".ct-foco");
  if (!svg || !pts.length) return;
  const mostrar = (ev) => {
    const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * W;
    const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    cruz.setAttribute("d", `M${p.x.toFixed(1)} ${PT}V${H - PB}`); cruz.hidden = false;
    foco.setAttribute("cx", p.x.toFixed(1)); foco.setAttribute("cy", p.y.toFixed(1)); foco.setAttribute("class", `ct-foco ct-s${p.s}`); foco.hidden = false;
    tip.innerHTML = `<b>${p.v} ${UNIDAD[id]}</b><span>${fechaCorta(p.f)}${id === "glucosa" ? ` · ${tx(p.s === 1 ? "antes" : "despues")}` : ""}</span>`;
    tip.hidden = false;
    const px = (p.x / W) * r.width, py = (p.y / H) * r.height;
    tip.style.left = `${Math.max(4, Math.min(r.width - tip.offsetWidth - 4, px - tip.offsetWidth / 2))}px`;
    tip.style.top = `${Math.max(0, py - tip.offsetHeight - 12)}px`;
  };
  const ocultar = () => { tip.hidden = true; cruz.hidden = true; foco.hidden = true; };
  svg.addEventListener("pointermove", mostrar); svg.addEventListener("pointerdown", mostrar); svg.addEventListener("pointerleave", ocultar);
}

/* ---------- ventana ---------- */
const CSS = `
.ct-dlg { --ct-1: #593ede; --ct-2: #0b7ea8; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not([data-theme="contrast"]) .ct-dlg { --ct-1: #8b7cf6; --ct-2: #2e9bc2; } }
:root[data-theme="dark"] .ct-dlg { --ct-1: #8b7cf6; --ct-2: #2e9bc2; }
.ct-dlg .ct-intro { margin: 0 0 10px; font-size: .92rem; color: var(--muted); }
.ct-avisos { margin: 0 0 14px; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface); }
.ct-avisos.hay { border-color: var(--precaucion); background: linear-gradient(135deg, var(--precaucion-soft), var(--surface) 70%); }
.ct-avisos b { display: block; }
.ct-avisos small { display: block; color: var(--muted); }
.ct-avisos ul { margin: 6px 0 4px; padding-left: 1.2em; display: grid; gap: 4px; font-size: .93rem; }
.ct-avisos li.alerta { color: var(--alerta-ink); font-weight: 700; }
.ct-avisos li small { display: inline; font-weight: 400; }
.ct-n { display: inline-grid; place-items: center; min-width: 1.6em; height: 1.4em; margin: 0 2px; padding: 0 5px; border-radius: 999px; background: var(--surface-2); color: var(--fg); font: 700 .8rem var(--mono); }
.ct-tarjeta { margin: 0 0 14px; padding: 12px 12px 8px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.ct-cab { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 10px; }
.ct-dlg .ct-cab h3 { margin: 0; color: var(--fg); font-size: 1rem; font-family: var(--font); text-transform: none; letter-spacing: 0; }
.ct-dlg .ct-cab h3::after { display: none; }
.ct-cab small { color: var(--muted); font-size: .8rem; }
.ct-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 6px 0 0; padding: 0; list-style: none; font-size: .82rem; color: var(--muted); }
.ct-ley i { display: inline-block; width: 14px; height: 3px; margin-right: 6px; vertical-align: middle; border-radius: 2px; background: var(--ct-1); }
.ct-ley li.s2 i { background: var(--ct-2); }
.ct-graf { position: relative; margin-top: 4px; touch-action: pan-y; }
.ct-svg { display: block; width: 100%; max-width: 600px; height: auto; overflow: visible; }
.ct-b { stroke: none; }
.ct-b-info { fill: var(--info-soft); }
.ct-b-precaucion { fill: var(--precaucion-soft); }
.ct-b-alerta { fill: var(--alerta-soft); }
.ct-bl { fill: var(--muted); font: 600 8.5px var(--font); }
.ct-g { stroke: var(--line); stroke-width: 1; }
.ct-tk { fill: var(--muted); font: 500 9px var(--mono); }
.ct-l { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ct-l.ct-s1 { stroke: var(--ct-1); }
.ct-l.ct-s2 { stroke: var(--ct-2); }
.ct-p { stroke: var(--surface); stroke-width: 2; }
.ct-p.ct-s1 { fill: var(--ct-1); }
.ct-p.ct-s2 { fill: var(--ct-2); }
.ct-ult { fill: var(--fg); font: 700 9.5px var(--mono); }
.ct-cruz { stroke: var(--line-strong); stroke-width: 1; }
.ct-foco { fill: none; stroke-width: 2; }
.ct-foco.ct-s1 { stroke: var(--ct-1); }
.ct-foco.ct-s2 { stroke: var(--ct-2); }
.ct-tip { position: absolute; z-index: 2; display: grid; padding: 6px 10px; border-radius: var(--r-sm); background: var(--fg); color: var(--surface); font-size: .8rem; line-height: 1.3; white-space: nowrap; pointer-events: none; box-shadow: var(--shadow); }
.ct-tip b { font-family: var(--mono); }
.ct-nota { margin: 6px 0 0; font-size: .82rem; color: var(--muted); }
.ct-tabla summary { margin-top: 4px; font-size: .84rem; cursor: pointer; color: var(--accent-deep); }
.ct-tabla table { width: 100%; margin-top: 6px; border-collapse: collapse; font-size: .85rem; }
.ct-tabla th, .ct-tabla td { padding: 4px 6px; border-bottom: 1px solid var(--line); text-align: left; }
.ct-tabla td:last-child, .ct-tabla th:last-child { text-align: right; font-family: var(--mono); }
.ct-vacio { padding: 14px; border: 1.5px dashed var(--accent); border-radius: var(--r-md); }
.ct-vacio b { display: block; }
.ct-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 10px 0; }
.ct-fuentes { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 3px; font-size: .78rem; color: var(--muted); }
.ct-fuentes a { color: inherit; }
:root[data-theme="contrast"] .ct-avisos.hay { background: var(--surface); }
@media (forced-colors: active) { .ct-l, .ct-foco { stroke: Highlight; } .ct-p { fill: Highlight; } .ct-b { fill: Canvas; stroke: CanvasText; stroke-width: .5; } }
`;
let dlg = null, ctx = {};
const cu = () => dlg.querySelector("#ct-cuerpo");
function crear() {
  if (!document.getElementById("ct-css")) { const st = document.createElement("style"); st.id = "ct-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "constantes"; dlg.className = "ficha ct-dlg"; dlg.setAttribute("aria-labelledby", "ct-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="ct-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="ct-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="ct-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#ct-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
/** El resumen para el médico, en texto. */
export function textoMedico(S, c = {}) {
  const L = [`${tx("titulo")} · Pauta Activa`];
  for (const id of ["glucosa", "ta", "fc"]) {
    const P = puntos(id, S); if (!P.length) continue;
    const vs = P.map((p) => p.v);
    L.push(`- ${tx(id)}: ${nMed(P.length)} ${tx("desde", { d: fechaCorta(P[0].f) })}; ${Math.min(...vs)}–${Math.max(...vs)} ${UNIDAD[id]}; ${tx("ultimo", { v: `${vs[vs.length - 1]} ${UNIDAD[id]}` })}`);
  }
  const A = avisos(S, c);
  if (A.length) { L.push(`${tx("comentar")}:`); for (const a of A) L.push(`- ${tx(a.clave)}: ${a.n} (${a.fechas.slice(-4).map((f) => fechaCorta(new Date(f + "T12:00").getTime())).join(", ")})`); }
  return L.join("\n");
}
function pintar() {
  const S = series(ctx.diario), rel = ctx.relevantes || [], ids = ["glucosa", "ta", "fc"].filter((id) => rel.includes(id) || S[id].length);
  const A = avisos(S, ctx), hay = ids.some((id) => S[id].length);
  if (!hay) {
    cu().innerHTML = `<div class="ct-vacio"><b>${tx("vacio_t")}</b><p>${rel.length ? tx("vacio_x", { x: rel.map((id) => tx(id).toLowerCase()).join(", ") }) : tx("vacio_nada")}</p></div>`;
    return;
  }
  const graf = {};
  cu().innerHTML = `<p class="ct-intro">${tx("intro")}</p>
    <div class="ct-avisos${A.length ? " hay" : ""}"><b>${tx("comentar")}</b>${A.length ? `<ul>${A.map((a) => `<li class="${a.nivel}">${tx(a.clave)} <span class="ct-n">${a.n}</span> <small>(${a.fechas.slice(-3).map((f) => fechaCorta(new Date(f + "T12:00").getTime())).join(", ")})</small></li>`).join("")}</ul><small>${tx("comentar_x")}</small>` : `<small>${tx("nada")}</small>`}</div>
    ${ids.map((id) => {
      const g = grafica(id, S, ctx); graf[id] = g.pts;
      const P = puntos(id, S), m = fcMax(ctx.edad);
      const nota = id === "fc" ? (ctx.fcNoValida ? tx("fc_no") : m ? tx("max", { n: m }) : tx("fc_edad")) : id === "glucosa" && ctx.insulina ? tx("insulina") : "";
      return `<section class="ct-tarjeta" data-ct="${id}"><div class="ct-cab"><h3>${tx(id)} <small>${UNIDAD[id]}</small></h3><small>${P.length ? nMed(P.length) : ""}</small></div>
        ${id === "glucosa" && P.some((p) => p.s === 2) ? `<ul class="ct-ley"><li><i></i>${tx("antes")}</li><li class="s2"><i></i>${tx("despues")}</li></ul>` : ""}
        ${P.length ? `<div class="ct-graf">${g.svg}<div class="ct-tip" hidden></div></div>` : `<p class="ct-nota">${tx("vacio_t")}</p>`}
        ${nota ? `<p class="ct-nota">${nota}</p>` : ""}
        ${P.length ? `<details class="ct-tabla"><summary>${tx("tabla")}</summary><table><thead><tr><th scope="col">${tx("fecha")}</th>${id === "glucosa" ? `<th scope="col">${tx("antes")}</th><th scope="col">${tx("despues")}</th>` : `<th scope="col">${tx("valor")}</th>`}</tr></thead><tbody>${(id === "glucosa" ? S.glucosa.map((x) => `<tr><td>${fechaCorta(x.f)}</td><td>${x.antes ?? "–"}</td><td>${x.despues ?? "–"}</td></tr>`) : S[id].map((x) => `<tr><td>${fechaCorta(x.f)}</td><td>${x.v}</td></tr>`)).reverse().join("")}</tbody></table></details>` : ""}
      </section>`;
    }).join("")}
    <div class="ct-acciones"><button type="button" class="btn-sec sm" data-ct-copiar>${tx("copiar")}</button></div>
    <p class="pq-fuentes">${tx("fuentes")}:</p><ul class="ct-fuentes">${FUENTES.map((f) => `<li>${f.txt}${f.doi ? ` · <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : ""}</li>`).join("")}</ul>`;
  for (const id of ids) { const caja = cu().querySelector(`[data-ct="${id}"] .ct-graf`); if (caja) activar(caja, id, graf[id]); }
  cu().querySelector("[data-ct-copiar]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(textoMedico(S, ctx)); ctx.toast?.(tx("copiado"), { ms: 2500 }); } catch {} });
}
/** Abre «Mis constantes». c: { diario, edad, relevantes: ["glucosa","ta","fc"], fcNoValida, insulina, toast }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c;
  dlg.querySelector("#ct-cab-t").textContent = tx("titulo");
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
