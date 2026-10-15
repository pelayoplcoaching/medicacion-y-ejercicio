/* Generación de resúmenes en PDF (jsPDF cargado como global desde CDN). */
import { ORDEN_NIVEL, ORDEN_DDI } from "./engine.js?v=202610150704";

const AUTOR = "By Pelayo Fdez. Cidón. Médico especialista en Medicina Interna y prescriptor de ejercicio físico";
const MARCA = "Fuerza Basada en Evidencia";
const PURPURA = [107, 53, 196];
const COLOR = { alerta: [180, 35, 28], precaucion: [168, 90, 7], info: [31, 111, 74], mayor: [180, 35, 28], moderada: [168, 90, 7], menor: [110, 100, 130] };

let logoCache = null;
async function logo() {
  if (logoCache !== null) return logoCache;
  try {
    const r = await fetch("assets/logo.png");
    const b = await r.blob();
    logoCache = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
  } catch { logoCache = false; }
  return logoCache;
}

class Pagina {
  constructor(doc, titulo, subtitulo, logoData) {
    this.doc = doc; this.titulo = titulo; this.subtitulo = subtitulo; this.logo = logoData;
    this.ml = 18; this.mr = 18; this.w = 210 - 36; this.y = 0; this.bottom = 297 - 22;
    this.cabecera();
  }
  cabecera() {
    const d = this.doc;
    d.setFillColor(...PURPURA); d.rect(0, 0, 210, 26, "F");
    if (this.logo) { try { d.addImage(this.logo, "PNG", this.ml, 3, 20, 20); } catch {} }
    d.setTextColor(255, 255, 255); d.setFont("helvetica", "bold"); d.setFontSize(15);
    d.text(this.titulo, this.ml + (this.logo ? 24 : 0), 11);
    d.setFont("helvetica", "normal"); d.setFontSize(9);
    d.text(this.subtitulo, this.ml + (this.logo ? 24 : 0), 17);
    d.text(`Medicación y Ejercicio · ${new Date().toLocaleDateString("es-ES")}`, this.ml + (this.logo ? 24 : 0), 22);
    d.setTextColor(31, 26, 45);
    this.y = 36;
  }
  pie() {
    const d = this.doc; const n = d.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      d.setPage(i); d.setFontSize(7.5); d.setTextColor(106, 98, 128); d.setFont("helvetica", "normal");
      d.text(`${AUTOR} · ${MARCA}`, this.ml, 290);
      d.text(`${i}/${n}`, 210 - this.mr, 290, { align: "right" });
    }
  }
  salto(h) { if (this.y + h > this.bottom) { this.doc.addPage(); this.cabecera(); } }
  h2(t) { this.salto(12); this.y += 4; const d = this.doc; d.setFont("helvetica", "bold"); d.setFontSize(12); d.setTextColor(...PURPURA); d.text(t, this.ml, this.y); this.y += 2; d.setDrawColor(...PURPURA); d.setLineWidth(.4); d.line(this.ml, this.y, this.ml + this.w, this.y); this.y += 6; d.setTextColor(31, 26, 45); }
  h3(t, sub) { this.salto(9); const d = this.doc; d.setFont("helvetica", "bold"); d.setFontSize(10.5); d.setTextColor(31, 26, 45); d.text(t, this.ml, this.y); if (sub) { const wt = d.getTextWidth(t); d.setFont("helvetica", "normal"); d.setFontSize(8.5); d.setTextColor(106, 98, 128); d.text(sub, this.ml + wt + 2, this.y); } this.y += 5.5; d.setTextColor(31, 26, 45); }
  p(t, { size = 9.5, indent = 0, color = null, bold = false } = {}) {
    const d = this.doc; d.setFont("helvetica", bold ? "bold" : "normal"); d.setFontSize(size); if (color) d.setTextColor(...color); else d.setTextColor(31, 26, 45);
    const lineas = d.splitTextToSize(t, this.w - indent); const lh = size * 0.42;
    for (const l of lineas) { this.salto(lh); d.text(l, this.ml + indent, this.y); this.y += lh; }
    this.y += 1.5; d.setTextColor(31, 26, 45);
  }
  etiqueta(nivel, texto, { size = 9.5 } = {}) {
    const d = this.doc; const col = COLOR[nivel] || [106, 98, 128];
    this.salto(size * 0.42);
    d.setFillColor(...col); d.circle(this.ml + 1.5, this.y - 1.2, 1.2, "F");
    d.setFont("helvetica", "normal"); d.setFontSize(size); d.setTextColor(31, 26, 45);
    const lineas = d.splitTextToSize(texto, this.w - 6); const lh = size * 0.42;
    for (const l of lineas) { this.salto(lh); d.text(l, this.ml + 5, this.y); this.y += lh; }
    this.y += 1.2;
  }
  nota(t) { this.y += 2; this.p(t, { size: 8, color: [106, 98, 128] }); }
}

