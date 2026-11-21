/* Ejercicios animados paso a paso (mejora grande 7): el pictograma de cada ejercicio se mueve entre la postura de partida
   y la de llegada, con cómo se hace, versión más fácil y más difícil, errores frecuentes y, según su medicación, con qué
   tener cuidado. El movimiento empieza al abrir o al pulsar «Ver otra vez» (animación SVG, también en Safari) y, con
   «reducir movimiento», se ven las dos posturas quietas, una junto a otra. Se carga al abrir un ejercicio. */
import { t } from "./i18n.js?v=202611212349";

/* ---------- piezas (mismo trazo que pictos.js: figura gruesa, apoyos finos, movimiento en el color de acento) ---------- */
const prop = (d) => `<path class="prop" d="${d}"/>`;
const suelo = (x1 = 8, x2 = 88) => prop(`M${x1} 84H${x2}`);
const silla = (x) => prop(`M${x} 34v50M${x} 58h20v26M${x + 20} 58v26`);
const sillaBaja = prop("M28 24v60M28 52h30M30 52v32M56 52v32");

/* Cada ejercicio: fondo fijo, cabeza y figura en la postura de partida (a) y de llegada (b), con la misma estructura de trazos
   para que el navegador interpole; extras = otras piezas que se mueven (botella, mancuernas, banda); ritmo = cómo se alternan. */
