/* «Guía de conversación» (mejora grande 15): consejo breve sobre actividad física para el profesional, en 1 minuto,
   en 5 minutos y en una consulta programada de 20-30 minutos, con el modelo de las 5 Aes del consejo integral del
   Ministerio de Sanidad (2015) y adaptado a la medicación y la situación de la persona: el beneficio que más le toca
   (de beneficios.js), los cuidados por su medicación (motor), el cribado ACSM, sus hábitos (habitos.js) y sus metas.
   Incluye las barreras más frecuentes con una respuesta para cada una, una nota para la historia clínica y una hoja
   imprimible para el paciente. Nada se guarda fuera de este dispositivo. Contenido en español, revisado por un clínico el
   22/11/2026; la interfaz, en cinco idiomas. Se carga al abrirla. */
import { idioma } from "./i18n.js?v=202611231104";
import { tC, tL } from "./tr.js?v=202611231104";

export const FUENTES = tC([
  { txt: "Ministerio de Sanidad 2015, Consejo integral en estilo de vida en Atención Primaria (modelo de las 5 Aes)", url: "https://www.sanidad.gob.es/areas/promocionPrevencion/envejecimientoSaludable/activo/consejoIntegralAP.htm" },
  { txt: "OMS 2020, directrices sobre actividad física y hábitos sedentarios (Bull, Br J Sports Med)", doi: "10.1136/bjsports-2020-102955" },
  { txt: "Orrow 2012, BMJ: promoción de la actividad física en atención primaria (metaanálisis de 15 ensayos)", doi: "10.1136/bmj.e1389" },
  { txt: "Rubak 2005, Br J Gen Pract: entrevista motivacional (metaanálisis de 72 ensayos)", url: "https://pubmed.ncbi.nlm.nih.gov/15826439/" },
]);
export const LOCALIZA = { txt: "LOCALIZA salud", url: "https://localizasalud.sanidad.gob.es/" };
export const AES = ["averiguar", "aconsejar", "acordar", "ayudar", "asegurar"];

/** Barreras frecuentes: lo que suele decir la persona, una respuesta para la consulta y una línea para su hoja. */
export const BARRERAS = tC([
  { id: "tiempo", txt: "No tengo tiempo", resp: "Valen los ratos cortos: varios a lo largo del día suman igual. ¿En qué momento de su día encajaría uno de 10 minutos?", hoja: "Varios ratos cortos al día también suman: busque el suyo (después de comer, al ir a comprar…)." },
  { id: "dolor", txt: "Me duelen las articulaciones o la espalda", resp: "Un dolor leve durante el ejercicio, que se pasa al día siguiente, es aceptable. Empiece con poco y suba despacio; en la artrosis, el ejercicio suele aliviar el dolor. Un dolor de espalda brusco e intenso hay que consultarlo.", hoja: "Un dolor leve que se pasa al día siguiente es aceptable; si va a más, baje un poco y coméntelo. Si es brusco e intenso, consulte." },
  { id: "caidas", txt: "Me da miedo caerme", resp: "Los ejercicios de equilibrio reducen las caídas. Empiece con un apoyo cerca (una silla firme o la encimera) y, al principio, con alguien al lado.", hoja: "Haga el equilibrio con un apoyo cerca: una silla firme o la encimera." },
  { id: "cansancio", txt: "Estoy muy cansado", resp: "Empezar con muy poco ayuda. Si el cansancio es nuevo o va a más, conviene revisarlo; algunos fármacos también cansan.", hoja: "Empiece con muy poco; si el cansancio es nuevo o va a más, dígalo en la consulta." },
  { id: "saber", txt: "No sé qué hacer ni por dónde empezar", resp: "Le dejo un plan sencillo para esta semana. La aplicación le guía en cada sesión con dibujos y voz, y anota lo que hace.", hoja: "Siga el plan de esta hoja; la aplicación le guía en cada sesión con dibujos y voz." },
  { id: "medicacion", txt: "Me preocupa que me siente mal con la medicación", resp: "Con su medicación puede hacer ejercicio con unos cuidados concretos: {cuidados}", hoja: "Con su medicación, los cuidados de esta hoja bastan para empezar." },
  { id: "clima", txt: "Hace mal tiempo o mucho calor", resp: "Hay opciones en casa: levantarse de la silla, subir y bajar un escalón, bailar. Con calor, a primera hora o al final del día, y con agua.", hoja: "En casa también vale: la silla, un escalón o bailar. Con calor, a primera hora y con agua." },
  { id: "compania", txt: "Me falta ánimo o compañía", resp: "Con alguien es más fácil: un paseo fijo con un familiar o un amigo, o los grupos del centro de salud, del ayuntamiento o del centro de mayores.", hoja: "Quede con alguien para moverse o pregunte por grupos en su centro de salud o su ayuntamiento." },
  { id: "dinero", txt: "Cuesta dinero", resp: "Caminar y los ejercicios en casa no cuestan nada, y muchos ayuntamientos tienen actividades gratuitas o baratas.", hoja: "Caminar y los ejercicios en casa no cuestan nada." },
  { id: "activo", txt: "Ya me muevo bastante", resp: "¡Bien! Lo que más suele faltar es la fuerza y el equilibrio: dos días por semana de ejercicios con el propio peso.", hoja: "Añada a lo que ya hace dos días de fuerza por semana y algo de equilibrio." },
]);

/** Derivaciones que conviene valorar en la consulta programada, según la situación. */
export const DERIVAR = tC({
  insuficiencia_cardiaca: "Rehabilitación cardiaca: programa de ejercicio supervisado.",
  cardiopatia_isquemica: "Rehabilitación cardiaca tras un infarto, un stent o un bypass.",
  epoc_asma: "Rehabilitación respiratoria si la falta de aire le limita.",
  artrosis: "Fisioterapia o ejercicio terapéutico supervisado.",
  fragil: "Programa multicomponente tipo Vivifrail, supervisado al principio.",
  prefragil: "Programa multicomponente tipo Vivifrail.",
  ictus: "Fisioterapia o rehabilitación si quedan secuelas.",
  osteoporosis: "Fisioterapia para aprender la fuerza y el impacto adaptados.",
  cancer: "Programa de ejercicio oncológico si su hospital lo ofrece.",
});

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const minus = (s = "") => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const conjunto = (x) => (x instanceof Set ? x : new Set(x || []));

