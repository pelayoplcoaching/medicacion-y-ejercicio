/* «Hoy tengo…» (segunda tanda de mejoras grandes, 5). Se carga bajo demanda (data-abre="rato").
   Dos cosas para los días con poco tiempo:
   1. Una sesión a la medida: 5, 10, 20 o 30 minutos de lo que toca hoy, de fuerza, de paseo o de equilibrio. Se arma con los
      ejercicios del plan de la persona (con sus cambios de la biblioteca y las dosis del programa) y se abre como sesión guiada.
   2. Píldoras de movimiento («exercise snacks»): uno o dos minutos, varias veces al día, con contador y cronómetro de un minuto.
   Guarda en el dispositivo la última elección («medex.rato») y las píldoras de cada día («medex.pildoras»: { "AAAA-MM-DD": n }).
   Las cifras de las fuentes están comprobadas en PubMed (22/11/2026). Textos de la interfaz en cinco idiomas; los de cada
   píldora, en español como el resto del contenido de ejercicios. */
import { t, idioma } from "./i18n.js?v=202611222326";

const TXT = {
  es: { titulo: "Hoy tengo…", p_sesion: "Una sesión", p_pildoras: "Píldoras de movimiento", cuanto: "¿Cuánto tiempo tiene?", que: "¿De qué?", min: "{n} min", t_hoy: "Lo de hoy", t_fuerza: "Fuerza", t_paseo: "Paseo", t_equilibrio: "Equilibrio",
    intro: "Poco es mucho mejor que nada. Elija el rato que tiene y la sesión se ajusta sola.", lista: "Su sesión de {n} minutos", empezar: "Empezar ahora", eq_corto: "El equilibrio solo se ofrece en 5 y 10 minutos.", hoy_es: "Hoy toca: {x}", hoy_descanso: "Hoy es día de descanso: le propongo fuerza suave.",
    pil_intro: "Uno o dos minutos de movimiento, varias veces al día. No sustituyen a las sesiones: llenan los huecos.", pil_hoy: "Hoy", pil_de: "{a} de {b}", pil_meta: "Objetivo: {n} al día", hecha: "Hecha", otra: "Otra", crono: "Cronómetro de 1 minuto", parar: "Parar", seg: "{n} s", pil_ok: "Píldora apuntada. Hoy lleva {n}.", pil_fin: "Objetivo de hoy cumplido.", pil_quitar: "Quitar una",
    semana: "Últimos 7 días", cuida: "Con su medicación", porque: "¿Por qué?", fuentes: "Qué se sabe",
    f_rodriguez: "revisión de 11 ensayos (414 personas inactivas): ratos de 5 minutos o menos, al menos dos veces al día, mejoran la forma cardiorrespiratoria (certeza moderada); en mayores, la resistencia muscular (certeza muy baja). No se vio efecto en la fuerza de las piernas, la tensión, la composición corporal ni los lípidos. Se cumplió el 91 % de lo pautado.",
    f_perkin: "estudio piloto con 20 personas mayores: 28 días de píldoras dos veces al día en casa mejoraron un 31 % las veces que se levantaban de la silla en un minuto; el grupo de control no cambió.",
    f_buffey: "revisión de 7 ensayos de un día: interrumpir el tiempo sentado con paseos cortos y suaves baja la glucosa y la insulina de después de comer más que seguir sentado, y más que solo ponerse de pie.",
    nota: "Si un ejercicio le produce dolor, mareo o falta de aire, pare. Con apoyo cerca los de equilibrio." },
  en: { titulo: "Today I have…", p_sesion: "A session", p_pildoras: "Movement snacks", cuanto: "How much time do you have?", que: "Of what?", min: "{n} min", t_hoy: "Today's plan", t_fuerza: "Strength", t_paseo: "Walk", t_equilibrio: "Balance",
    intro: "A little is far better than nothing. Pick the time you have and the session adjusts itself.", lista: "Your {n}-minute session", empezar: "Start now", eq_corto: "Balance is only offered for 5 and 10 minutes.", hoy_es: "Today's plan: {x}", hoy_descanso: "Today is a rest day: here is some gentle strength work.",
    pil_intro: "One or two minutes of movement, several times a day. They do not replace sessions: they fill the gaps.", pil_hoy: "Today", pil_de: "{a} of {b}", pil_meta: "Target: {n} a day", hecha: "Done", otra: "Another", crono: "1-minute timer", parar: "Stop", seg: "{n} s", pil_ok: "Snack logged. {n} today.", pil_fin: "Today's target met.", pil_quitar: "Remove one",
    semana: "Last 7 days", cuida: "With your medication", porque: "Why?", fuentes: "What is known",
    f_rodriguez: "review of 11 trials (414 inactive people): bouts of 5 minutes or less, at least twice a day, improve cardiorespiratory fitness (moderate certainty); in older adults, muscular endurance (very low certainty). No effect was seen on leg strength, blood pressure, body composition or blood lipids. 91% of what was prescribed was completed.",
    f_perkin: "pilot study with 20 older adults: 28 days of twice-daily snacks at home improved one-minute sit-to-stand count by 31%; the control group did not change.",
    f_buffey: "review of 7 one-day trials: breaking up sitting with short, light walks lowers glucose and insulin after meals more than staying seated, and more than just standing up.",
    nota: "If an exercise causes pain, dizziness or shortness of breath, stop. Do the balance ones with support nearby." },
  ca: { titulo: "Avui tinc…", p_sesion: "Una sessió", p_pildoras: "Píndoles de moviment", cuanto: "Quant de temps teniu?", que: "De què?", min: "{n} min", t_hoy: "El d'avui", t_fuerza: "Força", t_paseo: "Passeig", t_equilibrio: "Equilibri",
    intro: "Poc és molt millor que res. Trieu l'estona que teniu i la sessió s'ajusta sola.", lista: "La vostra sessió de {n} minuts", empezar: "Començar ara", eq_corto: "L'equilibri només s'ofereix en 5 i 10 minuts.", hoy_es: "Avui toca: {x}", hoy_descanso: "Avui és dia de descans: us proposo força suau.",
    pil_intro: "Un o dos minuts de moviment, diverses vegades al dia. No substitueixen les sessions: omplen els buits.", pil_hoy: "Avui", pil_de: "{a} de {b}", pil_meta: "Objectiu: {n} al dia", hecha: "Feta", otra: "Una altra", crono: "Cronòmetre d'1 minut", parar: "Parar", seg: "{n} s", pil_ok: "Píndola apuntada. Avui en porteu {n}.", pil_fin: "Objectiu d'avui complert.", pil_quitar: "Treure'n una",
    semana: "Últims 7 dies", cuida: "Amb la vostra medicació", porque: "Per què?", fuentes: "Què se sap",
    f_rodriguez: "revisió d'11 assajos (414 persones inactives): estones de 5 minuts o menys, almenys dues vegades al dia, milloren la forma cardiorespiratòria (certesa moderada); en gent gran, la resistència muscular (certesa molt baixa). No es va veure efecte en la força de les cames, la tensió, la composició corporal ni els lípids. Es va complir el 91 % del que s'havia pautat.",
    f_perkin: "estudi pilot amb 20 persones grans: 28 dies de píndoles dues vegades al dia a casa van millorar un 31 % les vegades que s'aixecaven de la cadira en un minut; el grup de control no va canviar.",
    f_buffey: "revisió de 7 assajos d'un dia: interrompre el temps assegut amb passejos curts i suaus baixa la glucosa i la insulina de després de dinar més que seguir assegut, i més que només posar-se dret.",
    nota: "Si un exercici us fa mal, us mareja o us talla l'alè, pareu. Els d'equilibri, amb un suport a prop." },
  gl: { titulo: "Hoxe teño…", p_sesion: "Unha sesión", p_pildoras: "Pílulas de movemento", cuanto: "Canto tempo ten?", que: "De que?", min: "{n} min", t_hoy: "O de hoxe", t_fuerza: "Forza", t_paseo: "Paseo", t_equilibrio: "Equilibrio",
    intro: "Pouco é moito mellor ca nada. Escolla o anaco que ten e a sesión axústase soa.", lista: "A súa sesión de {n} minutos", empezar: "Comezar agora", eq_corto: "O equilibrio só se ofrece en 5 e 10 minutos.", hoy_es: "Hoxe toca: {x}", hoy_descanso: "Hoxe é día de descanso: propóñolle forza suave.",
    pil_intro: "Un ou dous minutos de movemento, varias veces ao día. Non substitúen as sesións: enchen os ocos.", pil_hoy: "Hoxe", pil_de: "{a} de {b}", pil_meta: "Obxectivo: {n} ao día", hecha: "Feita", otra: "Outra", crono: "Cronómetro de 1 minuto", parar: "Parar", seg: "{n} s", pil_ok: "Pílula apuntada. Hoxe leva {n}.", pil_fin: "Obxectivo de hoxe cumprido.", pil_quitar: "Quitar unha",
    semana: "Últimos 7 días", cuida: "Coa súa medicación", porque: "Por que?", fuentes: "Que se sabe",
    f_rodriguez: "revisión de 11 ensaios (414 persoas inactivas): anacos de 5 minutos ou menos, polo menos dúas veces ao día, melloran a forma cardiorrespiratoria (certeza moderada); en maiores, a resistencia muscular (certeza moi baixa). Non se viu efecto na forza das pernas, a tensión, a composición corporal nin os lípidos. Cumpriuse o 91 % do pautado.",
    f_perkin: "estudo piloto con 20 persoas maiores: 28 días de pílulas dúas veces ao día na casa melloraron un 31 % as veces que se erguían da cadeira nun minuto; o grupo de control non cambiou.",
    f_buffey: "revisión de 7 ensaios dun día: interromper o tempo sentado con paseos curtos e suaves baixa a glicosa e a insulina de despois de comer máis ca seguir sentado, e máis ca só poñerse de pé.",
    nota: "Se un exercicio lle produce dor, mareo ou falta de aire, pare. Os de equilibrio, cun apoio preto." },
  eu: { titulo: "Gaur badut…", p_sesion: "Saio bat", p_pildoras: "Mugimendu-pilulak", cuanto: "Zenbat denbora duzu?", que: "Zertarako?", min: "{n} min", t_hoy: "Gaurkoa", t_fuerza: "Indarra", t_paseo: "Ibilaldia", t_equilibrio: "Oreka",
    intro: "Gutxi ezer baino askoz hobea da. Aukeratu duzun tartea eta saioa bere kabuz egokituko da.", lista: "Zure {n} minutuko saioa", empezar: "Hasi orain", eq_corto: "Oreka 5 eta 10 minututan bakarrik eskaintzen da.", hoy_es: "Gaur: {x}", hoy_descanso: "Gaur atseden-eguna da: indar leuna proposatzen dizut.",
    pil_intro: "Minutu bat edo bi mugitzen, egunean hainbat aldiz. Ez dituzte saioak ordezkatzen: hutsuneak betetzen dituzte.", pil_hoy: "Gaur", pil_de: "{b}tik {a}", pil_meta: "Helburua: egunean {n}", hecha: "Eginda", otra: "Beste bat", crono: "Minutu 1eko kronometroa", parar: "Gelditu", seg: "{n} s", pil_ok: "Pilula idatzita. Gaur {n} daramatzazu.", pil_fin: "Gaurko helburua beteta.", pil_quitar: "Kendu bat",
    semana: "Azken 7 egunak", cuida: "Zure botikekin", porque: "Zergatik?", fuentes: "Zer dakigun",
    f_rodriguez: "11 saiakuntzaren berrikuspena (414 pertsona inaktibo): 5 minutu edo gutxiagoko tarteek, egunean gutxienez bi aldiz, sasoi kardiorrespiratorioa hobetzen dute (ziurtasun moderatua); adinekoetan, erresistentzia muskularra (ziurtasun oso baxua). Ez zen eraginik ikusi hanken indarrean, tentsioan, gorputz-konposizioan edo lipidoetan. Agindutakoaren % 91 bete zen.",
    f_perkin: "20 adinekorekin egindako ikerketa pilotua: 28 egunez etxean egunean bi aldiz egindako pilulek % 31 hobetu zuten minutu batean aulkitik altxatzeko aldi kopurua; kontrol-taldea ez zen aldatu.",
    f_buffey: "egun bateko 7 saiakuntzaren berrikuspena: eserita egoteko denbora ibilaldi labur eta leunekin eteteak bazkalosteko glukosa eta intsulina gehiago jaisten ditu eserita jarraitzeak baino, eta zutik jartzeak soilik baino gehiago.",
    nota: "Ariketa batek mina, zorabioa edo arnasestua ematen badizu, gelditu. Orekakoak, euskarri bat hurbil duzula." },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

export const FUENTES = [
  { id: "rodriguez", cita: "Rodríguez MÁ et al. Br J Sports Med 2026;60:133-41", doi: "10.1136/bjsports-2025-110027" },
  { id: "perkin", cita: "Perkin OJ et al. J Aging Res 2019;2019:7516939", doi: "10.1155/2019/7516939" },
  { id: "buffey", cita: "Buffey AJ et al. Sports Med 2022;52:1765-87", doi: "10.1007/s40279-022-01649-4" },
];
export const TIEMPOS = [5, 10, 20, 30];
export const META_PILDORAS = 3;
/* Píldoras: id = dibujo; s = variante sentada o con apoyo para quien la necesita (frágil). */
export const PILDORAS = [
  { id: "silla", n: "Levántese de la silla 10 veces", d: "Seguidas y a su ritmo; sin manos si puede.", c: "Al acabar un capítulo o en los anuncios." },
  { id: "marcha", s: "marcha_sentado", n: "Un minuto de marcha en el sitio", d: "Levantando las rodillas y moviendo los brazos; sentado si lo prefiere.", c: "Cada vez que lleve media hora sentado." },
  { id: "pared", n: "10 flexiones en la pared o en la encimera", d: "Cuerpo recto, baje el pecho hacia el apoyo y empuje.", c: "Mientras se calienta el café." },
  { id: "talones", s: "talones_sentado", n: "15 elevaciones de talones", d: "Agarrado a la encimera, suba despacio y baje en dos segundos.", c: "Mientras espera el microondas." },
  { id: "unpie", s: "tandem", n: "Medio minuto sobre cada pie", d: "Con una mano rozando el lavabo o la encimera.", c: "Al lavarse los dientes." },
  { id: "marcha", n: "Dos minutos caminando después de comer", d: "Por el pasillo o hasta el portal, a paso tranquilo.", c: "Nada más levantarse de la mesa." },
  { id: "escalon", fuerte: true, n: "Suba y baje un tramo de escaleras", d: "A su paso y con la barandilla a mano.", c: "En lugar del ascensor, una vez al día." },
  { id: "sentadilla_pared", fuerte: true, n: "20 segundos sentado contra la pared", d: "Espalda en la pared, baje hasta donde esté cómodo y respire todo el rato.", c: "Mientras hierve el agua." },
  { id: "agarre", n: "Apriete una toalla 10 veces con cada mano", d: "Fuerte, 3 segundos, y suelte; el hombro relajado.", c: "Viendo la televisión." },
  { id: "estirar", n: "Estírese hacia el techo 5 veces", d: "Suba los brazos cogiendo aire y bájelos soltándolo.", c: "Tras un rato largo sentado." },
];
/** Píldoras adecuadas: con fragilidad se quitan las exigentes y se usa la variante sentada o con apoyo. */
export const pildorasPara = (fragil) => PILDORAS.filter((p) => !(fragil && p.fuerte)).map((p) => (fragil && p.s ? { ...p, id: p.s } : p));

/* --- contador de píldoras --- */
const K_PIL = "medex.pildoras", K_RATO = "medex.rato";
export function leerPildoras() { try { const o = JSON.parse(localStorage.getItem(K_PIL) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch { return {}; } }
/** Suma (o resta) una píldora al día indicado y conserva solo los últimos 90 días. Devuelve el registro nuevo. */
export function sumarPildora(reg, dia, n = 1) {
  const o = { ...reg, [dia]: Math.max(0, (reg[dia] || 0) + n) }; if (!o[dia]) delete o[dia];
  return Object.fromEntries(Object.entries(o).filter(([k]) => /^\d{4}-\d\d-\d\d$/.test(k)).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 90));
}
const guardarPildoras = (o) => { try { localStorage.setItem(K_PIL, JSON.stringify(o)); } catch {} };
/** Los últimos 7 días (el último es hoy) con su número de píldoras. */
export function ultimos7(reg, hoy = new Date()) { return [...Array(7)].map((_, i) => { const d = new Date(hoy); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return { dia: k, fecha: d, n: reg[k] || 0 }; }); }

/* --- sesión a la medida --- */
const RE_DOSIS = /(\d)(?:–\d)? (series de|×) /;
const conSeries = (detalle, ser) => String(detalle).replace(RE_DOSIS, (_, a, b) => `${ser} ${b === "series de" && ser === 1 ? "serie de" : b} `);
const reparto = (total, n, minimo = 1) => { const base = Math.max(minimo, Math.floor(total / n)); let resto = Math.max(0, total - base * n); return [...Array(n)].map(() => base + (resto-- > 0 ? 1 : 0)); };
/** Arma una sesión de `min` minutos a partir de una sesión del plan.
    base: sesión de paseo (aerobico), de fuerza (fuerza o fuerza_eq) o de equilibrio. Devuelve { tipo, titulo, min, bloques, corta }. */
export function armar(base, min) {
  if (!base) return null;
  const T = TIEMPOS.includes(min) ? min : 10, B = base.bloques;
  const calienta = T <= 5 ? 1 : T <= 10 ? 2 : T <= 20 ? 3 : 5;
  let bloques;
  if (base.tipo === "aerobico") {
    const fin = T <= 5 ? 1 : calienta;
    bloques = [{ ...B[0], min: calienta }, { ...B[1], min: T - calienta - fin }, { ...B.at(-1), min: fin }];
  } else if (base.tipo === "equilibrio") {
    const ej = B.slice(0, T <= 5 ? 2 : 4), mins = reparto(T - (T <= 5 ? 0 : 2), ej.length, 2);
    bloques = [...(T <= 5 ? [] : [{ nombre: "Calentamiento", detalle: "Marcha suave en el sitio y movilidad de tobillos", min: 2, pict: "marcha" }]), ...ej.map((b, i) => ({ ...b, min: mins[i] }))];
  } else {
    // fuerza: los ejercicios por series, en el orden del plan (piernas, empuje, tracción…); el bloque de equilibrio va al final si cabe
    const porSeries = B.filter((b) => b.clave && !/^Equilibrio/.test(b.nombre)), eq = B.find((b) => /^Equilibrio/.test(b.nombre));
    const n = Math.min(porSeries.length, T <= 5 ? 2 : T <= 10 ? 3 : T <= 20 ? 5 : porSeries.length), conEq = !!eq && T >= 20, minEq = conEq ? (T >= 30 ? 4 : 3) : 0;
    const mins = reparto(T - calienta - minEq, n, 2), ser = T <= 10 ? 1 : T <= 20 ? 2 : null;
    bloques = [{ ...B[0], min: calienta }, ...porSeries.slice(0, n).map((b, i) => ({ ...b, min: mins[i], detalle: ser ? conSeries(b.detalle, ser) : b.detalle })), ...(conEq ? [{ ...eq, nombre: "Apoyo sobre un pie", min: minEq }] : [])]; // con su nombre de ejercicio, para que abra su ficha
  }
  return { tipo: base.tipo, titulo: base.titulo, min: bloques.reduce((s, b) => s + b.min, 0), bloques, corta: true };
}
/** Qué sesión del plan sirve de base. tipo: "hoy" | "fuerza" | "paseo" | "equilibrio"; tipoHoy: lo que marca el plan para hoy. */
export function tipoBase(tipo, tipoHoy) {
  if (tipo === "paseo") return "aerobico";
  if (tipo === "equilibrio") return "equilibrio";
  if (tipo === "fuerza") return "fuerza";
  return ["aerobico", "fuerza", "fuerza_eq"].includes(tipoHoy) ? tipoHoy : "fuerza";
}

const CSS = `
.rt-dlg { width: min(720px, calc(100vw - 16px)); }
.rt-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0 0 12px; padding: 4px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line); }
.rt-tabs button { padding: 8px 10px; min-height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--muted); font: inherit; font-weight: 700; cursor: pointer; }
.rt-tabs button[aria-selected="true"] { background: var(--accent); color: var(--surface); }
.rt-tabs button:focus-visible, .rt-chips button:focus-visible, .rt-pil-acc button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.rt-intro { margin: 0 0 12px; color: var(--muted); }
.rt-dlg h3 { margin: 14px 0 8px; font-size: 1rem; }
.rt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.rt-chips button { padding: 8px 16px; min-height: 44px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--fg); font: inherit; font-weight: 700; cursor: pointer; }
.rt-chips.grandes button { min-width: 74px; font-family: var(--mono); font-size: 1.05rem; }
.rt-chips button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.rt-chips button:disabled { opacity: .45; cursor: not-allowed; }
.rt-sub { margin: 6px 0 0; font-size: .84rem; color: var(--muted); }
.rt-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.rt-lista li { display: grid; grid-template-columns: 44px 48px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.rt-lista .rt-m { font-family: var(--mono); font-weight: 700; color: var(--accent-deep, var(--accent)); text-align: center; }
.rt-lista b { display: block; font-size: .95rem; line-height: 1.25; }
.rt-lista small { color: var(--muted); font-size: .82rem; line-height: 1.3; }
.rt-acc { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 14px 0 0; }
.rt-hoy { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; margin: 0 0 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 70%); }
.rt-hoy b { font-family: var(--mono); font-size: 1.6rem; line-height: 1; color: var(--accent-deep, var(--accent)); }
.rt-puntos { display: inline-flex; gap: 6px; }
.rt-puntos i { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--accent); }
.rt-puntos i.on { background: var(--accent); }
.rt-hoy small { color: var(--muted); }
.rt-pil { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 6px 14px; align-items: center; padding: 14px; border: 1.5px solid var(--accent); border-radius: var(--r-md); background: var(--surface); }
.rt-pil .picto { grid-row: span 3; width: 96px; height: 96px; flex-basis: 96px; }
.rt-pil b { font-size: 1.1rem; line-height: 1.25; }
.rt-pil p { margin: 0; font-size: .92rem; }
.rt-pil .rt-cuando { color: var(--muted); font-size: .84rem; font-style: italic; }
.rt-pil-acc { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 10px 0 0; }
.rt-crono { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-weight: 700; }
.rt-crono .anillo-crono { width: 40px; height: 40px; }
.rt-cuida { margin: 10px 0 0; padding: 8px 12px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .88rem; }
.rt-cuida b { margin-right: 6px; }
.rt-sem { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin: 0; padding: 0; list-style: none; }
.rt-sem li { display: grid; gap: 2px; justify-items: center; padding: 6px 2px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .72rem; color: var(--muted); }
.rt-sem li b { font-family: var(--mono); font-size: 1rem; color: var(--fg); }
.rt-sem li.cumple { background: var(--accent-soft); } .rt-sem li.cumple b { color: var(--accent-deep, var(--accent)); }
.rt-sem li.hoy-d { box-shadow: inset 0 0 0 2px var(--accent); }
.rt-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.rt-fuentes a { color: var(--accent-deep, var(--accent)); }
.rt-nota { margin: 12px 0 0; font-size: .82rem; color: var(--muted); }
:root[data-theme="contrast"] .rt-hoy { background: var(--surface); }
@media (max-width: 520px) { .rt-pil { grid-template-columns: 72px minmax(0, 1fr); } .rt-pil .picto { width: 72px; height: 72px; } .rt-lista li { grid-template-columns: 38px 44px minmax(0, 1fr); } }
@media (forced-colors: active) { .rt-puntos i.on { background: Highlight; } .rt-chips button[aria-pressed="true"], .rt-tabs button[aria-selected="true"] { border: 3px solid Highlight; } }
`;

let dlg = null, A = null, MOV = null, vista = "sesion", sel = { min: 10, tipo: "hoy" }, iPil = 0, crono = null;
const cu = () => dlg.querySelector("#rt-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pararCrono = () => { if (crono) { clearInterval(crono.id); crono = null; } };
function crear() {
  if (!document.getElementById("rt-css")) { const st = document.createElement("style"); st.id = "rt-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "rato"; dlg.className = "ficha alta rt-dlg"; dlg.setAttribute("aria-labelledby", "rt-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="rt-cab-t"></p><button type="button" class="btn-sec sm" id="rt-cerrar"></button></div><div class="ficha-cuerpo" id="rt-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#rt-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", pararCrono);
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-rt]"); if (!b || b.disabled) return;
    const a = b.dataset.rt, v = b.dataset.v;
    if (a === "vista") { pararCrono(); vista = v; pintar(); dlg.querySelector(`[data-rt="vista"][data-v="${v}"]`)?.focus(); }
    else if (a === "min") { sel.min = Number(v); if (sel.tipo === "equilibrio" && sel.min > 10) sel.tipo = "hoy"; recordar(); pintar(); dlg.querySelector(`[data-rt="min"][data-v="${v}"]`)?.focus(); }
    else if (a === "tipo") { sel.tipo = v; recordar(); pintar(); dlg.querySelector(`[data-rt="tipo"][data-v="${v}"]`)?.focus(); }
    else if (a === "empezar") { const s = sesionElegida(); if (s) { dlg.close(); A.abrirSesion(s.tipo, A.hoyISO(), { sesion: s }); } }
    else if (a === "otra") { pararCrono(); iPil = (iPil + 1) % pildoras().length; pintar(); dlg.querySelector('[data-rt="hecha"]')?.focus(); }
    else if (a === "hecha") { pararCrono(); apuntar(1); }
    else if (a === "quitar") { apuntar(-1); }
    else if (a === "crono") { crono ? (pararCrono(), pintar()) : empezarCrono(); }
  });
}
const recordar = () => { try { localStorage.setItem(K_RATO, JSON.stringify(sel)); } catch {} };
const pildoras = () => pildorasPara(A.esFragil());
function apuntar(n) {
  const reg = sumarPildora(leerPildoras(), A.hoyISO(), n); guardarPildoras(reg);
  const hoy = reg[A.hoyISO()] || 0;
  if (n > 0) { A.vibrar?.(30); A.toast(hoy === META_PILDORAS ? `<span class="celebra">✓</span> ${tx("pil_fin")}` : tx("pil_ok", { n: hoy }), { ms: 3500 }); iPil = (iPil + 1) % pildoras().length; }
  pintar();
}
function empezarCrono() {
  crono = { fin: Date.now() + 60000, id: setInterval(() => {
    const q = Math.max(0, Math.ceil((crono.fin - Date.now()) / 1000)), el = dlg.querySelector(".rt-crono");
    if (el) el.innerHTML = `${A.anilloCrono(1 - q / 60)}<span>${tx("seg", { n: q })}</span>`;
    if (q <= 0) { pararCrono(); A.vibrar?.(200); apuntar(1); }
  }, 250) };
  pintar();
}
function sesionElegida() {
  const f = A.esFragil(), tb = tipoBase(sel.tipo, A.planDeHoy().tipo);
  return armar(A.sesionDe(tb, { fragil: f, minutosAer: f ? 10 : 30 }), sel.min);
}
function vistaSesion() {
  const hoy = A.planDeHoy(), s = sesionElegida();
  const chip = (k, v, txt, extra = "") => `<button type="button" data-rt="${k}" data-v="${v}" aria-pressed="${String(sel[k] === v)}"${extra}>${txt}</button>`;
  return `<p class="rt-intro">${tx("intro")}</p>
    <h3 id="rt-l-min">${tx("cuanto")}</h3><div class="rt-chips grandes" role="group" aria-labelledby="rt-l-min">${TIEMPOS.map((m) => chip("min", m, tx("min", { n: m }))).join("")}</div>
    <h3 id="rt-l-tipo">${tx("que")}</h3><div class="rt-chips" role="group" aria-labelledby="rt-l-tipo">${["hoy", "fuerza", "paseo", "equilibrio"].map((k) => chip("tipo", k, tx("t_" + k), k === "equilibrio" && sel.min > 10 ? " disabled" : "")).join("")}</div>
    <p class="rt-sub">${sel.tipo === "hoy" ? (hoy.tipo === "descanso" ? tx("hoy_descanso") : tx("hoy_es", { x: esc(hoy.etiqueta || "") })) : sel.min > 10 ? tx("eq_corto") : ""}</p>
    <h3>${tx("lista", { n: s.min })}</h3>
    <ol class="rt-lista" id="rt-lista">${s.bloques.map((b) => `<li><span class="rt-m">${b.min}′</span>${A.dibujo(b.pict)}<span><b>${esc(b.nombre)}</b><small>${esc(b.detalle)}</small></span></li>`).join("")}</ol>
    <div class="rt-acc"><button type="button" class="btn" data-rt="empezar">${tx("empezar")}</button></div>
    <p class="rt-nota">${tx("nota")}</p>`;
}
function vistaPildoras() {
  const reg = leerPildoras(), hoy = reg[A.hoyISO()] || 0, L = pildoras(), p = L[iPil % L.length];
  const presentes = (() => { try { return A.porquesDe(A.res().items.flatMap((it) => [...it.senales])); } catch { return []; } })();
  const cuid = MOV?.cuidados ? MOV.cuidados(p.id, presentes)[0] : null;
  return `<p class="rt-intro">${tx("pil_intro")}</p>
    <div class="rt-hoy" aria-live="polite"><span><small>${tx("pil_hoy")}</small><br><b id="rt-n">${hoy}</b></span><span class="rt-puntos" aria-hidden="true">${[...Array(Math.max(META_PILDORAS, Math.min(hoy, 8)))].map((_, i) => `<i class="${i < hoy ? "on" : ""}"></i>`).join("")}</span><small>${tx("pil_meta", { n: META_PILDORAS })}</small>${hoy ? `<button type="button" class="btn-sec sm" data-rt="quitar">${tx("pil_quitar")}</button>` : ""}</div>
    <div class="rt-pil">${A.dibujo(p.id)}<b id="rt-pil-n">${esc(p.n)}</b><p>${esc(p.d)}</p><p class="rt-cuando">${esc(p.c)}</p></div>
    ${cuid ? `<p class="rt-cuida"><b>${tx("cuida")}:</b>${t("cuid." + cuid)} <button type="button" class="pq-mini" data-porque="${cuid}">${tx("porque")}</button></p>` : ""}
    <div class="rt-pil-acc"><button type="button" class="btn" data-rt="hecha">${tx("hecha")}</button><button type="button" class="btn-sec" data-rt="otra">${tx("otra")}</button><button type="button" class="btn-sec" data-rt="crono">${crono ? tx("parar") : tx("crono")}</button><span class="rt-crono" aria-hidden="true">${crono ? `${A.anilloCrono(0)}<span>${tx("seg", { n: 60 })}</span>` : ""}</span></div>
    <h3>${tx("semana")}</h3><ol class="rt-sem">${ultimos7(reg).map((d, i) => `<li class="${[d.n >= META_PILDORAS ? "cumple" : "", i === 6 ? "hoy-d" : ""].filter(Boolean).join(" ")}"><span>${d.fecha.toLocaleDateString(idioma(), { weekday: "short" }).replace(".", "")}</span><b>${d.n}</b></li>`).join("")}</ol>
    <h3>${tx("fuentes")}</h3><ul class="rt-fuentes">${FUENTES.map((f) => `<li>${f.cita}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>: ${tx("f_" + f.id)}</li>`).join("")}</ul>
    <p class="rt-nota">${tx("nota")}</p>`;
}
function pintar() {
  dlg.querySelector("#rt-cab-t").textContent = tx("titulo");
  cu().innerHTML = `<div class="rt-tabs" role="tablist"><button type="button" role="tab" data-rt="vista" data-v="sesion" aria-selected="${vista === "sesion"}">${tx("p_sesion")}</button><button type="button" role="tab" data-rt="vista" data-v="pildoras" aria-selected="${vista === "pildoras"}">${tx("p_pildoras")}</button></div>
    <div role="tabpanel">${vista === "pildoras" ? vistaPildoras() : vistaSesion()}</div>`;
}
/** Abre la ventana. arg = "pildoras" la abre en las píldoras; "paseo5" y "fuerza10" la abren con ese tiempo y ese tipo ya elegidos (los primeros 14 días). */
export async function abrir(api, arg = null) {
  A = api;
  try { await api.cargarBiblio(); MOV = await api.cargarMov(); } catch {} // dibujos de la biblioteca y cuidados por ejercicio
  if (!dlg) crear();
  sel = { min: 10, tipo: "hoy" };
  try { const o = JSON.parse(localStorage.getItem(K_RATO) || "null"); if (o && TIEMPOS.includes(o.min) && ["hoy", "fuerza", "paseo", "equilibrio"].includes(o.tipo)) sel = { min: o.min, tipo: o.tipo }; } catch {}
  if (sel.tipo === "equilibrio" && sel.min > 10) sel.tipo = "hoy";
  const pre = { paseo5: { min: 5, tipo: "paseo" }, fuerza10: { min: 10, tipo: "fuerza" } }[arg]; if (pre) sel = pre;
  vista = arg === "pildoras" ? "pildoras" : "sesion"; pararCrono();
  iPil = (leerPildoras()[api.hoyISO()] || 0) % pildoras().length;
  dlg.querySelector("#rt-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#rt-cerrar").focus();
}
