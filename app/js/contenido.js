/* Contenido clínico en inglés (segunda tanda de mejoras grandes, 20). Bajo demanda: solo se carga con la interfaz en inglés.
   La base, las interacciones revisadas y el contenido de los módulos que se abren con data-abre están escritos en español. Este módulo
   descarga data/en/contenido.json (huella del texto en español → texto en inglés; lo monta scripts/contenido_en.py) y sustituye en sitio
   los textos que tienen traducción. Un texto sin traducción, o que ha cambiado en la base después de traducirse, se queda en español.
   TRADUCCIÓN SIN REVISIÓN CLÍNICA: se avisa en el propio aviso de la base mientras la interfaz esté en inglés. */
/** Huella FNV-1a de 32 bits del texto (bytes UTF-8), en ocho cifras hexadecimales: la misma de scripts/contenido_en.py. */
export function huella(s) { let h = 0x811c9dc5; for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0; return h.toString(16).padStart(8, "0"); }
export const NOTA = "The clinical content has been translated from Spanish and the translation has not been clinically reviewed yet.";
/** Traductor sobre un diccionario { huella: inglés }: tr(texto) y trObj(objeto), que recorre un objeto y traduce en sitio sus cadenas
    (cada objeto, una sola vez; no entra en la interfaz «TXT» de los módulos, que ya está en cinco idiomas, ni en sus fuentes). */
export function traductor(h) {
  const tr = (s) => (typeof s === "string" && h[huella(s)]) || s;
  const vistos = new WeakSet();
  const trObj = (o, raiz = true) => {
    if (!o || typeof o !== "object" || vistos.has(o) || o instanceof Set || o instanceof Map || (typeof Node !== "undefined" && o instanceof Node)) return o;
    vistos.add(o);
    for (const k of Object.keys(o)) {
      if (raiz && (k === "TXT" || k === "FUENTES")) continue;
      const v = o[k];
      if (typeof v === "string") { const e = h[huella(v)]; if (e) { try { o[k] = e; } catch { /* exportación de solo lectura */ } } }
      else if (v && typeof v === "object") trObj(v, false);
    }
    return o;
  };
  return { tr, trObj };
}
/** Traduce la base y las interacciones revisadas en sitio. El nombre español de cada principio se conserva como alias (el buscador y
    el lector de listas lo siguen reconociendo) y los nombres de las combinaciones no se tocan. Devuelve { tr, trObj, n, total, version }. */
export function traducir(kb, ddi, D) {
  const T = traductor(D.h || {});
  const nombres = kb.clases.flatMap((c) => c.principios.map((p) => [p, p.nombre]));
  const { combinaciones, ...resto } = kb; // eslint-disable-line no-unused-vars
  for (const v of Object.values(resto)) if (v && typeof v === "object") T.trObj(v, false);
  for (const [p, es] of nombres) if (p.nombre !== es) p.alias = [...(p.alias || []), es];
  if (typeof kb.aviso === "string") kb.aviso = `${T.tr(kb.aviso)} ${NOTA}`;
  if (ddi?.interacciones) T.trObj(ddi.interacciones, false);
  return { ...T, n: D.n || 0, total: D.total || 0, version: D.version || "" };
}
/** Descarga el diccionario y traduce. Si no está disponible, falla (y la aplicación sigue en español). */
export async function aplicar(kb, ddi) {
  const r = await fetch("data/en/contenido.json");
  if (!r.ok) throw new Error("sin contenido en inglés");
  return traducir(kb, ddi, await r.json());
}
