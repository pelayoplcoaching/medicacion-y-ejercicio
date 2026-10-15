import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL, MOMENTOS, MOMENTO_TXT, HORA_MOMENTO, momentosPorDefecto, ventanaEntrenamiento, loEsencial, ALARMA, sintomasPosibles, SINTOMAS } from "./engine.js?v=202610151126";
import { extraerMedicacion, textoDePdf } from "./parser.js?v=202610151126";
import { pdfMedico, pdfPaciente, textoHistoria, prescripcion } from "./informes.js?v=202610151126";
import { cargarScript } from "./libs.js?v=202610151126";
import { textoDeImagen, textoDePdfEscaneado } from "./ocr.js?v=202610151126";
import { t, aplicarIdioma, detectarIdioma, idioma } from "./i18n.js?v=202610151126";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/** Medicación que entra en el informe (los fármacos "pausados" se quedan en la lista pero no cuentan). */
const medsActivos = () => estado.meds.filter((m) => !m.pausado);

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
  whatsapp: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4zm-3 4.3c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.6 2.6 1 3.2.8 3.7.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5L9.9 8.7c-.2-.4-.4-.4-.6-.4H9z",
};
const icono = (n, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[n]}"/></svg>`;
function ponerIconos() {
  const mapa = { "btn-caja": "caja", "btn-dictar": "mic", "btn-foto": "foto", "btn-pdf": "pdf", "btn-pegar": "pegar", "btn-ejemplo": "ejemplo", "btn-vaciar": "vaciar", "btn-enlace": "compartir", "btn-whatsapp": "whatsapp", "btn-email": "correo", "btn-calendario": "calendario", "btn-instalar": "instalar", "btn-pdf-medico": "pdf", "btn-pdf-paciente": "pdf" };
  for (const [id, n] of Object.entries(mapa)) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
  for (const b of $$(".tabs [role=tab]")) if (!b.querySelector("svg") && ICONS[b.dataset.tab]) b.insertAdjacentHTML("afterbegin", icono(b.dataset.tab));
  for (const [id, n] of Object.entries({ "btn-qr": "qr", "btn-exportar": "guardar", "btn-importar-listas": "abrir" })) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
}

// Idioma de la interfaz (la base de conocimiento sigue en español)
aplicarIdioma(detectarIdioma());
$("#idioma").value = idioma();
$("#idioma").addEventListener("change", (e) => { aplicarIdioma(e.target.value); aplicarModo(); if (datos) { renderVersion(); render(); } });

const estado = { meds: [], edad: null, caidas: false, condiciones: [], modo: "paciente", pac: {}, pro: {}, horas: { ...HORA_MOMENTO }, tab: "general" };
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
  $("#kb-version").textContent = t("kb.version", { v: datos.kb.version, c: datos.kb.clases.length, p: indice.porId.size });
}

