/* Contenido clínico en otro idioma (segunda tanda de mejoras grandes, 20). El contenido está escrito en español dentro del código;
   aquí solo se marca, para que js/contenido.js pueda traducirlo cuando la interfaz está en inglés. Sin traductor instalado, todo queda igual.
   - tC(tabla): tabla de contenido a nivel de módulo (objeto o lista). Se traduce en sitio en cuanto hay traductor; devuelve la misma tabla.
     Las palabras sueltas en minúsculas («fuerza», «mayor») no se tocan, porque en una tabla suelen ser identificadores;
     tC(tabla, true) es para una tabla que solo tiene rótulos: ahí se traducen también.
   - tL("texto") o tL`texto ${x}`: texto suelto dentro de una función. Con plantilla, la clave es «texto {0}» y la traducción recoloca los valores.
   scripts/contenido_en.py saca de estas marcas lo que hay que traducir (la interfaz, TXT, va aparte: ya está en cinco idiomas).
   Los nombres son largos a propósito: en el artefacto de claude.ai este módulo va en línea, en el mismo ámbito que app.js. */
let trActivo = null;
const trTablas = [];
/** Instala el traductor ({ tr(texto), trObj(objeto, todo) }) y traduce las tablas que ya estaban registradas. */
export function instalarTraductor(t) { trActivo = t; for (const [o, todo] of trTablas) t.trObj(o, todo); }
export function tC(o, todo = false) { if (trActivo) trActivo.trObj(o, todo); else trTablas.push([o, todo]); return o; }
export function tL(s, ...v) {
  if (typeof s === "string") return trActivo ? trActivo.tr(s) : s;
  let k = s[0]; for (let i = 1; i < s.length; i++) k += `{${i - 1}}` + s[i];
  return (trActivo ? trActivo.tr(k) : k).replace(/\{(\d+)\}/g, (_m, i) => v[i]);
}
