/* Motor de reglas: medicación + dosis + contexto → informe.
   Sin dependencias. Se usa igual en la app y en tests. */

export const ORDEN_NIVEL = { alerta: 3, precaucion: 2, info: 1 };
export const ORDEN_DDI = { mayor: 3, moderada: 2, menor: 1 };

// factor para pasar la unidad introducida a la unidad del umbral (mg o equivalente)
const FACTOR = {
  "gotas/día": null, "g/día": null, "mEq/día": null, "mg/24 h": 1, "mg/mes": 1, "mg/3 meses": 1, "mg/2 meses": 1, "mcg/día": 0.001, "UI/semana": null,
  mg: 1, "mg/día": 1, "mg/semana": 1, "mg/6 meses": 1, "mg/año": 1,
  mcg: 0.001, "mcg/h": 0.001, "inhalaciones/día": 1, UI: null,
};

export function normalizar(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Índice de búsqueda: principios, clases y marcas. */
export function construirIndice(kb, marcas = []) {
  const porId = new Map();
  const entradas = []; // {texto, tipo, principio, clase, dosis?, unidad?}
  for (const clase of kb.clases) {
    for (const p of clase.principios) {
      porId.set(p.id, { principio: p, clase });
      entradas.push({ texto: p.nombre, tipo: "principio", pid: p.id });
      for (const m of p.marcas || []) entradas.push({ texto: m, tipo: "marca", pid: p.id });
    }
  }
  for (const cmb of kb.combinaciones || []) {
    const comps = cmb.componentes.filter((c) => porId.has(c.pid));
    if (comps.length < 2) continue;
    for (const m of [cmb.nombre, ...(cmb.marcas || [])]) entradas.push({ texto: m, tipo: "combo", pid: comps[0].pid, componentes: comps, generico: m === cmb.nombre });
  }
  const clasesPorId = new Map(kb.clases.map((c) => [c.id, c]));
  for (const m of marcas) {
    if (m.clase && m.pa && !m.principios) {
      // presentación del nomenclátor sin principio en la base, clasificada por su código ATC:
      // se crea un principio "sintético" en la clase, que hereda las precauciones del grupo
      const clase = clasesPorId.get(m.clase);
      if (!clase) continue;
      const pid = "atc:" + normalizar(m.pa).replace(/[^a-z0-9]+/g, "_");
      if (!porId.has(pid)) {
        const principio = { id: pid, nombre: m.pa, marcas: [], atc: m.atc, sintetico: true, ficha: m.ft || null,
          nota: `Clasificado automáticamente por su código ATC (${m.atc}) en el grupo «${clase.nombre}»: se aplican las precauciones generales del grupo, sin reglas específicas revisadas para este fármaco ni umbral de dosis.` };
        clase.principios.push(principio);
        porId.set(pid, { principio, clase });
        entradas.push({ texto: m.pa, tipo: "principio", pid });
      }
      if (m.ft && !porId.get(pid).principio.ficha) porId.get(pid).principio.ficha = m.ft;
      entradas.push({ texto: m.nombre, tipo: "marca", pid, dosis: m.dosis?.[0] ?? null });
      continue;
    }
    const comps = m.principios.filter((x) => porId.has(x)).map((x, i) => ({ pid: x, dosis: m.dosis?.[m.principios.indexOf(x)] ?? null }));
    if (!comps.length) continue;
    if (comps.length === 1) entradas.push({ texto: m.nombre, tipo: "marca", pid: comps[0].pid, dosis: comps[0].dosis, unidad: m.unidad });
    else entradas.push({ texto: m.nombre, tipo: "combo", pid: comps[0].pid, componentes: comps });
  }
  for (const e of entradas) e.norm = normalizar(e.texto);
  // dosis por comprimido disponibles en España (del nomenclátor), por principio: para ofrecerlas como opciones rápidas
  const dosisPorPid = new Map();
  for (const e of entradas) if (e.tipo === "marca" && e.dosis != null && e.dosis > 0) { const set = dosisPorPid.get(e.pid) || new Set(); set.add(e.dosis); dosisPorPid.set(e.pid, set); }
  for (const [k, v] of dosisPorPid) { const arr = [...v].sort((x, y) => x - y); const max = arr[arr.length - 1]; dosisPorPid.set(k, arr.filter((d) => d >= max / 50).slice(0, 8)); }
  return { porId, entradas, dosisPorPid };
}

/** Distancia de edición limitada (Levenshtein con corte). */
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let minFila = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < minFila) minFila = cur[j];
    }
    if (minFila > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

export function buscar(indice, q, limite = 8) {
  const n = normalizar(q);
  if (n.length < 2) return [];
  const empieza = [], contiene = [], palabras = [];
  const toks = n.split(" ").filter(Boolean);
  for (const e of indice.entradas) {
    const i = e.norm.indexOf(n);
    if (i === 0) empieza.push(e);
    else if (i > 0) contiene.push(e);
    else if (toks.length > 1 && toks.every((t) => e.norm === t || e.norm.startsWith(t + " ") || e.norm.includes(" " + t))) palabras.push(e); // "omeprazol 20" → OMEPRAZOL CINFA 20 MG
  }
  // principios y marcas cortas antes que presentaciones largas del nomenclátor
  const peso = (e) => (e.tipo === "principio" ? 0 : 1) * 1000 + e.norm.length;
  empieza.sort((x, y) => peso(x) - peso(y)); palabras.sort((x, y) => peso(x) - peso(y));
  const vistos = new Set();
  const res = [];
  for (const e of [...empieza, ...contiene, ...palabras]) {
    const k = e.tipo + ":" + e.texto;
    if (vistos.has(k)) continue;
    vistos.add(k);
    res.push(e);
    if (res.length >= limite) break;
  }
  // sin resultados: tolerar erratas comparando con la primera palabra de cada entrada
  if (!res.length && n.length >= 4) {
    const max = n.length <= 6 ? 1 : 2;
    const cand = [];
    for (const e of indice.entradas) {
      const w = e.norm.split(/[\s(\/]/)[0];
      if (!w || Math.abs(w.length - n.length) > max) continue;
      const d = distancia(n, w.slice(0, Math.max(n.length, w.length)), max);
      if (d <= max) cand.push({ e, d });
    }
    cand.sort((a, b) => a.d - b.d || (a.e.tipo === "principio" ? -1 : 1));
    for (const { e } of cand) { const k = e.tipo + ":" + e.texto; if (vistos.has(k)) continue; vistos.add(k); res.push({ ...e, aproximado: true }); if (res.length >= limite) break; }
  }
  return res;
}

/** Categoría de dosis: "alta" | "habitual" | "desconocida" */
export function categoriaDosis(principio, dosisTotal, unidad, aDemanda = false) {
  const umbral = principio.umbral_mg?.alta;
  if (umbral == null || dosisTotal == null || Number.isNaN(dosisTotal)) return "desconocida";
  const f = FACTOR[unidad ?? principio.unidad ?? "mg"];
  if (f == null) return "desconocida";
  return (aDemanda ? dosisTotal * f > umbral : dosisTotal * f >= umbral) ? "alta" : "habitual";
}

function cumple(cond, ctx) {
  if (!cond) return true;
  if (cond.dosis && cond.dosis !== ctx.dosisCat) return false;
  if (cond.principio && cond.principio !== ctx.principio.id) return false;
  if (cond.edad_min != null && !(ctx.edad != null && ctx.edad >= cond.edad_min)) return false;
  if (cond.caidas && !ctx.caidas) return false;
  if (cond.condicion && !(ctx.condiciones && ctx.condiciones.has(cond.condicion))) return false;
  if (cond.sin_condicion && ctx.condiciones && ctx.condiciones.has(cond.sin_condicion)) return false;
  return true;
}

function claveDDI(x) {
  return x.startsWith("clase:") ? { tipo: "clase", id: x.slice(6) } : { tipo: "principio", id: x };
}
function coincideDDI(k, med) {
  return k.tipo === "clase" ? med.clase.id === k.id : med.principio.id === k.id;
}

/**
 * @param meds [{pid, dosis (por toma), tomas, unidad}]
 * @param ctx {edad, caidas}
 */
export function evaluar({ kb, ddiCurado, ddi, indice }, meds, ctx = {}) {
  const items = [];
  for (const m of meds) {
    const ref = indice.porId.get(m.pid);
    if (!ref) continue;
    const { principio, clase } = ref;
    const unidad = m.unidad || principio.unidad || "mg";
    const esDiaria = !/semana|mes|año/.test(unidad);
    const total = m.dosis != null ? m.dosis * (esDiaria ? (m.tomas || 1) : 1) : null;
    const dosisCat = categoriaDosis(principio, total, unidad, !!m.aDemanda);
    const senales = new Set([...(clase.senales || []), ...(principio.senales_extra || [])]);
    items.push({ principio, clase, unidad, dosisPorToma: m.dosis, tomas: m.tomas || 1, dosisTotal: total, dosisCat, senales, esDiaria, aDemanda: !!m.aDemanda });
  }

  // 1) Recomendaciones por fármaco y ámbito
  const ambitos = { general: [], aerobico: [], fuerza: [], equilibrio: [] };
  for (const it of items) {
    const base = { principio: it.principio, edad: ctx.edad, caidas: ctx.caidas, dosisCat: it.dosisCat, condiciones: ctx.condiciones };
    for (const amb of Object.keys(ambitos)) {
      const reglas = (it.clase[amb] || []).filter((r) => cumple(r.si, base));
      // si una regla condicionada a dosis alta se cumple, elimina las de "info" redundantes? no: se muestran todas
      if (reglas.length) ambitos[amb].push({ item: it, reglas });
    }
  }

  // 2) Reglas combinadas
  const combinadas = [];
  const conteo = (senal) => items.filter((it) => it.senales.has(senal));
  for (const r of kb.reglas_combinadas) {
    const si = r.si || {};
    let ok = true, n = 0, implicados = new Set();
    if (si.todas) {
      for (const s of si.todas) {
        const c = conteo(s);
        if (!c.length) { ok = false; break; }
        c.forEach((it) => implicados.add(it));
      }
    }
    if (ok && si.senal) {
      const c = conteo(si.senal);
      n = c.length;
      if (n < (si.min || 1)) ok = false;
      c.forEach((it) => implicados.add(it));
    }
    if (ok && si.edad_min != null && !(ctx.edad != null && ctx.edad >= si.edad_min)) ok = false;
    if (ok && si.condicion && !(ctx.condiciones && ctx.condiciones.has(si.condicion))) ok = false;
    if (ok && si.sin_condicion && ctx.condiciones && ctx.condiciones.has(si.sin_condicion)) ok = false;
    if (!ok) continue;
    combinadas.push({ regla: r, n: n || implicados.size, implicados: [...implicados], texto: r.texto.replace("{n}", String(n || implicados.size)) });
  }

  // 3) Interacciones fármaco–fármaco
  const interacciones = [];
  const vistos = new Set();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      const par = [a.principio.id, b.principio.id].sort().join("|");
      if (vistos.has(par)) continue;
      vistos.add(par);
      if (a.principio.id === b.principio.id) {
        interacciones.push({ a, b, nivel: "moderada", fuente: "duplicidad", efecto: "El mismo principio activo aparece dos veces.", accion: "Compruebe que no está tomando dos presentaciones del mismo fármaco (p. ej. marca y genérico)." });
        continue;
      }
      let hit = null;
      for (const x of ddiCurado.interacciones) {
        const ka = claveDDI(x.a), kb_ = claveDDI(x.b);
        if ((coincideDDI(ka, a) && coincideDDI(kb_, b)) || (coincideDDI(ka, b) && coincideDDI(kb_, a))) {
          if (!hit || ORDEN_DDI[x.nivel] > ORDEN_DDI[hit.nivel]) hit = { ...x, fuente: "curada" };
        }
      }
      if (!hit && a.clase.id === b.clase.id && a.clase.principios.length > 1 && !a.clase.combinable) {
        hit = { nivel: "moderada", fuente: "duplicidad", efecto: `Dos fármacos de la misma clase (${a.clase.nombre}).`, accion: "Suele ser una duplicidad terapéutica; coméntelo con su médico o farmacéutico." };
      }
      if (!hit && ddi?.pares?.length) {
        const [x, y] = [a.principio.id, b.principio.id].sort();
        const p = ddi.pares.find((q) => q[0] === x && q[1] === y);
        if (p) hit = { nivel: p[2], fuente: "ddinter", efecto: `Interacción de nivel ${p[2] === "mayor" ? "mayor" : p[2] === "moderada" ? "moderado" : "menor"} registrada en la base internacional DDInter 2.0; esta base no incluye el mecanismo ni el texto en español.`, accion: p[2] === "mayor" ? "Pregunte a su médico o farmacéutico antes de combinarlos; consulte la sección 4.5 (interacciones) de las fichas técnicas." : "Suele bastar con comentarlo en la próxima consulta; el detalle está en la sección 4.5 de las fichas técnicas." };
      }
      if (hit) interacciones.push({ nivel: hit.nivel, fuente: hit.fuente, efecto: hit.efecto, accion: hit.accion, a, b });
    }
  }
  interacciones.sort((x, y) => ORDEN_DDI[y.nivel] - ORDEN_DDI[x.nivel]);

  // 4) Resumen de niveles
  const resumen = { alerta: 0, precaucion: 0, info: 0 };
  for (const amb of Object.values(ambitos)) for (const g of amb) for (const r of g.reglas) resumen[r.nivel]++;
  for (const c of combinadas) resumen[c.regla.nivel]++;

  // 5) Señales agregadas (para el panel de "perfil")
  const perfil = {};
  for (const it of items) for (const s of it.senales) (perfil[s] ||= []).push(it);

  return { items, ambitos, combinadas, interacciones, resumen, perfil };
}

