/* Textos del informe que se ven en pantalla y van a la historia clínica (sin jsPDF).
   Los PDF se construyen en pdf.js, que se carga solo al pulsar una descarga. */
import { unidadPorDia, unidadPorToma } from "./engine.js?v=202611220747";

export const WEB = "medicacionyejercicio.fuerzabasadaenevidencia.com";

export const CRIBADO_PDF = { empezar: ["info", "Cribado ACSM: puede empezar a intensidad ligera-moderada y progresar; no precisa valoración médica previa."], continuar: ["info", "Cribado ACSM: puede continuar con ejercicio moderado o vigoroso."], valoracion_vigoroso: ["precaucion", "Cribado ACSM: puede seguir con ejercicio moderado; valoración médica antes de pasar a intensidad vigorosa."], valoracion_antes: ["precaucion", "Cribado ACSM: valoración médica recomendada antes de empezar; mientras tanto, actividad ligera."], parar: ["alerta", "Cribado ACSM: síntomas sugestivos de enfermedad cardiovascular, metabólica o renal; suspender el ejercicio moderado o intenso hasta valoración médica."] };

/* ---------- lógica de prescripción derivada del perfil ---------- */
export const AMBITOS = [["general", "Antes de empezar"], ["aerobico", "Ejercicio aeróbico"], ["fuerza", "Entrenamiento de fuerza"], ["equilibrio", "Equilibrio"]];
const num = (x) => Number(x).toLocaleString("es-ES", { maximumFractionDigits: 3 });
export function dosisTxt(it) {
  if (it.dosisTotal == null) return "dosis no indicada";
  const base = it.esDiaria && it.tomas > 1 ? `${num(it.dosisPorToma)} ${unidadPorToma(it.unidad)} × ${it.aDemanda ? "hasta " : ""}${it.tomas}/día` : `${num(it.dosisTotal)} ${it.esDiaria ? unidadPorDia(it.unidad) : it.unidad}`;
  return base + (it.aDemanda ? " (si precisa)" : "") + (it.dosisCat === "alta" ? " · dosis alta" : "");
}
export const tiene = (res, s) => !!res.perfil[s]?.length;
export const cuenta = (res, s) => res.perfil[s]?.length || 0;

