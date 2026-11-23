#!/usr/bin/env node
/* Pruebas de regresión del motor y del lector de listas.
   Uso: node scripts/test.mjs            (sin dependencias) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORDEN ={ alerta: 3, precaucion: 2, info: 1 };
const { construirIndice, evaluar, buscar, ventanaEntrenamiento, loEsencial, ALARMA, planSemana, minutosPorSemana, compararListas, constantesRelevantes, chequeoPrevio, veredictoChequeo, sesionTipo, cribadoACSM, enfermedadSugerida, nivelEvidencia, seccionFT, comprobarCaso, zonaIntensidad, impactoPorFarmaco, puntuarSPPB, evolucion, textoEvolucion } = await import(pathToFileURL(path.join(ROOT, "app/js/engine.js")).href);
const { extraerMedicacion } = await import(pathToFileURL(path.join(ROOT, "app/js/parser.js")).href);

const kb = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/kb.json"), "utf8"));
const ddiCurado = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/ddi_curated.json"), "utf8"));
const indice = construirIndice(kb, []);
const datos = { kb, ddiCurado, ddi: { pares: [] }, indice };

let fallos = 0, total = 0;
function check(nombre, cond, detalle = "") {
  total++;
  if (cond) console.log(`  ✔ ${nombre}`);
  else { fallos++; console.log(`  ✘ ${nombre} ${detalle}`); }
}
const pids = (r) => r.reconocidos.map((x) => x.pid);
const get = (r, pid) => r.reconocidos.find((x) => x.pid === pid);

console.log("Lector de listas");
{
  const hoja = `FÁRMACOS
CRONICO
ATORVASTATINA 40 MG 28 COMPRIMIDOS
13/11/19
Unidades: COMPRIMIDO, Vía: ORAL
1
CRONICO
PARACETAMOL 1000 MG 40 COMPRIMIDOS
19/10/16
1
Unidades: COMPRIMIDO, Vía:
1
1
si precisa
CRONICO
LOSARTAN 25 MG 28 COMPRIMIDOS
14/01/25
1
Unidades: COMPRIMIDO, Vía: ORAL
CRONICO
EUTIROX 25 MICROGRAMOS COMPRIMIDOS , 100
11/12/18
1
CRONICO
FUROSEMIDA 40 MG 30 COMPRIMIDOS
16/03/21
1
Unidades: COMPRIMIDO, Vía: ORAL
1-0-0 de forma diaria
CRONICO
LIXIANA 30 MG COMPRIMIDOS RECUBIERTOS CON
30/06/22
Unidades: COMPRIMIDO, Vía: ORAL
1
CRONICO
METFORMINA 850 MG 50 COMPRIMIDOS
06/02/24
1
Unidades: COMPRIMIDO, Vía: ORAL
1
en la comida en medio
CRONICO
BISOPROLOL 1,25 MG 20 COMPRIMIDOS
15/10/26
1`;
  const r = extraerMedicacion(hoja, indice);
  check("hoja CAM: 8 fármacos", r.reconocidos.length === 8, String(pids(r)));
  check("envase ignorado (metformina 850 × 2)", get(r, "metformina")?.dosis === 850 && get(r, "metformina")?.tomas === 2, JSON.stringify(get(r, "metformina")));
  check("si precisa (paracetamol 1000 × hasta 3)", get(r, "paracetamol")?.tomas === 3 && get(r, "paracetamol")?.aDemanda === true);
  check("microgramos (levotiroxina 25 mcg)", get(r, "levotiroxina")?.dosis === 25 && get(r, "levotiroxina")?.unidad === "mcg");
  check("coma decimal (bisoprolol 1,25)", get(r, "bisoprolol")?.dosis === 1.25);
  check("Lixiana → edoxabán 30", get(r, "edoxaban")?.dosis === 30);
}
{
  const r = extraerMedicacion(`EMCONCOR COR 5 mg 1 comprimido cada 24 horas
PROGRAF 1 mg capsulas duras 3-0-3
DIAMICRON 30 mg 2 comprimidos en el desayuno
Sintrom 4 mg 0.5-0-0
LANTUS SOLOSTAR 100 UI/ml 22 UI por la noche
Ventolin 100 mcg/inhalación 2 inhalaciones si precisa
Durogesic 50 mcg/h parche cada 72 h
Algo raro 25 mg 1-0-0`, indice);
  check("pauta 3-0-3 (tacrolimus 3 × 2)", get(r, "tacrolimus")?.dosis === 3 && get(r, "tacrolimus")?.tomas === 2);
  check("2 comprimidos (gliclazida 60)", get(r, "gliclazida")?.dosis === 60);
  check("medio comprimido (acenocumarol 2)", get(r, "acenocumarol")?.dosis === 2);
  check("concentración ignorada (insulina 22 UI)", get(r, "insulina_basal")?.dosis === 22);
  check("inhalaciones (salbutamol 2)", get(r, "salbutamol")?.dosis === 2);
  check("parche mcg/h (fentanilo 50)", get(r, "fentanilo")?.dosis === 50);
  check("no reconocido listado", r.noReconocidos.length === 1 && /Algo raro/.test(r.noReconocidos[0]));
}
{
  const r = extraerMedicacion(`JANUMET 50 mg/1000 mg 56 comprimidos 1-0-1
TRIPLIXAM 10 mg/2,5 mg/10 mg 1-0-0
Co-Diovan 320/25 mg 1-0-0`, indice);
  check("combinación: dosis emparejadas (metformina 1000, sitagliptina 50)", get(r, "metformina")?.dosis === 1000 && get(r, "sitagliptina")?.dosis === 50);
  check("combinación triple (perindopril 10, indapamida 2.5, amlodipino 10)", get(r, "perindopril")?.dosis === 10 && get(r, "indapamida")?.dosis === 2.5 && get(r, "amlodipino")?.dosis === 10);
  check("Co-Diován 320/25", get(r, "valsartan")?.dosis === 320 && get(r, "hidroclorotiazida")?.dosis === 25);
}

console.log("Búsqueda");
check("marca → principio (Emconcor)", buscar(indice, "emcon", 1)[0]?.pid === "bisoprolol");
check("combinación por marca (Triplixam)", buscar(indice, "triplix", 1)[0]?.tipo === "combo");
check("sin acentos (losartan)", buscar(indice, "losartan", 1)[0]?.pid === "losartan");

console.log("Motor de reglas");
{
  const meds = [{ pid: "bisoprolol", dosis: 5, tomas: 1 }, { pid: "enalapril", dosis: 20, tomas: 1 }, { pid: "furosemida", dosis: 40, tomas: 1 }, { pid: "apixaban", dosis: 5, tomas: 2 }, { pid: "atorvastatina", dosis: 40, tomas: 1 }, { pid: "metformina", dosis: 850, tomas: 2 }, { pid: "gliclazida", dosis: 60, tomas: 1 }, { pid: "lorazepam", dosis: 1, tomas: 1 }, { pid: "ibuprofeno", dosis: 600, tomas: 2 }];
  const res = evaluar(datos, meds, { edad: 72, caidas: true, condiciones: new Set() });
  const ids = res.combinadas.map((c) => c.regla.id);
  check("triple whammy", ids.includes("triple_whammy"));
  check("BB + hipoglucemiante", ids.includes("bb_hipoglucemia"));
  check("caídas en mayor", ids.includes("caidas_mayor"));
  check("≥3 hipotensores", ids.includes("hipotension_triple"));
  check("interacción mayor enalapril + ibuprofeno", res.interacciones.some((x) => x.nivel === "mayor" && [x.a.principio.id, x.b.principio.id].sort().join() === "enalapril,ibuprofeno"));
  check("apixabán 10 mg/día no es dosis alta", res.items.find((i) => i.principio.id === "apixaban")?.dosisCat !== "alta");
}
{
  const meds = [{ pid: "analogo_lhrh" }, { pid: "abiraterona", dosis: 1000, tomas: 1 }, { pid: "tacrolimus", dosis: 3, tomas: 2 }, { pid: "micofenolato", dosis: 1000, tomas: 2 }];
  const res = evaluar(datos, meds, { edad: 70, condiciones: new Set() });
  check("interacción curada con fuente por fila (fuenteTxt)", (() => { const r = evaluar(datos, [{ pid: "acenocumarol", dosis: 2, tomas: 1 }, { pid: "ibuprofeno", dosis: 1200, tomas: 3 }], { edad: 70, condiciones: new Set() }); return r.interacciones.some((x) => x.fuente === "curada" && /FT AEMPS/.test(x.fuenteTxt)); })());
  check("sin duplicidad en clases combinables", !res.interacciones.some((x) => x.fuente === "duplicidad"), res.interacciones.map((x) => x.fuente).join());
}
{
  const meds = [{ pid: "metformina", dosis: 850, tomas: 2 }, { pid: "litio", dosis: 400, tomas: 2 }, { pid: "hidroclorotiazida", dosis: 25, tomas: 1 }];
  const res = evaluar(datos, meds, { edad: 50, condiciones: new Set(["renal_grave", "renal", "fragil", "nyha34"]) });
  const ids = res.combinadas.map((c) => c.regla.id);
  check("litio + tiazida", ids.includes("litio_riesgo"));
  check("condición renal_grave", ids.includes("renal_grave"));
  check("condición fragilidad", ids.includes("fragil_plan"));
  check("condición NYHA III–IV", ids.includes("nyha34"));
  const res2 = evaluar(datos, meds, { edad: 50, condiciones: new Set() });
  check("sin condiciones no se disparan", !res2.combinadas.some((c) => ["renal_grave", "fragil_plan", "nyha34"].includes(c.regla.id)));
}

console.log("Tolerancia a erratas y OCR");
{
  check("errata: bisporolol → bisoprolol", buscar(indice, "bisporolol", 1)[0]?.pid === "bisoprolol" && buscar(indice, "bisporolol", 1)[0]?.aproximado === true);
  check("errata: metfromina → metformina", buscar(indice, "metfromina", 1)[0]?.pid === "metformina");
  check("errata: emconcro → Emconcor", buscar(indice, "emconcro", 1)[0]?.pid === "bisoprolol");
  check("sin falsos positivos cortos", buscar(indice, "xyzq", 1).length === 0);
  const r = extraerMedicacion(`Sintrom 4 0.5-0-0\nAdiro 100\nMetformina 850rng 1-0-1\nEnalapril l0 mg 1-0-0\nBisoprolol 2,5 mg`, indice);
  check("dosis sin unidad plausible (Sintrom 4 → 2 mg por medio comprimido)", get(r, "acenocumarol")?.dosis === 2);
  check("dosis sin unidad (Adiro 100)", get(r, "aas")?.dosis === 100);
  check("OCR 850rng → 850 mg", get(r, "metformina")?.dosis === 850);
  check("OCR l0 mg → 10 mg", get(r, "enalapril")?.dosis === 10);
  check("coma decimal 2,5", get(r, "bisoprolol")?.dosis === 2.5);
}

console.log("Momentos y ¿cuándo entrenar?");
{
  const r = extraerMedicacion(`FUROSEMIDA 40 MG 30 COMPRIMIDOS\n16/03/21\n1@desayuno\nLorazepam 1 mg 0-0-1\nNovorapid 6 UI en desayuno, comida y cena`, indice);
  check("momentos desde columna PDF (furosemida desayuno)", JSON.stringify(get(r, "furosemida")?.momentos) === '["desayuno"]');
  check("momentos desde pauta 0-0-1 (lorazepam cena)", JSON.stringify(get(r, "lorazepam")?.momentos) === '["cena"]');
  check("momentos desde texto (insulina 3 tomas)", get(r, "insulina_rapida")?.momentos?.length === 3);
  const v = ventanaEntrenamiento(indice, r.reconocidos.map((x) => ({ pid: x.pid, tomas: x.tomas, momentos: x.momentos })));
  check("insulina rápida: 9–11 h en rojo", v.horas.find((h) => h.h === 9)?.nivel === "rojo" && v.horas.find((h) => h.h === 10)?.nivel === "rojo");
  check("hay franjas preferibles", v.mejores.length >= 1);
  const v2 = ventanaEntrenamiento(indice, [{ pid: "atorvastatina", tomas: 1, momentos: ["cena"] }]);
  check("sin fármacos con horario → sin motivos", v2.motivos.length === 0);
}

console.log("Integridad de datos");
{
  const ids = new Set(), dup = [];
  for (const c of kb.clases) for (const p of c.principios) { if (ids.has(p.id)) dup.push(p.id); ids.add(p.id); }
  check("sin principios duplicados", dup.length === 0, dup.join());
  const clases = new Set(kb.clases.map((c) => c.id));
  const malas = ddiCurado.interacciones.filter((x) => [x.a, x.b].some((k) => (k.startsWith("clase:") ? !clases.has(k.slice(6)) : !ids.has(k))));
  check("interacciones curadas con referencias válidas", malas.length === 0, JSON.stringify(malas.slice(0, 3)));
  const combosMal = (kb.combinaciones || []).filter((c) => c.componentes.some((k) => !ids.has(k.pid)));
  check("combinaciones con componentes válidos", combosMal.length === 0, combosMal.map((c) => c.nombre).join());
}

console.log("\nNomenclátor y clasificación ATC");
{
  const marcas = [
    { nombre: "CELIPROLOL NORMON 200 MG COMPRIMIDOS", atc: "C07AB08", pa: "Celiprolol", clase: "betabloqueantes", dosis: [200] },
    { nombre: "OMEPRAZOL CINFA 20 MG CAPSULAS", principios: ["omeprazol"], dosis: [20] },
  ];
  const kb2 = JSON.parse(JSON.stringify(kb));
  const idx = construirIndice(kb2, marcas);
  const r1 = buscar(idx, "celipro");
  check("principio sintético por ATC aparece en la búsqueda", r1.some((e) => e.pid === "atc:celiprolol" && e.tipo === "principio"));
  check("marca del nomenclátor con dosis por comprimido", buscar(idx, "omeprazol 20").some((e) => e.dosis === 20));
  const res = evaluar({ kb: kb2, ddiCurado, ddi: { pares: [] }, indice: idx }, [{ pid: "atc:celiprolol", dosisPorToma: 200, tomas: 1 }, { pid: "bisoprolol", dosisPorToma: 5, tomas: 1 }], { edad: 70, condiciones: new Set() });
  const it = res.items.find((i) => i.principio.id === "atc:celiprolol");
  check("el sintético hereda clase y señales del grupo", it && it.clase.id === "betabloqueantes" && it.senales.has("bradicardia"), it && [...it.senales].join());
  check("reglas combinadas cuentan al sintético (bradicardia múltiple)", res.combinadas.some((c) => c.regla.id === "bradicardia_multiple"));
  check("nota de clasificación automática", /ATC/.test(it?.principio.nota || ""));
}

console.log("\nFármacos de consulta (bloque 08)");
{
  const ids = new Set(kb.clases.flatMap((c) => c.principios.map((p) => p.id)));
  check("rabeprazol, vardenafilo, ibandronato, progesterona, clorfenamina, dextrometorfano, aciclovir", ["rabeprazol", "vardenafilo", "ibandronato", "progesterona", "clorfenamina", "dextrometorfano", "aciclovir"].every((x) => ids.has(x)));
  const fren = buscar(indice, "frenadol").find((e) => e.tipo === "combo");
  check("Frenadol es una combinación de 4 componentes", fren && fren.componentes.length === 4, fren && fren.componentes.map((c) => c.pid).join());
  const res = evaluar({ kb, ddiCurado, ddi: { pares: [] }, indice }, [{ pid: "dextrometorfano", dosisPorToma: 20, tomas: 3 }, { pid: "sertralina", dosisPorToma: 50, tomas: 1 }], { edad: 40, condiciones: new Set() });
  check("dextrometorfano + ISRS dispara la regla serotoninérgica", res.combinadas.some((c) => /serotonin/.test(c.regla.id)), res.combinadas.map((c) => c.regla.id).join());
}

console.log("\nLo esencial");
{
  const meds = [["bisoprolol", 5], ["furosemida", 40], ["acenocumarol", 2], ["metformina", 850], ["lorazepam", 1], ["insulina_rapida", null]].map(([p, d]) => ({ pid: p, dosis: d, tomas: 1 }));
  const res = evaluar({ kb, ddiCurado, ddi: { pares: [] }, indice }, meds, { edad: 78, caidas: true, condiciones: new Set(["diabetes", "insuficiencia_cardiaca"]) });
  const e = loEsencial(res, 5);
  check("devuelve 5 puntos como máximo", e.length === 5, String(e.length));
  check("alertas antes que precauciones", e.every((p, i) => i === 0 || ORDEN[e[i - 1].nivel] >= ORDEN[p.nivel]));
  check("frases accionables y cortas", e.every((p) => p.texto.length <= 190 && /[A-Za-zÁ-ú]/.test(p.texto)), e.map((p) => p.texto.length).join());
  check("sin títulos repetidos", new Set(e.map((p) => p.titulo)).size === e.length);
  check("señales de alarma definidas", ALARMA.length >= 5);
}

console.log("\nEvolución del plan (v1.0)");
{
  const dia = (n) => { const d = new Date(2026, 8, 1 + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const ini = new Date(2026, 8, 1).getTime(), ahora = new Date(2026, 9, 13).getTime(); // 6 semanas
  const diario = []; for (let i = 0; i < 42; i += 2) diario.push({ fecha: dia(i), tipo: i % 4 ? "aerobico" : "fuerza", min: 30, rpe: i % 4 ? 5 : 6, sintomas: i === 10 ? ["mareo"] : [], const: i % 6 === 0 ? { glucosa_antes: 120, glucosa_despues: i === 12 ? 65 : 110 } : undefined });
  const prescrito = { fecha: ini, semanas: 6, base: { meds: [{ pid: "bisoprolol", dosis: 5, tomas: 1 }, { pid: "furosemida", dosis: 40, tomas: 1 }], sppb: 8, fcReposo: 72 } };
  const evo = evolucion(diario, prescrito, { planDias: [1, 2, 3, 4, 5], actual: { meds: [{ pid: "bisoprolol", dosis: 2.5, tomas: 1 }, { pid: "apixaban", dosis: 5, tomas: 2 }], sppb: 10, fcReposo: 66 }, ahora });
  check("evolución: 21 sesiones en 6 semanas, 630 min, 105 min/semana", evo.sesiones === 21 && evo.minutos === 630 && evo.minutosSemana === 105, JSON.stringify([evo.sesiones, evo.minutos, evo.minutosSemana]));
  check("evolución: adherencia 70 % (21 de 30) → parcial", evo.adherencia === 70 && evo.valoracion === "parcial", String(evo.adherencia));
  check("evolución: RPE medio, síntomas y glucemias (1 hipoglucemia)", evo.rpeMedio > 5 && evo.rpeMedio < 6 && evo.sintomas.mareo === 1 && evo.constantes.glucosa.hipos === 1);
  check("evolución: SPPB +2, FC reposo −6, medicación (nuevo apixabán, retirada furosemida, dosis de bisoprolol)", evo.comp.sppb.delta === 2 && evo.comp.fcReposo.delta === -6 && evo.comp.medicacion.nuevos.length === 1 && evo.comp.medicacion.retirados.length === 1 && evo.comp.medicacion.cambios.length === 1);
  check("evolución: vencida al llegar la fecha prevista; sin prescripción → null", evo.vencida === true && evolucion(diario, null) === null);
  const txt = textoEvolucion(evo, { nombres: { apixaban: "Apixabán", furosemida: "Furosemida", bisoprolol: "Bisoprolol" } });
  check("texto de evolución para la historia", txt.startsWith("EVOLUCIÓN DEL PLAN") && txt.includes("70 %") && txt.includes("SPPB 8 → 10 (+2") && txt.includes("nuevos: Apixabán") && txt.includes("1 valor(es) < 70"));
}

console.log("\nLectura fácil (v1.0)");
{
  const { inflesz, informe, silabas } = await import(pathToFileURL(path.join(ROOT, "scripts/legibilidad.mjs")).href);
  check("sílabas: camine → 3, hipoglucemia → 5, día → 2 (hiato), agua → 2 (diptongo)", silabas("camine") === 3 && silabas("hipoglucemia") === 5 && silabas("día") === 2 && silabas("agua") === 2);
  check("INFLESZ: prosa sencilla puntúa «bastante fácil»; prosa técnica puntúa peor", inflesz("Camine cada día a un paso que le permita hablar. Beba agua antes y después. Pare si nota dolor en el pecho.") > 65 && inflesz("La administración concomitante de inhibidores potentes del citocromo incrementa significativamente la exposición plasmática del sustrato.") < 40);
  const r = informe();
  check(`legibilidad de los textos del paciente: media ≥ 55 (${r.media}) y como mucho 8 textos por debajo de 25 (${r.peores.filter((x) => x.v < 25).length})`, r.media >= 55 && r.peores.filter((x) => x.v < 25).length <= 8, r.peores.slice(0, 3).map((x) => `${x.v} ${x.donde}`).join(" | "));
  check(`textos «muy difíciles» (< 40) acotados: ${r.muyDificiles.length} ≤ 85`, r.muyDificiles.length <= 85);
}

console.log("\nIdiomas");
{
  // i18n.js usa document/localStorage solo dentro de funciones; aquí comprobamos los diccionarios
  // el español va en i18n.js; los demás idiomas, cada uno en js/i18n/xx.js (se descargan al elegirlos)
  const src = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const clavesDe = (txt) => new Set([...txt.matchAll(/"([a-z0-9_.]+)":/g)].map((x) => x[1]));
  const dicc = {};
  const mES = src.match(/^const ES = \{([\s\S]*?)^\};/m);
  if (mES) dicc.ES = clavesDe(mES[1]);
  for (const l of ["en", "ca", "gl", "eu"]) {
    const f = path.join(ROOT, `app/js/i18n/${l}.js`);
    if (fs.existsSync(f)) { const txt = fs.readFileSync(f, "utf8"); if (/^export default \{/m.test(txt)) dicc[l.toUpperCase()] = clavesDe(txt); }
  }
  check("cinco diccionarios", Object.keys(dicc).length === 5, Object.keys(dicc).join());
  check("i18n.js lleva solo el español (los otros idiomas se cargan al elegirlos)", !/^const (EN|CA|GL|EU) = /m.test(src) && /import\("\.\/i18n\/en\.js/.test(src));
  for (const l of ["EN", "CA", "GL", "EU"]) {
    const faltan = [...dicc.ES].filter((k) => !dicc[l].has(k));
    check(`${l} tiene todas las claves de ES`, faltan.length === 0, faltan.join());
  }
  const html = fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8");
  const usadas = [...html.matchAll(/data-i18n(?:-ph|-title|-aria)?="([a-z0-9_.]+)"/g)].map((x) => x[1]);
  const appjs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  usadas.push(...[...appjs.matchAll(/\bt\("([a-z0-9_.]+)"/g)].map((x) => x[1]).filter((k) => !k.endsWith(".")));  // claves dinámicas ("tema." + x) se ignoran
  const sinDef = [...new Set(usadas)].filter((k) => !dicc.ES.has(k));
  check("todas las claves usadas existen en ES", sinDef.length === 0, sinDef.join());
}

console.log("\nSemana activa: anillos, racha amable y mapa de 12 semanas (mejora grande 11)");
{
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/semana.js")).href);
  const ahora = new Date(2026, 10, 19, 12); // jueves 19/11/2026
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dia = (n) => { const d = new Date(ahora); d.setDate(d.getDate() + n); return iso(d); };
  check("lunes de la semana", iso(S.lunesDe(ahora)) === "2026-11-16" && iso(S.lunesDe(new Date(2026, 10, 22, 12))) === "2026-11-16");
  const l = S.lunesDe(ahora), fin = new Date(2026, 10, 23);
  const r = S.resumen([{ fecha: "2026-11-16", tipo: "fuerza_eq", min: 35 }, { fecha: "2026-11-17", tipo: "aerobico", min: 40 }, { fecha: "2026-11-18", tipo: "fuerza", min: 30 }, { fecha: "2026-11-18", tipo: "paseo", min: 20 }, { fecha: "2026-11-15", tipo: "fuerza", min: 30 }], l, fin);
  check("resumen: minutos de todo, días de fuerza (fuerza y fuerza+eq) y de equilibrio; fuera la semana anterior", r.min === 125 && r.fuerza === 2 && r.equilibrio === 1 && r.dias === 3 && r.sesiones === 4);
  check("objetivos: 150/2/2; fragilidad 90 y equilibrio 3", JSON.stringify(S.objetivos()) === '{"min":150,"fuerza":2,"equilibrio":2}' && JSON.stringify(S.objetivos({ fragil: true, eq: 3 })) === '{"min":90,"fuerza":2,"equilibrio":3}');
  const semanas = (ns) => ns.flatMap((n, i) => (n ? [{ fecha: dia(-7 * i), tipo: "aerobico", min: n }] : [])); // i = 0 esta semana, 1 la anterior…
  const r1 = S.rachaAmable(semanas([0, 30, 160, 30, 30]), 150, ahora);
  check("racha: la semana en curso vacía no la rompe; cuenta las cumplidas", r1.semanas === 4 && r1.cumplidas === 1 && !r1.comodin, JSON.stringify(r1));
  const r2 = S.rachaAmable(semanas([30, 0, 30, 30, 0, 0, 30, 30, 30, 30, 30]), 150, ahora);
  check("racha: una semana vacía se perdona (comodín), dos seguidas la rompen; mejor racha", r2.semanas === 3 && r2.comodin && r2.mejor === 5, JSON.stringify(r2));
  const r3 = S.rachaAmable(semanas([30, 0, 30, 0, 30, 30]), 150, ahora);
  check("racha: el comodín no se repite en menos de 6 semanas", r3.semanas === 2 && r3.comodin, JSON.stringify(r3));
  check("racha vacía", S.rachaAmable([], 150, ahora).semanas === 0 && !S.rachaAmable([], 150, ahora).conDatos);
  const m = S.mapaSemanas([{ fecha: dia(0), tipo: "fuerza", min: 45 }, { fecha: dia(-1), tipo: "aerobico", min: 10 }, { fecha: dia(-7), tipo: "aerobico", min: 160 }], 150, ahora);
  check("mapa: 12 semanas de 7 días, la actual la última, hoy marcado y lo que falta, futuro", m.length === 12 && m.every((s) => s.dias.length === 7) && m[11].actual && m[11].dias[3].hoy && m[11].dias[3].min === 45 && m[11].dias[4].futuro && m[10].cumplida && !m[11].cumplida);
  check("niveles de color por minutos", [0, 5, 25, 60].map(S.nivelDia).join() === "0,1,2,3");
}

console.log("\n«¿Por qué?»: explicadores animados de los mecanismos (mejora grande 1)");
{
  const PQ = await import(pathToFileURL(path.join(ROOT, "app/js/porque.js")).href);
  const kb = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/kb.json"), "utf8"));
  const fuenteApp = fs.readFileSync(path.join(ROOT, "app/js", "app.js"), "utf8");
  const mapa = JSON.parse(fuenteApp.match(/const PQ_SENAL = (\{[^}]+\});/)[1].replace(/(\w+):/g, '"$1":'));
  const orden = JSON.parse(fuenteApp.match(/const PQ_ORDEN = (\[[^\]]+\]);/)[1]);
  const esSrc = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  check("15 explicadores, los mismos que en app.js", PQ.PQ_IDS.length === 15 && JSON.stringify([...PQ.PQ_IDS].sort()) === JSON.stringify([...orden].sort()));
  check("cada señal enlazada existe en la base y apunta a un explicador", Object.entries(mapa).every(([s, id]) => kb.senales[s] && PQ.PORQUE[id]), Object.entries(mapa).filter(([s, id]) => !kb.senales[s] || !PQ.PORQUE[id]).join());
  check("cada explicador: título, 4 pasos, qué hacer y fuentes; botón traducido", PQ.PQ_IDS.every((id) => { const e = PQ.PORQUE[id]; return e.titulo && e.pasos.length === 4 && e.hacer.length >= 3 && e.fuentes.length >= 1 && esSrc.includes(`"pq.b.${id}"`); }));
  check("cada escena tiene dibujo y piezas que cambian de paso", PQ.PQ_IDS.every((id) => { const h = PQ.escena(id, 2); return /<svg[^>]+data-e="/.test(h) && (h.match(/<(path|circle|rect|ellipse)/g) || []).length >= 8 && /q-[dsh][1-4]/.test(h); }));
  check("las escenas no repiten el atributo class (se perdería la visibilidad por pasos)", PQ.PQ_IDS.every((id) => !/<[^>]+class="[^"]*"[^>]*\sclass="/.test(PQ.escena(id))));
  const fuentesKb = [...new Set(kb.clases.flatMap((c) => ["general", "aerobico", "fuerza", "equilibrio"].flatMap((a) => (c[a] || []).map((r) => r.fuente))).concat((kb.reglas_combinadas || []).map((r) => r.fuente)).filter(Boolean).flatMap((f) => f.split(/ · |; /)))];
  const enKb = (f) => fuentesKb.some((k) => k.includes(f.split(" (")[0].replace(" Lancet Diabetes Endocrinol", "")) || f.includes(k));
  check("las fuentes de los explicadores son las de las reglas de la base", PQ.PQ_IDS.every((id) => PQ.PORQUE[id].fuentes.every(enKb)), PQ.PQ_IDS.flatMap((id) => PQ.PORQUE[id].fuentes.filter((f) => !enKb(f))).join(" | "));
}

console.log("\n«Aprende»: lecciones de 2 minutos con preguntas (mejora grande 2)");
{
  const A = await import(pathToFileURL(path.join(ROOT, "app/js/aprende.js")).href);
  check("diez lecciones con identificador único", A.LECCIONES.length === 10 && new Set(A.LECCIONES.map((l) => l.id)).size === 10);
  check("cada lección: título, 4 tarjetas y 3 preguntas de 3 opciones con la buena dentro y su explicación", A.LECCIONES.every((l) => l.titulo && l.tarjetas.length === 4 && l.preguntas.length === 3 && l.preguntas.every((q) => q.p && q.o.length === 3 && Number.isInteger(q.ok) && q.ok >= 0 && q.ok < 3 && q.x)));
  check("la respuesta buena no está siempre en el mismo sitio", new Set(A.LECCIONES.flatMap((l) => l.preguntas.map((q) => q.ok))).size === 3);
  check("cada lección cita sus fuentes; las de estudios, con DOI", A.LECCIONES.every((l) => l.fuentes.length >= 1 && l.fuentes.every((f) => f.txt && (!/\b(19|20)\d\d\b.*(J |Med|Rev|Care|Pract|Lancet|Cochrane)/.test(f.txt) || f.doi))));
  check("recomendadas según la lista: azúcar, intensidad, tensión, caídas y medicación", JSON.stringify(A.recomendadas({ presentes: ["azucar", "pulso", "tension", "equilibrio"], edad: 70 })) === JSON.stringify(["azucar", "intensidad", "tension", "caidas", "medicacion"]) && A.recomendadas({}).length === 0);
}

console.log("\nEjercicios animados (mejora grande 7)");
{
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/movimiento.js")).href);
  const PQ = await import(pathToFileURL(path.join(ROOT, "app/js/porque.js")).href);
  const picts = new Set();
  for (const tipo of ["aerobico", "fuerza", "fuerza_eq", "equilibrio"]) for (const fragil of [false, true]) for (const b of sesionTipo(tipo, { fragil }).bloques) picts.add(b.pict);
  check("cada ejercicio de las sesiones tiene su movimiento y sus errores frecuentes", [...picts].every((p) => M.IDS.includes(p) && M.errores(p).length >= 3), [...picts].filter((p) => !M.IDS.includes(p) || M.errores(p).length < 3).join());
  const forma = (d) => d.replace(/-?\d*\.?\d+/g, "N").replace(/\s+/g, "").replace(/N(?=N)/g, "N,");
  const anim = M.IDS.map((id) => [id, M.animado(id)]);
  check("las dos posturas de cada ejercicio tienen los mismos trazos (si no, el navegador no puede pasar de una a otra)", anim.every(([, h]) => [...h.matchAll(/attributeName="d" values="([^"]+)"/g)].every((m) => new Set(m[1].split(";").map(forma)).size === 1)), anim.filter(([, h]) => [...h.matchAll(/attributeName="d" values="([^"]+)"/g)].some((m) => new Set(m[1].split(";").map(forma)).size !== 1)).map(([id]) => id).join());
  check("las animaciones esperan al toque (begin indefinido) y acaban quietas", anim.every(([, h]) => !/<animate(?![^>]*begin="indefinite")/.test(h) && !/<animate(?![^>]*fill="freeze")/.test(h)));
  check("los cuidados por ejercicio son mecanismos con explicador", M.IDS.every((id) => M.cuidados(id, PQ.PQ_IDS).every((m) => PQ.PQ_IDS.includes(m))));
}

console.log("\nPruebas de forma física: Senior Fitness Test con baremos por edad y sexo (mejora grande 8)");
{
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/pruebas.js")).href);
  const PQ = await import(pathToFileURL(path.join(ROOT, "app/js/porque.js")).href);
  const tablas = Object.values(S.NORMAS).flatMap((x) => [x.m, x.h]);
  check("baremos completos: 7 pruebas × 2 sexos × 7 bandas de edad, cada rango de menos a más", Object.keys(S.NORMAS).length === 7 && tablas.every((b) => b.length === 7 && b.every(([lo, hi]) => lo < hi)));
  check("bandas de edad: sin baremo antes de los 60; desde los 95, la de 90-94", [59, 60, 64, 65, 94, 99].map(S.banda).join() === "-1,0,0,1,6,6");
  check("se clasifica con lo mismo que se enseña (centímetros y metros redondeados)", S.clasificar("sentado", -1.3, 62, "m").nivel === "normal" && S.clasificar("sentado", -1.4, 62, "m").nivel === "bajo" && JSON.stringify(S.rango("andar6", 62, "m")) === "[498,604]");
  check("en segundos, menos es mejor; la zona de riesgo va aparte del rango de su edad", S.clasificar("levantarse", 4, 67, "h").nivel === "alto" && S.clasificar("levantarse", 9.5, 67, "h").riesgo && S.clasificar("silla", 7, 92, "m").nivel === "normal" && S.clasificar("silla", 7, 92, "m").riesgo);
  check("sin zona de riesgo en flexibilidad; meta de autonomía solo en silla y marcha en el sitio", S.umbral("sentado") === null && S.umbral("espalda") === null && Object.keys(S.META).join() === "silla,paso2" && S.clasificar("paso2", 95, 72, "h").metaOk === true && S.clasificar("silla", 13, 72, "m").metaOk === false);
  check("sin sexo o antes de los 60 no se compara con la edad (sí consigo mismo)", S.clasificar("silla", 12, 55, "m").nivel === null && S.clasificar("silla", 12, 70, null).nivel === null);
  check("mejor de dos intentos y metros andados", S.mejorDe("levantarse", [6.1, 5.8]) === 5.8 && S.mejorDe("espalda", [-3, 2]) === 2 && S.distancia(10, 45.7, 20) === 477);
  const R = S.resumen({ silla: 9, brazo: 20, paso2: 60, sentado: 2, espalda: -12, levantarse: 6.5 }, 72, "m");
  check("resumen: puntos fuertes y dónde más puede ganar (primero lo que está en zona de riesgo)", R.total === 6 && R.habituales === 3 && R.fuertes[0] === "brazo" && R.mejorar.join() === "paso2,silla" && R.riesgo.join() === "paso2");
  const forma = (d) => d.replace(/-?\d*\.?\d+/g, "N").replace(/\s+/g, "").replace(/N(?=N)/g, "N,");
  check("dibujos: las dos posturas con los mismos trazos y animaciones que esperan al toque", S.ORDEN.every((id) => { const h = S.escena(id); return /<svg/.test(h) && [...h.matchAll(/attributeName="d" values="([^"]+)"/g)].every((m) => new Set(m[1].split(";").map(forma)).size === 1) && !/<animate(?:Motion)?(?![^>]*begin="indefinite")/.test(h); }));
  const ks = Object.keys(S.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos de la interfaz en los cinco idiomas, con las mismas variables", ["en", "ca", "gl", "eu"].every((l) => Object.keys(S.TXT[l]).length === ks.length && ks.every((k) => S.TXT[l][k] && vars(S.TXT[l][k]) === vars(S.TXT.es[k]))));
  const nombres = new Set(); for (const tipo of ["aerobico", "fuerza", "fuerza_eq", "equilibrio"]) for (const fragil of [false, true]) for (const b of sesionTipo(tipo, { fragil }).bloques) nombres.add(b.nombre);
  check("los ejercicios que propone existen en las sesiones (abren su ficha animada)", Object.values(S.PRUEBAS).every((x) => x.ej.length >= 2 && x.ej.every((e) => nombres.has(e))));
  check("cuidados de cada prueba con explicador; fuentes de estudios con DOI", Object.values(S.PRUEBAS).every((x) => x.cuida.every((m) => PQ.PQ_IDS.includes(m)) && x.pasos.length === 4) && S.FUENTES.filter((f) => /J Aging|Gerontologist|Res Q/.test(f.txt)).every((f) => f.doi));
}

console.log("\nMetas de la vida diaria (mejora grande 9)");
{
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/metas.js")).href);
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/pruebas.js")).href);
  const fuenteApp = fs.readFileSync(path.join(ROOT, "app/js", "app.js"), "utf8");
  const idsApp = JSON.parse(fuenteApp.match(/const METAS_IDS = (\[[^\]]+\]);/)[1]);
  check("ocho metas con identificador único (las mismas que sanea app.js), título, para qué y cuatro hitos", M.METAS.length === 8 && new Set(M.METAS.map((m) => m.id)).size === 8 && JSON.stringify(M.METAS.map((m) => m.id)) === JSON.stringify(idsApp) && M.METAS.every((m) => m.titulo && m.por && m.corto && m.icono && m.hitos.length === 4));
  const nombres = new Set(); for (const tipo of ["aerobico", "fuerza", "fuerza_eq", "equilibrio"]) for (const fragil of [false, true]) for (const b of sesionTipo(tipo, { fragil }).bloques) nombres.add(b.nombre);
  check("cada meta: ejercicios que existen en las sesiones y pruebas de forma física que la miden", M.METAS.every((m) => m.ej.length >= 3 && m.ej.every((e) => nombres.has(e)) && m.pruebas.length >= 1 && m.pruebas.every((p) => S.ORDEN.includes(p))), M.METAS.flatMap((m) => m.ej.filter((e) => !nombres.has(e))).join());
  check("cada sesión del plan (fuerza, fuerza y equilibrio, aeróbica) trabaja la meta de las escaleras", ["fuerza", "fuerza_eq", "aerobico"].every((tipo) => sesionTipo(tipo, {}).bloques.some((b) => M.POR_ID.escaleras.ej.includes(b.nombre))));
  const e0 = M.sanear({ ids: ["escaleras", "nada", "compra", "caminar", "suelo"], hitos: { escaleras: [5, "x", -1] } });
  check("saneado: como mucho 3 metas conocidas y 4 fechas por meta", JSON.stringify(e0) === JSON.stringify({ ids: ["escaleras", "compra", "caminar"], hitos: { escaleras: [5, null, null, null], compra: [null, null, null, null], caminar: [null, null, null, null] } }) && M.sanear(null) === null);
  const e1 = M.marcar(e0, "compra", 2, true, 100), e2 = M.marcar(e1, "compra", 1, false);
  check("marcar un hito marca los anteriores; desmarcar quita los siguientes", JSON.stringify(e1.hitos.compra) === "[100,100,100,null]" && M.progreso(e1, "compra").n === 3 && JSON.stringify(e2.hitos.compra) === "[100,null,null,null]" && M.progreso(e2, "compra").n === 1);
  const e3 = M.alternar(e0, "nietos"), e4 = M.alternar(e0, "compra");
  check("elegir y quitar metas, sin pasar de 3", e3.ids.length === 3 && !e3.ids.includes("nietos") && e4.ids.join() === "escaleras,caminar" && !e4.hitos.compra && M.alternar(e4, "nietos").ids.join() === "escaleras,caminar,nietos");
  check("tarjeta de Mi plan: sin metas invita con cuatro atajos; con metas, sus hitos y el siguiente", (M.tarjeta({ metas: null }).match(/data-meta-elegir=/g) || []).length === 4 && /data-meta-hito="compra" data-k="3"/.test(M.tarjeta({ metas: e1 })) && /3\/4/.test(M.tarjeta({ metas: e1 })));
  const ks = Object.keys(M.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos de la interfaz en los cinco idiomas, con las mismas variables", ["en", "ca", "gl", "eu"].every((l) => Object.keys(M.TXT[l]).length === ks.length && ks.every((k) => M.TXT[l][k] && vars(M.TXT[l][k]) === vars(M.TXT.es[k]))));
}

console.log("\nResumen del mes con imagen para compartir (mejora grande 12)");
{
  const Mm = await import(pathToFileURL(path.join(ROOT, "app/js/mes.js")).href);
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/metas.js")).href);
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/pruebas.js")).href);
  const d = [
    { fecha: "2026-10-05", tipo: "fuerza_eq", min: 30, rpe: 5, sintomas: [] }, { fecha: "2026-10-06", tipo: "aerobico", min: 40, rpe: 6, sintomas: [] }, { fecha: "2026-10-27", tipo: "fuerza", min: 30, rpe: 5, sintomas: [] },
    { fecha: "2026-11-02", tipo: "fuerza_eq", min: 35, rpe: 4, sintomas: [] }, { fecha: "2026-11-02", tipo: "aerobico", min: 20, rpe: 6, sintomas: ["mareo"] }, { fecha: "2026-11-04", tipo: "aerobico", min: 45, rpe: 5, sintomas: [] }, { fecha: "2026-11-10", tipo: "equilibrio", min: 15, sintomas: [] },
  ];
  const r = Mm.resumenMes(d, 2026, 10);
  check("resumen del mes: sesiones, minutos, días activos, de fuerza y de equilibrio, esfuerzo y síntomas", r.sesiones === 4 && r.minutos === 115 && r.dias === 3 && r.diasFuerza === 1 && r.diasEquilibrio === 2 && r.rpe === 5 && r.conSintomas === 1 && r.masLarga === 45 && r.mejorSemana.desde === "2026-11-02" && r.mejorSemana.min === 100);
  check("el mes en curso se compara con los mismos días del anterior (si no, siempre saldría «menos»)", Mm.resumenMes(d, 2026, 9, 21).sesiones === 2 && Mm.datosMes({ diario: d, ahora: new Date(2026, 10, 21, 12) }, 2026, 10).d.sesiones === 2 && Mm.datosMes({ diario: d, ahora: new Date(2026, 11, 5, 12) }, 2026, 10).d.sesiones === 1);
  check("meses para navegar: desde la primera sesión hasta el actual", JSON.stringify(Mm.meses(d, new Date(2026, 11, 3))) === "[[2026,9],[2026,10],[2026,11]]" && JSON.stringify(Mm.meses([], new Date(2026, 10, 3))) === "[[2026,10]]");
  const metas = M.marcar(M.alternar(null, "escaleras"), "escaleras", 1, true, new Date(2026, 10, 8).getTime());
  check("hitos de las metas conseguidos en el mes", Mm.hitosDelMes(metas, M.POR_ID, 2026, 10).length === 2 && Mm.hitosDelMes(metas, M.POR_ID, 2026, 9).length === 0);
  const c = { diario: d, ahora: new Date(2026, 10, 21, 12), objMin: 150, eqN: 3, metas, POR_ID: M.POR_ID, pruebas: S, sft: { hist: [{ f: new Date(2026, 10, 9).getTime(), edad: 72, sexo: "m", r: { silla: 13, brazo: 15 } }] }, racha: 6, cuidados: ["el pulso", "el azúcar"], farmacos: ["Bisoprolol", "Metformina"] };
  const fam = Mm.datosMes(c, 2026, 10), med = Mm.datosMes(c, 2026, 10, { para: "medico", sinNombres: true }), medN = Mm.datosMes(c, 2026, 10, { para: "medico", sinNombres: false });
  check("para la familia: actividad, mejor semana, hitos, pruebas y racha; sin datos de salud", fam.medico.length === 0 && fam.destacados.some((x) => /Escaleras/.test(x)) && fam.destacados.some((x) => /2\/2/.test(x)) && fam.destacados.some((x) => /6 semanas/.test(x)) && !/Bisoprolol|síntoma/.test(Mm.textoMes(fam)));
  check("para el médico: esfuerzo, síntomas y cuidados; los fármacos solo si se quiere (y entonces el pie ya no dice «sin datos personales»)", med.medico.length === 3 && !/Bisoprolol/.test(Mm.textoMes(med)) && /Bisoprolol, Metformina/.test(Mm.textoMes(medN)) && /sin nombre ni datos/.test(med.pie) && !/datos personales/.test(medN.pie));
  check("objetivos del mes proporcionales a sus semanas (moverse, fuerza y equilibrio)", fam.barras[0].o === 640 && fam.barras[1].o === 9 && fam.barras[2].o === 13);
  const ks2 = Object.keys(Mm.TXT.es), vars2 = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("singular y plural («1 sesión») en los cinco idiomas", ["es", "en", "ca", "gl", "eu"].every((l) => Mm.TXT[l].sesion1 && Mm.TXT[l].racha1 && vars2(Mm.TXT[l].racha1) === "") && ks2.includes("sesion1"));
  check("textos de la interfaz en los cinco idiomas, con las mismas variables", ["en", "ca", "gl", "eu"].every((l) => Object.keys(Mm.TXT[l]).length === ks2.length && ks2.every((k) => Mm.TXT[l][k] && vars2(Mm.TXT[l][k]) === vars2(Mm.TXT.es[k]))));
}

console.log("\nMis constantes: gráficas con las franjas de su situación (mejora grande 13)");
{
  const K = await import(pathToFileURL(path.join(ROOT, "app/js/constantes.js")).href);
  const kbTxt = fs.readFileSync(path.join(ROOT, "app/data/kb.json"), "utf8");
  const d = [
    { fecha: "2026-11-10", const: { glucosa_antes: 64, glucosa_despues: 90, ta: 182, fc: 100 } }, { fecha: "2026-11-03", const: { glucosa_antes: 140, ta: 150 } },
    { fecha: "2026-11-12", const: { glucosa_antes: 262, fc: 170 } }, { fecha: "2026-11-14", tipo: "aerobico" }, { fecha: "2026-11-15", const: { ta: 165, fc: null } },
  ];
  const S = K.series(d);
  check("constantes del diario en orden de fecha (glucosa antes y después, tensión y pulso); sin constantes no hay datos", S.glucosa.map((x) => x.fecha).join() === "2026-11-03,2026-11-10,2026-11-12" && S.ta.length === 3 && S.fc.length === 2 && K.hayDatos(d) && !K.hayDatos([{ fecha: "2026-11-01" }]));
  check("franjas con las cifras de las reglas de la base (glucosa 70/90/250 de la ADA; tensión 160 y 180 de ESC y ACSM)", JSON.stringify(K.franjas("glucosa").map((f) => f[1])) === "[70,90,250,600]" && JSON.stringify(K.franjas("ta").map((f) => f[0])) === "[0,90,160,180]" && /Por debajo de 90 mg\/dL/.test(kbTxt) && /Entre 126 y 250/.test(kbTxt) && /180\/110/.test(kbTxt) && /160\/100/.test(kbTxt));
  check("pulso: máximo de Tanaka (208 − 0,7 × edad) y zonas del ACSM; sin franjas sin edad o con fármacos que invalidan el pulso", K.fcMax(72) === 158 && JSON.stringify(K.franjas("fc", { edad: 72 })) === JSON.stringify([[101, 122, "info", "f_moderada"], [122, 152, "precaucion", "f_vigorosa"]]) && K.franjas("fc", { edad: 72, fcNoValida: true }).length === 0 && K.franjas("fc").length === 0);
  const A = K.avisos(S, { edad: 72 });
  check("valores para comentar (sin diagnosticar): bajadas y subidas de azúcar, tensiones altas y pulso por encima del máximo", A.map((a) => `${a.clave}:${a.n}`).join() === "a_g_baja:1,a_g_alta:1,a_t_alta:1,a_t_media:1,a_f_alta:1");
  const g = K.grafica("glucosa", S, { edad: 72 });
  check("gráfica: un punto por medición (antes y después), franjas, rejilla fina y lectura accesible", (g.svg.match(/class="ct-p /g) || []).length === 4 && g.pts.length === 4 && (g.svg.match(/class="ct-b /g) || []).length >= 3 && /role="img" aria-label="Glucosa · 4 mediciones/.test(g.svg));
  const txt = K.textoMedico(S, { edad: 72 });
  check("texto para el médico con rangos, último valor y avisos, sin plurales rotos", /Glucosa: 4 mediciones/.test(txt) && /Tensión de 180 mmHg o más: 1/.test(txt) && !/\{n\}/.test(txt) && K.tx("n_med1") === "1 medición");
  const ks = Object.keys(K.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas con las mismas variables; fuentes con DOI las de estudios", ["en", "ca", "gl", "eu"].every((l) => Object.keys(K.TXT[l]).length === ks.length && ks.every((x) => K.TXT[l][x] && vars(K.TXT[l][x]) === vars(K.TXT.es[x]))) && K.FUENTES.filter((f) => /J Am Coll|Med Sci/.test(f.txt)).every((f) => f.doi));
}

console.log("\n«Hoy hace calor»: calor y medicación (mejora grande 10)");
{
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/calor.js")).href);
  const PQ = await import(pathToFileURL(path.join(ROOT, "app/js/porque.js")).href);
  const k = [0, 1, 2, 3].map((n) => C.consejo(n));
  check("cuatro niveles que van a más: de cualquier hora a «mejor sin ejercicio intenso fuera»", k.every((x, i) => x.nivel === i && x.cuando) && /cualquier|venga bien/.test(k[0].cuando) && /primera hora/.test(k[2].cuando) && /sin ejercicio intenso fuera/.test(k[3].cuando) && C.consejo(9).nivel === 3);
  const lim = C.consejo(2, { edad: 78, limiteLiquidos: true, mecanismos: ["agua", "sol"] }), sin = C.consejo(2, { edad: 50 });
  check("agua: no perder más del 2 % del peso (ACSM); con 65 años o más, beber con horario; con líquidos limitados, la indicación del médico manda", lim.agua.some((x) => /2 %/.test(x)) && lim.agua.some((x) => /sed/.test(x) && /horario/.test(x)) && lim.agua.some((x) => /limitado los líquidos/.test(x)) && !sin.agua.some((x) => /limitado|horario/.test(x)));
  check("protección solar solo si algún fármaco da sensibilidad al sol; señales para parar y llamar al 112", lim.sol && !sin.sol && k[0].parar.some((x) => /112/.test(x)));
  const f = C.farmacosConCalor([{ nombre: "Furosemida", ids: ["agua", "tension"] }, { nombre: "Metoprolol", ids: ["pulso"] }, { nombre: "Doxiciclina", ids: ["sol"] }]);
  check("fármacos que importan con calor: solo los de calor, agua o sol, y con explicador", f.map((x) => x.nombre).join() === "Furosemida,Doxiciclina" && C.MECANISMOS.every((m) => PQ.PQ_IDS.includes(m)));
  const ks = Object.keys(C.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas; fuentes de la OMS y del ACSM (con DOI)", ["en", "ca", "gl", "eu"].every((l) => Object.keys(C.TXT[l]).length === ks.length && ks.every((x) => C.TXT[l][x] && vars(C.TXT[l][x]) === vars(C.TXT.es[x]))) && C.FUENTES.filter((x) => /ACSM/.test(x.txt)).every((x) => x.doi) && C.FUENTES.some((x) => /OMS/.test(x.txt)));
}

console.log("\nMi pastillero: tomas por momentos y hoja de la semana (mejora grande 14)");
{
  const PT = await import(pathToFileURL(path.join(ROOT, "app/js/pastillero.js")).href);
  const meds = [
    { nombre: "Insulina rápida", pid: "insulina_rapida", dosis: 6, unidad: "UI", momentos: ["desayuno", "comida", "cena"] },
    { nombre: "Metotrexato", pid: "metotrexato", dosis: 15, unidad: "mg/semana", momentos: ["desayuno"] },
    { nombre: "Paracetamol", pid: "paracetamol", dosis: 1000, unidad: "mg", momentos: ["desayuno"], aDemanda: true },
    { nombre: "Salbutamol", pid: "salbutamol", dosis: 2, unidad: "inhalaciones/día", momentos: [] },
  ];
  const C = PT.compartimentos(meds);
  check("cada fármaco en su momento (sin momentos, al desayuno); «cuando lo necesite» aparte", C.por.desayuno.map((m) => m.nombre).join() === "Insulina rápida,Salbutamol" && C.por.comida.length === 1 && C.por.cena.length === 1 && C.por.noche.length === 0 && C.demanda.map((m) => m.nombre).join() === "Paracetamol" && C.tomas === 4);
  const semanales = ["mg/semana", "mg/mes", "mg/3 meses", "mg/año", "UI/semana", "mg/2 semanas"];
  check("lo semanal o mensual nunca entra en las casillas diarias (metotrexato semanal)", C.periodicos.map((m) => m.nombre).join() === "Metotrexato" && !Object.values(C.por).flat().some((m) => m.nombre === "Metotrexato") && semanales.every((u) => PT.periodo(u)) && ["mg", "UI", "g/día", "mcg/h", "mg/24 h", "inhalaciones/día"].every((u) => !PT.periodo(u)));
  check("dosis de una toma legible: sin «/día» y con su periodo si no es diaria", PT.dosisTxt(meds[0]) === "6 UI" && PT.dosisTxt(meds[1]) === "15 mg/semana" && PT.dosisTxt(meds[3]) === "2 inhalaciones" && PT.dosisTxt({ dosis: 1000, unidad: "mg" }) === "1000 mg" && PT.dosisTxt({ dosis: 2.5 }) === "2,5 mg" && PT.dosisTxt({ dosis: null }) === "");
  const v = ventanaEntrenamiento(indice, meds.filter((m) => !m.aDemanda).map((m) => ({ pid: m.pid, tomas: m.momentos.length || 1, momentos: m.momentos })));
  const tr = PT.trasToma(v, "desayuno");
  check("tras cada toma, lo que dice la ventana de «¿Cuándo?» (insulina rápida: hipoglucemia), sin repetir y por orden", tr.length >= 1 && tr.some((x) => x.farmaco && /insulina/i.test(x.farmaco)) && new Set(tr.map((x) => x.farmaco + x.motivo)).size === tr.length && tr.every((x, i) => i === 0 || tr[i - 1].desde <= x.desde) && PT.trasToma(v, "noche").length === 0);
  const linea = PT.lineaDia(v, { desayuno: 8, comida: 14, cena: 21, noche: 23 }, C.por, "16:00–19:00");
  check("línea del día: 18 horas, una marca por momento con tomas (con el n.º de fármacos) y lectura accesible", (linea.match(/class="pt-h /g) || []).length === 18 && (linea.match(/class="pt-toma"/g) || []).length === 3 && />2<\/b>/.test(linea) && /aria-label="Su día: 08:00, 14:00, 21:00\. Mejor entre 16:00–19:00"/.test(linea));
  const h = PT.hoja({ meds, horas: { desayuno: 8, comida: 14, cena: 21, noche: 23 }, plan: planSemana([1, 3, 5]), tipos: { fuerza_eq: "Fuerza y equilibrio", aerobico: "Aeróbico", fuerza: "Fuerza", descanso: "Descanso" }, momentos: { desayuno: "Desayuno", comida: "Comida", cena: "Cena", noche: "Al acostarse" }, franja: "16:00–19:00", version: "9.9.9" });
  check("hoja de la semana: 7 días, una casilla por toma y día, sesión del plan y lo no diario al pie con su día", (h.match(/<th scope="col">/g) || []).length === 8 && (h.match(/<div><i><\/i>/g) || []).length === 4 * 7 + 3 && /Metotrexato 15 mg\/semana · Día: ________/.test(h) && !/<td>[^]*Metotrexato[^]*<\/td>/.test(h.split("</table>")[0]) && /Paracetamol 1000 mg/.test(h) && /Fuerza y equilibrio · 16:00–19:00/.test(h) && /Pauta Activa v9\.9\.9/.test(h));
  check("sin restricciones de horario, la hoja lo dice en lugar de inventar una franja", /Sin restricciones de horario/.test(PT.hoja({ meds: meds.slice(0, 1), horas: { desayuno: 8, comida: 14, cena: 21, noche: 23 }, plan: [], tipos: {}, momentos: {} })));
  const ks = Object.keys(PT.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas con las mismas variables; singular «1 toma al día»", ["en", "ca", "gl", "eu"].every((l) => Object.keys(PT.TXT[l]).length === ks.length && ks.every((x) => PT.TXT[l][x] && vars(PT.TXT[l][x]) === vars(PT.TXT.es[x]))) && PT.tx("toma1") === "1 toma al día" && vars(PT.TXT.es.toma1) === "");
}

console.log("\nMapa de interacciones: tabla de cruces y red (mejora grande 17)");
{
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/mapa.js")).href);
  const P = (a, b, nivel, i) => ({ i, a: { id: a, nombre: a }, b: { id: b, nombre: b }, nivel, efecto: "e", accion: "", fuente: "f" });
  const G = M.grafo([P("ibu", "enal", "mayor", 0), P("ibu", "apix", "mayor", 1), P("biso", "glic", "moderada", 2), P("ibu", "biso", "moderada", 3), P("glic", "omep", "menor", 4), P("x", "x", "moderada", 5), P("lor", "lor2", "menor", 6)]);
  const nd = (id) => G.nodos.find((n) => n.id === id);
  check("un nodo por medicamento; la duplicidad marca el nodo y no es arco; peso y gravedad máxima de cada uno", G.aristas.length === 6 && nd("x").dups.length === 1 && nd("x").n === 0 && nd("ibu").peso === 8 && nd("ibu").max === "mayor" && nd("glic").max === "moderada" && nd("omep").cuenta.menor === 1);
  const O = M.orden(G.nodos, G.aristas).map((n) => n.id);
  check("orden de filas: el más implicado primero, sus vecinos fuertes al lado y cada grupo seguido", O.join() === "ibu,apix,enal,biso,glic,omep,lor,lor2,x");
  check("arco entre filas: sale y llega al centro de cada fila y se abre con la distancia, sin pasarse del ancho", M.arco(0, 2, 100, 200) === "M100 24C41.7 24 41.7 120 100 120" && M.arco(0, 8, 100, 40).includes("C60.0 24 60.0 408"));
  check("vista por defecto: tabla de cruces con muchas interacciones o medicamentos; red con pocas", M.vistaPorDefecto(15, 9) === "tabla" && M.vistaPorDefecto(3, 4) === "red" && M.vistaPorDefecto(7, 5) === "tabla");
  const ks = Object.keys(M.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas con las mismas variables; singulares propios", ["en", "ca", "gl", "eu"].every((l) => Object.keys(M.TXT[l]).length === ks.length && ks.every((x) => M.TXT[l][x] && vars(M.TXT[l][x]) === vars(M.TXT.es[x]))) && M.tx("n_int1") === "1 interacción" && vars(M.TXT.es.resumen1) === "{t}");
}

console.log("\n«¿Qué cambia si…?»: simulador de retirada (mejora grande 16)");
{
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/simula.js")).href);
  const { prescripcion } = await import(pathToFileURL(path.join(ROOT, "app/js/informes.js")).href);
  const ctx = { edad: 72, caidas: true, condiciones: new Set() };
  const lista = ["bisoprolol", "enalapril", "furosemida", "apixaban", "atorvastatina", "metformina", "gliclazida", "lorazepam", "omeprazol", "ibuprofeno"].map((pid) => ({ pid, dosis: 1, tomas: pid === "metformina" ? 2 : 1, momentos: pid === "metformina" ? ["desayuno", "cena"] : ["desayuno"] }));
  const motor = { evaluar: (ms) => evaluar(datos, ms, ctx), prescripcion: (res) => prescripcion(res, ctx), ventana: (ms) => ventanaEntrenamiento(indice, ms), unidad: (pid) => indice.porId.get(pid)?.principio.unidad, cuidados: (sen) => [...new Set(sen)].map((id) => ({ id, txt: id })) };
  const sin = (...q) => S.escenario(motor, lista.filter((m) => !q.includes(m.pid)));
  const A = sin(), D = S.comparar(A, sin("ibuprofeno"));
  check("sin ibuprofeno: desaparecen sus dos interacciones mayores y sus avisos, y hay una toma menos", D.mayores[0] === 2 && D.mayores[1] === 0 && D.interFuera.filter((x) => x.nivel === "mayor").length === 2 && D.interFuera.every((x) => /Ibuprofeno/.test(x.txt)) && D.reglasFuera.some((x) => x.farmaco === "Ibuprofeno") && D.tomas[0] - D.tomas[1] === 1 && !D.igual);
  const D2 = S.comparar(A, sin("bisoprolol"));
  check("sin el betabloqueante, el pulso vuelve a servir para medir la intensidad y el plan lo refleja", !D2.pulso[0] && D2.pulso[1] && D2.plan.some((p) => p.k === "aer.int" && /RPE/.test(p.antes) && /FC de reserva/.test(p.despues)));
  check("la misma lista no cambia nada; lo que se pierde va ordenado de más a menos grave", S.comparar(A, sin()).igual && D.interFuera.every((x, i, xs) => i === 0 || ({ mayor: 0, moderada: 1, menor: 2 })[xs[i - 1].nivel] <= ({ mayor: 0, moderada: 1, menor: 2 })[x.nivel]));
  check("avisos de retirada: los betabloqueantes no se dejan de golpe y los anticoagulantes no se dejan sin indicación; todos los grupos existen en la base", S.retirada("betabloqueantes") === "gradual" && S.retirada("benzodiacepinas") === "gradual" && S.retirada("anticoagulantes") === "imprescindible" && S.retirada("estatinas") === null && [...S.RETIRADA.gradual, ...S.RETIRADA.imprescindible].every((id) => kb.clases.some((c) => c.id === id)));
  const txt = S.textoResumen(D, ["Ibuprofeno"], "9.9.9");
  check("resumen para copiar: lo que se quita, las cifras de antes y después y que es orientativo", /Sin: Ibuprofeno/.test(txt) && /Interacciones: \d+ → \d+/.test(txt) && /no sustituye la valoración médica/.test(txt) && /v9\.9\.9/.test(txt) && !/\{\w+\}/.test(txt));
  const ks = Object.keys(S.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas con las mismas variables", ["en", "ca", "gl", "eu"].every((l) => Object.keys(S.TXT[l]).length === ks.length && ks.every((x) => S.TXT[l][x] && vars(S.TXT[l][x]) === vars(S.TXT.es[x]))));
}

console.log("\n«Lo que el ejercicio hace por usted»: beneficios con su fuente (mejora grande 3)");
{
  const B = await import(pathToFileURL(path.join(ROOT, "app/js/beneficios.js")).href);
  const appSrc = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const CONDS = JSON.parse(appSrc.match(/const CONDICIONES = (\[[^\]]+\])/)[1]);
  const sits = Object.keys(B.BENEFICIOS).filter((k) => k !== "todos" && k !== "mayores");
  check("cada grupo de tarjetas es una situación de «Situación clínica» (o «todos» y «mayores»)", sits.every((k) => CONDS.includes(k)) && sits.length >= 15);
  const todas = Object.values(B.BENEFICIOS).flat();
  check("ninguna cifra sin fuente: cada tarjeta lleva cifra, explicación, tipo de estudio y al menos un DOI", todas.every((b) => b.cifra && b.unidad && b.titulo && b.texto.length > 40 && b.estudio && b.fuentes.length && b.fuentes.every((f) => /^10\.\d{4,9}\/\S+$/.test(f.doi) && /\d{4}/.test(f.txt))) && new Set(todas.map((b) => b.id)).size === todas.length);
  check("las cifras clave coinciden con los artículos (HbA1c −0,67; caídas −23 %; dolor de rodilla −12 de 100; 6 minutos +44 m en EPOC)", /0,67/.test(B.BENEFICIOS.diabetes[0].texto) && B.BENEFICIOS.mayores[0].cifra === "−23 %" && /12 puntos/.test(B.BENEFICIOS.artrosis[0].texto) && B.BENEFICIOS.epoc_asma[0].cifra === "+44 m");
  const s1 = B.situaciones({ condiciones: ["obesidad", "oxigeno", "epoc_asma", "aneurisma_aorta", "diabetes"], edad: 50 });
  check("situaciones: el oxígeno enseña la de EPOC sin repetirla, se ordenan, lo que no tiene tarjeta no sale y «todos» va al final", s1.join() === "diabetes,epoc_asma,obesidad,todos");
  check("desde los 65 años o tras una caída, las caídas", B.situaciones({ edad: 72 }).join() === "mayores,todos" && B.situaciones({ edad: 40, caidas: true }).includes("mayores") && !B.situaciones({ edad: 64 }).includes("mayores"));
  const ks = Object.keys(B.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("interfaz en los cinco idiomas con las mismas variables; tarjetas sin huecos sin rellenar", ["en", "ca", "gl", "eu"].every((l) => Object.keys(B.TXT[l]).length === ks.length && ks.every((x) => B.TXT[l][x] && vars(B.TXT[l][x]) === vars(B.TXT.es[x]))) && !todas.some((b) => /\{\w+\}/.test(b.texto + b.cifra + b.unidad)));
}

console.log("\n«¿Cuánto movimiento hace falta?»: dosis y respuesta (mejora grande 4)");
{
  const D = await import(pathToFileURL(path.join(ROOT, "app/js/dosis.js")).href);
  check("minutos: las cifras del resumen de Arem 2015 (−20, −31, −37, −39 y −31 %) y sin cifra entre 750 y 1499", D.MINUTOS.slice(1).map((g) => D.menos(g.hr)).join() === "20,31,37,39,31" && D.grupoMinutos(0).k === "g0" && D.grupoMinutos(90).k === "g1" && D.grupoMinutos(150).k === "g2" && D.grupoMinutos(449).k === "g3" && D.grupoMinutos(600).k === "g4" && D.grupoMinutos(1000) === null && D.grupoMinutos(2000).k === "g6" && /jamainternmed\.2015\.0533/.test(D.FUENTES.minutos.doi));
  check("pasos: medianas y riesgo de los cuartos de Paluch 2022 (3553, 5801, 7842, 10 901; −40, −45, −53 %) y meseta por edad", D.PASOS.map((p) => p.x).join() === "3553,5801,7842,10901" && D.PASOS.slice(1).map((p) => D.menos(p.hr)).join() === "40,45,53" && D.grupoPasos(7600).x === 7842 && D.grupoPasos(1000).x === 3553 && D.MESETA.mayores.join() === "6000,8000" && D.MESETA.jovenes.join() === "8000,10000" && /S2468-2667\(21\)00302-9/.test(D.FUENTES.pasos.doi));
  const hoy = new Date(2026, 10, 21), dia = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const diario = [...Array(12)].map((_, i) => ({ fecha: dia(i * 2), min: 30 })).concat([{ fecha: dia(40), min: 500 }]);
  check("su punto: la media de minutos a la semana de las últimas 4 semanas del diario (lo anterior no cuenta)", D.minutosSemana(diario, hoy) === 90 && D.minutosSemana([], hoy) === 0);
  const f90 = D.fraseMinutos(90), f0 = D.fraseMinutos(0), fg = D.fraseMinutos(1000);
  check("frases: su grupo frente a no hacer nada, el siguiente escalón y lo que no tiene cifra", /20 %/.test(f90.frase) && /31 %/.test(f90.sig) && /20 %/.test(f0.sig) && /750 y 1500/.test(fg.frase) && /45 %/.test(D.frasePasos(7600)) && !/\{\w+\}/.test(f90.frase + f90.sig + D.frasePasos(5000)));
  const g = D.grafica({ w: 360, h: 230, pts: [{ x: 0, y: 0, etq: "a" }, { x: 1, y: 20, etq: "b" }, { x: 2, y: 31, etq: "c" }], xMin: -0.4, xMax: 2.4, yMax: 50, ticksX: [0, 1, 2], fmtX: String, usted: 1.2, hueco: [1] });
  check("gráfica: una serie con puntos, un tramo discontinuo donde no hay datos, su línea y lectura accesible", (g.svg.match(/class="ds-p"/g) || []).length === 3 && (g.svg.match(/ds-hueco/g) || []).length === 1 && /ds-usted/.test(g.svg) && /role="img"/.test(g.svg) && D.posMinutos(0) === 0 && Math.abs(D.posMinutos(75) - 1) < 0.01 && D.posMinutos(1800) <= 6.4);
  const ks = Object.keys(D.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("textos en los cinco idiomas con las mismas variables; aviso de que son estudios de observación", ["en", "ca", "gl", "eu"].every((l) => Object.keys(D.TXT[l]).length === ks.length && ks.every((x) => D.TXT[l][x] && vars(D.TXT[l][x]) === vars(D.TXT.es[x]))) && /asociación/.test(D.TXT.es.observ));
}

console.log("\n«Alcohol, tabaco y café con su medicación» (mejora grande 5)");
{
  const H = await import(pathToFileURL(path.join(ROOT, "app/js/habitos.js")).href);
  const appSrc = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), esSrc = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const CONDS = JSON.parse(appSrc.match(/const CONDICIONES = (\[[^\]]+\])/)[1]);
  const principios = kb.clases.flatMap((c) => c.principios.map((p) => ({ ...p, senales: [...(c.senales || []), ...(p.senales_extra || [])] })));
  const pidsKb = new Set(principios.map((p) => p.id));
  const pidsReglas = H.REGLAS.flatMap((r) => [...(r.si.pids || []), ...(r.si.excluir || []), ...(r.si.sinPids || []), ...(r.extras || []).flatMap((e) => e.pids)]);
  check("reglas: cada fármaco, señal y situación existe en la base; respuestas válidas («no» y «poco» no avisan); ids únicos", pidsReglas.every((p) => pidsKb.has(p)) && H.REGLAS.every((r) => (!r.si.senal || kb.senales[r.si.senal]) && [r.si.condicion, r.si.sinCondicion].every((c) => !c || CONDS.includes(c)) && r.v.length && r.v.every((v) => H.VALORES[r.h].includes(v) && v !== "no" && v !== "poco")) && new Set(H.REGLAS.map((r) => r.id)).size === H.REGLAS.length && H.REGLAS.length >= 25);
  check("ninguna regla sin fuente: ficha técnica con su apartado, artículo con DOI o enlace", H.REGLAS.every((r) => r.fuentes?.length && r.fuentes.every((f) => (f.doi ? /^10\.\d{4,9}\/\S+$/.test(f.doi) : f.url ? /^https:\/\//.test(f.url) : /[Ff]ichas? técnicas?.*\d\.\d/.test(f.txt)))) && H.REGLAS.filter((r) => r.ft).every((r) => r.fuentes.some((f) => /[Ff]icha/.test(f.txt))));
  const corre = (meds, hab, c = {}) => { const ctx = { edad: c.edad ?? null, condiciones: new Set(c.condiciones || []) }; return H.evaluar(evaluar(datos, meds.map((m) => (typeof m === "string" ? { pid: m, dosis: 1, tomas: 1 } : m)), ctx).items, hab, ctx); };
  const ids = (a) => a.map((x) => x.id + ":" + x.nivel).join();
  check("alcohol con medicamentos que dan sueño: precaución si a veces, atención si a diario; nada si no bebe o no responde", ids(corre(["lorazepam"], { alcohol: "aveces" })) === "alc_sedacion:precaucion" && ids(corre(["lorazepam"], { alcohol: "diario" })) === "alc_sedacion:alerta" && corre(["lorazepam"], { alcohol: "no" }).length === 0 && corre(["lorazepam"], {}).length === 0);
  const sin = corre(["acenocumarol", "ibuprofeno", "gliclazida"], { alcohol: "diario" });
  check("alcohol a diario: Sintrom y bajadas de azúcar en atención; el sangrado general no repite el Sintrom", sin.find((x) => x.id === "alc_acenocumarol")?.nivel === "alerta" && sin.find((x) => x.id === "alc_hipoglucemia")?.nivel === "alerta" && sin.find((x) => x.id === "alc_sangrado")?.implicados.map((it) => it.principio.id).join() === "ibuprofeno" && ORDEN[sin[0].nivel] >= ORDEN[sin[sin.length - 1].nivel]);
  const cloz = corre(["clozapina"], { tabaco: "dejado", cafe: "mucho" });
  check("clozapina: dejar de fumar en atención (los parches no lo evitan) y el café en precaución; primero el tabaco", cloz[0].id === "tab_cyp_fuerte" && cloz[0].nivel === "alerta" && /parches o chicles/.test(cloz[0].texto) && cloz.some((x) => x.id === "caf_clozapina" && x.nivel === "precaucion") && corre(["clozapina"], { tabaco: "si" })[0].nivel === "precaucion");
  check("anticonceptivo combinado y tabaco: atención desde los 35; antes, o sin edad, precaución; nada si lo ha dejado", corre(["anticonceptivo_combinado"], { tabaco: "si" }, { edad: 38 })[0].id === "tab_ahc35" && corre(["anticonceptivo_combinado"], { tabaco: "si" }, { edad: 25 })[0].id === "tab_ahc" && corre(["anticonceptivo_combinado"], { tabaco: "si" })[0].id === "tab_ahc" && !corre(["anticonceptivo_combinado"], { tabaco: "dejado" }).some((x) => /ahc/.test(x.id)));
  const emb = corre(["levotiroxina"], { cafe: "mucho" }, { condiciones: ["embarazo"] });
  check("café: en el embarazo, el límite de 200 mg (y no el de 400); levotiroxina con agua y media hora antes", emb.some((x) => x.id === "caf_embarazo" && x.nivel === "precaucion" && /200 mg/.test(x.texto)) && !emb.some((x) => x.id === "caf_mucho") && emb.some((x) => x.id === "caf_levotiroxina") && corre([], { cafe: "mucho" }).map((x) => x.id).join() === "caf_mucho");
  const sup = corre([{ pid: "cafeina", dosis: 200, tomas: 1 }], { cafe: "mucho" });
  check("cafeína en suplementos: 200 mg y 4 tazas suman al menos 560 mg, por encima de 400 (sin repetir el aviso general)", sup.map((x) => x.id).join() === "caf_suplemento" && /al menos 560 mg/.test(sup[0].texto) && /por encima de 400/.test(sup[0].texto));
  const hig = corre(["curcuma", "te_verde_extracto"], { alcohol: "diario" }).find((x) => x.id === "alc_higado");
  check("textos: nombres en minúscula dentro de la frase y en mayúscula al empezar, y singular o plural según cuántos", /al de <b>lorazepam<\/b> y <b>tramadol<\/b>/.test(corre(["lorazepam", "tramadol"], { alcohol: "aveces" })[0].texto) && /^<b>Cúrcuma \/ curcumina<\/b> y <b>extracto de té verde<\/b> se han relacionado/.test(hig.texto) && /los necesita/.test(hig.texto) && /<\/b> se ha relacionado.*lo necesita/.test(corre(["curcuma"], { alcohol: "diario" })[0].texto));
  const conSenal = (s, excl = []) => principios.find((p) => p.senales.includes(s) && !excl.includes(p.id))?.id;
  const salta = H.REGLAS.every((r) => r.v.every((v) => {
    const pid = r.si.pids?.[0] || (r.si.senal && conSenal(r.si.senal, r.si.excluir));
    const a = corre(pid ? [{ pid, dosis: 100, tomas: 1 }] : [], { [r.h]: v }, { condiciones: r.si.condicion ? [r.si.condicion] : [], edad: r.si.edadMin ?? (r.si.edadMax != null ? r.si.edadMax - 5 : null) }).find((x) => x.id === r.id);
    return a && a.titulo && ORDEN[a.nivel] && !/\{[^}]*\}/.test(a.texto + a.titulo);
  }));
  check("cada regla salta con su respuesta y su fármaco, y se lee sin huecos", salta);
  const HAB = Function(`return ${appSrc.match(/const HAB = (\{[^;]+\});/)[1]}`)();
  check("la app guarda las respuestas (estado, copia, pacientes y perfiles) con los mismos valores que el módulo", JSON.stringify(HAB) === JSON.stringify(H.VALORES) && (appSrc.match(/habitos: estado\.habitos/g) || []).length === 2 && (appSrc.match(/habitos: sanearHabitos\(/g) || []).length === 4 && Object.values(H.CLAVE).flatMap(Object.values).every((k) => esSrc.includes(`"${k}":`)));
  const ks = Object.keys(H.TXT.es), vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  check("interfaz en los cinco idiomas con las mismas variables", ["en", "ca", "gl", "eu"].every((l) => Object.keys(H.TXT[l]).length === ks.length && ks.every((x) => H.TXT[l][x] && vars(H.TXT[l][x]) === vars(H.TXT.es[x]))));
}

console.log("\n«Guía de conversación» para la consulta (mejora grande 15)");
{
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/conversa.js")).href);
  const B = await import(pathToFileURL(path.join(ROOT, "app/js/beneficios.js")).href);
  const { prescripcion, listasVistazo, filasPlanPaciente } = await import(pathToFileURL(path.join(ROOT, "app/js/informes.js")).href);
  const ctx = { edad: 74, caidas: true, condiciones: new Set(["diabetes", "artrosis"]) };
  const res = evaluar(datos, ["bisoprolol", "gliclazida", "acenocumarol", "lorazepam"].map((pid) => ({ pid, dosis: 1, tomas: 1 })), ctx);
  const d = { condiciones: ctx.condiciones, edad: 74, caidas: true, senales: Object.keys(res.perfil), esencial: loEsencial(res, 3), vistazo: listasVistazo(res, ctx), plan: filasPlanPaciente(res, ctx), P: prescripcion(res, ctx), crib: { clave: "valoracion_antes", texto: "Conviene una valoración médica antes de empezar." }, ben: B.tarjetas(B.situaciones({ condiciones: ["diabetes", "artrosis"], edad: 74, caidas: true })), metas: ["Subir escaleras sin pararme"], alarma: ALARMA, nMeds: 4, version: "9.9.9" };
  const bs = C.barreras(d);
  check("barreras: las frecuentes en su caso primero (dolor por artrosis, caídas, medicación) y la respuesta con los cuidados de su lista", bs[0].frecuente && ["dolor", "caidas", "medicacion"].every((id) => bs.find((b) => b.id === id).frecuente) && !bs.find((b) => b.id === "dinero").frecuente && bs.find((b) => b.id === "medicacion").resp.includes(d.vistazo.cuidado[0]) && bs.every((b) => !/\{\w+\}/.test(b.resp)) && C.BARRERAS.length === 10);
  check("objetivo de partida según la situación: frágil, NYHA III-IV, ya activo o el paseo de 10 minutos", /silla 5 veces/.test(C.objetivoSugerido({ condiciones: ["fragil"] })) && /5-10 minutos, dos veces/.test(C.objetivoSugerido({ condiciones: ["nyha34"] })) && /fuerza/.test(C.objetivoSugerido({}, "si")) && /Caminar 10 minutos/.test(C.objetivoSugerido({}, "no")));
  const e1 = C.escalas(2, 8), e2 = C.escalas(8, 3), e3 = C.escalas(8, 8);
  check("escalas de importancia y confianza: pregunta de seguimiento y pista (importancia baja, confianza baja, a acordar)", e2.pImp === "¿Por qué un 8 y no un 6?" && e2.pConf === "¿Qué le haría pasar de un 3 a un 5?" && /Importancia baja/.test(e1.pista) && /Confianza baja/.test(e2.pista) && /acordar/.test(e3.pista) && C.escalas(0, 10).pImp === "¿Por qué un 0 y no un 0?");
  const P1 = C.pasos(d, "uno"), P5 = C.pasos(d, "cinco", { imp: 5, conf: 5, barreras: ["caidas"] }), PM = C.pasos(d, "mas");
  check("pasos: 1 minuto (averiguar, aconsejar con su beneficio y su medicación, asegurar), 5 minutos con las cinco Aes en orden y la consulta programada", P1.map((p) => p.a).join() === "averiguar,aconsejar,asegurar" && /HbA1c|azúcar/.test(P1[1].html) && P1[1].html.includes(d.vistazo.cuidado[0].replace(/[<>&"]/g, "")) && P5.map((p) => p.a).join() === C.AES.join() && PM.length === 5 && PM.every((p) => C.AES.includes(p.a)));
  check("su caso en los pasos: metas, escalas, la barrera marcada con su respuesta, derivación por artrosis y la prescripción completa", P5[0].html.includes("Subir escaleras") && /name="cv-imp"/.test(P5[0].html) && /value="caidas" checked/.test(P5[3].html) && /<li><b>Me da miedo caerme/.test(P5[3].html) && PM[4].html.includes(C.DERIVAR.artrosis) && (PM[2].html.match(/<tr>/g) || []).length === 4 && !/\{\w+\}/.test([...P1, ...P5, ...PM].map((p) => p.html).join("")));
  const s = { actividad: "no", sentado: true, imp: 7, conf: 4, barreras: ["dolor", "tiempo"], objetivo: "Caminar <b>15</b> min", semanas: 8 };
  const n = C.nota(d, s);
  check("nota para la historia: 5 Aes, actividad, escalas, barreras, acuerdo, seguridad, cribado y seguimiento, en texto plano", /5 Aes/.test(n) && /no llega/.test(n) && /más de 2 h seguidas sentado/.test(n) && /Importancia 7\/10 · confianza 4\/10/.test(n) && /no tengo tiempo; me duelen/.test(n) && /Acuerdo: Caminar <b>15<\/b> min/.test(n) && /Seguridad por la medicación/.test(n) && /Cribado ACSM/.test(n) && /en 8 semanas/.test(n) && /v9\.9\.9/.test(n));
  const h = C.hoja(d, s, new Date(2026, 10, 22).getTime());
  check("hoja para el paciente: su objetivo (sin HTML), su semana, cuidados, las 6 señales de alarma, el aviso del cribado y la fecha de revisión", h.includes("Caminar &lt;b&gt;15&lt;/b&gt; min") && (h.match(/<tr>/g) || []).length === 4 && (h.match(/<li>/g) || []).length >= ALARMA.length + 3 && /hc-aviso/.test(h) && /17 de enero de 2027/.test(h) && /Si me cuesta/.test(h) && /Nombre:/.test(h));
  check("sin cribado que pida valoración, la hoja no lleva el aviso; sin objetivo escrito, lleva el de partida", !/hc-aviso/.test(C.hoja({ ...d, crib: { clave: "empezar", texto: "x" } }, {})) && /Caminar 10 minutos/.test(C.hoja({ ...d, crib: null }, {})));
  check("fuentes: Ministerio de Sanidad 2015, OMS 2020, Orrow 2012 y Rubak 2005, con DOI o enlace", C.FUENTES.length === 4 && C.FUENTES.every((f) => (f.doi ? /^10\.\d{4,9}\/\S+$/.test(f.doi) : /^https:\/\//.test(f.url))) && C.FUENTES.some((f) => f.doi === "10.1136/bmj.e1389") && C.FUENTES.some((f) => f.doi === "10.1136/bjsports-2020-102955") && /^https:\/\//.test(C.LOCALIZA.url));
  const ks = Object.keys(C.TXT.es), vars = (x) => (x.match(/\{\w+\}/g) || []).sort().join();
  check("interfaz en los cinco idiomas con las mismas variables; las cinco Aes traducidas", ["en", "ca", "gl", "eu"].every((l) => Object.keys(C.TXT[l]).length === ks.length && ks.every((x) => C.TXT[l][x] && vars(C.TXT[l][x]) === vars(C.TXT.es[x]))) && C.AES.every((a) => C.TXT.en[a] && C.TXT.en[a] !== C.TXT.es[a]));
}

console.log("\nCentro de herramientas: catálogo, buscador y «Para usted hoy» (segunda tanda, 2)");
{
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/centro.js"), "utf8");
  const APP = path.join(ROOT, "app");
  const appJs = fs.readFileSync(path.join(APP, "js/app.js"), "utf8"), htmlApp = fs.readFileSync(path.join(APP, "index.html"), "utf8");
  const es = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const H = C.HERRAMIENTAS, ids = H.map((h) => h.id);
  check(`catálogo: ${H.length} herramientas, sin ids repetidos y en cinco grupos`, H.length >= 30 && new Set(ids).size === H.length && new Set(H.map((h) => h.g)).size === 5);
  const sinNombre = H.filter((h) => !(h.k ? es.includes(`"${h.k}":`) : src.includes(`${h.l}: "`)) || !src.includes(`d_${h.id}: "`) || [h.d, h.tab, h.clic, h.f, h.url, h.vista].filter(Boolean).length !== 1);
  check("cada herramienta tiene nombre (clave de la app que existe, o del módulo), descripción y una sola forma de abrirse", sinNombre.length === 0, sinNombre.map((h) => h.id).join());
  const sinDestino = [...H.filter((h) => h.clic && !(h.clic.startsWith("#") ? htmlApp.includes(`id="${h.clic.slice(1)}"`) : htmlApp.includes(h.clic.slice(1)))), ...H.filter((h) => h.d && !appJs.includes(`[data-${h.d}]`)), ...H.filter((h) => h.f && !new RegExp(`\\b${h.f}\\b`).test(appJs))];
  check("los botones que pulsa existen en la página y los atributos y funciones que usa los tiene la aplicación", sinDestino.length === 0, sinDestino.map((h) => h.id).join());
  check("las páginas enlazadas existen", H.filter((h) => h.url).every((h) => fs.existsSync(path.join(ROOT, "app", h.url))));
  const claves = (l) => new Set([...src.split(`\n  ${l}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos del módulo en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size > 100 && ["en", "ca", "gl", "eu"].every((l) => { const k = claves(l); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((l) => `${l}:${claves(l).size}`).join(" "));
  const base = { n: 6, pro: false, edad: 72, crib: "ok", calor: 0, tipoHoy: "fuerza", etiquetaHoy: "Fuerza", hecho: false, mayores: 0, hab: { alcohol: "no", tabaco: "no", cafe: "poco" }, metas: 2, sft: Date.now(), lecciones: 10, copia: Date.now(), hayDiario: true };
  const sug = (x) => C.sugerencias({ ...base, ...x }).map((s) => s.id);
  check("sin medicación: añadir, ejemplo y cómo funciona", sug({ n: 0 }).join() === "anadir,ejemplo,como");
  check("nunca más de tres sugerencias y siempre alguna", sug({}).length >= 1 && sug({ crib: "sin_datos", calor: 3, mayores: 2, hab: null, metas: 0, lecciones: 0 }).length === 3);
  check("orden de importancia: cribado sin hacer, calor y sesión de hoy por delante", sug({ crib: "sin_datos", calor: 2, mayores: 2 }).join() === "cribado,calor,sesion");
  check("con la sesión de hoy hecha no se propone otra vez; en día de descanso tampoco", !sug({ hecho: true }).includes("sesion") && sug({ hecho: true })[0] === "plan" && !sug({ tipoHoy: "descanso" }).includes("sesion"));
  check("interacciones importantes, hábitos sin responder y metas sin elegir", sug({ mayores: 1 })[1] === "mapa" && sug({ hab: { alcohol: null, tabaco: "no", cafe: "poco" } }).includes("habitos") && sug({ metas: 0 }).includes("metas"));
  check("pruebas de forma física desde los 60 años si no hay o son de hace más de 12 semanas; copia tras 30 días con diario", sug({ sft: 0, tipoHoy: "descanso" }).includes("pruebas") && !sug({ sft: 0, edad: 45, tipoHoy: "descanso" }).includes("pruebas") && sug({ sft: Date.now() - 90 * 864e5, tipoHoy: "descanso" }).includes("pruebas") && sug({ copia: 0, tipoHoy: "descanso" }).includes("listas") && !sug({ copia: 0, hayDiario: false, tipoHoy: "descanso" }).includes("listas"));
  check("la guía de conversación solo se sugiere en modo profesional", sug({ pro: true }).includes("conversa") && !sug({}).includes("conversa"));
  const F = { indice, enLista: new Set(["bisoprolol"]), glosario: { RPE: "Escala de esfuerzo percibido", SPPB: "prueba de equilibrio, marcha y silla" }, porques: ["pulso", "azucar", "equilibrio"], ejercicios: C.ejerciciosTipo(), lecciones: [{ id: "caidas", titulo: "El equilibrio se entrena" }] };
  const busca = (q, o) => C.buscarTodo(q, F, o);
  const de = (q, g) => (busca(q).find((x) => x.id === g)?.items || []);
  check("buscador: menos de dos letras no busca; sin tildes ni mayúsculas", busca("a").length === 0 && de("PASTILLERO", "herr")[0]?.h.id === "pastillero" && de("cafe", "herr").some((r) => r.h.id === "habitos"));
  check("buscador: medicamentos de la base, primero los de su lista", de("biso", "meds")[0]?.e.pid === "bisoprolol" && de("biso", "meds")[0].enLista === true && de("metform", "meds")[0]?.enLista === false);
  check("buscador: lecciones, explicaciones, ejercicios y glosario", de("equilibrio", "lecc").length === 1 && de("azucar", "porque").length === 1 && de("silla", "ejer").length >= 2 && de("rpe", "glos").length === 1);
  check("buscador: lo del modo profesional solo aparece en modo profesional", !de("conversacion", "herr").some((r) => r.h.id === "conversa") && (busca("conversacion", { pro: true }).find((x) => x.id === "herr")?.items || []).some((r) => r.h.id === "conversa"));
  check("los ejercicios del buscador son los de las sesiones tipo (se abren por su nombre)", C.ejerciciosTipo().length >= 12 && C.ejerciciosTipo().includes("Sentadilla a la silla"));
  check("entradas del centro: barra inferior, cabecera y menú «Más»; atajo Ctrl + K", (htmlApp.match(/data-centro=""/g) || []).length === 3 && /key\.toLowerCase\(\) === "k"/.test(appJs));
}

console.log("\nBiblioteca de ejercicios: catálogo, dibujos, alternativas y cambios (segunda tanda, 4)");
{
  const B = await import(pathToFileURL(path.join(ROOT, "app/js/biblioteca.js")).href);
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/movimiento.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/biblioteca.js"), "utf8"), mov = fs.readFileSync(path.join(ROOT, "app/js/movimiento.js"), "utf8");
  const appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const cat = B.catalogo();
  check(`catálogo: ${cat.length} ejercicios, sin ids ni nombres repetidos`, cat.length === 45 && new Set(cat.map((e) => e.id)).size === 45 && new Set(cat.map((e) => e.nombre)).size === 45);
  check("cada ejercicio tiene dibujo animado, tres errores frecuentes y algún cuidado según la medicación", cat.every((e) => M.IDS.includes(e.id) && M.postura(e.id, 0).includes("<svg") && M.errores(e.id).length === 3 && M.cuidados(e.id, ["pulso", "azucar", "sangrado", "tension", "agua", "calor", "equilibrio", "musculo", "tendon", "ritmo", "acelera", "fuerza_hueso", "sol", "tension_alta", "cansancio"]).length >= 1), cat.filter((e) => M.errores(e.id).length !== 3).map((e) => e.id).join());
  check("cada ejercicio tiene cómo se hace, la clave, minutos y una variante más fácil", cat.every((e) => e.detalle?.length > 5 && (!e.nuevo || e.detalle.length > 40) && e.clave?.length > 10 && e.min >= 2 && e.facil?.length > 5), cat.filter((e) => !(e.detalle && e.clave && e.min && e.facil)).map((e) => e.id).join());
  check("zonas, materiales, posturas y niveles son de las listas del módulo", cat.every((e) => B.ZONAS.includes(e.zona) && B.POSTURAS.includes(e.postura) && [1, 2, 3].includes(e.nivel) && e.material.every((m) => m === "bici" || B.MATERIALES.includes(m))) && B.ZONAS.every((z) => cat.some((e) => e.zona === z)));
  // las dos posturas de cada dibujo tienen la misma estructura de trazo (si no, la animación salta)
  const estructura = (d) => d.replace(/[-\d.\s,]+/g, "") + "/" + (d.match(/-?\d*\.?\d+/g) || []).length;
  const figs = [...mov.matchAll(/^\s+(\w+): \{.*?fig: \["([^"]+)", "([^"]+)"\](.*)$/gm)];
  const malas = figs.filter(([, , a, b, resto]) => estructura(a) !== estructura(b) || [...resto.matchAll(/attr: "d", v: \["([^"]+)", "([^"]+)"\]/g)].some((x) => estructura(x[1]) !== estructura(x[2]))).map((m) => m[1]);
  check(`las dos posturas de los ${figs.length} dibujos animados tienen la misma estructura`, figs.length === 44 && malas.length === 0, malas.join());
  check("el dibujo quieto usa el aspecto de los pictogramas de la lista", M.estatico("zancada").startsWith('<svg class="picto"') && M.estatico("escalon") === M.postura("escalon", 0).replace('class="ej-svg"', 'class="picto"'));
  // los 13 primeros toman sus textos de las sesiones tipo del motor
  const ses = sesionTipo("fuerza", { fragil: false });
  check("los ejercicios de las sesiones tipo están en el catálogo con sus mismos textos", ses.bloques.filter((b) => b.clave).every((b) => { const e = B.porNombre(b.nombre); return e && e.detalle === b.detalle && e.clave === b.clave; }));
  const alt = (n, p) => B.alternativas(n, p).map((e) => e.id);
  check("alternativas: comparten patrón, no incluyen al propio ejercicio y hay al menos tres", ["Sentadilla a la silla", "Remo con banda elástica", "Press de hombro ligero", "Bisagra de cadera", "Apoyo sobre un pie", "Flexión de brazos con botella o banda", "Elevación de talones"].every((n) => { const a = B.alternativas(n), o = B.porNombre(n); return a.length >= (n === "Elevación de talones" ? 2 : 3) && !a.some((e) => e.id === o.id) && a.every((e) => e.pat.some((p) => o.pat.includes(p))); }));
  check("alternativas: primero las del mismo patrón principal; para la sentadilla, levantarse de la silla va antes que la marcha sentado", alt("Sentadilla a la silla")[0] === "silla" && alt("Sentadilla a la silla").indexOf("silla") < alt("Sentadilla a la silla").indexOf("marcha_sentado"));
  check("un bloque que no está en el catálogo por su nombre se reconoce por su dibujo", alt("Levantarse y sentarse", "silla").includes("sentadilla") && alt("Equilibrio (5 min)", "unpie").includes("tandem") && alt("No existe").length === 0);
  check("se pueden cambiar los de fuerza y equilibrio; el bloque de marcha o bici y los de movilidad, no", B.cambiable("Sentadilla a la silla") && B.cambiable("Equilibrio (5 min)", "unpie") && !B.cambiable("Marcha, bici o elíptica", "bici") && !B.cambiable("Calentamiento", "marcha") && !B.cambiable("Enfriamiento", "estirar"));
  const cambiada = B.aplicar(ses, { "Sentadilla a la silla": "zancada", "Remo con banda elástica": "no_existe" });
  const z = cambiada.bloques.find((b) => b.de === "Sentadilla a la silla"), orig = ses.bloques.find((b) => b.nombre === "Sentadilla a la silla");
  check("aplicar: mismo sitio y mismos minutos, otro ejercicio, y recuerda el original", !!z && z.nombre === "Zancada con apoyo" && z.min === orig.min && z.pict === "zancada" && z.dePict === "sentadilla" && cambiada.bloques.indexOf(z) === ses.bloques.indexOf(orig) && cambiada.min === ses.min);
  check("aplicar: un id que no existe se ignora y sin cambios devuelve la misma sesión", cambiada.bloques.some((b) => b.nombre === "Remo con banda elástica") && B.aplicar(ses, {}) === ses);
  const f = (x) => B.filtrar(x).map((e) => e.id);
  check("filtros: sentado con banda, sin material, en el suelo y por zona", f({ postura: "sentado", material: "banda" }).join() === "remo_sentado,press_sentado,abduccion_sentado" && f({ material: "nada" }).every((id) => B.porId(id).material.length === 0) && f({ material: "nada" }).length >= 5 && f({ postura: "suelo" }).length === 5 && f({ zona: "tronco" }).length >= 4 && f({ q: "plancha" }).join() === "plancha");
  const claves = (l) => new Set([...src.split(`\n  ${l}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos de la ventana en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size > 50 && ["en", "ca", "gl", "eu"].every((l) => { const k = claves(l); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((l) => `${l}:${claves(l).size}`).join(" "));
  check("etiquetas de zona, material, postura y nivel de todo el catálogo", [...B.ZONAS.map((z2) => "z_" + z2), ...B.MATERIALES.map((m) => "m_" + m), "m_bici", ...B.POSTURAS.map((p) => "p_" + p), "niv_1", "niv_2", "niv_3"].every((k) => kEs.has(k)));
  check("la aplicación aplica los cambios al plan, a «hoy», a la sesión guiada y a la hoja imprimible", (appJs.match(/sesionDe\(/g) || []).length >= 6 && /data-cambiar="\$\{b\.de \|\| b\.nombre\}"/.test(appJs) && appJs.includes("[data-biblioteca]") && appJs.includes('import("./biblioteca.js'));
  check("el módulo no importa otros módulos bajo demanda (va en su propio ámbito en el artefacto)", [...src.matchAll(/^import .* from "\.\/([a-z0-9]+)\.js/gm)].every((m) => ["i18n", "engine", "pictos", "libs", "version", "tr"].includes(m[1])));
}

console.log("\nPrograma de 12 semanas: dosis, decisiones y ajuste de las sesiones (segunda tanda, 3)");
{
  const G = await import(pathToFileURL(path.join(ROOT, "app/js/programa.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/programa.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const todas = G.NIVELES.flatMap((n) => [...Array(12)].map((_, i) => G.semana(n, i + 1)));
  check("tres niveles de 12 semanas: sesiones de 3 a 6, series de 1 a 3 y paseos de 5 a 45 minutos", G.NIVELES.length === 3 && todas.length === 36 && todas.every((s) => s.ses >= 3 && s.ses <= 6 && s.ser >= 1 && s.ser <= 3 && s.aer >= 5 && s.aer <= 45));
  check("tres fases de cuatro semanas; descarga en la 4 y la 8, y la 12 de pruebas", todas.every((s) => s.fase === Math.ceil(s.paso / 4) && s.descarga === (s.paso === 4 || s.paso === 8) && s.pruebas === (s.paso === 12)));
  const sube = (n, k) => { const l = [...Array(12)].map((_, i) => G.semana(n, i + 1)); return l.every((s, i) => i === 0 || s.descarga || s.pruebas || s[k] >= l.slice(0, i).filter((x) => !x.descarga).at(-1)[k]); };
  check("fuera de las semanas de descarga y de pruebas, el paseo, las series y las sesiones nunca bajan", G.NIVELES.every((n) => sube(n, "aer") && sube(n, "ser") && sube(n, "ses")));
  check("las semanas de descarga piden menos que la anterior", G.NIVELES.every((n) => [4, 8].every((p) => { const a = G.semana(n, p - 1), d = G.semana(n, p); return d.aer < a.aer && d.ses <= a.ses && d.ser <= a.ser; })));
  check("cada nivel empieza por debajo del siguiente y el esfuerzo objetivo sube con las fases", G.semana("suave", 1).aer < G.semana("medio", 1).aer && G.semana("medio", 1).aer < G.semana("activo", 1).aer && G.NIVELES.every((n) => G.semana(n, 1).rpe[1] <= G.semana(n, 5).rpe[1] && G.semana(n, 5).rpe[1] <= G.semana(n, 9).rpe[1] && G.semana(n, 9).rpe[1] <= 7));
  // minutos semanales con las sesiones tipo: ningún nivel pasa de 300 min y el suave no pasa de 150
  const minutos = (n) => [...Array(12)].map((_, i) => { const s = G.semana(n, i + 1), fr = n === "suave"; return G.objetivo(s, ["fuerza_eq", "aerobico", "fuerza", "aerobico", "fuerza_eq", "aerobico"].map((x) => G.ajustar(sesionTipo(x, { fragil: fr, aer: s.aer }), s).min)).min; });
  const mS = minutos("suave"), mM = minutos("medio"), mA = minutos("activo");
  check(`minutos por semana: suave ${mS[0]}–${Math.max(...mS)}, medio ${mM[0]}–${Math.max(...mM)}, activo ${mA[0]}–${Math.max(...mA)}`, mS[0] <= 60 && Math.max(...mS) <= 150 && mM[0] <= 90 && Math.max(...mM) >= 150 && Math.max(...mA) <= 300);
  const saltos = [mS, mM, mA].flatMap((l) => l.map((v, i) => (i && ![3, 7, 11].includes(i) && ![4, 8].includes(i) ? v / l[i - 1] : 1)));
  check("de una semana a la siguiente (sin contar las de descarga) el objetivo no sube más de un 40 %", Math.max(...saltos) <= 1.4, Math.max(...saltos).toFixed(2));
  check("el motor acepta los minutos de paseo del programa también en el nivel frágil, sin cambiar lo de siempre", sesionTipo("aerobico", { fragil: true, aer: 6 }).bloques[1].min === 6 && sesionTipo("aerobico", { fragil: true }).bloques[1].min === 10 && sesionTipo("aerobico", { fragil: true, minutosAer: 30 }).bloques[1].min === 10 && sesionTipo("aerobico", {}).bloques[1].min === 30);
  check("las series de la semana se escriben en el texto del ejercicio", G.conSeries("2–3 series de 8–15; bajar despacio", 1) === "1 serie de 8–15; bajar despacio" && G.conSeries("Apoyado en el respaldo, 2 × 10–15", 3) === "Apoyado en el respaldo, 3 × 10–15" && G.conSeries("Estirar la pierna y aguantar 2 s, 2 × 10 cada lado", 1) === "Estirar la pierna y aguantar 2 s, 1 × 10 cada lado" && G.conSeries("Aguante de 10 a 30 segundos, 3 veces", 1) === "Aguante de 10 a 30 segundos, 3 veces");
  const f0 = sesionTipo("fuerza_eq", {}), f1 = G.ajustar(f0, G.semana("medio", 1)), f3 = G.ajustar(f0, G.semana("medio", 10));
  check("ajustar: con una serie la sesión de fuerza es más corta y con tres más larga; el calentamiento y el equilibrio no cambian", f1.min < f0.min && f3.min > f0.min && f1.bloques[0].min === f0.bloques[0].min && f1.bloques.at(-1).min === f0.bloques.at(-1).min && f1.min === f1.bloques.reduce((n, b) => n + b.min, 0) && f1.bloques.filter((b) => b.series === 1).length >= 5);
  check("ajustar: con dos series la sesión queda como la de siempre y la de paseo solo lleva la marca del programa", G.ajustar(f0, G.semana("medio", 5)).min === f0.min && G.ajustar(sesionTipo("aerobico", { aer: 12 }), G.semana("medio", 2)).min === 22 && G.ajustar(f0, null) === f0);
  // decisiones
  const r = (ses, rpe = 5, sint = false) => ({ ses, min: ses * 30, rpe, sint });
  check("decidir: dos de cada tres sesiones y esfuerzo por debajo de 7,5 -> avanza", G.decidir(r(2), 3) === "avanza" && G.decidir(r(4), 5) === "avanza" && G.decidir(r(4), 6) === "avanza" && G.decidir(r(3, 7.4), 4) === "avanza" && G.decidir(r(3, null), 4) === "avanza");
  check("decidir: menos sesiones o esfuerzo de 7,5 o más -> repite; síntomas de alarma -> no sube", G.decidir(r(1), 3) === "poco" && G.decidir(r(3), 5) === "poco" && G.decidir(r(4, 7.5), 4) === "duro" && G.decidir(r(4, 5, true), 4) === "sintomas");
  check("decidir: una semana vacía es pausa; desde la segunda seguida, un paso atrás", G.decidir(r(0), 3, 0) === "pausa" && G.decidir(r(0), 3, 1) === "atras" && G.decidir(r(0), 3, 3) === "atras");
  // arranque: lunes a miércoles empieza esta semana; de jueves a domingo, el lunes siguiente
  check("nuevo: de lunes a miércoles la semana 1 es esta; de jueves a domingo empieza el lunes siguiente", G.nuevo("medio", new Date("2026-11-23T10:00")).lunes === "2026-11-23" && G.nuevo("medio", new Date("2026-11-25T23:00")).lunes === "2026-11-23" && G.nuevo("medio", new Date("2026-11-26T08:00")).lunes === "2026-11-30" && G.nuevo("medio", new Date("2026-11-29T08:00")).lunes === "2026-11-30");
  const mas = (s, n) => { const d = new Date(s + "T12:00"); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const D = [], pon = (l, n, rpe = 5, sintomas = []) => { for (let i = 0; i < n; i++) D.push({ fecha: mas(l, i), min: 30, rpe, sintomas }); };
  G._poner(G.nuevo("medio", new Date("2026-11-23T10:00")));
  check("antes de que acabe la semana no se decide nada", G.actualizar(D, { hoy: new Date("2026-11-29T22:00") }).length === 0 && G.semanaActual(new Date("2026-11-29T22:00")).paso === 1);
  let l = "2026-11-23"; const pasos = [];
  for (const k of ["ok", "ok", "vacia", "vacia", "dura", "mareo", "poca", ...Array(11).fill("ok")]) { if (k === "ok") pon(l, 4); else if (k === "dura") pon(l, 4, 8); else if (k === "mareo") pon(l, 4, 5, ["mareo"]); else if (k === "poca") pon(l, 1); l = mas(l, 7); pasos.push(...G.actualizar(D, { sesPlan: 6, hoy: new Date(l + "T09:00") }).map((h) => h.clave)); }
  check("simulación: avanza, pausa, atrás, duro, síntomas, poco y termina tras 12 pasos superados", pasos.join() === ["avanza", "avanza", "pausa", "atras", "duro", "sintomas", "poco", ...Array(10).fill("avanza"), "fin"].join(), pasos.join());
  check("al terminar, el plan vuelve a las dosis de siempre hasta decidir cómo seguir, y la revisión compara principio y final", G.semanaActual(new Date(l + "T09:00")) === null && !!G.leer().fin && G.revision().semanas === 18 && G.revision().ses === 61 && G.revision().min === 61 * 30 && G.revision().ini.min === 120);
  G._poner({ ...G.leer(), mant: true });
  check("mantenimiento: se queda con las dosis de la semana 11 y ya no avanza", G.semanaActual().mant === true && G.semanaActual().aer === G.semana("medio", 11).aer && G.actualizar(D, { hoy: new Date("2028-01-01T09:00") }).length === 0);
  G._poner(G.nuevo("suave", new Date("2026-11-27T10:00")));
  check("empezado en viernes: hasta el lunes rige la semana 1 como previa y no se evalúa", G.semanaActual(new Date("2026-11-28T10:00")).previa === true && G.actualizar([], { hoy: new Date("2026-11-30T10:00") }).length === 0 && !G.semanaActual(new Date("2026-11-30T10:00")).previa);
  G._poner(G.nuevo("medio", new Date("2026-11-23T10:00")));
  check("un parón muy largo retrocede como mucho hasta la semana 1 y no bloquea", G.actualizar([], { hoy: new Date("2027-11-23T10:00") }).length === 52 && G.leer().paso === 1 && G.leer().hist.length <= 80);
  check("con menos días en el plan que sesiones pide la semana, el objetivo son los días del plan", G.sesionesObjetivo(G.semana("activo", 10), 3) === 3 && G.objetivo(G.semana("medio", 6), [30, 40]).ses === 2 && G.objetivo(G.semana("medio", 1), [28, 20, 23, 20, 28, 20]).min === 70);
  check("nivel recomendado: frágil -> suave; 120 min o más de media en cuatro semanas -> activo; si no, medio", G.recomendar({ fragil: true }) === "suave" && G.recomendar({ diario: [] }) === "medio" && G.recomendar({ diario: [..."0123"].flatMap((w) => [0, 2, 4, 5].map((k) => ({ fecha: mas("2026-10-26", w * 7 + k), min: 35 }))), hoy: new Date("2026-11-24T10:00") }) === "activo");
  G._poner(null);
  check("sin programa no hay semana, ni tarjeta, ni decisiones", G.semanaActual() === null && G.tarjeta() === "" && G.actualizar(D).length === 0);
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size > 100 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("cada decisión tiene título y explicación, y cada fuente su DOI y su frase", ["avanza", "poco", "duro", "sintomas", "pausa", "atras", "fin"].every((k) => kEs.has("v_" + k) && kEs.has("v_" + k + "_x")) && G.FUENTES.length === 6 && G.FUENTES.every((f) => /^10\.\d{4,}\//.test(f.doi) && kEs.has("f_" + f.id)));
  check("el contenido nuevo lleva la marca de borrador pendiente de revisión clínica", kEs.has("borrador") && (src.match(/prg-borrador">\$\{tx\("borrador"\)\}/g) || []).length === 3);
  check("la aplicación usa la semana del programa en las sesiones y en el objetivo, y lo pone al día una vez al día", /sesionTipo\(tipo, sem \? \{ \.\.\.o, aer: sem\.aer \} : o\)/.test(appJs) && appJs.includes("PRG.ajustar(s, sem)") && appJs.includes("PRG.actualizar(leerDiario()") && appJs.includes("[data-programa]") && appJs.includes('import("./programa.js'));
}

console.log("\n«Hoy tengo…»: sesión a la medida y píldoras de movimiento (segunda tanda, 5)");
{
  const R = await import(pathToFileURL(path.join(ROOT, "app/js/rato.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/rato.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), mov = fs.readFileSync(path.join(ROOT, "app/js/movimiento.js"), "utf8");
  const bases = [["aerobico", false], ["aerobico", true], ["fuerza", false], ["fuerza", true], ["fuerza_eq", false], ["fuerza_eq", true]].map(([tp, fragil]) => sesionTipo(tp, { fragil, minutosAer: fragil ? 10 : 30 }));
  const todas = bases.flatMap((b) => R.TIEMPOS.map((m) => [m, R.armar(b, m)]));
  check("la sesión armada dura exactamente lo pedido (5, 10, 20 o 30 min) con cualquier sesión del plan", todas.every(([m, s]) => s.min === m && s.bloques.reduce((n, b) => n + b.min, 0) === m && s.bloques.every((b) => b.min >= 1)), todas.filter(([m, s]) => s.min !== m).map(([m, s]) => `${s.tipo}:${m}→${s.min}`).join());
  const fz = (m) => R.armar(sesionTipo("fuerza_eq", {}), m);
  check("fuerza: 2 ejercicios en 5 min, 3 en 10 y 5 en 20, siempre con calentamiento y en el orden del plan (piernas primero)", fz(5).bloques.length === 3 && fz(10).bloques.length === 4 && fz(20).bloques.filter((b) => b.clave).length === 6 && fz(5).bloques[0].nombre === "Calentamiento" && fz(5).bloques[1].nombre === "Sentadilla a la silla" && fz(30).bloques.length === 8);
  check("fuerza: una serie hasta 10 min, dos en 20 y la dosis del plan en 30; el equilibrio entra desde 20 min con su nombre de ejercicio", /^1 serie de/.test(fz(10).bloques[1].detalle) && /^2 series de/.test(fz(20).bloques[1].detalle) && fz(30).bloques[1].detalle === sesionTipo("fuerza_eq", {}).bloques[1].detalle && !fz(10).bloques.some((b) => b.pict === "unpie") && fz(20).bloques.at(-1).nombre === "Apoyo sobre un pie");
  const pa = (m) => R.armar(sesionTipo("aerobico", {}), m).bloques.map((b) => b.min).join();
  check("paseo: calentamiento, tramo principal y vuelta a la calma en proporción", pa(5) === "1,3,1" && pa(10) === "2,6,2" && pa(20) === "3,14,3" && pa(30) === "5,20,5");
  const eq = (m) => R.armar(sesionTipo("equilibrio", {}), m);
  check("equilibrio: dos ejercicios en 5 min y los cuatro en 10, de 2 min como mínimo", eq(5).bloques.length === 2 && eq(5).min === 5 && eq(10).bloques.length === 5 && eq(10).min === 10 && eq(10).bloques.slice(1).every((b) => b.min >= 2));
  check("«lo de hoy» usa la sesión del plan; en día de descanso, fuerza", R.tipoBase("hoy", "aerobico") === "aerobico" && R.tipoBase("hoy", "fuerza_eq") === "fuerza_eq" && R.tipoBase("hoy", "descanso") === "fuerza" && R.tipoBase("paseo", "fuerza") === "aerobico" && R.tipoBase("equilibrio", "fuerza") === "equilibrio" && R.armar(null, 10) === null);
  check(`${R.PILDORAS.length} píldoras, todas con dibujo, qué hacer y cuándo`, R.PILDORAS.length === 10 && R.PILDORAS.every((p) => new RegExp(`^  ${p.id}: \\{`, "m").test(mov) && (!p.s || new RegExp(`^  ${p.s}: \\{`, "m").test(mov)) && p.n.length > 10 && p.d.length > 15 && p.c.length > 8));
  const frag = R.pildorasPara(true);
  check("con fragilidad se quitan las exigentes y se usan las variantes sentadas o con apoyo", frag.length === 8 && !frag.some((p) => p.fuerte) && frag.some((p) => p.id === "marcha_sentado") && frag.some((p) => p.id === "talones_sentado") && R.pildorasPara(false).length === 10);
  let reg = {}; reg = R.sumarPildora(reg, "2026-11-22"); reg = R.sumarPildora(reg, "2026-11-22"); reg = R.sumarPildora(reg, "2026-11-21", 3);
  check("contador: suma por día, resta sin bajar de cero y borra el día que queda a cero", reg["2026-11-22"] === 2 && reg["2026-11-21"] === 3 && R.sumarPildora(reg, "2026-11-22", -5)["2026-11-22"] === undefined && R.sumarPildora({}, "2026-11-22", -1)["2026-11-22"] === undefined);
  let largo = {}; for (let i = 0; i < 120; i++) { const d = new Date(2026, 0, 1 + i); largo = R.sumarPildora(largo, `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`); }
  check("contador: guarda como mucho 90 días, los más recientes, y descarta claves que no son fechas", Object.keys(largo).length === 90 && !largo["2026-01-01"] && !!largo["2026-04-30"] && Object.keys(R.sumarPildora({ basura: 4 }, "2026-11-22")).join() === "2026-11-22");
  const u7 = R.ultimos7(reg, new Date("2026-11-22T10:00"));
  check("últimos 7 días: termina hoy y trae las píldoras de cada día", u7.length === 7 && u7[6].dia === "2026-11-22" && u7[6].n === 2 && u7[5].n === 3 && u7[0].dia === "2026-11-16" && u7[0].n === 0);
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size > 40 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("tres fuentes con DOI y su frase; las cifras citadas son las de los resúmenes de PubMed", R.FUENTES.length === 3 && R.FUENTES.every((f) => /^10\.\d{4,}\//.test(f.doi) && kEs.has("f_" + f.id)) && /11 ensayos \(414 personas/.test(src) && /un 31 %/.test(src) && /7 ensayos de un día/.test(src) && /91 %/.test(src));
  check("módulo registrado en la aplicación (data-abre) y con dos accesos en Mi plan", /rato: \(\) => import\("\.\/rato\.js/.test(appJs) && (appJs.match(/data-abre="rato"/g) || []).length === 2 && appJs.includes('data-arg="pildoras"') && appJs.includes("[data-abre]"));
  check("la interfaz común api() ofrece lo que usa el módulo", ["toast", "hoyISO", "esFragil", "planDeHoy", "sesionDe", "abrirSesion", "porquesDe", "vibrar", "anilloCrono", "cargarMov", "cargarBiblio"].every((k) => new RegExp(`const api = \\(\\) => \\(api\\.o \\|\\|= \\{[^}]*\\b${k}\\b`).test(appJs)) && /dibujo: \(id\)/.test(appJs) && /res: \(\) => evaluar/.test(appJs) && /cerrar: \(\) => t\(/.test(appJs));
}

console.log("\nPaseo guiado: planes, tramos, prueba del habla y cuenta de pasos (segunda tanda, 6)");
{
  const W = await import(pathToFileURL(path.join(ROOT, "app/js/paseo.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/paseo.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  check("paseo libre: dura lo pedido, con calentamiento, paso ligero y vuelta a la calma", W.DURACIONES.every((m) => { const p = W.planLibre(m); return W.duracion(p) === m * 60 && p.map((x) => x.k).join() === "calienta,ligero,enfria" && W.ligero(p) >= m * 60 * 0.65; }));
  const sem = [...Array(8)].map((_, i) => W.planSemana(i + 1)), lig = sem.map((p) => W.ligero(p) / 60);
  check(`programa de 8 semanas: el paso ligero nunca baja (${lig.join(", ")} min) y la última son 30 min seguidos`, lig.every((v, i) => i === 0 || v >= lig[i - 1]) && lig[0] === 10 && lig[7] === 30 && sem[7].filter((x) => x.k === "ligero").length === 1 && sem.every((p) => p[0].k === "calienta" && p[0].s === 180 && p.at(-1).k === "enfria" && W.duracion(p) <= 37 * 60));
  check("programa: el tramo ligero más largo crece cada semana y entre tramos ligeros siempre hay uno tranquilo", sem.every((p, i) => i === 0 || Math.max(...p.filter((x) => x.k === "ligero").map((x) => x.s)) > Math.max(...sem[i - 1].filter((x) => x.k === "ligero").map((x) => x.s))) && sem.every((p) => p.every((x, i) => x.k !== "ligero" || p[i + 1]?.k !== "ligero")));
  const p20 = W.planLibre(20);
  check("tramo en curso, lo que queda de él y el final del paseo", W.tramoEn(p20, 0).tramo.k === "calienta" && W.tramoEn(p20, 180).tramo.k === "ligero" && W.tramoEn(p20, 200).resto === 880 && W.tramoEn(p20, 1199).tramo.k === "enfria" && W.tramoEn(p20, 1200) === null);
  check("minutos a paso ligero ya caminados", W.ligeroHasta(p20, 100) === 0 && W.ligeroHasta(p20, 480) === 300 && W.ligeroHasta(p20, 5000) === 900 && W.ligeroHasta(sem[0], 9 * 60) === 240);
  check("prueba del habla: dos veces, dentro de un tramo ligero y nunca en sus últimos 20 s; sin prueba en paseos muy cortos", [p20, ...sem].every((p) => { const m = W.momentosHabla(p); return m.length === 2 && m[0] < m[1] && m.every((t0) => { const x = W.tramoEn(p, t0); return x.tramo.k === "ligero" && x.resto >= 20; }); }) && W.momentosHabla([{ k: "ligero", s: 300 }]).length === 0);
  check("la prueba del habla ajusta el ritmo: +5 si va sobrado, −10 si cuesta hablar, sin salir de 70-130", W.ajusteHabla(100, "facil") === 105 && W.ajusteHabla(100, "bien") === 100 && W.ajusteHabla(100, "cuesta") === 90 && W.ajusteHabla(130, "facil") === 130 && W.ajusteHabla(72, "cuesta") === 70);
  const senal = (ppm, seg, amp = 3) => [...Array(seg * 50)].map((_, i) => { const t0 = i * 20, f = ppm / 60; return { t: t0, x: 0.3 * Math.sin(2 * Math.PI * f * t0 / 1000 + 1), y: 9.81 + amp * Math.sin(2 * Math.PI * f * t0 / 1000), z: 0.5 }; });
  const e100 = W.contarPasos(senal(100, 60)), e80 = W.contarPasos(senal(80, 60)), e120 = W.contarPasos(senal(120, 60));
  check(`cuenta de pasos con una señal sintética: 100, 80 y 120 por minuto dan ${e100.n}, ${e80.n} y ${e120.n}`, Math.abs(e100.n - 100) <= 2 && Math.abs(e80.n - 80) <= 2 && Math.abs(e120.n - 120) <= 2);
  check("ritmo medido en los últimos 20 s; con el móvil quieto no cuenta pasos ni da ritmo", Math.abs(W.cadenciaMedida(e100, 60000) - 100) <= 3 && W.contarPasos(senal(100, 60, 0.05)).n === 0 && W.cadenciaMedida(W.contarPasos([]), 1000) === null);
  const base = { modo: "prog", sem: 1, hechos: 0 };
  check("programa: con tres paseos completos se pasa de semana; en la 8, se da por terminado", W.trasPaseo(base).o.hechos === 1 && !W.trasPaseo(base).nueva && W.trasPaseo({ ...base, hechos: 2 }).o.sem === 2 && W.trasPaseo({ ...base, hechos: 2 }).o.hechos === 0 && W.trasPaseo({ ...base, hechos: 2 }).nueva && W.trasPaseo({ ...base, sem: 8, hechos: 2 }).fin && W.trasPaseo({ ...base, sem: 8, hechos: 2 }).o.sem === 8);
  check("preferencias por defecto: paseo libre de 20 min a 100 pasos por minuto, con metrónomo y voz, sin sensor", (() => { const o = W.leer(); return o.modo === "libre" && o.min === 20 && o.cad === 100 && o.metro && o.voz && !o.sensor && o.sem === 1; })());
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size > 90 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("etiquetas de ritmo para todas las cadencias, de tramo y de voz", W.CADENCIAS.every((c) => kEs.has("r_" + c)) && ["calienta", "ligero", "suave", "enfria"].every((k) => kEs.has("k_" + k)) && ["inicio", "ligero", "suave", "enfria", "mitad", "minuto", "fin", "habla"].every((k) => kEs.has("v_" + k)));
  check("tres fuentes con DOI y su frase; cifras de los resúmenes de PubMed (100, 110 y 120 pasos = 3, 4 y 5 MET; 100 y 130)", W.FUENTES.length === 3 && W.FUENTES.every((f) => /^10\.\d{4,}\//.test(f.doi) && kEs.has("f_" + f.id)) && /100, 110 y 120 pasos por minuto corresponden a 3, 4 y 5 MET/.test(src) && /130 la vigorosa/.test(src) && kEs.has("f_prog"));
  check("avisa de que el pulso no sirve de guía con fármacos que lo frenan, y el paseo se apunta en el diario como aeróbico", /fc_no_valida/.test(src) && /bradicardia/.test(src) && /registrarSesion\(\{ fecha: A\.hoyISO\(\), tipo: "aerobico"/.test(src) && /paseo: \(\) => import\("\.\/paseo\.js/.test(appJs));
}

console.log("\n«Me duele…»: semáforo del dolor, adaptaciones por zona y cruce con la medicación (segunda tanda, 7)");
{
  const L = await import(pathToFileURL(path.join(ROOT, "app/js/dolor.js")).href);
  const B = await import(pathToFileURL(path.join(ROOT, "app/js/biblioteca.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/dolor.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const ids = new Set(B.catalogo().map((e) => e.id)), d0 = { n: 0, manana: null, sube: null, alarmas: [] };
  check("semáforo: hasta 2, verde; de 3 a 5, amarillo; más de 5, rojo", [0, 1, 2].every((n) => L.semaforo({ ...d0, n }) === "verde") && [3, 4, 5].every((n) => L.semaforo({ ...d0, n }) === "amarillo") && [6, 8, 10].every((n) => L.semaforo({ ...d0, n }) === "rojo"));
  check("semáforo: si a la mañana siguiente no ha vuelto a su nivel, o va a más cada semana, es rojo aunque duela poco", L.semaforo({ ...d0, n: 2, manana: false }) === "rojo" && L.semaforo({ ...d0, n: 1, sube: true }) === "rojo" && L.semaforo({ ...d0, n: 4, manana: true, sube: false }) === "amarillo" && L.semaforo({ ...d0, n: 2, manana: true, sube: false }) === "verde");
  check("semáforo: cualquier señal de alarma manda sobre todo lo demás", L.semaforo({ ...d0, n: 0, alarmas: ["golpe"] }) === "alarma" && L.semaforo({ n: 9, manana: false, sube: true, alarmas: ["tvp"] }) === "alarma");
  check("siete zonas, cada una con adaptaciones, lo que conviene, consejos y sus señales de alarma (4 generales más las propias)", L.ZONAS.length === 7 && L.ZONAS.every((z) => { const Z = L.CONT.zonas[z]; return Z && Object.keys(Z.cambia).length >= 4 && Object.keys(Z.adapta).length >= 5 && Z.conviene.length > 30 && Z.general.length >= 1 && L.alarmasDe(z).length >= 4; }) && L.alarmasDe("lumbar").some((x) => x.id === "esfinter" && x.u) && L.alarmasDe("hombro").some((x) => x.id === "corazon" && x.u) && L.alarmasDe("tobillo").some((x) => x.id === "aquiles"));
  const malos = L.ZONAS.flatMap((z) => { const Z = L.CONT.zonas[z]; return [...Object.entries(Z.cambia).flat(), ...Object.keys(Z.adapta)].filter((x) => !ids.has(x)).map((x) => `${z}:${x}`); });
  check("todos los ejercicios de las tablas existen en la biblioteca", malos.length === 0, malos.join());
  const cadenas = L.ZONAS.flatMap((z) => { const Z = L.CONT.zonas[z]; return Object.entries(Z.cambia).filter(([a, b]) => Z.cambia[b] || a === b || Z.adapta[a]).map(([a, b]) => `${z}:${a}>${b}`); });
  check("ningún sustituto está a su vez entre los que se cambian, y un ejercicio o se cambia o se adapta, no las dos cosas", cadenas.length === 0, cadenas.join());
  const zonaDe = { rodilla: ["piernas"], cadera: ["piernas", "cadera"], tobillo: ["piernas", "pantorrilla", "equilibrio"] };
  check("los sustitutos de rodilla y tobillo no son ejercicios de impacto ni de apoyo sobre un pie", !Object.values(L.CONT.zonas.rodilla.cambia).some((x) => ["zancada", "escalon", "sentadilla_pared", "silla_rapida", "levantarse_suelo"].includes(x)) && !Object.values(L.CONT.zonas.tobillo.cambia).some((x) => ["unpie", "puntillas", "talonpunta", "escalon", "zancada"].includes(x)) && !!zonaDe);
  const plan = [...sesionTipo("fuerza_eq", {}).bloques, ...sesionTipo("aerobico", {}).bloques];
  const cR = L.consejos("rodilla", plan), cL = L.consejos("lumbar", plan), cT = L.consejos("tobillo", plan);
  check("plan estándar con dolor de rodilla: la sentadilla se adapta y el paseo lleva el consejo de marcha y el de bici; el calentamiento no", cR.some((c) => c.nombre === "Sentadilla a la silla" && c.accion === "adapta" && c.facil) && cR.some((c) => c.pict === "bici" && /En llano/.test(c.texto) && /En bicicleta: sillín alto/.test(c.texto)) && !cR.some((c) => c.nombre === "Calentamiento" || c.nombre === "Enfriamiento"));
  check("plan estándar con dolor lumbar: la bisagra se cambia por el puente y el press de hombro por el empuje sentado", cL.find((c) => c.nombre === "Bisagra de cadera")?.por === "puente" && cL.find((c) => c.nombre === "Press de hombro ligero")?.por === "press_sentado" && cL.find((c) => c.nombre === "Remo con banda elástica")?.accion === "adapta");
  check("plan estándar con dolor de tobillo: los talones pasan a hacerse sentado y el equilibrio a un pie pasa al tándem", cT.find((c) => c.nombre === "Elevación de talones")?.por === "talones_sentado" && cT.find((c) => c.pict === "unpie")?.por === "tandem");
  const ad = L.adaptacion(cL), ad2 = L.adaptacion(cL, { cambios: { "Bisagra de cadera": "extension_cadera" }, variantes: { "Remo con banda elástica": "dificil" } });
  check("«Adaptar mi plan»: cambia unos, pone la versión fácil a otros y no pisa lo que la persona ya había elegido", ad.cambios["Bisagra de cadera"] === "puente" && ad.variantes["Remo con banda elástica"] === "facil" && !("Bisagra de cadera" in ad2.cambios) && !("Remo con banda elástica" in ad2.variantes) && ad2.cambios["Press de hombro ligero"] === "press_sentado");
  // tras aplicar, la lista se sigue viendo igual: los ejercicios que cambió la herramienta se miran por su original
  const aplicado = B.aplicar(sesionTipo("fuerza_eq", {}), ad.cambios).bloques;
  check("tras aplicar, la lista de consejos no cambia (los cambiados por la herramienta se miran por su original)", L.consejos("lumbar", aplicado, Object.keys(ad.cambios)).map((c) => c.nombre + c.accion).join() === L.consejos("lumbar", sesionTipo("fuerza_eq", {}).bloques).map((c) => c.nombre + c.accion).join() && L.consejos("lumbar", aplicado).length < cL.length);
  const it = (nombre, clase, ...sen) => ({ principio: { nombre }, clase: { id: clase }, senales: new Set(sen) });
  const lista = [it("Ibuprofeno", "aines", "aine", "sangrado", "renal"), it("Prednisona", "corticoides", "corticoide", "hueso", "tendon"), it("Atorvastatina", "estatinas", "estatina", "miopatia"), it("Bisoprolol", "betabloqueantes", "bradicardia")];
  const cz = (z) => L.cruces(lista, z).map((c) => c.id).join();
  check("cruce con la medicación: analgésicos, tendones, estatinas y antiinflamatorios siempre; sangrado en articulaciones; vértebra solo en la zona lumbar", cz("cuello") === "analgesico,tendon,estatina,aine" && cz("rodilla") === "analgesico,tendon,estatina,sangrado,aine" && cz("lumbar") === "analgesico,tendon,estatina,hueso,aine" && L.cruces([it("Bisoprolol", "betabloqueantes", "bradicardia")], "rodilla").length === 0);
  check("cada aviso nombra los fármacos de la lista que lo provocan", L.cruces(lista, "rodilla").find((c) => c.id === "tendon").texto.startsWith("Prednisona debilita") && /Toma Ibuprofeno\./.test(L.cruces(lista, "rodilla")[0].texto) && L.cruces([it("Tramadol", "opioides", "sedacion")], "cadera").map((c) => c.id).join() === "analgesico,sedacion");
  const h = (ns) => ns.map((n, i) => ({ f: `2026-11-${String(i + 1).padStart(2, "0")}`, z: "rodilla", n }));
  check("tendencia: compara los tres últimos apuntes con los tres anteriores; con menos de seis no opina", L.tendencia(h([2, 3, 2, 5, 6, 6]), "rodilla").clave === "sube" && L.tendencia(h([6, 6, 5, 3, 2, 2]), "rodilla").clave === "baja" && L.tendencia(h([3, 4, 3, 4, 3, 4]), "rodilla").clave === "igual" && L.tendencia(h([3, 4, 3]), "rodilla").clave === "pocos" && L.tendencia(h([2, 3, 2, 5, 6, 6]), "hombro").clave === "pocos");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos de la interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 55 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("etiquetas de zona y de veredicto; tres fuentes con DOI y su frase; marca de borrador", L.ZONAS.every((z) => kEs.has("z_" + z)) && ["verde", "amarillo", "rojo", "alarma"].every((k) => kEs.has("v_" + k) && L.CONT.veredicto[k].length > 30) && L.FUENTES.length === 3 && L.FUENTES.every((f) => /^10\.\d{4,}\//.test(f.doi) && kEs.has("f_" + f.id)) && /dl-borrador">\$\{tx\("borrador"\)\}/.test(src));
  check("módulo registrado y accesible desde Mi plan; quitar las adaptaciones solo retira lo que puso la herramienta", /dolor: \(\) => import\("\.\/dolor\.js/.test(appJs) && appJs.includes('data-abre="dolor"') && /if \(Object\.values\(Z\.cambia\)\.includes\(cam\[n\]\)\) delete cam\[n\]/.test(src) && /if \(vars\[n\] === "facil"\) delete vars\[n\]/.test(src));
}

console.log("\nVolver tras un parón, una enfermedad o un ingreso (segunda tanda, 8)");
{
  const V = await import(pathToFileURL(path.join(ROOT, "app/js/vuelta.js")).href);
  const G = await import(pathToFileURL(path.join(ROOT, "app/js/programa.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/vuelta.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const combos = V.MOTIVOS.flatMap((motivo) => V.TIEMPOS.map((tiempo) => ({ motivo, tiempo })));
  const esc = (o) => V.escalones(o);
  check("escalones: de 1 a 6 semanas, porcentajes de 30 a 90 que nunca bajan y terminan en 80-90 %", combos.every((o) => { const e = esc(o); return e.length >= 1 && e.length <= 6 && e.every((x, i) => x.pct >= 30 && x.pct <= 90 && x.pct % 5 === 0 && (i === 0 || x.pct >= e[i - 1].pct)) && e.at(-1).pct >= 80; }));
  check("cuanto más tiempo parado, más semanas de vuelta y se empieza más abajo", ["vida", "infeccion", "ingreso"].every((motivo) => V.TIEMPOS.every((tm, i) => i === 0 || (esc({ motivo, tiempo: tm }).length > esc({ motivo, tiempo: V.TIEMPOS[i - 1] }).length && esc({ motivo, tiempo: tm })[0].pct <= esc({ motivo, tiempo: V.TIEMPOS[i - 1] })[0].pct))));
  check("tras una infección, una semana más; tras un ingreso o un problema de corazón, dos más y empezando más abajo", V.TIEMPOS.every((tiempo) => esc({ motivo: "infeccion", tiempo }).length === esc({ motivo: "vida", tiempo }).length + 1 && esc({ motivo: "ingreso", tiempo }).length === esc({ motivo: "vida", tiempo }).length + 2 && esc({ motivo: "corazon", tiempo })[0].pct <= esc({ motivo: "infeccion", tiempo })[0].pct));
  check("con fragilidad o desde los 75 años se empieza 10 puntos más abajo, sin pasar del 30 %", esc({ motivo: "vida", tiempo: "t2", fragil: true })[0].pct === 55 && esc({ motivo: "vida", tiempo: "t2", edad: 80 })[0].pct === 55 && esc({ motivo: "vida", tiempo: "t2", edad: 60 })[0].pct === 65 && esc({ motivo: "ingreso", tiempo: "t4", fragil: true })[0].pct === 30);
  check("series y esfuerzo siguen al porcentaje: por debajo del 60 %, una serie y esfuerzo 3-4; del 85 % en adelante, las habituales", combos.every((o) => esc(o).every((x) => (x.pct < 60 ? x.ser === 1 && x.rpe === "3–4" : x.pct < 85 ? x.ser === 2 && x.rpe === "4–5" : x.ser === null && x.rpe === "5–6"))));
  const v = (motivo, ...checks) => V.veredicto({ motivo, checks });
  check("hoy: el dolor en el pecho manda sobre todo (consultar); fiebre, síntomas de pecho o agotamiento, esperar", v("infeccion", "pecho", "fiebre") === "consulta" && v("vida", "pecho") === "consulta" && v("infeccion", "fiebre") === "espera" && v("infeccion", "abajo") === "espera" && v("ingreso", "agotado") === "espera" && v("corazon", "fiebre") === "espera");
  check("hoy: un problema de corazón pide el visto bueno del médico; una herida sin cerrar, seguir lo indicado; sin nada, adelante", v("corazon") === "medico" && v("corazon", "mareo") === "medico" && v("ingreso", "herida") === "indicacion" && v("ingreso") === "adelante" && v("vida") === "adelante" && v("vida", "mareo") === "adelante");
  check("las preguntas de «¿cómo está hoy?» dependen del motivo, y la del pecho se hace siempre", V.MOTIVOS.every((m) => V.preguntasHoy(m).some((x) => x.id === "pecho" && x.u)) && V.preguntasHoy("ingreso").some((x) => x.id === "herida") && !V.preguntasHoy("vida").some((x) => x.id === "fiebre" || x.id === "herida"));
  check("pasos atrás en el programa: 0, 1 y 3 según el tiempo, más por infección o ingreso; con más de tres meses, a la semana 1", V.pasosAtras({ motivo: "vida", tiempo: "t1" }) === 0 && V.pasosAtras({ motivo: "vida", tiempo: "t2" }) === 1 && V.pasosAtras({ motivo: "vida", tiempo: "t3" }) === 3 && V.pasosAtras({ motivo: "infeccion", tiempo: "t2" }) === 2 && V.pasosAtras({ motivo: "ingreso", tiempo: "t3" }) === 5 && V.pasosAtras({ motivo: "vida", tiempo: "t4" }) === 12);
  check("semana de la vuelta en la que está, según el día en que la empezó", V.semanaDeVuelta(null, 3) === 0 && V.semanaDeVuelta("2026-11-22", 3, new Date("2026-11-22T10:00")) === 1 && V.semanaDeVuelta("2026-11-22", 3, new Date("2026-11-28T23:00")) === 1 && V.semanaDeVuelta("2026-11-22", 3, new Date("2026-11-29T08:00")) === 2 && V.semanaDeVuelta("2026-11-22", 3, new Date("2027-03-01T08:00")) === 4);
  check("nivel sugerido del programa: suave tras un ingreso, con fragilidad o con más de tres meses; si no, medio", V.nivelSugerido({ motivo: "ingreso", tiempo: "t1" }) === "suave" && V.nivelSugerido({ motivo: "vida", tiempo: "t4" }) === "suave" && V.nivelSugerido({ motivo: "vida", tiempo: "t2", fragil: true }) === "suave" && V.nivelSugerido({ motivo: "infeccion", tiempo: "t3" }) === "medio");
  // el programa de 12 semanas retrocede los pasos pedidos y lo deja apuntado
  G._poner({ ...G.nuevo("medio", new Date("2026-11-02T10:00")), paso: 7 });
  const r = G.retroceder(3, new Date("2026-11-25T10:00"));
  check("programa: retroceder 3 pasos deja la semana 4, cuenta desde este lunes y lo apunta en el historial", r.paso === 4 && r.lunes === "2026-11-23" && r.hist.at(-1).clave === "vuelta" && r.hist.at(-1).paso === 7 && r.hist.at(-1).a === 4 && G.veredicto(r.hist.at(-1)).texto.includes("4") && G.semanaActual(new Date("2026-11-25T10:00")).paso === 4);
  check("programa: no baja de la semana 1 ni hace nada sin programa en marcha o con cero pasos", G.retroceder(40, new Date("2026-11-25T10:00")).paso === 1 && G.retroceder(2, new Date("2026-11-25T10:00")) === null && G.retroceder(0) === null && (G._poner(null), G.retroceder(2)) === null);
  const base = { n: 6, pro: false, edad: 72, crib: "ok", calor: 0, tipoHoy: "fuerza", etiquetaHoy: "Fuerza", hecho: false, mayores: 0, hab: { alcohol: "no", tabaco: "no", cafe: "poco" }, metas: 2, sft: Date.now(), lecciones: 10, copia: Date.now(), hayDiario: true };
  const hace = (d) => { const x = new Date(Date.now() - d * 864e5); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  check("centro: con dos semanas o más sin sesiones propone volver en lugar de la sesión de hoy; con menos, no", C.sugerencias({ ...base, ult: hace(16) })[0].id === "vuelta" && !C.sugerencias({ ...base, ult: hace(16) }).some((s) => s.id === "sesion") && C.sugerencias({ ...base, ult: hace(5) })[0].id === "sesion" && C.sugerencias({ ...base, ult: null })[0].id === "sesion");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos de la interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 55 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("etiquetas de motivos, tiempos y veredictos; textos de lo perdido para cada tiempo; marca de borrador", V.MOTIVOS.every((m) => kEs.has("m_" + m)) && V.TIEMPOS.every((x) => kEs.has("t_" + x) && V.CONT.perdido[x].length > 40) && ["adelante", "espera", "consulta", "medico", "indicacion"].every((k) => kEs.has("v_" + k) && V.CONT.veredicto[k].length > 30) && /vt-borrador">\$\{tx\("borrador"\)\}/.test(src));
  check("tres fuentes con DOI y su frase; cifras de los resúmenes de PubMed (103 estudios; 32 y 15 semanas, 13-26 min; 370 personas, 2,2 puntos de SPPB)", V.FUENTES.length === 3 && V.FUENTES.every((f) => /^10\.\d{4,}\//.test(f.doi) && kEs.has("f_" + f.id)) && /103 estudios/.test(src) && /hasta 32 semanas/.test(src) && /13-26 minutos/.test(src) && /370 personas/.test(src) && /2,2 puntos más de SPPB/.test(src));
  check("módulo registrado; en Mi plan el acceso sale tras diez días sin sesiones", /vuelta: \(\) => import\("\.\/vuelta\.js/.test(appJs) && /Date\.now\(\) - new Date\(diario\.at\(-1\)\.fecha \+ "T12:00"\) >= 10 \* 864e5/.test(appJs) && appJs.includes('data-abre="vuelta"'));
}

console.log("\nLos primeros 14 días (segunda tanda, 13)");
{
  const R = await import(pathToFileURL(path.join(ROOT, "app/js/primeros.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/primeros.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), html = fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 60 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("catorce pasos con identificador único; cada uno con título, explicación y botón", R.PASOS.length === 14 && new Set(R.PASOS.map((p) => p.id)).size === 14 && R.PASOS.every((p) => ["t_", "x_", "b_"].every((k) => kEs.has(k + p.id))));
  check("cada paso lleva a algo que existe: pestaña, bloque, botón, ventana o módulo registrado", R.PASOS.every((p) => { const x = p.ir; return x.tab ? html.includes(`data-tab="${x.tab}"`) : x.clic || x.ver ? html.includes(`id="${(x.clic || x.ver).slice(1)}"`) : x.abre ? new RegExp(`\\n  ${x.abre}: \\(\\) => import\\("\\./${x.abre}\\.js`).test(appJs) : x.attr ? appJs.includes(`[data-${x.attr}]`) : !!(x.ejercicio || x.programa || x.porque); }), R.PASOS.filter((p) => !Object.keys(p.ir).length).map((p) => p.id).join());
  check("los atajos de «Hoy tengo…» que usan los pasos existen (paseo de 5 y fuerza de 10)", /paseo5: \{ min: 5, tipo: "paseo" \}, fuerza10: \{ min: 10, tipo: "fuerza" \}/.test(fs.readFileSync(path.join(ROOT, "app/js/rato.js"), "utf8")));
  check("día del arranque: 0 sin empezar, 1 el primer día y 14 como tope", R.diaDe(null, "2026-11-22") === 0 && R.diaDe("2026-11-22", "2026-11-22") === 1 && R.diaDe("2026-11-22", "2026-11-28") === 7 && R.diaDe("2026-11-22", "2027-01-30") === 14 && R.diaDe("2026-11-22", "2026-11-20") === 0);
  const c0 = { meds: 0, crib: null, sesiones: 0, fuerza: 0, metas: 0, pruebas: 0, pildoras: 0, lecciones: 0, programa: false };
  const hechos = (o, c) => R.PASOS.filter((p) => R.hecho(p, o, c)).map((p) => p.id).join();
  check("nueve pasos se marcan solos con lo que la aplicación ya sabe", hechos(null, c0) === "" && hechos(null, { ...c0, meds: 3 }) === "meds" && hechos(null, { ...c0, crib: "sin_datos" }) === "" && hechos(null, { ...c0, crib: "empezar" }) === "cribado" && hechos(null, { ...c0, sesiones: 1 }) === "paseo" && hechos(null, { ...c0, sesiones: 2, fuerza: 1 }) === "paseo,fuerza" && hechos(null, { ...c0, metas: 1 }) === "metas" && hechos(null, { ...c0, pruebas: 1 }) === "silla" && hechos(null, { ...c0, pildoras: 2 }) === "" && hechos(null, { ...c0, pildoras: 3 }) === "pildoras" && hechos(null, { ...c0, lecciones: 1 }) === "leccion" && hechos(null, { ...c0, programa: true }) === "programa" && R.PASOS.filter((p) => p.auto).length === 9);
  check("todos se pueden marcar a mano, también los que se marcan solos", hechos({ hechos: { informe: "2026-11-22", silla: "2026-11-22" } }, c0) === "informe,silla" && hechos({ hechos: Object.fromEntries(R.PASOS.map((p) => [p.id, "2026-11-22"])) }, c0).split(",").length === 14);
  const r = R.resumen({ inicio: "2026-11-20", hechos: { informe: "2026-11-21" } }, { ...c0, meds: 2, crib: "empezar" }, "2026-11-22");
  check("resumen: cuenta los hechos, propone el primero sin hacer y dice si va al día", r.n === 3 && r.dia === 3 && r.sig.id === "paseo" && r.alDia && !r.completo && !R.resumen({ inicio: "2026-11-10", hechos: {} }, c0, "2026-11-22").alDia);
  const fin = R.resumen({ inicio: "2026-11-01", hechos: Object.fromEntries(R.PASOS.map((p) => [p.id, "2026-11-10"])) }, c0, "2026-11-22");
  check("con los catorce hechos queda completo y sin paso pendiente", fin.completo && fin.n === 14 && fin.sig === null);
  check("no es contenido clínico: no trae cifras, fuentes ni marca de borrador (solo ordena lo que ya hay)", !/doi\.org|borrador|mmHg|\d\s?mg\b/i.test(src));
  const base = { n: 6, pro: false, edad: 72, crib: "ok", calor: 0, tipoHoy: "fuerza", etiquetaHoy: "Fuerza", hecho: false, mayores: 0, hab: { alcohol: "no", tabaco: "no", cafe: "poco" }, metas: 2, sft: Date.now(), lecciones: 10, copia: Date.now(), hayDiario: false, ult: null };
  check("centro: sin diario y sin empezar, lo propone; en curso, dice el día; terminado, con diario o sin el dato, no", C.sugerencias({ ...base, pri: null })[0].id === "primeros" && C.sugerencias({ ...base, pri: { dia: 4 } })[0].titulo.includes("4") && !C.sugerencias({ ...base, pri: "fin" }).some((s) => s.id === "primeros") && !C.sugerencias({ ...base, pri: null, hayDiario: true }).some((s) => s.id === "primeros") && !C.sugerencias(base).some((s) => s.id === "primeros"));
  check("centro: la herramienta está en el catálogo y se encuentra al buscar «empezar»", C.HERRAMIENTAS.some((h) => h.id === "primeros" && h.dv === "primeros" && /empezar/.test(h.p)));
  check("módulo registrado, banda en el panel de hoy y clave en la copia de seguridad", /\n  primeros: \(\) => import\("\.\/primeros\.js/.test(appJs) && /\$\{filaCalor\(\)\}\$\{bandaPrimeros\(diario\)\}/.test(appJs) && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.primeros"'));
}

console.log("\nSu medicación en el cuerpo (segunda tanda, 9)");
{
  const B = await import(pathToFileURL(path.join(ROOT, "app/js/cuerpo.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const O = await import(pathToFileURL(path.join(ROOT, "app/js/ocasional.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/cuerpo.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const senales = datos.kb.senales, enZona = new Set(B.ZONAS.flatMap((z) => z.s));
  check("once zonas con identificador único y su punto dentro de la figura", B.ZONAS.length === 11 && new Set(B.ZONAS.map((z) => z.id)).size === 11 && B.ZONAS.every((z) => z.s.length >= 1 && z.x >= 15 && z.x <= 85 && z.y >= 5 && z.y <= 95));
  const dist = (a, b) => Math.hypot((a.x - b.x) * 2, (a.y - b.y) * 4.4); // la caja mide 200 × 440 unidades
  const cerca = B.ZONAS.flatMap((a, i) => B.ZONAS.slice(i + 1).filter((b) => dist(a, b) < 40).map((b) => `${a.id}-${b.id}`));
  check("los puntos de la figura no se pisan (al menos 40 unidades entre centros)", cerca.length === 0, cerca.join());
  check("todas las señales de las zonas existen en la base", [...enZona].every((s) => typeof senales[s] === "string" && senales[s].length > 5), [...enZona].filter((s) => !senales[s]).join());
  const sueltas = Object.keys(senales).filter((s) => !enZona.has(s) && !B.MARCAS.includes(s));
  check("ninguna señal de la base se queda sin zona (salvo las que solo marcan la familia y el dopaje)", sueltas.length === 0 && B.MARCAS.every((s) => senales[s] && !enZona.has(s)), sueltas.join());
  const lista = ["bisoprolol", "enalapril", "metformina", "acenocumarol", "atorvastatina", "lorazepam", "furosemida"].map((pid) => ({ pid, dosis: null, tomas: 1 }));
  const res = evaluar(datos, lista.filter((m) => indice.porId.has(m.pid)), { edad: 72, condiciones: new Set(["hipertension", "diabetes"]) });
  const m = B.mapa(res.perfil, senales), z = (id) => m.find((x) => x.id === id);
  check("lista de ejemplo: el betabloqueante sale en el corazón, la estatina en el músculo, el anticoagulante en la sangre y el diurético en el riñón", z("corazon").meds.some((x) => x.pid === "bisoprolol") && z("musculo").meds.some((x) => x.pid === "atorvastatina") && z("sangre").meds.some((x) => x.pid === "acenocumarol") && z("rinon").meds.some((x) => x.pid === "furosemida") && z("tendon").meds.length === 0, m.map((x) => `${x.id}:${x.meds.length}`).join(" "));
  check("cada efecto lleva el texto de la base tal cual y sus medicamentos; los de la zona no se repiten", m.every((x) => x.efectos.every((e) => e.texto === senales[e.s] && e.meds.length >= 1) && new Set(x.meds.map((y) => y.pid)).size === x.meds.length && x.meds.length <= x.efectos.reduce((s, e) => s + e.meds.length, 0)));
  check("se abre por la zona con más medicamentos; sin medicación, por ninguna", B.zonaInicial(m) === [...m].sort((a, b) => b.meds.length - a.meds.length)[0].id && B.zonaInicial(B.mapa({}, senales)) === null && B.mapa({}, senales).every((x) => x.meds.length === 0 && x.efectos.length === 0));
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves, y nombre para cada zona`, kEs.size >= 28 && B.ZONAS.every((x) => kEs.has("z_" + x.id)) && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("no trae contenido clínico propio: efectos de kb.senales, cuidados «cuid.*» y enlace al «¿Por qué?»", /texto: senales\[s\]/.test(src) && /t\("cuid\." \+ id\)/.test(src) && /data-porque="\$\{id\}"/.test(src) && !/borrador|doi\.org/i.test(src));
  check("módulo registrado, botón en «Efectos de su medicación» y herramienta en el centro", /\n  cuerpo: \(\) => import\("\.\/cuerpo\.js/.test(appJs) && /data-abre="cuerpo">\$\{t\("cuerpo\.btn"\)\}/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "cuerpo" && h.dv === "cuerpo" && h.meds));
  // arranque más ligero (v1.3.9): la comparación de huellas y la hoja de sugerencias salen del fichero principal
  const d = O.diffHuella(["general|a|alerta|Evite el calor intenso al entrenar", "fuerza|b|info|Texto que se quita"], ["general|a|precaucion|Evite el calor intenso al entrenar fuera", "aerobico|c|info|Texto nuevo del todo"]);
  check("huellas del informe: distingue avisos nuevos, eliminados y modificados", d.total === 3 && d.nuevos.length === 1 && d.eliminados.length === 1 && d.modificados.length === 1 && d.modificados[0].antes.includes("alerta") && O.diffHuella(["x|y|z|igual"], ["x|y|z|igual"]).total === 0);
  check("el aviso de cambios de la base y la hoja de sugerencias ya no están en el fichero principal", !/function diffHuella|function contextoTecnico|function textoInforme|const FB_TIPOS/.test(appJs) && /O\.diffHuella\(/.test(appJs) && /O\.abrirFeedback\(apiFb\(\), o\)/.test(appJs) && typeof O.avisoKb === "function" && typeof O.contextoTecnico === "function" && typeof O.datosFeedback === "function");
}

console.log("\nMis preguntas para la consulta (segunda tanda, 11)");
{
  const Q = await import(pathToFileURL(path.join(ROOT, "app/js/preguntas.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/preguntas.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), html = fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8"), css = fs.readFileSync(path.join(ROOT, "app/css/style.css"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`textos en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 65 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }), ["en", "ca", "gl", "eu"].map((lg) => `${lg}:${claves(lg).size}`).join(" "));
  check("cada pregunta por efecto usa señales que existen en la base y tiene su texto", Q.POR_SENAL.length >= 18 && Q.POR_SENAL.every(([id, ss, pr]) => kEs.has("q_" + id) && ss.every((s) => datos.kb.senales[s]) && pr > 30 && pr < 90));
  const it = (pid, nombre, senales, alerta = false) => ({ pid, nombre, senales, alerta });
  const ctx = { items: [it("bisoprolol", "Bisoprolol", ["bradicardia", "fc_no_valida", "hipotension", "enmascara_hipoglucemia"]), it("gliclazida", "Gliclazida", ["hipoglucemia"], true), it("acenocumarol", "Acenocumarol", ["sangrado", "caidas"], true), it("lorazepam", "Lorazepam", ["sedacion", "caidas"], true), it("furosemida", "Furosemida", ["deshidratacion", "hipotension", "hipopotasemia"])],
    inter: [{ a: "Bisoprolol", b: "Gliclazida", pa: "bisoprolol", pb: "gliclazida", nivel: "moderada" }, { a: "Acenocumarol", b: "Ibuprofeno", pa: "acenocumarol", pb: "ibuprofeno", nivel: "mayor" }, { a: "A", b: "B", pa: "a", pb: "b", nivel: "menor" }, { a: "C", b: "D", pa: "c", pb: "d", nivel: "moderada" }, { a: "E", b: "F", pa: "e", pb: "f", nivel: "moderada" }],
    habitos: { alcohol: "diario", tabaco: "si", cafe: "poco" }, crib: "valoracion_antes", caidas: false, n: 5 };
  const P = Q.generar(ctx), ids = P.map((q) => q.id), txt = P.map(Q.texto);
  check("salen las preguntas que tocan: cribado, azúcar, síntomas ocultos, pulso, mareo, golpes, sueño, caídas, calor y agua, análisis, alcohol y tabaco", ["empezar_valoracion", "azucar", "azucar_oculta", "pulso", "mareo", "golpes", "sueno", "caidas", "calor_agua", "analisis", "alcohol", "tabaco", "poli", "hora", "parar", "que_ejercicio", "suplementos"].every((id) => ids.includes(id)) && !ids.includes("cafeina") && !ids.includes("tendon") && !ids.includes("empezar_intenso"), ids.join());
  check("nombran los medicamentos (hasta tres) y no dejan huecos sin rellenar", txt.every((x) => !/[{}]/.test(x) && x.length > 25) && txt.find((x) => /azúcar antes/.test(x)).includes("Gliclazida") && txt.find((x) => /el pulso no me sirve/.test(x)).includes("Bisoprolol") && /Bisoprolol y Furosemida/.test(txt.find((x) => /me mareo/.test(x))));
  check("avisos importantes: como mucho dos; combinaciones: como mucho tres, las mayores primero y sin las menores", ids.filter((x) => x.startsWith("aviso:")).length === 2 && ids.filter((x) => x.startsWith("ddi:")).join() === "ddi:acenocumarol+ibuprofeno,ddi:bisoprolol+gliclazida,ddi:c+d" && /Acenocumarol e Ibuprofeno a la vez/.test(txt[ids.indexOf("ddi:acenocumarol+ibuprofeno")]));
  check("van por grupos (antes de empezar, medicación, combinaciones, hábitos, generales) y, dentro, por importancia", P.every((q, i) => i === 0 || Q.GRUPOS.indexOf(q.g) > Q.GRUPOS.indexOf(P[i - 1].g) || (q.g === P[i - 1].g && q.pr <= P[i - 1].pr)) && new Set(ids).size === ids.length);
  const sug = Q.sugeridas(P);
  check("sugeridas: tres, las de más peso y de tipos distintos (no dos avisos ni dos combinaciones)", sug.length === 3 && sug[0] === "empezar_valoracion" && new Set(sug.map((id) => P.find((q) => q.id === id).base)).size === 3, sug.join());
  const sin = Q.generar({ items: [], inter: [], habitos: {}, crib: null, caidas: true, n: 0 });
  check("sin medicación quedan las generales, y con caídas marcadas pregunta por ellas sin nombrar ninguno", sin.length === 7 && sin.some((q) => q.id === "caidas" && q.base === "caidas0") && sin.every((q) => !/[{}]/.test(Q.texto(q))), sin.map((q) => q.id).join());
  check("ya hace ejercicio moderado y tiene enfermedad: pregunta por el intenso; mucho café, por la cafeína", Q.generar({ ...ctx, crib: "valoracion_vigoroso", habitos: { cafe: "mucho" } }).some((q) => q.id === "empezar_intenso") && Q.generar({ ...ctx, habitos: { cafe: "mucho", alcohol: "no", tabaco: "dejado" } }).filter((q) => q.g === "habitos").map((q) => q.id).join() === "cafeina");
  const el = Q.elegidas(P, { sel: ["mareo", "azucar", "no_existe"], propias: [{ t: "¿Puedo nadar?", s: true }, { t: "Otra", s: false }] });
  check("la hoja lleva primero las propias marcadas y después las elegidas por importancia", el.length === 3 && el[0] === "¿Puedo nadar?" && /azúcar/.test(el[1]) && /mareo/.test(el[2]));
  const plano = Q.textoPlano(el, ["Bisoprolol 5 mg", "Gliclazida 30 mg"]);
  check("texto para compartir: título, preguntas numeradas y, si se pide, la medicación", plano.startsWith("Mis preguntas para la consulta\n\n1. ¿Puedo nadar?") && /\n3\. /.test(plano) && /Mi medicación:\n- Bisoprolol 5 mg\n- Gliclazida 30 mg$/.test(plano) && !/Mi medicación/.test(Q.textoPlano(el)));
  check("son preguntas, no consejos: todas llevan interrogación y ninguna da una orden ni una cifra", [...kEs].filter((k) => k.startsWith("q_")).every((k) => /\?/.test(Q.tx(k))) && !/\d\s?(mg|mmHg|lpm)|borrador/i.test(src));
  check("módulo registrado, botón en «Llévese este informe», herramienta en el centro y clave en la copia de seguridad", /\n  preguntas: \(\) => import\("\.\/preguntas\.js/.test(appJs) && /class="btn-doc" data-abre="preguntas"><b data-i18n="preg\.btn">/.test(html) && C.HERRAMIENTAS.some((h) => h.id === "preguntas" && h.g === "consulta") && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.preguntas"'));
  const altas = ["biblioteca", "cuerpo", "dolor", "paseo", "preguntas", "primeros", "programa", "rato", "vuelta"];
  check("las ventanas de la segunda tanda tienen un único desplazamiento (cuerpo flexible bajo la cabecera)", /dialog\.alta\[open\] \{ display: flex; flex-direction: column; overflow: hidden;/.test(css) && /dialog\.alta > \.ficha-cuerpo \{ flex: 1 1 auto; min-height: 0; max-height: none;/.test(css) && altas.every((m) => { const f = fs.readFileSync(path.join(ROOT, `app/js/${m}.js`), "utf8"); return /className = "ficha alta [a-z]+-dlg"/.test(f) && !/max-height: calc\(100dvh - 110px\)/.test(f); }));
}

console.log("\nMitos sobre medicación y ejercicio (segunda tanda, 12)");
{
  const M = await import(pathToFileURL(path.join(ROOT, "app/js/mitos.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/mitos.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), i18nJs = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 15 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  check("doce mitos con identificador único, veredicto, explicación, qué hacer, tipo de estudio y fuente", M.MITOS.length === 12 && new Set(M.MITOS.map((m) => m.id)).size === 12 && M.MITOS.every((m) => ["falso", "medias"].includes(m.v) && m.mito.length > 30 && m.x.length > 150 && m.hacer.length > 20 && m.tipo.length > 15 && m.f.length >= 1 && typeof m.aplica === "function"));
  check("todas las fuentes tienen DOI y se usan; la única sin resumen en PubMed lo dice", Object.values(M.FUENTES).every((f) => /^10\.\d{4,}\/\S+$/.test(f.doi) && f.cita.length > 15) && Object.keys(M.FUENTES).every((k) => M.MITOS.some((m) => m.f.includes(k))) && M.MITOS.every((m) => m.f.every((k) => M.FUENTES[k])) && Object.entries(M.FUENTES).filter(([, f]) => f.sinResumen).map(([k]) => k).join() === "colberg");
  const cif = (id, ...res) => { const m = M.MITOS.find((x) => x.id === id); return res.every((r) => r.test(m.x)); };
  check("cifras de los resúmenes de PubMed (comprobadas el 22/11/2026)", cif("betabloqueante", /52 personas/, /10,6 mmHg/, /18 %/) && cif("anticoagulante", /988 personas/, /3,1 por cada 100/, /11,6/) && cif("aine", /89 corredores/, /52 % frente a 34 %/, /400 mg cada 4 horas/) && cif("tension", /391 ensayos/) && cif("osteoporosis", /101 mujeres/, /2,9 %/, /1,2 %/) && cif("antidepresivo", /218 ensayos/, /14 170/) && cif("benzodiacepina", /248 estudios/, /1,42/, /1,81/) && cif("metformina", /94 personas/, /53 personas/, /14 semanas/) && cif("fragilidad", /100 personas/, /87 años/, /113 %/, /11,8 %/) && cif("dejar", /98 personas/, /73,5 %/, /26,4 %/));
  check("los estudios de observación y los límites se dicen: no demuestran causa, confianza baja, sin significación", /estudio de observación: no demuestra/.test(src) && /confianza en estos resultados es baja/.test(src) && /no alcanzó la significación estadística/.test(src) && /no pueden descartar/.test(src) && /ningún ensayo los comparó cara a cara/.test(src));
  check("ningún mito invita a dejar la medicación: los que la mencionan remiten al médico", ["metformina", "dejar", "tension", "antidepresivo", "benzodiacepina"].every((id) => /médico/.test(M.MITOS.find((m) => m.id === id).hacer)) && /Nunca deje ni baje un medicamento por su cuenta/.test(src));
  const d = (o = {}) => ({ clases: new Set(o.clases || []), senales: new Set(o.senales || []), conds: new Set(o.conds || []), edad: o.edad ?? 60, n: o.n ?? 1 });
  check("los que le tocan salen primero: por familia, por efecto, por situación clínica o por edad", M.propios(d({ clases: ["betabloqueantes", "anticoagulantes"], senales: ["estatina"] })).join() === "betabloqueante,estatina,anticoagulante" && M.propios(d({ senales: ["hipoglucemia", "aine"] })).join() === "insulina,aine" && M.propios(d({ conds: ["osteoporosis", "hipertension"] })).join() === "tension,osteoporosis" && M.propios(d({ clases: ["benzodiacepinas", "isrs_isrsn", "metformina"], edad: 80 })).join() === "antidepresivo,benzodiacepina,metformina,fragilidad" && M.propios(d({ n: 6 })).join() === "fragilidad" && M.propios(d()).length === 0);
  check("las familias y señales que se miran existen en la base", ["betabloqueantes", "estatinas", "anticoagulantes", "bifosfonatos", "osteoporosis_anabolicos", "isrs_isrsn", "triciclicos", "otros_antidepresivos", "otros_antidepresivos_2", "benzodiacepinas", "hipnoticos_z", "metformina"].every((c) => src.includes(`"${c}"`) && datos.kb.clases.some((x) => x.id === c)) && ["estatina", "hipoglucemia", "aine", "ieca_ara", "diuretico"].every((s) => datos.kb.senales[s]));
  const r = M.recuento();
  check("recuento de veredictos: diez falsos y dos a medias", r.falso === 10 && r.medias === 2);
  check("los cuidados añadidos y los «¿Por qué?» enlazados existen en el diccionario", M.MITOS.every((m) => (!m.cuid || i18nJs.includes(`"cuid.${m.cuid}"`)) && (!m.pq || i18nJs.includes(`"pq.b.${m.pq}"`))) && M.MITOS.filter((m) => m.cuid).length >= 6);
  check("lleva la marca de borrador y avisa de que no se cambie la medicación por lo leído", /mit-borrador">\$\{tx\("borrador"\)\}/.test(src) && /no cambie su medicación por lo que lea aquí/.test(src));
  const cierres = [...fs.readdirSync(path.join(ROOT, "app/js")).filter((f) => f.endsWith(".js")).map((f) => fs.readFileSync(path.join(ROOT, "app/js", f), "utf8")), fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8")].flatMap((x) => [...x.matchAll(/id="([a-z0-9]+-cerrar)"/g)].map((m) => m[1]));
  check(`ninguna ventana repite el identificador de su botón de cerrar (${cierres.length} ventanas)`, cierres.length >= 30 && new Set(cierres).size === cierres.length, cierres.filter((x, i) => cierres.indexOf(x) !== i).join());
  check("módulo registrado, herramienta en el centro y clave en la copia de seguridad", /\n  mitos: \(\) => import\("\.\/mitos\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "mitos" && h.g === "entender") && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.mitos"'));
}

console.log("\n«De cada 100 personas…» (segunda tanda, 10)");
{
  const N = await import(pathToFileURL(path.join(ROOT, "app/js/cien.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/cien.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 22 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  const caja = (id) => N.CAJAS.find((c) => c.id === id), n = (id, i = 0) => N.numeros(caja(id).filas[i]);
  check("seis cajas, cada una con a quién se refiere, filas, notas, tipo de estudio y fuente con DOI", N.CAJAS.length === 6 && new Set(N.CAJAS.map((c) => c.id)).size === 6 && N.CAJAS.every((c) => /^De cada 100 personas/.test(c.quien) && c.filas.length >= 1 && c.notas.length >= 2 && c.tipo.length > 15 && /^10\.\d{4,}\/\S+$/.test(c.f.doi) && c.con.length > 10 && typeof c.aplica === "function"));
  check("cada fila guarda las cifras del estudio y enseña su redondeo a personas enteras", N.CAJAS.every((c) => c.filas.every((f) => f.ex.length > 5 && (f.dif != null ? f.dif > 0 && f.dif < 100 : f.x.length === 2 && f.x.every((v) => v >= 0 && v <= 100)))) && n("caidas").sin === 48 && n("caidas").con === 41 && n("caidas").dif === 7 && n("ic").sin === 24 && n("ic").con === 17 && n("ic", 1).sin === 11 && n("ic", 1).con === 7 && n("ic", 2).sin === 6 && n("ic", 2).con === 5 && n("fa").sin === 20 && n("fa").con === 40 && n("fa").mas && n("dm2").sin === 26 && n("dm2").con === 74 && n("prediabetes").sin === 11 && n("prediabetes").con === 5);
  check("cifras de los resúmenes de PubMed (comprobadas el 22/11/2026)", /480 y 408 de cada 1000/.test(src) && /850 por cada 1000 personas sin ejercicio y 655 con ejercicio, 195 menos/.test(src) && /23,7 % y 16,5 %/.test(src) && /11,1 % y 7,1 %/.test(src) && /5,8 % y 5,1 %/.test(src) && /por cada 12 personas \(riesgo relativo 0,58\)/.test(src) && /por cada 75 personas \(riesgo relativo 0,72\)/.test(src) && /26,4 % y 73,5 %/.test(src) && /11,0 y 4,8 casos por 100 personas y año/.test(src) && /fueron 8 \(7,8\)/.test(src) && /\(6,9\)/.test(src) && /3234 personas/.test(src) && /108 ensayos \(23 407 personas\)/.test(src) && /44 ensayos \(5783 personas\)/.test(src) && /85 ensayos \(23 430 personas\)/.test(src));
  check("la cardiopatía isquémica solo enseña la diferencia (la revisión no da cada grupo) y lo explica", n("ci").solo && n("ci").dif === 8 && n("ci", 1).dif === 1 && /no las cifras de cada grupo/.test(caja("ci").notas[0]) && N.lectura(caja("ci").filas[0]) === "8 menos de cada 100.");
  check("la frase de lectura: evitan, consiguen o sin diferencia clara", N.lectura(caja("caidas").filas[0]) === "7 de cada 100 lo evitan." && N.lectura(caja("fa").filas[0]) === "20 más de cada 100 lo consiguen." && N.lectura(caja("ic").filas[2]) === "Sin diferencia clara." && N.lectura(caja("prediabetes").filas[0]) === "6 de cada 100 lo evitan.");
  check("lo que no cambia, los efectos no deseados y los límites van en cada caja", /apenas cambia: la calidad de vida/.test(src) && /Efectos no deseados: casi siempre leves/.test(src) && /Efectos no deseados: 32 en el grupo de ejercicio/.test(src) && /Es un solo ensayo, con 120 personas/.test(src) && /no se puede separar cuánto se debe a cada cosa/.test(src) && /puede deberse al azar/.test(src));
  const d = (o = {}) => ({ conds: new Set(o.conds || []), edad: o.edad ?? 50, caidas: !!o.caidas });
  check("las cajas de su situación salen primero: por edad o caídas y por situación clínica; la de evitar la diabetes, con obesidad y sin diabetes", N.propias(d()).length === 0 && N.propias(d({ edad: 70 })).join() === "caidas" && N.propias(d({ caidas: true })).join() === "caidas" && N.propias(d({ conds: ["insuficiencia_cardiaca", "cardiopatia_isquemica", "fibrilacion_auricular"] })).join() === "ic,ci,fa" && N.propias(d({ conds: ["obesidad"] })).join() === "prediabetes" && N.propias(d({ conds: ["obesidad", "diabetes"] })).join() === "dm2");
  const pts = (si, dif, mas) => { const s = N.puntos(si, dif, mas); return [(s.match(/<circle/g) || []).length, (s.match(/cn-p-si/g) || []).length, (s.match(/cn-p-dif/g) || []).length, (s.match(/cn-p-no/g) || []).length].join(); };
  check("el dibujo tiene siempre 100 puntos: llenos, en anillo (la diferencia) y apagados", pts(48, 0) === "100,48,0,52" && pts(41, 7) === "100,41,7,52" && pts(0, 8) === "100,0,8,92" && pts(20, 20, true) === "100,20,20,60" && /cn-p-si mas/.test(N.puntos(1, 0, true)));
  check("lleva la marca de borrador y recuerda que son medias de grupos", /cn-borrador">\$\{tx\("borrador"\)\}/.test(src) && /nadie puede saber si usted será una de esas personas/.test(src));
  check("módulo registrado, herramienta en el centro y botón en «Lo que el ejercicio hace por usted»", /\n  cien: \(\) => import\("\.\/cien\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "cien" && h.g === "entender") && /data-abre="cien">\$\{t\("cien\.btn"\)\}/.test(fs.readFileSync(path.join(ROOT, "app/js/beneficios.js"), "utf8")));
}

console.log("\nNúmeros antes de entrenar (segunda tanda, 17)");
{
  const U = await import(pathToFileURL(path.join(ROOT, "app/js/numeros.js")).href);
  const K = await import(pathToFileURL(path.join(ROOT, "app/js/constantes.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/numeros.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), css = fs.readFileSync(path.join(ROOT, "app/css/style.css"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 22 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  const fg = K.franjas("glucosa"), ft = K.franjas("ta");
  check("la glucosa y la tensión sistólica usan los mismos umbrales que «Mis constantes» (ya revisados)", U.UMBRALES.glucosa.baja === fg[0][1] && U.UMBRALES.glucosa.justa === fg[1][1] && U.UMBRALES.glucosa.alta === fg[2][1] && U.UMBRALES.ta_s.baja === ft[0][1] && U.UMBRALES.ta_s.media === ft[1][1] && U.UMBRALES.ta_s.alta === ft[2][1] && U.UMBRALES.glucosa.rev && U.UMBRALES.ta_s.rev);
  const regla = datos.kb.clases.find((c) => c.id === "insulina").general[0].texto;
  check("la glucosa con insulina sigue la regla de la base (90, 125 y 250 mg/dL, 10–20 g y cetonas)", /Por debajo de 90 mg\/dL: tome 10–20 g/.test(regla) && /Entre 90 y 125: tome 10 g/.test(regla) && /Por encima de 250: compruebe cetonas; con cetonas o malestar, no entrene y consulte/.test(regla) && U.UMBRALES.glucosa.aerobico === 125 && /Tome 10–20 g de hidratos de absorción rápida/.test(U.CONT.g_justa_hipo) && /Tome 10 g de hidratos si va a hacer ejercicio aeróbico/.test(U.CONT.g_bien_125) && /Compruebe cetonas; con cetonas o malestar, no entrene y consulte/.test(U.CONT.g_alta_hipo));
  check("los umbrales nuevos están marcados como pendientes de revisión", ["ta_d", "pulso", "spo2", "temp"].every((k) => U.UMBRALES[k].rev === false) && U.UMBRALES.ta_d.alta === 110 && U.UMBRALES.pulso.muy_alto === 120 && U.UMBRALES.spo2.muy_baja === 88 && U.UMBRALES.temp.fiebre === 38 && /Son NUEVOS y están por revisar/.test(src));
  const e = (v, d = {}) => { const r = U.evaluar(v, d); return r.nivel + ":" + r.lineas.map((l) => l.clave).join(","); };
  check("glucosa con insulina o sulfonilureas: menos de 70 hoy no; 70–89 espere; 90–125 con 10 g; 126–250 adelante; más de 250 suave", e({ glucosa: 62 }, { hipo: true }) === "rojo:g_baja_hipo" && e({ glucosa: 70 }, { hipo: true }) === "ambar:g_justa_hipo" && e({ glucosa: 89 }, { hipo: true }) === "ambar:g_justa_hipo" && e({ glucosa: 90 }, { hipo: true }) === "verde:g_bien_125" && e({ glucosa: 125 }, { hipo: true }) === "verde:g_bien_125" && e({ glucosa: 126 }, { hipo: true }) === "verde:g_bien" && e({ glucosa: 250 }, { hipo: true }) === "verde:g_bien" && e({ glucosa: 251 }, { hipo: true }) === "ambar:g_alta_hipo");
  check("glucosa sin esos fármacos: de 70 a 250 adelante; fuera, suave", e({ glucosa: 65 }) === "ambar:g_baja" && e({ glucosa: 82 }) === "verde:g_bien" && e({ glucosa: 250 }) === "verde:g_bien" && e({ glucosa: 300 }) === "ambar:g_alta");
  check("tensión: 180 o 110 hoy no; 160 o 100 suave; sistólica por debajo de 90 suave; lo demás, adelante; vale con una sola cifra", e({ ta_s: 180, ta_d: 80 }) === "rojo:t_alta" && e({ ta_s: 150, ta_d: 110 }) === "rojo:t_alta" && e({ ta_s: 160 }) === "ambar:t_media" && e({ ta_s: 140, ta_d: 100 }) === "ambar:t_media" && e({ ta_s: 89 }) === "ambar:t_baja" && e({ ta_s: 90, ta_d: 60 }) === "verde:t_bien" && e({ ta_s: 159, ta_d: 99 }) === "verde:t_bien" && e({ ta_d: 85 }) === "verde:t_bien");
  check("pulso en reposo: 120 o más y menos de 40, hoy no; 100–119 suave; 40–49 suave, o adelante si su medicación lo frena", e({ pulso: 120 }) === "rojo:p_muy_alto" && e({ pulso: 119 }) === "ambar:p_alto" && e({ pulso: 100 }) === "ambar:p_alto" && e({ pulso: 99 }) === "verde:p_bien" && e({ pulso: 50 }) === "verde:p_bien" && e({ pulso: 49 }) === "ambar:p_bajo" && e({ pulso: 49 }, { bb: true }) === "verde:p_bajo_bb" && e({ pulso: 39 }, { bb: true }) === "rojo:p_muy_bajo");
  check("saturación: por debajo de 88 hoy no; 88–91 suave con enfermedad respiratoria y hoy no sin ella; desde 92 adelante", e({ spo2: 87 }, { resp: true }) === "rojo:s_muy_baja" && e({ spo2: 88 }, { resp: true }) === "ambar:s_baja_resp" && e({ spo2: 91 }) === "rojo:s_baja" && e({ spo2: 92 }) === "verde:s_bien");
  check("temperatura: 38 o más hoy no (24–48 h sin fiebre, como en la base); 37,5–37,9 suave", e({ temp: 38 }) === "rojo:f_fiebre" && e({ temp: 37.9 }) === "ambar:f_decimas" && e({ temp: 37.4 }) === "verde:f_bien" && /24–48 horas sin fiebre y retome a intensidad baja/.test(U.CONT.f_fiebre) && /descanse hasta 24–48 h sin fiebre y retome a intensidad baja/.test(JSON.stringify(datos.kb.clases.find((c) => c.id === "antibioticos_comunes").general)));
  check("manda el peor número, y sin números no hay veredicto", e({ glucosa: 140, ta_s: 130, pulso: 64, spo2: 97, temp: 36.5 }).startsWith("verde:") && e({ glucosa: 140, ta_s: 165, pulso: 64 }).startsWith("ambar:") && e({ glucosa: 140, ta_s: 165, temp: 38.5 }).startsWith("rojo:") && U.evaluar({}).nivel === null && U.evaluar({ glucosa: "", ta_s: null }).nivel === null);
  const emitidas = new Set([...src.matchAll(/pon\("[a-z_0-9]+", "(?:verde|ambar|rojo)", "([a-z_0-9]+)"\)/g)].map((m) => m[1]));
  check(`cada resultado tiene su texto (${emitidas.size}) y los tres veredictos, el suyo`, emitidas.size >= 22 && [...emitidas].every((k) => typeof U.CONT[k] === "string" && U.CONT[k].length > 8) && ["verde", "ambar", "rojo"].every((k) => U.CONT.veredicto[k].length > 20 && kEs.has("v_" + k)));
  check("solo acepta números posibles", U.valido("glucosa", 140) && !U.valido("glucosa", 9999) && !U.valido("spo2", 101) && U.valido("temp", "36.6") && !U.valido("temp", 30) && !U.valido("pulso", "abc") && Object.keys(U.RANGOS).join() === "glucosa,ta_s,ta_d,pulso,spo2,temp");
  check("propone mirar la glucosa con diabetes o fármacos que la bajan, la tensión con hipertensión o fármacos que la bajan y la saturación con enfermedad respiratoria o insuficiencia cardiaca", U.recomendados({}).length === 0 && U.recomendados({ hipo: true }).join() === "glucosa" && U.recomendados({ diabetes: true, hipotension: true, resp: true }).join() === "glucosa,ta,spo2" && U.recomendados({ hta: true, ic: true }).join() === "ta,spo2");
  check("lleva la marca de borrador, la lista de alarma de la aplicación y sus fuentes", /nm-borrador">\$\{tx\("borrador"\)\}/.test(src) && /ALARMA\.map/.test(src) && U.FUENTES.length === 4 && /si se encuentra mal, no entrene aunque salgan bien/.test(U.CONT.nota));
  check("módulo registrado, herramienta en el centro, enlace en el chequeo de la sesión y clave en la copia de seguridad", /\n  numeros: \(\) => import\("\.\/numeros\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "numeros" && h.dv === "numeros") && /data-abre="numeros">\$\{t\("numeros\.btn"\)\}/.test(fs.readFileSync(path.join(ROOT, "app/js/sesion.js"), "utf8")) && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.numeros"'));
  check("las ventanas altas no dejan que se desplace la ventana entera (cuerpo como bloque de referencia y recorte)", /dialog\.alta\[open\] \{ display: flex; flex-direction: column; overflow: hidden; overflow: clip; \}/.test(css) && /dialog\.alta > \.ficha-cuerpo \{ flex: 1 1 auto; min-height: 0; max-height: none; position: relative; \}/.test(css));
}

console.log("\nPlan para los días de enfermedad (segunda tanda, 18)");
{
  const S = await import(pathToFileURL(path.join(ROOT, "app/js/enfermedad.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/enfermedad.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 25 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  check("los seis grupos de la tarjeta, en su orden (iSGLT2, IECA y ARA-II juntos, diuréticos, metformina, antiinflamatorios), cada uno con su motivo; las sulfonilureas, aparte", S.GRUPOS.map((g) => g.id).join() === "isglt2,ieca,diuretico,metformina,aine" && S.GRUPOS.every((g) => g.nombre.length > 8 && g.porque.length > 30 && typeof g.es === "function") && S.SULFONILUREAS.id === "sulfonilurea" && /mirando la glucosa/.test(S.SULFONILUREAS.porque));
  check("las familias y señales que se miran existen en la base", ["isglt2", "metformina", "sulfonilureas", "insulina"].every((c) => datos.kb.clases.some((x) => x.id === c)) && ["ieca_ara", "diuretico", "aine"].every((s) => datos.kb.senales[s] && datos.kb.clases.some((c) => (c.senales || []).includes(s))));
  const ev = (pids) => evaluar(datos, pids.filter((pid) => indice.porId.has(pid)).map((pid) => ({ pid, dosis: null, tomas: 1 })), { edad: 70, condiciones: new Set() }).items;
  const pl = S.plan(ev(["empagliflozina", "enalapril", "losartan", "furosemida", "hidroclorotiazida", "espironolactona", "metformina", "ibuprofeno", "gliclazida", "insulina_basal", "bisoprolol", "atorvastatina"]));
  const de = (id) => (pl.grupos.find((g) => g.id === id)?.meds || []).join("+");
  check("reparte la lista: gliflozina, IECA y sartán, los tres tipos de diurético, metformina e ibuprofeno; el betabloqueante y la estatina no entran", de("isglt2") === "Empagliflozina" && /Enalapril/.test(de("ieca")) && /Losartán|Losartan/.test(de("ieca")) && /Furosemida/.test(de("diuretico")) && /Hidroclorotiazida/.test(de("diuretico")) && /Espironolactona/.test(de("diuretico")) && de("metformina") === "Metformina" && de("aine") === "Ibuprofeno" && !JSON.stringify(pl.grupos).includes("Bisoprolol") && !JSON.stringify(pl.grupos).includes("Atorvastatina"), pl.grupos.map((g) => g.id + ":" + g.meds.join("+")).join(" "));
  check("las sulfonilureas van aparte, la insulina solo se señala y se cuentan los medicamentos distintos", pl.sulfonilureas.join() === "Gliclazida" && pl.insulina === true && pl.n === 8 && !pl.grupos.some((g) => g.meds.includes("Gliclazida")));
  const vacio = S.plan(ev(["paracetamol", "omeprazol"]));
  check("con una lista sin ninguno de esos fármacos no sale ningún grupo", vacio.grupos.length === 0 && vacio.sulfonilureas.length === 0 && !vacio.insulina && vacio.n === 0 && S.plan([]).n === 0);
  check("cifras de la pauta escocesa (versión 4, 2026): dos o más veces, 24–48 horas, sin dosis de más y 72 horas", /\(dos o más veces\)/.test(S.CONT.que_es) && /no unas décimas/.test(S.CONT.que_es) && /24–48 horas comiendo y bebiendo con normalidad/.test(S.CONT.retomar) && /no tome dosis de más/.test(S.CONT.retomar) && /más de 72 horas/.test(S.CONT.consultar) && /versión 4 \(2026\)/.test(S.FUENTES[0].txt) && /^https:\/\/www\.healthcareimprovementscotland\.scot\//.test(S.FUENTES[0].url));
  check("nunca indica dejar un medicamento por cuenta propia: es una pauta que se pacta", /se acuerda de antemano con su médico, enfermera o farmacéutico/.test(S.CONT.pacto) && /No la aplique por su cuenta/.test(S.CONT.pacto) && /Acordado con mi médico/.test(src) && /sd-pacto">\$\{CONT\.pacto\}/.test(src));
  check("avisos propios: cetoacidosis con iSGLT2, cautela en la insuficiencia cardiaca y la insulina no se toca", /cetoacidosis aunque el azúcar esté normal/.test(S.CONT.isglt2_aviso) && /insuficiencia cardiaca moderada o grave/.test(S.CONT.ic) && /no habla de la insulina: no la cambie sin las instrucciones/.test(S.CONT.insulina));
  check("dice lo que se sabe de su eficacia (Watson 2022: 74 documentos, sin beneficio demostrado) y el descanso con fiebre de la base", /revisión de 74 documentos/.test(S.CONT.sabe) && /ninguno que lo demostrara/.test(S.CONT.sabe) && S.FUENTES[1].doi === "10.1016/j.xkme.2022.100491" && /24–48 horas sin fiebre, a intensidad baja/.test(S.CONT.ejercicio));
  check("lleva la marca de borrador y la hoja para imprimir distingue lo acordado de lo que hay que preguntar", /sd-borrador">\$\{tx\("borrador"\)\}/.test(src) && kEs.has("hoja_pausar") && kEs.has("hoja_preguntar") && /sd-imprime/.test(src));
  check("módulo registrado, herramienta en el centro y clave en la copia de seguridad", /\n  enfermedad: \(\) => import\("\.\/enfermedad\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "enfermedad" && h.g === "consulta") && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.enfermedad"'));
}

console.log("\nPanel de caídas y carga anticolinérgica (segunda tanda, 14)");
{
  const F = await import(pathToFileURL(path.join(ROOT, "app/js/frid.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/frid.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 40 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  check("las 14 clases de STOPPFall (Seppala 2021), cada una con su forma de reconocerla en la base", F.STOPPFALL.length === 14 && F.STOPPFALL.map((c) => c.id).join() === "bzd,z,antipsicoticos,opioides,antidepresivos,anticolinergicos,antiepilepticos,diureticos,alfa_hta,alfa_prostata,centrales,antihistaminicos,vasodilatadores,vejiga" && F.STOPPFALL.every((c) => c.n.length > 6 && ((c.clases || []).length || (c.pids || []).length || c.senal)));
  const porClase = new Map(datos.kb.clases.map((c) => [c.id, c])), deClase = (c) => [...new Set([...(c.clases || []).flatMap((k) => (porClase.get(k)?.principios || []).map((x) => x.id)), ...(c.pids || []), ...(c.senal ? datos.kb.clases.filter((x) => (x.senales || []).includes(c.senal)).flatMap((x) => x.principios.map((y) => y.id)) : [])])];
  const todos = F.STOPPFALL.flatMap(deClase);
  check("cada familia, principio y señal de la asignación existe en la base, y ningún principio cae en dos clases", F.STOPPFALL.every((c) => (c.clases || []).every((k) => porClase.has(k)) && (c.pids || []).every((k) => indice.porId.has(k)) && (!c.senal || datos.kb.senales[c.senal])) && new Set(todos).size === todos.length && todos.length > 90, String(todos.length));
  const nCals = (n) => Object.values(F.CALS).filter((x) => x === n).length;
  check("escala CRIDECO: los 100 principios puntuados existen en la base (15 con 3 puntos, 12 con 2 y 73 con 1) y el umbral es 3", Object.keys(F.CALS).length === 100 && Object.keys(F.CALS).every((k) => indice.porId.has(k)) && nCals(3) === 15 && nCals(2) === 12 && nCals(1) === 73 && F.UMBRAL_CALS === 3 && Object.keys(F.CALS_GRUPO).every((k) => F.CALS[k] === 1), Object.keys(F.CALS).filter((k) => !indice.porId.has(k)).join());
  check("puntuaciones de referencia: amitriptilina, oxibutinina e hidroxizina 3; quetiapina, tramadol y paroxetina 2; lorazepam, furosemida y metformina 1; sin puntos, paracetamol y bisoprolol", ["amitriptilina", "oxibutinina", "hidroxizina"].every((k) => F.CALS[k] === 3) && ["quetiapina", "tramadol", "paroxetina"].every((k) => F.CALS[k] === 2) && ["lorazepam", "furosemida", "metformina"].every((k) => F.CALS[k] === 1) && F.CALS.paracetamol === undefined && F.CALS.bisoprolol === undefined);
  const ev = (pids) => evaluar(datos, pids.filter((pid) => indice.porId.has(pid)).map((pid) => ({ pid, dosis: null, tomas: 1 })), { edad: 80, condiciones: new Set() }).items;
  const P = F.panel(ev(["lorazepam", "zolpidem", "quetiapina", "tramadol", "amitriptilina", "furosemida", "tamsulosina", "oxibutinina", "bisoprolol", "atorvastatina", "paracetamol", "acenocumarol"]));
  const de = (id) => (P.stopp.find((c) => c.id === id)?.meds || []).map((m) => m.nombre).join("+");
  check("reparte la lista en sus clases (ocho fármacos en ocho clases); el betabloqueante, la estatina, el paracetamol y el anticoagulante no entran", P.nFrid === 8 && P.stopp.map((c) => c.id).join() === "bzd,z,antipsicoticos,opioides,antidepresivos,diureticos,alfa_prostata,vejiga" && de("bzd") === "Lorazepam" && de("z") === "Zolpidem" && de("opioides") === "Tramadol" && de("diureticos") === "Furosemida" && !/Bisoprolol|Atorvastatina|Paracetamol|Acenocumarol/.test(JSON.stringify(P.stopp)), P.stopp.map((c) => c.id + ":" + c.meds.map((m) => m.nombre).join("+")).join(" "));
  check("carga anticolinérgica: suma 3 + 3 + 2 + 2 + 1 + 1 = 12, de más a menos, y es relevante", P.cals.total === 12 && P.cals.relevante === true && P.cals.filas.map((f) => f.s).join("") === "332211" && P.cals.filas[0].nombre === "Amitriptilina" && P.cals.filas.length === 6, JSON.stringify(P.cals.filas.map((f) => [f.nombre, f.s])));
  check("umbral: 2 puntos no es relevante y 3 sí", F.panel(ev(["quetiapina"])).cals.total === 2 && F.panel(ev(["quetiapina"])).cals.relevante === false && F.panel(ev(["quetiapina", "lorazepam"])).cals.total === 3 && F.panel(ev(["quetiapina", "lorazepam"])).cals.relevante === true);
  check("sedantes, hipotensores y anticolinérgicos salen de las señales revisadas de la base; los anticoagulantes, de su familia", ["sedacion", "hipotension", "anticolinergico"].every((x) => datos.kb.senales[x]) && P.sedantes.includes("Lorazepam") && P.sedantes.includes("Zolpidem") && !P.sedantes.includes("Bisoprolol") && P.hipotensores.includes("Bisoprolol") && P.hipotensores.includes("Furosemida") && !P.hipotensores.includes("Paracetamol") && P.anticol.includes("Oxibutinina") && P.anticoag.join() === "Acenocumarol");
  const nada = F.panel(ev(["paracetamol", "omeprazol"]));
  check("con una lista sin ninguno de esos fármacos no sale nada", nada.nFrid === 0 && nada.stopp.length === 0 && nada.cals.total === 0 && !nada.cals.relevante && nada.sedantes.length === 0 && F.panel([]).nFrid === 0);
  const g = (id) => F.STOPPFALL.find((c) => c.id === id);
  check("guía de retirada (tabla 2): escalonada «en general, sí» en benzodiacepinas, Z, antipsicóticos, opioides y antidepresivos; «no hace falta» en los alfabloqueantes de próstata; el resto, valorar; los anticolinérgicos no tienen fila", ["bzd", "z", "antipsicoticos", "opioides", "antidepresivos"].every((x) => g(x).escal === "si") && g("alfa_prostata").escal === "no" && ["antiepilepticos", "diureticos", "alfa_hta", "centrales", "antihistaminicos", "vasodilatadores", "vejiga"].every((x) => g(x).escal === "valorar") && !g("anticolinergicos").cuando && !g("anticolinergicos").escal && F.STOPPFALL.filter((c) => c.cuando && c.vigilar).length === 13);
  check("cuándo plantear la retirada y qué vigilar, como en el artículo", /somnolencia de día, deterioro cognitivo o torpeza psicomotora/.test(g("bzd").cuando) && /ansiedad, insomnio y agitación/.test(g("bzd").vigilar) && /hiponatremia/.test(g("antidepresivos").cuando) && /posiblemente, incontinencia urinaria/.test(g("diureticos").cuando) && /insuficiencia cardiaca, hipertensión y signos de retención/.test(g("diureticos").vigilar) && /QT largo/.test(g("vejiga").cuando) && /angina de pecho/.test(g("vasodilatadores").vigilar) && /dolor crónico/.test(g("opioides").indic));
  check("diferencias dentro de la clase (tabla 1): opioides potentes, tricíclicos, diuréticos del asa, antihistamínicos de primera generación, antiepilépticos antiguos y alfabloqueantes no selectivos", /potentes, más que los débiles/.test(g("opioides").dif) && /tricíclicos, más que el resto/.test(g("antidepresivos").dif) && /del asa, más que el resto/.test(g("diureticos").dif) && /primera generación, más que los de segunda/.test(g("antihistaminicos").dif) && /antiguas, más que los nuevos/.test(g("antiepilepticos").dif) && /no selectivos, más que los selectivos/.test(g("alfa_prostata").dif));
  check("dice sus límites (consenso de expertos, efecto por evaluar, asignación de la aplicación, sin dosis) y lo que vale para todas las clases", /consenso de 24 expertos/.test(F.LIMITES[0]) && /está por evaluar/.test(F.LIMITES[0]) && /no valoró las dosis/.test(F.LIMITES[1]) && /la hace esta aplicación/.test(F.LIMITES[2]) && /217 fármacos/.test(F.LIMITES[3]) && /no hay indicación o existe una alternativa más segura/.test(F.SIEMPRE.retirar) && /más del 70 %/.test(F.SIEMPRE.nota));
  check("fuentes con DOI: STOPPFall (Age Ageing 2021) y CRIDECO (J Pers Med 2022)", F.FUENTES.length === 2 && F.FUENTES[0].doi === "10.1093/ageing/afaa249" && F.FUENTES[1].doi === "10.3390/jpm12020207" && /doi\.org\/\$\{f\.doi\}/.test(src));
  const txt = F.textoHistoria(P);
  check("el texto para la historia lleva las clases con sus fármacos, la carga y los sedantes", /STOPPFall: Benzodiacepinas: Lorazepam;/.test(txt) && /CALS: 12 \(clínicamente relevante/.test(txt) && /Amitriptilina 3/.test(txt) && /Con efecto sedante: /.test(txt) && txt.split("\n").length === 4, txt);
  check("lleva la marca de borrador, cada fármaco lleva al simulador y es herramienta solo del modo profesional", /fr-borrador">\$\{tx\("borrador"\)\}/.test(src) && /data-simula="\$\{esc\(m\.pid\)\}"/.test(src) && /\n  frid: \(\) => import\("\.\/frid\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "frid" && h.g === "consulta" && h.pro === true) && /<button[^>]*class="[^"]*solo-pro[^"]*"[^>]*id="btn-frid"[^>]*data-abre="frid"/.test(fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8")));
}

console.log("\nEscalas rápidas (segunda tanda, 15)");
{
  const E = await import(pathToFileURL(path.join(ROOT, "app/js/escalas.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/escalas.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 30 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  check("cuatro escalas: FRAIL (5 preguntas), SARC-F (5), tres preguntas de caídas y constante vital de actividad", E.ESCALAS.map((e) => `${e.id}:${e.items.length}:${e.max}`).join() === "frail:5:5,sarcf:5:10,caidas:3:3,pavs:3:null" && E.ESCALAS.every((e) => e.items.every((it) => it.q.length > 15 && (it.tipo || it.o.length >= 2))) && Object.keys(E.CATEGORIAS).join() === "frail,sarcf,caidas,pavs");
  const p = (id, r) => E.puntuar(id, r);
  const F0 = { fatiga: 4, resistencia: 1, deambulacion: 1, peso: 1, enfermedades: [] };
  check("FRAIL (Morley 2012): cansancio «todo» o «la mayor parte del tiempo» puntúa; «parte del tiempo», no", p("frail", { ...F0, fatiga: 0 }).p === 1 && p("frail", { ...F0, fatiga: 1 }).p === 1 && p("frail", { ...F0, fatiga: 2 }).p === 0 && p("frail", { ...F0, fatiga: 3 }).p === 0 && p("frail", F0).p === 0);
  check("FRAIL: las enfermedades puntúan desde 5 de 11, y cada «sí» de escalones, caminar y peso suma 1", E.ENFERMEDADES.length === 11 && p("frail", { ...F0, enfermedades: [0, 1, 2, 3] }).p === 0 && p("frail", { ...F0, enfermedades: [0, 1, 2, 3, 4] }).p === 1 && p("frail", { ...F0, resistencia: 0 }).p === 1 && p("frail", { ...F0, deambulacion: 0 }).p === 1 && p("frail", { ...F0, peso: 0 }).p === 1);
  check("FRAIL: 0 robusto, 1–2 prefrágil, 3–5 frágil, con los rasgos que puntúan", p("frail", F0).cat === "robusto" && p("frail", { ...F0, peso: 0 }).cat === "prefragil" && p("frail", { ...F0, peso: 0, resistencia: 0 }).cat === "prefragil" && p("frail", { ...F0, peso: 0, resistencia: 0, deambulacion: 0 }).cat === "fragil" && p("frail", { fatiga: 0, resistencia: 0, deambulacion: 0, peso: 0, enfermedades: [0, 1, 2, 3, 4, 5] }).p === 5 && p("frail", { ...F0, peso: 0, resistencia: 0 }).positivos.join() === "Resistencia,Pérdida de peso");
  check("sin todas las respuestas no hay resultado y dice cuántas faltan (la lista de enfermedades no cuenta como pendiente)", p("frail", {}).completo === false && p("frail", {}).faltan === 4 && p("frail", { fatiga: 4 }).faltan === 3 && p("sarcf", { fuerza: 0 }).faltan === 4 && p("caidas", {}).faltan === 3 && p("frail", {}).cat === null);
  const S0 = { fuerza: 0, andar: 0, silla: 0, escaleras: 0, caidas: 0 };
  check("SARC-F (Malmstrom 2016): cinco preguntas de 0 a 2, máximo 10; desde 4 sugiere sarcopenia", p("sarcf", S0).p === 0 && p("sarcf", { fuerza: 2, andar: 2, silla: 2, escaleras: 2, caidas: 2 }).p === 10 && p("sarcf", { ...S0, fuerza: 2, andar: 1 }).cat === "bajo" && p("sarcf", { ...S0, fuerza: 2, andar: 1 }).p === 3 && p("sarcf", { ...S0, fuerza: 2, andar: 2 }).cat === "alto" && /4,5 kg/.test(E.escala("sarcf").items[0].q) && E.escala("sarcf").items[4].o.map((o) => o[0]).join("|") === "Ninguna|De 1 a 3|4 o más");
  check("caídas (STEADI): un «sí» basta para el riesgo aumentado; tres «no», sin riesgo; si preocupa caerse se enlaza la FES-I sin reproducirla", p("caidas", { inestable: 1, miedo: 1, caido: 1 }).cat === "no" && p("caidas", { inestable: 0, miedo: 1, caido: 1 }).cat === "riesgo" && p("caidas", { inestable: 1, miedo: 0, caido: 1 }).extra.miedo === true && E.textos("caidas", p("caidas", { inestable: 1, miedo: 0, caido: 1 })).some((x) => /Short FES-I/.test(x)) && !E.textos("caidas", p("caidas", { inestable: 0, miedo: 1, caido: 1 })).some((x) => /Short FES-I/.test(x)) && /aquí no se reproduce/.test(E.CONT.caidas.miedo) && E.URL_FESI === "https://sites.manchester.ac.uk/fes-i/");
  check("actividad: días × minutos frente a 150; 0 días no pide los minutos; un número imposible no da resultado", p("pavs", { dias: "3", min: "40" }).p === 120 && p("pavs", { dias: "3", min: "40" }).cat === "insuficiente" && p("pavs", { dias: "3", min: "40" }).extra.falta === 30 && p("pavs", { dias: "5", min: "30" }).cat === "cumple" && p("pavs", { dias: "0" }).cat === "inactivo" && p("pavs", { dias: "9", min: "30" }).completo === false && p("pavs", { dias: "3" }).faltan === 1 && p("pavs", { dias: "3", min: "abc" }).completo === false && E.META_PAVS === 150);
  check("la pregunta de fuerza es opcional y se compara con 2 días (OMS 2020)", E.textos("pavs", p("pavs", { dias: "5", min: "30", fuerza: "2" })).includes(E.CONT.pavs.fuerza_si) && E.textos("pavs", p("pavs", { dias: "5", min: "30", fuerza: "1" })).includes(E.CONT.pavs.fuerza_no) && !E.textos("pavs", p("pavs", { dias: "5", min: "30" })).some((x) => /fuerza/.test(x)) && E.META_FUERZA === 2 && /86 minutos menos/.test(E.CONT.pavs.corta) && E.textos("pavs", p("pavs", { dias: "3", min: "40" }))[0].includes("Le faltan 30 minutos"));
  check("cada resultado completo tiene su texto y recuerda que es un cribado; incompleto, ninguno", ["frail", "sarcf", "caidas"].every((id) => Object.keys(E.CATEGORIAS[id]).every((c) => E.CONT[id][c].length > 60)) && E.textos("frail", p("frail", F0)).at(-1) === E.CONT.cribado && E.textos("frail", p("frail", {})).length === 0 && /puede frenar su avance/.test(E.CONT.frail.prefragil) && /EWGSOP2/.test(E.CONT.sarcf.alto) && /por sí solo no bastó/.test(E.CONT.sarcf.bajo));
  check("fuentes con DOI de cada escala (y la guía de los CDC con su dirección)", E.FUENTES.frail[0].doi === "10.1007/s12603-012-0084-2" && E.FUENTES.sarcf[0].doi === "10.1002/jcsm.12048" && E.FUENTES.sarcf.some((f) => f.doi === "10.1093/ageing/afy169") && /^https:\/\/www\.cdc\.gov\/steadi\//.test(E.FUENTES.caidas[0].url) && E.FUENTES.caidas.some((f) => f.doi === "10.1093/ageing/afac205") && E.FUENTES.pavs.map((f) => f.doi).join() === "10.1123/jpah.7.5.571,10.5888/pcd13.150228,10.1136/bjsports-2020-102955" && Object.values(E.FUENTES).flat().every((f) => f.doi || f.url));
  const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
  const r1 = E.guardar("frail", p("frail", { ...F0, peso: 0 }), "2026-11-20"), r2 = E.guardar("frail", p("frail", F0), "2026-11-20"), r3 = E.guardar("frail", p("frail", { ...F0, peso: 0, resistencia: 0, deambulacion: 0 }), "2026-11-22");
  check("guarda el último resultado: el del mismo día se sustituye y el de otro día pasa a «la vez anterior»", r1.p === 1 && !r1.ant && r2.p === 0 && !r2.ant && r3.p === 3 && r3.ant.p === 0 && r3.ant.f === "2026-11-20" && E.leer().frail.cat === "fragil" && Object.keys(E.leer()).join() === "frail");
  E.guardar("pavs", p("pavs", { dias: "3", min: "40", fuerza: "1" }), "2026-11-22");
  check("línea para la historia: puntuación, categoría, rasgos que puntúan y fecha", E.lineaHistoria("frail", E.leer().frail) === "FRAIL: 3/5 (frágil): resistencia, deambulación, pérdida de peso · 22/11/2026" && E.lineaHistoria("pavs", E.leer().pavs) === "Constante vital de actividad física: 120 min/semana de actividad moderada o intensa (por debajo de 150 minutos); fuerza 1 días/semana · 22/11/2026", E.lineaHistoria("frail", E.leer().frail));
  E.borrar("frail"); E.borrar("pavs");
  check("borrar el último resultado no deja nada guardado", mem["medex.escalas"] === undefined && Object.keys(E.leer()).length === 0);
  delete globalThis.localStorage;
  check("lleva la marca de borrador, no usa manejadores en línea y dice que las preguntas son traducción propia", /eq-borrador">\$\{tx\("borrador"\)\}/.test(src) && !/onsubmit=|onclick=/.test(src) && (src.match(/style="/g) || []).length === 2 /* solo el arco del anillo y el ancho de la barra de minutos (adornos, v1.3.21) */ && kEs.has("traduccion"));
  check("módulo registrado, herramienta en el centro, botón en los datos y clave en la copia de seguridad", /\n  escalas: \(\) => import\("\.\/escalas\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "escalas" && h.g === "seguir" && !h.pro) && /id="btn-escalas"[^>]*data-abre="escalas"/.test(fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8")) && fs.readFileSync(path.join(ROOT, "app/js/ocasional.js"), "utf8").includes('"medex.escalas"'));
}

