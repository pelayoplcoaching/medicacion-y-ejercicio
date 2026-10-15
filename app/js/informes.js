/* Resúmenes en PDF (jsPDF, global window.jspdf).
   Dos documentos: "Informe clínico" para el médico y "Su plan" para el paciente.
   Sistema de maquetación propio: cabecera, bandas, tablas con zebra, tarjetas con acento, pastillas de nivel. */
import { ORDEN_NIVEL, ORDEN_DDI } from "./engine.js?v=202610150856";

const AUTOR = "Dr. Pelayo Fdez. Cidón · Medicina Interna · prescriptor de ejercicio físico";
const MARCA = "Fuerza Basada en Evidencia";
const WEB = "medicacionyejercicio.fuerzabasadaenevidencia.com";

const C = {
  ink: [28, 24, 48], muted: [104, 96, 127], line: [222, 218, 236], soft: [245, 243, 250], white: [255, 255, 255],
  purple: [107, 53, 196], purpleDeep: [74, 32, 152], purpleSoft: [239, 232, 251],
  alerta: [192, 39, 29], alertaSoft: [253, 236, 235], alertaInk: [143, 26, 18],
  precaucion: [179, 100, 0], precaucionSoft: [255, 241, 221], precaucionInk: [122, 67, 0],
  info: [29, 122, 77], infoSoft: [227, 244, 234], infoInk: [20, 86, 55],
  mayor: [192, 39, 29], mayorSoft: [253, 236, 235], mayorInk: [143, 26, 18],
  moderada: [179, 100, 0], moderadaSoft: [255, 241, 221], moderadaInk: [122, 67, 0],
  menor: [104, 96, 127], menorSoft: [245, 243, 250], menorInk: [104, 96, 127],
};
const NIVEL_TXT = { alerta: "Atención", precaucion: "Precaución", info: "Para saber", mayor: "Mayor", moderada: "Moderada", menor: "Menor" };

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
  constructor(doc, font, logo, { titulo, subtitulo, tipo }) {
    this.d = doc; this.font = font; this.logo = logo;
    this.titulo = titulo; this.subtitulo = subtitulo; this.tipo = tipo;
    this.ml = 16; this.w = 210 - 32; this.bottom = 297 - 18; this.y = 0;
    this.cabecera();
  }
  f(style = "normal", size = 9.5, color = C.ink) {
    const st = style === "black" && this.font === "helvetica" ? "bold" : style;
    this.d.setFont(this.font, st); this.d.setFontSize(size); this.d.setTextColor(...color);
  }
  lh(size) { return size * 0.46; }
  cabecera() {
    const d = this.d;
    d.setFillColor(...C.soft); d.rect(0, 0, 210, 26, "F");
    d.setFillColor(...C.purple); d.rect(0, 26, 210, 1.2, "F");
    if (this.logo) { try { d.addImage(this.logo, "PNG", this.ml, 3, 20, 20); } catch {} }
    const x = this.ml + (this.logo ? 25 : 0);
    this.f("black", 15, C.purpleDeep); d.text(this.titulo, x, 11.5);
    this.f("normal", 8.5, C.muted); d.text(this.subtitulo, x, 17);
    d.text(`Medicación y Ejercicio · ${WEB}`, x, 22);
    this.f("bold", 8, C.muted); d.text(new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }), 210 - this.ml, 11.5, { align: "right" });
    this.f("normal", 7.5, C.muted); d.text(this.tipo, 210 - this.ml, 17, { align: "right" });
    this.y = 35;
  }
  pie() {
    const d = this.d, n = d.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      d.setDrawColor(...C.line); d.setLineWidth(.3); d.line(this.ml, 283, 210 - this.ml, 283);
      this.f("normal", 7, C.muted);
      d.text(`${AUTOR} · ${MARCA}`, this.ml, 288);
      d.text(`${i} / ${n}`, 210 - this.ml, 288, { align: "right" });
    }
  }
  salto(h) { if (this.y + h > this.bottom) { this.d.addPage(); this.cabecera(); return true; } return false; }

  seccion(titulo, nota) {
    this.salto(16); this.y += 5;
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
    const altoFila = (row) => Math.max(...row.map((c, i) => { this.f("normal", size); return d.splitTextToSize(celdaTxt(c), ws[i] - 2 * pad).length * lh; })) + 2 * pad;
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
    const d = this.d, gap = 4, n = bloques.length, wi = (this.w - gap * (n - 1)) / n, pad = 3.5, size = 8.6;
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
}

