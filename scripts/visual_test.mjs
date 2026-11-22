/* Pruebas visuales automáticas (mejora grande 20).
   Compara píxel a píxel unas 30 pantallas de la versión de trabajo con las de una versión anterior del repositorio
   (por defecto, el último commit) y deja un informe HTML con la imagen de antes, la de ahora y las diferencias en rojo.
   No guarda imágenes de referencia en el repositorio: la versión anterior se extrae con «git archive» y se sirve a la vez.

   Uso:  node scripts/visual_test.mjs [--base <commit>] [--solo <texto>] [--salida <carpeta>] [--hilos <n>] [--estricto]
   - --base:     versión con la que comparar (HEAD por defecto; p. ej. HEAD~1 o una etiqueta).
   - --solo:     solo las pantallas cuyo nombre contenga ese texto.
   - --salida:   carpeta del informe (por defecto .visual/ en la raíz, que no se sube).
   - --hilos:    pantallas a la vez (4 por defecto).
   - --estricto: termina con error si alguna pantalla cambia más del 0,5 %.
   Para que dos capturas de lo mismo sean idénticas: fecha fija (18/11/2026, 10:00), azar con semilla, sin animaciones
   («reducir movimiento» y modo de pruebas), sin cursor y sin los números de versión. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, def = null) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : def; };
const BASE = arg("--base", "HEAD"), SOLO = arg("--solo"), SALIDA = path.resolve(arg("--salida", path.join(ROOT, ".visual"))), HILOS = Number(arg("--hilos", 4)), ESTRICTO = process.argv.includes("--estricto");
const UMBRAL = 0.005; // fracción de píxeles distintos a partir de la cual se considera un cambio
const P_BASE = 8801, P_ACT = 8802;

let playwright;
try { playwright = await import("playwright"); } catch { playwright = await import(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright/index.mjs"); }
const { chromium } = playwright;

/* ---------- la versión anterior, extraída a una carpeta temporal ---------- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pa-visual-"));
execSync(`git -C "${ROOT}" archive --format=tar "${BASE}" app | tar -x -C "${tmp}"`, { stdio: ["ignore", "ignore", "inherit"], shell: "/bin/bash" });
const hashBase = execSync(`git -C "${ROOT}" rev-parse --short "${BASE}"`).toString().trim();
const servidores = [spawn("python3", ["-m", "http.server", String(P_BASE), "--directory", path.join(tmp, "app")], { stdio: "ignore" }), spawn("python3", ["-m", "http.server", String(P_ACT), "--directory", path.join(ROOT, "app")], { stdio: "ignore" })];
await new Promise((r) => setTimeout(r, 900));

/* ---------- pantallas ---------- */
const menu = (attr) => async (p) => { await p.evaluate((a) => { document.querySelector("#menu-mas").open = true; document.querySelector(`#menu-mas [${a}]`).click(); }, attr); };
const tab = (t) => async (p) => { await p.click(`.tabs [data-tab="${t}"]`); await p.waitForTimeout(400); };
const verEl = (sel) => async (p) => { await p.evaluate((s) => { const el = document.querySelector(s); if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({ block: "start" }); } }, sel); await p.waitForTimeout(400); };
const prgEstado = (k) => async (p) => { await p.evaluate((k) => {
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, l = new Date(); l.setHours(12, 0, 0, 0); l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  const mas = (n) => { const d = new Date(l); d.setDate(d.getDate() + n); return iso(d); };
  const hist = (n) => [...Array(n)].map((_, i) => ({ lunes: mas((i - n) * 7), paso: i + 1, ses: 3 + (i % 2), obj: 4, min: 80 + i * 10, rpe: 4.5, clave: k === "fin" && i === n - 1 ? "fin" : i === 1 ? "poco" : "avanza", a: Math.min(12, i + 2) }));
  if (k === "medio") localStorage.setItem("medex.programa", JSON.stringify({ v: 1, nivel: "medio", paso: 3, lunes: mas(0), hist: hist(2), fin: null, mant: false, ciclo: 1, creado: mas(-14) }));
  if (k === "fin") localStorage.setItem("medex.programa", JSON.stringify({ v: 1, nivel: "medio", paso: 12, lunes: mas(0), hist: hist(12), fin: mas(-1), mant: false, ciclo: 1, creado: mas(-84) }));
  const b = document.createElement("button"); b.dataset.programa = ""; document.body.append(b); b.click(); b.remove(); }, k); };
