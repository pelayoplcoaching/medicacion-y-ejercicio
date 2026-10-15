#!/usr/bin/env node
/* Pruebas de regresión del motor y del lector de listas.
   Uso: node scripts/test.mjs            (sin dependencias) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { construirIndice, evaluar, buscar } = await import(path.join(ROOT, "app/js/engine.js"));
const { extraerMedicacion } = await import(path.join(ROOT, "app/js/parser.js"));

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

console.log(`\n${total - fallos}/${total} pruebas correctas`);
process.exit(fallos ? 1 : 0);
