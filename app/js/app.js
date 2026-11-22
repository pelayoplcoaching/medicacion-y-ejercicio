import { construirIndice, buscar, evaluar, informeTexto, ORDEN_NIVEL, MOMENTOS, MOMENTO_TXT, HORA_MOMENTO, momentosPorDefecto, ventanaEntrenamiento, loEsencial, ALARMA, sintomasPosibles, SINTOMAS, sesionTipo, objetivoSemanal, rachaSemanas, progresion, planSemana, minutosPorSemana, compararListas, constantesRelevantes, chequeoPrevio, veredictoChequeo, SINTOMAS_ACSM, enfermedadSugerida, cribadoACSM, CRIBADO_TXT, nivelEvidencia, EVIDENCIA, seccionFT, comprobarCaso, zonaIntensidad, impactoPorFarmaco, puntuarSPPB, vivifrailDeSppb, evolucion, textoEvolucion, tipoProducto, unidadPorDia, unidadPorToma, normalizar } from "./engine.js?v=202611222207";
import { APP_VERSION } from "./version.js?v=202611222207";
import { picto } from "./pictos.js?v=202611222207";
import { textoHistoria, prescripcion, listasVistazo, ritmoTexto, filasPlanPaciente } from "./informes.js?v=202611222207";
import { cargarScript } from "./libs.js?v=202611222207";
import { t, tEs, aplicarIdioma, detectarIdioma, idioma } from "./i18n.js?v=202611222207";

// Si la hoja de estilos aún no ha llegado (los módulos se precargan en paralelo), esperar: así la primera maquetación ya es la definitiva y no hay saltos.
await new Promise((ok) => { const l = document.querySelector('link[rel="stylesheet"]'); if (!l || l.sheet) ok(); else { l.addEventListener("load", ok, { once: true }); l.addEventListener("error", ok, { once: true }); setTimeout(ok, 4000); } });

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
// Safari de iOS 15.0-15.3 no conoce <dialog>: ventana mínima (abrir, cerrar, Esc) para que la app no se rompa; la coloca el CSS (.dlg-reserva)
if (typeof HTMLDialogElement !== "function") {
  for (const d of $$("dialog")) {
    d.classList.add("dlg-reserva");
    Object.defineProperty(d, "open", { configurable: true, get: () => d.hasAttribute("open"), set: (v) => d.toggleAttribute("open", !!v) });
    d.show = d.showModal = () => { d.setAttribute("open", ""); (d.querySelector("[autofocus], input, select, textarea, button") || d).focus?.(); };
    d.close = (v) => { if (!d.hasAttribute("open")) return; d.removeAttribute("open"); if (v !== undefined) d.returnValue = String(v); d.dispatchEvent(new Event("close")); };
  }
  document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; const d = [...document.querySelectorAll("dialog[open]")].pop(); if (d && d.dispatchEvent(new Event("cancel", { cancelable: true }))) d.close(); });
}
/** Nombre del momento de la toma en el idioma de la interfaz (el motor guarda el español en MOMENTO_TXT). */
const momTxt = (m) => t("mom." + m) || MOMENTO_TXT[m];

/** Medicación que entra en el informe (los fármacos "pausados" se quedan en la lista pero no cuentan). */
/** Movimiento futurista (mejoras 381-530): permitido salvo «reducir movimiento» y pruebas automáticas; últimas cifras mostradas. */
const MOV = { ok: () => !matchMedia("(prefers-reduced-motion: reduce)").matches && !navigator.webdriver, cifras: new Map() };
if (navigator.webdriver) document.documentElement.classList.add("pa-quieto"); // las pruebas automáticas ven cada pantalla en su estado final
const medsActivos = () => estado.meds.filter((m) => !m.pausado && !m.libre);
const medsLibres = () => estado.meds.filter((m) => m.libre);
/** Módulos que no hacen falta al abrir (se piden la primera vez que se usan y se precargan cuando el navegador está libre). */
const cargarParser = () => (cargarParser.p ||= import("./parser.js?v=202611222207")); // lector de listas pegadas y PDF: solo al leer una lista
const cargarOcr = () => (cargarOcr.p ||= import("./ocr.js?v=202611222207")); // lectura de fotos y escaneos
const cargarSemana = () => (cargarSemana.p ||= import("./semana.js?v=202611222207"));
const cargarPorque = () => (cargarPorque.p ||= import("./porque.js?v=202611222207"));
const cargarMov = () => (cargarMov.p ||= import("./movimiento.js?v=202611222207"));
const cargarAprende = () => (cargarAprende.p ||= import("./aprende.js?v=202611222207"));
const cargarPruebas = () => (cargarPruebas.p ||= import("./pruebas.js?v=202611222207"));
/** Pruebas de forma física (mejora grande 8): Senior Fitness Test con baremos por edad y sexo. El historial va en el estado (y con cada paciente guardado). */
function abrirPruebas() {
  const res = datos ? evaluar(datos, medsActivos(), ctxActual()) : null, c = ctxActual(), crib = cribadoACSM(estado.cribado).clave;
  const ctxP = { edad: estado.edad, sft: estado.sft, presentes: res ? porquesDe(res.items.flatMap((it) => [...it.senales])) : [], fragil: c.fragilidad === "fragil", consultar: crib === "valoracion_antes" || crib === "parar", ic: estado.condiciones.includes("insuficiencia_cardiaca"), osteoporosis: estado.condiciones.includes("osteoporosis"), cargarVoz: () => cargarVoz(), toast, vibrar, guardar: (sft) => { estado.sft = sanearSft(sft); guardar(); render(); } };
  cargarPruebas().then((m) => m.abrir(ctxP)).catch(() => { cargarPruebas.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-pruebas]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirPruebas(); } });
const cargarMetas = () => (cargarMetas.p ||= import("./metas.js?v=202611222207"));
/** Metas de la vida diaria (mejora grande 9): hasta 3, con 4 hitos cada una; el plan las señala en los ejercicios que las trabajan. */
const METAS_IDS = ["escaleras", "suelo", "compra", "caminar", "nietos", "seguro", "vestirse", "viajar"];
let metaRecien = null; // la meta que acaba de avanzar (su icono «salta» una vez)
const ctxMetas = (S) => ({ metas: estado.metas, sft: estado.sft, pruebas: S, vibrar, guardar: (e) => { estado.metas = sanearMetas(e); guardar(); render(); } });
function abrirMetas(id = null) {
  Promise.all([cargarMetas(), cargarPruebas()]).then(([M, S]) => M.abrir(ctxMetas(S), id)).catch(() => { cargarMetas.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-metas], [data-meta-ver], [data-meta-elegir], [data-meta-hito]"); if (!b) return;
  ev.preventDefault(); $("#menu-mas").open = false;
  if (b.matches("[data-metas]")) return abrirMetas();
  if (b.matches("[data-meta-ver]")) return abrirMetas(b.dataset.metaVer);
  cargarMetas().then((M) => {
    const antes = estado.metas;
    if (b.matches("[data-meta-elegir]")) { estado.metas = sanearMetas(M.alternar(antes, b.dataset.metaElegir)); guardar(); render(); return; }
    const id = b.dataset.metaHito, k = Number(b.dataset.k);
    estado.metas = sanearMetas(M.marcar(antes, id, k, true)); metaRecien = id; guardar(); render(); vibrar([20, 60, 20]);
    toast(M.tx("hito_ok", { x: M.POR_ID[id].hitos[k] }), { accion: M.tx("deshacer"), onAccion: () => { estado.metas = antes; guardar(); render(); }, ms: 6000 });
  }).catch(() => { cargarMetas.p = null; });
});
const cargarMes = () => (cargarMes.p ||= import("./mes.js?v=202611222207"));
/** Resumen del mes (mejora grande 12): comparado con el mes anterior y con imagen para la familia o el médico. */
function abrirMes() {
  Promise.all([cargarMes(), cargarMetas(), cargarPruebas(), cargarSemana()]).then(([Mm, M, S, Se]) => {
    const res = datos ? evaluar(datos, medsActivos(), ctxActual()) : null, P = res ? prescripcion(res, ctxActual()) : null;
    const o = Se.objetivos({ fragil: esFragil(), eq: P?.eq.n ?? 2 }), diario = leerDiario();
    Mm.abrir({ diario, objMin: o.min, eqN: o.equilibrio, metas: estado.metas, POR_ID: M.POR_ID, sft: estado.sft, pruebas: S, racha: Se.rachaAmable(diario, o.min).semanas,
      cuidados: res ? porquesDe(res.items.flatMap((it) => [...it.senales])).map((id) => t("pq.b." + id).toLowerCase()) : [],
      farmacos: medsActivos().map((m) => indice.porId.get(m.pid)?.principio?.nombre || m.pid), toast });
  }).catch(() => { cargarMes.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-mes]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirMes(); } });
const cargarCalor = () => (cargarCalor.p ||= import("./calor.js?v=202611222207"));
/** «Hoy hace calor» (mejora grande 10): la persona dice qué tiempo hace (nada de ubicación); se recuerda solo ese día, en este dispositivo. */
function nivelCalorHoy() { try { const c = JSON.parse(localStorage.getItem("medex.calor") || "null"); return c?.fecha === hoyISO() && Number.isInteger(c.nivel) && c.nivel >= 0 && c.nivel <= 3 ? c.nivel : null; } catch { return null; } }
function escribirCalor(nivel) { try { localStorage.setItem("medex.calor", JSON.stringify({ fecha: hoyISO(), nivel })); } catch {} }
function abrirCalor() {
  const res = datos ? evaluar(datos, medsActivos(), ctxActual()) : null;
  const farmacos = res ? res.items.map((it) => ({ nombre: it.principio.nombre, ids: porquesDe(it.senales) })) : [];
  cargarCalor().then((C) => C.abrir({ nivel: nivelCalorHoy(), edad: estado.edad, limiteLiquidos: estado.condiciones.includes("insuficiencia_cardiaca") || estado.condiciones.includes("renal"), farmacos, guardar: (n) => { escribirCalor(n); renderHoy(); } }))
    .catch(() => { cargarCalor.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
const CALOR_N = ["calor.n0", "calor.n1", "calor.n2", "calor.n3"], CALOR_R = [null, "calor.r1", "calor.r2", "calor.r3"];
/** Fila de «Hoy»: de mayo a septiembre (o si ya lo dijo hoy) pregunta qué tiempo hace y resume qué hacer. */
function filaCalor() {
  const n = nivelCalorHoy(), mes = new Date().getMonth();
  if (n == null && (mes < 4 || mes > 8)) return "";
  return `<div class="hoy-calor${n != null ? " n" + n : ""}"><small>${t("calor.pregunta")}</small><div class="calor-chips" role="group" aria-label="${t("calor.pregunta")}">${CALOR_N.map((k, i) => `<button type="button" class="chip chip-btn${n === i ? " activo" : ""}" data-calor="${i}" aria-pressed="${n === i}">${t(k)}</button>`).join("")}</div>${n ? `<p class="calor-resumen"><span>${t(CALOR_R[n])}</span> <button type="button" class="btn-sec sm" data-calor-ver="">${t("calor.ver")}</button></p>` : ""}</div>`;
}
document.addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-calor], [data-calor-ver]"); if (!b) return;
  ev.preventDefault(); $("#menu-mas").open = false;
  if (b.matches("[data-calor-ver]")) return abrirCalor();
  escribirCalor(Number(b.dataset.calor)); renderHoy(); vibrar(10);
  $(`.hoy-calor [data-calor="${b.dataset.calor}"]`)?.focus({ preventScroll: true });
});
const cargarConstantes = () => (cargarConstantes.p ||= import("./constantes.js?v=202611222207"));
/** Mis constantes (mejora grande 13): gráficas de lo anotado en el diario con las franjas de su situación y valores para comentar. */
function abrirConstantes() {
  const res = datos ? evaluar(datos, medsActivos(), ctxActual()) : null, sen = new Set(res ? res.items.flatMap((it) => [...it.senales]) : []);
  const relevantes = res ? constantesRelevantes(res, ctxActual()).map((c) => c.id) : [];
  cargarConstantes().then((C) => C.abrir({ diario: leerDiario(), edad: estado.edad, relevantes, fcNoValida: sen.has("fc_no_valida"), insulina: sen.has("hipoglucemia"), toast }))
    .catch(() => { cargarConstantes.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-constantes]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirConstantes(); } });
const cargarPastillero = () => (cargarPastillero.p ||= import("./pastillero.js?v=202611222207"));
const ICONO_TIPO = { aerobico: "aerobico", fuerza: "fuerza", fuerza_eq: "fuerza", equilibrio: "equilibrio", descanso: "paseo", paseo: "paseo" };
/** Mi pastillero (mejora grande 14): las tomas por momentos del día con la ventana de entrenamiento y la hoja de la semana para imprimir. */
function abrirPastillero() {
  const meds = estado.meds.filter((m) => !m.pausado).map((m) => {
    const ref = m.libre ? null : indice.porId.get(m.pid);
    if (!m.libre && !ref) return null;
    return { nombre: m.libre ? m.nombre : ref.principio.nombre, dosis: m.dosis, unidad: m.unidad || ref?.principio.unidad || "mg", momentos: m.momentos?.length ? m.momentos : momentosPorDefecto(m.tomas || 1), aDemanda: !!m.aDemanda, ic: ref ? iconoGrupo(ref.clase) : "", nota: m.combo ? t("pt.en_combo", { m: m.combo }) : "" };
  }).filter(Boolean);
  const irHoras = () => { estado.tab = "cuando"; render(); requestAnimationFrame(() => { const i = $('#contenido-tab [data-hora="desayuno"]'); if (i) { desplazar(i); i.focus({ preventScroll: true }); } }); };
  cargarPastillero().then((P) => P.abrir({ meds, horas: { ...estado.horas }, ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), franja: franjaHoy(), plan: planActual(), iconos: Object.fromEntries(Object.entries(ICONO_TIPO).map(([k, n]) => [k, icono(n, "pt-ti")])), momentos: Object.fromEntries(MOMENTOS.map((m) => [m, momTxt(m)])), version: APP_VERSION, irHoras }))
    .catch(() => { cargarPastillero.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-pastillero]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirPastillero(); } });
const cargarDosis = () => (cargarDosis.p ||= import("./dosis.js?v=202611222207"));
/** «¿Cuánto movimiento hace falta?» (mejora grande 4): curvas de dosis y respuesta con su punto del diario. */
function abrirDosis() { cargarDosis().then((D) => D.abrir({ diario: leerDiario(), edad: estado.edad })).catch(() => { cargarDosis.p = null; toast(t("pq.error"), { ms: 4000 }); }); }
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-dosis]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirDosis(); } });
const cargarSimula = () => (cargarSimula.p ||= import("./simula.js?v=202611222207"));
/** «¿Qué cambia si…?» (mejora grande 16): el escenario se calcula en simula.js con el motor que se le pasa; la lista real no se toca. */
function abrirSimula(quitar = []) {
  const meds = datos ? medsActivos().map((m) => { const ref = indice.porId.get(m.pid); return ref ? { pid: m.pid, nombre: ref.principio.nombre, clase: ref.clase.id, ic: iconoGrupo(ref.clase) } : null; }).filter(Boolean) : [];
  if (!meds.length) { toast(t("sim.vacio"), { ms: 3500 }); return; }
  const ctx = ctxActual(), top = impactoPorFarmaco(evaluar(datos, medsActivos(), ctx)).filter((x) => x.puntos > 0).sort((a, b) => b.puntos - a.puntos)[0];
  const motor = { evaluar: (ms) => evaluar(datos, ms, ctx), prescripcion: (res) => prescripcion(res, ctx), ventana: (ms) => ventanaEntrenamiento(indice, ms, estado.horas), franja: franjaDe, unidad: (pid) => indice.porId.get(pid)?.principio.unidad, cuidados: (sen) => porquesDe(sen).map((id) => ({ id, txt: t("pq.b." + id) })) };
  cargarSimula().then((S) => S.abrir({ meds, lista: medsActivos(), motor, quitar, sugerido: top?.item.principio.id, version: APP_VERSION, toast }))
    .catch(() => { cargarSimula.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-simula]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirSimula(b.dataset.simula ? [b.dataset.simula] : []); } });
const SFT_REPETIR = 56; // días: se proponen cada 8-12 semanas
/** Azulejo del plan: cuándo las hizo por última vez y si toca repetirlas. Se enseña desde los 60 años (los baremos son de 60 a 94) o si ya hay resultados. */
function tileSft() {
  const ult = estado.sft?.hist?.at(-1);
  if (!ult && estado.edad != null && estado.edad < 60) return "";
  const toca = !!ult && Date.now() - ult.f >= SFT_REPETIR * 864e5, d = ult ? new Date(ult.f).toLocaleDateString(idioma(), { day: "numeric", month: "short" }) : "";
  return `<div class="pruebas-tile${toca ? " toca" : ""}"><span class="sft-ic-t" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg></span><span><b>${t("sft.tile")}</b><small>${ult ? t(toca ? "sft.tile_toca" : "sft.tile_ult", { d }) : t("sft.tile_nunca")}</small></span><button type="button" class="btn-sec sm" data-pruebas="">${t("sft.abrir")}</button></div>`;
}
/** «Aprende» (mejora grande 2): lecciones de 2 minutos; se recomiendan según los mecanismos de su lista, su edad y si es hipertenso. */
function abrirAprende(id = null) {
  const res = datos ? evaluar(datos, medsActivos(), ctxActual()) : null, c = ctxActual();
  const ctxA = { presentes: res ? porquesDe(res.items.flatMap((it) => [...it.senales])) : [], edad: c.edad ?? null, hipertension: c.condiciones?.has?.("hipertension") || false };
  cargarAprende().then((m) => m.abrir(id, ctxA)).catch(() => { cargarAprende.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
const leccionesHechas = () => { try { return Object.keys(JSON.parse(localStorage.getItem("medex.aprende") || "{}")).length; } catch { return 0; } };
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-aprende]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; b.closest("dialog")?.close?.(); abrirAprende(b.dataset.aprende || null); } });
document.addEventListener("aprende", () => { const n = $(".aprende-tile .apr-n"); if (n) n.textContent = t("apr.tile_n", { n: leccionesHechas() }); });
/** Biblioteca de ejercicios (segunda tanda, 4): 45 ejercicios con dibujo y «Cambiar» uno del plan por otro del mismo tipo (js/biblioteca.js).
    Lo cambiado va en localStorage («medex.cambios»); se aplica en cuanto la biblioteca ha cargado (al arrancar, solo si hay cambios). */
let BIB = null, MOVM = null;
const cargarBiblio = () => (cargarBiblio.p ||= Promise.all([import("./biblioteca.js?v=202611222207"), cargarMov()]).then(([B, M]) => { BIB = B; MOVM = M; return B; }));
const hayCambios = () => { try { return (localStorage.getItem("medex.cambios") || "").length > 2; } catch { return false; } };
/** Programa de 12 semanas (segunda tanda, 3; js/programa.js): fija los minutos de paseo y las series de la semana, y avanza solo con el diario.
    El estado va en localStorage («medex.programa»); el módulo se carga al arrancar solo si hay un programa en marcha. */
