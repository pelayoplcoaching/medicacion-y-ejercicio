/* Reconocimiento de medicación en texto libre (lista pegada o texto extraído de un PDF). */
import { normalizar } from "./engine.js?v=202610150620";

let catalogo = null; // [{norm, pid, tipo, dosis, unidad}] ordenado por longitud desc

function prepararCatalogo(indice) {
  if (catalogo) return catalogo;
  catalogo = indice.entradas
    .filter((e) => e.norm.length >= 4)
    .map((e) => ({ ...e, re: new RegExp(`(^|[^a-z0-9])${e.norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}(?=$|[^a-z])`) }))
    .sort((a, b) => b.norm.length - a.norm.length);
  return catalogo;
}

const RE_DOSIS = /(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|microgramos?|g|ui|u\.?i\.?|unidades)\b/;
const RE_INH = /(\d+)\s*(?:inhalaci|pulsaci|puff)/;

/** Nº de tomas al día a partir de la pauta escrita. Devuelve null si no se reconoce. */
export function tomasDesdePauta(n) {
  let m;
  if ((m = n.match(/\b([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)(?:\s*[-\/]\s*([0-9]|[0-9][.,]5))?\b/)))
    return [m[1], m[2], m[3], m[4]].filter((x) => x != null && parseFloat(x.replace(",", ".")) > 0).length || null;
  if ((m = n.match(/cada\s*(\d+)\s*h/))) return Math.max(1, Math.round(24 / parseInt(m[1], 10)));
  if ((m = n.match(/(\d+)\s*(?:veces|tomas)\s*(?:al|por)\s*dia/))) return parseInt(m[1], 10);
  if (/\b(una|1)\s*vez\s*(al|por)\s*dia\b|\bcada\s*dia\b|\bdiari[oa]\b|\b24\s*h/.test(n)) return 1;
  if (/\b(dos|2)\s*veces\s*(al|por)\s*dia\b|\b12\s*h/.test(n)) return 2;
  if (/\b(tres|3)\s*veces\s*(al|por)\s*dia\b|\b8\s*h/.test(n)) return 3;
  const comidas = ["desayuno", "comida", "cena", "merienda", "noche", "manana", "mediodia"].filter((c) => n.includes(c)).length;
  if (comidas) return Math.min(comidas, 4);
  if (/semana|semanal/.test(n)) return 1;
  return null;
}

/**
 * Divide el texto en líneas y reconoce fármaco + dosis + tomas en cada una.
 * @returns {{reconocidos: Array, noReconocidos: string[]}}
 */
export function extraerMedicacion(texto, indice) {
  const cat = prepararCatalogo(indice);
  const reconocidos = [], noReconocidos = [];
  const vistos = new Set();
  const lineas = texto.split(/\r?\n|;/).map((l) => l.trim()).filter((l) => l.length > 2);
  for (const linea of lineas) {
    const n = normalizar(linea);
    const hit = cat.find((e) => e.re.test(n));
    if (!hit) {
      // líneas con pinta de medicamento (tienen mg) pero no reconocidas
      if (RE_DOSIS.test(n)) noReconocidos.push(linea);
      continue;
    }
    const ref = indice.porId.get(hit.pid);
    const unidad = ref.principio.unidad || "mg";
    // dosis: primera cantidad con unidad tras el nombre
    const resto = n.slice(n.indexOf(hit.norm) + hit.norm.length);
    let dosis = null;
    let m = null;
    const buscarDosis = (txt) => {
      // primera cantidad con unidad que no sea una concentración ("100 UI/ml", "100 mcg/inhalación")
      const re = new RegExp(RE_DOSIS.source, "g");
      let k;
      while ((k = re.exec(txt))) { const tras = txt.slice(k.index + k[0].length, k.index + k[0].length + 12); if (/^\s*\/\s*h\b/.test(tras) && /\/h/.test(unidad)) return k; if (!/^\s*(\/|por\s*(ml|inhal|dosis|pulsac))/.test(tras)) return k; }
      return null;
    };
    if (/inhalaci/.test(unidad) && (m = n.match(RE_INH))) {
      dosis = parseInt(m[1], 10);
    } else if ((m = buscarDosis(resto) || buscarDosis(n))) {
      dosis = parseFloat(m[1].replace(",", "."));
      const u = m[2].replace(/\./g, "");
      if (u === "g") dosis *= 1000;
      if (/^(mcg|µg|ug|microgramos?)$/.test(u) && unidad === "mg") dosis /= 1000;
      if (u === "mg" && unidad === "mcg") dosis *= 1000;
    } else if (hit.dosis != null) {
      dosis = hit.dosis; // presentación del nomenclátor
    }
    // comprimidos por toma ("2 comprimidos cada 12 h", "medio comprimido")
    let factor = 1;
    if ((m = resto.match(/(\d+(?:[.,]\d+)?)\s*(comprimidos?|capsulas?|sobres?|cp|comp)/))) factor = parseFloat(m[1].replace(",", "."));
    else if (/\b(medio|1\/2)\s*(comprimido|cp)/.test(resto)) factor = 0.5;
    if (dosis != null && factor !== 1) dosis = Math.round(dosis * factor * 1000) / 1000;
    const tomas = tomasDesdePauta(n) || 1;
    if (vistos.has(hit.pid)) continue;
    vistos.add(hit.pid);
    reconocidos.push({ pid: hit.pid, dosis, tomas, unidad, origen: linea.slice(0, 80) });
  }
  return { reconocidos, noReconocidos };
}

/** Texto de un PDF usando pdf.js (global pdfjsLib cargado desde CDN). */
export async function textoDePdf(file) {
  if (!window.pdfjsLib) throw new Error("El lector de PDF no se ha podido cargar en este entorno.");
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  const lineas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    // reagrupar por coordenada vertical para reconstruir líneas
    const filas = new Map();
    for (const it of content.items) {
      if (!it.str) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      if (!filas.has(y)) filas.set(y, []);
      filas.get(y).push({ x: it.transform[4], s: it.str });
    }
    const ys = [...filas.keys()].sort((a, b) => b - a);
    for (const y of ys) lineas.push(filas.get(y).sort((a, b) => a.x - b.x).map((t) => t.s).join(" ").replace(/\s+/g, " ").trim());
  }
  return lineas.join("\n");
}