const EJ = {
  silla: { fondo: suelo() + silla(14), cab: [[42, 24], [49, 17]], fig: ["M40 32l-10 24M30 56l20 0 0 28M30 56l18 2 2 26M40 38l16 6", "M48 24l-2 28M46 52l2 16 0 16M46 52l-2 16 2 16M48 32l16 6"], ritmo: "ida" },
  sentadilla: { fondo: suelo() + silla(14), cab: [[50, 12], [56, 22]], fig: ["M50 18l0 32M50 50l4 16-2 18M50 50l-2 16 2 18M50 26l18 4", "M54 28l-8 24M46 52l12 8-2 24M46 52l-4 12 4 20M52 36l22 2"], ritmo: "ida" },
  talones: { fondo: suelo() + prop("M22 40v44M16 40h12"), cab: [[50, 20], [50, 14]], fig: ["M50 26v34M50 36l-24 12M50 36l10 10M47 60v20l10 4M53 60v20l10 4", "M50 20v34M50 30l-24 12M50 30l10 10M47 54v20l10 10M53 54v20l10 10"], ritmo: "ida" },
  rodilla: { fondo: suelo() + sillaBaja, cab: [[40, 16], [40, 16]], fig: ["M40 22v30M40 52h18M58 52l2 30 6 0M58 52v30M40 32l12 10", "M40 22v30M40 52h18M58 52l22-6 6-2M58 52v30M40 32l12 10"], ritmo: "ida" },
  brazo: { fondo: suelo(), cab: [[48, 14], [48, 14]], fig: ["M48 20v32M48 52l-6 32M48 52l8 32M48 28l-8 16M48 28l8 14 2 14", "M48 20v32M48 52l-6 32M48 52l8 32M48 28l-8 16M48 28l8 14 2-12"], extras: [{ el: '<rect class="prop" x="55" width="7" height="11" rx="2"', attr: "y", v: [52, 22] }], ritmo: "ida" },
  puente: { fondo: suelo(), cab: [[14, 74], [14, 74]], fig: ["M20 70l24 6 18-18 2 26M62 58l-4 26M22 72l18 10", "M20 70l26-18 16 6 2 26M62 58l-4 26M22 72l18 10"], ritmo: "ida" },
  pared: { fondo: suelo() + prop("M80 8v76"), cab: [[62, 22], [70, 24]], fig: ["M58 30l-12 26-8 28M46 56l-4 28M58 32l10 2 10 2M60 36l8 4 10 0", "M66 32l-14 26-10 26M52 58l-6 26M66 34l6 8 6-6M68 38l4 8 6-6"], ritmo: "ida" },
  remo: { fondo: suelo() + prop("M84 12v72"), cab: [[32, 16], [32, 16]], fig: ["M32 22v30M32 52l-6 32M32 52l8 32M32 30l14 8 14 4M32 30l12 10 14 2", "M32 22v30M32 52l-6 32M32 52l8 32M32 30l-10 12 14 4M32 30l-6 14 12 2"], extras: [{ el: '<path class="prop banda" stroke-dasharray="3 3"', attr: "d", v: ["M60 42L84 40", "M38 46L84 40"] }], ritmo: "ida" },
  bisagra: { fondo: suelo(), cab: [[50, 12], [80, 36]], fig: ["M50 18L48 52l-4 32M48 52l6 32M50 26l2 20M50 26l-2 20", "M74 38L48 52l-4 32M48 52l6 32M62 46l2 20M62 46l-2 20"], ritmo: "ida" },
  hombro: { fondo: suelo(), cab: [[48, 20], [48, 20]], fig: ["M48 26v28M48 54l-6 30M48 54l6 30M48 32l-10 6v-10M48 32l10 6v-10", "M48 26v28M48 54l-6 30M48 54l6 30M48 32l-10-6v-14M48 32l10-6v-14"], extras: [{ el: '<rect class="prop" x="34" width="8" height="10" rx="2"', attr: "y", v: [18, 4] }, { el: '<rect class="prop" x="54" width="8" height="10" rx="2"', attr: "y", v: [18, 4] }], ritmo: "ida" },
  unpie: { fondo: suelo() + prop("M20 42v42M14 42h12"), cab: [[50, 14], [50, 14]], fig: ["M50 20v32M50 52v32M50 52l2 16 0 16M50 28l-26 14M50 28l10 12", "M50 20v32M50 52v32M50 52l12 10-2 14M50 28l-26 14M50 28l10 12"], ritmo: "aguanta" },
  giro: { fondo: suelo(), cab: [[50, 20], [46, 20]], fig: ["M48 26v28M48 54l-8 30M48 54l8 30M48 32l18-14M48 32l-18 2", "M48 26v28M48 54l-8 30M48 54l8 30M48 32l-18-14M48 32l18 2"], ritmo: "lento" },
  marcha: { fondo: suelo() + '<path class="mov" d="M14 40h12M10 50h12M14 60h10"/>', cab: [[50, 14], [50, 15]], fig: ["M50 20l-4 30M46 50l-12 16-4 18M46 50l12 16 8 18M50 28l12 12M50 28l-14 14", "M50 20l-4 30M46 50l10 16 6 18M46 50l-10 16-6 18M50 28l-12 12M50 28l14 14"], ritmo: "rapido" },
  bici: { fondo: suelo() + '<circle class="prop" cx="24" cy="70" r="12"/><circle class="prop" cx="72" cy="70" r="12"/>' + prop("M24 70l16-26h18l14 26M40 44l-6-8h-6M58 44v-6h8M44 70h12M52 70l4-10"), cab: [[52, 18], [52, 18]], fig: ["M52 24l-8 22 8 14 2 10M44 46l12 10M50 32l16 4", "M52 24l-8 22 12 4-4 12M44 46l6 16M50 32l16 4"], ritmo: "rapido" },
  estirar: { fondo: suelo(), cab: [[48, 20], [48, 20]], fig: ["M48 26v28M48 54l-7 30M48 54l7 30M48 32l-16 4M48 32l16 4", "M48 26v28M48 54l-7 30M48 54l7 30M48 32l-10-14M48 32l10-14"], ritmo: "aguanta" },
  respirar: { fondo: suelo(), cab: [[48, 20], [48, 19]], fig: ["M48 26v28M48 54l-7 30M48 54l7 30M48 34l-14 4M48 34l14 4", "M48 26v28M48 54l-7 30M48 54l7 30M48 34l-14-10M48 34l14-10"], ritmo: "respira" },
  talonpunta: { fondo: '<path class="prop" d="M48 6v84"/>', huellas: [22, 48, 74] },
};
/* Ritmos: valores de la animación (a = partida, b = llegada), tiempos clave y duración de cada vuelta. */
const RITMOS = {
  ida: { orden: "aba", t: "0;0.5;1", dur: 3.2, rep: 3 },
  lento: { orden: "aba", t: "0;0.5;1", dur: 5, rep: 2 },
  aguanta: { orden: "abba", t: "0;0.3;0.7;1", dur: 4.4, rep: 2 },
  rapido: { orden: "aba", t: "0;0.5;1", dur: 1.1, rep: 8 },
  respira: { orden: "aba", t: "0;0.4;1", dur: 5, rep: 2 },
};

