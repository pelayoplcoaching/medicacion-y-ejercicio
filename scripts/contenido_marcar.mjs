#!/usr/bin/env node
// Marca el contenido en español de los módulos para poder traducirlo (js/tr.js): tL en los textos sueltos dentro de funciones y tC en
// las tablas a nivel de módulo. También saca las claves de lo ya marcado, para scripts/contenido_en.py.
//   node scripts/contenido_marcar.mjs <módulo…>             informa de lo que marcaría y de lo que hay que mirar a mano
//   node scripts/contenido_marcar.mjs <módulo…> --aplicar   lo marca
//   node scripts/contenido_marcar.mjs --claves              escribe en la salida estándar { módulo: { n, claves } } de lo marcado con tL
// Herramienta de desarrollo: necesita acorn (NODE_TOOLS apunta a su node_modules; por defecto /opt/npm-tools/node_modules/).
// app.js no se toca desde aquí: sus pocas marcas se llevan a mano en scripts/trad_en/claves_app.json.
import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), DIR = path.join(ROOT, "app/js");
const req = createRequire(process.env.NODE_TOOLS || "/opt/npm-tools/node_modules/"); const acorn = req("acorn"), walk = req("acorn-walk");
const FUERA = new Set(["app", "i18n", "tr", "contenido", "version"]);
export const modulos = () => fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)).filter((m) => !FUERA.has(m));

