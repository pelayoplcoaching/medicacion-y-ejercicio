/* Entrenador por voz de la sesión guiada (mejora grande 6). Se carga al abrir la sesión, no al arrancar la aplicación.
   Usa la síntesis de voz del propio navegador (nada sale del dispositivo). Las frases de la interfaz van en el idioma
   elegido; el contenido de la sesión está en español y se lee con voz española. Sin voz para el idioma elegido, todo en español. */
import { t, tEs, idioma } from "./i18n.js?v=202611212327";

const VOZ_LANG = { es: "es-ES", en: "en-GB", ca: "ca-ES", gl: "gl-ES", eu: "eu-ES" };
export const VOZ = {
  on: false, ctx: null,
  disponible: () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function",
  preferida() { try { return localStorage.getItem("medex.voz") !== "0"; } catch { return true; } },
  guardar(on) { try { localStorage.setItem("medex.voz", on ? "1" : "0"); } catch {} },
  /** Voz del dispositivo para un idioma (la del país exacto primero y, entre iguales, la local). conocida = false mientras el navegador no ha cargado la lista. */
  voz(lang) {
    const vs = this.disponible() ? speechSynthesis.getVoices() : [];
    if (!vs.length) return { conocida: false, voz: null };
    const pre = lang.slice(0, 2);
    const c = vs.filter((v) => (v.lang || "").toLowerCase().replace("_", "-").startsWith(pre));
    c.sort((a, b) => ((b.lang === lang) - (a.lang === lang)) || (b.localService - a.localService));
    return { conocida: true, voz: c[0] || null };
  },
  frase(clave, vars) {
    const l = idioma(), lang = VOZ_LANG[l] || "es-ES";
    if (l !== "es") { const v = this.voz(lang); if (v.conocida && !v.voz) return { t: tEs(clave, vars), lang: "es-ES" }; }
    return { t: t(clave, vars), lang };
  },
  /** Contenido de la sesión preparado para oírlo: sin «RPE», rangos y unidades dichos con palabras. */
  contenido(s) {
    const txt = String(s || "").replace(/\s*\(RPE[^)]*\)/g, "").replace(/[()«»]/g, "")
      .replace(/(\d)\s*[–-]\s*(\d)/g, "$1 a $2").replace(/\s×\s/g, " por ")
      .replace(/(\d)\s?s\b/g, "$1 segundos").replace(/(\d)\s?kg\b/g, "$1 kilos").replace(/(\d)\s?L\b/g, "$1 litros").replace(/(\d)\s?°/g, "$1 grados").replace(/(\d)\s?min\b/g, "$1 minutos");
    return { t: txt, lang: "es-ES" };
  },
  /** Dice una lista de frases ({t, lang}); corta = interrumpe lo que estuviera diciendo. Frases cortas: Chrome corta las locuciones largas. */
  decir(partes, { corta = false } = {}) {
    if (!this.on) return;
    partes = partes.filter((p) => p && p.t);
    if (!partes.length) return;
    if (navigator.webdriver) { (window.__paVoz ||= []).push(partes.map((p) => p.t).join(" ")); return; } // pruebas automáticas: se anota, no suena
    if (!this.disponible()) return;
    if (corta) speechSynthesis.cancel();
    for (const p of partes) for (const trozo of p.t.match(/[^.;:!?¡¿]+[.;:!?]*/g) || [p.t]) {
      const x = trozo.trim(); if (!x) continue;
      const u = new SpeechSynthesisUtterance(x);
      u.lang = p.lang; const v = this.voz(p.lang).voz; if (v) u.voice = v; u.rate = 0.92;
      speechSynthesis.speak(u);
    }
  },
  callar() { if (this.disponible()) speechSynthesis.cancel(); },
  /** El sonido se prepara dentro del toque en «Iniciar»: los navegadores solo dejan sonar tras un gesto. */
  preparar() {
    if (navigator.webdriver || !this.on) return;
    try { this.ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === "suspended") this.ctx.resume(); } catch {}
  },
  pitar(f = 660, ms = 110) {
    if (!this.on || !this.ctx) return;
    try {
      const c = this.ctx, t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + ms / 1000 + 0.03);
    } catch {}
  },
  cerrar() { this.callar(); try { this.ctx?.close(); } catch {} this.ctx = null; },
};
