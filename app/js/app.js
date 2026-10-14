import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL } from "./engine.js";

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
  if (!estado.meds.length) Object.assign(estado, structuredClone(EJEMPLO), { ejemplo: true });
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
  const lineas = $("#pegar").value.split(/\n|;/).map((l) => l.trim()).filter(Boolean);
  const nuevos = [], noReconocidos = [];
  for (const l of lineas) {
    const m = l.match(/^([a-záéíóúñ\/\s\-\.]+?)\s*(\d+[\.,]?\d*)?\s*(mg|mcg|µg|ui|g)?\b.*?(?:(\d)\s*[-\/]\s*(\d)\s*[-\/]\s*(\d)|(\d+)\s*(?:veces|x|tomas)|c\/?(\d+)\s*h)?/i);
    const nombre = (m?.[1] || l).trim();
    const res = buscar(indice, nombre, 1);
    if (!res.length) { noReconocidos.push(l); continue; }
    let dosis = m?.[2] ? parseFloat(m[2].replace(",", ".")) : null;
    const u = (m?.[3] || "").toLowerCase();
    if (u === "g") dosis = dosis * 1000;
    const ref = indice.porId.get(res[0].pid);
    const unidad = ref.principio.unidad || "mg";
    if ((u === "mcg" || u === "µg") && unidad === "mg") dosis = dosis / 1000;
    let tomas = 1;
    if (m?.[4] != null) tomas = [m[4], m[5], m[6]].map(Number).filter((x) => x > 0).length || 1;
    else if (m?.[7]) tomas = parseInt(m[7], 10);
    else if (m?.[8]) tomas = Math.max(1, Math.round(24 / parseInt(m[8], 10)));
    nuevos.push({ pid: res[0].pid, dosis, tomas, unidad, dosisDesde: res[0].dosis ?? null });
  }
  if (nuevos.length) {
    if (estado.ejemplo) { estado.meds = []; estado.ejemplo = false; }
    for (const n of nuevos) { if (n.dosis == null && n.dosisDesde != null) n.dosis = n.dosisDesde; delete n.dosisDesde; estado.meds.push(n); }
  }
  $("#pegar-aviso").textContent = noReconocidos.length ? `No reconocidos: ${noReconocidos.join(", ")}` : "";
  $("#pegar").value = "";
  if (!noReconocidos.length) $("#pegar-wrap").hidden = true;
  guardar(); render();
});

$("#btn-ejemplo").addEventListener("click", () => {
  Object.assign(estado, structuredClone(EJEMPLO), { ejemplo: true });
  $("#edad").value = estado.edad; $("#caidas").checked = estado.caidas;
  guardar(); render();
});
$("#btn-vaciar").addEventListener("click", () => { estado.meds = []; estado.ejemplo = false; guardar(); render(); });
$("#edad").addEventListener("change", () => { estado.edad = parseInt($("#edad").value, 10) || null; guardar(); render(); });
$("#caidas").addEventListener("change", () => { estado.caidas = $("#caidas").checked; guardar(); render(); });

$$(".tabs button").forEach((b) => b.addEventListener("click", () => { estado.tab = b.dataset.tab; render(); }));

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
  if (!res.items.length) return;

  // resumen
  $("#resumen").innerHTML = ["alerta", "precaucion", "info"]
    .map((n) => `<div class="tile tile-${n}"><span class="num">${res.resumen[n]}</span><span>${etiqueta(n)}</span></div>`).join("") +
    `<div class="tile tile-ddi"><span class="num">${res.interacciones.length}</span><span>Interacciones</span></div>`;

  // tabs
  $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === estado.tab));
  const cont = $("#contenido-tab");
  cont.innerHTML = "";

  if (estado.tab === "general") {
    if (res.combinadas.length) {
      const sec = document.createElement("section");
      sec.innerHTML = `<h3>Por la combinación de su medicación</h3>`;
      for (const c of [...res.combinadas].sort((a, b) => ORDEN_NIVEL[b.regla.nivel] - ORDEN_NIVEL[a.regla.nivel])) {
        sec.insertAdjacentHTML("beforeend", `
          <article class="regla nivel-${c.regla.nivel}">
            <header><span class="nivel">${etiqueta(c.regla.nivel)}</span><h4>${c.regla.titulo}</h4></header>
            <p>${c.texto}</p>
            <footer>${c.implicados.map((it) => `<span class="chip">${it.principio.nombre}</span>`).join("")}</footer>
          </article>`);
      }
      cont.append(sec);
    }
    renderAmbito(cont, res.ambitos.general, "Fármaco por fármaco");
  } else if (estado.tab === "interacciones") {
    renderInteracciones(cont, res);
  } else {
    renderAmbito(cont, res.ambitos[estado.tab], null, estado.tab);
  }
  // perfil de señales
  const perfil = Object.entries(res.perfil).filter(([s]) => datos.kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s)).sort((a, b) => b[1].length - a[1].length);
  $("#perfil").innerHTML = perfil.length
    ? `<h3>Efectos que se acumulan</h3><ul>${perfil.map(([s, its]) => `<li><span class="num">${its.length}</span><span>${datos.kb.senales[s]}</span><small>${its.map((i) => i.principio.nombre).join(", ")}</small></li>`).join("")}</ul>`
    : "";
}

function renderAmbito(cont, grupos, titulo, amb) {
  const sec = document.createElement("section");
  if (titulo) sec.innerHTML = `<h3>${titulo}</h3>`;
  if (!grupos.length) { sec.insertAdjacentHTML("beforeend", `<p class="vacio">Sin indicaciones específicas para su medicación en este apartado.</p>`); cont.append(sec); return; }
  const orden = [...grupos].sort((a, b) => Math.max(...b.reglas.map((r) => ORDEN_NIVEL[r.nivel])) - Math.max(...a.reglas.map((r) => ORDEN_NIVEL[r.nivel])));
  for (const g of orden) {
    const it = g.item;
    const max = g.reglas.reduce((m, r) => (ORDEN_NIVEL[r.nivel] > ORDEN_NIVEL[m] ? r.nivel : m), "info");
    const dosis = it.dosisTotal != null ? `${it.dosisTotal} ${it.unidad}${it.esDiaria ? "/día" : ""}` : "";
    sec.insertAdjacentHTML("beforeend", `
      <article class="farmaco nivel-${max}">
        <header>
          <div><h4>${it.principio.nombre}</h4><small>${it.clase.nombre}${dosis ? " · " + dosis : ""}${it.dosisCat === "alta" ? ' · <b>dosis alta</b>' : ""}</small></div>
          <span class="nivel">${etiqueta(max)}</span>
        </header>
        ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
        <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${r.texto}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""}</span></li>`).join("")}</ul>
        ${it.clase.fuentes?.length ? `<footer>Fuentes: ${it.clase.fuentes.join(" · ")}</footer>` : ""}
      </article>`);
  }
  cont.append(sec);
}

function renderInteracciones(cont, res) {
  const sec = document.createElement("section");
  if (!res.interacciones.length) {
    sec.innerHTML = `<p class="vacio">No se han encontrado interacciones relevantes entre los fármacos introducidos en las bases consultadas.</p>`;
  } else {
    for (const x of res.interacciones) {
      sec.insertAdjacentHTML("beforeend", `
        <article class="ddi ddi-${x.nivel}">
          <header><span class="nivel">${datos.ddiCurado.niveles?.[x.nivel] || x.nivel}</span><h4>${x.a.principio.nombre} <span class="mas">+</span> ${x.b.principio.nombre}</h4></header>
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
