/* Accesibilidad automática con axe-core (WCAG 2.1 A y AA) en los escenarios principales de la app: claro, oscuro, alto
   contraste, móvil y escritorio, modo profesional y cada ventana (pruebas, metas, resumen del mes, calor, constantes,
   pastillero, mapa, simulador, beneficios, dosis, aprende, hábitos, guía de conversación…). Mejora grande 20: antes vivía
   fuera del repositorio; ahora levanta su propio servidor y corre varios escenarios a la vez.
   Uso:  node scripts/axe_test.mjs [prefijo] [--hilos n]
   axe-core se toma de AXE_PATH o se instala una vez en ~/.cache/pauta-activa-pruebas (npm). */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8803;
const CACHE = path.join(os.homedir(), ".cache", "pauta-activa-pruebas");
let axePath = process.env.AXE_PATH || path.join(CACHE, "node_modules", "axe-core", "axe.min.js");
if (!fs.existsSync(axePath)) { console.log("Instalando axe-core 4.10.2 (solo la primera vez)…"); fs.mkdirSync(CACHE, { recursive: true }); execSync(`npm i --prefix "${CACHE}" axe-core@4.10.2 --silent --no-audit --no-fund`, { stdio: "inherit" }); }
const AXE = fs.readFileSync(axePath, "utf8");
let playwright;
try { playwright = await import("playwright"); } catch { playwright = await import(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright/index.mjs"); }
const servidor = spawn("python3", ["-m", "http.server", String(PORT), "--directory", path.join(ROOT, "app")], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const b = await playwright.chromium.launch();
const esc0 = [
  { n: "claro-ejemplo", w: 1280 }, { n: "oscuro-ejemplo", w: 1280, tema: "dark" }, { n: "contraste", w: 1280, tema: "contrast" },
  { n: "pro", w: 1280, pro: true }, { n: "pro-oscuro", w: 1280, pro: true, tema: "dark" }, { n: "movil", w: 390 }, { n: "movil-oscuro", w: 390, tema: "dark" },
  { n: "plan", w: 1280, tab: "plan" }, { n: "vacio", w: 1280, vacio: true },
  { n: "acerca", w: 1280, pg: "acerca.html" }, { n: "legal", w: 1280, pg: "legal.html" }, { n: "novedades", w: 1280, pg: "novedades.html" }, { n: "guia", w: 1280, pg: "guia.html" }, { n: "presentacion", w: 1280, pg: "presentacion.html" }, { n: "guia-oscuro", w: 1280, pg: "guia.html", tema: "dark" },
  { n: "sup-claro", w: 390, sup: true }, { n: "sup-oscuro", w: 390, sup: true, tema: "dark" }, { n: "sup-contraste", w: 1280, sup: true, tema: "contrast" }, { n: "sup-ddi", w: 1280, sup: true, tab: "interacciones" },
  { n: "sesion-voz", w: 390, tab: "plan", ses: true }, { n: "sesion-oscuro", w: 1280, tab: "plan", ses: true, tema: "dark" }, { n: "sesion-contraste", w: 390, tab: "plan", ses: true, tema: "contrast" },
  { n: "semana-claro", w: 390, tab: "plan", diario: true }, { n: "semana-oscuro", w: 1280, tab: "plan", diario: true, tema: "dark" }, { n: "semana-contraste", w: 390, tab: "plan", diario: true, tema: "contrast" },
  { n: "porque-claro", w: 390, porque: true }, { n: "porque-oscuro", w: 1280, porque: true, tema: "dark" }, { n: "porque-contraste", w: 390, porque: true, tema: "contrast" },
  { n: "sencillo-claro", w: 390, sencillo: true }, { n: "sencillo-oscuro", w: 1280, sencillo: true, tema: "dark" }, { n: "sencillo-contraste", w: 390, sencillo: true, tema: "contrast" },
  { n: "ejercicio-claro", w: 390, tab: "plan", ejercicio: true }, { n: "ejercicio-oscuro", w: 1280, tab: "plan", ejercicio: true, tema: "dark" }, { n: "ejercicio-contraste", w: 390, tab: "plan", ejercicio: true, tema: "contrast" },
  { n: "pruebas-inicio", w: 390, pruebas: 0 }, { n: "pruebas-prueba", w: 390, pruebas: 1, tema: "dark" }, { n: "pruebas-flex", w: 1280, pruebas: 4 }, { n: "pruebas-res", w: 390, pruebas: 9 }, { n: "pruebas-res-oscuro", w: 1280, pruebas: 9, tema: "dark" }, { n: "pruebas-contraste", w: 390, pruebas: 9, tema: "contrast" },
  { n: "metas-vacio", w: 390, tab: "plan", metas: 0 }, { n: "metas-plan", w: 390, tab: "plan", metas: 1 }, { n: "metas-plan-oscuro", w: 1280, tab: "plan", metas: 1, tema: "dark" }, { n: "metas-elegir", w: 390, tab: "plan", metas: 2, tema: "contrast" }, { n: "metas-detalle", w: 390, tab: "plan", metas: 3 }, { n: "metas-detalle-oscuro", w: 1280, tab: "plan", metas: 3, tema: "dark" },
  { n: "mes-familia", w: 390, tab: "plan", diario: true, mes: "familia" }, { n: "mes-medico-oscuro", w: 1280, tab: "plan", diario: true, mes: "medico", tema: "dark" }, { n: "mes-contraste", w: 390, tab: "plan", diario: true, mes: "medico", tema: "contrast" },
  { n: "calor-claro", w: 390, calor: 2 }, { n: "calor-oscuro", w: 1280, calor: 3, tema: "dark" }, { n: "calor-contraste", w: 390, calor: 1, tema: "contrast" }, { n: "calor-hoy", w: 390, calor: 2, cerrar: true },
  { n: "ct-claro", w: 390, tab: "plan", diarioCt: true, ct: true }, { n: "ct-oscuro", w: 1280, tab: "plan", diarioCt: true, ct: true, tema: "dark" }, { n: "ct-contraste", w: 390, tab: "plan", diarioCt: true, ct: true, tema: "contrast" },
  { n: "pt-claro", w: 390, pt: true }, { n: "pt-oscuro", w: 1280, pt: true, tema: "dark" }, { n: "pt-contraste", w: 390, pt: true, tema: "contrast" }, { n: "pt-cuando", w: 390, tab: "cuando" },
  { n: "im-tabla", w: 390, tab: "interacciones", im: "tabla" }, { n: "im-red-oscuro", w: 1280, tab: "interacciones", im: "red", imSel: true, tema: "dark" }, { n: "im-contraste", w: 390, tab: "interacciones", im: "tabla", imSel: true, tema: "contrast" },
  { n: "sim-vacio", w: 390, sim: 0 }, { n: "sim-res", w: 390, sim: 1 }, { n: "sim-oscuro", w: 1280, sim: 1, tema: "dark" }, { n: "sim-contraste", w: 390, sim: 1, tema: "contrast" }, { n: "sim-impacto", w: 1280, pro: true },
  { n: "ben-claro", w: 390, ben: ["diabetes", "hipertension", "artrosis"] }, { n: "ben-oscuro", w: 1280, ben: ["insuficiencia_cardiaca", "osteoporosis", "epoc_asma", "cancer"], tema: "dark" }, { n: "ben-contraste", w: 390, ben: ["embarazo", "renal"], tema: "contrast" },
  { n: "ds-min", w: 390, tab: "plan", diario: true, ds: "min" }, { n: "ds-pasos-oscuro", w: 1280, tab: "plan", diario: true, ds: "pasos", tema: "dark" }, { n: "ds-contraste", w: 390, tab: "plan", diario: true, ds: "min", tema: "contrast" },
  { n: "centro-claro", w: 390, ce: "" }, { n: "centro-oscuro", w: 1280, ce: "", tema: "dark" }, { n: "centro-busca-contraste", w: 390, ce: "silla", tema: "contrast" },
  { n: "programa-elegir-claro", w: 390, prg: "" }, { n: "programa-en-marcha-oscuro", w: 1280, prg: "medio", tema: "dark" }, { n: "programa-revision-contraste", w: 390, prg: "fin", tema: "contrast" },
  { n: "vuelta-inicio-claro", w: 390, abre: "vuelta" }, { n: "vuelta-ingreso-oscuro", w: 1280, abre: "vuelta", vuelta: ["ingreso", "t2"], tema: "dark" }, { n: "vuelta-infeccion-contraste", w: 390, abre: "vuelta", vuelta: ["infeccion", "t3"], tema: "contrast" },
  { n: "escalas-lista-claro", w: 390, abre: "escalas" }, { n: "escalas-frail-oscuro", w: 1280, abre: "escalas", arg: "frail", escalas: [["fatiga", 0], ["resistencia", 0], ["deambulacion", 1], ["peso", 1]], tema: "dark" }, { n: "escalas-caidas-contraste", w: 390, abre: "escalas", arg: "caidas", escalas: [["inestable", 1], ["miedo", 0], ["caido", 1]], tema: "contrast" }, { n: "escalas-actividad-claro", w: 390, abre: "escalas", arg: "pavs", pavs: ["3", "40", "1"] },
  { n: "frid-claro", w: 390, abre: "frid" }, { n: "frid-abierto-oscuro", w: 1280, abre: "frid", frid: true, tema: "dark" }, { n: "frid-abierto-contraste", w: 390, abre: "frid", frid: true, tema: "contrast" },
  { n: "enfermedad-claro", w: 390, abre: "enfermedad" }, { n: "enfermedad-oscuro", w: 1280, abre: "enfermedad", tema: "dark" }, { n: "enfermedad-contraste", w: 390, abre: "enfermedad", tema: "contrast" },
  { n: "numeros-claro", w: 390, abre: "numeros" }, { n: "numeros-rojo-oscuro", w: 1280, abre: "numeros", numeros: { ta_s: 184, pulso: 124, temp: "38,4" }, tema: "dark" }, { n: "numeros-ambar-contraste", w: 390, abre: "numeros", numeros: { glucosa: 82, ta_s: 165, spo2: 96 }, tema: "contrast" }, { n: "numeros-verde-claro", w: 390, abre: "numeros", numeros: { ta_s: 128, ta_d: 78, pulso: 66 } },
  { n: "cien-claro", w: 390, abre: "cien" }, { n: "cien-oscuro", w: 1280, abre: "cien", arg: "fa", tema: "dark" }, { n: "cien-contraste", w: 390, abre: "cien", arg: "ci", tema: "contrast" },
  { n: "mitos-claro", w: 390, abre: "mitos", arg: "betabloqueante" }, { n: "mitos-oscuro", w: 1280, abre: "mitos", arg: "metformina", tema: "dark" }, { n: "mitos-contraste", w: 390, abre: "mitos", arg: "insulina", tema: "contrast" },
  { n: "preguntas-claro", w: 390, abre: "preguntas" }, { n: "preguntas-oscuro", w: 1280, abre: "preguntas", preguntas: true, tema: "dark" }, { n: "preguntas-contraste", w: 390, abre: "preguntas", preguntas: true, tema: "contrast" },
  { n: "cuerpo-claro", w: 390, abre: "cuerpo" }, { n: "cuerpo-rinon-oscuro", w: 1280, abre: "cuerpo", arg: "rinon", tema: "dark" }, { n: "cuerpo-contraste", w: 390, abre: "cuerpo", arg: "higado", tema: "contrast" },
  { n: "primeros-inicio-claro", w: 390, abre: "primeros" }, { n: "primeros-curso-oscuro", w: 1280, abre: "primeros", primeros: true, tema: "dark" }, { n: "primeros-curso-contraste", w: 390, abre: "primeros", primeros: true, tema: "contrast" },
  { n: "dolor-zonas-claro", w: 390, abre: "dolor" }, { n: "dolor-lumbar-oscuro", w: 1280, abre: "dolor", arg: "lumbar", tema: "dark" }, { n: "dolor-rodilla-contraste", w: 390, abre: "dolor", arg: "rodilla", tema: "contrast" },
  { n: "paseo-preparar-claro", w: 390, abre: "paseo" }, { n: "paseo-programa-oscuro", w: 1280, abre: "paseo", arg: "prog", tema: "dark" }, { n: "paseo-en-marcha-contraste", w: 390, abre: "paseo", marcha: 400, tema: "contrast" },
  { n: "rato-sesion-claro", w: 390, abre: "rato" }, { n: "rato-pildoras-oscuro", w: 1280, abre: "rato", arg: "pildoras", tema: "dark" }, { n: "rato-pildoras-contraste", w: 390, abre: "rato", arg: "pildoras", tema: "contrast" },
  { n: "biblioteca-claro", w: 390, bib: "" }, { n: "biblioteca-oscuro", w: 1280, bib: "", tema: "dark" }, { n: "biblioteca-cambiar-contraste", w: 390, bib: "Sentadilla a la silla", tema: "contrast" },
  { n: "hab-claro", w: 390, hab: ["diario", "si", "mucho"] }, { n: "hab-oscuro", w: 1280, hab: ["aveces", "dejado", "medio"], tema: "dark" }, { n: "hab-contraste", w: 390, hab: ["diario", "si", "mucho"], tema: "contrast" }, { n: "hab-vacio", w: 390, hab: [] },
  { n: "cv-uno", w: 390, pro: true, cv: "uno" }, { n: "cv-cinco-oscuro", w: 1280, pro: true, cv: "cinco", tema: "dark" }, { n: "cv-mas-contraste", w: 390, pro: true, cv: "mas", tema: "contrast" }, { n: "cv-cinco-claro", w: 390, pro: true, cv: "cinco" },
  { n: "aprende-claro", w: 390, tab: "plan", aprende: true }, { n: "aprende-oscuro", w: 1280, tab: "plan", aprende: true, tema: "dark" }, { n: "aprende-contraste", w: 390, tab: "plan", aprende: true, tema: "contrast" },
];
const DIARIO = (() => { const xs = [], hoy = new Date(); const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; for (let i = 80; i >= 0; i--) { const d = new Date(hoy); d.setDate(d.getDate() - i); const w = d.getDay(); if (Math.floor(i / 7) === 5) continue; if (w === 1 || w === 5) xs.push({ id: "a" + i, fecha: iso(d), tipo: "fuerza_eq", min: 35, rpe: 5, sintomas: [] }); else if ((w === 2 || w === 4) && i % 3) xs.push({ id: "c" + i, fecha: iso(d), tipo: "aerobico", min: 25 + (i % 4) * 10, rpe: 5, sintomas: [] }); } return xs; })();
const DIARIO_CT = (() => { const xs = [], hoy = new Date(); const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; let k = 0; for (let i = 30; i >= 0; i -= 3) { const d = new Date(hoy); d.setDate(d.getDate() - i); k++; xs.push({ id: "k" + i, fecha: iso(d), tipo: "aerobico", min: 30, rpe: 5, sintomas: [], const: { glucosa_antes: [140, 64, 210, 262, 130][k % 5], glucosa_despues: [120, 90, 170, 200, 115][k % 5], ta: [138, 182, 165, 88, 140][k % 5], fc: [102, 110, 96, 118, 104][k % 5] } }); } return xs; })();
const pref = process.argv.slice(2).find((a) => !a.startsWith("--") && a !== process.argv[process.argv.indexOf("--hilos") + 1]);
const esc = pref ? esc0.filter((e) => e.n.startsWith(pref)) : esc0;
const hilosI = process.argv.indexOf("--hilos"), HILOS = hilosI > -1 ? Number(process.argv[hilosI + 1]) : 4;
async function correr(e) {
  const c = await b.newContext({ viewport: { width: e.w, height: 900 }, locale: "es-ES", serviceWorkers: "block", bypassCSP: true, reducedMotion: "reduce" });
  // el plan tipo descansa el domingo y algunos escenarios usan la sesión del día: en domingo, la página vive en lunes
  await c.addInitScript(() => { if (new Date().getDay() !== 0) return; const D = Date, salto = 864e5; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + salto])); } static now() { return D.now() + salto; } }; });
  await c.addInitScript(([tema, diario, im]) => { try { localStorage.setItem("medex.guia", "1"); localStorage.setItem("medex.visto", "9"); if (tema) localStorage.setItem("medex.tema", tema); if (im) localStorage.setItem("medex.im-vista", im); if (diario) localStorage.setItem("medex.diario", JSON.stringify(diario)); } catch {} }, [e.tema || null, e.diario ? DIARIO : e.diarioCt ? DIARIO_CT : null, e.im || null]);
  const p = await c.newPage(); p.setDefaultTimeout(12000);
  await p.goto(`http://localhost:${PORT}/` + (e.pg || ""), { waitUntil: "networkidle" });
  if (e.tema && e.pg) { await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, e.tema); await p.waitForTimeout(700); }
  if (!e.pg) {
    await p.waitForFunction(() => /principios/.test(document.querySelector("#kb-version").textContent), null, { timeout: 15000 });
    if (e.pro) await p.click('.modo [data-modo="profesional"]');
    if (!e.vacio) { await p.evaluate(() => document.querySelector("#btn-ejemplo").click()); await p.waitForTimeout(900); }
    if (e.sup) {
      for (const q of ["hierba de san", "creatina", "ginkgo"]) { await p.fill("#buscar", q); await p.waitForSelector("#sugerencias li"); await p.click("#sugerencias li"); await p.click("#form-med button[type=submit]"); await p.waitForTimeout(200); }
      await p.click("#sup-rapido > summary"); await p.fill("#buscar", "cola de"); await p.waitForSelector("#sugerencias li"); await p.waitForTimeout(200);
    }
    if (e.tab) { await p.click(`.tabs [data-tab="${e.tab}"]`); await p.waitForTimeout(e.diario ? 900 : 300); }
    if (e.aprende) { await p.click(".aprende-tile [data-aprende]"); await p.waitForSelector("#aprende[open]"); await p.click("#aprende .apr-lista button >> nth=0"); for (let i = 0; i < 4; i++) await p.click("#aprende [data-sig]"); await p.click("#aprende [data-o] >> nth=1"); await p.waitForTimeout(400); }
    if (e.pruebas != null) {
      await p.fill("#edad", "72"); await p.dispatchEvent("#edad", "change"); await p.click("#btn-sft"); await p.waitForSelector("#pruebas[open] .sft-hero");
      if (e.pruebas > 0) {
        await p.check('input[name="sft-sexo"][value="m"]', { force: true }); await p.check("#sft-ok"); await p.click("#sft-empezar");
        const datos = [["valor", "13"], ["valor", "15"], ["valor", "82"], ["cm0", "3"], ["cm0", "6"], ["int0", "6.1"]];
        for (let i = 0; i < Math.min(e.pruebas - 1, 6); i++) { const [k, v] = datos[i]; await p.fill(k === "valor" ? "[data-valor]" : k === "cm0" ? '[data-cm="0"]' : '[data-int="0"]', v); await p.click("[data-sig]"); await p.waitForTimeout(60); }
        if (e.pruebas === 4) await p.fill('[data-cm="0"]', "3");
      }
      await p.waitForTimeout(1300);
    }
    if (e.metas != null) {
      await p.waitForSelector(".metas-plan:not([hidden])");
      if (e.metas >= 1) { await p.click('[data-meta-elegir="escaleras"]'); await p.waitForSelector(".mt-card"); await p.click('[data-meta-hito="escaleras"]'); await p.waitForTimeout(500); }
      if (e.metas === 2) { await p.click(".metas-plan [data-metas]"); await p.waitForSelector("#metas[open] .mt-opciones"); await p.click('[data-op="compra"]'); }
      if (e.metas === 3) { await p.click('[data-meta-ver="escaleras"]'); await p.waitForSelector("#metas[open] .mt-hitos"); }
      await p.waitForTimeout(900);
    }
    if (e.calor != null) {
      await p.evaluate(() => { document.querySelector("#menu-mas").open = true; document.querySelector("#menu-mas [data-calor-ver]").click(); }); await p.waitForSelector("#calor[open] .cal-chips");
      await p.click(`#calor [data-nivel="${e.calor}"]`); await p.waitForTimeout(600);
      if (e.cerrar) { await p.click("#cal-cerrar"); await p.waitForTimeout(400); }
    }
    if (e.im) { await p.waitForSelector(".im-mapa .im-vis > *"); if (e.imSel) await p.click(".im-mapa :is(.im-nom, .im-nodo) >> nth=0"); await p.waitForTimeout(900); }
    if (e.sim != null) { await p.evaluate(() => { document.querySelector("#menu-mas").open = true; document.querySelector("#menu-mas [data-simula]").click(); }); await p.waitForSelector("#simula[open] .sim-meds"); if (e.sim) await p.click("#simula [data-sim-probar]"); await p.waitForTimeout(800); }
    if (e.ben) { for (const id of e.ben) { await p.evaluate((id) => { const i = document.getElementById("cond-" + id); if (i && !i.checked) i.click(); }, id); await p.waitForTimeout(120); } await p.click('.tabs [data-tab="general"]').catch(() => {}); await p.waitForSelector('details[data-sec="beneficios"] .ben-t'); await p.evaluate(() => document.querySelector('details[data-sec="beneficios"] .ben-mas')?.click()); await p.waitForTimeout(900); }
    if (e.cv) { await p.click('#consulta [data-conversa]'); await p.waitForSelector('#conversa[open] .cv-paso'); if (e.cv !== "uno") await p.click(`#conversa [data-cv-tab="${e.cv}"]`); if (e.cv === "cinco") { await p.click('#conversa input[name="cv-bar"][value="caidas"]'); } await p.waitForTimeout(800); }
    if (e.prg != null) {
      // programa de 12 semanas: sin empezar, en la semana 3 con historial o terminado (revisión)
      await p.evaluate((k) => {
        const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, l = new Date(); l.setHours(12, 0, 0, 0); l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
        const mas = (n) => { const d = new Date(l); d.setDate(d.getDate() + n); return iso(d); };
        const hist = (n) => [...Array(n)].map((_, i) => ({ lunes: mas((i - n) * 7), paso: i + 1, ses: 3 + (i % 2), obj: 4, min: 80 + i * 10, rpe: 4.5, clave: k === "fin" && i === n - 1 ? "fin" : i === 1 ? "poco" : "avanza", a: Math.min(12, i + 2) }));
        if (k === "medio") localStorage.setItem("medex.programa", JSON.stringify({ v: 1, nivel: "medio", paso: 3, lunes: mas(0), hist: hist(2), fin: null, mant: false, ciclo: 1, creado: mas(-14) }));
        if (k === "fin") localStorage.setItem("medex.programa", JSON.stringify({ v: 1, nivel: "medio", paso: 12, lunes: mas(0), hist: hist(12), fin: mas(-1), mant: false, ciclo: 1, creado: mas(-84) }));
        const b = document.createElement("button"); b.dataset.programa = ""; document.body.append(b); b.click(); b.remove();
      }, e.prg);
      await p.waitForSelector(e.prg === "" ? "#programa[open] .prg-niveles" : e.prg === "fin" ? "#programa[open] .prg-sig" : "#programa[open] .prg-tabla"); await p.waitForTimeout(500);
    }
    // módulos de la segunda tanda que se abren con data-abre (y data-arg): se espera a su ventana, que lleva el mismo id que el módulo
    if (e.abre) { await p.evaluate(([n, arg]) => { const b = document.createElement("button"); b.dataset.abre = n; if (arg) b.dataset.arg = arg; document.body.append(b); b.click(); b.remove(); }, [e.abre, e.arg || ""]); await p.waitForSelector(`#${e.abre}[open] .ficha-cuerpo > *`); await p.waitForTimeout(600);
      if (e.numeros) { for (const [k, v] of Object.entries(e.numeros)) await p.fill("#nm-" + k, String(v)); await p.click("#numeros button[type=submit]"); await p.waitForSelector("#nm-ver"); await p.waitForTimeout(300); }
      if (e.preguntas) { await p.click('#preguntas [data-pg="sugeridas"]'); await p.fill("#pg-nueva-i", "¿Puedo nadar?"); await p.press("#pg-nueva-i", "Enter"); await p.waitForTimeout(300); }
      if (e.escalas) { for (const [k, v] of e.escalas) await p.check(`#escalas input[name="eq-${k}"][value="${v}"]`); await p.waitForSelector("#eq-cifra"); await p.waitForTimeout(200); }
      if (e.pavs) { await p.fill("#eq-dias", e.pavs[0]); await p.fill("#eq-min", e.pavs[1]); await p.fill("#eq-fuerza", e.pavs[2]); await p.waitForSelector("#eq-cifra"); await p.waitForTimeout(200); }
      if (e.frid) { await p.$$eval("#frid details", (ds) => ds.forEach((d) => { d.open = true; })); await p.waitForTimeout(200); }
      if (e.primeros) { await p.click('#primeros [data-pr="empezar"]'); await p.waitForSelector("#primeros #pr-hoy"); await p.waitForTimeout(300); }
      if (e.vuelta) { await p.click(`#vuelta [data-vt="motivo"][data-v="${e.vuelta[0]}"]`); await p.click(`#vuelta [data-vt="tiempo"][data-v="${e.vuelta[1]}"]`); await p.waitForSelector("#vuelta #vt-esc"); await p.waitForTimeout(300); }
      if (e.marcha) { await p.click('#paseo [data-ps="empezar"]'); await p.waitForSelector("#ps-marcha"); await p.evaluate((s) => window.__paPaseo.fijar(s), e.marcha); await p.waitForTimeout(300); } }
    if (e.bib != null) { await p.evaluate((n) => { const b = document.createElement("button"); if (n) { b.dataset.cambiar = n; b.dataset.pict = "sentadilla"; } else b.dataset.biblioteca = ""; document.body.append(b); b.click(); b.remove(); }, e.bib); await p.waitForSelector("#biblioteca[open] .bib-lista li"); await p.waitForTimeout(500); }
    if (e.ce != null) { await p.evaluate(() => document.querySelector("[data-centro]").click()); await p.waitForSelector("#centro[open] .ce-hoy button"); if (e.ce) { await p.fill("#ce-q", e.ce); await p.waitForSelector("#centro .ce-res"); } await p.waitForTimeout(500); }
    if (e.hab) { const H = ["alcohol", "tabaco", "cafe"]; await p.evaluate(() => { document.querySelector("#bloque-habitos").open = true; }); for (let i = 0; i < e.hab.length; i++) { await p.click(`input[name="hab-${H[i]}"][value="${e.hab[i]}"]`); await p.waitForTimeout(150); } await p.click('.tabs [data-tab="general"]').catch(() => {}); await p.waitForSelector('details[data-sec="habitos"] .cuerpo-sec > *', { state: "attached" }); await p.evaluate(() => { document.querySelector('details[data-sec="habitos"]').open = true; }); await p.waitForTimeout(900); }
    if (e.ds) { await p.click(".plan-obj .ds-btn"); await p.waitForSelector("#dosis[open] .ds-svg"); if (e.ds === "pasos") await p.click('#dosis [data-ds-vista="pasos"]'); await p.evaluate(() => { const d = document.querySelector("#dosis .ds-tabla"); if (d) d.open = true; }); await p.waitForTimeout(900); }
    if (e.pt) { await p.evaluate(() => { document.querySelector("#menu-mas").open = true; document.querySelector("#menu-mas [data-pastillero]").click(); }); await p.waitForSelector("#pastillero[open] .pt-cajas"); await p.waitForTimeout(600); }
    if (e.ct) { await p.click("#btn-constantes"); await p.waitForSelector("#constantes[open] .ct-svg"); await p.waitForTimeout(500); }
    if (e.mes) {
      await p.click("#btn-mes"); await p.waitForSelector("#mes[open] .mes-img[src^='data:image/png']", { timeout: 10000 });
      if (e.mes === "medico") { await p.check('input[name="mes-para"][value="medico"]', { force: true }); await p.waitForTimeout(900); }
      await p.waitForTimeout(400);
    }
    if (e.ejercicio) { await p.click(".plan-dia .picto-btn >> nth=1"); await p.waitForSelector("#ejercicio[open]"); await p.waitForTimeout(400); }
    if (e.sencillo) { await p.click("#btn-sencillo-hoy"); await p.waitForTimeout(900); }
    if (e.porque) { await p.evaluate(() => { const b = document.querySelector(".pq-chips .pq-btn"); b.closest("details").open = true; b.click(); }); await p.waitForSelector("#porque[open]"); await p.click('#porque [data-pq="sig"]'); await p.waitForTimeout(400); }
    if (e.ses) { await p.click("#btn-sesion"); await p.waitForTimeout(200); await p.click("#chequeo-saltar"); await p.waitForTimeout(200); await p.click("#crono-btn"); await p.waitForTimeout(400); await p.evaluate(() => window.__paSesion.adelantar(320)); await p.waitForTimeout(800); }
  }
  await p.addScriptTag({ content: AXE });
  const r = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map((v) => ({ id: v.id, n: v.nodes.length, ej: v.nodes.slice(0, 3).map((x) => x.target.join(" ") + " :: " + (x.any[0]?.message || "").slice(0, 140)) })));
  await c.close();
  return r;
}
const t0 = Date.now(); let total = 0, sig = 0;
const resultados = new Map();
async function trabajador() {
  while (sig < esc.length) {
    const e = esc[sig++];
    let r;
    try { r = await correr(e); } catch (x) { r = [{ id: "error-del-escenario", n: 1, ej: [x.message.split("\n")[0]] }]; }
    resultados.set(e.n, r); total += r.length;
    console.log(r.length ? `  ✘ ${e.n.padEnd(20)} ${r.map((v) => `${v.id} (${v.n})`).join(", ")}\n${JSON.stringify(r, null, 1)}` : `  ✔ ${e.n}`);
  }
}
await Promise.all(Array.from({ length: Math.max(1, HILOS) }, trabajador));
await b.close(); servidor.kill();
console.log(`\n${esc.length} escenarios en ${Math.round((Date.now() - t0) / 1000)} s · violaciones de accesibilidad: ${total}`);
process.exit(total ? 1 : 0);
