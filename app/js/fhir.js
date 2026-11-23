/* Exportación FHIR R4 (beta 3): Bundle de colección con el paciente anónimo, sus observaciones (edad, pulso en reposo,
   filtrado, FEVI, SPPB, NYHA, caídas, cribado ACSM), condiciones, medicación (con ATC y momentos de toma) y el plan de
   ejercicio FITT. Sale de app.js en la v1.2.11 para no cargarlo al abrir: se carga al pedir la exportación. */
import { tL } from "./tr.js?v=202611230800";
const MOMENTO_FHIR = { desayuno: "MORN", comida: "NOON", cena: "EVE", noche: "NIGHT" };
const CODIGOS_FHIR = { fcReposo: ["40443-4", "Heart rate --resting"], fg: ["62238-1", "Glomerular filtration rate/1.73 sq M.predicted"], fevi: ["10230-1", "Left ventricular Ejection fraction"], edad: ["30525-0", "Age"] };
/** d: { res, ctx, P, presc, estado, crib, cribTxt, cond(c), ent(pid), esencial, version, kbVersion }. */
export function bundleFhir(d) {
  const { res, ctx, P, presc, estado, crib } = d;
  const ahora = new Date().toISOString();
  const ref = (tipo, id) => ({ reference: `${tipo}/${id}` });
  const obs = (id, [code, display], valor, unidad) => ({ resourceType: "Observation", id, status: "final", code: { coding: [{ system: "http://loinc.org", code, display }], text: display }, subject: ref("Patient", "paciente"), effectiveDateTime: ahora, valueQuantity: { value: valor, unit: unidad, system: "http://unitsofmeasure.org" } });
  const recursos = [];
  recursos.push({ resourceType: "Patient", id: "paciente", text: { status: "generated", div: tL`<div xmlns="http://www.w3.org/1999/xhtml">Paciente anónimo${ctx.edad ? ", " + ctx.edad + tL(" años") : ""}</div>` } });
  if (presc?.nombre) recursos.push({ resourceType: "Practitioner", id: "prescriptor", name: [{ text: presc.nombre }], ...(presc.colegiado ? { identifier: [{ system: "urn:oid:2.16.724.4.9", value: presc.colegiado }] } : {}), ...(presc.especialidad ? { qualification: [{ code: { text: presc.especialidad } }] } : {}) });
  if (ctx.edad) recursos.push(obs("edad", CODIGOS_FHIR.edad, ctx.edad, "a"));
  if (estado.fcReposo) recursos.push(obs("fc-reposo", CODIGOS_FHIR.fcReposo, estado.fcReposo, "/min"));
  if (ctx.fg != null) recursos.push(obs("fg", CODIGOS_FHIR.fg, ctx.fg, "mL/min/{1.73_m2}"));
  if (ctx.fevi != null) recursos.push(obs("fevi", CODIGOS_FHIR.fevi, ctx.fevi, "%"));
  if (ctx.sppb != null) recursos.push({ resourceType: "Observation", id: "sppb", status: "final", code: { text: "SPPB (Short Physical Performance Battery)" }, subject: ref("Patient", "paciente"), effectiveDateTime: estado.sppb?.fecha ? new Date(estado.sppb.fecha).toISOString() : ahora, valueInteger: ctx.sppb, interpretation: [{ text: ctx.fragilidad || "" }] });
  if (ctx.nyha != null) recursos.push({ resourceType: "Observation", id: "nyha", status: "final", code: { text: tL("Clase funcional NYHA") }, subject: ref("Patient", "paciente"), valueString: ["", "I", "II", "III", "IV"][ctx.nyha] });
  if (estado.caidas) recursos.push({ resourceType: "Observation", id: "caidas", status: "final", code: { text: tL("Caída en el último año") }, subject: ref("Patient", "paciente"), valueBoolean: true });
  if (crib.clave !== "sin_datos") recursos.push({ resourceType: "Observation", id: "cribado-acsm", status: "final", code: { text: tL("Cribado preparticipación ACSM 2015") }, subject: ref("Patient", "paciente"), valueString: crib.clave, note: [{ text: d.cribTxt?.[crib.clave] || "" }] });
  for (const c of estado.condiciones) recursos.push({ resourceType: "Condition", id: "cond-" + c, clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] }, code: { text: d.cond(c) }, subject: ref("Patient", "paciente") });
  estado.meds.forEach((m, i) => {
    const it = res.items.find((x) => x.principio.id === m.pid);
    const ent = d.ent(m.pid);
    const atc = ent?.principio?.atc || ent?.clase?.atc?.[0];
    const ms = { resourceType: "MedicationStatement", id: "med-" + (i + 1), status: m.pausado ? "on-hold" : "active", subject: ref("Patient", "paciente"), dateAsserted: ahora,
      medicationCodeableConcept: { text: m.libre ? m.nombre : ent.principio.nombre, ...(atc ? { coding: [{ system: "http://www.whocc.no/atc", code: atc, display: ent.clase.nombre }] } : {}) } };
    if (m.dosis != null) ms.dosage = [{ text: it ? tL`${m.dosis} ${m.unidad || "mg"} × ${m.tomas || 1}/día${m.aDemanda ? tL(" si precisa") : ""}` : `${m.dosis} ${m.unidad || "mg"}`, asNeededBoolean: !!m.aDemanda, timing: { repeat: { frequency: m.tomas || 1, period: 1, periodUnit: "d", ...(m.momentos?.length ? { when: m.momentos.map((x) => MOMENTO_FHIR[x]).filter(Boolean) } : {}) } }, doseAndRate: [{ doseQuantity: { value: m.dosis, unit: m.unidad || "mg" } }] }];
    recursos.push(ms);
  });
  const act = (titulo, f) => ({ detail: { kind: "ServiceRequest", status: "scheduled", code: { text: titulo }, description: tL`Frecuencia: ${f.frec}. Intensidad: ${f.int} Tiempo: ${f.tiempo}. Tipo: ${f.tipo}` } });
  const sem = estado.prescrito?.semanas || presc?.revision || 6;
  const inicio = estado.prescrito ? new Date(estado.prescrito.fecha) : new Date(); const fin = new Date(inicio); fin.setDate(fin.getDate() + sem * 7);
  recursos.push({ resourceType: "CarePlan", id: "plan-ejercicio", status: "active", intent: "plan", title: tL("Prescripción de ejercicio físico adaptada al tratamiento (FITT)"), subject: ref("Patient", "paciente"), period: { start: inicio.toISOString().slice(0, 10), end: fin.toISOString().slice(0, 10) }, ...(presc?.nombre ? { author: ref("Practitioner", "prescriptor") } : {}), activity: [act(tL("Ejercicio aeróbico"), P.aer), act(tL("Entrenamiento de fuerza"), P.fue), act(tL("Equilibrio"), P.eq)], note: [{ text: tL`Generado con Pauta Activa v${d.version} (base ${d.kbVersion}). ${d.esencial.map((a) => a.titulo + ": " + a.texto).join(" | ")}` }] });
  return { resourceType: "Bundle", id: "pauta-activa-" + Date.now().toString(36), type: "collection", timestamp: ahora, meta: { source: "https://medicacionyejercicio.fuerzabasadaenevidencia.com/" }, entry: recursos.map((r) => ({ fullUrl: `urn:uuid:${r.resourceType.toLowerCase()}-${r.id}`, resource: r })) };
}