/* ---------- lógica de prescripción derivada del perfil ---------- */
const AMBITOS = [["general", "Antes de empezar"], ["aerobico", "Ejercicio aeróbico"], ["fuerza", "Entrenamiento de fuerza"], ["equilibrio", "Equilibrio"]];
const num = (x) => Number(x).toLocaleString("es-ES", { maximumFractionDigits: 3 });
function dosisTxt(it) {
  if (it.dosisTotal == null) return "dosis no indicada";
  const base = it.esDiaria && it.tomas > 1 ? `${num(it.dosisPorToma)} ${it.unidad} × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día` : `${num(it.dosisTotal)} ${it.unidad}${it.esDiaria ? "/día" : ""}`;
  return base + (it.aDemanda ? " (si precisa)" : "") + (it.dosisCat === "alta" ? " · dosis alta" : "");
}
const tiene = (res, s) => !!res.perfil[s]?.length;
const cuenta = (res, s) => res.perfil[s]?.length || 0;

function prescripcion(res, ctx) {
  const mayor = ctx.edad != null && ctx.edad >= 65;
  const fcNoValida = tiene(res, "fc_no_valida") || tiene(res, "bradicardia") || tiene(res, "taquicardia");
  const hipo = tiene(res, "hipoglucemia");
  const hipot = cuenta(res, "hipotension");
  const caidas = cuenta(res, "caidas") + (ctx.caidas ? 1 : 0) + (mayor ? 1 : 0);
  const sangra = tiene(res, "sangrado");
  const musc = tiene(res, "perdida_muscular") || tiene(res, "hueso");
  const tendon = tiene(res, "tendon");
  const miop = tiene(res, "miopatia");
  const calor = tiene(res, "calor") || tiene(res, "deshidratacion");
  const sed = tiene(res, "sedacion");
  const cond = ctx.condiciones || new Set();
  const fragil = cond.has("fragil"), prefragil = cond.has("prefragil");
  const nyha34 = cond.has("nyha34"), feviBaja = cond.has("fevi_baja");
  const dai = ctx.daiFc ? ` Con DAI programado a ${ctx.daiFc} lpm: mantener FC < ${ctx.daiFc - 20} lpm.` : "";
  return {
    aer: {
      frec: fragil || nyha34 ? "Diario, en varias sesiones cortas" : "5 días/semana (mín. 3)",
      int: (fcNoValida ? "Moderada por RPE 11–14 (Borg 6–20) o prueba del habla. No usar %FCmáx ni zonas de pulso." : feviBaja || nyha34 ? "Ligera-moderada: RPE 10–13; sin esfuerzos máximos ni intervalos de alta intensidad salvo en programa supervisado." : "Moderada: 40–60 % FC de reserva o RPE 11–14; progresar a vigorosa si tolera.") + dai,
      tiempo: fragil ? "Marcha 5–10 min, 2–3 veces al día; aumentar 1–2 min cada pocos días hasta 30 min" : nyha34 ? "5–10 min, 2–4 veces al día; progresar a 20–30 min continuos" : "150–300 min/semana; empezar con 10–20 min y aumentar 5–10 min/semana",
      tipo: ["Caminar, bici estática, elíptica, natación" + (sangra ? " (sin contacto ni riesgo de caída a velocidad)" : "") + ".", hipot >= 2 ? "Enfriamiento ≥10 min; evitar paradas bruscas y cambios posturales rápidos." : "Enfriamiento 5–10 min.", calor ? "Evitar calor; electrolitos en sesiones >60 min." : "", hipo ? "Glucemia capilar pre/post; HC de absorción rápida disponibles." : ""].filter(Boolean).join(" "),
    },
    fue: {
      frec: fragil || prefragil || musc ? "2–3 días/semana (prioritario)" : "2–3 días/semana no consecutivos",
      int: fragil ? "Programa multicomponente tipo Vivifrail A–B: sentarse-levantarse, elevaciones de talón, bandas elásticas; 1–2 series de 8–12 rep, RPE 4–6/10, progresión semanal." : tendon ? "Cargas ligeras, sin trabajo explosivo ni excéntrico intenso durante el tratamiento y 4 semanas después." : miop ? "Progresión lenta (ajustes cada 2–3 semanas); evitar fallo muscular y excéntricos intensos las primeras semanas." : "8–15 repeticiones, 2–3 series, RPE 5–7/10; progresar cuando complete las repeticiones con técnica.",
      tiempo: "20–40 min por sesión",
      tipo: ["Grandes grupos musculares (sentadilla/levantarse de silla, empuje, tracción, bisagra de cadera).", "Respiración continua, sin Valsalva.", hipo ? "Fuerza antes del aeróbico en la misma sesión." : "", sangra ? "Máquinas o pesos ligeros al inicio; evitar golpes." : ""].filter(Boolean).join(" "),
    },
    eq: {
      frec: caidas >= 2 || fragil ? "3 días/semana (prioritario)" : "2–3 días/semana",
      int: caidas >= 2 || sed || fragil ? "Con apoyo (pared, silla, barandilla) y supervisión inicial." : "Progresar de apoyo bipodal a unipodal y doble tarea.",
      tiempo: "10–15 min (integrable en las sesiones de fuerza)",
      tipo: ["Transferencias sentado-de pie, marcha en tándem, apoyo monopodal, giros, tai chi.", sangra ? "Prevención de caídas prioritaria por el anticoagulante." : "", hipot >= 2 ? "Transiciones de posición lentas." : ""].filter(Boolean).join(" "),
    },
  };
}