/** Contexto normalizado a partir de lo que pasa la app. */
export function contexto(d = {}) {
  const cond = conjunto(d.condiciones), senales = conjunto(d.senales);
  const mayor = d.edad != null && d.edad >= 65;
  return { cond, senales, mayor, fragil: cond.has("fragil"), nyha: cond.has("nyha34"), caidas: !!d.caidas || cond.has("fragil") };
}

/** Barreras con la marca «frecuente en su caso» y la respuesta adaptada a su medicación. Las frecuentes, primero. */
export function barreras(d = {}) {
  const c = contexto(d), cuidados = (d.vistazo?.cuidado || []).slice(0, 2);
  const frec = {
    dolor: c.cond.has("artrosis") || c.cond.has("osteoporosis"),
    caidas: c.mayor || c.caidas || c.senales.has("caidas") || c.senales.has("sedacion"),
    cansancio: c.senales.has("fatiga") || c.cond.has("insuficiencia_cardiaca") || c.cond.has("epoc_asma") || c.cond.has("cancer"),
    medicacion: (d.esencial || []).some((x) => x.nivel !== "info"),
    clima: c.senales.has("calor") || c.senales.has("deshidratacion"),
    saber: !(d.diarioN > 0),
  };
  return BARRERAS.map((b) => ({ ...b, frecuente: !!frec[b.id], resp: b.resp.replace("{cuidados}", cuidados.length ? cuidados.join(" ") : tL("empiece suave y suba un poco cada semana.")) }))
    .sort((a, b) => Number(b.frecuente) - Number(a.frecuente));
}

/** Objetivo de partida, en primera persona, para escribir con sus palabras. */
export function objetivoSugerido(d = {}, actividad = null) {
  const c = contexto(d);
  if (c.fragil) return tL("Levantarme de la silla 5 veces seguidas, dos veces al día, y caminar 5 minutos después de comer.");
  if (c.nyha) return tL("Si estoy estable, caminar 5-10 minutos, dos veces al día, a un ritmo que me deje hablar.");
  if (actividad === "si") return tL("Añadir dos días por semana de fuerza: levantarme de la silla, subir escalones y empujar contra la pared.");
  return tL("Caminar 10 minutos después de comer, 5 días esta semana, a un ritmo que me deje hablar.");
}

/** Pregunta de seguimiento para las escalas de importancia y confianza, y la pista para la consulta. */
export function escalas(imp, conf) {
  const i = Number(imp), cf = Number(conf);
  const pImp = tL`¿Por qué un ${i} y no un ${Math.max(0, i - 2)}?`;
  const pConf = tL`¿Qué le haría pasar de un ${cf} a un ${Math.min(10, cf + 2)}?`;
  const pista = i <= 3 ? tL("Importancia baja: informe sin presionar y deje la puerta abierta («Si cambia de idea, lo retomamos»).")
    : cf <= 4 ? tL("Confianza baja: un objetivo más pequeño y ensayarlo ahora en la consulta (por ejemplo, levantarse de la silla cinco veces).")
    : tL("Buena disposición: pase a acordar un objetivo concreto.");
  return { pImp, pConf, pista };
}

/** Nota para la historia clínica (texto plano). s: { actividad, sentado, imp, conf, barreras, objetivo, semanas }. */
export function nota(d = {}, s = {}) {
  const L = [tL("Consejo sobre actividad física (modelo de las 5 Aes).")];
  const act = s.actividad === "si" ? tL("llega a 30 min/día de actividad moderada 5 o más días") : s.actividad === "no" ? tL("no llega a la recomendación de actividad") : tL("no preguntada");
  L.push(tL`- Actividad actual: ${act}${s.sentado ? tL("; más de 2 h seguidas sentado") : ""}.`);
  if (s.imp != null && s.conf != null) L.push(tL`- Importancia ${s.imp}/10 · confianza ${s.conf}/10.`);
  const bs = BARRERAS.filter((b) => (s.barreras || []).includes(b.id)).map((b) => minus(b.txt));
  if (bs.length) L.push(tL`- Barreras: ${bs.join("; ")}.`);
  if (s.objetivo) L.push(tL`- Acuerdo: ${s.objetivo.trim().replace(/\s+/g, " ")}`);
  const seg = (d.esencial || []).filter((x) => x.nivel !== "info").map((x) => x.titulo);
  if (seg.length) L.push(tL`- Seguridad por la medicación: ${seg.join("; ")}.`);
  if (d.crib?.clave && d.crib.clave !== "sin_datos" && d.crib.texto) L.push(tL`- Cribado ACSM: ${String(d.crib.texto).replace(/<[^>]+>/g, "")}`);
  const hab = (d.habAvisos || []).filter((x) => x.nivel !== "info").map((x) => x.titulo);
  if (hab.length) L.push(tL`- Hábitos: ${hab.join("; ")}.`);
  L.push(tL`- Seguimiento: en ${s.semanas || 4} semanas.`);
  L.push(tL`(Pauta Activa v${d.version || "?"}; orientativo, no sustituye la valoración clínica.)`);
  return L.join("\n");
}

