import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL, MOMENTOS, MOMENTO_TXT, HORA_MOMENTO, momentosPorDefecto, ventanaEntrenamiento, loEsencial, ALARMA, sintomasPosibles, SINTOMAS, sesionTipo, objetivoSemanal, rachaSemanas, progresion, planSemana, minutosPorSemana, compararListas, constantesRelevantes, chequeoPrevio, veredictoChequeo, SINTOMAS_ACSM, enfermedadSugerida, cribadoACSM, CRIBADO_TXT, nivelEvidencia, EVIDENCIA, seccionFT, comprobarCaso } from "./engine.js?v=202610151439";
import { APP_VERSION } from "./version.js?v=202610151439";
import { extraerMedicacion, textoDePdf } from "./parser.js?v=202610151439";
import { pdfMedico, pdfPaciente, textoHistoria, prescripcion } from "./informes.js?v=202610151439";
import { cargarScript } from "./libs.js?v=202610151439";
import { textoDeImagen, textoDePdfEscaneado } from "./ocr.js?v=202610151439";
import { t, aplicarIdioma, detectarIdioma, idioma } from "./i18n.js?v=202610151439";

// Si la hoja de estilos aún no ha llegado (los módulos se precargan en paralelo), esperar: así la primera maquetación ya es la definitiva y no hay saltos.
await new Promise((ok) => { const l = document.querySelector('link[rel="stylesheet"]'); if (!l || l.sheet) ok(); else { l.addEventListener("load", ok, { once: true }); l.addEventListener("error", ok, { once: true }); setTimeout(ok, 4000); } });

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/** Medicación que entra en el informe (los fármacos "pausados" se quedan en la lista pero no cuentan). */
const medsActivos = () => estado.meds.filter((m) => !m.pausado && !m.libre);
const medsLibres = () => estado.meds.filter((m) => m.libre);

/* ---------- avisos breves (toast) con acción opcional ---------- */
let toastTimer = null;
function toast(msg, { accion, onAccion, ms = 6000 } = {}) {
  const el = $("#toast");
  el.innerHTML = `<span>${msg}</span>${accion ? `<button type="button" class="btn-sec sm">${accion}</button>` : ""}`;
  el.hidden = false;
  el.classList.add("visible");
  if (accion) el.querySelector("button").addEventListener("click", () => { onAccion?.(); ocultarToast(); });
  clearTimeout(toastTimer); toastTimer = setTimeout(ocultarToast, ms);
}
function ocultarToast() { const el = $("#toast"); el.classList.remove("visible"); setTimeout(() => { el.hidden = true; }, 250); }

/* ---------- iconos (trazos propios, 24×24) ---------- */
const ICONS = {
  buscar: "M10.5 3a7.5 7.5 0 1 0 4.7 13.4l4.2 4.2 1.4-1.4-4.2-4.2A7.5 7.5 0 0 0 10.5 3zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z",
  foto: "M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9zm3 5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  pdf: "M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm7 1.5V9h5.5L13 3.5zM8 13h2.2a1.8 1.8 0 0 1 0 3.6H9.4V18H8v-5zm1.4 1.2v1.3h.8a.65.65 0 0 0 0-1.3h-.8zM12 13h1.8c1.6 0 2.5 1 2.5 2.5S15.4 18 13.8 18H12v-5zm1.4 1.2v2.6h.4c.8 0 1.1-.5 1.1-1.3s-.3-1.3-1.1-1.3h-.4zM17 13h3v1.2h-1.6v.9H20v1.2h-1.6V18H17v-5z",
  pegar: "M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9zm0 2h6v2H9V4zM6 6h1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2h1v14H6V6zm2 5h8v1.6H8V11zm0 3.2h8v1.6H8v-1.6z",
  ejemplo: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3h2v2h-2V7zm0 4h2v6h-2v-6z",
  vaciar: "M9 3h6l1 2h4v2H4V5h4l1-2zM6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8zm2.1 2 .8 10h6.2l.8-10H8.1z",
  compartir: "M18 16a3 3 0 0 0-2.4 1.2l-7-3.5a3 3 0 0 0 0-3.4l7-3.5A3 3 0 1 0 15 5c0 .2 0 .4.1.6l-7 3.5a3 3 0 1 0 0 5.8l7 3.5c-.1.2-.1.4-.1.6a3 3 0 1 0 3-3z",
  correo: "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5-8-5zM4.9 7l7.1 4.4L19.1 7H4.9z",
  calendario: "M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zm12 7H5v10h14V9zM7 11h3v3H7v-3zm4 0h3v3h-3v-3zm4 0h2v3h-2v-3z",
  escuchar: "M4 9v6h4l5 4V5L8 9H4zm11.5 3a3.5 3.5 0 0 0-2-3.2v6.4a3.5 3.5 0 0 0 2-3.2zm-2-7.3v2.1a5.5 5.5 0 0 1 0 10.4v2.1a7.5 7.5 0 0 0 0-14.6z",
  parar: "M6 6h12v12H6z",
  instalar: "M12 3v10.2l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4 3.6 3.6V3h2zM4 19h16v2H4v-2z",
  tema: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 2v14a7 7 0 0 1 0-14z",
  editar: "M3 17.3V21h3.7L17.8 9.9l-3.7-3.7L3 17.3zm17.7-10.2a1 1 0 0 0 0-1.4l-2.4-2.4a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7 1.9-1.7z",
  pausa: "M7 5h4v14H7V5zm6 0h4v14h-4V5z",
  reanudar: "M8 5v14l11-7L8 5z",
  caja: "M4 7l8-4 8 4v10l-8 4-8-4V7zm2 1.2v7.6l5 2.5v-7.6l-5-2.5zm12 0-5 2.5v7.6l5-2.5V8.2zM12 5.2 7.6 7.4 12 9.6l4.4-2.2L12 5.2z",
  mic: "M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm-7 9h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.9V20h3v2H8v-2h3v-2.1A7 7 0 0 1 5 11z",
  qr: "M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h3v3h-3v-3zm5 0h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3z",
  general: "M9 2h6a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2-2zm0 2v2h6V4H9zM5 6v14h14V6h-2v2H7V6H5zm2.5 6.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6-3.5-3.5z",
  aerobico: "M13.5 2 8 12h4l-1.5 10L18 11h-4l-.5-9z",
  fuerza: "M2 10h2V8h2v8H4v-2H2v-4zm18 0h2v4h-2v2h-2V8h2v2zM7 11h10v2H7v-2z",
  equilibrio: "M12 2 9.5 4.5 11 6v2.4L4 11l1 2 7-2.3L19 13l1-2-7-2.6V6l1.5-1.5L12 2zm-1 9.6v9h2v-9h-2z",
  cuando: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3h2v5.6l3.5 2.1-1 1.7L11 13V7z",
  interacciones: "M8 11a4 4 0 0 1 4-4h2V5h-2a6 6 0 0 0 0 12h2v-2h-2a4 4 0 0 1-4-4zm8-6h-2v2h2a4 4 0 0 1 0 8h-2v2h2a6 6 0 0 0 0-12zm-7 5h6v2H9v-2z",
  guardar: "M4 3h12l4 4v14H4V3zm2 2v4h8V5H6zm1 8v6h10v-6H7z",
  abrir: "M4 4h16v6h-2V6H6v12h5v2H4V4zm10 8h6v6h-2v-2.6l-4.3 4.3-1.4-1.4L16.6 14H14v-2z",
  plan: "M4 5h16v3H4V5zm0 5h4v9H4v-9zm6 0h4v9h-4v-9zm6 0h4v9h-4v-9z",
  paseo: "M13 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-3 5.5 2.4-1.2L14 10l2.5 2-1.1 1.4-2-1.6-.7 2.6 2.3 2.5-1.2 4.6-1.9-.5 1-3.8-2.3-2.3-1.5 3.6-1.8-.8 2.1-5 1.6-3.7z",
  whatsapp: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-3 4.3c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.6 2.6 1 3.2.8 3.7.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5L9.9 8.7c-.2-.4-.4-.4-.6-.4H9z",
};
const icono = (n, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[n]}"/></svg>`;

/* ---------- pictogramas de ejercicios (figuras de trazo, 48×48) ---------- */
const CAB = (x, y) => `<circle cx="${x}" cy="${y}" r="4"/>`;
const PICTOS = {
  silla: `${CAB(20, 9)}<path d="M20 13v12l-6 10M20 25l7 9M20 16l8 3M31 20v16h8M31 30h8M35 20v16"/>`,
  talones: `${CAB(24, 8)}<path d="M24 12v16M24 28l-4 8M24 28l4 8M20 36l-2-2M28 36l2-2M24 17l8-3M24 17l-8-3M8 14v22M8 14h8"/>`,
  rodilla: `${CAB(16, 9)}<path d="M16 13v13h12M28 26l12-2M16 26l-2 10M12 8v30M12 20h4"/>`,
  brazo: `${CAB(24, 8)}<path d="M24 12v16M24 28l-5 10M24 28l5 10M24 16l-6 6 6 2M24 16l6 6-6 2M30 22v6"/><rect x="28" y="19" width="4" height="7" rx="1"/>`,
  puente: `${CAB(8, 30)}<path d="M12 30l10-8 10 6 6-10M32 28l4 8M8 36h32"/>`,
  sentadilla: `${CAB(24, 8)}<path d="M24 12v8l-6 6 2 10M24 20l6 6-2 10M24 14l-10 2M24 14l10 2M16 36h4M28 36h4"/>`,
  pared: `${CAB(18, 10)}<path d="M18 14l6 12 6 10M24 26l-8 10M18 16l10-2M28 14l6-2M36 6v36"/>`,
  remo: `${CAB(24, 8)}<path d="M24 12v16M24 28l-5 10M24 28l5 10M24 17l-8 5M24 17l8 5M16 22h-6M32 22h6M8 20v4M40 20v4"/>`,
  bisagra: `${CAB(14, 14)}<path d="M18 16l10 6 4 14M32 36l-2-6M28 22l-8 8M20 30l-2 4M24 24h8"/>`,
  hombro: `${CAB(24, 8)}<path d="M24 12v16M24 28l-5 10M24 28l5 10M24 15l-8-5V4M24 15l8-5V4M14 4h4M30 4h4"/>`,
  unpie: `${CAB(24, 8)}<path d="M24 12v16M24 28l-2 10M24 28l8-2 2-8M24 16l-8 2M24 16l8 2M38 12v26"/>`,
  talonpunta: `<path d="M24 6c3 0 4 3 4 6s-1 6-4 6-4-3-4-6 1-6 4-6zM24 20c3 0 4 3 4 6s-1 6-4 6-4-3-4-6 1-6 4-6zM24 34c3 0 4 3 4 6s-1 6-4 6-4-3-4-6 1-6 4-6z"/>`,
  giro: `${CAB(24, 8)}<path d="M24 12v16M24 28l-5 10M24 28l5 10M24 16l-8 4M24 16l8 4M8 22a16 16 0 0 1 32 0M36 18l4 4-4 4"/>`,
  marcha: `${CAB(26, 8)}<path d="M26 12l-2 14-6 12M24 26l8 8M24 16l-8 8M24 16l8 4 2 6"/>`,
  bici: `<circle cx="12" cy="34" r="8"/><circle cx="36" cy="34" r="8"/><path d="M12 34l8-14h10l6 14M20 20l-4-6h-4M30 20l-2-8h4M22 34h8"/>${CAB(32, 8)}`,
  estirar: `${CAB(24, 10)}<path d="M24 14v14M24 28l-5 10M24 28l5 10M24 18l-8-10M24 18l8-10"/>`,
};
const picto = (id) => PICTOS[id] ? `<svg class="picto" viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${PICTOS[id]}</svg>` : "";

/* ---------- iconos por grupo terapéutico (según el código ATC de la clase) ---------- */
const GRUPO_ICONS = {
  corazon: "M12 21s-7.5-4.6-9.5-9.3C1.2 8.5 3.3 5 6.8 5c2 0 3.4 1.1 4.2 2.4C12.3 6.1 13.8 5 15.8 5c3.5 0 5.6 3.5 4.3 6.7C18 16.4 12 21 12 21z",
  sangre: "M12 2.5s6.5 7 6.5 12a6.5 6.5 0 0 1-13 0c0-5 6.5-12 6.5-12zm0 3.3C10.3 8 7.5 11.8 7.5 14.5a4.5 4.5 0 0 0 9 0c0-2.7-2.8-6.5-4.5-8.7z",
  azucar: "M4 8l8-4 8 4v9l-8 4-8-4V8zm2 1.3v6.5l5 2.5v-6.5L6 9.3zm12 0-5 2.5v6.5l5-2.5V9.3zM12 6.2 7.6 8.4 12 10.6l4.4-2.2L12 6.2z",
  cerebro: "M9 3a4 4 0 0 0-4 4 3.5 3.5 0 0 0-1 6.3A3.5 3.5 0 0 0 7 19h1a3 3 0 0 0 4-2.8V5.5A3 3 0 0 0 9 3zm6 0a3 3 0 0 0-3 2.5v10.7A3 3 0 0 0 16 19h1a3.5 3.5 0 0 0 3-5.7A3.5 3.5 0 0 0 19 7a4 4 0 0 0-4-4z",
  pulmon: "M11 3h2v8.5l2.6-2.6A4.5 4.5 0 0 1 22 12v6a3 3 0 0 1-3 3h-2a4 4 0 0 1-4-4v-6l-1-1-1 1v6a4 4 0 0 1-4 4H5a3 3 0 0 1-3-3v-6a4.5 4.5 0 0 1 6.4-3.1L11 11.5V3z",
  hueso: "M6.5 3a2.5 2.5 0 0 1 2.4 1.8l6.3 6.3A2.5 2.5 0 1 1 21 14.5a2.5 2.5 0 0 1-3.5 2.3 2.5 2.5 0 0 1-2.3 3.5A2.5 2.5 0 0 1 12.7 18l-6.3-6.3A2.5 2.5 0 1 1 3 7.5a2.5 2.5 0 0 1 3.5-2.3V3z",
  hormona: "M9 2h6v2h-1v5.2l5.4 9.3A2 2 0 0 1 17.7 22H6.3a2 2 0 0 1-1.7-3.5L10 9.2V4H9V2zm3 9-3.6 6h7.2L12 11z",
  escudo: "M12 2l8 3v6c0 5-3.4 8.8-8 11-4.6-2.2-8-6-8-11V5l8-3zm0 2.2L6 6.5V11c0 3.9 2.5 7 6 8.9 3.5-1.9 6-5 6-8.9V6.5l-6-2.3z",
  ojo: "M12 5c5 0 9 3.5 11 7-2 3.5-6 7-11 7S3 15.5 1 12c2-3.5 6-7 11-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  pastilla: "M8.5 2.5a6 6 0 0 1 4.2 1.8l7 7a6 6 0 1 1-8.5 8.5l-7-7A6 6 0 0 1 8.5 2.5zm0 2a4 4 0 0 0-2.8 6.8l3.2 3.2 5.7-5.7-3.2-3.2A4 4 0 0 0 8.5 4.5z",
  rinon: "M8 3c3 0 5 2.5 5 6v6c0 3.5-2 6-5 6s-5-2.5-5-6V9c0-3.5 2-6 5-6zm8 0c3 0 5 2.5 5 6v6c0 3.5-2 6-5 6a4.6 4.6 0 0 1-3-1.1V4.1A4.6 4.6 0 0 1 16 3z",
};
/** Grupo (icono) de una clase por su código ATC o su identificador. */
function grupoClase(clase) {
  const atc = (clase.atc || [])[0] || "";
  const id = clase.id || "";
  if (/^A10/.test(atc) || /insulina|sulfonil|metformina|sglt2|glp1|dpp4|pioglit|antidiabet/.test(id)) return "azucar";
  if (/^B0?1/.test(atc) || /anticoag|antiagreg|heparina/.test(id)) return "sangre";
  if (/^C/.test(atc)) return "corazon";
  if (/^R/.test(atc) || /broncod|respirat|oxigeno/.test(id)) return "pulmon";
  if (/^N/.test(atc) || /benzo|hipnot|antidepres|antipsic|antiepilep|opioid|levodopa|litio|melatonina/.test(id)) return "cerebro";
  if (/^M/.test(atc) || /aines|bifosfon|osteop|relajantes|colchicina|alopurinol/.test(id)) return "hueso";
  if (/^H|^G03|^L02/.test(atc) || /corticoid|tiroid|hormon|testosterona/.test(id)) return "hormona";
  if (/^J|^P|^L0?[134]/.test(atc) || /antibiot|macrolid|fluoroquin|antifung|antirretro|inmuno|biolog|farme|quimio|hidroxicloro/.test(id)) return "escudo";
  if (/^S/.test(atc) || /colirio/.test(id)) return "ojo";
  if (/^G04|^G0?2/.test(atc) || /urinari|urolog|pde5|desmopres/.test(id)) return "rinon";
  return "pastilla";
}
const iconoGrupo = (clase) => `<svg class="ic-grupo g-${grupoClase(clase)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${GRUPO_ICONS[grupoClase(clase)]}"/></svg>`;
function ponerIconos() {
  const mapa = { "btn-caja": "caja", "btn-dictar": "mic", "btn-foto": "foto", "btn-pdf": "pdf", "btn-pegar": "pegar", "btn-ejemplo": "ejemplo", "btn-vaciar": "vaciar", "btn-enlace": "compartir", "btn-whatsapp": "whatsapp", "btn-email": "correo", "btn-calendario": "calendario", "btn-instalar": "instalar", "btn-pdf-medico": "pdf", "btn-pdf-paciente": "pdf" };
  for (const [id, n] of Object.entries(mapa)) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
  for (const b of $$(".tabs [role=tab]")) if (!b.querySelector("svg") && ICONS[b.dataset.tab]) b.insertAdjacentHTML("afterbegin", icono(b.dataset.tab));
  for (const [id, n] of Object.entries({ "btn-qr": "qr", "btn-exportar": "guardar", "btn-importar-listas": "abrir" })) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
}

// Idioma de la interfaz (la base de conocimiento sigue en español)
aplicarIdioma(detectarIdioma());
ponerIconos(); // antes de la primera pintura: evita que los botones cambien de tamaño al cargar
$("#idioma").value = idioma();
$("#idioma").addEventListener("change", (e) => { aplicarIdioma(e.target.value); aplicarModo(); if (datos) { renderVersion(); render(); } });

const estado = { meds: [], edad: null, caidas: false, condiciones: [], modo: "paciente", pac: {}, pro: {}, horas: { ...HORA_MOMENTO }, tab: "general", plan: { dias: [1, 2, 3, 4, 5, 6] }, cribado: { regular: null, enfermedad: null, sintomas: [] }, prescrito: null };
const sanearCribado = (c) => ({ regular: c?.regular === true ? true : c?.regular === false ? false : null, enfermedad: c?.enfermedad === true ? true : c?.enfermedad === false ? false : null, sintomas: Array.isArray(c?.sintomas) ? c.sintomas.filter((x) => SINTOMAS_ACSM.some((y) => y.id === x)) : [] });
const sanearPrescrito = (p) => (p && Number.isFinite(Number(p.fecha)) ? { fecha: Number(p.fecha), semanas: [4, 6, 8, 12].includes(Number(p.semanas)) ? Number(p.semanas) : 6 } : null);
/** Plan semanal vigente (día 0–6 → tipo), según los días elegidos por el usuario. */
const planActual = () => planSemana(estado.plan?.dias);
const sanearPlan = (p) => ({ dias: Array.isArray(p?.dias) && p.dias.length ? [...new Set(p.dias.map(Number).filter((d) => d >= 0 && d <= 6))] : [1, 2, 3, 4, 5, 6] });
/** Vibración breve en móviles que la admiten (marcar un bloque, terminar); nunca en escritorio. */
const vibrar = (ms = 12) => { try { if (navigator.vibrate && matchMedia("(pointer: coarse)").matches) navigator.vibrate(ms); } catch {} };
const CONDICIONES = ["diabetes", "insuficiencia_cardiaca", "renal", "marcapasos", "osteoporosis", "epoc_asma", "oxigeno", "embarazo"];
const PAC = ["silla", "caminar", "ayuda"];
const PRO = ["fg", "fevi", "nyha", "sppb", "vivifrail", "dai"];