const IDI = new Set(["es", "en", "ca", "gl", "eu"]);
const ESW = /[áéíóúñ¿¡]|\b(el|la|los|las|que|con|para|una|del|por|sus|más|puede|toma|evite|si|de|en|sin|su|al|se|no|es|un|y|o)\b/i;
const sinHtml = (s) => s.replace(/<[^>]*>/g, " ").replace(/\{\d+\}/g, " ").replace(/&[a-z]+;/g, " ");
/** ¿Es texto para una persona, en español? (no identificadores, selectores, estilos, rutas ni trazos SVG) */
export const esTexto = (s) => { const t = sinHtml(s).trim(), z = s.replace(/\{\d+\}/g, ""); return t.length > 3 && /[a-záéíóúñ]{3}/.test(t) && /\s/.test(t) && ESW.test(t) && !/^[a-z0-9_.:#\[\]=" -]+$/.test(t) && !TEC.test(z); };
const TEC = /var\(--|^\s*[.#][a-z-]+[ ,{]|[{};]\s*$|^M[\d .-]|^https?:|^10\.\d{4}|class=|viewBox|stroke|\.js\b|\.json\b|\.webp\b|\.png\b|medex\.|^data-|aria-|\dpx|rgba?\(|^#[0-9a-f]{3,8}$/i;
/** Texto corto que también parece para una persona (una palabra con mayúscula o tilde, o varias sin palabras vacías): solo con --cortas, y se revisa a mano. */
export const esCorto = (s) => { const t = sinHtml(s).trim(), z = s.replace(/\{\d+\}/g, ""); return /[a-záéíóúñ]{3}/i.test(t) && (/\s/.test(t) || /^[A-ZÁÉÍÓÚ¿¡]/.test(t) || /[áéíóúñ]/.test(t)) && !/^[a-z][a-zA-Z0-9_-]*$/.test(t) && !TEC.test(z) && !/^[A-Z]{2,4}$/.test(t); };
const CLAVES_NO = new Set(["id", "tipo", "pict", "clase", "nivel", "fuente", "lang", "type", "role", "mode", "method", "unidad", "doi", "url", "href", "ic", "icono", "g", "z", "p", "pat", "m", "tab", "senal", "k", "clave_i18n"]);
const tieneHtml = (s) => /<\/?[a-z][^>]*>/.test(s);
const NO_PRIMER_ARG = new Set(["t", "tx", "tEs", "normalizar", "RegExp", "querySelector", "querySelectorAll", "getElementById", "closest", "matches", "getAttribute", "removeAttribute", "hasAttribute", "addEventListener", "removeEventListener", "Event", "CustomEvent", "getItem", "setItem", "removeItem", "add", "remove", "toggle", "contains", "Error", "TypeError", "log", "warn", "error", "has", "get", "includes", "startsWith", "endsWith", "indexOf", "test", "match", "matchAll", "replace", "replaceAll", "split", "createElement", "createElementNS", "setAttribute", "setProperty", "import", "check", "localeCompare", "toLocaleDateString", "toLocaleString", "toLocaleTimeString", "getContext", "font", "tL", "tC"]);
const clave = (n) => n.type === "TemplateLiteral" ? n.quasis.reduce((a, q, i) => a + (i ? `{${i - 1}}` : "") + q.value.cooked, "") : n.value;

let CORTAS = false, EXCLUIR = new Set();
export function analizar(src) {
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module" });
  const marcas = [], mirar = [], hechas = [], tablas = new Map();
  const ver = (n, anc) => {
    const s = clave(n), par = anc[anc.length - 2];
    const yaL = (par?.type === "TaggedTemplateExpression" && par.tag.name === "tL") || (par?.type === "CallExpression" && par.callee.name === "tL" && par.arguments[0] === n);
    if (yaL) { hechas.push(s); return; }
    if (EXCLUIR.has(s)) return;
    if (!esTexto(s)) { if (!CORTAS || !esCorto(s) || !anc.some((a) => /Function/.test(a.type)) || (par?.type === "Property" && CLAVES_NO.has(par.key.name || par.key.value)) || par?.type === "MemberExpression") return; }
    if (par?.type === "TaggedTemplateExpression") return; // otra etiqueta
    if (par?.type === "Property" && par.key === n && !par.computed) return;
    if (/^Import|^Export/.test(par?.type || "")) return;
    for (let i = anc.length - 1; i > 0; i--) { const a = anc[i], p = anc[i - 1]; if (a.type === "Property" && p.type === "ObjectExpression") { const k = a.key.name || a.key.value; if (IDI.has(k) && p.properties.filter((x) => IDI.has(x.key?.name || x.key?.value)).length >= 2) return; } }
    const lin = src.slice(0, n.start).split("\n").length, html = tieneHtml(s);
    if (par?.type === "BinaryExpression" && /^[!=]==?$/.test(par.operator)) { mirar.push({ lin, por: "comparación", s }); return; }
    if (par?.type === "SwitchCase") { mirar.push({ lin, por: "case", s }); return; }
    if ((par?.type === "CallExpression" || par?.type === "NewExpression") && par.arguments[0] === n) { const c = par.callee, nom = c.name || c.property?.name; if (NO_PRIMER_ARG.has(nom)) { if (!["t", "tx", "tEs", "check", "log", "warn", "error", "Error"].includes(nom)) mirar.push({ lin, por: `argumento de ${nom}()`, s }); return; } }
    const enFn = anc.some((a) => /Function/.test(a.type) || a.type === "MethodDefinition" || a.type === "PropertyDefinition");
    if (enFn) { marcas.push({ tipo: "L", start: n.start, end: n.end, lit: n.type === "Literal", lin, s, html }); return; }
    // a nivel de módulo: la tabla que lo contiene
    const iDecl = anc.findIndex((a) => a.type === "VariableDeclarator");
    const decl = iDecl >= 0 ? anc[iDecl] : null, init = decl?.init;
    if (init && (init.type === "ObjectExpression" || init.type === "ArrayExpression") && init !== n) { if (!tablas.has(init.start)) tablas.set(init.start, { tipo: "C", start: init.start, end: init.end, lin: src.slice(0, init.start).split("\n").length, nombre: decl.id.name, n: 0 }); tablas.get(init.start).n++; return; }
    if (init?.type === "CallExpression" && init.callee.name === "tC") return; // ya registrada
    mirar.push({ lin, por: decl ? `texto suelto a nivel de módulo (${decl.id.name || "?"})` : "texto a nivel de módulo fuera de una tabla", s });
  };
  walk.ancestor(ast, { Literal(n, _s, anc) { if (typeof n.value === "string") ver(n, anc); }, TemplateLiteral(n, _s, anc) { ver(n, anc); } });
  // tL(CONSTANTE): la clave es el texto de esa constante de módulo (const X = "texto")
  const consts = new Map(); for (const d of ast.body.flatMap((x) => (x.type === "ExportNamedDeclaration" ? [x.declaration] : [x])).filter((x) => x?.type === "VariableDeclaration").flatMap((x) => x.declarations)) if (d.init?.type === "Literal" && typeof d.init.value === "string") consts.set(d.id.name, d.init.value);
  walk.simple(ast, { CallExpression(n) { if (n.callee.name === "tL" && n.arguments[0]?.type === "Identifier" && consts.has(n.arguments[0].name)) hechas.push(consts.get(n.arguments[0].name)); } });
  const usadas = new Set(hechas); for (let i = mirar.length - 1; i >= 0; i--) if (usadas.has(mirar[i].s)) mirar.splice(i, 1);
  const usa = { tL: /\btL[`(]/.test(src), tC: /\btC\(/.test(src) };
  return { ast, marcas: [...marcas, ...tablas.values()], mirar, hechas, usa };
}

/** Claves de lo marcado con tL en un fuente (cadenas y plantillas) y número de marcas, como las cuenta la prueba (expresión regular). */
export function clavesDe(src) { const { hechas } = analizar(src); return { n: (src.match(/\btL(?:\(|`)/g) || []).length, claves: [...new Set(hechas)] }; }

function aplicar(m, src, marcas) {
  // inserciones sueltas (prefijo al principio y cierre al final de cada marca), de atrás adelante: así valen también las marcas anidadas
  const ins = marcas.flatMap((k) => (k.tipo === "C" ? [[k.start, "tC("], [k.end, ")"]] : k.lit ? [[k.start, "tL("], [k.end, ")"]] : [[k.start, "tL"]]));
  let out = src;
  for (const [pos, txt] of ins.sort((x, y) => y[0] - x[0])) out = out.slice(0, pos) + txt + out.slice(pos);
  const nombres = [/\btC\(/.test(out) && "tC", /\btL[`(]/.test(out) && "tL"].filter(Boolean);
  if (nombres.length) {
    const sello = (out.match(/\.js\?v=(\d+)"/) || fs.readFileSync(path.join(ROOT, "app/sw.js"), "utf8").match(/const VERSION = "(\d+)"/))[1];
    const linea = `import { ${nombres.join(", ")} } from "./tr.js?v=${sello}";`;
    if (/import \{[^}]*\} from "\.\/tr\.js[^"]*";/.test(out)) out = out.replace(/import \{[^}]*\} from "\.\/tr\.js[^"]*";/, linea);
    else { const imps = [...out.matchAll(/^import [^\n]*;\n/gm)]; if (imps.length) { const u = imps.at(-1); out = out.slice(0, u.index + u[0].length) + linea + "\n" + out.slice(u.index + u[0].length); } else { const fin = out.startsWith("/*") ? out.indexOf("*/") + 3 : 0; out = out.slice(0, fin) + linea + "\n" + out.slice(fin); } }
  }
  acorn.parse(out, { ecmaVersion: "latest", sourceType: "module" }); // que siga siendo JavaScript válido
  fs.writeFileSync(path.join(DIR, m + ".js"), out);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), ap = args.includes("--aplicar"), ms = args.filter((a) => !a.startsWith("--"));
  CORTAS = args.includes("--cortas");
  const iSi = args.indexOf("--claves-si"); if (iSi >= 0) { for (const k of args[iSi + 1].split(",")) CLAVES_NO.delete(k); ms.splice(ms.indexOf(args[iSi + 1]), 1); }
  const iEx = args.indexOf("--excluir"); const exc = iEx >= 0 ? JSON.parse(fs.readFileSync(args[iEx + 1], "utf8")) : {}; if (iEx >= 0) ms.splice(ms.indexOf(args[iEx + 1]), 1);
  if (args.includes("--claves")) { const o = {}; for (const m of modulos()) { const c = clavesDe(fs.readFileSync(path.join(DIR, m + ".js"), "utf8")); if (c.n) o[m] = c; } process.stdout.write(JSON.stringify(o)); }
  else for (const m of ms.length ? ms : modulos()) {
    EXCLUIR = new Set(exc[m] || []);
    const src = fs.readFileSync(path.join(DIR, m + ".js"), "utf8"), { marcas, mirar, hechas } = analizar(src);
    const L = marcas.filter((k) => k.tipo === "L"), C = marcas.filter((k) => k.tipo === "C");
    if (!marcas.length && !mirar.length) continue;
    console.log(`${m}.js · ${L.length} textos sueltos (${L.filter((k) => k.html).length} con HTML) · ${C.length} tablas (${C.map((k) => `${k.nombre}:${k.n}`).join(", ")}) · ya marcados ${hechas.length} · a mano ${mirar.length}`);
    if (args.includes("--detalle")) L.forEach((k) => console.log(`   ${String(k.lin).padStart(4)} ${k.html ? "H" : " "} ${k.s.slice(0, 170).replace(/\n/g, "⏎")}`));
    mirar.forEach((k) => console.log(`   ! ${String(k.lin).padStart(4)} ${k.por}: ${k.s.slice(0, 140).replace(/\n/g, "⏎")}`));
    const sel = args.includes("--solo-sueltos") ? L : marcas;
    if (ap && sel.length) { aplicar(m, src, sel); console.log(`   → marcado (${sel.length})`); }
  }
}
