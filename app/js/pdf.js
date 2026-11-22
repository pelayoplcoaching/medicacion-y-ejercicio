/* Resúmenes en PDF (jsPDF, global window.jspdf).
   Dos documentos: "Informe clínico" para el médico y "Su plan" para el paciente.
   Sistema de maquetación propio: cabecera, bandas, tablas con zebra, tarjetas con acento, pastillas de nivel.
   Se carga bajo demanda (import dinámico) la primera vez que se pide un PDF. */
import { jspdf, cargarScript } from "./libs.js?v=202611222014";
import { ORDEN_NIVEL, ORDEN_DDI, MOMENTO_TXT, loEsencial, ALARMA, PLAN_SEMANA, sesionTipo, planSemana, SINTOMAS } from "./engine.js?v=202611222014";
import { AMBITOS, CRIBADO_PDF, WEB, cuenta, dosisTxt, filasPlanPaciente, listasVistazo, prescripcion, ritmoTexto, sppbTxt, tiene, zonaTxt } from "./informes.js?v=202611222014";

const AUTOR = "Dr. Pelayo Fdez. Cidón · Medicina Interna · prescriptor de ejercicio físico";
const MARCA = "Fuerza Basada en Evidencia";
const NOMBRE = "Pauta Activa";
const C = {
  ink: [21, 20, 35], muted: [85, 84, 106], line: [221, 220, 230], soft: [246, 246, 249], white: [255, 255, 255],
  purple: [89, 62, 222], purpleDeep: [20, 11, 58], purpleSoft: [238, 236, 255],
  alerta: [192, 39, 29], alertaSoft: [253, 236, 235], alertaInk: [143, 26, 18],
  precaucion: [179, 100, 0], precaucionSoft: [255, 241, 221], precaucionInk: [122, 67, 0],
  info: [29, 122, 77], infoSoft: [227, 244, 234], infoInk: [20, 86, 55],
  mayor: [192, 39, 29], mayorSoft: [253, 236, 235], mayorInk: [143, 26, 18],
  moderada: [179, 100, 0], moderadaSoft: [255, 241, 221], moderadaInk: [122, 67, 0],
  menor: [104, 96, 127], menorSoft: [245, 243, 250], menorInk: [104, 96, 127],
};
const NIVEL_TXT = { alerta: "Atención", precaucion: "Precaución", info: "Para saber", mayor: "Mayor", moderada: "Moderada", menor: "Menor" };
export const MAX_CARAS = 4; // ningún documento pasa de 4 caras: si se pasa, se vuelve a maquetar con menos detalle

/* ---------- iconos de las infografías (trazo, rejilla de 24): se dibujan en un lienzo y entran como PNG nítido ---------- */
export const ICONOS = {
  caminar: "M14.5 4.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0M12.5 7 11 13M12.2 8.6l3.3 2M12.2 8.6 9 10.5M11 13l3 3.5V21M11 13l-2 4-2 3.5",
  pesa: "M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11",
  equilibrio: "M13.5 4.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0M12 7v6M7 9.5h10M12 13v8M12 13l3.5 2-1 2.5",
  descanso: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h18v5H3zM5 16v2M19 16v2",
  habla: "M4 5h16v10H9l-4 4v-4H4z",
  pulso: "M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6zM7.5 12.5h2.2l1.2-2.4 2 4.4 1.2-2h2.4",
  gota: "M12 3s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11zM12 10.5v5M9.8 13.6 12 15.8l2.2-2.2",
  tirita: "M4.6 14.6 14.6 4.6a3.4 3.4 0 0 1 4.8 4.8L9.4 19.4a3.4 3.4 0 0 1-4.8-4.8zM10 10l4 4",
  mareo: "M4 16a8 8 0 1 1 16 0M12 16l-3.5-4M12 16h.01",
  vaso: "M6 4h12l-1.5 15a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 4zM6.6 9.5c2-.8 3.6.8 5.4 0s3.4-.8 5.4 0",
  termo: "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0zM12 9v7",
  luna: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  tendon: "M9 3v7c0 2 1 3 3 4s3 2 3 4v3M7 21h10",
  ecg: "M3 12h4l2-5 4 10 2-5h6",
  sol: "M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  bateria: "M3 8h15v8H3zM21 11v2M6 11v2",
  alerta: "M12 3 2 20h20L12 3zM12 10v4M12 17h.01",
};
const icoCache = {};
/** PNG (data URL) de un icono en un color; se guarda para no repetir el dibujo ni el peso en el PDF. */
function icoPng(nombre, rgb) {
  const k = nombre + ":" + rgb.join(",");
  if (k in icoCache) return icoCache[k];
  let url = null;
  try {
    const px = 96, c = document.createElement("canvas"); c.width = c.height = px;
    const g = c.getContext("2d"); g.scale(px / 24, px / 24);
    g.strokeStyle = `rgb(${rgb.join(",")})`; g.lineWidth = 2; g.lineCap = "round"; g.lineJoin = "round";
    g.stroke(new Path2D(ICONOS[nombre]));
    url = c.toDataURL("image/png");
  } catch {}
  return (icoCache[k] = url);
}

/* ---------- mecanismos: lo que cada grupo de efectos cambia al moverse (los mismos que los «¿Por qué?» de la app) ---------- */
export const PQ_SENAL = { fc_no_valida: "pulso", bradicardia: "pulso", hipoglucemia: "azucar", enmascara_hipoglucemia: "azucar", sangrado: "sangrado", hipotension: "tension", deshidratacion: "agua", hipopotasemia: "agua", hiponatremia: "agua", renal: "agua", litio: "agua", calor: "calor", anticolinergico: "calor", sedacion: "equilibrio", caidas: "equilibrio", miopatia: "musculo", tendon: "tendon", qt: "ritmo", taquicardia: "acelera", perdida_muscular: "fuerza_hueso", hueso: "fuerza_hueso", fotosensibilidad: "sol", hipertension: "tension_alta", fatiga: "cansancio" };
export const PQ_ORDEN = ["pulso", "azucar", "sangrado", "tension", "agua", "calor", "equilibrio", "musculo", "tendon", "ritmo", "acelera", "fuerza_hueso", "sol", "tension_alta", "cansancio"];
export const MEC = {
  pulso: { ico: "pulso", t: "El pulso sube menos", h: "Guíese por el esfuerzo: debe poder hablar, pero no cantar." },
  azucar: { ico: "gota", t: "El azúcar puede bajar", h: "Mida la glucosa antes y lleve azúcar de acción rápida." },
  sangrado: { ico: "tirita", t: "Los golpes sangran más", h: "Evite golpes y caídas. Golpe en la cabeza: urgencias." },
  tension: { ico: "mareo", t: "Mareo al levantarse", h: "Levántese despacio y termine con 5–10 minutos suaves." },
  agua: { ico: "vaso", t: "El agua y las sales", h: "Beba antes, durante y después (salvo que le limiten el líquido)." },
  calor: { ico: "termo", t: "Tolera peor el calor", h: "Evite las horas de calor y baje la intensidad esos días." },
  equilibrio: { ico: "luna", t: "Más riesgo de caídas", h: "Equilibrio con un apoyo cerca; no entrene con sueño." },
  musculo: { ico: "pesa", t: "Dolor muscular que no encaja", h: "Cargas ligeras al principio; orina oscura: consulte." },
  tendon: { ico: "tendon", t: "Tendones más frágiles", h: "Sin saltos, carreras intensas ni cargas máximas." },
  ritmo: { ico: "ecg", t: "El ritmo del corazón", h: "Sin estimulantes; palpitaciones o desmayo: consulte." },
  acelera: { ico: "ecg", t: "El corazón se acelera", h: "Guíese por el esfuerzo y evite los estimulantes." },
  fuerza_hueso: { ico: "pesa", t: "Músculo y hueso", h: "La fuerza, 2–3 días por semana, es su mejor aliada." },
  sol: { ico: "sol", t: "La piel se quema antes", h: "Protector 50 y evite las horas centrales del día." },
  tension_alta: { ico: "mareo", t: "La tensión puede subir", h: "Respire siempre al hacer fuerza; sin cargas máximas." },
  cansancio: { ico: "bateria", t: "Se cansa antes", h: "Sesiones cortas y frecuentes; progrese despacio." },
};
/** Fichas de mecanismo presentes en la lista, por orden de importancia, con los fármacos que las causan. */
export function mecanismosDe(res, { max = 6, nombres = true } = {}) {
  const out = [];
  for (const id of PQ_ORDEN) {
    const sen = Object.keys(PQ_SENAL).filter((s) => PQ_SENAL[s] === id && res.perfil?.[s]?.length);
    if (!sen.length) continue;
    const ns = [...new Set(sen.flatMap((s) => res.perfil[s]).map((it) => it.principio.nombre.replace(/\s*\(.*\)\s*$/, "")))];
    out.push({ id, ...MEC[id], nombres: nombres ? "Por: " + (ns.length > 3 ? `${ns.slice(0, 3).join(", ")} y ${ns.length - 3} más` : ns.join(", ")) : "" });
  }
  return out.slice(0, max);
}

/* ---------- recursos (logo y fuentes) ---------- */
const cache = {};
async function dataUrl(path) {
  if (cache[path] !== undefined) return cache[path];
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error();
    const b = await r.blob();
    cache[path] = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
  } catch { cache[path] = null; }
  return cache[path];
}
async function prepararFuentes(doc) {
  const pesos = [["400", "normal"], ["700", "bold"], ["800", "black"]];
  for (const [w, st] of pesos) {
    const d = await dataUrl(`assets/fonts/Manrope-${w}.ttf`);
    if (!d) return "helvetica";
    doc.addFileToVFS(`Manrope-${w}.ttf`, d.split(",")[1]);
    doc.addFont(`Manrope-${w}.ttf`, "Manrope", st);
  }
  return "Manrope";
}

