// Compara los estilos calculados de todos los elementos (y sus ::before/::after) con dos hojas de estilo.
// Uso: node difestilos.mjs antes.css despues.css [movimiento]
const pw = await import("/opt/npm-tools/node_modules/playwright/index.mjs");
const fs = await import("fs");
const [A, B, MOV] = process.argv.slice(2);
const css = { A: fs.readFileSync(A, "utf8"), B: fs.readFileSync(B, "utf8") };
const b = await pw.chromium.launch();
const PAC = { meds: [{ pid: "bisoprolol", dosis: 5, tomas: 1 }, { pid: "metformina", dosis: 850, tomas: 2 }, { pid: "acenocumarol", dosis: 2, tomas: 1 }, { pid: "atorvastatina", dosis: 20, tomas: 1 }, { pid: "hiperico", dosis: null, tomas: 1 }], edad: 72 };
const vuelca = (p) => p.evaluate(() => {
  const out = {}; const ruta = (e) => { const r = []; while (e && e.nodeType === 1 && e !== document.documentElement) { let i = 0, x = e; while ((x = x.previousElementSibling)) i++; r.unshift(e.tagName.toLowerCase() + i); e = e.parentElement; } return r.join(">"); };
  const todos = [document.documentElement, ...document.querySelectorAll("body, body *")];
  for (const e of todos) {
    for (const pe of [null, "::before", "::after", "::marker", "::backdrop"]) {
      if (pe === "::marker" && getComputedStyle(e).display !== "list-item") continue;
      if (pe === "::backdrop" && e.tagName !== "DIALOG") continue;
      const cs = getComputedStyle(e, pe);
      if (pe && pe !== "::marker" && pe !== "::backdrop" && cs.content === "none") continue;
      const o = {}; for (let i = 0; i < cs.length; i++) { const k = cs[i]; o[k] = cs.getPropertyValue(k); }
      out[ruta(e) + (pe || "")] = o;
    }
  }
  return out;
});
async function estado(nombre, hoja, { w = 390, h = 844, tema = null, url = "/", acciones = null, estadoApp = PAC, extra = {} } = {}) {
  const c = await b.newContext({ viewport: { width: w, height: h }, locale: "es-ES", serviceWorkers: "block", reducedMotion: MOV ? "no-preference" : "reduce" });
  await c.route("**/css/style.css*", (r) => r.fulfill({ status: 200, contentType: "text/css", body: css[hoja] }));
  await c.addInitScript(([e, t, x]) => { localStorage.setItem("medex.guia", "1"); localStorage.setItem("medex.visto", "9"); if (e) localStorage.setItem("medex.estado", JSON.stringify(e)); if (t) localStorage.setItem("medex.tema", t); for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v); }, [estadoApp, tema, extra]);
  const p = await c.newPage(); await p.goto("http://localhost:8765" + url, { waitUntil: "networkidle" });
  await p.waitForTimeout(url === "/" ? 1100 : 400);
  if (acciones) await acciones(p);
  await p.waitForTimeout(MOV ? 1500 : 250);
  const d = await vuelca(p); await c.close(); return d;
}
const vista = (i) => async (p) => { await p.evaluate((i) => document.querySelectorAll("#barra-inferior button")[i]?.click(), i); await p.waitForTimeout(400); };
const pestana = (t, abrir = false) => async (p) => { await vista(2)(p); await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(300); if (abrir) await p.evaluate(() => document.querySelectorAll("#contenido-tab details").forEach((d) => (d.open = true))); await p.waitForTimeout(200); };
const ESTADOS = [
  ["vacio", { estadoApp: null }],
  ["datos", { acciones: vista(0) }],
  ["medicacion", { acciones: vista(1) }],
  ["buscar", { acciones: async (p) => { await vista(1)(p); await p.fill("#buscar", "valer"); await p.waitForTimeout(400); } }],
  ["informe", { acciones: vista(2) }],
  ["general", { acciones: pestana("general", true) }],
  ["fuerza", { acciones: pestana("fuerza", true) }],
  ["cuando", { acciones: pestana("cuando", true) }],
  ["plan", { acciones: pestana("plan", true) }],
  ["ddi", { acciones: pestana("interacciones", true) }],
  ["perfil", { acciones: async (p) => { await vista(2)(p); await p.evaluate(() => document.querySelectorAll("#perfil details, #esencial details, #vistazo details").forEach((d) => (d.open = true))); } }],
  ["anadir", { acciones: async (p) => { await vista(1)(p); await p.evaluate(() => document.querySelector("#btn-anadir").click()); await p.waitForTimeout(500); } }],
  ["menu", { acciones: async (p) => { await p.evaluate(() => { document.querySelector("#menu-mas").open = true; }); } }],
  ["ficha", { acciones: async (p) => { await p.evaluate(() => document.querySelector("#btn-consultar")?.click()); await p.waitForTimeout(300); await p.fill("#ficha-buscar", "hiperic"); await p.waitForTimeout(300); await p.click("#ficha-sugerencias li"); await p.waitForTimeout(400); } }],
  ["glosario", { acciones: async (p) => { await p.evaluate(() => document.querySelector("#btn-glosario").click()); await p.waitForTimeout(400); } }],
  ["sesion", { acciones: async (p) => { await pestana("plan")(p); await p.evaluate(() => [...document.querySelectorAll(".plan-dia .acciones button")][0]?.click()); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector("#chequeo-saltar")?.click()); await p.waitForTimeout(400); } }],
  ["sppb", { acciones: async (p) => { await p.evaluate(() => document.querySelector("#btn-sppb").click()); await p.waitForTimeout(400); } }],
  ["sugerencia", { acciones: async (p) => { await p.evaluate(() => document.querySelector("#btn-sugerencia").click()); await p.waitForTimeout(400); } }],
  ["oscuro-informe", { tema: "dark", acciones: vista(2) }],
  ["oscuro-plan", { tema: "dark", acciones: pestana("plan", true) }],
  ["oscuro-anadir", { tema: "dark", acciones: async (p) => { await vista(1)(p); await p.evaluate(() => document.querySelector("#btn-anadir").click()); await p.waitForTimeout(500); } }],
  ["contraste", { tema: "contrast", acciones: pestana("general", true) }],
  ["contraste-plan", { tema: "contrast", acciones: pestana("plan", true) }],
  ["escritorio", { w: 1360, h: 860 }],
  ["escritorio-oscuro", { w: 1360, h: 860, tema: "dark" }],
  ["consulta", { w: 1360, h: 860, extra: { "medex.modo": "profesional", "medex.consulta": "1" } }],
  ["movil-pro", { extra: { "medex.modo": "profesional" } }],
  ["acerca", { url: "/acerca.html" }], ["guia", { url: "/guia.html" }], ["novedades", { url: "/novedades.html" }], ["legal", { url: "/legal.html" }], ["presentacion", { url: "/presentacion.html" }],
  ["presentacion-oscuro", { url: "/presentacion.html", tema: "dark" }], ["acerca-escritorio", { url: "/acerca.html", w: 1360, h: 860 }],
];
let total = 0; const IGN = new Set((process.env.IGNORA || "").split(",").filter(Boolean));
for (const [nombre, op] of ESTADOS) {
  const a = await estado(nombre, "A", op), bb = await estado(nombre, "B", op);
  const difs = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(bb)])) {
    if (!a[k] || !bb[k]) { difs.push(`${k}: ${a[k] ? "solo antes" : "solo despues"}`); continue; }
    for (const pr in a[k]) if (!IGN.has(pr) && a[k][pr] !== bb[k][pr]) difs.push(`${k} ${pr}: ${String(a[k][pr]).slice(0, 80)} -> ${String(bb[k][pr]).slice(0, 80)}`);
  }
  total += difs.length;
  console.log(`${nombre}: ${Object.keys(a).length} elementos, ${difs.length} diferencias`);
  for (const d of difs.slice(0, 12)) console.log("   " + d);
}
console.log("TOTAL diferencias:", total);
await b.close();
