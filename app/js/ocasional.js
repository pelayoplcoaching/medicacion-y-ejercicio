/* Herramientas de uso ocasional que salen de app.js en la v1.3.0 (segunda tanda de mejoras grandes, 1):
   SPPB guiado, escáner de códigos de barras, copia cifrada y paso a otro dispositivo. Se cargan al pulsar su botón;
   app.js les pasa en «a» lo que necesitan de la aplicación. Nada sale del dispositivo. */
import { t, idioma } from "./i18n.js?v=202611221908";
import { puntuarSPPB, vivifrailDeSppb } from "./engine.js?v=202611221908";
import { picto } from "./pictos.js?v=202611221908";
import { cargarScript } from "./libs.js?v=202611221908";
import { APP_VERSION } from "./version.js?v=202611221908";

const $ = (s) => document.querySelector(s);
const hechos = new Set();
/** Engancha algo una sola vez (los botones de cerrar de cada ventana). */
const unaVez = (clave, f) => { if (!hechos.has(clave)) { hechos.add(clave); f(); } };

/* ---------- SPPB guiado (Guralnik 1994): equilibrio, marcha 4 m y 5 levantadas de la silla ---------- */
const SPPB_PASOS = [
  { id: "lado", max: 10, pict: "unpie", img: true },
  { id: "semitandem", max: 10, pict: "unpie", img: true },
  { id: "tandem", max: 10, pict: "talonpunta", img: true },
  { id: "marcha", pict: "marcha", img: true },
  { id: "silla", pict: "silla", img: true },
];
let sppbCrono = null, sppbInicio = 0;
export function abrirSppb(a) {
  unaVez("sppb", () => $("#sppb-cerrar").addEventListener("click", () => { clearInterval(sppbCrono); sppbCrono = null; $("#sppb").close(); }));
  const dlg = $("#sppb"), cuerpo = $("#sppb-cuerpo");
  const r = {};
  let i = 0;
  const pintar = () => {
    if (i >= SPPB_PASOS.length) return resultado();
    const paso = SPPB_PASOS[i];
    cuerpo.innerHTML = `
      <p class="muted sppb-progreso">${t("sppb.paso", { n: i + 1, t: SPPB_PASOS.length })}</p>
      <h2>${paso.img ? "" : picto(paso.pict)} ${t("sppb.t." + paso.id)}</h2>
      ${paso.img ? `<figure class="sppb-img"><img src="assets/img/sppb-${paso.id}.webp" alt="" width="320" height="320" decoding="async"></figure>` : ""}
      <p>${t("sppb.x." + paso.id)}</p>
      <p class="muted">${t("sppb.seguridad")}</p>
      <div class="crono crono-sppb">${a.anilloCrono(0)}<span id="sppb-crono">0,0 s</span><button type="button" class="btn sm" id="sppb-ini">${t("sesion.iniciar")}</button><label class="crono-seg">${t("sppb.segundos")} <input type="number" id="sppb-seg" step="0.1" min="0" max="120" inputmode="decimal"></label></div>
      <div class="acciones"><button type="button" class="btn" id="sppb-sig">${t("sppb.siguiente")}</button><button type="button" class="btn-sec sm" id="sppb-nopuede">${t("sppb.nopuede")}</button>${i ? `<button type="button" class="btn-sec sm" id="sppb-atras">${t("sppb.atras")}</button>` : ""}</div>`;
    const seg = $("#sppb-seg"); const tick = () => { const sgs = (Date.now() - sppbInicio) / 1000; $("#sppb-crono").textContent = sgs.toFixed(1).replace(".", ",") + " s"; if (paso.max && sgs >= paso.max) { parar(); seg.value = paso.max; a.vibrar(30); } };
    const parar = () => { clearInterval(sppbCrono); sppbCrono = null; $("#sppb-ini").textContent = t("sesion.iniciar"); seg.value = ((Date.now() - sppbInicio) / 1000).toFixed(1); };
    $("#sppb-ini").addEventListener("click", () => { if (sppbCrono) { parar(); return; } sppbInicio = Date.now(); sppbCrono = setInterval(tick, 100); $("#sppb-ini").textContent = t("sppb.parar"); a.vibrar(10); });
    $("#sppb-sig").addEventListener("click", () => { if (sppbCrono) parar(); const v = parseFloat(String(seg.value).replace(",", ".")); if (!Number.isFinite(v)) { seg.focus(); return; } r[paso.id] = v; if (paso.id === "lado" && v < 10) { r.semitandem = null; r.tandem = null; i += 3; } else if (paso.id === "semitandem" && v < 10) { r.tandem = null; i += 2; } else i++; pintar(); });
    $("#sppb-nopuede").addEventListener("click", () => { if (sppbCrono) parar(); r[paso.id] = paso.max ? 0 : null; if (paso.id === "lado") { r.semitandem = null; r.tandem = null; i += 3; } else if (paso.id === "semitandem") { r.tandem = null; i += 2; } else i++; pintar(); });
    $("#sppb-atras")?.addEventListener("click", () => { if (sppbCrono) parar(); i = Math.max(0, i - 1); pintar(); });
  };
  const resultado = () => {
    const p = puntuarSPPB(r);
    cuerpo.innerHTML = `
      <h2>${t("sppb.resultado")}: <b>${p.total}</b> / 12</h2>
      <p class="crib-resultado nivel-${p.categoria === "fragil" ? "alerta" : p.categoria === "prefragil" ? "precaucion" : "info"}">${t("sppb.cat." + p.categoria)} · ${t("sppb.vivifrail", { v: ({ A: t("pro.vA"), B: t("pro.vB"), C: t("pro.vC"), D: t("pro.vD") })[vivifrailDeSppb(p.total)] })}</p>
      <ul class="bloques"><li><span class="min">${p.equilibrio}/4</span><span>${t("sppb.equilibrio")}</span></li><li><span class="min">${p.marcha}/4</span><span>${t("sppb.marcha")}${p.velocidad ? ` · ${p.velocidad.toLocaleString(idioma())} m/s` : ""}</span></li><li><span class="min">${p.silla}/4</span><span>${t("sppb.silla")}</span></li></ul>
      <p class="muted">${t("sppb.nota")}</p>
      <div class="acciones"><button type="button" class="btn" id="sppb-guardar">${t("sppb.guardar")}</button><button type="button" class="btn-sec sm" id="sppb-repetir">${t("sppb.repetir")}</button></div>`;
    $("#sppb-guardar").addEventListener("click", () => { a.guardarSppb({ total: p.total, fecha: Date.now(), partes: r, velocidad: p.velocidad }); dlg.close(); a.toast(t("sppb.guardado", { n: p.total }) + " · " + t("sppb.vivifrail", { v: vivifrailDeSppb(p.total) }), { ms: 6000 }); a.vibrar([20, 60, 20]); });
    $("#sppb-repetir").addEventListener("click", () => { i = 0; for (const k of Object.keys(r)) delete r[k]; pintar(); });
  };
  pintar(); dlg.showModal();
}

