/* Mitos sobre medicación y ejercicio (segunda tanda de mejoras grandes, 12). Se carga bajo demanda (data-abre="mitos").
   Doce ideas muy extendidas, cada una con su veredicto, lo que encontró el estudio, qué hacer, el tipo de estudio y la fuente
   con DOI. Los que tienen que ver con la medicación de la lista salen primero. Se apunta cuáles se han leído («medex.mitos»).
   CONTENIDO CLÍNICO NUEVO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA. Las cifras son las de los resúmenes de PubMed, comprobadas
   el 22/11/2026 (el posicionamiento de la ADA de 2016 no tiene resumen en PubMed: se cita sin cifras). El contenido va en
   español, como la base; la interfaz, en cinco idiomas. */
import { t, idioma } from "./i18n.js?v=202611230207";

const TXT = {
  es: { titulo: "Mitos sobre medicación y ejercicio", borrador: "Borrador pendiente de revisión clínica", intro: "Doce ideas muy extendidas y lo que encontraron los estudios. Toque una para ver la explicación y la fuente.", v_falso: "Falso", v_medias: "A medias",
    resumen: "{f} falsos · {m} a medias", leidos: "Leídos: {a} de {b}", por_su: "Por su medicación", resto: "Los demás", todos: "Los doce", hacer: "Qué hacer", estudio: "Tipo de estudio", fuente: "Fuente", sin_resumen: "sin resumen en PubMed; se cita como documento de referencia",
    nota: "Los estudios hablan de grupos de personas. Lo que le conviene a usted lo decide con su médico: no cambie su medicación por lo que lea aquí.",
  },
  en: { titulo: "Myths about medication and exercise", borrador: "Draft pending clinical review", intro: "Twelve widespread ideas and what the studies found. Tap one to see the explanation and the source.", v_falso: "False", v_medias: "Half true",
    resumen: "{f} false · {m} half true", leidos: "Read: {a} of {b}", por_su: "Because of your medication", resto: "The rest", todos: "All twelve", hacer: "What to do", estudio: "Type of study", fuente: "Source", sin_resumen: "no abstract in PubMed; cited as a reference document",
    nota: "Studies describe groups of people. What suits you is decided with your doctor: do not change your medication because of what you read here.",
  },
  ca: { titulo: "Mites sobre medicació i exercici", borrador: "Esborrany pendent de revisió clínica", intro: "Dotze idees molt esteses i el que van trobar els estudis. Toqueu-ne una per veure l'explicació i la font.", v_falso: "Fals", v_medias: "A mitges",
    resumen: "{f} falsos · {m} a mitges", leidos: "Llegits: {a} de {b}", por_su: "Per la vostra medicació", resto: "Els altres", todos: "Els dotze", hacer: "Què cal fer", estudio: "Tipus d'estudi", fuente: "Font", sin_resumen: "sense resum a PubMed; se cita com a document de referència",
    nota: "Els estudis parlen de grups de persones. El que us convé ho decidiu amb el vostre metge: no canvieu la medicació pel que llegiu aquí.",
  },
  gl: { titulo: "Mitos sobre medicación e exercicio", borrador: "Borrador pendente de revisión clínica", intro: "Doce ideas moi estendidas e o que atoparon os estudos. Toque unha para ver a explicación e a fonte.", v_falso: "Falso", v_medias: "A medias",
    resumen: "{f} falsos · {m} a medias", leidos: "Lidos: {a} de {b}", por_su: "Pola súa medicación", resto: "Os demais", todos: "Os doce", hacer: "Que facer", estudio: "Tipo de estudo", fuente: "Fonte", sin_resumen: "sen resumo en PubMed; cítase como documento de referencia",
    nota: "Os estudos falan de grupos de persoas. O que lle convén a vostede decídeo co seu médico: non cambie a súa medicación polo que lea aquí.",
  },
  eu: { titulo: "Botikei eta ariketari buruzko mitoak", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Oso zabalduta dauden hamabi ideia eta ikerketek aurkitutakoa. Ukitu bat azalpena eta iturria ikusteko.", v_falso: "Gezurra", v_medias: "Erdizka",
    resumen: "{f} gezurrezko · {m} erdizka", leidos: "Irakurrita: {b}tik {a}", por_su: "Zure botikengatik", resto: "Gainerakoak", todos: "Hamabiak", hacer: "Zer egin", estudio: "Ikerketa mota", fuente: "Iturria", sin_resumen: "laburpenik gabe PubMeden; erreferentziazko dokumentu gisa aipatzen da",
    nota: "Ikerketek pertsona taldeez hitz egiten dute. Zuri komeni zaizuna medikuarekin erabakitzen da: ez aldatu zure botikak hemen irakurritakoagatik.",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

const F = {
  westhoff: { cita: "Westhoff et al., J Hum Hypertens 2007", doi: "10.1038/sj.jhh.1002173" },
  allard21: { cita: "Allard et al., J Am Coll Cardiol 2021", doi: "10.1016/j.jacc.2021.08.075" },
  allard23: { cita: "Allard et al., J Am Coll Cardiol 2023", doi: "10.1016/j.jacc.2023.01.043" },
  frey: { cita: "Frey et al., J Thromb Haemost 2015", doi: "10.1111/jth.12793" },
  riddell: { cita: "Riddell et al., Lancet Diabetes Endocrinol 2017", doi: "10.1016/S2213-8587(17)30014-1" },
  colberg: { cita: "Colberg et al., Diabetes Care 2016 (posicionamiento de la ADA)", doi: "10.2337/dc16-1728", sinResumen: true },
  lipman: { cita: "Lipman et al., Emerg Med J 2017", doi: "10.1136/emermed-2016-206353" },
  naci: { cita: "Naci et al., Br J Sports Med 2019", doi: "10.1136/bjsports-2018-099921" },
  watson: { cita: "Watson et al., J Bone Miner Res 2018 (ensayo LIFTMOR)", doi: "10.1002/jbmr.3284" },
  noetel: { cita: "Noetel et al., BMJ 2024", doi: "10.1136/bmj-2023-075847" },
  seppala: { cita: "Seppala et al., J Am Med Dir Assoc 2018", doi: "10.1016/j.jamda.2017.12.098" },
  walton: { cita: "Walton et al., Aging Cell 2019 (ensayo MASTERS)", doi: "10.1111/acel.13039" },
  konopka: { cita: "Konopka et al., Aging Cell 2019", doi: "10.1111/acel.12880" },
  fiatarone: { cita: "Fiatarone et al., N Engl J Med 1994", doi: "10.1056/NEJM199406233302501" },
  johansen: { cita: "Johansen et al., JAMA 2017", doi: "10.1001/jama.2017.10169" },
};
/* Los doce mitos. v: "falso" | "medias". cuid: cuidado ya revisado del panel de hoy que se añade a «Qué hacer» (clave «cuid.*»).
   pq: «¿Por qué?» relacionado. aplica(d): si tiene que ver con la lista (d = { clases, senales, conds: Set; edad; n }). */
export const MITOS = [
  { id: "betabloqueante", v: "falso", mito: "Con un betabloqueante el pulso no sube, así que el ejercicio no me hace efecto.",
    x: "El betabloqueante frena el pulso, pero no el beneficio. En un ensayo con 52 personas hipertensas de 60 años o más (23 con betabloqueante), doce semanas de cinta bajaron la tensión de 24 horas lo mismo con el fármaco que sin él: 10,6 mmHg la sistólica en los dos grupos. El pulso de entrenamiento fue un 18 % más bajo con betabloqueante.",
    hacer: "No mida el esfuerzo con las zonas de pulso del reloj.", cuid: "pulso", pq: "pulso", tipo: "Ensayo aleatorizado de ejercicio (52 personas, 12 semanas)", f: ["westhoff"], aplica: (d) => d.clases.has("betabloqueantes") },
  { id: "estatina", v: "falso", mito: "Con una estatina, mejor no hacer ejercicio: el músculo se resiente.",
    x: "En personas de unos 64 años que tomaban estatinas, con y sin molestias musculares, doce semanas de ejercicio aeróbico y de fuerza de intensidad moderada mejoraron la fuerza y la resistencia a la fatiga sin empeorar las molestias. En otro estudio, caminar entre 30 y 50 km al día durante cuatro días no elevó los marcadores de daño muscular más que en quienes no las tomaban.",
    hacer: "Siga con la estatina y con el ejercicio.", cuid: "musculo", pq: "musculo", tipo: "Dos estudios de intervención con grupo de comparación (52 y 100 personas)", f: ["allard21", "allard23"], aplica: (d) => d.senales.has("estatina") || d.clases.has("estatinas") },
  { id: "anticoagulante", v: "falso", mito: "Con anticoagulantes hay que moverse lo menos posible para no sangrar.",
    x: "En 988 personas de 65 años o más que tomaban anticoagulantes, las más activas tuvieron menos sangrados graves, no más: 3,1 por cada 100 personas y año, frente a 11,6 en las menos activas. Es un estudio de observación: no demuestra que el ejercicio proteja, pero estar activo no se asoció a más sangrado.",
    hacer: "Lo que conviene evitar son los golpes, no el movimiento.", cuid: "sangrado", pq: "sangrado", tipo: "Estudio de cohortes (988 personas, 22 meses de seguimiento)", f: ["frey"], aplica: (d) => d.clases.has("anticoagulantes") },
  { id: "insulina", v: "medias", mito: "Con insulina o pastillas que bajan el azúcar, el ejercicio es demasiado arriesgado.",
    x: "El riesgo de bajada de azúcar existe, y el miedo a ella es una de las barreras que más frenan, según el consenso internacional sobre ejercicio y diabetes tipo 1. El mismo consenso explica cómo evitarla: cifras de glucosa con las que empezar y ajustes de la comida y de la insulina. El ejercicio regular ayuda a alcanzar los objetivos de glucosa, de grasas en sangre y de forma física.",
    hacer: "Pregunte a su equipo cómo ajustar la dosis y la comida los días de ejercicio.", cuid: "azucar", pq: "azucar", tipo: "Consenso de expertos y posicionamiento de una sociedad científica", f: ["riddell", "colberg"], aplica: (d) => d.senales.has("hipoglucemia") },
  { id: "aine", v: "falso", mito: "Un ibuprofeno antes de entrenar protege y evita el dolor.",
    x: "En un ensayo con 89 corredores de una carrera de 80 km, tomar ibuprofeno (400 mg cada 4 horas) se acompañó de más daño agudo del riñón que el placebo: 52 % frente a 34 %. La diferencia no alcanzó la significación estadística, pero los autores calculan un caso más por cada 5 o 6 personas que lo toman.",
    hacer: "No tome antiinflamatorios «por si acaso» antes del ejercicio, y menos con calor, en esfuerzos largos o si toma pastillas para la tensión o diuréticos. Si los necesita a menudo para poder entrenar, consúltelo.", tipo: "Ensayo aleatorizado, doble ciego (89 corredores)", f: ["lipman"], aplica: (d) => d.senales.has("aine") },
  { id: "tension", v: "falso", mito: "Si ya tomo pastillas para la tensión, el ejercicio no añade nada.",
    x: "Un análisis de 391 ensayos comparó ejercicio y fármacos: en personas con hipertensión, el ejercicio aeróbico y el de fuerza bajaron la tensión sistólica de forma parecida a los fármacos más usados (ningún ensayo los comparó cara a cara). Y en un ensayo con personas hipertensas que ya tomaban betabloqueante, doce semanas de ejercicio bajaron su tensión de 24 horas unos 10 mmHg.",
    hacer: "No deje la medicación por hacer ejercicio. Si con los meses la tensión baja, su médico puede ajustar la dosis.", cuid: "tension", pq: "tension", tipo: "Metanálisis en red (391 ensayos) y ensayo aleatorizado", f: ["naci", "westhoff"], aplica: (d) => d.conds.has("hipertension") || d.senales.has("ieca_ara") || d.senales.has("diuretico") },
  { id: "osteoporosis", v: "falso", mito: "Con osteoporosis, nada de pesas ni de impactos.",
    x: "En el ensayo LIFTMOR, 101 mujeres posmenopáusicas con masa ósea baja (65 años de media) hicieron ocho meses de fuerza intensa con impacto, dos veces por semana y 30 minutos, siempre con supervisión. La densidad del hueso de la columna subió un 2,9 %; en el grupo de ejercicio suave en casa bajó un 1,2 %. Solo hubo un incidente, leve (un espasmo lumbar).",
    hacer: "Empiece con supervisión y técnica cuidada. Si ha tenido fracturas vertebrales, pregunte antes qué cargas y qué movimientos le convienen.", cuid: "fuerza_hueso", pq: "fuerza_hueso", tipo: "Ensayo aleatorizado (101 mujeres, 8 meses)", f: ["watson"], aplica: (d) => d.conds.has("osteoporosis") || d.clases.has("bifosfonatos") || d.clases.has("osteoporosis_anabolicos") },
  { id: "antidepresivo", v: "falso", mito: "Si ya tomo un antidepresivo, el ejercicio no me va a aportar nada.",
    x: "Una revisión de 218 ensayos (14 170 personas con depresión) encontró mejorías moderadas con caminar o trotar, con yoga y con ejercicios de fuerza, frente a los cuidados habituales. Los autores proponen el ejercicio como tratamiento principal junto a la psicoterapia y los antidepresivos, no en su lugar. La confianza en estos resultados es baja: casi todos los ensayos tenían riesgo de sesgo.",
    hacer: "Súmelo a su tratamiento. No cambie ni deje el antidepresivo sin hablarlo con su médico.", tipo: "Revisión sistemática y metanálisis en red (218 ensayos)", f: ["noetel"], aplica: (d) => ["isrs_isrsn", "triciclicos", "otros_antidepresivos", "otros_antidepresivos_2"].some((c) => d.clases.has(c)) },
  { id: "benzodiacepina", v: "falso", mito: "La pastilla para dormir o para los nervios no tiene nada que ver con las caídas.",
    x: "Un metanálisis de 248 estudios en personas mayores encontró más caídas en quienes tomaban benzodiacepinas (odds ratio 1,42) y más todavía con las de acción larga (1,81). Son estudios de observación: no pueden descartar que parte se deba a la enfermedad por la que se toman.",
    hacer: "Trabaje el equilibrio y pregunte a su médico si se puede reducir la dosis. No la deje de golpe.", cuid: "equilibrio", pq: "equilibrio", tipo: "Revisión sistemática y metanálisis (248 estudios)", f: ["seppala"], aplica: (d) => d.clases.has("benzodiacepinas") || d.clases.has("hipnoticos_z") },
  { id: "metformina", v: "medias", mito: "La metformina anula el efecto del ejercicio: si entreno, mejor dejarla.",
    x: "En dos ensayos con personas mayores, la metformina redujo parte de la mejora: con 14 semanas de fuerza se ganó menos músculo que con placebo (94 personas sanas de 65 años o más) y con 12 semanas de ejercicio aeróbico mejoraron menos el consumo de oxígeno y la sensibilidad a la insulina (53 personas). En los dos, el ejercicio siguió dando beneficios. Ninguno estudió qué pasa al dejarla en personas con diabetes.",
    hacer: "Si toma metformina por diabetes, no la deje: hable con su médico. Lo que no cambia es que el ejercicio le conviene.", tipo: "Dos ensayos aleatorizados, doble ciego (94 y 53 personas)", f: ["walton", "konopka"], aplica: (d) => d.clases.has("metformina") },
  { id: "fragilidad", v: "falso", mito: "Con mi edad y tantas pastillas, la fuerza ya no es para mí.",
    x: "En un ensayo con 100 personas frágiles de una residencia, de 87 años de media, diez semanas de ejercicios de fuerza progresivos aumentaron la fuerza un 113 % (un 3 % sin ejercicio) y la velocidad al caminar un 11,8 %.",
    hacer: "Empiece con poca carga y suba despacio. La prueba de la silla le da el punto de partida, y el programa de 12 semanas, el camino.", abre: "programa", tipo: "Ensayo aleatorizado (100 personas, 10 semanas)", f: ["fiatarone"], aplica: (d) => (d.edad || 0) >= 75 || d.n >= 5 },
  { id: "dejar", v: "falso", mito: "Si hago ejercicio, puedo dejar las pastillas por mi cuenta.",
    x: "Lo que sí puede pasar es que haga falta menos. En un ensayo con 98 personas con diabetes tipo 2 de menos de diez años de evolución, un programa intensivo de ejercicio (5 o 6 sesiones por semana) y dieta permitió reducir la medicación para la glucosa al 73,5 % de los participantes, frente al 26,4 % con los cuidados habituales. La reducción la hizo el equipo médico, siguiendo los análisis: nadie la dejó por su cuenta.",
    hacer: "Nunca deje ni baje un medicamento por su cuenta. Lleve su diario de ejercicio a la consulta y pregunte a su médico si se puede ajustar.", abre: "preguntas", tipo: "Ensayo aleatorizado (98 personas, 12 meses)", f: ["johansen"], aplica: (d) => d.n >= 1 },
];
export const FUENTES = F;
/** Los mitos que tienen que ver con la lista (ids), en el orden del catálogo. «dejar» no cuenta como propio: vale para cualquiera. */
export const propios = (d) => MITOS.filter((m) => m.id !== "dejar" && m.aplica(d)).map((m) => m.id);
/** Cuántos de cada veredicto. */
export const recuento = () => ({ falso: MITOS.filter((m) => m.v === "falso").length, medias: MITOS.filter((m) => m.v === "medias").length });

const CLAVE = "medex.mitos";
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null"); return { leidos: (Array.isArray(o?.leidos) ? o.leidos : []).filter((id) => MITOS.some((m) => m.id === id)) }; } catch { return { leidos: [] }; } }
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {} };

const CSS = `
.mit-dlg { width: min(760px, calc(100vw - 16px)); }
.mit-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.mit-intro { margin: 0 0 10px; color: var(--muted); }
.mit-cifras { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; margin: 0 0 4px; font-family: var(--mono); font-size: .84rem; font-weight: 700; }
.mit-barra { flex: 1 1 120px; height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.mit-barra i { display: block; height: 100%; border-radius: 999px; background: var(--accent); }
.mit-dlg h3 { margin: 16px 0 8px; font-size: 1rem; }
.mit-lista { display: grid; gap: 8px; }
.mit-m { border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.mit-m[open] { border-color: var(--accent); }
.mit-m summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 12px 14px; cursor: pointer; list-style: none; font-weight: 700; line-height: 1.3; }
.mit-m summary::-webkit-details-marker { display: none; }
.mit-m summary:focus-visible, .mit-dlg button:focus-visible, .mit-dlg a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: var(--r-sm); }
.mit-m summary q { quotes: "\\00ab" "\\00bb"; font-style: normal; }
.mit-m.leido:not([open]) summary q { color: var(--muted); font-weight: 600; }
.mit-v { padding: 3px 10px; border-radius: 999px; font-family: var(--mono); font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; border: 1.5px solid; }
.mit-v.falso { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.mit-v.medias { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.mit-c { padding: 0 14px 14px; }
.mit-c p { margin: 0 0 10px; }
.mit-hacer { padding: 8px 12px; border-left: 4px solid var(--info); border-radius: var(--r-sm); background: var(--info-soft); color: var(--info-ink); }
.mit-hacer b { display: block; font-size: .78rem; letter-spacing: .04em; text-transform: uppercase; }
.mit-meta { display: grid; gap: 4px; margin: 0; font-size: .84rem; color: var(--muted); }
.mit-meta dt { float: left; margin-right: 6px; font-weight: 700; color: var(--fg); } .mit-meta dd { margin: 0; }
.mit-meta a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
.mit-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
.mit-nota { margin: 14px 0 0; font-size: .84rem; color: var(--muted); }
@media (max-width: 520px) { .mit-m summary { grid-template-columns: minmax(0, 1fr); } .mit-v { justify-self: start; } }
@media (forced-colors: active) { .mit-barra i { background: Highlight; } .mit-m[open] { outline: 2px solid Highlight; } }
/* 864-866: el veredicto como sello, la frase del mito con comillas grandes y la barra de leidos con degradado */
.mit-v { rotate: -3deg; border-width: 2px; border-radius: 6px; padding: 3px 9px; box-shadow: inset 0 0 0 2px var(--surface), inset 0 0 0 3px currentColor; font-size: .72rem; letter-spacing: .1em; }
.mit-m summary q { position: relative; display: block; padding-left: 26px; quotes: none; }
.mit-m summary q::before { content: "\\201c"; position: absolute; left: 0; top: -6px; font-family: Georgia, "Times New Roman", serif; font-size: 2.4rem; line-height: 1; color: color-mix(in srgb, var(--accent) 55%, var(--surface)); }
.mit-m summary q::after { content: none; }
.mit-barra { height: 10px; }
.mit-barra i { background: linear-gradient(90deg, var(--accent), var(--info)); transition: width .5s var(--ease-salida, ease-out); }
@media (max-width: 520px) { .mit-v { rotate: -2deg; } }
:root[data-theme="contrast"] .mit-v { rotate: none; box-shadow: none; }
@media (forced-colors: active) { .mit-v { rotate: none; box-shadow: none; } }
`;

let dlg = null, A = null, estado = { leidos: [] }, mios = [];
const cu = () => dlg.querySelector("#mit-cuerpo");
/** Lo que la aplicación sabe de la lista (para poner primero los mitos que le tocan). */
export function contexto(api) {
  const e = api.estado; let items = []; try { items = e.meds.length ? api.res().items : []; } catch {}
  return { clases: new Set(items.map((it) => it.clase?.id).filter(Boolean)), senales: new Set(items.flatMap((it) => [...it.senales])), conds: new Set(e.condiciones || []), edad: e.edad || null, n: items.length };
}
function crear() {
  if (!document.getElementById("mit-css")) { const st = document.createElement("style"); st.id = "mit-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "mitos"; dlg.className = "ficha alta mit-dlg"; dlg.setAttribute("aria-labelledby", "mit-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="mit-cab-t"></p><button type="button" class="btn-sec sm" id="mit-cerrar"></button></div><div class="ficha-cuerpo" id="mit-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#mit-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  dlg.addEventListener("toggle", (ev) => {
    const d = ev.target; if (!d.matches?.("details.mit-m") || !d.open) return;
    if (!estado.leidos.includes(d.dataset.id)) { estado.leidos.push(d.dataset.id); guardar(estado); d.classList.add("leido"); cifras(); }
  }, true);
}
function cifras() {
  const n = estado.leidos.length, e = dlg.querySelector("#mit-leidos"), b = dlg.querySelector(".mit-barra i");
  if (e) e.textContent = tx("leidos", { a: n, b: MITOS.length }); if (b) b.style.width = `${Math.round((n / MITOS.length) * 100)}%`;
}
function tarjeta(m, abierto) {
  const cuid = m.cuid ? t("cuid." + m.cuid) : "";
  return `<details class="mit-m${estado.leidos.includes(m.id) ? " leido" : ""}" data-id="${m.id}" id="mit-${m.id}"${abierto ? " open" : ""}>
    <summary><q>${m.mito}</q><span class="mit-v ${m.v}">${tx("v_" + m.v)}</span></summary>
    <div class="mit-c"><p>${m.x}</p>
      <p class="mit-hacer"><b>${tx("hacer")}</b>${m.hacer}${cuid && cuid !== "cuid." + m.cuid ? " " + cuid : ""}</p>
      <dl class="mit-meta"><div><dt>${tx("estudio")}:</dt><dd>${m.tipo}</dd></div>${m.f.map((k) => `<div><dt>${tx("fuente")}:</dt><dd>${F[k].cita}. <a href="https://doi.org/${F[k].doi}" target="_blank" rel="noopener">doi:${F[k].doi}</a>${F[k].sinResumen ? ` (${tx("sin_resumen")})` : ""}</dd></div>`).join("")}</dl>
      ${m.pq || m.abre ? `<p class="mit-acc">${m.pq ? `<button type="button" class="btn-sec sm" data-porque="${m.pq}">${t("pq.titulo")} ${t("pq.b." + m.pq)}</button>` : ""}${m.abre === "programa" ? `<button type="button" class="btn-sec sm" data-programa="">${t("prg.tile")}</button>` : m.abre ? `<button type="button" class="btn-sec sm" data-abre="${m.abre}">${t("preg.btn")}</button>` : ""}</p>` : ""}
    </div></details>`;
}
function pintar(abierto) {
  dlg.querySelector("#mit-cab-t").textContent = tx("titulo");
  const r = recuento(), a = MITOS.filter((m) => mios.includes(m.id)), b = MITOS.filter((m) => !mios.includes(m.id));
  cu().innerHTML = `<p class="mit-borrador">${tx("borrador")}</p><p class="mit-intro">${tx("intro")}</p>
    <p class="mit-cifras"><span id="mit-resumen">${tx("resumen", { f: r.falso, m: r.medias })}</span><span id="mit-leidos" aria-live="polite"></span><span class="mit-barra" aria-hidden="true"><i></i></span></p>
    ${a.length ? `<h3>${tx("por_su")}</h3><div class="mit-lista" id="mit-mios">${a.map((m) => tarjeta(m, m.id === abierto)).join("")}</div>` : ""}
    <h3>${a.length ? tx("resto") : tx("todos")}</h3><div class="mit-lista" id="mit-resto">${b.map((m) => tarjeta(m, m.id === abierto)).join("")}</div>
    <p class="mit-nota">${tx("nota")}</p>`;
  cifras();
}
/** Abre la ventana. arg = id del mito que se quiere ver abierto (opcional). */
export function abrir(api, arg = null) {
  A = api;
  if (!dlg) crear();
  estado = leer(); mios = propios(contexto(api));
  const abierto = MITOS.some((m) => m.id === arg) ? arg : null;
  if (abierto && !estado.leidos.includes(abierto)) { estado.leidos.push(abierto); guardar(estado); }
  dlg.querySelector("#mit-cerrar").textContent = api.cerrar();
  pintar(abierto);
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  if (abierto) dlg.querySelector("#mit-" + abierto)?.scrollIntoView({ block: "start" });
  dlg.querySelector("#mit-cerrar").focus();
}
