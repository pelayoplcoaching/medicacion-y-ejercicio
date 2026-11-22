#!/usr/bin/env node
/* Herramienta de mantenimiento: cuánto ocupa cada pieza de nivel superior de app/js/app.js (funciones, constantes y secciones),
   para decidir qué sacar a un módulo bajo demanda cuando el JavaScript inicial se acerca a su presupuesto (scripts/test.mjs).
   Solo imprime nombres y tamaños. Uso: node scripts/tamanos.mjs [n] [--secciones] */
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
const n = Number(process.argv.find((a) => /^\d+$/.test(a)) || 40);
const lineas = src.split("\n");
const piezas = []; let actual = null, seccion = "(inicio)"; const secciones = new Map();
const cierra = () => { if (actual) { piezas.push(actual); actual = null; } };
for (const [i, l] of lineas.entries()) {
  const sec = l.match(/^\/\* -{4,} (.*?) -{4,} \*\/$/);
  if (sec) { cierra(); seccion = sec[1].slice(0, 70); }
  const m = l.match(/^(?:async )?function\*? ([A-Za-z0-9_$]+)|^(?:const|let|var) ([A-Za-z0-9_$]+)|^(document|window|\$\([^)]*\)\??)\.addEventListener\("([a-z]+)"|^\$\("([^"]+)"\)\??\.addEventListener/);
  if (m && !l.startsWith(" ")) { cierra(); actual = { nombre: m[1] || m[2] || (m[3] ? `${m[3]}.on(${m[4]})` : `$(${m[5]}).on`), linea: i + 1, bytes: 0, seccion }; }
  const b = Buffer.byteLength(l, "utf8") + 1;
  if (actual) actual.bytes += b;
  secciones.set(seccion, (secciones.get(seccion) || 0) + b);
}
cierra();
const kb = (b) => (b / 1024).toFixed(1).padStart(6) + " KB";
console.log(`app.js: ${kb(Buffer.byteLength(src, "utf8"))} en ${lineas.length} líneas y ${piezas.length} piezas\n`);
if (process.argv.includes("--secciones")) { for (const [s, b] of [...secciones].sort((a, c) => c[1] - a[1]).slice(0, n)) console.log(kb(b), " ", s); }
else for (const p of piezas.sort((a, c) => c.bytes - a.bytes).slice(0, n)) console.log(kb(p.bytes), String(p.linea).padStart(6), " ", p.nombre.padEnd(28), p.seccion);
