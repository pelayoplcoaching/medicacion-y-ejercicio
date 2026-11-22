#!/usr/bin/env node
/* Pruebas de interfaz con Playwright (Chromium) sobre un servidor estático local.
   Uso:  npm i -D playwright && npx playwright install chromium && node scripts/ui_test.mjs
   No dependen de la red: los componentes externos (PDF, OCR, QR) no se ejercitan aquí; sí todo el flujo principal. */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8790;
let fallos = 0, total = 0;
const check = (nombre, cond, detalle = "") => { total++; if (cond) console.log(`  ✔ ${nombre}`); else { fallos++; console.log(`  ✘ ${nombre} ${detalle}`); } };

const servidor = spawn("python3", ["-m", "http.server", String(PORT), "--directory", path.join(ROOT, "app")], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));

let playwright;
try { playwright = await import("playwright"); } catch { playwright = await import(process.env.PLAYWRIGHT_PATH || "/opt/npm-tools/node_modules/playwright/index.mjs"); }
const { chromium } = playwright;
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" });
// El plan tipo descansa el domingo y las pruebas de «Mi plan» usan la sesión del día: en domingo, la página vive en lunes.
await ctx.addInitScript(() => { if (new Date().getDay() !== 0) return; const D = Date, salto = 864e5; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [D.now() + salto])); } static now() { return D.now() + salto; } }; });
const p = await ctx.newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(e.message));
p.on("console", (m) => { if (m.type() === "error" && !/cdn|Failed to load resource|tessdata/i.test(m.text())) errores.push(m.text()); });
p.on("dialog", (d) => d.dismiss());

/* Bloques independientes, cada uno con su propio contexto: empiezan a la vez que el flujo principal (mejora grande 20)
   y su resultado se escribe al final, en orden, para que la salida no se mezcle. */
const checkEn = (buf) => (nombre, cond, detalle = "") => { total++; if (cond) buf.push(`  ✔ ${nombre}`); else { fallos++; buf.push(`  ✘ ${nombre} ${detalle}`); } };
async function bloque(titulo, fn) { const buf = [titulo]; try { await fn(checkEn(buf)); } catch (e) { fallos++; buf.push(`  ✘ excepción en «${titulo}»: ${e.message}`); } return buf; }
const paralelos = Promise.all([
  bloque("Escritorio e inglés (en paralelo)", async (check) => {
    const anchoCtx = await navegador.newContext({ viewport: { width: 1400, height: 900 }, locale: "es-ES" }); const pa = await anchoCtx.newPage();
    await pa.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" }); await pa.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("principios"), null, { timeout: 15000 });
    await pa.click("#guia-cerrar").catch(() => {}); await pa.fill("#buscar", "bisoprolol"); await pa.waitForSelector("#sugerencias li"); await pa.click("#sugerencias li"); await pa.fill("#dosis", "5"); await pa.click("#form-med button[type=submit]"); await pa.waitForTimeout(300);
    check("índice lateral del informe visible en escritorio", await pa.isVisible("#indice-informe") && (await pa.$$("#indice-informe a")).length === 6);
    check("recorrido: con medicación y sin datos, el paso actual es «sus datos» y «Siguiente» lo indica", (await pa.$eval("#recorrido-pasos li[aria-current=step]", (e) => e.textContent)).includes("datos") && (await pa.textContent("#btn-siguiente")).includes("datos"));
    await pa.fill("#edad", "60"); await pa.$eval("#edad", (e) => e.dispatchEvent(new Event("change"))); await pa.waitForTimeout(200);
    check("recorrido en escritorio: con datos y medicación el plan ya está a la vista, los tres pasos quedan hechos y «Siguiente» desaparece", (await pa.$$("#recorrido-pasos li.hecho")).length === 3 && await pa.$eval("#btn-siguiente", (b) => b.hidden) && (await pa.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).informeVisto)) === true);
    check("barra inferior oculta en escritorio", !(await pa.isVisible("#barra-inferior")));
    await pa.click('[data-modo="profesional"]'); await pa.waitForTimeout(200); await pa.click("#btn-consulta-pantalla"); await pa.waitForTimeout(400);
    check("pantalla de consulta: siete bloques seguidos, sin pestañas, columna izquierda fija", (await pa.$$("#contenido-tab .consulta-bloque")).length === 7 && !(await pa.isVisible(".tabs")) && (await pa.$eval("main > aside", (e) => getComputedStyle(e).position)) === "sticky");
    await pa.click("#btn-consulta-pantalla"); await pa.waitForTimeout(300);
    check("vuelta a la vista normal con pestañas", await pa.isVisible(".tabs") && (await pa.$$("#contenido-tab .consulta-bloque")).length === 0);
    await anchoCtx.close();
    const enCtx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: "en-US" }); const pe = await enCtx.newPage();
    await pe.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" }); await pe.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
    check("navegador en inglés: interfaz traducida y visible (sin la clase de espera)", (await pe.textContent('[data-tab="cuando"]')).includes("When") && !(await pe.evaluate(() => document.documentElement.classList.contains("i18n-espera"))) && (await pe.$eval("main", (m) => getComputedStyle(m).visibility)) === "visible");
    await enCtx.close();
  }),
  bloque("Sin conexión (service worker, en paralelo)", async (check) => {
    const offCtx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" });
    await offCtx.addInitScript(() => { try { localStorage.setItem("medex.guia", "1"); } catch {} });
    const po = await offCtx.newPage();
    po.on("pageerror", (e) => errores.push("sin conexión: " + e.message));
    await po.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    // en local (http) la app no registra el service worker; aquí se registra a mano y se espera a que tome el control
    await po.evaluate(async () => { await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready; });
    await po.reload({ waitUntil: "networkidle" });
    check("service worker instalado y controlando la página", await po.evaluate(() => !!navigator.serviceWorker.controller));
    const cache = await po.evaluate(async () => { const ks = (await caches.keys()).filter((k) => k.startsWith("medex-")); const c = await caches.open(ks[0]); return (await c.keys()).map((r) => new URL(r.url).pathname + new URL(r.url).search); });
    check("la precarga incluye ilustraciones, idiomas y PDF, pero no las capturas de la guía", cache.some((u) => u.includes("/assets/img/sppb-silla.webp")) && cache.some((u) => /\/js\/i18n\/en\.js\?v=/.test(u)) && cache.some((u) => /\/js\/pdf\.js\?v=/.test(u)) && !cache.some((u) => u.includes("/assets/guia/")));
    await offCtx.setOffline(true);
    await po.reload({ waitUntil: "domcontentloaded" });
    await po.waitForFunction(() => /principios/.test(document.querySelector("#kb-version")?.textContent || ""), null, { timeout: 15000 });
    await po.evaluate(() => document.querySelectorAll("dialog[open]").forEach((d) => d.close()));
    check("sin conexión: la app arranca con la base de conocimiento", await po.isVisible("#buscar"));
    await po.waitForFunction(() => { const i = document.querySelector("#ilustracion img"); return i && i.complete; }, null, { timeout: 5000 }).catch(() => {});
    check("sin conexión: la ilustración de inicio se ve", await po.$eval("#ilustracion img", (i) => i.complete && i.naturalWidth > 0));
    await po.waitForFunction(() => /\d/.test(document.querySelector("#kb-version")?.textContent || ""), null, { timeout: 5000 });
    await po.fill("#buscar", "sintrom"); await po.waitForSelector("#sugerencias li", { timeout: 8000 });
    check("sin conexión: busca por marca comercial (nomenclátor en caché)", /sintrom|acenocumarol/i.test(await po.textContent("#sugerencias")));
    await po.keyboard.press("Escape");
    await po.selectOption("#idioma", "en"); await po.waitForTimeout(500);
    check("sin conexión: se puede cambiar a inglés (diccionario precargado)", await po.evaluate(() => document.documentElement.lang) === "en" && (await po.textContent('[data-tab="cuando"]')).includes("When"));
    await offCtx.setOffline(false);
    await offCtx.close();
  }),
]);