const abre = (n, arg = "") => async (p) => { await p.evaluate(([n, arg]) => { const b = document.createElement("button"); b.dataset.abre = n; if (arg) b.dataset.arg = arg; document.body.append(b); b.click(); b.remove(); }, [n, arg]); await p.waitForSelector(`#${n}[open] .ficha-cuerpo > *`); };
const PANTALLAS = [
  { n: "inicio-vacio-movil", w: 390, vacio: true },
  { n: "inicio-vacio-escritorio", w: 1280, vacio: true },
  { n: "informe-movil", w: 390, pasos: [verEl("#veredicto")] },
  { n: "informe-escritorio", w: 1280 },
  { n: "informe-oscuro", w: 1280, tema: "dark" },
  { n: "informe-contraste", w: 390, tema: "contrast", pasos: [verEl("#veredicto")] },
  { n: "vistazo-movil", w: 390, pasos: [verEl("#vistazo")] },
  { n: "antes-de-empezar", w: 390, pasos: [tab("general"), verEl("#contenido-tab")] },
  { n: "aerobico", w: 390, pasos: [tab("aerobico"), verEl("#contenido-tab")] },
  { n: "fuerza-escritorio", w: 1280, pasos: [tab("fuerza"), verEl(".tabs")] },
  { n: "equilibrio-oscuro", w: 390, tema: "dark", pasos: [tab("equilibrio"), verEl("#contenido-tab")] },
  { n: "interacciones-tabla", w: 390, im: "tabla", pasos: [tab("interacciones"), verEl("#contenido-tab")] },
  { n: "interacciones-red", w: 1280, im: "red", pasos: [tab("interacciones"), verEl(".tabs")] },
  { n: "cuando", w: 390, pasos: [tab("cuando"), verEl("#contenido-tab")] },
  { n: "mi-plan", w: 390, pasos: [tab("plan"), verEl("#contenido-tab")] },
  { n: "mi-plan-oscuro", w: 1280, tema: "dark", pasos: [tab("plan"), verEl(".tabs")] },
  { n: "datos", w: 390, pasos: [verEl("#panel-datos")] },
  { n: "habitos-datos", w: 390, pasos: [verEl("#bloque-habitos")] },
  { n: "profesional", w: 1280, pro: true },
  { n: "guia-conversacion", w: 1280, pro: true, pasos: [async (p) => { await p.click("#consulta [data-conversa]"); await p.waitForSelector("#conversa[open] .cv-paso"); }] },
  { n: "centro-herramientas", w: 390, pasos: [async (p) => { await p.evaluate(() => document.querySelector("[data-centro]").click()); await p.waitForSelector("#centro[open] .ce-hoy button"); }] },
  { n: "centro-busqueda-oscuro", w: 1280, tema: "dark", pasos: [async (p) => { await p.evaluate(() => document.querySelector("[data-centro]").click()); await p.waitForSelector("#centro[open] .ce-hoy button"); await p.fill("#ce-q", "silla"); await p.waitForSelector("#centro .ce-res"); }] },
  { n: "programa-elegir", w: 390, pasos: [prgEstado(""), async (p) => p.waitForSelector("#programa[open] .prg-niveles")] },
  { n: "programa-en-marcha-oscuro", w: 1280, tema: "dark", pasos: [prgEstado("medio"), async (p) => p.waitForSelector("#programa[open] .prg-tabla")] },
  { n: "programa-revision", w: 390, pasos: [prgEstado("fin"), async (p) => p.waitForSelector("#programa[open] .prg-sig")] },
  { n: "vuelta-infeccion", w: 390, pasos: [abre("vuelta"), async (p) => { await p.click('#vuelta [data-vt="motivo"][data-v="infeccion"]'); await p.click('#vuelta [data-vt="tiempo"][data-v="t2"]'); await p.waitForSelector("#vuelta #vt-esc"); await p.$eval("#vt-ver", (e) => e.scrollIntoView({ block: "start" })); }] },
  { n: "vuelta-ingreso-oscuro", w: 1280, tema: "dark", pasos: [abre("vuelta"), async (p) => { await p.click('#vuelta [data-vt="motivo"][data-v="ingreso"]'); await p.click('#vuelta [data-vt="tiempo"][data-v="t3"]'); await p.waitForSelector("#vuelta #vt-esc"); await p.$eval("#vt-ver", (e) => e.scrollIntoView({ block: "start" })); }] },
  { n: "frid-movil", w: 390, pasos: [abre("frid")] },
  { n: "frid-guia-oscuro", w: 1280, tema: "dark", pasos: [abre("frid"), async (p) => { await p.$$eval("#frid details", (ds) => ds.forEach((d) => { d.open = true; })); }] },
  { n: "enfermedad-movil", w: 390, pasos: [abre("enfermedad")] },
  { n: "enfermedad-oscuro", w: 1280, tema: "dark", pasos: [abre("enfermedad"), async (p) => { await p.click("#enfermedad [data-sd-g]"); }] },
  { n: "numeros-movil", w: 390, pasos: [abre("numeros")] },
  { n: "numeros-rojo-oscuro", w: 1280, tema: "dark", pasos: [abre("numeros"), async (p) => { await p.fill("#nm-ta_s", "184"); await p.fill("#nm-pulso", "124"); await p.fill("#nm-temp", "38,4"); await p.click("#numeros button[type=submit]"); await p.waitForSelector("#nm-ver"); }] },
  { n: "cien-movil", w: 390, pasos: [abre("cien")] },
  { n: "cien-oscuro", w: 1280, tema: "dark", pasos: [abre("cien", "ic")] },
  { n: "mitos-movil", w: 390, pasos: [abre("mitos", "betabloqueante")] },
  { n: "mitos-oscuro", w: 1280, tema: "dark", pasos: [abre("mitos", "metformina")] },
  { n: "preguntas-movil", w: 390, pasos: [abre("preguntas"), async (p) => { await p.click('#preguntas [data-pg="sugeridas"]'); await p.fill("#pg-nueva-i", "¿Puedo nadar?"); await p.press("#pg-nueva-i", "Enter"); }] },
  { n: "preguntas-oscuro", w: 1280, tema: "dark", pasos: [abre("preguntas")] },
  { n: "cuerpo-movil", w: 390, pasos: [abre("cuerpo")] },
  { n: "cuerpo-rinon-oscuro", w: 1280, tema: "dark", pasos: [abre("cuerpo", "rinon")] },
  { n: "primeros-dia1", w: 390, pasos: [abre("primeros"), async (p) => { await p.click('#primeros [data-pr="empezar"]'); await p.waitForSelector("#primeros #pr-hoy"); }] },
  { n: "primeros-oscuro", w: 1280, tema: "dark", pasos: [abre("primeros"), async (p) => { await p.click('#primeros [data-pr="empezar"]'); await p.waitForSelector("#primeros #pr-hoy"); await p.click('#pr-lista li[data-id="informe"] [data-pr="marcar"]'); }] },
  { n: "dolor-rodilla", w: 390, pasos: [abre("dolor", "rodilla"), async (p) => p.waitForSelector("#dolor #dl-ver")] },
  { n: "dolor-lumbar-oscuro", w: 1280, tema: "dark", pasos: [abre("dolor", "lumbar"), async (p) => { await p.waitForSelector("#dolor #dl-ver"); await p.$eval("#dl-cuerpo", (e) => { e.scrollTop = e.querySelector("#dl-ver").offsetTop - 80; }); }] },
  { n: "paseo-preparar", w: 390, pasos: [abre("paseo"), async (p) => p.waitForSelector("#paseo .ps-barra")] },
  { n: "paseo-en-marcha-oscuro", w: 1280, tema: "dark", pasos: [abre("paseo"), async (p) => { await p.click('#paseo [data-ps="empezar"]'); await p.waitForSelector("#ps-marcha"); await p.evaluate(() => window.__paPaseo.fijar(400)); }] },
  { n: "rato-sesion", w: 390, pasos: [abre("rato"), async (p) => p.waitForSelector("#rato #rt-lista li")] },
  { n: "rato-pildoras-oscuro", w: 1280, tema: "dark", pasos: [abre("rato", "pildoras"), async (p) => p.waitForSelector("#rato .rt-pil")] },
  { n: "biblioteca-ejercicios", w: 390, pasos: [async (p) => { await p.evaluate(() => { const b = document.createElement("button"); b.dataset.biblioteca = ""; document.body.append(b); b.click(); b.remove(); }); await p.waitForSelector("#biblioteca[open] .bib-lista li"); }] },
  { n: "biblioteca-cambiar-oscuro", w: 1280, tema: "dark", pasos: [async (p) => { await p.evaluate(() => { const b = document.createElement("button"); b.dataset.cambiar = "Sentadilla a la silla"; b.dataset.pict = "sentadilla"; document.body.append(b); b.click(); b.remove(); }); await p.waitForSelector("#biblioteca[open] .bib-lista li"); }] },
  { n: "pastillero", w: 390, pasos: [menu("data-pastillero"), async (p) => p.waitForSelector("#pastillero[open] .pt-cajas")] },
  { n: "simulador", w: 390, pasos: [menu("data-simula"), async (p) => { await p.waitForSelector("#simula[open] .sim-meds"); await p.click("#simula [data-sim-probar]"); }] },
  { n: "cuanto-hace-falta", w: 1280, pasos: [menu("data-dosis"), async (p) => p.waitForSelector("#dosis[open] .ds-svg")] },
  { n: "pruebas-forma", w: 390, pasos: [async (p) => { await p.fill("#edad", "72"); await p.dispatchEvent("#edad", "change"); await p.click("#btn-sft"); await p.waitForSelector("#pruebas[open] .sft-hero"); }] },
  { n: "metas", w: 390, pasos: [menu("data-metas"), async (p) => p.waitForSelector("#metas[open]")] },
  { n: "calor", w: 390, pasos: [menu("data-calor-ver"), async (p) => { await p.waitForSelector("#calor[open] .cal-chips"); await p.click('#calor [data-nivel="2"]'); }] },
  { n: "aprende", w: 390, pasos: [menu("data-aprende"), async (p) => p.waitForSelector("#aprende[open]")] },
  { n: "modo-sencillo", w: 390, pasos: [async (p) => { await p.click("#btn-sencillo-hoy"); await p.waitForSelector("#sencillo #sen-tit"); }] },
  { n: "pagina-acerca", w: 1280, pg: "acerca.html" },
  { n: "pagina-guia", w: 390, pg: "guia.html" },
  { n: "pagina-novedades", w: 390, pg: "novedades.html" },
  { n: "pagina-legal-oscuro", w: 1280, pg: "legal.html", tema: "dark" },
].filter((e) => !SOLO || e.n.includes(SOLO));

