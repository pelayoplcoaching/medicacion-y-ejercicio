/* Reconocimiento de medicación en texto libre (lista pegada o texto extraído de un PDF). */
import { pdfjs } from "./libs.js?v=202610151151";
import { normalizar } from "./engine.js?v=202610151151";

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

/** Momentos de toma a partir de la pauta escrita (1-0-1, "por la noche", "@desayuno" del lector de PDF…). */
export function momentosDesdePauta(n, siguientes = []) {
  const res = new Set();
  let m;
  if ((m = n.match(/\b([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)(?:\s*[-\/]\s*([0-9]|[0-9][.,]5))?\b/))) {
    const v = [m[1], m[2], m[3], m[4]].map((x) => (x == null ? 0 : parseFloat(x.replace(",", "."))));
    if (v[0] > 0) res.add("desayuno"); if (v[1] > 0) res.add("comida"); if (v[2] > 0) res.add("cena"); if (v[3] > 0) res.add("noche");
  }
  const txt = [n, ...siguientes].join(" ");
  for (const [re, mom] of [[/@desayuno|\bdesayuno|\bmanana\b|\bal levantarse|\ben ayunas/, "desayuno"], [/@comida|\bcomida|\bmediodia/, "comida"], [/@cena|\bcena/, "cena"], [/@noche|\bal acostarse|\bpor la noche|\bnoche\b|\bantes de dormir/, "noche"]]) if (re.test(txt)) res.add(mom);
  if (!res.size) {
    if (/cada\s*12\s*h|\b(dos|2)\s*veces/.test(txt)) { res.add("desayuno"); res.add("cena"); }
    else if (/cada\s*8\s*h|\b(tres|3)\s*veces/.test(txt)) { res.add("desayuno"); res.add("comida"); res.add("cena"); }
  }
  return [...res];
}

/**
 * Divide el texto en líneas y reconoce fármaco + dosis + tomas en cada una.
 * @returns {{reconocidos: Array, noReconocidos: string[]}}
 */
/** Corrige errores típicos del OCR en unidades y números. */
export function limpiarOcr(t) {
  return t
    .replace(/(\d)\s*(rng|mq|m9|mg\b|rrig)/gi, "$1 mg")
    .replace(/(\d)\s*(rncg|rncq|mcq)/gi, "$1 mcg")
    .replace(/\b([lI|])(\d)/g, "1$2").replace(/(\d)[lI|]\b/g, "$11")
    .replace(/\bO(\d)/g, "0$1").replace(/(\d)O\b/g, "$10")
    .replace(/(\d)\s*,\s*(\d)/g, "$1,$2")
    .replace(/\s{2,}/g, " ");
}

export function extraerMedicacion(texto, indice) {
  texto = limpiarOcr(texto);
  const cat = prepararCatalogo(indice);
  const reconocidos = [], noReconocidos = [];
  const vistos = new Set();
  const lineas = texto.split(/\r?\n|;/).map((l) => l.trim()).filter(Boolean);
  for (let idx = 0; idx < lineas.length; idx++) {
    const linea = lineas[idx];
    const n = normalizar(linea);
    const hit = cat.find((e) => e.re.test(n));
    if (!hit) {
      // líneas con pinta de medicamento (tienen mg) pero no reconocidas
      if (RE_DOSIS.test(n)) noReconocidos.push(linea);
      continue;
    }
    if (hit.tipo === "combo") {
      // marca combinada: "CO-DIOVAN 160/12,5 mg" → cada componente con su dosis (en el orden de la combinación)
      const tras = n.slice(n.indexOf(hit.norm) + hit.norm.length);
      const mD = tras.match(/(\d+(?:[.,]\d+)?)\s*(?:mg)?\s*\/\s*(\d+(?:[.,]\d+)?)\s*(?:mg)?(?:\s*\/\s*(\d+(?:[.,]\d+)?)\s*(?:mg)?)?/);
      let dosisLinea = mD ? [mD[1], mD[2], mD[3]].filter(Boolean).map((x) => parseFloat(x.replace(",", "."))) : [];
      // emparejar cada componente con el número de la línea más parecido a su dosis habitual (el orden del etiquetado varía)
      let asignadas = null;
      if (dosisLinea.length === hit.componentes.length && hit.componentes.every((c) => c.dosis != null)) {
        const libres = [...dosisLinea]; asignadas = hit.componentes.map((c) => {
          let best = 0; libres.forEach((v, i) => { if (Math.abs(Math.log(v / c.dosis)) < Math.abs(Math.log(libres[best] / c.dosis))) best = i; });
          return libres.splice(best, 1)[0];
        });
      }
      let tomasC = tomasDesdePauta(n);
      const bloqueC = []; for (let j = idx + 1; j < lineas.length && j <= idx + 6; j++) { const l = normalizar(lineas[j]); if (cat.some((e) => e.re.test(l))) break; bloqueC.push(l); }
      if (tomasC == null) { let unos = 0; for (const l of bloqueC) if (/^(1|0[.,]5|2)(@[a-z]+)?$/.test(l)) unos++; if (unos) tomasC = Math.min(unos, 4); }
      const momentosC = momentosDesdePauta(n, bloqueC);
      hit.componentes.forEach((c, k) => {
        if (vistos.has(c.pid)) return;
        vistos.add(c.pid);
        const refC = indice.porId.get(c.pid);
        reconocidos.push({ pid: c.pid, dosis: asignadas ? asignadas[k] : c.dosis ?? null, tomas: tomasC || 1, unidad: refC.principio.unidad || "mg", combo: hit.texto, momentos: momentosC, origen: linea.slice(0, 80) });
      });
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
    } else if (unidad === "mg" && (m = resto.match(/^\s*(\d+(?:[.,]\d+)?)(?!\s*(?:\/|%|h\b|x\b|-\d))\b/))) {
      // número sin unidad justo tras el nombre ("Sintrom 4", "Adiro 100"): se acepta si es plausible
      const v = parseFloat(m[1].replace(",", "."));
      const umbral = ref.principio.umbral_mg?.alta;
      if (umbral == null || (v > 0 && v <= umbral * 4)) dosis = v;
    }
    // comprimidos por toma ("2 comprimidos cada 12 h", "medio comprimido").
    // Un número grande delante de "comprimidos" justo tras la dosis es el tamaño del envase
    // ("METFORMINA 850 MG 50 COMPRIMIDOS"), no la pauta: se ignora.
    let factor = 1;
    const restoSinEnvase = resto.replace(/^\s*(?:comprimidos?\s+)?(?:recubiertos\s+)?(?:con\s+pelicula\s+)?\d{2,4}\s*(comprimidos?|capsulas?|sobres?|cp|comp|unidades|parches?|viales?|jeringas?)\b/, " ");
    if ((m = restoSinEnvase.match(/(\d+(?:[.,]\d+)?)\s*(comprimidos?|capsulas?|sobres?|cp|comp)\b/))) {
      const f = parseFloat(m[1].replace(",", "."));
      if (f > 0 && f <= 4) factor = f; // 5 o más "comprimidos" no es una toma, es un envase
    } else if (/\b(medio|1\/2)\s*(comprimido|cp)/.test(resto)) factor = 0.5;
    else if ((m = n.match(/\b([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)\s*[-\/]\s*([0-9]|[0-9][.,]5)\b/))) {
      // pauta tipo 3-0-3 o 0.5-0-0.5: unidades por toma (se usa la mayor)
      const vals = [m[1], m[2], m[3]].map((x) => parseFloat(x.replace(",", "."))).filter((x) => x > 0 && x <= 4);
      if (vals.length) factor = Math.max(...vals);
    }
    if (dosis != null && factor !== 1) dosis = Math.round(dosis * factor * 1000) / 1000;
    // tomas: de la propia línea o, en hojas con columnas (Desayuno/Comida/Cena/Acostarse),
    // de las líneas siguientes que solo contienen "1", "0,5", etc. hasta la próxima línea de fármaco
    let tomas = tomasDesdePauta(n);
    const bloque = [];
    for (let j = idx + 1; j < lineas.length && j <= idx + 6; j++) { const l = normalizar(lineas[j]); if (cat.some((e) => e.re.test(l))) break; bloque.push(l); }
    if (tomas == null) {
      let unos = 0;
      for (const l of bloque) if (/^(1|0[.,]5|2|1[.,]5)(@[a-z]+)?$/.test(l)) unos++;
      if (unos) tomas = Math.min(unos, 4);
    }
    const momentos = momentosDesdePauta(n, bloque);
    // "si precisa" / "a demanda" en la línea o en las siguientes del bloque
    let aDemanda = /\b(si precisa|a demanda|si dolor|si fiebre|si necesita|cuando precise)\b/.test(n);
    if (!aDemanda) for (let j = idx + 1; j < lineas.length && j <= idx + 6; j++) { const l = normalizar(lineas[j]); if (cat.some((e) => e.re.test(l))) break; if (/\b(si precisa|a demanda|si dolor|si fiebre|si necesita|cuando precise)\b/.test(l)) { aDemanda = true; break; } }
    tomas = tomas || 1;
    // plausibilidad: dosis diaria por encima del rango del fármaco → dejar en blanco para que el usuario la revise
    const umbral = ref.principio.umbral_mg?.alta;
    if (dosis != null && umbral != null && unidad === "mg" && dosis * tomas > umbral * 6) dosis = null;
    if (vistos.has(hit.pid)) continue;
    vistos.add(hit.pid);
    reconocidos.push({ pid: hit.pid, dosis, tomas, unidad, aDemanda, momentos, origen: linea.slice(0, 80) });
  }
  return { reconocidos, noReconocidos };
}

/** Texto de un PDF usando pdf.js (global pdfjsLib cargado desde CDN).
 *  En hojas con columnas de tomas (Desayuno / Comida / Cena / Al acostarse) anota cada "1" con su columna: "1@desayuno". */
export async function textoDePdf(file) {
  const lib = await pdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const lineas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = content.items.filter((it) => it.str && it.str.trim());
    // columnas de tomas: cabeceras y su x central
    const cols = [];
    for (const it of items) {
      const t = normalizar(it.str);
      const mom = /^desayuno$/.test(t) ? "desayuno" : /^comida$/.test(t) ? "comida" : /^cena$/.test(t) ? "cena" : /acostarse/.test(t) ? "noche" : null;
      if (mom && !cols.some((c) => c.mom === mom)) cols.push({ mom, x: it.transform[4] + (it.width || 0) / 2 });
    }
    const filas = new Map();
    for (const it of items) {
      const y = Math.round(it.transform[5] / 3) * 3;
      if (!filas.has(y)) filas.set(y, []);
      let str = it.str;
      if (cols.length && /^(1|0,5|0\.5|2|1,5)$/.test(str.trim())) {
        const xc = it.transform[4] + (it.width || 0) / 2;
        let best = null;
        for (const c of cols) { const d = Math.abs(c.x - xc); if (d < 40 && (!best || d < best.d)) best = { d, mom: c.mom }; }
        if (best) str = str.trim() + "@" + best.mom;
      }
      filas.get(y).push({ x: it.transform[4], s: str });
    }
    const ys = [...filas.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const fila = filas.get(y).sort((a, b) => a.x - b.x);
      // los "1@momento" van en líneas propias para que el lector cuente las tomas
      const texto = fila.filter((t) => !/@/.test(t.s)).map((t) => t.s).join(" ").replace(/\s+/g, " ").trim();
      if (texto) lineas.push(texto);
      for (const t of fila) if (/@/.test(t.s)) lineas.push(t.s);
    }
  }
  return lineas.join("\n");
}