try {
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
  await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  await p.selectOption("#idioma", "es");
  await p.click("#guia-cerrar");

  console.log("Carga");
  check("título con nombre y subtítulo", (await p.title()).includes("Pauta Activa"));
  check("estado vacío con mosaico e ilustración", await p.$eval("body", (b) => b.classList.contains("sin-meds")) && await p.isVisible("#ilustracion"));
  check("añadir rápido visible", await p.isVisible("#rapido"));
  await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("597") || document.querySelector("#kb-version").textContent.includes("principios"), null, { timeout: 15000 });

  console.log("Medicación");
  const add = async (q, d) => { await p.fill("#buscar", q); await p.waitForSelector("#sugerencias li"); await p.click("#sugerencias li"); if (d) await p.fill("#dosis", String(d)); await p.click("#form-med button[type=submit]"); await p.waitForTimeout(80); };
  await p.fill("#edad", "78"); await p.check("#caidas"); await p.check("#cond-diabetes"); await p.check("#cond-insuficiencia_cardiaca");
  await add("bisoprolol", 5); await add("furosemida", 40); await add("sintrom", 2); await add("metformina", 850); await add("novorapid");
  check("5 fármacos en la lista", (await p.$$("#lista-meds li")).length === 5);
  check("insulina sin dosis prerrellenada", /sin dosis|dosis no indicada/.test(await p.textContent("#lista-meds li:nth-child(5) .med-dosis")));
  await p.fill("#buscar", "omeprazol 20"); await p.waitForSelector("#sugerencias li");
  check("búsqueda por palabras sueltas sobre el nomenclátor", (await p.textContent("#sugerencias li")).toUpperCase().includes("OMEPRAZOL"));
  await p.keyboard.press("Escape");
  await p.click("#lista-meds li:nth-child(1) .editar"); await p.fill("#lista-meds li:nth-child(1) .editor input", "10"); await p.click("#lista-meds li:nth-child(1) .editor button[type=submit]"); await p.waitForTimeout(150);
  check("editar en sitio", (await p.textContent("#lista-meds li:nth-child(1) .med-dosis")).includes("10"));
  await p.click("#lista-meds li:nth-child(2) .pausar"); await p.waitForTimeout(150);
  check("pausar fármaco", await p.$eval("#lista-meds li:nth-child(2)", (e) => e.classList.contains("pausado")));
  await p.click("#lista-meds li:nth-child(2) .pausar"); await p.waitForTimeout(150);
  await p.click("#lista-meds li:nth-child(4) .quitar"); await p.waitForTimeout(150); await p.click("#toast button"); await p.waitForTimeout(150);
  check("quitar y deshacer", (await p.$$("#lista-meds li")).length === 5);

  console.log("Añadir tal cual (no está en la base)");
  await p.fill("#buscar", "Avefresh"); await p.waitForSelector("#sugerencias li.libre-op"); await p.click("#sugerencias li.libre-op"); await p.waitForTimeout(150);
  check("producto desconocido añadido tal cual", (await p.$$("#lista-meds li.libre")).length === 1 && (await p.$$("#lista-meds li")).length === 6);
  check("el informe sigue calculándose con los conocidos", !(await p.$eval("#informe", (e) => e.hidden)));
  await p.click("#lista-meds li.libre .quitar"); await p.waitForTimeout(150);

  console.log("Pegar lista y no reconocidos");
  await p.click("#btn-anadir"); await p.click("#btn-pegar"); await p.fill("#pegar", "Atorvastatina 40 mg 0-0-1\nFantasiol 10 mg 1-0-0"); await p.click("#btn-importar"); await p.waitForTimeout(200);
  check("línea reconocida añadida", (await p.$$("#lista-meds li")).length === 6);
  check("línea no reconocida avisada", await p.isVisible("#no-reconocidos"));

  console.log("Informe");
  await p.click("#btn-ir-informe"); await p.waitForTimeout(300);
  check("veredicto presente", (await p.textContent("#veredicto")).length > 20);
  check("lo esencial con 3–5 puntos", [3, 4, 5].includes((await p.$$("#esencial .esencial li")).length));
  check("«De un vistazo»: semáforo de tres columnas, plan semanal de tres filas y ritmo", (await p.$$("#vistazo .semaforo-col")).length === 3 && (await p.$$("#vistazo .tabla-plan tbody tr")).length === 3 && (await p.textContent("#vistazo .ritmo")).includes("ritmo"));
  await p.click("#btn-vistazo-semana"); await p.waitForTimeout(200);
  check("«Ver mi semana» abre la pestaña Mi plan", (await p.$eval('[data-tab="plan"]', (b) => b.getAttribute("aria-selected"))) === "true");
  await p.click('[data-tab="general"]'); await p.waitForTimeout(200);
  check("señales de alarma", (await p.$$("#alarma-card li")).length >= 5);
  check("tarjeta Hoy", await p.isVisible("#hoy"));
  check("«Hoy, con cuidado»: hasta 3 cuidados según su medicación, con su «¿Por qué?»", [1, 2, 3].includes((await p.$$("#hoy .hoy-cuidados li")).length) && (await p.$$("#hoy .hoy-cuidados [data-porque]")).length >= 1);
  await p.click("#btn-sencillo-hoy"); await p.waitForTimeout(400);
  check("modo sencillo: solo la pantalla de hoy, con la sesión, la voz y los cuidados", await p.$eval("body", (b) => b.classList.contains("sencillo")) && await p.isVisible("#sencillo #sen-tit") && !(await p.isVisible("#panel-medicacion")) && ((await p.$$("#sencillo #sen-empezar")).length === 1 || /descansar/.test(await p.textContent("#sen-tit"))));
  await p.click("#sencillo [data-sen-salir]"); await p.waitForTimeout(300);
  check("«Ver todo» vuelve a la aplicación completa", !(await p.$eval("body", (b) => b.classList.contains("sencillo"))) && await p.isVisible("#panel-medicacion"));
  check("glosario presente", (await p.$$("abbr.glos")).length >= 1);
  await p.waitForSelector('details[data-sec="beneficios"] .ben-t', { timeout: 5000 }).catch(() => {});
  check("«Lo que el ejercicio hace por usted»: tarjetas con cifra, tipo de estudio y enlace a la fuente (DOI), sin marca de borrador", (await p.$$('details[data-sec="beneficios"] .ben-t')).length >= 1 && (await p.$$eval('details[data-sec="beneficios"] .ben-fuentes a', (as) => as.length > 0 && as.every((a) => a.href.startsWith("https://doi.org/10.") && a.rel.includes("noopener")))) && !(await p.$('details[data-sec="beneficios"] .ben-borrador')) && /beneficio/.test(await p.textContent('details[data-sec="beneficios"] .resumen-sec').catch(() => "")));
  const HABS = 'details[data-sec="habitos"]';
  await p.waitForSelector(`${HABS} .hab-vacio`, { state: "attached", timeout: 5000 }).catch(() => {});
  check("alcohol, tabaco y café: sin responder, la sección va plegada y lo dice", !(await p.$eval(HABS, (d) => d.open)) && /Sin responder/.test(await p.textContent(`${HABS} .resumen-sec`)));
  await p.click(`${HABS} > summary`); await p.click(`${HABS} .hab-responder`); await p.waitForTimeout(500);
  check("«Responder ahora» abre las tres preguntas en «Sus datos»", await p.$eval("#bloque-habitos", (d) => d.open) && (await p.$$('#bloque-habitos input[type="radio"]')).length === 9);
  await p.click('input[name="hab-alcohol"][value="diario"]'); await p.click('input[name="hab-tabaco"][value="no"]'); await p.click('input[name="hab-cafe"][value="medio"]');
  await p.waitForSelector(`${HABS} .hab-r`, { state: "attached", timeout: 5000 }).catch(() => {});
  check("alcohol a diario con Sintrom, insulina y metformina: avisos con su nivel, sus fármacos y su fuente; se guarda", (await p.$$(`${HABS} .hab-r.nivel-alerta[data-hab-r="alc_acenocumarol"]`)).length === 1 && (await p.$$(`${HABS} .hab-r[data-hab-r="alc_hipoglucemia"]`)).length === 1 && (await p.$$(`${HABS} .hab-r[data-hab-r="alc_metformina"] .chip`)).length === 1 && /avisos/.test(await p.textContent(`${HABS} .resumen-sec`)) && (await p.textContent(`${HABS} .hab-p[data-h="alcohol"] b`)) === "A diario" && JSON.parse(await p.evaluate(() => localStorage.getItem("medex.estado"))).habitos.alcohol === "diario");
  await p.click('input[name="hab-alcohol"][value="no"]'); await p.waitForTimeout(400);
  check("si no bebe ni fuma y toma de 1 a 3 cafés, con esta lista no hay cruces destacados", (await p.$$(`${HABS} .hab-r`)).length === 0 && (await p.$$(`${HABS} .hab-bien`)).length === 1 && /Sin cruces/.test(await p.textContent(`${HABS} .resumen-sec`)));
  const tabs = await p.$$eval(".tabs [role=tab] .cnt", (es) => es.map((e) => e.textContent.trim()));
  check("recuentos en pestañas", tabs.some((x) => x !== ""));
  await p.click('[data-tab="interacciones"]'); await p.waitForTimeout(200);
  check("interacciones listadas", (await p.$$("#contenido-tab .ddi")).length >= 1);
  await p.waitForSelector("#contenido-tab .im-mapa .im-vis > *", { timeout: 5000 }).catch(() => {});
  const marcasMapa = () => p.$$eval("#contenido-tab .im-mapa :is(button.im-c, .im-a)", (xs) => xs.length);
  const nDdi = (await p.$$("#contenido-tab .ddi")).length, nMarcas = await marcasMapa();
  check("mapa de interacciones: una casilla o un arco por interacción y, en la ficha, la más importante", nMarcas >= 1 && nMarcas <= nDdi && /\+/.test(await p.textContent("#contenido-tab .im-ficha h4").catch(() => "")));
  const vistaIni = await p.$eval('#contenido-tab .im-vista [aria-pressed="true"]', (b) => b.dataset.imV).catch(() => "");
  await p.click(`#contenido-tab .im-vista [data-im-v="${vistaIni === "tabla" ? "red" : "tabla"}"]`); await p.waitForTimeout(200);
  check("se cambia entre tabla de cruces y red con las mismas interacciones, y se recuerda", (await marcasMapa()) === nMarcas && (await p.evaluate(() => localStorage.getItem("medex.im-vista"))) === (vistaIni === "tabla" ? "red" : "tabla"));
  await p.click("#contenido-tab .im-mapa :is(.im-nom, .im-nodo) >> nth=0"); await p.waitForTimeout(150);
  check("al tocar un medicamento, la ficha enseña todas las suyas", (await p.$$("#contenido-tab .im-ficha .im-mini li")).length >= 1);
  await p.click("#contenido-tab .im-ficha [data-im-par] >> nth=0"); await p.waitForTimeout(150); await p.click("#contenido-tab .im-ficha [data-im-ver]"); await p.waitForTimeout(700);
  check("«Ver en la lista» lleva a esa interacción del texto completo", (await p.evaluate(() => document.activeElement?.id || "")).startsWith("ddi-"));
  const medsAntesSim = await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("medex.estado")).meds));
  await p.click("#contenido-tab .im-mapa :is(.im-nom, .im-nodo) >> nth=0"); await p.waitForTimeout(150);
  const nombreSim = (await p.textContent("#contenido-tab .im-ficha h4").catch(() => "")).trim();
  await p.click("#contenido-tab .im-ficha [data-im-sim]"); await p.waitForSelector("#simula[open] .sim-tiles", { timeout: 5000 }).catch(() => {});
  check("desde el mapa, «¿Qué cambia sin él?» abre el simulador con ese medicamento quitado y cinco cifras de antes y después", (await p.$$("#simula [data-sim]:checked")).length === 1 && (await p.textContent("#simula .sim-med.quitado").catch(() => "")).includes(nombreSim) && (await p.$$("#simula .sim-tile")).length === 5 && /→/.test(await p.textContent("#simula #sim-vivo")));
  check("aviso de no cambiar nada por su cuenta y resumen orientativo", /por su cuenta/.test(await p.textContent("#simula .sim-aviso")) && /no sustituye/.test(await p.textContent("#simula .sim-nota")));
  await p.click("#simula [data-sim-reiniciar]"); await p.waitForTimeout(200);
  check("«Volver a empezar» quita las marcas y las cifras", (await p.$$("#simula [data-sim]:checked")).length === 0 && (await p.$$("#simula .sim-tile")).length === 0);
  await p.click("#sim-cerrar"); await p.waitForTimeout(150);
  check("la simulación no toca la lista de verdad", (await p.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem("medex.estado")).meds))) === medsAntesSim);
  await p.click('[data-tab="cuando"]'); await p.waitForTimeout(200);
  check("franja horaria pintada", (await p.textContent("#contenido-tab")).length > 50);
  await p.click('[data-tab="general"]'); await p.waitForTimeout(200);
  await p.click("#sintomas-card summary"); await p.click('#sintomas-card button[data-s="mareo"]'); await p.waitForTimeout(150);
  check("síntomas → fármacos posibles", (await p.textContent("#sintoma-detalle")).includes("contribuir"));
  {
    const chip = await p.$(".pq-chips .pq-btn");
    check("«¿Por qué?» en las tarjetas de los medicamentos y en los efectos a vigilar", !!chip && (await p.$$("#perfil .pq-mini")).length >= 1);
    await p.evaluate(() => { const b = document.querySelector(".pq-chips .pq-btn"); b.closest("details").open = true; b.click(); });
    await p.waitForSelector("#porque[open]", { timeout: 5000 }).catch(() => {});
    check("el explicador se abre en el paso 1 con su escena, qué hacer y fuentes", await p.$eval("#porque", (d) => d.open).catch(() => false) && await p.$eval(".pq-escena", (e) => e.dataset.paso === "1" && !!e.querySelector("svg path")) && (await p.$$(".pq-hacer li")).length >= 3 && /Fuentes/.test(await p.textContent(".pq-fuentes")));
    await p.click('#porque [data-pq="sig"]'); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(150);
    check("se avanza con «Siguiente» y con las flechas", await p.$eval(".pq-escena", (e) => e.dataset.paso) === "3" && /Paso 3 de 4/.test(await p.textContent(".pq-paso")));
    await p.click("#pq-cerrar"); await p.waitForTimeout(150);
  }

  console.log("Mi plan");
  await p.click('[data-tab="plan"]'); await p.waitForTimeout(250);
  check("tira de 7 días y sesión del día", (await p.$$(".tira .dia")).length === 7 && (await p.$$(".plan-dia .bloques li")).length >= 3);
  check("iconos de grupo terapéutico en la lista", (await p.$$("#lista-meds .ic-grupo.g-corazon")).length >= 1 && (await p.$$("#lista-meds .ic-grupo.g-azucar")).length >= 1);
  check("pictogramas, claves y variantes en los ejercicios", (await p.$$(".plan-dia .picto")).length >= 3 && (await p.$$(".plan-dia .variantes")).length >= 1 && (await p.$$(".plan-dia .clave")).length >= 1);
  await p.click(".plan-dia .picto-btn >> nth=1"); await p.waitForSelector("#ejercicio[open]", { timeout: 5000 }).catch(() => {});
  check("tocar el dibujo abre su ficha: las dos posturas (en pruebas, quietas), cómo se hace y errores frecuentes", await p.$eval("#ejercicio", (d) => d.open).catch(() => false) && (await p.$$("#ejercicio .ej-dos figure")).length === 2 && (await p.$$("#ejercicio .ej-errores li")).length >= 3);
  await p.click("#ej-cerrar"); await p.waitForTimeout(150);
  const detalleAntes = await p.textContent(".plan-dia .bloques li:nth-child(2) .detalle");
  await p.click('.plan-dia .bloques li:nth-child(2) .variantes [data-v="facil"]'); await p.waitForTimeout(200);
  check("variante «más fácil» cambia la descripción y se recuerda", (await p.textContent(".plan-dia .bloques li:nth-child(2) .detalle")) !== detalleAntes && (await p.$eval('.plan-dia .bloques li:nth-child(2) .variantes [data-v="facil"]', (b) => b.getAttribute("aria-pressed"))) === "true");
  await p.click('.plan-dia .bloques li:nth-child(2) .variantes [data-v="normal"]'); await p.waitForTimeout(150);
  check("mis días: 7 chips, 6 activos", (await p.$$(".dias-chips [data-dia]")).length === 7 && (await p.$$(".dias-chips [data-dia].activo")).length === 6);
  await p.click(".mis-dias summary"); await p.waitForTimeout(150);
  await p.click('.dias-chips [data-dia="2"]'); await p.waitForTimeout(200);
  check("quitar el martes lo deja en descanso", (await p.$$(".dias-chips [data-dia].activo")).length === 5 && (await p.$$(".tira .dia.descanso")).length === 2);
  await p.click('.dias-chips [data-dias="tipo"]'); await p.waitForTimeout(200);
  await p.click("#btn-sesion"); await p.waitForTimeout(200);
  check("sesión guiada abierta con el chequeo previo", await p.$eval("#sesion", (e) => e.open) && (await p.$$("#chequeo input")).length >= 3);
  await p.click("#chequeo-continuar"); await p.waitForTimeout(150);
  check("sin marcar nada: hoy mejor no entrenar", await p.$eval("#chequeo-resultado", (e) => e.classList.contains("r-no")));
  for (const c of await p.$$("#chequeo input")) await c.check();
  await p.click("#chequeo-continuar"); await p.waitForTimeout(200);
  check("todo marcado: cronómetro con anillo y bloques con pictograma", await p.isVisible("#crono") && (await p.$$("#sesion .anillo-crono")).length === 1 && (await p.$$("#sesion .bloques .picto")).length >= 3);
  check("constantes en la sesión (glucosa por insulina, pulso por betabloqueante)", (await p.$$("#sesion-const input")).length >= 3);
  if (await p.evaluate(() => "speechSynthesis" in window)) {
    check("entrenador por voz: casilla marcada por defecto", await p.$eval("#voz-on", (c) => c.checked));
    await p.click("#crono-btn"); await p.waitForTimeout(600);
    const voz = await p.evaluate(() => window.__paVoz || []);
    check("al iniciar dice la sesión, las señales de alarma y el primer ejercicio", /Empezamos/.test(voz[0] || "") && /dolor en el pecho/.test(voz[0] || "") && /Ejercicio 1 de/.test(voz[1] || ""), JSON.stringify(voz));
    check("ejercicio en curso resaltado con su tiempo", await p.$eval("#sesion .bloques.grande > li:nth-child(1)", (li) => li.classList.contains("en-curso")) && /quedan/.test(await p.textContent("#crono-ahora .ca-queda")));
    await p.click("#ses-sig"); await p.waitForTimeout(300);
    check("«Siguiente» marca el ejercicio y pasa al otro, y lo dice", await p.$eval("#sesion .bloques.grande > li:nth-child(1) input", (c) => c.checked) && await p.$eval("#sesion .bloques.grande > li:nth-child(2)", (li) => li.classList.contains("en-curso")) && /Ejercicio 2 de/.test((await p.evaluate(() => window.__paVoz)).at(-1)));
    await p.click("#crono-btn"); await p.waitForTimeout(150);
  }
  await p.fill('#sesion-const input[name="glucosa_antes"]', "140"); await p.fill('#sesion-const input[name="fc"]', "95");
  await p.click("#sesion-terminar"); await p.waitForTimeout(300);
  await p.waitForSelector(".plan-cab .anillos", { timeout: 5000 }).catch(() => {});
  check("sesión registrada en la semana", (await p.$$(".tira .dia.hecho")).length === 1 && !/^0\//.test((await p.textContent(".plan-cab .anillos-ley li.a1 b")) || "0/"));
  { const tipoReg = await p.evaluate(() => JSON.parse(localStorage.getItem("medex.diario"))[0].tipo); const f = ["fuerza", "fuerza_eq"].includes(tipoReg) ? 1 : 0, e = ["fuerza_eq", "equilibrio"].includes(tipoReg) ? 1 : 0;
    check(`tres anillos (moverse, fuerza, equilibrio) con la sesión de ${tipoReg} donde toca`, (await p.$$(".plan-cab .anillos circle.v")).length === 3 && (await p.textContent(".plan-cab .anillos-ley li.a2 b")).startsWith(f + "/") && (await p.textContent(".plan-cab .anillos-ley li.a3 b")).startsWith(e + "/")); }
  await p.click(".aprende-tile [data-aprende]"); await p.waitForSelector("#aprende[open]", { timeout: 5000 }).catch(() => {});
  check("«Aprende»: diez lecciones, las recomendadas primero", (await p.$$("#aprende .apr-lista button")).length === 10 && (await p.$$("#aprende .apr-lista .apr-chip")).length >= 1);
  await p.click("#aprende .apr-lista button >> nth=0"); for (let i = 0; i < 4; i++) { await p.click("#aprende [data-sig]"); await p.waitForTimeout(60); }
  await p.click("#aprende [data-o] >> nth=0"); await p.waitForTimeout(100);
  check("tras las 4 tarjetas, preguntas con la respuesta buena marcada y su explicación", (await p.$$("#aprende .apr-opciones .bien")).length === 1 && await p.isVisible("#aprende .apr-expl"));
  await p.click("#apr-cerrar"); await p.waitForTimeout(150);
  check("azulejo «Pruebas de forma física» en Mi plan, aún sin hacer", await p.isVisible(".pruebas-tile [data-pruebas]") && /Seis pruebas/.test(await p.textContent(".pruebas-tile small")));
  await p.click(".pruebas-tile [data-pruebas]"); await p.waitForSelector("#pruebas[open] .sft-hero", { timeout: 5000 }).catch(() => {});
  check("pruebas: seis en el orden del manual, aviso por insuficiencia cardiaca y no se empieza sin el aviso de seguridad", (await p.$$("#pruebas .sft-mapa li")).length === 6 && (await p.$$("#pruebas .sft-seguridad .sft-alerta")).length >= 1 && await p.$eval("#sft-empezar", (b) => b.disabled));
  await p.check('#pruebas input[name="sft-sexo"][value="m"]', { force: true }); await p.check("#sft-ok"); await p.click("#sft-empezar"); await p.waitForTimeout(150);
  await p.click("#pruebas [data-ini]"); for (let i = 0; i < 12; i++) await p.click("#pruebas [data-mas]");
  await p.evaluate(() => window.__paSft.adelantar(31)); await p.waitForTimeout(300);
  check("silla 30 s: el botón grande cuenta, el reloj acaba solo y el número pasa al resultado", (await p.$eval("#pruebas [data-valor]", (i) => i.value)) === "12" && await p.$eval("#pruebas .sft-reloj", (e) => e.classList.contains("acabado")));
  if (await p.evaluate(() => "speechSynthesis" in window)) { const v = await p.evaluate(() => window.__paVoz || []); check("avisos de voz al empezar y al acabar el tiempo", v.some((x) => /¡Ya!/.test(x)) && /Tiempo/.test(v.at(-1) || ""), JSON.stringify(v.slice(-3))); }
  await p.click("#pruebas [data-sig]"); await p.click("#pruebas [data-sig]"); await p.waitForTimeout(100);
  check("sin resultado no se avanza: se pide escribirlo o saltar la prueba", await p.isVisible("#pruebas .sft-falta") && (await p.$eval("#pruebas .sft-medida", (e) => e.dataset.prueba)) === "brazo");
  for (let i = 0; i < 4; i++) { await p.click("#pruebas [data-saltar]"); await p.waitForTimeout(60); }
  await p.click("#pruebas [data-ini]"); await p.evaluate(() => window.__paSft.adelantar(7)); await p.waitForTimeout(150); await p.click("#pruebas [data-ini]");
  await p.fill('#pruebas [data-int="1"]', "6.4"); await p.click("#pruebas [data-sig]"); await p.waitForSelector("#pruebas .sft-res", { timeout: 5000 }).catch(() => {});
  check("resultados: cada prueba con su chip, su rango habitual, su escala y la meta de autonomía", (await p.$$("#pruebas .sft-res > li")).length === 2 && (await p.$$("#pruebas .sft-escala")).length === 2 && (await p.$$("#pruebas .sft-chip.n-normal, #pruebas .sft-chip.n-bajo, #pruebas .sft-chip.n-alto")).length === 2 && /Habitual a su edad: \d+–\d+/.test(await p.textContent("#pruebas .sft-res")) && /Meta para mantener la autonomía: \d+/.test(await p.textContent("#pruebas .sft-res")));
  await p.click("#pruebas [data-guardar]"); await p.waitForTimeout(200); await p.click("#sft-cerrar"); await p.waitForTimeout(250);
  await p.waitForSelector(".metas-plan:not([hidden])", { timeout: 5000 }).catch(() => {});
  check("«Mis metas» sin elegir: invita con cuatro atajos", (await p.$$(".metas-plan [data-meta-elegir]")).length === 4);
  await p.click('.metas-plan [data-meta-elegir="escaleras"]'); await p.waitForSelector('.mt-card[data-meta="escaleras"]', { timeout: 5000 }).catch(() => {});
  await p.click('[data-meta-hito="escaleras"]'); await p.waitForTimeout(400);
  check("elegir una meta con un toque y marcar su primer hito (con «Deshacer»)", /1\/4/.test(await p.textContent('.mt-card[data-meta="escaleras"] .mt-n')) && /Hito conseguido/.test(await p.textContent("#toast")) && (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).metas.hitos.escaleras.filter(Boolean).length)) === 1);
  if ((await p.$$(".plan-dia .bloques li")).length) check("los ejercicios del día que trabajan la meta llevan su insignia", (await p.$$(".plan-dia .bloques .meta-badge")).length >= 1);
  await p.click('[data-meta-ver="escaleras"]'); await p.waitForSelector("#metas[open] .mt-hitos", { timeout: 5000 }).catch(() => {});
  await p.check('#metas .mt-hitos input[data-k="2"]'); await p.waitForTimeout(200);
  check("en la meta: marcar el tercer hito marca los anteriores; se ve la prueba que la mide y los ejercicios", (await p.$$("#metas .mt-hitos li.on")).length === 3 && /Piernas: 12/.test(await p.textContent("#metas .mt-medidas")) && (await p.$$("#metas .mt-ejs [data-ejercicio]")).length >= 3);
  await p.click("#mt-cerrar"); await p.waitForTimeout(200);
  await p.click("#btn-mes"); await p.waitForSelector("#mes[open] .mes-img[src^='data:image/png']", { timeout: 10000 }).catch(() => {});
  check("resumen del mes: imagen creada en el dispositivo, con la sesión de hoy, el hito de la meta y las pruebas", (await p.$eval("#mes .mes-img", (i) => (i.getAttribute("src") || "").length).catch(() => 0)) > 50000 && /\b1 sesión\b/.test(await p.textContent("#mes .mes-texto pre")) && /Escaleras/.test(await p.textContent("#mes .mes-texto pre")) && /Pruebas de forma física/.test(await p.textContent("#mes .mes-texto pre")));
  await p.check('#mes input[name="mes-para"][value="medico"]', { force: true }); await p.waitForSelector("#mes-sin", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(300);
  check("para el médico: esfuerzo y síntomas; los nombres de los fármacos, solo si se desmarca la casilla", /Esfuerzo medio/.test(await p.textContent("#mes .mes-texto pre")) && !/Medicación:/.test(await p.textContent("#mes .mes-texto pre")) && await p.$eval("#mes-sin", (c) => c.checked));
  await p.click("#mes-cerrar"); await p.waitForTimeout(150);
  await p.click("#btn-constantes"); await p.waitForSelector("#constantes[open] .ct-svg", { timeout: 8000 }).catch(() => {});
  check("mis constantes: gráfica de la glucosa y del pulso de la sesión, con franjas, tabla y nada fuera de rango que comentar", (await p.$$("#constantes .ct-svg")).length >= 2 && (await p.$$('#constantes [data-ct="glucosa"] .ct-b')).length >= 3 && (await p.$$("#constantes .ct-tabla table")).length >= 2 && /Ningún valor fuera/.test(await p.textContent("#constantes .ct-avisos")) && /no sirve para medir el esfuerzo/.test(await p.textContent('#constantes [data-ct="fc"]')));
  { const bb = await p.locator('#constantes [data-ct="glucosa"] .ct-svg').boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(150); }
  check("al pasar el ratón por la gráfica se lee el valor y la fecha", /140 mg\/dL/.test(await p.textContent('#constantes [data-ct="glucosa"] .ct-tip')) && await p.isVisible('#constantes [data-ct="glucosa"] .ct-tip'));
  await p.click("#ct-cerrar"); await p.waitForTimeout(150);
  await p.click("#menu-mas > summary"); await p.click("#menu-mas [data-calor-ver]"); await p.waitForSelector("#calor[open] .cal-chips", { timeout: 5000 }).catch(() => {});
  await p.click('#calor [data-nivel="2"]'); await p.waitForSelector("#calor .cal-cab.n2", { timeout: 5000 }).catch(() => {});
  check("calor y medicación: sin ubicación, consejo por nivel, líquidos limitados por la insuficiencia cardiaca y sus fármacos con calor", /no se usa su ubicación/.test(await p.textContent("#calor .cal-priv")) && /primera hora/.test(await p.textContent("#calor .cal-cab")) && (await p.$$("#calor .cal-lista li.fuerte")).length === 1 && (await p.$$("#calor .cal-meds li")).length >= 1 && /112/.test(await p.textContent("#calor .cal-parar")));
  await p.click("#cal-cerrar"); await p.waitForTimeout(150);
  check("el tiempo elegido se recuerda hoy y «Hoy» lo resume", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.calor")).nivel)) === 2 && /primera hora/.test(await p.textContent("#hoy .hoy-calor .calor-resumen")));
  if (await p.isVisible("#btn-empezar-hoy")) { await p.click("#btn-empezar-hoy"); await p.waitForTimeout(250); check("con mucho calor, al empezar la sesión se recuerda bajar la intensidad", /mucho calor/.test(await p.textContent("#toast"))); await p.click("#sesion-cerrar").catch(() => {}); await p.waitForTimeout(150); }
  check("guardadas con el estado (el mejor de los dos intentos) y el azulejo dice cuándo fue",await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("medex.estado")).sft; return s.hist.length === 1 && s.hist[0].r.silla === 12 && s.hist[0].r.levantarse === 6.4 && s.sexo === "m"; }) && /Última vez/.test(await p.textContent(".pruebas-tile small")));
  check("racha amable y mapa de 12 semanas con hoy marcado", /semana activa/.test(await p.textContent(".plan-racha")) && (await p.$$(".m12-rejilla i")).length === 84 && (await p.$$(".m12-rejilla i.d-hoy")).length === 1);
  check("tendencia de 8 semanas", (await p.$$(".tend rect")).length === 8);
  await p.click(".plan-obj .ds-btn"); await p.waitForSelector("#dosis[open] .ds-svg", { timeout: 5000 }).catch(() => {});
  check("¿cuánto hace falta?: su media de minutos del diario, su grupo frente a no hacer nada y la curva con su línea", /min\/semana/.test(await p.textContent("#dosis .ds-su").catch(() => "")) && /% menos de riesgo/.test(await p.textContent("#dosis .ds-frase")) && (await p.$$("#dosis .ds-p")).length === 6 && (await p.$$("#dosis .ds-usted")).length === 1 && /observación/.test(await p.textContent("#dosis .ds-observ")));
  await p.fill("#ds-rango", "200"); await p.dispatchEvent("#ds-rango", "input"); await p.waitForTimeout(100);
  check("al mover el deslizador cambia la frase (150-299 min: −31 %) y se marca su fila en la tabla", /31 %/.test(await p.textContent("#dosis .ds-frase")) && (await p.$$('#dosis .ds-tabla tr.ds-su-fila[data-k="g2"]')).length === 1);
  await p.click('#dosis [data-ds-vista="pasos"]'); await p.waitForTimeout(150);
  check("pasos al día: cuatro grupos, meseta por edad y la fuente con DOI", (await p.$$("#dosis .ds-p")).length === 4 && (await p.$$("#dosis .ds-banda")).length === 1 && /doi\.org\/10\.1016\/S2468-2667/.test(await p.$eval("#dosis .ds-fuente a", (a) => a.href)));
  await p.click("#ds-cerrar"); await p.waitForTimeout(150);
  const diario = await p.evaluate(() => JSON.parse(localStorage.getItem("medex.diario")));
  check("constantes guardadas con la sesión", diario[0].const?.glucosa_antes === 140 && diario[0].const?.fc === 95 && diario[0].chequeo === "ok");
  const [csv] = await Promise.all([p.waitForEvent("download"), p.click("#btn-diario-csv")]);
  check("diario exportable en CSV", csv.suggestedFilename().endsWith(".csv"));
  await p.click("#menu-mas > summary"); await p.click("#menu-mas [data-pastillero]"); await p.waitForSelector("#pastillero[open] .pt-cajas", { timeout: 5000 }).catch(() => {});
  check("mi pastillero: cuatro momentos con sus fármacos y dosis, tomas en la línea del día y la semana del plan", (await p.$$("#pastillero .pt-caja")).length >= 4 && (await p.$$("#pastillero .pt-meds li")).length >= 3 && (await p.$$("#pastillero .pt-toma")).length >= 1 && (await p.$$("#pastillero .pt-semana li")).length === 7 && (await p.$$("#pastillero .pt-semana li.hoy-pt")).length === 1 && /\d/.test(await p.textContent("#pastillero .pt-dosis")));
  check("tras la toma de la insulina, las horas en rojo y su motivo", (await p.$$("#pastillero .pt-h.n-rojo")).length >= 1 && (await p.$$("#pastillero .pt-tras li")).length >= 1 && /insulina/i.test(await p.textContent("#pastillero .pt-cajas")));
  await p.evaluate(() => { window.__impreso = 0; window.print = () => { window.__impreso++; }; });
  await p.click("#pastillero [data-pt-imprimir]"); await p.waitForTimeout(300);
  check("hoja de la semana para imprimir: 7 días, casillas por toma y la fila del ejercicio", (await p.evaluate(() => window.__impreso)) === 1 && (await p.$$("#hoja-pastillero thead th")).length === 8 && (await p.$$("#hoja-pastillero td i")).length >= 7 && await p.$eval("body", (b) => b.classList.contains("imprimir-pastillero")) && (await p.$$("#hoja-pastillero tr.hp-ej")).length === 1);
  await p.evaluate(() => window.dispatchEvent(new Event("afterprint"))); await p.waitForTimeout(50);
  await p.click("#pastillero [data-pt-horas]"); await p.waitForTimeout(400);
  check("«Cambiar las horas» cierra el pastillero y lleva a las horas de «¿Cuándo?», que también lo enlaza", !(await p.$eval("body", (b) => b.classList.contains("imprimir-pastillero"))) && !(await p.$eval("#pastillero", (d) => d.open)) && (await p.evaluate(() => document.activeElement?.dataset?.hora)) === "desayuno" && await p.isVisible("#contenido-tab [data-pastillero]"));
  await p.click('[data-tab="general"]'); await p.waitForTimeout(150);

  console.log("Combinaciones y Vivifrail automático (v1.0.2)");
  await p.fill("#buscar", "entresto"); await p.waitForSelector("#sugerencias li"); await p.click("#sugerencias li"); await p.click("#form-med button[type=submit]"); await p.waitForTimeout(300);
  check("Entresto añade un solo principio (sacubitrilo/valsartán), sin duplicar el valsartán", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).meds.filter((m) => /valsartan/.test(m.pid)).map((m) => m.pid).join())) === "sacubitrilo_valsartan");
  await p.fill("#buscar", "exforge"); await p.waitForSelector("#sugerencias li"); await p.click("#sugerencias li"); await p.click("#form-med button[type=submit]"); await p.waitForTimeout(300);
  check("una combinación a dosis fijas se muestra con cabecera de marca y sus componentes debajo", (await p.$$("#lista-meds li.combo-cab")).length === 1 && (await p.$$("#lista-meds li.en-combo")).length === 2 && (await p.textContent("#lista-meds li.combo-cab")).includes("Exforge"));
  await p.click("#lista-meds li.combo-cab .quitar"); await p.waitForTimeout(300);
  check("la × de la cabecera quita la combinación entera", (await p.$$("#lista-meds li.en-combo")).length === 0);
  await p.click("#lista-meds li:last-child .quitar"); await p.waitForTimeout(300); // quitar sacubitrilo/valsartán
  await p.click('[data-modo="profesional"]'); await p.waitForTimeout(150);
  await p.fill("#pro-sppb", "8"); await p.$eval("#pro-sppb", (e) => e.dispatchEvent(new Event("change"))); await p.waitForTimeout(200);
  check("SPPB 8 → Vivifrail C calculado automáticamente (editable)", (await p.$eval("#pro-vivifrail", (e) => e.value)) === "C" && await p.isVisible("#vivifrail-auto"));
  await p.fill("#pro-sppb", ""); await p.$eval("#pro-sppb", (e) => e.dispatchEvent(new Event("change"))); await p.selectOption("#pro-vivifrail", ""); await p.$eval("#pro-vivifrail", (e) => e.dispatchEvent(new Event("change"))); await p.click('[data-modo="paciente"]'); await p.waitForTimeout(150);

  console.log("Suplementos y plantas (v1.1)");
  const nSup0 = (await p.$$("#lista-meds li")).length;
  await p.fill("#buscar", "cola de caballo"); await p.waitForSelector("#sugerencias li");
  check("el buscador encuentra plantas por su nombre común y las marca como «Planta»", (await p.textContent("#sugerencias li")).includes("Cola de caballo") && !!(await p.$("#sugerencias li .etq-planta")));
  await p.keyboard.press("Escape"); await p.fill("#buscar", "");
  await p.click("#sup-rapido > summary"); await p.waitForTimeout(150);
  check("plegable «¿Toma suplementos o plantas?» con botones rápidos", await p.isVisible('#sup-chips button[data-pid="hiperico"]') && await p.isVisible('#sup-chips button[data-pid="creatina"]'));
  await p.click('#sup-chips button[data-pid="hiperico"]'); await p.click("#form-med button[type=submit]"); await p.waitForTimeout(300);
  check("hipérico añadido con icono de hoja y etiqueta «Planta»", (await p.$$("#lista-meds li")).length === nSup0 + 1 && !!(await p.$("#lista-meds li:last-child .ic-grupo.g-hoja")) && (await p.textContent("#lista-meds li:last-child .etq-tipo")).trim() === "Planta");
  check("el botón rápido desaparece y el contador cuenta 1", !(await p.$('#sup-chips button[data-pid="hiperico"]')) && (await p.textContent("#sup-cuenta")).includes("1"));
  await p.click('[data-tab="interacciones"]'); await p.waitForTimeout(250);
  const ddiTxt = await p.textContent("#contenido-tab");
  check("hipérico + Sintrom: interacción mayor revisada, sin borradores en el pie", /Hipérico[^]*Acenocumarol|Acenocumarol[^]*Hipérico/.test(ddiTxt) && /Revisión clínica propia/.test(ddiTxt) && !/pendientes? de revisión clínica/.test(ddiTxt));
  await p.click('[data-tab="general"]'); await p.waitForTimeout(150);
  await p.click("#lista-meds li:last-child .quitar"); await p.waitForTimeout(250);
  check("quitar el suplemento devuelve la lista a como estaba", (await p.$$("#lista-meds li")).length === nSup0 && await p.isVisible('#sup-chips button[data-pid="hiperico"]'));
  await p.click("#sup-rapido > summary"); await p.waitForTimeout(100);

  console.log("Ilustraciones y hoja «Mi sesión» (v1.0)");
  await p.click('[data-tab="plan"]'); await p.waitForTimeout(300);
  check("los bloques de la sesión llevan ilustración propia (SVG 96×96 con figura y apoyo)", (await p.$$('#contenido-tab .bloques .picto[viewBox="0 0 96 96"] .fig')).length >= 3);
  await p.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; setTimeout(() => window.dispatchEvent(new Event("afterprint")), 50); }; });
  await p.click("#btn-hoja-sesion"); await p.waitForTimeout(400);
  check("«Imprimir mi sesión» rellena la hoja con los ejercicios y llama a imprimir", (await p.evaluate(() => window.__printed)) === 1 && (await p.$$("#hoja-sesion .hoja-ej li")).length >= 3 && !(await p.$eval("body", (b) => b.classList.contains("imprimir-sesion"))));
  await p.click('[data-tab="general"]'); await p.waitForTimeout(200);

  console.log("Conciliación (lista guardada)");
  await p.click("#btn-perfiles"); await p.fill("#perfil-nombre", "Prueba"); await p.click("#btn-perfil-guardar"); await p.waitForTimeout(150);
  await p.click("#lista-meds li:nth-child(1) .quitar"); await p.waitForTimeout(150); await p.click("#toast button").catch(() => {}); await p.waitForTimeout(100);
  await p.click("#lista-meds li:nth-child(1) .quitar"); await p.waitForTimeout(400);
  await p.click('#perfiles-lista [data-a="cargar"]'); await p.waitForTimeout(300);
  check("al cargar la lista guardada se muestran los cambios", await p.isVisible("#cambios") && (await p.textContent("#cambios")).includes("Nuevos"));
  await p.click('#cambios [data-a="cerrar"]'); await p.click("#btn-perfiles");

  console.log("Cribado ACSM (alfa 15)");
  check("sin cribado: el veredicto invita a completarlo", await p.isVisible("#btn-ir-cribado"));
  await p.click("#bloque-cribado summary"); await p.waitForTimeout(150);
  check("sugerencia de enfermedad conocida por la medicación/diabetes", await p.isVisible("#crib-sugerencia"));
  await p.check('input[name="crib-regular"][value="0"]'); await p.check('input[name="crib-enfermedad"][value="1"]'); await p.waitForTimeout(200);
  check("no regular + enfermedad → valoración médica antes de empezar", (await p.textContent("#crib-resultado")).includes("valoración médica") && (await p.textContent("#veredicto")).includes("valoración médica"));
  check("el cribado entra en Lo esencial", (await p.textContent("#esencial .esencial li:first-child")).includes("Valoración"));
  await p.check('[data-crib-sint="dolor_pecho"]'); await p.waitForTimeout(200);
  check("síntomas → alerta en el chip", await p.$eval("#crib-estado", (e) => e.classList.contains("crib-alerta")));
  await p.uncheck('[data-crib-sint="dolor_pecho"]'); await p.check('input[name="crib-regular"][value="1"]'); await p.waitForTimeout(200);
  check("regular + enfermedad → valoración antes de intensidad alta", await p.$eval("#crib-estado", (e) => e.classList.contains("crib-precaucion")));
  check("nivel de evidencia visible en las reglas", (await p.$$("#contenido-tab .evidencia")).length >= 1);

  console.log("Beta 0: zona de intensidad, carga por fármaco, situaciones, SPPB, alto contraste");
  await p.click('[data-tab="aerobico"]'); await p.waitForTimeout(150);
  check("tarjeta de zona de intensidad al inicio del apartado aeróbico", await p.isVisible("#contenido-tab .zona") && (await p.textContent("#contenido-tab .zona")).includes("esfuerzo percibido"));
  await p.click('[data-tab="general"]'); await p.waitForTimeout(150);
  check("sección de carga de precauciones por fármaco con barras", (await p.$$("#contenido-tab .impacto li .barra-imp")).length >= 2);
  await p.click("#bloque-situacion-mas summary"); await p.check("#cond-aneurisma_aorta"); await p.waitForTimeout(250);
  check("aneurisma de aorta → regla combinada de atención en Lo esencial", (await p.textContent("#esencial")).includes("Aneurisma"));
  await p.uncheck("#cond-aneurisma_aorta"); await p.waitForTimeout(200);
  await p.click("#btn-sppb"); await p.waitForSelector("#sppb[open]", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(150);
  check("diálogo SPPB abierto en el paso 1", await p.isVisible("#sppb") && (await p.textContent("#sppb-cuerpo")).includes("Paso 1 de 5"));
  for (const v of ["10", "10", "10", "4", "10"]) { await p.fill("#sppb-seg", v); await p.click("#sppb-sig"); await p.waitForTimeout(80); }
  check("resultado SPPB 12/12 robusto", (await p.textContent("#sppb-cuerpo")).includes("12") && (await p.textContent("#sppb-cuerpo")).includes("robusto"));
  await p.click("#sppb-guardar"); await p.waitForTimeout(300);
  check("SPPB guardado y visible en Sus datos", (await p.textContent("#sppb-estado")).includes("12/12") && (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).sppb.total)) === 12);
  await p.click("#btn-sppb"); await p.waitForSelector("#sppb[open]", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(100); await p.fill("#sppb-seg", "5"); await p.click("#sppb-sig"); await p.waitForTimeout(80);
  check("pies juntos < 10 s salta al paso de marcha", (await p.textContent("#sppb-cuerpo")).includes("Paso 4 de 5"));
  await p.click("#sppb-cerrar"); await p.waitForTimeout(100);
  await p.click("#menu-mas summary"); for (let i = 0; i < 3; i++) await p.click("#btn-tema");
  check("tema de alto contraste disponible en el ciclo", (await p.evaluate(() => document.documentElement.dataset.theme)) === "contrast" && (await p.$eval("body", (e) => getComputedStyle(e).getPropertyValue("--line").trim())) === "#000000");
  await p.click("#btn-tema"); await p.keyboard.press("Escape");
  check("botones de ficha para el entrenador y tarjeta para la nevera", await p.isVisible("#btn-pdf-entrenador") && await p.isVisible("#btn-pdf-tarjeta"));
  check("escáner de códigos de barras oculto sin códigos nacionales en el nomenclátor", await p.$eval("#btn-barras", (e) => e.hidden));

  console.log("Beta 1: experiencia de uso (menú, recorrido, hoja de añadir, completitud, ayuda, barra, letra, deshacer)");
  check("cabecera limpia: solo «¿Cómo funciona?», idioma y «Más» a la vista (y «Herramientas» en pantallas anchas)", (await p.$$eval(".utiles > .btn-sec, .utiles > .idioma, .utiles > .menu-mas", (es) => es.filter((e) => getComputedStyle(e).display !== "none").length)) === (p.viewportSize().width >= 960 ? 4 : 3) && !(await p.isVisible("#btn-letra")));
  await p.click("#menu-mas summary"); await p.waitForTimeout(100);
  check("menú «Más» con letra, tema, glosario, guía, novedades, sugerencias, acerca y legal", await p.isVisible("#btn-letra") && (await p.$$(".menu-lista [role=menuitem]")).length >= 8);
  await p.click("#btn-letra"); await p.click("#btn-letra");
  check("letra en tres tamaños (muy grande = clase letra-xl y se recuerda)", await p.$eval("html", (e) => e.classList.contains("letra-xl")) && (await p.evaluate(() => localStorage.getItem("medex.letra"))) === "2");
  await p.click("#btn-letra"); await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  check("Escape cierra el menú y la letra vuelve a normal", !(await p.$eval("#menu-mas", (e) => e.open)) && !(await p.$eval("html", (e) => e.classList.contains("letra-grande"))));
  check("recorrido en tres pasos: todos hechos y sin «Siguiente» cuando ya se ha visto el plan", (await p.$$("#recorrido-pasos li")).length === 3 && (await p.$$("#recorrido-pasos li.hecho")).length === 3 && await p.$eval("#btn-siguiente", (b) => b.hidden) && (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).informeVisto)) === true);
  await p.click("#lista-meds li:nth-child(1) .pausar"); await p.waitForTimeout(200); // sin el betabloqueante activo, el pulso en reposo pasa a ser un dato que falta
  check("medidor «su plan está al N %» con siguiente paso y botón directo", await p.isVisible("#completitud") && /\d+ %/.test(await p.textContent("#completitud")) && await p.isVisible("#comp-ir"));
  if (await p.$("#comp-todo")) { await p.click("#comp-todo"); await p.waitForTimeout(100); }
  check("lista de todo lo que falta: desplegable si hay varios, oculta si solo falta uno", (await p.$("#comp-todo")) ? !(await p.$eval("#comp-lista", (e) => e.hidden)) && (await p.$$("#comp-lista button")).length >= 2 : (await p.$$("#comp-lista button")).length === 1);
  await p.click("#lista-meds li:nth-child(1) .pausar"); await p.waitForTimeout(200);
  check("con todo completado el medidor desaparece", await p.$eval("#completitud", (e) => e.hidden));
  check("veredicto con acciones: ver mi plan, descargar, compartir y ayuda de niveles", await p.isVisible("#btn-ver-mi-plan") && await p.isVisible("#btn-ir-descargas") && await p.isVisible('[data-ayuda="niveles"]'));
  await p.click('[data-ayuda="niveles"]'); await p.waitForTimeout(200);
  check("ayuda contextual: hoja con título y los tres niveles", await p.$eval("#ayuda", (d) => d.open) && (await p.textContent("#ayuda-titulo")).includes("niveles") && (await p.$$("#ayuda-cuerpo .niveles-ayuda li")).length === 3);
  await p.click("#ayuda-cerrar");
  await p.click('[data-ayuda="edad"]'); await p.waitForTimeout(150);
  check("la ayuda de un campo no activa el campo (el «?» dentro de la etiqueta)", await p.$eval("#ayuda", (d) => d.open) && (await p.textContent("#ayuda-titulo")).includes("edad"));
  await p.click("#ayuda-cerrar");
  await p.click("#menu-mas summary"); await p.click("#btn-glosario"); await p.waitForTimeout(150);
  check("glosario desde el menú", (await p.$$("#ayuda-cuerpo .glosario dt")).length >= 10); await p.click("#ayuda-cerrar");
  await p.click("#btn-anadir"); await p.waitForTimeout(200);
  check("hoja «añadir» con seis vías visibles y el escáner oculto", (await p.$$eval(".hoja-opciones button", (bs) => bs.filter((b) => !b.hidden).length)) === 6 && await p.$eval("#btn-barras", (b) => b.hidden));
  await p.click("#btn-buscar-nombre"); await p.waitForTimeout(500);
  check("«Buscar por nombre» cierra la hoja y enfoca el buscador", !(await p.$eval("#hoja-anadir", (d) => d.open)) && (await p.evaluate(() => document.activeElement?.id)) === "buscar");
  check("barra inferior con cuatro secciones, «Más» e insignias (nº de fármacos y avisos)", (await p.$$("#barra-inferior button[data-ir]")).length === 4 && (await p.$$("#barra-inferior button[data-centro]")).length === 1 && (await p.textContent('#barra-inferior [data-ir="medicacion"] .nav-badge')).trim() !== "" && !(await p.$eval("#barra-contador", (e) => e.hidden)));
  // Centro de herramientas (segunda tanda, 2)
  const tabAntesCentro = await p.$eval('.tabs [role=tab][aria-selected="true"]', (b) => b.dataset.tab).catch(() => "general");
  await p.click("#barra-inferior [data-centro]"); await p.waitForSelector("#centro[open] .ce-hoy button", { timeout: 5000 }).catch(() => {});
  check("«Más» de la barra abre el centro de herramientas: «Para usted hoy» (hasta 3) y las herramientas por grupos", (await p.$$("#centro .ce-hoy button")).length >= 1 && (await p.$$("#centro .ce-hoy button")).length <= 3 && (await p.$$("#centro .ce-rejilla .ce-t")).length >= 30 && (await p.$$("#centro .ce-tit")).length >= 6);
  await p.fill("#ce-q", "silla"); await p.waitForTimeout(200);
  check("el buscador del centro encuentra herramientas, ejercicios y glosario a la vez", (await p.$$("#centro .ce-res [data-pruebas]")).length === 1 && (await p.$$("#centro .ce-res [data-ejercicio]")).length >= 2 && (await p.$$("#centro .ce-res li.glos")).length >= 1);
  await p.fill("#ce-q", "zzzz"); await p.waitForTimeout(150);
  check("sin resultados, el centro lo dice", await p.isVisible("#centro .ce-nada"));
  await p.fill("#ce-q", ""); await p.waitForTimeout(150);
  await p.click('#centro .ce-fav[data-fav="glosario"]'); await p.waitForTimeout(150);
  check("la estrella guarda la favorita y la sube arriba", (await p.$$('#centro .ce-favs [data-id="glosario"]')).length === 1 && (await p.evaluate(() => localStorage.getItem("medex.favoritas"))) === '["glosario"]');
  await p.click('#centro .ce-fav[data-fav="glosario"]'); await p.waitForTimeout(150);
  await p.click('#centro .ce-t[data-id="plan"] .ce-b'); await p.waitForTimeout(500);
  check("una herramienta del centro lo cierra y abre lo suyo (Mi plan)", !(await p.$eval("#centro", (d) => d.open)) && (await p.$eval('[data-tab="plan"]', (b) => b.getAttribute("aria-selected"))) === "true");
  await p.keyboard.press("Control+k"); await p.waitForSelector("#centro[open]", { timeout: 5000 }).catch(() => {});
  check("Ctrl + K abre el centro con el cursor en el buscador", (await p.evaluate(() => document.activeElement?.id)) === "ce-q");
  await p.click("#ce-cerrar"); await p.waitForTimeout(200);
  // Biblioteca de ejercicios (segunda tanda, 4): «Cambiar» un ejercicio del plan y la ventana con filtros (seguimos en Mi plan)
  {
    const isoF = await p.$$eval(".tira .dia", (ds) => ds.find((d) => /fuerza/i.test(d.querySelector(".tipo")?.textContent || ""))?.dataset.iso || null);
    if (isoF) await p.click(`.tira .dia[data-iso="${isoF}"]`);
    await p.waitForSelector(".plan .bloques .ej-cambiar", { timeout: 5000 }).catch(() => {});
    const nCambiar = (await p.$$(".plan .bloques .ej-cambiar")).length;
    check("cada ejercicio de fuerza del plan tiene «Cambiar»; el calentamiento, no", nCambiar >= 4 && (await p.$eval(".plan .bloques li", (li) => !li.querySelector(".ej-cambiar"))), String(nCambiar));
    const original = await p.$eval(".plan .bloques .ej-cambiar", (b) => b.dataset.cambiar);
    await p.click(".plan .bloques .ej-cambiar"); await p.waitForSelector("#biblioteca[open] [data-bib-usar]", { timeout: 6000 }).catch(() => {});
    const nAlt = (await p.$$("#biblioteca [data-bib-usar]")).length;
    check("«Cambiar» abre las alternativas del mismo tipo, con el ejercicio actual marcado", nAlt >= 3 && (await p.textContent("#bib-cab-t")).includes(original) && (await p.$$("#biblioteca .bib-t.actual")).length === 1, String(nAlt));
    const elegido = await p.$eval("#biblioteca [data-bib-usar]", (b) => b.dataset.bibUsar);
    await p.click("#biblioteca [data-bib-usar]"); await p.waitForSelector(".plan .bloques .ej-de", { timeout: 5000 }).catch(() => {});
    check("al elegir otro, el plan lo muestra en su sitio con su dibujo y se guarda en el dispositivo", (await p.$$(".plan .bloques .ej-de")).length === 1 && (await p.$eval(".plan .bloques li:has(.ej-de) .picto-btn", (b) => !!b.querySelector("svg.picto"))) && (await p.evaluate(() => localStorage.getItem("medex.cambios"))) === JSON.stringify({ [original]: elegido }) && (await p.$$(".plan .bloques .ej-cambiar")).length === nCambiar);
    await p.click(".plan .bloques li:has(.ej-de) .picto-btn"); await p.waitForSelector("#ejercicio[open] #ej-tit", { timeout: 5000 }).catch(() => {});
    check("la ficha del ejercicio cambiado se abre con su dibujo y sus errores frecuentes", (await p.$$("#ejercicio .ej-escena svg")).length >= 1 && (await p.$$("#ejercicio .ej-errores li")).length === 3);
    await p.click("#ej-cerrar"); await p.waitForTimeout(150);
    await p.click(".plan .bloques li:has(.ej-de) .ej-cambiar"); await p.waitForSelector("#biblioteca[open] [data-bib-original]", { timeout: 5000 }).catch(() => {});
    await p.click("#biblioteca [data-bib-original]"); await p.waitForTimeout(400);
    check("«Volver al original» deshace el cambio", (await p.$$(".plan .bloques .ej-de")).length === 0 && (await p.evaluate(() => localStorage.getItem("medex.cambios"))) === null);
    await p.click(".bib-tile [data-biblioteca]"); await p.waitForSelector("#biblioteca[open] .bib-lista li", { timeout: 5000 }).catch(() => {});
    const nTodos = (await p.$$("#biblioteca .bib-lista li")).length;
    await p.click('#biblioteca [data-bib-f="postura"][data-v="sentado"]'); await p.waitForTimeout(150);
    const nSent = (await p.$$("#biblioteca .bib-lista li")).length;
    await p.click('#biblioteca [data-bib-f="material"][data-v="banda"]'); await p.waitForTimeout(150);
    check("la biblioteca enseña los 45 ejercicios y los filtra por postura y material", nTodos === 45 && nSent === 9 && (await p.$$("#biblioteca .bib-lista li")).length === 3 && (await p.textContent("#bib-n")).includes("3"), `${nTodos} ${nSent}`);
    await p.click("#biblioteca .bib-t"); await p.waitForSelector("#ejercicio[open] #ej-tit", { timeout: 5000 }).catch(() => {});
    check("tocar un ejercicio de la biblioteca abre su ficha encima", (await p.textContent("#ej-tit")).includes("Remo sentado con banda") && (await p.$eval("#biblioteca", (d) => d.open)));
    await p.click("#ej-cerrar"); await p.waitForTimeout(100); await p.click("#bib-cerrar"); await p.waitForTimeout(150);
    await p.click(`.tira .dia.hoy`).catch(() => {}); await p.waitForTimeout(150);
  }
  await p.click(`.tabs [data-tab="${tabAntesCentro}"]`).catch(() => {}); await p.waitForTimeout(200); // las pruebas siguientes cuentan con la pestaña que había
  await p.click('#barra-inferior [data-ir="datos"]'); await p.waitForTimeout(700);
  check("la barra inferior lleva a la sección y la marca activa", await p.$eval('#barra-inferior [data-ir="datos"]', (b) => b.classList.contains("activo")));
  const nAntes = (await p.$$("#lista-meds li")).length;
  await p.click("#btn-vaciar"); await p.waitForTimeout(200);
  check("vaciar la lista deja estado vacío con «Añadir mi primer medicamento»", (await p.$$("#lista-meds li")).length === 0 && await p.isVisible("#btn-primero") && !(await p.isVisible("#btn-vaciar")));
  await p.click("#toast button"); await p.waitForTimeout(300);
  check("deshacer recupera la lista completa", (await p.$$("#lista-meds li")).length === nAntes);
  await p.click("#btn-como"); await p.waitForTimeout(600);
  check("«¿Cómo funciona?» abre el recorrido guiado sobre el elemento real", !(await p.$eval("#tour", (e) => e.hidden)) && (await p.$$(".tour-foco")).length === 1 && (await p.textContent("#tour-paso")).includes("1"));
  await p.click("#tour-sig"); await p.waitForTimeout(400);
  check("el recorrido avanza y enfoca el buscador en el paso 2", await p.$eval("#buscar", (e) => e.classList.contains("tour-foco")));
  await p.keyboard.press("Escape"); await p.waitForTimeout(100);
  check("Escape cierra el recorrido", await p.$eval("#tour", (e) => e.hidden) && (await p.$$(".tour-foco")).length === 0);
  await p.click('[data-tab="fuerza"]'); await p.waitForTimeout(200);
  check("botón «Escuchar este apartado» en cada pestaña", await p.isVisible("#contenido-tab [data-escuchar-tab]"));
  await p.focus('[data-tab="fuerza"]'); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(200);
  check("pestañas con flechas del teclado", (await p.evaluate(() => document.activeElement?.dataset.tab)) === "equilibrio" && (await p.getAttribute('[data-tab="equilibrio"]', "aria-selected")) === "true");
  await p.click('[data-tab="general"]');
  const arbol = await p.locator("body").ariaSnapshot();
  check("árbol de accesibilidad: navegación, pasos, pestañas y ayudas con nombre", /navigation "Secciones"/.test(arbol) && /navigation "Pasos"/.test(arbol) && /tab "Fuerza/.test(arbol) && /button "Ayuda: edad"/.test(arbol) && /button "Ayuda: qué significan los niveles"/.test(arbol));
  await p.goto(`http://localhost:${PORT}/guia.html`, { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  check("guía rápida con seis pasos, capturas y preguntas frecuentes", (await p.$$(".paso-guia")).length === 6 && (await p.$$eval(".paso-guia img", (is) => Promise.all(is.map((i) => { i.loading = "eager"; return i.decode().then(() => i.naturalWidth > 0, () => false); })).then((r) => r.every(Boolean)))) && (await p.$$(".faq details")).length >= 5);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });

  console.log("Beta 2: feedback con contexto, copia cifrada y sincronización por enlace");
  await p.evaluate(() => { window.__u = []; window.open = (u) => { window.__u.push(u); return null; }; });
  await p.click("#btn-sugerencia"); await p.waitForTimeout(200);
  check("hoja de feedback con tipos, texto y datos técnicos", await p.isVisible("#feedback") && (await p.$$("#fb-tipos input")).length === 6 && /app: v0\.|pantalla:/.test(await p.textContent("#fb-contexto")));
  await p.check('#fb-tipos input[value="idea"]'); await p.fill("#fb-texto", "Prueba de sugerencia desde la interfaz"); await p.click("#feedback-form button[type=submit]"); await p.waitForTimeout(200);
  { const u = decodeURIComponent((await p.evaluate(() => window.__u[0])) || "").replace(/\+/g, " "); check("el formulario se abre con texto, tipo, pantalla y pasos prerrellenados", u.includes("tally.so") && u.includes("texto=Prueba de sugerencia") && u.includes("tipo=Una idea") && u.includes("pantalla=modo") && u.includes("pasos=")); }
  await p.click("#btn-perfiles"); await p.waitForTimeout(100);
  check("bloque de copia de seguridad con tres acciones", await p.isVisible("#btn-copia-crear") && await p.isVisible("#btn-copia-restaurar") && await p.isVisible("#btn-sync"));
  await p.click("#btn-copia-crear"); await p.waitForSelector("#copia[open]", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(150); await p.fill("#copia-pass", "corta"); await p.fill("#copia-pass2", "corta"); await p.click("#copia-ok"); await p.waitForTimeout(100);
  check("contraseña corta rechazada", (await p.textContent("#copia-error")).length > 0 && await p.isVisible("#copia"));
  await p.fill("#copia-pass", "contraseña-segura-1"); await p.fill("#copia-pass2", "contraseña-segura-1");
  const [dlCopia] = await Promise.all([p.waitForEvent("download"), p.click("#copia-ok")]);
  check("copia cifrada descargada como .pauta", dlCopia.suggestedFilename().endsWith(".pauta"));
  const rutaCopia = await dlCopia.path();
  { const txt = (await import("node:fs")).readFileSync(rutaCopia, "utf8"); const j = JSON.parse(txt); check("el archivo está cifrado (sin texto en claro) y declara AES-GCM/PBKDF2", j.formato === "copia-cifrada" && j.cifrado === "AES-GCM-256" && !txt.includes("bisoprolol") && !txt.includes("medex.estado")); }
  const antes = await p.evaluate(() => localStorage.getItem("medex.estado"));
  await p.evaluate(() => { localStorage.setItem("medex.diario", "[]"); });
  await p.evaluate(() => { window.confirm = () => true; }); // fusionar listas y diario, sustituir el resto
  await p.setInputFiles("#copia-input", rutaCopia); await p.waitForTimeout(200); await p.fill("#copia-pass", "mala-contraseña"); await p.click("#copia-ok"); await p.waitForTimeout(600);
  check("contraseña incorrecta: aviso y nada restaurado", (await p.evaluate(() => localStorage.getItem("medex.diario"))) === "[]");
  await p.setInputFiles("#copia-input", rutaCopia); await p.waitForTimeout(200); await p.fill("#copia-pass", "contraseña-segura-1"); await p.click("#copia-ok");
  await p.waitForFunction(() => JSON.parse(localStorage.getItem("medex.diario") || "[]").length > 0, null, { timeout: 8000 }); await p.waitForTimeout(1200);
  await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("copia restaurada con la contraseña correcta: diario y estado recuperados", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.diario")).length)) > 0 && (await p.evaluate(() => localStorage.getItem("medex.estado"))) === antes);
  await p.click("#btn-perfiles"); await p.waitForTimeout(100); await p.click("#btn-sync"); await p.waitForSelector("#sync[open]", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(600);
  const urlSync = await p.getAttribute("#sync", "data-url");
  check("enlace de sincronización #sync= comprimido (y QR si cabe)", /#sync=[rz]\./.test(urlSync) && (await p.isVisible("#sync-cuerpo svg") || (await p.textContent("#sync-nota")).length > 0));
  await p.click("#sync-cerrar");
  const sincCtx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" }); const ps = await sincCtx.newPage(); ps.on("dialog", (d) => d.accept());
  await ps.goto(urlSync, { waitUntil: "networkidle" }); await ps.waitForTimeout(1500); await ps.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("al abrir el enlace en otro dispositivo se copian la lista y el diario", (await ps.$$("#lista-meds li")).length === 6 && (await ps.evaluate(() => JSON.parse(localStorage.getItem("medex.diario") || "[]").length)) > 0 && !ps.url().includes("#sync="));
  await sincCtx.close();

  console.log("Modo profesional y textos");
  await p.click('[data-modo="profesional"]'); await p.waitForTimeout(150);
  check("acento del modo profesional", (await p.$eval("body", (e) => getComputedStyle(e).getPropertyValue("--accent").trim())) !== "#6b35c4");
  await p.selectOption("#pro-nyha", "3");
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  await p.click("#btn-historia"); await p.waitForTimeout(200);
  const historia = await p.evaluate(() => navigator.clipboard.readText());
  check("texto para la historia clínica", historia.startsWith("RECOMENDACIÓN DE EJERCICIO") && historia.includes("NYHA"));
  check("la historia incluye el registro del paciente con constantes", historia.includes("Registro del paciente") && historia.includes("glucosa antes 140"));
  check("la historia incluye el cribado ACSM y la versión", historia.includes("Cribado ACSM") && /v\d+\.\d+/.test(historia));
  check("la historia incluye la valoración funcional (SPPB) y la zona de intensidad", historia.includes("SPPB 12/12") && historia.includes("Zona de intensidad"));
  await p.click("#bloque-prescriptor summary"); await p.fill("#presc-nombre", "Dra. Prueba"); await p.fill("#presc-centro", "Centro de pruebas"); await p.$eval("#presc-centro", (e) => e.dispatchEvent(new Event("change"))); await p.$eval("#presc-nombre", (e) => e.dispatchEvent(new Event("change")));
  await p.click("#btn-prescrito"); await p.waitForTimeout(200);
  check("prescriptor guardado y prescripción marcada", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.prescriptor")).nombre)) === "Dra. Prueba" && (await p.textContent("#presc-estado")).includes("reevaluar"));
  await p.click("#btn-historia"); await p.waitForTimeout(200);
  check("la historia cita al prescriptor y la fecha de reevaluación", (await p.evaluate(() => navigator.clipboard.readText())).includes("Dra. Prueba"));
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("medex.estado")); s.prescrito.fecha = Date.now() - 50 * 864e5; localStorage.setItem("medex.estado", JSON.stringify(s)); });
  await p.reload({ waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("aviso de reevaluación cuando vence el plazo", await p.isVisible("#aviso-reeval"));
  await p.click("#btn-evolucion-aviso"); await p.waitForSelector("#evolucion[open]", { timeout: 5000 }).catch(() => {}); await p.waitForTimeout(300); // la ventana vive en js/pro.js (bajo demanda)
  check("informe de evolución: diálogo con adherencia, sesiones, minutos/semana y comparativa", await p.isVisible("#evolucion") && (await p.$$("#evolucion .evo-tiles .tile")).length === 4 && (await p.textContent("#evolucion .evo-tabla")).includes("SPPB"));
  await p.click("#evo-copiar"); await p.waitForTimeout(200);
  check("texto de evolución copiado para la historia", (await p.evaluate(() => navigator.clipboard.readText())).startsWith("EVOLUCIÓN DEL PLAN"));
  await p.click("#evo-renovar"); await p.waitForTimeout(300);
  check("renovar la prescripción: nueva fecha, foto base y la anterior en el historial", await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("medex.estado")); return Date.now() - s.prescrito.fecha < 10000 && !!s.prescrito.base && s.historialPresc.length === 1; }) && !(await p.isVisible("#aviso-reeval")));
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("medex.estado")); s.prescrito.fecha = Date.now() - 50 * 864e5; localStorage.setItem("medex.estado", JSON.stringify(s)); });
  await p.reload({ waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  await p.click("#btn-reeval-ok"); await p.waitForTimeout(100);
  check("reevaluado → aviso oculto", !(await p.isVisible("#aviso-reeval")));
  await p.click("#btn-perfiles"); await p.waitForTimeout(100);
  const [dlCaso] = await Promise.all([p.waitForEvent("download"), p.click("#btn-caso-exportar")]);
  check("caso exportado como JSON", dlCaso.suggestedFilename().startsWith("caso-") && dlCaso.suggestedFilename().endsWith(".json"));
  const rutaCaso = await dlCaso.path();
  const [dlCsv] = await Promise.all([p.waitForEvent("download"), p.click("#btn-lista-csv")]);
  check("lista exportada en CSV", dlCsv.suggestedFilename().endsWith(".csv"));
  await p.evaluate(() => { window.prompt = () => "Caso de prueba UI"; });
  const [dlPrueba] = await Promise.all([p.waitForEvent("download"), p.click("#btn-caso-prueba")]);
  check("caso de prueba generado", dlPrueba.suggestedFilename().startsWith("caso-prueba-"));
  await p.click("#lista-meds li:nth-child(1) .quitar"); await p.waitForTimeout(400);
  await p.setInputFiles("#caso-input", rutaCaso); await p.waitForTimeout(500);
  check("caso importado: la lista vuelve y se muestran los cambios", (await p.$$("#lista-meds li")).length === 6 && await p.isVisible("#cambios"));
  await p.click('#cambios [data-a="cerrar"]'); await p.click("#btn-perfiles");
  await p.evaluate(() => { window.__u = []; window.open = (u) => { window.__u.push(u); return null; }; navigator.share = undefined; });
  await p.click("#btn-whatsapp");
  check("texto de WhatsApp", decodeURIComponent((await p.evaluate(() => window.__u[0])) || "").includes("Lo esencial"));
  await p.click("#menu-mas summary"); await p.click(".menu-lista .btn-sugerencia"); await p.waitForTimeout(150);
  check("«Sugerencias» del menú abre la hoja de feedback con el contexto", await p.isVisible("#feedback") && (await p.textContent("#fb-contexto")).includes("lista:"));
  await p.click("#feedback-cerrar");

  console.log("Beta 3: consulta, plantillas, FHIR, texto accesible, avisos, fuentes");
  check("barra de consulta visible en modo profesional", await p.isVisible("#consulta") && (await p.textContent("#consulta-estado")).length > 0);
  await p.evaluate(() => { window.prompt = () => "PAC-01"; });
  await p.click("#btn-consulta-guardar"); await p.waitForTimeout(200);
  check("guardar paciente crea el perfil y lo selecciona", (await p.$$eval("#consulta-paciente option", (os) => os.map((o) => o.textContent))).some((x) => x.startsWith("PAC-01")) && (await p.$eval("#consulta-paciente", (s) => s.value)) !== "");
  const nMedsAntes = (await p.$$("#lista-meds li")).length;
  await p.click("#btn-consulta-siguiente"); await p.waitForTimeout(300);
  check("siguiente paciente vacía la lista y los datos", (await p.$$("#lista-meds li")).length === 0 && (await p.$eval("#edad", (e) => e.value)) === "" && (await p.$eval("#consulta-paciente", (s) => s.value)) === "");
  await p.selectOption("#consulta-paciente", { index: 1 }); await p.waitForTimeout(400);
  await p.click("#btn-consulta-stats"); await p.waitForTimeout(300);
  check("estadísticas de la consulta: tiles, listas y acciones con los pacientes guardados", await p.isVisible("#estadisticas") && Number((await p.textContent("#estadisticas .evo-tiles .tile:first-child .num")).trim()) >= 1 && (await p.$$("#estadisticas .stats-lista")).length >= 3);
  const [dlCsvCons] = await Promise.all([p.waitForEvent("download"), p.click("#stats-csv")]);
  const csvCons = (await import("node:fs")).readFileSync(await dlCsvCons.path(), "utf8");
  check("CSV anonimizado de la consulta con cabecera y una fila", dlCsvCons.suggestedFilename().startsWith("consulta-") && csvCons.includes("n_farmacos") && csvCons.trim().split(/\r?\n/).length >= 2 && csvCons.includes("PAC-01"));
  await p.click("#stats-resumen"); await p.waitForTimeout(200);
  check("resumen de la consulta copiado", (await p.evaluate(() => navigator.clipboard.readText())).startsWith("PAUTA ACTIVA · RESUMEN DE LA CONSULTA"));
  await p.click("#estadisticas-cerrar");
  check("cargar el paciente guardado restaura la lista y la edad", (await p.$$("#lista-meds li")).length === nMedsAntes && (await p.$eval("#edad", (e) => e.value)) === "78");
  await p.click('#cambios [data-a="cerrar"]').catch(() => {});
  await p.click("#consulta [data-conversa]"); await p.waitForSelector("#conversa[open] .cv-paso", { timeout: 5000 }).catch(() => {});
  check("guía de conversación: tres modalidades; en 1 minuto, tres pasos con su caso (beneficio y cuidado por su medicación)", (await p.$$("#conversa .cv-tab")).length === 3 && (await p.$$("#conversa .cv-paso")).length === 3 && (await p.$$("#conversa .cv-caso")).length >= 2);
  await p.click('#conversa [data-cv-tab="cinco"]'); await p.fill('#conversa input[name="cv-conf"]', "2"); await p.click('#conversa input[name="cv-bar"][value="caidas"]'); await p.waitForTimeout(150);
  check("5 minutos: las cinco Aes en orden, la confianza baja cambia la pista y la barrera marcada trae su respuesta", (await p.$$eval("#conversa .cv-a", (xs) => xs.map((x) => x.textContent).join())) === "Averiguar,Aconsejar,Acordar,Ayudar,Asegurar" && /Confianza baja/.test(await p.textContent("#conversa [data-cv-pista]")) && (await p.$$("#conversa [data-cv-resp] li")).length === 1);
  await p.click("#conversa [data-cv-nota]"); await p.waitForTimeout(200);
  { const nt = await p.evaluate(() => navigator.clipboard.readText()); check("nota para la historia copiada: 5 Aes, confianza, barrera y seguimiento", /5 Aes/.test(nt) && /confianza 2\/10/.test(nt) && /miedo caerme/.test(nt) && /Seguimiento: en 4 semanas/.test(nt)); }
  await p.evaluate(() => { window.__imp = 0; window.print = () => { window.__imp++; }; });
  await p.click("#conversa [data-cv-imprimir]"); await p.waitForTimeout(300);
  check("hoja para el paciente: se imprime con su objetivo, su semana, las señales de alarma y la próxima revisión", (await p.evaluate(() => window.__imp)) === 1 && (await p.$$("#hoja-conversa tbody tr")).length === 3 && (await p.$$("#hoja-conversa .hc-alarma li")).length === 6 && /Próxima revisión/.test(await p.textContent("#hoja-conversa")) && await p.evaluate(() => document.body.classList.contains("imprimir-conversa")));
  await p.evaluate(() => window.dispatchEvent(new Event("afterprint"))); await p.click("#cv-cerrar"); await p.waitForTimeout(150);
  await p.selectOption("#plantilla", "ic"); await p.click("#btn-plantilla"); await p.waitForTimeout(300);
  check("plantilla «insuficiencia cardíaca» marca la situación, 4 días de plan y reevaluación a 6 semanas", await p.isChecked("#cond-insuficiencia_cardiaca") && (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).plan.dias.length)) === 4 && (await p.$eval("#presc-revision", (e) => e.value)) === "6");
  const [dlFhir] = await Promise.all([p.waitForEvent("download"), p.click("#btn-fhir")]);
  const fhir = JSON.parse((await import("node:fs")).readFileSync(await dlFhir.path(), "utf8"));
  const tipos = fhir.entry.map((e) => e.resource.resourceType);
  check("exportación FHIR: Bundle con Patient, MedicationStatement por fármaco conocido, Observation y CarePlan", fhir.resourceType === "Bundle" && tipos.includes("Patient") && tipos.filter((x) => x === "MedicationStatement").length >= 4 && tipos.includes("Observation") && tipos.includes("CarePlan") && tipos.includes("Practitioner"));
  check("FHIR: los MedicationStatement llevan código ATC y el CarePlan tres actividades", fhir.entry.filter((e) => e.resource.resourceType === "MedicationStatement").every((e) => e.resource.medicationCodeableConcept.coding?.[0]?.system?.includes("atc")) && fhir.entry.find((e) => e.resource.resourceType === "CarePlan").resource.activity.length === 3);
  const [dlTxt] = await Promise.all([p.waitForEvent("download"), p.click("#btn-txt")]);
  const txt = (await import("node:fs")).readFileSync(await dlTxt.path(), "utf8");
  check("versión en texto plano del informe (lector de pantalla): esencial + historia clínica", dlTxt.suggestedFilename().endsWith(".txt") && txt.includes("RECOMENDACIÓN DE EJERCICIO") && txt.includes("Dra. Prueba"));
  await p.click('[data-tab="interacciones"]'); await p.waitForTimeout(300);
  check("cada interacción curada muestra su fuente", (await p.$$eval("article.ddi footer", (fs) => fs.filter((f) => f.textContent.includes("Revisión clínica propia")).every((f) => f.textContent.includes("FT AEMPS")) && fs.some((f) => f.textContent.includes("FT AEMPS")))));
  await p.click('[data-tab="cuando"]'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__notif = []; window.Notification = class { static permission = "granted"; static requestPermission() { return Promise.resolve("granted"); } constructor(t, o) { window.__notif.push({ t, o }); } }; });
  if (await p.$("#aviso-on")) {
    await p.check("#aviso-on"); await p.waitForTimeout(200);
    check("aviso local activado y guardado", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.aviso")).on)) === true);
    await p.fill("#aviso-hora", "07:30"); await p.$eval("#aviso-hora", (e) => e.dispatchEvent(new Event("change"))); await p.waitForTimeout(100);
    check("hora del aviso guardada", (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.aviso")).hora)) === "07:30");
    await p.uncheck("#aviso-on"); await p.waitForTimeout(100);
  } else check("bloque de avisos (requiere Notification en el navegador)", true);
  await p.selectOption("#idioma", "eu"); await p.waitForTimeout(200);
  check("interfaz en euskera (plantillas y consulta traducidas)", (await p.textContent('[data-tab="cuando"]')).includes("Noiz") && (await p.textContent("#plantilla option:nth-child(2)")).length > 3 && !(await p.textContent("#plantilla option:nth-child(2)")).includes("Insuficiencia"));
  await p.selectOption("#idioma", "es"); await p.waitForTimeout(200);
  await p.click('[data-modo="paciente"]'); await p.waitForTimeout(150);
  check("barra de consulta oculta en modo paciente", !(await p.isVisible("#consulta")));
  await p.click('[data-modo="profesional"]'); await p.waitForTimeout(150);

  console.log("Enlace de solo lectura y reevaluación al calendario (v1.0)");
  await p.click("#btn-ver-enlace"); await p.waitForTimeout(200);
  const urlVer = await p.evaluate(() => navigator.clipboard.readText());
  check("enlace de solo lectura generado (#ver=)", urlVer.includes("#ver="));
  const nMedsPropios = (await p.$$("#lista-meds li")).length;
  const verCtx = await navegador.newContext({ viewport: { width: 390, height: 844 }, locale: "es-ES" }); const pv = await verCtx.newPage();
  await pv.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" }); await pv.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 }); await pv.click("#guia-cerrar").catch(() => {});
  await pv.goto(urlVer.replace(/^https?:\/\/[^/]+/, `http://localhost:${PORT}`), { waitUntil: "networkidle" }); await pv.reload({ waitUntil: "networkidle" }).catch(() => {});
  await pv.goto(urlVer.replace(/^https?:\/\/[^/]+/, `http://localhost:${PORT}`)); await pv.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 }); await pv.waitForTimeout(400);
  check("en otro dispositivo, #ver= muestra la lista en solo lectura: banner, sin acciones de edición y sin guardar", await pv.isVisible("#aviso-ver") && (await pv.$$("#lista-meds li")).length === nMedsPropios && !(await pv.isVisible("#lista-meds li .quitar")) && (await pv.$eval("#edad", (e) => e.disabled)) && (await pv.evaluate(() => localStorage.getItem("medex.estado"))) === null);
  await pv.click("#btn-ver-copia"); await pv.waitForTimeout(200);
  check("«Hacer una copia» convierte la vista en lista propia editable", !(await pv.isVisible("#aviso-ver")) && (await pv.evaluate(() => JSON.parse(localStorage.getItem("medex.estado")).meds.length)) === nMedsPropios && !(await pv.$eval("#edad", (e) => e.disabled)));
  await verCtx.close();
  await p.$eval("#bloque-prescriptor", (d) => { d.open = true; }); await p.click("#btn-prescrito"); await p.waitForTimeout(200);
  const [dlIcs] = await Promise.all([p.waitForEvent("download"), p.click("#btn-reeval-ics")]);
  const icsTxt = (await import("node:fs")).readFileSync(await dlIcs.path(), "utf8");
  check("evento de reevaluación en .ics (todo el día, con alarma)", dlIcs.suggestedFilename().endsWith(".ics") && icsTxt.includes("DTSTART;VALUE=DATE:") && icsTxt.includes("Reevaluación del plan"));

  console.log("Aviso de cambios en la base (v1.0)");
  await p.evaluate(() => { const h = JSON.parse(localStorage.getItem("medex.huella")); h.kb = "2000.01.01"; h.items = h.items.slice(1).concat(["general|bisoprolol|info|Regla antigua que ya no existe."]); h.items[0] = h.items[0].replace(/\|[^|]*$/, "|Texto antiguo de prueba."); localStorage.setItem("medex.huella", JSON.stringify(h)); });
  await p.reload({ waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("al cambiar la versión de la base aparece el aviso con el número de cambios", await p.isVisible("#aviso-kb") && /\d+ cambio/.test(await p.textContent("#aviso-kb")));
  await p.click("#btn-kb-ver"); await p.waitForTimeout(200);
  check("diálogo de cambios: nuevos, eliminados y modificados", await p.isVisible("#kbcambios") && (await p.$$("#kbcambios .lista-cambios")).length >= 2 && (await p.textContent("#kbcambios")).includes("Regla antigua"));
  await p.click("#kbcambios-cerrar"); await p.click("#btn-kb-ok"); await p.waitForTimeout(100);
  check("«Entendido» retira el aviso y la huella queda en la versión actual", !(await p.isVisible("#aviso-kb")) && (await p.evaluate(() => JSON.parse(localStorage.getItem("medex.huella")).kb !== "2000.01.01")));

  console.log("Persistencia e idiomas");
  await p.reload({ waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("lista restaurada tras recargar", (await p.$$("#lista-meds li")).length === 6);
  check("cabecera compacta en la segunda visita", await p.$eval("html", (e) => e.classList.contains("retorno")));
  await p.selectOption("#idioma", "en");
  await p.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 5000 }).catch(() => {}); // el diccionario inglés se descarga al elegirlo
  check("interfaz en inglés (diccionario descargado al elegirlo)", (await p.textContent('[data-tab="cuando"]')).includes("When"));
  await p.selectOption("#idioma", "es");
  const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#btn-calendario")]);
  check("plan .ics descargable", dl.suggestedFilename().endsWith(".ics"));

  console.log("Accesibilidad básica");
  check("todas las imágenes con alt", await p.$$eval("img", (es) => es.every((i) => i.hasAttribute("alt"))));
  check("botones con nombre accesible", await p.$$eval("button", (es) => es.every((b) => (b.textContent.trim() || b.getAttribute("aria-label") || b.title))));
  check("inputs con etiqueta", await p.$$eval("input:not([type=hidden]):not([type=file]):not([type=radio]):not([type=checkbox])", (es) => es.every((i) => i.labels?.length || i.getAttribute("aria-label") || i.id === "pegar")));
  await p.goto(`http://localhost:${PORT}/acerca.html`, { waitUntil: "networkidle" }); await p.waitForTimeout(400);
  check("acerca.html muestra el estado de la base", (await p.textContent("#estado-kb")).includes("Reglas"));
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  await ctx.setOffline(true); await p.evaluate(() => window.dispatchEvent(new Event("offline"))); await p.waitForTimeout(100);
  check("indicador de sin conexión", await p.isVisible("#conexion"));
  await ctx.setOffline(false); await p.evaluate(() => window.dispatchEvent(new Event("online"))); await p.waitForTimeout(100);
  check("indicador desaparece al volver la conexión", !(await p.isVisible("#conexion")));
  await p.goto(`http://localhost:${PORT}/legal.html`, { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  check("legal.html con las cinco secciones y la versión", (await p.$$("#regulatorio, #aviso, #privacidad, #accesibilidad, #metodologia")).length === 5 && /^v\d+\.\d+/.test(await p.textContent("#app-version")));
  await p.goto(`http://localhost:${PORT}/acerca.html`, { waitUntil: "networkidle" }); await p.waitForFunction(() => /casos clínicos/.test(document.querySelector("#validacion-txt").textContent), null, { timeout: 15000 });
  check("acerca.html ejecuta los casos de validación", (await p.$$("#validacion-lista li")).length >= 10 && !(await p.textContent("#validacion-lista")).includes("✘"));

} catch (e) {
  fallos++; console.log("  ✘ excepción en las pruebas:", e.message);
}
for (const buf of await paralelos) for (const l of buf) console.log(l);
check("sin errores de JavaScript en la página", errores.length === 0, errores.join(" | ").slice(0, 300));
await navegador.close();
servidor.kill();
console.log(`\n${total - fallos}/${total} pruebas de interfaz correctas`);
process.exit(fallos ? 1 : 0);