/** Informe en texto plano (para copiar / compartir). */
export function informeTexto(kb, res, ctx) {
  const L = [];
  const nivel = (n) => kb.niveles[n]?.etiqueta?.toUpperCase() || n;
  L.push("MEDICACIÓN Y EJERCICIO — informe orientativo");
  L.push(new Date().toLocaleDateString("es-ES"));
  if (ctx.edad) L.push(`Edad: ${ctx.edad}${ctx.caidas ? " · caídas en el último año" : ""}`);
  L.push("");
  L.push("MEDICACIÓN");
  for (const it of res.items) {
    const d = it.dosisTotal != null ? ` — ${it.dosisTotal} ${it.unidad}${it.esDiaria ? "/día" : ""}${it.dosisCat === "alta" ? " (dosis alta)" : ""}` : "";
    L.push(`• ${it.principio.nombre}${d}`);
  }
  if (res.combinadas.length) {
    L.push("", "COMBINACIONES A TENER EN CUENTA");
    for (const c of res.combinadas) L.push(`[${nivel(c.regla.nivel)}] ${c.regla.titulo}: ${c.texto}`);
  }
  for (const [amb, titulo] of [["general", "ANTES DE EMPEZAR"], ["aerobico", "EJERCICIO AERÓBICO"], ["fuerza", "FUERZA"], ["equilibrio", "EQUILIBRIO"]]) {
    if (!res.ambitos[amb].length) continue;
    L.push("", titulo);
    for (const g of res.ambitos[amb]) {
      L.push(`${g.item.principio.nombre}:`);
      for (const r of g.reglas) L.push(`  [${nivel(r.nivel)}] ${r.texto}`);
    }
  }
  if (res.interacciones.length) {
    L.push("", "INTERACCIONES ENTRE FÁRMACOS");
    for (const x of res.interacciones) L.push(`[${x.nivel.toUpperCase()}] ${x.a.principio.nombre} + ${x.b.principio.nombre}: ${x.efecto} ${x.accion || ""}`.trim());
  }
  L.push("", kb.aviso, "", "By Pelayo Fdez. Cidón. Médico especialista en Medicina Interna y prescriptor de ejercicio físico · Fuerza Basada en Evidencia");
  return L.join("\n");
}

