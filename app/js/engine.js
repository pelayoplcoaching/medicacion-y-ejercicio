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
        const principio = { id: pid, nombre: m.pa, marcas: [], atc: m.atc, sintetico: true,
          nota: `Clasificado automáticamente por su código ATC (${m.atc}) en el grupo «${clase.nombre}»: se aplican las precauciones generales del grupo, sin reglas específicas revisadas para este fármaco ni umbral de dosis.` };
        clase.principios.push(principio);
        porId.set(pid, { principio, clase });
        entradas.push({ texto: m.pa, tipo: "principio", pid });
      }
      entradas.push({ texto: m.nombre, tipo: "marca", pid, dosis: m.dosis?.[0] ?? null });
      continue;
    }
    const comps = m.principios.filter((x) => porId.has(x)).map((x, i) => ({ pid: x, dosis: m.dosis?.[m.principios.indexOf(x)] ?? null }));
    if (!comps.length) continue;
    if (comps.length === 1) entradas.push({ texto: m.nombre, tipo: "marca", pid: comps[0].pid, dosis: comps[0].dosis, unidad: m.unidad });
    else entradas.push({ texto: m.nombre, tipo: "combo", pid: comps[0].pid, componentes: comps });
  }
  for (const e of entradas) e.norm = normalizar(e.texto);
  return { porId, entradas };
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