/** Contexto para el motor: condiciones marcadas + las derivadas de los datos numéricos o de las preguntas sencillas. */
function ctxActual() {
  const cond = new Set(estado.condiciones);
  const p = estado.modo === "profesional" ? estado.pro : {};
  const q = estado.modo === "paciente" ? estado.pac : {};
  if (p.fg != null) { if (p.fg < 45) cond.add("renal"); if (p.fg < 30) cond.add("renal_grave"); }
  if (p.nyha != null && p.nyha >= 3) { cond.add("nyha34"); cond.add("insuficiencia_cardiaca"); }
  if (p.fevi != null && p.fevi < 40) { cond.add("fevi_baja"); cond.add("insuficiencia_cardiaca"); }
  if (p.dai != null) cond.add("marcapasos");
  // fragilidad: SPPB > Vivifrail > preguntas del paciente
  let frag = null;
  if (p.sppb != null) frag = p.sppb <= 6 ? "fragil" : p.sppb <= 9 ? "prefragil" : "robusto";
  else if (p.vivifrail) frag = p.vivifrail === "A" || p.vivifrail === "B" ? "fragil" : p.vivifrail === "C" ? "prefragil" : "robusto";
  else {
    const malas = (q.silla ? 1 : 0) + (q.caminar ? 1 : 0) + (q.ayuda ? 1 : 0);
    if (malas) frag = malas >= 2 ? "fragil" : "prefragil"; // sin marcas no se infiere nada
  }
  if (frag && frag !== "robusto") cond.add(frag);
  return { edad: estado.edad, caidas: estado.caidas, condiciones: cond, fragilidad: frag, daiFc: p.dai ?? null, fg: p.fg ?? null, fevi: p.fevi ?? null, nyha: p.nyha ?? null, modo: estado.modo };
}
let datos, indice;

const EJEMPLO = {
  edad: 72, caidas: true,
  meds: [
    { pid: "bisoprolol", dosis: 5, tomas: 1 },
    { pid: "enalapril", dosis: 20, tomas: 1 },
    { pid: "furosemida", dosis: 40, tomas: 1 },
    { pid: "apixaban", dosis: 5, tomas: 2 },
    { pid: "atorvastatina", dosis: 40, tomas: 1 },
    { pid: "metformina", dosis: 850, tomas: 2 },
    { pid: "gliclazida", dosis: 60, tomas: 1 },
    { pid: "lorazepam", dosis: 1, tomas: 1 },
    { pid: "omeprazol", dosis: 20, tomas: 1 },
    { pid: "ibuprofeno", dosis: 600, tomas: 2 },
  ],
};

function renderVersion() {
  $("#kb-version").textContent = `v${APP_VERSION} · ` + t("kb.version", { v: datos.kb.version, c: datos.kb.clases.length, p: indice.porId.size });
}

const cargarJson = (f) => fetch(`data/${f}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
async function cargar() {
  $("#kb-version").textContent = "Cargando la base de conocimiento…";
  // Fase 1: lo imprescindible (base de conocimiento e interacciones revisadas, ~400 KB) → la app ya responde
  const [kb, ddiCurado] = await Promise.all([cargarJson("kb.json"), cargarJson("ddi_curated.json")]);
  if (!kb) { $("#kb-version").textContent = t("kb.error"); $("#kb-version").classList.add("error"); return; }
  datos = { kb, ddiCurado: ddiCurado || { interacciones: [] }, ddi: { pares: [] }, fichas: {} };
  indice = construirIndice(kb, []);
  datos.indice = indice;
  // Fase 2, en segundo plano y cuando el hilo principal esté libre: nomenclátor (1 MB), DDInter y fichas; se reconstruye el índice sin interrumpir
  const enIdle = (fn) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 800));
  new Promise((ok) => enIdle(ok)).then(() => Promise.all([cargarJson("marcas.json"), cargarJson("ddi.json"), cargarJson("fichas.json")])).then(([marcas, ddi, fichas]) => {
    if (ddi) datos.ddi = ddi;
    if (fichas) datos.fichas = fichas;
    if (marcas?.length) {
      const kbFresco = JSON.parse(JSON.stringify(kb)); // construirIndice añade principios sintéticos a las clases
      indice = construirIndice(kbFresco, marcas); datos.kb = kbFresco; datos.indice = indice;
      restaurar(); // por si el estado guardado tenía fármacos del nomenclátor (atc:…)
    }
    renderVersion(); render();
  });
  renderVersion();
  document.body.classList.remove("cargando");
  $("#aviso").textContent = kb.aviso;
  restaurar();
  const h = location.hash.match(/^#lista=([A-Za-z0-9_-]+)/);
  if (h && decodificarEstado(h[1])) { history.replaceState(null, "", location.pathname); restaurarFormulario(); guardar(); $("#pegar-aviso").textContent = "Lista cargada desde el enlace."; }
  render();
}

/* ---------- persistencia local (solo en este navegador) ---------- */
function guardar() {
  try { localStorage.setItem("medex.estado", JSON.stringify({ meds: estado.meds, edad: estado.edad, caidas: estado.caidas, condiciones: estado.condiciones, modo: estado.modo, pac: estado.pac, pro: estado.pro, horas: estado.horas, plan: estado.plan, cribado: estado.cribado, prescrito: estado.prescrito })); } catch {}
}
/** Deja solo lo que la app sabe interpretar: evita que un estado corrupto o una copia antigua rompan la carga. */
function numeroEntre(v, min, max) { if (v == null || v === "") return null; const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; }
function sanearMeds(meds) {
  if (!Array.isArray(meds)) return [];
  return meds.filter((m) => m && typeof m.pid === "string" && (indice.porId.has(m.pid) || (m.pid.startsWith("libre:") && typeof m.nombre === "string"))).slice(0, 60).map((m) => ({
    pid: m.pid, ...(m.pid.startsWith("libre:") ? { libre: true, nombre: String(m.nombre).slice(0, 60) } : {}),
    dosis: numeroEntre(m.dosis, 0, 1e6),
    tomas: numeroEntre(m.tomas, 1, 12) || 1,
    unidad: typeof m.unidad === "string" ? m.unidad.slice(0, 20) : undefined,
    momentos: Array.isArray(m.momentos) ? m.momentos.filter((x) => MOMENTOS.includes(x)) : momentosPorDefecto(numeroEntre(m.tomas, 1, 12) || 1),
    aDemanda: !!m.aDemanda, pausado: !!m.pausado, combo: typeof m.combo === "string" ? m.combo.slice(0, 80) : undefined,
  }));
}

function restaurar() {
  try {
    const s = JSON.parse(localStorage.getItem("medex.estado") || "null");
    if (s && Array.isArray(s.meds)) Object.assign(estado, { meds: sanearMeds(s.meds), edad: numeroEntre(s.edad, 1, 120), caidas: !!s.caidas, condiciones: Array.isArray(s.condiciones) ? s.condiciones.filter((c) => CONDICIONES.includes(c)) : [], modo: s.modo === "profesional" ? "profesional" : "paciente", pac: s.pac || {}, pro: s.pro || {}, horas: { ...HORA_MOMENTO, ...(s.horas || {}) }, plan: sanearPlan(s.plan), cribado: sanearCribado(s.cribado), prescrito: sanearPrescrito(s.prescrito) });
  } catch {}
  $("#edad").value = estado.edad ?? "";
  $("#caidas").checked = estado.caidas;
  for (const c of CONDICIONES) { const el = $("#cond-" + c); if (el) el.checked = estado.condiciones.includes(c); }
  for (const k of PAC) { const el = $("#pac-" + k); if (el) el.checked = estado.pac[k] === true; }
  for (const k of PRO) { const el = $("#pro-" + k); if (el) el.value = estado.pro[k] ?? ""; }
  pintarCribadoForm();
  aplicarModo();
}
function aplicarModo() {
  document.body.dataset.modo = estado.modo;
  $$(".modo button").forEach((b) => b.setAttribute("aria-checked", b.dataset.modo === estado.modo));
  const conIcono = (el, txt) => { const svg = el.querySelector(":scope > svg"); el.textContent = txt; if (svg) el.prepend(svg); };
  conIcono($("#btn-pdf-medico"), estado.modo === "paciente" ? t("desc.medico") : t("desc.medico.pro"));
  conIcono($("#btn-pdf-paciente"), estado.modo === "paciente" ? t("desc.paciente.pac") : t("desc.paciente.pro"));
}
$("#btn-letra").addEventListener("click", () => {
  const on = !document.documentElement.classList.contains("letra-grande");
  document.documentElement.classList.toggle("letra-grande", on);
  $("#btn-letra").setAttribute("aria-pressed", String(on));
  try { localStorage.setItem("medex.letra", on ? "1" : "0"); } catch {}
});
// cabecera compacta y guía de 3 pasos: solo la primera visita se muestra todo
try {
  if (localStorage.getItem("medex.visto") === "1") document.documentElement.classList.add("retorno");
  else localStorage.setItem("medex.visto", "1");
} catch {}
$("#btn-presentacion").addEventListener("click", () => { document.documentElement.classList.toggle("retorno"); });
$("#guia-cerrar").addEventListener("click", () => { $("#guia").hidden = true; try { localStorage.setItem("medex.guia", "1"); } catch {} });
try { if (localStorage.getItem("medex.guia") === "1") $("#guia").hidden = true; } catch {}
try { if (localStorage.getItem("medex.letra") === "1") { document.documentElement.classList.add("letra-grande"); $("#btn-letra").setAttribute("aria-pressed", "true"); } } catch {}
$$(".modo button").forEach((b) => b.addEventListener("click", () => { estado.modo = b.dataset.modo; aplicarModo(); guardar(); render(); }));
for (const k of PAC) $("#pac-" + k)?.addEventListener("change", () => { estado.pac[k] = $("#pac-" + k).checked; guardar(); render(); });
for (const k of PRO) $("#pro-" + k)?.addEventListener("change", () => { const v = $("#pro-" + k).value; estado.pro[k] = v === "" ? null : (k === "vivifrail" ? v : parseFloat(v)); guardar(); render(); });

/* ---------- búsqueda ---------- */
const inputBuscar = $("#buscar");
const lista = $("#sugerencias");
let seleccion = null;

let timerSinResultado = null;
function registrarSinResultado(q) {
  try {
    const l = JSON.parse(localStorage.getItem("medex.sinresultado") || "[]");
    if (!l.includes(q)) { l.push(q); localStorage.setItem("medex.sinresultado", JSON.stringify(l.slice(-30))); }
  } catch {}
}
inputBuscar.addEventListener("input", () => {
  seleccion = null;
  $("#dosis-wrap").hidden = true;
  const res = buscar(indice, inputBuscar.value);
  lista.innerHTML = "";
  clearTimeout(timerSinResultado);
  const q = inputBuscar.value.trim();
  if (!res.length && q.length >= 4) timerSinResultado = setTimeout(() => registrarSinResultado(q.toLowerCase()), 1500);
  lista.hidden = !res.length && q.length < 3;
  if (!res.length && q.length >= 3) {
    const li = document.createElement("li"); li.setAttribute("role", "option"); li.className = "libre-op";
    li.innerHTML = `<span>${t("libre.anadir", { n: q })}</span><small>${t("libre.nota")}</small>`;
    li.addEventListener("click", () => anadirLibre(q));
    lista.append(li);
  }
  for (const e of res) {
    const ref = indice.porId.get(e.pid);
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.innerHTML = e.tipo === "combo"
      ? `<span>${e.texto}</span><small>${t("buscar.combo")}: ${e.componentes.map((c) => indice.porId.get(c.pid).principio.nombre).join(" + ")}</small>`
      : `<span>${e.texto}${e.aproximado ? ` <em class="aprox">${t("buscar.quiso")}</em>` : ""}</span><small>${e.tipo === "marca" ? ref.principio.nombre + " · " : ""}${ref.clase.nombre}</small>`;
    li.addEventListener("click", () => elegir(e));
    lista.append(li);
  }
});
inputBuscar.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") { ev.preventDefault(); const first = lista.querySelector("li"); if (first && !lista.hidden) first.click(); }
  if (ev.key === "Escape") lista.hidden = true;
});
document.addEventListener("click", (ev) => { if (!ev.target.closest(".buscador")) lista.hidden = true; });

/* ---------- añadir rápido: últimos fármacos elegidos en este dispositivo y los más habituales ---------- */
const HABITUALES = ["paracetamol", "omeprazol", "atorvastatina", "metformina", "enalapril", "bisoprolol", "aas", "amlodipino", "simvastatina", "lorazepam"];
function leerRecientes() { try { return JSON.parse(localStorage.getItem("medex.recientes") || "[]"); } catch { return []; } }
function anotarReciente(pid) { try { const r = [pid, ...leerRecientes().filter((x) => x !== pid)].slice(0, 8); localStorage.setItem("medex.recientes", JSON.stringify(r)); } catch {} }
/** Nombre corto para chips y enlaces: siglas conocidas, o la primera palabra del nombre. */
const CORTOS = { aas: "AAS", calcio_vitd: "Calcio + vit. D", vitamina_d: "Vitamina D", hierro_oral: "Hierro", omega3: "Omega-3", potasio_oral: "Potasio", magnesio_oral: "Magnesio", insulina_rapida: "Insulina rápida", insulina_basal: "Insulina basal", insulina_mezcla: "Insulina mezcla", nicotina_sustitutiva: "Nicotina", antihistaminico_no_sedante: "Antihistamínico", anticonceptivo_combinado: "Anticonceptivo", ths_estrogenos: "THS", timolol_colirio: "Timolol colirio", laba_ics: "Inhalador LABA/ICS", lama: "Inhalador LAMA" };
function nombreCorto(principio) {
  if (CORTOS[principio.id]) return CORTOS[principio.id];
  const sigla = principio.nombre.match(/\(([A-ZÁÉÍÓÚ]{2,6})\)/);
  return sigla ? sigla[1] : principio.nombre.split(/[\s(\/]/)[0];
}

function renderRapido() {
  const box = $("#rapido"); if (!box || !indice) return;
  const ya = new Set(estado.meds.map((m) => m.pid));
  const rec = leerRecientes().filter((p) => indice.porId.has(p) && !ya.has(p));
  const hab = HABITUALES.filter((p) => indice.porId.has(p) && !ya.has(p) && !rec.includes(p));
  const pids = [...rec, ...hab].slice(0, 8);
  box.hidden = !pids.length || !$("#dosis-wrap").hidden;
  box.innerHTML = `<small>${rec.length ? t("rapido.recientes") : t("rapido.habituales")}</small>${pids.map((p) => `<button type="button" class="chip chip-btn" data-pid="${p}">${nombreCorto(indice.porId.get(p).principio)}</button>`).join("")}`;
  box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const e = indice.entradas.find((x) => x.tipo === "principio" && x.pid === b.dataset.pid); if (e) { elegir(e); $("#dosis").focus(); } }));
}

/** Medicamento que la base no conoce: se guarda tal cual para que la lista esté completa (sin recomendaciones). */
function anadirLibre(nombre, dosis = null, tomas = 1) {
  const limpio = nombre.replace(/\s+/g, " ").trim().slice(0, 60);
  if (!limpio) return;
  const pid = "libre:" + limpio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_");
  if (estado.ejemplo) { estado.meds = []; estado.ejemplo = false; }
  if (!estado.meds.some((m) => m.pid === pid)) estado.meds.push({ pid, nombre: limpio, libre: true, dosis, tomas, unidad: "mg", momentos: momentosPorDefecto(tomas) });
  inputBuscar.value = ""; lista.hidden = true; $("#dosis-wrap").hidden = true; seleccion = null;
  guardar(); render();
  toast(t("libre.anadido", { n: limpio }), { ms: 6000 });
}

function elegir(e) {
  if (e.tipo === "combo") {
    seleccion = { combo: e };
    inputBuscar.value = `${e.texto} (${e.componentes.map((c) => indice.porId.get(c.pid).principio.nombre).join(" + ")})`;
    lista.hidden = true;
    const w = $("#dosis-wrap"); w.hidden = false;
    $("#dosis").value = ""; $("#dosis").placeholder = t("buscar.segun"); $("#dosis").disabled = true;
    $("#unidad").textContent = e.componentes.map((c) => (c.dosis != null ? c.dosis : "?")).join("/") + " mg";
    $("#tomas-wrap").hidden = false; $("#tomas").value = 1; $("#tomas").focus();
    return;
  }
  $("#dosis").disabled = false; $("#dosis").placeholder = "";
  const ref = indice.porId.get(e.pid);
  seleccion = { pid: e.pid, unidad: ref.principio.unidad || "mg" };
  inputBuscar.value = e.tipo === "marca" ? `${e.texto} (${ref.principio.nombre})` : e.texto;
  lista.hidden = true;
  const w = $("#dosis-wrap");
  w.hidden = false;
  $("#dosis").value = e.dosis ?? "";
  $("#unidad").textContent = seleccion.unidad;
  anotarReciente(e.pid);
  const presets = indice.dosisPorPid?.get(e.pid) || [];
  const dp = $("#dosis-presets");
  dp.hidden = !presets.length;
  dp.innerHTML = presets.length ? `<small>${t("dosis.habituales")}</small>${presets.map((d) => `<button type="button" class="chip chip-btn" data-d="${d}">${d.toLocaleString("es-ES")}</button>`).join("")} <span class="unidad-mini">${seleccion.unidad}</span>` : "";
  dp.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { $("#dosis").value = b.dataset.d; $("#tomas").focus(); }));
  $("#rapido").hidden = true;
  const diaria = !/semana|mes|año/.test(seleccion.unidad);
  $("#tomas-wrap").hidden = !diaria;
  $("#tomas").value = 1;
  $("#dosis").focus();
}

$("#form-med").addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (!seleccion) return;
  const tomas = parseInt($("#tomas").value, 10) || 1;
  if (estado.ejemplo) { estado.meds = []; estado.ejemplo = false; }
  if (seleccion.combo) {
    const ya = new Set(estado.meds.map((m) => m.pid));
    for (const c of seleccion.combo.componentes) if (!ya.has(c.pid)) estado.meds.push({ pid: c.pid, dosis: c.dosis ?? null, tomas, unidad: indice.porId.get(c.pid).principio.unidad || "mg", combo: seleccion.combo.texto, momentos: momentosPorDefecto(tomas) });
    $("#dosis").disabled = false; $("#dosis").placeholder = "";
  } else {
    const dosis = parseFloat($("#dosis").value.replace(",", "."));
    if (Number.isFinite(dosis)) {
      // dosis implausible: más de 3 veces el umbral de dosis alta (o > 5.000 mg/día sin umbral) → pedir confirmación
      const ref = indice.porId.get(seleccion.pid);
      const umbral = ref?.principio?.umbral_mg?.alta;
      const diaria = dosis * tomas;
      const rara = umbral ? diaria > umbral * 3 : /^mg/.test(seleccion.unidad) && diaria > 5000;
      if (rara && !confirm(t("dosis.rara", { d: diaria.toLocaleString("es-ES"), u: seleccion.unidad.split("/")[0], f: ref.principio.nombre }))) { $("#dosis").focus(); return; }
    }
    estado.meds.push({ pid: seleccion.pid, dosis: Number.isFinite(dosis) ? dosis : null, tomas, unidad: seleccion.unidad, momentos: momentosPorDefecto(tomas) });
  }
  seleccion = null;
  inputBuscar.value = "";
  $("#dosis-wrap").hidden = true;
  guardar(); render();
  inputBuscar.focus();
});
// combos: también ocultar presets
$("#dosis-presets").hidden = true;

/* ---------- pegar lista ---------- */
$("#btn-pegar").addEventListener("click", () => { $("#pegar-wrap").hidden = !$("#pegar-wrap").hidden; });
$("#btn-importar").addEventListener("click", () => {
  const n = incorporarTexto($("#pegar").value);
  $("#pegar").value = "";
  if (n.reconocidos) $("#pegar-wrap").hidden = true;
});

/** Reconoce fármacos en un texto y los añade a la lista. Devuelve contadores. */
function incorporarTexto(texto, origen = "la lista", reemplazar = false) {
  const { reconocidos, noReconocidos } = extraerMedicacion(texto, indice);
  const habia = estado.meds.length;
  const previa = estado.ejemplo ? [] : structuredClone(estado.meds);
  if (reconocidos.length) {
    if (estado.ejemplo || reemplazar) { estado.meds = []; estado.ejemplo = false; }
    const ya = new Set(estado.meds.map((m) => m.pid));
    for (const r of reconocidos) if (!ya.has(r.pid)) estado.meds.push({ pid: r.pid, dosis: r.dosis, tomas: r.tomas, unidad: r.unidad, aDemanda: !!r.aDemanda, momentos: r.momentos && r.momentos.length ? r.momentos : momentosPorDefecto(r.tomas) });
  }
  const partes = [];
  if (reconocidos.length) partes.push(`Reconocidos ${reconocidos.length} medicamentos de ${origen}${reemplazar && habia && !estado.ejemplo ? " (se ha sustituido la lista anterior)" : ""}; revise las dosis en la lista.`);
  else partes.push(t("pegar.ninguno", { n: origen }));
  $("#pegar-aviso").textContent = partes.join(" ");
  mostrarNoReconocidos(noReconocidos);
  guardar(); render();
  if (reemplazar && reconocidos.length) mostrarCambios(previa);
  return { reconocidos: reconocidos.length, noReconocidos: noReconocidos.length };
}

/** Conciliación: qué ha cambiado al sustituir la lista (PDF, foto o lista guardada), con opción de volver atrás. */
function mostrarCambios(previa) {
  const box = $("#cambios"); if (!box) return;
  box.hidden = true; box.innerHTML = "";
  if (!previa.length) return;
  const nombre = (m) => m.libre ? m.nombre : (indice.porId.get(m.pid)?.principio.nombre || m.pid);
  const d = compararListas(previa, estado.meds);
  const fila = (clase, titulo, lista) => lista.length ? `<li class="${clase}"><b>${titulo}</b> ${lista.join(", ")}</li>` : "";
  box.innerHTML = `<div class="cambios-cab"><h3>${t("cambios.titulo")}</h3><span class="chip">${d.total ? d.total : "0"}</span></div>${d.total ? `<ul>${fila("c-nuevo", t("cambios.nuevos") + ":", d.nuevos.map(nombre))}${fila("c-retirado", t("cambios.retirados") + ":", d.retirados.map(nombre))}${fila("c-dosis", t("cambios.dosis") + ":", d.cambios.map((c) => `${indice.porId.get(c.pid)?.principio.nombre || c.pid} ${c.antes ?? "?"} → ${c.despues ?? "?"} ${c.unidad.split("/")[0]}/día`))}</ul>` : `<p>${t("cambios.ninguno")}</p>`}<div class="acciones" style="margin:8px 0 0"><button type="button" class="btn-sec sm" data-a="deshacer">${t("cambios.deshacer")}</button><button type="button" class="btn-sec sm" data-a="cerrar">${t("ficha.cerrar")}</button></div>`;
  box.hidden = false;
  box.querySelector('[data-a="deshacer"]').addEventListener("click", () => { estado.meds = sanearMeds(previa); guardar(); render(); box.hidden = true; toast(t("cambios.deshecho"), { ms: 3000 }); });
  box.querySelector('[data-a="cerrar"]').addEventListener("click", () => { box.hidden = true; });
}

/** Líneas con pinta de medicamento que no se han reconocido: permitir buscarlas o avisar de que faltan. */
function mostrarNoReconocidos(lineas) {
  const box = $("#no-reconocidos");
  box.innerHTML = ""; box.hidden = !lineas.length;
  if (!lineas.length) return;
  box.insertAdjacentHTML("beforeend", `<p>${lineas.length === 1 ? t("pegar.norec1") : t("pegar.norecN")}. ${t("pegar.norec.ayuda")}</p><ul></ul>`);
  const ul = box.querySelector("ul");
  for (const l of lineas.slice(0, 10)) {
    const li = document.createElement("li");
    const nombre = l.replace(/\s+\d.*$/, "").trim().slice(0, 60);
    li.innerHTML = `<span>${l.slice(0, 80)}</span><button type="button" class="btn-sec sm" data-accion="buscar">${t("pegar.buscar")}</button><button type="button" class="btn-sec sm" data-accion="libre">${t("libre.btn")}</button><button type="button" class="btn-sec sm" data-accion="avisar">${t("pegar.avisar")}</button>`;
    li.querySelector('[data-accion="buscar"]').addEventListener("click", () => { inputBuscar.value = nombre.split(" ").slice(0, 2).join(" "); inputBuscar.dispatchEvent(new Event("input")); inputBuscar.focus(); inputBuscar.scrollIntoView({ block: "center" }); });
    li.querySelector('[data-accion="libre"]').addEventListener("click", () => { const d = l.match(/(\d+(?:[.,]\d+)?)\s*(?:mg|miligramos)/i); anadirLibre(nombre, d ? parseFloat(d[1].replace(",", ".")) : null); li.remove(); });
    li.querySelector('[data-accion="avisar"]').addEventListener("click", () => {
      window.open(urlSugerencia({ lista: "No reconocido: " + l.slice(0, 120) }), "_blank", "noopener");
      li.querySelector('[data-accion="avisar"]').textContent = "Gracias";
    });
    ul.append(li);
  }
}

/* ---------- enlace con la lista (sin servidor: todo va en la URL) ---------- */
function codificarEstado() {
  const o = { m: estado.meds.map((m) => [m.pid, m.dosis, m.tomas, m.unidad || null, m.aDemanda ? 1 : 0, (m.momentos || []).map((x) => x[0]).join("")]), e: estado.edad, c: estado.caidas ? 1 : 0, k: estado.condiciones, o: estado.modo, p: estado.pac, r: estado.pro, q: estado.cribado, d: estado.plan?.dias };
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodificarEstado(h) {
  try {
    const json = decodeURIComponent(escape(atob(h.replace(/-/g, "+").replace(/_/g, "/"))));
    const o = JSON.parse(json);
    if (!Array.isArray(o.m)) return false;
    estado.meds = o.m.filter((x) => indice.porId.has(x[0])).map((x) => ({ pid: x[0], dosis: x[1], tomas: x[2] || 1, unidad: x[3] || undefined, aDemanda: !!x[4], momentos: x[5] ? MOMENTOS.filter((m) => x[5].includes(m[0])) : momentosPorDefecto(x[2] || 1) }));
    estado.edad = o.e ?? null; estado.caidas = !!o.c; estado.condiciones = Array.isArray(o.k) ? o.k.filter((c) => CONDICIONES.includes(c)) : [];
    estado.modo = o.o === "profesional" ? "profesional" : "paciente"; estado.pac = o.p || {}; estado.pro = o.r || {}; estado.ejemplo = false; estado.cribado = sanearCribado(o.q); if (o.d) estado.plan = sanearPlan({ dias: o.d });
    return true;
  } catch { return false; }
}
$("#btn-enlace").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#lista=${codificarEstado()}`;
  const btn = $("#btn-enlace");
  try { await navigator.clipboard.writeText(url); btn.textContent = "Enlace copiado"; }
  catch { const ta = $("#informe-texto"); ta.hidden = false; ta.value = url; ta.select(); btn.textContent = "Seleccione y copie"; }
  setTimeout(() => (btn.textContent = "Copiar enlace con mi lista"), 2500);
});