/** Errores frecuentes por ejercicio (técnica general; lo personal va en «con su medicación»). */
const ERRORES = {
  silla: ["Impulsarse echando el tronco hacia atrás o tirando de los brazos.", "Dejarse caer al sentarse en lugar de bajar controlando.", "Dejar que las rodillas se vayan hacia dentro."],
  sentadilla: ["Levantar los talones del suelo.", "Juntar las rodillas hacia dentro al bajar o al subir.", "Redondear la espalda."],
  talones: ["Subir y bajar de golpe, sin controlar la bajada.", "Cargar todo el peso en el respaldo.", "Doblar las rodillas para subir."],
  rodilla: ["Separar la espalda del respaldo.", "Dar un golpe de pierna en lugar de un movimiento controlado.", "Aguantar la respiración arriba."],
  brazo: ["Balancear el tronco para subir el peso.", "Separar el codo del cuerpo.", "Bajar de golpe."],
  puente: ["Arquear la zona lumbar en lugar de apretar los glúteos.", "Apoyar los pies de puntillas o muy lejos.", "Subir de golpe."],
  pared: ["Doblar la cadera: el cuerpo va recto, como una tabla.", "Abrir los codos en cruz.", "Alejarse tanto de la pared que cueste mantener la línea."],
  remo: ["Encoger los hombros hacia las orejas.", "Tirar echando el tronco hacia atrás.", "Soltar la banda de golpe."],
  bisagra: ["Redondear la espalda.", "Doblar mucho las rodillas (se convierte en sentadilla).", "Forzar el cuello mirando al frente."],
  hombro: ["Arquear la zona lumbar al subir.", "Aguantar el aire.", "Bloquear los codos de golpe arriba."],
  unpie: ["Agarrarse con fuerza al apoyo en lugar de solo rozarlo.", "Mirar al suelo en lugar de a un punto fijo.", "Dejar caer la cadera del lado de la pierna levantada."],
  talonpunta: ["Ir deprisa.", "Mirarse los pies todo el rato.", "Alejarse del apoyo."],
  giro: ["Girar todo el cuerpo de golpe.", "Estirarse más allá de lo que permite el equilibrio.", "Cambiar de lado sin volver al centro."],
  marcha: ["Ir tan rápido que no pueda hablar.", "Caminar mirando al suelo con los hombros encogidos.", "Pararse de golpe al terminar."],
  bici: ["Sillín demasiado bajo: la rodilla queda muy doblada abajo.", "Tanta resistencia que haya que levantarse del sillín.", "Pedalear tan rápido que no pueda hablar."],
  estirar: ["Rebotar al estirar.", "Estirar hasta notar dolor.", "Aguantar la respiración."],
  respirar: ["Hacerlo deprisa.", "Subir los hombros al coger aire.", "Seguir de pie si nota mareo: siéntese."],
};
/** Mecanismos de su medicación que importan en cada ejercicio (orden de prioridad; se muestran los 2 primeros de su lista). */
const CUIDA = {
  silla: ["tension", "equilibrio", "tension_alta"], sentadilla: ["tension", "equilibrio", "tension_alta"],
  talones: ["equilibrio", "sangrado", "tension"], unpie: ["equilibrio", "sangrado", "tension"], talonpunta: ["equilibrio", "sangrado", "tension"], giro: ["equilibrio", "tension", "sangrado"],
  rodilla: ["tension_alta", "musculo", "tendon"], brazo: ["tension_alta", "musculo", "tendon"], hombro: ["tension_alta", "musculo", "tendon"], remo: ["tension_alta", "musculo", "tendon"], pared: ["tension_alta", "musculo", "tendon"],
  bisagra: ["tension_alta", "tension", "fuerza_hueso"], puente: ["tension", "tension_alta", "musculo"],
  marcha: ["pulso", "azucar", "acelera", "calor", "agua"], bici: ["pulso", "azucar", "acelera", "calor", "agua"],
  estirar: ["tension", "equilibrio"], respirar: ["tension", "equilibrio"],
};

