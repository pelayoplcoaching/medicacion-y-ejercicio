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
const p = await ctx.newPage();
const errores = [];
p.on("pageerror", (e) => errores.push(e.message));
p.on("console", (m) => { if (m.type() === "error" && !/cdn|Failed to load resource|tessdata/i.test(m.text())) errores.push(m.text()); });
p.on("dialog", (d) => d.dismiss());

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
  await p.click("#btn-pegar"); await p.fill("#pegar", "Atorvastatina 40 mg 0-0-1\nFantasiol 10 mg 1-0-0"); await p.click("#btn-importar"); await p.waitForTimeout(200);
  check("línea reconocida añadida", (await p.$$("#lista-meds li")).length === 6);
  check("línea no reconocida avisada", await p.isVisible("#no-reconocidos"));

  console.log("Informe");
  await p.click("#btn-ir-informe"); await p.waitForTimeout(300);
  check("veredicto presente", (await p.textContent("#veredicto")).length > 20);
  check("lo esencial con 3–5 puntos", [3, 4, 5].includes((await p.$$("#esencial .esencial li")).length));
  check("señales de alarma", (await p.$$("#alarma-card li")).length >= 5);
  check("tarjeta Hoy", await p.isVisible("#hoy"));
  check("glosario presente", (await p.$$("abbr.glos")).length >= 1);
  const tabs = await p.$$eval(".tabs [role=tab] .cnt", (es) => es.map((e) => e.textContent.trim()));
  check("recuentos en pestañas", tabs.some((x) => x !== ""));
  await p.click('[data-tab="interacciones"]'); await p.waitForTimeout(200);
  check("interacciones listadas", (await p.$$("#contenido-tab .ddi")).length >= 1);
  await p.click('[data-tab="cuando"]'); await p.waitForTimeout(200);
  check("franja horaria pintada", (await p.textContent("#contenido-tab")).length > 50);
  await p.click('[data-tab="general"]'); await p.waitForTimeout(200);
  await p.click("#sintomas-card summary"); await p.click('#sintomas-card button[data-s="mareo"]'); await p.waitForTimeout(150);
  check("síntomas → fármacos posibles", (await p.textContent("#sintoma-detalle")).includes("contribuir"));

  console.log("Mi plan");
  await p.click('[data-tab="plan"]'); await p.waitForTimeout(250);
  check("tira de 7 días y sesión del día", (await p.$$(".tira .dia")).length === 7 && (await p.$$(".plan-dia .bloques li")).length >= 3);
  check("iconos de grupo terapéutico en la lista", (await p.$$("#lista-meds .ic-grupo.g-corazon")).length >= 1 && (await p.$$("#lista-meds .ic-grupo.g-azucar")).length >= 1);
  check("pictogramas, claves y variantes en los ejercicios", (await p.$$(".plan-dia .picto")).length >= 3 && (await p.$$(".plan-dia .variantes")).length >= 1 && (await p.$$(".plan-dia .clave")).length >= 1);
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
  await p.fill('#sesion-const input[name="glucosa_antes"]', "140"); await p.fill('#sesion-const input[name="fc"]', "95");
  await p.click("#sesion-terminar"); await p.waitForTimeout(300);
  check("sesión registrada en la semana", (await p.$$(".tira .dia.hecho")).length === 1 && (await p.textContent(".anillo .num")) !== "0");
  check("tendencia de 8 semanas", (await p.$$(".tend rect")).length === 8);
  const diario = await p.evaluate(() => JSON.parse(localStorage.getItem("medex.diario")));
  check("constantes guardadas con la sesión", diario[0].const?.glucosa_antes === 140 && diario[0].const?.fc === 95 && diario[0].chequeo === "ok");
  const [csv] = await Promise.all([p.waitForEvent("download"), p.click("#btn-diario-csv")]);
  check("diario exportable en CSV", csv.suggestedFilename().endsWith(".csv"));
  await p.click('[data-tab="general"]'); await p.waitForTimeout(150);

  console.log("Conciliación (lista guardada)");
  await p.click("#btn-perfiles"); await p.fill("#perfil-nombre", "Prueba"); await p.click("#btn-perfil-guardar"); await p.waitForTimeout(150);
  await p.click("#lista-meds li:nth-child(1) .quitar"); await p.waitForTimeout(150); await p.click("#toast button").catch(() => {}); await p.waitForTimeout(100);
  await p.click("#lista-meds li:nth-child(1) .quitar"); await p.waitForTimeout(400);
  await p.click('#perfiles-lista [data-a="cargar"]'); await p.waitForTimeout(300);
  check("al cargar la lista guardada se muestran los cambios", await p.isVisible("#cambios") && (await p.textContent("#cambios")).includes("Nuevos"));
  await p.click('#cambios [data-a="cerrar"]'); await p.click("#btn-perfiles");

  console.log("Modo profesional y textos");
  await p.click('[data-modo="profesional"]'); await p.waitForTimeout(150);
  check("acento del modo profesional", (await p.$eval("body", (e) => getComputedStyle(e).getPropertyValue("--accent").trim())) !== "#6b35c4");
  await p.selectOption("#pro-nyha", "3");
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
  await p.click("#btn-historia"); await p.waitForTimeout(200);
  const historia = await p.evaluate(() => navigator.clipboard.readText());
  check("texto para la historia clínica", historia.startsWith("RECOMENDACIÓN DE EJERCICIO") && historia.includes("NYHA"));
  check("la historia incluye el registro del paciente con constantes", historia.includes("Registro del paciente") && historia.includes("glucosa antes 140"));
  await p.evaluate(() => { window.__u = []; window.open = (u) => { window.__u.push(u); return null; }; navigator.share = undefined; });
  await p.click("#btn-whatsapp");
  check("texto de WhatsApp", decodeURIComponent((await p.evaluate(() => window.__u[0])) || "").includes("Lo esencial"));
  await p.click(".utiles .btn-sugerencia");
  check("formulario de sugerencias con campos ocultos", (await p.evaluate(() => window.__u[1])).includes("tally.so") && (await p.evaluate(() => window.__u[1])).includes("lista="));

  console.log("Persistencia e idiomas");
  await p.reload({ waitUntil: "networkidle" }); await p.waitForFunction(() => document.querySelector("#kb-version").textContent.includes("v"), null, { timeout: 15000 });
  check("lista restaurada tras recargar", (await p.$$("#lista-meds li")).length === 6);
  check("cabecera compacta en la segunda visita", await p.$eval("html", (e) => e.classList.contains("retorno")));
  await p.selectOption("#idioma", "en");
  check("interfaz en inglés", (await p.textContent('[data-tab="cuando"]')).includes("When"));
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
} catch (e) {
  fallos++; console.log("  ✘ excepción en las pruebas:", e.message);
}
check("sin errores de JavaScript en la página", errores.length === 0, errores.join(" | ").slice(0, 300));
await navegador.close();
servidor.kill();
console.log(`\n${total - fallos}/${total} pruebas de interfaz correctas`);
process.exit(fallos ? 1 : 0);
