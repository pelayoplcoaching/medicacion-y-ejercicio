import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL } from "./engine.js?v=202610150753";
import { extraerMedicacion, textoDePdf } from "./parser.js?v=202610150753";
import { pdfMedico, pdfPaciente } from "./informes.js?v=202610150753";
import { textoDeImagen, textoDePdfEscaneado } from "./ocr.js?v=202610150753";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const estado = { meds: [], edad: null, caidas: false, tab: "general" };
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

async function cargar() {
  const [kb, ddiCurado, ddi, marcas] = await Promise.all(
    ["kb.json", "ddi_curated.json", "ddi.json", "marcas.json"].map((f) => fetch(`data/${f}`).then((r) => (r.ok ? r.json() : null)).catch(() => null))
  );
  datos = { kb, ddiCurado: ddiCurado || { interacciones: [] }, ddi: ddi || { pares: [] } };
  indice = construirIndice(kb, marcas || []);
  datos.indice = indice;
  $("#kb-version").textContent = `Base de conocimiento v${kb.version} · ${kb.clases.length} clases, ${indice.porId.size} principios activos`;
  $("#aviso").textContent = kb.aviso;
  restaurar();
  render();
}

/* ---------- persistencia local (solo en este navegador) ---------- */
function guardar() {
  try { localStorage.setItem("medex.estado", JSON.stringify({ meds: estado.meds, edad: estado.edad, caidas: estado.caidas })); } catch {}
}
function restaurar() {
  try {
    const s = JSON.parse(localStorage.getItem("medex.estado") || "null");
    if (s && Array.isArray(s.meds)) Object.assign(estado, { meds: s.meds.filter((m) => indice.porId.has(m.pid)), edad: s.edad ?? null, caidas: !!s.caidas });
  } catch {}
  $("#edad").value = estado.edad ?? "";
  $("#caidas").checked = estado.caidas;
}

/* ---------- búsqueda ---------- */
const inputBuscar = $("#buscar");
const lista = $("#sugerencias");
let seleccion = null;

inputBuscar.addEventListener("input", () => {
  seleccion = null;
  $("#dosis-wrap").hidden = true;
  const res = buscar(indice, inputBuscar.value);
  lista.innerHTML = "";
  lista.hidden = !res.length;
  for (const e of res) {
    const ref = indice.porId.get(e.pid);
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.innerHTML = `<span>${e.texto}</span><small>${e.tipo === "marca" ? ref.principio.nombre + " · " : ""}${ref.clase.nombre}</small>`;
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
  const dosis = parseFloat($("#dosis").value.replace(",", "."));
  const tomas = parseInt($("#tomas").value, 10) || 1;
  if (estado.ejemplo) { estado.meds = []; estado.ejemplo = false; }
  estado.meds.push({ pid: seleccion.pid, dosis: Number.isFinite(dosis) ? dosis : null, tomas, unidad: seleccion.unidad });
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
function incorporarTexto(texto, origen = "la lista") {
  const { reconocidos, noReconocidos } = extraerMedicacion(texto, indice);
  if (reconocidos.length) {
    if (estado.ejemplo) { estado.meds = []; estado.ejemplo = false; }
    const ya = new Set(estado.meds.map((m) => m.pid));
    for (const r of reconocidos) if (!ya.has(r.pid)) estado.meds.push({ pid: r.pid, dosis: r.dosis, tomas: r.tomas, unidad: r.unidad });
  }
  const partes = [];
  if (reconocidos.length) partes.push(`Reconocidos ${reconocidos.length} medicamentos de ${origen}; revise las dosis en la lista.`);
  else partes.push(`No se ha reconocido ningún medicamento en ${origen}.`);
  if (noReconocidos.length) partes.push(`Sin reconocer: ${noReconocidos.slice(0, 6).join(" · ")}${noReconocidos.length > 6 ? " …" : ""}.`);
  $("#pegar-aviso").textContent = partes.join(" ");
  guardar(); render();
  return { reconocidos: reconocidos.length, noReconocidos: noReconocidos.length };
}

/* ---------- PDF o foto de la medicación ---------- */
$("#btn-pdf").addEventListener("click", () => $("#pdf-input").click());
$("#btn-foto").addEventListener("click", () => $("#foto-input").click());
const progreso = (t) => { $("#pegar-aviso").textContent = t; };

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
    incorporarTexto(texto, `«${f.name}»`);
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
    if (texto.trim().length < 10) { progreso("No se ha podido leer texto en la foto. Pruebe con más luz, la hoja plana y el texto nítido."); return; }
    incorporarTexto(texto, "la foto");
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
    if (!window.jspdf) throw new Error("el generador de PDF no se ha cargado");
    const res = evaluar(datos, estado.meds, { edad: estado.edad, caidas: estado.caidas });
    const doc = await (tipo === "medico" ? pdfMedico : pdfPaciente)(datos.kb, res, estado);
    doc.save(`${tipo === "medico" ? "resumen-medico" : "resumen-paciente"}-${new Date().toISOString().slice(0, 10)}.pdf`);
    btn.textContent = "PDF generado";
  } catch (e) {
    btn.textContent = "No disponible aquí";
    $("#pdf-aviso").textContent = "No se ha podido generar el PDF (" + (e.message || e) + "). En la versión web pública la descarga funciona con normalidad.";
  }
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 3000);
}
$("#btn-pdf-medico").addEventListener("click", () => descargarPdf("medico"));
$("#btn-pdf-paciente").addEventListener("click", () => descargarPdf("paciente"));