let PRG = null;
const cargarPrograma = () => (cargarPrograma.p ||= import("./programa.js?v=202611222207").then((m) => { PRG = m; return m; }));
const hayPrograma = () => { try { return !!localStorage.getItem("medex.programa"); } catch { return false; } };
const diasConSesion = () => Object.values(planActual()).filter((x) => x && x !== "descanso");
/** Semana del programa en vigor (o null). Una vez al día pone el programa al día con el diario y avisa de lo decidido. */
function semPrograma() {
  if (!PRG) { if (hayPrograma() && !cargarPrograma.p) cargarPrograma().then(() => render(), () => { cargarPrograma.p = null; }); return null; }
  if (semPrograma.dia !== hoyISO()) {
    semPrograma.dia = hoyISO();
    const d = PRG.actualizar(leerDiario(), { sesPlan: diasConSesion().length }).at(-1);
    if (d) { const v = PRG.veredicto(d); setTimeout(() => toast(`<b>${t("prg.tile")}:</b> ${v.titulo.toLowerCase()}. ${v.texto}`, { ms: 9000 }), 600); }
  }
  return PRG.semanaActual();
}
/** Objetivo de la semana del programa: sesiones y minutos según los días y las sesiones del plan. */
function objetivoPrograma(sem = semPrograma()) { if (!sem) return null; const f = esFragil(); return PRG.objetivo(sem, diasConSesion().map((x) => sesionDe(x, { fragil: f, minutosAer: f ? 10 : 30 }).min)); }
function abrirPrograma() {
  $("#menu-mas").open = false;
  cargarPrograma().then((M) => M.abrir({ cerrar: t("ficha.cerrar"), fragil: esFragil(), diario: leerDiario, toast, cambiado: () => { semPrograma.dia = null; render(); },
    contexto: () => { const l = lunesDe(); return { obj: objetivoPrograma(), hechas: leerDiario().filter((x) => new Date(x.fecha + "T12:00") >= l).length }; },
    abrirPruebas: () => { const b = document.createElement("button"); b.dataset.pruebas = ""; document.body.append(b); b.click(); b.remove(); } }))
    .catch(() => { cargarPrograma.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-programa]"); if (b) { ev.preventDefault(); b.closest("dialog")?.close?.(); abrirPrograma(); } });
/** Módulos bajo demanda de la segunda tanda (desde la mejora 5): se abren con data-abre="nombre" (y data-arg opcional) y reciben todos
    la misma interfaz de la aplicación, api(). Así cada módulo nuevo solo añade aquí su línea de import y app.js no crece. */
const MODULOS = {
  rato: () => import("./rato.js?v=202611222207"), // 5 · «Hoy tengo…»: sesión de 5 a 30 minutos y píldoras de movimiento
  paseo: () => import("./paseo.js?v=202611222207"), // 6 · paseo guiado con metrónomo, voz, prueba del habla y programa de 8 semanas
  dolor: () => import("./dolor.js?v=202611222207"), // 7 · «Me duele…»: semáforo del dolor y plan adaptado por zona
  vuelta: () => import("./vuelta.js?v=202611222207"), // 8 · volver tras un parón, una enfermedad o un ingreso
  primeros: () => import("./primeros.js?v=202611222207"), // 13 · los primeros 14 días: un paso pequeño cada día
  cuerpo: () => import("./cuerpo.js?v=202611222207"), // 9 · su medicación en el cuerpo: figura con once zonas
  preguntas: () => import("./preguntas.js?v=202611222207"), // 11 · mis preguntas para la consulta
  mitos: () => import("./mitos.js?v=202611222207"), // 12 · mitos sobre medicación y ejercicio
  cien: () => import("./cien.js?v=202611222207"), // 10 · «De cada 100 personas…»: cajas de datos en números absolutos
  numeros: () => import("./numeros.js?v=202611222207"), // 17 · números antes de entrenar: adelante, suave u hoy no
};
/** Banda de «Los primeros 14 días» en el panel de hoy: mientras dura el arranque (hasta 4 semanas) o, si aún no hay sesiones, como invitación. */
function bandaPrimeros(diario) {
  let o = null; try { o = JSON.parse(localStorage.getItem("medex.primeros") || "null"); } catch {}
  const d = o?.inicio ? Math.floor((new Date(hoyISO() + "T12:00") - new Date(o.inicio + "T12:00")) / 864e5) + 1 : 0;
  if (o?.fin || d > 28 || (!d && diario.length > 2)) return "";
  return `<div class="aprende-tile prg-tile" id="pri-banda"><span class="apr-ic-t" aria-hidden="true">14</span><span><b>${t("pri.titulo")}</b><small>${d ? t("pri.dia", { n: Math.min(14, Math.max(1, d)) }) : t("pri.invita")}</small></span><button type="button" class="btn-sec sm" data-abre="primeros" aria-label="${t(d ? "sft.abrir" : "prg.empezar")}: ${t("pri.titulo")}">${t(d ? "sft.abrir" : "prg.empezar")}</button></div>`;
}
const api = () => (api.o ||= { toast, icono, render, guardar, hoyISO, lunesDe, leerDiario, escribirDiario, registrarSesion, celebrar, esFragil, ctxActual, medsActivos, planActual, planDeHoy, franjaHoy, nivelCalorHoy, sesionDe, abrirSesion, abrirEjercicio, abrirBiblioteca, abrirPrograma, porquesDe, cribadoActual, glosar, leerVariantes, descargarTexto, vibrar, anilloCrono, desplazar, leerNum, ponerNum, cargarVoz, cargarMov, cargarBiblio, cargarPrograma, MOV, abrir: abrirModulo,
  get estado() { return estado; }, get datos() { return datos; }, get indice() { return indice; }, res: () => evaluar(datos, medsActivos(), ctxActual()), cerrar: () => t("ficha.cerrar"),
  dibujo: (id) => picto(id) || MOVM?.estatico(id) || "", irTab: (tab) => { estado.tab = tab; render(); desplazar($(".tabs")); },
  verFicha: (pid) => { ficha.showModal(); fichaInput.value = indice.porId.get(pid)?.principio.nombre || ""; fichaLista.hidden = true; mostrarFicha(pid); } });
const cargarModulo = (n) => (MODULOS[n].p ||= MODULOS[n]());
function abrirModulo(n, arg = null) { $("#menu-mas").open = false; return cargarModulo(n).then((M) => M.abrir(api(), arg), () => { MODULOS[n].p = null; toast(t("pq.error"), { ms: 4000 }); }); }
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-abre]"); if (b && MODULOS[b.dataset.abre]) { ev.preventDefault(); b.closest("dialog")?.close?.(); abrirModulo(b.dataset.abre, b.dataset.arg || null); } });
function sesionDe(tipo, o) {
  const sem = semPrograma();
  let s = sesionTipo(tipo, sem ? { ...o, aer: sem.aer } : o); if (!s) return s;
  if (BIB) s = BIB.aplicar(s);
  else if (hayCambios() && !cargarBiblio.p) cargarBiblio().then(() => render(), () => { cargarBiblio.p = null; });
  return sem ? PRG.ajustar(s, sem) : s;
}
function abrirBiblioteca(cambiar = null) {
  $("#menu-mas").open = false;
  const presentes = () => (datos && medsActivos().length ? porquesDe(evaluar(datos, medsActivos(), ctxActual()).items.flatMap((it) => [...it.senales])) : []);
  const enPlan = () => { try { const f = esFragil(); return [...new Set(Object.values(planActual()))].filter((x) => x && x !== "descanso").flatMap((x) => sesionDe(x, { fragil: f, minutosAer: f ? 10 : 30 }).bloques.map((b) => b.nombre)); } catch { return []; } };
  cargarBiblio().then((B) => B.abrir({ cerrar: t("ficha.cerrar"), toast, enPlan, cambiado: () => render(), dibujo: (id) => picto(id) || MOVM.estatico(id),
    verEjercicio: (b) => MOVM.abrir(b, { presentes: presentes(), variante: leerVariantes()[b.nombre] || "normal" }) }, { cambiar }))
    .catch(() => { cargarBiblio.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => {
  const c = ev.target.closest("[data-cambiar]"); if (c) { ev.preventDefault(); ev.stopPropagation(); abrirBiblioteca({ nombre: c.dataset.cambiar, pict: c.dataset.pict }); return; }
  const b = ev.target.closest("[data-biblioteca]"); if (b) { ev.preventDefault(); abrirBiblioteca(); }
});
/** Ejercicios animados (mejora grande 7): el pictograma de cada ejercicio es un botón que abre su ficha con el movimiento. */
const botonPicto = (b) => `<button type="button" class="picto-btn" data-ejercicio="${b.nombre}" aria-label="${t("ej.ver")}: ${b.nombre}">${picto(b.pict) || MOVM?.estatico(b.pict) || ""}</button>`;
/** El bloque completo de un ejercicio por su nombre (en cualquiera de las sesiones tipo, de nivel estándar o frágil, o en la biblioteca). */
function buscarBloque(nombre) {
  for (const tipo of ["fuerza_eq", "fuerza", "aerobico", "equilibrio"]) for (const fragil of [false, true]) { const b = sesionTipo(tipo, { fragil, minutosAer: fragil ? 10 : 30 }).bloques.find((x) => x.nombre === nombre); if (b) return b; }
  const e = BIB?.porNombre(nombre); return e ? BIB.bloqueDe(e.id) : null;
}
function abrirEjercicio(nombre, reintento = false) {
  const b = buscarBloque(nombre);
  if (!b) { if (!reintento && !BIB) cargarBiblio().then(() => abrirEjercicio(nombre, true), () => { cargarBiblio.p = null; }); return; }
  const presentes = datos ? porquesDe(evaluar(datos, medsActivos(), ctxActual()).items.flatMap((it) => [...it.senales])) : [];
  cargarMov().then((m) => m.abrir(b, { presentes, variante: leerVariantes()[b.nombre] || "normal" })).catch(() => { cargarMov.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
// en fase de captura: dentro de la sesión el dibujo está en la etiqueta de la casilla y el toque no debe marcarla
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-ejercicio]"); if (b) { ev.preventDefault(); ev.stopPropagation(); abrirEjercicio(b.dataset.ejercicio); } }, true);
/** «¿Por qué?» (mejora grande 1): explicador animado de cada mecanismo, por señal de la base (el contenido está en js/porque.js). */
const PQ_SENAL = { fc_no_valida: "pulso", bradicardia: "pulso", hipoglucemia: "azucar", enmascara_hipoglucemia: "azucar", sangrado: "sangrado", hipotension: "tension", deshidratacion: "agua", hipopotasemia: "agua", hiponatremia: "agua", renal: "agua", litio: "agua", calor: "calor", anticolinergico: "calor", sedacion: "equilibrio", caidas: "equilibrio", miopatia: "musculo", tendon: "tendon", qt: "ritmo", taquicardia: "acelera", perdida_muscular: "fuerza_hueso", hueso: "fuerza_hueso", fotosensibilidad: "sol", hipertension: "tension_alta", fatiga: "cansancio" };
const PQ_ORDEN = ["pulso", "azucar", "sangrado", "tension", "agua", "calor", "equilibrio", "musculo", "tendon", "ritmo", "acelera", "fuerza_hueso", "sol", "tension_alta", "cansancio"];
const porquesDe = (senales) => PQ_ORDEN.filter((id) => [...senales].some((s) => PQ_SENAL[s] === id));
const chipsPorque = (senales) => { const ids = porquesDe(senales); return ids.length ? `<div class="pq-chips"><span>${t("pq.entender")}</span>${ids.map((id) => `<button type="button" class="chip chip-btn pq-btn" data-porque="${id}">${t("pq.b." + id)}</button>`).join("")}</div>` : ""; };
function abrirPorque(id) {
  const res = evaluar(datos, medsActivos(), ctxActual());
  const farmacos = {};
  for (const it of res.items) for (const p of porquesDe(it.senales)) (farmacos[p] ||= []).includes(it.principio.nombre) || farmacos[p].push(it.principio.nombre);
  cargarPorque().then((m) => m.abrir(id, { farmacos, presentes: PQ_ORDEN.filter((p) => farmacos[p]) })).catch(() => { cargarPorque.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-porque]"); if (b) { ev.preventDefault(); abrirPorque(b.dataset.porque); } });
/** Centro de herramientas (segunda tanda, 2): todo en una pantalla, con buscador, favoritas y «Para usted hoy» (js/centro.js). */
const cargarCentro = () => (cargarCentro.p ||= import("./centro.js?v=202611222207"));
function abrirCentro(foco = false) {
  $("#menu-mas").open = false;
  const aPlan = (tab) => { estado.tab = tab; render(); desplazar($(".tabs")); };
  cargarBiblio().catch(() => { cargarBiblio.p = null; }); // para que el buscador encuentre también los ejercicios de la biblioteca
  cargarCentro().then((C) => C.abrir({ masEjercicios: () => (BIB ? BIB.nombres() : []), indice, glosario: GLOSARIO, porques: PQ_ORDEN, enLista: new Set(estado.meds.map((m) => m.pid)), toast, cargarAprende, irHabitos, irTab: aPlan,
    hechos: () => { const res = datos && medsActivos().length ? evaluar(datos, medsActivos(), ctxActual()) : null, hoy = planDeHoy(), diario = leerDiario(); return { n: estado.meds.length, pro: estado.modo === "profesional", edad: estado.edad, crib: res ? cribadoActual(res).clave : null, calor: nivelCalorHoy(), tipoHoy: hoy.tipo, etiquetaHoy: hoy.etiqueta, hecho: diario.some((x) => x.fecha === hoyISO()), mayores: res ? res.interacciones.filter((x) => x.nivel === "mayor").length : 0, hab: estado.habitos, metas: estado.metas?.ids?.length || 0, sft: estado.sft?.hist?.at(-1)?.f || 0, lecciones: leccionesHechas(), copia: leerNum("medex.ultima_copia"), hayDiario: diario.length > 0, ult: diario.at(-1)?.fecha || null }; },
    verFicha: (pid) => { ficha.showModal(); fichaInput.value = indice.porId.get(pid)?.principio.nombre || ""; fichaLista.hidden = true; mostrarFicha(pid); },
    sesionHoy: () => { const h = planDeHoy(); if (h.tipo === "descanso") aPlan("plan"); else abrirSesion(h.tipo); },
    irCribado: () => { const d = $("#bloque-cribado"); d.open = true; desplazar(d); },
    irBeneficios: () => { estado.tab = "general"; render(); const d = $('details[data-sec="beneficios"]'); if (d) d.open = true; desplazar(d || $(".tabs")); },
    irDescargas: () => desplazar($("#descargas")) }, { foco }), () => { cargarCentro.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
document.addEventListener("click", (ev) => { if (ev.target.closest("[data-centro]")) { ev.preventDefault(); abrirCentro(); } });
document.addEventListener("keydown", (ev) => { if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && ev.key.toLowerCase() === "k") { ev.preventDefault(); abrirCentro(true); } });

/* ---------- avisos breves (toast) con acción opcional ---------- */
let toastTimer = null;
function toast(msg, { accion, onAccion, ms = 6000 } = {}) {
  const el = $("#toast");
  el.innerHTML = `<span>${msg}</span>${accion ? `<button type="button" class="btn-sec sm">${accion}</button>` : ""}`;
  el.hidden = false;
  el.classList.add("visible");
  el.style.setProperty("--toast-ms", ms + "ms"); el.classList.remove("cuenta"); void el.offsetWidth; el.classList.add("cuenta"); // mejora 419: línea que se vacía mientras dura el aviso
  if (accion) el.querySelector("button").addEventListener("click", () => { onAccion?.(); ocultarToast(); });
  clearTimeout(toastTimer); toastTimer = setTimeout(ocultarToast, ms);
}
function ocultarToast() { const el = $("#toast"); el.classList.remove("visible"); setTimeout(() => { el.hidden = true; }, 250); }

/* ---------- iconos (trazos propios, 24×24) ---------- */
const ICONS = {
  persona: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z",
  informe: "M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5zM8 11h8v1.8H8V11zm0 3.5h8v1.8H8v-1.8zM8 18h5v1.8H8V18z",
  barras: "M3 5h2v14H3V5zm3 0h1v14H6V5zm2 0h2v14H8V5zm3 0h1v14h-1V5zm2 0h3v14h-3V5zm4 0h1v14h-1V5zm2 0h2v14h-2V5z",
  pastilla: "M7.1 3.1a5 5 0 0 1 7 0l6.8 6.8a5 5 0 0 1-7 7L7.1 10.1a5 5 0 0 1 0-7zm1.4 1.4a3 3 0 0 0 0 4.2l2.8 2.8 4.2-4.2-2.8-2.8a3 3 0 0 0-4.2 0z",
  ayuda: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 6a3.6 3.6 0 0 1 3.6 3.6c0 1.6-1 2.3-1.8 2.9-.7.5-1 .8-1 1.5h-1.6c0-1.5.8-2.2 1.6-2.8.7-.5 1.2-.9 1.2-1.6a2 2 0 0 0-4 0H8.4A3.6 3.6 0 0 1 12 6z",
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
  siguiente: "M5 6l9 6-9 6V6zm11 0h2.5v12H16V6z",
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
  // mejoras visuales 181-230: iconos para el menú «Más», compartir, documentos y modos
  ojo: "M12 5c5 0 9 3.5 11 7-2 3.5-6 7-11 7S3 15.5 1 12c2-3.5 6-7 11-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z",
  copiar: "M8 3h10a2 2 0 0 1 2 2v12h-2V5H8V3zM5 7h10a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v11h10V9H5z",
  texto: "M5 4h14v4h-2V6h-4v12h2v2H9v-2h2V6H7v2H5V4z",
  codigo: "M8.6 6.6 10 8l-4 4 4 4-1.4 1.4L3.2 12l5.4-5.4zm6.8 0L20.8 12l-5.4 5.4L14 16l4-4-4-4 1.4-1.4z",
  libro: "M6 2h11a2 2 0 0 1 2 2v16a1 1 0 0 1-1 1H7a3 3 0 0 1-3-3V4a2 2 0 0 1 2-2zm0 2v12.2A3 3 0 0 1 7 16h10V4H6zm1 14a1 1 0 0 0 0 2h10v-2H7z",
  guia: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm4.2 3.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 6h2v7h-2v-7zm0-3h2v2h-2V7z",
  estrella: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z",
  bocadillo: "M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v10h2v2l2.5-2H20V6H4zm3 3h10v2H7V9zm0 3h7v2H7v-2z",
  legal: "M11 3h2v2.1l5.5 1.8 1.2-.4.6 1.9-1.1.4L22 15a4 4 0 0 1-7 0l2.6-6.4L13 7.2V19h4v2H7v-2h4V7.2L6.4 8.6 9 15a4 4 0 0 1-7 0l2.8-6.2-1.1-.4.6-1.9 1.2.4L11 5.1V3zM5.5 10.6 4.1 14h2.8l-1.4-3.4zm13 0L17.1 14h2.8l-1.4-3.4z",
  estetoscopio: "M6 2h2v2H7v5a3 3 0 0 0 6 0V4h-1V2h2a1 1 0 0 1 1 1v6a5 5 0 0 1-4 4.9V16a3 3 0 0 0 6 0v-1.2a3 3 0 1 1 2 0V16a5 5 0 0 1-10 0v-2.1A5 5 0 0 1 5 9V3a1 1 0 0 1 1-1zm13 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  grafica: "M3 19h18v2H3v-2zm1.6-3.8 4.6-6.4 3.7 2.9 5.5-7.6 1.6 1.2-6.7 9.2-3.7-2.9-3.4 4.8-1.6-1.2z",
  pastillero: "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 4v8h2.75V9H5zm3.75 0v8h2.75V9H8.75zm3.75 0v8h2.75V9H12.5zm3.75 0v8H19V9h-2.75z",
  rejilla: "M5 3h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM5 13h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zm10 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z",
  cambiar: "M7 3 2.5 7.5 7 12V8.5h11v-2H7V3zm10 9v3.5H6v2h11V21l4.5-4.5L17 12z",
};
const icono = (n, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[n]}"/></svg>`;

/* ---------- pictogramas de ejercicios (figuras de trazo, 48×48) ---------- */
// ilustraciones de los ejercicios: app/js/pictos.js

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
  hoja: "M20.5 3.5c-8.3 0-14.1 3.4-15.6 9.2-.5 2-.4 3.8.3 5.3L3 20.2 4.4 21.6l2.2-2.2c1.5.7 3.3.8 5.3.3 5.8-1.5 9.2-7.3 8.6-16.2zm-2.1 2.2c-.1 6.5-2.8 10.6-7 11.8-1.1.3-2.1.3-3 .1l5.4-5.4-1.4-1.4-5.4 5.4c-.2-.9-.2-1.9.1-3 1.2-4.3 5.1-7.1 11.3-7.5z",
  frasco: "M8 2h8v3.5h-1v1c2.3.6 4 2.7 4 5.1V19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-7.4c0-2.4 1.7-4.5 4-5.1v-1H8V2zm3 3.5v2.6l-.8.2C8.4 8.7 7 10 7 11.6V19a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7.4c0-1.6-1.4-2.9-3.2-3.3l-.8-.2V5.5h-2zM9 12.5h6v4.5H9v-4.5z",
};
/** Grupo (icono) de una clase por su código ATC o su identificador. */
function grupoClase(clase) {
  if (clase.tipo === "planta") return "hoja";       // suplementos y plantas (v1.1)
  if (clase.tipo === "suplemento") return "frasco";
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
/** Mejora 237: el nombre del grupo no se repite cuando es el mismo que el del producto (Metformina · Metformina, Hipérico · Hipérico). */
const grupoVisible = (p, c) => (normalizar(c.nombre) === normalizar(p.nombre) ? "" : c.nombre);
/** Etiqueta «Suplemento» / «Planta» delante del grupo, para distinguirlos de los medicamentos. */
const etqTipo = (p, c) => { const tp = tipoProducto(p, c); return tp ? `<span class="etq-tipo etq-${tp}">${t("tipo." + tp)}</span> ` : ""; };
function ponerIconos() {
  const mapa = { "btn-caja": "caja", "btn-dictar": "mic", "btn-foto": "foto", "btn-pdf": "pdf", "btn-pegar": "pegar", "btn-ejemplo": "ejemplo", "btn-vaciar": "vaciar", "btn-enlace": "compartir", "btn-whatsapp": "whatsapp", "btn-email": "correo", "btn-calendario": "calendario", "btn-instalar": "instalar" };
  for (const [id, n] of Object.entries(mapa)) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
  for (const b of $$(".tabs [role=tab]")) if (!b.querySelector("svg") && ICONS[b.dataset.tab]) b.insertAdjacentHTML("afterbegin", icono(b.dataset.tab));
  for (const [id, n] of Object.entries({ "btn-qr": "qr", "btn-exportar": "guardar", "btn-importar-listas": "abrir", "btn-anadir": "pegar", "btn-primero": "buscar", "btn-buscar-nombre": "buscar", "btn-barras": "barras", "btn-ver-mi-plan": "plan", "btn-ir-descargas": "pdf", "btn-compartir": "compartir", "btn-glosario": "ayuda" })) { const b = document.getElementById(id); if (b && !b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(n)); }
  for (const b of $$("#barra-inferior button")) if (!b.querySelector("svg")) b.insertAdjacentHTML("afterbegin", icono(b.dataset.ic === "plan" ? "plan" : b.dataset.ic));
  // mejoras visuales 181-230: todo el menú «Más», los documentos, compartir y los dos modos con su icono
  const mas = { "#btn-glosario": "libro", '.menu-lista a[href="guia.html"]': "guia", '.menu-lista a[href="presentacion.html"]': "pastilla", '.menu-lista a[href="novedades.html"]': "estrella", ".menu-lista .btn-sugerencia": "bocadillo", '.menu-lista a[href="acerca.html"]': "info", '.menu-lista a[href="legal.html"]': "legal",
    "#btn-pdf-medico": "estetoscopio", "#btn-pdf-paciente": "persona", "#btn-pdf-entrenador": "fuerza", "#btn-pdf-tarjeta": "informe",
    "#btn-ver-enlace": "ojo", "#btn-copiar": "copiar", "#btn-historia": "informe", "#btn-fhir": "codigo", "#btn-txt": "texto", "#btn-sugerencia": "bocadillo",
    '.modo [data-modo="paciente"]': "persona", '.modo [data-modo="profesional"]': "estetoscopio" };
  for (const [sel, n] of Object.entries(mas)) for (const b of $$(sel)) if (!b.querySelector(":scope > svg")) b.insertAdjacentHTML("afterbegin", icono(n));
}

// Idioma de la interfaz (la base de conocimiento sigue en español)
await aplicarIdioma(detectarIdioma()); // español: inmediato; otro idioma: su diccionario ya viene precargado desde index.html
ponerIconos(); // antes de la primera pintura: evita que los botones cambien de tamaño al cargar
$("#idioma").value = idioma();
$("#idioma").addEventListener("change", (e) => {
  const cambiar = async () => { await aplicarIdioma(e.target.value); e.target.value = idioma(); aplicarModo(); if (datos) { renderVersion(); render(); } };
  // mejora 540: fundido cruzado al cambiar de idioma
  if (document.startViewTransition && MOV.ok()) document.startViewTransition(cambiar); else cambiar();
});

const estado = { meds: [], edad: null, caidas: false, condiciones: [], modo: "paciente", pac: {}, pro: {}, horas: { ...HORA_MOMENTO }, tab: "general", plan: { dias: [1, 2, 3, 4, 5, 6] }, cribado: { regular: null, enfermedad: null, sintomas: [] }, prescrito: null, fcReposo: null, sppb: null, sft: null, metas: null, habitos: { alcohol: null, tabaco: null, cafe: null } };
const sanearSppb = (x) => (x && Number.isFinite(Number(x.total)) ? { total: Math.max(0, Math.min(12, Number(x.total))), fecha: Number(x.fecha) || Date.now(), partes: x.partes || {}, velocidad: x.velocidad ?? null } : null);
/** Pruebas de forma física guardadas: sexo para el baremo, prueba de resistencia elegida y hasta 20 baterías (fecha, edad, sexo y resultados). */
const SFT_IDS = ["silla", "brazo", "paso2", "andar6", "sentado", "espalda", "levantarse"];
const sanearSft = (x) => {
  if (!x || typeof x !== "object") return null;
  const sexo = (s) => (s === "m" || s === "h" ? s : null);
  const hist = (Array.isArray(x.hist) ? x.hist : []).filter((h) => h && Number.isFinite(Number(h.f)) && h.r && typeof h.r === "object").slice(-20)
    .map((h) => ({ f: Number(h.f), edad: numeroEntre(h.edad, 18, 120), sexo: sexo(h.sexo), r: Object.fromEntries(SFT_IDS.filter((k) => h.r[k] != null && Number.isFinite(Number(h.r[k])) && Math.abs(Number(h.r[k])) < 5000).map((k) => [k, Number(h.r[k])])) }));
  return { sexo: sexo(x.sexo), aer: x.aer === "andar6" ? "andar6" : "paso2", hist };
};
/** Metas de la vida diaria: hasta 3 conocidas y, por meta, 4 fechas de hito (o null). Igual que `sanear` de js/metas.js. */
const sanearMetas = (x) => {
  if (!x || typeof x !== "object") return null;
  const ids = [...new Set((Array.isArray(x.ids) ? x.ids : []).filter((id) => METAS_IDS.includes(id)))].slice(0, 3);
  const hitos = {};
  for (const id of ids) { const h = Array.isArray(x.hitos?.[id]) ? x.hitos[id] : []; hitos[id] = [0, 1, 2, 3].map((k) => (Number.isFinite(Number(h[k])) && Number(h[k]) > 0 ? Number(h[k]) : null)); }
  return { ids, hitos };
};
/** Alcohol, tabaco y café (mejora grande 5): una respuesta por hábito o null. Igual que VALORES de js/habitos.js. */
const HAB = { alcohol: ["no", "aveces", "diario"], tabaco: ["no", "si", "dejado"], cafe: ["poco", "medio", "mucho"] };
const sanearHabitos = (x) => Object.fromEntries(Object.entries(HAB).map(([k, v]) => [k, v.includes(x?.[k]) ? x[k] : null]));
const sanearCribado = (c) => ({ regular: c?.regular === true ? true : c?.regular === false ? false : null, enfermedad: c?.enfermedad === true ? true : c?.enfermedad === false ? false : null, sintomas: Array.isArray(c?.sintomas) ? c.sintomas.filter((x) => SINTOMAS_ACSM.some((y) => y.id === x)) : [] });
const sanearPrescrito = (p) => (p && Number.isFinite(Number(p.fecha)) ? { fecha: Number(p.fecha), semanas: [4, 6, 8, 12].includes(Number(p.semanas)) ? Number(p.semanas) : 6, ...(p.base && typeof p.base === "object" ? { base: p.base } : {}) } : null);
/** Plan semanal vigente (día 0–6 → tipo), según los días elegidos por el usuario. */
const planActual = () => planSemana(estado.plan?.dias);
const sanearPlan = (p) => ({ dias: Array.isArray(p?.dias) && p.dias.length ? [...new Set(p.dias.map(Number).filter((d) => d >= 0 && d <= 6))] : [1, 2, 3, 4, 5, 6] });
/** Vibración breve en móviles que la admiten (marcar un bloque, terminar); nunca en escritorio. */
const vibrar = (ms = 12) => { try { if (navigator.vibrate && matchMedia("(pointer: coarse)").matches) navigator.vibrate(ms); } catch {} };
const CONDICIONES = ["diabetes", "insuficiencia_cardiaca", "renal", "marcapasos", "osteoporosis", "epoc_asma", "oxigeno", "embarazo", "hipertension", "cardiopatia_isquemica", "fibrilacion_auricular", "aneurisma_aorta", "ictus", "cancer", "artrosis", "epilepsia", "hepatopatia", "obesidad"];
const PAC = ["silla", "caminar", "ayuda"];
const PRO = ["fg", "fevi", "nyha", "sppb", "vivifrail", "dai"];

/** Contexto para el motor: condiciones marcadas + las derivadas de los datos numéricos o de las preguntas sencillas. */
function ctxActual() { return ctxDe(estado); }
function ctxDe(e) {
  const cond = new Set(e.condiciones);
  const p = e.modo === "profesional" ? e.pro : {};
  const q = e.modo === "paciente" ? e.pac : {};
  if (p.fg != null) { if (p.fg < 45) cond.add("renal"); if (p.fg < 30) cond.add("renal_grave"); }
  if (p.nyha != null && p.nyha >= 3) { cond.add("nyha34"); cond.add("insuficiencia_cardiaca"); }
  if (p.fevi != null && p.fevi < 40) { cond.add("fevi_baja"); cond.add("insuficiencia_cardiaca"); }
  if (p.dai != null) cond.add("marcapasos");
  // fragilidad: SPPB > Vivifrail > preguntas del paciente
  let frag = null;
  const sppb = p.sppb ?? e.sppb?.total ?? null;
  if (sppb != null) frag = sppb <= 6 ? "fragil" : sppb <= 9 ? "prefragil" : "robusto";
  else if (p.vivifrail) frag = p.vivifrail === "A" || p.vivifrail === "B" ? "fragil" : p.vivifrail === "C" ? "prefragil" : "robusto";
  else {
    const malas = (q.silla ? 1 : 0) + (q.caminar ? 1 : 0) + (q.ayuda ? 1 : 0);
    if (malas) frag = malas >= 2 ? "fragil" : "prefragil"; // sin marcas no se infiere nada
  }
  if (frag && frag !== "robusto") cond.add(frag);
  return { edad: e.edad, caidas: e.caidas, condiciones: cond, fragilidad: frag, daiFc: p.dai ?? null, fg: p.fg ?? null, fevi: p.fevi ?? null, nyha: p.nyha ?? null, sppb, sppbGuiado: e.sppb, fcReposo: e.fcReposo, modo: e.modo };
}
let datos, indice;
let soloLectura = false, estadoPropio = null; // v1.0: enlace de solo lectura
let ultimoAnadido = null; // pid del último medicamento añadido, para resaltar su tarjeta

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
  // dos cifras: principios revisados uno a uno y los que el nomenclátor clasifica por su código ATC (heredan las precauciones del grupo)
  const sinteticos = [...indice.porId.values()].filter((x) => x.principio.sintetico).length;
  $("#kb-version").textContent = `v${APP_VERSION} · ` + t("kb.version", { v: datos.kb.version, c: datos.kb.clases.length, p: indice.porId.size - sinteticos, s: sinteticos });
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
  enIdle(() => { cargarSemana().catch(() => { cargarSemana.p = null; }); });
  renderVersion();
  document.body.classList.remove("cargando");
  $("#aviso").textContent = kb.aviso;
  restaurar();
  const h = location.hash.match(/^#lista=([A-Za-z0-9_-]+)/);
  if (h && decodificarEstado(h[1])) { history.replaceState(null, "", location.pathname); restaurarFormulario(); guardar(); $("#pegar-aviso").textContent = "Lista cargada desde el enlace."; }
  const hv = location.hash.match(/^#ver=([A-Za-z0-9_-]+)/);
  if (hv) { estadoPropio = snapshot(); if (decodificarEstado(hv[1])) { history.replaceState(null, "", location.pathname); soloLectura = true; restaurarFormulario(); aplicarSoloLectura(); } else estadoPropio = null; }
  comprobarCambiosBase(); // antes del primer render: compara la huella guardada con la base nueva
  render();
  pintarAvisoKb();
  pintarAvisoDatos();
  const hs = location.hash.match(/^#sync=([A-Za-z0-9_.-]+)/);
  if (hs) { ocasional((O) => O.recibirSync(hs[1], apiOc())); return; }
  // primera visita sin lista: recorrido guiado sobre los elementos reales
  try { if (localStorage.getItem("medex.guia") !== "1" && !estado.meds.length && !h) setTimeout(iniciarTour, 400); } catch {}
}

/* ---------- persistencia local (solo en este navegador) ---------- */
function guardar() {
  if (soloLectura) return; // vista de solo lectura (#ver=): no pisa los datos propios
  try { localStorage.setItem("medex.estado", JSON.stringify({ meds: estado.meds, edad: estado.edad, caidas: estado.caidas, condiciones: estado.condiciones, modo: estado.modo, pac: estado.pac, pro: estado.pro, horas: estado.horas, plan: estado.plan, informeVisto: !!estado.informeVisto, cribado: estado.cribado, prescrito: estado.prescrito, fcReposo: estado.fcReposo, sppb: estado.sppb, sft: estado.sft, metas: estado.metas, habitos: estado.habitos, historialPresc: estado.historialPresc || [] })); } catch {}
  if (estado.meds.length) datosGuardados(); // primera vez con datos: pedir almacenamiento persistente (los avisos esperan a la próxima visita)
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
    if (s && Array.isArray(s.meds)) Object.assign(estado, { meds: sanearMeds(s.meds), edad: numeroEntre(s.edad, 1, 120), caidas: !!s.caidas, condiciones: Array.isArray(s.condiciones) ? s.condiciones.filter((c) => CONDICIONES.includes(c)) : [], modo: s.modo === "profesional" ? "profesional" : "paciente", pac: s.pac || {}, pro: s.pro || {}, horas: { ...HORA_MOMENTO, ...(s.horas || {}) }, plan: sanearPlan(s.plan), cribado: sanearCribado(s.cribado), prescrito: sanearPrescrito(s.prescrito), fcReposo: numeroEntre(s.fcReposo, 30, 150), sppb: sanearSppb(s.sppb), sft: sanearSft(s.sft), metas: sanearMetas(s.metas), habitos: sanearHabitos(s.habitos), informeVisto: !!s.informeVisto, historialPresc: Array.isArray(s.historialPresc) ? s.historialPresc.slice(0, 12) : [] });
  } catch {}
  $("#edad").value = estado.edad ?? ""; $("#fc-reposo").value = estado.fcReposo ?? "";
  $("#caidas").checked = estado.caidas;
  for (const c of CONDICIONES) { const el = $("#cond-" + c); if (el) el.checked = estado.condiciones.includes(c); }
  if (estado.condiciones.some((c) => CONDICIONES.indexOf(c) >= 8)) $("#bloque-situacion-mas").open = true;
  for (const k of PAC) { const el = $("#pac-" + k); if (el) el.checked = estado.pac[k] === true; }
  for (const k of PRO) { const el = $("#pro-" + k); if (el) el.value = estado.pro[k] ?? ""; }
  { const nota = $("#vivifrail-auto"); const total = estado.pro.sppb ?? estado.sppb?.total ?? null; if (nota) { nota.hidden = !(total != null && estado.pro.vivifrail === vivifrailDeSppb(total)); if (!nota.hidden) nota.textContent = t("pro.vivi_auto", { n: total }); } }
  pintarCribadoForm(); pintarHabitosForm();
  aplicarModo();
}
function aplicarModo() {
  document.body.dataset.modo = estado.modo;
  aplicarConsulta();
  $$(".modo button").forEach((b) => b.setAttribute("aria-checked", b.dataset.modo === estado.modo));
  const conIcono = (el, txt) => { const b = el.querySelector(":scope > b"); if (b) { b.textContent = txt; return; } const svg = el.querySelector(":scope > svg"); el.textContent = txt; if (svg) el.prepend(svg); };
  conIcono($("#btn-pdf-medico"), estado.modo === "paciente" ? t("desc.medico") : t("desc.medico.pro"));
  conIcono($("#btn-pdf-paciente"), estado.modo === "paciente" ? t("desc.paciente.pac") : t("desc.paciente.pro"));
}
/* tamaño de letra en tres pasos: normal → grande → muy grande (se recuerda en el dispositivo) */
function aplicarLetra(n) {
  n = Math.max(0, Math.min(2, Number(n) || 0));
  document.documentElement.classList.toggle("letra-grande", n >= 1);
  document.documentElement.classList.toggle("letra-xl", n === 2);
  const b = $("#btn-letra"); b.setAttribute("aria-pressed", String(n > 0));
  const e = $("#letra-estado"); if (e) e.textContent = t("letra." + n);
  try { localStorage.setItem("medex.letra", String(n)); } catch {}
  return n;
}
$("#btn-letra").addEventListener("click", () => { const n = aplicarLetra((Number(localStorage.getItem("medex.letra")) || 0) + 1 > 2 ? 0 : (Number(localStorage.getItem("medex.letra")) || 0) + 1); toast(t("letra." + n), { ms: 1800 }); });
// cabecera compacta y guía de 3 pasos: solo la primera visita se muestra todo
try {
  if (localStorage.getItem("medex.visto") === "1") document.documentElement.classList.add("retorno");
  else localStorage.setItem("medex.visto", "1");
} catch {}
try { aplicarLetra(localStorage.getItem("medex.letra") || 0); } catch { aplicarLetra(0); }
// menú «Más»: se cierra al elegir una opción o al pulsar fuera
$("#menu-mas .menu-lista").addEventListener("click", (ev) => { if (ev.target.closest("[role=menuitem]") && !ev.target.closest("#btn-letra, #btn-tema")) $("#menu-mas").open = false; });
document.addEventListener("click", (ev) => { const m = $("#menu-mas"); if (m.open && !ev.target.closest("#menu-mas")) m.open = false; });
document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && $("#menu-mas").open) $("#menu-mas").open = false; });
$$(".modo button").forEach((b) => b.addEventListener("click", () => { estado.modo = b.dataset.modo; aplicarModo(); guardar(); render(); }));
for (const k of PAC) $("#pac-" + k)?.addEventListener("change", () => { estado.pac[k] = $("#pac-" + k).checked; guardar(); render(); });
for (const k of PRO) $("#pro-" + k)?.addEventListener("change", () => { const v = $("#pro-" + k).value; estado.pro[k] = v === "" ? null : (k === "vivifrail" ? v : parseFloat(v)); if (k === "sppb") aplicarVivifrailAuto(); guardar(); render(); });
/** El nivel Vivifrail se deduce del SPPB (A 0–3 · B 4–6 · C 7–9 · D 10–12); el profesional puede cambiarlo a mano. */
function aplicarVivifrailAuto() {
  const total = estado.pro.sppb ?? estado.sppb?.total ?? null; const v = vivifrailDeSppb(total); const sel = $("#pro-vivifrail"); const nota = $("#vivifrail-auto");
  if (v) { estado.pro.vivifrail = v; if (sel) sel.value = v; if (nota) { nota.hidden = false; nota.textContent = t("pro.vivi_auto", { n: total }); } }
  else if (nota) nota.hidden = true;
}

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
    const li = document.createElement("li"); li.setAttribute("role", "option"); li.className = "libre-op"; li.tabIndex = 0;
    li.innerHTML = `<span>${t("libre.anadir", { n: q })}</span><small>${t("libre.nota")}</small>`;
    li.addEventListener("click", () => anadirLibre(q));
    lista.append(li);
  }
  for (const e of sinRepetidos(res)) {
    const ref = indice.porId.get(e.pid);
    const li = document.createElement("li");
    li.setAttribute("role", "option"); li.tabIndex = 0;
    li.className = "con-ic";
    li.innerHTML = e.tipo === "combo"
      ? `${iconoGrupo(ref.clase)}<span>${resaltar(e.texto, q)}</span><small>${t("buscar.combo")}: ${e.componentes.map((c) => indice.porId.get(c.pid).principio.nombre).join(" + ")}</small>`
      : `${iconoGrupo(ref.clase)}<span>${resaltar(e.texto, q)}${e.aproximado ? ` <em class="aprox">${t("buscar.quiso")}</em>` : ""}</span><small>${etqTipo(ref.principio, ref.clase)}${e.tipo === "marca" ? ref.principio.nombre + " · " : ""}${ref.clase.nombre}</small>`;
    li.addEventListener("click", () => elegir(e));
    lista.append(li);
  }
});
/** Mejora 243: un solo resultado por producto entre su nombre y sus nombres alternativos (las presentaciones del nomenclátor y las marcas sí se muestran todas). */
function sinRepetidos(res) {
  const vistos = new Set();
  return res.filter((e) => { if (e.tipo !== "principio" && !e.alias) return true; if (vistos.has(e.pid)) return false; vistos.add(e.pid); return true; });
}
/** Mejora 244: resalta en el resultado lo que se ha escrito (sin distinguir tildes ni mayúsculas). */
function resaltar(texto, q) {
  const n = normalizar(texto), m = normalizar(q);
  const i = m.length >= 2 ? n.indexOf(m) : -1;
  return i < 0 || n.length !== texto.length ? texto : `${texto.slice(0, i)}<mark>${texto.slice(i, i + m.length)}</mark>${texto.slice(i + m.length)}`;
}
inputBuscar.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") { ev.preventDefault(); const first = lista.querySelector("li"); if (first && !lista.hidden) first.click(); }
  if (ev.key === "Escape") lista.hidden = true;
});
document.addEventListener("click", (ev) => { if (!ev.target.closest(".buscador")) lista.hidden = true; });
/** Resultados alcanzables con el tabulador y elegibles con Intro o espacio (lista desplazable accesible). */
const elegirConTeclado = (ev) => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches?.('li[role="option"]')) { ev.preventDefault(); ev.target.click(); } };
lista.addEventListener("keydown", elegirConTeclado);