const fecha = (ms) => new Date(ms).toLocaleDateString(tL("es-ES"), { day: "numeric", month: "long", year: "numeric" });
/** Hoja para el paciente (HTML para imprimir en A4). */
export function hoja(d = {}, s = {}, ahora = Date.now()) {
  const plan = (d.plan || []).map(([k, frec, tiempo, como]) => `<tr><th>${{ aer: tL("Caminar o similar"), fue: tL("Fuerza"), eq: tL("Equilibrio") }[k] || esc(k)}</th><td>${esc(frec)}</td><td>${esc(tiempo)}</td><td>${esc(como)}</td></tr>`).join("");
  const cuidados = [...(d.vistazo?.cuidado || []).slice(0, 3), ...(d.vistazo?.evite || []).slice(0, 2).map((x) => tL("Evite: ") + minus(x))];
  const bs = BARRERAS.filter((b) => (s.barreras || []).includes(b.id));
  const sem = s.semanas || 4, rev = new Date(ahora + sem * 7 * 864e5);
  return tL`<div class="hc-cab"><div><h1>Lo que hemos hablado</h1><p>Su plan para moverse más, con su medicación en cuenta.</p></div><p>${esc(fecha(ahora))}<br><span class="hc-nombre">Nombre: </span></p></div>
  <section class="hc-obj"><h2>Mi objetivo para las próximas semanas</h2><p>${esc((s.objetivo || objetivoSugerido(d, s.actividad)).trim())}</p></section>
  ${plan ? tL`<section><h2>Mi semana</h2><table><thead><tr><th></th><th>Cuántos días</th><th>Cuánto tiempo</th><th>Cómo</th></tr></thead><tbody>${plan}</tbody></table></section>` : ""}
  ${["valoracion_antes", "valoracion_vigoroso", "parar"].includes(d.crib?.clave) && d.crib.texto ? `<p class="hc-aviso"><b>Importante:</b> ${esc(String(d.crib.texto).replace(/<[^>]+>/g, ""))}</p>` : ""}
  <div class="hc-dos"><section><h2>Con mi medicación, cuidado con</h2><ul>${cuidados.map((x) => `<li>${esc(x)}</li>`).join("") || tL("<li>Empiece suave y suba un poco cada semana.</li>")}</ul></section>
  <section class="hc-alarma"><h2>Pare y consulte si nota</h2><ul>${(d.alarma || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section></div>
  ${bs.length ? tL`<section><h2>Si me cuesta</h2><ul>${bs.map((b) => `<li><b>${esc(b.txt)}:</b> ${esc(b.hoja)}</li>`).join("")}</ul></section>` : ""}
  <section class="hc-rev"><h2>Próxima revisión</h2><p>Dentro de ${sem} semanas, hacia el ${esc(fecha(rev.getTime()))}. Anote lo que hace en la aplicación y tráigalo a la consulta.</p></section>
  <p class="hc-pie">Pauta Activa · v${esc(d.version || "")} · Orientativo: no sustituye la valoración de su médico.</p>`;
}