export function prescripcion(res, ctx) {
  const mayor = ctx.edad != null && ctx.edad >= 65;
  const fcNoValida = tiene(res, "fc_no_valida") || tiene(res, "bradicardia") || tiene(res, "taquicardia");
  const hipo = tiene(res, "hipoglucemia");
  const hipot = cuenta(res, "hipotension");
  const caidas = cuenta(res, "caidas") + (ctx.caidas ? 1 : 0) + (mayor ? 1 : 0);
  const sangra = tiene(res, "sangrado");
  const musc = tiene(res, "perdida_muscular") || tiene(res, "hueso");
  const tendon = tiene(res, "tendon");
  const miop = tiene(res, "miopatia");
  const calor = tiene(res, "calor") || tiene(res, "deshidratacion");
  const sed = tiene(res, "sedacion");
  const cond = ctx.condiciones || new Set();
  const fragil = cond.has("fragil"), prefragil = cond.has("prefragil");
  const nyha34 = cond.has("nyha34"), feviBaja = cond.has("fevi_baja");
  const dai = ctx.daiFc ? ` Con DAI programado a ${ctx.daiFc} lpm: mantener FC < ${ctx.daiFc - 20} lpm.` : "";
  return {
    aer: {
      frec: fragil || nyha34 ? "Diario, en varias sesiones cortas" : "5 días/semana (mín. 3)",
      int: (fcNoValida ? "Moderada por RPE 12–13 (Borg 6–20) o prueba del habla. No usar %FCmáx ni zonas de pulso." : feviBaja || nyha34 ? "Ligera-moderada: RPE 10–13; sin esfuerzos máximos ni intervalos de alta intensidad salvo en programa supervisado." : "Moderada: 40–59 % FC de reserva o RPE 12–13; progresar a vigorosa si tolera.") + dai,
      tiempo: fragil ? "Marcha 5–10 min, 2–3 veces al día; aumentar 1–2 min cada pocos días hasta 30 min" : nyha34 ? "5–10 min, 2–4 veces al día; progresar a 20–30 min continuos" : "150–300 min/semana; empezar con 10–20 min y aumentar 5–10 min/semana",
      tipo: ["Caminar, bici estática, elíptica, natación" + (sangra ? " (sin contacto ni riesgo de caída a velocidad)" : "") + ".", hipot >= 2 ? "Enfriamiento ≥10 min; evitar paradas bruscas y cambios posturales rápidos." : "Enfriamiento 5–10 min.", calor ? "Evitar calor; electrolitos en sesiones >60 min." : "", hipo ? "Glucemia capilar pre/post; HC de absorción rápida disponibles." : ""].filter(Boolean).join(" "),
    },
    fue: {
      n: 2, // días a la semana (objetivo de los anillos de semana.js)
      frec: fragil || prefragil || musc ? "2–3 días/semana (prioritario)" : "2–3 días/semana no consecutivos",
      int: fragil ? "Programa multicomponente tipo Vivifrail A–B: sentarse-levantarse, elevaciones de talón, bandas elásticas; 1–2 series de 8–12 rep, RPE 4–6/10, progresión semanal." : tendon ? "Cargas ligeras, sin trabajo explosivo ni excéntrico intenso durante el tratamiento y 4 semanas después." : miop ? "Progresión lenta (ajustes cada 2–3 semanas); evitar fallo muscular y excéntricos intensos las primeras semanas." : "8–15 repeticiones, 2–3 series, RPE 5–7/10; progresar cuando complete las repeticiones con técnica.",
      tiempo: "20–40 min por sesión",
      tipo: ["Grandes grupos musculares (sentadilla/levantarse de silla, empuje, tracción, bisagra de cadera).", "Respiración continua, sin Valsalva.", hipo ? "Fuerza antes del aeróbico en la misma sesión." : "", sangra ? "Máquinas o pesos ligeros al inicio; evitar golpes." : ""].filter(Boolean).join(" "),
    },
    eq: {
      n: caidas >= 2 || fragil ? 3 : 2,
      frec: caidas >= 2 || fragil ? "3 días/semana (prioritario)" : "2–3 días/semana",
      int: caidas >= 2 || sed || fragil ? "Con apoyo (pared, silla, barandilla) y supervisión inicial." : "Progresar de apoyo bipodal a unipodal y doble tarea.",
      tiempo: "10–15 min (integrable en las sesiones de fuerza)",
      tipo: ["Transferencias sentado-de pie, marcha en tándem, apoyo monopodal, giros, tai chi.", sangra ? "Prevención de caídas prioritaria por el anticoagulante." : "", hipot >= 2 ? "Transiciones de posición lentas." : ""].filter(Boolean).join(" "),
    },
  };
}

export function zonaTxt(z) {
  if (!z) return null;
  if (z.metodo === "fc") {
    const r = (k) => `${z.zonas[k][0]}–${z.zonas[k][1]} lpm`;
    return { lineas: [`Ligera ${r("ligera")} · Moderada ${r("moderada")}` + (z.techo === "vigorosa" ? ` · Vigorosa ${r("vigorosa")}` : "")], nota: `FCmáx estimada ${z.fcmax} lpm (Tanaka 208 − 0,7·edad); FC en reposo ${z.fcReposo ?? "70 (estimada)"} lpm; zonas por FC de reserva (Karvonen).` + (z.limiteDai ? ` Con DAI: FC < ${z.limiteDai} lpm.` : "") + (z.techo === "moderada" ? " Techo de intensidad moderada por la situación clínica." : "") };
  }
  return { lineas: [`Ligera: ${z.rpe.ligera} · Moderada: ${z.rpe.moderada}` + (z.techo === "vigorosa" ? ` · Vigorosa: ${z.rpe.vigorosa}` : "")], nota: `La FC no es un indicador válido de intensidad (${z.motivos.join(", ")}): usar RPE (Borg 6–20) y prueba del habla.` + (z.techo === "moderada" ? " Techo de intensidad moderada por la situación clínica." : "") };
}
export function sppbTxt(ctx) {
  const g = ctx.sppbGuiado;
  if (!g && ctx.sppb == null) return null;
  const total = g?.total ?? ctx.sppb;
  const cat = total <= 6 ? "frágil" : total <= 9 ? "prefrágil" : "robusto";
  const partes = g?.partes ? ` (pies juntos ${g.partes.lado ?? "—"} s, semitándem ${g.partes.semitandem ?? "—"} s, tándem ${g.partes.tandem ?? "—"} s, marcha 4 m ${g.partes.marcha ?? "—"} s${g.velocidad ? " = " + g.velocidad.toLocaleString("es-ES") + " m/s" : ""}, 5 levantadas ${g.partes.silla ?? "no puede"}${g.partes.silla != null ? " s" : ""})` : "";
  return `SPPB ${total}/12 · ${cat}${g?.fecha ? " · " + new Date(g.fecha).toLocaleDateString("es-ES") : ""}${partes}.`;
}