/* ---------- añadir rápido: últimos fármacos elegidos en este dispositivo y los más habituales ---------- */
const HABITUALES = ["paracetamol", "omeprazol", "atorvastatina", "metformina", "enalapril", "bisoprolol", "aas", "amlodipino", "simvastatina", "lorazepam"];
function leerRecientes() { try { return JSON.parse(localStorage.getItem("medex.recientes") || "[]"); } catch { return []; } }
function anotarReciente(pid) { try { const r = [pid, ...leerRecientes().filter((x) => x !== pid)].slice(0, 8); localStorage.setItem("medex.recientes", JSON.stringify(r)); } catch {} }
/** Nombre corto para chips y enlaces: siglas conocidas, o la primera palabra del nombre. */
const CORTOS = { aas: "AAS", calcio_vitd: "Calcio + vit. D", vitamina_d: "Vitamina D", hierro_oral: "Hierro", omega3: "Omega-3", potasio_oral: "Potasio", magnesio_oral: "Magnesio", insulina_rapida: "Insulina rápida", insulina_basal: "Insulina basal", insulina_mezcla: "Insulina mezcla", nicotina_sustitutiva: "Nicotina", antihistaminico_no_sedante: "Antihistamínico", anticonceptivo_combinado: "Anticonceptivo", ths_estrogenos: "THS", timolol_colirio: "Timolol colirio", laba_ics: "Inhalador LABA/ICS", lama: "Inhalador LAMA",
  hiperico: "Hipérico", plantas_diureticas: "Cola de caballo", laxantes_plantas: "Sen", te_verde_extracto: "Té verde", prohormonas_dhea: "DHEA", coenzima_q10: "Coenzima Q10", levadura_roja: "Levadura roja",
  vitamina_k: "Vitamina K", vitamina_e: "Vitamina E", vitamina_b6: "Vitamina B6", nitrato_remolacha: "Remolacha", sauce: "Sauce" };
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

/* ---------- suplementos y plantas (v1.1): los más habituales, a un toque ---------- */
const SUP_HABITUALES = ["creatina", "proteina_suplemento", "cafeina", "omega3", "magnesio_oral", "vitamina_d", "melatonina", "colageno", "multivitaminico", "hiperico", "valeriana", "ginkgo", "curcuma", "ginseng", "ashwagandha", "regaliz", "plantas_diureticas", "cbd", "levadura_roja"];
function renderSupRapido() {
  const box = $("#sup-chips"); if (!box || !indice) return;
  const ya = new Set(estado.meds.map((m) => m.pid));
  const pids = SUP_HABITUALES.filter((p) => indice.porId.has(p) && !ya.has(p));
  const n = estado.meds.filter((m) => !m.libre && tipoProducto(indice.porId.get(m.pid)?.principio, indice.porId.get(m.pid)?.clase)).length;
  const cuenta = $("#sup-cuenta"); if (cuenta) { cuenta.hidden = !n; latirSiCambia(cuenta, n ? t(n === 1 ? "sup.cuenta1" : "sup.cuenta", { n }) : ""); } // mejora 586: late al cambiar
  const clave = pids.join(",");
  if (box.dataset.pids === clave) return; // sin cambios: no rehacer los botones (conserva el foco)
  box.dataset.pids = clave;
  box.innerHTML = pids.map((p) => { const { principio, clase } = indice.porId.get(p); return `<button type="button" class="chip chip-btn chip-${tipoProducto(principio, clase) || "suplemento"}" data-pid="${p}">${nombreCorto(principio)}</button>`; }).join("");
  box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const e = indice.entradas.find((x) => x.tipo === "principio" && x.pid === b.dataset.pid); if (e) { elegir(e); inputBuscar.scrollIntoView({ block: "center" }); $("#dosis").focus({ preventScroll: true }); } }));
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
    ultimoAnadido = seleccion.pid;
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
$("#btn-importar").addEventListener("click", async () => {
  const n = await incorporarTexto($("#pegar").value);
  $("#pegar").value = "";
  if (n.reconocidos) $("#pegar-wrap").hidden = true;
});

/** Reconoce fármacos en un texto y los añade a la lista. Devuelve contadores. */
async function incorporarTexto(texto, origen = "la lista", reemplazar = false) {
  const { reconocidos, noReconocidos } = (await cargarParser()).extraerMedicacion(texto, indice);
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
  const o = { f: estado.prescrito ? [estado.prescrito.fecha, estado.prescrito.semanas] : null, m: estado.meds.map((m) => [m.pid, m.dosis, m.tomas, m.unidad || null, m.aDemanda ? 1 : 0, (m.momentos || []).map((x) => x[0]).join("")]), e: estado.edad, c: estado.caidas ? 1 : 0, k: estado.condiciones, o: estado.modo, p: estado.pac, r: estado.pro, q: estado.cribado, d: estado.plan?.dias };
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
    if (Array.isArray(o.f)) estado.prescrito = sanearPrescrito({ fecha: o.f[0], semanas: o.f[1] });
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
  const res = sinRepetidos(buscar(indice, fichaInput.value).filter((e) => e.tipo !== "combo"));
  fichaLista.innerHTML = ""; fichaLista.hidden = !res.length;
  for (const e of res) {
    const ref = indice.porId.get(e.pid);
    const li = document.createElement("li"); li.setAttribute("role", "option"); li.tabIndex = 0; li.className = "con-ic";
    li.innerHTML = `${iconoGrupo(ref.clase)}<span>${resaltar(e.texto, fichaInput.value.trim())}${e.aproximado ? ` <em class="aprox">${t("buscar.quiso")}</em>` : ""}</span><small>${etqTipo(ref.principio, ref.clase)}${e.tipo === "marca" ? ref.principio.nombre + " · " : ""}${ref.clase.nombre}</small>`;
    li.addEventListener("click", () => { fichaLista.hidden = true; fichaInput.value = e.texto; mostrarFicha(e.pid); });
    fichaLista.append(li);
  }
});
fichaInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); fichaLista.querySelector("li")?.click(); } });
fichaLista.addEventListener("keydown", elegirConTeclado);
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
    <h2 id="ficha-titulo" class="ficha-titulo">${iconoGrupo(c)}<span>${p.nombre}</span></h2>
    <p class="clase-nombre">${etqTipo(p, c)}${[grupoVisible(p, c), p.marcas?.length ? p.marcas.slice(0, 6).join(", ") : "", p.alias?.length ? `${t("ficha.alias")} ${p.alias.slice(0, 4).join(", ")}` : "", p.umbral_mg?.alta != null ? `dosis alta a partir de ${p.umbral_mg.alta.toLocaleString("es-ES")} ${unidadPorDia(p.unidad || "mg")}` : ""].filter(Boolean).join(" · ")}</p>
    <p>${c.resumen}</p>
    ${p.nota ? `<p><em>${p.nota}</em></p>` : ""}
    ${senales.length ? `<ul class="senales-lista">${senales.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
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
function snapshot() { return { meds: structuredClone(estado.meds), edad: estado.edad, caidas: estado.caidas, condiciones: [...estado.condiciones], modo: estado.modo, pac: { ...estado.pac }, pro: { ...estado.pro }, horas: { ...estado.horas }, plan: sanearPlan(estado.plan), cribado: sanearCribado(estado.cribado), prescrito: estado.prescrito, fcReposo: estado.fcReposo, sppb: estado.sppb, sft: estado.sft, metas: estado.metas, habitos: estado.habitos, historialPresc: estado.historialPresc || [] }; }
function renderPerfiles() {
  if (typeof pintarConsulta === "function") pintarConsulta();
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
      Object.assign(estado, { meds: sanearMeds(e.meds), edad: numeroEntre(e.edad, 1, 120), caidas: !!e.caidas, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {}, horas: { ...HORA_MOMENTO, ...(e.horas || {}) }, plan: sanearPlan(e.plan), cribado: sanearCribado(e.cribado), prescrito: sanearPrescrito(e.prescrito), fcReposo: numeroEntre(e.fcReposo, 30, 150), sppb: sanearSppb(e.sppb), sft: sanearSft(e.sft), metas: sanearMetas(e.metas), habitos: sanearHabitos(e.habitos), historialPresc: Array.isArray(e.historialPresc) ? e.historialPresc.slice(0, 12) : [], ejemplo: false });
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
  const lista = leerPerfiles(); lista.unshift({ id: Date.now().toString(36), nombre, fecha: Date.now(), estado: snapshot(), huella: { kb: datos.kb.version, items: huellaInforme(evaluar(datos, medsActivos(), ctxActual())) } }); escribirPerfiles(lista.slice(0, 20));
  $("#perfil-nombre").value = ""; renderPerfiles();
});
function restaurarFormulario() {
  $("#edad").value = estado.edad ?? ""; $("#fc-reposo").value = estado.fcReposo ?? ""; $("#caidas").checked = estado.caidas;
  for (const c of CONDICIONES) { const el = $("#cond-" + c); if (el) el.checked = estado.condiciones.includes(c); }
  for (const k of PAC) { const el = $("#pac-" + k); if (el) el.checked = estado.pac[k] === true; }
  for (const k of PRO) { const el = $("#pro-" + k); if (el) el.value = estado.pro[k] ?? ""; }
  pintarCribadoForm(); pintarHabitosForm();
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
    let texto = await (await cargarParser()).textoDePdf(f);
    if (texto.trim().length < 20) {
      progreso("El PDF no tiene texto: es un escaneo. Reconociendo con OCR (puede tardar un minuto la primera vez)…");
      texto = await (await cargarOcr()).textoDePdfEscaneado(f, progreso);
    }
    await incorporarTexto(texto, `«${f.name}»`, true);
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
    const texto = await (await cargarOcr()).textoDeImagen(f, progreso);
    if (texto.trim().length < 10) { progreso(t("foto.error")); return; }
    await incorporarTexto(texto, "la foto", true);
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
    const texto = await (await cargarOcr()).textoDeImagen(f, progreso);
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
// El maquetador de PDF (60 KB) se descarga solo la primera vez que se pide un documento.
let modPdf = null;
const cargarPdf = () => (modPdf ??= import("./pdf.js?v=202611222207").catch((e) => { modPdf = null; throw e; }));
async function descargarPdf(tipo) {
  const btn = { medico: $("#btn-pdf-medico"), paciente: $("#btn-pdf-paciente"), entrenador: $("#btn-pdf-entrenador"), tarjeta: $("#btn-pdf-tarjeta") }[tipo];
  btn.disabled = true; btn.setAttribute("aria-busy", "true"); toast(t("pdf.generando"), { ms: 20000 });
  try {
    const res = evaluar(datos, medsActivos(), ctxActual());
    const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), horas: estado.horas, diario: leerDiario(), plan: sanearPlan(estado.plan), cribado: cribadoActual(res), zona: zonaIntensidad(res, ctxActual(), { fcReposo: estado.fcReposo }), prescriptor: estado.modo === "profesional" ? prescriptorActual() : null, prescrito: estado.prescrito, appVersion: APP_VERSION, enlace: `${location.origin}${location.pathname}#lista=${codificarEstado()}`, libres: medsLibres().map((m) => m.nombre + (m.dosis != null ? ` ${m.dosis} mg` : "")) };
    const P = await cargarPdf();
    const doc = await ({ medico: P.pdfMedico, paciente: P.pdfPaciente, entrenador: P.pdfEntrenador, tarjeta: P.pdfTarjeta }[tipo])(datos.kb, res, ctx);
    doc.save(`${{ medico: "resumen-medico", paciente: "resumen-paciente", entrenador: "ficha-entrenador", tarjeta: "tarjeta-nevera" }[tipo]}-${new Date().toISOString().slice(0, 10)}.pdf`);
    if (estado.modo === "profesional" && !estado.prescrito) { estado.prescrito = { fecha: Date.now(), semanas: prescriptorActual().revision, base: basePrescripcion() }; guardar(); pintarReeval(); }
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
  const q = new URLSearchParams({ version: `${datos?.kb?.version || "?"} · ${navigator.userAgent.slice(0, 60)}`, app: APP_VERSION, modo: estado.modo, idioma: idioma(), lista: (extra.lista ?? lista).slice(0, 400), contexto: ctx.slice(0, 200), sinresultado: sinRes.slice(-15).join("; ").slice(0, 300), util: extra.util || "", tipo: extra.tipo || "", texto: (extra.texto || "").slice(0, 1500), pantalla: (extra.pantalla || "").slice(0, 200), errores: (extra.errores || "").slice(0, 400), pasos: (extra.pasos || "").slice(0, 400), navegador: (extra.navegador || "").slice(0, 200) });
  return `${FORM_SUGERENCIAS}?${q}`;
}
$$(".btn-sugerencia").forEach((b) => b.addEventListener("click", () => abrirFeedback()));
$("#btn-pdf-paciente").addEventListener("click", () => descargarPdf("paciente"));
$("#btn-pdf-entrenador").addEventListener("click", () => descargarPdf("entrenador"));
$("#btn-pdf-tarjeta").addEventListener("click", () => descargarPdf("tarjeta"));

$("#btn-ejemplo").addEventListener("click", () => {
  Object.assign(estado, structuredClone(EJEMPLO), { ejemplo: true });
  $("#edad").value = estado.edad; $("#caidas").checked = estado.caidas;
  guardar(); render();
});
$("#btn-ejemplo-vaciar")?.addEventListener("click", () => { $("#btn-vaciar").click(); setTimeout(() => $("#buscar").focus({ preventScroll: true }), 50); }); // mejora 185
$("#btn-vaciar").addEventListener("click", () => {
  if (!estado.meds.length) return;
  const copia = estado.meds; estado.meds = []; estado.ejemplo = false; guardar(); render(); const c = $("#cambios"); if (c) c.hidden = true;
  toast(t("lista.vaciada", { n: copia.length }), { accion: t("lista.deshacer"), onAccion: () => { estado.meds = copia; guardar(); render(); } });
});
$("#edad").addEventListener("change", () => { estado.edad = parseInt($("#edad").value, 10) || null; guardar(); render(); });
$("#fc-reposo").addEventListener("change", () => { estado.fcReposo = numeroEntre($("#fc-reposo").value, 30, 150); guardar(); render(); });
$("#caidas").addEventListener("change", () => { estado.caidas = $("#caidas").checked; guardar(); render(); });
for (const c of CONDICIONES) $("#cond-" + c)?.addEventListener("change", () => { estado.condiciones = CONDICIONES.filter((k) => $("#cond-" + k)?.checked); guardar(); render(); });

