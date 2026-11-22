/* Semana activa (mejora grande 11): tres anillos (moverse, fuerza y equilibrio), racha amable y mapa de 12 semanas.
   Lógica pura (se prueba en scripts/test.mjs) y el HTML de «Mi plan» y «Hoy». Se carga al abrir esas pantallas,
   no al arrancar la aplicación. */
import { t, idioma } from "./i18n.js?v=202611221848";

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Lunes (00:00) de la semana de una fecha. */
export function lunesDe(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const FUERZA = new Set(["fuerza", "fuerza_eq"]), EQUILIBRIO = new Set(["equilibrio", "fuerza_eq"]);

/** Lo hecho en [desde, hasta): minutos, días con fuerza, días con equilibrio, sesiones y días con actividad. */
export function resumen(diario, desde, hasta) {
  const a = iso(desde), b = iso(hasta);
  const xs = diario.filter((x) => x.fecha >= a && x.fecha < b);
  const dias = (f) => new Set(xs.filter(f).map((x) => x.fecha)).size;
  return { min: xs.reduce((n, x) => n + (x.min || 0), 0), fuerza: dias((x) => FUERZA.has(x.tipo)), equilibrio: dias((x) => EQUILIBRIO.has(x.tipo)), sesiones: xs.length, dias: dias(() => true) };
}

/** Objetivos de la semana: minutos (OMS/ACSM: 150; en fragilidad se empieza por 90), días de fuerza (2) y de equilibrio
    (3 si hay riesgo de caídas o fragilidad, si no 2; lo mismo que la prescripción de informes.js). */
export function objetivos({ fragil = false, eq = 2 } = {}) { return { min: fragil ? 90 : 150, fuerza: 2, equilibrio: eq }; }

/** Racha amable: semanas seguidas con al menos una sesión. La semana en curso no la rompe y una semana vacía se perdona
    si la anterior tuvo actividad y no se ha perdonado otra en las 5 anteriores (comodín). Devuelve también cuántas de
    esas semanas cumplieron los minutos, si se usó el comodín y la mejor racha de los dos últimos años. */
export function rachaAmable(diario, objMin, ahora = new Date()) {
  const N = 104, sem = [];
  let ini = lunesDe(ahora);
  for (let i = 0; i < N; i++) { sem.push(resumen(diario, ini, masDias(ini, 7))); ini = masDias(ini, -7); }
  const desde = (i0, actual) => {
    let n = 0, cumplidas = 0, comodin = false, ultimoComodin = -99;
    for (let j = i0; j < N; j++) {
      const s = sem[j];
      if (s.sesiones > 0) { n++; if (s.min >= objMin) cumplidas++; continue; }
      if (actual && j === i0) continue; // la semana en curso aún no ha terminado
      if (j + 1 < N && sem[j + 1].sesiones > 0 && j - ultimoComodin > 5) { comodin = true; ultimoComodin = j; continue; }
      break;
    }
    return { n, cumplidas, comodin };
  };
  const ahoraR = desde(0, true);
  let mejor = ahoraR.n;
  for (let i = 1; i < N; i++) if (sem[i].sesiones > 0 && sem[i - 1].sesiones === 0) mejor = Math.max(mejor, desde(i, false).n);
  return { semanas: ahoraR.n, cumplidas: ahoraR.cumplidas, comodin: ahoraR.comodin, mejor, conDatos: diario.length > 0 };
}

/** Mapa de las últimas n semanas (lunes a domingo), la actual la última: minutos y tipos por día y si se cumplieron los minutos. */
export function mapaSemanas(diario, objMin, ahora = new Date(), n = 12) {
  const hoy = iso(ahora), porDia = new Map();
  for (const x of diario) { const d = porDia.get(x.fecha) || { min: 0, tipos: new Set() }; d.min += x.min || 0; if (x.tipo) d.tipos.add(x.tipo); porDia.set(x.fecha, d); }
  const l0 = masDias(lunesDe(ahora), -7 * (n - 1));
  return [...Array(n)].map((_, w) => {
    const lunes = masDias(l0, 7 * w);
    const dias = [...Array(7)].map((_, k) => { const i = iso(masDias(lunes, k)); const x = porDia.get(i); return { iso: i, min: x?.min || 0, tipos: x ? [...x.tipos] : [], futuro: i > hoy, hoy: i === hoy }; });
    const min = dias.reduce((s, d) => s + d.min, 0);
    return { lunes: iso(lunes), dias, min, cumplida: min >= objMin, actual: w === n - 1 };
  });
}
/** Intensidad de color de un día por sus minutos: 0, 1–19, 20–39, 40 o más. */
export const nivelDia = (min) => (min <= 0 ? 0 : min < 20 ? 1 : min < 40 ? 2 : 3);

/* ---------- HTML ---------- */
const R = [52, 40, 28];
const CIRC = R.map((r) => 2 * Math.PI * r);
const OK = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6 11-11-1.4-1.4z"/></svg>';

const filasAnillos = (r, o) => [
  { k: "a1", nombre: t("sem.moverse"), v: r.min, obj: o.min, ud: t("sem.ud_min") },
  { k: "a2", nombre: t("sem.fuerza"), v: r.fuerza, obj: o.fuerza, ud: t("sem.ud_dias") },
  { k: "a3", nombre: t("sem.equilibrio"), v: r.equilibrio, obj: o.equilibrio, ud: t("sem.ud_dias") },
];
/** Tres anillos concéntricos (fuera, moverse; en medio, fuerza; dentro, equilibrio). r = resumen de la semana, o = objetivos. */
export function htmlAnillos(r, o) {
  const filas = filasAnillos(r, o);
  const todos = filas.every((f) => f.v >= f.obj);
  const aria = t("sem.aria", { m: r.min, om: o.min, f: r.fuerza, of: o.fuerza, e: r.equilibrio, oe: o.equilibrio });
  return `<svg class="anillos${todos ? " completos" : ""}" viewBox="0 0 120 120" role="img" aria-label="${aria}">${filas.map((f, i) => {
    const p = Math.min(1, f.obj ? f.v / f.obj : 0), c = CIRC[i];
    return `<circle class="pista ${f.k}" cx="60" cy="60" r="${R[i]}"/><circle class="v ${f.k}${p >= 1 ? " ok" : ""}" cx="60" cy="60" r="${R[i]}" transform="rotate(-90 60 60)" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" style="--d:${(c * p).toFixed(1)};--c:${c.toFixed(1)}"/>`;
  }).join("")}${todos ? `<path class="todo-ok" d="M50 61l7 7 14-15"/>` : ""}</svg>`;
}
/** Leyenda de los anillos: nombre, valor y objetivo; marca cuando se cumple. */
export function htmlLeyenda(r, o) {
  return `<ul class="anillos-ley">${filasAnillos(r, o).map((f) => `<li class="${f.k}${f.v >= f.obj ? " ok" : ""}"><i aria-hidden="true"></i><span>${f.nombre}</span><b>${f.v}<small>/${f.obj} ${f.ud}</small></b>${f.v >= f.obj ? OK : ""}</li>`).join("")}</ul>`;
}

/** Racha amable en dos líneas (HTML): la cifra y, debajo, los detalles. */
export function textoRacha(r) {
  if (!r.semanas) return `<b>${r.conDatos ? t("sem.racha_nueva") : t("sem.racha0")}</b>`;
  const det = [];
  if (r.cumplidas) det.push(t("sem.racha_cumple", { c: r.cumplidas }));
  if (r.mejor > r.semanas) det.push(t("sem.racha_mejor", { m: r.mejor }));
  else if (r.semanas >= 2) det.push(t("sem.racha_record"));
  if (r.comodin) det.push(t("sem.racha_comodin"));
  return `<b>${t(r.semanas === 1 ? "sem.racha1" : "sem.racha", { n: r.semanas })}</b>${det.length ? `<small>${det.join(" · ")}</small>` : ""}`;
}

/** Mapa de 12 semanas: columnas = semanas, filas = días (lunes arriba); debajo, la marca de las semanas cumplidas. */
export function htmlMapa(semanas) {
  const lang = idioma();
  const fDia = (i) => new Date(i + "T12:00").toLocaleDateString(lang, { weekday: "short", day: "numeric", month: "short" });
  const activos = semanas.reduce((n, s) => n + s.dias.filter((d) => d.min > 0).length, 0), cumplidas = semanas.filter((s) => s.cumplida).length;
  const iniciales = [...Array(7)].map((_, k) => new Date(2024, 0, 1 + k).toLocaleDateString(lang, { weekday: "narrow" }));
  let mesAnt = "";
  const meses = semanas.map((s) => { const m = new Date(s.lunes + "T12:00").toLocaleDateString(lang, { month: "short" }).replace(".", ""); const txt = m !== mesAnt ? m : ""; mesAnt = m; return `<span>${txt}</span>`; }).join("");
  const celdas = semanas.map((s, w) => s.dias.map((d) => {
    const tit = d.futuro ? "" : d.min ? t("sem.dia", { f: fDia(d.iso), m: d.min }) : t("sem.dia0", { f: fDia(d.iso) });
    return `<i class="d${nivelDia(d.min)}${d.hoy ? " d-hoy" : ""}${d.futuro ? " d-fut" : ""}" style="--c:${w}"${tit ? ` title="${tit}" data-t="${tit}"` : ""}></i>`;
  }).join("")).join("");
  const marcas = semanas.map((s) => `<span class="${s.cumplida ? "w-ok" : ""}${s.actual ? " w-ahora" : ""}">${s.cumplida ? OK : ""}</span>`).join("");
  return `<div class="mapa12" role="img" aria-label="${t("sem.mapa_aria", { d: activos, s: cumplidas })}">
    <div class="m12-meses" aria-hidden="true">${meses}</div>
    <div class="m12-dias" aria-hidden="true">${iniciales.map((x, k) => `<span>${k % 2 === 0 ? x : ""}</span>`).join("")}</div>
    <div class="m12-rejilla">${celdas}</div>
    <div class="m12-obj" aria-hidden="true">${marcas}</div>
  </div>
  <p class="m12-pie"><span class="m12-ley" aria-hidden="true">${t("sem.menos")} <i class="d0"></i><i class="d1"></i><i class="d2"></i><i class="d3"></i> ${t("sem.mas")}</span><span class="m12-ley-ok" aria-hidden="true">${OK} ${t("sem.cumplida")}</span></p>
  <p class="m12-dato" aria-live="polite">${t("sem.toque")}</p>`;
}

/** Al tocar un día del mapa, su resumen debajo. */
export function activarMapa(raiz) {
  const dato = raiz.querySelector(".m12-dato");
  raiz.querySelector(".m12-rejilla")?.addEventListener("click", (ev) => {
    const c = ev.target.closest("i[data-t]"); if (!c || !dato) return;
    raiz.querySelectorAll(".m12-rejilla i.d-sel").forEach((x) => x.classList.remove("d-sel"));
    c.classList.add("d-sel"); dato.textContent = c.dataset.t;
  });
}
