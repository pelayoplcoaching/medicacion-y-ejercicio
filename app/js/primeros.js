/* Los primeros 14 días (segunda tanda de mejoras grandes, 13). Se carga bajo demanda (data-abre="primeros").
   Arranque guiado: un paso pequeño cada día, cada uno con su botón que lleva a la herramienta que toca. Nueve de los catorce
   se marcan solos al hacerlos (medicación puesta, cribado respondido, primera sesión en el diario, metas, prueba de la
   silla, sesión de fuerza, píldoras, lección, programa); todos se pueden marcar a mano. No caducan: se adelantan o se atrasan.
   Estado en localStorage («medex.primeros»): { inicio (ISO), hechos: { id: ISO }, fin (ISO) | null }.
   No contiene contenido clínico: solo ordena lo que la aplicación ya ofrece. Textos en cinco idiomas. */
import { idioma } from "./i18n.js?v=202611230120";

const TXT = {
  es: { titulo: "Los primeros 14 días", intro: "Un paso pequeño cada día, sin prisa. En dos semanas tendrá su medicación revisada, un plan a su medida y las primeras sesiones hechas.", empezar: "Empezar hoy", dia: "Día {n}", de: "{a} de 14", hoy: "El paso de hoy", hecho: "Hecho", marcar: "Marcar como hecho", desmarcar: "Desmarcar", solo: "Se marca solo al hacerlo.", todos: "Los 14 pasos",
    adelantado: "Va al día. Puede descansar o adelantar el siguiente.", sin_prisa: "Los pasos no caducan: si un día no puede, siga al siguiente.", fin_tit: "Catorce de catorce", fin_x: "Ya tiene la base puesta. Lo que queda es seguir, poco a poco: el programa de 12 semanas le acompaña desde aquí.", terminar: "Dar por terminado", terminado: "Arranque terminado. Lo tiene siempre en «Más».", reiniciar: "Empezar de nuevo", empezado: "Empezamos. Hoy, el primer paso.",
    t_meds: "Ponga su medicación", x_meds: "Con el nombre, una foto de la caja o la hoja de la receta. Todo lo demás sale de aquí.", b_meds: "Añadir medicación",
    t_cribado: "Responda a tres preguntas de seguridad", x_cribado: "Para saber si conviene una valoración médica antes de empezar.", b_cribado: "Ir a las preguntas",
    t_informe: "Lea lo esencial de su informe", x_informe: "Los puntos que más importan con su medicación, en un minuto.", b_informe: "Ver mi informe",
    t_paseo: "Un paseo de 5 minutos", x_paseo: "Corto a propósito: hoy solo se trata de empezar.", b_paseo: "Preparar el paseo",
    t_metas: "Elija para qué quiere estar en forma", x_metas: "Subir escaleras, llevar la compra, jugar con los nietos… El plan señalará lo que le acerca.", b_metas: "Elegir mis metas",
    t_ejercicio: "Aprenda un ejercicio: levantarse de la silla", x_ejercicio: "El más útil de todos. Mire el dibujo y pruébelo cinco veces.", b_ejercicio: "Ver el ejercicio",
    t_silla: "Haga la prueba de la silla", x_silla: "Treinta segundos que dicen cómo están sus piernas. Será su punto de partida.", b_silla: "Ir a las pruebas",
    t_fuerza: "Su primera sesión de fuerza, de 10 minutos", x_fuerza: "Tres ejercicios y una serie de cada uno, guiada y con cronómetro.", b_fuerza: "Preparar la sesión",
    t_cuando: "Mire a qué hora le conviene entrenar", x_cuando: "Según cuándo toma cada medicamento, hay horas mejores y peores.", b_cuando: "Ver «¿Cuándo?»",
    t_porque: "Entienda un porqué", x_porque: "Una explicación animada de un minuto sobre algo de su medicación.", b_porque: "Ver una explicación",
    t_pildoras: "Tres píldoras de movimiento en un día", x_pildoras: "Uno o dos minutos cada vez, repartidos por el día.", b_pildoras: "Ver las píldoras",
    t_leccion: "Una lección de dos minutos", x_leccion: "Las dudas más frecuentes sobre medicación y ejercicio, en corto.", b_leccion: "Abrir «Aprende»",
    t_dias: "Elija sus días de la semana", x_dias: "El plan se reparte solo entre los días que marque.", b_dias: "Ir a Mi plan",
    t_programa: "Empiece el programa de 12 semanas", x_programa: "A partir de aquí, el programa sube solo, a su ritmo.", b_programa: "Ver el programa",
  },
  en: { titulo: "The first 14 days", intro: "One small step a day, no rush. In two weeks you will have your medication reviewed, a plan that fits you and your first sessions done.", empezar: "Start today", dia: "Day {n}", de: "{a} of 14", hoy: "Today's step", hecho: "Done", marcar: "Mark as done", desmarcar: "Unmark", solo: "It ticks itself when you do it.", todos: "The 14 steps",
    adelantado: "You are up to date. Rest, or get ahead with the next one.", sin_prisa: "Steps do not expire: if you miss a day, carry on with the next.", fin_tit: "Fourteen out of fourteen", fin_x: "The foundation is laid. What is left is to keep going, little by little: the 12-week programme takes it from here.", terminar: "Finish", terminado: "Start-up finished. You can always find it under “More”.", reiniciar: "Start over", empezado: "Off we go. Today, the first step.",
    t_meds: "Enter your medication", x_meds: "By name, a photo of the box or your prescription sheet. Everything else comes from here.", b_meds: "Add medication",
    t_cribado: "Answer three safety questions", x_cribado: "To know whether to see a doctor before starting.", b_cribado: "Go to the questions",
    t_informe: "Read the essentials of your report", x_informe: "The points that matter most with your medication, in a minute.", b_informe: "See my report",
    t_paseo: "A 5-minute walk", x_paseo: "Short on purpose: today is only about starting.", b_paseo: "Set up the walk",
    t_metas: "Choose what you want to be fit for", x_metas: "Climbing stairs, carrying the shopping, playing with the grandchildren… The plan will flag what gets you closer.", b_metas: "Choose my goals",
    t_ejercicio: "Learn one exercise: the sit-to-stand", x_ejercicio: "The most useful of all. Look at the drawing and try it five times.", b_ejercicio: "See the exercise",
    t_silla: "Do the chair test", x_silla: "Thirty seconds that tell how your legs are doing. It will be your starting point.", b_silla: "Go to the tests",
    t_fuerza: "Your first strength session, 10 minutes", x_fuerza: "Three exercises, one set of each, guided and timed.", b_fuerza: "Set up the session",
    t_cuando: "See what time suits you best", x_cuando: "Depending on when you take each medicine, some hours are better than others.", b_cuando: "See “When?”",
    t_porque: "Understand one “why”", x_porque: "A one-minute animated explanation about something in your medication.", b_porque: "See an explanation",
    t_pildoras: "Three movement snacks in one day", x_pildoras: "One or two minutes each, spread through the day.", b_pildoras: "See the snacks",
    t_leccion: "A two-minute lesson", x_leccion: "The most common questions about medication and exercise, in brief.", b_leccion: "Open “Learn”",
    t_dias: "Choose your days of the week", x_dias: "The plan spreads itself over the days you tick.", b_dias: "Go to My plan",
    t_programa: "Start the 12-week programme", x_programa: "From here on, the programme steps up by itself, at your pace.", b_programa: "See the programme",
  },
  ca: { titulo: "Els primers 14 dies", intro: "Un pas petit cada dia, sense pressa. En dues setmanes tindreu la medicació revisada, un pla a mida i les primeres sessions fetes.", empezar: "Començar avui", dia: "Dia {n}", de: "{a} de 14", hoy: "El pas d'avui", hecho: "Fet", marcar: "Marcar com a fet", desmarcar: "Desmarcar", solo: "Es marca sol en fer-lo.", todos: "Els 14 passos",
    adelantado: "Aneu al dia. Podeu descansar o avançar el següent.", sin_prisa: "Els passos no caduquen: si un dia no podeu, seguiu amb el següent.", fin_tit: "Catorze de catorze", fin_x: "Ja teniu la base posada. El que queda és continuar, a poc a poc: el programa de 12 setmanes us acompanya des d'aquí.", terminar: "Donar per acabat", terminado: "Arrencada acabada. La teniu sempre a «Més».", reiniciar: "Començar de nou", empezado: "Comencem. Avui, el primer pas.",
    t_meds: "Poseu la vostra medicació", x_meds: "Amb el nom, una foto de la capsa o el full de la recepta. Tota la resta surt d'aquí.", b_meds: "Afegir medicació",
    t_cribado: "Responeu tres preguntes de seguretat", x_cribado: "Per saber si convé una valoració mèdica abans de començar.", b_cribado: "Anar a les preguntes",
    t_informe: "Llegiu l'essencial del vostre informe", x_informe: "Els punts que més importen amb la vostra medicació, en un minut.", b_informe: "Veure el meu informe",
    t_paseo: "Un passeig de 5 minuts", x_paseo: "Curt expressament: avui només es tracta de començar.", b_paseo: "Preparar el passeig",
    t_metas: "Trieu per a què voleu estar en forma", x_metas: "Pujar escales, portar la compra, jugar amb els nets… El pla assenyalarà el que us hi acosta.", b_metas: "Triar les meves metes",
    t_ejercicio: "Apreneu un exercici: aixecar-se de la cadira", x_ejercicio: "El més útil de tots. Mireu el dibuix i proveu-lo cinc vegades.", b_ejercicio: "Veure l'exercici",
    t_silla: "Feu la prova de la cadira", x_silla: "Trenta segons que diuen com tenen les cames. Serà el vostre punt de partida.", b_silla: "Anar a les proves",
    t_fuerza: "La vostra primera sessió de força, de 10 minuts", x_fuerza: "Tres exercicis i una sèrie de cadascun, guiada i amb cronòmetre.", b_fuerza: "Preparar la sessió",
    t_cuando: "Mireu a quina hora us convé entrenar", x_cuando: "Segons quan preneu cada medicament, hi ha hores millors i pitjors.", b_cuando: "Veure «Quan?»",
    t_porque: "Enteneu un perquè", x_porque: "Una explicació animada d'un minut sobre alguna cosa de la vostra medicació.", b_porque: "Veure una explicació",
    t_pildoras: "Tres píndoles de moviment en un dia", x_pildoras: "Un o dos minuts cada vegada, repartits pel dia.", b_pildoras: "Veure les píndoles",
    t_leccion: "Una lliçó de dos minuts", x_leccion: "Els dubtes més freqüents sobre medicació i exercici, en curt.", b_leccion: "Obrir «Aprèn»",
    t_dias: "Trieu els vostres dies de la setmana", x_dias: "El pla es reparteix sol entre els dies que marqueu.", b_dias: "Anar al meu pla",
    t_programa: "Comenceu el programa de 12 setmanes", x_programa: "A partir d'aquí, el programa puja sol, al vostre ritme.", b_programa: "Veure el programa",
  },
  gl: { titulo: "Os primeiros 14 días", intro: "Un paso pequeno cada día, sen présa. En dúas semanas terá a súa medicación revisada, un plan á súa medida e as primeiras sesións feitas.", empezar: "Comezar hoxe", dia: "Día {n}", de: "{a} de 14", hoy: "O paso de hoxe", hecho: "Feito", marcar: "Marcar como feito", desmarcar: "Desmarcar", solo: "Márcase só ao facelo.", todos: "Os 14 pasos",
    adelantado: "Vai ao día. Pode descansar ou adiantar o seguinte.", sin_prisa: "Os pasos non caducan: se un día non pode, siga co seguinte.", fin_tit: "Catorce de catorce", fin_x: "Xa ten a base posta. O que queda é seguir, pouco a pouco: o programa de 12 semanas acompáñao desde aquí.", terminar: "Dar por rematado", terminado: "Arranque rematado. Teno sempre en «Máis».", reiniciar: "Comezar de novo", empezado: "Comezamos. Hoxe, o primeiro paso.",
    t_meds: "Poña a súa medicación", x_meds: "Co nome, unha foto da caixa ou a folla da receita. Todo o demais sae de aquí.", b_meds: "Engadir medicación",
    t_cribado: "Responda tres preguntas de seguridade", x_cribado: "Para saber se convén unha valoración médica antes de comezar.", b_cribado: "Ir ás preguntas",
    t_informe: "Lea o esencial do seu informe", x_informe: "Os puntos que máis importan coa súa medicación, nun minuto.", b_informe: "Ver o meu informe",
    t_paseo: "Un paseo de 5 minutos", x_paseo: "Curto adrede: hoxe só se trata de comezar.", b_paseo: "Preparar o paseo",
    t_metas: "Escolla para que quere estar en forma", x_metas: "Subir escaleiras, levar a compra, xogar cos netos… O plan sinalará o que o achega.", b_metas: "Escoller as miñas metas",
    t_ejercicio: "Aprenda un exercicio: erguerse da cadeira", x_ejercicio: "O máis útil de todos. Mire o debuxo e próbeo cinco veces.", b_ejercicio: "Ver o exercicio",
    t_silla: "Faga a proba da cadeira", x_silla: "Trinta segundos que din como están as súas pernas. Será o seu punto de partida.", b_silla: "Ir ás probas",
    t_fuerza: "A súa primeira sesión de forza, de 10 minutos", x_fuerza: "Tres exercicios e unha serie de cada un, guiada e con cronómetro.", b_fuerza: "Preparar a sesión",
    t_cuando: "Mire a que hora lle convén adestrar", x_cuando: "Segundo cando toma cada medicamento, hai horas mellores e peores.", b_cuando: "Ver «Cando?»",
    t_porque: "Entenda un porqué", x_porque: "Unha explicación animada dun minuto sobre algo da súa medicación.", b_porque: "Ver unha explicación",
    t_pildoras: "Tres pílulas de movemento nun día", x_pildoras: "Un ou dous minutos cada vez, repartidos polo día.", b_pildoras: "Ver as pílulas",
    t_leccion: "Unha lección de dous minutos", x_leccion: "As dúbidas máis frecuentes sobre medicación e exercicio, en curto.", b_leccion: "Abrir «Aprende»",
    t_dias: "Escolla os seus días da semana", x_dias: "O plan repártese só entre os días que marque.", b_dias: "Ir ao meu plan",
    t_programa: "Comece o programa de 12 semanas", x_programa: "A partir de aquí, o programa sobe só, ao seu ritmo.", b_programa: "Ver o programa",
  },
  eu: { titulo: "Lehen 14 egunak", intro: "Egunero urrats txiki bat, presarik gabe. Bi astetan zure botikak berrikusita, zure neurriko plana eta lehen saioak eginda izango dituzu.", empezar: "Hasi gaur", dia: "{n}. eguna", de: "14tik {a}", hoy: "Gaurko urratsa", hecho: "Eginda", marcar: "Markatu egindakotzat", desmarcar: "Kendu marka", solo: "Egitean bere kabuz markatzen da.", todos: "14 urratsak",
    adelantado: "Egunean zaude. Atseden har dezakezu edo hurrengoa aurreratu.", sin_prisa: "Urratsak ez dira iraungitzen: egun batean ezin baduzu, jarraitu hurrengoarekin.", fin_tit: "Hamalautik hamalau", fin_x: "Oinarria jarrita duzu. Geratzen dena jarraitzea da, pixkanaka: 12 asteko programak hemendik aurrera lagunduko dizu.", terminar: "Amaitutzat eman", terminado: "Abiatzea amaituta. Beti duzu «Gehiago» atalean.", reiniciar: "Hasi berriro", empezado: "Hasi gara. Gaur, lehen urratsa.",
    t_meds: "Sartu zure botikak", x_meds: "Izenarekin, kaxaren argazki batekin edo errezetaren orriarekin. Gainerako guztia hemendik ateratzen da.", b_meds: "Gehitu botikak",
    t_cribado: "Erantzun segurtasuneko hiru galderari", x_cribado: "Hasi aurretik mediku-balorazioa komeni den jakiteko.", b_cribado: "Joan galderetara",
    t_informe: "Irakurri zure txostenaren funtsezkoena", x_informe: "Zure botikekin gehien axola duten puntuak, minutu batean.", b_informe: "Ikusi nire txostena",
    t_paseo: "5 minutuko ibilaldi bat", x_paseo: "Nahita laburra: gaur hastea besterik ez da.", b_paseo: "Prestatu ibilaldia",
    t_metas: "Aukeratu zertarako egon nahi duzun sasoian", x_metas: "Eskailerak igo, erosketak eraman, bilobekin jolastu… Planak hurbiltzen zaituena adieraziko du.", b_metas: "Aukeratu nire helburuak",
    t_ejercicio: "Ikasi ariketa bat: aulkitik altxatzea", x_ejercicio: "Denetan erabilgarriena. Begiratu marrazkia eta probatu bost aldiz.", b_ejercicio: "Ikusi ariketa",
    t_silla: "Egin aulkiaren proba", x_silla: "Zure hankak nola dauden esaten duten hogeita hamar segundo. Zure abiapuntua izango da.", b_silla: "Joan probetara",
    t_fuerza: "Zure lehen indar-saioa, 10 minutukoa", x_fuerza: "Hiru ariketa eta bakoitzeko serie bat, gidatuta eta kronometroarekin.", b_fuerza: "Prestatu saioa",
    t_cuando: "Begiratu zein ordutan komeni zaizun entrenatzea", x_cuando: "Botika bakoitza noiz hartzen duzun, ordu hobeak eta okerragoak daude.", b_cuando: "Ikusi «Noiz?»",
    t_porque: "Ulertu zergati bat", x_porque: "Zure botiken inguruko zerbaiti buruzko minutu bateko azalpen animatua.", b_porque: "Ikusi azalpen bat",
    t_pildoras: "Hiru mugimendu-pilula egun batean", x_pildoras: "Minutu bat edo bi aldiko, egunean zehar banatuta.", b_pildoras: "Ikusi pilulak",
    t_leccion: "Bi minutuko ikasgai bat", x_leccion: "Botikei eta ariketari buruzko zalantza ohikoenak, labur.", b_leccion: "Ireki «Ikasi»",
    t_dias: "Aukeratu zure asteko egunak", x_dias: "Plana bere kabuz banatzen da markatzen dituzun egunetan.", b_dias: "Joan nire planera",
    t_programa: "Hasi 12 asteko programa", x_programa: "Hemendik aurrera, programa bere kabuz igotzen da, zure erritmoan.", b_programa: "Ikusi programa",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Los 14 pasos, en orden. auto(c): se da por hecho solo con el estado de la aplicación (c = contexto()). ir: qué abre su botón. */
export const PASOS = [
  { id: "meds", auto: (c) => c.meds > 0, ir: { clic: "#btn-anadir" } },
  { id: "cribado", auto: (c) => c.crib != null && c.crib !== "sin_datos", ir: { ver: "#bloque-cribado" } },
  { id: "informe", ir: { tab: "general" } },
  { id: "paseo", auto: (c) => c.sesiones > 0, ir: { abre: "rato", arg: "paseo5" } },
  { id: "metas", auto: (c) => c.metas > 0, ir: { attr: "metas" } },
  { id: "ejercicio", ir: { ejercicio: "Levantarse de la silla" } },
  { id: "silla", auto: (c) => c.pruebas > 0, ir: { attr: "pruebas" } },
  { id: "fuerza", auto: (c) => c.fuerza > 0, ir: { abre: "rato", arg: "fuerza10" } },
  { id: "cuando", ir: { tab: "cuando" } },
  { id: "porque", ir: { porque: true } },
  { id: "pildoras", auto: (c) => c.pildoras >= 3, ir: { abre: "rato", arg: "pildoras" } },
  { id: "leccion", auto: (c) => c.lecciones > 0, ir: { attr: "aprende" } },
  { id: "dias", ir: { tab: "plan" } },
  { id: "programa", auto: (c) => c.programa, ir: { programa: true } },
];
/** ¿Está hecho un paso? Los que se marcan solos, por el estado; los demás, por la marca. */
export const hecho = (p, o, c) => !!o?.hechos?.[p.id] || !!(p.auto && c && p.auto(c));
/** Día del arranque en el que está (1…14; 0 si no ha empezado). */
export function diaDe(inicio, hoyIso) { if (!inicio) return 0; const d = Math.floor((new Date(hoyIso + "T12:00") - new Date(inicio + "T12:00")) / 864e5); return d < 0 ? 0 : Math.min(14, d + 1); }
/** Resumen: cuántos hechos, el paso de hoy (el primero sin hacer) y si va al día (hechos ≥ día). */
export function resumen(o, c, hoyIso) {
  const hechos = PASOS.filter((p) => hecho(p, o, c)), dia = diaDe(o?.inicio, hoyIso), sig = PASOS.find((p) => !hecho(p, o, c)) || null;
  return { n: hechos.length, dia, sig, alDia: hechos.length >= dia, completo: hechos.length === PASOS.length };
}

const CLAVE = "medex.primeros";
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null"); return o && typeof o === "object" && /^\d{4}-\d\d-\d\d$/.test(o.inicio || "") ? { inicio: o.inicio, hechos: o.hechos && typeof o.hechos === "object" ? o.hechos : {}, fin: o.fin || null } : null; } catch { return null; } }
const guardar = (o) => { try { if (o) localStorage.setItem(CLAVE, JSON.stringify(o)); else localStorage.removeItem(CLAVE); } catch {} };

const CSS = `
.pr-dlg { width: min(720px, calc(100vw - 16px)); }
.pr-intro { margin: 0 0 12px; color: var(--muted); }
.pr-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.pr-cab { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 14px; align-items: center; margin: 0 0 12px; }
.pr-anillo { position: relative; width: 84px; height: 84px; }
.pr-anillo svg { width: 100%; height: 100%; rotate: -90deg; }
.pr-anillo circle { fill: none; stroke-width: 8; }
.pr-anillo .f { stroke: var(--line-strong); } .pr-anillo .v { stroke: var(--accent); stroke-linecap: round; }
.pr-anillo b { position: absolute; inset: 0; display: grid; place-content: center; font-family: var(--mono); font-size: 1.5rem; }
.pr-cab p { margin: 0; } .pr-cab strong { font-size: 1.15rem; } .pr-cab small { color: var(--muted); }
.pr-hoy { padding: 14px; border: 1.5px solid var(--accent); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 70%); }
.pr-hoy small { font-family: var(--mono); font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent-deep, var(--accent)); }
.pr-hoy b { display: block; margin: 2px 0; font-size: 1.15rem; line-height: 1.25; }
.pr-hoy p { margin: 0 0 10px; } .pr-hoy p.pr-nota { margin: 8px 0 0; font-size: .82rem; }
.pr-acc { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 10px 0 0; }
.pr-hoy .pr-acc { margin: 0; }
.pr-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; counter-reset: paso; }
.pr-lista li { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.pr-lista .pr-n { grid-row: span 2; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--line-strong); font-family: var(--mono); font-size: .86rem; font-weight: 700; color: var(--muted); }
.pr-lista li.hecho .pr-n { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.pr-lista li.sig { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.pr-lista b { font-size: .95rem; line-height: 1.25; }
.pr-lista li.hecho b { color: var(--muted); font-weight: 600; }
.pr-lista small { grid-column: 2; color: var(--muted); font-size: .84rem; line-height: 1.35; }
.pr-lista .pr-b { grid-row: span 2; grid-column: 3; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px 12px; }
.pr-lista .pr-b button { white-space: nowrap; }
.pr-enlace { border: 0; background: none; padding: 2px 0; color: var(--accent-deep, var(--accent)); font: inherit; font-size: .8rem; font-weight: 700; text-decoration: underline; cursor: pointer; }
.pr-dlg button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.pr-nota { margin: 10px 0 0; font-size: .86rem; color: var(--muted); }
.pr-fin { padding: 14px; border: 1.5px solid var(--info); border-radius: var(--r-md); background: var(--info-soft); color: var(--info-ink); }
.pr-fin b { display: block; font-size: 1.15rem; margin-bottom: 4px; } .pr-fin p { margin: 0; }
:root[data-theme="contrast"] .pr-hoy { background: var(--surface); }
@media (max-width: 520px) { .pr-lista li { grid-template-columns: 34px minmax(0, 1fr); } .pr-lista .pr-b { grid-column: 2; grid-row: auto; justify-content: flex-start; margin-top: 4px; } }
@media (forced-colors: active) { .pr-anillo .v { stroke: Highlight; } .pr-lista li.hecho .pr-n { background: Highlight; } }
`;

let dlg = null, A = null;
const cu = () => dlg.querySelector("#pr-cuerpo");
/** Lo que la aplicación sabe ya (para marcar solos los pasos). */
export function contexto(api) {
  const num = (f) => { try { return f(); } catch { return 0; } };
  const diario = num(() => api.leerDiario()) || [], json = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
  return {
    meds: num(() => api.estado.meds.length), crib: num(() => (api.estado.meds.length ? api.cribadoActual(api.res()).clave : null)) || null,
    sesiones: diario.length, fuerza: diario.filter((x) => /fuerza/.test(x.tipo || "")).length, metas: num(() => api.estado.metas?.ids?.length || 0), pruebas: num(() => api.estado.sft?.hist?.length || 0),
    pildoras: Math.max(0, ...Object.values(json("medex.pildoras") || {}).map(Number).filter((x) => x >= 0)), lecciones: Object.keys(json("medex.aprende") || {}).length, programa: !!json("medex.programa"),
  };
}
function ir(p) {
  const x = p.ir; dlg.close();
  const pulsa = (attr, v = "") => { const b = document.createElement("button"); b.dataset[attr] = v; document.body.append(b); b.click(); b.remove(); };
  if (x.clic) document.querySelector(x.clic)?.click();
  else if (x.ver) { const d = document.querySelector(x.ver); if (d) { if (d.tagName === "DETAILS") d.open = true; A.desplazar(d); } }
  else if (x.tab) A.irTab(x.tab);
  else if (x.abre) A.abrir(x.abre, x.arg || null);
  else if (x.attr) pulsa(x.attr);
  else if (x.ejercicio) A.abrirEjercicio(x.ejercicio);
  else if (x.programa) A.abrirPrograma();
  else if (x.porque) { let id = "tension"; try { id = A.porquesDe(A.res().items.flatMap((it) => [...it.senales]))[0] || id; } catch {} pulsa("porque", id); }
}
function crear() {
  if (!document.getElementById("pr-css")) { const st = document.createElement("style"); st.id = "pr-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "primeros"; dlg.className = "ficha alta pr-dlg"; dlg.setAttribute("aria-labelledby", "pr-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="pr-cab-t"></p><button type="button" class="btn-sec sm" id="pr-cerrar"></button></div><div class="ficha-cuerpo" id="pr-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#pr-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-pr]"); if (!b) return;
    const a = b.dataset.pr, p = PASOS.find((x) => x.id === b.dataset.v), o = leer();
    if (a === "empezar") { guardar({ inicio: A.hoyISO(), hechos: {}, fin: null }); A.render(); A.toast(tx("empezado"), { ms: 3500 }); pintar(); }
    else if (a === "ir" && p) ir(p);
    else if (a === "marcar" && p && o) { if (o.hechos[p.id]) delete o.hechos[p.id]; else o.hechos[p.id] = A.hoyISO(); guardar(o); A.render(); pintar(); dlg.querySelector(`[data-pr="marcar"][data-v="${p.id}"]`)?.focus(); }
    else if (a === "terminar" && o) { guardar({ ...o, fin: A.hoyISO() }); A.render(); dlg.close(); A.toast(tx("terminado"), { ms: 4000 }); }
    else if (a === "reiniciar") { guardar(null); A.render(); pintar(); cu().scrollTop = 0; }
  });
}
function pintar() {
  dlg.querySelector("#pr-cab-t").textContent = tx("titulo");
  const o = leer(), c = contexto(A);
  if (!o) { cu().innerHTML = `<p class="pr-intro">${tx("intro")}</p><div class="pr-acc"><button type="button" class="btn" data-pr="empezar">${tx("empezar")}</button></div><h3>${tx("todos")}</h3>${lista(null, c, null)}`; return; }
  const r = resumen(o, c, A.hoyISO()), C = 2 * Math.PI * 34;
  cu().innerHTML = `<div class="pr-cab"><div class="pr-anillo" role="img" aria-label="${tx("de", { a: r.n })}"><svg viewBox="0 0 84 84" aria-hidden="true"><circle class="f" cx="42" cy="42" r="34"/><circle class="v" cx="42" cy="42" r="34" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - r.n / 14)).toFixed(1)}"/></svg><b id="pr-n">${r.n}</b></div><p><strong>${tx("dia", { n: r.dia || 1 })}</strong> · <span id="pr-de">${tx("de", { a: r.n })}</span><br><small>${r.completo ? "" : r.alDia ? tx("adelantado") : tx("sin_prisa")}</small></p></div>
    ${r.completo ? `<div class="pr-fin"><b>${tx("fin_tit")}</b><p>${tx("fin_x")}</p></div><div class="pr-acc"><button type="button" class="btn" data-pr="terminar">${tx("terminar")}</button></div>`
      : `<div class="pr-hoy" id="pr-hoy"><small>${tx("hoy")}</small><b>${tx("t_" + r.sig.id)}</b><p>${tx("x_" + r.sig.id)}</p><div class="pr-acc"><button type="button" class="btn" data-pr="ir" data-v="${r.sig.id}">${tx("b_" + r.sig.id)}</button><button type="button" class="btn-sec" data-pr="marcar" data-v="${r.sig.id}">${tx("marcar")}</button></div>${r.sig.auto ? `<p class="pr-nota">${tx("solo")}</p>` : ""}</div>`}
    <h3>${tx("todos")}</h3>${lista(o, c, r.sig)}
    <div class="pr-acc">${r.completo ? "" : `<button type="button" class="btn-sec sm" data-pr="terminar">${tx("terminar")}</button>`}<button type="button" class="btn-sec sm" data-pr="reiniciar">${tx("reiniciar")}</button></div>`;
}
const lista = (o, c, sig) => `<ol class="pr-lista" id="pr-lista">${PASOS.map((p, i) => { const h = hecho(p, o, c), manual = !!o?.hechos?.[p.id]; return `<li class="${h ? "hecho" : ""}${sig?.id === p.id ? " sig" : ""}" data-id="${p.id}"><span class="pr-n" aria-hidden="true">${h ? "✓" : i + 1}</span><b>${tx("t_" + p.id)}${h ? ` <span class="sr-only">(${tx("hecho")})</span>` : ""}</b><small>${tx("x_" + p.id)}</small>${o ? `<span class="pr-b">${h && !manual ? "" : `<button type="button" class="pr-enlace" data-pr="marcar" data-v="${p.id}">${manual ? tx("desmarcar") : tx("marcar")}</button>`}${h ? "" : `<button type="button" class="btn-sec sm" data-pr="ir" data-v="${p.id}">${tx("b_" + p.id)}</button>`}</span>` : ""}</li>`; }).join("")}</ol>`;
/** Abre la ventana. */
export function abrir(api) {
  A = api;
  if (!dlg) crear();
  dlg.querySelector("#pr-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#pr-cerrar").focus();
}