const SENAL_CORTA = { hipotension: "↓TA", bradicardia: "↓FC", fc_no_valida: "FC no válida", hipoglucemia: "hipoglucemia", enmascara_hipoglucemia: "enmascara hipogluc.", deshidratacion: "deshidratación", hiperpotasemia: "↑K", hipopotasemia: "↓K", hiponatremia: "↓Na", renal: "riesgo renal", sedacion: "sedación", anticolinergico: "anticolinérgico", caidas: "caídas", sangrado: "sangrado", miopatia: "miopatía", tendon: "tendón", qt: "QT", calor: "termorregulación", taquicardia: "↑FC", perdida_muscular: "sarcopenia", hueso: "hueso", trombosis: "TEV", inmunosupresion: "inmunosupresión", fatiga: "fatiga", hipertension: "↑TA", fotosensibilidad: "fotosensibilidad", litio: "litio" };

/* ---------- INFORME CLÍNICO (médico) ---------- */
export async function pdfMedico(kb, res, ctx) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
  const font = await prepararFuentes(doc);
  const logo = await dataUrl("assets/logo.png");
  const pg = new Doc(doc, font, logo, { titulo: "Informe clínico: medicación y ejercicio", subtitulo: "Prescripción de ejercicio adaptada al tratamiento farmacológico", tipo: "Documento para el profesional sanitario" });

  const nAlerta = res.resumen.alerta, nPrec = res.resumen.precaucion, nDDI = res.interacciones.filter((x) => x.nivel !== "menor").length;
  const condTxt = { diabetes: "diabetes", insuficiencia_cardiaca: "insuficiencia cardíaca", renal: "ERC", renal_grave: "FG < 30", marcapasos: "marcapasos/DAI", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "oxígeno domiciliario", embarazo: "embarazo/lactancia", nyha34: "NYHA III–IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad" };
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

  const claves = [];
  for (const c of res.combinadas) if (c.regla.nivel === "alerta") claves.push({ nivel: "alerta", titulo: c.regla.titulo, texto: c.texto, pie: "Implicados: " + c.implicados.map((i) => i.principio.nombre).join(", ") });
  for (const x of res.interacciones) if (x.nivel === "mayor") claves.push({ nivel: "alerta", titulo: `Interacción mayor: ${x.a.principio.nombre} + ${x.b.principio.nombre}`, texto: `${x.efecto} ${x.accion ? "Manejo: " + x.accion : ""}`.trim() });
  for (const [amb, titulo] of AMBITOS) for (const g of res.ambitos[amb]) for (const r of g.reglas) if (r.nivel === "alerta") claves.push({ nivel: "alerta", titulo: `${g.item.principio.nombre} · ${titulo}`, texto: r.texto });
  for (const c of res.combinadas) if (c.regla.nivel === "precaucion" && claves.length < 8) claves.push({ nivel: "precaucion", titulo: c.regla.titulo, texto: c.texto });
  if (claves.length) {
    pg.seccion("Puntos clave", `${Math.min(claves.length, 10)} elementos que condicionan la prescripción`);
    for (const k of claves.slice(0, 10)) pg.tarjeta(k);
  }

  pg.seccion("Medicación referida por el paciente", "dosis diaria estimada y efectos relevantes para el ejercicio");
  pg.tabla(
    [{ t: "Fármaco", w: .25 }, { t: "Dosis", w: .21 }, { t: "Grupo", w: .24 }, { t: "Efectos a vigilar", w: .3 }],
    res.items.map((it) => [{ t: it.principio.nombre, bold: true }, dosisTxt(it), it.clase.nombre.replace(/\s*\(.*?\)\s*/g, ""), [...it.senales].map((s) => SENAL_CORTA[s]).filter(Boolean).join(", ") || "—"]),
    { size: 8 }
  );

  pg.seccion("Interacciones fármaco–fármaco", res.interacciones.length ? `${res.interacciones.length} detectadas` : "ninguna relevante en las bases consultadas");
  if (res.interacciones.length) {
    pg.tabla(
      [{ t: "Combinación", w: .26 }, { t: "Nivel", w: .11 }, { t: "Efecto", w: .33 }, { t: "Manejo", w: .3 }],
      res.interacciones.map((x) => [{ t: `${x.a.principio.nombre} + ${x.b.principio.nombre}`, bold: true }, { t: NIVEL_TXT[x.nivel], nivel: x.nivel }, x.efecto, x.accion || "—"]),
      { size: 7.8 }
    );
  }

  const perfil = Object.entries(res.perfil).filter(([s]) => kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s) && res.perfil[s].length >= 2).sort((a, b) => b[1].length - a[1].length);
  if (perfil.length) {
    pg.seccion("Efectos acumulados", "señales presentes en dos o más fármacos");
    pg.tabla([{ t: "Efecto", w: .5 }, { t: "N", w: .06, align: "right" }, { t: "Fármacos", w: .44 }], perfil.map(([s, its]) => [kb.senales[s], String(its.length), its.map((i) => i.principio.nombre).join(", ")]), { size: 8 });
  }

  const porFarmaco = res.items.map((it) => ({ it, puntos: AMBITOS.flatMap(([amb, titulo]) => (res.ambitos[amb].find((g) => g.item === it)?.reglas || []).filter((r) => r.nivel !== "info").map((r) => ({ amb: titulo, ...r }))) })).filter((x) => x.puntos.length);
  if (porFarmaco.length) {
    pg.seccion("Consideraciones por fármaco", "solo precaución y atención; el detalle informativo está en el documento del paciente");
    for (const { it, puntos } of porFarmaco) {
      pg.salto(12);
      pg.f("bold", 9.5, C.ink); pg.d.text(it.principio.nombre, pg.ml, pg.y);
      const wN = pg.d.getTextWidth(it.principio.nombre);
      pg.f("normal", 8, C.muted); pg.d.text(dosisTxt(it), pg.ml + wN + 3, pg.y);
      pg.y += 5;
      for (const r of puntos.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel])) pg.vineta(r.nivel, `[${r.amb}] ${r.texto}`, { size: 8.3, indent: 2 });
      pg.y += 1.5;
    }
  }

  pg.seccion("Fuentes y alcance");
  pg.parrafo("ACSM Guidelines for Exercise Testing and Prescription (11.ª ed., Apéndice A); OMS 2020 Physical activity guidelines; ADA Standards of Care; criterios Beers 2023 y STOPP/START v3; fichas técnicas AEMPS; DDInter 2.0 (CC BY-NC-SA 4.0) y revisión propia de interacciones. " + kb.aviso, { size: 7.5, color: C.muted });
  pg.pie();
  return doc;
}

