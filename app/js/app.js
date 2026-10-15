import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL, MOMENTOS, MOMENTO_TXT, HORA_MOMENTO, momentosPorDefecto, ventanaEntrenamiento } from "./engine.js?v=202610151006";
import { extraerMedicacion, textoDePdf } from "./parser.js?v=202610151006";
import { pdfMedico, pdfPaciente, textoHistoria } from "./informes.js?v=202610151006";
import { textoDeImagen, textoDePdfEscaneado } from "./ocr.js?v=202610151006";
import { t, aplicarIdioma, detectarIdioma, idioma } from "./i18n.js?v=202610151006";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

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
  const [kb, ddiCurado, ddi, marcas] = await Promise.all(
    ["kb.json", "ddi_curated.json", "ddi.json", "marcas.json"].map((f) => fetch(`data/${f}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  );
  if (!kb) { $("#kb-version").textContent = t("kb.error"); $("#kb-version").classList.add("error"); return; }
  datos = { kb, ddiCurado: ddiCurado || { interacciones: [] }, ddi: ddi || { pares: [] } };
  indice = construirIndice(kb, marcas || []);
  datos.indice = indice;
  renderVersion();
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
  $("#btn-pdf-medico").textContent = estado.modo === "paciente" ? t("desc.medico") : t("desc.medico.pro");
  $("#btn-pdf-paciente").textContent = estado.modo === "paciente" ? t("desc.paciente.pac") : t("desc.paciente.pro");
}
$("#btn-letra").addEventListener("click", () => {
  const on = !document.documentElement.classList.contains("letra-grande");
  document.documentElement.classList.toggle("letra-grande", on);
  $("#btn-letra").setAttribute("aria-pressed", String(on));
  try { localStorage.setItem("medex.letra", on ? "1" : "0"); } catch {}
});
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
    estado.meds.push({ pid: seleccion.pid, dosis: Number.isFinite(dosis) ? dosis : null, tomas, unidad: seleccion.unidad, momentos: momentosPorDefecto(tomas) });
  }
  seleccion = null;
  inputBuscar.value = "";
  $("#dosis-wrap").hidden = true;
  guardar(); render();
  inputBuscar.focus();
});

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
    li.innerHTML = `<span>${l.slice(0, 80)}</span><button type="button" class="btn-sec sm" data-accion="buscar">Buscar</button><button type="button" class="btn-sec sm" data-accion="avisar">Avisar de que falta</button>`;
    li.querySelector('[data-accion="buscar"]').addEventListener("click", () => { inputBuscar.value = nombre.split(" ").slice(0, 2).join(" "); inputBuscar.dispatchEvent(new Event("input")); inputBuscar.focus(); inputBuscar.scrollIntoView({ block: "center" }); });
    li.querySelector('[data-accion="avisar"]').addEventListener("click", () => {
      const cuerpo = `Hola Pelayo,\n\nEste medicamento no lo reconoce la app:\n${l}\n\nVersión: ${datos.kb.version}`;
      window.location.href = `mailto:pelayoplcoaching@gmail.com?subject=${encodeURIComponent("Fármaco no reconocido · Medicación y Ejercicio")}&body=${encodeURIComponent(cuerpo)}`;
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
  const reglas = (amb) => (c[amb] || []).filter((r) => !r.si?.principio || r.si.principio === pid).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${r.texto}${r.si?.dosis === "alta" ? " <em>(a dosis altas)</em>" : ""}${r.si?.edad_min ? ` <em>(≥ ${r.si.edad_min} años)</em>` : ""}${r.si?.condicion ? ` <em>(si ${r.si.condicion.replace(/_/g, " ")})</em>` : ""}</span></li>`).join("");
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

/* ---------- Resúmenes en PDF ---------- */
async function descargarPdf(tipo) {
  const btn = tipo === "medico" ? $("#btn-pdf-medico") : $("#btn-pdf-paciente");
  const original = btn.textContent;
  btn.disabled = true; btn.textContent = "Generando…";
  try {
    const res = evaluar(datos, estado.meds, ctxActual());
    const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, estado.meds, estado.horas), horas: estado.horas };
    const doc = await (tipo === "medico" ? pdfMedico : pdfPaciente)(datos.kb, res, ctx);
    doc.save(`${tipo === "medico" ? "resumen-medico" : "resumen-paciente"}-${new Date().toISOString().slice(0, 10)}.pdf`);
    btn.textContent = "PDF generado";
  } catch (e) {
    btn.textContent = "No disponible aquí";
    $("#pdf-aviso").textContent = "No se ha podido generar el PDF (" + (e.message || e) + "). En la versión web pública la descarga funciona con normalidad.";
  }
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 3000);
}
$("#btn-pdf-medico").addEventListener("click", () => descargarPdf("medico"));
$$(".btn-sugerencia").forEach((b) => b.addEventListener("click", async () => {
  const lista = estado.meds.map((m) => `${m.pid}${m.dosis != null ? " " + m.dosis + " " + (m.unidad || "mg") : ""}${m.tomas > 1 ? " x" + m.tomas : ""}`).join("; ");
  let sinRes = []; try { sinRes = JSON.parse(localStorage.getItem("medex.sinresultado") || "[]"); } catch {}
  const cuerpo = `Hola Pelayo,\n\n[Describe aquí el error o la mejora]\n\n---\nVersión: ${datos.kb.version} · ${navigator.userAgent.slice(0, 80)}${sinRes.length ? "\nBúsquedas sin resultado en este dispositivo: " + sinRes.join("; ") : ""}\nContexto: ${estado.edad ? estado.edad + " años" : "sin edad"}${estado.caidas ? ", caídas" : ""}${estado.condiciones.length ? ", " + estado.condiciones.join(", ") : ""}\nMedicación introducida: ${lista || "(ninguna)"}\n(No incluyas nombre ni datos identificativos de ningún paciente.)`;
  const asunto = "Sugerencia · Medicación y Ejercicio (alfa)";
  const mailto = `mailto:pelayoplcoaching@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  try { await navigator.clipboard.writeText(cuerpo); } catch {}
  window.location.href = mailto;
  $("#pdf-aviso").textContent = "Se ha abierto su correo con los datos de la versión (también copiados al portapapeles). Si no se abre, escriba a pelayoplcoaching@gmail.com.";
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
// barra inferior (móvil): lleva al informe o, estando en él, de vuelta a la medicación
let enInforme = false;
const desplazar = (el) => el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
$("#btn-ir-informe").addEventListener("click", () => desplazar(enInforme ? $("aside") : $("#informe")));
new IntersectionObserver(([e]) => {
  enInforme = e.isIntersecting;
  $("#btn-ir-informe").firstChild.textContent = enInforme ? t("lista.editar") + " " : t("barra.ver") + " ";
}, { rootMargin: "-40% 0px -55% 0px" }).observe($("#informe"));

$("#btn-historia").addEventListener("click", async () => {
  const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, estado.meds, estado.horas) };
  const res = evaluar(datos, estado.meds, ctx);
  const txt = textoHistoria(datos.kb, res, ctx);
  const btn = $("#btn-historia");
  try { await navigator.clipboard.writeText(txt); btn.textContent = "Copiado para la historia"; }
  catch { const ta = $("#informe-texto"); ta.hidden = false; ta.value = txt; ta.select(); btn.textContent = "Seleccione y copie"; }
  setTimeout(() => (btn.textContent = "Texto para la historia clínica"), 2500);
});
$("#btn-copiar").addEventListener("click", async () => {
  const res = evaluar(datos, estado.meds, ctxActual());
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

function render() {
  const ctx = ctxActual();
  const res = evaluar(datos, estado.meds, ctx);

  // lista de medicación
  const ul = $("#lista-meds");
  ul.innerHTML = "";
  $("#ejemplo-banner").hidden = !estado.ejemplo;
  res.items.forEach((it, i) => {
    const li = document.createElement("li");
    const dosis = it.dosisTotal != null
      ? `${it.dosisPorToma.toLocaleString("es-ES")} ${it.unidad}${it.esDiaria && it.tomas > 1 ? ` × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día = ${it.dosisTotal.toLocaleString("es-ES")} ${it.unidad}/día` : it.esDiaria ? "/día" : ""}${it.aDemanda ? " · si precisa" : ""}`
      : "dosis no indicada";
    li.innerHTML = `
      <div class="med-nombre"><strong>${it.principio.nombre}</strong><small>${estado.meds[i]?.combo ? `En ${estado.meds[i].combo} · ` : ""}${it.clase.nombre}</small></div>
      <div class="med-dosis">${dosis}${it.dosisCat === "alta" ? ' <span class="chip chip-alta">dosis alta</span>' : ""}</div>
      <div class="momentos" role="group" aria-label="Momento de las tomas">${MOMENTOS.map((m) => `<button type="button" class="mom" data-m="${m}" aria-pressed="${(estado.meds[i]?.momentos || []).includes(m)}" title="${MOMENTO_TXT[m]}">${{ desayuno: "D", comida: "C", cena: "Ce", noche: "N" }[m]}</button>`).join("")}</div>
      <button type="button" class="quitar" aria-label="Quitar ${it.principio.nombre}">×</button>`;
    li.querySelectorAll(".mom").forEach((b) => b.addEventListener("click", () => {
      const m = estado.meds[i]; const set = new Set(m.momentos || []);
      set.has(b.dataset.m) ? set.delete(b.dataset.m) : set.add(b.dataset.m);
      m.momentos = MOMENTOS.filter((x) => set.has(x)); if (m.momentos.length) m.tomas = m.momentos.length;
      guardar(); render();
    }));
    li.querySelector(".quitar").addEventListener("click", () => { estado.meds.splice(i, 1); estado.ejemplo = false; guardar(); render(); });
    ul.append(li);
  });
  $("#sin-meds").hidden = res.items.length > 0;
  $("#informe").hidden = res.items.length === 0;
  if (!res.items.length) { $("#barra-inferior").hidden = true; return; }

  // chips de contexto derivado
  const etiquetasCtx = { renal: "enfermedad renal", renal_grave: "FG < 30", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", marcapasos: "marcapasos/DAI", diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno", embarazo: "embarazo/lactancia" };
  const chips = [...ctx.condiciones].map((c) => etiquetasCtx[c]).filter(Boolean);
  if (ctx.edad) chips.unshift(`${ctx.edad} años`);
  if (ctx.daiFc) chips.push(`DAI ${ctx.daiFc} lpm`);
  $("#contexto").innerHTML = chips.length ? chips.map((c) => `<span class="chip">${c}</span>`).join("") : "";
  // resumen
  $("#resumen").innerHTML = ["alerta", "precaucion", "info"]
    .map((n) => `<div class="tile tile-${n}"><span class="num">${res.resumen[n]}</span><span>${etiqueta(n)}</span></div>`).join("") +
    `<div class="tile tile-ddi"><span class="num">${res.interacciones.length}</span><span>Interacciones</span></div>`;

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
    if (b.dataset.tab === "cuando") { const v = ventanaEntrenamiento(indice, estado.meds, estado.horas); const nr = v.horas.filter((x) => x.nivel === "rojo").length; const na = v.horas.filter((x) => x.nivel === "ambar").length; c.textContent = nr || na ? (nr ? nr + "h" : na + "h") : ""; c.className = "cnt" + (nr ? " c-alerta" : na ? " c-precaucion" : ""); }
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
            <p>${c.texto}</p>
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

function tarjetaFarmaco(g, amb, abierta) {
  {
    const it = g.item;
    const max = g.reglas.reduce((m, r) => (ORDEN_NIVEL[r.nivel] > ORDEN_NIVEL[m] ? r.nivel : m), "info");
    const dosis = it.dosisTotal != null ? `${it.dosisTotal} ${it.unidad}${it.esDiaria ? "/día" : ""}` : "";
    return `
      <details class="farmaco nivel-${max}"${abierta ? " open" : ""}>
        <summary>
          <span class="barra"></span>
          <span class="txt"><h4>${it.principio.nombre}</h4><small>${it.clase.nombre}${dosis ? " · " + dosis : ""}${it.dosisCat === "alta" ? ` · <b>${t("inf.dosis_alta")}</b>` : ""}</small></span>
          <span class="nivel">${etiqueta(max)}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </summary>
        <div class="cuerpo">
          ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
          ${it.principio.sintetico && !amb ? `<p class="resumen-clase"><em>${it.principio.nota}</em></p>` : ""}
          <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${r.texto}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""}</span></li>`).join("")}</ul>
          ${it.clase.fuentes?.length ? `<p class="fuentes">${t("inf.fuentes")}: ${it.clase.fuentes.join(" · ")} · <a class="enlace-ft" href="https://cima.aemps.es/cima/publico/lista.html?nombre=${encodeURIComponent(it.principio.nombre.split(/[\s(\/]/)[0])}" target="_blank" rel="noopener">${t("inf.ficha")}</a></p>` : `<p class="fuentes"><a class="enlace-ft" href="https://cima.aemps.es/cima/publico/lista.html?nombre=${encodeURIComponent(it.principio.nombre.split(/[\s(\/]/)[0])}" target="_blank" rel="noopener">${t("inf.ficha")}</a></p>`}
        </div>
      </details>`;
  }
}

function renderCuando(cont) {
  const v = ventanaEntrenamiento(indice, estado.meds, estado.horas);
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
          <footer>${x.fuente === "curada" ? t("ddi.fuente_propia") : x.fuente === "ddinter" ? "DDInter 2.0" : "Duplicidad detectada"}</footer>
        </article>`);
    }
  }
  const fuentes = [`${datos.ddiCurado.interacciones.length} ${t("ddi.revisadas")}`];
  if (datos.ddi?.pares?.length) fuentes.push(`DDInter 2.0 (${datos.ddi.pares.length.toLocaleString("es")} pares, ${datos.ddi.version})`);
  else fuentes.push("DDInter 2.0 pendiente de cargar");
  sec.insertAdjacentHTML("beforeend", `<p class="nota-fuentes">${t("ddi.nota", { n: fuentes.join(" · ") })}</p>`);
  cont.append(sec);
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
