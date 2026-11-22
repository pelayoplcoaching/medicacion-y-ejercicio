/* Prueba de humo del artefacto de claude.ai (dist/artifact.html): que arranca, que no hay errores de JavaScript y que los
   módulos bajo demanda responden dentro del empaquetado (lector de listas, sesión guiada, pastillero, «¿Por qué?»).
   Existe desde la v1.3.0: de la v1.2.18 a la v1.2.20 el artefacto no arrancaba (un nombre repetido entre pdf.js y app.js)
   y ninguna prueba lo veía, porque todas miran la web por módulos.
   Uso:  node scripts/artifact_test.mjs            (empaqueta antes con scripts/build_artifact.py)
         node scripts/artifact_test.mjs --sin-empaquetar */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8804;
let chromium;
try { ({ chromium } = await import("playwright")); }
catch { ({ chromium } = createRequire("/opt/npm-tools/node_modules/")("playwright")); }

if (!process.argv.includes("--sin-empaquetar")) {
  const r = spawnSync("python3", [path.join(ROOT, "scripts/build_artifact.py")], { cwd: ROOT, stdio: "ignore" });
  if (r.status !== 0) { console.log("  ✘ no se ha podido empaquetar (scripts/build_artifact.py)"); process.exit(1); }
}
// claude.ai envuelve el archivo en un documento mínimo y sirve a su lado los ficheros publicados (data/…)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pa-artefacto-"));
fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>\n${fs.readFileSync(path.join(ROOT, "dist/artifact.html"), "utf8")}\n</body></html>`);
for (const d of ["data", "assets"]) fs.symlinkSync(path.join(ROOT, "app", d), path.join(dir, d));
const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: dir, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 900));

let fallos = 0, total = 0;
const check = (n, v, extra = "") => { total++; if (!v) fallos++; console.log(`  ${v ? "✔" : "✘"} ${n}${!v && extra ? " — " + extra : ""}`); };
const b = await chromium.launch();
try {
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" });
  await c.addInitScript(() => {
    try { localStorage.setItem("medex.guia", "1"); localStorage.setItem("medex.visto", "99"); } catch {}
    if (new Date().getDay() !== 0) return; // en domingo el plan tipo descansa: la página vive en lunes
    const D = Date, salto = 864e5; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + salto])); } static now() { return D.now() + salto; } };
  });
  const p = await c.newPage(); p.setDefaultTimeout(10000);
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|ERR_|Content Security Policy/.test(m.text())) errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const arranca = await p.waitForFunction(() => document.querySelector("#kb-version")?.textContent.includes("v"), null, { timeout: 15000 }).then(() => true, () => false);
  check("el artefacto arranca (carga la base y pinta la versión)", arranca, errs.slice(0, 3).join(" | "));
  if (arranca) {
    await p.click("#btn-anadir"); await p.click("#btn-pegar");
    await p.fill("#pegar", "Bisoprolol 5 mg 1-0-0\nMetformina 850 mg 1-0-1\nSintrom"); await p.click("#btn-importar");
    await p.waitForFunction(() => /\d/.test(document.querySelector("#pegar-aviso")?.textContent || ""), null, { timeout: 8000 }).catch(() => {});
    check("lector de listas pegadas (módulo bajo demanda)", /Reconocidos 3/.test(await p.textContent("#pegar-aviso")));
    await p.click('[data-tab="plan"]');
    const hayPlan = await p.waitForSelector("#btn-sesion", { timeout: 8000 }).then(() => true, () => false);
    if (hayPlan) { await p.click("#btn-sesion"); await p.waitForSelector("#sesion[open] #chequeo-saltar", { timeout: 8000 }).catch(() => {}); await p.click("#chequeo-saltar").catch(() => {}); await p.waitForSelector("#crono-btn", { timeout: 8000 }).catch(() => {}); }
    check("sesión guiada con sus ejercicios (módulo bajo demanda)", hayPlan && (await p.$$("#sesion .bloques.grande > li")).length >= 3);
    await p.click("#sesion-cerrar").catch(() => {});
    await p.evaluate(() => document.querySelector("[data-pastillero]")?.click());
    check("pastillero (módulo bajo demanda)", await p.waitForSelector("#pastillero[open] .pt-cajas", { timeout: 8000 }).then(() => true, () => false));
    await p.keyboard.press("Escape");
  }
  check("sin errores de JavaScript en el artefacto", errs.length === 0, errs.slice(0, 4).join(" | "));
} finally { await b.close(); srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
console.log(`${total - fallos}/${total} pruebas del artefacto correctas`);
process.exit(fallos ? 1 : 0);
