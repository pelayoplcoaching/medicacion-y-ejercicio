/* Sesión guiada: chequeo previo, bloques con cronómetro, en grande, y entrenador por voz.
   Sale de app.js en la v1.3.0 (segunda tanda de mejoras grandes, 1): se carga al pulsar «Empezar sesión».
   app.js le pasa en «a» lo que necesita de la aplicación (estado evaluado, utilidades de pantalla y el registro
   de la sesión); el motor y los textos de la interfaz se importan aquí. Nada se guarda fuera del dispositivo. */
import { t } from "./i18n.js?v=202611222054";
import { sesionTipo, chequeoPrevio, veredictoChequeo, constantesRelevantes } from "./engine.js?v=202611222054";

const $ = (s) => document.querySelector(s);
const VOZ_MUDO = { on: false, disponible: () => false, preferida: () => false, guardar() {}, frase: () => null, contenido: () => null, decir() {}, callar() {}, preparar() {}, pitar() {}, cerrar() {} };
let VOZ = VOZ_MUDO;
let cronometro = null, cronoInicio = 0, cronoPausa = 0, preparada = false;
if (navigator.webdriver) window.__paSesion = { adelantar: (s) => { cronoInicio -= s * 1000; } }; // pruebas: adelantar el reloj de la sesión

export function cerrar() {
  clearInterval(cronometro); cronometro = null; cronoInicio = 0; VOZ.cerrar();
  const dlg = $("#sesion"); dlg.__wake?.release?.(); dlg.__wake = null; dlg.close();
}

/** Botón de cerrar, Esc y bloqueo de pantalla: una sola vez, la primera que se abre una sesión. */
function preparar() {
  if (preparada) return; preparada = true;
  $("#sesion-cerrar").addEventListener("click", cerrar);
  $("#sesion").addEventListener("cancel", (ev) => { ev.preventDefault(); cerrar(); });
  // La pantalla se apaga sola al volver de otra app (el navegador suelta el bloqueo): se vuelve a pedir mientras la sesión siga abierta
  document.addEventListener("visibilitychange", () => {
    const dlg = $("#sesion");
    if (document.visibilityState !== "visible" || !dlg.open || !navigator.wakeLock || (dlg.__wake && !dlg.__wake.released)) return;
    navigator.wakeLock.request("screen").then((w) => { dlg.__wake = w; }).catch(() => {});
  });
}

