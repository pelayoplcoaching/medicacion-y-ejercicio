/* Escalas rápidas (segunda tanda de mejoras grandes, 15). Bajo demanda (data-abre="escalas"; data-arg = id de la escala para abrirla directamente).
   Cuatro cuestionarios cortos de cribado: FRAIL (fragilidad), SARC-F (sarcopenia), las tres preguntas clave de caídas (STEADI) y la
   constante vital de actividad física (dos preguntas). Cada uno da su puntuación, su categoría y qué hacer después, y guarda el último
   resultado (y el anterior) en este dispositivo.
   CONTENIDO CLÍNICO NUEVO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA.
   - FRAIL: Morley, Malmstrom y Miller, J Nutr Health Aging 2012 (texto completo en PMC, leído el 22/11/2026): los cinco componentes, su
     puntuación y las categorías (0 robusto, 1–2 prefrágil, 3–5 frágil). La lista de las 11 enfermedades está en el apéndice 1 del artículo,
     que no se ha podido leer: es la que se reproduce habitualmente y hay que comprobarla.
   - SARC-F: Malmstrom et al., J Cachexia Sarcopenia Muscle 2016 (texto completo en PMC): cinco preguntas de 0 a 2 y corte en 4.
   - Caídas: las tres preguntas clave del algoritmo STEADI de los CDC (guía de bolsillo, 2019; dominio público): un «sí» = riesgo aumentado.
   - Actividad física: la «constante vital» (Greenwood 2010; Ball 2016): días × minutos de actividad moderada o intensa, frente a 150.
     La pregunta de los días de fuerza es un añadido de la aplicación (recomendación de la OMS 2020).
   - No se reproduce la Short FES-I (miedo a caer): es gratuita para clínicos si se cita, pero sus autores piden usar la traducción oficial
     y avisarles; solo se enlaza su web.
   Las preguntas son traducción de la aplicación del original en inglés (hay versiones validadas en español de México de FRAIL y SARC-F).
   Contenido en español, como la base; la interfaz, en cinco idiomas. */
import { idioma, t } from "./i18n.js?v=202611231104";
import { tL } from "./tr.js?v=202611231104";