$("#btn-ejemplo").addEventListener("click", () => {
  Object.assign(estado, structuredClone(EJEMPLO), { ejemplo: true });
  $("#edad").value = estado.edad; $("#caidas").checked = estado.caidas;
  guardar(); render();
});
$("#btn-vaciar").addEventListener("click", () => { estado.meds = []; estado.ejemplo = false; guardar(); render(); });
$("#edad").addEventListener("change", () => { estado.edad = parseInt($("#edad").value, 10) || null; guardar(); render(); });
$("#caidas").addEventListener("change", () => { estado.caidas = $("#caidas").checked; guardar(); render(); });

$$(".tabs button").forEach((b) => b.addEventListener("click", () => { estado.tab = b.dataset.tab; render(); }));
// barra inferior (móvil): lleva al informe o, estando en él, de vuelta a la medicación
let enInforme = false;
const desplazar = (el) => el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
$("#btn-ir-informe").addEventListener("click", () => desplazar(enInforme ? $("aside") : $("#informe")));
new IntersectionObserver(([e]) => {
  enInforme = e.isIntersecting;
  $("#btn-ir-informe").firstChild.textContent = enInforme ? "Editar la medicación " : "Ver el informe ";
}, { rootMargin: "-40% 0px -55% 0px" }).observe($("#informe"));