const FECHA = new Date("2026-11-18T10:00:00").getTime();
const OCULTAR = "#app-version, #kb-version, #toast, .toast { visibility: hidden !important; } *, *::before, *::after { caret-color: transparent !important; }";

async function captura(navegador, puerto, e) {
  const c = await navegador.newContext({ viewport: { width: e.w, height: e.w < 600 ? 844 : 900 }, deviceScaleFactor: 1, locale: "es-ES", serviceWorkers: "block", reducedMotion: "reduce", colorScheme: "light" });
  await c.addInitScript(([fijo, tema, im]) => {
    const D = Date, inicio = D.now();
    globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [fijo + (D.now() - inicio)])); } static now() { return fijo + (D.now() - inicio); } };
    let s = 42; Math.random = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { localStorage.setItem("medex.guia", "1"); localStorage.setItem("medex.visto", "99"); if (tema) localStorage.setItem("medex.tema", tema); if (im) localStorage.setItem("medex.im-vista", im); } catch {}
  }, [FECHA, e.tema || null, e.im || null]);
  const p = await c.newPage(); p.setDefaultTimeout(8000); // si una pantalla no existe en la otra versión, se sabe pronto
  const errores = []; p.on("pageerror", (x) => errores.push(x.message));
  try {
    await p.goto(`http://localhost:${puerto}/${e.pg || ""}`, { waitUntil: "networkidle" });
    if (e.pg && e.tema) await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, e.tema);
    if (!e.pg) {
      await p.waitForFunction(() => /principios/.test(document.querySelector("#kb-version")?.textContent || ""), null, { timeout: 15000 });
      if (e.pro) await p.click('.modo [data-modo="profesional"]');
      if (!e.vacio) { await p.evaluate(() => document.querySelector("#btn-ejemplo").click()); await p.waitForTimeout(900); }
      for (const paso of e.pasos || []) await paso(p);
    }
    await p.addStyleTag({ content: OCULTAR });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(700);
    return { png: await p.screenshot(), errores };
  } catch (x) {
    return { png: null, errores: [...errores, "no se pudo preparar la pantalla: " + x.message.split("\n")[0]] };
  } finally { await c.close(); }
}

