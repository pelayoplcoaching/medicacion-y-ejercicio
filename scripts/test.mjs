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
  check(`precarga total ≤ 4100 KB sin comprimir (ahora ${Math.round(totalPrecarga)} KB; antes 4300)`, totalPrecarga <= 4100);
  // presupuesto de peso de lo que se descarga al abrir la app (sin comprimir)
  const html = fs.readFileSync(path.join(APP, "index.html"), "utf8");
  const precargados = [...html.matchAll(/rel="modulepreload" href="(js\/[a-z0-9]+\.js)/g)].map((m) => m[1]);
  const inicialJs = ["js/app.js", ...precargados].reduce((s, f) => s + kbs(f), 0);
  // 440 KB desde las 20 mejoras grandes (v1.2): lo que tiene que estar al abrir (pantalla «Hoy», modo sencillo, enlaces a los explicadores); lo demás va en módulos bajo demanda
  check(`JavaScript inicial ≤ 440 KB (ahora ${Math.round(inicialJs)} KB)`, inicialJs <= 440);
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