$$(".tabs button").forEach((b) => b.addEventListener("click", () => {
  if (estado.tab === b.dataset.tab) return;
  const orden = $$(".tabs button").map((x) => x.dataset.tab); // mejora 541: el contenido entra desde el lado de la pestaña elegida
  const dir = orden.indexOf(b.dataset.tab) > orden.indexOf(estado.tab) ? "dcha" : "izq";
  estado.tab = b.dataset.tab; render();
  // transición suave del contenido y pestaña activa siempre a la vista
  const c = $("#contenido-tab"); c.dataset.dir = dir; c.classList.remove("entra"); void c.offsetWidth; c.classList.add("entra");
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
$("#btn-como").addEventListener("click", () => iniciarTour());
// barra inferior (móvil): lleva al informe o, estando en él, de vuelta a la medicación
let enInforme = false;
const desplazar = (el) => el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
const DESTINOS_NAV = { datos: () => $("#panel-datos"), medicacion: () => $("#panel-medicacion"), informe: () => $("#informe"), plan: () => { if (estado.tab !== "plan") { estado.tab = "plan"; render(); } return $(".tabs"); } };
$$("#barra-inferior button[data-ir]").forEach((b) => b.addEventListener("click", () => { const el = DESTINOS_NAV[b.dataset.ir]?.(); if (el) desplazar(el); if (b.dataset.ir === "informe" || b.dataset.ir === "plan") { estado.informeVisto = true; guardar(); } marcarNav(b.dataset.ir); }));
function marcarNav(id) { $$("#barra-inferior button").forEach((b) => b.classList.toggle("activo", b.dataset.ir === id)); }
new IntersectionObserver(([e]) => {
  enInforme = e.isIntersecting;
  if (enInforme && estado.meds.length && !estado.informeVisto) { estado.informeVisto = true; guardar(); }
  if (datos) pintarPasos();
}, { rootMargin: "-40% 0px -55% 0px" }).observe($("#informe"));
// qué sección está a la vista → pestaña activa en la barra inferior
{
  const vis = new Map();
  // la sección que cruza una franja en el centro de la pantalla (la proporción visible engañaba con el informe, mucho más alto);
  // dentro del informe, «Mi plan» solo cuando lo que cruza la franja es el contenido de la pestaña del plan
  const obs = new IntersectionObserver((es) => {
    for (const e of es) vis.set(e.target.id, e.isIntersecting);
    const activa = vis.get("contenido-tab") && estado.tab === "plan" ? "plan" : vis.get("informe") ? "informe" : vis.get("panel-medicacion") ? "medicacion" : vis.get("panel-datos") ? "datos" : null;
    if (activa) marcarNav(activa);
  }, { rootMargin: "-45% 0px -50% 0px" });
  for (const id of ["panel-datos", "panel-medicacion", "informe", "contenido-tab"]) { const el = document.getElementById(id); if (el) obs.observe(el); }
}

/* ---------- escuchar «Lo esencial» (síntesis de voz del navegador) ---------- */
let hablando = false;
function escuchar(texto) {
  if (!("speechSynthesis" in window)) return;
  if (hablando) { speechSynthesis.cancel(); hablando = false; pintarBtnEscuchar(); return; }
  let partes;
  if (typeof texto === "string") partes = [texto.replace(/\s+/g, " ").slice(0, 6000)];
  else { const res = evaluar(datos, medsActivos(), ctxActual()); partes = [t("esencial.titulo") + ".", ...loEsencial(res, 5).map((p) => `${p.titulo}. ${p.texto}`), t("alarma.titulo"), ...ALARMA]; }
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
// los ficheros .ics (plan y reevaluación) los escribe js/ocasional.js, bajo demanda (v1.3.3)
const apiIcs = () => { const res = evaluar(datos, medsActivos(), ctxActual()); return { P: prescripcion(res, ctxActual()), esencial: loEsencial(res, 5), hora: horaPlan(), dias: diasPlan(), prescrito: estado.prescrito, fechaReeval: estado.prescrito ? fechaReeval() : null, descargarTexto, toast }; };
$("#btn-reeval-ics")?.addEventListener("click", () => { if (estado.prescrito) ocasional((O) => O.icsReeval(apiIcs())); });
$("#btn-calendario").addEventListener("click", () => ocasional((O) => O.calendario(apiIcs())));

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
const TEMAS = ["auto", "light", "dark", "contrast"];
function aplicarTema(tm) {
  if (tm === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = tm;
  try { localStorage.setItem("medex.tema", tm); } catch {}
  const b = $("#btn-tema"); b.title = t("tema." + tm); b.setAttribute("aria-label", t("tema." + tm)); b.querySelector(".ic-menu span").textContent = { auto: "A", light: "☀", dark: "☾", contrast: "◐" }[tm]; const tx = $("#tema-txt"); if (tx) tx.textContent = t("tema." + tm);
}
$("#btn-tema").addEventListener("click", (ev) => {
  const act = document.documentElement.dataset.theme || "auto", sig = TEMAS[(TEMAS.indexOf(act) + 1) % TEMAS.length];
  // mejora 539: el tema nuevo se abre en círculo desde el botón (si el navegador sabe y no se ha pedido reducir el movimiento)
  if (!document.startViewTransition || !MOV.ok()) { aplicarTema(sig); return; }
  const r = ev.currentTarget.getBoundingClientRect(), x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
  const radio = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
  const raiz = document.documentElement; raiz.classList.add("vt-tema");
  const vt = document.startViewTransition(() => aplicarTema(sig));
  vt.ready.then(() => raiz.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] }, { duration: 560, easing: "cubic-bezier(.16, 1, .3, 1)", pseudoElement: "::view-transition-new(root)" })).catch(() => {});
  vt.finished.finally(() => raiz.classList.remove("vt-tema"));
});
try { aplicarTema(localStorage.getItem("medex.tema") || "auto"); } catch { aplicarTema("auto"); }

$("#btn-historia").addEventListener("click", async () => {
  const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), diario: leerDiario(), prescriptor: prescriptorActual(), prescrito: estado.prescrito, appVersion: APP_VERSION, libres: medsLibres().map((m) => m.nombre + (m.dosis != null ? ` ${m.dosis} mg` : "")) };
  const res = evaluar(datos, medsActivos(), ctx);
  ctx.cribado = cribadoActual(res); ctx.zona = zonaIntensidad(res, ctx, { fcReposo: estado.fcReposo });
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
  "Borg": "Escala de esfuerzo percibido de 6 a 20. Moderado = 12–13 (algo duro); vigoroso = 14–17.",
  "FITT": "Frecuencia, Intensidad, Tiempo y Tipo: las cuatro variables con que se prescribe el ejercicio.",
  "NYHA": "Clase funcional de la insuficiencia cardíaca: I sin síntomas; II con esfuerzos normales; III con esfuerzos pequeños; IV en reposo.",
  "FEVI": "Fracción de eyección del ventrículo izquierdo: porcentaje de sangre que el corazón expulsa en cada latido (normal ≥ 50 %).",
  "FG": "Filtrado glomerular: medida de la función del riñón en mL/min (normal > 90; reducido < 60).",
  "SPPB": "Short Physical Performance Battery: prueba de equilibrio, marcha de 4 m y levantarse de la silla 5 veces, de 0 a 12 puntos (≤ 6 fragilidad; 7–9 prefragilidad; ≥ 10 robusto).",
  "Karvonen": "Método para calcular las pulsaciones objetivo a partir de la FC de reserva: reposo + (máxima − reposo) × porcentaje de intensidad.",
  "FC de reserva": "Diferencia entre el pulso máximo y el pulso en reposo; sobre ella se calculan las zonas de intensidad (moderada = 40–59 %).",
  "Tanaka": "Fórmula para estimar el pulso máximo: 208 − 0,7 × edad. Es orientativa; con betabloqueantes no sirve.",
  "Vivifrail": "Programa de ejercicio multicomponente para mayores según su capacidad funcional (niveles A a D).",
  "ACOD": "Anticoagulantes orales de acción directa (apixabán, rivaroxabán, edoxabán, dabigatrán); no requieren INR.",
  "Beers": "Criterios Beers (Sociedad Americana de Geriatría, 2023): lista de fármacos potencialmente inapropiados en mayores de 65 años.",
  "STOPP/START": "Criterios europeos de prescripción en mayores: STOPP señala fármacos a retirar y START, tratamientos que faltan.",
  "lpm": "Latidos por minuto.",
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
  return `<small>${t("const.titulo")}</small><div class="fila constantes">${cs.map((c) => `<label${c.doble ? ' class="doble"' : ""}><span>${t("const." + c.id)} <span class="unidad-mini">${c.unidad}</span></span>${c.doble ? campo("glucosa_antes", c, t("const.antes")) + campo("glucosa_despues", c, t("const.despues")) : campo(c.id, c, "")}</label>`).join("")}</div>`;
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
function franjaHoy() { return franjaDe(ventanaEntrenamiento(indice, medsActivos(), estado.horas)); }
function franjaDe(v) {
  if (!v.horas.some((h) => h.nivel === "rojo" || h.nivel === "ambar")) return null; // sin restricciones no hace falta franja
  const m = (v.mejores || []).map((x) => ({ desde: Math.max(x.desde, 8), hasta: Math.min(x.hasta, 21) })).filter((x) => x.hasta - x.desde >= 2).sort((a, b) => (b.hasta - b.desde) - (a.hasta - a.desde))[0];
  return m ? `${m.desde}:00–${m.hasta}:00` : null;
}
function barrasSemana(diario) {
  const dias = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return hoyISO(d); });
  const min = dias.map((iso) => diario.filter((x) => x.fecha === iso).reduce((n, x) => n + (x.min || 0), 0));
  const max = Math.max(30, ...min);
  // mejora 197: siete columnas legibles (inicial del día, barra de minutos y el tipo de sesión que toca), hoy resaltado
  const plan = planActual(), hoy = hoyISO();
  const IC = { aerobico: "aerobico", fuerza: "fuerza", fuerza_eq: "fuerza", equilibrio: "equilibrio", descanso: "paseo" };
  return `<div class="semana" role="img" aria-label="${t("hoy.semana_aria", { n: min.reduce((a, b) => a + b, 0) })}">${dias.map((iso, i) => {
    const d = new Date(iso + "T12:00"), tipo = plan[d.getDay()] || "descanso";
    return `<span class="sem-dia${iso === hoy ? " hoy" : ""}${min[i] ? " con" : ""}${tipo === "descanso" ? " descanso" : ""}"><span class="sem-barra"><i style="height:${Math.max(min[i] ? 18 : 0, Math.round((min[i] / max) * 100))}%"></i>${min[i] ? `<b>${min[i]}</b>` : ""}</span><span class="sem-ini">${d.toLocaleDateString(idioma(), { weekday: "narrow" })}</span>${icono(IC[tipo] || "fuerza", "ic sem-ic")}</span>`;
  }).join("")}</div>`;
}
/* ---------- «Hoy» de un vistazo y modo sencillo (mejora grande 19) ---------- */
/** Qué cuidados se dicen primero según la sesión del día (de los mecanismos de su lista, los 3 primeros). */
const CUID_PRIO = {
  aerobico: ["azucar", "pulso", "acelera", "tension", "calor", "agua", "ritmo", "sangrado", "equilibrio", "tendon", "sol", "cansancio", "musculo", "tension_alta", "fuerza_hueso"],
  fuerza: ["azucar", "tension_alta", "musculo", "tendon", "tension", "sangrado", "pulso", "equilibrio", "fuerza_hueso", "agua", "calor", "ritmo", "acelera", "cansancio", "sol"],
  fuerza_eq: ["azucar", "equilibrio", "sangrado", "tension", "tension_alta", "musculo", "tendon", "pulso", "fuerza_hueso", "agua", "calor", "ritmo", "acelera", "cansancio", "sol"],
  descanso: ["azucar", "sol", "calor", "equilibrio", "sangrado", "tension"],
};
/** Lo de hoy: tipo de sesión, minutos, mejor franja, 3 cuidados según su medicación y lo ya hecho. */
function datosHoy() {
  const plan = planDeHoy(), franja = franjaHoy();
  const ses = plan.tipo === "descanso" ? null : sesionDe(plan.tipo, { fragil: esFragil(), minutosAer: esFragil() ? 10 : 30 });
  const res = evaluar(datos, medsActivos(), ctxActual());
  const presentes = new Set(porquesDe(res.items.flatMap((it) => [...it.senales])));
  const cuidados = (CUID_PRIO[plan.tipo] || CUID_PRIO.aerobico).filter((id) => presentes.has(id)).slice(0, 3);
  const hecho = leerDiario().filter((x) => x.fecha === hoyISO()).reduce((n, x) => n + (x.min || 0), 0);
  return { plan, franja, ses, cuidados, hecho };
}
const listaCuidados = (ids, clase) => ids.length ? `<ul class="${clase}">${ids.map((id) => `<li><span>${t("cuid." + id)}</span><button type="button" class="pq-mini" data-porque="${id}" aria-label="${t("pq.titulo")} ${t("pq.b." + id)}">${t("pq.titulo")}</button></li>`).join("")}</ul>` : "";
/** Lo de hoy para leerlo en voz alta. */
function lecturaHoy(d) {
  if (!d.ses) return t("sen.lectura_descanso");
  return [t("sen.lectura", { s: d.plan.etiqueta, m: d.ses.min }), d.franja ? t("sen.lectura_mejor", { f: d.franja.replace("–", " - ") }) : "", d.cuidados.length ? `${t("sen.lectura_cuidado")} ${d.cuidados.map((id) => t("cuid." + id)).join(" ")}` : ""].filter(Boolean).join(" ");
}
let sencillo = (() => { try { return localStorage.getItem("medex.sencillo") === "1"; } catch { return false; } })();
function ponerSencillo(on, { avisar = true } = {}) {
  sencillo = on;
  try { localStorage.setItem("medex.sencillo", on ? "1" : "0"); } catch {}
  document.body.classList.toggle("sencillo", on);
  $("#btn-sencillo")?.setAttribute("aria-pressed", String(on));
  renderSencillo();
  window.scrollTo({ top: 0 });
  if (on && avisar) toast(t("sen.activado"), { ms: 5000 });
}
/** Modo sencillo: una sola pantalla con lo de hoy, en grande y con voz; el resto de la aplicación queda oculto hasta «Ver todo». */
function renderSencillo() {
  let box = $("#sencillo");
  if (!sencillo) { box?.remove(); return; } // fuera del modo sencillo no queda nada suyo en la página (ni ids ni anillos repetidos)
  if (!box) { box = document.createElement("section"); box.id = "sencillo"; box.className = "sencillo-vista"; box.setAttribute("aria-labelledby", "sen-tit"); $("main.contenedor").prepend(box); }
  box.hidden = false;
  const fecha = new Date().toLocaleDateString(idioma(), { weekday: "long", day: "numeric", month: "long" });
  const cab = `<div class="sen-cab"><p class="sen-fecha">${fecha}</p><button type="button" class="btn-sec sm" data-sen-salir>${t("sen.salir")}</button></div>`;
  if (!datos) box.innerHTML = `${cab}<p class="sen-dur" id="sen-tit">…</p>`; // la base aún se está cargando
  else if (!medsActivos().length) {
    box.innerHTML = `${cab}<h2 id="sen-tit">${t("sen.sin_meds")}</h2><button type="button" class="btn sen-empezar" data-sen-salir>${t("sen.ir")}</button>`;
  } else {
    const d = datosHoy();
    const img = { aerobico: "plan-aerobico", fuerza: "plan-fuerza", fuerza_eq: "plan-equilibrio" }[d.plan.tipo] || "plan-paseo";
    box.innerHTML = `${cab}
      <img class="sen-img" src="assets/img/${img}.webp" alt="" width="960" height="480" decoding="async">
      <h2 id="sen-tit">${d.ses ? `${t("sen.toca")}: <b>${d.plan.etiqueta}</b>` : t("sen.descanso")}</h2>
      <p class="sen-dur">${d.ses ? `${t("sen.dur", { m: d.ses.min })}${d.franja ? ` · ${t("sen.mejor", { f: d.franja })}` : ""}` : t("plan.descanso_txt")}</p>
      ${d.hecho ? `<p class="sen-hecho-ok"><span aria-hidden="true">✓</span> ${t("sen.hecho_ok", { m: d.hecho })}</p>` : ""}
      ${d.ses ? `<button type="button" class="btn sen-empezar" id="sen-empezar">${icono("reanudar")} ${t("sen.empezar")}</button>` : ""}
      <div class="sen-botones">${"speechSynthesis" in window ? `<button type="button" class="btn-sec" id="sen-escuchar">${icono("escuchar")} ${t("sen.escuchar")}</button>` : ""}${d.ses && !d.hecho ? `<button type="button" class="btn-sec" id="sen-hecho"><span aria-hidden="true">✓</span> ${t("sen.hecho")}</button>` : ""}</div>
      ${d.cuidados.length ? `<h3>${t("sen.cuidado")}</h3>${listaCuidados(d.cuidados, "sen-cuidados")}` : ""}
      <div class="sen-semana" hidden></div>
      <details class="alarma sen-alarma"><summary><span class="sub-label">${t("alarma.titulo")}</span><span class="flecha" aria-hidden="true">⌄</span></summary><ul>${ALARMA.map((a) => `<li>${a}</li>`).join("")}</ul></details>`;
    $("#sen-empezar")?.addEventListener("click", () => abrirSesion(d.plan.tipo));
    $("#sen-hecho")?.addEventListener("click", () => { registrarSesion({ fecha: hoyISO(), tipo: d.plan.tipo, min: d.ses.min, rpe: 5, sintomas: [] }); celebrar(); });
    $("#sen-escuchar")?.addEventListener("click", () => escuchar(lecturaHoy(d)));
    cargarSemana().then((S) => {
      const sem = box.querySelector(".sen-semana"); if (!sem) return;
      const diario = leerDiario(), l = S.lunesDe(), r = S.resumen(diario, l, new Date(l.getFullYear(), l.getMonth(), l.getDate() + 7));
      const o = S.objetivos({ fragil: esFragil(), eq: prescripcion(evaluar(datos, medsActivos(), ctxActual()), ctxActual()).eq.n });
      sem.innerHTML = `${S.htmlAnillos(r, o)}<div><h3>${t("sen.semana")}</h3>${S.htmlLeyenda(r, o)}</div>`; sem.hidden = false;
    }).catch(() => { cargarSemana.p = null; });
  }
  box.querySelectorAll("[data-sen-salir]").forEach((b) => b.addEventListener("click", () => ponerSencillo(false)));
}
document.body.classList.toggle("sencillo", sencillo);
$("#btn-sencillo")?.setAttribute("aria-pressed", String(sencillo));
$("#btn-sencillo")?.addEventListener("click", () => { $("#menu-mas").open = false; ponerSencillo(!sencillo); });

let diarioAbierto = false;
/** Palabras bajo la barra de esfuerzo (mejora 209): el número solo no dice nada a quien no conoce la escala. */
const escalaRpe = () => `<span class="rpe-escala" aria-hidden="true"><span>${t("rpe.suave")}</span><span>${t("rpe.moderado")}</span><span>${t("rpe.duro")}</span></span>`;
function renderHoy() {
  const box = $("#hoy"); if (!box) return;
  const diario = leerDiario();
  const plan = planDeHoy(); const franja = franjaHoy();
  const semana = diario.filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 6);
  const nSem = semana.length, minSem = semana.reduce((n, x) => n + (x.min || 0), 0);
  const ultimas = [...diario].reverse().slice(0, 4);
  box.innerHTML = `
    <div class="hoy-cab">
      <div><small>${t("hoy.titulo")}</small><h3>${plan.etiqueta}${franja ? ` <span class="hoy-franja">${t("hoy.mejor", { f: franja })}</span>` : ""}</h3></div>
      <div class="hoy-botones"><button type="button" class="btn sm" id="btn-empezar-hoy"${plan.tipo === "descanso" ? " hidden" : ""}>${t("plan.empezar")}</button><button type="button" class="btn-sec sm" id="btn-registrar">${diarioAbierto ? t("ficha.cerrar") : t("hoy.registrar")}</button><button type="button" class="btn-sec sm" id="btn-ver-plan">${t("plan.ver")}</button></div>
    </div>
    ${(() => { const c = datosHoy().cuidados; return c.length ? `<div class="hoy-cuid"><small>${t("hoy.cuidado")}</small>${listaCuidados(c, "hoy-cuidados")}</div>` : ""; })()}
    ${filaCalor()}${bandaPrimeros(diario)}
    <div class="hoy-semana">${barrasSemana(diario)}<div class="hoy-resumen"><b>${nSem}</b> ${t("hoy.sesiones")} · <b>${minSem}</b> min ${t("hoy.esta_semana")}</div></div>
    <p class="hoy-sencillo"><button type="button" class="btn-sec sm" id="btn-sencillo-hoy">${icono("ojo")} ${t("hoy.sencillo")}</button></p>
    ${diarioAbierto ? `<form class="registro" id="form-registro">
      <div class="chips">${TIPOS_SESION.map((x) => `<label class="chip chip-btn"><input type="radio" name="tipo" value="${x}"${x === (plan.tipo === "descanso" ? "paseo" : plan.tipo) ? " checked" : ""}> ${t("sesion." + x)}</label>`).join("")}</div>
      <div class="fila"><label>${t("hoy.minutos")} <input type="number" name="min" min="1" max="300" value="30" inputmode="numeric"></label><label class="rpe-campo">${t("hoy.rpe")} <input type="range" name="rpe" min="1" max="10" value="5"><output>5</output>${escalaRpe()}</label></div>
      <small>${t("hoy.sintomas")}</small>
      <div class="chips">${SINTOMAS.slice(0, 7).map((x) => `<label class="chip chip-btn"><input type="checkbox" name="sint" value="${x.id}"> ${x.nombre}</label>`).join("")}</div>
      ${camposConstantes()}
      <div class="acciones" style="margin:8px 0 0"><button type="submit" class="btn sm">${t("perf.guardar")}</button></div>
    </form>` : ""}
    ${ultimas.length ? `<ul class="diario-lista">${ultimas.map((x) => `<li><span>${new Date(x.fecha + "T12:00").toLocaleDateString(idioma(), { weekday: "short", day: "numeric", month: "short" })}</span><span>${t("sesion." + x.tipo)} · ${x.min} min · RPE ${x.rpe}${x.sintomas?.length ? ` · <em>${x.sintomas.map((id) => SINTOMAS.find((y) => y.id === id)?.nombre.split(" ")[0]).join(", ")}</em>` : ""}${textoConstantes(x.const)}</span><button type="button" class="quitar" data-id="${x.id}" aria-label="${t("lista.quitar")}">×</button></li>`).join("")}</ul>` : ""}`;
  $("#btn-registrar").addEventListener("click", () => { diarioAbierto = !diarioAbierto; renderHoy(); });
  $("#btn-sencillo-hoy")?.addEventListener("click", () => ponerSencillo(true));
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
    <img class="sint-img" src="assets/img/sintoma-${s.id}.webp" alt="" width="104" height="104" decoding="async">
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
/* recorrido en tres pasos (datos → medicación → plan): estado de cada uno y botón «Siguiente» */
function datosRellenos() { return !!(estado.edad || estado.condiciones.length || estado.caidas || estado.fcReposo || Object.values(estado.pac).some(Boolean) || Object.values(estado.pro).some((v) => v != null && v !== "")); }
let pasoActual = 1;
function pintarPasos() {
  const p1 = datosRellenos(), p2 = estado.meds.filter((m) => !m.libre).length > 0, p3 = p2 && (enInforme || estado.informeVisto);
  pasoActual = !p1 ? 1 : !p2 ? 2 : !p3 ? 3 : 0;
  const pasos = [[p1, t("pasos.1")], [p2, t("pasos.2")], [p3, t("pasos.3")]];
  $("#recorrido-pasos").innerHTML = pasos.map(([ok, txt], i) => `<li class="paso${ok ? " hecho" : ""}${pasoActual === i + 1 ? " actual" : ""}"${pasoActual === i + 1 ? ' aria-current="step"' : ""}><b>${ok ? "✓" : i + 1}</b><span>${txt}</span></li>`).join("");
  const b = $("#btn-siguiente"); b.hidden = pasoActual === 0;
  const listo = $("#rec-listo"); if (listo) listo.hidden = pasoActual !== 0; // mejora 199: con los tres pasos hechos, «Todo listo» en lugar de una barra vacía
  b.innerHTML = `<span class="largo">${t(pasoActual === 1 ? "rec.ir_datos" : pasoActual === 2 ? "rec.ir_meds" : "rec.ir_plan")}</span><span class="corto">${t("rec.siguiente")}</span> <span class="flecha" aria-hidden="true">→</span>`; // mejora 262
  // barra inferior (móvil): insignias
  const nMeds = estado.meds.length; const bm = $('#barra-inferior [data-ir="medicacion"] .nav-badge'); if (bm) { latirSiCambia(bm, nMeds || ""); bm.hidden = !nMeds; }
}
$("#btn-siguiente").addEventListener("click", () => {
  if (pasoActual === 1) { desplazar($("#panel-datos")); setTimeout(() => $("#edad").focus({ preventScroll: true }), 400); }
  else if (pasoActual === 2) { desplazar($("#panel-medicacion")); setTimeout(() => $("#buscar").focus({ preventScroll: true }), 400); }
  else { estado.informeVisto = true; guardar(); desplazar($("#informe")); pintarPasos(); }
});