/* ---------- ficha de fármaco (consulta sin añadir a la lista) ---------- */
const ficha = $("#ficha"), fichaInput = $("#ficha-buscar"), fichaLista = $("#ficha-sugerencias"), fichaCuerpo = $("#ficha-cuerpo");
$("#btn-consultar").addEventListener("click", () => { ficha.showModal(); fichaInput.value = ""; fichaInput.focus(); });
$("#ficha-cerrar").addEventListener("click", () => ficha.close());
ficha.addEventListener("click", (ev) => { if (ev.target === ficha) ficha.close(); });
fichaInput.addEventListener("input", () => {
  const res = buscar(indice, fichaInput.value).filter((e) => e.tipo !== "combo");
  fichaLista.innerHTML = ""; fichaLista.hidden = !res.length;
  for (const e of res) {
    const ref = indice.porId.get(e.pid);
    const li = document.createElement("li"); li.setAttribute("role", "option");
    li.innerHTML = `<span>${e.texto}${e.aproximado ? ` <em class="aprox">${t("buscar.quiso")}</em>` : ""}</span><small>${e.tipo === "marca" ? ref.principio.nombre + " · " : ""}${ref.clase.nombre}</small>`;
    li.addEventListener("click", () => { fichaLista.hidden = true; fichaInput.value = e.texto; mostrarFicha(e.pid); });
    fichaLista.append(li);
  }
});
fichaInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); fichaLista.querySelector("li")?.click(); } });
function mostrarFicha(pid) {
  const { principio: p, clase: c } = indice.porId.get(pid);
  const senales = [...new Set([...(c.senales || []), ...(p.senales_extra || [])])].map((s) => datos.kb.senales[s]).filter(Boolean);
  const reglas = (amb) => (c[amb] || []).filter((r) => !r.si?.principio || r.si.principio === pid).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${glosar(r.texto)}${r.si?.dosis === "alta" ? " <em>(a dosis altas)</em>" : ""}${r.si?.edad_min ? ` <em>(≥ ${r.si.edad_min} años)</em>` : ""}${r.si?.condicion ? ` <em>(si ${r.si.condicion.replace(/_/g, " ")})</em>` : ""}</span></li>`).join("");
  const h = p.horario || c.horario;
  const horario = h ? [...(h.evitar || []).map((x) => `<li class="nivel-${x.nivel === "rojo" ? "alerta" : "precaucion"}"><span class="punto"></span><span>Evitar entrenar entre ${x.desde} y ${x.hasta} h tras la toma: ${x.motivo}</span></li>`), ...(h.preferir || []).map((x) => `<li class="nivel-info"><span class="punto"></span><span>Preferible entre ${x.desde} y ${x.hasta} h tras la toma: ${x.motivo}</span></li>`)].join("") : "";
  const ddi = datos.ddiCurado.interacciones.filter((x) => [x.a, x.b].some((k) => k === pid || k === "clase:" + c.id)).map((x) => {
    const otro = [x.a, x.b].find((k) => k !== pid && k !== "clase:" + c.id) || x.b;
    const nombre = otro.startsWith("clase:") ? (datos.kb.clases.find((k) => k.id === otro.slice(6))?.nombre || otro) : (indice.porId.get(otro)?.principio.nombre || otro);
    return `<li><span class="nivel ddi-${x.nivel}" style="font-size:.68rem">${datos.ddiCurado.niveles?.[x.nivel] || x.nivel}</span><b>${nombre}</b>: ${x.efecto}${x.accion ? ` <span class="muted">${x.accion}</span>` : ""}</li>`;
  });
  const ddiOrden = { mayor: 0, moderada: 1, menor: 2 };
  fichaCuerpo.innerHTML = `
    <h2 id="ficha-titulo">${p.nombre}</h2>
    <p class="clase-nombre">${c.nombre}${p.marcas?.length ? " · " + p.marcas.slice(0, 6).join(", ") : ""}${p.umbral_mg?.alta != null ? ` · dosis alta a partir de ${p.umbral_mg.alta.toLocaleString("es-ES")} ${p.unidad || "mg"}/día` : ""}</p>
    <p>${c.resumen}</p>
    ${p.nota ? `<p><em>${p.nota}</em></p>` : ""}
    ${senales.length ? `<div class="senales-chips">${senales.map((x) => `<span class="chip">${x}</span>`).join("")}</div>` : ""}
    ${[["general", t("tab.general")], ["aerobico", t("tab.aerobico")], ["fuerza", t("tab.fuerza")], ["equilibrio", t("tab.equilibrio")]].map(([amb, tit]) => { const r = reglas(amb); return r ? `<h3>${tit}</h3><ul class="reglas">${r}</ul>` : ""; }).join("")}
    ${horario ? `<h3>${t("ficha.horario")}</h3><ul class="reglas">${horario}</ul>` : ""}
    ${ddi.length ? `<h3>${t("ficha.interacciones")} (${ddi.length})</h3><ul class="ddi-mini">${ddi.join("")}</ul>` : ""}
    <p class="fuentes" style="margin-top:12px">${c.fuentes?.length ? t("inf.fuentes") + ": " + c.fuentes.join(" · ") + " · " : ""}${enlaceFicha(p)}</p>
    <button type="button" class="btn btn-anadir" id="ficha-anadir">${t("ficha.anadir")}</button>`;
  $("#ficha-anadir").addEventListener("click", () => { ficha.close(); const e = indice.entradas.find((x) => x.tipo === "principio" && x.pid === pid); if (e) { elegir(e); inputBuscar.scrollIntoView({ block: "center" }); } });
}

/* ---------- listas guardadas (solo en este dispositivo) ---------- */
function leerPerfiles() { try { return JSON.parse(localStorage.getItem("medex.perfiles") || "[]"); } catch { return []; } }
function escribirPerfiles(lista) { try { localStorage.setItem("medex.perfiles", JSON.stringify(lista)); } catch {} }
function snapshot() { return { meds: structuredClone(estado.meds), edad: estado.edad, caidas: estado.caidas, condiciones: [...estado.condiciones], modo: estado.modo, pac: { ...estado.pac }, pro: { ...estado.pro }, horas: { ...estado.horas }, plan: sanearPlan(estado.plan), cribado: sanearCribado(estado.cribado), prescrito: estado.prescrito }; }
function renderPerfiles() {
  const ul = $("#perfiles-lista"); ul.innerHTML = "";
  const lista = leerPerfiles();
  if (!lista.length) { ul.innerHTML = `<li><small>${t("perf.vacio")}</small></li>`; return; }
  for (const pf of lista) {
    const li = document.createElement("li");
    const n = pf.estado.meds.length;
    li.innerHTML = `<span class="nom">${pf.nombre}</span><button type="button" class="btn-sec sm" data-a="cargar">${t("perf.cargar")}</button><button type="button" class="btn-sec sm" data-a="actualizar">${t("perf.actualizar")}</button><button type="button" class="btn-sec sm" data-a="borrar">${t("perf.borrar")}</button><small>${n} ${t("perf.farmacos")} · ${new Date(pf.fecha).toLocaleDateString(idioma())}${pf.estado.edad ? " · " + pf.estado.edad + " " + t("perf.anos") : ""}</small>`;
    li.querySelector('[data-a="cargar"]').addEventListener("click", () => {
      const e = pf.estado;
      const previa = estado.ejemplo ? [] : structuredClone(estado.meds);
      Object.assign(estado, { meds: sanearMeds(e.meds), edad: numeroEntre(e.edad, 1, 120), caidas: !!e.caidas, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {}, horas: { ...HORA_MOMENTO, ...(e.horas || {}) }, plan: sanearPlan(e.plan), cribado: sanearCribado(e.cribado), prescrito: sanearPrescrito(e.prescrito), ejemplo: false });
      if (e.modo) estado.modo = e.modo;
      restaurarFormulario(); guardar(); render(); $("#pegar-aviso").textContent = t("perf.cargada", { n: pf.nombre });
      mostrarCambios(previa);
      const dias = Math.round((Date.now() - pf.fecha) / 864e5);
      if (dias >= 90) toast(t("perf.antigua", { d: dias }), { ms: 9000 });
    });
    li.querySelector('[data-a="actualizar"]').addEventListener("click", () => { pf.estado = snapshot(); pf.fecha = Date.now(); escribirPerfiles(lista); renderPerfiles(); });
    li.querySelector('[data-a="borrar"]').addEventListener("click", () => { if (li.dataset.confirmar) { escribirPerfiles(lista.filter((x) => x.id !== pf.id)); renderPerfiles(); } else { li.dataset.confirmar = "1"; li.querySelector('[data-a="borrar"]').textContent = t("perf.seguro"); } });
    ul.append(li);
  }
}
$("#btn-perfiles").addEventListener("click", () => { const w = $("#perfiles"); w.hidden = !w.hidden; $("#btn-perfiles").setAttribute("aria-expanded", String(!w.hidden)); if (!w.hidden) renderPerfiles(); });
$("#btn-perfil-guardar").addEventListener("click", () => {
  const nombre = $("#perfil-nombre").value.trim() || `Lista ${leerPerfiles().length + 1}`;
  if (!estado.meds.length) { $("#pegar-aviso").textContent = "No hay medicamentos que guardar."; return; }
  const lista = leerPerfiles(); lista.unshift({ id: Date.now().toString(36), nombre, fecha: Date.now(), estado: snapshot() }); escribirPerfiles(lista.slice(0, 20));
  $("#perfil-nombre").value = ""; renderPerfiles();
});
function restaurarFormulario() {
  $("#edad").value = estado.edad ?? ""; $("#caidas").checked = estado.caidas;
  for (const c of CONDICIONES) { const el = $("#cond-" + c); if (el) el.checked = estado.condiciones.includes(c); }
  for (const k of PAC) { const el = $("#pac-" + k); if (el) el.checked = estado.pac[k] === true; }
  for (const k of PRO) { const el = $("#pro-" + k); if (el) el.value = estado.pro[k] ?? ""; }
  pintarCribadoForm();
  aplicarModo();
}

/* ---------- PDF o foto de la medicación ---------- */
$("#btn-pdf").addEventListener("click", () => $("#pdf-input").click());
$("#btn-foto").addEventListener("click", () => $("#foto-input").click());
const progreso = (m) => { $("#pegar-aviso").textContent = m; };

$("#pdf-input").addEventListener("change", async () => {
  const f = $("#pdf-input").files[0];
  if (!f) return;
  progreso("Leyendo el PDF en su dispositivo…");
  try {
    let texto = await textoDePdf(f);
    if (texto.trim().length < 20) {
      progreso("El PDF no tiene texto: es un escaneo. Reconociendo con OCR (puede tardar un minuto la primera vez)…");
      texto = await textoDePdfEscaneado(f, progreso);
    }
    incorporarTexto(texto, `«${f.name}»`, true);
  } catch (e) {
    progreso("No se ha podido leer el PDF: " + (e.message || e) + ". Puede pegar la lista a mano.");
  }
  $("#pdf-input").value = "";
});

$("#foto-input").addEventListener("change", async () => {
  const f = $("#foto-input").files[0];
  if (!f) return;
  progreso("Preparando la imagen… (se procesa en su dispositivo; la primera vez descarga el modelo de lectura)");
  try {
    const texto = await textoDeImagen(f, progreso);
    if (texto.trim().length < 10) { progreso(t("foto.error")); return; }
    incorporarTexto(texto, "la foto", true);
  } catch (e) {
    progreso("No se ha podido leer la foto: " + (e.message || e) + ". Puede pegar la lista a mano.");
  }
  $("#foto-input").value = "";
});

/* ---------- dictar la medicación (reconocimiento de voz del navegador) ---------- */
const Reconocedor = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!Reconocedor) $("#btn-dictar").hidden = true;
let rec = null;
$("#btn-dictar").addEventListener("click", () => {
  if (rec) { rec.stop(); return; }
  rec = new Reconocedor();
  rec.lang = { es: "es-ES", en: "en-GB", ca: "ca-ES", gl: "gl-ES" }[idioma()] || "es-ES"; rec.interimResults = true; rec.continuous = true;
  let final = "";
  $("#btn-dictar").setAttribute("aria-pressed", "true"); progreso(t("dictar.escuchando"));
  rec.onresult = (ev) => { let parcial = ""; for (const r of ev.results) { if (r.isFinal) final += r[0].transcript + "\n"; else parcial += r[0].transcript; } progreso(t("dictar.escuchando") + " " + (final + parcial).slice(-80)); };
  rec.onerror = (e) => { progreso(t("dictar.error") + (e.error ? ` (${e.error})` : "")); };
  rec.onend = () => {
    $("#btn-dictar").setAttribute("aria-pressed", "false"); rec = null;
    const txt = final.replace(/\b(uno|un)\b/g, "1").replace(/\bcero\b/g, "0").replace(/\bdos\b/g, "2").replace(/\btres\b/g, "3").replace(/\bmedio\b/g, "0,5").replace(/\s+(miligramos|mg)\b/g, " mg").replace(/\b(punto|coma)\b/g, ",");
    if (txt.trim().length < 3) { progreso(t("dictar.nada")); return; }
    incorporarTexto(txt, t("dictar.origen"));
  };
  rec.start();
});

/* ---------- foto de una caja: reconoce la marca y la deja lista para añadir ---------- */
$("#btn-caja").addEventListener("click", () => $("#caja-input").click());
$("#caja-input").addEventListener("change", async () => {
  const f = $("#caja-input").files[0]; $("#caja-input").value = ""; if (!f) return;
  progreso(t("caja.leyendo"));
  try {
    const texto = await textoDeImagen(f, progreso);
    const lineas = texto.split(/\n+/).map((l) => l.replace(/[^\p{L}\p{N} ,./-]/gu, " ").trim()).filter((l) => l.length >= 4);
    let mejor = null;
    for (const l of lineas) {
      const palabras = l.split(/\s+/).filter((w) => w.length >= 4);
      for (let n = Math.min(3, palabras.length); n >= 1; n--) {
        const q = palabras.slice(0, n).join(" ");
        const r = buscar(indice, q, 3).filter((e) => !e.aproximado);
        const hit = r.find((e) => e.norm.startsWith(normalizarTxt(q))) || r[0];
        if (hit) { const score = n * 10 + (hit.dosis != null ? 1 : 0); if (!mejor || score > mejor.score) mejor = { e: hit, score, q }; break; }
      }
    }
    if (!mejor) { progreso(t("caja.nada")); return; }
    elegir(mejor.e); progreso(t("caja.ok", { n: mejor.e.texto })); $("#dosis").focus();
  } catch (e) { progreso(t("foto.error")); }
});
const normalizarTxt = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/* ---------- Resúmenes en PDF ---------- */
async function descargarPdf(tipo) {
  const btn = tipo === "medico" ? $("#btn-pdf-medico") : $("#btn-pdf-paciente");
  btn.disabled = true; btn.setAttribute("aria-busy", "true");
  try {
    const res = evaluar(datos, medsActivos(), ctxActual());
    const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), horas: estado.horas, diario: leerDiario(), plan: sanearPlan(estado.plan), cribado: cribadoActual(res), prescriptor: estado.modo === "profesional" ? prescriptorActual() : null, prescrito: estado.prescrito, appVersion: APP_VERSION, enlace: `${location.origin}${location.pathname}#lista=${codificarEstado()}`, libres: medsLibres().map((m) => m.nombre + (m.dosis != null ? ` ${m.dosis} mg` : "")) };
    const doc = await (tipo === "medico" ? pdfMedico : pdfPaciente)(datos.kb, res, ctx);
    doc.save(`${tipo === "medico" ? "resumen-medico" : "resumen-paciente"}-${new Date().toISOString().slice(0, 10)}.pdf`);
    if (estado.modo === "profesional" && !estado.prescrito) { estado.prescrito = { fecha: Date.now(), semanas: prescriptorActual().revision }; guardar(); pintarReeval(); }
    toast(t("pdf.generado"), { ms: 3000 });
    preguntarUtil();
  } catch (e) {
    $("#pdf-aviso").textContent = "No se ha podido generar el PDF (" + (e.message || e) + "). En la versión web pública la descarga funciona con normalidad.";
  }
  btn.removeAttribute("aria-busy"); btn.disabled = false;
}
$("#btn-pdf-medico").addEventListener("click", () => descargarPdf("medico"));