async function comparar(pag, a, b) {
  return pag.evaluate(async ([a, b]) => {
    const carga = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
    const [A, B] = await Promise.all([carga(a), carga(b)]);
    if (A.width !== B.width || A.height !== B.height) return { ratio: 1, nota: `tamaño distinto (${A.width}×${A.height} → ${B.width}×${B.height})` };
    const c = document.createElement("canvas"); c.width = B.width; c.height = B.height; const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(B, 0, 0); const img = g.getImageData(0, 0, c.width, c.height), db = img.data;
    let n = 0;
    for (let i = 0; i < db.length; i += 4) {
      const dif = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (dif > 40) { n++; db[i] = 228; db[i + 1] = 30; db[i + 2] = 64; db[i + 3] = 255; }
      else { const y = db[i] * 0.3 + db[i + 1] * 0.59 + db[i + 2] * 0.11, v = 255 - (255 - y) * 0.22; db[i] = db[i + 1] = db[i + 2] = v; }
    }
    g.putImageData(img, 0, 0);
    return { ratio: n / (db.length / 4), diff: c.toDataURL("image/png") };
  }, [`data:image/png;base64,${a.toString("base64")}`, `data:image/png;base64,${b.toString("base64")}`]);
}

/* ---------- ejecución en paralelo ---------- */
const t0 = Date.now();
fs.rmSync(SALIDA, { recursive: true, force: true }); fs.mkdirSync(path.join(SALIDA, "img"), { recursive: true });
const navegador = await chromium.launch();
const comparador = await navegador.newPage();
const resultados = [];
let siguiente = 0;
async function trabajador() {
  while (siguiente < PANTALLAS.length) {
    const e = PANTALLAS[siguiente++];
    const [a, b] = await Promise.all([captura(navegador, P_BASE, e), captura(navegador, P_ACT, e)]);
    const r = { n: e.n, w: e.w, errores: [...new Set([...a.errores.map((x) => "antes: " + x), ...b.errores.map((x) => "ahora: " + x)])] };
    if (a.png) fs.writeFileSync(path.join(SALIDA, "img", `${e.n}-antes.png`), a.png);
    if (b.png) fs.writeFileSync(path.join(SALIDA, "img", `${e.n}-ahora.png`), b.png);
    if (a.png && b.png) {
      const c = await comparar(comparador, a.png, b.png);
      r.ratio = c.ratio; r.nota = c.nota || "";
      if (c.diff) fs.writeFileSync(path.join(SALIDA, "img", `${e.n}-dif.png`), Buffer.from(c.diff.split(",")[1], "base64"));
    } else r.ratio = null;
    resultados.push(r);
    const pct = r.ratio == null ? "sin captura" : r.ratio === 0 ? "igual" : `${(r.ratio * 100).toFixed(2)} %`;
    console.log(`  ${r.ratio == null ? "?" : r.ratio > UMBRAL ? "≠" : r.ratio > 0 ? "≈" : "="} ${e.n.padEnd(26)} ${pct}${r.nota ? " · " + r.nota : ""}${r.errores.length ? " · " + r.errores.join(" | ") : ""}`);
  }
}
console.log(`Pruebas visuales: ${PANTALLAS.length} pantallas, ahora frente a ${BASE} (${hashBase})`);
await Promise.all(Array.from({ length: Math.max(1, HILOS) }, trabajador));
await navegador.close();
servidores.forEach((s) => s.kill());
fs.rmSync(tmp, { recursive: true, force: true });