$("#btn-copiar").addEventListener("click", async () => {
  const res = evaluar(datos, estado.meds, { edad: estado.edad, caidas: estado.caidas });
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
  const ctx = { edad: estado.edad, caidas: estado.caidas };
  const res = evaluar(datos, estado.meds, ctx);

  // lista de medicación
  const ul = $("#lista-meds");
  ul.innerHTML = "";
  $("#ejemplo-banner").hidden = !estado.ejemplo;
  res.items.forEach((it, i) => {
    const li = document.createElement("li");
    const dosis = it.dosisTotal != null
      ? `${it.dosisPorToma} ${it.unidad}${it.esDiaria && it.tomas > 1 ? ` × ${it.tomas}/día = ${it.dosisTotal} ${it.unidad}/día` : it.esDiaria ? "/día" : ""}`
      : "dosis no indicada";
    li.innerHTML = `
      <div class="med-nombre"><strong>${it.principio.nombre}</strong><small>${it.clase.nombre}</small></div>
      <div class="med-dosis">${dosis}${it.dosisCat === "alta" ? ' <span class="chip chip-alta">dosis alta</span>' : ""}</div>
      <button type="button" class="quitar" aria-label="Quitar ${it.principio.nombre}">×</button>`;
    li.querySelector(".quitar").addEventListener("click", () => { estado.meds.splice(i, 1); estado.ejemplo = false; guardar(); render(); });
    ul.append(li);
  });
  $("#sin-meds").hidden = res.items.length > 0;
  $("#informe").hidden = res.items.length === 0;
  if (!res.items.length) { $("#barra-inferior").hidden = true; return; }

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
    if (b.dataset.tab === "interacciones") { const n = res.interacciones.filter((x) => x.nivel !== "menor").length; c.textContent = n || ""; c.className = "cnt" + (res.interacciones.some((x) => x.nivel === "mayor") ? " c-alerta" : n ? " c-precaucion" : ""); }
    else { const { a, p } = cuenta(b.dataset.tab); c.textContent = a + p || ""; c.className = "cnt" + (a ? " c-alerta" : p ? " c-precaucion" : ""); }
  });
  $("#barra-inferior").hidden = false;
  $("#barra-contador").innerHTML = `<span style="background:var(--alerta)">${res.resumen.alerta}</span><span style="background:var(--precaucion)">${res.resumen.precaucion}</span>`;
  const cont = $("#contenido-tab");
  cont.innerHTML = "";

  if (estado.tab === "general") {
    if (res.combinadas.length) {
      const na = res.combinadas.filter((c) => c.regla.nivel === "alerta").length, np = res.combinadas.length - na;
      const sec = seccion("Por la combinación de su medicación", { clave: "combinadas", resumen: `${res.combinadas.length} avisos · ${resumenNiveles(na, np, 0)}` });
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
  if (!grupos.length) { const sec = document.createElement("section"); sec.innerHTML = `<p class="vacio">Sin indicaciones específicas para su medicación en este apartado.</p>`; cont.append(sec); return; }
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
    pintar(seccion(titulo ? `${titulo}: con avisos` : "Fármacos con avisos", { clave: (amb || "general") + ":avisos", resumen: `${conAvisos.length} fármacos · ${resumenNiveles(a, p, 0)}` }), conAvisos, true);
  }
  if (soloInfo.length) {
    pintar(seccion(titulo ? `${titulo}: solo información` : "Fármacos sin precauciones especiales", { abierta: !conAvisos.length, clave: (amb || "general") + ":info", resumen: `${soloInfo.length} fármacos · ${resumenNiveles(0, 0, soloInfo.reduce((n, g) => n + g.reglas.length, 0))}` }), soloInfo, false);
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
          <span class="txt"><h4>${it.principio.nombre}</h4><small>${it.clase.nombre}${dosis ? " · " + dosis : ""}${it.dosisCat === "alta" ? ' · <b>dosis alta</b>' : ""}</small></span>
          <span class="nivel">${etiqueta(max)}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </summary>
        <div class="cuerpo">
          ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
          <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${r.texto}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""}</span></li>`).join("")}</ul>
          ${it.clase.fuentes?.length ? `<p class="fuentes">Fuentes: ${it.clase.fuentes.join(" · ")}</p>` : ""}
        </div>
      </details>`;
  }
}

function renderInteracciones(cont, res) {
  const sec = document.createElement("section");
  if (!res.interacciones.length) {
    sec.innerHTML = `<p class="vacio">No se han encontrado interacciones relevantes entre los fármacos introducidos en las bases consultadas.</p>`;
  } else {
    for (const x of res.interacciones) {
      sec.insertAdjacentHTML("beforeend", `
        <article class="ddi ddi-${x.nivel}">
          <header><h4>${x.a.principio.nombre} <span class="mas">+</span> ${x.b.principio.nombre}</h4><span class="nivel">${datos.ddiCurado.niveles?.[x.nivel] || x.nivel}</span></header>
          <p>${x.efecto}</p>
          ${x.accion ? `<p class="accion"><b>Qué hacer:</b> ${x.accion}</p>` : ""}
          <footer>${x.fuente === "curada" ? "Revisión clínica propia" : x.fuente === "ddinter" ? "DDInter 2.0" : "Duplicidad detectada"}</footer>
        </article>`);
    }
  }
  const fuentes = [`${datos.ddiCurado.interacciones.length} interacciones revisadas en español`];
  if (datos.ddi?.pares?.length) fuentes.push(`DDInter 2.0 (${datos.ddi.pares.length.toLocaleString("es")} pares, ${datos.ddi.version})`);
  else fuentes.push("DDInter 2.0 pendiente de cargar");
  sec.insertAdjacentHTML("beforeend", `<p class="nota-fuentes">Fuentes consultadas: ${fuentes.join(" · ")}. Las interacciones dependen también de la dosis, la función renal y otros factores que esta herramienta no conoce.</p>`);
  cont.append(sec);
}

cargar();