console.log("\nReceta de ejercicio por enfermedad (segunda tanda, 16)");
{
  const R = await import(pathToFileURL(path.join(ROOT, "app/js/receta.js")).href);
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const src = fs.readFileSync(path.join(ROOT, "app/js/receta.js"), "utf8"), appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), es = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const claves = (lg) => new Set([...src.split(`\n  ${lg}: {`)[1].split("\n  },")[0].matchAll(/(?:^|[ ,{])([a-z_0-9]+): "/g)].map((m) => m[1]));
  const kEs = claves("es");
  check(`interfaz en cinco idiomas con las mismas ${kEs.size} claves`, kEs.size >= 25 && ["en", "ca", "gl", "eu"].every((lg) => { const k = claves(lg); return k.size === kEs.size && [...kEs].every((x) => k.has(x)); }));
  const CONDS ="diabetes insuficiencia_cardiaca renal marcapasos osteoporosis epoc_asma oxigeno embarazo hipertension cardiopatia_isquemica fibrilacion_auricular aneurisma_aorta ictus cancer artrosis epilepsia hepatopatia obesidad".split(" ");
  check("las 18 situaciones clínicas de la aplicación, cada una con su nombre en el diccionario", R.SITUACIONES.map((s) => s.id).join() === CONDS.join() && R.SITUACIONES.every((s) => es.includes(`"${s.k}":`)));
  check("cada regla que se muestra existe en la base y está revisada; solo el riñón no tiene regla propia (su dosis sale de KDIGO 2024)", R.SITUACIONES.every((s) => s.reglas.every((r) => { const x = datos.kb.reglas_combinadas.find((y) => y.id === r); return x && x.revisado !== false && x.texto.length > 60; })) && R.SITUACIONES.filter((s) => !s.reglas.length).map((s) => s.id).join() === "renal" && R.situacion("renal").f === "kdigo");
  check("la tabla general es la de la OMS 2020: 150–300 minutos (o 75–150 intensa), fuerza al menos 2 días y equilibrio 3 o más desde los 65", /150–300 minutos a la semana \(o 75–150 si es intensa\)/.test(R.BASE.aer.t) && /Al menos 2 días/.test(R.BASE.fue.f) && /3 o más días a la semana, desde los 65 años/.test(R.BASE.eq.f) && R.FUENTES.oms.doi === "10.1136/bjsports-2020-102955");
  const celda = (id, fila, col) => R.tabla(id).find((r) => r.fila === fila)?.celdas.find((c) => c.col === col);
  check("cada situación tiene su tabla FITT (aeróbico, fuerza y equilibrio; en el embarazo, sin equilibrio) y en todas cambia alguna celda", CONDS.every((id) => { const tb = R.tabla(id); return tb.length === (id === "embarazo" ? 2 : 3) && tb.every((r) => r.celdas.length === 4 && r.celdas.every((c) => c.txt.length > 0)) && tb.some((r) => r.celdas.some((c) => c.propio)); }) && R.tabla("nada").length === 0);
  check("hipertensión (Pescatello 2004): la mayoría de los días, moderada (40–<60 % de la reserva), 30 minutos o más al día y fuerza de complemento sin cargas máximas", celda("hipertension", "aer", "f").txt === "La mayoría de los días, mejor todos" && /40–<60 %/.test(celda("hipertension", "aer", "i").txt) && /30 minutos o más al día/.test(celda("hipertension", "aer", "t").txt) && /sin cargas máximas/.test(celda("hipertension", "fue", "i").txt) && R.situacion("hipertension").f === "pescatello" && /22 horas/.test(R.situacion("hipertension").notas[0].x[0]));
  check("obesidad (Donnelly 2009): 150–250 minutos para no ganar peso y más de 250 para perderlo; riñón (KDIGO 2024): al menos 150 o hasta donde tolere", /150–250 minutos a la semana para no ganar peso; más de 250/.test(celda("obesidad", "aer", "t").txt) && celda("obesidad", "fue", "f").txt === "2–3 días a la semana" && /Al menos 150 minutos a la semana, o hasta donde lo permita su tolerancia/.test(celda("renal", "aer", "t").txt) && R.FUENTES.kdigo.doi === "10.1016/j.kint.2023.10.018");
  check("las celdas que restringen salen de la regla revisada: aneurisma (carga ligera que fija el cardiólogo), cáncer (3 × 30 y 2 de fuerza), FA (el pulso no sirve), embarazo (150 minutos, sin contacto)", /la fija su cardiólogo o cirujano vascular/.test(celda("aneurisma_aorta", "fue", "i").txt) && /fijar su cardiólogo o cirujano vascular/.test(datos.kb.reglas_combinadas.find((x) => x.id === "aneurisma_aorta").texto) && celda("cancer", "aer", "f").txt === "3 sesiones a la semana" && celda("cancer", "aer", "t").txt === "30 minutos por sesión" && /3 sesiones aeróbicas de 30 minutos y 2 de fuerza/.test(datos.kb.reglas_combinadas.find((x) => x.id === "cancer_cond").texto) && /el pulso no sirve/.test(celda("fibrilacion_auricular", "aer", "i").txt) && celda("embarazo", "aer", "t").txt === "150 minutos a la semana" && /150 min\/semana/.test(datos.kb.reglas_combinadas.find((x) => x.id === "embarazo").texto));
  check("si la situación fija su intensidad, el tiempo general ya no ofrece la variante «intensa»", celda("aneurisma_aorta", "aer", "t").txt === R.T_SIN_INTENSA && celda("insuficiencia_cardiaca", "aer", "t").txt === "150–300 minutos a la semana" && !celda("aneurisma_aorta", "aer", "t").propio && /o 75–150/.test(celda("diabetes", "aer", "t").txt) && /o 75–150/.test(celda("artrosis", "aer", "t").txt));
  const ev = (pids, conds) => evaluar(datos, pids.filter((pid) => indice.porId.has(pid)).map((pid) => ({ pid, dosis: null, tomas: 1 })), { edad: 70, condiciones: new Set(conds) }).combinadas;
  const rd = R.reglasDe("diabetes", datos.kb, ev(["bisoprolol", "metformina", "insulina_basal"], ["diabetes"]));
  check("«lo específico» es el texto de la base tal cual, con su fuente; «en su caso, además», las reglas que han saltado con su lista", rd.propias.length === 1 && rd.propias[0].texto === datos.kb.reglas_combinadas.find((x) => x.id === "diabetes_pies").texto && /ADA/.test(rd.propias[0].fuente) && rd.ademas.length >= 1 && rd.ademas.every((x) => x.id !== "diabetes_pies" && x.texto.length > 40) && rd.ademas.some((x) => /^(diabetes_bb|bb_hipoglucemia)$/.test(x.id)), rd.ademas.map((x) => x.id).join());
  check("sin lista no hay «además», y las reglas de otra situación no se cuelan", R.reglasDe("diabetes", datos.kb, []).ademas.length === 0 && R.reglasDe("artrosis", datos.kb, ev(["bisoprolol", "metformina", "insulina_basal"], ["diabetes"])).ademas.length === 0 && R.reglasDe("marcapasos", datos.kb).propias.map((x) => x.id).join() === "marcapasos_fc,dai_fc");
  check("lo que añade la guía propia lleva su fuente comprobada: diabetes (Kanaley 2022), osteoporosis (Brooke-Wavell 2022), cáncer (Campbell 2019), embarazo (Mottola 2018)", R.situacion("diabetes").notas[0].f === "kanaley" && /pausas activas frecuentes/.test(R.situacion("diabetes").notas[0].x.join(" ")) && R.situacion("osteoporosis").notas[0].f === "brooke" && /caminar a paso ligero/.test(R.situacion("osteoporosis").notas[0].x.join(" ")) && R.situacion("cancer").notas[0].f === "campbell" && /Evite la inactividad/.test(R.situacion("cancer").notas[0].x[0]) && R.situacion("embarazo").notas[0].f === "mottola" && R.SITUACIONES.every((s) => (s.notas || []).every((n) => R.FUENTES[n.f] && n.x.length)));
  check("cada situación cita la OMS, su guía propia si la tiene y a Pedersen y Saltin; todas las fuentes llevan DOI", CONDS.every((id) => { const f = R.fuentesDe(id); return f[0] === R.FUENTES.oms && f.at(-1) === R.FUENTES.pedersen && f.every((x) => /^10\.\d{4}/.test(x.doi)); }) && R.fuentesDe("obesidad").includes(R.FUENTES.donnelly) && R.fuentesDe("artrosis").length === 2 && Object.keys(R.FUENTES).length === 9);
  check("la hoja lleva las situaciones marcadas y la que se está viendo, sin repetir", R.paraHoja(["diabetes", "hipertension"], "hipertension").join() === "diabetes,hipertension" && R.paraHoja(["diabetes"], "artrosis").join() === "diabetes,artrosis" && R.paraHoja([], null).length === 0);
  check("lleva la marca de borrador, las señales de alarma de la base y el aviso de que lo específico manda", /rx-borrador">\$\{tx\("borrador"\)\}/.test(src) && /import \{ ALARMA \} from "\.\/engine\.js/.test(src) && kEs.has("manda") && /no sustituye la valoración de su médico/.test(src));
  check("módulo registrado, herramienta en el centro y botón bajo la situación clínica", /\n  receta: \(\) => import\("\.\/receta\.js/.test(appJs) && C.HERRAMIENTAS.some((h) => h.id === "receta" && h.g === "moverse" && !h.pro) && /id="btn-receta"[^>]*data-abre="receta"/.test(fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8")));
}

console.log("\nEnciclopedia pública «X y ejercicio» (segunda tanda, 19)");
{
  const dir = path.join(ROOT, "app/enciclopedia"), fich = fs.readdirSync(dir).filter((f) => f.endsWith(".html")), lee = (f) => fs.readFileSync(path.join(dir, f), "utf8");
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const pids = datos.kb.clases.flatMap((c) => c.principios.map((p) => p.id)), arch = (pid) => pid.replaceAll("_", "-") + ".html";
  check(`una página por principio (${pids.length}), 18 de situación y el índice`, fich.length === pids.length + 19 && pids.every((p) => fich.includes(arch(p))) && fich.filter((f) => f.startsWith("situacion-")).length === 18 && fich.includes("index.html"));
  const todo = Object.fromEntries(fich.map((f) => [f, lee(f)]));
  check("está generada con la versión actual de la base (si cambia kb.json, repetir scripts/build_enciclopedia.py)", fich.every((f) => todo[f].includes(`<meta name="pa-base" content="${datos.kb.version}">`)));
  const b = todo["bisoprolol.html"], clase = datos.kb.clases.find((c) => c.id === "betabloqueantes"), txt = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const propias = (c, pid) => ["general", "aerobico", "fuerza", "equilibrio"].flatMap((a) => (c[a] || []).filter((r) => r.revisado === true && (!r.si?.principio || r.si.principio === pid)));
  check("página de un fármaco: título, descripción, dirección canónica, marcas, el resumen de su familia y todas sus reglas revisadas, cada una con su fuente", /<title>Bisoprolol y ejercicio físico: qué tener en cuenta · Pauta Activa<\/title>/.test(b) && /<meta name="description" content="Bisoprolol \(Emconcor, Euradal\) y ejercicio: /.test(b) && b.includes('<link rel="canonical" href="https://medicacionyejercicio.fuerzabasadaenevidencia.com/enciclopedia/bisoprolol.html">') && b.includes("También como: Emconcor, Euradal") && txt(b).includes(clase.resumen) && (b.match(/class="regla /g) || []).length === propias(clase, "bisoprolol").length && propias(clase, "bisoprolol").every((r) => txt(b).includes(r.texto) && txt(b).includes("Fuente: " + r.fuente)));
  check("en todas las páginas de principio están todas sus reglas revisadas y ninguna de otro principio de la familia", datos.kb.clases.every((c) => c.principios.every((p) => { const h = todo[arch(p.id)], mias = propias(c, p.id), ajenas = ["general", "aerobico", "fuerza", "equilibrio"].flatMap((a) => (c[a] || []).filter((r) => r.si?.principio && r.si.principio !== p.id)); return (h.match(/class="regla /g) || []).length === mias.length && mias.every((r) => txt(h).includes(r.texto)) && ajenas.every((r) => mias.some((m) => m.texto === r.texto) || !txt(h).includes(r.texto)); })));
  check("en las familias que agrupan productos distintos, la descripción para el buscador es la del propio producto (coenzima Q10), no la de otro de la familia", /content="Coenzima Q10 \(ubiquinona, ubiquinol\) y ejercicio: La coenzima Q10 se tolera bien/.test(todo["coenzima-q10.html"]) && !/levadura roja contiene/.test(todo["coenzima-q10.html"].match(/<meta name="description" content="([^"]*)"/)[1]));
  check("cada página de principio invita a abrir la aplicación con ese medicamento y cita la ficha técnica si la hay", pids.every((p) => todo[arch(p)].includes(`href="../#farmaco=${p}"`)) && /Ficha técnica de Bisoprolol \(AEMPS, CIMA\)/.test(b) && Object.keys(datos.fichas || {}).length >= 0);
  const hta = todo["situacion-hipertension.html"];
  check("páginas de situación: la regla revisada de la base tal cual, lo que se cruza con la medicación y el enlace a su receta", txt(hta).includes(datos.kb.reglas_combinadas.find((r) => r.id === "hipertension_cond").texto) && hta.includes('href="../#abre=receta:hipertension"') && /Y según su medicación/.test(hta) && fich.filter((f) => f.startsWith("situacion-")).every((f) => (todo[f].match(/class="regla /g) || []).length >= 1 && /href="\.\.\/#abre=receta:[a-z_]+"/.test(todo[f])));
  check("sin restos de plantilla, sin borradores y sin contenido de los módulos pendientes de revisión", fich.every((f) => !/undefined|\{e\(|>None<|[Bb]orrador|pendiente de revisi/.test(todo[f])));
  check("datos estructurados válidos (JSON-LD) con autor y, en cada ficha, fecha de revisión y de qué trata", fich.every((f) => { const m = todo[f].match(/<script type="application\/ld\+json">(.*?)<\/script>/s); try { const j = JSON.parse(m[1]); return j["@context"] === "https://schema.org" && j.author?.name === "Pelayo Fernández Cidón" && (f === "index.html" ? j["@type"] === "CollectionPage" : j["@type"] === "MedicalWebPage" && j.lastReviewed === datos.kb.fecha && ["Drug", "DietarySupplement", "MedicalCondition"].includes(j.about["@type"])); } catch { return false; } }));
  check("cada página tiene un único h1, descripción de 60 a 160 caracteres, idioma y pie con el aviso de la base", fich.every((f) => { const h = todo[f], d = txt(h.match(/<meta name="description" content="([^"]*)"/)?.[1] || ""); return (h.match(/<h1>/g) || []).length === 1 && d.length >= 60 && d.length <= 160 && h.includes('<html lang="es">') && txt(h).includes(datos.kb.aviso); }), fich.filter((f) => { const d = txt(todo[f].match(/<meta name="description" content="([^"]*)"/)?.[1] || ""); return d.length < 60 || d.length > 160; }).slice(0, 4).join());
  const idx = todo["index.html"], enlaces = [...idx.matchAll(/<li data-b="[^"]*"(?: data-f="[^"]*")?><a href="([^"]+)"/g)].map((m) => m[1]);
  check("el índice enlaza todas las páginas una vez, trae buscador y cuenta bien fármacos, suplementos y plantas", enlaces.length === fich.length - 1 && new Set(enlaces).size === enlaces.length && enlaces.every((f) => fich.includes(f)) && idx.includes('<script src="enc.js?v=') && /<li><b>388<\/b> principios activos<\/li><li><b>53<\/b> suplementos y plantas<\/li><li><b>18<\/b> situaciones clínicas<\/li>/.test(idx));
  check("cabecera de noche en todas las páginas (miga, un único título y entradilla); el índice lleva dentro el buscador, y cada letra, su recuento", fich.every((f) => /<div class="hero"><div>\s*<p class="miga">[\s\S]*?<h1>[\s\S]*?<\/div><\/div>\s*<main>/.test(todo[f])) && /<div class="hero">[\s\S]*id="q"[\s\S]*<\/div><\/div>\s*<main>/.test(idx) && [...idx.matchAll(/<h2 class="letra">\S <small>(\d+)<\/small><\/h2>/g)].reduce((a, m) => a + Number(m[1]), 0) === pids.length && (idx.match(/<i class="tp">/g) || []).length === 53);
  const sm = fs.readFileSync(path.join(ROOT, "app/sitemap.xml"), "utf8"), robots = fs.readFileSync(path.join(ROOT, "app/robots.txt"), "utf8");
  check("el mapa del sitio lleva las 460 direcciones, una vez cada una, y son indexables", (sm.match(/\/enciclopedia\//g) || []).length === fich.length && fich.every((f) => sm.includes(f === "index.html" ? "/enciclopedia/</loc>" : `/enciclopedia/${f}</loc>`)) && /Allow: \//.test(robots) && fich.every((f) => !/noindex/.test(todo[f])));
  const appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), sw = fs.readFileSync(path.join(ROOT, "app/sw.js"), "utf8");
  check("la aplicación atiende los enlaces de entrada (#farmaco= y #abre=), sin recorrido de bienvenida, y enlaza la enciclopedia desde el menú y el centro", /location\.hash\.match\(\/\^#\(farmaco\|abre\)=/.test(appJs) && /!h && !he\) setTimeout\(iniciarTour/.test(appJs) && /href="enciclopedia\/" data-i18n="cab\.enciclopedia"/.test(fs.readFileSync(path.join(ROOT, "app/index.html"), "utf8")) && C.HERRAMIENTAS.some((h) => h.id === "enciclopedia" && h.url === "enciclopedia/"));
  check("la enciclopedia no entra en la precarga (se guarda al visitarla) y su hoja de estilos es propia y pequeña", !sw.includes("enciclopedia") && fs.statSync(path.join(dir, "enc.css")).size < 11000 &&fs.statSync(path.join(dir, "enc.js")).size < 1500);
}

console.log("\nContenido clínico en inglés (segunda tanda, 20)");
{
  const CO = await import(pathToFileURL(path.join(ROOT, "app/js/contenido.js")).href);
  const { MODS, cadenas } = await import(pathToFileURL(path.join(ROOT, "scripts/contenido_modulos.mjs")).href);
  const D = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/en/contenido.json"), "utf8")), mem = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/trad_en/memoria.json"), "utf8"));
  const AMB = ["general", "aerobico", "fuerza", "equilibrio"], pares = Object.values(mem), igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  check("la huella del texto es la misma en el navegador y en el generador (FNV-1a de 32 bits sobre UTF-8)", CO.huella("") === "811c9dc5" && CO.huella("a") === "e40c292c" && Object.entries(mem).every(([k, v]) => CO.huella(v.es) === k));
  const motivos = (x) => ["evitar", "preferir"].flatMap((l) => (x.horario?.[l] || []).map((h) => h.motivo));
  const enUso = new Set([kb.aviso, ...Object.values(kb.niveles).map((n) => n.etiqueta), ...Object.values(kb.senales), ...kb.clases.flatMap((c) => [c.nombre, c.resumen, ...AMB.flatMap((a) => (c[a] || []).map((r) => r.texto)), ...motivos(c), ...c.principios.flatMap((p) => [p.nombre, p.nota, ...motivos(p)])]), ...kb.reglas_combinadas.flatMap((r) => [r.titulo, r.texto]), ...ddiCurado.interacciones.flatMap((x) => [x.efecto, x.accion])].filter((s) => typeof s === "string" && s.trim()));
  const en = (s) => D.h[CO.huella(s)] || D.s[CO.huella(s)]; // h: textos; s: palabras sueltas (solo donde el código las pide)
  const sin = [...enUso].filter((s) => !en(s));
  check(`está montado con la versión actual de la base y traduce sus textos (${enUso.size - sin.length} de ${enUso.size}; si cambia kb.json, repetir scripts/contenido_en.py)`, D.version === kb.version && sin.length <= enUso.size * 0.02 && D.n === Object.keys(D.h).length + Object.keys(D.s).length, sin.slice(0, 3).join(" | "));
  const deMods = new Set(); for (const m of MODS) for (const s of cadenas(await import(pathToFileURL(path.join(ROOT, "app/js", m + ".js")).href))) deMods.add(s);
  const sinMod = [...deMods].filter((s) => !en(s));
  check(`y el contenido de los ${MODS.length} módulos que se abren con data-abre (${deMods.size - sinMod.length} de ${deMods.size} textos)`, deMods.size > 450 && sinMod.length <= deMods.size * 0.02, sinMod.slice(0, 3).join(" | "));
  const nums = (s) => (s.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(",", ".")).sort().join(), marc = (s) => (s.match(/\{[a-z_0-9]+\}/g) || []).sort().join();
  const malos = pares.filter((v) => nums(v.es) !== nums(v.en) || marc(v.es) !== marc(v.en) || !v.en.trim());
  check(`cada traducción conserva las cifras y los marcadores del original (${pares.length} textos)`, pares.length >= 2500 && malos.length === 0, malos.slice(0, 2).map((v) => v.es.slice(0, 60)).join(" | "));
  const esp = pares.filter((v) => /[¿¡]|\b(usted|tome|evite|consulte|también|médico|fármacos?)\b/i.test(v.en));
  check("ninguna traducción se ha quedado en español y el 112 se mantiene donde estaba", esp.length === 0 && pares.filter((v) => /\b112\b/.test(v.es)).length >= 3 && pares.filter((v) => /\b112\b/.test(v.es)).every((v) => /\b112\b/.test(v.en)), esp.slice(0, 3).map((v) => v.en.slice(0, 60)).join(" | "));
  const kbE = structuredClone(kb), ddiE = structuredClone(ddiCurado), T = CO.traducir(kbE, ddiE, D);
  const mapa = (k) => new Map(k.clases.flatMap((c) => c.principios.map((p) => [p.id, p]))), pe = mapa(kbE), ps = mapa(kb), cambiados = [...ps.keys()].filter((id) => pe.get(id).nombre !== ps.get(id).nombre);
  check("la base traducida conserva identificadores, niveles, condiciones, nivel de evidencia y combinaciones; solo cambian los textos y la cita de la fuente", kbE.clases.every((c, i) => c.id === kb.clases[i].id && igual(c.senales, kb.clases[i].senales) && AMB.every((a) => (c[a] || []).length === (kb.clases[i][a] || []).length && (c[a] || []).every((r, j) => { const o = kb.clases[i][a][j]; return r.nivel === o.nivel && nivelEvidencia(r) === nivelEvidencia(o) && r.evidencia === o.evidencia && igual(r.si, o.si) && r.texto !== o.texto; }))) && igual(kbE.combinaciones, kb.combinaciones) && igual(Object.keys(kbE.senales), Object.keys(kb.senales)) && kbE.reglas_combinadas.every((r, i) => { const o = kb.reglas_combinadas[i]; return igual({ ...r, titulo: 0, texto: 0, fuente: 0 }, { ...o, titulo: 0, texto: 0, fuente: 0 }) && nivelEvidencia(r) === nivelEvidencia(o) && r.texto !== o.texto; }) && ddiE.interacciones.every((x, i) => { const o = ddiCurado.interacciones[i]; return igual({ ...x, efecto: 0, accion: 0, fuente: 0 }, { ...o, efecto: 0, accion: 0, fuente: 0 }) && x.efecto !== o.efecto; }));
  const fuentesEs = new Set([...kb.clases.flatMap((c) => AMB.flatMap((a) => (c[a] || []).map((r) => r.fuente))), ...kb.reglas_combinadas.map((r) => r.fuente), ...ddiCurado.interacciones.map((x) => x.fuente)].filter((f) => typeof f === "string" && /\bFT\b|[áéíóúñª]/.test(f)));
  check(`las citas de las fuentes que llevan texto en español también se traducen («FT AEMPS 4.5» → «AEMPS SmPC 4.5»), sin cambiar el nivel de evidencia (${fuentesEs.size})`, fuentesEs.size > 150 && [...fuentesEs].filter((f) => !en(f)).length <= fuentesEs.size * 0.02 && en("FT AEMPS 4.5") === "AEMPS SmPC 4.5" && [...fuentesEs].every((f) => !en(f) || nivelEvidencia({ fuente: f, revisado: true }) === nivelEvidencia({ fuente: en(f), revisado: true })), [...fuentesEs].filter((f) => !en(f)).slice(0, 3).join(" | "));
  const iE = construirIndice(kbE, []);
  check(`el nombre español de cada principio traducido queda como alias: el buscador lo encuentra en los dos idiomas (${cambiados.length} nombres)`, cambiados.length > 150 && cambiados.every((id) => pe.get(id).alias.includes(ps.get(id).nombre)) && buscar(iE, "metformina")[0]?.pid === "metformina" && buscar(iE, "metformin")[0]?.pid === "metformina" && pe.get("metformina").nombre === "Metformin" && !ps.get("metformina").alias?.includes("Metformina"));
  const lista = [["bisoprolol", 5], ["enalapril", 20], ["metformina", 1700], ["acenocumarol", 4], ["atorvastatina", 40], ["lorazepam", 1], ["furosemida", 40]].map(([pid, dosis]) => ({ pid, dosis })), ctx = { edad: 72, condiciones: new Set(["hipertension", "diabetes"]) };
  const rS = evaluar(datos, lista, ctx), rE = evaluar({ kb: kbE, ddiCurado: ddiE, ddi: { pares: [] }, indice: iE }, lista, ctx);
  const forma = (r) => JSON.stringify([r.items.map((it) => [it.principio.id, it.dosisCat, [...it.senales].sort()]), Object.entries(r.ambitos).map(([a, l]) => [a, l.map((x) => [x.item.principio.id, (x.reglas || []).map((g) => [g.nivel, nivelEvidencia(g)])])]), r.combinadas.map((x) => x.regla.id), r.interacciones.map((x) => [x.a.principio.id, x.b.principio.id, x.nivel].join()), r.resumen]);
  check("el motor da el mismo informe con la base en inglés (fármacos, señales, niveles, fuentes, interacciones y reglas combinadas); solo cambian los textos", rS.items.length === 7 && forma(rS) === forma(rE) && rE.ambitos.general[0].reglas[0].texto !== rS.ambitos.general[0].reglas[0].texto && /^You take 3 medicines/.test(rE.combinadas[0].texto) && /lactic acidosis/.test(rE.interacciones.map((x) => x.efecto).join()));
  check("el aviso de la base dice en inglés que la traducción no está revisada", kbE.aviso.endsWith(CO.NOTA) && /not been clinically reviewed/.test(CO.NOTA) && kbE.aviso.startsWith(D.h[CO.huella(kb.aviso)]) && T.n === D.n);
  const o = { TXT: { es: { a: "Benzodiacepinas" } }, FUENTES: { x: { txt: "Smith et al. Age Ageing 2019" } }, L: [{ n: "Benzodiacepinas", id: "benzodiacepinas", amb: "fuerza", nivel: "mayor", cond: "artrosis", f: () => 1 }], s: new Set(["Benzodiacepinas"]), svg: '<g><path d="M0 0"/><text class="q-tx" x="4" y="8">Benzodiacepinas</text><text x="1" y="2">15 g</text></g>' }, t2 = CO.traductor(D.h, D.s); t2.trObj(o);
  const rotulos = { a: "fuerza", b: ["mayor", "Benzodiacepinas"] }; t2.trObj(rotulos, false, true);
  check(`las palabras sueltas en minúsculas («fuerza», «mayor», «artrosis»: ${Object.keys(D.s).length}) van aparte: al recorrer una tabla o la base no se tocan, porque ahí son identificadores; se traducen donde el código lo pide (tL) y en las tablas de rótulos`, Object.keys(D.s).length >= 20 && pares.every((v) => !(/^[a-z0-9_.:-]+$/.test(v.es) && D.h[CO.huella(v.es)])) && o.L[0].amb === "fuerza" && o.L[0].nivel === "mayor" && o.L[0].cond === "artrosis" && t2.tr("fuerza") === "strength" && t2.tr("mayor") === "major" && rotulos.a === "strength" && rotulos.b.join() === "major,Benzodiazepines");
  check("en los módulos se traduce el contenido y no la interfaz (TXT) ni los identificadores; en un dibujo, solo los rótulos; lo que no tiene traducción se queda como está", o.L[0].n === "Benzodiazepines" && o.L[0].id === "benzodiacepinas" && o.TXT.es.a === "Benzodiacepinas" && o.FUENTES.x.txt === "Smith et al. Age Ageing 2019" && o.s.has("Benzodiacepinas") && o.svg === '<g><path d="M0 0"/><text class="q-tx" x="4" y="8">Benzodiazepines</text><text x="1" y="2">15 g</text></g>' && t2.tr("texto sin traducción") === "texto sin traducción" && t2.tr("Benzodiacepinas") === "Benzodiazepines");
  const appJs = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), sw = fs.readFileSync(path.join(ROOT, "app/sw.js"), "utf8");
  check("los módulos de la lista son los registrados en la aplicación", (appJs.match(/\n  [a-z]+: \(\) => import\("\.\/[a-z]+\.js/g) || []).length === MODS.length && MODS.every((m) => appJs.includes(`\n  ${m}: () => import("./${m}.js`)));
  check("solo se descarga con la interfaz en inglés, al cambiar de idioma se recarga y los módulos se traducen al abrirse", /if \(idioma\(\) === "en"\) try \{ en = await \(await import\("\.\/contenido\.js\?v=\d+"\)\)\.aplicar\(kb, ddiCurado\); repintarSintomasCribado\(\); \} catch/.test(appJs) && /\(idioma\(\) === "en"\) !== !!datos\.en\) \{ location\.reload\(\); return; \}/.test(appJs) && /datos\?\.en\?\.trObj\(M\), M\.abrir\(api\(\), arg\)/.test(appJs) && !/from "\.\/contenido\.js/.test(appJs));
  const tam = fs.statSync(path.join(ROOT, "app/data/en/contenido.json")).size / 1024;
  check(`el diccionario (${Math.round(tam)} KB) no entra en la precarga: se guarda la primera vez que se usa`, !sw.includes("data/en") && tam < 450 && fs.statSync(path.join(ROOT, "app/js/contenido.js")).size < 6000);
  // segunda parte: lo que el código escribe por su cuenta (tablas tC y textos tL de js/tr.js)
  const TRX = await import(pathToFileURL(path.join(ROOT, "app/js/tr.js")).href + "?prueba=1"); // copia aparte: la de las pruebas sigue sin traductor
  const tab = { a: "Benzodiacepinas", id: "fuerza" }, rot = { a: "fuerza" }, t3 = CO.traductor(D.h, D.s);
  const antes = [TRX.tL("Benzodiacepinas"), TRX.tL`${3} años`, TRX.tC(tab) === tab, TRX.tC(rot, true) === rot, tab.a, rot.a].join("|");
  TRX.instalarTraductor({ tr: t3.tr, trObj: (x, todo) => t3.trObj(x, false, todo) });
  check("js/tr.js: sin traductor no cambia nada; al instalarlo traduce las tablas registradas y los textos marcados, y recoloca los valores de las plantillas", antes === "Benzodiacepinas|3 años|true|true|Benzodiacepinas|fuerza" && tab.a === "Benzodiazepines" && tab.id === "fuerza" && rot.a === "strength" && TRX.tL("Benzodiacepinas") === "Benzodiazepines" && TRX.tL`${3} años` === "3 years" && TRX.tL`Página ${2} de ${5}…` === "Page 2 of 5…" && TRX.tL("sin traducción") === "sin traducción" && TRX.tC({ x: "Benzodiacepinas" }).x === "Benzodiazepines");
  const { contenido: delCodigo, modulos: todosMods } = await import(pathToFileURL(path.join(ROOT, "scripts/contenido_modulos.mjs")).href);
  const tablas = (await delCodigo()).tablas, claves = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/trad_en/claves.json"), "utf8")), clavesApp = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/trad_en/claves_app.json"), "utf8"));
  const sueltos = [...new Set([...Object.values(claves).flatMap((c) => c.claves), ...clavesApp.claves])], sinTab = tablas.filter((s) => !en(s)), sinSuelto = sueltos.filter((s) => !en(s));
  check(`las tablas de contenido del código (${tablas.length} textos) y los textos sueltos marcados (${sueltos.length}) tienen traducción`, tablas.length > 900 && sueltos.length > 700 && sinTab.length <= tablas.length * 0.02 && sinSuelto.length <= sueltos.length * 0.02, [...sinTab, ...sinSuelto].slice(0, 3).join(" | "));
  const marcas = (src) => (src.match(/\btL(?:\(|`)/g) || []).length, desfase = todosMods().filter((m) => marcas(fs.readFileSync(path.join(ROOT, "app/js", m + ".js"), "utf8")) !== (claves[m]?.n || 0));
  check(`las marcas tL de cada módulo son las que se montaron (${Object.keys(claves).length} módulos; si se añade una, repetir scripts/contenido_en.py) y las de la aplicación principal, las apuntadas a mano (${clavesApp.n})`, Object.keys(claves).length >= 12 && desfase.length === 0 && marcas(appJs) === clavesApp.n && /import \{ tC, tL \} from "\.\/tr\.js\?v=\d+";/.test(appJs), desfase.join(", ") || String(marcas(appJs)));
  const E = JSON.parse(execFileSync(process.execPath, [path.join(ROOT, "scripts/contenido_prueba.mjs")], { encoding: "utf8", maxBuffer: 1 << 24 }));
  const todoE = JSON.stringify([Object.values(E.P).map((x) => Object.values(x)), Object.values(E.vistazo), E.plan, E.sesion.map((b) => [b.nombre, b.detalle, b.clave]), E.mecanismos, E.esencial, E.historia, E.alarma, E.sintomas]);
  check("con el traductor instalado (proceso aparte) cargan todos los módulos y el motor da el mismo informe: mismos ámbitos, niveles, señales, combinaciones e interacciones", E.errores.length === 0 && igual(E.ambitos, AMB) && igual(E.niveles, ["alerta", "info", "precaucion"]) && E.senales.length >= 12 && igual(E.senales, Object.keys(evaluar(datos, lista.map((m) => ({ ...m, tomas: 1 })), { edad: 72, caidas: true, condiciones: new Set(["hipertension", "diabetes", "osteoporosis"]) }).perfil).sort()) && E.combinadas.includes("hipotension_multiple") && /^metformina \| furosemida \| moderada \| Dehydration/.test(E.interacciones[0]) && igual(E.AMBITOS.map((x) => x[0]), AMB) && E.AMBITOS[2][1] === "Strength training" && E.cribado[0] === "info" && /^ACSM screening: /.test(E.cribado[1]), E.errores.join(" | ").slice(0, 300));
  check("y los documentos salen en inglés: prescripción, plan, sesión con sus dibujos, mecanismos y texto para la historia, sin restos de español", E.P.fue.frec === "2–3 non-consecutive days/week" && /talk test/.test(E.P.aer.int) && E.plan[0][1] === "5 days a week (minimum 3)" && E.sesion[1].nombre === "Chair squat" && E.sesion[1].pict === "sentadilla" && / sets of /.test(E.sesion[1].detalle) && /^1 set of /.test(E.conSeries) && E.mecanismos[0][2] === "By: Bisoprolol" && /^EXERCISE RECOMMENDATION/.test(E.historia) && /Metformin 1,700 mg\/day/.test(E.historia) && E.unidad === "mg/day" && igual(E.glosa, { tl: "strength", plantilla: "3 years", sin: "texto que no existe" }) && !/[áéíóúñ¿¡]|\b(días|semana|fármacos?|consulte|evite)\b/.test(todoE), (todoE.match(/[^"]{0,30}[áéíóúñ¿¡][^"]{0,30}/) || [""])[0]);
  const pdfJs = fs.readFileSync(path.join(ROOT, "app/js/pdf.js"), "utf8");
  check("el código que lee textos ya traducidos entiende los dos idiomas (series, equilibrio, días de la prescripción, cribado, fuente)", /\(series de\|sets of\|×\)/.test(fs.readFileSync(path.join(ROOT, "app/js/programa.js"), "utf8")) && /\(series de\|sets of\|×\)/.test(fs.readFileSync(path.join(ROOT, "app/js/rato.js"), "utf8")) && /\(Equilibrio\|Balance\)/.test(fs.readFileSync(path.join(ROOT, "app/js/rato.js"), "utf8")) && /\(\?:días\|days\)/.test(pdfJs) && /\(\?:Cribado ACSM\|ACSM screening\): /.test(pdfJs) && nivelEvidencia({ fuente: "SEIOMM guideline 2022", revisado: true }) === "guia" && nivelEvidencia({ fuente: "Buspirone SmPC 4.8", revisado: true }) === "ft");
  check("el artefacto lleva js/tr.js en línea con los módulos fijos y el diccionario no se mete en la precarga", /FIJOS = \[[^\]]*"tr"[^\]]*\]/.test(fs.readFileSync(path.join(ROOT, "scripts/build_artifact.py"), "utf8")) && sw.includes("js/tr.js") && !sw.includes("contenido.json"));
}

console.log("\nMejoras visuales 831–880: marco de las herramientas, centro y fichas");
{
  const C = await import(pathToFileURL(path.join(ROOT, "app/js/centro.js")).href);
  const E = await import(pathToFileURL(path.join(ROOT, "app/js/escalas.js")).href);
  const N = await import(pathToFileURL(path.join(ROOT, "app/js/cien.js")).href);
  const lee = (f) => fs.readFileSync(path.join(ROOT, "app/js", f + ".js"), "utf8"), srcC = lee("centro"), appJs = lee("app");
  const MODS = ["centro", "biblioteca", "cien", "cuerpo", "dolor", "enfermedad", "escalas", "frid", "mitos", "numeros", "paseo", "preguntas", "primeros", "programa", "rato", "receta", "vuelta"];
  const css = (f) => [...lee(f).matchAll(/const CSS\w* = `([\s\S]*?)\n`;/g)].map((m) => m[1]).join("\n");
  // quita los bloques «@media … (prefers-reduced-motion: no-preference) { … }» (con sus llaves anidadas) para ver qué movimiento queda fuera
  const sinMovimientoPermitido = (s) => { let o = "", i = 0; for (;;) { const j = s.indexOf("(prefers-reduced-motion: no-preference)", i); if (j < 0) return o + s.slice(i); const a = s.lastIndexOf("@media", j), b = s.indexOf("{", j); let n = 1, k = b + 1; while (n && k < s.length) { if (s[k] === "{") n++; else if (s[k] === "}") n--; k++; } o += s.slice(i, a); i = k; } };
  check("el marco común: decorar() pone medallón y color de grupo a la ventana de cualquier herramienta, y la aplicación lo llama cuando se abre una", typeof C.decorar === "function" && /d\.dataset\.marco = "1"/.test(srcC) && /class="mh-ico"|className = "mh-ico"|mh-ico/.test(srcC) && /new MutationObserver\(/.test(appJs) && /C\.decorar\?\.\(d\)/.test(appJs) && /attributeFilter: \["open"\]/.test(appJs));
  check("los cinco grupos tienen su color (también en el centro) y el azul nuevo trae versión oscura y de contraste", ["entender", "moverse", "seguir", "consulta", "ajustes"].every((g) => srcC.includes(`[data-g="${g}"]`)) && /--azul:/.test(srcC) && /data-theme="dark"\][^{]*\{[^}]*--azul/.test(srcC) && /data-theme="contrast"\][^{]*\{[^}]*--azul/.test(srcC));
  check("«Nuevo» hasta que se abre la herramienta y «Última» en la última usada: se guarda en medex.herr, entra en la copia de seguridad y está en los cinco idiomas", typeof C.leerVistas === "function" && typeof C.leerUltima === "function" && C.leerVistas().length === 0 && C.leerUltima() === null && /"medex\.herr"/.test(srcC) && lee("ocasional").includes('"medex.herr"') && (srcC.match(/\bnuevo: "/g) || []).length === 5 && (srcC.match(/\bultima: "/g) || []).length === 5);
  check("todo el movimiento de las herramientas es de una vez y va dentro de «prefers-reduced-motion: no-preference»", MODS.every((f) => !/(?<![-\w])animation\s*:/.test(sinMovimientoPermitido(css(f)))) && MODS.every((f) => !/animation:[^;}]*infinite/.test(css(f).split("\n").filter((l) => /83\d|84\d|85\d|86\d|87\d/.test(l)).join("\n"))), MODS.filter((f) => /(?<![-\w])animation\s*:/.test(sinMovimientoPermitido(css(f)))).join());
  check("los estilos nuevos van por tokens: los únicos colores fijos de los módulos son los de las hojas impresas y las definiciones del azul", MODS.every((f) => { const s = css(f).split("\n").filter((l) => !/@media print|#\w+-hoja|^\s*--azul|\{ --azul|--azul(-soft|-ink)?:/.test(l)).join("\n").replace(/@media print \{[\s\S]*?\n\}/g, ""); return !/#[0-9a-fA-F]{3,8}\b/.test(s); }), MODS.filter((f) => /#[0-9a-fA-F]{3,8}\b/.test(css(f).split("\n").filter((l) => !/@media print|#\w+-hoja|--azul/.test(l)).join("\n").replace(/@media print \{[\s\S]*?\n\}/g, ""))).join());
  const fig = N.puntos(41, 7);
  check("«De cada 100»: cada persona es una figura (cabeza y tronco) y siguen siendo 100", (fig.match(/<g class="cn-p-/g) || []).length === 100 && (fig.match(/<path /g) || []).length === 100 && (fig.match(/<circle /g) || []).length === 100 && (fig.match(/style="--i:\d+"/g) || []).length === 100);
  check("escalas: la categoría de cada puntuación sale de una sola función, que usan el resultado y la regla de colores", [0, 1, 2, 3, 4, 5].map((p) => E.categoriaDe("frail", p)).join() === "robusto,prefragil,prefragil,fragil,fragil,fragil" && [0, 3, 4, 10].map((p) => E.categoriaDe("sarcf", p)).join() === "bajo,bajo,alto,alto" && [0, 1, 3].map((p) => E.categoriaDe("caidas", p)).join() === "no,riesgo,riesgo" && /const cat = categoriaDe\(id, p\);/.test(lee("escalas")) && /CATEGORIAS\[id\]\[categoriaDe\(id, p\)\]\.v/.test(lee("escalas")));
  check("los adornos nuevos no hablan al lector de pantalla (el dato ya está en el texto): anillo, regla, medidor y puntos de potencia", /class="eq-anillo[^"]*"[^>]*aria-hidden="true"/.test(lee("escalas")) && /class="eq-regla" aria-hidden="true"/.test(lee("escalas")) && /class="eq-barra" aria-hidden="true"/.test(lee("escalas")) && /class="fr-medidor" aria-hidden="true"/.test(lee("frid")) && /class="fr-pot" data-s="\$\{f\.s\}" aria-hidden="true"/.test(lee("frid")));
  check("caídas: el medidor llega al doble del umbral (o al total si es mayor) y marca el umbral", /Math\.max\(UMBRAL_CALS \* 2, c\.total\)/.test(lee("frid")) && /data-u="\$\{UMBRAL_CALS\}\+"/.test(lee("frid")));
  check("números: cada casilla toma el color de su línea (la peor) y lo pierde al cambiar el número", /peor\[l\.nivel\] > peor\[niv\[l\.campo\]\]/.test(lee("numeros")) && /addEventListener\("input", \(ev\) => ev\.target\.closest\?\.\("\.nm-campo"\)\?\.removeAttribute\("data-n"\)\)/.test(lee("numeros")));
  check("receta: cada fila de la tabla lleva su modalidad para el icono", /<tr data-f="\$\{r\.fila\}">/.test(lee("receta")) && ["aer", "fue", "eq"].every((f) => css("receta").includes(`tr[data-f="${f}"]`)));
}

console.log("\nPDF con infografías (mejora grande 18)");
{
  const PDF = await import(pathToFileURL(path.join(ROOT, "app/js/pdf.js")).href);
  const appSrc = fs.readFileSync(path.join(ROOT, "app/js/app.js"), "utf8"), pdfSrc = fs.readFileSync(path.join(ROOT, "app/js/pdf.js"), "utf8");
  const PQ_APP = Function(`return ${appSrc.match(/const PQ_SENAL = (\{[^;]+\});/)[1]}`)();
  const ORDEN_APP = JSON.parse(appSrc.match(/const PQ_ORDEN = (\[[^\]]+\]);/)[1]);
  check("las fichas de mecanismo del PDF son las mismas que los «¿Por qué?» de la app (señales y orden), con icono y textos cortos", JSON.stringify(PDF.PQ_SENAL) === JSON.stringify(PQ_APP) && JSON.stringify(PDF.PQ_ORDEN) === JSON.stringify(ORDEN_APP) && PDF.PQ_ORDEN.every((id) => PDF.MEC[id] && PDF.ICONOS[PDF.MEC[id].ico] && PDF.MEC[id].t.length <= 30 && PDF.MEC[id].h.length <= 70));
  const res = evaluar(datos, ["bisoprolol", "acenocumarol", "insulina_basal", "furosemida", "lorazepam", "atorvastatina", "ciprofloxacino"].map((pid) => ({ pid, dosis: 1, tomas: 1 })), { condiciones: new Set() });
  const M = PDF.mecanismosDe(res), M3 = PDF.mecanismosDe(res, { max: 3, nombres: false });
  check("mecanismos de la lista: por orden de importancia (pulso, azúcar, golpes…), con quién los causa y un máximo", M.length === 6 && M.map((x) => x.id).slice(0, 3).join() === "pulso,azucar,sangrado" && /^Por: .*Bisoprolol/.test(M[0].nombres) && M3.length === 3 && M3.every((x) => x.nombres === "") && PDF.mecanismosDe({ perfil: {} }).length === 0);
  check("iconos: trazos en rejilla de 24 con órdenes de trazado válidas", Object.values(PDF.ICONOS).every((d) => /^[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+$/.test(d) && /^M/.test(d)) && ["caminar", "pesa", "equilibrio", "descanso", "habla"].every((k) => PDF.ICONOS[k]));
  check("ningún documento pasa de 4 caras: paciente, informe clínico y ficha del entrenador se rehacen con menos detalle si se pasan", PDF.MAX_CARAS === 4 && (pdfSrc.match(/getNumberOfPages\(\) <= MAX_CARAS(?:_PACIENTE)?\) break/g) || []).length === 3);
}

console.log("\nMi plan: días, tendencia, conciliación, constantes y chequeo previo (alfa 14)");
{
  const p3 = planSemana([1, 3, 5]);
  check("plan con 3 días alterna fuerza+eq, aeróbico y fuerza", p3[1] === "fuerza_eq" && p3[3] === "aerobico" && p3[5] === "fuerza" && p3[2] === "descanso" && p3[0] === "descanso");
  check("plan con 1 día es fuerza+equilibrio", planSemana([0])[0] === "fuerza_eq" && planSemana([0])[1] === "descanso");
  check("sin días → plan tipo", JSON.stringify(planSemana([])) === JSON.stringify(planSemana([1, 2, 3, 4, 5, 6])));
  const hoy = new Date(); const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const haceDias = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return iso(d); };
  const diario = [{ fecha: iso(hoy), min: 30 }, { fecha: haceDias(7), min: 40 }, { fecha: haceDias(8), min: 20 }];
  const sem = minutosPorSemana(diario, 8, hoy);
  check("8 semanas, la actual la última", sem.length === 8 && sem[7].min === 30);
  check("la semana anterior suma 60 o la antepenúltima 20 (según el día)", sem[6].min + sem[5].min === 60);
  const antes = [{ pid: "bisoprolol", dosis: 5, tomas: 1 }, { pid: "enalapril", dosis: 20, tomas: 1 }, { pid: "metformina", dosis: 850, tomas: 2 }];
  const despues = [{ pid: "bisoprolol", dosis: 2.5, tomas: 1 }, { pid: "metformina", dosis: 850, tomas: 2 }, { pid: "apixaban", dosis: 5, tomas: 2 }];
  const d = compararListas(antes, despues);
  check("conciliación: 1 nuevo, 1 retirado, 1 cambio de dosis", d.nuevos[0].pid === "apixaban" && d.retirados[0].pid === "enalapril" && d.cambios[0].pid === "bisoprolol" && d.cambios[0].antes === 5 && d.cambios[0].despues === 2.5 && d.total === 3);
  check("conciliación sin cambios", compararListas(antes, antes).total === 0);
  const res = evaluar(datos, [{ pid: "gliclazida", dosis: 60, tomas: 1 }, { pid: "bisoprolol", dosis: 5, tomas: 1 }, { pid: "apixaban", dosis: 5, tomas: 2 }], { condiciones: new Set() });
  const cs = constantesRelevantes(res, { condiciones: new Set() }).map((c) => c.id);
  check("constantes: glucosa, TA y pulso con sulfonilurea + betabloqueante", cs.includes("glucosa") && cs.includes("ta") && cs.includes("fc"));
  check("sin fármacos relevantes no se piden constantes", constantesRelevantes(evaluar(datos, [{ pid: "paracetamol", dosis: 1000, tomas: 3 }], { condiciones: new Set() }), { condiciones: new Set() }).length === 0);
  const ch = chequeoPrevio(res, { condiciones: new Set(["epoc_asma"]), caidas: true });
  const ids = ch.map((c) => c.id);
  check("chequeo: universales + glucosa, mareo, sangrado, aire y apoyo", ["pecho", "fiebre", "glucosa", "mareo", "sangrado", "aire", "apoyo"].every((k) => ids.includes(k)) && !ids.includes("tendon"));
  check("chequeo: gliclazida aparece como motivo de la glucosa", ch.find((c) => c.id === "glucosa").farmacos.some((f) => /gliclazida/i.test(f)));
  check("veredicto: todo marcado → ok", veredictoChequeo(ch, ids).clave === "ok");
  check("veredicto: falta un ámbar → suave", veredictoChequeo(ch, ids.filter((k) => k !== "agua" && k !== "mareo")).clave === "suave");
  check("veredicto: falta dolor en el pecho → no entrenar", veredictoChequeo(ch, ids.filter((k) => k !== "pecho")).clave === "no");
  const ses = sesionTipo("fuerza_eq", { fragil: false });
  check("cada ejercicio de fuerza tiene pictograma, clave y variantes", ses.bloques.slice(1).every((b) => b.pict && b.clave && b.facil && b.dificil));
  check("el calentamiento tiene pictograma", !!ses.bloques[0].pict);
}

console.log("\nCribado ACSM, evidencia y casos de validación (alfa 15)");
{
  check("cribado: sin datos", cribadoACSM({}).clave === "sin_datos");
  check("cribado: no regular, sin enfermedad, sin síntomas → empezar", cribadoACSM({ regular: false, enfermedad: false, sintomas: [] }).clave === "empezar");
  check("cribado: regular sin enfermedad → continuar", cribadoACSM({ regular: true, enfermedad: false, sintomas: [] }).clave === "continuar");
  check("cribado: regular con enfermedad → valoración antes de vigoroso", cribadoACSM({ regular: true, enfermedad: true, sintomas: [] }).clave === "valoracion_vigoroso");
  check("cribado: no regular con enfermedad → valoración antes", cribadoACSM({ regular: false, enfermedad: true, sintomas: [] }).clave === "valoracion_antes");
  check("cribado: síntomas en activo → parar", cribadoACSM({ regular: true, enfermedad: false, sintomas: ["dolor_pecho"] }).clave === "parar" && cribadoACSM({ regular: true, enfermedad: false, sintomas: ["dolor_pecho"] }).nivel === "alerta");
  check("cribado: síntomas en inactivo → valoración antes (alerta)", cribadoACSM({ regular: false, enfermedad: false, sintomas: ["disnea"] }).clave === "valoracion_antes");
  const resIns = evaluar(datos, [{ pid: "insulina_basal", dosis: 20, tomas: 1 }], { condiciones: new Set() });
  check("enfermedad sugerida por la medicación (insulina)", enfermedadSugerida(resIns, { condiciones: new Set() }).sugerida);
  check("enfermedad no sugerida con paracetamol", !enfermedadSugerida(evaluar(datos, [{ pid: "paracetamol", dosis: 1000, tomas: 1 }], { condiciones: new Set() }), { condiciones: new Set() }).sugerida);
  check("evidencia: FT 4.4 → ficha técnica y sección", nivelEvidencia({ fuente: "FT 4.4", revisado: true }) === "ft" && seccionFT({ fuente: "FT 4.4" }) === "4.4");
  check("evidencia: ACSM → guía; Beers → criterios; Lexicomp → base", nivelEvidencia({ fuente: "ACSM ap. A" }) === "guia" && nivelEvidencia({ fuente: "Beers 2023" }) === "criterios" && nivelEvidencia({ fuente: "Lexicomp" }) === "base");
  check("evidencia: revisada sin fuente → revisión; sin revisar → borrador; explícita manda", nivelEvidencia({ revisado: true }) === "revision" && nivelEvidencia({}) === "borrador" && nivelEvidencia({ evidencia: "guia", fuente: "FT 4.4" }) === "guia");
  const casos = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/casos.json"), "utf8")).casos;
  const ddiFull = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/ddi.json"), "utf8"));
  const datosFull = { ...datos, ddi: ddiFull };
  check("hay al menos 10 casos de validación con id único", casos.length >= 10 && new Set(casos.map((c) => c.id)).size === casos.length);
  for (const c of casos) { const r = comprobarCaso(datosFull, c); check(`caso ${c.id}: ${c.titulo}`, r.ok, r.fallos.join("; ")); }
  check("un caso con expectativa imposible falla", !comprobarCaso(datosFull, { meds: [{ pid: "paracetamol", dosis: 500, tomas: 1 }], ctx: {}, esperado: { alerta_min: 3 } }).ok);
}

console.log("\nZona de intensidad, carga por fármaco, SPPB y escáner (beta 0)");
{
  const datos = { kb, ddiCurado, ddi: { pares: [] }, indice };
  const resBB = evaluar(datos, [{ pid: "bisoprolol", dosis: 5, tomas: 1 }], { edad: 70, condiciones: new Set() });
  const zBB = zonaIntensidad(resBB, { edad: 70, condiciones: new Set() });
  check("betabloqueante → método RPE y motivo", zBB.metodo === "rpe" && zBB.motivos.includes("Bisoprolol") && !zBB.zonas, JSON.stringify(zBB.motivos));
  const resP = evaluar(datos, [{ pid: "paracetamol", dosis: 1000, tomas: 1 }], { edad: 60, condiciones: new Set() });
  const z = zonaIntensidad(resP, { edad: 60, condiciones: new Set() }, { fcReposo: 60 });
  check("sin FC inválida → Karvonen con Tanaka (166 lpm a 60 años)", z.metodo === "fc" && z.fcmax === 166 && !z.reposoEstimado, String(z.fcmax));
  check("zona moderada 40–59 % FCR: 102–123 lpm", z.zonas.moderada[0] === 102 && z.zonas.moderada[1] === 123, JSON.stringify(z.zonas));
  check("vigorosa por debajo de FCmáx y techo vigorosa", z.zonas.vigorosa[1] < z.fcmax && z.techo === "vigorosa");
  const zEst = zonaIntensidad(resP, { edad: 60, condiciones: new Set() });
  check("sin FC en reposo se estima (70) y se avisa", zEst.reposoEstimado === true && zEst.zonas.moderada[0] === 108, JSON.stringify(zEst.zonas));
  const zFA = zonaIntensidad(resP, { edad: 60, condiciones: new Set(["fibrilacion_auricular"]) }, { fcReposo: 60 });
  check("fibrilación auricular → RPE aunque no haya fármacos", zFA.metodo === "rpe" && zFA.motivos.includes("fibrilación auricular"));
  const zDai = zonaIntensidad(resP, { edad: 60, condiciones: new Set(["nyha34"]), daiFc: 150 }, { fcReposo: 60 });
  check("DAI 150 → límite 130 y zonas recortadas; NYHA III–IV → techo moderada", zDai.limiteDai === 130 && zDai.zonas.vigorosa[1] <= 130 && zDai.techo === "moderada");
  check("sin edad → RPE", zonaIntensidad(resP, { condiciones: new Set() }).metodo === "rpe");
  const resImp = evaluar(datos, [{ pid: "paracetamol", dosis: 1000, tomas: 1 }, { pid: "apixaban", dosis: 5, tomas: 2 }, { pid: "insulina_basal", dosis: 20, tomas: 1 }], { edad: 75, caidas: true, condiciones: new Set(["diabetes"]) });
  const imp = impactoPorFarmaco(resImp);
  check("carga por fármaco: ordenada de mayor a menor y pct ≤ 1", imp.length === 3 && imp[0].puntos >= imp[1].puntos && imp[1].puntos >= imp[2].puntos && imp[0].pct === 1 && imp.every((x) => x.pct <= 1));
  check("paracetamol con 0 puntos; insulina/apixabán con puntos", imp.find((x) => x.item.principio.id === "paracetamol").puntos === 0 && imp.find((x) => x.item.principio.id === "insulina_basal").puntos > 0, JSON.stringify(imp.map((x) => [x.item.principio.id, x.puntos])));
  const s1 = puntuarSPPB({ lado: 10, semitandem: 10, tandem: 10, marcha: 3.5, silla: 9.5 });
  check("SPPB máximo: 12 robusto, velocidad 1,14 m/s", s1.total === 12 && s1.categoria === "robusto" && s1.equilibrio === 4 && s1.marcha === 4 && s1.silla === 4 && Math.abs(s1.velocidad - 1.14) < 0.01, JSON.stringify(s1));
  const s2 = puntuarSPPB({ lado: 10, semitandem: 10, tandem: 5, marcha: 7.2, silla: 15.8 });
  check("SPPB intermedio: tándem 3–9,99 s = 3; marcha 6,53–8,7 s = 2; silla 13,7–16,69 s = 2 → 7 prefrágil", s2.equilibrio === 3 && s2.marcha === 2 && s2.silla === 2 && s2.total === 7 && s2.categoria === "prefragil", JSON.stringify(s2));
  const s3 = puntuarSPPB({ lado: 10, semitandem: 4, tandem: null, marcha: 9.1, silla: null });
  check("SPPB bajo: semitándem < 10 s = 1; marcha > 8,7 s = 1; silla no puede = 0 → 2 frágil", s3.equilibrio === 1 && s3.marcha === 1 && s3.silla === 0 && s3.total === 2 && s3.categoria === "fragil", JSON.stringify(s3));
  check("SPPB: silla > 60 s puntúa 0", puntuarSPPB({ lado: 10, semitandem: 10, tandem: 10, marcha: 4, silla: 61 }).silla === 0);
  const idxCn = construirIndice(JSON.parse(JSON.stringify(kb)), [{ nombre: "ELIQUIS 5 MG COMPRIMIDOS", principios: ["apixaban"], dosis: [5], cn: ["698857", "698858"] }, { nombre: "SIN CN", principios: ["paracetamol"], dosis: [1000] }]);
  check("índice porCn: dos envases apuntan a la misma presentación; sin cn no entra", idxCn.porCn.size === 2 && idxCn.porCn.get("698857").pid === "apixaban" && idxCn.porCn.get("698858") === idxCn.porCn.get("698857"));
  check("EAN-13 farmacéutico 847 + CN + control → CN = posiciones 6–11", "8470006988571".slice(6, 12) === "698857");
}

console.log("\nSuplementos y plantas (v1.1)");
{
  const { tipoProducto, unidadPorDia, unidadPorToma } = await import(pathToFileURL(path.join(ROOT, "app/js/engine.js")).href);
  const marcas = JSON.parse(fs.readFileSync(path.join(ROOT, "app/data/marcas.json"), "utf8"));
  const idx = construirIndice(JSON.parse(JSON.stringify(kb)), marcas);
  const d2 = { kb, ddiCurado, ddi: { pares: [] }, indice: idx };
  const sup = kb.clases.filter((c) => c.tipo);
  const nSup = sup.reduce((n, c) => n + c.principios.length, 0);
  check(`al menos 14 grupos y 50 productos de suplementos y plantas (${sup.length} grupos, ${nSup} productos)`, sup.length >= 14 && nSup >= 50);
  check("solo dos tipos: suplemento y planta", kb.clases.every((c) => !c.tipo || ["suplemento", "planta"].includes(c.tipo)) && kb.clases.every((c) => c.principios.every((p) => !p.tipo || ["suplemento", "planta"].includes(p.tipo))));
  check("tipoProducto: el principio puede precisar el tipo de su clase (cromo = suplemento en un grupo de plantas)", tipoProducto(idx.porId.get("cromo").principio, idx.porId.get("cromo").clase) === "suplemento" && tipoProducto(idx.porId.get("berberina").principio, idx.porId.get("berberina").clase) === "planta" && tipoProducto(idx.porId.get("bisoprolol").principio, idx.porId.get("bisoprolol").clase) === null);
  const busca = (q) => buscar(idx, q, 5).map((e) => e.pid);
  check("buscador por nombre común: hierba de San Juan, cola de caballo, garra del diablo, St John's wort", busca("hierba de san juan")[0] === "hiperico" && busca("cola de caballo")[0] === "plantas_diureticas" && busca("garra del diablo")[0] === "harpagofito" && busca("st john")[0] === "hiperico");
  check("lector de listas reconoce plantas por su nombre común", pids(extraerMedicacion("Hierba de San Juan 300 mg 1-0-0\nCola de caballo", idx)).join() === "hiperico,plantas_diureticas", pids(extraerMedicacion("Hierba de San Juan 300 mg 1-0-0\nCola de caballo", idx)).join());
  check("nomenclátor: COLA DE CABALLO ARKOPHARMA ya no se clasifica como ahorrador de potasio", marcas.some((m) => /COLA DE CABALLO/.test(m.nombre) && m.principios?.[0] === "plantas_diureticas") && !marcas.some((m) => m.pa === "Equisetum arvense"));
  check("nomenclátor: laxantes de sen, cáscara y frángula → laxantes de plantas (hipopotasemia)", marcas.filter((m) => m.principios?.includes("laxantes_plantas")).length >= 10);
  check("dosis habituales del suplemento sin nomenclátor (creatina 3 y 5 g)", JSON.stringify(idx.dosisPorPid.get("creatina")) === "[3,5]");
  check("unidades: «g/día» no se duplica y «mcg/h» no lleva «/día»", unidadPorDia("g/día") === "g/día" && unidadPorDia("mg") === "mg/día" && unidadPorDia("mcg/h") === "mcg/h" && unidadPorToma("g/día") === "g" && unidadPorToma("mg") === "mg");
  const ev = (meds, ctx = {}) => evaluar(d2, meds, { edad: 50, condiciones: new Set(), ...ctx, condiciones: new Set(ctx.condiciones || []) });
  const r1 = ev([{ pid: "hiperico" }, { pid: "apixaban", dosis: 5, tomas: 2 }]);
  check("hipérico + apixabán: interacción mayor curada y revisada (revisión clínica del 21/11)", r1.interacciones.some((x) => x.nivel === "mayor" && x.fuente === "curada" && x.revisado === true));
  check("tras la revisión clínica no queda nada en borrador (reglas, combinadas e interacciones)", kb.clases.every((c) => ["general", "aerobico", "fuerza", "equilibrio"].every((a) => (c[a] || []).every((r) => r.revisado))) && kb.reglas_combinadas.every((r) => r.revisado !== false) && ddiCurado.interacciones.every((x) => x.revisado !== false));
  const r2 = ev([{ pid: "acenocumarol", dosis: 2 }, { pid: "ginkgo" }]);
  check("ginkgo suma sangrado con anticoagulante (regla combinada)", r2.combinadas.some((c) => c.regla.id === "sangrado_multiple"));
  const r3 = ev([{ pid: "lorazepam", dosis: 1 }, { pid: "valeriana" }]);
  check("valeriana + lorazepam: varios sedantes", r3.combinadas.some((c) => c.regla.id === "sedantes_multiples"));
  const r4 = ev([{ pid: "regaliz" }, { pid: "amiodarona", dosis: 200 }]);
  check("regaliz + amiodarona: potasio bajo + QT (alerta)", r4.combinadas.some((c) => c.regla.id === "hipopotasemia_qt"));
  const r5 = ev([{ pid: "levadura_roja" }, { pid: "atorvastatina", dosis: 20 }]);
  check("levadura roja + estatina: duplicidad mayor", r5.interacciones.some((x) => x.nivel === "mayor"));
  check("propóleo con asma: alerta condicionada", ev([{ pid: "propoleo_jalea" }], { condiciones: ["epoc_asma"] }).resumen.alerta >= 1 && ev([{ pid: "propoleo_jalea" }]).resumen.alerta === 0);
  check("riesgo antidopaje y daño hepático: señales y reglas nuevas", !!kb.senales.dopaje && !!kb.senales.hepatotoxico && ev([{ pid: "tribulus" }]).combinadas.some((c) => c.regla.id === "dopaje_suplementos") && ev([{ pid: "garcinia" }], { condiciones: ["hepatopatia"] }).combinadas.some((c) => c.regla.id === "hepatotoxico_hepatopatia"));
  check("las interacciones del hipérico ya no cuelgan del multivitamínico", !ddiCurado.interacciones.some((x) => [x.a, x.b].includes("multivitaminico") && /hip[eé]rico/i.test(x.efecto)));
  const nuevas = sup.flatMap((c) => ["general", "aerobico", "fuerza", "equilibrio"].flatMap((a) => c[a] || []));
  check("todas las reglas de suplementos y plantas tienen fuente y nivel de evidencia", nuevas.every((r) => r.fuente && r.evidencia));
  check("el multivitamínico conserva su id (listas guardadas) y deja de prometer avisos de hierbas", idx.porId.has("multivitaminico") && !/hipérico/i.test(idx.porId.get("multivitaminico").principio.nombre));
}

console.log("\nPeso y funcionamiento sin conexión (service worker)");
{
  const APP = path.join(ROOT, "app");
  const kbs = (f) => fs.statSync(path.join(APP, f)).size / 1024;
  // lista de precarga del service worker: se ejecuta sw.js en un entorno vacío y se leen sus constantes
  const vm = await import("node:vm");
  const swSrc = fs.readFileSync(path.join(APP, "sw.js"), "utf8");
  const sw = vm.runInNewContext(`${swSrc};({ VERSION, SELLADOS, NUCLEO, IMAGENES })`, { self: { addEventListener() {} }, location: {}, caches: {}, URL, Request: class {} });
  const lista = [...sw.SELLADOS, ...sw.NUCLEO, ...sw.IMAGENES].filter((f) => f !== "./");
  const faltan = lista.filter((f) => !fs.existsSync(path.join(APP, f)));
  check("todos los ficheros de la precarga existen", faltan.length === 0, faltan.join());
  check("la precarga no repite ficheros", new Set(lista).size === lista.length);
  // ilustraciones usadas por la app (HTML, CSS y JS) → todas en la precarga, para que se vean sin conexión
  const fuentes = ["index.html", "css/style.css", ...fs.readdirSync(path.join(APP, "js")).filter((f) => f.endsWith(".js")).map((f) => "js/" + f)].map((f) => fs.readFileSync(path.join(APP, f), "utf8")).join("\n");
  const imgs = fs.readdirSync(path.join(APP, "assets/img")).filter((f) => f.endsWith(".webp"));
  const usadas = imgs.filter((f) => fuentes.includes(f.replace(/\.webp$/, "")) || fuentes.includes(f.replace(/-[a-z]+\.webp$/, "-${")));
  const sinPrecarga = usadas.filter((f) => !sw.IMAGENES.includes("assets/img/" + f));
  check(`las ${usadas.length} ilustraciones de la app están en la precarga`, usadas.length >= 25 && sinPrecarga.length === 0, sinPrecarga.join());
  check("los módulos con sello de versión están todos en la precarga", fs.readdirSync(path.join(APP, "js")).filter((f) => f.endsWith(".js")).every((f) => sw.SELLADOS.includes("js/" + f)) && ["en", "ca", "gl", "eu"].every((l) => sw.SELLADOS.includes(`js/i18n/${l}.js`)));
  check("las capturas de la guía y la presentación no se precargan (se guardan al visitarlas)", !lista.some((f) => /assets\/(guia|presentacion)\//.test(f)) && !lista.includes("assets/logo-app.png") && !lista.includes("assets/icon-512.png"));
  const totalPrecarga = lista.reduce((s, f) => s + kbs(f), 0);
  // 3760 desde la v1.1 (21/11/2026): base con 53 suplementos y plantas (+41 KB) y tres tandas de mejoras visuales 231-380 (+24 KB de CSS, +6 KB comprimidos)
  // 3800 desde las mejoras 381-530 (21/11/2026): +45 KB de CSS (+10 KB comprimidos) de movimiento, luz y cristal
  // 3850 desde las mejoras 531-680 (21/11/2026): +41 KB de CSS (+9 KB comprimidos)
  // 4100 desde las 20 mejoras grandes (v1.2, 21/11/2026): módulos bajo demanda (semana, voz, porque, movimiento, aprende…), que se precargan para usarse sin conexión
  // 4300 desde las mejoras grandes 8, 9 y 12 (pruebas, metas y resumen del mes, 21/11/2026): módulos bajo demanda que llevan sus textos en cinco idiomas
  // 4500 desde las mejoras grandes 14, 17, 16, 3 y 4 (pastillero, mapa, simulador, beneficios y dosis, 21/11/2026): módulos bajo demanda de 15-30 KB, precargados para usarse sin conexión; lo que se descarga al abrir sigue en ≤ 440 KB
  // 5200 desde la segunda tanda de mejoras grandes (v1.3, 22/11/2026): veinte módulos bajo demanda más (centro de herramientas, biblioteca de ejercicios, programa, paseo…),
  // de 15-40 KB cada uno, precargados para usarse sin conexión; lo que se descarga al abrir no crece (JS inicial ≤ 400 KB)
  check(`precarga total ≤ 5200 KB sin comprimir (ahora ${Math.round(totalPrecarga)} KB)`, totalPrecarga <= 5200);
  // presupuesto de peso de lo que se descarga al abrir la app (sin comprimir)
  const html = fs.readFileSync(path.join(APP, "index.html"), "utf8");
  const precargados = [...html.matchAll(/rel="modulepreload" href="(js\/[a-z0-9]+\.js)/g)].map((m) => m[1]);
  const inicialJs = ["js/app.js", ...precargados].reduce((s, f) => s + kbs(f), 0);
  // 440 KB desde las 20 mejoras grandes (v1.2): lo que tiene que estar al abrir (pantalla «Hoy», modo sencillo, enlaces a los explicadores); lo demás va en módulos bajo demanda
  // 400 KB desde la v1.3.0 (segunda tanda, 1): la sesión guiada, el lector de listas y de fotos, el SPPB, el escáner, las copias, el recorrido y las herramientas del modo profesional se cargan al usarlos
  check(`JavaScript inicial ≤ 400 KB (ahora ${Math.round(inicialJs)} KB)`, inicialJs <= 400);
  check("el lector de listas y el de fotos no se descargan al abrir (se cargan al leer una lista)", !precargados.includes("js/parser.js") && !precargados.includes("js/ocr.js") && !/from "\.\/(parser|ocr)\.js/.test(fs.readFileSync(path.join(APP, "js/app.js"), "utf8")));
  { const appJs = fs.readFileSync(path.join(APP, "js/app.js"), "utf8"); const pedidos = [...new Set([...appJs.matchAll(/import\("\.\/([a-z0-9]+)\.js/g)].map((m) => `js/${m[1]}.js`))]; const faltan = pedidos.filter((u) => !sw.SELLADOS.includes(u));
    check(`los ${pedidos.length} módulos bajo demanda de app.js están en la lista del service worker (funcionan sin conexión)`, pedidos.length >= 25 && faltan.length === 0, faltan.join()); }
  check("el maquetador de PDF no se descarga al abrir (se carga al pedir un PDF)", !precargados.includes("js/pdf.js") && !/from "\.\/pdf\.js/.test(fs.readFileSync(path.join(APP, "js/app.js"), "utf8")));
  // 70 KB desde las 20 mejoras grandes (v1.2): textos de la interfaz de la voz, la semana, los «¿Por qué?», «Hoy», los ejercicios y «Aprende» (el contenido largo va en sus módulos)
  check(`i18n.js ≤ 70 KB (ahora ${Math.round(kbs("js/i18n.js"))} KB)`, kbs("js/i18n.js") <= 70);
  // 325 KB desde las mejoras 381-530 (21/11/2026): movimiento futurista de una vez, luz y cristal; 67 KB comprimida con gzip
  // 370 KB desde las mejoras 531-680 (21/11/2026): transiciones nativas, tacto, profundidad y detalles; 75 KB comprimida
  // 345 KB desde la limpieza y las mejoras 681-830 (21/11/2026): 327 KB, 62 KB comprimida; las descripciones de las mejoras viven en docs/ESTILOS-MEJORAS.md
  // 355 KB desde las 20 mejoras grandes (v1.2): solo lo que se ve en las pantallas principales; los estilos de las ventanas grandes van con su módulo (p. ej., las escenas de porque.js)
  check(`hoja de estilos ≤ 355 KB, reservas para Safari antiguo incluidas (ahora ${Math.round(kbs("css/style.css"))} KB)`, kbs("css/style.css") <= 355);
  const css = fs.readFileSync(path.join(APP, "css/style.css"), "utf8");
  const tabla = css.slice(css.indexOf("/* OP3."));
  const usadasCm = new Set([...css.matchAll(/var\(--cm-(\d+)\)/g)].map((m) => m[1]));
  const definidasCm = new Set([...tabla.matchAll(/--cm-(\d+):/g)].map((m) => m[1]));
  check(`reservas de color-mix: las ${usadasCm.size} variables usadas están definidas para Safari antiguo`, usadasCm.size > 40 && [...usadasCm].every((n) => definidasCm.has(n)));
  check("la hoja de estilos sigue en ASCII desde las tandas FBE", /^[\x00-\x7F]*$/.test(css.slice(css.indexOf("CAPA DE ESTILO FBE"))));
  const pesadas = imgs.filter((f) => kbs("assets/img/" + f) > 40);
  check("cada ilustración ≤ 40 KB", pesadas.length === 0, pesadas.join());
  check(`logo de los PDF ≤ 50 KB (ahora ${Math.round(kbs("assets/logo-pdf.png"))} KB)`, kbs("assets/logo-pdf.png") <= 50 && fs.readFileSync(path.join(APP, "js/pdf.js"), "utf8").includes("assets/logo-pdf.png"));
  // sellos de versión coherentes: index.html, módulos, import() dinámicos y service worker
  const sellos = new Set([...html.matchAll(/\?v=(\d+)/g), ...fuentes.matchAll(/\?v=(\d+)/g)].map((m) => m[1]));
  check("un único sello de versión en index.html, módulos y service worker", sellos.size === 1 && sellos.has(sw.VERSION), [...sellos].join());
  const csp = html.match(/'sha256-([A-Za-z0-9+/=]+)'/)?.[1];
  const enLinea = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? "";
  const { createHash } = await import("node:crypto");
  check("la huella CSP coincide con el script en línea", csp === createHash("sha256").update(enLinea, "utf8").digest("base64"));
}

console.log(`\n${total - fallos}/${total} pruebas correctas`);
process.exit(fallos ? 1 : 0);