/* ---------- escáner de código de barras (EAN-13 farmacéutico → código nacional) ---------- */
let barrasStream = null, barrasTimer = null;
export function cerrarBarras() { clearInterval(barrasTimer); barrasTimer = null; barrasStream?.getTracks().forEach((tr) => tr.stop()); barrasStream = null; const d = $("#barras"); if (d.open) d.close(); }
const prepararBarras = () => unaVez("barras", () => {
  $("#barras-cerrar").addEventListener("click", cerrarBarras);
  $("#barras").addEventListener("cancel", (ev) => { ev.preventDefault(); cerrarBarras(); });
});
export async function abrirBarras(a) {
  prepararBarras();
  const dlg = $("#barras"), video = $("#barras-video"), estadoEl = $("#barras-estado");
  try {
    barrasStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = barrasStream; dlg.showModal(); estadoEl.textContent = t("barras.buscando");
    const det = new window.BarcodeDetector({ formats: ["ean_13"] });
    barrasTimer = setInterval(async () => {
      try {
        const codes = await det.detect(video);
        for (const c of codes) {
          const ean = c.rawValue || "";
          if (!/^847\d{10}$/.test(ean)) continue;
          const cn = ean.slice(6, 12);
          const e = a.indice.porCn.get(cn);
          if (e) { cerrarBarras(); a.elegir(e); a.toast(t("barras.ok", { n: e.texto }), { ms: 5000 }); a.vibrar(20); return; }
          estadoEl.textContent = t("barras.desconocido", { cn });
        }
      } catch {}
    }, 400);
  } catch (e) { a.toast(t("barras.error"), { ms: 5000 }); cerrarBarras(); }
}