/* ---------- v1.0: enlace de solo lectura (#ver=): ver el plan de otra persona sin poder cambiarlo ni guardarlo ---------- */
function aplicarSoloLectura() {
  document.body.classList.toggle("solo-lectura", soloLectura);
  const b = $("#aviso-ver"); if (!b) return;
  b.hidden = !soloLectura;
  if (soloLectura) {
    b.innerHTML = `${t("ver.banner")} <button type="button" class="btn-sec sm" id="btn-ver-copia">${t("ver.copia")}</button> <button type="button" class="btn-sec sm" id="btn-ver-salir">${t("ver.salir")}</button>`;
    $("#btn-ver-copia").addEventListener("click", () => { soloLectura = false; estadoPropio = null; aplicarSoloLectura(); guardar(); render(); toast(t("ver.copiado_ok"), { ms: 5000 }); });
    $("#btn-ver-salir").addEventListener("click", () => { soloLectura = false; if (estadoPropio) { Object.assign(estado, { ...estadoPropio, meds: sanearMeds(estadoPropio.meds) }); } estadoPropio = null; aplicarSoloLectura(); restaurarFormulario(); render(); });
  }
  for (const el of $$("#panel-datos input, #panel-datos select, #form-med input, #form-med button, #form-med select")) el.disabled = soloLectura;
}
$("#btn-ver-enlace")?.addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}#ver=${codificarEstado()}`;
  try { await navigator.clipboard.writeText(url); toast(t("ver.copiado"), { ms: 5000 }); } catch { window.prompt(t("ver.enlace"), url); }
});

