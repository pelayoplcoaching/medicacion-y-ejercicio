#!/usr/bin/env node
/* Pruebas de regresión del motor y del lector de listas.
   Uso: node scripts/test.mjs            (sin dependencias) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORDEN = { alerta: 3, precaucion: 2, info: 1 };
const { construirIndice, evaluar, buscar, ventanaEntrenamiento, loEsencial, ALARMA, planSemana, minutosPorSemana, compararListas, constantesRelevantes, chequeoPrevio, veredictoChequeo, sesionTipo, cribadoACSM, enfermedadSugerida, nivelEvidencia, seccionFT, comprobarCaso } = await import(pathToFileURL(path.join(ROOT, "app/js/engine.js")).href);
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

console.log("\nIdiomas");
{
  // i18n.js usa document/localStorage solo dentro de funciones; aquí comprobamos los diccionarios
  const src = fs.readFileSync(path.join(ROOT, "app/js/i18n.js"), "utf8");
  const dicc = {};
  for (const m of src.matchAll(/^const (ES|EN|CA|GL) = \{([\s\S]*?)^\};/gm)) {
    dicc[m[1]] = new Set([...m[2].matchAll(/"([a-z0-9_.]+)":/g)].map((x) => x[1]));
  }
  check("cuatro diccionarios", Object.keys(dicc).length === 4, Object.keys(dicc).join());
  for (const l of ["EN", "CA", "GL"]) {
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

console.log(`\n${total - fallos}/${total} pruebas correctas`);
process.exit(fallos ? 1 : 0);