const TXT = {
  es: { titulo: "Escalas rápidas", borrador: "Borrador pendiente de revisión clínica", intro: "Cuatro cuestionarios cortos de cribado, traducidos por esta aplicación. Orientan, no diagnostican.", preguntas: "{n} preguntas", ultimo: "Último: {x} · {f}", sin_hacer: "Sin hacer", volver: "Todas las escalas", faltan: "Faltan {n} respuestas", resultado: "Resultado", de: "{p} de {m}", anterior: "La vez anterior: {x} ({f})", guardado: "Guardado en este dispositivo.", borrar: "Borrar este resultado", borrado: "Resultado borrado.",
    copiar: "Copiar para la historia", copiado: "Copiado.", copia_error: "No se ha podido copiar.", fuentes: "Fuentes", segun_datos: "Marcado según sus datos: revíselo.", marcadas: "{n} de 11 marcadas", dias: "Días por semana", minutos: "Minutos cada día", dias_fuerza: "Días por semana con ejercicios de fuerza", min_sem: "{n} min/semana", ahora: "Qué hacer ahora", traduccion: "Preguntas traducidas por esta aplicación del original en inglés.", sppb: "Medir con el SPPB guiado", fesi: "Web oficial de la FES-I", paseo: "Paseo guiado", programa: "Programa de 12 semanas",
  },
  en: { titulo: "Quick scales", borrador: "Draft pending clinical review", intro: "Four short screening questionnaires; in Spanish, translated by this app. They guide, they do not diagnose.", preguntas: "{n} questions", ultimo: "Last: {x} · {f}", sin_hacer: "Not done", volver: "All scales", faltan: "{n} answers missing", resultado: "Result", de: "{p} of {m}", anterior: "Last time: {x} ({f})", guardado: "Saved on this device.", borrar: "Delete this result", borrado: "Result deleted.",
    copiar: "Copy for the record", copiado: "Copied.", copia_error: "Could not copy.", fuentes: "Sources", segun_datos: "Ticked from your data: please check.", marcadas: "{n} of 11 ticked", dias: "Days per week", minutos: "Minutes each day", dias_fuerza: "Days per week with strength exercises", min_sem: "{n} min/week", ahora: "What to do now", traduccion: "Questions translated by this app from the English original.", sppb: "Measure with the guided SPPB", fesi: "Official FES-I website", paseo: "Guided walk", programa: "12-week programme",
  },
  ca: { titulo: "Escales ràpides", borrador: "Esborrany pendent de revisió clínica", intro: "Quatre qüestionaris curts de cribratge, traduïts per aquesta aplicació. Orienten, no diagnostiquen.", preguntas: "{n} preguntes", ultimo: "Últim: {x} · {f}", sin_hacer: "Sense fer", volver: "Totes les escales", faltan: "Falten {n} respostes", resultado: "Resultat", de: "{p} de {m}", anterior: "La vegada anterior: {x} ({f})", guardado: "Desat en aquest dispositiu.", borrar: "Esborrar aquest resultat", borrado: "Resultat esborrat.",
    copiar: "Copiar per a la història", copiado: "Copiat.", copia_error: "No s'ha pogut copiar.", fuentes: "Fonts", segun_datos: "Marcat segons les vostres dades: reviseu-ho.", marcadas: "{n} d'11 marcades", dias: "Dies per setmana", minutos: "Minuts cada dia", dias_fuerza: "Dies per setmana amb exercicis de força", min_sem: "{n} min/setmana", ahora: "Què fer ara", traduccion: "Preguntes traduïdes per aquesta aplicació de l'original en anglès.", sppb: "Mesurar amb l'SPPB guiat", fesi: "Web oficial de la FES-I", paseo: "Passeig guiat", programa: "Programa de 12 setmanes",
  },
  gl: { titulo: "Escalas rápidas", borrador: "Borrador pendente de revisión clínica", intro: "Catro cuestionarios curtos de cribado, traducidos por esta aplicación. Orientan, non diagnostican.", preguntas: "{n} preguntas", ultimo: "Último: {x} · {f}", sin_hacer: "Sen facer", volver: "Todas as escalas", faltan: "Faltan {n} respostas", resultado: "Resultado", de: "{p} de {m}", anterior: "A vez anterior: {x} ({f})", guardado: "Gardado neste dispositivo.", borrar: "Borrar este resultado", borrado: "Resultado borrado.",
    copiar: "Copiar para a historia", copiado: "Copiado.", copia_error: "Non se puido copiar.", fuentes: "Fontes", segun_datos: "Marcado segundo os seus datos: revíseo.", marcadas: "{n} de 11 marcadas", dias: "Días por semana", minutos: "Minutos cada día", dias_fuerza: "Días por semana con exercicios de forza", min_sem: "{n} min/semana", ahora: "Que facer agora", traduccion: "Preguntas traducidas por esta aplicación do orixinal en inglés.", sppb: "Medir co SPPB guiado", fesi: "Web oficial da FES-I", paseo: "Paseo guiado", programa: "Programa de 12 semanas",
  },
  eu: { titulo: "Eskala azkarrak", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Baheketarako lau galdetegi labur, aplikazio honek itzuliak. Orientatzen dute, ez dute diagnostikatzen.", preguntas: "{n} galdera", ultimo: "Azkena: {x} · {f}", sin_hacer: "Egin gabe", volver: "Eskala guztiak", faltan: "{n} erantzun falta dira", resultado: "Emaitza", de: "{m}tik {p}", anterior: "Aurrekoan: {x} ({f})", guardado: "Gailu honetan gordeta.", borrar: "Ezabatu emaitza hau", borrado: "Emaitza ezabatuta.",
    copiar: "Kopiatu historiarako", copiado: "Kopiatuta.", copia_error: "Ezin izan da kopiatu.", fuentes: "Iturriak", segun_datos: "Zure datuen arabera markatuta: berrikusi.", marcadas: "11tik {n} markatuta", dias: "Egunak astean", minutos: "Minutuak egunean", dias_fuerza: "Indar-ariketak egiten dituzun egunak astean", min_sem: "{n} min/astean", ahora: "Zer egin orain", traduccion: "Aplikazio honek ingelesezko jatorrizkotik itzulitako galderak.", sppb: "Neurtu SPPB gidatuarekin", fesi: "FES-I webgune ofiziala", paseo: "Ibilaldi gidatua", programa: "12 asteko programa",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

const SI_NO = [["Sí", 1], ["No", 0]];
const TRES = (dos) => [[tL("Ninguna"), 0], [tL("Alguna"), 1], [dos, 2]];
/** Las 11 enfermedades del componente «Illnesses» de FRAIL (apéndice 1 de Morley 2012; por comprobar). cond = situación clínica de la aplicación que la marca de entrada. */
export const ENFERMEDADES = [
  { n: "Hipertensión", cond: "hipertension" }, { n: "Diabetes", cond: "diabetes" }, { n: "Cáncer (salvo un cáncer de piel menor)", cond: "cancer" }, { n: "Enfermedad pulmonar crónica" },
  { n: "Infarto de miocardio" }, { n: "Insuficiencia cardiaca", cond: "insuficiencia_cardiaca" }, { n: "Angina de pecho" }, { n: "Asma" }, { n: "Artritis (incluida la artrosis)", cond: "artrosis" },
  { n: "Ictus", cond: "ictus" }, { n: "Enfermedad del riñón", cond: "renal" },
];
/* Cada escala: preguntas (o = opciones [texto, puntos]; tipo "lista" = casillas, puntúa 1 desde «corte»; tipo "num" = número), máximo y categorías. */
export const ESCALAS = [
  { id: "frail", n: "FRAIL", que: "Fragilidad", max: 5, items: [
    { id: "fatiga", c: "Fatiga", q: "En las últimas 4 semanas, ¿cuánto tiempo se ha sentido cansado o cansada?", o: [["Todo el tiempo", 1], ["La mayor parte del tiempo", 1], ["Parte del tiempo", 0], ["Un poco", 0], ["Nunca", 0]] },
    { id: "resistencia", c: "Resistencia", q: "Por sí mismo y sin ayudas, ¿tiene alguna dificultad para subir 10 escalones sin descansar?", o: SI_NO },
    { id: "deambulacion", c: "Deambulación", q: "Por sí mismo y sin ayudas, ¿tiene alguna dificultad para caminar varios cientos de metros?", o: SI_NO },
    { id: "enfermedades", c: "Enfermedades", tipo: "lista", q: "¿Le ha dicho un médico que tiene alguna de estas enfermedades?", x: "Puntúa si son 5 o más de las 11.", corte: 5 },
    { id: "peso", c: "Pérdida de peso", q: "¿Ha perdido un 5 % o más de su peso en los últimos 12 meses?", x: "Por ejemplo, 3,5 kg o más si pesaba 70 kg.", o: SI_NO },
  ] },
  { id: "sarcf", n: "SARC-F", que: "Sarcopenia (poca fuerza muscular)", max: 10, items: [
    { id: "fuerza", c: "Fuerza", q: "¿Cuánta dificultad tiene para levantar y llevar un peso de 5 kg?", o: TRES("Mucha o no puedo") },
    { id: "andar", c: "Ayuda para andar", q: "¿Cuánta dificultad tiene para cruzar una habitación andando?", o: TRES("Mucha, uso ayudas o no puedo sin ayuda de otra persona") },
    { id: "silla", c: "Levantarse de la silla", q: "¿Cuánta dificultad tiene para levantarse de una silla o de la cama?", o: TRES("Mucha, uso ayudas o no puedo sin ayuda") },
    { id: "escaleras", c: "Subir escaleras", q: "¿Cuánta dificultad tiene para subir un tramo de 10 escalones?", o: TRES("Mucha o no puedo") },
    { id: "caidas", c: "Caídas", q: "¿Cuántas veces se ha caído en el último año?", o: [["Ninguna", 0], ["De 1 a 3", 1], ["4 o más", 2]] },
  ] },
  { id: "caidas", n: "Tres preguntas de caídas", que: "Riesgo de caídas (65 años o más)", max: 3, items: [
    { id: "inestable", c: "Inestabilidad", q: "¿Se siente inestable al estar de pie o al caminar?", o: SI_NO },
    { id: "miedo", c: "Preocupación por caerse", q: "¿Le preocupa caerse?", o: SI_NO },
    { id: "caido", c: "Caída en el último año", q: "¿Se ha caído en el último año?", o: SI_NO },
  ] },
  { id: "pavs", n: "Constante vital de actividad física", que: "Minutos de actividad a la semana", max: null, items: [
    { id: "dias", tipo: "num", q: "De media, ¿cuántos días a la semana hace actividad física moderada o intensa (como caminar a paso ligero)?", k: "dias", min: 0, max: 7 },
    { id: "min", tipo: "num", q: "Esos días, ¿cuántos minutos hace de media a esa intensidad?", k: "minutos", min: 0, max: 600 },
    { id: "fuerza", tipo: "num", opcional: true, q: "¿Cuántos días a la semana hace ejercicios de fuerza? (opcional; pregunta añadida por esta aplicación, no es del cuestionario original)", k: "dias_fuerza", min: 0, max: 7 },
  ] },
];
export const escala = (id) => ESCALAS.find((e) => e.id === id) || null;
export const CATEGORIAS = {
  frail: { robusto: { n: "Robusto", v: "ok" }, prefragil: { n: "Prefrágil", v: "aviso" }, fragil: { n: "Frágil", v: "alerta" } },
  sarcf: { bajo: { n: "No sugiere sarcopenia", v: "ok" }, alto: { n: "Sugiere sarcopenia", v: "alerta" } },
  caidas: { no: { n: "Sin riesgo aumentado", v: "ok" }, riesgo: { n: "Riesgo aumentado", v: "alerta" } },
  pavs: { cumple: { n: "Llega a 150 minutos", v: "ok" }, insuficiente: { n: "Por debajo de 150 minutos", v: "aviso" }, inactivo: { n: "Sin actividad moderada", v: "alerta" } },
};
export const META_PAVS = 150, META_FUERZA = 2;
/** Qué decir con cada resultado (borrador clínico). */
export const CONT = {
  cribado: "Es un cuestionario de cribado: orienta, no es un diagnóstico.",
  frail: {
    robusto: "Ninguno de los cinco rasgos de fragilidad. Siga con su plan y repita el cuestionario si cambia su salud.",
    prefragil: "Uno o dos de los cinco rasgos: prefragilidad. En el estudio original ya se asociaba a más dificultades en el día a día años después. Es buen momento para actuar: hay pruebas de que el ejercicio (aeróbico, de fuerza y de equilibrio) puede frenar su avance. Confírmelo con una prueba de ejecución, como el SPPB, y coméntelo en la consulta.",
    fragil: "Tres o más de los cinco rasgos: fragilidad probable. Coméntelo con su médico: conviene una valoración completa. El ejercicio sigue siendo parte del tratamiento, adaptado a lo que puede hacer; empiece por medir con el SPPB guiado.",
  },
  sarcf: {
    bajo: "Menos de 4 puntos: no sugiere sarcopenia. No la descarta del todo: en un estudio, el cuestionario por sí solo no bastó para detectarla. Si nota que pierde fuerza, mídala igualmente.",
    alto: "4 puntos o más: sugiere sarcopenia. El consenso europeo (EWGSOP2) pone la poca fuerza muscular en el centro del diagnóstico: el paso siguiente es medirla en la consulta (fuerza de la mano o levantarse de la silla). Hoy el tratamiento principal es el ejercicio de fuerza, con una ingesta suficiente de proteínas.",
  },
  caidas: {
    no: "Tres «no»: sin riesgo aumentado en este cribado. Repítalo cada año o si hay una caída, y siga entrenando la fuerza y el equilibrio.",
    riesgo: "Un «sí» basta para considerar aumentado el riesgo de caídas. El paso siguiente es valorar lo que se puede cambiar: la marcha, la fuerza y el equilibrio, la medicación, la vista, los obstáculos de casa y la tensión al levantarse. Coméntelo en la consulta.",
    miedo: "Para medir el miedo a caer existe un cuestionario específico, la Short FES-I (7 preguntas). Es gratuito para clínicos y está en español en su web oficial; aquí no se reproduce.",
  },
  pavs: {
    cumple: "Llega a los 150 minutos a la semana de actividad moderada o intensa que recomiendan las guías.",
    insuficiente: "Se mueve, pero por debajo de los 150 minutos a la semana que recomiendan las guías. Le faltan {n}; cada rato que añada cuenta.",
    inactivo: "Ahora mismo no hace actividad moderada. Empezar por poco ya ayuda: 5 o 10 minutos de paseo ligero y subir desde ahí.",
    corta: "Este tipo de pregunta suele quedarse corta: en un estudio, la gente declaraba de media 86 minutos menos a la semana que con un cuestionario largo.",
    fuerza_si: "Además hace fuerza 2 o más días a la semana, como piden las guías.",
    fuerza_no: "Las guías piden además ejercicios de fuerza 2 o más días a la semana.",
  },
};
export const FUENTES = {
  frail: [{ txt: "Morley, Malmstrom y Miller. A simple frailty questionnaire (FRAIL) predicts outcomes in middle aged African Americans. J Nutr Health Aging 2012", doi: "10.1007/s12603-012-0084-2" }, { txt: "Rosas-Carrasco et al. Adaptación y validación de la escala FRAIL en español (México). J Am Med Dir Assoc 2016", doi: "10.1016/j.jamda.2016.07.008" }],
  sarcf: [{ txt: "Malmstrom et al. SARC-F: a symptom score to predict persons with sarcopenia at risk for poor functional outcomes. J Cachexia Sarcopenia Muscle 2016", doi: "10.1002/jcsm.12048" }, { txt: "Parra-Rodríguez et al. Versión en español (México) del SARC-F. J Am Med Dir Assoc 2016", doi: "10.1016/j.jamda.2016.09.008" }, { txt: "Barbosa-Silva et al. Enhancing SARC-F. J Am Med Dir Assoc 2016", doi: "10.1016/j.jamda.2016.08.004" }, { txt: "Cruz-Jentoft et al. Sarcopenia: revised European consensus on definition and diagnosis (EWGSOP2). Age Ageing 2019", doi: "10.1093/ageing/afy169" }],
  caidas: [{ txt: "CDC. STEADI: algoritmo de cribado, valoración e intervención del riesgo de caídas (guía de bolsillo, 2019)", url: "https://www.cdc.gov/steadi/media/pdfs/steadi-pocketguide-508.pdf" }, { txt: "Montero-Odasso et al. World guidelines for falls prevention and management for older adults. Age Ageing 2022", doi: "10.1093/ageing/afac205" }, { txt: "Kempen et al. The Short FES-I. Age Ageing 2008", doi: "10.1093/ageing/afm157" }],
  pavs: [{ txt: "Greenwood, Joy y Stanford. The Physical Activity Vital Sign. J Phys Act Health 2010", doi: "10.1123/jpah.7.5.571" }, { txt: "Ball et al. Concurrent validity of a self-reported physical activity «vital sign» questionnaire. Prev Chronic Dis 2016", doi: "10.5888/pcd13.150228" }, { txt: "Bull et al. Guía de la OMS 2020 de actividad física y sedentarismo. Br J Sports Med 2020", doi: "10.1136/bjsports-2020-102955" }],
};
export const URL_FESI = "https://sites.manchester.ac.uk/fes-i/";

const numero = (v, it) => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) && n >= it.min && n <= it.max ? n : NaN; };
/** Categoría que corresponde a una puntuación (la constante vital va aparte, por minutos). */
export const categoriaDe = (id, p) => (id === "frail" ? (p >= 3 ? "fragil" : p >= 1 ? "prefragil" : "robusto") : id === "sarcf" ? (p >= 4 ? "alto" : "bajo") : (p >= 1 ? "riesgo" : "no"));
/** Puntúa una escala. r = respuestas ({ idPregunta: índice de la opción | [índices marcados] | número }).
    Devuelve { completo, faltan, p, max, cat, positivos: [nombre del componente con puntos], extra }. */