/* ---------- copia cifrada (AES-GCM 256; clave derivada de la contraseña con PBKDF2-SHA-256, 250 000 iteraciones) ---------- */
const CLAVES_LOCALES = ["medex.estado", "medex.perfiles", "medex.diario", "medex.prescriptor", "medex.variantes", "medex.letra", "medex.tema", "medex.idioma", "medex.recientes", "medex.aviso"];
export function empaquetarTodo() { const o = {}; for (const k of CLAVES_LOCALES) { try { const v = localStorage.getItem(k); if (v != null) o[k] = v; } catch {} } return { app: "pauta-activa", v: 1, fecha: new Date().toISOString(), version_app: APP_VERSION, datos: o }; }
export function aplicarTodo(paq, { fusionar = false } = {}) {
  if (!paq || paq.app !== "pauta-activa" || !paq.datos || typeof paq.datos !== "object") throw new Error("formato");
  for (const k of CLAVES_LOCALES) {
    const v = paq.datos[k]; if (v == null) continue;
    if (fusionar && (k === "medex.perfiles" || k === "medex.diario")) {
      try { const act = JSON.parse(localStorage.getItem(k) || "[]"), nue = JSON.parse(v); const clave = (x) => JSON.stringify(k === "medex.diario" ? [x.fecha, x.tipo, x.min] : x.nombre); const vistos = new Set(act.map(clave)); localStorage.setItem(k, JSON.stringify([...act, ...nue.filter((x) => !vistos.has(clave(x)))])); continue; } catch {}
    }
    try { localStorage.setItem(k, v); } catch {}
  }
}
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function claveDe(pass, salt, it = 250000) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function cifrarCopia(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await claveDe(pass, salt);
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(empaquetarTodo())));
  return JSON.stringify({ app: "pauta-activa", formato: "copia-cifrada", v: 1, fecha: new Date().toISOString(), kdf: { alg: "PBKDF2-SHA256", it: 250000 }, cifrado: "AES-GCM-256", salt: b64(salt), iv: b64(iv), data: b64(data) });
}
export async function descifrarCopia(texto, pass) {
  const f = JSON.parse(texto);
  if (f.formato !== "copia-cifrada" || !f.data) throw new Error("formato");
  const key = await claveDe(pass, unb64(f.salt), f.kdf?.it || 250000);
  const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(f.iv) }, key, unb64(f.data));
  return JSON.parse(new TextDecoder().decode(plano));
}
function pedirPassword({ confirmar, texto }) {
  return new Promise((ok) => {
    const dlg = $("#copia"), form = $("#copia-form"), p1 = $("#copia-pass"), p2 = $("#copia-pass2"), err = $("#copia-error");
    $("#copia-texto").textContent = texto; $("#copia-pass2-wrap").hidden = !confirmar; p2.required = !!confirmar; p1.value = p2.value = ""; err.textContent = "";
    const fin = (v) => { form.onsubmit = null; $("#copia-cerrar").onclick = null; dlg.close(); ok(v); };
    form.onsubmit = (ev) => { ev.preventDefault(); if (p1.value.length < 8) { err.textContent = t("copia.corta"); return; } if (confirmar && p1.value !== p2.value) { err.textContent = t("copia.distintas"); return; } fin(p1.value); };
    $("#copia-cerrar").onclick = () => fin(null);
    dlg.showModal(); setTimeout(() => p1.focus(), 50);
  });
}
export async function crearCopia(a) {
  if (!window.crypto?.subtle) { a.toast(t("copia.nocrypto"), { ms: 5000 }); return; }
  const pass = await pedirPassword({ confirmar: true, texto: t("copia.crear_txt") }); if (!pass) return;
  try {
    const blob = new Blob([await cifrarCopia(pass)], { type: "application/json" });
    const el = document.createElement("a"); el.href = URL.createObjectURL(blob); el.download = `pauta-activa-copia-${new Date().toISOString().slice(0, 10)}.pauta`; document.body.append(el); el.click(); el.remove(); setTimeout(() => URL.revokeObjectURL(el.href), 2000);
    a.toast(t("copia.creada"), { ms: 5000 });
    a.copiaHecha();
  } catch (e) { a.toast(t("copia.error"), { ms: 5000 }); }
}
export async function restaurarCopia(f, a) {
  const texto = await f.text();
  const pass = await pedirPassword({ confirmar: false, texto: t("copia.restaurar_txt", { n: f.name }) }); if (!pass) return;
  let paq; try { paq = await descifrarCopia(texto, pass); } catch { a.toast(t("copia.pass_mal"), { ms: 6000 }); return; }
  const fusionar = !!a.estado.meds.length && window.confirm(t("copia.fusionar"));
  if (!fusionar && a.estado.meds.length && !window.confirm(t("copia.sustituir"))) return;
  try { aplicarTodo(paq, { fusionar }); } catch { a.toast(t("copia.error"), { ms: 5000 }); return; }
  a.toast(t("copia.restaurada"), { ms: 3000 }); setTimeout(() => location.reload(), 600);
}