function dosisTxt(it) {
  return it.dosisTotal != null ? `${it.dosisTotal} ${it.unidad}${it.esDiaria ? "/día" : ""}${it.dosisCat === "alta" ? " (dosis alta)" : ""}` : "dosis no indicada";
}
const AMBITOS = [["general", "Antes de empezar"], ["aerobico", "Ejercicio aeróbico"], ["fuerza", "Entrenamiento de fuerza"], ["equilibrio", "Equilibrio y prevención de caídas"]];

export async function pdfMedico(kb, res, ctx) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const pg = new Pagina(doc, "Resumen para el médico", "Medicación y ejercicio físico: puntos relevantes para la consulta", await logo());
  pg.p(`Paciente: ${ctx.edad ? ctx.edad + " años" : "edad no indicada"}${ctx.caidas ? " · caídas en el último año" : ""}. ${res.items.length} fármacos introducidos por el paciente. Documento generado automáticamente a partir de una base de conocimiento orientativa; requiere valoración clínica.`, { size: 9, color: [106, 98, 128] });

  pg.h2("Medicación referida");
  for (const it of res.items) pg.p(`• ${it.principio.nombre} — ${dosisTxt(it)}  [${it.clase.nombre}]`, { size: 9.5 });

  const perfil = Object.entries(res.perfil).filter(([s]) => kb.senales[s] && !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s)).sort((a, b) => b[1].length - a[1].length);
  if (perfil.length) {
    pg.h2("Efectos acumulados relevantes para el ejercicio");
    for (const [s, its] of perfil) pg.p(`• ${kb.senales[s]} (${its.length}): ${its.map((i) => i.principio.nombre).join(", ")}`, { size: 9 });
  }

  if (res.combinadas.length) {
    pg.h2("Avisos por combinación");
    for (const c of [...res.combinadas].sort((a, b) => ORDEN_NIVEL[b.regla.nivel] - ORDEN_NIVEL[a.regla.nivel])) {
      pg.h3(c.regla.titulo, kb.niveles[c.regla.nivel].etiqueta);
      pg.etiqueta(c.regla.nivel, `${c.texto} Fármacos implicados: ${c.implicados.map((i) => i.principio.nombre).join(", ")}.`, { size: 9 });
    }
  }

  pg.h2("Interacciones fármaco–fármaco");
  if (!res.interacciones.length) pg.p("No se han identificado interacciones relevantes en las bases consultadas.", { size: 9 });
  for (const x of res.interacciones) {
    pg.h3(`${x.a.principio.nombre} + ${x.b.principio.nombre}`, x.nivel.toUpperCase());
    pg.etiqueta(x.nivel, `${x.efecto} ${x.accion ? "Manejo: " + x.accion : ""}`.trim(), { size: 9 });
  }

  pg.h2("Consideraciones por fármaco (precaución y atención)");
  let alguna = false;
  for (const it of res.items) {
    const puntos = [];
    for (const [amb, titulo] of AMBITOS) {
      const g = res.ambitos[amb].find((x) => x.item === it);
      if (!g) continue;
      for (const r of g.reglas) if (r.nivel !== "info") puntos.push({ amb: titulo, ...r });
    }
    if (!puntos.length) continue;
    alguna = true;
    pg.h3(it.principio.nombre, dosisTxt(it));
    for (const r of puntos) pg.etiqueta(r.nivel, `[${r.amb}] ${r.texto}`, { size: 9 });
  }
  if (!alguna) pg.p("Sin precauciones específicas más allá de las indicaciones generales.", { size: 9 });

  pg.h2("Propuesta de prescripción");
  pg.p("Programa multicomponente según OMS/ACSM: aeróbico 150–300 min/semana a intensidad moderada guiada por esfuerzo percibido (RPE 11–14) cuando haya fármacos cronotrópicos negativos; fuerza 2–3 sesiones/semana de grandes grupos musculares a 8–15 repeticiones con progresión gradual; equilibrio 2–3 sesiones/semana, con apoyo si hay riesgo de caídas. Ajustar según las precauciones anteriores y la valoración funcional.", { size: 9 });
  pg.nota("Fuentes: ACSM Guidelines for Exercise Testing and Prescription (11ª ed.), ADA Standards of Care, criterios Beers 2023 / STOPP-START v3, fichas técnicas AEMPS, DDInter 2.0 (CC BY-NC-SA 4.0). " + kb.aviso);
  pg.pie();
  return doc;
}