/** Pregunta de un clic tras generar un PDF (una vez por dispositivo y versión). */
function preguntarUtil() {
  let ya = null; try { ya = localStorage.getItem("medex.util"); } catch {}
  if (ya === datos.kb.version) return;
  const box = $("#util");
  box.hidden = false;
  box.innerHTML = `<span>${t("util.pregunta")}</span><button type="button" class="btn-sec sm" data-u="si">${t("util.si")}</button><button type="button" class="btn-sec sm" data-u="no">${t("util.no")}</button>`;
  box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    try { localStorage.setItem("medex.util", datos.kb.version); } catch {}
    window.open(urlSugerencia({ util: b.dataset.u }), "_blank", "noopener");
    box.innerHTML = `<span>${t("util.gracias")}</span>`;
    setTimeout(() => { box.hidden = true; }, 4000);
  }));
}

/** Texto breve para compartir (WhatsApp / correo): lo esencial + señales de alarma + enlace. */
function textoCompartir() {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const L = [`*${t("meta.titulo")}* (${t("meta.subtitulo")}) · ${t("compartir.cab")}`, ""];
  L.push(`${t("compartir.meds")}: ${[...res.items.map((i) => i.principio.nombre), ...medsLibres().map((m) => m.nombre + "*")].join(", ")}.${medsLibres().length ? " (*" + t("libre.sin_info_corto") + ")" : ""}`, "");
  L.push(`*${t("esencial.titulo")}*`);
  for (const p of loEsencial(res, 5)) L.push(`• ${p.titulo}: ${p.texto}`);
  L.push("", `*${t("alarma.titulo")}*`, ...ALARMA.slice(0, 4).map((a) => `• ${a}`));
  L.push("", t("compartir.pie"), "https://medicacionyejercicio.fuerzabasadaenevidencia.com/");
  return L.join("\n");
}
$("#btn-whatsapp").addEventListener("click", async () => {
  const txt = textoCompartir();
  if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch {} }
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
});
$("#btn-email").addEventListener("click", () => {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const cuerpo = `${textoCompartir()}\n\n----\n${informeTexto(datos.kb, res, ctxActual()).slice(0, 6000)}`;
  window.location.href = `mailto:?subject=${encodeURIComponent(t("meta.titulo") + " · " + t("compartir.cab"))}&body=${encodeURIComponent(cuerpo)}`;
});
/** Formulario de sugerencias (Tally) con los datos técnicos en campos ocultos: versión, modo, idioma, lista (sin datos personales),
    contexto y búsquedas sin resultado. Sustituye al correo; el correo queda como alternativa en el texto de ayuda. */
const FORM_SUGERENCIAS = "https://tally.so/r/5XK9YM";
function urlSugerencia(extra = {}) {
  const lista = estado.meds.map((m) => `${m.libre ? "LIBRE " + m.nombre : m.pid}${m.dosis != null ? " " + m.dosis + " " + (m.unidad || "mg") : ""}${m.tomas > 1 ? " x" + m.tomas : ""}`).join("; ");
  let sinRes = []; try { sinRes = JSON.parse(localStorage.getItem("medex.sinresultado") || "[]"); } catch {}
  const ctx = [estado.edad ? estado.edad + " años" : "", estado.caidas ? "caídas" : "", ...estado.condiciones].filter(Boolean).join(", ");
  const q = new URLSearchParams({ version: `${datos?.kb?.version || "?"} · ${navigator.userAgent.slice(0, 60)}`, modo: estado.modo, idioma: idioma(), lista: (extra.lista ?? lista).slice(0, 400), contexto: ctx.slice(0, 200), sinresultado: sinRes.slice(-15).join("; ").slice(0, 300), util: extra.util || "" });
  return `${FORM_SUGERENCIAS}?${q}`;
}
$$(".btn-sugerencia").forEach((b) => b.addEventListener("click", () => {
  window.open(urlSugerencia(), "_blank", "noopener");
  $("#pdf-aviso").textContent = t("sug.abierto");
}));
$("#btn-pdf-paciente").addEventListener("click", () => descargarPdf("paciente"));

$("#btn-ejemplo").addEventListener("click", () => {
  Object.assign(estado, structuredClone(EJEMPLO), { ejemplo: true });
  $("#edad").value = estado.edad; $("#caidas").checked = estado.caidas;
  guardar(); render();
});
$("#btn-vaciar").addEventListener("click", () => { estado.meds = []; estado.ejemplo = false; guardar(); render(); const c = $("#cambios"); if (c) c.hidden = true; });
$("#edad").addEventListener("change", () => { estado.edad = parseInt($("#edad").value, 10) || null; guardar(); render(); });
$("#caidas").addEventListener("change", () => { estado.caidas = $("#caidas").checked; guardar(); render(); });
for (const c of CONDICIONES) $("#cond-" + c)?.addEventListener("change", () => { estado.condiciones = CONDICIONES.filter((k) => $("#cond-" + k)?.checked); guardar(); render(); });

$$(".tabs button").forEach((b) => b.addEventListener("click", () => {
  if (estado.tab === b.dataset.tab) return;
  estado.tab = b.dataset.tab; render();
  // transición suave del contenido y pestaña activa siempre a la vista
  const c = $("#contenido-tab"); c.classList.remove("entra"); void c.offsetWidth; c.classList.add("entra");
  b.scrollIntoView({ inline: "center", block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}));

/* ---------- sin conexión: la app funciona igual (todo está en el dispositivo); se avisa discretamente ---------- */
function pintarConexion() {
  const el = $("#conexion"); if (!el) return;
  el.hidden = navigator.onLine !== false;
}
window.addEventListener("offline", pintarConexion);
window.addEventListener("online", () => { pintarConexion(); toast(t("conexion.on"), { ms: 3000 }); });
pintarConexion();
$("#esencial").addEventListener("click", (ev) => { if (ev.target.closest("#btn-escuchar")) escuchar(); });
// barra inferior (móvil): lleva al informe o, estando en él, de vuelta a la medicación
let enInforme = false;
const desplazar = (el) => el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
$("#btn-ir-informe").addEventListener("click", () => desplazar(enInforme ? $("aside") : $("#informe")));
new IntersectionObserver(([e]) => {
  enInforme = e.isIntersecting;
  $("#btn-ir-informe").firstChild.textContent = enInforme ? t("lista.editar") + " " : t("barra.ver") + " ";
  if (datos) pintarPasos();
}, { rootMargin: "-40% 0px -55% 0px" }).observe($("#informe"));

/* ---------- escuchar «Lo esencial» (síntesis de voz del navegador) ---------- */
let hablando = false;
function escuchar() {
  if (!("speechSynthesis" in window)) return;
  if (hablando) { speechSynthesis.cancel(); hablando = false; pintarBtnEscuchar(); return; }
  const res = evaluar(datos, medsActivos(), ctxActual());
  const partes = [t("esencial.titulo") + ".", ...loEsencial(res, 5).map((p) => `${p.titulo}. ${p.texto}`), t("alarma.titulo"), ...ALARMA];
  const u = new SpeechSynthesisUtterance(partes.join(" \n"));
  u.lang = { es: "es-ES", en: "en-GB", ca: "ca-ES", gl: "gl-ES" }[idioma()] || "es-ES"; u.rate = 0.95;
  u.onend = u.onerror = () => { hablando = false; pintarBtnEscuchar(); };
  speechSynthesis.cancel(); speechSynthesis.speak(u); hablando = true; pintarBtnEscuchar();
}
function pintarBtnEscuchar() { const b = $("#btn-escuchar"); if (b) b.innerHTML = `${icono(hablando ? "parar" : "escuchar")} ${hablando ? t("escuchar.parar") : t("escuchar")}`; }

/* ---------- plan semanal en el calendario (.ics) ---------- */
/** Días del plan vigente como [díaSemana, tipo, etiqueta] (domingo = 7 para que la semana empiece en lunes). */
function diasPlan() {
  const plan = planActual();
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => plan[d] !== "descanso").map((d) => [d === 0 ? 7 : d, plan[d] === "aerobico" ? "aerobico" : "fuerza", plan[d] === "fuerza_eq" ? "fuerza+equilibrio" : plan[d]]);
}
function horaPlan() {
  const v = ventanaEntrenamiento(indice, medsActivos(), estado.horas);
  const m = (v.mejores || []).map((x) => ({ desde: Math.max(x.desde, 9), hasta: Math.min(x.hasta, 19) })).filter((x) => x.hasta - x.desde >= 1).sort((a, b) => (b.hasta - b.desde) - (a.hasta - a.desde))[0];
  if (m) return m.desde;
  const ok = v.horas.find((h) => h.nivel !== "rojo" && h.h >= 9 && h.h <= 19);
  return ok ? ok.h : 10;
}
function icsPlan() {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const P = prescripcion(res, ctxActual());
  const hora = horaPlan();
  const esencial = loEsencial(res, 5).map((p) => `${p.titulo}: ${p.texto}`).join("\n");
  const esc = (x) => String(x).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const hoy = new Date(); const lunes = new Date(hoy); lunes.setDate(hoy.getDate() + ((8 - hoy.getDay()) % 7 || 7));
  const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Pauta Activa//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const DIA = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  for (const [dow, tipo, etiqueta] of diasPlan()) {
    const d = new Date(lunes); d.setDate(lunes.getDate() + dow - 1);
    const titulo = { aerobico: t("plan.aerobico"), fuerza: etiqueta.includes("equilibrio") ? t("plan.fuerza_eq") : t("plan.fuerza") }[tipo];
    const detalle = tipo === "aerobico" ? `${P.aer.int} ${P.aer.tiempo}. ${P.aer.tipo}` : `${P.fue.int} ${P.fue.tiempo}. ${P.fue.tipo}${etiqueta.includes("equilibrio") ? ` ${t("plan.mas_eq")}: ${P.eq.tipo}` : ""}`;
    const dur = tipo === "aerobico" ? 45 : 40;
    L.push("BEGIN:VEVENT", `UID:medex-${tipo}-${dow}-${stamp}@fuerzabasadaenevidencia.com`, `DTSTAMP:${stamp}`,
      `DTSTART:${fmt(d)}T${String(hora).padStart(2, "0")}0000`, `DTEND:${fmt(d)}T${String(hora).padStart(2, "0")}${String(dur).padStart(2, "0")}00`,
      `RRULE:FREQ=WEEKLY;COUNT=8;BYDAY=${DIA[d.getDay()]}`, `SUMMARY:${esc(titulo)}`,
      `DESCRIPTION:${esc(detalle)}\\n\\n${esc(t("esencial.titulo"))}:\\n${esc(esencial)}\\n\\n${esc(t("plan.pie"))}`, "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${esc(titulo)}`, "END:VALARM", "END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.join("\r\n");
}
$("#btn-calendario").addEventListener("click", () => {
  const blob = new Blob([icsPlan()], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "plan-ejercicio.ics"; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(t("plan.descargado", { n: diasPlan().length, h: String(horaPlan()).padStart(2, "0") + ":00" }), { ms: 7000 });
});

/* ---------- instalar como aplicación ---------- */
let promptInstalar = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptInstalar = e; $("#btn-instalar").hidden = false; });
const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
if (esIOS && !matchMedia("(display-mode: standalone)").matches) $("#btn-instalar").hidden = false;
$("#btn-instalar").addEventListener("click", async () => {
  if (promptInstalar) { promptInstalar.prompt(); const r = await promptInstalar.userChoice; if (r.outcome === "accepted") $("#btn-instalar").hidden = true; promptInstalar = null; return; }
  toast(esIOS ? t("instalar.ios") : t("instalar.otro"), { ms: 12000 });
});
window.addEventListener("appinstalled", () => { $("#btn-instalar").hidden = true; toast(t("instalar.ok"), { ms: 4000 }); });

/* ---------- tema claro / oscuro / automático ---------- */
const TEMAS = ["auto", "light", "dark"];
function aplicarTema(tm) {
  if (tm === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = tm;
  try { localStorage.setItem("medex.tema", tm); } catch {}
  const b = $("#btn-tema"); b.title = t("tema." + tm); b.setAttribute("aria-label", t("tema." + tm)); b.querySelector("span").textContent = { auto: "A", light: "☀", dark: "☾" }[tm];
}
$("#btn-tema").addEventListener("click", () => { const act = document.documentElement.dataset.theme || "auto"; aplicarTema(TEMAS[(TEMAS.indexOf(act) + 1) % TEMAS.length]); });
try { aplicarTema(localStorage.getItem("medex.tema") || "auto"); } catch { aplicarTema("auto"); }

$("#btn-historia").addEventListener("click", async () => {
  const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), diario: leerDiario(), prescriptor: prescriptorActual(), prescrito: estado.prescrito, appVersion: APP_VERSION, libres: medsLibres().map((m) => m.nombre + (m.dosis != null ? ` ${m.dosis} mg` : "")) };
  const res = evaluar(datos, medsActivos(), ctx);
  ctx.cribado = cribadoActual(res);
  const txt = textoHistoria(datos.kb, res, ctx);
  const btn = $("#btn-historia");
  try { await navigator.clipboard.writeText(txt); btn.textContent = "Copiado para la historia"; }
  catch { const ta = $("#informe-texto"); ta.hidden = false; ta.value = txt; ta.select(); btn.textContent = "Seleccione y copie"; }
  setTimeout(() => (btn.textContent = "Texto para la historia clínica"), 2500);
});
$("#btn-copiar").addEventListener("click", async () => {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const txt = informeTexto(datos.kb, res, estado);
  const btn = $("#btn-copiar");
  try { await navigator.clipboard.writeText(txt); btn.textContent = "Copiado"; }
  catch {
    const ta = $("#informe-texto"); ta.hidden = false; ta.value = txt; ta.select(); btn.textContent = "Seleccione y copie";
  }
  setTimeout(() => (btn.textContent = "Copiar informe"), 2500);
});