/* ---------- pasar a otro dispositivo: enlace #sync= con todo comprimido (deflate) y codificado; QR si cabe ---------- */
const b64url = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4));
async function comprimir(txt) { const bytes = new TextEncoder().encode(txt); if (!("CompressionStream" in window)) return "r." + b64url(bytes); const out = await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer(); return "z." + b64url(out); }
async function descomprimir(s) { const [modo, cuerpo] = [s.slice(0, 2), s.slice(2)]; const bytes = unb64url(cuerpo); if (modo === "r.") return new TextDecoder().decode(bytes); if (!("DecompressionStream" in window)) throw new Error("sin DecompressionStream"); const out = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer(); return new TextDecoder().decode(out); }
async function enlaceSync() {
  const paq = empaquetarTodo();
  try { const d = JSON.parse(paq.datos["medex.diario"] || "[]"); if (d.length > 120) paq.datos["medex.diario"] = JSON.stringify(d.slice(-120)); } catch {}
  return `${location.origin}${location.pathname}#sync=${await comprimir(JSON.stringify(paq))}`;
}
export async function abrirSync(a) {
  unaVez("sync", () => {
    $("#sync-cerrar").addEventListener("click", () => $("#sync").close());
    $("#sync-copiar").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#sync").dataset.url); a.toast(t("sync.copiado"), { ms: 4000 }); } catch { a.toast(t("fb.copiar_error"), { ms: 4000 }); } });
    $("#sync-escanear").addEventListener("click", () => escanearSync(a));
  });
  const dlg = $("#sync"), cuerpo = $("#sync-cuerpo"), nota = $("#sync-nota");
  cuerpo.innerHTML = ""; nota.textContent = "";
  const url = await enlaceSync();
  dlg.dataset.url = url;
  if (url.length <= 2300) {
    try {
      if (!window.qrcode) await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js");
      const q = window.qrcode(0, "L"); q.addData(url); q.make(); cuerpo.innerHTML = q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
    } catch { nota.textContent = t("sync.sin_qr"); }
  } else nota.textContent = t("sync.largo");
  $("#sync-escanear").hidden = !("BarcodeDetector" in window);
  dlg.showModal();
}
/** En escritorio (Chromium): leer con la cámara el QR que muestra el móvil. */
async function escanearSync(a) {
  prepararBarras();
  const dlg = $("#barras"), video = $("#barras-video"), estadoEl = $("#barras-estado");
  try {
    barrasStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = barrasStream; $("#sync").close(); dlg.showModal(); estadoEl.textContent = t("sync.buscando");
    const det = new window.BarcodeDetector({ formats: ["qr_code"] });
    barrasTimer = setInterval(async () => { try { for (const c of await det.detect(video)) { const m = String(c.rawValue || "").match(/#sync=([A-Za-z0-9_.-]+)/); if (m) { cerrarBarras(); await recibirSync(m[1], a); return; } } } catch {} }, 400);
  } catch { a.toast(t("barras.error"), { ms: 5000 }); cerrarBarras(); }
}
export async function recibirSync(cod, a) {
  let paq; try { paq = JSON.parse(await descomprimir(cod)); } catch { a.toast(t("sync.error"), { ms: 6000 }); return false; }
  if (paq.app !== "pauta-activa") { a.toast(t("sync.error"), { ms: 6000 }); return false; }
  const hay = a.estado.meds.length || a.leerPerfiles().length || a.leerDiario().length;
  if (hay && !window.confirm(t("sync.confirmar"))) return false;
  try { aplicarTodo(paq); } catch { a.toast(t("sync.error"), { ms: 6000 }); return false; }
  history.replaceState(null, "", location.pathname); a.toast(t("sync.hecho"), { ms: 3000 }); setTimeout(() => location.reload(), 500); return true;
}