const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.webdriver;
const SVG = (cuerpo, clase = "ej-svg") => `<svg class="${clase}" viewBox="0 0 96 96" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`;
const anim = (attr, vals, r, extra = "") => `<animate attributeName="${attr}" values="${vals.join(";")}" keyTimes="${r.t}" dur="${r.dur}s" repeatCount="${r.rep}" begin="indefinite" fill="freeze" calcMode="spline" keySplines="${r.t.split(";").slice(1).map(() => ".45 0 .55 1").join(";")}"${extra}/>`;
const secuencia = (r, a, b) => [...r.orden].map((k) => (k === "a" ? a : b));

/** Dibujo de un ejercicio en una postura (0 = partida, 1 = llegada). */
export function postura(id, i = 0) {
  const e = EJ[id]; if (!e) return "";
  if (e.huellas) return SVG(e.fondo + e.huellas.map((y) => `<ellipse class="fig" cx="48" cy="${y}" rx="6" ry="10"/><circle class="fig" cx="48" cy="${y - 12}" r="2"/>`).join(""));
  const [x, y] = e.cab[i];
  return SVG(e.fondo + (e.extras || []).map((x2) => `${x2.el} ${x2.attr}="${x2.v[i]}"/>`).join("") + `<circle class="fig" cx="${x}" cy="${y}" r="6"/><path class="fig" d="${e.fig[i]}"/>`);
}
/** Dibujo animado (las animaciones esperan a que se llame a `mover`). */
export function animado(id) {
  const e = EJ[id]; if (!e) return "";
  if (e.huellas) {
    const r = { t: "0;0.33;0.66;1", dur: 2.4, rep: 4 };
    return SVG(e.fondo + e.huellas.map((y, k) => { const op = [0.25, 0.25, 0.25, 0.25]; op[k + 1] = 1; return `<g opacity=".25">${anim("opacity", op, r).replace('calcMode="spline"', 'calcMode="discrete"').replace(/ keySplines="[^"]*"/, "")}<ellipse class="fig" cx="48" cy="${y}" rx="6" ry="10"/><circle class="fig" cx="48" cy="${y - 12}" r="2"/></g>`; }).join(""), "ej-svg grande");
  }
  const r = RITMOS[e.ritmo] || RITMOS.ida;
  const [a, b] = e.cab;
  const extras = (e.extras || []).map((x) => `${x.el} ${x.attr}="${x.v[0]}">${anim(x.attr, secuencia(r, x.v[0], x.v[1]), r)}${x.el.startsWith("<rect") ? "</rect>" : "</path>"}`).join("");
  return SVG(e.fondo + extras + `<circle class="fig" cx="${a[0]}" cy="${a[1]}" r="6">${anim("cx", secuencia(r, a[0], b[0]), r)}${anim("cy", secuencia(r, a[1], b[1]), r)}</circle><path class="fig" d="${e.fig[0]}">${anim("d", secuencia(r, e.fig[0], e.fig[1]), r)}</path>`, "ej-svg grande");
}
/** Arranca (o vuelve a arrancar) todas las animaciones de un dibujo a la vez. */
export function mover(svg) { if (!svg || quieto()) return; svg.querySelectorAll("animate").forEach((a) => { try { a.beginElement(); } catch {} }); }
export const IDS = Object.keys(EJ);
export const errores = (id) => ERRORES[id] || [];
export const cuidados = (id, presentes) => (CUIDA[id] || []).filter((m) => presentes.includes(m)).slice(0, 2);