/* ---------- informe ---------- */
resultados.sort((a, b) => (b.ratio ?? 2) - (a.ratio ?? 2) || a.n.localeCompare(b.n));
const cambios = resultados.filter((r) => r.ratio == null || r.ratio > UMBRAL), leves = resultados.filter((r) => r.ratio > 0 && r.ratio <= UMBRAL), iguales = resultados.filter((r) => r.ratio === 0);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const fila = (r) => `<article class="${r.ratio == null || r.ratio > UMBRAL ? "cambio" : r.ratio > 0 ? "leve" : "igual"}"><header><h2>${esc(r.n)}</h2><span>${r.ratio == null ? "sin captura" : r.ratio === 0 ? "igual" : (r.ratio * 100).toFixed(2) + " %"}</span></header>${r.nota ? `<p>${esc(r.nota)}</p>` : ""}${r.errores.length ? `<p class="err">${r.errores.map(esc).join("<br>")}</p>` : ""}
  <div class="tres">${["antes", "ahora", "dif"].map((k) => fs.existsSync(path.join(SALIDA, "img", `${r.n}-${k}.png`)) ? `<figure><a href="img/${r.n}-${k}.png"><img src="img/${r.n}-${k}.png" alt="${k} · ${esc(r.n)}" loading="lazy"></a><figcaption>${{ antes: `Antes (${hashBase})`, ahora: "Ahora", dif: "Diferencias" }[k]}</figcaption></figure>` : "").join("")}</div></article>`;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pruebas visuales · Pauta Activa</title>