/* ---------- render ---------- */
function etiqueta(nivel) { return datos.kb.niveles[nivel]?.etiqueta || nivel; }

/* ---------- glosario: términos técnicos con definición al tocarlos ---------- */
const GLOSARIO = {
  "RPE": "Escala de esfuerzo percibido: del 0 (nada) al 10 (máximo). Moderado = 4–6, puede hablar pero no cantar.",
  "Borg": "Escala de esfuerzo percibido de 6 a 20. Moderado = 11–14 (algo duro).",
  "FITT": "Frecuencia, Intensidad, Tiempo y Tipo: las cuatro variables con que se prescribe el ejercicio.",
  "NYHA": "Clase funcional de la insuficiencia cardíaca: I sin síntomas; II con esfuerzos normales; III con esfuerzos pequeños; IV en reposo.",
  "FEVI": "Fracción de eyección del ventrículo izquierdo: porcentaje de sangre que el corazón expulsa en cada latido (normal ≥ 50 %).",
  "FG": "Filtrado glomerular: medida de la función del riñón en mL/min (normal > 90; reducido < 60).",
  "SPPB": "Short Physical Performance Battery: prueba de equilibrio, marcha y levantarse de la silla, de 0 a 12 puntos (≤ 9 indica fragilidad).",
  "DAI": "Desfibrilador automático implantable: dispositivo que detecta arritmias graves y da una descarga.",
  "Valsalva": "Aguantar la respiración haciendo fuerza: sube bruscamente la tensión. Al hacer fuerza, respire siempre.",
  "isométrico": "Ejercicio en el que el músculo trabaja sin moverse (sostener una posición). Sube más la tensión que el movimiento continuo.",
  "HIIT": "Entrenamiento interválico de alta intensidad: periodos cortos muy intensos alternados con descanso.",
  "CK": "Creatina quinasa: enzima muscular que sube en sangre cuando hay daño muscular.",
  "INR": "Medida de la anticoagulación con Sintrom o warfarina; el objetivo habitual es 2–3.",
  "hipoglucemia": "Azúcar en sangre por debajo de 70 mg/dL: sudor frío, temblor, hambre, confusión.",
  "ortostática": "Al ponerse de pie: la tensión baja al incorporarse y produce mareo.",
  "mEq": "Miliequivalentes: unidad en que se miden el potasio y otros electrolitos.",
};
const GLOS_RE = new RegExp("\\b(" + Object.keys(GLOSARIO).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b", "g");
function glosar(html) {
  if (!html) return html;
  const vistos = new Set();
  return html.replace(GLOS_RE, (m) => { if (vistos.has(m.toLowerCase())) return m; vistos.add(m.toLowerCase()); return `<abbr class="glos" data-glos="${m}" tabindex="0">${m}</abbr>`; });
}
document.addEventListener("click", (ev) => { const a = ev.target.closest("abbr.glos"); if (a) { ev.preventDefault(); toast(`<b>${a.dataset.glos}</b>: ${GLOSARIO[a.dataset.glos] || ""}`, { ms: 9000 }); } });

/* ---------- diario de sesiones (solo en este dispositivo) ---------- */
function leerDiario() { try { return JSON.parse(localStorage.getItem("medex.diario") || "[]"); } catch { return []; } }
function escribirDiario(d) { try { localStorage.setItem("medex.diario", JSON.stringify(d.slice(-200))); } catch {} }
const TIPOS_SESION = ["aerobico", "fuerza", "equilibrio", "paseo"];
/** Campos de constantes (glucosa, TA, pulso) que merece la pena anotar según la medicación; en blanco no cuentan. */
function camposConstantes() {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const cs = constantesRelevantes(res, ctxActual());
  if (!cs.length) return "";
  const campo = (name, c, ph) => `<input type="number" name="${name}" min="${c.min}" max="${c.max}" inputmode="numeric" placeholder="${ph}" aria-label="${t("const." + c.id)} ${ph}">`;
  return `<small>${t("const.titulo")}</small><div class="fila constantes">${cs.map((c) => `<label><span>${t("const." + c.id)} <span class="unidad-mini">${c.unidad}</span></span>${c.doble ? campo("glucosa_antes", c, t("const.antes")) + campo("glucosa_despues", c, t("const.despues")) : campo(c.id, c, "")}</label>`).join("")}</div>`;
}
function leerConstantes(f) {
  const n = (k) => { const v = parseInt(f.get(k), 10); return Number.isFinite(v) ? v : null; };
  const c = { glucosa_antes: n("glucosa_antes"), glucosa_despues: n("glucosa_despues"), ta: n("ta"), fc: n("fc") };
  return Object.values(c).some((v) => v != null) ? c : undefined;
}
function textoConstantes(c) {
  if (!c) return "";
  const p = [];
  if (c.glucosa_antes != null || c.glucosa_despues != null) p.push(`${t("const.glu_corto")} ${c.glucosa_antes ?? "–"}/${c.glucosa_despues ?? "–"}`);
  if (c.ta != null) p.push(`TA ${c.ta}`); if (c.fc != null) p.push(`${c.fc} lpm`);
  return p.length ? ` · <span class="const-txt">${p.join(" · ")}</span>` : "";
}
/** Diario en CSV (separador «;», compatible con Excel en español) para llevarlo a la consulta. */
function exportarDiarioCsv() {
  const d = leerDiario();
  if (!d.length) { toast(t("diario.csv_vacio"), { ms: 3000 }); return; }
  const cab = ["fecha", "tipo", "minutos", "rpe", "sintomas", "glucosa_antes", "glucosa_despues", "ta_sistolica", "fc_fin"];
  const filas = d.map((x) => [x.fecha, x.tipo, x.min, x.rpe, (x.sintomas || []).join("|"), x.const?.glucosa_antes ?? "", x.const?.glucosa_despues ?? "", x.const?.ta ?? "", x.const?.fc ?? ""]);
  const csv = "\ufeff" + [cab, ...filas].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `diario-ejercicio-${hoyISO()}.csv`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(t("diario.csv_ok", { n: d.length }), { ms: 4000 });
}
function hoyISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function etiquetaTipo(tipo) { return { aerobico: t("plan.aerobico"), fuerza: t("plan.fuerza"), fuerza_eq: t("plan.fuerza_eq"), equilibrio: t("sesion.equilibrio"), descanso: t("hoy.descanso"), paseo: t("sesion.paseo") }[tipo] || tipo; }
function planDeHoy(d = new Date()) {
  const tipo = planActual()[d.getDay()] || "descanso";
  return { tipo, etiqueta: etiquetaTipo(tipo) };
}
const esFragil = () => { const c = ctxActual().condiciones; return c.has("fragil") || c.has("nyha34"); };
function franjaHoy() {
  const v = ventanaEntrenamiento(indice, medsActivos(), estado.horas);
  if (!v.horas.some((h) => h.nivel === "rojo" || h.nivel === "ambar")) return null; // sin restricciones no hace falta franja
  const m = (v.mejores || []).map((x) => ({ desde: Math.max(x.desde, 8), hasta: Math.min(x.hasta, 21) })).filter((x) => x.hasta - x.desde >= 2).sort((a, b) => (b.hasta - b.desde) - (a.hasta - a.desde))[0];
  return m ? `${m.desde}:00–${m.hasta}:00` : null;
}
function barrasSemana(diario) {
  const dias = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return hoyISO(d); });
  const min = dias.map((iso) => diario.filter((x) => x.fecha === iso).reduce((n, x) => n + (x.min || 0), 0));
  const max = Math.max(30, ...min);
  const L = ["L", "M", "X", "J", "V", "S", "D"];
  return `<svg class="semana" viewBox="0 0 140 44" role="img" aria-label="${t("hoy.semana_aria", { n: min.reduce((a, b) => a + b, 0) })}">${dias.map((iso, i) => { const h = Math.round((min[i] / max) * 28); const d = new Date(iso + "T12:00"); return `<rect x="${i * 20 + 4}" y="${32 - h}" width="12" height="${Math.max(h, 2)}" rx="3" class="${min[i] ? "con" : "sin"}"/><text x="${i * 20 + 10}" y="42" text-anchor="middle">${L[(d.getDay() + 6) % 7]}</text>${min[i] ? `<text x="${i * 20 + 10}" y="${29 - h}" text-anchor="middle" class="val">${min[i]}</text>` : ""}`; }).join("")}</svg>`;
}
let diarioAbierto = false;
function renderHoy() {
  const box = $("#hoy"); if (!box) return;
  const diario = leerDiario();
  const plan = planDeHoy(); const franja = franjaHoy();
  const semana = diario.filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 6);
  const nSem = semana.length, minSem = semana.reduce((n, x) => n + (x.min || 0), 0);
  const ultimas = [...diario].reverse().slice(0, 4);
  box.innerHTML = `
    <div class="hoy-cab">
      <div><small>${t("hoy.titulo")}</small><h3>${plan.etiqueta}${franja ? ` <span class="hoy-franja">· ${t("hoy.mejor", { f: franja })}</span>` : ""}</h3></div>
      <div class="hoy-botones"><button type="button" class="btn sm" id="btn-empezar-hoy"${plan.tipo === "descanso" ? " hidden" : ""}>${t("plan.empezar")}</button><button type="button" class="btn-sec sm" id="btn-registrar">${diarioAbierto ? t("ficha.cerrar") : t("hoy.registrar")}</button><button type="button" class="btn-sec sm" id="btn-ver-plan">${t("plan.ver")}</button></div>
    </div>
    <div class="hoy-semana">${barrasSemana(diario)}<div class="hoy-resumen"><b>${nSem}</b> ${t("hoy.sesiones")} · <b>${minSem}</b> min ${t("hoy.esta_semana")}</div></div>
    ${diarioAbierto ? `<form class="registro" id="form-registro">
      <div class="chips">${TIPOS_SESION.map((x) => `<label class="chip chip-btn"><input type="radio" name="tipo" value="${x}"${x === (plan.tipo === "descanso" ? "paseo" : plan.tipo) ? " checked" : ""}> ${t("sesion." + x)}</label>`).join("")}</div>
      <div class="fila"><label>${t("hoy.minutos")} <input type="number" name="min" min="1" max="300" value="30" inputmode="numeric"></label><label>${t("hoy.rpe")} <input type="range" name="rpe" min="1" max="10" value="5"><output>5</output></label></div>
      <small>${t("hoy.sintomas")}</small>
      <div class="chips">${SINTOMAS.slice(0, 7).map((x) => `<label class="chip chip-btn"><input type="checkbox" name="sint" value="${x.id}"> ${x.nombre}</label>`).join("")}</div>
      ${camposConstantes()}
      <div class="acciones" style="margin:8px 0 0"><button type="submit" class="btn sm">${t("perf.guardar")}</button></div>
    </form>` : ""}
    ${ultimas.length ? `<ul class="diario-lista">${ultimas.map((x) => `<li><span>${new Date(x.fecha + "T12:00").toLocaleDateString(idioma(), { weekday: "short", day: "numeric", month: "short" })}</span><span>${t("sesion." + x.tipo)} · ${x.min} min · RPE ${x.rpe}${x.sintomas?.length ? ` · <em>${x.sintomas.map((id) => SINTOMAS.find((y) => y.id === id)?.nombre.split(" ")[0]).join(", ")}</em>` : ""}${textoConstantes(x.const)}</span><button type="button" class="quitar" data-id="${x.id}" aria-label="${t("lista.quitar")}">×</button></li>`).join("")}</ul>` : ""}`;
  $("#btn-registrar").addEventListener("click", () => { diarioAbierto = !diarioAbierto; renderHoy(); });
  $("#btn-ver-plan").addEventListener("click", () => { estado.tab = "plan"; render(); $(".tabs")?.scrollIntoView({ block: "start" }); });
  $("#btn-empezar-hoy")?.addEventListener("click", () => abrirSesion(plan.tipo));
  box.querySelector("input[name=rpe]")?.addEventListener("input", (ev) => { ev.target.nextElementSibling.textContent = ev.target.value; });
  box.querySelector("#form-registro")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const sint = f.getAll("sint");
    const d = leerDiario(); d.push({ id: Date.now().toString(36), fecha: hoyISO(), tipo: f.get("tipo") || "aerobico", min: parseInt(f.get("min"), 10) || 0, rpe: parseInt(f.get("rpe"), 10) || 5, sintomas: sint, const: leerConstantes(f) });
    escribirDiario(d); diarioAbierto = false; renderHoy();
    toast(sint.length ? t("hoy.guardado_sintomas") : t("hoy.guardado"), { ms: 6000 });
    if (sint.length) { sintomaAbierto = sint[0]; render(); $("#sintomas-card")?.scrollIntoView({ block: "center" }); }
  });
  box.querySelectorAll(".diario-lista .quitar").forEach((b) => b.addEventListener("click", () => { escribirDiario(leerDiario().filter((x) => x.id !== b.dataset.id)); renderHoy(); }));
}

let sintomaAbierto = null;
function sintomaDetalle(res) {
  if (!sintomaAbierto) return `<p class="vacio">${t("sintomas.ayuda")}</p>`;
  const s = sintomasPosibles(res).find((x) => x.id === sintomaAbierto);
  if (!s) return "";
  return `<div class="sintoma">
    <p>${s.farmacos.length ? t("sintomas.posibles", { f: s.farmacos.join(", ") }) : t("sintomas.ninguno")}</p>
    <p>${glosar(s.consejo)}</p>
    ${s.alarma ? `<p class="sintoma-alarma">${s.alarma}</p>` : ""}
  </div>`;
}

/** Editor en la propia fila: dosis por toma y tomas al día. */
function editarEnSitio(li, m, it) {
  const box = li.querySelector(".med-dosis");
  const unidad = m.unidad || it.principio.unidad || "mg";
  const diaria = !/semana|mes|año/.test(unidad);
  box.innerHTML = `<form class="editor"><label>${t("dosis.toma")} <input type="number" step="any" min="0" inputmode="decimal" value="${m.dosis ?? ""}"></label><span class="unidad">${unidad}</span>${diaria ? `<label>${t("dosis.tomas")} <input type="number" min="1" max="6" inputmode="numeric" value="${m.tomas || 1}" data-tomas></label>` : ""}<button type="submit" class="btn sm">${t("perf.guardar")}</button><button type="button" class="btn-sec sm" data-cancelar>${t("ficha.cerrar")}</button></form>`;
  const form = box.querySelector("form");
  form.querySelector("input").focus();
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const d = parseFloat(form.querySelector("input").value.replace(",", "."));
    m.dosis = Number.isFinite(d) ? d : null;
    const tm = form.querySelector("[data-tomas]");
    if (tm) { const n = parseInt(tm.value, 10) || 1; if (n !== m.tomas) { m.tomas = n; m.momentos = momentosPorDefecto(n); } }
    guardar(); render(); toast(t("lista.actualizado", { f: it.principio.nombre }), { ms: 2500 });
  });
  form.querySelector("[data-cancelar]").addEventListener("click", () => render());
}

/** Pasos 1·2·3 de la barra inferior: medicación → datos → informe. */
function pintarPasos() {
  const p1 = estado.meds.length > 0;
  const p2 = !!(estado.edad || estado.condiciones.length || estado.caidas || Object.values(estado.pac).some(Boolean) || Object.values(estado.pro).some((v) => v != null && v !== ""));
  const p3 = p1 && enInforme;
  $("#pasos").innerHTML = [[p1, t("pasos.1")], [p2, t("pasos.2")], [p3, t("pasos.3")]].map(([ok, txt], i) => `<span class="paso${ok ? " hecho" : ""}${!ok && (i === 0 || (i === 1 && p1) || (i === 2 && p1)) ? " actual" : ""}"><b>${ok ? "✓" : i + 1}</b>${txt}</span>`).join("");
}