export function puntuar(id, r = {}) {
  const e = escala(id); if (!e) return null;
  if (id === "pavs") {
    const [iD, iM, iF] = e.items, dias = numero(r.dias, iD), min = dias === 0 ? 0 : numero(r.min, iM), fuerza = numero(r.fuerza, iF);
    const mal = [dias, min, fuerza].some((x) => Number.isNaN(x)), faltan = (dias == null ? 1 : 0) + (min == null ? 1 : 0);
    if (mal || faltan) return { completo: false, faltan, mal, p: null, max: null, cat: null, positivos: [], extra: {} };
    const total = Math.round(dias * min);
    return { completo: true, faltan: 0, p: total, max: null, cat: total >= META_PAVS ? "cumple" : total > 0 ? "insuficiente" : "inactivo", positivos: [], extra: { dias, min, fuerza, falta: Math.max(0, META_PAVS - total) } };
  }
  let p = 0, faltan = 0; const positivos = [], extra = {};
  for (const it of e.items) {
    if (it.tipo === "lista") { const n = (r[it.id] || []).length; extra.enfermedades = n; if (n >= it.corte) { p += 1; positivos.push(it.c); } continue; }
    const o = it.o[r[it.id]]; if (!o) { faltan++; continue; }
    p += o[1]; if (o[1] > 0) positivos.push(it.c);
  }
  if (faltan) return { completo: false, faltan, p: null, max: e.max, cat: null, positivos, extra };
  const cat = categoriaDe(id, p);
  if (id === "caidas") extra.miedo = e.items[1].o[r.miedo]?.[1] === 1;
  return { completo: true, faltan: 0, p, max: e.max, cat, positivos, extra };
}
/** Párrafos del resultado. */
export function textos(id, res) {
  if (!res?.completo) return [];
  const C = CONT[id];
  if (id === "pavs") return [C[res.cat].replace("{n}", tL`${res.extra.falta} minutos`), ...(res.extra.fuerza == null ? [] : [res.extra.fuerza >= META_FUERZA ? C.fuerza_si : C.fuerza_no]), C.corta];
  return [C[res.cat], ...(id === "caidas" && res.extra.miedo ? [C.miedo] : []), CONT.cribado];
}
const fecha = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
/** Cifra corta del resultado: «2 de 5», «120 min/semana». */
export const cifra = (id, g) => (id === "pavs" ? tx("min_sem", { n: String(g.p) }) : tx("de", { p: String(g.p), m: String(escala(id).max) }));
/** Una línea para la historia clínica. g = resultado guardado o recién calculado ({ p, cat, positivos, extra, f }). */
export function lineaHistoria(id, g) {
  const e = escala(id), cat = CATEGORIAS[id][g.cat]?.n || "";
  if (id === "pavs") return tL`${e.n}: ${g.p} min/semana de actividad moderada o intensa (${cat.toLowerCase()})${g.extra?.fuerza != null ? tL`; fuerza ${g.extra.fuerza} días/semana` : ""}${g.f ? ` · ${fecha(g.f)}` : ""}`;
  return `${e.n}: ${g.p}/${e.max} (${cat.toLowerCase()})${g.positivos?.length ? `: ${g.positivos.join(", ").toLowerCase()}` : ""}${g.f ? ` · ${fecha(g.f)}` : ""}`;
}