/* ---------- INFORME CLÍNICO (médico) ---------- */
export function listasVistazo(res, ctx) {
  const cond0 = ctx.condiciones || new Set();
  const evite = [];
  if (tiene(res, "sangrado")) evite.push("Deportes de contacto o con riesgo de golpes y caídas a velocidad.");
  if (tiene(res, "tendon")) evite.push("Saltos, carrera intensa y cargas máximas durante el tratamiento y el mes siguiente.");
  if (cuenta(res, "hipotension") >= 2) evite.push("Parar de golpe tras el esfuerzo y las duchas muy calientes justo después.");
  if (tiene(res, "calor") || tiene(res, "deshidratacion")) evite.push("Entrenar con calor intenso o sin agua a mano.");
  if (tiene(res, "sedacion")) evite.push("Entrenar en las horas siguientes a una toma que da sueño.");
  if (tiene(res, "renal") || tiene(res, "sangrado") || tiene(res, "litio")) evite.push("Antiinflamatorios (ibuprofeno, naproxeno) para las agujetas: use paracetamol.");
  if (tiene(res, "fc_no_valida") || tiene(res, "bradicardia")) evite.push("Guiarse por el pulso del reloj para medir la intensidad.");
  if (cond0.has("aneurisma_aorta")) evite.push("Levantar cargas máximas o aguantar la respiración haciendo fuerza.");
  if (cond0.has("osteoporosis")) evite.push("Doblar la espalda hacia delante con peso y los giros bruscos.");
  if (!evite.length) evite.push("No hay actividades que deba evitar por su medicación; progrese poco a poco.");
  const cuidado = [];
  if (tiene(res, "hipoglucemia")) cuidado.push("Mida la glucosa antes y después y lleve azúcar.");
  if (cuenta(res, "hipotension") >= 1) cuidado.push("Levántese despacio y termine cada sesión con 5–10 minutos suaves.");
  if (tiene(res, "caidas") || ctx.caidas || ctx.edad >= 65) cuidado.push("Haga el equilibrio con un apoyo cerca.");
  if (tiene(res, "miopatia")) cuidado.push("Dolor muscular que no encaja con lo entrenado: consulte.");
  if (tiene(res, "hiperpotasemia")) cuidado.push("Sin suplementos ni bebidas «ricas en potasio».");
  if (tiene(res, "deshidratacion") || tiene(res, "litio")) cuidado.push("Beba agua con sales en sesiones largas.");
  if (tiene(res, "qt")) cuidado.push("Palpitaciones o mareo: pare y consulte.");
  if (!cuidado.length) cuidado.push("Empiece suave y aumente cada semana un poco.");
  const puede = ["Caminar a un paso que le permita hablar, casi todos los días.", "Ejercicios de fuerza 2–3 días por semana (levantarse de la silla, subir escalones, empujar y tirar).", "Ejercicios de equilibrio 2–3 días por semana."];
  return { evite, cuidado, puede };
}

/** Texto breve del ritmo de intensidad para el paciente (una línea + nota). */
export function ritmoTexto(zz) {
  if (!zz) return null;
  const linea = zz.metodo === "fc"
    ? `ligera ${zz.zonas.ligera[0]}–${zz.zonas.ligera[1]} lpm · moderada ${zz.zonas.moderada[0]}–${zz.zonas.moderada[1]} lpm` + (zz.techo === "vigorosa" ? ` · vigorosa ${zz.zonas.vigorosa[0]}–${zz.zonas.vigorosa[1]} lpm` : "") + "."
    : zz.motivos.length ? `no se guíe por el pulso (${zz.motivos.join(", ")}); moderado = ${zz.rpe.moderada}.`
      : `guíese por la sensación de esfuerzo (sin su edad no se puede calcular el pulso); moderado = ${zz.rpe.moderada}.`;
  const nota = (zz.metodo === "fc" ? `Pulso máximo estimado ${zz.fcmax} lpm${zz.limiteDai ? `; con DAI, pulso < ${zz.limiteDai} lpm` : ""}. ` : "") + (zz.techo === "moderada" ? "No pase de intensidad moderada por su situación clínica. " : "") + (zz.habla || "");
  return { linea, nota };
}