function render() {
  const ctx = ctxActual();
  const resLista = evaluar(datos, estado.meds.filter((m) => !m.libre), ctx);     // todos los conocidos, para pintar la lista
  const res = evaluar(datos, medsActivos(), ctx);        // solo los activos, para el informe
  document.body.classList.toggle("sin-meds", !estado.meds.length);
  pintarPasos();
  renderRapido();

  // lista de medicación
  const ul = $("#lista-meds");
  ul.innerHTML = "";
  $("#ejemplo-banner").hidden = !estado.ejemplo;
  let k = 0;
  estado.meds.forEach((m, i) => {
    const li = document.createElement("li");
    if (m.libre) {
      li.classList.add("libre");
      li.innerHTML = `
        <div class="med-nombre"><svg class="ic-grupo g-libre" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${GRUPO_ICONS.pastilla}"/></svg><div><strong>${m.nombre}</strong><small>${t("libre.sin_info")}</small></div></div>
        <div class="med-dosis">${m.dosis != null ? `${m.dosis.toLocaleString("es-ES")} mg${m.tomas > 1 ? ` × ${m.tomas}/día` : ""}` : t("lista.sin_dosis")}</div>
        <div class="med-acciones"><button type="button" class="pausar" title="${t("pegar.avisar")}" aria-label="${t("pegar.avisar")} ${m.nombre}">${icono("correo")}</button><button type="button" class="quitar" aria-label="${t("lista.quitar")} ${m.nombre}">×</button></div>`;
      li.querySelector(".pausar").addEventListener("click", () => window.open(urlSugerencia({ lista: "No reconocido: " + m.nombre }), "_blank", "noopener"));
      li.querySelector(".quitar").addEventListener("click", () => { const q = estado.meds.splice(i, 1)[0]; guardar(); render(); toast(t("lista.quitado", { f: m.nombre }), { accion: t("lista.deshacer"), onAccion: () => { estado.meds.splice(Math.min(i, estado.meds.length), 0, q); guardar(); render(); } }); });
      ul.append(li);
      return;
    }
    const it = resLista.items[k++];
    if (!it) return;
    if (m.pausado) li.classList.add("pausado");
    const dosis = it.dosisTotal != null
      ? `${it.dosisPorToma.toLocaleString("es-ES")} ${it.unidad}${it.esDiaria && it.tomas > 1 ? ` × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día = ${it.dosisTotal.toLocaleString("es-ES")} ${it.unidad}/día` : it.esDiaria ? "/día" : ""}${it.aDemanda ? " · si precisa" : ""}`
      : t("lista.sin_dosis");
    li.innerHTML = `
      <div class="med-nombre">${iconoGrupo(it.clase)}<div><strong>${it.principio.nombre}</strong><small>${m.combo ? `${t("lista.en")} ${m.combo} · ` : ""}${it.clase.nombre}${m.pausado ? ` · <em>${t("lista.pausado")}</em>` : ""}</small></div></div>
      <div class="med-dosis"><button type="button" class="editar" title="${t("lista.editar_dosis")}">${dosis}${it.dosisCat === "alta" && !m.pausado ? ` <span class="chip chip-alta">${t("inf.dosis_alta")}</span>` : ""} ${icono("editar", "ic ic-sm")}</button></div>
      <div class="momentos" role="group" aria-label="Momento de las tomas">${MOMENTOS.map((mm) => `<button type="button" class="mom" data-m="${mm}" aria-pressed="${(m.momentos || []).includes(mm)}" title="${MOMENTO_TXT[mm]}">${{ desayuno: "Des", comida: "Com", cena: "Cena", noche: "Noche" }[mm]}</button>`).join("")}</div>
      <div class="med-acciones"><button type="button" class="pausar" title="${m.pausado ? t("lista.reanudar") : t("lista.pausar")}" aria-label="${m.pausado ? t("lista.reanudar") : t("lista.pausar")} ${it.principio.nombre}">${icono(m.pausado ? "reanudar" : "pausa")}</button><button type="button" class="quitar" aria-label="${t("lista.quitar")} ${it.principio.nombre}">×</button></div>`;
    li.querySelectorAll(".mom").forEach((b) => b.addEventListener("click", () => {
      const set = new Set(m.momentos || []);
      set.has(b.dataset.m) ? set.delete(b.dataset.m) : set.add(b.dataset.m);
      m.momentos = MOMENTOS.filter((x) => set.has(x)); if (m.momentos.length) m.tomas = m.momentos.length;
      guardar(); render();
    }));
    li.querySelector(".pausar").addEventListener("click", () => { m.pausado = !m.pausado; guardar(); render(); toast(m.pausado ? t("lista.pausado_msg", { f: it.principio.nombre }) : t("lista.reanudado_msg", { f: it.principio.nombre }), { ms: 3500 }); });
    li.querySelector(".quitar").addEventListener("click", () => {
      const quitado = estado.meds.splice(i, 1)[0]; estado.ejemplo = false; guardar(); render();
      toast(t("lista.quitado", { f: it.principio.nombre }), { accion: t("lista.deshacer"), onAccion: () => { estado.meds.splice(Math.min(i, estado.meds.length), 0, quitado); guardar(); render(); } });
    });
    li.querySelector(".editar").addEventListener("click", () => editarEnSitio(li, m, it));
    ul.append(li);
  });
  $("#sin-meds").hidden = estado.meds.length > 0;
  $("#informe").hidden = res.items.length === 0;
  $("#solo-libres").hidden = !(res.items.length === 0 && medsLibres().length);
  if (!res.items.length) { $("#barra-inferior").hidden = true; $("#esencial").innerHTML = ""; $("#indice-informe").hidden = true; renderCribado(res); pintarReeval(); return; }

  // chips de contexto derivado
  const etiquetasCtx = { renal: "enfermedad renal", renal_grave: "FG < 30", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", marcapasos: "marcapasos/DAI", diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno", embarazo: "embarazo/lactancia" };
  const chips = [...ctx.condiciones].map((c) => etiquetasCtx[c]).filter(Boolean);
  if (ctx.edad) chips.unshift(`${ctx.edad} años`);
  if (ctx.daiFc) chips.push(`DAI ${ctx.daiFc} lpm`);
  $("#contexto").innerHTML = chips.length ? chips.map((c) => `<span class="chip">${c}</span>`).join("") : "";
  // resumen
  $("#resumen").innerHTML = ["alerta", "precaucion", "info"]
    .map((n) => `<div class="tile tile-${n}"><span class="num">${res.resumen[n]}</span><span>${etiqueta(n)}</span></div>`).join("") +
    `<div class="tile tile-ddi"><span class="num">${res.interacciones.length}</span><span>${t("tab.interacciones")}</span></div>`;
  // veredicto en lenguaje claro
  const { alerta: nA, precaucion: nP } = res.resumen;
  const mayores = res.interacciones.filter((x) => x.nivel === "mayor").length;
  const veredicto = nA || mayores ? t("veredicto.alerta", { a: nA + mayores }) : nP ? t("veredicto.precaucion", { p: nP }) : t("veredicto.ok");
  const crib = cribadoActual(res);
  renderCribado(res); pintarReeval();
  $("#veredicto").className = "veredicto " + (nA || mayores ? "v-alerta" : nP ? "v-precaucion" : "v-ok");
  $("#veredicto").innerHTML = `<p>${veredicto}</p>${crib.clave !== "sin_datos" ? `<p class="veredicto-crib crib-${crib.nivel}"><b>${t("crib.chip." + crib.clave)}:</b> ${crib.texto} <small>(${t("crib.fuente")})</small></p>` : `<p class="veredicto-crib crib-pendiente"><button type="button" class="btn-sec sm" id="btn-ir-cribado">${t("crib.pendiente")}</button></p>`}`;
  $("#btn-ir-cribado")?.addEventListener("click", () => { const d = $("#bloque-cribado"); d.open = true; d.scrollIntoView({ block: "center" }); });
  $("#indice-informe").hidden = false;
  renderHoy();
  // lo esencial (3-5 puntos accionables) + señales de alarma
  const esencial = loEsencial(res, 5);
  if (crib.nivel !== "info" && crib.clave !== "sin_datos") esencial.unshift({ nivel: crib.nivel, titulo: t("crib.chip." + crib.clave), texto: crib.texto });
  $("#esencial").innerHTML = (esencial.length ? `
    <section class="esencial">
      <div class="esencial-cab"><h3>${t("esencial.titulo")}</h3>${"speechSynthesis" in window ? `<button type="button" class="btn-sec sm" id="btn-escuchar">${icono(hablando ? "parar" : "escuchar")} ${hablando ? t("escuchar.parar") : t("escuchar")}</button>` : ""}</div>
      <ol>${esencial.map((p) => `<li class="nivel-${p.nivel}"><span class="punto"></span><span><b>${p.titulo}.</b> ${glosar(p.texto)}</span></li>`).join("")}</ol>
      <p class="esencial-nota">${t("esencial.nota")}</p>
    </section>` : "") + `
    <details class="alarma" id="alarma-card">
      <summary><span class="sub-label">${t("alarma.titulo")}</span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <ul>${ALARMA.map((a) => `<li>${a}</li>`).join("")}</ul>
      <p>${t("alarma.pie")}</p>
    </details>
    <details class="sintomas" id="sintomas-card"${sintomaAbierto ? " open" : ""}>
      <summary><span class="sub-label">${t("sintomas.titulo")}</span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <div class="chips">${sintomasPosibles(res).map((s) => `<button type="button" class="chip chip-btn${s.id === sintomaAbierto ? " activo" : ""}${s.farmacos.length ? "" : " apagado"}" data-s="${s.id}">${s.nombre}${s.farmacos.length ? ` <b>${s.farmacos.length}</b>` : ""}</button>`).join("")}</div>
      <div id="sintoma-detalle">${sintomaDetalle(res)}</div>
    </details>`;
  $("#sintomas-card").querySelectorAll(".chips button").forEach((b) => b.addEventListener("click", () => { sintomaAbierto = sintomaAbierto === b.dataset.s ? null : b.dataset.s; render(); }));

  // tabs con recuento de avisos (precaución + atención)
  const cuenta = (amb) => {
    let a = 0, p = 0;
    for (const g of res.ambitos[amb]) for (const r of g.reglas) { if (r.nivel === "alerta") a++; else if (r.nivel === "precaucion") p++; }
    if (amb === "general") for (const c of res.combinadas) { if (c.regla.nivel === "alerta") a++; else if (c.regla.nivel === "precaucion") p++; }
    return { a, p };
  };
  $$(".tabs button").forEach((b) => {
    b.setAttribute("aria-selected", b.dataset.tab === estado.tab);
    const c = b.querySelector(".cnt");
    if (b.dataset.tab === "cuando") { const v = ventanaEntrenamiento(indice, medsActivos(), estado.horas); const nr = v.horas.filter((x) => x.nivel === "rojo").length; const na = v.horas.filter((x) => x.nivel === "ambar").length; c.textContent = nr || na ? (nr ? nr + "h" : na + "h") : ""; c.className = "cnt" + (nr ? " c-alerta" : na ? " c-precaucion" : ""); }
    else if (b.dataset.tab === "plan") { const d = leerDiario(); const n = d.filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 6).length; c.textContent = n || ""; c.className = "cnt" + (n ? " c-ok" : ""); }
    else if (b.dataset.tab === "interacciones") { const n = res.interacciones.filter((x) => x.nivel !== "menor").length; c.textContent = n || ""; c.className = "cnt" + (res.interacciones.some((x) => x.nivel === "mayor") ? " c-alerta" : n ? " c-precaucion" : ""); }
    else { const { a, p } = cuenta(b.dataset.tab); c.textContent = a + p || ""; c.className = "cnt" + (a ? " c-alerta" : p ? " c-precaucion" : ""); }
  });
  $("#barra-inferior").hidden = false;
  $("#barra-contador").innerHTML = `<span style="background:var(--alerta)">${res.resumen.alerta}</span><span style="background:var(--precaucion)">${res.resumen.precaucion}</span>`;
  const cont = $("#contenido-tab");
  cont.innerHTML = "";

  if (estado.tab === "general") {
    if (res.combinadas.length) {
      const na = res.combinadas.filter((c) => c.regla.nivel === "alerta").length, np = res.combinadas.length - na;
      const sec = seccion(t("inf.combinacion"), { clave: "combinadas", resumen: `${res.combinadas.length} ${t("inf.avisos")} · ${resumenNiveles(na, np, 0)}` });
      const cuerpo = sec.querySelector(".cuerpo-sec");
      for (const c of [...res.combinadas].sort((a, b) => ORDEN_NIVEL[b.regla.nivel] - ORDEN_NIVEL[a.regla.nivel])) {
        cuerpo.insertAdjacentHTML("beforeend", `
          <article class="regla nivel-${c.regla.nivel}">
            <header><h4>${c.regla.titulo}</h4><span class="nivel">${etiqueta(c.regla.nivel)}</span></header>
            <p>${glosar(c.texto)}</p>
            <footer>${c.implicados.map((it) => `<span class="chip">${it.principio.nombre}</span>`).join("")}</footer>
          </article>`);
      }
      cont.append(sec);
    }
    renderAmbito(cont, res.ambitos.general, null);
  } else if (estado.tab === "interacciones") {
    renderInteracciones(cont, res);
  } else if (estado.tab === "cuando") {
    renderCuando(cont);
  } else if (estado.tab === "plan") {
    renderPlan(cont);
  } else {
    renderAmbito(cont, res.ambitos[estado.tab], null, estado.tab);
  }
  // perfil de señales
  const perfil = Object.entries(res.perfil).filter(([s]) => datos.kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s)).sort((a, b) => b[1].length - a[1].length);
  $("#perfil").innerHTML = "";
  if (perfil.length) {
    const sec = seccion("Efectos que se acumulan", { abierta: false, clave: "perfil", resumen: `${perfil.length} efectos` });
    sec.querySelector(".cuerpo-sec").innerHTML = `<ul>${perfil.map(([s, its]) => `<li><span class="num">${its.length}</span><span>${datos.kb.senales[s]}</span><small>${its.map((i) => i.principio.nombre).join(", ")}</small></li>`).join("")}</ul>`;
    $("#perfil").append(sec);
  }
}

/** Sección plegable del informe. `clave` recuerda si el usuario la abrió o cerró. */
function seccion(titulo, { abierta = true, clave, resumen = "" } = {}) {
  const sec = document.createElement("details");
  sec.className = "seccion";
  if (clave && estado.secciones?.[clave] != null) abierta = estado.secciones[clave];
  if (abierta) sec.open = true;
  sec.innerHTML = `<summary><h3>${titulo}</h3>${resumen ? `<span class="resumen-sec">${resumen}</span>` : ""}<span class="flecha" aria-hidden="true">⌄</span></summary><div class="cuerpo-sec"></div>`;
  if (clave) sec.addEventListener("toggle", () => { (estado.secciones ||= {})[clave] = sec.open; });
  return sec;
}
function resumenNiveles(a, p, i) {
  const partes = [];
  if (a) partes.push(`<b class="t-alerta">${a}</b>`);
  if (p) partes.push(`<b class="t-precaucion">${p}</b>`);
  if (i) partes.push(`<b class="t-info">${i}</b>`);
  return partes.join(" ");
}

function renderAmbito(cont, grupos, titulo, amb) {
  if (!grupos.length) { const sec = document.createElement("section"); sec.innerHTML = `<p class="vacio">${t("inf.sin")}</p>`; cont.append(sec); return; }
  const orden = [...grupos].sort((a, b) => Math.max(...b.reglas.map((r) => ORDEN_NIVEL[r.nivel])) - Math.max(...a.reglas.map((r) => ORDEN_NIVEL[r.nivel])));
  // dividir en "con avisos" (abierto) y "solo información" (plegado)
  const conAvisos = orden.filter((g) => g.reglas.some((r) => r.nivel !== "info"));
  const soloInfo = orden.filter((g) => !g.reglas.some((r) => r.nivel !== "info"));
  const pintar = (sec, lista, abrirTarjetas) => {
    const cuerpo = sec.querySelector(".cuerpo-sec");
    for (const g of lista) cuerpo.insertAdjacentHTML("beforeend", tarjetaFarmaco(g, amb, abrirTarjetas && lista.length <= 4));
    cont.append(sec);
  };
  if (conAvisos.length) {
    const a = conAvisos.reduce((n, g) => n + g.reglas.filter((r) => r.nivel === "alerta").length, 0);
    const p = conAvisos.reduce((n, g) => n + g.reglas.filter((r) => r.nivel === "precaucion").length, 0);
    pintar(seccion(titulo ? `${titulo}: con avisos` : t("inf.con_avisos"), { clave: (amb || "general") + ":avisos", resumen: `${conAvisos.length} fármacos · ${resumenNiveles(a, p, 0)}` }), conAvisos, true);
  }
  if (soloInfo.length) {
    pintar(seccion(titulo ? `${titulo}: ${t("inf.solo_info")}` : t("inf.sin_precauciones"), { abierta: !conAvisos.length, clave: (amb || "general") + ":info", resumen: `${soloInfo.length} fármacos · ${resumenNiveles(0, 0, soloInfo.reduce((n, g) => n + g.reglas.length, 0))}` }), soloInfo, false);
  }
}

/** Enlace a la ficha técnica: directo (fichas.json, del nomenclátor) o búsqueda en CIMA. */
function urlFicha(principio) {
  return principio.ficha || datos.fichas?.[principio.id] || "https://cima.aemps.es/cima/publico/lista.html";
}
function tieneFicha(principio) { return !!(principio.ficha || datos.fichas?.[principio.id]); }
/** Enlace a la ficha técnica: directo (PDF de la AEMPS) o, si aún no se ha generado fichas.json, al buscador de CIMA. */
function enlaceFicha(principio, extra = "") {
  return tieneFicha(principio)
    ? `<a class="enlace-ft" href="${urlFicha(principio)}" target="_blank" rel="noopener">${t("inf.ficha")}${extra}</a>`
    : `<a class="enlace-ft" href="https://cima.aemps.es/cima/publico/lista.html" target="_blank" rel="noopener" title="${t("inf.ficha.buscar.t", { n: nombreCorto(principio) })}">${t("inf.ficha.buscar", { n: nombreCorto(principio) })}${extra}</a>`;
}
function fraseCorta(txt, max = 120) {
  const f = (txt || "").split(/(?<=[.!?])\s+/)[0] || "";
  return f.length > max ? f.slice(0, max - 1).trimEnd() + "…" : f;
}