const CLAVE = "medex.escalas";
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; } }
function escribir(o) { try { if (Object.keys(o).length) localStorage.setItem(CLAVE, JSON.stringify(o)); else localStorage.removeItem(CLAVE); } catch {} }
/** Guarda el resultado de hoy (si ya había uno de otro día pasa a «ant»; el del mismo día se sustituye). */
export function guardar(id, res, hoy) {
  const o = leer(), previo = o[id], nuevo = { p: res.p, cat: res.cat, positivos: res.positivos, extra: res.extra, f: hoy };
  const ant = previo ? (previo.f === hoy ? previo.ant : { p: previo.p, cat: previo.cat, f: previo.f }) : null;
  if (ant) nuevo.ant = ant;
  o[id] = nuevo; escribir(o); return nuevo;
}
export function borrar(id) { const o = leer(); delete o[id]; escribir(o); }

const CSS = `
.eq-dlg { width: min(760px, calc(100vw - 16px)); }
.eq-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.eq-intro { margin: 0 0 12px; color: var(--muted); }
.eq-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
.eq-tarjeta { display: grid; gap: 4px; width: 100%; height: 100%; padding: 14px; text-align: left; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; cursor: pointer; }
.eq-tarjeta:hover { border-color: var(--accent); }
.eq-tarjeta b { font-size: 1.05rem; line-height: 1.25; }
.eq-tarjeta span { color: var(--muted); font-size: .9rem; }
.eq-tarjeta small { font-family: var(--mono); font-size: .76rem; color: var(--muted); }
.eq-chip { justify-self: start; font-style: normal; margin-top: 4px; padding: 2px 10px; border-radius: 999px; font-size: .8rem; font-weight: 700; border: 1px solid var(--line-strong); }
.eq-chip.v-ok, .eq-res.v-ok { border-color: var(--accent); background: var(--accent-soft); }
.eq-chip.v-aviso, .eq-res.v-aviso { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.eq-chip.v-alerta, .eq-res.v-alerta { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.eq-volver { margin: 0 0 10px; }
.eq-dlg h3 { margin: 0 0 2px; font-size: 1.15rem; }
.eq-que { margin: 0 0 12px; color: var(--muted); }
.eq-form { display: grid; gap: 10px; }
.eq-form fieldset { margin: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); min-width: 0; }
.eq-form legend { padding: 0 4px; font-weight: 700; line-height: 1.35; float: left; width: 100%; margin-bottom: 8px; }
.eq-form legend + * { clear: both; }
.eq-ayuda { margin: 0 0 8px; font-size: .86rem; color: var(--muted); }
.eq-ops { display: flex; flex-wrap: wrap; gap: 6px; }
.eq-ops label { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 4px 12px; border: 1px solid var(--line-strong); border-radius: 999px; cursor: pointer; font-size: .94rem; }
.eq-ops label:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); font-weight: 700; }
.eq-ops.col { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.eq-ops.col label { border-radius: var(--r-sm); }
.eq-num { width: 7em; min-height: 42px; padding: 6px 10px; border: 1px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); font: inherit; font-family: var(--mono); }
.eq-num[aria-invalid="true"] { border-color: var(--alerta); }
.eq-res { margin-top: 14px; padding: 12px 14px; border: 1px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface-2); }
.eq-res h4 { margin: 0 0 2px; font-size: .8rem; font-weight: 700; }
.eq-cifra { margin: 0; font-family: var(--mono); font-size: 1.6rem; font-weight: 700; line-height: 1.1; }
.eq-cat { margin: 2px 0 8px; font-weight: 700; }
.eq-res p.eq-t { margin: 6px 0 0; line-height: 1.45; }
.eq-res .eq-meta { margin: 8px 0 0; font-size: .82rem; }
.eq-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
.eq-pie { margin: 14px 0 0; font-size: .84rem; color: var(--muted); }
.eq-fuentes { margin: 6px 0 0; padding-left: 1.2em; display: grid; gap: 5px; font-size: .84rem; color: var(--muted); }
.eq-fuentes a, .eq-res a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
.eq-res.v-aviso a, .eq-res.v-alerta a { color: inherit; }
.eq-dlg button:focus-visible, .eq-dlg a:focus-visible, .eq-dlg input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
@media (forced-colors: active) { .eq-ops label:has(input:checked) { outline: 2px solid; } }
/* 873: anillo con el ultimo resultado en cada tarjeta */
.eq-tarjeta { grid-template-columns: minmax(0, 1fr) auto; column-gap: 12px; transition: border-color .15s, translate .15s, box-shadow .15s; }
.eq-tarjeta > :not(.eq-anillo) { grid-column: 1; }
.eq-anillo { grid-column: 2; grid-row: 1 / span 4; align-self: center; display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; font: 700 1rem/1 var(--mono); font-style: normal; color: var(--fg); background: radial-gradient(closest-side, var(--surface) 77%, transparent 79%), conic-gradient(var(--eq-c, var(--line-strong)) calc(var(--pc, 0) * 1%), var(--surface-2) 0); }
.eq-anillo:not([style]) { background: none; border: 2px dashed var(--line-strong); }
.eq-anillo.v-ok, .eq-regla .v-ok { --eq-c: var(--accent); } .eq-anillo.v-aviso, .eq-regla .v-aviso { --eq-c: var(--precaucion); } .eq-anillo.v-alerta, .eq-regla .v-alerta { --eq-c: var(--alerta); }
@media (hover: hover) { .eq-tarjeta:hover { translate: 0 -2px; box-shadow: 0 8px 18px color-mix(in srgb, var(--accent) 14%, transparent); } }
.eq-tarjeta:active { translate: 0 1px; }
/* 874: regla de colores del resultado, con su casilla marcada */
.eq-regla { display: flex; gap: 4px; margin: 10px 0 6px; }
.eq-regla i { flex: 1 1 0; display: grid; place-items: center; min-height: 28px; border-radius: 7px; border: 1.5px solid var(--eq-c); background: var(--surface); color: var(--fg); font: 700 .8rem/1 var(--mono); font-style: normal; }
.eq-regla i.aqui { background: var(--eq-c); color: var(--surface); scale: 1.1; box-shadow: 0 3px 10px color-mix(in srgb, var(--eq-c) 45%, transparent); }
.eq-barra { position: relative; height: 16px; margin: 22px 0 8px; border-radius: 999px; border: 1.5px solid currentColor; background: var(--surface); }
.eq-barra i { display: block; height: 100%; border-radius: 999px; background: currentColor; min-width: 6px; }
.eq-barra b { position: absolute; left: 50%; top: -20px; translate: -50% 0; font: 700 .74rem/1 var(--mono); }
.eq-barra b::after { content: ""; position: absolute; left: 50%; top: 14px; width: 2px; height: 24px; background: currentColor; opacity: .55; }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .eq-regla i.aqui { animation: eq-aqui .3s ease-out; } }
@keyframes eq-aqui { from { scale: .8; } }
@media (forced-colors: active) { .eq-regla i.aqui { outline: 3px solid Highlight; } .eq-anillo { border: 2px solid; } }
`;

