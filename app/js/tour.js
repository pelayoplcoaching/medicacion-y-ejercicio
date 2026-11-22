/* Recorrido guiado sobre los elementos reales (primera visita o desde «¿Cómo funciona?»).
   Sale de app.js en la v1.3.0 (segunda tanda de mejoras grandes, 1): se carga al iniciarlo. */
import { t } from "./i18n.js?v=202611221848";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const TOUR = [
  { sel: "#panel-datos", clave: "datos" },
  { sel: "#buscar", clave: "buscar" },
  { sel: "#btn-anadir", clave: "anadir" },
  { sel: "#informe", clave: "informe", opcional: true },
  { sel: "#barra-inferior", clave: "barra", opcional: true },
  { sel: "#menu-mas", clave: "mas" },
];
/** Ilustración de cada paso del recorrido (assets/img); los pasos sin imagen la ocultan. */
const TOUR_IMG = { datos: "tour-datos", buscar: "tour-medicacion", anadir: "inicio-vacio", informe: "tour-informe", barra: "tour-plan" };
let tourI = -1, tourTimer = null, A = null;

/** a: { MOV, conTransicion } de la aplicación. */
export function iniciar(a) {
  if (!A) {
    $("#tour-sig").addEventListener("click", () => tourPaso(1));
    $("#guia-cerrar").addEventListener("click", cerrar);
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !$("#tour").hidden) cerrar(); });
    $("#tour-fondo").addEventListener("click", cerrar);
    window.addEventListener("resize", () => { if (!$("#tour").hidden && TOUR[tourI]) colocar($(TOUR[tourI].sel)); });
  }
  A = a;
  tourI = -1; $("#tour").hidden = false; document.documentElement.classList.remove("retorno"); tourPaso(1);
}
function tourPaso(dir) {
  const habia = tourI >= 0 && !$("#tour").hidden; // mejora 695: si ya había caja, se desliza al sitio nuevo
  let i = tourI + dir;
  while (TOUR[i] && TOUR[i].opcional && (!$(TOUR[i].sel) || $(TOUR[i].sel).hidden || (TOUR[i].sel === "#barra-inferior" && !matchMedia("(max-width: 959px)").matches))) i += dir;
  if (!TOUR[i]) return cerrar();
  tourI = i;
  const paso = TOUR[i], el = $(paso.sel);
  $$(".tour-foco").forEach((e) => e.classList.remove("tour-foco"));
  el.classList.add("tour-foco");
  el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const visibles = TOUR.filter((p) => !p.opcional || ($(p.sel) && !$(p.sel).hidden && (p.sel !== "#barra-inferior" || matchMedia("(max-width: 959px)").matches)));
  { const img = $("#tour-img"), f = TOUR_IMG[paso.clave]; img.hidden = !f; if (f) img.src = `assets/img/${f}.webp`; }
  $("#tour-paso").textContent = t("tour.paso", { n: visibles.indexOf(paso) + 1, t: visibles.length });
  $("#tour-titulo").textContent = t("tour." + paso.clave + ".t");
  $("#tour-texto").textContent = t("tour." + paso.clave + ".x");
  $("#tour-sig").textContent = visibles.indexOf(paso) === visibles.length - 1 ? t("tour.fin") : t("tour.sig");
  setTimeout(() => $("#tour-sig").focus({ preventScroll: true }), 50);
  const deslizar = habia && document.startViewTransition && A.MOV.ok();
  if (deslizar) $("#tour-flecha").hidden = true; else colocar(null);
  clearTimeout(tourTimer);
  tourTimer = setTimeout(() => (deslizar ? A.conTransicion("vt-tour", () => colocar(el)) : colocar(el)), matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 480); // tras el desplazamiento suave
}
/** Mejora 217: la caja del recorrido junto a lo que explica, con una flecha hacia ello. Sin sitio, se queda donde la pone el CSS. */
function colocar(el) {
  const caja = $(".tour-caja"), fl = $("#tour-flecha"); if (!caja || !fl) return;
  for (const p of ["left", "top", "right", "bottom", "transform"]) caja.style[p] = "";
  fl.hidden = true;
  if (!el || $("#tour").hidden) return;
  const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = innerHeight, m = 18;
  const entre = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
  const w = caja.offsetWidth, h = caja.offsetHeight;
  let x, y, lado;
  if (vw >= 960) {
    if (vw - r.right >= w + 2 * m) { x = r.right + m; y = entre(r.top, m, vh - h - m); lado = "izq"; }
    else if (r.left >= w + 2 * m) { x = r.left - w - m; y = entre(r.top, m, vh - h - m); lado = "der"; }
    else if (vh - r.bottom >= h + 2 * m) { y = r.bottom + m; x = entre(r.left, m, vw - w - m); lado = "arr"; }
    else if (r.top >= h + 2 * m) { y = r.top - h - m; x = entre(r.left, m, vw - w - m); lado = "aba"; }
  } else if (r.bottom > 0 && r.top < vh - h - 2 * m) { // móvil: la caja sigue abajo; la flecha apunta hacia arriba, a lo que explica
    const cr = caja.getBoundingClientRect(); x = cr.left; y = cr.top; lado = "arr";
  }
  if (!lado) return;
  if (vw >= 960) Object.assign(caja.style, { left: x + "px", top: y + "px", right: "auto", bottom: "auto", transform: "none" });
  const cr = caja.getBoundingClientRect();
  fl.className = "tour-flecha " + lado; fl.hidden = false;
  if (lado === "izq" || lado === "der") { fl.style.top = entre(r.top + Math.min(r.height, 80) / 2, cr.top + 20, cr.bottom - 20) - 8 + "px"; fl.style.left = (lado === "izq" ? cr.left : cr.right) - 8 + "px"; }
  else { fl.style.left = entre(r.left + Math.min(r.width, 160) / 2, cr.left + 24, cr.right - 24) - 8 + "px"; fl.style.top = (lado === "arr" ? cr.top : cr.bottom) - 8 + "px"; }
}
export function cerrar() { $$(".tour-foco").forEach((e) => e.classList.remove("tour-foco")); $("#tour").hidden = true; tourI = -1; colocar(null); try { localStorage.setItem("medex.guia", "1"); } catch {} }