export const TXT = {
  es: { titulo: "Guía de conversación", sub: "Consejo breve sobre actividad física, adaptado a la medicación y la situación de esta persona.", t1: "1 min", t1s: "Muy breve", t5: "5 min", t5s: "Breve", tm: "20-30 min", tms: "Consulta programada", pasos: "Pasos", caso: "Su caso", imprimir: "Hoja para el paciente", nota: "Copiar nota", nota_t: "Copiar una nota para la historia clínica", copiada: "Nota copiada", fuentes: "Fuentes", act: "Actividad actual", act_si: "Llega (30 min, 5 días)", act_no: "No llega", sentado: "Pasa más de 2 horas seguidas sentado", imp: "Importancia", conf: "Confianza", objetivo: "Objetivo acordado", barreras: "Barreras frecuentes", frecuente: "Frecuente en su caso", semanas: "Revisión en", sem_n: "{n} semanas", sppb: "Medir con el SPPB (5 min)", pruebas: "Pruebas de forma física", metas: "Elegir metas", simula: "¿Qué cambia si…?", mes: "Resumen del mes", habitos: "Alcohol, tabaco y café", sin_meds: "Añada la medicación para que la guía se adapte a esta persona.", averiguar: "Averiguar", aconsejar: "Aconsejar", acordar: "Acordar", ayudar: "Ayudar", asegurar: "Asegurar" },
  en: { titulo: "Conversation guide", sub: "Brief advice on physical activity, adapted to this person's medicines and situation.", t1: "1 min", t1s: "Very brief", t5: "5 min", t5s: "Brief", tm: "20-30 min", tms: "Booked appointment", pasos: "Steps", caso: "Their case", imprimir: "Patient sheet", nota: "Copy note", nota_t: "Copy a note for the clinical record", copiada: "Note copied", fuentes: "Sources", act: "Current activity", act_si: "Meets it (30 min, 5 days)", act_no: "Does not", sentado: "Sits for more than 2 hours at a time", imp: "Importance", conf: "Confidence", objetivo: "Agreed goal", barreras: "Common barriers", frecuente: "Common in their case", semanas: "Review in", sem_n: "{n} weeks", sppb: "Measure with the SPPB (5 min)", pruebas: "Fitness tests", metas: "Choose goals", simula: "What changes if…?", mes: "Monthly summary", habitos: "Alcohol, tobacco and coffee", sin_meds: "Add the medicines so the guide adapts to this person.", averiguar: "Ask", aconsejar: "Advise", acordar: "Agree", ayudar: "Assist", asegurar: "Arrange" },
  ca: { titulo: "Guia de conversa", sub: "Consell breu sobre activitat física, adaptat a la medicació i la situació d'aquesta persona.", t1: "1 min", t1s: "Molt breu", t5: "5 min", t5s: "Breu", tm: "20-30 min", tms: "Consulta programada", pasos: "Passos", caso: "El seu cas", imprimir: "Full per al pacient", nota: "Copiar la nota", nota_t: "Copiar una nota per a la història clínica", copiada: "Nota copiada", fuentes: "Fonts", act: "Activitat actual", act_si: "Hi arriba (30 min, 5 dies)", act_no: "No hi arriba", sentado: "Passa més de 2 hores seguides assegut", imp: "Importància", conf: "Confiança", objetivo: "Objectiu acordat", barreras: "Barreres freqüents", frecuente: "Freqüent en el seu cas", semanas: "Revisió d'aquí a", sem_n: "{n} setmanes", sppb: "Mesurar amb l'SPPB (5 min)", pruebas: "Proves de forma física", metas: "Triar metes", simula: "Què canvia si…?", mes: "Resum del mes", habitos: "Alcohol, tabac i cafè", sin_meds: "Afegeixi la medicació perquè la guia s'adapti a aquesta persona.", averiguar: "Esbrinar", aconsejar: "Aconsellar", acordar: "Acordar", ayudar: "Ajudar", asegurar: "Assegurar" },
  gl: { titulo: "Guía de conversa", sub: "Consello breve sobre actividade física, adaptado á medicación e á situación desta persoa.", t1: "1 min", t1s: "Moi breve", t5: "5 min", t5s: "Breve", tm: "20-30 min", tms: "Consulta programada", pasos: "Pasos", caso: "O seu caso", imprimir: "Folla para o paciente", nota: "Copiar a nota", nota_t: "Copiar unha nota para a historia clínica", copiada: "Nota copiada", fuentes: "Fontes", act: "Actividade actual", act_si: "Chega (30 min, 5 días)", act_no: "Non chega", sentado: "Pasa máis de 2 horas seguidas sentado", imp: "Importancia", conf: "Confianza", objetivo: "Obxectivo acordado", barreras: "Barreiras frecuentes", frecuente: "Frecuente no seu caso", semanas: "Revisión en", sem_n: "{n} semanas", sppb: "Medir co SPPB (5 min)", pruebas: "Probas de forma física", metas: "Escoller metas", simula: "Que cambia se…?", mes: "Resumo do mes", habitos: "Alcol, tabaco e café", sin_meds: "Engada a medicación para que a guía se adapte a esta persoa.", averiguar: "Indagar", aconsejar: "Aconsellar", acordar: "Acordar", ayudar: "Axudar", asegurar: "Asegurar" },
  eu: { titulo: "Elkarrizketa-gida", sub: "Jarduera fisikoari buruzko aholku laburra, pertsona honen botiketara eta egoerara egokitua.", t1: "1 min", t1s: "Oso laburra", t5: "5 min", t5s: "Laburra", tm: "20-30 min", tms: "Kontsulta programatua", pasos: "Urratsak", caso: "Bere kasua", imprimir: "Pazientearentzako orria", nota: "Kopiatu oharra", nota_t: "Kopiatu historia klinikorako ohar bat", copiada: "Oharra kopiatu da", fuentes: "Iturriak", act: "Egungo jarduera", act_si: "Iristen da (30 min, 5 egun)", act_no: "Ez da iristen", sentado: "2 ordu baino gehiago ematen ditu jarraian eserita", imp: "Garrantzia", conf: "Konfiantza", objetivo: "Adostutako helburua", barreras: "Ohiko oztopoak", frecuente: "Ohikoa bere kasuan", semanas: "Berrikuspena", sem_n: "{n} aste barru", sppb: "Neurtu SPPBrekin (5 min)", pruebas: "Sasoi fisikoko probak", metas: "Aukeratu helburuak", simula: "Zer aldatzen da…?", mes: "Hilabeteko laburpena", habitos: "Alkohola, tabakoa eta kafea", sin_meds: "Gehitu botikak gida pertsona honetara egokitzeko.", averiguar: "Galdetu", aconsejar: "Aholkatu", acordar: "Adostu", ayudar: "Lagundu", asegurar: "Bermatu" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}

/* ---------- pasos de cada modalidad ---------- */
const caso = (html) => `<div class="cv-caso"><span class="cv-caso-l">${tx("caso")}</span>${html}</div>`;
const q = (s) => `<q class="cv-di">${s}</q>`;
const pnota = (s) => `<p class="cv-nota">${s}</p>`;
const benLinea = (b) => `<b>${esc(b.titulo)}:</b> ${esc(b.cifra)} ${esc(b.unidad)}`;
const accion = (attr, txt) => `<button type="button" class="btn-sec sm" ${attr}>${esc(txt)}</button>`;

/** Pasos de cada modalidad («uno», «cinco», «mas»): [{ a, titulo, html }]. s: estado de la guía. */
export function pasos(d = {}, modo = "uno", s = {}) {
  const c = contexto(d), ben = d.ben || [], cuid = d.vistazo?.cuidado || [];
  if (modo === "uno") {
    const b = ben.find((x) => x.sit !== "todos") || ben[0];
    return [
      { a: "averiguar", titulo: tL("Pida permiso y pregunte"), html: q(tL("¿Le parece bien que hablemos un minuto de cuánto se mueve?")) + q(tL("En una semana normal, ¿hace al menos 30 minutos al día de actividad moderada, cinco días o más?")) + pnota(tL("Equivale a los 150 minutos a la semana que recomienda la OMS.")) },
      { a: "aconsejar", titulo: tL("Un mensaje que le toque"), html: (b ? caso(benLinea(b)) + q(tL`En su situación, moverse tiene un efecto real: ${esc(minus(b.titulo))}.`) : "") + q(tL("Algo es mejor que nada, y más es mejor: hasta un paseo de 10 minutos cuenta.")) + (cuid[0] ? caso(tL`<b>Con su medicación:</b> ${esc(cuid[0])}`) : "") },
      { a: "asegurar", titulo: tL("Un primer paso y volver a preguntar"), html: q(tL("¿Qué pequeño cambio podría hacer esta semana?")) + tL`<p>Entregue la hoja con su plan (abajo) y pregunte cómo le ha ido en la próxima visita.</p>` },
    ];
  }
  if (modo === "cinco") {
    const e = escalas(s.imp ?? 5, s.conf ?? 5);
    const seg = (d.esencial || []).slice(0, 3);
    const crib = d.crib?.clave && d.crib.clave !== "sin_datos" ? String(d.crib.texto || "").replace(/<[^>]+>/g, "") : tL("Cribado de seguridad sin hacer: tres preguntas en «Sus datos».");
    const hab = (d.habAvisos || []).filter((x) => x.nivel !== "info");
    const habHtml = hab.length ? caso(tL`<b>Hábitos:</b> ${hab.map((x) => esc(x.titulo)).join(" · ")}`) : !Object.values(d.hab || {}).some(Boolean) ? pnota(tL("Pregunte también por alcohol, tabaco y café: se cruzan con su medicación (en «Sus datos»).")) : "";
    const bs = barreras(d);
    const P = d.plan || [];
    return [
      { a: "averiguar", titulo: tL("Qué hace ahora y qué le importa"), html: `<fieldset class="cv-campo"><legend>${tx("act")}</legend><label class="check"><input type="radio" name="cv-act" value="si"${s.actividad === "si" ? " checked" : ""}> <span>${tx("act_si")}</span></label><label class="check"><input type="radio" name="cv-act" value="no"${s.actividad === "no" ? " checked" : ""}> <span>${tx("act_no")}</span></label><label class="check"><input type="checkbox" name="cv-sentado"${s.sentado ? " checked" : ""}> <span>${tx("sentado")}</span></label></fieldset>`
          + q(tL("¿Qué le gustaría poder hacer mejor? Subir escaleras, llevar la compra, jugar con los nietos…")) + ((d.metas || []).length ? caso(tL`<b>Sus metas:</b> ${d.metas.map(esc).join(" · ")}`) : "")
          + `<div class="cv-escalas"><label class="cv-esc"><span>${q(tL("Del 0 al 10, ¿cuánto le importa moverse más?"))}</span><span class="cv-esc-fila"><input type="range" min="0" max="10" step="1" name="cv-imp" value="${s.imp ?? 5}" aria-label="${tx("imp")}"><output data-cv-out="imp">${s.imp ?? 5}</output></span><small data-cv-p="imp">${esc(e.pImp)}</small></label>`
          + `<label class="cv-esc"><span>${q(tL("Y del 0 al 10, ¿cuánta confianza tiene en conseguirlo?"))}</span><span class="cv-esc-fila"><input type="range" min="0" max="10" step="1" name="cv-conf" value="${s.conf ?? 5}" aria-label="${tx("conf")}"><output data-cv-out="conf">${s.conf ?? 5}</output></span><small data-cv-p="conf">${esc(e.pConf)}</small></label></div>`
          + `<p class="cv-pista" data-cv-pista>${esc(e.pista)}</p>` + pnota(tL("Escalas de importancia y confianza de la entrevista motivacional.")) },
      { a: "aconsejar", titulo: tL("Beneficios y seguridad en su caso"), html: (ben.length ? caso(`<ul>${ben.slice(0, 3).map((b) => `<li>${benLinea(b)} <small>(${esc(b.estudio)})</small></li>`).join("")}</ul>`) : q(tL("Algo es mejor que nada, y más es mejor.")))
          + (seg.length ? caso(`<ul class="cv-seg">${seg.map((x) => `<li class="nivel-${x.nivel}"><span class="punto"></span><span><b>${esc(x.titulo)}.</b> ${esc(x.texto)}</span></li>`).join("")}</ul>`) : pnota(d.nMeds ? tL("Sin avisos importantes por su medicación: puede empezar de forma progresiva.") : tL("Aún no ha añadido la medicación: añádala para ver los avisos.")))
          + caso(tL`<b>Cribado:</b> ${esc(crib)}`) + habHtml },
      { a: "acordar", titulo: tL("Un objetivo pequeño y concreto"), html: `<label class="cv-campo cv-obj"><span>${tx("objetivo")}</span><textarea name="cv-obj" rows="3">${esc(s.objetivo ?? objetivoSugerido(d, s.actividad))}</textarea></label>`
          + pnota(tL("Que sea concreto (qué, cuándo y cuánto), pequeño y dicho con sus palabras. Mejor quedarse corto que fallar."))
          + (P.length ? caso(tL`<b>Su plan:</b> ${P.map(([k, frec]) => `${{ aer: tL("caminar o similar"), fue: "fuerza", eq: "equilibrio" }[k] || esc(k)}, ${esc(minus(frec))}`).join(" · ")}`) : "") },
      { a: "ayudar", titulo: tL("Barreras y cómo responder"), html: `<fieldset class="cv-campo cv-barreras"><legend>${tx("barreras")}</legend>${bs.map((b) => `<label class="check"><input type="checkbox" name="cv-bar" value="${b.id}"${(s.barreras || []).includes(b.id) ? " checked" : ""}> <span>${esc(b.txt)}${b.frecuente ? ` <small class="cv-frec">${tx("frecuente")}</small>` : ""}</span></label>`).join("")}</fieldset>`
          + `<ul class="cv-resp" data-cv-resp>${bs.filter((b) => (s.barreras || []).includes(b.id)).map((b) => `<li><b>${esc(b.txt)}</b>${q(esc(b.resp))}</li>`).join("")}</ul>` },
      { a: "asegurar", titulo: tL("Seguimiento"), html: `<label class="cv-campo cv-sem"><span>${tx("semanas")}</span><select name="cv-sem">${[2, 4, 8, 12].map((n) => `<option value="${n}"${(s.semanas || 4) === n ? " selected" : ""}>${tx("sem_n", { n })}</option>`).join("")}</select></label>`
          + tL`<ul><li>Que anote lo que hace en la aplicación: el diario y los anillos de la semana dan para hablar en la próxima visita.</li><li>Recursos de su barrio o municipio: <a href="${LOCALIZA.url}" target="_blank" rel="noopener">${LOCALIZA.txt}</a> (mapa de recursos comunitarios del Ministerio de Sanidad, si su ayuntamiento participa).</li><li>Si hace falta, derive (lo tiene en «20-30 minutos»).</li></ul>` },
    ];
  }
  // consulta programada
  const der = Object.keys(DERIVAR).filter((k) => c.cond.has(k)).map((k) => DERIVAR[k]);
  const P = d.P;
  const fitt = P ? `<table class="cv-fitt"><thead><tr><th></th><th>Frecuencia</th><th>Intensidad</th><th>Tiempo</th></tr></thead><tbody>${[[tL("Aeróbico"), P.aer], [tL("Fuerza"), P.fue], [tL("Equilibrio"), P.eq]].map(([n, x]) => `<tr><th>${n}</th><td>${esc(x.frec)}</td><td>${esc(x.int)}</td><td>${esc(x.tiempo)}</td></tr>`).join("")}</tbody></table>` : "";
  return [
    { a: "averiguar", titulo: tL("Medir el punto de partida"), html: tL`<p>Una prueba objetiva da un punto de partida y una cifra que mejorar.</p><div class="cv-acciones">${accion('data-cv-accion="sppb"', tx("sppb"))}${accion('data-pruebas=""', tx("pruebas"))}</div>` + (d.sppbTxt ? caso(esc(d.sppbTxt)) : "") },
    { a: "acordar", titulo: tL("Metas de la vida diaria, con hitos"), html: tL`<p>Ordenar el plan alrededor de 1 a 3 metas que le importen (escaleras, la compra, los nietos) da sentido a cada ejercicio.</p>` + ((d.metas || []).length ? caso(tL`<b>Sus metas:</b> ${d.metas.map(esc).join(" · ")}`) : "") + `<div class="cv-acciones">${accion('data-metas=""', tx("metas"))}</div>` },
    { a: "aconsejar", titulo: tL("La prescripción completa"), html: fitt + pnota(tL("Derivada de su medicación y su situación; la tiene también en «Mi plan» y en los PDF.")) },
    { a: "ayudar", titulo: tL("La medicación, pensando en el ejercicio"), html: tL`<p>${d.nMeds ? tL`${d.nMeds} medicamentos en la lista${d.nMayor ? tL`, ${d.nMayor} con interacciones de nivel mayor` : ""}.` : esc(tx("sin_meds"))} Si se plantea retirar o cambiar alguno, mire antes qué cambia en los avisos y en el plan.</p><div class="cv-acciones">${accion('data-simula=""', tx("simula"))}${accion('data-cv-accion="habitos"', tx("habitos"))}</div>` },
    { a: "asegurar", titulo: tL("Seguimiento y derivación"), html: tL`<p>Revise el diario y el resumen del mes en la próxima cita.</p><div class="cv-acciones">${accion('data-mes=""', tx("mes"))}</div>` + (der.length ? caso(tL`<b>Valorar derivación:</b><ul>${der.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`) : "") + tL`<p>Si no hay un programa específico, grupos de actividad del centro de salud o del municipio (<a href="${LOCALIZA.url}" target="_blank" rel="noopener">${LOCALIZA.txt}</a>).</p>` },
  ];
}

/* ---------- ventana ---------- */
const CSS = `
.cv-dlg { width: min(860px, calc(100vw - 24px)); }
.cv-dlg .ficha-cab p { flex: 1 1 auto; margin: 0; font-weight: 800; font-size: 1.05rem; }
.cv-intro { margin: 0 0 6px; color: var(--muted); font-size: .9rem; }
.cv-porque { margin: 0 0 10px; font-size: .86rem; }
.cv-porque b { font: 800 1rem/1 var(--mono); color: var(--accent-deep); }
.cv-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: 0 0 14px; padding: 4px; border-radius: var(--r-lg); background: var(--surface-2); border: 1px solid var(--line); }
.cv-tab { display: grid; gap: 2px; justify-items: start; min-height: 52px; padding: 8px 12px; border: 0; border-radius: var(--r-md); background: transparent; color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.cv-tab b { font: 800 1rem/1.1 var(--mono); letter-spacing: -.01em; }
.cv-tab small { font-size: .74rem; color: var(--muted); }
.cv-tab[aria-selected="true"] { background: var(--surface); box-shadow: 0 1px 0 var(--line-strong), 0 2px 8px color-mix(in srgb, var(--fg) 8%, transparent); }
.cv-tab[aria-selected="true"] b { color: var(--accent-deep); }
.cv-tab:focus-visible { outline: 3px solid var(--accent); outline-offset: 1px; }
.cv-pasos { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; counter-reset: cv; }
.cv-paso { position: relative; display: grid; grid-template-columns: 34px minmax(0, 1fr); column-gap: 12px; padding: 0 0 16px; }
.cv-paso::before { counter-increment: cv; content: counter(cv); grid-row: 1 / span 3; align-self: start; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: var(--accent-fg); font: 800 .9rem/1 var(--mono); position: relative; z-index: 1; }
.cv-paso:not(:last-child)::after { content: ""; position: absolute; left: 14px; top: 32px; bottom: 2px; width: 2px; background: linear-gradient(var(--accent), color-mix(in srgb, var(--accent) 20%, transparent)); border-radius: 2px; }
.cv-a { grid-column: 2; justify-self: start; padding: 1px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep); font: 700 .66rem/1.5 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
.cv-paso h4 { grid-column: 2; margin: 4px 0 6px; font-size: 1rem; }
.cv-cuerpo { grid-column: 2; display: grid; gap: 8px; font-size: .92rem; min-width: 0; }
.cv-cuerpo p, .cv-cuerpo ul { margin: 0; }
.cv-cuerpo ul { padding-left: 1.1em; display: grid; gap: 4px; }
.cv-di { display: block; position: relative; padding: 8px 12px 8px 14px; border-radius: 4px var(--r-md) var(--r-md) var(--r-md); background: color-mix(in srgb, var(--accent) 7%, var(--surface)); border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--line)); font-style: italic; quotes: "\\00AB" "\\00BB"; }
.cv-di::before { content: open-quote; } .cv-di::after { content: close-quote; }
.cv-caso { position: relative; padding: 9px 12px; border-radius: var(--r-md); background: var(--surface-2); border-left: 3px solid var(--accent); }
.cv-caso-l { display: block; margin-bottom: 3px; font: 700 .62rem/1.4 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--accent-deep); }
.cv-caso ul { padding-left: 1.1em; }
.cv-seg { list-style: none; padding: 0 !important; }
.cv-seg li { display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: 8px; align-items: start; }
.cv-seg .punto { width: 10px; height: 10px; margin-top: 6px; border-radius: 50%; background: var(--info); }
.cv-seg .nivel-alerta .punto { background: var(--alerta); } .cv-seg .nivel-precaucion .punto { background: var(--precaucion); }
.cv-nota { color: var(--muted); font-size: .8rem; }
.cv-pista { padding: 6px 10px; border-radius: var(--r-sm); background: var(--info-soft); color: var(--info-ink); font-size: .86rem; font-weight: 600; }
.cv-campo { display: grid; gap: 6px; margin: 0; padding: 0; border: 0; min-width: 0; }
.cv-campo legend, .cv-campo > span { padding: 0; font: 700 .7rem/1.4 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.cv-campo textarea, .cv-campo select { width: 100%; font: inherit; }
.cv-escalas { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
.cv-esc { display: grid; gap: 6px; }
.cv-esc-fila { display: flex; align-items: center; gap: 10px; }
.cv-esc input[type=range] { flex: 1 1 auto; background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 25%, var(--surface-2)), var(--accent)); }
.cv-esc output { min-width: 2.2ch; font: 800 1.3rem/1 var(--mono); color: var(--accent-deep); text-align: right; }
.cv-esc small { color: var(--muted); font-style: italic; }
.cv-frec { padding: 0 6px; border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-weight: 700; font-size: .7rem; white-space: nowrap; }
.cv-barreras { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
.cv-barreras legend { margin-bottom: 4px; }
.cv-resp { list-style: none; padding: 0 !important; }
.cv-resp li { display: grid; gap: 4px; }
.cv-resp:empty { display: none; }
.cv-acciones { display: flex; flex-wrap: wrap; gap: 8px; }
.cv-fitt { width: 100%; border-collapse: collapse; font-size: .82rem; }
.cv-fitt th, .cv-fitt td { padding: 6px 8px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.cv-fitt thead th { font: 700 .66rem/1.3 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.cv-fitt tbody th { white-space: nowrap; color: var(--accent-deep); }
.cv-pie { position: sticky; z-index: 3; bottom: -20px; display: flex; flex-wrap: wrap; gap: 8px; margin: 6px -16px -20px; padding: 12px 16px; background: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(6px); border-top: 1px solid var(--line); }
.cv-fuentes { margin-top: 12px; font-size: .8rem; color: var(--muted); }
.cv-fuentes ul { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 3px; }
.cv-fuentes a, .cv-cuerpo a { color: var(--accent-deep); text-underline-offset: 2px; }
@media (max-width: 560px) { .cv-tab { padding: 8px; } .cv-tab small { font-size: .68rem; } .cv-fitt thead { display: none; } .cv-fitt tr { display: grid; padding: 6px 0; border-bottom: 1px solid var(--line); } .cv-fitt th, .cv-fitt td { border: 0; padding: 2px 0; } }
:root[data-theme="contrast"] .cv-di, :root[data-theme="contrast"] .cv-caso { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .cv-panel:not([hidden]) .cv-paso { animation: cv-entra .35s var(--ease-salida) both; }
  html:not(.pa-quieto) .cv-panel:not([hidden]) .cv-paso:nth-child(2) { animation-delay: 50ms; }
  html:not(.pa-quieto) .cv-panel:not([hidden]) .cv-paso:nth-child(n+3) { animation-delay: 100ms; }
}
@keyframes cv-entra { from { opacity: 0; transform: translateY(6px); } }
#hoja-conversa { display: none; }
@page conversa { size: A4 portrait; margin: 12mm; }
@media print {
  body.imprimir-conversa > *:not(#hoja-conversa) { display: none !important; }
  body.imprimir-conversa #hoja-conversa { display: block; page: conversa; color: #000; font: 10pt/1.3 "Archivo", system-ui, sans-serif; }
  #hoja-conversa h1 { margin: 0; font-size: 17pt; }
  #hoja-conversa h2 { margin: 8px 0 3px; font-size: 11pt; color: #3b2a99; }
  #hoja-conversa section { break-inside: avoid; }
  #hoja-conversa .hc-cab > p { text-align: right; }
  #hoja-conversa .hc-nombre { display: inline-block; min-width: 62mm; margin-top: 4px; padding-top: 10px; border-bottom: 1px solid #777; text-align: left; }
  #hoja-conversa p { margin: 0; }
  #hoja-conversa ul { margin: 0; padding-left: 1.1em; }
  #hoja-conversa li { margin: 1px 0; }
  #hoja-conversa .hc-cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; padding-bottom: 6px; border-bottom: 2px solid #593ede; }
  #hoja-conversa .hc-obj { margin-top: 10px; padding: 8px 10px; border: 2px solid #593ede; border-radius: 8px; }
  #hoja-conversa .hc-obj h2 { margin-top: 0; }
  #hoja-conversa .hc-obj p { font-size: 12.5pt; font-weight: 700; }
  #hoja-conversa table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  #hoja-conversa th, #hoja-conversa td { border: 1px solid #999; padding: 3px 6px; vertical-align: top; text-align: left; }
  #hoja-conversa thead th { background: #eeecff; font-size: 9.5pt; }
  #hoja-conversa tbody th { width: 18%; background: #f6f6f9; }
  #hoja-conversa .hc-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  #hoja-conversa .hc-alarma h2 { color: #a1122a; }
  #hoja-conversa .hc-aviso { margin-top: 8px; padding: 5px 9px; border-left: 4px solid #b45309; background: #fff7e6; }
  #hoja-conversa .hc-rev { margin-top: 10px; padding: 6px 10px; background: #f6f6f9; border-radius: 6px; }
  #hoja-conversa .hc-pie { margin-top: 8px; font-size: 8.5pt; color: #444; border-top: 1px solid #bbb; padding-top: 4px; }
}
`;

let dlg = null, d = {}, s = {}, modo = "uno", huella = "";
const cu = () => dlg.querySelector("#cv-cuerpo");
function crear() {
  if (!document.getElementById("cv-css")) { const st = document.createElement("style"); st.id = "cv-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "conversa"; dlg.className = "ficha cv-dlg"; dlg.setAttribute("aria-labelledby", "cv-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="cv-cab-t"></p><button type="button" class="btn-sec sm" id="cv-cerrar"></button></div><div class="ficha-cuerpo" id="cv-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#cv-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) return dlg.close();
    const tab = ev.target.closest("[data-cv-tab]");
    if (tab) { modo = tab.dataset.cvTab; pintar(); cu().querySelector(`[data-cv-tab="${modo}"]`)?.focus(); return; }
    const a = ev.target.closest("[data-cv-accion], [data-pruebas], [data-metas], [data-simula], [data-mes]");
    if (a && dlg.contains(a)) {
      dlg.close();
      if (a.dataset.cvAccion === "sppb") d.acciones?.sppb?.();
      else if (a.dataset.cvAccion === "habitos") d.acciones?.habitos?.();
      return; // los demás botones los abre la app con su delegación de clics
    }
    if (ev.target.closest("[data-cv-imprimir]")) imprimir();
    else if (ev.target.closest("[data-cv-nota]")) copiarNota();
  });
  dlg.addEventListener("keydown", (ev) => {
    const tab = ev.target.closest?.("[data-cv-tab]"); if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(ev.key)) return;
    ev.preventDefault();
    const ts = [...cu().querySelectorAll("[data-cv-tab]")], i = ts.indexOf(tab);
    const j = ev.key === "Home" ? 0 : ev.key === "End" ? ts.length - 1 : (i + (ev.key === "ArrowRight" ? 1 : -1) + ts.length) % ts.length;
    modo = ts[j].dataset.cvTab; pintar(); cu().querySelector(`[data-cv-tab="${modo}"]`)?.focus();
  });
  dlg.addEventListener("input", leerCampos);
  dlg.addEventListener("change", leerCampos);
}
function leerCampos(ev) {
  const el = ev.target; if (!el?.name?.startsWith("cv-")) return;
  if (el.name === "cv-act") { s.actividad = el.value; if (!s.objetivoTocado) { s.objetivo = objetivoSugerido(d, s.actividad); const ta = cu().querySelector('textarea[name="cv-obj"]'); if (ta) ta.value = s.objetivo; } }
  else if (el.name === "cv-sentado") s.sentado = el.checked;
  else if (el.name === "cv-imp" || el.name === "cv-conf") {
    const k = el.name === "cv-imp" ? "imp" : "conf"; s[k] = Number(el.value);
    const e = escalas(s.imp ?? 5, s.conf ?? 5);
    cu().querySelector(`[data-cv-out="${k}"]`).textContent = el.value;
    el.setAttribute("aria-valuetext", `${el.value} de 10`);
    cu().querySelector('[data-cv-p="imp"]').textContent = e.pImp; cu().querySelector('[data-cv-p="conf"]').textContent = e.pConf; cu().querySelector("[data-cv-pista]").textContent = e.pista;
  } else if (el.name === "cv-obj") { s.objetivo = el.value; s.objetivoTocado = true; }
  else if (el.name === "cv-sem") s.semanas = Number(el.value);
  else if (el.name === "cv-bar") {
    s.barreras = [...cu().querySelectorAll('input[name="cv-bar"]:checked')].map((x) => x.value);
    const bs = barreras(d).filter((b) => s.barreras.includes(b.id));
    cu().querySelector("[data-cv-resp]").innerHTML = bs.map((b) => `<li><b>${esc(b.txt)}</b>${q(esc(b.resp))}</li>`).join("");
  }
}
function pintar() {
  const tabs = [["uno", "t1"], ["cinco", "t5"], ["mas", "tm"]];
  const P = pasos(d, modo, s);
  cu().innerHTML = tL`<p class="cv-intro">${tx("sub")}</p>
    <p class="cv-porque">En atención primaria, por cada <b>12</b> personas sedentarias que reciben consejo, una más llega a la actividad recomendada al cabo de un año (<a href="https://doi.org/10.1136/bmj.e1389" target="_blank" rel="noopener">Orrow 2012</a>).</p>
    <div class="cv-tabs" role="tablist" aria-label="${esc(tx("titulo"))}">${tabs.map(([id, k]) => `<button type="button" role="tab" class="cv-tab" id="cv-tab-${id}" data-cv-tab="${id}" aria-selected="${modo === id}" aria-controls="cv-panel" tabindex="${modo === id ? 0 : -1}"><b>${tx(k)}</b><small>${tx(k + "s")}</small></button>`).join("")}</div>
    <div class="cv-panel" id="cv-panel" role="tabpanel" aria-labelledby="cv-tab-${modo}">${d.nMeds ? "" : `<p class="cv-nota">${tx("sin_meds")}</p>`}
      <ol class="cv-pasos" aria-label="${esc(tx("pasos"))}">${P.map((p) => `<li class="cv-paso" data-a="${p.a}"><span class="cv-a">${tx(p.a)}</span><h4>${esc(p.titulo)}</h4><div class="cv-cuerpo">${p.html}</div></li>`).join("")}</ol></div>
    <details class="cv-fuentes"><summary>${tx("fuentes")}</summary><ul>${FUENTES.map((f) => `<li><a href="${f.doi ? "https://doi.org/" + f.doi : f.url}" target="_blank" rel="noopener">${esc(f.txt)}</a></li>`).join("")}<li>Beneficios, avisos y hábitos de esta persona: la fuente de cada uno está en su tarjeta.</li></ul></details>
    <div class="cv-pie"><button type="button" class="btn sm" data-cv-imprimir>${tx("imprimir")}</button><button type="button" class="btn-sec sm" data-cv-nota title="${esc(tx("nota_t"))}">${tx("nota")}</button></div>`;
}
async function copiarNota() {
  const txt = nota(d, s);
  try { await navigator.clipboard.writeText(txt); }
  catch { const ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; dlg.append(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove(); }
  d.toast?.(tx("copiada"), { ms: 2500 });
}
function imprimir() {
  let h = document.getElementById("hoja-conversa");
  if (!h) { h = document.createElement("div"); h.id = "hoja-conversa"; document.body.append(h); }
  h.innerHTML = hoja(d, s);
  document.body.classList.add("imprimir-conversa");
  const fin = () => { document.body.classList.remove("imprimir-conversa"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch { fin(); } }, 120);
}

/**
 * Abre la guía. c: { condiciones, edad, caidas, senales, esencial, vistazo, plan, P, crib, ben, hab, habAvisos, metas,
 * alarma, nMeds, nMayor, diarioN, sppbTxt, version, t, acciones: { sppb, habitos }, toast }.
 * Lo que se ha escrito se conserva mientras no cambie la persona (lista y situación).
 */
export function abrir(c = {}) {
  if (!dlg) crear();
  d = c;
  const h = JSON.stringify([[...conjunto(c.condiciones)].sort(), c.edad, (c.esencial || []).map((x) => x.titulo), c.nMeds]);
  if (h !== huella) { huella = h; s = { imp: 5, conf: 5, semanas: 4, barreras: [] }; modo = "uno"; }
  dlg.querySelector("#cv-cab-t").textContent = tx("titulo");
  dlg.querySelector("#cv-cerrar").textContent = c.t ? c.t("ficha.cerrar") : "×";
  if (!dlg.open) dlg.showModal();
  pintar();
  cu().scrollTop = 0;
}
