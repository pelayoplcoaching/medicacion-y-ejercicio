#!/usr/bin/env node
/* Pruebas de regresión del motor y del lector de listas.
   Uso: node scripts/test.mjs            (sin dependencias) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORDEN = { alerta: 3, precaucion: 2, info: 1 };
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
  check("el módulo no importa otros módulos bajo demanda (va en su propio ámbito en el artefacto)", [...src.matchAll(/^import .* from "\.\/([a-z0-9]+)\.js/gm)].every((m) => ["i18n", "engine", "pictos", "libs", "version"].includes(m[1])));
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