function tarjetaFarmaco(g, amb, abierta) {
  {
    const it = g.item;
    const max = g.reglas.reduce((m, r) => (ORDEN_NIVEL[r.nivel] > ORDEN_NIVEL[m] ? r.nivel : m), "info");
    const dosis = it.dosisTotal != null ? `${it.dosisTotal} ${it.unidad}${it.esDiaria ? "/día" : ""}` : "";
    return `
      <details class="farmaco nivel-${max}"${abierta ? " open" : ""}>
        <summary>
          <span class="barra"></span>
          ${iconoGrupo(it.clase)}
          <span class="txt"><h4>${it.principio.nombre}</h4><small>${it.clase.nombre}${dosis ? " · " + dosis : ""}${it.dosisCat === "alta" ? ` · <b>${t("inf.dosis_alta")}</b>` : ""}</small>${max !== "info" ? `<span class="una-frase">${fraseCorta(g.reglas.find((r) => r.nivel === max)?.texto)}</span>` : ""}</span>
          <span class="nivel">${etiqueta(max)}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </summary>
        <div class="cuerpo">
          ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
          ${it.principio.sintetico && !amb ? `<p class="resumen-clase"><em>${it.principio.nota}</em></p>` : ""}
          <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${glosar(r.texto)}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""} <span class="estado-regla ${r.revisado ? "ok" : ""}" title="${r.revisado ? t("regla.revisada.t") : t("regla.borrador.t")}">${r.revisado ? t("regla.revisada") : t("regla.borrador")}</span> <span class="evidencia ev-${nivelEvidencia(r)}" title="${t("ev.titulo")}">${t("ev." + nivelEvidencia(r))}</span>${r.fuente ? ` <small class="fuente-regla">${seccionFT(r) && tieneFicha(it.principio) ? `<a href="${urlFicha(it.principio)}" target="_blank" rel="noopener">${r.fuente}</a>` : r.fuente}</small>` : ""}</span></li>`).join("")}</ul>
          <p class="fuentes">${it.clase.fuentes?.length ? `${t("inf.fuentes")}: ${it.clase.fuentes.join(" · ")} · ` : ""}${enlaceFicha(it.principio)}</p>
        </div>
      </details>`;
  }
}

/* ---------- pestaña «Mi plan»: semana, objetivo, sesión de hoy, progresión ---------- */
let diaPlan = null; // día seleccionado en la tira semanal (ISO)
function lunesDe(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function anillo(pct, texto, sub) {
  const r = 34, c = 2 * Math.PI * r, p = Math.min(1, Math.max(0, pct));
  return `<svg class="anillo" viewBox="0 0 90 90" role="img" aria-label="${texto} ${sub}"><circle cx="45" cy="45" r="${r}" class="fondo"/><circle cx="45" cy="45" r="${r}" class="valor" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 45 45)"/><text x="45" y="43" text-anchor="middle" class="num">${texto}</text><text x="45" y="58" text-anchor="middle" class="sub">${sub}</text></svg>`;
}
/** Tendencia de las últimas 8 semanas (barras) y comparación con la semana anterior. */
function tendenciaSemanas(diario, objMin) {
  const sem = minutosPorSemana(diario, 8);
  if (!sem.some((x) => x.min)) return "";
  const max = Math.max(objMin, ...sem.map((x) => x.min));
  const act = sem[sem.length - 1].min, ant = sem[sem.length - 2]?.min || 0;
  const dif = act - ant;
  const txt = !ant && act ? t("tend.primera") : dif > 0 ? t("tend.mas", { n: dif }) : dif < 0 ? t("tend.menos", { n: -dif }) : t("tend.igual");
  const yObj = 30 - Math.round((objMin / max) * 26);
  return `<div class="tend-cab"><small>${t("tend.titulo")}</small><span class="${dif > 0 ? "t-ok" : dif < 0 ? "t-menos" : ""}">${txt}</span></div>
    <svg class="tend" viewBox="0 0 168 36" role="img" aria-label="${t("tend.titulo")}: ${sem.map((x) => x.min).join(", ")} min">${sem.map((x, i) => { const h = Math.round((x.min / max) * 26); return `<rect x="${i * 21 + 3}" y="${30 - h}" width="15" height="${Math.max(h, 2)}" rx="3" class="${x.min >= objMin ? "obj" : x.min ? "con" : "sin"}"${i === sem.length - 1 ? ' opacity=".55"' : ""}><title>${x.desde}: ${x.min} min</title></rect>`; }).join("")}<line x1="2" x2="166" y1="${yObj}" y2="${yObj}" class="linea-obj"/></svg>`;
}
/** Variante elegida de cada ejercicio (más fácil / normal / más difícil), por nombre, en este dispositivo. */
function leerVariantes() { try { return JSON.parse(localStorage.getItem("medex.variantes") || "{}"); } catch { return {}; } }
function bloqueHtml(b, i, { grande = false } = {}) {
  const v = leerVariantes()[b.nombre] || "normal";
  const detalle = v === "facil" && b.facil ? b.facil : v === "dificil" && b.dificil ? b.dificil : b.detalle;
  const botones = b.facil || b.dificil ? `<span class="variantes" role="group" aria-label="${t("ej.variante")}">${["facil", "normal", "dificil"].filter((k) => k === "normal" || b[k]).map((k) => `<button type="button" data-v="${k}" data-ej="${b.nombre}" aria-pressed="${v === k}">${t("ej." + k)}</button>`).join("")}</span>` : "";
  const cuerpo = `<b>${b.nombre}</b>${grande ? ` <em>${b.min}′</em>` : ""}<br><small class="detalle">${detalle}</small>${b.clave ? `<br><small class="clave">${t("ej.clave")}: ${b.clave}</small>` : ""}${botones}`;
  return grande
    ? `<li><label><input type="checkbox" data-i="${i}">${picto(b.pict)}<span>${cuerpo}</span></label></li>`
    : `<li><span class="min">${b.min}′</span>${picto(b.pict)}<span>${cuerpo}</span></li>`;
}
function activarVariantes(raiz) {
  raiz.querySelectorAll(".variantes button").forEach((btn) => btn.addEventListener("click", (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    const vs = leerVariantes(); if (btn.dataset.v === "normal") delete vs[btn.dataset.ej]; else vs[btn.dataset.ej] = btn.dataset.v;
    try { localStorage.setItem("medex.variantes", JSON.stringify(vs)); } catch {}
    const li = btn.closest("li"); const grupo = li.querySelector(".variantes");
    grupo.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
    const ses = li.closest("[data-sesion]"); // en la sesión guiada no se vuelve a pintar todo
    if (ses) { const b = JSON.parse(ses.dataset.sesion).find((x) => x.nombre === btn.dataset.ej); if (b) li.querySelector(".detalle").textContent = btn.dataset.v === "facil" ? b.facil : btn.dataset.v === "dificil" ? b.dificil : b.detalle; }
    else render();
  }));
}
function renderPlan(cont) {
  const diario = leerDiario();
  const fragil = esFragil();
  const obj = objetivoSemanal({ fragil });
  const lunes = lunesDe();
  const hoy = hoyISO();
  const dias = [...Array(7)].map((_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });
  const semana = diario.filter((x) => { const d = new Date(x.fecha + "T12:00"); return d >= lunes && d < new Date(lunes.getTime() + 7 * 864e5); });
  const minSem = semana.reduce((n, x) => n + (x.min || 0), 0), nSem = semana.length;
  const racha = rachaSemanas(diario, obj.min);
  const prog = progresion(diario);
  if (!diaPlan) diaPlan = hoy;
  const sel = dias.find((d) => hoyISO(d) === diaPlan) || new Date();
  const plan = planActual();
  const tipoSel = plan[sel.getDay()] || "descanso";
  const hechoSel = diario.filter((x) => x.fecha === hoyISO(sel));
  const ses = tipoSel === "descanso" ? null : sesionTipo(tipoSel, { fragil, minutosAer: fragil ? 10 : 30 });
  const res = evaluar(datos, medsActivos(), ctxActual());
  const P = prescripcion(res, ctxActual());
  const fmtDia = (d) => d.toLocaleDateString(idioma(), { weekday: "short" }).replace(".", "");
  const sec = document.createElement("section"); sec.className = "plan";
  sec.innerHTML = `
    <div class="plan-cab">
      ${anillo(minSem / obj.min, `${minSem}`, `/ ${obj.min} min`)}
      <div class="plan-obj">
        <h3>${t("plan.objetivo")}</h3>
        <p>${t("plan.objetivo_txt", { m: obj.min, s: obj.sesiones })}</p>
        <p class="plan-racha">${racha ? t("plan.racha", { n: racha }) : t("plan.racha0")} · ${nSem} ${t("hoy.sesiones")} ${t("hoy.esta_semana")}</p>
      </div>
    </div>
    <div class="tendencia">${tendenciaSemanas(diario, obj.min)}</div>
    <details class="bloque mis-dias"${estado.secciones?.misdias ? " open" : ""}><summary><span class="sub-label">${t("plan.dias")} <span class="dias-resumen">· ${[1, 2, 3, 4, 5, 6, 0].filter((d) => estado.plan.dias.includes(d)).map((d) => new Date(2024, 0, 7 + d).toLocaleDateString(idioma(), { weekday: "narrow" })).join(" ")}</span></span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <div class="dias-chips" role="group" aria-label="${t("plan.dias")}">${[1, 2, 3, 4, 5, 6, 0].map((d) => { const on = estado.plan.dias.includes(d); const nombre = new Date(2024, 0, 7 + d).toLocaleDateString(idioma(), { weekday: "short" }).replace(".", ""); return `<button type="button" class="chip chip-btn${on ? " activo" : ""}" data-dia="${d}" aria-pressed="${on}">${nombre}</button>`; }).join("")}<button type="button" class="btn-sec sm" data-dias="tipo">${t("plan.restablecer")}</button></div>
      <small>${t("plan.dias_nota")}</small>
    </details>
    <div class="tira" role="group" aria-label="${t("hoy.esta_semana")}">${dias.map((d) => { const iso = hoyISO(d); const tipo = plan[d.getDay()] || "descanso"; const hecho = diario.some((x) => x.fecha === iso); const clase = ["dia", iso === hoy ? "hoy" : "", iso === diaPlan ? "sel" : "", hecho ? "hecho" : "", tipo === "descanso" ? "descanso" : ""].filter(Boolean).join(" "); return `<button type="button" class="${clase}" data-iso="${iso}" aria-pressed="${iso === diaPlan}"><span class="d">${fmtDia(d)}</span><span class="n">${d.getDate()}</span>${icono({ aerobico: "aerobico", fuerza: "fuerza", fuerza_eq: "fuerza", descanso: "paseo" }[tipo] || "fuerza")}<span class="tipo">${{ aerobico: t("sesion.aerobico"), fuerza: t("sesion.fuerza"), fuerza_eq: t("plan.fuerza_eq_corto"), descanso: t("plan.descanso_corto") }[tipo]}</span>${hecho ? `<span class="ok">✓</span>` : ""}</button>`; }).join("")}</div>
    <div class="plan-dia">
      <div class="plan-dia-cab"><h3>${sel.toLocaleDateString(idioma(), { weekday: "long", day: "numeric", month: "long" })}${hoyISO(sel) === hoy ? ` · ${t("hoy.titulo").toLowerCase()}` : ""}</h3>${hechoSel.length ? `<span class="chip chip-ok">${t("plan.hecho", { m: hechoSel.reduce((n, x) => n + (x.min || 0), 0) })}</span>` : ""}</div>
      ${ses ? `
        <p class="plan-dia-tit"><b>${ses.titulo}</b> · ${ses.min} min</p>
        <ol class="bloques con-picto">${ses.bloques.map((b, i) => bloqueHtml(b, i)).join("")}</ol>
        <p class="plan-fitt">${glosar(tipoSel === "aerobico" ? P.aer.int : P.fue.int)}</p>
        <div class="acciones"><button type="button" class="btn" id="btn-sesion">${hoyISO(sel) === hoy ? t("plan.empezar") : t("plan.ver_sesion")}</button><button type="button" class="btn-sec" id="btn-marcar">${t("plan.marcar")}</button></div>`
      : `<p class="vacio">${t("plan.descanso_txt")}</p>`}
    </div>
    <div class="plan-prog ${prog.clave}"><b>${t("prog.titulo")}</b> ${t("prog." + prog.clave, { n: prog.n, r: prog.rpe || "" })}</div>
    <div class="acciones"><button type="button" class="btn-sec sm" id="btn-cal2">${icono("calendario")} ${t("plan.calendario")}</button><button type="button" class="btn-sec sm" id="btn-semana-wa">${icono("whatsapp")} ${t("plan.compartir_semana")}</button><button type="button" class="btn-sec sm" id="btn-diario-csv">${icono("guardar")} ${t("diario.csv")}</button></div>
    <p class="esencial-nota">${t("plan.nota")}</p>`;
  cont.append(sec);
  sec.querySelectorAll(".tira .dia").forEach((b) => b.addEventListener("click", () => { diaPlan = b.dataset.iso; render(); }));
  sec.querySelectorAll(".dias-chips [data-dia]").forEach((b) => b.addEventListener("click", () => {
    const d = Number(b.dataset.dia); const set = new Set(estado.plan.dias);
    if (set.has(d)) { if (set.size === 1) { toast(t("plan.dias_min"), { ms: 3000 }); return; } set.delete(d); } else set.add(d);
    estado.plan = { dias: [...set] }; guardar(); render();
  }));
  sec.querySelector(".mis-dias").addEventListener("toggle", (ev) => { (estado.secciones ||= {}).misdias = ev.target.open; });
  sec.querySelector('[data-dias="tipo"]').addEventListener("click", () => { estado.plan = { dias: [1, 2, 3, 4, 5, 6] }; guardar(); render(); });
  sec.querySelector("#btn-diario-csv").addEventListener("click", exportarDiarioCsv);
  activarVariantes(sec);
  sec.querySelector("#btn-sesion")?.addEventListener("click", () => abrirSesion(tipoSel, hoyISO(sel)));
  sec.querySelector("#btn-marcar")?.addEventListener("click", () => { registrarSesion({ fecha: hoyISO(sel), tipo: tipoSel === "fuerza_eq" ? "fuerza" : tipoSel, min: ses.min, rpe: 5, sintomas: [] }); celebrar(); });
  sec.querySelector("#btn-cal2").addEventListener("click", () => $("#btn-calendario").click());
  sec.querySelector("#btn-semana-wa").addEventListener("click", async () => {
    const txt = `*${t("meta.titulo")}* · ${t("plan.semana_txt", { n: nSem, m: minSem, o: obj.min })}${racha ? " · " + t("plan.racha", { n: racha }) : ""}\n${dias.map((d) => `${fmtDia(d)} ${diario.some((x) => x.fecha === hoyISO(d)) ? "✅" : (plan[d.getDay()] === "descanso" ? "—" : "·")}`).join("  ")}\n${t("compartir.pie")}`;
    if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch {} }
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
  });
}
function registrarSesion(x) {
  const d = leerDiario(); d.push({ id: Date.now().toString(36), ...x }); escribirDiario(d); render();
}
function celebrar() {
  toast(`<span class="celebra">✓</span> ${t("hoy.guardado")}`, { ms: 5000 });
}

