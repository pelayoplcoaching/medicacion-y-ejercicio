/* OCR en el navegador con Tesseract.js (se carga bajo demanda; el modelo en español se descarga la primera vez). */
import { tesseract, pdfjs } from "./libs.js?v=202610161721";
const LANG_PATH = "https://tessdata.projectnaptha.com/4.0.0_fast";

let worker = null;


async function obtenerWorker(progreso) {
  if (worker) return worker;
  const T = await tesseract();
  worker = await T.createWorker("spa", 1, {
    langPath: LANG_PATH,
    logger: (m) => {
      if (!progreso) return;
      if (m.status === "loading language traineddata") progreso("Descargando el modelo de español…");
      else if (m.status === "recognizing text") progreso(`Leyendo la imagen… ${Math.round((m.progress || 0) * 100)} %`);
      else if (m.status) progreso("Preparando el lector…");
    },
  });
  return worker;
}

/** Reduce la imagen a un tamaño razonable y la pasa a escala de grises con algo de contraste. */
async function prepararImagen(src) {
  const img = src instanceof HTMLCanvasElement ? src : await new Promise((ok, ko) => {
    const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error("imagen no válida"));
    i.src = URL.createObjectURL(src);
  });
  const MAX = 2200;
  const esc = Math.min(1, MAX / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    let g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    g = Math.min(255, Math.max(0, (g - 128) * 1.25 + 128));
    p[i] = p[i + 1] = p[i + 2] = g;
  }
  ctx.putImageData(d, 0, 0);
  if (!(src instanceof HTMLCanvasElement)) URL.revokeObjectURL(img.src);
  return c;
}

/** Texto de una imagen (File) o de un canvas. */
export async function textoDeImagen(src, progreso) {
  const w = await obtenerWorker(progreso);
  const c = await prepararImagen(src);
  const { data } = await w.recognize(c);
  return data.text || "";
}

/** OCR de un PDF escaneado: renderiza cada página con pdf.js y la reconoce. */
export async function textoDePdfEscaneado(file, progreso, maxPaginas = 6) {
  const lib = await pdfjs();
  const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  const partes = [];
  for (let p = 1; p <= Math.min(pdf.numPages, maxPaginas); p++) {
    progreso?.(`Página ${p} de ${Math.min(pdf.numPages, maxPaginas)}…`);
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 2 });
    const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    partes.push(await textoDeImagen(c, progreso));
  }
  return partes.join("\n");
}