<style>
:root { --fondo: #f6f6f9; --sup: #fff; --tinta: #151423; --suave: #55546a; --linea: #dddce6; --marca: #593ede; --rojo: #c0271d; --ambar: #b36400; --verde: #1d7a4d; }
@media (prefers-color-scheme: dark) { :root { --fondo: #121120; --sup: #1c1a2e; --tinta: #eeedf6; --suave: #aaa8c0; --linea: #33304a; --marca: #8b7cf6; --rojo: #f06a5f; --ambar: #f0a43a; --verde: #4fc28a; } }
body { margin: 0; padding: 24px 16px 48px; background: var(--fondo); color: var(--tinta); font: 15px/1.45 system-ui, sans-serif; }
main { max-width: 1280px; margin: 0 auto; }
h1 { margin: 0 0 4px; font-size: 1.5rem; } .sub { margin: 0 0 18px; color: var(--suave); }
.cifras { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 22px; }
.cifras div { padding: 10px 14px; border-radius: 12px; background: var(--sup); border: 1px solid var(--linea); }
.cifras b { display: block; font: 800 1.6rem/1 ui-monospace, monospace; }
.c-cambio b { color: var(--rojo); } .c-leve b { color: var(--ambar); } .c-igual b { color: var(--verde); }
article { margin: 0 0 16px; padding: 14px; border-radius: 14px; background: var(--sup); border: 1px solid var(--linea); border-left: 5px solid var(--verde); }
article.cambio { border-left-color: var(--rojo); } article.leve { border-left-color: var(--ambar); }
article header { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
article h2 { margin: 0; font-size: 1rem; font-family: ui-monospace, monospace; } article header span { font: 700 .9rem ui-monospace, monospace; color: var(--suave); }
.err { color: var(--rojo); font-size: .85rem; }
.tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
@media (max-width: 640px) { .tres { grid-template-columns: 1fr; } }
figure { margin: 0; } figure img { width: 100%; height: auto; display: block; border: 1px solid var(--linea); border-radius: 8px; }
figcaption { font-size: .8rem; color: var(--suave); margin-top: 4px; }
details { margin-top: 18px; } summary { cursor: pointer; font-weight: 700; }
</style></head><body><main>
<h1>Pruebas visuales</h1><p class="sub">${resultados.length} pantallas · ahora frente a ${esc(BASE)} (${hashBase}) · umbral ${(UMBRAL * 100).toFixed(1)} % de píxeles · ${new Date().toLocaleString("es-ES")}</p>
<div class="cifras"><div class="c-cambio"><b>${cambios.length}</b>con cambios</div><div class="c-leve"><b>${leves.length}</b>cambios mínimos</div><div class="c-igual"><b>${iguales.length}</b>iguales</div></div>
${cambios.map(fila).join("") || "<p>Ninguna pantalla ha cambiado por encima del umbral.</p>"}
${leves.length ? `<details open><summary>Cambios mínimos (${leves.length})</summary>${leves.map(fila).join("")}</details>` : ""}
${iguales.length ? `<details><summary>Iguales (${iguales.length})</summary>${iguales.map(fila).join("")}</details>` : ""}
</main></body></html>`;
fs.writeFileSync(path.join(SALIDA, "index.html"), html);
console.log(`\n${cambios.length} con cambios, ${leves.length} mínimos y ${iguales.length} iguales en ${Math.round((Date.now() - t0) / 1000)} s. Informe: ${path.join(SALIDA, "index.html")}`);
process.exit(ESTRICTO && cambios.length ? 1 : 0);
