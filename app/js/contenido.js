/* Contenido clínico en inglés (segunda tanda de mejoras grandes, 20). Bajo demanda: solo se carga con la interfaz en inglés.
   La base, las interacciones revisadas y el contenido que va dentro del código están escritos en español. Este módulo descarga
   data/en/contenido.json (huella del texto en español → texto en inglés; lo monta scripts/contenido_en.py) y sustituye en sitio los
   textos que tienen traducción: la base y las interacciones, lo que exportan los módulos que se abren con data-abre y, a través de
   js/tr.js, las tablas registradas con tC() y los textos marcados con tL() en cualquier módulo.
   Un texto sin traducción, o que ha cambiado después de traducirse, se queda en español.
   TRADUCCIÓN SIN REVISIÓN CLÍNICA: se avisa en el propio aviso de la base mientras la interfaz esté en inglés. */
/** Huella FNV-1a de 32 bits del texto (bytes UTF-8), en ocho cifras hexadecimales: la misma de scripts/contenido_en.py. */
import { instalarTraductor } from "./tr.js?v=202611230752";
export function huella(s) { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h.toString(16).padStart(8, "0"); }
export const NOTA = "The clinical content has been translated from Spanish and the translation has not been clinically reviewed yet.";
/** Traductor sobre un diccionario { huella: inglés }: tr(texto) y trObj(objeto), que recorre un objeto y traduce en sitio sus cadenas
    (cada objeto, una sola vez; no entra en la interfaz «TXT» de los módulos, que ya está en cinco idiomas). En un dibujo SVG
    con rótulos traduce los rótulos (<text>…</text>), no el dibujo.
    «sueltas» son las palabras de una sola pieza en minúsculas («fuerza», «mayor», «artrosis»): tr() las traduce, pero trObj() no las
    toca al recorrer un objeto (ahí son identificadores: ámbitos, niveles, situaciones) salvo que se pida con todo = true. */
export function traductor(h, sueltas = {}) {
  const tr = (s) => { if (typeof s !== "string") return s; const k = huella(s); return h[k] || sueltas[k] || s; };
  const vistos = new WeakSet();
  const trObj = (o, raiz = true, todo = false) => {
    if (!o || typeof o !== "object" || vistos.has(o) || o instanceof Set || o instanceof Map || (typeof Node !== "undefined" && o instanceof Node)) return o;
    vistos.add(o);
    for (const k of Object.keys(o)) {
      if (raiz && k === "TXT") continue;
      const v = o[k];
      if (typeof v === "string") { const e = v.includes("</text>") ? v.replace(/(<text[^>]*>)([^<]+)(?=<\/text>)/g, (_m, a, t) => a + tr(t)) : todo ? tr(v) : h[huella(v)]; if (e && e !== v) { try { o[k] = e; } catch { /* exportación de solo lectura */ } } }
      else if (v && typeof v === "object") trObj(v, false, todo);
    }
    return o;
  };
  return { tr, trObj };
}
/** Traduce la base y las interacciones revisadas en sitio. El nombre español de cada principio se conserva como alias (el buscador y
    el lector de listas lo siguen reconociendo) y los nombres de las combinaciones no se tocan. Devuelve { tr, trObj, n, total, version }. */
export function traducir(kb, ddi, D) {
  const T = traductor(D.h || {}, D.s || {});
  const nombres = kb.clases.flatMap((c) => c.principios.map((p) => [p, p.nombre]));
  const { combinaciones, ...resto } = kb; // eslint-disable-line no-unused-vars
  for (const v of Object.values(resto)) if (v && typeof v === "object") T.trObj(v, false);
  for (const [p, es] of nombres) if (p.nombre !== es) p.alias = [...(p.alias || []), es];
  // los motivos del horario son texto aunque sean una sola palabra («somnolencia»)
  for (const c of kb.clases) for (const x of [c, ...c.principios]) for (const lado of ["evitar", "preferir"]) for (const f of x.horario?.[lado] || []) if (f.motivo) f.motivo = T.tr(f.motivo);
  if (typeof kb.aviso === "string") kb.aviso = `${T.tr(kb.aviso)} ${NOTA}`;
  if (ddi?.interacciones) T.trObj(ddi.interacciones, false);
  return { ...T, n: D.n || 0, total: D.total || 0, version: D.version || "" };
}
/** Descarga el diccionario, traduce la base y deja instalado el traductor para el contenido del código (js/tr.js).
    Si el diccionario no está disponible, falla (y la aplicación sigue en español). */
export async function aplicar(kb, ddi) {
  const r = await fetch("data/en/contenido.json");
  if (!r.ok) throw new Error("sin contenido en inglés");
  const T = traducir(kb, ddi, await r.json());
  instalarTraductor({ tr: T.tr, trObj: (o, todo) => T.trObj(o, false, todo) });
  return T;
}