/** Filas del plan semanal FITT en lenguaje del paciente (app y PDF). */
export function filasPlanPaciente(res, ctx) {
  const P = prescripcion(res, ctx);
  const fcNo = tiene(res, "fc_no_valida") || tiene(res, "bradicardia");
  return [
    ["aer", P.aer.frec.replace("/semana", " por semana").replace("mín.", "mínimo"), "Empiece con 10–20 min y suba poco a poco hasta 30–45", (fcNo ? "A un ritmo que le permita hablar con frases cortas (no mire el pulso). " : "A un ritmo que le permita hablar con frases cortas. ") + "Termine siempre despacio."],
    ["fue", "2–3 días, no seguidos", "20–40 min", "8–15 repeticiones de cada ejercicio, 2–3 vueltas. Respire siempre; nunca aguante el aire."],
    ["eq", P.eq.frec.replace(/\s*\(.*?\)/, ""), "10–15 min", P.eq.int + " Apoyo sobre un pie, caminar talón-punta, levantarse sin manos."],
  ];
}

/* ---------- SU PLAN (paciente) ---------- */
/** Recorta un texto al final de una frase, sin pasar de `max` caracteres. */
export function textoHistoria(kb, res, ctx) {
  const P = prescripcion(res, ctx);
  const L = [];
  const cond = [...(ctx.condiciones || [])];
  const condTxt = { diabetes: "DM", insuficiencia_cardiaca: "IC", renal: "ERC", renal_grave: "FG<30", marcapasos: "MP/DAI", osteoporosis: "osteoporosis", epoc_asma: "EPOC/asma", oxigeno: "OCD", embarazo: "gestación/lactancia", nyha34: "NYHA III-IV", fevi_baja: "FEVI reducida", fragil: "fragilidad", prefragil: "prefragilidad", hipertension: "HTA", cardiopatia_isquemica: "C. isquémica", fibrilacion_auricular: "FA", aneurisma_aorta: "aneurisma aórtico", ictus: "ictus previo", cancer: "neoplasia activa/reciente", artrosis: "artrosis", epilepsia: "epilepsia", hepatopatia: "hepatopatía avanzada", obesidad: "obesidad" };
  L.push("RECOMENDACIÓN DE EJERCICIO FÍSICO (adaptada al tratamiento farmacológico)");
  const perfil = [ctx.edad ? `${ctx.edad} años` : null, ctx.caidas ? "caídas en el último año" : null, ctx.fg != null ? `FG ${ctx.fg}` : null, ctx.fevi != null ? `FEVI ${ctx.fevi} %` : null, ctx.nyha != null ? `NYHA ${["", "I", "II", "III", "IV"][ctx.nyha]}` : null, ...cond.filter((c) => !(c === "nyha34" && ctx.nyha != null) && !(c === "fevi_baja" && ctx.fevi != null)).map((c) => condTxt[c]).filter(Boolean)].filter(Boolean);
  if (perfil.length) L.push("Perfil: " + perfil.join(", ") + ".");
  { const st = sppbTxt(ctx); if (st) L.push("Valoración funcional: " + st); }
  L.push(`Tratamiento considerado: ${res.items.map((it) => it.principio.nombre + (it.dosisTotal != null ? " " + dosisTxt(it) : "")).join("; ")}.`);
  if (ctx.libres?.length) L.push(`Otros referidos, no evaluados: ${ctx.libres.join("; ")}.`);
  if (ctx.cribado && CRIBADO_PDF[ctx.cribado.clave]) L.push(CRIBADO_PDF[ctx.cribado.clave][1] + ` (ejercicio regular: ${ctx.cribado.regular ? "sí" : "no"}; enfermedad CV/metabólica/renal: ${ctx.cribado.enfermedad ? "sí" : "no"}${ctx.cribado.sintomas ? "; síntomas referidos" : ""}).`);
  L.push("");
  L.push("Prescripción (FITT):");
  L.push(`- Aeróbico: ${P.aer.frec}. ${P.aer.int} ${P.aer.tiempo}. ${P.aer.tipo}`);
  L.push(`- Fuerza: ${P.fue.frec}. ${P.fue.int} ${P.fue.tiempo}. ${P.fue.tipo}`);
  L.push(`- Equilibrio: ${P.eq.frec}. ${P.eq.int} ${P.eq.tiempo}. ${P.eq.tipo}`);
  { const z = zonaTxt(ctx.zona); if (z) L.push(`- Zona de intensidad: ${z.lineas[0]}. ${z.nota}`); }
  if (ctx.ventana?.mejores?.length) L.push(`- Horario preferible según tomas: ${ctx.ventana.mejores.map((f) => `${String(f.desde).padStart(2, "0")}:00-${String(f.hasta).padStart(2, "0")}:00`).join(" y ")}.`);
  const claves = [];
  for (const c of res.combinadas) if (c.regla.nivel === "alerta") claves.push(`${c.regla.titulo}: ${c.texto}`);
  for (const x of res.interacciones) if (x.nivel === "mayor") claves.push(`Interacción mayor ${x.a.principio.nombre} + ${x.b.principio.nombre}: ${x.efecto}${x.accion ? " " + x.accion : ""}`);
  for (const [amb, titulo] of AMBITOS) for (const g of res.ambitos[amb]) for (const r of g.reglas) if (r.nivel === "alerta") claves.push(`${g.item.principio.nombre} (${titulo.toLowerCase()}): ${r.texto}`);
  if (claves.length) { L.push(""); L.push("Precauciones relevantes:"); for (const k of claves.slice(0, 8)) L.push("- " + k); }
  const prec = [];
  for (const c of res.combinadas) if (c.regla.nivel === "precaucion") prec.push(`${c.regla.titulo}: ${c.texto}`);
  if (prec.length) { L.push(""); L.push("Otras consideraciones:"); for (const k of prec.slice(0, 6)) L.push("- " + k); }
  if (ctx.diario?.length) {
    const d = ctx.diario.filter((x) => (Date.now() - new Date(x.fecha + "T12:00")) / 864e5 <= 28);
    if (d.length) {
      const rpe = (d.reduce((n, x) => n + (x.rpe || 0), 0) / d.length).toFixed(1);
      const conConst = d.filter((x) => x.const && Object.values(x.const).some((v) => v != null));
      const rango = (k) => { const v = conConst.map((x) => x.const[k]).filter((n) => n != null); return v.length ? `${Math.min(...v)}-${Math.max(...v)}` : null; };
      const partes = [];
      const g1 = rango("glucosa_antes"), g2 = rango("glucosa_despues"), ta = rango("ta"), fc = rango("fc");
      if (g1 || g2) partes.push(`glucosa antes ${g1 || "-"} / después ${g2 || "-"} mg/dL`);
      if (ta) partes.push(`TAS ${ta} mmHg`); if (fc) partes.push(`FC fin ${fc} lpm`);
      L.push(""); L.push(`Registro del paciente (4 semanas): ${d.length} sesiones, ${d.reduce((n, x) => n + (x.min || 0), 0)} min, RPE medio ${rpe}/10${partes.length ? "; constantes anotadas: " + partes.join(", ") : ""}.`);
    }
  }
  L.push("");
  const sem = ctx.prescrito?.semanas || ctx.prescriptor?.revision || 6;
  L.push(`Se entrega al paciente plan de ejercicio por escrito. Reevaluar tolerancia y ajustar progresión en ${sem} semanas${ctx.prescrito ? " (" + (() => { const f = new Date(ctx.prescrito.fecha); f.setDate(f.getDate() + ctx.prescrito.semanas * 7); return f.toLocaleDateString("es-ES"); })() + ")" : ""}. Generado con Pauta Activa · Medicación y Ejercicio (${WEB})${ctx.appVersion ? " v" + ctx.appVersion : ""}, base de conocimiento v${kb.version}; recomendación orientativa que requiere valoración clínica individual.${ctx.prescriptor?.nombre ? " " + [ctx.prescriptor.nombre, ctx.prescriptor.especialidad, ctx.prescriptor.centro, ctx.prescriptor.colegiado ? "col. " + ctx.prescriptor.colegiado : ""].filter(Boolean).join(", ") + "." : ""}`);
  return L.join("\n");
}