/** Abre la sesión de un tipo («aerobico», «fuerza», «equilibrio»). a.sesion, si viene, sustituye a la sesión tipo del motor. */
export function abrir(tipo, fecha, a) {
  preparar();
  const voz = () => a.cargarVoz().then((v) => { VOZ = v || VOZ_MUDO; }).catch(() => { VOZ = VOZ_MUDO; });
  voz(); // mientras se hace el chequeo previo
  if (fecha === a.hoyISO() && (a.nivelCalorHoy() ?? 0) >= 2) a.toast(t("calor.sesion"), { accion: t("calor.ver"), onAccion: a.abrirCalor, ms: 8000 }); // mejora grande 10
  const ses = a.sesion || sesionTipo(tipo, { fragil: a.fragil, minutosAer: a.fragil ? 10 : 30 });
  const dlg = $("#sesion");
  const chequeo = chequeoPrevio(a.res, a.ctx);
  const cs = constantesRelevantes(a.res, a.ctx);
  let chequeoClave = "sin";
  const cuerpo = $("#sesion-cuerpo");
  // Fase 1: chequeo previo (marque lo que se cumple hoy)
  cuerpo.innerHTML = `
    <h2>${ses.titulo} <small>· ${ses.min} min</small></h2>
    <section class="chequeo" id="chequeo">
      <img class="ses-img" src="assets/img/sesion-antes.webp" alt="" width="104" height="104" decoding="async">
      <h3>${t("chequeo.titulo")}</h3>
      <p class="muted">${t("chequeo.intro")}</p>
      <ul>${chequeo.map((c) => `<li class="nivel-${c.nivel === "rojo" ? "alerta" : "precaucion"}"><label><input type="checkbox" data-id="${c.id}"><span>${c.texto}${c.farmacos.length ? ` <small>(${t("chequeo.por", { f: c.farmacos.join(", ") })})</small>` : ""}</span></label></li>`).join("")}</ul>
      <div id="chequeo-resultado" class="chequeo-resultado" hidden></div>
      <div class="acciones"><button type="button" class="btn" id="chequeo-continuar">${t("chequeo.continuar")}</button><button type="button" class="btn-sec sm" id="chequeo-saltar">${t("chequeo.saltar")}</button></div>
    </section>`;
  const faseSesion = async (suave) => {
    await voz();
    const conVoz = VOZ.disponible();
    VOZ.on = conVoz && VOZ.preferida();
    const B = ses.bloques, N = B.length;
    cuerpo.innerHTML = `
      <h2>${ses.titulo} <small>· ${ses.min} min</small></h2>
      ${suave ? `<p class="chequeo-aviso">${t("chequeo.suave_banner")}</p>` : ""}
      <div class="crono">${a.anilloCrono(0)}<span id="crono">00:00</span><button type="button" class="btn sm" id="crono-btn">${t("sesion.iniciar")}</button>
        <p class="crono-ahora" id="crono-ahora" hidden><b class="ca-n"></b><span class="ca-nombre"></span><span class="ca-queda"></span><button type="button" class="btn-sec sm" id="ses-sig" aria-label="${t("voz.siguiente_aria")}">${a.icono("siguiente")} ${t("voz.siguiente")}</button></p></div>
      ${conVoz ? `<label class="check voz-check"><input type="checkbox" id="voz-on"${VOZ.on ? " checked" : ""}> <span>${a.icono("escuchar")} ${t("voz.toggle")}</span></label>` : ""}
      <p class="sr-only" id="ses-vivo" aria-live="polite"></p>
      <ol class="bloques grande con-picto" data-sesion='${JSON.stringify(ses.bloques.map((b) => ({ nombre: b.nombre, detalle: b.detalle, facil: b.facil, dificil: b.dificil }))).replace(/'/g, "&#39;")}'>${ses.bloques.map((b, i) => a.bloqueHtml(b, i, { grande: true })).join("")}</ol>
      <details class="alarma"><summary><span class="sub-label">${t("alarma.titulo")}</span><span class="flecha" aria-hidden="true">⌄</span></summary><ul>${a.ALARMA.map((x) => `<li>${x}</li>`).join("")}</ul></details>
      <div class="sesion-fin">
        <img class="ses-img" src="assets/img/sesion-fin.webp" alt="" width="104" height="104" loading="lazy" decoding="async">
        <label class="rpe-campo">${t("hoy.rpe")} <input type="range" id="sesion-rpe" min="1" max="10" value="5"><output>5</output>${a.escalaRpe()}</label>
        ${cs.length ? `<form id="sesion-const" class="registro">${a.camposConstantes()}</form>` : ""}
        <button type="button" class="btn" id="sesion-terminar">${t("sesion.terminar")}</button>
      </div>`;
    a.activarVariantes(cuerpo);
    // Bloques con tiempo: el ejercicio en curso se resalta, avanza solo al cumplirse sus minutos (o con «Siguiente», o al marcarlo) y el entrenador por voz lo cuenta
    const tl = { i: 0, ini: 0, prev: 0, fin: false, respira: false };
    const lis = () => cuerpo.querySelectorAll(".bloques.grande > li");
    const dur = (i) => B[i].min * 60;
    const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const detalleDe = (b) => { const v = a.leerVariantes()[b.nombre] || "normal"; return v === "facil" && b.facil ? b.facil : v === "dificil" && b.dificil ? b.dificil : b.detalle; };
    const vivo = (txt) => { const v = $("#ses-vivo"); if (v) v.textContent = txt; };
    /** Lleva un elemento al centro de lo que queda visible bajo el cronómetro fijo (solo se desplaza la sesión, no la página). */
    const suave2 = (el) => {
      if (!el) return;
      const c = cuerpo.getBoundingClientRect(), r = el.getBoundingClientRect(), fijo = cuerpo.querySelector(".crono")?.offsetHeight || 0;
      const libre = c.height - fijo, destino = c.top + fijo + Math.max(8, (libre - r.height) / 2);
      cuerpo.scrollBy({ top: r.top - destino, behavior: a.MOV.ok() ? "smooth" : "auto" });
    };
    const anunciar = (corta = true) => {
      const b = B[tl.i];
      const partes = [VOZ.frase("voz.bloque", { n: tl.i + 1, total: N }), VOZ.contenido(b.nombre), VOZ.frase("voz.minutos", { m: b.min }), VOZ.contenido(detalleDe(b))];
      if (b.clave && dur(tl.i) < 240) partes.push(VOZ.contenido(b.clave));
      if (tipo !== "aerobico" && tl.i > 0 && !tl.respira) { partes.push(VOZ.frase("voz.respira")); tl.respira = true; } // una vez por sesión: nada de aguantar el aire
      VOZ.decir(partes, { corta });
    };
    const marcar = (k) => { const c = lis()[k]?.querySelector("input[type=checkbox]"); if (c && !c.checked) c.checked = true; };
    const pintarAhora = (seg) => {
      const p = $("#crono-ahora"); if (!p) return;
      p.hidden = false;
      lis().forEach((li, k) => {
        const on = k === tl.i && !tl.fin; li.classList.toggle("en-curso", on);
        if (on) { li.setAttribute("aria-current", "step"); li.style.setProperty("--p", Math.min(1, Math.max(0, (seg - tl.ini) / dur(k))).toFixed(3)); }
        else { li.removeAttribute("aria-current"); li.style.removeProperty("--p"); }
      });
      p.classList.toggle("hecho", tl.fin);
      p.querySelector(".ca-n").textContent = tl.fin ? "✓" : `${tl.i + 1}/${N}`;
      p.querySelector(".ca-nombre").textContent = tl.fin ? t("voz.hecho") : B[tl.i].nombre;
      p.querySelector(".ca-queda").textContent = tl.fin ? "" : t("voz.queda", { t: mmss(Math.max(0, Math.ceil(tl.ini + dur(tl.i) - seg))) });
      $("#ses-sig").hidden = tl.fin;
    };
    const alCambiar = () => {
      VOZ.pitar(880, 260); a.vibrar([30, 60, 30]);
      anunciar(true);
      vivo(t("voz.vivo", { n: tl.i + 1, total: N, nombre: B[tl.i].nombre }));
      suave2(lis()[tl.i]);
    };
    const alTerminar = () => {
      VOZ.pitar(880, 200); setTimeout(() => VOZ.pitar(1175, 320), 240); a.vibrar([20, 60, 20, 60, 40]);
      VOZ.decir([VOZ.frase("voz.fin")], { corta: true });
      vivo(t("voz.hecho"));
      suave2(cuerpo.querySelector(".sesion-fin"));
    };
    /** Avisos dentro del ejercicio: cuenta atrás con pitidos, «queda un minuto», mitad (con la clave técnica) y, en los largos, cada 5 minutos. */
    const avisos = (seg) => {
      if (seg - tl.prev > 5) return; // al volver de segundo plano no se acumulan avisos atrasados
      const cruza = (x) => tl.prev < x && seg >= x;
      const b = B[tl.i], d = dur(tl.i), fin = tl.ini + d, sig = B[tl.i + 1];
      for (const s of [3, 2, 1]) if (cruza(fin - s)) VOZ.pitar(660, 110);
      if (d >= 180 && cruza(fin - 60)) VOZ.decir([VOZ.frase("voz.minuto"), ...(sig ? [VOZ.frase("voz.despues"), VOZ.contenido(sig.nombre)] : [])]);
      if (d >= 240 && d < 600 && cruza(tl.ini + d / 2)) VOZ.decir(b.clave ? [VOZ.frase("voz.recuerde"), VOZ.contenido(b.clave)] : [VOZ.frase("voz.mitad")]);
      if (d >= 600) for (let x = tl.ini + 300, k = 1; x < fin - 90; x += 300, k++) if (cruza(x)) VOZ.decir([VOZ.frase("voz.lleva", { m: k * 5 }), k % 3 === 1 ? VOZ.contenido(detalleDe(b)) : k % 3 === 2 && b.clave ? VOZ.contenido(b.clave) : VOZ.frase("voz.alarma")]);
    };
    const tick = () => {
      const seg = (Date.now() - cronoInicio) / 1000, s = Math.floor(seg);
      $("#crono").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      const c = cuerpo.querySelector(".anillo-crono .valor"); if (c) c.setAttribute("stroke-dasharray", `${(Math.min(1, seg / (ses.min * 60)) * 113.1).toFixed(1)} 113.1`);
      if (!tl.fin) {
        let cambio = false;
        while (!tl.fin && seg >= tl.ini + dur(tl.i)) { marcar(tl.i); if (tl.i >= N - 1) tl.fin = true; else { tl.ini += dur(tl.i); tl.i++; } cambio = true; }
        if (cambio) { if (tl.fin) alTerminar(); else alCambiar(); } else avisos(seg);
      }
      tl.prev = seg; pintarAhora(seg);
    };
    const siguiente = () => {
      if (!cronometro || tl.fin) return;
      const seg = (Date.now() - cronoInicio) / 1000;
      marcar(tl.i);
      if (tl.i >= N - 1) { tl.fin = true; alTerminar(); } else { tl.i++; tl.ini = seg; alCambiar(); }
      tl.prev = seg; pintarAhora(seg);
    };
    cuerpo.querySelectorAll(".bloques input[type=checkbox]").forEach((c) => c.addEventListener("change", () => { if (!c.checked) return; a.vibrar(15); if (cronometro && !tl.fin && Number(c.dataset.i) === tl.i) siguiente(); }));
    $("#ses-sig").addEventListener("click", siguiente);
    $("#voz-on")?.addEventListener("change", (ev) => {
      VOZ.on = ev.target.checked; VOZ.guardar(VOZ.on);
      if (!VOZ.on) { VOZ.callar(); return; }
      VOZ.preparar();
      if (cronometro && !tl.fin) anunciar(true); else if (!cronoInicio) VOZ.decir([VOZ.frase("voz.bloque", { n: 1, total: N }), VOZ.contenido(B[0].nombre)], { corta: true }); // se oye al momento: sirve para ajustar el volumen
    });
    $("#sesion-rpe").addEventListener("input", (ev) => { ev.target.nextElementSibling.textContent = ev.target.value; });
    $("#crono-btn").addEventListener("click", () => {
      if (cronometro) { clearInterval(cronometro); cronometro = null; $("#crono-btn").textContent = t("sesion.reanudar"); cronoPausa = Date.now(); VOZ.decir([VOZ.frase("voz.pausa")], { corta: true }); return; }
      const primera = !cronoInicio;
      cronoInicio = cronoInicio ? cronoInicio + (Date.now() - cronoPausa) : Date.now();
      cronometro = setInterval(tick, 500); $("#crono-btn").textContent = t("sesion.pausar"); a.vibrar(10);
      VOZ.preparar();
      if (primera) {
        VOZ.decir([VOZ.frase("voz.inicio", { n: N, m: ses.min }), suave ? VOZ.frase("voz.suave") : null, VOZ.frase("voz.alarma")], { corta: true });
        anunciar(false); vivo(t("voz.vivo", { n: 1, total: N, nombre: B[0].nombre }));
      } else VOZ.decir([VOZ.frase("voz.sigue"), tl.fin ? null : VOZ.contenido(B[tl.i].nombre)], { corta: true });
      tick();
    });
    $("#sesion-terminar").addEventListener("click", () => {
      const seg = cronoInicio ? Math.round((Date.now() - cronoInicio) / 1000) : 0;
      const min = seg >= 120 ? Math.round(seg / 60) : ses.min;
      const fc = $("#sesion-const"); const konst = fc ? a.leerConstantes(new FormData(fc)) : undefined;
      a.registrarSesion({ fecha, tipo, min, rpe: parseInt($("#sesion-rpe").value, 10) || 5, sintomas: [], const: konst, chequeo: chequeoClave });
      cerrar(); a.celebrar(); a.vibrar([20, 60, 20]);
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
    $("#chequeo-cerrar")?.addEventListener("click", cerrar);
    box.scrollIntoView({ block: "nearest" });
  };
  $("#chequeo-continuar").addEventListener("click", evaluarChequeo);
  $("#chequeo-saltar").addEventListener("click", () => { chequeoClave = "saltado"; faseSesion(false); });
  cronoInicio = 0; cronometro = null;
  dlg.showModal();
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then((w) => { dlg.__wake = w; }).catch(() => {}); } catch {}
}