/* ---------- v1.0: estadísticas y exportación de la consulta (pacientes guardados en este dispositivo); el cálculo va en consulta.js, bajo demanda ---------- */
const cargarConsulta = () => (cargarConsulta.p ||= import("./consulta.js?v=202611222207"));
function abrirEstadisticas() {
  const evaluarE = (e) => ({ ctx: ctxDe({ ...estado, ...e, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {} }), res: evaluarEstado(e), crib: cribadoACSM(sanearCribado(e.cribado)) });
  cargarConsulta().then((C) => C.abrir({ perfiles: leerPerfiles(), evaluar: evaluarE, sit: (c) => ETIQUETAS_CTX[c] || t("sit." + c), senales: datos.kb.senales, crib: (k) => t("crib.chip." + k), version: APP_VERSION, kbVersion: datos.kb.version, descargar: descargarTexto, toast, hoy: hoyISO() }))
    .catch(() => { cargarConsulta.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
$("#btn-consulta-stats")?.addEventListener("click", abrirEstadisticas);
$("#estadisticas-cerrar")?.addEventListener("click", () => $("#estadisticas").close());

/* ---------- v1.0: hoja «Mi sesión» imprimible desde el navegador (sin librerías) ---------- */
function imprimirSesion(tipo) {
  const ses = sesionDe(tipo, { fragil: esFragil(), minutosAer: esFragil() ? 10 : 30 }); if (!ses) return;
  ocasional((O) => O.hojaSesion({ ses, variantes: leerVariantes(), esencial: loEsencial(evaluar(datos, medsActivos(), ctxActual()), 3), dibujo: (id) => picto(id, { clase: "picto picto-hoja" }) || (MOVM?.estatico(id) || "").replace('class="picto"', 'class="picto picto-hoja"') }));
}

/* ---------- v1.0: pantalla de consulta (dos columnas sin pestañas; modo profesional, ≥ 960 px) ---------- */
function modoConsulta() { try { return estado.modo === "profesional" && localStorage.getItem("medex.consulta") === "1" && matchMedia("(min-width: 960px)").matches; } catch { return false; } }
function aplicarConsulta() { document.body.classList.toggle("consulta-pantalla", modoConsulta()); const b = $("#btn-consulta-pantalla"); if (b) b.textContent = modoConsulta() ? t("consulta.normal") : t("consulta.pantalla"); }
$("#btn-consulta-pantalla")?.addEventListener("click", () => { try { localStorage.setItem("medex.consulta", modoConsulta() ? "0" : "1"); } catch {} aplicarConsulta(); render(); });
matchMedia("(min-width: 960px)").addEventListener?.("change", () => { aplicarConsulta(); render(); });

/* ---------- v1.0: huella del informe y aviso de cambios al actualizar la base de conocimiento ---------- */
function huellaInforme(res) {
  const items = [];
  for (const amb of ["general", "aerobico", "fuerza", "equilibrio"]) for (const g of res.ambitos[amb]) for (const r of g.reglas) items.push(`${amb}|${g.item.principio.id}|${r.nivel}|${r.texto}`);
  for (const c of res.combinadas) items.push(`comb|${c.regla.id}|${c.regla.nivel}|${c.texto}`);
  for (const x of res.interacciones) items.push(`ddi|${[x.a.principio.id, x.b.principio.id].sort().join("+")}|${x.nivel}|${x.efecto}`);
  return items;
}
function firmaLista() { return JSON.stringify([medsActivos().map((m) => [m.pid, m.dosis, m.tomas]), estado.edad, [...ctxActual().condiciones].sort()]); }
function guardarHuella(res) { try { localStorage.setItem("medex.huella", JSON.stringify({ kb: datos.kb.version, lista: firmaLista(), items: huellaInforme(res) })); } catch {} }
function evaluarEstado(e) { return evaluar(datos, (e.meds || []).filter((m) => !m.pausado && !m.libre), ctxDe({ ...estado, ...e, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {} })); }
function comprobarCambiosBase() {
  let h = null; try { h = JSON.parse(localStorage.getItem("medex.huella") || "null"); } catch {}
  if (!h || h.kb === datos.kb.version) return;
  try { localStorage.setItem("medex.huella", JSON.stringify({ ...h, kb: datos.kb.version })); } catch {} // ya, antes del primer render (que guarda la huella nueva)
  ocasional((O) => { // la comparación y el aviso viven en js/ocasional.js: solo hacen falta cuando cambia la base
    const cambios = [];
    if (estado.meds.length && h.lista === firmaLista() && Array.isArray(h.items)) { const d = O.diffHuella(h.items, huellaInforme(evaluar(datos, medsActivos(), ctxActual()))); if (d.total) cambios.push({ nombre: t("kbcambio.actual"), d }); }
    const perfiles = leerPerfiles(); let tocados = 0;
    for (const pf of perfiles) {
      try {
        const items = huellaInforme(evaluarEstado(pf.estado));
        if (pf.huella?.items && pf.huella.kb !== datos.kb.version) { const d = O.diffHuella(pf.huella.items, items); if (d.total) { cambios.push({ nombre: pf.nombre, d }); tocados++; } }
        pf.huella = { kb: datos.kb.version, items };
      } catch {}
    }
    escribirPerfiles(perfiles);
    try { localStorage.setItem("medex.kbcambios", JSON.stringify({ fecha: Date.now(), de: h.kb, a: datos.kb.version, cambios: cambios.map((c) => ({ nombre: c.nombre, nuevos: c.d.nuevos, eliminados: c.d.eliminados, modificados: c.d.modificados })), tocados })); } catch {}
    O.avisoKb({ nombresPids });
  });
}
function pintarAvisoKb() {
  const b = $("#aviso-kb"); if (!b) return;
  let k = null; try { k = localStorage.getItem("medex.kbcambios"); } catch {}
  if (k) ocasional((O) => O.avisoKb({ nombresPids })); else b.hidden = true;
}
$("#kbcambios-cerrar")?.addEventListener("click", () => $("#kbcambios").close());

const cargarBeneficios = () => (cargarBeneficios.p ||= import("./beneficios.js?v=202611222207"));
/** «Lo que el ejercicio hace por usted» (mejora grande 3): cifras de revisiones para lo marcado; el contenido va en beneficios.js. */
function seccionBeneficios() {
  const ctx = ctxActual(), sec = seccion(t("ben.titulo"), { clave: "beneficios", resumen: "…" }), cuerpo = sec.querySelector(".cuerpo-sec");
  cargarBeneficios().then((B) => { const n = B.pintar(cuerpo, { condiciones: [...ctx.condiciones], edad: ctx.edad, caidas: ctx.caidas }); sec.querySelector(".resumen-sec").textContent = n === 1 ? B.tx("n1") : B.tx("n", { n }); })
    .catch(() => { cargarBeneficios.p = null; sec.remove(); });
  return sec;
}
const cargarHabitos = () => (cargarHabitos.p ||= import("./habitos.js?v=202611222207"));
function irHabitos() { const d = $("#bloque-habitos"); if (!d) return; d.open = true; desplazar(d); setTimeout(() => d.querySelector("input:checked, input")?.focus({ preventScroll: true }), 400); }
/** «Alcohol, tabaco y café con su medicación» (mejora grande 5): abierta si alguna respuesta tiene algo que cruzar. */
function seccionHabitos(res) {
  const h = estado.habitos || {}, resp = Object.values(h).some(Boolean);
  const sec = seccion(t("hab.seccion"), { clave: "habitos", abierta: Object.values(h).some((v) => v && v !== "no" && v !== "poco"), resumen: resp ? "…" : t("hab.sin_resp") }), cuerpo = sec.querySelector(".cuerpo-sec");
  cargarHabitos().then((H) => {
    const r = H.pintar(cuerpo, { items: res.items, habitos: h, ctx: ctxActual(), t, etiqueta, glosar, ficha: (p) => enlaceFicha(p, " " + nombreCorto(p)), responder: irHabitos });
    if (r.respondido) sec.querySelector(".resumen-sec").innerHTML = r.n ? `${r.n} ${t("inf.avisos")} · ${resumenNiveles(r.alerta, r.precaucion, r.info)}` : H.tx("ninguno");
  }).catch(() => { cargarHabitos.p = null; sec.remove(); });
  return sec;
}
const cargarConversa = () => (cargarConversa.p ||= import("./conversa.js?v=202611222207"));
/** «Guía de conversación» (mejora grande 15, modo profesional): reúne lo que la guía adapta y la abre. */
async function abrirConversa() {
  const ctx = ctxActual(), res = evaluar(datos, medsActivos(), ctx), M = estado.metas?.ids?.length ? await cargarMetas() : null;
  const [C, B, H] = await Promise.all([cargarConversa(), cargarBeneficios(), cargarHabitos()]);
  C.abrir({ condiciones: ctx.condiciones, edad: ctx.edad, caidas: ctx.caidas, senales: Object.keys(res.perfil), esencial: loEsencial(res, 3), vistazo: listasVistazo(res, ctx), plan: filasPlanPaciente(res, ctx), P: prescripcion(res, ctx), crib: cribadoActual(res),
    ben: B.tarjetas(B.situaciones({ condiciones: [...ctx.condiciones], edad: ctx.edad, caidas: ctx.caidas })), hab: estado.habitos, habAvisos: H.evaluar(res.items, estado.habitos, ctx), metas: (estado.metas?.ids || []).map((id) => M?.POR_ID[id]?.titulo).filter(Boolean),
    alarma: ALARMA, nMeds: res.items.length, nMayor: res.interacciones.filter((x) => x.nivel === "mayor").length, diarioN: leerDiario().length, sppbTxt: ctx.sppb != null ? `SPPB ${ctx.sppb}/12` : null, version: APP_VERSION, t, toast, acciones: { sppb: () => $("#btn-sppb")?.click(), habitos: irHabitos } });
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-conversa]"); if (b) { ev.preventDefault(); $("#menu-mas").open = false; abrirConversa().catch(() => { cargarConversa.p = null; }); } });
function renderTab(cont, res, tab) {
  if (tab === "general") {
    cont.append(seccionBeneficios(), seccionHabitos(res));
    const imp = seccionImpacto(res); if (imp) cont.append(imp);
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
  } else if (tab === "interacciones") {
    renderInteracciones(cont, res);
  } else if (tab === "cuando") {
    renderCuando(cont);
  } else if (tab === "plan") {
    renderPlan(cont);
  } else {
    if (tab === "aerobico") cont.insertAdjacentHTML("beforeend", tarjetaZona(res));
    if ("speechSynthesis" in window) { cont.insertAdjacentHTML("afterbegin", `<div class="escuchar-tab"><button type="button" class="btn-sec sm" data-escuchar-tab>${icono("escuchar")} ${t("escuchar.apartado")}</button></div>`); cont.querySelector("[data-escuchar-tab]").addEventListener("click", () => escuchar(cont.innerText)); }
    renderAmbito(cont, res.ambitos[tab], null, tab);
  }
}

/** «De un vistazo»: puede hacer / con cuidado / evite + plan semanal + ritmo. Misma jerarquía que la primera cara del PDF del paciente. */
function renderVistazo(res, ctx) {
  const cont = $("#vistazo"); if (!cont) return;
  const { puede, cuidado, evite } = listasVistazo(res, ctx);
  const col = (nivel, titulo, items) => `<div class="semaforo-col s-${nivel}"><h4>${titulo}</h4><ul>${items.slice(0, 4).map((x) => `<li>${glosar(x)}</li>`).join("")}</ul></div>`;
  const filas = filasPlanPaciente(res, ctx);
  const r = ritmoTexto(zonaIntensidad(res, ctx, { fcReposo: estado.fcReposo }));
  cont.innerHTML = `
    <section class="vistazo" aria-labelledby="vistazo-t">
      <h3 id="vistazo-t">${t("vistazo.titulo")}</h3>
      <div class="semaforo">${col("info", t("vistazo.puede"), puede)}${col("precaucion", t("vistazo.cuidado"), cuidado)}${col("alerta", t("vistazo.evite"), evite)}</div>
      <h4 class="vistazo-plan-t">${t("vistazo.plan")}</h4>
      <table class="tabla-plan"><thead><tr><th scope="col"><span class="sr-only">Tipo</span></th><th scope="col">${t("vistazo.veces")}</th><th scope="col">${t("vistazo.cuanto")}</th><th scope="col">${t("vistazo.como")}</th></tr></thead>
      <tbody>${filas.map(([k, a, b, c]) => `<tr><th scope="row">${t("vistazo." + k)}</th><td data-l="${t("vistazo.veces")}">${a}</td><td data-l="${t("vistazo.cuanto")}">${b}</td><td data-l="${t("vistazo.como")}">${glosar(c)}</td></tr>`).join("")}</tbody></table>
      ${r ? `<p class="ritmo"><b>${t("vistazo.ritmo")}:</b> ${glosar(r.linea)}${r.nota ? ` <small>${r.nota}</small>` : ""}</p>` : ""}
      <div class="acciones"><button type="button" class="btn-sec sm" id="btn-vistazo-semana">${t("vistazo.semana")}</button><small class="muted">${t("vistazo.nota")}</small></div>
    </section>`;
  $("#btn-vistazo-semana").addEventListener("click", () => { estado.tab = "plan"; guardar(); render(); $("#contenido-tab").scrollIntoView({ behavior: "smooth", block: "start" }); });
}

/** «N marcadas» en el resumen de los plegables de datos (situación clínica, más situaciones, cómo se mueve). */
function pintarMarcadas() {
  for (const id of ["bloque-situacion", "bloque-situacion-mas", "bloque-movilidad"]) {
    const d = document.getElementById(id); const sum = d?.querySelector(":scope > summary"); if (!sum) continue;
    let b = sum.querySelector(".marcadas");
    if (!b) { b = document.createElement("span"); b.className = "marcadas"; sum.querySelector(".sub-label")?.after(b); }
    const n = d.querySelectorAll("input[type=checkbox]:checked").length;
    b.hidden = !n; latirSiCambia(b, n ? t(n === 1 ? "datos.marcada1" : "datos.marcadas", { n }) : ""); // mejora 481: late al cambiar
  }
}
/* ---------- movimiento futurista (mejoras 381-530): siempre de una vez, nunca continuo ----------
   Se apaga con «reducir movimiento» y en las pruebas automáticas (navigator.webdriver), para que las cifras se lean al momento. */
/** Mejora 392: la cifra cuenta desde la anterior (o desde 0 la primera vez) hasta la nueva, en medio segundo. */
function contarCifra(el, clave) {
  if (!el) return;
  const fin = parseInt(el.textContent, 10);
  const ini = MOV.cifras.has(clave) ? MOV.cifras.get(clave) : 0;
  MOV.cifras.set(clave, fin);
  if (!Number.isFinite(fin) || ini === fin || !MOV.ok()) return;
  const texto = el.textContent, t0 = performance.now(), dur = 520;
  el.classList.add("contando");
  const paso = (ahora) => {
    if (!el.isConnected) return;
    const k = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = k < 1 ? String(Math.round(ini + (fin - ini) * e)) : texto;
    if (k < 1) requestAnimationFrame(paso); else el.classList.remove("contando");
  };
  requestAnimationFrame(paso);
}
/** Mejoras 689-696: aplica un cambio con una transición de vista (lista, día del plan, recorrido) si el navegador sabe y se permite el movimiento.
 *  La clase en <html> dice al CSS qué piezas se animan y apaga el fundido general de la página. */
function conTransicion(clase, fn) {
  if (!document.startViewTransition || !MOV.ok()) { fn(); return; }
  const raiz = document.documentElement; raiz.classList.add(clase);
  const vt = document.startViewTransition(fn);
  vt.finished.finally(() => raiz.classList.remove(clase));
}
/** Mejora 408: la insignia late una vez cuando cambia su número. */
function latirSiCambia(el, valor) {
  const nuevo = String(valor), antes = el.textContent;
  el.textContent = nuevo;
  if (antes !== nuevo && nuevo && antes !== "" && MOV.ok()) { el.classList.remove("late"); void el.offsetWidth; el.classList.add("late"); }
}
/** Mejora 418: luz que sigue al ratón sobre las tarjetas (solo con ratón; no se mueve sola). */
if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const SEL = "details.farmaco, .btn-doc, #lista-meds li:not(.libre):not(.pausado):not(.combo-cab), .completitud, .vistazo, .tile, .veredicto, .hoy, .hoja-opciones button";
  let ev = null, raf = 0, previo = null;
  document.addEventListener("pointermove", (e) => {
    ev = e; if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const el = MOV.ok() ? ev.target.closest?.(SEL) : null;
      if (previo && previo !== el) previo.classList.remove("con-luz"); // la luz se apaga despacio donde estaba el ratón
      previo = el; if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${Math.round(ev.clientX - r.left)}px`); el.style.setProperty("--my", `${Math.round(ev.clientY - r.top)}px`); el.classList.add("con-luz");
      // mejora 543: posición relativa (0 a 1) para inclinar documentos y opciones hacia el puntero
      el.style.setProperty("--px", ((ev.clientX - r.left) / r.width).toFixed(2)); el.style.setProperty("--py", ((ev.clientY - r.top) / r.height).toFixed(2));
    });
  }, { passive: true });
}
/** Mejora 542: onda que sale del punto donde se pulsa (botones secundarios, chips, pestañas y menú). */
document.addEventListener("pointerdown", (e) => {
  if (!MOV.ok()) return;
  const el = e.target.closest?.(".btn-sec, .chip-btn, .tabs button, .menu-lista [role=menuitem]");
  if (!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--ox", `${Math.round(e.clientX - r.left)}px`); el.style.setProperty("--oy", `${Math.round(e.clientY - r.top)}px`);
  // con la API de animaciones (no toca la propiedad animation, así no se reinician las entradas del botón)
  ondas.get(el)?.cancel(); el.classList.add("onda");
  const a = el.animate?.([{ "--onda": "0px", "--onda-a": 1 }, { "--onda": "180px", "--onda-a": 0 }], { duration: 600, easing: "ease-out" });
  if (!a) { el.classList.remove("onda"); return; }
  ondas.set(el, a); a.onfinish = () => { el.classList.remove("onda"); ondas.delete(el); };
}, { passive: true });
const ondas = new WeakMap();

/** Difuminado en los bordes de una fila que se desplaza en horizontal (pestañas, tira de días): indica que hay más. */
function bordesDesplazables(el) {
  if (!el) return;
  const pintar = () => { const max = el.scrollWidth - el.clientWidth; el.classList.toggle("hay-izq", el.scrollLeft > 4); el.classList.toggle("hay-der", max > 4 && el.scrollLeft < max - 4); };
  if (!el.dataset.bordes) { el.dataset.bordes = "1"; el.addEventListener("scroll", pintar, { passive: true }); window.addEventListener("resize", pintar); }
  pintar();
}
/** Centra un elemento dentro de su fila desplazable sin mover la página. */
function centrarEnFila(fila, el) {
  if (!fila || !el || fila.scrollWidth <= fila.clientWidth) return;
  const fr = fila.getBoundingClientRect(), er = el.getBoundingClientRect();
  fila.scrollLeft = Math.max(0, fila.scrollLeft + (er.left - fr.left) - (fila.clientWidth - er.width) / 2);
}

function render() {
  const ctx = ctxActual();
  const resLista = evaluar(datos, estado.meds.filter((m) => !m.libre), ctx);     // todos los conocidos, para pintar la lista
  const res = evaluar(datos, medsActivos(), ctx);        // solo los activos, para el informe
  document.body.classList.toggle("sin-meds", !estado.meds.length);
  renderSencillo(); // mejora grande 19: si está activo, la pantalla de hoy se pinta antes que nada
  pintarPasos();
  renderRapido();
  renderSupRapido();

  // lista de medicación
  const ul = $("#lista-meds");
  ul.innerHTML = "";
  $("#ejemplo-banner").hidden = !estado.ejemplo;
  let k = 0;
  estado.meds.forEach((m, i) => {
    const li = document.createElement("li");
    li.style.setProperty("--vtn", "med-" + String(m.pid || m.nombre || i).toLowerCase().replace(/[^a-z0-9-]+/g, "-")); // mejora 689: nombre estable para la transición de la lista
    if (m.libre) {
      li.classList.add("libre");
      li.innerHTML = `
        <div class="med-nombre"><svg class="ic-grupo g-libre" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${GRUPO_ICONS.pastilla}"/></svg><div><strong>${m.nombre}</strong><small>${t("libre.sin_info")}</small></div></div>
        <div class="med-dosis">${m.dosis != null ? `${m.dosis.toLocaleString("es-ES")} mg${m.tomas > 1 ? ` × ${m.tomas}/día` : ""}` : t("lista.sin_dosis")}</div>
        <div class="med-acciones"><button type="button" class="pausar" title="${t("pegar.avisar")}" aria-label="${t("pegar.avisar")} ${m.nombre}">${icono("correo")}</button><button type="button" class="quitar" aria-label="${t("lista.quitar")} ${m.nombre}">×</button></div>`;
      li.querySelector(".pausar").addEventListener("click", () => window.open(urlSugerencia({ lista: "No reconocido: " + m.nombre }), "_blank", "noopener"));
      li.querySelector(".quitar").addEventListener("click", () => { const q = estado.meds[i]; conTransicion("vt-lista", () => { estado.meds.splice(i, 1); guardar(); render(); }); toast(t("lista.quitado", { f: m.nombre }), { accion: t("lista.deshacer"), onAccion: () => conTransicion("vt-lista", () => { estado.meds.splice(Math.min(i, estado.meds.length), 0, q); guardar(); render(); }) }); });
      ul.append(li);
      return;
    }
    const it = resLista.items[k++];
    if (!it) return;
    if (m.combo && (i === 0 || estado.meds[i - 1].combo !== m.combo)) { // cabecera de la combinación a dosis fijas: la marca y, debajo, cada principio por separado
      const n = estado.meds.filter((x) => x.combo === m.combo).length;
      const cab = document.createElement("li"); cab.className = "combo-cab"; cab.style.setProperty("--vtn", "combo-" + String(m.combo).toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
      cab.innerHTML = `<div><strong>${t("lista.combo_cab", { m: m.combo })}</strong><small>${t("lista.combo_nota", { n })}</small></div><button type="button" class="quitar" aria-label="${t("lista.quitar_combo")} ${m.combo}" title="${t("lista.quitar_combo")}">×</button>`;
      cab.querySelector(".quitar").addEventListener("click", () => { const quitados = estado.meds.filter((x) => x.combo === m.combo); conTransicion("vt-lista", () => { estado.meds = estado.meds.filter((x) => x.combo !== m.combo); guardar(); render(); }); toast(t("lista.quitado", { f: m.combo }), { accion: t("lista.deshacer"), onAccion: () => conTransicion("vt-lista", () => { estado.meds.push(...quitados); guardar(); render(); }) }); });
      ul.append(cab);
    }
    if (m.combo) li.classList.add("en-combo");
    if (m.pausado) li.classList.add("pausado");
    li.classList.toggle("sin-dosis", it.dosisTotal == null);                         // mejora 239
    const tipoIt = tipoProducto(it.principio, it.clase); if (tipoIt) li.dataset.tipo = tipoIt; // mejora 240
    if (ultimoAnadido && m.pid === ultimoAnadido) { li.classList.add("nuevo"); ultimoAnadido = null; }
    const dosis = it.dosisTotal != null
      ? (it.esDiaria && it.tomas > 1
        ? `${it.dosisPorToma.toLocaleString("es-ES")} ${unidadPorToma(it.unidad)} × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día = ${it.dosisTotal.toLocaleString("es-ES")} ${unidadPorDia(it.unidad)}`
        : `${it.dosisPorToma.toLocaleString("es-ES")} ${it.esDiaria ? unidadPorDia(it.unidad) : it.unidad}`) + (it.aDemanda ? " · si precisa" : "")
      : t("lista.sin_dosis");
    li.innerHTML = `
      <div class="med-nombre">${iconoGrupo(it.clase)}<div><strong>${it.principio.nombre}</strong><small title="${it.clase.nombre.replace(/"/g, "&quot;")}">${etqTipo(it.principio, it.clase)}${m.combo ? `${t("lista.en")} ${m.combo} · ` : ""}${grupoVisible(it.principio, it.clase)}${m.pausado ? ` · <em>${t("lista.pausado")}</em>` : ""}</small></div></div>
      <div class="med-dosis"><button type="button" class="editar" title="${t("lista.editar_dosis")}">${dosis}${it.dosisCat === "alta" && !m.pausado ? ` <span class="chip chip-alta">${t("inf.dosis_alta")}</span>` : ""} ${icono("editar", "ic ic-sm")}</button></div>
      <div class="momentos" role="group" aria-label="${t("mom.grupo")}">${MOMENTOS.map((mm) => `<button type="button" class="mom" data-m="${mm}" aria-pressed="${(m.momentos || []).includes(mm)}" title="${momTxt(mm)}">${mm === "noche" ? t("mom.noche_corto") : momTxt(mm)}</button>`).join("")}</div>
      <div class="med-acciones"><button type="button" class="pausar" title="${m.pausado ? t("lista.reanudar") : t("lista.pausar")}" aria-label="${m.pausado ? t("lista.reanudar") : t("lista.pausar")} ${it.principio.nombre}">${icono(m.pausado ? "reanudar" : "pausa")}</button><button type="button" class="quitar" aria-label="${t("lista.quitar")} ${it.principio.nombre}">×</button></div>`;
    li.querySelectorAll(".mom").forEach((b) => b.addEventListener("click", () => {
      const set = new Set(m.momentos || []);
      set.has(b.dataset.m) ? set.delete(b.dataset.m) : set.add(b.dataset.m);
      m.momentos = MOMENTOS.filter((x) => set.has(x)); if (m.momentos.length) m.tomas = m.momentos.length;
      guardar(); render();
    }));
    li.querySelector(".pausar").addEventListener("click", () => { const nuevo = !m.pausado; conTransicion("vt-lista", () => { m.pausado = nuevo; guardar(); render(); }); toast(nuevo ? t("lista.pausado_msg", { f: it.principio.nombre }) : t("lista.reanudado_msg", { f: it.principio.nombre }), { ms: 3500 }); });
    li.querySelector(".quitar").addEventListener("click", () => {
      const quitado = estado.meds[i]; conTransicion("vt-lista", () => { estado.meds.splice(i, 1); estado.ejemplo = false; guardar(); render(); });
      toast(t("lista.quitado", { f: it.principio.nombre }), { accion: t("lista.deshacer"), onAccion: () => conTransicion("vt-lista", () => { estado.meds.splice(Math.min(i, estado.meds.length), 0, quitado); guardar(); render(); }) });
    });
    li.querySelector(".editar").addEventListener("click", () => editarEnSitio(li, m, it));
    ul.append(li);
  });
  $("#sin-meds").hidden = estado.meds.length > 0;
  { // contador de la lista (mejora 186) y casillas marcadas en cada plegable de datos (mejora 188)
    const cm = $("#cuenta-meds"), n = estado.meds.length, np = estado.meds.filter((m) => m.pausado).length;
    if (cm) { cm.hidden = !n; latirSiCambia(cm, n ? t(n === 1 ? "lista.cuenta1" : "lista.cuenta", { n }) + (np ? t("lista.cuenta_pausa", { n: np }) : "") : ""); } // mejora 482: late al cambiar
    pintarMarcadas();
  }
  $("#informe").hidden = res.items.length === 0;
  $("#solo-libres").hidden = !(res.items.length === 0 && medsLibres().length);
  if (!res.items.length) { $("#barra-inferior").hidden = $("#completitud").hidden = true; $("#esencial").innerHTML = ""; $("#indice-informe").hidden = true; renderCribado(res); pintarReeval(); pintarSppbEstado(); $("#btn-barras").hidden = !barrasDisponible(); return; }

  // chips de contexto derivado
  const chips = [...ctx.condiciones].map((c) => ETIQUETAS_CTX[c]).filter(Boolean);
  if (ctx.edad) chips.unshift(`${ctx.edad} años`);
  if (ctx.daiFc) chips.push(`DAI ${ctx.daiFc} lpm`);
  if (ctx.sppb != null) chips.push(`SPPB ${ctx.sppb}`);
  $("#contexto").innerHTML = chips.length ? chips.map((c) => `<span class="chip">${c}</span>`).join("") : "";
  // resumen
  $("#resumen").innerHTML = ["alerta", "precaucion", "info"]
    .map((n) => `<div class="tile tile-${n}"><span class="num">${res.resumen[n]}</span><span>${etiqueta(n)}</span></div>`).join("") +
    `<div class="tile tile-ddi"><span class="num">${res.interacciones.length}</span><span>${t("tab.interacciones")}</span></div>`;
  $$("#resumen .tile").forEach((tl, i) => contarCifra(tl.querySelector(".num"), "resumen" + i)); // mejora 392
  // veredicto en lenguaje claro
  const { alerta: nA, precaucion: nP } = res.resumen;
  const mayores = res.interacciones.filter((x) => x.nivel === "mayor").length;
  const veredicto = nA || mayores ? t(nA + mayores === 1 ? "veredicto.alerta1" : "veredicto.alerta", { a: nA + mayores }) : nP ? t(nP === 1 ? "veredicto.precaucion1" : "veredicto.precaucion", { p: nP }) : t("veredicto.ok");
  const crib = cribadoActual(res);
  renderCribado(res); pintarReeval(); pintarSppbEstado();
  $("#btn-barras").hidden = !barrasDisponible();
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
  renderVistazo(res, ctx);

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
  centrarEnFila($(".tabs"), $('.tabs [aria-selected="true"]')); bordesDesplazables($(".tabs"));
  $("#barra-inferior").hidden = false;
  { const bc = $("#barra-contador"); const n = res.resumen.alerta + res.resumen.precaucion; bc.className = "nav-badge" + (res.resumen.alerta ? " alerta" : ""); latirSiCambia(bc, n || ""); bc.hidden = !n; const bp = $('#barra-inferior [data-ir="plan"] .nav-badge'); if (bp) { const d = leerDiario().filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 6).length; bp.textContent = d || ""; bp.hidden = !d; } }
  pintarCompletitud(res);
  guardarHuella(res);
  const cont = $("#contenido-tab");
  cont.innerHTML = "";
  if (modoConsulta()) { // pantalla de consulta: todas las secciones seguidas, sin pestañas
    for (const tab of ["general", "aerobico", "fuerza", "equilibrio", "interacciones", "cuando", "plan"]) {
      const bloque = document.createElement("section"); bloque.className = "consulta-bloque"; bloque.id = "consulta-" + tab;
      bloque.innerHTML = `<h3 class="consulta-bloque-t">${t("tab." + tab)}</h3>`;
      renderTab(bloque, res, tab); cont.append(bloque);
    }
  } else renderTab(cont, res, estado.tab);
  // perfil de señales
  const perfil = Object.entries(res.perfil).filter(([s]) => datos.kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s)).sort((a, b) => b[1].length - a[1].length);
  $("#perfil").innerHTML = "";
  if (perfil.length) {
    const sec = seccion(t("inf.efectos"), { abierta: false, clave: "perfil", resumen: t("inf.n_efectos", { n: perfil.length }) });
    sec.querySelector(".cuerpo-sec").innerHTML = `<ul>${perfil.map(([s, its]) => `<li><span class="num">${its.length}</span><span>${datos.kb.senales[s]}</span><small>${its.map((i) => i.principio.nombre).join(", ")}</small>${PQ_SENAL[s] ? `<button type="button" class="pq-mini" data-porque="${PQ_SENAL[s]}" aria-label="${t("pq.titulo")} ${datos.kb.senales[s]}">${t("pq.titulo")}</button>` : ""}</li>`).join("")}</ul><p><button type="button" class="btn-sec sm" data-abre="cuerpo">${t("cuerpo.btn")}</button></p>`;
    $("#perfil").append(sec);
  }
}

/** Sección plegable del informe. `clave` recuerda si el usuario la abrió o cerró. */
function seccion(titulo, { abierta = true, clave, resumen = "" } = {}) {
  const sec = document.createElement("details");
  sec.className = "seccion";
  if (clave && estado.secciones?.[clave] != null) abierta = estado.secciones[clave];
  if (abierta) sec.open = true;
  if (clave) sec.dataset.sec = clave.replace(/^.*:/, ""); // icono de la cabecera según el tipo (avisos, info, combinadas, perfil, impacto)
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
    pintar(seccion(titulo ? `${titulo}: ${t("inf.con_avisos")}` : t("inf.con_avisos"), { clave: (amb || "general") + ":avisos", resumen: `${t("inf.n_farmacos", { n: conAvisos.length })} · ${resumenNiveles(a, p, 0)}` }), conAvisos, true);
  }
  if (soloInfo.length) {
    pintar(seccion(titulo ? `${titulo}: ${t("inf.solo_info")}` : t("inf.sin_precauciones"), { abierta: !conAvisos.length, clave: (amb || "general") + ":info", resumen: `${t("inf.n_farmacos", { n: soloInfo.length })} · ${resumenNiveles(0, 0, soloInfo.reduce((n, g) => n + g.reglas.length, 0))}` }), soloInfo, false);
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
    const dosis = it.dosisTotal != null ? `${it.dosisTotal} ${it.esDiaria ? unidadPorDia(it.unidad) : it.unidad}` : "";
    return `
      <details class="farmaco nivel-${max}"${abierta ? " open" : ""}>
        <summary>
          <span class="barra"></span>
          ${iconoGrupo(it.clase)}
          <span class="txt"><h4>${it.principio.nombre}</h4><small>${etqTipo(it.principio, it.clase)}${[grupoVisible(it.principio, it.clase), dosis].filter(Boolean).join(" · ")}${it.dosisCat === "alta" ? ` · <b>${t("inf.dosis_alta")}</b>` : ""}</small>${max !== "info" ? `<span class="una-frase">${fraseCorta(g.reglas.find((r) => r.nivel === max)?.texto)}</span>` : ""}</span>
          <span class="nivel">${etiqueta(max)}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </summary>
        <div class="cuerpo">
          ${amb ? "" : `<p class="resumen-clase">${it.clase.resumen}</p>`}
          ${it.principio.sintetico && !amb ? `<p class="resumen-clase"><em>${it.principio.nota}</em></p>` : ""}
          <ul>${g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).map((r) => `<li class="nivel-${r.nivel}"><span class="punto"></span><span>${glosar(r.texto)}${r.si?.dosis === "alta" ? ' <em>(por la dosis)</em>' : ""}${r.si?.edad_min ? ` <em>(por la edad)</em>` : ""} <span class="estado-regla ${r.revisado ? "ok" : ""}" title="${r.revisado ? t("regla.revisada.t") : t("regla.borrador.t")}">${r.revisado ? t("regla.revisada") : t("regla.borrador")}</span> <span class="evidencia ev-${nivelEvidencia(r)}" title="${t("ev.titulo")}">${t("ev." + nivelEvidencia(r))}</span>${r.fuente ? ` <small class="fuente-regla">${seccionFT(r) && tieneFicha(it.principio) ? `<a href="${urlFicha(it.principio)}" target="_blank" rel="noopener">${r.fuente}</a>` : r.fuente}</small>` : ""}</span></li>`).join("")}</ul>
          ${chipsPorque(it.senales)}
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
  // «Cambiar» (biblioteca de ejercicios): solo en la lista del plan y en ejercicios de fuerza o equilibrio; el de marcha o bici se ajusta con sus variantes
  const cambiar = !grande && b.clave && !["marcha", "bici"].includes(b.dePict || b.pict) ? `<button type="button" class="ej-cambiar" data-cambiar="${b.de || b.nombre}" data-pict="${b.dePict || b.pict}" aria-label="${t("bib.cambiar")}: ${b.nombre}">${icono("cambiar")}${t("bib.cambiar")}</button>` : "";
  const cuerpo = `<b>${b.nombre}</b>${grande ? ` <em>${b.min}′</em>` : ""}${b.de ? ` <small class="ej-de">${t("bib.en_lugar", { x: b.de })}</small>` : ""}${b.series && v !== "normal" ? ` <small class="ej-de">${PRG.seriesTexto(b.series)}</small>` : ""}<br><small class="detalle">${detalle}</small>${b.clave ? `<br><small class="clave">${t("ej.clave")}: ${b.clave}</small>` : ""}${botones || cambiar ? `<span class="ej-botones">${botones}${cambiar}</span>` : ""}`;
  return grande
    ? `<li><label><input type="checkbox" data-i="${i}">${botonPicto(b)}<span>${cuerpo}</span></label></li>`
    : `<li><span class="min">${b.min}′</span>${botonPicto(b)}<span>${cuerpo}</span></li>`;
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
  // con el programa de 12 semanas en marcha, el objetivo de la semana es el suyo; la racha y el mapa siguen con el objetivo de salud
  const oficial = objetivoSemanal({ fragil }), objProg = objetivoPrograma();
  const obj = objProg ? { min: objProg.min, sesiones: objProg.ses } : oficial;
  const lunes = lunesDe();
  const hoy = hoyISO();
  const dias = [...Array(7)].map((_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });
  const semana = diario.filter((x) => { const d = new Date(x.fecha + "T12:00"); return d >= lunes && d < new Date(lunes.getTime() + 7 * 864e5); });
  const minSem = semana.reduce((n, x) => n + (x.min || 0), 0), nSem = semana.length;
  const racha = rachaSemanas(diario, oficial.min);
  const prog = progresion(diario);
  if (!diaPlan) diaPlan = hoy;
  const sel = dias.find((d) => hoyISO(d) === diaPlan) || new Date();
  const plan = planActual();
  const tipoSel = plan[sel.getDay()] || "descanso";
  const hechoSel = diario.filter((x) => x.fecha === hoyISO(sel));
  const ses = tipoSel === "descanso" ? null : sesionDe(tipoSel, { fragil, minutosAer: fragil ? 10 : 30 });
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
    <div class="metas-plan" hidden></div>
    <div class="prg-plan">${PRG?.leer() ? PRG.tarjeta({ obj: objProg, hechas: nSem }) : hayPrograma() ? "" : `<div class="aprende-tile prg-tile"><span class="apr-ic-t" aria-hidden="true">12</span><span><b>${t("prg.tile")}</b><small>${t("prg.tile_txt")}</small></span><button type="button" class="btn-sec sm" data-programa="" aria-label="${t("prg.empezar")}: ${t("prg.tile")}">${t("prg.empezar")}</button></div>`}</div>
    <div class="mapa-semanas" hidden></div>
    <div class="tendencia">${tendenciaSemanas(diario, obj.min)}</div>
    <details class="bloque mis-dias"${estado.secciones?.misdias ? " open" : ""}><summary><span class="sub-label">${t("plan.dias")} <span class="dias-resumen">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<b class="${estado.plan.dias.includes(d) ? "on" : "off"}">${new Date(2024, 0, 7 + d).toLocaleDateString(idioma(), { weekday: "narrow" })}</b>`).join("")}</span></span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <div class="dias-chips" role="group" aria-label="${t("plan.dias")}">${[1, 2, 3, 4, 5, 6, 0].map((d) => { const on = estado.plan.dias.includes(d); const nombre = new Date(2024, 0, 7 + d).toLocaleDateString(idioma(), { weekday: "short" }).replace(".", ""); return `<button type="button" class="chip chip-btn${on ? " activo" : ""}" data-dia="${d}" aria-pressed="${on}">${nombre}</button>`; }).join("")}<button type="button" class="btn-sec sm" data-dias="tipo">${t("plan.restablecer")}</button></div>
      <small>${t("plan.dias_nota")}</small>
      ${"Notification" in window ? `<div class="aviso-plan"><label class="check"><input type="checkbox" id="aviso-on"${leerAviso().on ? " checked" : ""}> <span>${t("aviso.toggle")}</span></label><label class="aviso-hora"><span>${t("aviso.hora")}</span><input type="time" id="aviso-hora" value="${leerAviso().hora}"></label><small class="muted">${t("aviso.nota")}</small></div>` : ""}
    </details>
    <div class="tira" role="group" aria-label="${t("hoy.esta_semana")}">${dias.map((d) => { const iso = hoyISO(d); const tipo = plan[d.getDay()] || "descanso"; const hecho = diario.some((x) => x.fecha === iso); const clase = ["dia", iso === hoy ? "hoy" : "", iso < hoy ? "pasado" : "", iso === diaPlan ? "sel" : "", hecho ? "hecho" : "", tipo === "descanso" ? "descanso" : ""].filter(Boolean).join(" "); return `<button type="button" class="${clase}" data-iso="${iso}" aria-pressed="${iso === diaPlan}"><span class="d">${fmtDia(d)}</span><span class="n">${d.getDate()}</span>${icono({ aerobico: "aerobico", fuerza: "fuerza", fuerza_eq: "fuerza", descanso: "paseo" }[tipo] || "fuerza")}<span class="tipo">${{ aerobico: t("sesion.aerobico"), fuerza: t("sesion.fuerza"), fuerza_eq: t("plan.fuerza_eq_corto"), descanso: t("plan.descanso_corto") }[tipo]}</span>${hecho ? `<span class="ok">✓</span>` : ""}</button>`; }).join("")}</div>
    <div class="plan-dia">
      <img class="plan-banda" src="assets/img/${{ aerobico: "plan-aerobico", fuerza: "plan-fuerza", fuerza_eq: "plan-equilibrio", equilibrio: "plan-equilibrio" }[tipoSel] || "plan-paseo"}.webp" alt="" width="960" height="480" loading="lazy" decoding="async">
      <div class="plan-dia-cab"><h3>${sel.toLocaleDateString(idioma(), { weekday: "long", day: "numeric", month: "long" })}${hoyISO(sel) === hoy ? ` · ${t("hoy.titulo").toLowerCase()}` : ""}</h3>${hechoSel.length ? `<span class="chip chip-ok">${t("plan.hecho", { m: hechoSel.reduce((n, x) => n + (x.min || 0), 0) })}</span>` : ""}</div>
      ${ses ? `
        <p class="plan-dia-tit"><b>${ses.titulo}</b> · ${ses.min} min</p>
        <ol class="bloques con-picto">${ses.bloques.map((b, i) => bloqueHtml(b, i)).join("")}</ol>
        <p class="plan-fitt">${glosar(tipoSel === "aerobico" ? P.aer.int : P.fue.int)}</p>
        <div class="acciones"><button type="button" class="btn" id="btn-sesion">${hoyISO(sel) === hoy ? t("plan.empezar") : t("plan.ver_sesion")}</button><button type="button" class="btn-sec" id="btn-marcar">${t("plan.marcar")}</button><button type="button" class="btn-sec" id="btn-hoja-sesion">${t("hoja.imprimir")}</button></div>`
      : `<p class="vacio">${t("plan.descanso_txt")}</p>`}
      <p class="rato-enlaces"><button type="button" class="btn-sec sm" data-abre="rato">${t("rato.btn")}</button><button type="button" class="btn-sec sm" data-abre="rato" data-arg="pildoras">${t("rato.pildoras")}</button><button type="button" class="btn-sec sm" data-abre="paseo">${t("paseo.btn")}</button><button type="button" class="btn-sec sm" data-abre="dolor">${t("dolor.btn")}</button>${diario.length && Date.now() - new Date(diario.at(-1).fecha + "T12:00") >= 10 * 864e5 ? `<button type="button" class="btn-sec sm" data-abre="vuelta">${t("vuelta.btn")}</button>` : ""}</p>
    </div>
    <div class="plan-prog ${prog.clave}"><b>${t("prog.titulo")}</b> ${t("prog." + prog.clave, { n: prog.n, r: prog.rpe || "" })}</div>
    <div class="aprende-tile"><span class="apr-ic-t" aria-hidden="true">?</span><span><b>${t("apr.tile")}</b><small class="apr-n">${t("apr.tile_n", { n: leccionesHechas() })}</small></span><button type="button" class="btn-sec sm" data-aprende="">${t("apr.abrir")}</button></div>
    <div class="aprende-tile bib-tile"><span class="apr-ic-t" aria-hidden="true">${icono("cambiar")}</span><span><b>${t("bib.tile")}</b><small>${t("bib.tile_n")}</small></span><button type="button" class="btn-sec sm" data-biblioteca="" aria-label="${t("apr.abrir")}: ${t("bib.tile")}">${t("apr.abrir")}</button></div>
    ${tileSft()}
    <div class="acciones"><button type="button" class="btn-sec sm" id="btn-cal2">${icono("calendario")} ${t("plan.calendario")}</button><button type="button" class="btn-sec sm" id="btn-semana-wa">${icono("whatsapp")} ${t("plan.compartir_semana")}</button><button type="button" class="btn-sec sm" id="btn-mes" data-mes="">${icono("calendario")} ${t("mes.btn")}</button>${constantesRelevantes(res, ctxActual()).length || diario.some((x) => x.const) ? `<button type="button" class="btn-sec sm" id="btn-constantes" data-constantes="">${icono("grafica")} ${t("ct.btn")}</button>` : ""}<button type="button" class="btn-sec sm" id="btn-diario-csv">${icono("guardar")} ${t("diario.csv")}</button></div>
    <p class="esencial-nota">${t("plan.nota")}</p>`;
  cont.append(sec);
  // Mejora grande 11: tres anillos (moverse, fuerza, equilibrio), racha amable y mapa de 12 semanas (módulo aparte, js/semana.js)
  cargarSemana().then((S) => {
    if (!sec.isConnected) return;
    const l = S.lunesDe(), r = S.resumen(diario, l, new Date(l.getFullYear(), l.getMonth(), l.getDate() + 7));
    const o = S.objetivos({ fragil, eq: P.eq.n }), minOficial = o.min;
    if (objProg) o.min = objProg.min;
    const cab = sec.querySelector(".plan-cab");
    cab.classList.add("con-anillos");
    cab.innerHTML = `<div class="anillos-caja">${S.htmlAnillos(r, o)}</div>
      <div class="plan-obj"><h3>${t("plan.objetivo")} <button type="button" class="btn-ayuda" data-ayuda="semana" aria-label="${t("sem.ayuda_aria")}">?</button></h3>${S.htmlLeyenda(r, o)}<p class="plan-racha">${S.textoRacha(S.rachaAmable(diario, minOficial))}</p><button type="button" class="btn-sec sm ds-btn" data-dosis="">${icono("grafica")} ${t("ds.btn")}</button></div>`;
    const m = sec.querySelector(".mapa-semanas");
    m.innerHTML = `<h4 class="m12-tit">${t("sem.mapa")}</h4>${S.htmlMapa(S.mapaSemanas(diario, minOficial))}`; m.hidden = false; S.activarMapa(m);
  }).catch(() => { cargarSemana.p = null; });
  // Mejora grande 9: «Mis metas» arriba del plan e insignias en los ejercicios del día que las trabajan
  Promise.all([cargarMetas(), cargarPruebas()]).then(([M, S]) => {
    if (!sec.isConnected) return;
    const c = ctxMetas(S), box = sec.querySelector(".metas-plan");
    box.innerHTML = M.tarjeta(c, { recien: metaRecien }); box.hidden = false; metaRecien = null;
    M.insignias(sec.querySelector(".plan-dia"), c);
  }).catch(() => { cargarMetas.p = null; });
  { const tira = sec.querySelector(".tira"); centrarEnFila(tira, tira.querySelector(".dia.sel") || tira.querySelector(".dia.hoy")); bordesDesplazables(tira); } // mejora 201
  sec.querySelectorAll(".tira .dia").forEach((b) => b.addEventListener("click", () => { if (diaPlan === b.dataset.iso) return; conTransicion("vt-dia", () => { diaPlan = b.dataset.iso; render(); }); })); // mejoras 693-694
  sec.querySelectorAll(".dias-chips [data-dia]").forEach((b) => b.addEventListener("click", () => {
    const d = Number(b.dataset.dia); const set = new Set(estado.plan.dias);
    if (set.has(d)) { if (set.size === 1) { toast(t("plan.dias_min"), { ms: 3000 }); return; } set.delete(d); } else set.add(d);
    estado.plan = { dias: [...set] }; guardar(); render();
  }));
  sec.querySelector(".mis-dias").addEventListener("toggle", (ev) => { (estado.secciones ||= {}).misdias = ev.target.open; });
  sec.querySelector("#aviso-on")?.addEventListener("change", async (ev) => {
    if (ev.target.checked) { const ok = await pedirPermisoAviso(); if (!ok) { ev.target.checked = false; toast(t("aviso.permiso_no"), { ms: 6000 }); return; } }
    escribirAviso({ ...leerAviso(), on: ev.target.checked }); programarAviso(); toast(t(ev.target.checked ? "aviso.activado" : "aviso.desactivado"), { ms: 3000 });
  });
  sec.querySelector("#aviso-hora")?.addEventListener("change", (ev) => { escribirAviso({ ...leerAviso(), hora: ev.target.value || "18:00" }); programarAviso(); });
  sec.querySelector('[data-dias="tipo"]').addEventListener("click", () => { estado.plan = { dias: [1, 2, 3, 4, 5, 6] }; guardar(); render(); });
  sec.querySelector("#btn-diario-csv").addEventListener("click", exportarDiarioCsv);
  activarVariantes(sec);
  sec.querySelector("#btn-sesion")?.addEventListener("click", () => abrirSesion(tipoSel, hoyISO(sel)));
  sec.querySelector("#btn-hoja-sesion")?.addEventListener("click", () => imprimirSesion(tipoSel));
  sec.querySelector("#btn-marcar")?.addEventListener("click", () => { registrarSesion({ fecha: hoyISO(sel), tipo: tipoSel, min: ses.min, rpe: 5, sintomas: [] }); celebrar(); });
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

/* ---------- entrenador por voz (js/voz.js) y sesión guiada (js/sesion.js): se cargan al abrir la sesión ---------- */
const cargarVoz = () => (cargarVoz.p ||= import("./voz.js?v=202611222207").then((m) => m.VOZ));
const cargarSesion = () => (cargarSesion.p ||= import("./sesion.js?v=202611222207"));
/** Sesión guiada: chequeo previo, bloques con cronómetro y voz. «extra» permite pasar una sesión ya armada (extra.sesion). */
function abrirSesion(tipo, fecha = hoyISO(), extra = {}) {
  const ctx = ctxActual(), fragil = esFragil();
  // con ejercicios cambiados (biblioteca), la sesión guiada usa los mismos que el plan
  const antes = Promise.all([hayCambios() && !BIB ? cargarBiblio().catch(() => { cargarBiblio.p = null; }) : null, hayPrograma() && !PRG ? cargarPrograma().catch(() => { cargarPrograma.p = null; }) : null]);
  antes.then(() => cargarSesion()).then((S) => S.abrir(tipo, fecha, { sesion: sesionDe(tipo, { fragil, minutosAer: fragil ? 10 : 30 }), res: evaluar(datos, medsActivos(), ctx), ctx, fragil, hoyISO, nivelCalorHoy, abrirCalor, toast, icono, vibrar, MOV, ALARMA, anilloCrono, bloqueHtml, escalaRpe, camposConstantes, activarVariantes, leerVariantes, leerConstantes, registrarSesion, celebrar, cargarVoz: () => cargarVoz().catch((e) => { cargarVoz.p = null; throw e; }), ...extra }))
    .catch(() => { cargarSesion.p = null; toast(t("pq.error"), { ms: 4000 }); });
}
/** Anillo de progreso del cronómetro respecto a la duración prevista (r = 18 → perímetro 113,1). */
function anilloCrono(p) { return `<svg class="anillo-crono" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" class="fondo"/><circle cx="22" cy="22" r="18" class="valor" stroke-dasharray="${(p * 113.1).toFixed(1)} 113.1" transform="rotate(-90 22 22)"/></svg>`; }

function renderCuando(cont) {
  const v = ventanaEntrenamiento(indice, medsActivos(), estado.horas);
  const sec = document.createElement("section");
  const hh = (h) => `${String(h).padStart(2, "0")}:00`;
  const conInfo = v.motivos.length || v.avisos.length;
  sec.innerHTML = `
    <p class="intro-cuando">${conInfo ? t("cuando.intro") : t("cuando.sin_info")}</p>
    <div class="timeline" role="img" aria-label="${t("cuando.titulo")}">${v.horas.map((x) => `<div class="hora nivel-${x.nivel}" title="${hh(x.h)}${x.motivos.length ? ": " + x.motivos.map((m) => m.farmaco + " (" + m.motivo + ")").join("; ") : ""}"><span>${x.h % 3 === 0 ? x.h : ""}</span></div>`).join("")}</div>
    ${v.mejores.length ? `<p class="mejores">${t("cuando.mejores", { m: v.mejores.map((f) => `<b>${hh(f.desde)}–${hh(f.hasta)}</b>`).join(t("cuando.y")) })}</p>` : ""}
    <div class="acciones pt-entrada"><button type="button" class="btn-sec sm" data-pastillero="">${icono("pastillero")} ${t("pt.btn")}</button></div>
    <details class="bloque" open><summary><span class="sub-label">${t("cuando.horas_tomas")}</span><span class="flecha" aria-hidden="true">⌄</span></summary>
      <div class="fila horas-tomas">${MOMENTOS.map((m) => `<label>${momTxt(m)} <input type="number" min="0" max="23" inputmode="numeric" data-hora="${m}" value="${estado.horas[m]}"></label>`).join("")}</div>
      <small>${t("cuando.marque")}</small>
    </details>
    ${v.motivos.length ? `<h3>${t("cuando.porque")}</h3><ul class="motivos">${v.motivos.sort((a, b) => a.desde - b.desde).map((m) => `<li class="nivel-${m.nivel}"><span class="punto"></span><span><b>${hh(m.desde)}–${hh(m.hasta)}</b> · ${m.farmaco} (${t("cuando.toma")} ${momTxt(m.momento).toLowerCase()}): ${m.motivo}</span></li>`).join("")}</ul>` : ""}
    ${v.avisos.length ? `<ul class="motivos">${v.avisos.map((a) => `<li class="nivel-${a.nivel}"><span class="punto"></span><span>${a.farmaco}: ${a.motivo}</span></li>`).join("")}</ul>` : ""}
    <p class="nota-fuentes">${t("cuando.nota")}</p>`;
  sec.querySelectorAll("[data-hora]").forEach((inp) => inp.addEventListener("change", () => { const v = parseInt(inp.value, 10); if (v >= 0 && v <= 23) { estado.horas[inp.dataset.hora] = v; guardar(); render(); } }));
  cont.append(sec);
}

function renderInteracciones(cont, res) {
  const sec = document.createElement("section");
  if (!res.interacciones.length) {
    sec.innerHTML = `<p class="vacio">${t("ddi.ninguna")}</p>`;
  } else {
    sec.innerHTML = `<div class="im-caja" hidden></div>`;
    for (const [i, x] of res.interacciones.entries()) {
      sec.insertAdjacentHTML("beforeend", `
        <article class="ddi ddi-${x.nivel}" id="ddi-${i}">
          <header><h4>${x.a.principio.nombre} <span class="mas">+</span> ${x.b.principio.nombre}</h4><span class="nivel">${datos.ddiCurado.niveles?.[x.nivel] || x.nivel}</span></header>
          <p>${x.efecto}</p>
          ${x.accion ? `<p class="accion"><b>${t("ddi.que_hacer")}:</b> ${x.accion}</p>` : ""}
          <footer>${x.fuente === "curada" ? `${x.revisado === false ? `<span class="estado-regla" title="${t("regla.borrador.t")}">${t("regla.borrador")}</span> ${t("ddi.fuente_borrador")}` : t("ddi.fuente_propia")}${x.fuenteTxt ? " · " + x.fuenteTxt : ""}` : x.fuente === "ddinter" ? `${t("ddi.ddinter")} · ${enlaceFicha(x.a.principio, " " + nombreCorto(x.a.principio))} · ${enlaceFicha(x.b.principio, " " + nombreCorto(x.b.principio))}` : t("ddi.duplicidad")}</footer>
        </article>`);
    }
  }
  const nBorrador = datos.ddiCurado.interacciones.filter((x) => x.revisado === false).length;
  const fuentes = [`${datos.ddiCurado.interacciones.length - nBorrador} ${t("ddi.revisadas")}${nBorrador ? ` (+${nBorrador} ${t("ddi.borradores")})` : ""}`];
  if (datos.ddi?.pares?.length) fuentes.push(`DDInter 2.0 (${datos.ddi.pares.length.toLocaleString("es")} pares, ${datos.ddi.version})`);
  else fuentes.push(t("ddi.pendiente"));
  sec.insertAdjacentHTML("beforeend", `<p class="nota-fuentes">${t("ddi.nota", { n: fuentes.join(" · ") })}</p>`);
  cont.append(sec);
  if (res.interacciones.length) pintarMapaInter(sec.querySelector(".im-caja"), res);
}
const cargarMapa = () => (cargarMapa.p ||= import("./mapa.js?v=202611222207"));
/** Mapa de interacciones (mejora grande 17): tabla de cruces o red, con la ficha de cada cruce; el texto completo sigue en la lista. */
function pintarMapaInter(caja, res) {
  const fuente = (x) => (x.fuente === "curada" ? x.fuenteTxt || t("ddi.fuente_propia") : x.fuente === "ddinter" ? "DDInter 2.0" : t("ddi.duplicidad"));
  const pares = res.interacciones.map((x, i) => ({ i, a: { id: x.a.principio.id, nombre: x.a.principio.nombre }, b: { id: x.b.principio.id, nombre: x.b.principio.nombre }, nivel: x.nivel, efecto: x.efecto, accion: x.accion || "", fuente: fuente(x), borrador: x.revisado === false }));
  const verEnLista = (i) => { const a = document.getElementById("ddi-" + i); if (!a) return; desplazar(a); a.classList.remove("im-marca"); void a.offsetWidth; a.classList.add("im-marca"); a.tabIndex = -1; a.focus({ preventScroll: true }); };
  cargarMapa().then((M) => M.pintar(caja, { pares, todos: res.items.map((it) => ({ id: it.principio.id, nombre: it.principio.nombre })), onVer: verEnLista, onSimular: (id) => abrirSimula([id]) }))
    .catch(() => { cargarMapa.p = null; });
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
const erroresRecientes = [];
function informarError(msg) {
  if (Date.now() - ultimoError < 5000) return; ultimoError = Date.now();
  const txt = String(msg || "").slice(0, 200);
  try { localStorage.setItem("medex.ultimoerror", `${new Date().toISOString()} ${txt}`); } catch {}
  erroresRecientes.push(`${new Date().toISOString().slice(11, 19)} ${txt}`); if (erroresRecientes.length > 5) erroresRecientes.shift();
  toast(t("error.inesperado"), { accion: t("error.informar"), onAccion: () => abrirFeedback({ tipo: "error", texto: "Error de la aplicación: " + txt }), ms: 12000 });
}
window.addEventListener("error", (e) => informarError(e.message));
window.addEventListener("unhandledrejection", (e) => informarError(e.reason?.message || e.reason));

/* ---------- cribado preparticipación (ACSM 2015) ---------- */
const ETIQUETAS_CTX = { renal: "enfermedad renal", renal_grave: "FG < 30", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", marcapasos: "marcapasos/DAI", diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno", embarazo: "embarazo/lactancia", hipertension: "hipertensión", cardiopatia_isquemica: "cardiopatía isquémica", fibrilacion_auricular: "fibrilación auricular", aneurisma_aorta: "aneurisma de aorta", ictus: "ictus previo", cancer: "cáncer", artrosis: "artrosis", epilepsia: "epilepsia", hepatopatia: "hepatopatía", obesidad: "obesidad" };
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
/* Alcohol, tabaco y café (mejora grande 5): tres radios en «Sus datos»; la sección de cruces va en habitos.js. */
function pintarHabitosForm() {
  const h = estado.habitos || {};
  for (const k of Object.keys(HAB)) $$(`input[name="hab-${k}"]`).forEach((r) => { r.checked = h[k] === r.value; });
}
$$('input[name^="hab-"]').forEach((el) => el.addEventListener("change", () => {
  estado.habitos = sanearHabitos(Object.fromEntries(Object.keys(HAB).map((k) => [k, $(`input[name="hab-${k}"]:checked`)?.value ?? null])));
  guardar(); render();
}));
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
/** Foto del estado al prescribir: base de la comparativa del informe de evolución. */
function basePrescripcion() { return { meds: estado.meds.filter((m) => !m.libre).map((m) => ({ pid: m.pid, dosis: m.dosis ?? null, tomas: m.tomas || 1 })), sppb: estado.sppb?.total ?? (estado.pro.sppb != null && estado.pro.sppb !== "" ? Number(estado.pro.sppb) : null), fcReposo: estado.fcReposo ?? null, dias: sanearPlan(estado.plan).dias }; }
$("#btn-prescrito").addEventListener("click", () => { estado.prescrito = { fecha: Date.now(), semanas: prescriptorActual().revision, base: basePrescripcion() }; guardar(); pintarReeval(); toast(t("presc.marcado", { d: fechaReeval().toLocaleDateString(idioma()) }), { ms: 5000 }); });
function fechaReeval() { const d = new Date(estado.prescrito.fecha); d.setDate(d.getDate() + estado.prescrito.semanas * 7); return d; }
function pintarReeval() {
  const b = $("#aviso-reeval"); const e = $("#presc-estado");
  if (!estado.prescrito) { b.hidden = true; if (e) e.textContent = ""; return; }
  const f = fechaReeval(); const dias = Math.round((f - Date.now()) / 864e5);
  if (e) e.innerHTML = `${t("presc.estado", { d: new Date(estado.prescrito.fecha).toLocaleDateString(idioma()), r: f.toLocaleDateString(idioma()) })} <button type="button" class="btn-sec sm" id="btn-evolucion">${t("evo.btn")}</button>`;
  b.hidden = dias > 0;
  if (dias <= 0) b.innerHTML = `${t("presc.toca", { d: f.toLocaleDateString(idioma()) })} <button type="button" class="btn-sec sm" id="btn-evolucion-aviso">${t("evo.btn")}</button> <button type="button" class="btn-sec sm" id="btn-reeval-ok">${t("presc.reevaluado")}</button>`;
  $("#btn-reeval-ok")?.addEventListener("click", () => { estado.prescrito = null; guardar(); pintarReeval(); });
  $("#btn-evolucion")?.addEventListener("click", abrirEvolucion);
  $("#btn-evolucion-aviso")?.addEventListener("click", abrirEvolucion);
}

/* ---------- v1.0: informe de evolución para la reevaluación ---------- */
function evolucionActual() {
  return evolucion(leerDiario(), estado.prescrito, { planDias: sanearPlan(estado.plan).dias, actual: { meds: estado.meds.filter((m) => !m.libre).map((m) => ({ pid: m.pid, dosis: m.dosis ?? null, tomas: m.tomas || 1 })), sppb: estado.sppb?.total ?? (estado.pro.sppb != null && estado.pro.sppb !== "" ? Number(estado.pro.sppb) : null), fcReposo: estado.fcReposo ?? null } });
}
function nombresPids() { const o = {}; for (const c of datos.kb.clases) for (const pr of c.principios) o[pr.id] = pr.nombre; return o; }
// La ventana de evolución y los casos (exportar, importar, CSV, caso de prueba) viven en js/pro.js (se cargan al pulsar su botón)
const cargarPro = () => (cargarPro.p ||= import("./pro.js?v=202611222207"));
const pro = (f) => cargarPro().then(f, () => { cargarPro.p = null; toast(t("pq.error"), { ms: 4000 }); });
function abrirEvolucion() {
  const evo = evolucionActual(); if (!evo) return;
  pro((P) => P.abrirEvolucion({ evo, nombres: nombresPids(), toast, descargarTexto,
    pdfEvolucion: async (e, nombres) => {
      const res = evaluar(datos, medsActivos(), ctxActual());
      const ctx = { ...ctxActual(), prescriptor: prescriptorActual(), prescrito: estado.prescrito, appVersion: APP_VERSION, nombres };
      try { const doc = await (await cargarPdf()).pdfEvolucion(datos.kb, res, ctx, e); doc.save(`evolucion-${e.hasta}.pdf`); } catch (err) { informarError(err?.message || err); }
    },
    renovar: (e) => {
      const hist = Array.isArray(estado.historialPresc) ? estado.historialPresc : [];
      hist.unshift({ fecha: estado.prescrito.fecha, semanas: estado.prescrito.semanas, cierre: e.hasta, adherencia: e.adherencia, sesiones: e.sesiones, minutosSemana: e.minutosSemana, sppb: e.comp.sppb, fcReposo: e.comp.fcReposo });
      estado.historialPresc = hist.slice(0, 12);
      estado.prescrito = { fecha: Date.now(), semanas: prescriptorActual().revision, base: basePrescripcion() };
      guardar(); pintarReeval(); toast(t("evo.renovado", { d: fechaReeval().toLocaleDateString(idioma()) }), { ms: 5000 });
    } }));
}

/* ---------- casos: exportar / importar (JSON anonimizado con huella), lista en CSV, caso de prueba ---------- */
function casoActual() {
  return { meds: estado.meds.map((m) => (m.libre ? { libre: true, nombre: m.nombre, dosis: m.dosis, tomas: m.tomas } : { pid: m.pid, dosis: m.dosis, tomas: m.tomas, unidad: m.unidad, momentos: m.momentos, aDemanda: !!m.aDemanda, pausado: !!m.pausado })),
    edad: estado.edad, caidas: estado.caidas, condiciones: [...estado.condiciones], pac: { ...estado.pac }, pro: { ...estado.pro }, horas: { ...estado.horas }, plan: sanearPlan(estado.plan), cribado: sanearCribado(estado.cribado), modo: estado.modo };
}
function descargarTexto(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$("#btn-caso-exportar").addEventListener("click", () => {
  if (!estado.meds.length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  pro((P) => P.exportarCaso({ caso: casoActual(), kbVersion: datos.kb.version, descargarTexto, toast }));
});
$("#btn-caso-importar").addEventListener("click", () => $("#caso-input").click());
$("#caso-input").addEventListener("change", (ev) => {
  const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
  pro((P) => P.importarCaso(f, { toast, aplicarCaso: (c, meds) => {
    const previa = estado.ejemplo ? [] : structuredClone(estado.meds);
    Object.assign(estado, { meds: sanearMeds(meds), edad: numeroEntre(c.edad, 1, 120), caidas: !!c.caidas, condiciones: (c.condiciones || []).filter((x) => CONDICIONES.includes(x)), pac: c.pac || {}, pro: c.pro || {}, horas: { ...HORA_MOMENTO, ...(c.horas || {}) }, plan: sanearPlan(c.plan), cribado: sanearCribado(c.cribado), ejemplo: false });
    if (c.modo === "profesional" || c.modo === "paciente") estado.modo = c.modo;
    restaurarFormulario(); guardar(); render(); mostrarCambios(previa);
  } }));
});
$("#btn-lista-csv").addEventListener("click", () => {
  if (!estado.meds.length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  pro((P) => P.listaCsv({ meds: estado.meds, res: evaluar(datos, estado.meds.filter((m) => !m.libre), ctxActual()), hoy: hoyISO(), descargarTexto, toast }));
});
$("#btn-caso-prueba").addEventListener("click", () => {
  if (!medsActivos().length) { toast(t("caso.vacio"), { ms: 3000 }); return; }
  const ctx = ctxActual();
  pro((P) => P.casoPrueba({ ctx, res: evaluar(datos, medsActivos(), ctx), meds: medsActivos(), cribado: estado.cribado.regular != null ? sanearCribado(estado.cribado) : null, datos, descargarTexto, toast }));
});

/* ---------- índice lateral del informe (escritorio) y versión ---------- */
$("#app-version").textContent = `v${APP_VERSION}`;
$("#btn-imprimir").addEventListener("click", () => { estado.tab = "general"; render(); setTimeout(() => window.print(), 150); });
{
  const enlaces = $$("#indice-informe a");
  const obs = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) enlaces.forEach((a) => a.classList.toggle("activo", a.getAttribute("href") === "#" + e.target.id)); }, { rootMargin: "-20% 0px -70% 0px" });
  for (const a of enlaces) { const el = document.querySelector(a.getAttribute("href")); if (el) obs.observe(el); }
}

/* ---------- SPPB guiado (Guralnik 1994): equilibrio, marcha 4 m y 5 levantadas de la silla ---------- */
// El SPPB guiado, el escáner de cajas, la copia cifrada y el paso a otro dispositivo viven en js/ocasional.js (se cargan al pulsar su botón)
const cargarOcasional = () => (cargarOcasional.p ||= import("./ocasional.js?v=202611222207"));
const ocasional = (f) => cargarOcasional().then(f, () => { cargarOcasional.p = null; toast(t("pq.error"), { ms: 4000 }); });
const apiOc = () => ({ estado, indice, toast, vibrar, anilloCrono, elegir, leerPerfiles, leerDiario,
  guardarSppb: (s) => { estado.sppb = s; estado.pro.sppb = s.total; $("#pro-sppb").value = s.total; aplicarVivifrailAuto(); guardar(); render(); },
  copiaHecha: () => { ponerNum("medex.ultima_copia", Date.now()); pintarAvisoDatos(); } });
$("#btn-sppb").addEventListener("click", () => ocasional((O) => O.abrirSppb(apiOc())));
function pintarSppbEstado() {
  const e = $("#sppb-estado"); if (!e) return;
  e.textContent = estado.sppb ? t("sppb.estado", { n: estado.sppb.total, d: new Date(estado.sppb.fecha).toLocaleDateString(idioma()) }) : "";
  const s = $("#sft-estado"), u = estado.sft?.hist?.at(-1);
  if (s) s.textContent = u ? t("sft.estado", { d: new Date(u.f).toLocaleDateString(idioma()) }) : "";
}

/* ---------- escáner de código de barras (EAN-13 farmacéutico → código nacional) ---------- */
function barrasDisponible() { return "BarcodeDetector" in window && indice?.porCn?.size > 0; }
$("#btn-barras").addEventListener("click", () => ocasional((O) => O.abrirBarras(apiOc())));

/* ---------- zona de intensidad y carga por fármaco ---------- */
function tarjetaZona(res) {
  const z = zonaIntensidad(res, ctxActual(), { fcReposo: estado.fcReposo });
  const fila = (k, lab) => z.zonas ? `<li><span class="zona-lab">${lab}</span><b>${z.zonas[k][0]}–${z.zonas[k][1]} lpm</b><small>${z.rpe[k]}</small></li>` : `<li><span class="zona-lab">${lab}</span><b>${z.rpe[k]}</b></li>`;
  const techo = z.techo === "moderada" ? `<p class="zona-techo">${t("zona.techo")}</p>` : "";
  return `<section class="zona"><h3>${t("zona.titulo")}</h3>
    <p class="muted">${z.metodo === "fc" ? t("zona.fc", { m: z.fcmax, r: z.fcReposo ?? "~70" }) + (z.reposoEstimado ? " " + t("zona.reposo_estimado") : "") : t("zona.rpe", { m: z.motivos.join(", ") })}</p>
    <ul class="zonas">${fila("ligera", t("zona.ligera"))}${fila("moderada", t("zona.moderada"))}${z.techo === "vigorosa" ? fila("vigorosa", t("zona.vigorosa")) : ""}</ul>
    ${z.limiteDai ? `<p class="zona-techo">${t("zona.dai", { n: z.limiteDai })}</p>` : ""}${techo}
    <small>${z.habla}</small></section>`;
}
function seccionImpacto(res) {
  const lista = impactoPorFarmaco(res).filter((x) => x.puntos > 0);
  if (lista.length < 2) return null;
  const sec = seccion(t("impacto.titulo"), { abierta: estado.modo === "profesional", clave: "impacto", resumen: `${lista.length} ${t("perf.farmacos")}` });
  sec.querySelector(".cuerpo-sec").innerHTML = `<p class="muted">${t("impacto.intro")}</p><ul class="impacto">${lista.map((x) => `<li><span class="nom">${x.item.principio.nombre}</span><span class="barra-imp"><span style="width:${Math.round(x.pct * 100)}%"></span></span><small>${[x.alerta ? `${x.alerta} ${t("impacto.alerta")}` : "", x.precaucion ? `${x.precaucion} ${t("impacto.precaucion")}` : "", x.combinadas ? `${x.combinadas} ${t("impacto.comb")}` : "", x.interacciones ? `${x.interacciones} ${t("impacto.ddi")}` : ""].filter(Boolean).join(" · ")}</small><button type="button" class="btn-sec sm imp-sim" data-simula="${x.item.principio.id}" aria-label="${t("sim.sin")} ${x.item.principio.nombre}">${t("sim.sin")}</button></li>`).join("")}</ul><p class="esencial-nota">${t("impacto.nota")}</p>`;
  return sec;
}

/* ---------- UX beta 1: hoja «añadir», ayuda contextual, recorrido guiado, completitud, acciones del veredicto ---------- */
const hojaAnadir = $("#hoja-anadir");
function abrirHojaAnadir() { hojaAnadir.showModal(); }
$("#btn-anadir").addEventListener("click", abrirHojaAnadir);
$("#btn-primero").addEventListener("click", abrirHojaAnadir);
$("#hoja-anadir-cerrar").addEventListener("click", () => hojaAnadir.close());
$("#btn-buscar-nombre").addEventListener("click", () => { hojaAnadir.close(); desplazar($("#panel-medicacion")); setTimeout(() => $("#buscar").focus({ preventScroll: true }), 350); });
for (const id of ["btn-foto", "btn-caja", "btn-pdf", "btn-pegar", "btn-barras"]) $("#" + id).addEventListener("click", () => { hojaAnadir.close(); if (id === "btn-pegar") { $("#pegar-wrap").hidden = false; setTimeout(() => $("#pegar").focus(), 100); } });
$("#btn-dictar").addEventListener("click", () => { if ($("#btn-dictar").getAttribute("aria-pressed") === "true") { hojaAnadir.close(); toast(t("dictar.escuchando"), { accion: t("sppb.parar"), onAccion: () => $("#btn-dictar").click(), ms: 60000 }); } });
for (const d of [hojaAnadir, $("#ayuda")]) d.addEventListener("click", (ev) => { if (ev.target === d) d.close(); }); // tocar fuera cierra la hoja

// ayuda contextual: un «?» junto a cada apartado abre una hoja con qué es, por qué se pregunta y un ejemplo
function abrirAyuda(clave) {
  const d = $("#ayuda");
  $("#ayuda-titulo").textContent = t("ayuda." + clave + ".t");
  $("#ayuda-cuerpo").innerHTML = t("ayuda." + clave + ".x");
  d.showModal();
}
document.addEventListener("click", (ev) => { const b = ev.target.closest("[data-ayuda]"); if (b) { ev.preventDefault(); ev.stopPropagation(); abrirAyuda(b.dataset.ayuda); } }, true);
$("#ayuda-cerrar").addEventListener("click", () => $("#ayuda").close());
$("#btn-glosario").addEventListener("click", () => {
  const d = $("#ayuda");
  $("#ayuda-titulo").textContent = t("cab.glosario");
  $("#ayuda-cuerpo").innerHTML = `<dl class="glosario">${Object.entries(GLOSARIO).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
  d.showModal();
});

// recorrido guiado sobre los elementos reales (primera visita o desde «¿Cómo funciona?»)
const cargarTour = () => (cargarTour.p ||= import("./tour.js?v=202611222207")); // vive en js/tour.js y se carga al iniciarlo
function iniciarTour() { cargarTour().then((T) => T.iniciar({ MOV, conTransicion }), () => { cargarTour.p = null; }); }

// «Su plan está al N %»: qué falta por rellenar para afinar el plan, con un botón directo
function pintarCompletitud(res) {
  const q = estado.modo === "paciente" ? estado.pac : {};
  const items = [
    { id: "edad", ok: !!estado.edad, ir: () => { desplazar($("#panel-datos")); $("#edad").focus({ preventScroll: true }); } },
    { id: "situacion", ok: estado.condiciones.length > 0 || estado.caidas || !!estado.edad && estado.edad < 50, ir: () => { $("#bloque-situacion").open = true; desplazar($("#bloque-situacion")); } },
    { id: "cribado", ok: cribadoActual(res).clave !== "sin_datos", ir: () => { const d = $("#bloque-cribado"); d.open = true; desplazar(d); } },
    { id: "fcreposo", ok: estado.fcReposo != null || res.items.some((it) => it.senales.has("fc_no_valida") || it.senales.has("bradicardia")), ir: () => { desplazar($("#panel-datos")); $("#fc-reposo").focus({ preventScroll: true }); } },
    { id: "sppb", ok: ctxActual().sppb != null || Object.values(q).some(Boolean) || !!estado.pro.vivifrail || (estado.edad != null && estado.edad < 65), ir: () => $("#btn-sppb").click() },
    { id: "plan", ok: leerDiario().length > 0 || (estado.plan?.dias || []).length !== 6, ir: () => { estado.tab = "plan"; render(); desplazar($(".tabs")); } },
  ];
  const hechos = items.filter((x) => x.ok).length, pct = Math.round(100 * hechos / items.length);
  const falta = items.filter((x) => !x.ok);
  const box = $("#completitud");
  box.hidden = !falta.length;
  if (!falta.length) return;
  const sig = falta[0];
  box.innerHTML = `<div class="comp-cab"><b>${t("comp.titulo", { p: `<span class="comp-num">${pct}</span>` })}</b><span class="comp-barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${t("comp.titulo", { p: pct })}"><span style="width:${pct}%"></span></span></div>
    <p>${t("comp.sig")} <b>${t("comp." + sig.id)}</b> <small>· ${t("comp." + sig.id + ".por")}</small></p>
    <div class="acciones"><button type="button" class="btn sm" id="comp-ir">${t("comp.ir")}</button>${falta.length > 1 ? `<button type="button" class="btn-sec sm" id="comp-todo" aria-expanded="false">${t("comp.todo", { n: falta.length })}</button>` : ""}</div>
    <ul class="comp-lista" id="comp-lista" hidden>${falta.map((x) => `<li><button type="button" data-comp="${x.id}">${t("comp." + x.id)}</button></li>`).join("")}</ul>`;
  contarCifra(box.querySelector(".comp-num"), "completitud"); // mejora 392
  if (MOV.cifras.has("completitud-barra") && MOV.cifras.get("completitud-barra") !== pct && MOV.ok()) box.querySelector(".comp-barra")?.classList.add("rellena"); // mejora 391
  MOV.cifras.set("completitud-barra", pct);
  $("#comp-ir").addEventListener("click", sig.ir);
  $("#comp-todo")?.addEventListener("click", () => { const l = $("#comp-lista"); l.hidden = !l.hidden; $("#comp-todo").setAttribute("aria-expanded", String(!l.hidden)); });
  box.querySelectorAll("[data-comp]").forEach((b) => b.addEventListener("click", () => items.find((x) => x.id === b.dataset.comp).ir()));
}

// acciones del veredicto: ver mi plan · descargar · compartir
$("#btn-ver-mi-plan").addEventListener("click", () => { estado.tab = "plan"; render(); desplazar($(".tabs")); });
$("#btn-ir-descargas").addEventListener("click", () => desplazar($("#descargas")));
$("#btn-compartir").addEventListener("click", () => $("#btn-whatsapp").click());

// pestañas: flechas del teclado (patrón WAI-ARIA tabs)
$(".tabs").addEventListener("keydown", (ev) => {
  const tabs = $$(".tabs [role=tab]"); const i = tabs.indexOf(document.activeElement); if (i < 0) return;
  const j = ev.key === "ArrowRight" ? (i + 1) % tabs.length : ev.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : ev.key === "Home" ? 0 : ev.key === "End" ? tabs.length - 1 : -1;
  if (j < 0) return; ev.preventDefault(); tabs[j].focus(); tabs[j].click();
});


/* ---------- beta 2: feedback con contexto, copia cifrada y sincronización entre dispositivos ---------- */
// miga de pan: últimas acciones del usuario (solo nombres de controles, nunca valores escritos)
const pasosRecientes = [];
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("button, a, summary, [role=tab], [role=radio]"); if (!el) return;
  const nombre = el.id || el.dataset.tab || el.dataset.modo || el.dataset.ir || el.dataset.ayuda || el.dataset.a || el.dataset.i18n || el.querySelector("[data-i18n]")?.dataset.i18n || (el.closest("details")?.id ? "summary:" + el.closest("details").id : "") || el.className.split(" ")[0] || el.tagName.toLowerCase();
  const ultimo = pasosRecientes[pasosRecientes.length - 1];
  if (ultimo && ultimo.endsWith(nombre)) return;
  pasosRecientes.push(`${new Date().toISOString().slice(11, 19)} ${nombre}`); if (pasosRecientes.length > 12) pasosRecientes.shift();
}, true);
// La hoja de sugerencias (tipos, contexto técnico y texto del informe) vive en js/ocasional.js desde la v1.3.9: la trae abrirFeedback
let OC = null; // js/ocasional.js ya cargado: lo usan los botones de la hoja, que solo se ven con ella abierta
const apiFb = () => ({ estado, datos, errores: erroresRecientes, pasos: pasosRecientes, cribado: () => cribadoActual(evaluar(datos, medsActivos(), ctxActual())).clave });
function abrirFeedback(o) { ocasional((O) => { OC = O; O.abrirFeedback(apiFb(), o); }); }
$("#feedback-cerrar").addEventListener("click", () => $("#feedback").close());
$("#feedback").addEventListener("click", (ev) => { if (ev.target === $("#feedback")) $("#feedback").close(); });
$("#feedback-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const { tipo, nombre, texto, c } = OC.datosFeedback(apiFb());
  if (!tipo) { toast(t("fb.falta_tipo"), { ms: 3000 }); return; }
  window.open(urlSugerencia({ tipo: nombre, texto, pantalla: c.pantalla, errores: c.errores, pasos: c.pasos, navegador: c.navegador, lista: $("#fb-adjuntar").checked ? undefined : "" }), "_blank", "noopener");
  $("#feedback").close(); $("#pdf-aviso").textContent = t("sug.abierto");
});
$("#fb-copiar").addEventListener("click", async () => {
  const { tipo, texto, c } = OC.datosFeedback(apiFb());
  try { await navigator.clipboard.writeText(OC.textoInforme(tipo, texto, c)); toast(t("fb.copiado"), { ms: 3000 }); } catch { toast(t("fb.copiar_error"), { ms: 4000 }); }
});
$("#fb-correo").addEventListener("click", () => {
  const { tipo, nombre, texto, c } = OC.datosFeedback(apiFb());
  const cuerpo = OC.textoInforme(tipo, texto, c).slice(0, 1800);
  location.href = `mailto:pelayoplcoaching@gmail.com?subject=${encodeURIComponent("Pauta Activa · " + nombre)}&body=${encodeURIComponent(cuerpo)}`;
});

// --- copia cifrada (AES-GCM 256; clave derivada de la contraseña con PBKDF2-SHA-256, 250 000 iteraciones) ---
$("#btn-copia-crear").addEventListener("click", () => ocasional((O) => O.crearCopia(apiOc())));
$("#btn-copia-restaurar").addEventListener("click", () => $("#copia-input").click());
$("#copia-input").addEventListener("change", (ev) => {
  const f = ev.target.files?.[0]; ev.target.value = ""; if (!f) return;
  ocasional((O) => O.restaurarCopia(f, apiOc()));
});

// --- cuidar los datos guardados: almacenamiento persistente, aviso en iPhone y recordatorio de copia ---
const DIA_MS = 864e5;
function leerNum(k) { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } }
function ponerNum(k, v) { try { localStorage.setItem(k, String(v)); } catch {} }
const enPantallaInicio = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const esIOSTactil = () => esIOS || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // el iPad con iPadOS se presenta como Mac
const hayDatos = () => !soloLectura && (estado.meds.length > 0 || leerDiario().length > 0);
let persistenciaPedida = false;
/** Pide al navegador que no borre lo guardado aunque falte espacio. Chrome y Safari lo deciden solos, sin preguntar;
    Firefox abre una ventana de permiso, así que allí solo se pide con la app instalada. */
async function pedirPersistencia() {
  if (persistenciaPedida || !navigator.storage?.persist) return;
  persistenciaPedida = true;
  try {
    if (await navigator.storage.persisted()) return;
    if (/firefox/i.test(navigator.userAgent) && !enPantallaInicio()) return;
    await navigator.storage.persist();
  } catch {}
}
function datosGuardados() {
  if (soloLectura) return;
  if (!leerNum("medex.datos_desde")) ponerNum("medex.datos_desde", Date.now());
  pedirPersistencia();
}
/** Banda de aviso al abrir la app (una sola a la vez): primero la de iPhone/iPad sin instalar; después, la copia pendiente. */
function pintarAvisoDatos() {
  const b = $("#aviso-datos"); if (!b) return;
  if (!hayDatos()) { b.hidden = true; return; }
  datosGuardados();
  const ahora = Date.now();
  // Safari borra lo que guarda una web si pasa una semana sin abrirla; las apps de la pantalla de inicio quedan a salvo
  if (esIOSTactil() && !enPantallaInicio() && !location.hostname.endsWith("claude.ai") && !leerNum("medex.aviso_ios")) {
    b.innerHTML = `${t("datos.ios")} <span class="banner-acciones"><button type="button" class="btn-sec sm" id="btn-datos-copia">${t("datos.copia_ahora")}</button> <button type="button" class="btn-sec sm" id="btn-datos-ok">${t("datos.entendido")}</button></span>`;
    $("#btn-datos-ok").addEventListener("click", () => { ponerNum("medex.aviso_ios", Date.now()); pintarAvisoDatos(); });
  } else if (ahora - Math.max(leerNum("medex.ultima_copia"), leerNum("medex.datos_desde"), leerNum("medex.copia_aplazada")) > 30 * DIA_MS) {
    const ult = leerNum("medex.ultima_copia");
    b.innerHTML = `${ult ? t("datos.copia_hace", { d: Math.floor((ahora - ult) / DIA_MS) }) : t("datos.copia_nunca")} <span class="banner-acciones"><button type="button" class="btn-sec sm" id="btn-datos-copia">${t("datos.copia_ahora")}</button> <button type="button" class="btn-sec sm" id="btn-datos-ok">${t("datos.luego")}</button></span>`;
    $("#btn-datos-ok").addEventListener("click", () => { ponerNum("medex.copia_aplazada", Date.now()); pintarAvisoDatos(); });
  } else { b.hidden = true; return; }
  $("#btn-datos-copia").addEventListener("click", () => $("#btn-copia-crear").click());
  b.hidden = false;
}
document.addEventListener("idioma", () => { if (!$("#aviso-datos")?.hidden) pintarAvisoDatos(); });

// --- pasar a otro dispositivo: enlace #sync= con todo comprimido (deflate) y codificado; QR si cabe ---
$("#btn-sync").addEventListener("click", () => ocasional((O) => O.abrirSync(apiOc())));


/* ---------- beta 3: exportación FHIR R4 (Bundle de colección; el constructor va en fhir.js, bajo demanda) y versión en texto accesible ---------- */
const cargarFhir = () => (cargarFhir.p ||= import("./fhir.js?v=202611222207"));
$("#btn-fhir").addEventListener("click", () => {
  if (!estado.meds.length) return;
  const res = evaluar(datos, medsActivos(), ctxActual()), ctx = ctxActual();
  cargarFhir().then((F) => {
    const b = F.bundleFhir({ res, ctx, P: prescripcion(res, ctx), presc: estado.modo === "profesional" ? prescriptorActual() : null, estado, crib: cribadoActual(res), cribTxt: CRIBADO_TXT, cond: (c) => ETIQUETAS_CTX[c] || t("sit." + c) || c, ent: (pid) => indice.porId.get(pid), esencial: loEsencial(res, 5), version: APP_VERSION, kbVersion: datos.kb.version });
    descargarTexto(`pauta-activa-fhir-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b, null, 1), "application/fhir+json");
    toast(t("inf.fhir_ok"), { ms: 5000 });
  }).catch(() => { cargarFhir.p = null; toast(t("pq.error"), { ms: 4000 }); });
});
$("#btn-txt").addEventListener("click", () => {
  if (!estado.meds.length) return;
  const res = evaluar(datos, medsActivos(), ctxActual());
  const ctx = { ...ctxActual(), ventana: ventanaEntrenamiento(indice, medsActivos(), estado.horas), horas: estado.horas, diario: leerDiario(), cribado: cribadoActual(res), zona: zonaIntensidad(res, ctxActual(), { fcReposo: estado.fcReposo }), prescriptor: estado.modo === "profesional" ? prescriptorActual() : null, prescrito: estado.prescrito, appVersion: APP_VERSION, libres: medsLibres().map((m) => m.nombre) };
  const txt = [t("inf.txt_cab"), "", informeTexto(datos.kb, res, ctxActual()), "", "— — —", "", textoHistoria(datos.kb, res, ctx)].join("\n");
  descargarTexto(`pauta-activa-${new Date().toISOString().slice(0, 10)}.txt`, txt, "text/plain");
});


