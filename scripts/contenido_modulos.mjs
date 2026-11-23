// Vuelca en JSON el contenido en español del código, para traducirlo (lo usa scripts/contenido_en.py):
//   mods     lo que exportan los módulos que se abren con data-abre (los de MODULOS en app.js): se traduce al abrirlos;
//   tablas   las tablas registradas con tC() en cualquier módulo (js/tr.js): se traducen en sitio;
//   sueltos  las claves de los textos marcados con tL(), por módulo (con --claves; las saca scripts/contenido_marcar.mjs, que necesita acorn);
//   app      las de app.js, que se llevan a mano en scripts/trad_en/claves_app.json.
// No incluye la interfaz (TXT, ya en cinco idiomas).
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), DIR = path.join(ROOT, "app/js");
export const MODS = "rato paseo dolor vuelta primeros cuerpo preguntas mitos cien numeros enfermedad frid escalas receta".split(" ");
const FUERA = new Set(["app", "i18n", "tr", "contenido", "version"]);
export const esProsa = (s) => s.length > 3 && /[a-záéíóúñ]/.test(s) && (/\s/.test(s) || /[áéíóúñ¿¡]/.test(s) || /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(s)) && !/^(https?:|10\.\d{4}|[a-z0-9_.:-]+$)/.test(s) && !/^[\d\s.,:;()–-]+$/.test(s) && !/^M-?\d/.test(s); // (ni rutas, ni cifras sueltas, ni trazos SVG)
/** Cadenas de texto de un objeto (o de lo que exporta un módulo), sin repetir. */
export function cadenas(M, raiz = true) {
  const set = new Set();
  // un dibujo SVG con rótulos: se traducen los rótulos (<text>…</text>), no el dibujo entero
  const walk = (v) => { if (typeof v === "string") { if (v.includes("</text>")) { for (const m of v.matchAll(/<text[^>]*>([^<]+)<\/text>/g)) if (/[a-záéíóúñ]{3}/i.test(m[1])) set.add(m[1]); } else if (esProsa(v) && !/<(svg|g|path|rect|circle|line)\b/.test(v)) set.add(v); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object" && !(v instanceof Set) && !(v instanceof Map)) Object.values(v).forEach(walk); };
  if (raiz) { for (const [k, v] of Object.entries(M)) if (k !== "TXT" && typeof v !== "function") walk(v); } else walk(M);
  return [...set];
}
/** Sello de versión con el que los módulos se importan entre sí: hay que usar el mismo para que js/tr.js sea una sola instancia. */
export const sello = () => fs.readFileSync(path.join(ROOT, "app/sw.js"), "utf8").match(/const VERSION = "(\d+)"/)[1];
export const url = (m, v = sello()) => pathToFileURL(path.join(DIR, m + ".js")).href + "?v=" + v;
export const modulos = () => fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)).filter((m) => !FUERA.has(m));
/** Carga todos los módulos con un «traductor» que solo apunta las tablas registradas con tC(): devuelve { mods, tablas }. */
export async function contenido() {
  const reg = []; (await import(url("tr"))).instalarTraductor({ tr: (s) => s, trObj: (o, todo) => reg.push([o, !!todo]) });
  const mods = {};
  for (const m of modulos()) { const M = await import(url(m)); if (MODS.includes(m)) mods[m] = cadenas(M); }
  // de una tabla de rótulos (tC(tabla, true)) se traduce todo lo que tenga letras, también las palabras sueltas
  const todas = (o) => { const set = new Set(), walk = (v) => { if (typeof v === "string") { if (/[a-záéíóúñ]/i.test(v)) set.add(v); } else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x); }; walk(o); return [...set]; };
  return { mods, tablas: [...new Set(reg.flatMap(([o, todo]) => (todo ? todas(o) : cadenas(o, false))))] };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = await contenido();
  if (process.argv.includes("--claves")) { const { clavesDe } = await import("./contenido_marcar.mjs"); out.sueltos = {}; for (const m of modulos()) { const c = clavesDe(fs.readFileSync(path.join(DIR, m + ".js"), "utf8")); if (c.n) out.sueltos[m] = c; } }
  const fa = path.join(ROOT, "scripts/trad_en/claves_app.json"); out.app = fs.existsSync(fa) ? JSON.parse(fs.readFileSync(fa, "utf8")).claves : [];
  process.stdout.write(JSON.stringify(out));
}