let dlg = null, A = null, vista = "lista", R = {}, auto = {};
const cu = () => dlg.querySelector("#eq-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const esPro = () => A?.estado?.modo === "profesional";
function crear() {
  if (!document.getElementById("eq-css")) { const st = document.createElement("style"); st.id = "eq-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "escalas"; dlg.className = "ficha alta eq-dlg"; dlg.setAttribute("aria-labelledby", "eq-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="eq-cab-t"></p><button type="button" class="btn-sec sm" id="eq-cerrar"></button></div><div class="ficha-cuerpo" id="eq-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#eq-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", async (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const ab = ev.target.closest("[data-eq-abre]"); if (ab) { entrar(ab.dataset.eqAbre); return; }
    if (ev.target.closest("[data-pruebas], [data-programa]")) { dlg.close(); return; } // los abre la aplicación
    const b = ev.target.closest("[data-eq]"); if (!b) return;
    const a = b.dataset.eq;
    if (a === "volver") { vista = "lista"; pintar(); cu().scrollTop = 0; dlg.querySelector(".eq-tarjeta")?.focus(); }
    else if (a === "sppb") { dlg.close(); document.querySelector("#btn-sppb")?.click(); }
    else if (a === "borrar") { borrar(vista); R = {}; auto = {}; A.toast(tx("borrado"), { ms: 3000 }); pintar(); }
    else if (a === "copiar") { const g = leer()[vista]; if (!g) return; try { await navigator.clipboard.writeText(lineaHistoria(vista, g)); A.toast(tx("copiado"), { ms: 3000 }); } catch { A.toast(tx("copia_error"), { ms: 4000 }); } }
  });
  // Solo se repinta el resultado si la respuesta ha cambiado de verdad: el «change» de un número al perder el foco no debe llevarse por delante el botón que se está pulsando.
  const cambio = (ev) => { const el = ev.target.closest("[data-eq-i]"); if (!el || !recoger(el)) return; resultado(true); };
  dlg.addEventListener("change", cambio);
  dlg.addEventListener("submit", (ev) => ev.preventDefault());
  dlg.addEventListener("input", (ev) => { if (ev.target.matches(".eq-num")) cambio(ev); });
}
function recoger(el) {
  const id = el.dataset.eqI;
  if (el.type === "checkbox") { R[id] = [...cu().querySelectorAll(`[data-eq-i="${id}"]:checked`)].map((x) => Number(x.value)); delete auto[id]; cu().querySelector(`#eq-n-${id}`)?.replaceChildren(tx("marcadas", { n: String(R[id].length) })); }
  else if (el.type === "radio") { R[id] = Number(el.value); delete auto[id]; }
  else { const v = el.value.trim(); if ((R[id] ?? "") === v) return false; R[id] = v; }
  return true;
}
/** Entra en una escala: respuestas en blanco, salvo lo que ya se sabe por los datos (situaciones clínicas, caída en el último año). */
function entrar(id) {
  if (!escala(id)) return;
  vista = id; R = {}; auto = {};
  if (id === "frail") { const conds = new Set(A.estado.condiciones || []); R.enfermedades = ENFERMEDADES.map((x, i) => (x.cond && conds.has(x.cond) ? i : -1)).filter((i) => i >= 0); if (R.enfermedades.length) auto.enfermedades = true; }
  if (id === "caidas" && A.estado.caidas) { R.caido = 0; auto.caido = true; }
  pintar(); cu().scrollTop = 0; cu().querySelector("[data-eq='volver']")?.focus();
}
const fuentes = (id) => `<ul class="eq-fuentes">${FUENTES[id].map((f) => `<li>${f.txt}. ${f.doi ? `<a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : `<a href="${f.url}" target="_blank" rel="noopener">cdc.gov/steadi</a>`}</li>`).join("")}</ul>`;
function pregunta(it) {
  const auto1 = auto[it.id] ? `<p class="eq-ayuda">${tx("segun_datos")}</p>` : "";
  if (it.tipo === "num") return `<fieldset><legend><label for="eq-${it.id}">${it.q}</label></legend><input class="eq-num" id="eq-${it.id}" data-eq-i="${it.id}" type="text" inputmode="numeric" autocomplete="off" aria-label="${esc(tx(it.k))}" value="${esc(R[it.id] ?? "")}"></fieldset>`;
  if (it.tipo === "lista") { const m = new Set(R[it.id] || []); return `<fieldset><legend>${it.q}</legend><p class="eq-ayuda">${it.x} <b id="eq-n-${it.id}">${tx("marcadas", { n: String(m.size) })}</b></p>${auto1}<div class="eq-ops col">${ENFERMEDADES.map((x, i) => `<label><input type="checkbox" data-eq-i="${it.id}" value="${i}"${m.has(i) ? " checked" : ""}> ${x.n}</label>`).join("")}</div></fieldset>`; }
  return `<fieldset><legend>${it.q}</legend>${it.x ? `<p class="eq-ayuda">${it.x}</p>` : ""}${auto1}<div class="eq-ops">${it.o.map((o, i) => `<label><input type="radio" name="eq-${it.id}" data-eq-i="${it.id}" value="${i}"${R[it.id] === i ? " checked" : ""}> ${o[0]}</label>`).join("")}</div></fieldset>`;
}
/** Anillo de la tarjeta: la parte del máximo (o de los 150 minutos) que marca el último resultado, del color de su categoría. Solo adorno: el dato va en la etiqueta. */
const anillo = (e, g, c) => (c ? `<i class="eq-anillo v-${c.v}" style="--pc:${Math.max(0, Math.min(100, Math.round(g.p / (e.max ?? META_PAVS) * 100)))}" aria-hidden="true">${g.p}</i>` : `<i class="eq-anillo" aria-hidden="true"></i>`);
/** Regla del resultado: una casilla por punto posible, del color de su categoría, con la suya marcada; en la constante vital, una barra hacia los 150 minutos (la escala llega al doble). Solo adorno. */
function regla(id, res) {
  if (id === "pavs") return `<div class="eq-barra" aria-hidden="true"><i style="width:${Math.min(100, Math.round(res.p / (META_PAVS * 2) * 100))}%"></i><b>${META_PAVS}</b></div>`;
  let s = ""; for (let p = 0; p <= res.max; p++) s += `<i class="v-${CATEGORIAS[id][categoriaDe(id, p)].v}${p === res.p ? " aqui" : ""}">${p}</i>`;
  return `<div class="eq-regla" aria-hidden="true">${s}</div>`;
}
/** Pinta (y, si está completo y ha cambiado algo, guarda) el resultado de la escala abierta. */
function resultado(guardarlo) {
  const caja = cu().querySelector("#eq-res"); if (!caja) return;
  const e = escala(vista), res = puntuar(vista, R);
  for (const it of e.items) if (it.tipo === "num") { const el = cu().querySelector(`#eq-${it.id}`); if (el) el.setAttribute("aria-invalid", String(Number.isNaN(numero(R[it.id], it)))); }
  if (!res.completo) {
    const g = leer()[vista];
    caja.className = "eq-res"; caja.innerHTML = `<h4>${tx("resultado")}</h4><p class="eq-t" id="eq-faltan">${res.faltan ? tx("faltan", { n: String(res.faltan) }) : ""}</p>${g ? `<p class="eq-meta">${tx("ultimo", { x: `${cifra(vista, g)} (${CATEGORIAS[vista][g.cat].n.toLowerCase()})`, f: fecha(g.f) })}</p>` : ""}`;
    return;
  }
  const g = guardarlo ? guardar(vista, res, A.hoyISO()) : leer()[vista] || { ...res }, cat = CATEGORIAS[vista][res.cat];
  const acc = [];
  if (vista === "frail" && res.cat !== "robusto") acc.push(`<button type="button" class="btn" data-eq="sppb">${tx("sppb")}</button>`, `<button type="button" class="btn-sec" data-pruebas="">${t("sft.menu")}</button>`);
  if (vista === "sarcf" && res.cat === "alto") acc.push(`<button type="button" class="btn" data-pruebas="">${t("sft.menu")}</button>`, `<button type="button" class="btn-sec" data-programa="">${tx("programa")}</button>`);
  if (vista === "caidas" && res.cat === "riesgo") { acc.push(`<button type="button" class="btn" data-eq="sppb">${tx("sppb")}</button>`); if (esPro()) acc.push(`<button type="button" class="btn-sec" data-abre="frid">${t("frid.btn")}</button>`); }
  if (vista === "pavs" && res.cat !== "cumple") acc.push(`<button type="button" class="btn" data-abre="paseo">${tx("paseo")}</button>`, `<button type="button" class="btn-sec" data-programa="">${tx("programa")}</button>`);
  acc.push(`<button type="button" class="btn-sec" data-eq="copiar">${tx("copiar")}</button>`, `<button type="button" class="btn-sec sm" data-eq="borrar">${tx("borrar")}</button>`);
  const ps = textos(vista, res).map((x) => `<p class="eq-t">${x}</p>`).join("");
  caja.className = `eq-res v-${cat.v}`;
  caja.innerHTML = `<h4>${tx("resultado")}</h4><p class="eq-cifra" id="eq-cifra">${cifra(vista, res)}</p><p class="eq-cat" id="eq-cat">${cat.n}</p>${regla(vista, res)}${ps}
    ${vista === "caidas" && res.extra.miedo ? `<p class="eq-t"><a href="${URL_FESI}" target="_blank" rel="noopener">${tx("fesi")}</a></p>` : ""}
    <p class="eq-meta">${tx("guardado")}${g.ant ? " " + tx("anterior", { x: `${cifra(vista, g.ant)} · ${CATEGORIAS[vista][g.ant.cat]?.n.toLowerCase() || ""}`, f: fecha(g.ant.f) }) : ""}</p>
    <div class="eq-acc">${acc.join("")}</div>`;
}
function pintar() {
  dlg.querySelector("#eq-cab-t").textContent = tx("titulo");
  const G = leer();
  if (vista === "lista") {
    cu().innerHTML = `<p class="eq-intro">${tx("intro")}</p>
      <ul class="eq-lista" id="eq-lista">${ESCALAS.map((e) => { const g = G[e.id], c = g && CATEGORIAS[e.id][g.cat]; return `<li><button type="button" class="eq-tarjeta" data-eq-abre="${e.id}"><b>${e.n}</b><span>${e.que}</span><small>${tx("preguntas", { n: String(e.items.length) })}</small>${c ? `<em class="eq-chip v-${c.v}">${tx("ultimo", { x: `${cifra(e.id, g)} · ${c.n}`, f: fecha(g.f) })}</em>` : `<em class="eq-chip">${tx("sin_hacer")}</em>`}${anillo(e, g, c)}</button></li>`; }).join("")}</ul>
      <p class="eq-pie">${CONT.cribado} ${tx("traduccion")}</p>`;
    return;
  }
  const e = escala(vista);
  cu().innerHTML = `<p class="eq-volver"><button type="button" class="btn-sec sm" data-eq="volver">‹ ${tx("volver")}</button></p>
    <h3 id="eq-nombre">${e.n}</h3><p class="eq-que">${e.que}</p>
    <form class="eq-form" id="eq-form">${e.items.map(pregunta).join("")}</form>
    <div class="eq-res" id="eq-res" role="status" aria-live="polite"></div>
    <p class="eq-pie">${tx("traduccion")}</p><p class="eq-pie"><b>${tx("fuentes")}</b></p>${fuentes(vista)}`;
  resultado(false);
}
/** Abre la ventana (arg = id de una escala para entrar directamente). */
export function abrir(api, arg) {
  A = api;
  if (!dlg) crear();
  dlg.querySelector("#eq-cerrar").textContent = api.cerrar();
  vista = "lista"; R = {}; auto = {};
  if (arg && escala(arg)) entrar(arg); else pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  if (vista === "lista") dlg.querySelector("#eq-cerrar").focus();
}