/* ---------- beta 3: consulta (varios pacientes por sesión) y plantillas de perfil (modo profesional) ---------- */
let pacienteActual = null; // id del perfil cargado en consulta
function pintarConsulta() {
  const sel = $("#consulta-paciente"); if (!sel) return;
  const lista = leerPerfiles();
  sel.innerHTML = `<option value="">${t("cons.nuevo")}</option>` + lista.map((pf) => `<option value="${pf.id}">${pf.nombre} · ${pf.estado.meds.length} ${t("perf.farmacos")} · ${new Date(pf.fecha).toLocaleDateString(idioma())}</option>`).join("");
  sel.value = pacienteActual && lista.some((p) => p.id === pacienteActual) ? pacienteActual : "";
  $("#consulta-estado").textContent = lista.length ? t("cons.estado", { n: lista.length }) : t("cons.vacio");
}
function cargarPaciente(id) {
  const pf = leerPerfiles().find((p) => p.id === id); if (!pf) return;
  const e = pf.estado; const previa = estado.ejemplo ? [] : structuredClone(estado.meds);
  Object.assign(estado, { meds: sanearMeds(e.meds), edad: numeroEntre(e.edad, 1, 120), caidas: !!e.caidas, condiciones: e.condiciones || [], pac: e.pac || {}, pro: e.pro || {}, horas: { ...HORA_MOMENTO, ...(e.horas || {}) }, plan: sanearPlan(e.plan), cribado: sanearCribado(e.cribado), prescrito: sanearPrescrito(e.prescrito), fcReposo: numeroEntre(e.fcReposo, 30, 150), sppb: sanearSppb(e.sppb), sft: sanearSft(e.sft), metas: sanearMetas(e.metas), habitos: sanearHabitos(e.habitos), historialPresc: Array.isArray(e.historialPresc) ? e.historialPresc.slice(0, 12) : [], ejemplo: false });
  pacienteActual = id; restaurarFormulario(); guardar(); render(); mostrarCambios(previa); pintarConsulta();
}
function guardarPaciente() {
  const lista = leerPerfiles();
  const act = lista.find((p) => p.id === pacienteActual);
  const huellaAhora = { kb: datos.kb.version, items: huellaInforme(evaluar(datos, medsActivos(), ctxActual())) };
  if (act) { act.estado = snapshot(); act.fecha = Date.now(); act.huella = huellaAhora; escribirPerfiles(lista); toast(t("cons.guardado", { n: act.nombre }), { ms: 3000 }); }
  else {
    if (!estado.meds.length) { toast(t("cons.sin_meds"), { ms: 3000 }); return false; }
    const nombre = window.prompt(t("cons.nombre_prompt"), `Paciente ${lista.length + 1}`); if (nombre == null) return false;
    const pf = { id: Date.now().toString(36), nombre: nombre.trim().slice(0, 30) || `Paciente ${lista.length + 1}`, fecha: Date.now(), estado: snapshot(), huella: huellaAhora };
    lista.unshift(pf); escribirPerfiles(lista.slice(0, 50)); pacienteActual = pf.id; toast(t("cons.guardado", { n: pf.nombre }), { ms: 3000 });
  }
  pintarConsulta(); renderPerfiles(); return true;
}
function nuevoPaciente() {
  pacienteActual = null;
  Object.assign(estado, { meds: [], edad: null, caidas: false, condiciones: [], pac: {}, pro: {}, plan: sanearPlan(null), cribado: sanearCribado(null), prescrito: null, fcReposo: null, sppb: null, sft: null, metas: null, habitos: sanearHabitos(null), historialPresc: [], ejemplo: false });
  restaurarFormulario(); guardar(); render(); pintarConsulta();
}
$("#consulta-paciente")?.addEventListener("change", (ev) => { if (ev.target.value) cargarPaciente(ev.target.value); else nuevoPaciente(); });
$("#btn-consulta-guardar")?.addEventListener("click", guardarPaciente);
$("#btn-consulta-siguiente")?.addEventListener("click", () => { if (estado.meds.length && !pacienteActual) { if (!guardarPaciente()) return; } else if (pacienteActual) guardarPaciente(); nuevoPaciente(); toast(t("cons.siguiente_ok"), { ms: 2500 }); setTimeout(() => $("#buscar").focus({ preventScroll: true }), 100); });