async function cargar() {
  $("#kb-version").textContent = "Cargando la base de conocimiento…";
  const [kb, ddiCurado, ddi, marcas, fichas] = await Promise.all(
    ["kb.json", "ddi_curated.json", "ddi.json", "marcas.json", "fichas.json"].map((f) => fetch(`data/${f}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  );
  if (!kb) { $("#kb-version").textContent = t("kb.error"); $("#kb-version").classList.add("error"); return; }
  datos = { kb, ddiCurado: ddiCurado || { interacciones: [] }, ddi: ddi || { pares: [] }, fichas: fichas || {} };
  indice = construirIndice(kb, marcas || []);
  datos.indice = indice;
  renderVersion();
  ponerIconos();
  document.body.classList.remove("cargando");
  $("#aviso").textContent = kb.aviso;
  restaurar();
  const h = location.hash.match(/^#lista=([A-Za-z0-9_-]+)/);
  if (h && decodificarEstado(h[1])) { history.replaceState(null, "", location.pathname); restaurarFormulario(); guardar(); $("#pegar-aviso").textContent = "Lista cargada desde el enlace."; }
  render();
}

/* ---------- persistencia local (solo en este navegador) ---------- */
function guardar() {
  try { localStorage.setItem("medex.estado", JSON.stringify({ meds: estado.meds, edad: estado.edad, caidas: estado.caidas, condiciones: estado.condiciones, modo: estado.modo, pac: estado.pac, pro: estado.pro, horas: estado.horas })); } catch {}
}
function restaurar() {
  try {
    const s = JSON.parse(localStorage.getItem("medex.estado") || "null");
    if (s && Array.isArray(s.meds)) Object.assign(estado, { meds: s.meds.filter((m) => indice.porId.has(m.pid)), edad: s.edad ?? null, caidas: !!s.caidas, condiciones: Array.isArray(s.condiciones) ? s.condiciones.filter((c) => CONDICIONES.includes(c)) : [], modo: s.modo === "profesional" ? "profesional" : "paciente", pac: s.pac || {}, pro: s.pro || {}, horas: { ...HORA_MOMENTO, ...(s.horas || {}) } });
  } catch {}
  $("#edad").value = estado.edad ?? "";
  $("#caidas").checked = estado.caidas;
  for (const c of CONDICIONES) { const el = $("#cond-" + c); if (el) el.checked = estado.condiciones.includes(c); }
  for (const k of PAC) { const el = $("#pac-" + k); if (el) el.checked = estado.pac[k] === true; }
  for (const k of PRO) { const el = $("#pro-" + k); if (el) el.value = estado.pro[k] ?? ""; }
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
  lista.hidden = !res.length;
  clearTimeout(timerSinResultado);
  const q = inputBuscar.value.trim();
  if (!res.length && q.length >= 4) timerSinResultado = setTimeout(() => registrarSinResultado(q.toLowerCase()), 1500);
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
  return { reconocidos: reconocidos.length, noReconocidos: noReconocidos.length };
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
    li.innerHTML = `<span>${l.slice(0, 80)}</span><button type="button" class="btn-sec sm" data-accion="buscar">${t("pegar.buscar")}</button><button type="button" class="btn-sec sm" data-accion="avisar">${t("pegar.avisar")}</button>`;
    li.querySelector('[data-accion="buscar"]').addEventListener("click", () => { inputBuscar.value = nombre.split(" ").slice(0, 2).join(" "); inputBuscar.dispatchEvent(new Event("input")); inputBuscar.focus(); inputBuscar.scrollIntoView({ block: "center" }); });
    li.querySelector('[data-accion="avisar"]').addEventListener("click", () => {
      window.open(urlSugerencia({ lista: "No reconocido: " + l.slice(0, 120) }), "_blank", "noopener");
      li.querySelector('[data-accion="avisar"]').textContent = "Gracias";
    });
    ul.append(li);
  }
}

/* ---------- enlace con la lista (sin servidor: todo va en la URL) ---------- */
function codificarEstado() {
  const o = { m: estado.meds.map((m) => [m.pid, m.dosis, m.tomas, m.unidad || null, m.aDemanda ? 1 : 0, (m.momentos || []).map((x) => x[0]).join("")]), e: estado.edad, c: estado.caidas ? 1 : 0, k: estado.condiciones, o: estado.modo, p: estado.pac, r: estado.pro };
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodificarEstado(h) {
  try {
    const json = decodeURIComponent(escape(atob(h.replace(/-/g, "+").replace(/_/g, "/"))));
    const o = JSON.parse(json);
    if (!Array.isArray(o.m)) return false;
    estado.meds = o.m.filter((x) => indice.porId.has(x[0])).map((x) => ({ pid: x[0], dosis: x[1], tomas: x[2] || 1, unidad: x[3] || undefined, aDemanda: !!x[4], momentos: x[5] ? MOMENTOS.filter((m) => x[5].includes(m[0])) : momentosPorDefecto(x[2] || 1) }));
    estado.edad = o.e ?? null; estado.caidas = !!o.c; estado.condiciones = Array.isArray(o.k) ? o.k.filter((c) => CONDICIONES.includes(c)) : [];
    estado.modo = o.o === "profesional" ? "profesional" : "paciente"; estado.pac = o.p || {}; estado.pro = o.r || {}; estado.ejemplo = false;
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
    <p class="fuentes" style="margin-top:12px">${c.fuentes?.length ? t("inf.fuentes") + ": " + c.fuentes.join(" · ") + " · " : ""}<a class="enlace-ft" style="display:inline" href="https://cima.aemps.es/cima/publico/lista.html?nombre=${encodeURIComponent(p.nombre.split(/[\s(\/]/)[0])}" target="_blank" rel="noopener">${t("inf.ficha")}</a></p>
    <button type="button" class="btn btn-anadir" id="ficha-anadir">${t("ficha.anadir")}</button>`;
  $("#ficha-anadir").addEventListener("click", () => { ficha.close(); const e = indice.entradas.find((x) => x.tipo === "principio" && x.pid === pid); if (e) { elegir(e); inputBuscar.scrollIntoView({ block: "center" }); } });
}

/* ---------- listas guardadas (solo en este dispositivo) ---------- */
function leerPerfiles() { try { return JSON.parse(localStorage.getItem("medex.perfiles") || "[]"); } catch { return []; } }
function escribirPerfiles(lista) { try { localStorage.setItem("medex.perfiles", JSON.stringify(lista)); } catch {} }
function snapshot() { return { meds: structuredClone(estado.meds), edad: estado.edad, caidas: estado.caidas, condiciones: [...estado.condiciones], modo: estado.modo, pac: { ...estado.pac }, pro: { ...estado.pro }, horas: { ...estado.horas } }; }
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
      Object.assign(estado, { meds: structuredClone(e.meds), edad: e.edad ?? null, caidas: !!e.caidas, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {}, horas: { ...HORA_MOMENTO, ...(e.horas || {}) }, ejemplo: false });
      if (e.modo) estado.modo = e.modo;
      restaurarFormulario(); guardar(); render(); $("#pegar-aviso").textContent = t("perf.cargada", { n: pf.nombre });
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
    const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), horas: estado.horas, diario: leerDiario() };
    const doc = await (tipo === "medico" ? pdfMedico : pdfPaciente)(datos.kb, res, ctx);
    doc.save(`${tipo === "medico" ? "resumen-medico" : "resumen-paciente"}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  L.push(`${t("compartir.meds")}: ${res.items.map((i) => i.principio.nombre).join(", ")}.`, "");
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
  const lista = estado.meds.map((m) => `${m.pid}${m.dosis != null ? " " + m.dosis + " " + (m.unidad || "mg") : ""}${m.tomas > 1 ? " x" + m.tomas : ""}`).join("; ");
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
$("#btn-vaciar").addEventListener("click", () => { estado.meds = []; estado.ejemplo = false; guardar(); render(); });
$("#edad").addEventListener("change", () => { estado.edad = parseInt($("#edad").value, 10) || null; guardar(); render(); });
$("#caidas").addEventListener("change", () => { estado.caidas = $("#caidas").checked; guardar(); render(); });
for (const c of CONDICIONES) $("#cond-" + c)?.addEventListener("change", () => { estado.condiciones = CONDICIONES.filter((k) => $("#cond-" + k)?.checked); guardar(); render(); });

$$(".tabs button").forEach((b) => b.addEventListener("click", () => { estado.tab = b.dataset.tab; render(); }));
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
const DIAS_PLAN = [
  [1, "fuerza", "fuerza+equilibrio"], [2, "aerobico", "aerobico"], [3, "fuerza", "fuerza"], [4, "aerobico", "aerobico"], [5, "fuerza", "fuerza+equilibrio"], [6, "aerobico", "aerobico"],
];
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
  for (const [dow, tipo, etiqueta] of DIAS_PLAN) {
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
  toast(t("plan.descargado", { h: String(horaPlan()).padStart(2, "0") + ":00" }), { ms: 7000 });
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
  const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas) };
  const res = evaluar(datos, medsActivos(), ctx);
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
function hoyISO(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function planDeHoy() {
  const dow = new Date().getDay(); // 0 domingo
  const fila = DIAS_PLAN.find(([d]) => d === dow);
  if (!fila) return { tipo: "descanso", etiqueta: t("hoy.descanso") };
  const [, tipo, etq] = fila;
  return { tipo, etiqueta: tipo === "aerobico" ? t("plan.aerobico") : etq.includes("equilibrio") ? t("plan.fuerza_eq") : t("plan.fuerza") };
}
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
      <button type="button" class="btn sm" id="btn-registrar">${diarioAbierto ? t("ficha.cerrar") : t("hoy.registrar")}</button>
    </div>
    <div class="hoy-semana">${barrasSemana(diario)}<div class="hoy-resumen"><b>${nSem}</b> ${t("hoy.sesiones")} · <b>${minSem}</b> min ${t("hoy.esta_semana")}</div></div>
    ${diarioAbierto ? `<form class="registro" id="form-registro">
      <div class="chips">${TIPOS_SESION.map((x) => `<label class="chip chip-btn"><input type="radio" name="tipo" value="${x}"${x === (plan.tipo === "descanso" ? "paseo" : plan.tipo) ? " checked" : ""}> ${t("sesion." + x)}</label>`).join("")}</div>
      <div class="fila"><label>${t("hoy.minutos")} <input type="number" name="min" min="1" max="300" value="30" inputmode="numeric"></label><label>${t("hoy.rpe")} <input type="range" name="rpe" min="1" max="10" value="5" oninput="this.nextElementSibling.textContent=this.value"><output>5</output></label></div>
      <small>${t("hoy.sintomas")}</small>
      <div class="chips">${SINTOMAS.slice(0, 7).map((x) => `<label class="chip chip-btn"><input type="checkbox" name="sint" value="${x.id}"> ${x.nombre}</label>`).join("")}</div>
      <div class="acciones" style="margin:8px 0 0"><button type="submit" class="btn sm">${t("perf.guardar")}</button></div>
    </form>` : ""}
    ${ultimas.length ? `<ul class="diario-lista">${ultimas.map((x) => `<li><span>${new Date(x.fecha + "T12:00").toLocaleDateString(idioma(), { weekday: "short", day: "numeric", month: "short" })}</span><span>${t("sesion." + x.tipo)} · ${x.min} min · RPE ${x.rpe}${x.sintomas?.length ? ` · <em>${x.sintomas.map((id) => SINTOMAS.find((y) => y.id === id)?.nombre.split(" ")[0]).join(", ")}</em>` : ""}</span><button type="button" class="quitar" data-id="${x.id}" aria-label="${t("lista.quitar")}">×</button></li>`).join("")}</ul>` : ""}`;
  $("#btn-registrar").addEventListener("click", () => { diarioAbierto = !diarioAbierto; renderHoy(); });
  box.querySelector("#form-registro")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const sint = f.getAll("sint");
    const d = leerDiario(); d.push({ id: Date.now().toString(36), fecha: hoyISO(), tipo: f.get("tipo") || "aerobico", min: parseInt(f.get("min"), 10) || 0, rpe: parseInt(f.get("rpe"), 10) || 5, sintomas: sint });
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
  const resLista = evaluar(datos, estado.meds, ctx);     // todos, para pintar la lista
  const res = evaluar(datos, medsActivos(), ctx);        // solo los activos, para el informe
  document.body.classList.toggle("sin-meds", !estado.meds.length);
  pintarPasos();
  renderRapido();

  // lista de medicación
  const ul = $("#lista-meds");
  ul.innerHTML = "";
  $("#ejemplo-banner").hidden = !estado.ejemplo;
  resLista.items.forEach((it, i) => {
    const m = estado.meds[i] || {};
    const li = document.createElement("li");
    if (m.pausado) li.classList.add("pausado");
    const dosis = it.dosisTotal != null
      ? `${it.dosisPorToma.toLocaleString("es-ES")} ${it.unidad}${it.esDiaria && it.tomas > 1 ? ` × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día = ${it.dosisTotal.toLocaleString("es-ES")} ${it.unidad}/día` : it.esDiaria ? "/día" : ""}${it.aDemanda ? " · si precisa" : ""}`
      : t("lista.sin_dosis");
    li.innerHTML = `
      <div class="med-nombre"><strong>${it.principio.nombre}</strong><small>${m.combo ? `${t("lista.en")} ${m.combo} · ` : ""}${it.clase.nombre}${m.pausado ? ` · <em>${t("lista.pausado")}</em>` : ""}</small></div>
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
  if (!res.items.length) { $("#barra-inferior").hidden = true; $("#esencial").innerHTML = ""; return; }

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
  $("#veredicto").className = "veredicto " + (nA || mayores ? "v-alerta" : nP ? "v-precaucion" : "v-ok");
  $("#veredicto").innerHTML = `<p>${veredicto}</p>`;
  renderHoy();
  // lo esencial (3-5 puntos accionables) + señales de alarma
  const esencial = loEsencial(res, 5);
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
  const u = datos.fichas?.[principio.id];
  return u || `https://cima.aemps.es/cima/publico/lista.html?nombre=${encodeURIComponent(principio.nombre.split(/[\s(\/]/)[0])}`;
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
          <span class="txt"><h4>${it.principio.nombre}</h4><small>${it.clase.nombre}${dosis ? " · " + dosis : ""}${it.dosisCat === "alta" ? ` · <b>${t("inf.dosis_alta")}</b>` : ""}</small>${max !== "info" ? `<span class="una-frase">${fraseCorta(g.reglas.find((r) => r.nivel === max)?.texto)}</span>` : ""}</span>
          <span class="nivel">${etiqueta(max)}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </summary>
        <div class="cuerpo">
          ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
          ${it.principio.sintetico && !amb ? `<p class="resumen-clase"><em>${it.principio.nota}</em></p>` : ""}
          <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${glosar(r.texto)}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""} <span class="estado-regla ${r.revisado ? "ok" : ""}" title="${r.revisado ? t("regla.revisada.t") : t("regla.borrador.t")}">${r.revisado ? t("regla.revisada") : t("regla.borrador")}</span>${r.fuente ? ` <small class="fuente-regla">${r.fuente}</small>` : ""}</span></li>`).join("")}</ul>
          <p class="fuentes">${it.clase.fuentes?.length ? `${t("inf.fuentes")}: ${it.clase.fuentes.join(" · ")} · ` : ""}<a class="enlace-ft" href="${urlFicha(it.principio)}" target="_blank" rel="noopener">${t("inf.ficha")}</a></p>
        </div>
      </details>`;
  }
}

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
          <footer>${x.fuente === "curada" ? t("ddi.fuente_propia") : x.fuente === "ddinter" ? `${t("ddi.ddinter")} · <a href="${urlFicha(x.a.principio)}" target="_blank" rel="noopener">${t("inf.ficha")} ${nombreCorto(x.a.principio)}</a> · <a href="${urlFicha(x.b.principio)}" target="_blank" rel="noopener">${nombreCorto(x.b.principio)}</a>` : t("ddi.duplicidad")}</footer>
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
