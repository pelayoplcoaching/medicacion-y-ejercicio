#!/usr/bin/env node
/* Legibilidad de los textos que lee el paciente (v1.0): índice INFLESZ (Barrio-Cantalejo 2008, adaptación española del
   Flesch: 206,835 − 62,3·(sílabas/palabras) − (palabras/frases)). Escala: < 40 muy difícil · 40–55 algo difícil ·
   55–65 normal · 65–80 bastante fácil · > 80 muy fácil. Los textos clínicos con nombres de fármacos y cifras puntúan
   por debajo de la prosa general; el objetivo de la app es que ninguna regla del paciente baje de «algo difícil» (40)
   y que la media quede en «normal» o mejor.
   Uso:  node scripts/legibilidad.mjs            # informe
         node scripts/legibilidad.mjs --peores 30 # los 30 textos peor puntuados
   También se importa desde test.mjs. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FUERTES = "aeoáéóíúÁÉÓÍÚ", DEBILES = "iuü";
const esVocal = (c) => /[aeiouáéíóúü]/i.test(c);

/** Sílabas aproximadas de una palabra española: grupos vocálicos, con diptongos (débil + cualquiera) como una sílaba. */
export function silabas(palabra) {
  const w = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, "");
  if (!w) return 0;
  let n = 0, prev = false;
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    if (!esVocal(c)) { prev = false; continue; }
    if (!prev) { n++; prev = true; continue; }
    const a = w[i - 1];
    const hiato = (FUERTES.includes(a) && FUERTES.includes(c)) || /[íú]/.test(c) || /[íú]/.test(a); // dos fuertes, o débil acentuada → hiato
    if (hiato) n++;
  }
  return Math.max(1, n);
}

export function inflesz(texto) {
  const limpio = String(texto).replace(/<[^>]+>/g, " ").replace(/\d+([.,]\d+)?/g, "x"); // las cifras cuentan como una palabra de una sílaba
  const palabras = limpio.match(/[a-záéíóúüñ]+/gi) || [];
  if (palabras.length < 8) return null; // en textos muy cortos la fórmula no es fiable
  const frases = Math.max(1, (limpio.match(/[.!?;:]+(\s|$)/g) || []).length);
  const sil = palabras.reduce((n, p) => n + silabas(p), 0);
  return Math.round((206.835 - 62.3 * (sil / palabras.length) - palabras.length / frases) * 10) / 10;
}
export const GRADO = (v) => (v == null ? "—" : v < 40 ? "muy difícil" : v < 55 ? "algo difícil" : v < 65 ? "normal" : v < 80 ? "bastante fácil" : "muy fácil");

/** Textos que ve el paciente: reglas de la base (todas), combinadas, resúmenes de clase, síntomas y alarmas, y textos de ayuda en español. */
export function textosPaciente() {
  const kb = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/kb.json"), "utf8"));
  const out = [];
  for (const c of kb.clases) {
    out.push({ donde: `resumen ${c.id}`, texto: c.resumen });
    for (const amb of ["general", "aerobico", "fuerza", "equilibrio"]) {
      for (const r of c[amb] || []) out.push({ donde: `${c.id}/${amb}`, texto: r.texto });
      for (const pr of c.principios) for (const r of pr[amb] || []) out.push({ donde: `${c.id}/${pr.id}/${amb}`, texto: r.texto });
    }
  }
  for (const r of kb.reglas_combinadas || []) out.push({ donde: `combinada ${r.id}`, texto: r.texto });
  const i18n = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const es = i18n.slice(i18n.indexOf("const ES = {"), i18n.indexOf("\n};", i18n.indexOf("const ES = {")));
  for (const m of es.matchAll(/"((?:ayuda|esencial|alarma|crib|hoy|plan|sesion|sppb|aviso|copia|sync|vistazo|hoja|evo)\.[a-z0-9_.]+)": "((?:[^"\\]|\\.)*)"/g)) {
    const txt = m[2].replace(/\\"/g, '"');
    if (txt.length > 60) out.push({ donde: `i18n ${m[1]}`, texto: txt });
  }
  return out;
}

export function informe(textos = textosPaciente()) {
  const con = textos.map((x) => ({ ...x, v: inflesz(x.texto) })).filter((x) => x.v != null);
  const media = Math.round((con.reduce((n, x) => n + x.v, 0) / con.length) * 10) / 10;
  const grados = {}; for (const x of con) grados[GRADO(x.v)] = (grados[GRADO(x.v)] || 0) + 1;
  return { n: con.length, media, grados, peores: [...con].sort((a, b) => a.v - b.v), muyDificiles: con.filter((x) => x.v < 40) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = informe();
  console.log(`${r.n} textos · INFLESZ medio ${r.media} (${GRADO(r.media)})`);
  for (const [g, n] of Object.entries(r.grados)) console.log(`  ${g}: ${n}`);
  const k = Number(process.argv[process.argv.indexOf("--peores") + 1]) || (process.argv.includes("--peores") ? 20 : 0);
  if (k) for (const x of r.peores.slice(0, k)) console.log(`\n[${x.v}] ${x.donde}\n   ${x.texto}`);
  console.log(`\nmuy difíciles (< 40): ${r.muyDificiles.length}`);
}
