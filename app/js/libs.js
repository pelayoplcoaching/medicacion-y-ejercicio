/* Carga perezosa de librerías externas: solo se descargan la primera vez que hacen falta. */
const URLS = {
  pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  tesseract: "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js",
};
const pendientes = {};
export function cargarScript(src) {
  if (pendientes[src]) return pendientes[src];
  pendientes[src] = new Promise((ok, ko) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => ok();
    s.onerror = () => { delete pendientes[src]; ko(new Error("no se ha podido descargar un componente (compruebe la conexión)")); };
    document.head.append(s);
  });
  return pendientes[src];
}
export async function pdfjs() {
  if (!window.pdfjsLib) await cargarScript(URLS.pdfjs);
  if (!window.pdfjsLib) throw new Error("el lector de PDF no está disponible");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = URLS.pdfjsWorker;
  return window.pdfjsLib;
}
export async function jspdf() {
  if (!window.jspdf) await cargarScript(URLS.jspdf);
  if (!window.jspdf) throw new Error("el generador de PDF no está disponible");
  return window.jspdf;
}
export async function tesseract() {
  if (!window.Tesseract) await cargarScript(URLS.tesseract);
  if (!window.Tesseract) throw new Error("el motor de OCR no está disponible");
  return window.Tesseract;
}
