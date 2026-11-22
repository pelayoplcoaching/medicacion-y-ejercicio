/* Todas las pruebas a la vez (mejora grande 20): unitarias, de interfaz, del artefacto, de accesibilidad y visuales, cada una con su
   propio servidor y en paralelo. Una detrás de otra suman unos 4 min y medio; a la vez, unos 2 min y medio (medido el
   22/11/2026 en una máquina de 2 núcleos), porque casi todo el tiempo de las de navegador es esperar.
   Uso:  node scripts/pruebas.mjs [--sin-axe] [--sin-visual] [--base <commit>] [--estricto]
   - --base:     versión con la que se comparan las pantallas (HEAD por defecto).
   - --estricto: los cambios visuales por encima del umbral también cuentan como fallo.
   Cada salida completa queda en .pruebas/ (el informe visual, en .visual/); aquí se resume y se muestran solo los fallos. */
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const ESTRICTO = process.argv.includes("--estricto");
const REG = path.join(ROOT, ".pruebas"); // aparte de .visual/, que visual_test.mjs vacía al empezar
fs.mkdirSync(REG, { recursive: true });

const PRUEBAS = [
  { n: "Unitarias", f: "unitarias", args: ["scripts/test.mjs"], res: (t) => t.match(/(\d+\/\d+) pruebas correctas/)?.[1] },
  { n: "Interfaz", f: "interfaz", args: ["scripts/ui_test.mjs"], res: (t) => t.match(/(\d+\/\d+) pruebas de interfaz correctas/)?.[1] },
  { n: "Artefacto", f: "artefacto", args: ["scripts/artifact_test.mjs", "--sin-empaquetar"], res: (t) => t.match(/(\d+\/\d+) pruebas del artefacto correctas/)?.[1] },
  !process.argv.includes("--sin-axe") && { n: "Accesibilidad", f: "accesibilidad", args: ["scripts/axe_test.mjs"], res: (t) => { const m = t.match(/(\d+) escenarios .* violaciones de accesibilidad: (\d+)/); return m && `${m[1]} escenarios, ${m[2]} fallos`; } },
  !process.argv.includes("--sin-visual") && { n: "Visuales", f: "visuales", args: ["scripts/visual_test.mjs", ...(arg("--base") ? ["--base", arg("--base")] : []), ...(ESTRICTO ? ["--estricto"] : []), "--salida", path.join(ROOT, ".visual")], res: (t) => t.match(/(\d+ con cambios, \d+ mínimos y \d+ iguales)/)?.[1], informativa: !ESTRICTO },
].filter(Boolean);

// El artefacto se empaqueta una sola vez, antes de lanzar nada: empaquetar sella de nuevo los archivos, y hacerlo con las pruebas en marcha las confundiría
if (spawnSync("python3", [path.join(ROOT, "scripts/build_artifact.py")], { cwd: ROOT, stdio: "ignore" }).status !== 0) { console.log("✘ No se ha podido empaquetar el artefacto (scripts/build_artifact.py)."); process.exit(1); }
const t0 = Date.now();
console.log(`Lanzando ${PRUEBAS.length} grupos de pruebas a la vez…\n`);
const corre = (p, intento = 1) => new Promise((ok) => {
  const ini = Date.now(), salida = [];
  const h = spawn(process.execPath, p.args, { cwd: ROOT, env: process.env });
  h.stdout.on("data", (d) => salida.push(d)); h.stderr.on("data", (d) => salida.push(d));
  h.on("close", (codigo) => {
    const txt = Buffer.concat(salida).toString();
    fs.writeFileSync(path.join(REG, `${p.f}${intento > 1 ? "-2" : ""}.log`), txt);
    const fallos = txt.split("\n").filter((l) => /^\s*✘/.test(l));
    const bien = codigo === 0 || p.informativa;
    console.log(`${bien ? "✔" : "✘"} ${p.n.padEnd(14)} ${p.res(txt) || (codigo === 0 ? "terminado" : "sin resumen")} · ${Math.round((Date.now() - ini) / 1000)} s${intento > 1 ? " (segundo intento, a solas)" : ""}`);
    for (const l of fallos.slice(0, 12)) console.log("     " + l.trim());
    if (!bien && !fallos.length) console.log("     " + txt.trim().split("\n").slice(-4).join("\n     "));
    ok({ p, bien });
  });
});
const res = await Promise.all(PRUEBAS.map((p) => corre(p)));
// Con todo a la vez en una máquina pequeña, alguna espera de las pruebas con navegador puede quedarse corta: lo que falle se repite una vez, a solas
for (const r of res) if (!r.bien && r.p.f !== "unitarias") { console.log(`\nRepitiendo «${r.p.n}» a solas…`); r.bien = (await corre(r.p, 2)).bien; r.repetida = true; }
const malos = res.filter((r) => !r.bien);
const sueltas = res.filter((r) => r.repetida && r.bien).map((r) => r.p.n);
console.log(`\n${malos.length ? `✘ ${malos.length} grupo(s) con fallos` : "✔ Todo correcto"}${sueltas.length ? ` (${sueltas.join(", ")}: pasó al segundo intento)` : ""} en ${Math.round((Date.now() - t0) / 1000)} s. Salidas completas en ${REG}${PRUEBAS.some((p) => p.f === "visuales") ? `; informe visual en ${path.join(ROOT, ".visual", "index.html")}` : ""}.`);
process.exit(malos.length ? 1 : 0);