/* ---------- ¿Cuándo entrenar? ---------- */
export const MOMENTOS = ["desayuno", "comida", "cena", "noche"];
export const HORA_MOMENTO = { desayuno: 8, comida: 14, cena: 21, noche: 23 };
export const MOMENTO_TXT = { desayuno: "Desayuno", comida: "Comida", cena: "Cena", noche: "Al acostarse" };

/** Momentos por defecto a partir del número de tomas (cuando no se han indicado). */
export function momentosPorDefecto(tomas) {
  return [["desayuno"], ["desayuno", "cena"], ["desayuno", "comida", "cena"], MOMENTOS][Math.min(Math.max(tomas || 1, 1), 4) - 1];
}

/**
 * Calcula, para cada hora del día (6–23), el nivel de idoneidad para entrenar según las tomas.
 * @returns {{horas: [{h, nivel, motivos:[]}], franjas: [{desde, hasta, nivel}], mejores: [...], avisos: [...]}}
 */
export function ventanaEntrenamiento(indice, meds, horasMomento = HORA_MOMENTO) {
  const NIV = { verde: -1, ambar: 1, rojo: 3 };
  const horas = [];
  for (let h = 6; h <= 23; h++) horas.push({ h, score: 0, motivos: [] });
  const avisos = [];
  for (const m of meds) {
    const ref = indice.porId.get(m.pid);
    if (!ref) continue;
    const horario = ref.principio.horario || ref.clase.horario;
    if (!horario) continue;
    const momentos = (m.momentos && m.momentos.length ? m.momentos : momentosPorDefecto(m.tomas)).filter((x) => horasMomento[x] != null);
    const reglas = [...(horario.evitar || []).map((r) => ({ ...r, tipo: "evitar" })), ...(horario.preferir || []).map((r) => ({ ...r, tipo: "preferir" }))];
    for (const mom of momentos) {
      const t0 = horasMomento[mom];
      for (const r of reglas) {
        if (r.hasta - r.desde >= 24) { avisos.push({ farmaco: ref.principio.nombre, motivo: r.motivo, nivel: r.nivel }); continue; }
        for (const hh of horas) {
          // la toma de la noche afecta a la mañana siguiente
          const rel = ((hh.h - t0) + 24) % 24;
          if (rel >= r.desde && rel < r.hasta) {
            hh.score += NIV[r.nivel];
            hh.motivos.push({ farmaco: ref.principio.nombre, momento: mom, motivo: r.motivo, nivel: r.nivel, tipo: r.tipo });
          }
        }
      }
    }
  }
  for (const hh of horas) hh.nivel = hh.score >= 3 ? "rojo" : hh.score >= 1 ? "ambar" : hh.score < 0 ? "verde" : "neutro";
  // franjas contiguas
  const franjas = [];
  for (const hh of horas) {
    const last = franjas[franjas.length - 1];
    if (last && last.nivel === hh.nivel) last.hasta = hh.h + 1; else franjas.push({ desde: hh.h, hasta: hh.h + 1, nivel: hh.nivel });
  }
  const mejores = franjas.filter((f) => (f.nivel === "verde" || f.nivel === "neutro") && f.hasta - f.desde >= 2 && f.desde < 22).sort((a, b) => (b.nivel === "verde") - (a.nivel === "verde") || (b.hasta - b.desde) - (a.hasta - a.desde)).slice(0, 2);
  // motivos agrupados (para explicar)
  const motivosMap = new Map();
  for (const hh of horas) for (const mo of hh.motivos) {
    const k = `${mo.farmaco}|${mo.momento}|${mo.motivo}`;
    const e = motivosMap.get(k) || { ...mo, desde: hh.h, hasta: hh.h + 1 };
    e.hasta = hh.h + 1; motivosMap.set(k, e);
  }
  return { horas, franjas, mejores, motivos: [...motivosMap.values()], avisos };
}

/** Señales de alarma universales: cuándo parar y consultar (ACSM / Exercise is Medicine). */
export const ALARMA = [
  "Dolor, opresión o quemazón en el pecho, el cuello, la mandíbula o el brazo.",
  "Mareo intenso, desmayo o sensación de que se va a desmayar.",
  "Falta de aire desproporcionada para el esfuerzo, o que no mejora al parar.",
  "Palpitaciones rápidas o irregulares que no ceden en unos minutos.",
  "Sudor frío, palidez, náuseas o confusión; en diabetes, temblor o hambre súbita (hipoglucemia).",
  "Dolor articular u óseo agudo, o un golpe en la cabeza si toma anticoagulantes.",
];

