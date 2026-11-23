// Vuelca en JSON el contenido en español de los módulos que se abren con data-abre (los de MODULOS en app.js), para traducirlo.
// Lo usa scripts/contenido_en.py. No incluye la interfaz (TXT, ya en cinco idiomas) ni las fuentes (FUENTES, que se dejan como están).
import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const MODS = "rato paseo dolor vuelta primeros cuerpo preguntas mitos cien numeros enfermedad frid escalas receta".split(" ");
export const esProsa = (s) => s.length > 3 && /[a-záéíóúñ]/.test(s) && (/\s/.test(s) || /[áéíóúñ¿¡]/.test(s) || /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(s)) && !/^(https?:|10\.\d{4}|[a-z0-9_.:-]+$)/.test(s) && !/^[\d\s.,:;()–-]+$/.test(s);
export function cadenas(M) {
  const set = new Set();
  const walk = (v) => { if (typeof v === "string") { if (esProsa(v)) set.add(v); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object" && !(v instanceof Set) && !(v instanceof Map)) Object.values(v).forEach(walk); };
  for (const [k, v] of Object.entries(M)) if (k !== "TXT" && k !== "FUENTES" && typeof v !== "function") walk(v);
  return [...set];
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = {};
  for (const m of MODS) out[m] = cadenas(await import(pathToFileURL(path.join(ROOT, "app/js", m + ".js")).href));
  process.stdout.write(JSON.stringify(out));
}