export async function pdfPaciente(kb, res, ctx) {
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
  const pg = new Pagina(doc, "Su medicación y el ejercicio", "Qué tener en cuenta al entrenar, explicado de forma sencilla", await logo());
  pg.p("Este resumen se ha preparado a partir de la medicación que usted ha introducido. Es información general para ayudarle a entrenar con seguridad y a hablar con su médico; no sustituye a su consejo ni cambia ningún tratamiento.", { size: 9.5, color: [106, 98, 128] });

  pg.h2("Su medicación");
  for (const it of res.items) pg.p(`• ${it.principio.nombre} — ${dosisTxt(it)}`, { size: 9.5 });

  const alertas = [];
  for (const c of res.combinadas) if (c.regla.nivel === "alerta") alertas.push(c.texto);
  for (const [amb] of AMBITOS) for (const g of res.ambitos[amb]) for (const r of g.reglas) if (r.nivel === "alerta") alertas.push(`${g.item.principio.nombre}: ${r.texto}`);
  if (alertas.length) {
    pg.h2("Lo más importante");
    for (const t of [...new Set(alertas)]) pg.etiqueta("alerta", t);
  }

  for (const [amb, titulo] of AMBITOS) {
    const grupos = res.ambitos[amb];
    const comb = res.combinadas.filter((c) => (c.regla.ambitos || []).includes(amb) && c.regla.nivel !== "alerta");
    if (!grupos.length && !comb.length) continue;
    pg.h2(titulo);
    for (const c of comb) pg.etiqueta(c.regla.nivel, c.texto);
    for (const g of [...grupos].sort((a, b) => Math.max(...b.reglas.map((r) => ORDEN_NIVEL[r.nivel])) - Math.max(...a.reglas.map((r) => ORDEN_NIVEL[r.nivel])))) {
      pg.h3(g.item.principio.nombre);
      for (const r of [...g.reglas].sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel])) if (r.nivel !== "alerta") pg.etiqueta(r.nivel, r.texto);
    }
  }

  const ddi = res.interacciones.filter((x) => ORDEN_DDI[x.nivel] >= 2);
  if (ddi.length) {
    pg.h2("Medicamentos que se afectan entre sí");
    pg.p("Esto no significa que la combinación sea incorrecta (muchas veces es necesaria), sino que conviene conocerla y que su médico la tenga en cuenta.", { size: 9, color: [106, 98, 128] });
    for (const x of ddi) {
      pg.h3(`${x.a.principio.nombre} + ${x.b.principio.nombre}`);
      pg.etiqueta(x.nivel, `${x.efecto}${x.accion ? " Qué hacer: " + x.accion : ""}`);
    }
  }

  pg.h2("Cuándo parar y consultar");
  for (const t of [
    "Dolor o presión en el pecho, falta de aire desproporcionada, mareo intenso o desmayo: pare y busque ayuda (112 si no cede).",
    "Palpitaciones fuertes o irregulares que no se calman al parar.",
    "Sudor frío, temblor o confusión si toma medicación para el azúcar: mida la glucosa y tome azúcar.",
    "Dolor muscular generalizado, debilidad u orina oscura en los días siguientes.",
    "Cualquier caída o golpe en la cabeza si toma anticoagulantes.",
  ]) pg.etiqueta("alerta", t);
  pg.nota(kb.aviso);
  pg.pie();
  return doc;
}