const CSS = `
.ej-dlg h2 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 8px; font-size: 1.25rem; }
.ej-dlg h2 small { color: var(--accent-deep); font-family: var(--mono); font-size: .9rem; }
.ej-escena { display: grid; place-items: center; margin: 4px 0 8px; padding: 10px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--line); }
.ej-svg { display: block; width: 100%; max-width: 260px; height: auto; color: var(--fg); }
.ej-svg .fig { stroke: currentColor; stroke-width: 3.6; }
.ej-svg .prop { stroke: currentColor; stroke-width: 2.2; opacity: .5; }
.ej-svg .mov { stroke: var(--accent); stroke-width: 2.6; }
.ej-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.ej-dos figure { margin: 0; text-align: center; }
.ej-dos figcaption { margin-top: 2px; font-family: var(--mono); font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.ej-dos .ej-svg { max-width: 170px; margin: 0 auto; }
.ej-ctrl { display: flex; justify-content: center; margin: 0 0 6px; }
.ej-dlg .clave { color: var(--muted); font-style: italic; }
.ej-var { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 8px 0; }
.ej-var > div { padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); border: 1px solid var(--line); font-size: .92rem; }
.ej-var > div.elegida { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.ej-var b { display: block; margin-bottom: 2px; font-family: var(--mono); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.ej-errores { margin: 4px 0 0; padding-left: 1.2em; display: grid; gap: 4px; }
.ej-errores li::marker { color: var(--alerta); }
.ej-dlg .hoy-cuidados { margin-top: 6px; }
.ej-nota { margin: 12px 0 0; font-size: .82rem; color: var(--muted); }
:root[data-theme="contrast"] .ej-escena { background: var(--surface); }
@media (forced-colors: active) { .ej-svg .fig, .ej-svg .prop { stroke: CanvasText; } .ej-svg .mov { stroke: Highlight; } }
`;
let dlg = null;
function crear() {
  if (!document.getElementById("ej-css")) { const st = document.createElement("style"); st.id = "ej-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "ejercicio"; dlg.className = "ficha ej-dlg"; dlg.setAttribute("aria-labelledby", "ej-tit");
  dlg.innerHTML = `<div class="ficha-cab"><p>${t("ej.ver")}</p><button type="button" class="btn-sec sm" id="ej-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="ej-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#ej-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
/** Abre la ficha de un ejercicio. b: bloque de la sesión (nombre, min, detalle, clave, facil, dificil, pict); presentes: mecanismos de su lista; variante elegida. */
export function abrir(b, { presentes = [], variante = "normal" } = {}) {
  if (!dlg) crear();
  const id = b.pict, sinMov = quieto() || !EJ[id];
  const cuid = cuidados(id, presentes), err = errores(id);
  const escena = !EJ[id] ? "" : sinMov
    ? (EJ[id].huellas ? postura(id, 0) : `<div class="ej-dos"><figure>${postura(id, 0)}<figcaption>${t(EJ[id].ritmo === "rapido" ? "ej.lado1" : "ej.inicio")}</figcaption></figure><figure>${postura(id, 1)}<figcaption>${t(EJ[id].ritmo === "rapido" ? "ej.lado2" : "ej.final")}</figcaption></figure></div>`)
    : animado(id);
  dlg.querySelector("#ej-cuerpo").innerHTML = `
    <h2 id="ej-tit">${b.nombre}${b.min ? ` <small>${b.min}′</small>` : ""}</h2>
    ${escena ? `<div class="ej-escena" aria-hidden="true">${escena}</div>` : ""}
    ${escena && !sinMov ? `<div class="ej-ctrl"><button type="button" class="btn-sec sm" id="ej-otra">${t("ej.repetir")}</button></div>` : ""}
    <h3>${t("ej.como")}</h3>
    <p>${b.detalle}</p>${b.clave ? `<p class="clave">${t("ej.clave")}: ${b.clave}</p>` : ""}
    ${b.facil || b.dificil ? `<div class="ej-var">${b.facil ? `<div class="${variante === "facil" ? "elegida" : ""}"><b>${t("ej.facil")}</b>${b.facil}</div>` : ""}${b.dificil ? `<div class="${variante === "dificil" ? "elegida" : ""}"><b>${t("ej.dificil")}</b>${b.dificil}</div>` : ""}</div>` : ""}
    ${err.length ? `<h3>${t("ej.errores")}</h3><ul class="ej-errores">${err.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
    ${cuid.length ? `<h3>${t("ej.cuidado")}</h3><ul class="hoy-cuidados">${cuid.map((m) => `<li><span>${t("cuid." + m)}</span><button type="button" class="pq-mini" data-porque="${m}" aria-label="${t("pq.titulo")} ${t("pq.b." + m)}">${t("pq.titulo")}</button></li>`).join("")}</ul>` : ""}
    <p class="ej-nota">${t("ej.nota")}</p>`;
  const svg = dlg.querySelector(".ej-escena svg.grande");
  dlg.querySelector("#ej-otra")?.addEventListener("click", () => mover(svg));
  if (!dlg.open) dlg.showModal();
  dlg.querySelector("#ej-cuerpo").scrollTop = 0;
  requestAnimationFrame(() => mover(svg));
}