const ACCION = /\b(enfriamiento|mida|evite|evitar|beba|lleve|no entrene|no haga|no use|haga|tome|consulte|pare|use|guíese|hidrat|pésese|reduzca|espere|prefiera|comente|acuda|respete|póngase|descanse|avise|pida|cambios de posición|siempre con|suspenda|levántese|mantenga|aumente)\b/i;

/** Frase más útil de un texto: la primera que contiene una acción; si no, la primera. */
function primeraFrase(txt, max = 190) {
  const frases = (txt || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  const f = frases.find((x) => ACCION.test(x)) || frases[0] || "";
  return f.length > max ? f.slice(0, max - 1).trimEnd() + "…" : f;
}

/** «Lo esencial»: hasta `max` puntos accionables, deduplicados (uno por fármaco, las reglas combinadas primero). */
export function loEsencial(res, max = 5) {
  const puntos = [];
  const usados = new Set();
  for (const c of [...res.combinadas].sort((a, b) => ORDEN_NIVEL[b.regla.nivel] - ORDEN_NIVEL[a.regla.nivel])) {
    if (c.regla.nivel === "info") continue;
    puntos.push({ nivel: c.regla.nivel, titulo: c.regla.titulo, texto: primeraFrase(c.texto), de: c.implicados.map((i) => i.principio.nombre) });
    for (const i of c.implicados) usados.add(i.principio.id);
  }
  for (const x of res.interacciones.filter((x) => x.nivel === "mayor")) {
    puntos.push({ nivel: "alerta", titulo: `${x.a.principio.nombre} + ${x.b.principio.nombre}`, texto: primeraFrase(x.accion || x.efecto), de: [] });
  }
  for (const nivel of ["alerta", "precaucion"]) {
    for (const amb of ["general", "aerobico", "fuerza", "equilibrio"]) {
      for (const g of res.ambitos[amb]) {
        const pid = g.item.principio.id;
        if (usados.has(pid)) continue;
        const r = g.reglas.find((r) => r.nivel === nivel);
        if (!r) continue;
        usados.add(pid);
        puntos.push({ nivel, titulo: g.item.principio.nombre, texto: primeraFrase(r.texto), de: [] });
      }
    }
  }
  return puntos.sort((a, b) => ORDEN_NIVEL[b.nivel] - ORDEN_NIVEL[a.nivel]).slice(0, max);
}


/** Síntomas frecuentes al entrenar y las señales farmacológicas que pueden explicarlos. */
export const SINTOMAS = [
  { id: "mareo", nombre: "Mareo al levantarme o al terminar", senales: ["hipotension", "bradicardia", "sedacion", "hipoglucemia", "deshidratacion"], consejo: "Termine siempre con 5–10 minutos suaves, levántese despacio, beba agua y no entrene en ayunas si toma medicación para el azúcar. Si se repite o llega a desmayarse, consulte: puede que haya que ajustar alguna dosis.", alarma: "Si el mareo va con dolor en el pecho, desmayo o palpitaciones, deje de entrenar y consulte hoy." },
  { id: "calambres", nombre: "Calambres o dolor muscular", senales: ["miopatia", "hipopotasemia", "deshidratacion", "estatina", "diuretico"], consejo: "Hidratación con algo de sal en sesiones largas, progresión lenta de la carga y estiramientos suaves. Si el dolor muscular es generalizado, con debilidad o la orina oscura, deje de entrenar y consulte: hay que descartar un efecto del fármaco (analítica de CK y potasio)." },
  { id: "cansancio", nombre: "Me canso mucho más de lo normal", senales: ["fatiga", "bradicardia", "fc_no_valida", "sedacion", "perdida_muscular", "hipotension"], consejo: "Algunos fármacos limitan el pulso o la energía disponible: guíese por la sensación de esfuerzo, no por el reloj, y entrene en la franja del día en que se encuentre mejor (pestaña ¿Cuándo?). Si el cansancio es nuevo o va a más, coméntelo con su médico." },
  { id: "hipoglucemia", nombre: "Sudor frío, temblor o hambre repentina", senales: ["hipoglucemia", "enmascara_hipoglucemia"], consejo: "Puede ser una bajada de azúcar. Pare, tome 15 g de azúcar rápido (zumo, 3 terrones) y espere 15 minutos. Mida la glucosa antes de entrenar y lleve siempre algo de azúcar. Si usa insulina o sulfonilureas, hable con su médico de ajustar la dosis los días de ejercicio.", alarma: "Confusión, dificultad para hablar o pérdida de conocimiento: avise a alguien y llame al 112." },
  { id: "palpitaciones", nombre: "Palpitaciones o pulso irregular", senales: ["taquicardia", "qt", "hipopotasemia", "hipertension"], consejo: "Reduzca la intensidad y evite estimulantes (café, pre-entrenos, descongestivos). Si las palpitaciones duran más de unos minutos, van con mareo o se repiten, consulte: con algunos fármacos conviene un electrocardiograma y un control de potasio.", alarma: "Palpitaciones con dolor en el pecho, desmayo o falta de aire intensa: pare y llame al 112." },
  { id: "calor", nombre: "Mucho calor, poca sudoración o boca seca", senales: ["calor", "anticolinergico", "deshidratacion"], consejo: "Hay fármacos que dificultan disipar el calor o reducen la sudoración. Entrene a primera hora o en interiores climatizados, beba antes de tener sed y pare ante dolor de cabeza, náuseas o piel caliente y seca." },
  { id: "sangrado", nombre: "Moratones, sangrados o encías que sangran", senales: ["sangrado"], consejo: "Con anticoagulantes o antiagregantes son esperables moratones pequeños; evite deportes de contacto y proteja cabeza y articulaciones. Hematomas grandes sin golpe, sangre en orina o heces negras: consulte sin esperar.", alarma: "Golpe en la cabeza tomando anticoagulantes: acuda a urgencias aunque se encuentre bien." },
  { id: "tendon", nombre: "Dolor en un tendón (talón, hombro)", senales: ["tendon", "corticoide"], consejo: "Algunos antibióticos (quinolonas) y los corticoides debilitan los tendones. Pare la actividad que lo provoca, no estire con dolor y consulte: con dolor agudo en el talón hay que descartar rotura del Aquiles." },
  { id: "inestabilidad", nombre: "Inestabilidad o miedo a caerme", senales: ["caidas", "sedacion", "hipotension", "anticolinergico"], consejo: "El entrenamiento de equilibrio es la mejor prevención, siempre con apoyo al alcance. Revise con su médico los fármacos que dan sueño o bajan la tensión: a menudo se puede reducir alguno. Zapatillas con suela firme y luz suficiente." },
  { id: "piel", nombre: "Quemaduras solares con poco sol", senales: ["fotosensibilidad"], consejo: "Fotosensibilidad por el fármaco: entrene a la sombra o a primera hora, con protector solar 50 y ropa que cubra; si aparece una erupción, consulte." },
];

/** Para cada síntoma, los fármacos de la lista que podrían explicarlo (por sus señales). */
export function sintomasPosibles(res) {
  return SINTOMAS.map((s) => {
    const farmacos = res.items.filter((it) => s.senales.some((x) => it.senales.has(x))).map((it) => it.principio.nombre);
    return { ...s, farmacos };
  });
}

/* ---------- Mi plan: sesiones concretas, objetivo semanal y progresión ---------- */
/** Día de la semana (0 domingo … 6 sábado) → tipo de sesión del plan tipo. */
export const PLAN_SEMANA = { 1: "fuerza_eq", 2: "aerobico", 3: "fuerza", 4: "aerobico", 5: "fuerza_eq", 6: "aerobico", 0: "descanso" };

/** Bloques de una sesión según tipo y nivel (fragil / estándar). Tiempos en minutos. */
export function sesionTipo(tipo, { fragil = false, minutosAer = 30 } = {}) {
  if (tipo === "aerobico") {
    const principal = fragil ? 10 : minutosAer;
    return { tipo, titulo: "Aeróbico", min: principal + 10, bloques: [
      { nombre: "Calentamiento", detalle: "Caminar suave, mover brazos y tobillos", min: 5, pict: "marcha" },
      { nombre: fragil ? "Marcha a paso cómodo" : "Marcha, bici o elíptica", detalle: fragil ? "Puede hablar con frases largas. Si se cansa, pare y siga cuando se recupere." : "Ritmo en el que puede hablar pero no cantar (RPE 4–6).", min: principal, pict: fragil ? "marcha" : "bici", clave: "Hombros relajados, mirada al frente; el ritmo lo marca la respiración, no el reloj.", facil: "Tramos de 3–5 minutos con pausas de 1 minuto; vale caminar por casa o el pasillo.", dificil: "Intervalos: 3 min a ritmo cómodo y 1 min algo más rápido (puede hablar con frases cortas), 5–6 veces." },
      { nombre: "Enfriamiento", detalle: "Bajar el ritmo poco a poco; no pararse de golpe", min: 5, pict: "estirar" },
    ] };
  }
  if (tipo === "equilibrio") {
    return { tipo, titulo: "Equilibrio", min: 12, bloques: [
      { nombre: "Levantarse y sentarse", detalle: "De una silla, 8–10 veces, con las manos en el pecho si puede", min: 3, pict: "silla", clave: "Pies bajo las rodillas, tronco hacia delante y empuje con las piernas.", facil: "Con las manos en los reposabrazos y una silla algo más alta (cojín).", dificil: "Sin manos, bajando en 3 segundos; o con los pies juntos." },
      { nombre: "Apoyo sobre un pie", detalle: "Junto a una pared o silla, 10–20 s cada pierna, 3 veces", min: 3, pict: "unpie", clave: "Mirada fija en un punto; la mano roza el apoyo sin agarrarlo.", facil: "Con las dos manos en el respaldo, 5–10 s.", dificil: "Sin apoyo y con los ojos cerrados unos segundos, o sobre un cojín." },
      { nombre: "Marcha talón-punta", detalle: "10 pasos en línea, con apoyo cerca; ida y vuelta 3 veces", min: 3, pict: "talonpunta", clave: "Despacio: el talón toca la punta del otro pie; brazos abiertos si hace falta.", facil: "Pasos medio solapados junto a la pared.", dificil: "Hacia atrás, o girando la cabeza a los lados mientras camina." },
      { nombre: "Giros lentos y alcances", detalle: "Girar 90° a cada lado y alcanzar objetos a distintas alturas", min: 3, pict: "giro", clave: "Gire primero la cabeza, luego el tronco; vuelva al centro antes de cambiar de lado.", facil: "Sentado, alcanzando objetos sobre la mesa.", dificil: "De pie sobre una línea estrecha, alcanzando más lejos." },
    ] };
  }
  const fuerzaFragil = [
    { nombre: "Levantarse de la silla", detalle: "2 series de 8–12; si es fácil, sin manos", min: 5, pict: "silla", clave: "Tronco hacia delante («nariz sobre los pies») y empuje con los talones.", facil: "Con las manos en los reposabrazos; silla más alta con un cojín.", dificil: "Sin manos y bajando despacio en 3 segundos; con una mochila ligera." },
    { nombre: "Elevación de talones", detalle: "Apoyado en el respaldo, 2 × 10–15", min: 3, pict: "talones", clave: "Suba despacio hasta la punta de los pies y baje en 2 segundos.", facil: "Sentado, levantando los talones con las manos sobre los muslos.", dificil: "Sobre una sola pierna, o en el borde de un escalón." },
    { nombre: "Extensión de rodilla sentado", detalle: "Estirar la pierna y aguantar 2 s, 2 × 10 cada lado", min: 4, pict: "rodilla", clave: "Punta del pie hacia usted; espalda apoyada en el respaldo.", facil: "Sin aguantar arriba; menos repeticiones.", dificil: "Con una tobillera lastrada de 0,5–1 kg o una banda en el tobillo." },
    { nombre: "Flexión de brazos con botella o banda", detalle: "2 × 10–12 cada brazo", min: 4, pict: "brazo", clave: "Codo pegado al cuerpo; suba y baje sin balancear el tronco.", facil: "Botella de medio litro, o sin peso.", dificil: "Botella de 1,5 L o banda más dura; los dos brazos a la vez." },
    { nombre: "Puente de glúteo o marcha en el sitio", detalle: "2 × 10, o 1 minuto de marcha levantando rodillas", min: 4, pict: "puente", clave: "Apriete los glúteos arriba; no arquee la espalda.", facil: "Marcha en el sitio sentado, levantando las rodillas.", dificil: "Puente con una pierna estirada; marcha levantando más las rodillas, 2 minutos." },
  ];
  const fuerzaStd = [
    { nombre: "Sentadilla a la silla", detalle: "2–3 series de 8–15; bajar despacio, subir sin impulso", min: 6, pict: "sentadilla", clave: "Rodillas en la dirección de los pies, peso en los talones; la silla es solo referencia.", facil: "Sentarse del todo y levantarse con ayuda de las manos.", dificil: "Sin tocar la silla, con una mochila o mancuernas; o sentadilla búlgara ligera." },
    { nombre: "Empuje (flexiones en pared o inclinadas)", detalle: "2–3 × 8–15", min: 5, pict: "pared", clave: "Cuerpo en línea recta, codos a 45°, baje el pecho hacia el apoyo.", facil: "Más cerca de la pared, manos más altas.", dificil: "Manos en una mesa baja o en el suelo con rodillas apoyadas." },
    { nombre: "Remo con banda elástica", detalle: "2–3 × 10–15, hombros atrás", min: 5, pict: "remo", clave: "Lleve los codos hacia atrás y junte las escápulas; cuello largo.", facil: "Banda más suave, o con una sola mano.", dificil: "Banda más dura, aguantando 2 s atrás; o con mancuerna inclinado." },
    { nombre: "Bisagra de cadera", detalle: "Con mancuerna ligera o botella, 2–3 × 8–12; espalda recta", min: 5, pict: "bisagra", clave: "Cadera atrás como para cerrar un cajón con el trasero; rodillas poco flexionadas.", facil: "Sin peso, con las manos deslizando por los muslos.", dificil: "Peso muerto con mancuernas o garrafa; una pierna si tiene buen equilibrio." },
    { nombre: "Elevación de talones", detalle: "2 × 12–15", min: 3, pict: "talones", clave: "Suba despacio hasta la punta de los pies y baje en 2 segundos.", facil: "Con las dos manos en el respaldo.", dificil: "A una pierna, o en el borde de un escalón." },
    { nombre: "Press de hombro ligero", detalle: "2 × 10–12; respire siempre, nunca aguante el aire", min: 5, pict: "hombro", clave: "Expulse el aire al subir; no arquee la espalda baja.", facil: "Sentado, con botellas pequeñas, sin llegar a estirar del todo.", dificil: "Mancuernas de 3–5 kg o banda bajo los pies; de pie." },
  ];
  const bloques = (fragil ? fuerzaFragil : fuerzaStd).map((b) => ({ ...b }));
  const conEq = tipo === "fuerza_eq";
  if (conEq) bloques.push({ nombre: "Equilibrio (5 min)", detalle: "Apoyo sobre un pie y marcha talón-punta, con apoyo cerca", min: 5, pict: "unpie", clave: "Mirada fija en un punto; la mano roza el apoyo sin agarrarlo.", facil: "Con las dos manos en el respaldo, pies algo separados.", dificil: "Sin apoyo, ojos cerrados unos segundos o sobre un cojín." });
  return { tipo, titulo: conEq ? "Fuerza y equilibrio" : "Fuerza", min: bloques.reduce((n, b) => n + b.min, 0) + 5, bloques: [{ nombre: "Calentamiento", detalle: "Marcha suave y movilidad de hombros, caderas y tobillos", min: 5, pict: "marcha" }, ...bloques] };
}

/** Objetivo semanal: minutos y sesiones (OMS/ACSM: 150 min aeróbico + 2 fuerza; en fragilidad se empieza por 90 min). */
export function objetivoSemanal({ fragil = false } = {}) {
  return { min: fragil ? 90 : 150, sesiones: fragil ? 4 : 5 };
}

/** Semanas consecutivas (hasta esta) cumpliendo el objetivo de minutos. */
export function rachaSemanas(diario, objMin, ahora = new Date()) {
  const lunes = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  let ini = lunes(ahora), racha = 0;
  for (let i = 0; i < 52; i++) {
    const fin = new Date(ini); fin.setDate(ini.getDate() + 7);
    const min = diario.filter((x) => { const d = new Date(x.fecha + "T12:00"); return d >= ini && d < fin; }).reduce((n, x) => n + (x.min || 0), 0);
    if (min >= objMin) racha++; else if (i > 0) break; // la semana en curso no rompe la racha
    ini = new Date(ini); ini.setDate(ini.getDate() - 7);
  }
  return racha;
}

/** Plan semanal personalizado: a partir de los días elegidos (0 domingo … 6 sábado) alterna fuerza+equilibrio, aeróbico y fuerza.
    Devuelve un mapa día → tipo como PLAN_SEMANA. Sin días (o todos los de lunes a sábado) devuelve el plan tipo. */
export function planSemana(dias) {
  const sel = [...new Set((dias || []).map(Number).filter((d) => d >= 0 && d <= 6))];
  if (!sel.length) return { ...PLAN_SEMANA };
  const orden = sel.sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // lunes primero
  const ciclo = ["fuerza_eq", "aerobico", "fuerza", "aerobico", "fuerza_eq", "aerobico", "fuerza"];
  const plan = { 0: "descanso", 1: "descanso", 2: "descanso", 3: "descanso", 4: "descanso", 5: "descanso", 6: "descanso" };
  orden.forEach((d, i) => { plan[d] = ciclo[i % ciclo.length]; });
  if (orden.length === 1) plan[orden[0]] = "fuerza_eq";
  return plan;
}

/** Minutos por semana (lunes a domingo) de las últimas `n` semanas, de la más antigua a la actual. */
export function minutosPorSemana(diario, n = 8, ahora = new Date()) {
  const lunes = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const out = [];
  let ini = lunes(ahora);
  for (let i = 0; i < n; i++) {
    const fin = new Date(ini); fin.setDate(ini.getDate() + 7);
    const sem = diario.filter((x) => { const d = new Date(x.fecha + "T12:00"); return d >= ini && d < fin; });
    out.unshift({ desde: ini.toISOString().slice(0, 10), min: sem.reduce((k, x) => k + (x.min || 0), 0), sesiones: sem.length });
    ini = new Date(ini); ini.setDate(ini.getDate() - 7);
  }
  return out;
}

/** Diferencias entre dos listas de medicación (conciliación): nuevos, retirados y cambios de dosis diaria. */
export function compararListas(antes, despues) {
  const clave = (m) => m.pid;
  const dosisDia = (m) => (m.dosis != null ? m.dosis * (m.tomas || 1) : null);
  const A = new Map((antes || []).map((m) => [clave(m), m])), D = new Map((despues || []).map((m) => [clave(m), m]));
  const nuevos = [...D.values()].filter((m) => !A.has(clave(m)));
  const retirados = [...A.values()].filter((m) => !D.has(clave(m)));
  const cambios = [...D.values()].filter((m) => A.has(clave(m)) && dosisDia(A.get(clave(m))) !== dosisDia(m) && (dosisDia(A.get(clave(m))) != null || dosisDia(m) != null)).map((m) => ({ pid: m.pid, antes: dosisDia(A.get(clave(m))), despues: dosisDia(m), unidad: m.unidad || A.get(clave(m)).unidad || "mg" }));
  return { nuevos, retirados, cambios, total: nuevos.length + retirados.length + cambios.length };
}

/** Constantes que merece la pena anotar en el diario según la medicación: glucosa, tensión y pulso. */
export function constantesRelevantes(res, ctx = {}) {
  const cond = ctx.condiciones || new Set();
  const tiene = (...s) => res.items.some((it) => s.some((x) => it.senales.has(x)));
  const out = [];
  if (tiene("hipoglucemia", "enmascara_hipoglucemia") || cond.has("diabetes")) out.push({ id: "glucosa", etiqueta: "Glucosa antes / después", unidad: "mg/dL", min: 20, max: 600, doble: true });
  if (tiene("hipotension", "hipertension") || cond.has("insuficiencia_cardiaca")) out.push({ id: "ta", etiqueta: "Tensión (sistólica)", unidad: "mmHg", min: 60, max: 260 });
  if (tiene("bradicardia", "fc_no_valida", "taquicardia", "qt") || cond.has("marcapasos")) out.push({ id: "fc", etiqueta: "Pulso al terminar", unidad: "lpm", min: 30, max: 220 });
  return out;
}

/** Chequeo previo a la sesión: afirmaciones que conviene confirmar antes de empezar, según la medicación y la situación.
    Cada punto: si el usuario NO lo marca, aplica `nivel` (rojo = no entrene hoy; ambar = sesión suave) y `consejo`. */
const CHEQUEO = [
  { id: "pecho", universal: true, nivel: "rojo", texto: "No tengo dolor en el pecho, palpitaciones ni más falta de aire de lo habitual", consejo: "No entrene hoy y consulte: con estos síntomas el ejercicio debe esperar a una valoración." },
  { id: "fiebre", universal: true, nivel: "rojo", texto: "No tengo fiebre ni me encuentro enfermo", consejo: "Con fiebre o infección aguda, descanse; retome el plan cuando lleve 24–48 h sin fiebre." },
  { id: "glucosa", senales: ["hipoglucemia"], nivel: "ambar", texto: "He comido en las últimas 2–3 horas y llevo azúcar encima (zumo, terrones)", consejo: "No entrene en ayunas: tome algo de hidratos y lleve 15 g de azúcar rápido. Si usa insulina o sulfonilureas, mida la glucosa antes (objetivo 100–250 mg/dL)." },
  { id: "mareo", senales: ["hipotension", "bradicardia"], nivel: "ambar", texto: "No me he mareado hoy al levantarme", consejo: "Empiece más suave, sin cambios bruscos de posición y con apoyo cerca; termine con 5–10 min de enfriamiento." },
  { id: "agua", senales: ["deshidratacion", "diuretico", "renal", "litio"], nivel: "ambar", texto: "He bebido agua en la última hora", consejo: "Beba un vaso de agua antes de empezar y lleve agua: su medicación favorece la deshidratación." },
  { id: "sangrado", senales: ["sangrado"], nivel: "ambar", texto: "No tengo hematomas grandes, sangrado ni me he dado un golpe en la cabeza", consejo: "Con anticoagulantes, ante un sangrado o un golpe en la cabeza consulte antes de entrenar." },
  { id: "sueno", senales: ["sedacion", "anticolinergico"], nivel: "ambar", texto: "No tengo somnolencia ni me noto torpe ahora mismo", consejo: "Espere a que pase el efecto o haga solo ejercicios sentado y con apoyo." },
  { id: "tendon", senales: ["tendon"], nivel: "ambar", texto: "No tengo dolor en ningún tendón (talón, hombro, codo)", consejo: "Evite saltos y carrera; si el dolor es agudo en el talón, consulte antes de seguir." },
  { id: "aire", condiciones: ["epoc_asma", "oxigeno"], nivel: "ambar", texto: "Respiro como de costumbre y tengo el inhalador de rescate (u oxígeno) a mano", consejo: "No entrene si hoy respira peor de lo normal; con el inhalador de rescate a mano, empiece despacio." },
  { id: "apoyo", condiciones: ["fragil", "prefragil"], caidas: true, nivel: "ambar", texto: "Tengo un apoyo firme cerca (silla, pared) o alguien conmigo", consejo: "Haga la sesión junto a una silla o una pared y, si puede, acompañado." },
];
export function chequeoPrevio(res, ctx = {}) {
  const cond = ctx.condiciones || new Set();
  const tiene = (s) => res.items.filter((it) => s.some((x) => it.senales.has(x))).map((it) => it.principio.nombre);
  return CHEQUEO.map((c) => {
    if (c.universal) return { ...c, farmacos: [] };
    const f = c.senales ? tiene(c.senales) : [];
    const porCond = (c.condiciones || []).some((k) => cond.has(k)) || (c.caidas && ctx.caidas);
    return f.length || porCond ? { ...c, farmacos: f } : null;
  }).filter(Boolean);
}
/** Veredicto del chequeo: `marcados` son los ids confirmados. */
export function veredictoChequeo(items, marcados) {
  const falta = items.filter((c) => !marcados.includes(c.id));
  if (falta.some((c) => c.nivel === "rojo")) return { clave: "no", faltan: falta };
  if (falta.length) return { clave: "suave", faltan: falta };
  return { clave: "ok", faltan: [] };
}

/** Sugerencia de progresión a partir de las últimas 2 semanas del diario. */
export function progresion(diario, ahora = Date.now()) {
  const ult = diario.filter((x) => (ahora - new Date(x.fecha + "T12:00")) / 864e5 <= 14);
  if (ult.length < 4) return { clave: "pocos_datos", n: ult.length };
  const rpe = ult.reduce((n, x) => n + (x.rpe || 5), 0) / ult.length;
  const sintomas = ult.some((x) => (x.sintomas || []).some((s) => ["mareo", "palpitaciones", "hipoglucemia", "sangrado"].includes(s)));
  if (sintomas) return { clave: "sintomas", n: ult.length, rpe: rpe.toFixed(1) };
  if (rpe >= 7.5) return { clave: "reducir", n: ult.length, rpe: rpe.toFixed(1) };
  if (ult.length >= 6 && rpe <= 6) return { clave: "progresar", n: ult.length, rpe: rpe.toFixed(1) };
  return { clave: "mantener", n: ult.length, rpe: rpe.toFixed(1) };
}

/* ---------- Cribado preparticipación (algoritmo ACSM 2015, Riebe et al. MSSE 2015) ---------- */
/** Síntomas o signos sugestivos de enfermedad cardiovascular, metabólica o renal (ACSM). */
export const SINTOMAS_ACSM = [
  { id: "dolor_pecho", texto: "Dolor, opresión o molestia en el pecho, cuello, mandíbula o brazos con el esfuerzo" },
  { id: "disnea", texto: "Falta de aire en reposo o con esfuerzos pequeños" },
  { id: "sincope", texto: "Mareos intensos o desmayos" },
  { id: "ortopnea", texto: "Falta de aire al acostarse o que le despierta por la noche" },
  { id: "edema", texto: "Hinchazón de los tobillos" },
  { id: "palpitaciones", texto: "Palpitaciones o latidos rápidos o irregulares" },
  { id: "claudicacion", texto: "Dolor en las piernas al caminar que cede al parar" },
  { id: "soplo", texto: "Le han dicho que tiene un soplo cardíaco" },
  { id: "fatiga", texto: "Cansancio o falta de aire inusuales con actividades normales" },
];
/** Clases cuya presencia sugiere enfermedad cardiovascular, metabólica o renal conocida (para prerrellenar la pregunta). */
const CLASES_ENFERMEDAD = /^(nitratos|digoxina|amiodarona|antiarritmicos_ic|sotalol_dronedarona|antianginosos_otros|ic_nuevos|ivabradina|anticoagulantes|antiagregantes|antiagregantes_vasculares|insulina|sulfonilureas|metformina|isglt2|aglp1|idpp4|pioglitazona|antidiabeticos_otros|epo_hematinicos|potasio_magnesio)$/;
export function enfermedadSugerida(res, ctx = {}) {
  const cond = ctx.condiciones || new Set();
  const porCond = ["diabetes", "insuficiencia_cardiaca", "renal", "renal_grave", "marcapasos", "nyha34", "fevi_baja"].filter((c) => cond.has(c));
  const porMeds = [...new Set(res.items.filter((it) => CLASES_ENFERMEDAD.test(it.clase.id)).map((it) => it.clase.nombre))];
  return { sugerida: porCond.length > 0 || porMeds.length > 0, porCond, porMeds };
}
/**
 * @param r {regular: bool|null, enfermedad: bool|null, sintomas: string[]}
 * @returns {clave: "sin_datos"|"empezar"|"continuar"|"valoracion_vigoroso"|"valoracion_antes"|"parar", ...}
 * empezar: puede empezar a intensidad ligera-moderada y progresar; continuar: puede seguir a moderada o vigorosa;
 * valoracion_vigoroso: sigue a moderada, valoración médica antes de vigorosa; valoracion_antes: valoración médica antes de empezar;
 * parar: síntomas → deje de entrenar y consulte antes de retomar.
 */
export function cribadoACSM(r = {}) {
  if (r.regular == null || r.enfermedad == null) return { clave: "sin_datos", nivel: "info" };
  const sint = (r.sintomas || []).length > 0;
  if (sint) return { clave: r.regular ? "parar" : "valoracion_antes", nivel: "alerta", sintomas: true };
  if (!r.regular) return r.enfermedad ? { clave: "valoracion_antes", nivel: "precaucion" } : { clave: "empezar", nivel: "info" };
  return r.enfermedad ? { clave: "valoracion_vigoroso", nivel: "precaucion" } : { clave: "continuar", nivel: "info" };
}
export const CRIBADO_TXT = {
  sin_datos: "Cribado previo sin completar.",
  empezar: "Puede empezar a intensidad ligera-moderada y aumentar poco a poco; no hace falta una valoración médica previa.",
  continuar: "Puede continuar con ejercicio moderado o vigoroso y progresar como venía haciendo.",
  valoracion_vigoroso: "Puede seguir con ejercicio moderado; antes de pasar a intensidad vigorosa conviene una valoración médica.",
  valoracion_antes: "Conviene una valoración médica antes de empezar; mientras tanto, actividad ligera (caminar a paso cómodo).",
  parar: "Tiene síntomas que hay que valorar: deje el ejercicio moderado o intenso y consulte antes de retomarlo.",
};

/* ---------- Nivel de evidencia de una regla, a partir de su fuente declarada ---------- */
export const EVIDENCIA = {
  ft: { etiqueta: "Ficha técnica", orden: 4 },
  guia: { etiqueta: "Guía / consenso", orden: 3 },
  criterios: { etiqueta: "Criterios explícitos", orden: 3 },
  base: { etiqueta: "Base de interacciones", orden: 2 },
  revision: { etiqueta: "Revisión clínica", orden: 1 },
  borrador: { etiqueta: "Borrador", orden: 0 },
};
export function nivelEvidencia(regla) {
  if (regla.evidencia && EVIDENCIA[regla.evidencia]) return regla.evidencia;
  const f = (regla.fuente || "").toLowerCase();
  if (/^ft\b|ficha t[eé]cnica|smpc|aemps/.test(f)) return "ft";
  if (/beers|stopp|start|priscus/.test(f)) return "criterios";
  if (/acsm|\besc\b|\bada\b|kdigo|\bgold\b|\bnice\b|\boms\b|\bwho\b|vivifrail|gu[ií]a|consenso|\bers\b|\beha\b/.test(f)) return "guia";
  if (/lexicomp|micromedex|ddinter|bot\b|uptodate|stockley/.test(f)) return "base";
  return regla.revisado ? "revision" : "borrador";
}
/** Sección de la ficha técnica citada en la fuente ("FT 4.4" → "4.4"), para el enlace. */
export function seccionFT(regla) { const m = (regla.fuente || "").match(/\bFT\s*(\d\.\d+)/i); return m ? m[1] : null; }

/* ---------- Casos de validación clínica (viñetas con resultado esperado) ---------- */
/** Comprueba un caso: {meds, ctx, esperado:{alerta_min, precaucion_min, mayores_min, esencial_incluye[], senales[], sin_senales[], cribado}} → {ok, fallos[]} */
export function comprobarCaso(datos, caso, utils = {}) {
  const ctx = { ...caso.ctx, condiciones: new Set(caso.ctx?.condiciones || []) };
  const res = evaluar(datos, caso.meds, ctx);
  const e = caso.esperado || {};
  const fallos = [];
  if (e.alerta_min != null && res.resumen.alerta < e.alerta_min) fallos.push(`alertas ${res.resumen.alerta} < ${e.alerta_min}`);
  if (e.precaucion_min != null && res.resumen.precaucion < e.precaucion_min) fallos.push(`precauciones ${res.resumen.precaucion} < ${e.precaucion_min}`);
  if (e.mayores_min != null && res.interacciones.filter((x) => x.nivel === "mayor").length < e.mayores_min) fallos.push(`interacciones mayores < ${e.mayores_min}`);
  const esencial = loEsencial(res, 5).map((p) => `${p.titulo} ${p.texto}`).join(" | ").toLowerCase();
  for (const s of e.esencial_incluye || []) if (!esencial.includes(s.toLowerCase())) fallos.push(`lo esencial no menciona «${s}»`);
  for (const s of e.senales || []) if (!res.items.some((it) => it.senales.has(s))) fallos.push(`falta la señal ${s}`);
  for (const s of e.sin_senales || []) if (res.items.some((it) => it.senales.has(s))) fallos.push(`señal no esperada ${s}`);
  if (e.cribado && caso.cribado) { const c = cribadoACSM(caso.cribado).clave; if (c !== e.cribado) fallos.push(`cribado ${c} ≠ ${e.cribado}`); }
  if (e.combinadas_incluye) for (const s of e.combinadas_incluye) if (!res.combinadas.some((c) => c.regla.titulo.toLowerCase().includes(s.toLowerCase()))) fallos.push(`falta la regla combinada «${s}»`);
  return { ok: !fallos.length, fallos, res };
}