const PLANTILLAS = [
  { id: "ic", condiciones: ["insuficiencia_cardiaca"], dias: [1, 3, 5, 6], crib: { regular: false, enfermedad: true }, revision: 6 },
  { id: "dm_insulina", condiciones: ["diabetes"], dias: [1, 2, 3, 4, 5], crib: { regular: false, enfermedad: true }, revision: 8 },
  { id: "fragil", condiciones: [], dias: [1, 2, 3, 4, 5, 6], crib: { regular: false, enfermedad: false }, revision: 4, vivifrail: "B" },
  { id: "prefragil", condiciones: [], dias: [1, 3, 5], crib: { regular: false, enfermedad: false }, revision: 6, vivifrail: "C" },
  { id: "isquemica", condiciones: ["cardiopatia_isquemica", "hipertension"], dias: [1, 2, 3, 4, 5], crib: { regular: false, enfermedad: true }, revision: 6 },
  { id: "onco", condiciones: ["cancer"], dias: [1, 3, 5], crib: { regular: false, enfermedad: false }, revision: 4 },
  { id: "hta_activo", condiciones: ["hipertension"], dias: [1, 2, 3, 4, 5, 6], crib: { regular: true, enfermedad: false }, revision: 12 },
  { id: "epoc_o2", condiciones: ["epoc_asma", "oxigeno"], dias: [1, 2, 3, 4, 5], crib: { regular: false, enfermedad: false }, revision: 6 },
  { id: "osteoporosis", condiciones: ["osteoporosis"], dias: [1, 3, 5], crib: { regular: false, enfermedad: false }, revision: 8 },
  { id: "fa_acod", condiciones: ["fibrilacion_auricular"], dias: [1, 2, 3, 4, 5], crib: { regular: false, enfermedad: true }, revision: 8 },
];
function pintarPlantillas() { const sel = $("#plantilla"); if (!sel) return; const v = sel.value; sel.innerHTML = `<option value="">${t("plantilla.ninguna")}</option>` + PLANTILLAS.map((p) => `<option value="${p.id}">${t("plantilla." + p.id)}</option>`).join(""); sel.value = v; }
pintarPlantillas();
document.addEventListener("idioma", () => { pintarPlantillas(); pintarConsulta(); aplicarConsulta(); });
$("#btn-plantilla")?.addEventListener("click", () => {
  const p = PLANTILLAS.find((x) => x.id === $("#plantilla").value); if (!p) return;
  const cond = new Set(estado.condiciones); for (const c of p.condiciones) cond.add(c); estado.condiciones = [...cond];
  estado.plan = sanearPlan({ dias: p.dias });
  estado.cribado = sanearCribado({ ...(estado.cribado || {}), regular: p.crib.regular, enfermedad: p.crib.enfermedad, sintomas: estado.cribado?.sintomas || [] });
  if (p.vivifrail && !estado.pro.sppb && !estado.sppb) estado.pro.vivifrail = p.vivifrail;
  const presc = prescriptorActual(); presc.revision = p.revision; escribirPrescriptor(presc); $("#presc-revision").value = String(p.revision);
  restaurarFormulario(); guardar(); render();
  toast(t("plantilla.aplicada", { n: t("plantilla." + p.id) }), { ms: 5000 });
});


/* ---------- beta 3: recordatorio local los días de ejercicio (sin servidor: solo mientras la app está abierta o al abrirla) ---------- */
function leerAviso() { try { return { on: false, hora: "18:00", ...JSON.parse(localStorage.getItem("medex.aviso") || "{}") }; } catch { return { on: false, hora: "18:00" }; } }
function escribirAviso(a) { try { localStorage.setItem("medex.aviso", JSON.stringify(a)); } catch {} }
async function pedirPermisoAviso() { if (!("Notification" in window)) return false; if (Notification.permission === "granted") return true; if (Notification.permission === "denied") return false; return (await Notification.requestPermission()) === "granted"; }
async function mostrarAviso(titulo, cuerpo, tag) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) { await reg.showNotification(titulo, { body: cuerpo, tag, icon: "assets/icon-192.png", badge: "assets/icon-192.png", lang: idioma() }); return; }
    new Notification(titulo, { body: cuerpo, tag, icon: "assets/icon-192.png" });
  } catch {}
}
let avisoTimer = null;
function programarAviso() {
  clearTimeout(avisoTimer); avisoTimer = null;
  const a = leerAviso(); if (!a.on || !("Notification" in window) || Notification.permission !== "granted") return;
  const [h, m] = (a.hora || "18:00").split(":").map(Number);
  const ahora = new Date(); const obj = new Date(); obj.setHours(h, m, 0, 0);
  const hoy = hoyISO(ahora); const plan = planActual(); const tipo = plan[ahora.getDay()];
  const hecho = leerDiario().some((x) => x.fecha === hoy);
  const ultimo = (() => { try { return localStorage.getItem("medex.aviso_ultimo"); } catch { return null; } })();
  const lanzar = () => {
    if (tipo && tipo !== "descanso" && !hecho && ultimo !== hoy && estado.meds.length) {
      const s = sesionTipo(tipo, { fragil: ctxActual().fragilidad === "fragil", minutosAer: 30 });
      mostrarAviso(t("aviso.titulo"), t("aviso.cuerpo", { s: s?.titulo || t("plan." + tipo), m: s?.min || 30 }), "sesion-" + hoy);
      try { localStorage.setItem("medex.aviso_ultimo", hoy); } catch {}
    }
  };
  if (ahora >= obj) { if (ahora - obj < 6 * 3600e3) lanzar(); } // abrió la app después de la hora: avisar si aún es el mismo tramo del día
  else avisoTimer = setTimeout(lanzar, Math.min(obj - ahora, 2147000000));
  // reevaluación (modo profesional): una vez al vencer
  if (estado.modo === "profesional" && estado.prescrito) {
    const f = new Date(estado.prescrito.fecha); f.setDate(f.getDate() + estado.prescrito.semanas * 7);
    const clave = "reeval-" + f.toISOString().slice(0, 10);
    let ya = null; try { ya = localStorage.getItem("medex.aviso_reeval"); } catch {}
    if (ahora >= f && ya !== clave) { mostrarAviso(t("aviso.reeval_t"), t("aviso.reeval_x", { d: f.toLocaleDateString(idioma()) }), clave); try { localStorage.setItem("medex.aviso_reeval", clave); } catch {} }
  }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") programarAviso(); });
setTimeout(programarAviso, 3000);

cargar();

/* ---------- sin conexión / instalable ---------- */
if ("serviceWorker" in navigator && location.protocol === "https:" && !location.hostname.endsWith("claude.ai")) {
  navigator.serviceWorker.register("sw.js").then((reg) => {
    // aviso «hay una versión nueva» con el botón que activa el service worker en espera
    const ofrecer = (sw) => {
      if (!sw) return;
      const b = $("#aviso-actualizar"); b.hidden = false;
      const btn = b.querySelector("button"); btn.onclick = () => { btn.disabled = true; sw.postMessage("activar"); };
    };
    const vigilar = (sw) => { sw?.addEventListener("statechange", () => { if (sw.state === "installed" && navigator.serviceWorker.controller) ofrecer(sw); }); };
    if (reg.waiting && navigator.serviceWorker.controller) ofrecer(reg.waiting); // ya había una versión instalada esperando (p. ej., de una visita anterior)
    vigilar(reg.installing);
    reg.addEventListener("updatefound", () => vigilar(reg.installing));
    // comprobar actualizaciones al volver a la pestaña o a la app instalada y cada hora: los móviles rara vez cierran la pestaña
    const comprobar = () => { reg.update().catch(() => {}); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") comprobar(); });
    window.addEventListener("focus", comprobar);
    setInterval(comprobar, 60 * 60 * 1000);
    let recargando = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (recargando) return; recargando = true; location.reload(); });
  }).catch(() => {});
}