/* ---------- SU PLAN (paciente) ---------- */
export async function pdfPaciente(kb, res, ctx) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4", compress: true });
  const font = await prepararFuentes(doc);
  const logo = await dataUrl("assets/logo.png");
  const pg = new Doc(doc, font, logo, { titulo: "Su medicación y el ejercicio", subtitulo: "Un plan sencillo para entrenar con seguridad con su tratamiento", tipo: "Documento para el paciente" });

  pg.parrafo("Este plan se ha preparado a partir de la medicación que usted ha introducido. Es información general para ayudarle a moverse con seguridad y a hablar con su médico; no sustituye a su consejo ni cambia ningún tratamiento.", { size: 9, color: C.muted });

  const P = prescripcion(res, ctx);
  const evite = [];
  if (tiene(res, "sangrado")) evite.push("Deportes de contacto o con riesgo de golpes y caídas a velocidad.");
  if (tiene(res, "tendon")) evite.push("Saltos, carrera intensa y cargas máximas durante el tratamiento y el mes siguiente.");
  if (cuenta(res, "hipotension") >= 2) evite.push("Parar de golpe tras el esfuerzo y las duchas muy calientes justo después.");
  if (tiene(res, "calor") || tiene(res, "deshidratacion")) evite.push("Entrenar con calor intenso o sin agua a mano.");
  if (tiene(res, "sedacion")) evite.push("Entrenar en las horas siguientes a una toma que da sueño.");
  if (tiene(res, "renal") || tiene(res, "sangrado") || tiene(res, "litio")) evite.push("Antiinflamatorios (ibuprofeno, naproxeno) para las agujetas: use paracetamol.");
  if (tiene(res, "fc_no_valida") || tiene(res, "bradicardia")) evite.push("Guiarse por el pulso del reloj para medir la intensidad.");
  if (!evite.length) evite.push("No hay actividades que deba evitar por su medicación; progrese poco a poco.");
  const cuidado = [];
  if (tiene(res, "hipoglucemia")) cuidado.push("Mida la glucosa antes y después y lleve azúcar.");
  if (cuenta(res, "hipotension") >= 1) cuidado.push("Levántese despacio y termine cada sesión con 5–10 minutos suaves.");
  if (tiene(res, "caidas") || ctx.caidas || ctx.edad >= 65) cuidado.push("Haga el equilibrio con un apoyo cerca.");
  if (tiene(res, "miopatia")) cuidado.push("Dolor muscular que no encaja con lo entrenado: consulte.");
  if (tiene(res, "hiperpotasemia")) cuidado.push("Sin suplementos ni bebidas 'ricas en potasio'.");
  if (tiene(res, "deshidratacion") || tiene(res, "litio")) cuidado.push("Beba agua con sales en sesiones largas.");
  if (!cuidado.length) cuidado.push("Empiece suave y aumente cada semana un poco.");
  const puede = [
    "Caminar a un paso que le permita hablar, casi todos los días.",
    "Ejercicios de fuerza 2–3 días por semana (levantarse de la silla, subir escalones, empujar y tirar).",
    "Ejercicios de equilibrio 2–3 días por semana.",
  ];
  pg.columnasSemaforo([
    { nivel: "info", titulo: "Puede hacer", items: puede },
    { nivel: "precaucion", titulo: "Con cuidado", items: cuidado.slice(0, 5) },
    { nivel: "alerta", titulo: "Evite", items: evite.slice(0, 5) },
  ]);

  pg.seccion("Su plan semanal");
  const fcTxt = tiene(res, "fc_no_valida") || tiene(res, "bradicardia") ? "A un ritmo que le permita hablar con frases cortas (no mire el pulso). " : "A un ritmo que le permita hablar con frases cortas. ";
  pg.tabla(
    [{ t: "", w: .15 }, { t: "Cuántas veces", w: .2 }, { t: "Cuánto", w: .22 }, { t: "Cómo", w: .43 }],
    [
      [{ t: "Aeróbico", bold: true }, "5 días por semana (mínimo 3)", "Empiece con 10–20 min y suba poco a poco hasta 30–45", fcTxt + "Termine siempre despacio."],
      [{ t: "Fuerza", bold: true }, "2–3 días, no seguidos", "20–40 min", "8–15 repeticiones de cada ejercicio, 2–3 vueltas. Respire siempre; nunca aguante el aire. Suba la carga cuando le resulte fácil."],
      [{ t: "Equilibrio", bold: true }, P.eq.frec.replace(/\s*\(.*?\)/, ""), "10–15 min", P.eq.int + " Apoyo sobre un pie, caminar talón-punta, levantarse sin manos."],
    ],
    { size: 8.5 }
  );

  const alertas = [];
  for (const c of res.combinadas) if (c.regla.nivel === "alerta") alertas.push({ titulo: c.regla.titulo, texto: c.texto });
  for (const [amb] of AMBITOS) for (const g of res.ambitos[amb]) for (const r of g.reglas) if (r.nivel === "alerta") alertas.push({ titulo: g.item.principio.nombre, texto: r.texto });
  const vistos = new Set();
  const unicas = alertas.filter((a) => { const k = a.titulo + a.texto; if (vistos.has(k)) return false; vistos.add(k); return true; });
  if (unicas.length) {
    pg.seccion("Lo más importante", `${unicas.length} puntos`);
    for (const a of unicas) pg.tarjeta({ nivel: "alerta", titulo: a.titulo, texto: a.texto });
  }

  pg.seccion("Su medicación", "y lo esencial de cada una para el ejercicio");
  pg.tabla(
    [{ t: "Medicamento", w: .24 }, { t: "Dosis", w: .21 }, { t: "Lo esencial", w: .55 }],
    res.items.map((it) => [{ t: it.principio.nombre, bold: true }, dosisTxt(it).replace(" · dosis alta", " (dosis alta)"), it.clase.resumen]),
    { size: 8.3 }
  );

  for (const [amb, titulo] of AMBITOS) {
    const grupos = res.ambitos[amb].map((g) => ({ it: g.item, reglas: g.reglas.filter((r) => r.nivel !== "alerta") })).filter((g) => g.reglas.length);
    const comb = res.combinadas.filter((c) => (c.regla.ambitos || []).includes(amb) && c.regla.nivel !== "alerta");
    if (!grupos.length && !comb.length) continue;
    pg.seccion(titulo);
    for (const c of comb) pg.tarjeta({ nivel: c.regla.nivel, titulo: c.regla.titulo, texto: c.texto, size: 8.6 });
    for (const g of grupos.sort((a, b) => Math.max(...b.reglas.map((r) => ORDEN_NIVEL[r.nivel])) - Math.max(...a.reglas.map((r) => ORDEN_NIVEL[r.nivel])))) {
      pg.salto(10); pg.f("bold", 9.3, C.ink); pg.d.text(g.it.principio.nombre, pg.ml, pg.y); pg.y += 4.5;
      for (const r of g.reglas.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel])) pg.vineta(r.nivel, r.texto, { size: 8.6, indent: 2 });
      pg.y += 1;
    }
  }

  const ddi = res.interacciones.filter((x) => ORDEN_DDI[x.nivel] >= 2);
  if (ddi.length) {
    pg.seccion("Medicamentos que se afectan entre sí");
    pg.parrafo("No significa que la combinación sea incorrecta (muchas veces es necesaria), sino que conviene conocerla y que su médico la tenga en cuenta.", { size: 8.3, color: C.muted });
    pg.tabla([{ t: "Combinación", w: .3 }, { t: "Qué puede pasar", w: .38 }, { t: "Qué hacer", w: .32 }], ddi.map((x) => [{ t: `${x.a.principio.nombre} + ${x.b.principio.nombre}`, bold: true }, x.efecto, x.accion || "—"]), { size: 8 });
  }

  pg.seccion("Cuándo parar y consultar");
  for (const t of [
    "Dolor o presión en el pecho, falta de aire desproporcionada, mareo intenso o desmayo: pare y busque ayuda (112 si no cede).",
    "Palpitaciones fuertes o irregulares que no se calman al parar.",
    tiene(res, "hipoglucemia") ? "Sudor frío, temblor o confusión: mida la glucosa y tome azúcar." : null,
    "Dolor muscular generalizado, debilidad u orina oscura en los días siguientes.",
    tiene(res, "sangrado") ? "Cualquier golpe en la cabeza, aunque se encuentre bien." : null,
  ].filter(Boolean)) pg.vineta("alerta", t, { size: 8.8 });
  pg.parrafo(kb.aviso, { size: 7.5, color: C.muted });
  pg.pie();
  return doc;
}