/* ---------- maquetador ---------- */
class Doc {
  constructor(doc, font, logo, { titulo, subtitulo, tipo, escala = 1, numero = "", version = "", qr = null }) {
    this.d = doc; this.font = font; this.logo = logo; this.escala = escala;
    this.titulo = titulo; this.subtitulo = subtitulo; this.tipo = tipo; this.numero = numero; this.version = version; this.qr = qr;
    this.ml = 16; this.w = 210 - 32; this.bottom = 297 - 18; this.y = 0;
    // metadatos del documento (título, idioma, autor): los lectores de pantalla y los gestores documentales los usan
    try { doc.setProperties({ title: `${titulo} · ${NOMBRE}`, subject: subtitulo, author: AUTOR, creator: `${NOMBRE} v${version || ""}`, keywords: "medicación, ejercicio, prescripción" }); doc.setLanguage("es-ES"); } catch {}
    this.cabecera();
  }
  f(style = "normal", size = 9.5, color = C.ink) {
    const st = style === "black" && this.font === "helvetica" ? "bold" : style;
    this.d.setFont(this.font, st); this.d.setFontSize(size * this.escala); this.d.setTextColor(...color);
  }
  lh(size) { return size * this.escala * 0.46; }
  cabecera() {
    const d = this.d;
    d.setFillColor(...C.soft); d.rect(0, 0, 210, 26, "F");
    d.setFillColor(...C.purple); d.rect(0, 26, 210, 1.2, "F");
    if (this.logo) { try { d.addImage(this.logo, "PNG", this.ml, 3, 20, 20); } catch {} }
    const x = this.ml + (this.logo ? 25 : 0);
    this.f("black", 15, C.purpleDeep); d.text(this.titulo, x, 11.5);
    this.f("normal", 7.5, C.muted); const wTipo = d.getTextWidth(this.tipo);
    this.f("normal", 8.5, C.muted);
    const disp = 210 - this.ml - wTipo - 4 - x; // el subtítulo no invade el tipo de documento (derecha)
    let sub = this.subtitulo; if (d.getTextWidth(sub) > disp) { sub = d.splitTextToSize(sub, disp - 3)[0]; if (sub !== this.subtitulo) sub += "…"; }
    d.text(sub, x, 17);
    { // tercera línea: no invade el número de documento (derecha)
      let l3 = `${NOMBRE} · Medicación y Ejercicio · ${WEB}`;
      this.f("normal", 7, C.muted); const wNum = this.numero ? d.getTextWidth(`Nº ${this.numero}`) + 4 : 0;
      this.f("normal", 8.5, C.muted); const disp3 = 210 - this.ml - wNum - x;
      if (d.getTextWidth(l3) > disp3) l3 = `${NOMBRE} · ${WEB}`;
      if (d.getTextWidth(l3) > disp3) l3 = d.splitTextToSize(l3, disp3 - 3)[0] + "…";
      d.text(l3, x, 22);
    }
    this.f("bold", 8, C.muted); d.text(new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }), 210 - this.ml, 11.5, { align: "right" });
    this.f("normal", 7.5, C.muted); d.text(this.tipo, 210 - this.ml, 17, { align: "right" });
    if (this.numero) { this.f("normal", 7, C.muted); d.text(`Nº ${this.numero}`, 210 - this.ml, 22, { align: "right" }); }
    this.y = 35;
  }
  /** Bloque de prescriptor: nombre, especialidad, centro, colegiado, fechas de prescripción y reevaluación. */
  prescriptor(p, prescrito) {
    if (!p || !(p.nombre || p.centro)) return;
    const d = this.d, h = 17; this.salto(h + 2);
    d.setFillColor(...C.purpleSoft); d.roundedRect(this.ml, this.y, this.w, h, 2, 2, "F");
    this.f("bold", 6.5, C.muted); d.text("PRESCRIPTOR", this.ml + 3.5, this.y + 4.5);
    this.f("bold", 9.5, C.ink); d.text([p.nombre, p.especialidad].filter(Boolean).join(" · ") || "—", this.ml + 3.5, this.y + 10);
    this.f("normal", 7.5, C.muted); d.text([p.centro, p.colegiado ? "Nº colegiado " + p.colegiado : ""].filter(Boolean).join(" · "), this.ml + 3.5, this.y + 14.5);
    if (prescrito) {
      const f0 = new Date(prescrito.fecha), f1 = new Date(prescrito.fecha); f1.setDate(f1.getDate() + prescrito.semanas * 7);
      this.f("bold", 6.5, C.muted); d.text("PRESCRITO · REEVALUAR", 210 - this.ml - 3.5, this.y + 4.5, { align: "right" });
      this.f("bold", 9, C.purpleDeep); d.text(`${f0.toLocaleDateString("es-ES")} · ${f1.toLocaleDateString("es-ES")}`, 210 - this.ml - 3.5, this.y + 10, { align: "right" });
    }
    this.y += h + 4;
  }
  /** Bloque de firma al final del documento (con QR que reabre el plan, si lo hay). */
  firma(p, prescrito) {
    const d = this.d, h = this.qr ? 26 : 22; this.salto(h + 2);
    this.y = Math.max(this.y + 2, this.bottom - h - 2); // al pie de la última página, como en una receta
    d.setDrawColor(...C.line); d.setLineWidth(.3); d.line(this.ml, this.y, this.ml + this.w, this.y); this.y += 4;
    if (this.qr) { try { d.addImage(this.qr, "PNG", this.ml, this.y, 20, 20); } catch {} this.f("normal", 6.5, C.muted); d.text("Abre este plan", this.ml, this.y + 23); }
    const x = this.ml + (this.qr ? 26 : 0);
    const f1 = prescrito ? new Date(prescrito.fecha) : null; if (f1) f1.setDate(f1.getDate() + prescrito.semanas * 7);
    this.f("normal", 8, C.ink);
    const lineas = [p?.nombre ? `${p.nombre}${p.especialidad ? " · " + p.especialidad : ""}` : null, p?.centro ? p.centro : null, p?.colegiado ? `Nº colegiado ${p.colegiado}` : null, f1 ? `Reevaluación prevista: ${f1.toLocaleDateString("es-ES")}` : null].filter(Boolean);
    lineas.forEach((l, i) => d.text(l, x, this.y + 4 + i * 4.2));
    d.setDrawColor(...C.muted); d.setLineWidth(.3); d.line(210 - this.ml - 60, this.y + 16, 210 - this.ml, this.y + 16);
    this.f("normal", 7, C.muted); d.text("Firma y sello", 210 - this.ml - 30, this.y + 20, { align: "center" });
    this.y += h;
  }
  pie() {
    const d = this.d, n = d.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      d.setDrawColor(...C.line); d.setLineWidth(.3); d.line(this.ml, 283, 210 - this.ml, 283);
      this.f("normal", 7, C.muted);
      const numPag = `${i} / ${n}`, anchoNum = d.getTextWidth(numPag) + 4, anchoTxt = 210 - 2 * this.ml - anchoNum;
      const l1 = d.splitTextToSize(`${AUTOR} · ${MARCA}`, anchoTxt)[0];
      const l2 = [this.version ? "Pauta Activa v" + this.version : "", this.numero ? "Nº " + this.numero : ""].filter(Boolean).join(" · ");
      d.text(l1, this.ml, 287); // pie en dos líneas: nunca se solapa con el número de página
      if (l2) d.text(d.splitTextToSize(l2, anchoTxt)[0], this.ml, 291);
      d.text(numPag, 210 - this.ml, 287, { align: "right" });
    }
  }
  salto(h) { if (this.y + h > this.bottom) { this.d.addPage(); this.cabecera(); return true; } return false; }

  seccion(titulo, nota) {
    this.salto(30); this.y += 5; // un título nunca queda huérfano al pie de la página
    this.f("black", 12, C.ink); this.d.text(titulo, this.ml, this.y);
    if (nota) { const w = this.d.getTextWidth(titulo); this.f("normal", 8, C.muted); this.d.text(nota, this.ml + w + 3, this.y); }
    this.y += 2.2; this.d.setDrawColor(...C.purple); this.d.setLineWidth(.6); this.d.line(this.ml, this.y, this.ml + 14, this.y);
    this.d.setDrawColor(...C.line); this.d.setLineWidth(.3); this.d.line(this.ml + 14, this.y, this.ml + this.w, this.y);
    this.y += 6;
  }
  parrafo(t, { size = 9.5, color = C.ink, style = "normal", x = this.ml, w = this.w, gap = 2 } = {}) {
    this.f(style, size, color);
    const lines = this.d.splitTextToSize(t, w), lh = this.lh(size);
    for (const l of lines) { if (this.salto(lh)) this.f(style, size, color); this.d.text(l, x, this.y); this.y += lh; }
    this.y += gap;
  }
  alturaTexto(t, size, w) { this.f("normal", size); return this.d.splitTextToSize(t, w).length * this.lh(size); }
  pastilla(txt, x, y, nivel, { size = 6.8, alignRight = false } = {}) {
    const d = this.d; const col = C[nivel] || C.muted, soft = C[nivel + "Soft"] || C.soft, ink = C[nivel + "Ink"] || col;
    this.f("bold", size, ink); const w = d.getTextWidth(txt) + 5;
    const x0 = alignRight ? x - w : x;
    d.setFillColor(...soft); d.roundedRect(x0, y - 3.4, w, 4.8, 2.4, 2.4, "F"); d.text(txt, x0 + 2.5, y);
    return w;
  }
  tarjeta({ nivel = "info", titulo, texto, pie, size = 9 }) {
    const pad = 3.5, wi = this.w - 2 * pad - 2;
    const hT = titulo ? this.lh(9.5) + 1.5 : 0, hB = this.alturaTexto(texto, size, wi), hP = pie ? this.lh(7.5) + 1.5 : 0;
    const h = pad * 2 + hT + hB + hP;
    this.salto(h + 2);
    const d = this.d, y0 = this.y;
    d.setFillColor(...C.white); d.setDrawColor(...C.line); d.setLineWidth(.3); d.roundedRect(this.ml, y0, this.w, h, 2, 2, "FD");
    d.setFillColor(...(C[nivel] || C.muted)); d.rect(this.ml, y0 + 1.5, 1.6, h - 3, "F");
    let y = y0 + pad + 3;
    if (titulo) {
      this.f("bold", 9.5, C.ink); d.text(titulo, this.ml + pad + 2, y);
      this.pastilla(NIVEL_TXT[nivel] || nivel, this.ml + this.w - pad, y - 0.2, nivel, { alignRight: true });
      y += this.lh(9.5) + 1.5;
    }
    this.f("normal", size, C.ink);
    for (const l of d.splitTextToSize(texto, wi)) { d.text(l, this.ml + pad + 2, y); y += this.lh(size); }
    if (pie) { this.f("normal", 7.5, C.muted); d.text(pie, this.ml + pad + 2, y + 1.5); }
    this.y = y0 + h + 2.5;
  }
  /** Punto con título en negrita y texto a continuación (lo esencial del documento del paciente). */
  puntoClave(nivel, titulo, texto, { size = 8.8 } = {}) {
    const d = this.d, x = this.ml, lh = this.lh(size), wi = this.w - 6;
    this.f("bold", size, C.ink); const wt = d.getTextWidth(titulo + " · ");
    this.f("normal", size, C.ink);
    let lines;
    const resto = wi - wt;
    if (resto > 30) { const first = d.splitTextToSize(texto, resto)[0]; const rest = texto.slice(first.length).trim(); lines = [first, ...(rest ? d.splitTextToSize(rest, wi) : [])]; }
    else lines = [null, ...d.splitTextToSize(texto, wi)];
    if (this.salto(lines.length * lh + 1.5)) this.f("normal", size, C.ink);
    d.setFillColor(...(C[nivel] || C.muted)); d.circle(x + 1.3, this.y - 1.1, 1.1, "F");
    this.f("bold", size, C.ink); d.text(titulo + " · ", x + 5, this.y);
    this.f("normal", size, C.ink);
    lines.forEach((l, i) => { if (l) d.text(l, i === 0 ? x + 5 + wt : x + 5, this.y); this.y += lh; });
    this.y += 1.5;
  }
  vineta(nivel, texto, { size = 9, indent = 0 } = {}) {
    const x = this.ml + indent, wi = this.w - indent - 6, lh = this.lh(size);
    this.f("normal", size, C.ink);
    const lines = this.d.splitTextToSize(texto, wi);
    if (this.salto(lines.length * lh + 1)) this.f("normal", size, C.ink);
    this.d.setFillColor(...(C[nivel] || C.muted)); this.d.circle(x + 1.3, this.y - 1.1, 1.1, "F");
    for (const l of lines) { this.d.text(l, x + 5, this.y); this.y += lh; }
    this.y += 1;
  }
  tabla(cols, rows, { size = 8.5, zebra = true, head = true } = {}) {
    const d = this.d, pad = 2, lh = this.lh(size);
    const ws = cols.map((c) => c.w * this.w);
    const celdaTxt = (c) => (typeof c === "string" ? c : c.t);
    const altoFila = (row) => Math.max(...row.map((c, i) => { this.f(typeof c === "object" && c.bold ? "bold" : "normal", size); return d.splitTextToSize(celdaTxt(c), ws[i] - 2 * pad).length * lh; })) + 2 * pad; // se mide con el mismo peso con el que se escribe
    const cab = () => {
      if (!head) return;
      d.setFillColor(...C.purpleSoft); d.rect(this.ml, this.y, this.w, lh + 2 * pad - 0.5, "F");
      this.f("bold", size - 0.5, C.purpleDeep);
      let x = this.ml; cols.forEach((c, i) => { d.text(c.t, c.align === "right" ? x + ws[i] - pad : x + pad, this.y + pad + lh - 1.2, { align: c.align || "left" }); x += ws[i]; });
      this.y += lh + 2 * pad - 0.5;
    };
    this.salto(lh * 3 + 4); cab();
    rows.forEach((row, r) => {
      const h = altoFila(row);
      if (this.salto(h)) cab();
      if (zebra && r % 2 === 1) { d.setFillColor(...C.soft); d.rect(this.ml, this.y, this.w, h, "F"); }
      let x = this.ml;
      row.forEach((cell, i) => {
        const t = celdaTxt(cell), nivel = typeof cell === "object" ? cell.nivel : null, bold = typeof cell === "object" && cell.bold;
        if (nivel) this.pastilla(t, x + pad, this.y + pad + lh - 1.3, nivel, { size: size - 1.5 });
        else {
          this.f(bold ? "bold" : "normal", size, C.ink);
          d.splitTextToSize(t, ws[i] - 2 * pad).forEach((l, k) => d.text(l, cols[i].align === "right" ? x + ws[i] - pad : x + pad, this.y + pad + lh * (k + 1) - 1.3, { align: cols[i].align || "left" }));
        }
        x += ws[i];
      });
      d.setDrawColor(...C.line); d.setLineWidth(.2); d.line(this.ml, this.y + h, this.ml + this.w, this.y + h);
      this.y += h;
    });
    this.y += 3;
  }
  banda(items) {
    const d = this.d, h = 13, n = items.length, wi = this.w / n;
    this.salto(h + 2);
    d.setFillColor(...C.soft); d.roundedRect(this.ml, this.y, this.w, h, 2, 2, "F");
    items.forEach((it, i) => {
      const x = this.ml + i * wi + 3.5;
      this.f("bold", 6.5, C.muted); d.text(it.k.toUpperCase(), x, this.y + 4.5);
      this.f(it.nivel ? "black" : "bold", n > 6 ? 9 : 10.5, it.nivel ? C[it.nivel] : C.ink); d.text(String(it.v), x, this.y + 10);
      if (i) { d.setDrawColor(...C.line); d.line(this.ml + i * wi, this.y + 2.5, this.ml + i * wi, this.y + h - 2.5); }
    });
    this.y += h + 4;
  }
  columnasSemaforo(bloques) {
    const d = this.d, gap = 4, n = bloques.length, wi = (this.w - gap * (n - 1)) / n, pad = 3.2, size = 8.4;
    const alt = bloques.map((b) => { let h = this.lh(10) + 2; for (const t of b.items) h += this.alturaTexto(t, size, wi - 2 * pad - 4) + 1.2; return h + 2 * pad + 3; });
    const h = Math.max(...alt);
    this.salto(h + 2);
    bloques.forEach((b, i) => {
      const x = this.ml + i * (wi + gap);
      d.setFillColor(...C[b.nivel + "Soft"]); d.roundedRect(x, this.y, wi, h, 2.5, 2.5, "F");
      d.setFillColor(...C[b.nivel]); d.rect(x + 2.5, this.y, wi - 5, 1.2, "F");
      this.f("black", 10, C[b.nivel + "Ink"]); d.text(b.titulo, x + pad, this.y + pad + 4.5);
      let y = this.y + pad + 4.5 + this.lh(10) + 1.5;
      for (const t of b.items) {
        this.f("normal", size, C.ink); const lines = d.splitTextToSize(t, wi - 2 * pad - 4);
        d.setFillColor(...C[b.nivel]); d.circle(x + pad + 1.2, y - 1, 0.9, "F");
        lines.forEach((l) => { d.text(l, x + pad + 4, y); y += this.lh(size); }); y += 1.2;
      }
    });
    this.y += h + 5;
  }

  /* ---- infografías (v1.2.18) ---- */
  icono(nombre, x, y, s, rgb = C.purple) {
    const u = icoPng(nombre, rgb); if (!u) return;
    try { this.d.addImage(u, "PNG", x, y, s, s, `ico-${nombre}-${rgb.join("-")}`, "FAST"); } catch {}
  }
  /** «Su plan en un vistazo»: fichas con icono, etiqueta, cifra y una línea; a la derecha, el QR que abre el plan. */
  vistazo(tiles, qr) {
    const d = this.d, h = 26, gap = 2.5, wQr = qr ? 22 : 0, n = tiles.length;
    this.salto(h + 3);
    const wi = (this.w - (qr ? wQr + gap : 0) - gap * (n - 1)) / n;
    const encaja = (txt, style, max, min, ancho) => { let z = max; this.f(style, z); while (z > min && this.d.getTextWidth(txt) > ancho) { z -= 0.5; this.f(style, z); } return z; };
    tiles.forEach((t, i) => {
      const x = this.ml + i * (wi + gap), y = this.y;
      d.setFillColor(...C.purpleSoft); d.roundedRect(x, y, wi, h, 2.5, 2.5, "F");
      d.setFillColor(...C.white); d.circle(x + 6.6, y + 6.6, 4, "F");
      this.icono(t.ico, x + 4.1, y + 4.1, 5, C.purple);
      encaja(t.k.toUpperCase(), "bold", 6.2, 5, wi - 14); this.d.setTextColor(...C.muted); d.text(t.k.toUpperCase(), x + 12.4, y + 7.6);
      const z = encaja(t.v, "black", 11.5, 8, wi - 6.4); this.d.setTextColor(...C.purpleDeep); d.setFontSize(z * this.escala); d.text(t.v, x + 3.2, y + 15.2);
      this.f("normal", 6.6, C.ink); d.splitTextToSize(t.s, wi - 6).slice(0, 2).forEach((l, k) => d.text(l, x + 3.2, y + 19.8 + k * 3.1));
    });
    if (qr) {
      const x = this.ml + this.w - wQr;
      d.setFillColor(...C.white); d.setDrawColor(...C.line); d.setLineWidth(.3); d.roundedRect(x, this.y, wQr, h, 2.5, 2.5, "FD");
      try { d.addImage(qr, "PNG", x + 2.5, this.y + 1.5, 17, 17, "qr-plan", "FAST"); } catch {}
      this.f("bold", 5.4, C.muted); d.text("SU PLAN", x + wQr / 2, this.y + 21.4, { align: "center" }); d.text("EN EL MÓVIL", x + wQr / 2, this.y + 24, { align: "center" });
    }
    this.y += h + 4;
  }
  /** Fichas con icono en rejilla (mecanismos, «cómo hacerlo»): título, línea de quién lo causa y qué hacer. */
  mecanismos(tiles, { cols = 3 } = {}) {
    if (!tiles.length) return;
    const d = this.d, gap = 3, wi = (this.w - gap * (cols - 1)) / cols, pad = 3, wt = wi - 2 * pad - 10, wl = wi - 2 * pad;
    const lineas = (t) => {
      this.f("bold", 8.6); const T = d.splitTextToSize(t.t, wt);
      this.f("normal", 6.8); const N = t.nombres ? d.splitTextToSize(t.nombres, wl).slice(0, 2) : [];
      this.f("normal", 7.6); const H = d.splitTextToSize(t.h, wl);
      let yy = Math.max(pad + 3.2 + T.length * this.lh(8.6), pad + 9.8) + 0.4;
      if (N.length) yy += N.length * this.lh(6.8) + 0.8;
      return { T, N, H, alto: yy + H.length * this.lh(7.6) + pad - 1.2 };
    };
    for (let r = 0; r < tiles.length; r += cols) {
      const fila = tiles.slice(r, r + cols).map((t) => ({ t, ...lineas(t) }));
      const h = Math.max(...fila.map((x) => x.alto), 21);
      this.salto(h + gap);
      fila.forEach(({ t, T, N, H }, i) => {
        const x = this.ml + i * (wi + gap), y = this.y;
        d.setFillColor(...C.white); d.setDrawColor(...C.line); d.setLineWidth(.3); d.roundedRect(x, y, wi, h, 2.5, 2.5, "FD");
        d.setFillColor(...C.purpleSoft); d.circle(x + pad + 4, y + pad + 4, 4.2, "F");
        this.icono(t.ico, x + pad + 1.3, y + pad + 1.3, 5.4, C.purple);
        this.f("bold", 8.6, C.ink); let yy = y + pad + 3.2; for (const l of T) { d.text(l, x + pad + 10, yy); yy += this.lh(8.6); }
        yy = Math.max(yy, y + pad + 9.8) + 0.4;
        if (N.length) { this.f("normal", 6.8, C.muted); for (const l of N) { d.text(l, x + pad, yy); yy += this.lh(6.8); } yy += 0.8; }
        this.f("normal", 7.6, C.ink); for (const l of H) { d.text(l, x + pad, yy); yy += this.lh(7.6); }
      });
      this.y += h + gap;
    }
    this.y += 1;
  }
  /** Calendario de la semana: una tarjeta por día con icono, tipo de sesión y minutos. dias: [{ d, tipo, nombre, min }]. */
  calendario(dias) {
    const d = this.d, gap = 2, n = dias.length, wi = (this.w - gap * (n - 1)) / n, h = 31;
    this.salto(h + 3);
    const EST = { aerobico: [C.infoSoft, C.info, "caminar"], fuerza: [C.purpleSoft, C.purple, "pesa"], fuerza_eq: [C.purpleSoft, C.purpleDeep, "equilibrio"], descanso: [C.soft, C.muted, "descanso"] };
    dias.forEach((x, i) => {
      const [bg, col, ico] = EST[x.tipo] || EST.descanso, X = this.ml + i * (wi + gap), y = this.y;
      d.setFillColor(...bg); d.roundedRect(X, y, wi, h, 2.2, 2.2, "F");
      d.setFillColor(...col); d.rect(X + 2, y, wi - 4, 1, "F");
      this.f("black", 8.6, C.ink); d.text(x.d, X + wi / 2, y + 5.8, { align: "center" });
      this.icono(ico, X + wi / 2 - 3.6, y + 7.4, 7.2, col);
      this.f("normal", 6.2, C.ink); d.splitTextToSize(x.nombre, wi - 2.5).slice(0, 2).forEach((l, k) => d.text(l, X + wi / 2, y + 19.4 + k * 2.9, { align: "center" }));
      if (x.min) { this.f("black", 8.8, col); d.text(`${x.min} min`, X + wi / 2, y + 28.3, { align: "center" }); }
    });
    this.y += h + 4;
  }
  /** Barra de intensidad (ligera, moderada, vigorosa) con su objetivo marcado: pulso si sirve, si no sensación de esfuerzo.
   *  Con un cribado que pide valoración antes de empezar, el objetivo es la ligera hasta entonces. */
  barraIntensidad(z, cribado = null) {
    if (!z) return;
    const d = this.d, h = 15, w3 = this.w / 3, fc = z.metodo === "fc", vig = z.techo === "vigorosa";
    const esperar = ["valoracion_antes", "parar"].includes(cribado?.clave), obj = esperar ? 0 : 1;
    const rango = (k) => (fc ? `${z.zonas[k][0]}–${z.zonas[k][1]} lpm` : z.rpe[k]);
    const vigTxt = esperar ? "No por ahora" : !vig ? "No en su caso" : cribado?.clave === "valoracion_vigoroso" ? "Tras una valoración médica" : rango("vigorosa");
    const segs = [["Ligera", rango("ligera"), C.infoSoft, C.infoInk], ["Moderada", esperar ? "Tras la valoración médica" : rango("moderada"), C.purpleSoft, C.purpleDeep], ["Vigorosa", vigTxt, vig && !esperar ? C.precaucionSoft : C.soft, vig && !esperar ? C.precaucionInk : C.muted]];
    segs[obj][2] = C.purple; segs[obj][3] = C.white;
    this.salto(h + 9);
    const xm = this.ml + w3 * (obj + 0.5);
    this.f("bold", 6.6, C.purpleDeep); d.text(esperar ? "MIENTRAS TANTO" : "SU OBJETIVO", xm, this.y + 2.4, { align: "center" });
    d.setFillColor(...C.purple); d.triangle(xm - 1.6, this.y + 3.4, xm + 1.6, this.y + 3.4, xm, this.y + 5.2, "F");
    const y = this.y + 5.8;
    segs.forEach(([nom, val, bg, ink], i) => {
      const x = this.ml + i * w3;
      d.setFillColor(...bg);
      if (i === 1) d.rect(x + 0.4, y, w3 - 0.8, h, "F"); else d.roundedRect(x + (i ? 0.4 : 0), y, w3 - 0.4, h, 2.5, 2.5, "F");
      this.f("black", 9, ink); d.text(nom, x + w3 / 2, y + 6, { align: "center" });
      this.f("normal", 7, ink); d.splitTextToSize(String(val), w3 - 6).slice(0, 2).forEach((l, k) => d.text(l, x + w3 / 2, y + 10.2 + k * 3.1, { align: "center" }));
    });
    this.y = y + h + 4;
  }
}