/* ---------- sesión guiada: chequeo previo, bloques con cronómetro, en grande ---------- */
let cronometro = null, cronoInicio = 0;
function abrirSesion(tipo, fecha = hoyISO()) {
  const ses = sesionTipo(tipo, { fragil: esFragil(), minutosAer: esFragil() ? 10 : 30 });
  const dlg = $("#sesion");
  const res = evaluar(datos, medsActivos(), ctxActual());
  const chequeo = chequeoPrevio(res, ctxActual());
  const cs = constantesRelevantes(res, ctxActual());
  let chequeoClave = "sin";
  const cuerpo = $("#sesion-cuerpo");
  // Fase 1: chequeo previo (marque lo que se cumple hoy)
  cuerpo.innerHTML = `
    <h2>${ses.titulo} <small>· ${ses.min} min</small></h2>
    <section class="chequeo" id="chequeo">
      <h3>${t("chequeo.titulo")}</h3>
      <p class="muted">${t("chequeo.intro")}</p>
      <ul>${chequeo.map((c) => `<li class="nivel-${c.nivel === "rojo" ? "alerta" : "precaucion"}"><label><input type="checkbox" data-id="${c.id}"><span>${c.texto}${c.farmacos.length ? ` <small>(${t("chequeo.por", { f: c.farmacos.join(", ") })})</small>` : ""}</span></label></li>`).join("")}</ul>
      <div id="chequeo-resultado" class="chequeo-resultado" hidden></div>
      <div class="acciones"><button type="button" class="btn" id="chequeo-continuar">${t("chequeo.continuar")}</button><button type="button" class="btn-sec sm" id="chequeo-saltar">${t("chequeo.saltar")}</button></div>
    </section>`;
  const faseSesion = (suave) => {
    cuerpo.innerHTML = `
      <h2>${ses.titulo} <small>· ${ses.min} min</small></h2>
      ${suave ? `<p class="chequeo-aviso">${t("chequeo.suave_banner")}</p>` : ""}
      <div class="crono">${anilloCrono(0)}<span id="crono">00:00</span><button type="button" class="btn sm" id="crono-btn">${t("sesion.iniciar")}</button></div>
      <ol class="bloques grande con-picto" data-sesion='${JSON.stringify(ses.bloques.map((b) => ({ nombre: b.nombre, detalle: b.detalle, facil: b.facil, dificil: b.dificil }))).replace(/'/g, "&#39;")}'>${ses.bloques.map((b, i) => bloqueHtml(b, i, { grande: true })).join("")}</ol>
      <details class="alarma"><summary><span class="sub-label">${t("alarma.titulo")}</span><span class="flecha" aria-hidden="true">⌄</span></summary><ul>${ALARMA.map((a) => `<li>${a}</li>`).join("")}</ul></details>
      <div class="sesion-fin">
        <label>${t("hoy.rpe")} <input type="range" id="sesion-rpe" min="1" max="10" value="5"><output>5</output></label>
        ${cs.length ? `<form id="sesion-const" class="registro">${camposConstantes()}</form>` : ""}
        <button type="button" class="btn" id="sesion-terminar">${t("sesion.terminar")}</button>
      </div>`;
    activarVariantes(cuerpo);
    cuerpo.querySelectorAll(".bloques input[type=checkbox]").forEach((c) => c.addEventListener("change", () => { if (c.checked) vibrar(15); }));
    $("#sesion-rpe").addEventListener("input", (ev) => { ev.target.nextElementSibling.textContent = ev.target.value; });
    const pintar = () => {
      const seg = Math.floor((Date.now() - cronoInicio) / 1000);
      $("#crono").textContent = `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
      const c = cuerpo.querySelector(".anillo-crono .valor"); if (c) c.setAttribute("stroke-dasharray", `${(Math.min(1, seg / (ses.min * 60)) * 113.1).toFixed(1)} 113.1`);
    };
    $("#crono-btn").addEventListener("click", () => {
      if (cronometro) { clearInterval(cronometro); cronometro = null; $("#crono-btn").textContent = t("sesion.reanudar"); cronoPausa = Date.now(); return; }
      cronoInicio = cronoInicio ? cronoInicio + (Date.now() - cronoPausa) : Date.now();
      cronometro = setInterval(pintar, 500); $("#crono-btn").textContent = t("sesion.pausar"); vibrar(10);
    });
    $("#sesion-terminar").addEventListener("click", () => {
      const seg = cronoInicio ? Math.round((Date.now() - cronoInicio) / 1000) : 0;
      const min = seg >= 120 ? Math.round(seg / 60) : ses.min;
      const fc = $("#sesion-const"); const konst = fc ? leerConstantes(new FormData(fc)) : undefined;
      registrarSesion({ fecha, tipo: tipo === "fuerza_eq" ? "fuerza" : tipo, min, rpe: parseInt($("#sesion-rpe").value, 10) || 5, sintomas: [], const: konst, chequeo: chequeoClave });
      cerrarSesion(); celebrar(); vibrar([20, 60, 20]);
    });
  };
  const evaluarChequeo = () => {
    const marcados = [...cuerpo.querySelectorAll("#chequeo input:checked")].map((x) => x.dataset.id);
    const v = veredictoChequeo(chequeo, marcados);
    chequeoClave = v.clave;
    const box = $("#chequeo-resultado"); box.hidden = false; box.className = "chequeo-resultado r-" + v.clave;
    if (v.clave === "ok") { faseSesion(false); return; }
    box.innerHTML = `<p><b>${v.clave === "no" ? t("chequeo.no") : t("chequeo.suave")}</b></p><ul>${v.faltan.map((c) => `<li>${c.consejo}</li>`).join("")}</ul>${v.clave === "suave" ? `<button type="button" class="btn sm" id="chequeo-seguir">${t("chequeo.seguir_suave")}</button>` : `<button type="button" class="btn-sec sm" id="chequeo-cerrar">${t("ficha.cerrar")}</button>`}`;
    $("#chequeo-seguir")?.addEventListener("click", () => faseSesion(true));
    $("#chequeo-cerrar")?.addEventListener("click", cerrarSesion);
    box.scrollIntoView({ block: "nearest" });
  };
  $("#chequeo-continuar").addEventListener("click", evaluarChequeo);
  $("#chequeo-saltar").addEventListener("click", () => { chequeoClave = "saltado"; faseSesion(false); });
  cronoInicio = 0; cronometro = null;
  dlg.showModal();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then((w) => { dlg.__wake = w; }).catch(() => {}); } catch {}
}
/** Anillo de progreso del cronómetro respecto a la duración prevista (r = 18 → perímetro 113,1). */
function anilloCrono(p) { return `<svg class="anillo-crono" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" class="fondo"/><circle cx="22" cy="22" r="18" class="valor" stroke-dasharray="${(p * 113.1).toFixed(1)} 113.1" transform="rotate(-90 22 22)"/></svg>`; }
let cronoPausa = 0;
function cerrarSesion() { clearInterval(cronometro); cronometro = null; cronoInicio = 0; const dlg = $("#sesion"); dlg.__wake?.release?.(); dlg.close(); }
$("#sesion-cerrar").addEventListener("click", cerrarSesion);
$("#sesion").addEventListener("cancel", (ev) => { ev.preventDefault(); cerrarSesion(); });

function renderCuando(cont) {
  const v = ventanaEntrenamiento(indice, medsActivos(), estado.horas);
  const sec = document.createElement("section");
  const hh = (h) => `${String(h).padStart(2, "0")}:00`;
  const conInfo = v.motivos.length || v.avisos.length;
  sec.innerHTML = `
    <p class="intro-cuando">${conInfo ? t("cuando.intro") : "Ninguno de sus fármacos condiciona la hora de entrenar. Elija el momento del día que mejor le encaje; lo importante es la constancia."}</p>
    <div class="timeline" role="img" aria-label=t("cuando.titulo")>${v.horas.map((x) => `<div class="hora nivel-${x.nivel}" title="${hh(x.h)}${x.motivos.length ? ": " + x.motivos.map((m) => m.farmaco + " (" + m.motivo + ")").join("; ") : ""}"><span>${x.h % 3 === 0 ? x.h : ""}</span></div>`).join("")}</div>
    ${v.mejores.length ? `<p class="mejores">Mejores momentos: ${v.mejores.map((f) => `<b>${hh(f.desde)}–${hh(f.hasta)}</b>`).join(" y ")}</p>` : ""}
    <details class="bloque" open><summary><span class="sub-label">Hora de sus tomas</span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <div class="fila horas-tomas">${MOMENTOS.map((m) => `<label>${MOMENTO_TXT[m]} <input type="number" min="0" max="23" inputmode="numeric" data-hora="${m}" value="${estado.horas[m]}"></label>`).join("")}</div>
      <small>Marque en la lista de medicación (D / C / Ce / N) en qué tomas va cada fármaco.</small>
    </details>
    ${v.motivos.length ? `<h3>${t("cuando.porque")}</h3><ul class="motivos">${v.motivos.sort((a, b) => a.desde - b.desde).map((m) => `<li class="nivel-${m.nivel}"><span class="punto"></span><span><b>${hh(m.desde)}–${hh(m.hasta)}</b> · ${m.farmaco} (toma de ${MOMENTO_TXT[m.momento].toLowerCase()}): ${m.motivo}</span></li>`).join("")}</ul>` : ""}
    ${v.avisos.length ? `<ul class="motivos">${v.avisos.map((a) => `<li class="nivel-${a.nivel}"><span class="punto"></span><span>${a.farmaco}: ${a.motivo}</span></li>`).join("")}</ul>` : ""}
    <p class="nota-fuentes">Las ventanas se calculan a partir del inicio y el pico de acción habituales de cada fármaco y de la hora de las tomas que indique. Son orientativas: la respuesta individual varía y, si su médico le ha dado una pauta concreta, siga la suya.</p>`;
  sec.querySelectorAll("[data-hora]").forEach((inp) => inp.addEventListener("change", () => { const v = parseInt(inp.value, 10); if (v >= 0 && v <= 23) { estado.horas[inp.dataset.hora] = v; guardar(); render(); } }));
  cont.append(sec);
}

function renderInteracciones(cont, res) {
  const sec = document.createElement("section");
  if (!res.interacciones.length) {
    sec.innerHTML = `<p class="vacio">${t("ddi.ninguna")}</p>`;
  } else {
    for (const x of res.interacciones) {
      sec.insertAdjacentHTML("beforeend", `
        <article class="ddi ddi-${x.nivel}">
          <header><h4>${x.a.principio.nombre} <span class="mas">+</span> ${x.b.principio.nombre}</h4><span class="nivel">${datos.ddiCurado.niveles?.[x.nivel] || x.nivel}</span></header>
          <p>${x.efecto}</p>
          ${x.accion ? `<p class="accion"><b>${t("ddi.que_hacer")}:</b> ${x.accion}</p>` : ""}
          <footer>${x.fuente === "curada" ? t("ddi.fuente_propia") : x.fuente === "ddinter" ? `${t("ddi.ddinter")} · ${enlaceFicha(x.a.principio, " " + nombreCorto(x.a.principio))} · ${enlaceFicha(x.b.principio, " " + nombreCorto(x.b.principio))}` : t("ddi.duplicidad")}</footer>
        </article>`);
    }
  }
  const fuentes = [`${datos.ddiCurado.interacciones.length} ${t("ddi.revisadas")}`];
  if (datos.ddi?.pares?.length) fuentes.push(`DDInter 2.0 (${datos.ddi.pares.length.toLocaleString("es")} pares, ${datos.ddi.version})`);
  else fuentes.push("DDInter 2.0 pendiente de cargar");
  sec.insertAdjacentHTML("beforeend", `<p class="nota-fuentes">${t("ddi.nota", { n: fuentes.join(" · ") })}</p>`);
  cont.append(sec);
}


/* ---------- código QR con el enlace de la lista (para pasarla entre móvil y consulta) ---------- */
$("#btn-qr").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#lista=${codificarEstado()}`;
  try {
    if (!window.qrcode) await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js");
    const q = window.qrcode(0, "M"); q.addData(url); q.make();
    const dlg = $("#qr");
    $("#qr-cuerpo").innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    dlg.showModal();
  } catch (e) { toast(t("qr.error"), { ms: 5000 }); }
});
$("#qr-cerrar").addEventListener("click", () => $("#qr").close());
$("#qr").addEventListener("click", (ev) => { if (ev.target === $("#qr")) $("#qr").close(); });

/* ---------- copia de seguridad de las listas guardadas ---------- */
$("#btn-exportar").addEventListener("click", () => {
  const lista = leerPerfiles();
  if (!lista.length) { toast(t("perf.vacio"), { ms: 3000 }); return; }
  const blob = new Blob([JSON.stringify({ app: "medicacion-y-ejercicio", version: datos.kb.version, fecha: new Date().toISOString(), listas: lista }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `listas-medicacion-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(t("perf.exportado", { n: lista.length }), { ms: 4000 });
});
$("#btn-importar-listas").addEventListener("click", () => $("#importar-listas-input").click());
$("#importar-listas-input").addEventListener("change", async (ev) => {
  const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    const nuevas = (d.listas || []).filter((x) => x && x.nombre && x.estado?.meds);
    if (!nuevas.length) throw new Error("vacío");
    const actuales = leerPerfiles(); const ids = new Set(actuales.map((x) => x.id));
    for (const n of nuevas) if (!ids.has(n.id)) actuales.push(n);
    escribirPerfiles(actuales); renderPerfiles();
    toast(t("perf.importado", { n: nuevas.length }), { ms: 4000 });
  } catch { toast(t("perf.importar_error"), { ms: 5000 }); }
});

/* ---------- atajos de teclado (ordenador) ---------- */
document.addEventListener("keydown", (ev) => {
  const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if (ev.key === "/" && !enCampo) { ev.preventDefault(); inputBuscar.focus(); inputBuscar.select(); }
  else if (ev.key === "?" && !enCampo) { ev.preventDefault(); toast(t("atajos.lista"), { ms: 9000 }); }
  else if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter" && estado.meds.length) { ev.preventDefault(); desplazar($("#informe")); }
  else if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === "p" && estado.meds.length) { ev.preventDefault(); descargarPdf(estado.modo === "paciente" ? "paciente" : "medico"); }
});
// flechas en las sugerencias
inputBuscar.addEventListener("keydown", (ev) => {
  if (lista.hidden) return;
  const items = [...lista.querySelectorAll("li")]; if (!items.length) return;
  let i = items.findIndex((x) => x.classList.contains("activa"));
  if (ev.key === "ArrowDown") { ev.preventDefault(); i = (i + 1) % items.length; }
  else if (ev.key === "ArrowUp") { ev.preventDefault(); i = (i - 1 + items.length) % items.length; }
  else if (ev.key === "Enter" && i >= 0) { ev.preventDefault(); ev.stopImmediatePropagation(); items[i].click(); return; }
  else return;
  items.forEach((x, k) => x.classList.toggle("activa", k === i)); items[i].scrollIntoView({ block: "nearest" });
}, true);

/* ---------- errores inesperados: aviso y botón para informar, nunca una pantalla en blanco ---------- */
let ultimoError = 0;
function informarError(msg) {
  if (Date.now() - ultimoError < 5000) return; ultimoError = Date.now();
  const txt = String(msg || "").slice(0, 200);
  try { localStorage.setItem("medex.ultimoerror", `${new Date().toISOString()} ${txt}`); } catch {}
  toast(t("error.inesperado"), { accion: t("error.informar"), onAccion: () => window.open(urlSugerencia({ lista: "ERROR: " + txt }), "_blank", "noopener"), ms: 12000 });
}
window.addEventListener("error", (e) => informarError(e.message));
window.addEventListener("unhandledrejection", (e) => informarError(e.reason?.message || e.reason));

/* ---------- cribado preparticipación (ACSM 2015) ---------- */
const ETIQUETAS_CTX = { renal: "enfermedad renal", renal_grave: "FG < 30", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", marcapasos: "marcapasos/DAI", diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno", embarazo: "embarazo/lactancia" };
$("#crib-sintomas").innerHTML = SINTOMAS_ACSM.map((x) => `<label class="check"><input type="checkbox" data-crib-sint="${x.id}"> <span>${x.texto}</span></label>`).join("");
function pintarCribadoForm() {
  const c = estado.cribado || {};
  $$('input[name="crib-regular"]').forEach((r) => { r.checked = c.regular != null && String(Number(c.regular)) === r.value; });
  $$('input[name="crib-enfermedad"]').forEach((r) => { r.checked = c.enfermedad != null && String(Number(c.enfermedad)) === r.value; });
  $$("[data-crib-sint]").forEach((x) => { x.checked = (c.sintomas || []).includes(x.dataset.cribSint); });
}
function leerCribadoForm() {
  const v = (n) => { const r = $(`input[name="${n}"]:checked`); return r ? r.value === "1" : null; };
  estado.cribado = { regular: v("crib-regular"), enfermedad: v("crib-enfermedad"), sintomas: $$("[data-crib-sint]:checked").map((x) => x.dataset.cribSint) };
  guardar(); render();
}
$$('input[name="crib-regular"], input[name="crib-enfermedad"], [data-crib-sint]').forEach((el) => el.addEventListener("change", leerCribadoForm));
/** Resultado del cribado para el estado actual (y sugerencia de enfermedad conocida a partir de la lista). */
function cribadoActual(res) {
  const sug = enfermedadSugerida(res, ctxActual());
  const r = cribadoACSM(estado.cribado);
  return { ...r, texto: CRIBADO_TXT[r.clave], sugerencia: sug };
}
function renderCribado(res) {
  const c = cribadoActual(res);
  const sug = $("#crib-sugerencia");
  if (c.sugerencia.sugerida && estado.cribado.enfermedad == null) { sug.hidden = false; sug.textContent = t("crib.sugerencia", { q: [...c.sugerencia.porCond.map((k) => ETIQUETAS_CTX[k] || k), ...c.sugerencia.porMeds].slice(0, 4).join(", ") }); }
  else sug.hidden = true;
  const chip = $("#crib-estado"); const out = $("#crib-resultado");
  if (c.clave === "sin_datos") { chip.hidden = true; out.hidden = true; return; }
  chip.hidden = false; chip.className = "chip chip-crib crib-" + c.nivel; chip.textContent = t("crib.chip." + c.clave);
  out.hidden = false; out.className = "crib-resultado nivel-" + c.nivel; out.textContent = c.texto;
}

/* ---------- prescriptor (solo en este dispositivo) y reevaluación ---------- */
const PRESC = ["nombre", "especialidad", "centro", "colegiado", "revision"];
function leerPrescriptor() { try { return JSON.parse(localStorage.getItem("medex.prescriptor") || "{}"); } catch { return {}; } }
function escribirPrescriptor(p) { try { localStorage.setItem("medex.prescriptor", JSON.stringify(p)); } catch {} }
function prescriptorActual() { const p = leerPrescriptor(); return { nombre: (p.nombre || "").slice(0, 60), especialidad: (p.especialidad || "").slice(0, 60), centro: (p.centro || "").slice(0, 80), colegiado: (p.colegiado || "").slice(0, 20), revision: [4, 6, 8, 12].includes(Number(p.revision)) ? Number(p.revision) : 6 }; }
{
  const p = prescriptorActual();
  for (const k of PRESC) { const el = $("#presc-" + k); if (el) { el.value = p[k] ?? ""; el.addEventListener("change", () => { const q = prescriptorActual(); q[k] = k === "revision" ? Number(el.value) : el.value.trim(); escribirPrescriptor(q); }); } }
}
$("#btn-prescrito").addEventListener("click", () => { estado.prescrito = { fecha: Date.now(), semanas: prescriptorActual().revision }; guardar(); pintarReeval(); toast(t("presc.marcado", { d: fechaReeval().toLocaleDateString(idioma()) }), { ms: 5000 }); });
function fechaReeval() { const d = new Date(estado.prescrito.fecha); d.setDate(d.getDate() + estado.prescrito.semanas * 7); return d; }
function pintarReeval() {
  const b = $("#aviso-reeval"); const e = $("#presc-estado");
  if (!estado.prescrito) { b.hidden = true; if (e) e.textContent = ""; return; }
  const f = fechaReeval(); const dias = Math.round((f - Date.now()) / 864e5);
  if (e) e.textContent = t("presc.estado", { d: new Date(estado.prescrito.fecha).toLocaleDateString(idioma()), r: f.toLocaleDateString(idioma()) });
  b.hidden = dias > 0;
  if (dias <= 0) b.innerHTML = `${t("presc.toca", { d: f.toLocaleDateString(idioma()) })} <button type="button" class="btn-sec sm" id="btn-reeval-ok">${t("presc.reevaluado")}</button>`;
  $("#btn-reeval-ok")?.addEventListener("click", () => { estado.prescrito = null; guardar(); pintarReeval(); });
}

/* ---------- casos: exportar / importar (JSON anonimizado con huella), lista en CSV, caso de prueba ---------- */
async function huella(txt) { try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16); } catch { return "sin-huella"; } }
function casoActual() {
  return { meds: estado.meds.map((m) => (m.libre ? { libre: true, nombre: m.nombre, dosis: m.dosis, tomas: m.tomas } : { pid: m.pid, dosis: m.dosis, tomas: m.tomas, unidad: m.unidad, momentos: m.momentos, aDemanda: !!m.aDemanda, pausado: !!m.pausado })),
    edad: estado.edad, caidas: estado.caidas, condiciones: [...estado.condiciones], pac: { ...estado.pac }, pro: { ...estado.pro }, horas: { ...estado.horas }, plan: sanearPlan(estado.plan), cribado: sanearCribado(estado.cribado), modo: estado.modo };
}
function descargarTexto(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$("#btn-caso-exportar").addEventListener("click", async () => {
  if (!estado.meds.length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  const caso = casoActual(); const cuerpo = JSON.stringify(caso);
  const doc = { app: "pauta-activa", formato: 1, version_app: APP_VERSION, version_base: datos.kb.version, fecha: new Date().toISOString().slice(0, 10), huella: await huella(cuerpo + datos.kb.version), caso };
  descargarTexto(`caso-${doc.fecha}-${doc.huella.slice(0, 6)}.json`, JSON.stringify(doc, null, 1), "application/json");
  toast(t("caso.exportado"), { ms: 4000 });
});
$("#btn-caso-importar").addEventListener("click", () => $("#caso-input").click());
$("#caso-input").addEventListener("change", async (ev) => {
  const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    const c = d.caso || d; if (!Array.isArray(c.meds)) throw new Error("formato");
    const integra = d.huella ? (await huella(JSON.stringify(c) + d.version_base)) === d.huella : null;
    const previa = estado.ejemplo ? [] : structuredClone(estado.meds);
    const meds = c.meds.map((m) => (m.libre ? { pid: "libre:" + String(m.nombre).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_"), nombre: m.nombre, libre: true, dosis: m.dosis ?? null, tomas: m.tomas || 1, unidad: "mg", momentos: momentosPorDefecto(m.tomas || 1) } : m));
    Object.assign(estado, { meds: sanearMeds(meds), edad: numeroEntre(c.edad, 1, 120), caidas: !!c.caidas, condiciones: (c.condiciones || []).filter((x) => CONDICIONES.includes(x)), pac: c.pac || {}, pro: c.pro || {}, horas: { ...HORA_MOMENTO, ...(c.horas || {}) }, plan: sanearPlan(c.plan), cribado: sanearCribado(c.cribado), ejemplo: false });
    if (c.modo === "profesional" || c.modo === "paciente") estado.modo = c.modo;
    restaurarFormulario(); guardar(); render(); mostrarCambios(previa);
    toast(integra === false ? t("caso.importado_alterado") : t("caso.importado", { v: d.version_base || "?" }), { ms: 6000 });
  } catch { toast(t("caso.error"), { ms: 5000 }); }
});
$("#btn-lista-csv").addEventListener("click", () => {
  if (!estado.meds.length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  const res = evaluar(datos, estado.meds.filter((m) => !m.libre), ctxActual());
  const filas = [["principio_activo", "grupo", "dosis_por_toma", "unidad", "tomas_dia", "dosis_diaria", "categoria_dosis", "momentos", "a_demanda", "en_pausa", "senales"]];
  let k = 0;
  for (const m of estado.meds) {
    if (m.libre) { filas.push([m.nombre, "(sin información)", m.dosis ?? "", "mg", m.tomas || 1, "", "", "", "", "", ""]); continue; }
    const it = res.items[k++]; if (!it) continue;
    filas.push([it.principio.nombre, it.clase.nombre, it.dosisPorToma ?? "", it.unidad, it.tomas, it.dosisTotal ?? "", it.dosisCat, (m.momentos || []).join("|"), it.aDemanda ? "sí" : "no", m.pausado ? "sí" : "no", [...it.senales].join("|")]);
  }
  const csv = "﻿" + filas.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  descargarTexto(`medicacion-${hoyISO()}.csv`, csv, "text/csv;charset=utf-8");
  toast(t("caso.csv_ok"), { ms: 3000 });
});
$("#btn-caso-prueba").addEventListener("click", () => {
  if (!medsActivos().length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  const ctx = ctxActual(); const res = evaluar(datos, medsActivos(), ctx);
  const senales = [...new Set(res.items.flatMap((it) => [...it.senales]))].filter((s) => !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s));
  const caso = { id: "c" + Date.now().toString(36), titulo: prompt(t("caso.titulo_prompt"), "") || "Caso sin título", descripcion: `${ctx.edad ? ctx.edad + " años, " : ""}${res.items.map((i) => i.principio.nombre).join(" + ")}`,
    meds: medsActivos().map((m) => ({ pid: m.pid, dosis: m.dosis, tomas: m.tomas, ...(m.unidad ? { unidad: m.unidad } : {}), ...(m.aDemanda ? { aDemanda: true } : {}) })),
    ctx: { edad: ctx.edad, caidas: ctx.caidas, condiciones: [...ctx.condiciones], ...(ctx.fg != null ? { fg: ctx.fg } : {}), ...(ctx.fevi != null ? { fevi: ctx.fevi } : {}), ...(ctx.nyha != null ? { nyha: ctx.nyha } : {}) },
    ...(estado.cribado.regular != null ? { cribado: sanearCribado(estado.cribado) } : {}),
    esperado: { alerta_min: res.resumen.alerta, precaucion_min: res.resumen.precaucion, mayores_min: res.interacciones.filter((x) => x.nivel === "mayor").length, senales, combinadas_incluye: res.combinadas.map((c) => c.regla.titulo.toLowerCase()).slice(0, 4), ...(estado.cribado.regular != null ? { cribado: cribadoACSM(estado.cribado).clave } : {}) } };
  const r = comprobarCaso(datos, caso);
  descargarTexto(`caso-prueba-${caso.id}.json`, JSON.stringify(caso, null, 1), "application/json");
  toast(r.ok ? t("caso.prueba_ok") : t("caso.prueba_fallo", { f: r.fallos.join("; ") }), { ms: 6000 });
});

/* ---------- índice lateral del informe (escritorio) y versión ---------- */
$("#app-version").textContent = `v${APP_VERSION}`;
$("#btn-imprimir").addEventListener("click", () => { estado.tab = "general"; render(); setTimeout(() => window.print(), 150); });
{
  const enlaces = $$("#indice-informe a");
  const obs = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) enlaces.forEach((a) => a.classList.toggle("activo", a.getAttribute("href") === "#" + e.target.id)); }, { rootMargin: "-20% 0px -70% 0px" });
  for (const a of enlaces) { const el = document.querySelector(a.getAttribute("href")); if (el) obs.observe(el); }
}

cargar();

/* ---------- sin conexión / instalable ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:" && !location.hostname.endsWith("claude.ai")) {
  navigator.serviceWorker.register("sw.js").then((reg) => {
    reg.addEventListener("updatefound", () => {
      const nuevo = reg.installing;
      nuevo?.addEventListener("statechange", () => {
        if (nuevo.state === "installed" && navigator.serviceWorker.controller) {
          const b = $("#aviso-actualizar"); b.hidden = false;
          b.querySelector("button").addEventListener("click", () => { nuevo.postMessage("activar"); });
        }
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());
  }).catch(() => {});
}