/* ---------- número de documento (fecha + huella corta de la lista) y QR del plan ---------- */
function numeroDocumento(res, ctx) {
  const base = res.items.map((it) => `${it.principio.id}:${it.dosisTotal ?? ""}`).join("|") + "|" + (ctx.edad ?? "") + "|" + [...(ctx.condiciones || [])].join(",");
  let h = 0; for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `PA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${h.toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;
}
async function qrPng(url) {
  if (!url) return null;
  try {
    if (!window.qrcode) await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js");
    const q = window.qrcode(0, "M"); q.addData(url); q.make();
    const n = q.getModuleCount(), cell = 4, c = document.createElement("canvas"); c.width = c.height = (n + 2) * cell;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#1c1830";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + 1) * cell, (r + 1) * cell, cell, cell);
    return c.toDataURL("image/png");
  } catch { return null; }
}
const SENAL_CORTA = { hipotension: "↓TA", bradicardia: "↓FC", fc_no_valida: "FC no válida", hipoglucemia: "hipoglucemia", enmascara_hipoglucemia: "enmascara hipogluc.", deshidratacion: "deshidratación", hiperpotasemia: "↑K", hipopotasemia: "↓K", hiponatremia: "↓Na", renal: "riesgo renal", sedacion: "sedación", anticolinergico: "anticolinérgico", caidas: "caídas", sangrado: "sangrado", miopatia: "miopatía", tendon: "tendón", qt: "QT", calor: "termorregulación", taquicardia: "↑FC", perdida_muscular: "sarcopenia", hueso: "hueso", trombosis: "TEV", inmunosupresion: "inmunosupresión", fatiga: "fatiga", hipertension: "↑TA", fotosensibilidad: "fotosensibilidad", litio: "litio" };

const hh = (h) => `${String(h).padStart(2, "0")}:00`;
function seccionCuando(pg, ctx, { paciente = false, compacto = false } = {}) {
  const v = ctx.ventana;
  if (!v) return;
  const hayInfo = v.motivos.length || v.avisos.length;
  pg.seccion(paciente ? "Cuándo entrenar" : "Ventana horaria recomendada", hayInfo ? "según la hora de las tomas" : "");
  if (!hayInfo) { pg.parrafo(paciente ? "Ninguno de sus medicamentos condiciona la hora de entrenar: elija el momento del día que mejor le encaje y sea constante." : "Ningún fármaco de la lista condiciona la hora de la sesión.", { size: paciente ? 9.5 : 8.5 }); return; }
  // barra horaria
  const d = pg.d, x0 = pg.ml, w = pg.w, n = v.horas.length, cw = w / n, hb = 7;
  pg.salto(hb + 10);
  v.horas.forEach((x, i) => {
    const col = x.nivel === "rojo" ? C.alerta : x.nivel === "ambar" ? C.precaucion : x.nivel === "verde" ? C.info : C.soft;
    d.setFillColor(...col); d.rect(x0 + i * cw + 0.3, pg.y, cw - 0.6, hb, "F");
    if (x.h % 3 === 0) { pg.f("normal", 6.5, C.muted); d.text(hh(x.h), x0 + i * cw, pg.y + hb + 3.5); }
  });
  pg.y += hb + 7;
  if (v.mejores.length) pg.parrafo((paciente ? "Mejores momentos para entrenar: " : "Franjas preferibles: ") + v.mejores.map((f) => `${hh(f.desde)}–${hh(f.hasta)}`).join(" y ") + ".", { size: paciente ? 10 : 9, style: "bold" });
  const horasTxt = ["desayuno", "comida", "cena", "noche"].map((m) => `${MOMENTO_TXT[m].toLowerCase()} ${hh(ctx.horas?.[m] ?? 0)}`).join(", ");
  pg.parrafo(`Horas de las tomas consideradas: ${horasTxt}.`, { size: 7.5, color: C.muted });
  if (compacto) return;
  for (const m of [...v.motivos].sort((a, b) => a.desde - b.desde)) pg.vineta(m.nivel === "rojo" ? "alerta" : m.nivel === "ambar" ? "precaucion" : "info", `${hh(m.desde)}–${hh(m.hasta)} · ${m.farmaco} (toma de ${MOMENTO_TXT[m.momento].toLowerCase()}): ${m.motivo}`, { size: paciente ? 9 : 8.3 });
  for (const a of v.avisos) pg.vineta(a.nivel === "rojo" ? "alerta" : "precaucion", `${a.farmaco}: ${a.motivo}`, { size: paciente ? 9 : 8.3 });
}

/* ---------- zona de intensidad y SPPB ---------- */
function seccionZona(pg, ctx, { paciente = false, barra = false } = {}) {
  const z = zonaTxt(ctx.zona); if (!z) return;
  pg.seccion(paciente ? "Su zona de intensidad" : "Zona de intensidad", paciente ? "cómo saber si va al ritmo adecuado" : "");
  const zz = ctx.zona;
  if (barra) pg.barraIntensidad(zz, ctx.cribado);
  if (zz.metodo === "fc") {
    const filas = [["Ligera", `${zz.zonas.ligera[0]}–${zz.zonas.ligera[1]} lpm`, zz.rpe.ligera], ["Moderada", `${zz.zonas.moderada[0]}–${zz.zonas.moderada[1]} lpm`, zz.rpe.moderada]];
    if (zz.techo === "vigorosa") filas.push(["Vigorosa", `${zz.zonas.vigorosa[0]}–${zz.zonas.vigorosa[1]} lpm`, zz.rpe.vigorosa]);
    pg.tabla([{ t: "Intensidad", w: .22 }, { t: "Pulso objetivo", w: .28 }, { t: "Esfuerzo percibido", w: .5 }], filas.map(([a, b, c]) => [{ t: a, bold: true }, b, c]), { size: paciente ? 9 : 8.3 });
  } else {
    pg.tabla([{ t: "Intensidad", w: .25 }, { t: "Esfuerzo percibido", w: .75 }], [["Ligera", zz.rpe.ligera], ["Moderada", zz.rpe.moderada], ...(zz.techo === "vigorosa" ? [["Vigorosa", zz.rpe.vigorosa]] : [])].map(([a, b]) => [{ t: a, bold: true }, b]), { size: paciente ? 9 : 8.3 });
  }
  pg.parrafo(z.nota + " " + zz.habla, { size: paciente ? 8.5 : 7.8, color: C.muted });
}
/** Informe clínico: máximo 4 caras. Se maqueta con un nivel de detalle (3 → 0) y, si se pasa, se repite con menos. */
export async function pdfMedico(kb, res, ctx) {
  const jsPDF = (await jspdf()).jsPDF, logo = await dataUrl("assets/logo-pdf.png"), qr = await qrPng(ctx.enlace);
  let doc = null;
  for (let detalle = 3; detalle >= 0; detalle--) {
    doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const font = await prepararFuentes(doc);
    maquetarMedico(doc, font, logo, qr, kb, res, ctx, detalle);
    if (doc.internal.getNumberOfPages() <= MAX_CARAS) break;
  }
  return doc;
}
function maquetarMedico(doc, font, logo, qr, kb, res, ctx, detalle) {
  const pg = new Doc(doc, font, logo, { titulo: "Informe clínico: medicación y ejercicio", subtitulo: "Prescripción de ejercicio adaptada al tratamiento farmacológico", tipo: "Documento para el profesional sanitario", numero: numeroDocumento(res, ctx), version: ctx.appVersion, qr });
  const lim = (arr) => arr[detalle]; // límite según el detalle: [0, 1, 2, 3]
  pg.prescriptor(ctx.prescriptor, ctx.prescrito);

  const nAlerta = res.resumen.alerta, nPrec = res.resumen.precaucion, nDDI = res.interacciones.filter((x) => x.nivel !== "menor").length;
  const condTxt = { diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", renal: "ERC", renal_grave: "FG < 30", marcapasos: "marcapasos/DAI", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno domiciliario", embarazo: "embarazo/lactancia", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", hipertension: "HTA", cardiopatia_isquemica: "cardiopatía isquémica", fibrilacion_auricular: "fibrilación auricular", aneurisma_aorta: "aneurisma de aorta", ictus: "ictus previo", cancer: "cáncer en tratamiento/reciente", artrosis: "artrosis", epilepsia: "epilepsia", hepatopatia: "hepatopatía avanzada", obesidad: "obesidad" };
  const condiciones = [...(ctx.condiciones || [])].map((c) => condTxt[c]).filter(Boolean);
  const fragTxt = { fragil: "Frágil", prefragil: "Prefrágil", robusto: "Robusto" }[ctx.fragilidad] || "—";
  pg.banda([
    { k: "Edad", v: ctx.edad ? `${ctx.edad} años` : "—" },
    { k: "Caídas", v: ctx.caidas ? "Sí" : "No" },
    { k: "Fragilidad", v: fragTxt, nivel: ctx.fragilidad === "fragil" ? "alerta" : ctx.fragilidad === "prefragil" ? "precaucion" : null },
    { k: "FG", v: ctx.fg != null ? `${ctx.fg}` : "—", nivel: ctx.fg != null && ctx.fg < 30 ? "alerta" : ctx.fg != null && ctx.fg < 45 ? "precaucion" : null },
    { k: "FEVI / NYHA", v: `${ctx.fevi != null ? ctx.fevi + " %" : "—"} / ${ctx.nyha != null ? ["", "I", "II", "III", "IV"][ctx.nyha] : "—"}` },
    { k: "Fármacos", v: res.items.length },
    { k: "Atención", v: nAlerta, nivel: nAlerta ? "alerta" : null },
    { k: "Precaución", v: nPrec, nivel: nPrec ? "precaucion" : null },
    { k: "Interacciones", v: nDDI, nivel: res.interacciones.some((x) => x.nivel === "mayor") ? "alerta" : nDDI ? "precaucion" : null },
  ]);

  if (condiciones.length) pg.parrafo("Situación clínica referida: " + condiciones.join(", ") + ".", { size: 8.5, color: C.muted });
  { const st = sppbTxt(ctx); if (st) pg.parrafo("Valoración funcional: " + st, { size: 8.5, color: C.muted }); }
  if (ctx.cribado && CRIBADO_PDF[ctx.cribado.clave]) { const [niv, txt] = CRIBADO_PDF[ctx.cribado.clave]; pg.tarjeta({ nivel: niv, titulo: "Cribado preparticipación (ACSM 2015)", texto: txt + (ctx.cribado.sintomas ? " Síntomas referidos por el paciente." : ""), pie: `Ejercicio regular: ${ctx.cribado.regular ? "sí" : "no"} · enfermedad CV/metabólica/renal conocida: ${ctx.cribado.enfermedad ? "sí" : "no"}` }); }
  else if (ctx.cribado) pg.parrafo("Cribado preparticipación (ACSM) no completado por el paciente.", { size: 8, color: C.muted });
  const P = prescripcion(res, ctx);
  pg.seccion("Prescripción de ejercicio propuesta", "formato FITT, adaptada a los fármacos y al perfil");
  pg.tabla(
    [{ t: "Modalidad", w: .13 }, { t: "Frecuencia", w: .17 }, { t: "Intensidad", w: .28 }, { t: "Tiempo", w: .16 }, { t: "Tipo y observaciones", w: .26 }],
    [
      [{ t: "Aeróbico", bold: true }, P.aer.frec, P.aer.int, P.aer.tiempo, P.aer.tipo],
      [{ t: "Fuerza", bold: true }, P.fue.frec, P.fue.int, P.fue.tiempo, P.fue.tipo],
      [{ t: "Equilibrio", bold: true }, P.eq.frec, P.eq.int, P.eq.tiempo, P.eq.tipo],
    ],
    { size: 8 }
  );
  pg.parrafo("Marco: OMS 2020 / ACSM GETP 11.ª ed. Ajustar según valoración funcional (SPPB, Vivifrail) y comorbilidad. Programa multicomponente; progresar primero el volumen y después la intensidad.", { size: 7.5, color: C.muted });
  seccionZona(pg, ctx);
  if (ctx.ventana && (ctx.ventana.motivos.length || ctx.ventana.avisos.length)) seccionCuando(pg, ctx);

  const claves = [];
  for (const c of res.combinadas) if (c.regla.nivel === "alerta") claves.push({ nivel: "alerta", titulo: c.regla.titulo, texto: c.texto, pie: "Implicados: " + c.implicados.map((i) => i.principio.nombre).join(", ") });
  for (const x of res.interacciones) if (x.nivel === "mayor") claves.push({ nivel: "alerta", titulo: `Interacción mayor: ${x.a.principio.nombre} + ${x.b.principio.nombre}`, texto: `${x.efecto} ${x.accion ? "Manejo: " + x.accion : ""}`.trim() });
  for (const [amb, titulo] of AMBITOS) for (const g of res.ambitos[amb]) for (const r of g.reglas) if (r.nivel === "alerta") claves.push({ nivel: "alerta", titulo: `${g.item.principio.nombre} · ${titulo}`, texto: r.texto });
  for (const c of res.combinadas) if (c.regla.nivel === "precaucion" && claves.length < 8) claves.push({ nivel: "precaucion", titulo: c.regla.titulo, texto: c.texto });
  if (claves.length) {
    const n = Math.min(claves.length, lim([4, 6, 8, 10]));
    pg.seccion("Puntos clave", `${n} elementos que condicionan la prescripción`);
    for (const k of claves.slice(0, n)) pg.tarjeta({ ...k, texto: corta(k.texto, lim([170, 230, 320, 2000])) });
  }

  if (ctx.diario?.length) {
    const d = ctx.diario.filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 28);
    if (d.length) {
      const min = d.reduce((n, x) => n + (x.min || 0), 0), rpe = (d.reduce((n, x) => n + (x.rpe || 0), 0) / d.length).toFixed(1);
      const sint = [...new Set(d.flatMap((x) => x.sintomas || []))];
      pg.seccion("Registro de sesiones del paciente (últimas 4 semanas)", "anotado por el paciente en la aplicación");
      pg.parrafo(`${d.length} sesiones · ${min} min en total · RPE medio ${rpe}/10${sint.length ? " · síntomas anotados: " + sint.join(", ") : " · sin síntomas anotados"}.`, { size: 9 });
      // constantes anotadas (glucosa antes/después, TA sistólica, FC al terminar): resumen de rangos y las últimas 6 sesiones con datos
      const conConst = d.filter((x) => x.const && Object.values(x.const).some((v) => v != null));
      if (conConst.length) {
        const rango = (k) => { const v = conConst.map((x) => x.const[k]).filter((n) => n != null); return v.length ? `${Math.min(...v)}–${Math.max(...v)}` : "—"; };
        const resumen = [];
        if (conConst.some((x) => x.const.glucosa_antes != null || x.const.glucosa_despues != null)) resumen.push(`glucosa antes ${rango("glucosa_antes")} / después ${rango("glucosa_despues")} mg/dL`);
        if (conConst.some((x) => x.const.ta != null)) resumen.push(`TAS ${rango("ta")} mmHg`);
        if (conConst.some((x) => x.const.fc != null)) resumen.push(`FC al terminar ${rango("fc")} lpm`);
        pg.parrafo(`Constantes anotadas en ${conConst.length} sesiones (mín.–máx.): ${resumen.join(" · ")}.`, { size: 9 });
        const ult = conConst.slice(-lim([0, 3, 6, 6]));
        const tipos = { aerobico: "Aeróbico", fuerza: "Fuerza", equilibrio: "Equilibrio", paseo: "Paseo" };
        if (ult.length) pg.tabla(
          [{ t: "Fecha", w: .16 }, { t: "Sesión", w: .2 }, { t: "RPE", w: .1 }, { t: "Glucosa a/d", w: .2 }, { t: "TAS", w: .16 }, { t: "FC fin", w: .18 }],
          ult.map((x) => [x.fecha, `${tipos[x.tipo] || x.tipo} · ${x.min} min`, String(x.rpe ?? "—"), `${x.const.glucosa_antes ?? "—"} / ${x.const.glucosa_despues ?? "—"}`, x.const.ta != null ? String(x.const.ta) : "—", x.const.fc != null ? String(x.const.fc) : "—"]),
          { size: 8 }
        );
      }
    }
  }
  pg.seccion("Medicación referida por el paciente", "dosis diaria estimada y efectos relevantes para el ejercicio");
  pg.tabla(
    [{ t: "Fármaco", w: .25 }, { t: "Dosis", w: .21 }, { t: "Grupo", w: .24 }, { t: "Efectos a vigilar", w: .3 }],
    res.items.map((it) => [{ t: it.principio.nombre, bold: true }, dosisTxt(it), it.clase.nombre.replace(/\s*\(.*?\)\s*/g, ""), [...it.senales].map((s) => SENAL_CORTA[s]).filter(Boolean).join(", ") || "—"]),
    { size: 8 }
  );
  if (ctx.libres?.length) pg.parrafo(`Otros productos referidos sin información en la base (no evaluados): ${ctx.libres.join(", ")}.`, { size: 8.5, color: C.muted });

  const inter = res.interacciones, mayores = inter.filter((x) => x.nivel === "mayor"), moderadas = inter.filter((x) => x.nivel === "moderada");
  const muestra = detalle >= 3 ? inter : detalle === 2 ? inter.filter((x) => x.nivel !== "menor") : [...mayores, ...moderadas.slice(0, detalle ? 8 : 4)];
  pg.seccion("Interacciones fármaco–fármaco", inter.length ? `${inter.length} detectadas${muestra.length < inter.length ? `; aquí, las ${muestra.length} más relevantes` : ""}` : "ninguna relevante en las bases consultadas");
  if (muestra.length) {
    pg.tabla(
      [{ t: "Combinación", w: .26 }, { t: "Nivel", w: .11 }, { t: "Efecto", w: .33 }, { t: "Manejo", w: .3 }],
      muestra.map((x) => [{ t: `${x.a.principio.nombre} + ${x.b.principio.nombre}`, bold: true }, { t: NIVEL_TXT[x.nivel], nivel: x.nivel }, corta(x.efecto, lim([110, 150, 220, 2000])), corta(x.accion || "—", lim([110, 150, 220, 2000])) + (x.fuenteTxt ? ` [${x.fuenteTxt}]` : x.fuente === "ddinter" ? " [DDInter 2.0]" : "")]),
      { size: 7.8 }
    );
  }
  if (muestra.length < inter.length) pg.parrafo(`Las otras ${inter.length - muestra.length} (moderadas o menores) están en la aplicación y en el texto para la historia clínica.`, { size: 7.5, color: C.muted });

  const perfil = Object.entries(res.perfil).filter(([s]) => kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s) && res.perfil[s].length >= 2).sort((a, b) => b[1].length - a[1].length);
  if (perfil.length && detalle) {
    pg.seccion("Efectos acumulados", "señales presentes en dos o más fármacos");
    pg.tabla([{ t: "Efecto", w: .5 }, { t: "N", w: .06, align: "right" }, { t: "Fármacos", w: .44 }], perfil.map(([s, its]) => [kb.senales[s], String(its.length), its.map((i) => i.principio.nombre).join(", ")]), { size: 8 });
  }

  const porFarmaco = res.items.map((it) => ({ it, puntos: AMBITOS.flatMap(([amb, titulo]) => (res.ambitos[amb].find((g) => g.item === it)?.reglas || []).filter((r) => r.nivel !== "info").map((r) => ({ amb: titulo, ...r }))) })).filter((x) => x.puntos.length);
  if (porFarmaco.length && !detalle) pg.parrafo("Las consideraciones de cada fármaco para cada tipo de ejercicio están en la aplicación y en el documento del paciente.", { size: 7.5, color: C.muted });
  if (porFarmaco.length && detalle) {
    pg.seccion("Consideraciones por fármaco", detalle === 3 ? "solo precaución y atención; el detalle informativo está en el documento del paciente" : "lo más importante de cada fármaco; el detalle, en la aplicación");
    for (const { it, puntos } of porFarmaco) {
      pg.salto(12);
      pg.f("bold", 9.5, C.ink); pg.d.text(it.principio.nombre, pg.ml, pg.y);
      const wN = pg.d.getTextWidth(it.principio.nombre);
      pg.f("normal", 8, C.muted); pg.d.text(dosisTxt(it), pg.ml + wN + 3, pg.y);
      pg.y += 5;
      for (const r of puntos.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).slice(0, lim([1, 2, 3, 99]))) pg.vineta(r.nivel, `[${r.amb}] ${corta(r.texto, lim([150, 200, 260, 2000]))}`, { size: 8.3, indent: 2 });
      pg.y += 1.5;
    }
  }

  pg.seccion("Fuentes y alcance");
  pg.parrafo("ACSM Guidelines for Exercise Testing and Prescription (11.ª ed., Apéndice A) y algoritmo de preparticipación ACSM 2015; OMS 2020 Physical activity guidelines; ADA Standards of Care; criterios Beers 2023 y STOPP/START v3; fichas técnicas AEMPS; DDInter 2.0 (CC BY-NC-SA 4.0) y revisión propia de interacciones. " + kb.aviso, { size: 7.5, color: C.muted });
  pg.firma(ctx.prescriptor, ctx.prescrito);
  pg.pie();
}

/** Listas «puede hacer / con cuidado / evite» en lenguaje del paciente (misma fuente para la app y el PDF). */
function corta(t, max = 220) {
  t = String(t || "").trim(); if (t.length <= max) return t;
  const i = t.slice(0, max).lastIndexOf(". ");
  if (i > 60) return t.slice(0, i + 1);
  const j = t.slice(0, max - 1).lastIndexOf(" ");
  return t.slice(0, j > 40 ? j : max - 1).replace(/[,;:(]$/, "").trim() + "…";
}
const AMB_TAG = { general: "", aerobico: "Aeróbico: ", fuerza: "Fuerza: ", equilibrio: "Equilibrio: " };
const NIVEL_TAG = { alerta: "Atención: ", precaucion: "Precaución: ", info: "" };
const MAX_CARAS_PACIENTE = MAX_CARAS;

/** Documento para el paciente: primera cara con lo esencial y lo más útil; máximo 4 caras.
 *  Se maqueta con un nivel de detalle (3 → 0) y, si se pasa de 4 páginas, se vuelve a maquetar con menos detalle. */
export async function pdfPaciente(kb, res, ctx) {
  const jsPDF = (await jspdf()).jsPDF;
  const logo = await dataUrl("assets/logo-pdf.png");
  const qr = await qrPng(ctx.enlace);
  let doc = null;
  for (let detalle = 3; detalle >= 0; detalle--) {
    doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const font = await prepararFuentes(doc);
    maquetarPaciente(doc, font, logo, qr, kb, res, ctx, detalle);
    if (doc.internal.getNumberOfPages() <= MAX_CARAS_PACIENTE) break;
  }
  return doc;
}

function maquetarPaciente(doc, font, logo, qr, kb, res, ctx, detalle) {
  const compacto = ctx.modo === "paciente"; // versión para el propio paciente: letra algo mayor
  const pg = new Doc(doc, font, logo, { titulo: "Su medicación y el ejercicio", subtitulo: compacto ? "Su plan para entrenar con seguridad" : "Un plan sencillo para entrenar con seguridad con su tratamiento", tipo: "Documento para el paciente", escala: compacto ? 1.08 : 1, numero: numeroDocumento(res, ctx), version: ctx.appVersion, qr });
  pg.prescriptor(ctx.prescriptor, ctx.prescrito);
  pg.parrafo("Preparado a partir de su medicación. Información general para moverse con seguridad y hablar con su médico; no sustituye su consejo ni cambia ningún tratamiento.", { size: 7.6, color: C.muted, gap: 1 });

  /* ---- cara 1: su plan en un vistazo y lo que su medicación cambia al moverse ---- */
  if (ctx.cribado && CRIBADO_PDF[ctx.cribado.clave]) { const [niv, txt] = CRIBADO_PDF[ctx.cribado.clave]; pg.tarjeta({ nivel: niv, titulo: "Antes de empezar", texto: txt.replace("Cribado ACSM: ", "").replace(/^./, (c) => c.toUpperCase()), size: 8.6 }); }
  const P = prescripcion(res, ctx), F = filasPlanPaciente(res, ctx), z = ctx.zona;
  const cond = ctx.condiciones || new Set(), fragil = cond.has("fragil") || cond.has("nyha34");
  const dias = (s) => { const m = String(s).match(/(\d+(?:–\d+)?)\s*días/); return m ? `${m[1]} días` : /diario/i.test(s) ? "A diario" : String(s); };
  pg.vistazo([
    { ico: "caminar", k: "Caminar", v: dias(P.aer.frec), s: fragil ? "Ratos de 5–10 min, 2–3 veces al día" : "Empiece con 10–20 min y suba poco a poco" },
    { ico: "pesa", k: "Fuerza", v: dias(P.fue.frec), s: "20–40 min · 8–15 repeticiones" },
    { ico: "equilibrio", k: "Equilibrio", v: dias(P.eq.frec), s: "10–15 min, con un apoyo cerca" },
    ["valoracion_antes", "parar"].includes(ctx.cribado?.clave)
      ? { ico: "habla", k: "Su ritmo", v: "Suave", s: "hasta la valoración médica (puede cantar)" }
      : { ico: "habla", k: "Su ritmo", v: z?.metodo === "fc" ? `${z.zonas.moderada[0]}–${z.zonas.moderada[1]} lpm` : "Puede hablar", s: z?.metodo === "fc" ? "pulso para un ritmo moderado" : z?.motivos?.length ? "pero no cantar; no mire el pulso" : "pero no cantar" },
  ], qr);
  const { evite, cuidado, puede } = listasVistazo(res, ctx);
  pg.columnasSemaforo([
    { nivel: "info", titulo: "Puede hacer", items: puede },
    { nivel: "precaucion", titulo: "Con cuidado", items: cuidado.slice(0, 4) },
    { nivel: "alerta", titulo: "Evite", items: evite.slice(0, 4) },
  ]);
  const mec = mecanismosDe(res, { max: [6, 6, 6, 9][detalle] });
  if (mec.length) { pg.salto(42); pg.seccion("Lo que su medicación cambia al moverse", "y qué hacer en cada caso"); pg.mecanismos(mec); }

  /* ---- cara 2: su semana, su ritmo, cuándo entrenar y señales de alarma ---- */
  {
    const nombres = { fuerza_eq: "Fuerza y equilibrio", aerobico: "Caminar, bici…", fuerza: "Fuerza", descanso: "Descanso" };
    const largo = { fuerza_eq: "Fuerza y equilibrio", aerobico: "Aeróbico (caminar, bici…)", fuerza: "Fuerza" };
    const DIAS = [["Lun", 1], ["Mar", 2], ["Mié", 3], ["Jue", 4], ["Vie", 5], ["Sáb", 6], ["Dom", 0]];
    const plan = ctx.plan ? planSemana(ctx.plan.dias) : PLAN_SEMANA;
    const ses = (tipo) => (tipo === "descanso" ? null : sesionTipo(tipo, { fragil, minutosAer: fragil ? 10 : 30 }));
    pg.salto(50); // el título y el calendario van juntos
    pg.seccion("Su semana", fragil ? "sesiones cortas, varias veces al día si hace falta" : "unos 150 minutos a la semana; ajústelo con su médico o entrenador");
    pg.calendario(DIAS.map(([dd, n]) => { const tipo = plan[n], s = ses(tipo); return { d: dd, tipo, nombre: nombres[tipo], min: s?.min || 0 }; }));
    for (const tipo of [...new Set(DIAS.map(([, n]) => plan[n]).filter((t) => t !== "descanso"))]) { const s = ses(tipo); pg.puntoClave("info", `${largo[tipo]} · ${s.min} min`, s.bloques.map((b) => `${b.nombre} (${b.min}′)`).join(" · "), { size: 8.2 }); }
    pg.parrafo("Los días de descanso, si le apetece, 20–30 minutos caminando también cuentan.", { size: 7.6, color: C.muted, gap: 2 });
    pg.mecanismos([{ ico: "caminar", t: "Caminar o similar", h: F[0][3] }, { ico: "pesa", t: "Fuerza", h: F[1][3] }, { ico: "equilibrio", t: "Equilibrio", h: F[2][3] }]);
  }
  if (z) {
    pg.salto(42);
    pg.seccion("Su ritmo", "cómo saber si va a la intensidad adecuada");
    pg.barraIntensidad(z, ctx.cribado);
    const r = ritmoTexto(z);
    if (r?.nota) pg.parrafo(r.nota, { size: 7.4, color: C.muted });
  }
  seccionCuando(pg, ctx, { paciente: true, compacto: !detalle });

  pg.seccion("Pare y consulte si nota…", "señales de alarma durante o después del ejercicio");
  const alarmas = [...ALARMA];
  if (tiene(res, "miopatia") || tiene(res, "hipopotasemia")) alarmas.push("Dolor muscular generalizado, debilidad u orina oscura en los días siguientes.");
  if (tiene(res, "sangrado")) alarmas.push("Cualquier golpe en la cabeza, aunque se encuentre bien, o hematomas grandes sin golpe.");
  for (const a of alarmas) pg.vineta("alerta", a, { size: 8.6 });
  pg.parrafo("Ante cualquiera de ellas deje de hacer ejercicio y consulte; si el dolor en el pecho o la falta de aire no ceden en pocos minutos, llame al 112.", { size: 7.8, color: C.muted });

  /* ---- caras 3–4: lo esencial y su medicación, una por una ---- */
  const esencial = loEsencial(res, detalle ? 5 : 3);
  const usadas = new Set(esencial.map((e) => e.texto));
  if (esencial.length) {
    pg.seccion("Lo esencial", "lo más importante de su medicación para el ejercicio");
    for (const a of esencial) pg.puntoClave(a.nivel, a.titulo, a.texto, { size: 8.6 });
  }
  pg.seccion("Su medicación", detalle ? "qué tener en cuenta con cada una" : "lo esencial de cada una");
  const reglasDe = (it) => {
    const out = [];
    for (const amb of ["general", "aerobico", "fuerza", "equilibrio"]) for (const g of res.ambitos[amb]) if (g.item.principio.id === it.principio.id) for (const r of g.reglas) out.push({ amb, r });
    return out.sort((a, b) => ORDEN_NIVEL[b.r.nivel] - ORDEN_NIVEL[a.r.nivel] || (a.amb === "general" ? -1 : 1)).filter((x) => !usadas.has(corta(x.r.texto, 190)) && !usadas.has(x.r.texto)).slice(0, detalle);
  };
  pg.tabla(
    [{ t: "Medicamento", w: .22 }, { t: "Dosis", w: .16 }, { t: detalle ? "Qué tener en cuenta" : "Lo esencial", w: .62 }],
    res.items.map((it) => {
      const extra = reglasDe(it).map((x) => `• ${NIVEL_TAG[x.r.nivel]}${AMB_TAG[x.amb]}${corta(x.r.texto, detalle >= 3 ? 230 : 170)}`);
      return [{ t: it.principio.nombre, bold: true }, dosisTxt(it).replace(" · dosis alta", " (dosis alta)"), [corta(it.clase.resumen, detalle ? 200 : 260), ...extra].join("\n")];
    }),
    { size: 8 }
  );
  if (ctx.libres?.length) pg.parrafo(`También toma: ${ctx.libres.join(", ")}. No están en nuestra base, así que no hay recomendaciones sobre ellos; coméntelos con su médico o farmacéutico.`, { size: 8, color: C.muted });

  if (detalle) {
    const titulos = new Set(esencial.map((e) => e.titulo));
    const comb = res.combinadas.filter((c) => !titulos.has(c.regla.titulo) && (detalle >= 2 ? c.regla.nivel !== "info" || c.regla.ambitos?.includes("general") : c.regla.nivel === "precaucion"));
    if (comb.length) {
      pg.seccion("Por su situación", "consejos que dependen de sus enfermedades y de la combinación de fármacos");
      for (const c of comb.slice(0, detalle >= 2 ? 8 : 4)) pg.puntoClave(c.regla.nivel, c.regla.titulo, corta(c.texto, detalle >= 3 ? 320 : 220), { size: 8.4 });
    }
  }

  const ddi = res.interacciones.filter((x) => x.fuente !== "ddinter" && ORDEN_DDI[x.nivel] >= (detalle ? 2 : 3)).slice(0, 6);
  if (ddi.length) {
    pg.seccion("Medicamentos que se afectan entre sí", "no significa que la combinación sea incorrecta; conviene conocerla");
    pg.tabla([{ t: "Combinación", w: .3 }, { t: "Qué puede pasar", w: .36 }, { t: "Qué hacer", w: .34 }], ddi.map((x) => [{ t: `${x.a.principio.nombre} + ${x.b.principio.nombre}`, bold: true }, corta(x.efecto, 160), corta(x.accion || "—", 160)]), { size: 7.8 });
  }

  pg.parrafo("Este documento recoge lo esencial. En la aplicación encontrará el detalle de cada medicamento para cada tipo de ejercicio y la lista completa de interacciones. " + kb.aviso, { size: 7.3, color: C.muted });
  pg.firma(ctx.prescriptor, ctx.prescrito);
  pg.pie();
}

/* ---------- INFORME DE EVOLUCIÓN (reevaluación, una cara) ---------- */
export async function pdfEvolucion(kb, res, ctx, evo) {
  const doc = new (await jspdf()).jsPDF({ unit: "mm", format: "a4", compress: true });
  const font = await prepararFuentes(doc);
  const logo = await dataUrl("assets/logo-pdf.png");
  const pg = new Doc(doc, font, logo, { titulo: "Evolución del plan de ejercicio", subtitulo: "Informe de reevaluación · adherencia, carga y comparativa con la prescripción", tipo: "Informe clínico", numero: numeroDocumento(res, ctx), version: ctx.appVersion });
  pg.prescriptor(ctx.prescriptor, ctx.prescrito);
  const f = (iso) => { const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; };
  pg.parrafo(`Periodo: del ${f(evo.desde)} al ${f(evo.hasta)} (${evo.semanas} semanas; reevaluación prevista el ${f(evo.prevista)}). Datos del diario registrado por el paciente en la aplicación, sin servidores.`, { size: 8.3, color: C.muted, gap: 1 });
  const nivelAdh = evo.valoracion === "buena" ? "info" : evo.valoracion === "parcial" ? "precaucion" : evo.valoracion === "baja" ? "alerta" : null;
  pg.banda([
    { k: "Adherencia", v: evo.adherencia != null ? `${evo.adherencia} %` : "—", nivel: nivelAdh },
    { k: "Sesiones", v: `${evo.sesiones} / ${evo.previstas}` },
    { k: "Minutos/semana", v: evo.minutosSemana },
    { k: "RPE medio", v: evo.rpeMedio ?? "—" },
    { k: "Síntomas", v: Object.values(evo.sintomas).reduce((a, b) => a + b, 0), nivel: Object.keys(evo.sintomas).length ? "precaucion" : null },
  ]);
  const VAL = { buena: "Buena adherencia: mantener el plan y progresar la carga (volumen antes que intensidad).", parcial: "Adherencia parcial: revisar barreras (dolor, miedo, horario, transporte) y simplificar el plan si hace falta.", baja: "Adherencia baja: renegociar objetivos más pequeños y concretos, y buscar apoyo (familia, grupo, fisioterapia, programa comunitario).", sin_plan: "Sin plan de referencia: no se puede calcular la adherencia." };
  pg.tarjeta({ nivel: nivelAdh || "info", titulo: "Valoración", texto: VAL[evo.valoracion], size: 8.5 });

  pg.seccion("Minutos por semana", "desde la prescripción");
  { // gráfico de barras sencillo
    const d = pg.d, n = evo.porSemana.length, w = pg.w, h = 20, x0 = pg.ml, maxMin = Math.max(1, ...evo.porSemana.map((s) => s.min)), obj = ctx.condiciones?.has?.("fragil") ? 90 : 150;
    pg.salto(h + 14);
    const yBase = pg.y + h; const bw = Math.min(14, (w / n) * 0.7), gap = w / n;
    d.setDrawColor(...C.line); d.setLineWidth(.3); d.line(x0, yBase, x0 + w, yBase);
    const yObj = yBase - Math.min(1, obj / maxMin) * h; d.setDrawColor(...C.muted); d.setLineDashPattern([1, 1], 0); d.line(x0, yObj, x0 + w, yObj); d.setLineDashPattern([], 0);
    pg.f("normal", 6.5, C.muted); d.text(`objetivo ${obj} min/semana`, x0 + w, yObj + 2.6, { align: "right" });
    evo.porSemana.forEach((s, i) => {
      const bh = (s.min / maxMin) * h, x = x0 + i * gap + (gap - bw) / 2;
      d.setFillColor(...(s.min >= obj ? C.info : C.purple)); d.rect(x, yBase - bh, bw, bh, "F");
      pg.f("bold", 6.5, C.ink); d.text(String(s.min), x + bw / 2, yBase - bh - 1, { align: "center" });
      pg.f("normal", 6, C.muted); d.text(f(s.desde).slice(0, 5), x + bw / 2, yBase + 3.5, { align: "center" });
    });
    pg.y = yBase + 7;
  }
  const tipos = Object.entries(evo.porTipo).map(([k, n]) => `${{ aerobico: "aeróbico", fuerza: "fuerza", fuerza_eq: "fuerza y equilibrio", equilibrio: "equilibrio" }[k] || k} ${n}`).join(" · ");
  if (tipos) pg.parrafo(`Sesiones por tipo: ${tipos}.`, { size: 8, color: C.muted, gap: 0 });

  pg.seccion("Comparativa con la prescripción");
  const c = evo.comp; const d_ = (x) => (x == null ? "" : ` (${x > 0 ? "+" : ""}${x})`);
  const nom = (m) => ctx.nombres?.[m.pid] || m.pid;
  const medsTxt = c.medicacion ? ([c.medicacion.nuevos.length ? `nuevos: ${c.medicacion.nuevos.map(nom).join(", ")}` : "", c.medicacion.retirados.length ? `retirados: ${c.medicacion.retirados.map(nom).join(", ")}` : "", c.medicacion.cambios.length ? `dosis cambiada: ${c.medicacion.cambios.map(nom).join(", ")}` : ""].filter(Boolean).join(" · ") || "sin cambios") : "no disponible (prescripción anterior a esta versión)";
  pg.tabla([{ t: "", w: .3 }, { t: "Al prescribir", w: .25 }, { t: "Hoy", w: .45 }], [
    [{ t: "SPPB (0–12)", bold: true }, String(c.sppb.antes ?? "—"), `${c.sppb.ahora ?? "—"}${d_(c.sppb.delta)}${c.sppb.delta != null && Math.abs(c.sppb.delta) >= 1 ? " · cambio clínicamente relevante" : ""}`],
    [{ t: "FC en reposo (lpm)", bold: true }, String(c.fcReposo.antes ?? "—"), `${c.fcReposo.ahora ?? "—"}${d_(c.fcReposo.delta)}`],
    [{ t: "Medicación", bold: true }, c.medicacion ? `${(ctx.prescrito?.base?.meds || []).length} fármacos` : "—", medsTxt],
    [{ t: "Avisos del informe actual", bold: true }, "—", `${res.resumen.alerta} atención · ${res.resumen.precaucion} precaución · ${res.interacciones.filter((x) => x.nivel === "mayor").length} interacciones mayores`],
  ], { size: 8.3 });

  pg.seccion("Síntomas y constantes registrados");
  const sint = Object.entries(evo.sintomas).map(([k, n]) => `${SINTOMAS.find((x) => x.id === k)?.nombre || k} (${n})`).join(", ");
  pg.vineta(Object.keys(evo.sintomas).length ? "precaucion" : "info", `Síntomas durante las sesiones: ${sint || "ninguno registrado"}.${evo.chequeosNo ? ` Chequeo previo desfavorable en ${evo.chequeosNo} sesión(es).` : ""}`, { size: 8.5 });
  if (evo.constantes.glucosa) pg.vineta(evo.constantes.glucosa.hipos ? "alerta" : "info", `Glucemias (${evo.constantes.glucosa.n}): media ${evo.constantes.glucosa.media} mg/dL (${evo.constantes.glucosa.min}–${evo.constantes.glucosa.max}); ${evo.constantes.glucosa.hipos} valor(es) < 70 mg/dL.`, { size: 8.5 });
  if (evo.constantes.ta) pg.vineta(evo.constantes.ta.max >= 180 ? "alerta" : "info", `TA sistólica (${evo.constantes.ta.n}): media ${evo.constantes.ta.media}, máxima ${evo.constantes.ta.max} mmHg.`, { size: 8.5 });
  if (!evo.constantes.glucosa && !evo.constantes.ta) pg.vineta("info", "Sin constantes registradas en el diario.", { size: 8.5 });

  pg.seccion("Plan propuesto", "a cumplimentar por el prescriptor");
  for (const l of ["Continuar / progresar (volumen antes que intensidad) / simplificar / derivar a programa supervisado.", "Objetivo próximo periodo: ____ sesiones y ____ min por semana; fuerza ____ días. Próxima reevaluación en ____ semanas (SPPB y FC en reposo el mismo día)."]) pg.vineta("info", l, { size: 8.3 });
  pg.parrafo("Herramienta informativa: no sustituye la valoración individual ni modifica ningún tratamiento.", { size: 7.3, color: C.muted, gap: 0 });
  pg.firma(ctx.prescriptor, ctx.prescrito);
  pg.pie();
  return doc;
}

/* ---------- FICHA PARA EL ENTRENADOR / FISIOTERAPEUTA ---------- */
function listasPaciente(res, ctx) {
  const evite = [];
  if (tiene(res, "sangrado")) evite.push("Deportes de contacto o con riesgo de golpes y caídas a velocidad.");
  if (tiene(res, "tendon")) evite.push("Saltos, carrera intensa y cargas máximas durante el tratamiento y el mes siguiente.");
  if (cuenta(res, "hipotension") >= 2) evite.push("Parar de golpe tras el esfuerzo y las duchas muy calientes justo después.");
  if (tiene(res, "calor") || tiene(res, "deshidratacion")) evite.push("Entrenar con calor intenso o sin agua a mano.");
  if (tiene(res, "sedacion")) evite.push("Entrenar en las horas siguientes a una toma que da sueño.");
  if (tiene(res, "renal") || tiene(res, "sangrado") || tiene(res, "litio")) evite.push("Antiinflamatorios (ibuprofeno, naproxeno) para las agujetas: paracetamol.");
  if (tiene(res, "fc_no_valida") || tiene(res, "bradicardia")) evite.push("Guiarse por el pulso para medir la intensidad.");
  const cond = ctx.condiciones || new Set();
  if (cond.has("aneurisma_aorta")) evite.push("Cargas máximas, Valsalva y ejercicios isométricos intensos (aneurisma de aorta).");
  if (cond.has("osteoporosis")) evite.push("Flexión forzada de columna con carga y giros bruscos (osteoporosis).");
  const cuidado = [];
  if (tiene(res, "hipoglucemia")) cuidado.push("Glucosa antes y después; azúcar a mano.");
  if (cuenta(res, "hipotension") >= 1) cuidado.push("Transiciones lentas; enfriamiento 5–10 min.");
  if (tiene(res, "caidas") || ctx.caidas || ctx.edad >= 65) cuidado.push("Equilibrio con apoyo cerca.");
  if (tiene(res, "miopatia")) cuidado.push("Dolor muscular desproporcionado: derivar.");
  if (tiene(res, "hiperpotasemia")) cuidado.push("Sin suplementos de potasio.");
  if (tiene(res, "deshidratacion") || tiene(res, "litio")) cuidado.push("Hidratación con sales en sesiones largas.");
  if (tiene(res, "qt")) cuidado.push("Palpitaciones o mareo: parar y derivar (riesgo de QT largo).");
  if (tiene(res, "hueso") || tiene(res, "perdida_muscular")) cuidado.push("Prioridad a la fuerza progresiva (masa muscular y hueso).");
  return { evite, cuidado };
}
/** Ficha para el entrenador: máximo 4 caras (detalle 3 → 0 si se pasa). */
export async function pdfEntrenador(kb, res, ctx) {
  const jsPDF = (await jspdf()).jsPDF, logo = await dataUrl("assets/logo-pdf.png"), qr = await qrPng(ctx.enlace);
  let doc = null;
  for (let detalle = 3; detalle >= 0; detalle--) {
    doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const font = await prepararFuentes(doc);
    maquetarEntrenador(doc, font, logo, qr, kb, res, ctx, detalle);
    if (doc.internal.getNumberOfPages() <= MAX_CARAS) break;
  }
  return doc;
}
function maquetarEntrenador(doc, font, logo, qr, kb, res, ctx, detalle) {
  const pg = new Doc(doc, font, logo, { titulo: "Ficha para el entrenador", subtitulo: "Lo que debe saber quien dirige las sesiones", tipo: "Para entrenador o fisioterapeuta", numero: numeroDocumento(res, ctx), version: ctx.appVersion, qr });
  const lim = (arr) => arr[detalle];
  pg.prescriptor(ctx.prescriptor, ctx.prescrito);
  pg.parrafo("Esta ficha resume lo que el profesional del ejercicio debe tener en cuenta por la medicación de la persona. No incluye el diagnóstico ni los nombres de todos los fármacos: solo los efectos que pueden aparecer durante la sesión y cómo actuar. Ante cualquier duda, consulte con el médico prescriptor.", { size: 8.8, color: C.muted });
  const cond = ctx.condiciones || new Set();
  const fragTxt = { fragil: "Frágil", prefragil: "Prefrágil", robusto: "Robusto" }[ctx.fragilidad] || "—";
  pg.banda([
    { k: "Edad", v: ctx.edad ? `${ctx.edad} años` : "—" },
    { k: "Caídas último año", v: ctx.caidas ? "Sí" : "No", nivel: ctx.caidas ? "precaucion" : null },
    { k: "Capacidad funcional", v: fragTxt + (ctx.sppb != null ? ` · SPPB ${ctx.sppb}` : ""), nivel: ctx.fragilidad === "fragil" ? "alerta" : ctx.fragilidad === "prefragil" ? "precaucion" : null },
    { k: "Techo de intensidad", v: ctx.zona?.techo === "moderada" ? "Moderada" : "Vigorosa si tolera", nivel: ctx.zona?.techo === "moderada" ? "precaucion" : null },
    { k: "Pulso como guía", v: ctx.zona?.metodo === "fc" ? "Válido" : "NO válido", nivel: ctx.zona?.metodo === "fc" ? null : "alerta" },
  ]);
  if (ctx.cribado && CRIBADO_PDF[ctx.cribado.clave]) { const [niv, txt] = CRIBADO_PDF[ctx.cribado.clave]; pg.tarjeta({ nivel: niv, titulo: "Cribado previo a la participación", texto: txt.replace("Cribado ACSM: ", "").replace(/^./, (c) => c.toUpperCase()) }); }
  const P = prescripcion(res, ctx);
  pg.seccion("Prescripción (FITT)", "pauta de partida; progresar primero volumen y después intensidad");
  pg.tabla(
    [{ t: "Modalidad", w: .13 }, { t: "Frecuencia", w: .17 }, { t: "Intensidad", w: .28 }, { t: "Tiempo", w: .16 }, { t: "Tipo y observaciones", w: .26 }],
    [[{ t: "Aeróbico", bold: true }, P.aer.frec, P.aer.int, P.aer.tiempo, P.aer.tipo], [{ t: "Fuerza", bold: true }, P.fue.frec, P.fue.int, P.fue.tiempo, P.fue.tipo], [{ t: "Equilibrio", bold: true }, P.eq.frec, P.eq.int, P.eq.tiempo, P.eq.tipo]],
    { size: 8 }
  );
  seccionZona(pg, ctx, { barra: true });
  const { evite, cuidado } = listasPaciente(res, ctx);
  const puede = ["Trabajo aeróbico continuo o en intervalos suaves.", "Fuerza con máquinas, bandas o peso libre, técnica antes que carga.", "Equilibrio, movilidad y doble tarea."];
  pg.columnasSemaforo([
    { nivel: "info", titulo: "Puede hacer", items: puede },
    { nivel: "precaucion", titulo: "Con cuidado", items: cuidado.length ? cuidado.slice(0, 6) : ["Progresión gradual estándar."] },
    { nivel: "alerta", titulo: "Evitar", items: evite.length ? evite.slice(0, 6) : ["Nada específico por la medicación."] },
  ]);
  const mec = mecanismosDe(res, { max: detalle ? 6 : 3, nombres: false });
  if (mec.length) { pg.seccion("Lo que la medicación cambia en la sesión", "qué vigilar y cómo actuar"); pg.mecanismos(mec); }
  // efectos por fármaco relevantes en sesión (sin dosis ni grupo terapéutico)
  const filas = res.items.map((it) => ({ it, s: [...it.senales].map((s) => SENAL_CORTA[s]).filter(Boolean), reglas: ["aerobico", "fuerza", "equilibrio"].flatMap((amb) => (res.ambitos[amb].find((g) => g.item === it)?.reglas || []).filter((r) => r.nivel === "alerta").map((r) => r.texto)) })).filter((x) => x.s.length || x.reglas.length);
  if (filas.length) {
    pg.seccion("Qué puede notar en la sesión", "por cada medicamento; el nombre lo decide el paciente compartirlo");
    pg.tabla([{ t: "Medicamento", w: .26 }, { t: "Efectos a vigilar", w: .34 }, { t: "Atención en la sesión", w: .4 }], filas.map((x) => [{ t: x.it.principio.nombre, bold: true }, x.s.join(", ") || "—", corta(x.reglas.join(" "), lim([140, 200, 300, 2000])) || "—"]), { size: 7.8 });
  }
  const comb = res.combinadas.filter((c) => c.regla.nivel !== "info");
  if (comb.length) { pg.seccion("Por la combinación de medicación y situación"); for (const c of comb.slice(0, lim([2, 3, 4, 6]))) pg.tarjeta({ nivel: c.regla.nivel, titulo: c.regla.titulo, texto: corta(c.texto, lim([160, 220, 300, 2000])), size: 8.4 }); }
  if (detalle && ctx.ventana && (ctx.ventana.motivos.length || ctx.ventana.avisos.length)) seccionCuando(pg, ctx);
  pg.seccion("Pare la sesión y avise si aparece…");
  for (const a of ALARMA) pg.vineta("alerta", a, { size: 8.6 });
  pg.parrafo("Dolor torácico, disnea desproporcionada, síncope o palpitaciones que no ceden en pocos minutos: 112. Hipoglucemia sospechada (sudor frío, temblor, confusión): glucosa y azúcar de absorción rápida.", { size: 8, color: C.muted });
  pg.parrafo(kb.aviso, { size: 7.5, color: C.muted });
  pg.firma(ctx.prescriptor, ctx.prescrito);
  pg.pie();
}

/* ---------- TARJETA PARA LA NEVERA (A5, una cara) ---------- */
export async function pdfTarjeta(kb, res, ctx) {
  const doc = new (await jspdf()).jsPDF({ unit: "mm", format: "a5", orientation: "portrait", compress: true });
  const font = await prepararFuentes(doc);
  const logo = await dataUrl("assets/logo-pdf.png");
  const d = doc, W = 148, H = 210, ml = 9, w = W - 2 * ml;
  try { doc.setProperties({ title: `Mi plan de ejercicio · ${NOMBRE}`, author: AUTOR, creator: `${NOMBRE} v${ctx.appVersion || ""}` }); doc.setLanguage("es-ES"); } catch {}
  const f = (style, size, color = C.ink) => { const st = style === "black" && font === "helvetica" ? "bold" : style; d.setFont(font, st); d.setFontSize(size); d.setTextColor(...color); };
  // cabecera
  d.setFillColor(...C.purpleSoft); d.rect(0, 0, W, 22, "F"); d.setFillColor(...C.purple); d.rect(0, 22, W, 1, "F");
  if (logo) { try { d.addImage(logo, "PNG", ml, 3, 16, 16); } catch {} }
  f("black", 15, C.purpleDeep); d.text("Mi plan de ejercicio", ml + 20, 10.5);
  f("normal", 8, C.muted); d.text(`${NOMBRE} · ${new Date().toLocaleDateString("es-ES")}${ctx.prescriptor?.nombre ? " · " + ctx.prescriptor.nombre : ""}`, ml + 20, 16.5);
  let y = 31;
  const titulo = (t) => { f("black", 11.5, C.ink); d.text(t, ml, y); y += 1.8; d.setDrawColor(...C.purple); d.setLineWidth(.7); d.line(ml, y, ml + 11, y); y += 5; };
  const linea = (t, nivel, size = 9.4) => { f("normal", size, C.ink); const ls = d.splitTextToSize(t, w - 6); d.setFillColor(...(C[nivel] || C.muted)); d.circle(ml + 1.4, y - 1.2, 1.15, "F"); for (const l of ls) { d.text(l, ml + 5, y); y += size * 0.47; } y += 1.2; };
  // semana
  const fragil = (ctx.condiciones || new Set()).has("fragil") || (ctx.condiciones || new Set()).has("nyha34");
  const plan = ctx.plan ? planSemana(ctx.plan.dias) : PLAN_SEMANA;
  const nDias = Object.values(plan).filter((t) => t !== "descanso").length;
  const nombres = { fuerza_eq: "Fuerza y equilibrio", aerobico: "Caminar / bici", fuerza: "Fuerza", descanso: "Descanso" };
  const dias = [["L", 1], ["M", 2], ["X", 3], ["J", 4], ["V", 5], ["S", 6], ["D", 0]];
  titulo("Mi semana");
  const cw = w / 7, ch = 23;
  const ICO = { aerobico: ["caminar", C.info], fuerza: ["pesa", C.purple], fuerza_eq: ["equilibrio", C.purpleDeep], descanso: ["descanso", C.muted] };
  dias.forEach(([lab, n], i) => {
    const tipo = plan[n], x = ml + i * cw;
    const col = tipo === "descanso" ? C.soft : tipo === "aerobico" ? C.infoSoft : C.purpleSoft;
    d.setFillColor(...col); d.roundedRect(x + 0.5, y, cw - 1, ch, 1.5, 1.5, "F");
    f("black", 10, C.ink); d.text(lab, x + cw / 2, y + 6, { align: "center" });
    { const [ico, rgb] = ICO[tipo] || ICO.descanso, u = icoPng(ico, rgb); if (u) { try { d.addImage(u, "PNG", x + cw / 2 - 2.8, y + 7.6, 5.6, 5.6, `ico-${ico}-${rgb.join("-")}`, "FAST"); } catch {} } }
    f("normal", 6, C.muted); for (const [k, l] of d.splitTextToSize(nombres[tipo], cw - 2.5).slice(0, 2).entries()) d.text(l, x + cw / 2, y + 16.4 + k * 3.1, { align: "center" });
  });
  y += ch + 4;
  const P = prescripcion(res, ctx);
  linea(fragil ? "Sesiones cortas (5–10 minutos), varias veces al día si hace falta." : `Objetivo: unos ${nDias >= 5 ? 150 : nDias * 30} minutos a la semana repartidos en ${nDias} días. Empiezo con 10–20 minutos y subo poco a poco.`, "info");
  linea(`Fuerza: ${P.fue.frec.replace(/\s*\(.*?\)/, "").toLowerCase()}, 20–40 minutos (levantarme de la silla, subir escalones, empujar y tirar).`, "info");
  linea(`Equilibrio: ${P.eq.frec.replace(/\s*\(.*?\)/, "").toLowerCase()}, 10–15 minutos, con un apoyo cerca.`, "info");
  y += 1.5;
  // ritmo
  const z = ctx.zona;
  if (z) {
    titulo("Mi ritmo");
    if (z.metodo === "fc") { linea(`Moderado: ${z.zonas.moderada[0]}–${z.zonas.moderada[1]} pulsaciones por minuto (puedo hablar, pero no cantar).`, "precaucion"); if (z.limiteDai) linea(`Nunca por encima de ${z.limiteDai} pulsaciones (DAI).`, "alerta"); }
    else linea("Mi pulso no sirve de guía: voy a un ritmo en el que puedo hablar pero no cantar.", "precaucion");
    if (z.techo === "moderada") linea("Me quedo en intensidad ligera-moderada; nada de esfuerzos máximos.", "precaucion");
    y += 1.5;
  }
  // esencial
  const esencial = loEsencial(res, 4);
  if (esencial.length) { titulo("Lo esencial con mi medicación"); for (const a of esencial) linea(a.titulo + ": " + a.texto, a.nivel, 8.6); y += 1.5; }
  // alarma
  const yPie = H - 26;
  if (y < yPie - 22) {
    titulo("Paro y consulto si noto");
    for (const a of ALARMA.slice(0, 4)) { if (y > yPie - 12) break; linea(a, "alerta", 8.6); }
    if (y <= yPie - 6) linea("Si no cede en pocos minutos: 112.", "alerta", 8.6);
  }
  if (ctx.ventana?.mejores?.length && y < yPie - 8) { y += 1; f("bold", 9, C.ink); d.text("Mejor momento para entrenar: " + ctx.ventana.mejores.map((x) => `${hh(x.desde)}–${hh(x.hasta)}`).join(" y "), ml, y); y += 5; }
  // pie con QR
  const qr = await qrPng(ctx.enlace);
  d.setDrawColor(...C.line); d.setLineWidth(.3); d.line(ml, yPie - 2, W - ml, yPie - 2);
  if (qr) { try { d.addImage(qr, "PNG", W - ml - 18, yPie - 1, 18, 18); } catch {} }
  f("normal", 6.8, C.muted);
  const pie = [`${NOMBRE} · ${WEB}${ctx.appVersion ? " · v" + ctx.appVersion : ""}`, "Información general: no sustituye el consejo de su médico ni cambia ningún tratamiento.", ctx.prescrito ? "Reevaluar: " + (() => { const f1 = new Date(ctx.prescrito.fecha); f1.setDate(f1.getDate() + ctx.prescrito.semanas * 7); return f1.toLocaleDateString("es-ES"); })() : null].filter(Boolean);
  pie.forEach((l, i) => d.text(d.splitTextToSize(l, w - 22)[0], ml, yPie + 3 + i * 3.8));
  if (qr) d.text("Abrir mi plan", W - ml - 9, yPie + 20.5, { align: "center" });
  return doc;
}

/** Texto plano para pegar en la historia clínica o el informe de alta (modo profesional). */
