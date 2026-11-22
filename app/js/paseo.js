/* Paseo guiado con ritmo (segunda tanda de mejoras grandes, 6). Se carga bajo demanda (data-abre="paseo").
   - Metrónomo a paso ligero: 100 pasos por minuto equivalen a intensidad moderada (CADENCE-Adults), ajustable de 70 a 130.
   - Paseo libre (10 a 45 min) o programa de 8 semanas, por intervalos, hasta 30 minutos seguidos a paso ligero.
   - Avisos por voz en cada cambio, prueba del habla a un tercio y a dos tercios del tramo ligero, y cuenta de pasos
     aproximada con el sensor de movimiento del móvil si el navegador lo permite (nada sale del dispositivo).
   - Con fármacos que frenan el pulso avisa de que el pulso no sirve de guía. Al terminar, lo apunta en el diario.
   Preferencias y avance del programa en localStorage («medex.paseo»). Cifras de cadencia y prueba del habla comprobadas en
   PubMed (22/11/2026). El programa de 8 semanas es una progresión orientativa propia, no la de un estudio. */
import { t, idioma } from "./i18n.js?v=202611222313";

const TXT = {
  es: { titulo: "Paseo guiado", m_libre: "Paseo libre", m_prog: "Programa de 8 semanas", intro: "Un paseo con ritmo: el móvil marca el paso, avisa de los cambios y cuenta el tiempo.", cuanto: "¿Cuánto rato?", min: "{n} min",
    ritmo: "Ritmo del paso ligero", ppm: "pasos/min", r_70: "muy suave", r_80: "suave", r_90: "cómodo", r_100: "moderado", r_110: "vivo", r_120: "muy vivo", r_130: "intenso", ritmo_x: "100 pasos por minuto es intensidad moderada para la mayoría. Si es mucho para usted, baje a 80 o 90: lo que manda es poder hablar.",
    metro: "Metrónomo", voz: "Voz", sensor: "Contar pasos con el móvil", sensor_x: "Aproximado, con el móvil en la mano o en el bolsillo.", empezar: "Empezar el paseo", plan: "Así será", total: "{n} min en total", ligero_tot: "{n} min a paso ligero",
    k_calienta: "Calentamiento", k_ligero: "Paso ligero", k_suave: "Paso tranquilo", k_enfria: "Vuelta a la calma", quedan: "quedan", despues: "Después: {x}, {n} min", ultimo: "Último tramo", tramo: "de este tramo",
    pausa: "Pausa", seguir: "Seguir", terminar: "Terminar", mas_lento: "Más despacio", mas_rapido: "Más deprisa", pasos: "Pasos (aprox.)", medido: "Ritmo medido", sin_sensor: "Sin sensor de pasos en este dispositivo.",
    habla: "Prueba del habla", habla_p: "¿Puede decir una frase entera sin quedarse sin aire?", h_facil: "Sí, y hasta cantar", h_bien: "Hablar sí, cantar no", h_cuesta: "Me cuesta hablar", h_facil_r: "Va suave: subo un poco el ritmo.", h_bien_r: "Ese es el punto: moderado.", h_cuesta_r: "Demasiado fuerte: bajo el ritmo.",
    sem: "Semana {n}", sem_de: "Semana {n} de 8", hechos: "{a} de 3 paseos esta semana", sem_x: "{r} veces: {a} min a paso ligero y {b} min tranquilo", sem_x1: "{a} minutos seguidos a paso ligero", sem_sub: "Con 3 paseos pasa a la semana siguiente. Si alguna se le hace cuesta arriba, repítala las veces que haga falta.", repetir: "Semana anterior", saltar: "Semana siguiente", sem_nueva: "Tres paseos hechos: pasa a la semana {n}.", prog_fin: "Programa completado: ya camina 30 minutos seguidos.",
    fin_tit: "Paseo terminado", fin_min: "minutos", fin_lig: "a paso ligero", fin_pasos: "pasos (aprox.)", esfuerzo: "¿Cómo de duro ha sido? (0 nada, 10 máximo)", guardar: "Guardar en el diario", guardado: "Paseo guardado en su diario.", no_guardar: "No guardar", corto: "Menos de 2 minutos: no se apunta.",
    cuida: "Con su medicación", pulso: "Con su medicación el pulso no sirve de guía: fíese de la prueba del habla y de la sensación de esfuerzo.", seguridad: "Pare si nota dolor en el pecho, mareo, falta de aire que no cede o palpitaciones.",
    v_inicio: "Empezamos. {n} minutos. Primero, calentamiento a paso tranquilo.", v_ligero: "Ahora, paso ligero. {n} minutos.", v_suave: "Paso tranquilo. {n} minutos. Recupere.", v_enfria: "Vuelta a la calma. {n} minutos a paso tranquilo.", v_mitad: "Mitad del paseo.", v_minuto: "Último minuto.", v_fin: "Paseo terminado. Buen trabajo.", v_habla: "Prueba del habla. ¿Puede decir una frase entera sin quedarse sin aire?",
    fuentes: "En qué se basa", f_tl21: "en personas de 61 a 85 años, 100, 110 y 120 pasos por minuto corresponden a 3, 4 y 5 MET (intensidad moderada en adelante).", f_tl19: "de 21 a 40 años, 100 pasos por minuto marcan la intensidad moderada y 130 la vigorosa.", f_reed: "la prueba del habla es válida y fiable para ajustar la intensidad, también en personas con enfermedad cardiovascular.", f_prog: "El programa de 8 semanas es una progresión orientativa de esta aplicación, no la de un estudio." },
  en: { titulo: "Guided walk", m_libre: "Free walk", m_prog: "8-week programme", intro: "A walk with a beat: the phone sets the pace, announces the changes and keeps the time.", cuanto: "How long?", min: "{n} min",
    ritmo: "Brisk-walk pace", ppm: "steps/min", r_70: "very gentle", r_80: "gentle", r_90: "comfortable", r_100: "moderate", r_110: "lively", r_120: "very lively", r_130: "intense", ritmo_x: "100 steps a minute is moderate intensity for most people. If that is too much for you, go down to 80 or 90: what matters is being able to talk.",
    metro: "Metronome", voz: "Voice", sensor: "Count steps with the phone", sensor_x: "Approximate, with the phone in your hand or pocket.", empezar: "Start the walk", plan: "What it will be like", total: "{n} min in total", ligero_tot: "{n} min at a brisk pace",
    k_calienta: "Warm-up", k_ligero: "Brisk pace", k_suave: "Easy pace", k_enfria: "Cool-down", quedan: "left", despues: "Next: {x}, {n} min", ultimo: "Last stretch", tramo: "of this stretch",
    pausa: "Pause", seguir: "Resume", terminar: "Finish", mas_lento: "Slower", mas_rapido: "Faster", pasos: "Steps (approx.)", medido: "Measured pace", sin_sensor: "No step sensor on this device.",
    habla: "Talk test", habla_p: "Can you say a whole sentence without running out of breath?", h_facil: "Yes, I could even sing", h_bien: "Talk yes, sing no", h_cuesta: "Talking is hard", h_facil_r: "Easy going: pace goes up a little.", h_bien_r: "That is the spot: moderate.", h_cuesta_r: "Too hard: pace goes down.",
    sem: "Week {n}", sem_de: "Week {n} of 8", hechos: "{a} of 3 walks this week", sem_x: "{r} times: {a} min brisk and {b} min easy", sem_x1: "{a} minutes of brisk walking in a row", sem_sub: "With 3 walks you move on to the next week. If one feels too hard, repeat it as often as you need.", repetir: "Previous week", saltar: "Next week", sem_nueva: "Three walks done: on to week {n}.", prog_fin: "Programme completed: you now walk 30 minutes in a row.",
    fin_tit: "Walk finished", fin_min: "minutes", fin_lig: "at a brisk pace", fin_pasos: "steps (approx.)", esfuerzo: "How hard was it? (0 nothing, 10 maximum)", guardar: "Save to diary", guardado: "Walk saved to your diary.", no_guardar: "Do not save", corto: "Under 2 minutes: not logged.",
    cuida: "With your medication", pulso: "With your medication heart rate is not a reliable guide: trust the talk test and how hard it feels.", seguridad: "Stop if you notice chest pain, dizziness, breathlessness that does not ease or palpitations.",
    v_inicio: "Here we go. {n} minutes. First, a warm-up at an easy pace.", v_ligero: "Now, brisk pace. {n} minutes.", v_suave: "Easy pace. {n} minutes. Recover.", v_enfria: "Cool-down. {n} minutes at an easy pace.", v_mitad: "Halfway through the walk.", v_minuto: "Last minute.", v_fin: "Walk finished. Well done.", v_habla: "Talk test. Can you say a whole sentence without running out of breath?",
    fuentes: "What it is based on", f_tl21: "in people aged 61 to 85, 100, 110 and 120 steps a minute correspond to 3, 4 and 5 METs (moderate intensity and above).", f_tl19: "from 21 to 40 years, 100 steps a minute mark moderate intensity and 130 vigorous.", f_reed: "the talk test is valid and reliable for adjusting intensity, including in people with cardiovascular disease.", f_prog: "The 8-week programme is this app's own guideline progression, not one taken from a study." },
  ca: { titulo: "Passeig guiat", m_libre: "Passeig lliure", m_prog: "Programa de 8 setmanes", intro: "Un passeig amb ritme: el mòbil marca el pas, avisa dels canvis i compta el temps.", cuanto: "Quanta estona?", min: "{n} min",
    ritmo: "Ritme del pas lleuger", ppm: "passos/min", r_70: "molt suau", r_80: "suau", r_90: "còmode", r_100: "moderat", r_110: "viu", r_120: "molt viu", r_130: "intens", ritmo_x: "100 passos per minut és intensitat moderada per a la majoria. Si és massa per a vós, baixeu a 80 o 90: el que mana és poder parlar.",
    metro: "Metrònom", voz: "Veu", sensor: "Comptar passos amb el mòbil", sensor_x: "Aproximat, amb el mòbil a la mà o a la butxaca.", empezar: "Començar el passeig", plan: "Serà així", total: "{n} min en total", ligero_tot: "{n} min a pas lleuger",
    k_calienta: "Escalfament", k_ligero: "Pas lleuger", k_suave: "Pas tranquil", k_enfria: "Tornada a la calma", quedan: "queden", despues: "Després: {x}, {n} min", ultimo: "Últim tram", tramo: "d'aquest tram",
    pausa: "Pausa", seguir: "Seguir", terminar: "Acabar", mas_lento: "Més a poc a poc", mas_rapido: "Més de pressa", pasos: "Passos (aprox.)", medido: "Ritme mesurat", sin_sensor: "Sense sensor de passos en aquest dispositiu.",
    habla: "Prova de la parla", habla_p: "Podeu dir una frase sencera sense quedar-vos sense aire?", h_facil: "Sí, i fins i tot cantar", h_bien: "Parlar sí, cantar no", h_cuesta: "Em costa parlar", h_facil_r: "Aneu suau: pujo una mica el ritme.", h_bien_r: "Aquest és el punt: moderat.", h_cuesta_r: "Massa fort: baixo el ritme.",
    sem: "Setmana {n}", sem_de: "Setmana {n} de 8", hechos: "{a} de 3 passejos aquesta setmana", sem_x: "{r} vegades: {a} min a pas lleuger i {b} min tranquil", sem_x1: "{a} minuts seguits a pas lleuger", sem_sub: "Amb 3 passejos passeu a la setmana següent. Si alguna se us fa costa amunt, repetiu-la tantes vegades com calgui.", repetir: "Setmana anterior", saltar: "Setmana següent", sem_nueva: "Tres passejos fets: passeu a la setmana {n}.", prog_fin: "Programa completat: ja camineu 30 minuts seguits.",
    fin_tit: "Passeig acabat", fin_min: "minuts", fin_lig: "a pas lleuger", fin_pasos: "passos (aprox.)", esfuerzo: "Com de dur ha estat? (0 gens, 10 màxim)", guardar: "Desar al diari", guardado: "Passeig desat al vostre diari.", no_guardar: "No desar", corto: "Menys de 2 minuts: no s'apunta.",
    cuida: "Amb la vostra medicació", pulso: "Amb la vostra medicació el pols no serveix de guia: fieu-vos de la prova de la parla i de la sensació d'esforç.", seguridad: "Pareu si noteu dolor al pit, mareig, falta d'aire que no cedeix o palpitacions.",
    v_inicio: "Comencem. {n} minuts. Primer, escalfament a pas tranquil.", v_ligero: "Ara, pas lleuger. {n} minuts.", v_suave: "Pas tranquil. {n} minuts. Recupereu.", v_enfria: "Tornada a la calma. {n} minuts a pas tranquil.", v_mitad: "Meitat del passeig.", v_minuto: "Últim minut.", v_fin: "Passeig acabat. Bona feina.", v_habla: "Prova de la parla. Podeu dir una frase sencera sense quedar-vos sense aire?",
    fuentes: "En què es basa", f_tl21: "en persones de 61 a 85 anys, 100, 110 i 120 passos per minut corresponen a 3, 4 i 5 MET (intensitat moderada en amunt).", f_tl19: "de 21 a 40 anys, 100 passos per minut marquen la intensitat moderada i 130 la vigorosa.", f_reed: "la prova de la parla és vàlida i fiable per ajustar la intensitat, també en persones amb malaltia cardiovascular.", f_prog: "El programa de 8 setmanes és una progressió orientativa d'aquesta aplicació, no la d'un estudi." },
  gl: { titulo: "Paseo guiado", m_libre: "Paseo libre", m_prog: "Programa de 8 semanas", intro: "Un paseo con ritmo: o móbil marca o paso, avisa dos cambios e conta o tempo.", cuanto: "Canto tempo?", min: "{n} min",
    ritmo: "Ritmo do paso lixeiro", ppm: "pasos/min", r_70: "moi suave", r_80: "suave", r_90: "cómodo", r_100: "moderado", r_110: "vivo", r_120: "moi vivo", r_130: "intenso", ritmo_x: "100 pasos por minuto é intensidade moderada para a maioría. Se é moito para vostede, baixe a 80 ou 90: o que manda é poder falar.",
    metro: "Metrónomo", voz: "Voz", sensor: "Contar pasos co móbil", sensor_x: "Aproximado, co móbil na man ou no peto.", empezar: "Comezar o paseo", plan: "Será así", total: "{n} min en total", ligero_tot: "{n} min a paso lixeiro",
    k_calienta: "Quecemento", k_ligero: "Paso lixeiro", k_suave: "Paso tranquilo", k_enfria: "Volta á calma", quedan: "quedan", despues: "Despois: {x}, {n} min", ultimo: "Último tramo", tramo: "deste tramo",
    pausa: "Pausa", seguir: "Seguir", terminar: "Rematar", mas_lento: "Máis amodo", mas_rapido: "Máis á présa", pasos: "Pasos (aprox.)", medido: "Ritmo medido", sin_sensor: "Sen sensor de pasos neste dispositivo.",
    habla: "Proba da fala", habla_p: "Pode dicir unha frase enteira sen quedar sen aire?", h_facil: "Si, e mesmo cantar", h_bien: "Falar si, cantar non", h_cuesta: "Cústame falar", h_facil_r: "Vai suave: subo un pouco o ritmo.", h_bien_r: "Ese é o punto: moderado.", h_cuesta_r: "Demasiado forte: baixo o ritmo.",
    sem: "Semana {n}", sem_de: "Semana {n} de 8", hechos: "{a} de 3 paseos esta semana", sem_x: "{r} veces: {a} min a paso lixeiro e {b} min tranquilo", sem_x1: "{a} minutos seguidos a paso lixeiro", sem_sub: "Con 3 paseos pasa á semana seguinte. Se algunha se lle fai costa arriba, repítaa as veces que faga falta.", repetir: "Semana anterior", saltar: "Semana seguinte", sem_nueva: "Tres paseos feitos: pasa á semana {n}.", prog_fin: "Programa completado: xa camiña 30 minutos seguidos.",
    fin_tit: "Paseo rematado", fin_min: "minutos", fin_lig: "a paso lixeiro", fin_pasos: "pasos (aprox.)", esfuerzo: "Como de duro foi? (0 nada, 10 máximo)", guardar: "Gardar no diario", guardado: "Paseo gardado no seu diario.", no_guardar: "Non gardar", corto: "Menos de 2 minutos: non se apunta.",
    cuida: "Coa súa medicación", pulso: "Coa súa medicación o pulso non serve de guía: fíese da proba da fala e da sensación de esforzo.", seguridad: "Pare se nota dor no peito, mareo, falta de aire que non cede ou palpitacións.",
    v_inicio: "Comezamos. {n} minutos. Primeiro, quecemento a paso tranquilo.", v_ligero: "Agora, paso lixeiro. {n} minutos.", v_suave: "Paso tranquilo. {n} minutos. Recupere.", v_enfria: "Volta á calma. {n} minutos a paso tranquilo.", v_mitad: "Metade do paseo.", v_minuto: "Último minuto.", v_fin: "Paseo rematado. Bo traballo.", v_habla: "Proba da fala. Pode dicir unha frase enteira sen quedar sen aire?",
    fuentes: "En que se basea", f_tl21: "en persoas de 61 a 85 anos, 100, 110 e 120 pasos por minuto corresponden a 3, 4 e 5 MET (intensidade moderada en adiante).", f_tl19: "de 21 a 40 anos, 100 pasos por minuto marcan a intensidade moderada e 130 a vigorosa.", f_reed: "a proba da fala é válida e fiable para axustar a intensidade, tamén en persoas con enfermidade cardiovascular.", f_prog: "O programa de 8 semanas é unha progresión orientativa desta aplicación, non a dun estudo." },
  eu: { titulo: "Ibilaldi gidatua", m_libre: "Ibilaldi librea", m_prog: "8 asteko programa", intro: "Erritmodun ibilaldia: mugikorrak pausoa markatzen du, aldaketak iragartzen ditu eta denbora kontatzen du.", cuanto: "Zenbat denbora?", min: "{n} min",
    ritmo: "Pauso arinaren erritmoa", ppm: "pauso/min", r_70: "oso leuna", r_80: "leuna", r_90: "erosoa", r_100: "moderatua", r_110: "bizia", r_120: "oso bizia", r_130: "bizi-bizia", ritmo_x: "Minutuko 100 pauso intentsitate moderatua da gehienentzat. Zuretzat gehiegi bada, jaitsi 80 edo 90era: hitz egin ahal izatea da garrantzitsuena.",
    metro: "Metronomoa", voz: "Ahotsa", sensor: "Zenbatu pausoak mugikorrarekin", sensor_x: "Gutxi gorabehera, mugikorra eskuan edo poltsikoan duzula.", empezar: "Hasi ibilaldia", plan: "Honela izango da", total: "{n} min guztira", ligero_tot: "{n} min pauso arinean",
    k_calienta: "Beroketa", k_ligero: "Pauso arina", k_suave: "Pauso lasaia", k_enfria: "Lasaitzea", quedan: "falta dira", despues: "Gero: {x}, {n} min", ultimo: "Azken tartea", tramo: "tarte honetan",
    pausa: "Pausa", seguir: "Jarraitu", terminar: "Amaitu", mas_lento: "Mantsoago", mas_rapido: "Azkarrago", pasos: "Pausoak (gutxi gorabehera)", medido: "Neurtutako erritmoa", sin_sensor: "Gailu honetan ez dago pauso-sentsorerik.",
    habla: "Hizketa-proba", habla_p: "Esan dezakezu esaldi oso bat arnasarik gabe geratu gabe?", h_facil: "Bai, eta abestu ere bai", h_bien: "Hitz egin bai, abestu ez", h_cuesta: "Kosta egiten zait hitz egitea", h_facil_r: "Leun zoaz: erritmoa pixka bat igoko dut.", h_bien_r: "Hori da puntua: moderatua.", h_cuesta_r: "Gogorregi: erritmoa jaitsiko dut.",
    sem: "{n}. astea", sem_de: "{n}. astea 8tik", hechos: "Aste honetan 3 ibilalditik {a}", sem_x: "{r} aldiz: {a} min pauso arinean eta {b} min lasai", sem_x1: "{a} minutu jarraian pauso arinean", sem_sub: "3 ibilaldirekin hurrengo astera pasatzen zara. Bat gogorra egiten bazaizu, errepikatu behar adina aldiz.", repetir: "Aurreko astea", saltar: "Hurrengo astea", sem_nueva: "Hiru ibilaldi eginda: {n}. astera pasatzen zara.", prog_fin: "Programa osatuta: 30 minutu jarraian ibiltzen zara.",
    fin_tit: "Ibilaldia amaituta", fin_min: "minutu", fin_lig: "pauso arinean", fin_pasos: "pauso (gutxi gorabehera)", esfuerzo: "Zenbateraino izan da gogorra? (0 ezer ez, 10 gehienezkoa)", guardar: "Gorde egunkarian", guardado: "Ibilaldia zure egunkarian gorde da.", no_guardar: "Ez gorde", corto: "2 minutu baino gutxiago: ez da idazten.",
    cuida: "Zure botikekin", pulso: "Zure botikekin pultsuak ez du gidari gisa balio: fidatu hizketa-probaz eta ahaleginaren sentsazioaz.", seguridad: "Gelditu bularreko mina, zorabioa, baretzen ez den arnasestua edo palpitazioak nabaritzen badituzu.",
    v_inicio: "Hasiko gara. {n} minutu. Lehenik, beroketa pauso lasaian.", v_ligero: "Orain, pauso arina. {n} minutu.", v_suave: "Pauso lasaia. {n} minutu. Errekuperatu.", v_enfria: "Lasaitzea. {n} minutu pauso lasaian.", v_mitad: "Ibilaldiaren erdia.", v_minuto: "Azken minutua.", v_fin: "Ibilaldia amaituta. Lan ona.", v_habla: "Hizketa-proba. Esan dezakezu esaldi oso bat arnasarik gabe geratu gabe?",
    fuentes: "Zertan oinarritzen den", f_tl21: "61-85 urteko pertsonetan, minutuko 100, 110 eta 120 pauso 3, 4 eta 5 MET dira (intentsitate moderatutik gora).", f_tl19: "21-40 urte bitartean, minutuko 100 pausok intentsitate moderatua markatzen dute eta 130ek bizia.", f_reed: "hizketa-proba baliozkoa eta fidagarria da intentsitatea doitzeko, baita gaixotasun kardiobaskularra dutenengan ere.", f_prog: "8 asteko programa aplikazio honen progresio orientagarria da, ez ikerketa batena." },
};
const txDe = (l, k, vars) => { let s = TXT[l]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };
export const tx = (k, vars) => txDe(idioma(), k, vars);

export const FUENTES = [
  { id: "tl21", cita: "Tudor-Locke C et al. Int J Behav Nutr Phys Act 2021;18:129", doi: "10.1186/s12966-021-01199-4" },
  { id: "tl19", cita: "Tudor-Locke C et al. Int J Behav Nutr Phys Act 2019;16:8", doi: "10.1186/s12966-019-0769-6" },
  { id: "reed", cita: "Reed JL, Pipe AL. Curr Opin Cardiol 2014;29:475-80", doi: "10.1097/HCO.0000000000000097" },
];
export const DURACIONES = [10, 15, 20, 30, 45];
export const CADENCIAS = [70, 80, 90, 100, 110, 120, 130];
/* Programa de 8 semanas: [repeticiones, minutos a paso ligero, minutos a paso tranquilo]. Siempre con 3 min de calentamiento y 2 de vuelta a la calma. */
export const SEMANAS = [[5, 2, 2], [5, 3, 2], [4, 5, 2], [3, 7, 2], [3, 8, 1], [2, 12, 2], [2, 15, 1], [1, 30, 0]];
const seg = (k, m) => ({ k, s: Math.round(m * 60) });
/** Paseo libre de `min` minutos: calentamiento, paso ligero y vuelta a la calma. */
export function planLibre(min) { const c = min <= 10 ? 2 : 3, f = min <= 10 ? 1 : 2; return [seg("calienta", c), seg("ligero", min - c - f), seg("enfria", f)]; }
/** Paseo de una semana (1-8) del programa. */
export function planSemana(n) {
  const [r, a, b] = SEMANAS[Math.min(8, Math.max(1, n)) - 1], p = [seg("calienta", 3)];
  for (let i = 0; i < r; i++) { p.push(seg("ligero", a)); if (b && i < r - 1) p.push(seg("suave", b)); }
  p.push(seg("enfria", 2)); return p;
}
export const duracion = (plan) => plan.reduce((n, x) => n + x.s, 0);
export const ligero = (plan) => plan.filter((x) => x.k === "ligero").reduce((n, x) => n + x.s, 0);
/** Tramo en curso a los `t` segundos: { i, tramo, dentro (s transcurridos del tramo), resto (s que le quedan) }; null si ya ha terminado. */
export function tramoEn(plan, t) { let ac = 0; for (const [i, x] of plan.entries()) { if (t < ac + x.s) return { i, tramo: x, dentro: t - ac, resto: ac + x.s - t }; ac += x.s; } return null; }
/** Segundos de paso ligero ya caminados a los `t` segundos. */
export function ligeroHasta(plan, t) { let ac = 0, n = 0; for (const x of plan) { const d = Math.max(0, Math.min(x.s, t - ac)); if (x.k === "ligero") n += d; ac += x.s; } return n; }
/** Momentos (en segundos de paseo) de las dos pruebas del habla: a un tercio y a dos tercios del paso ligero (nunca justo en el
    cambio de tramo: como tarde, 20 s antes). Sin prueba si hay menos de 6 min ligeros. */
export function momentosHabla(plan) {
  const L = ligero(plan); if (L < 360) return [];
  return [1 / 3, 2 / 3].map((f) => { let falta = L * f, ac = 0; for (const x of plan) { if (x.k === "ligero") { if (falta <= x.s) return Math.round(ac + Math.min(falta, x.s - 20)); falta -= x.s; } ac += x.s; } return null; }).filter((x) => x != null);
}
/** Ajuste del ritmo tras la prueba del habla. */
export const ajusteHabla = (cad, r) => Math.max(70, Math.min(130, cad + (r === "facil" ? 5 : r === "cuesta" ? -10 : 0)));
/** Cuenta pasos en una serie de muestras del acelerómetro ([{ t (ms), x, y, z }]): picos de la aceleración sin gravedad, con al menos 280 ms entre pasos. */
export function contarPasos(muestras, estado = { g: null, s: 0, alto: false, ult: -1e9, n: 0 }) {
  for (const m of muestras) {
    const mag = Math.hypot(m.x || 0, m.y || 0, m.z || 0);
    estado.g = estado.g == null ? mag : estado.g * 0.92 + mag * 0.08;
    estado.s = estado.s * 0.6 + (mag - estado.g) * 0.4;
    if (!estado.alto && estado.s > 0.9 && m.t - estado.ult >= 280) { estado.alto = true; estado.ult = m.t; estado.n++; (estado.marcas ||= []).push(m.t); if (estado.marcas.length > 120) estado.marcas.shift(); }
    else if (estado.alto && estado.s < 0.2) estado.alto = false;
  }
  return estado;
}
/** Pasos por minuto medidos en los últimos 20 segundos (null si hay menos de 8 pasos). */
export function cadenciaMedida(estado, ahora) { const r = (estado.marcas || []).filter((x) => ahora - x <= 20000); return r.length >= 8 ? Math.round((r.length - 1) / ((r.at(-1) - r[0]) / 60000)) : null; }

/* --- preferencias y avance --- */
const CLAVE = "medex.paseo";
const DEF = { modo: "libre", min: 20, cad: 100, metro: true, voz: true, sensor: false, sem: 1, hechos: 0 };
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return { ...DEF, ...(o && typeof o === "object" ? o : {}), sem: Math.min(8, Math.max(1, Number(o?.sem) || 1)), hechos: Math.max(0, Number(o?.hechos) || 0), cad: Math.max(70, Math.min(130, Number(o?.cad) || 100)) }; } catch { return { ...DEF }; } }
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {} };
/** Tras un paseo del programa: suma uno; con tres, pasa a la semana siguiente (hasta la 8). Devuelve el estado nuevo y si ha cambiado de semana o terminado. */
export function trasPaseo(o) { const h = o.hechos + 1; if (h < 3) return { o: { ...o, hechos: h }, nueva: false, fin: false }; return o.sem >= 8 ? { o: { ...o, hechos: 3 }, nueva: false, fin: true } : { o: { ...o, sem: o.sem + 1, hechos: 0 }, nueva: true, fin: false }; }

const CSS = `
.ps-dlg { width: min(680px, calc(100vw - 16px)); }
.ps-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0 0 12px; padding: 4px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--line); }
.ps-tabs button { padding: 8px 10px; min-height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--muted); font: inherit; font-weight: 700; cursor: pointer; }
.ps-tabs button[aria-selected="true"] { background: var(--accent); color: var(--surface); }
.ps-dlg button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.ps-intro { margin: 0 0 10px; color: var(--muted); }
.ps-dlg h3 { margin: 14px 0 8px; font-size: 1rem; }
.ps-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ps-chips button { padding: 8px 14px; min-height: 44px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--fg); font: inherit; font-family: var(--mono); font-weight: 700; cursor: pointer; }
.ps-chips button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.ps-sub { margin: 6px 0 0; font-size: .84rem; color: var(--muted); }
.ps-ops { display: grid; gap: 6px; margin: 12px 0 0; }
.ps-ops label { display: flex; align-items: center; gap: 10px; min-height: 40px; font-weight: 600; cursor: pointer; }
.ps-ops input { width: 20px; height: 20px; accent-color: var(--accent); }
.ps-ops small { font-weight: 400; color: var(--muted); }
.ps-semana { padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 70%); }
.ps-semana b { font-size: 1.05rem; }
.ps-semana p { margin: 4px 0 0; }
.ps-pasos8 { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin: 8px 0; padding: 0; list-style: none; }
.ps-pasos8 li { height: 8px; border-radius: 999px; background: var(--line-strong); }
.ps-pasos8 li.hecha { background: var(--accent); } .ps-pasos8 li.actual { background: var(--accent); box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent); }
.ps-barra { display: flex; height: 22px; margin: 6px 0 4px; border-radius: 999px; overflow: hidden; border: 1px solid var(--line-strong); }
.ps-barra i { display: block; height: 100%; }
.ps-barra i.k-ligero { background: var(--accent); } .ps-barra i.k-suave { background: var(--info-soft); } .ps-barra i.k-calienta, .ps-barra i.k-enfria { background: var(--surface-2); }
.ps-barra i + i { border-left: 1px solid var(--surface); }
.ps-cuida { margin: 12px 0 0; padding: 8px 12px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .9rem; }
.ps-cuida b { display: block; margin-bottom: 2px; }
.ps-cuida ul { margin: 0; padding-left: 1.1em; }
.ps-acc { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 14px 0 0; }
.ps-nota { margin: 12px 0 0; font-size: .82rem; color: var(--muted); }
.ps-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.ps-fuentes a { color: var(--accent-deep, var(--accent)); }
.ps-marcha { display: grid; justify-items: center; gap: 6px; text-align: center; }
.ps-seg { margin: 0; padding: 6px 18px; border-radius: 999px; background: var(--surface-2); font-size: 1.25rem; font-weight: 800; }
.ps-marcha[data-k="ligero"] .ps-seg { background: var(--accent); color: var(--surface); }
.ps-reloj { position: relative; width: min(240px, 62vw); aspect-ratio: 1; }
.ps-reloj svg { width: 100%; height: 100%; rotate: -90deg; }
.ps-reloj circle { fill: none; stroke-width: 9; }
.ps-reloj .f { stroke: var(--line-strong); } .ps-reloj .v { stroke: var(--accent); stroke-linecap: round; }
.ps-reloj > div { position: absolute; inset: 0; display: grid; place-content: center; }
.ps-reloj b { font-family: var(--mono); font-size: 3rem; line-height: 1; font-variant-numeric: tabular-nums; }
.ps-reloj small { color: var(--muted); }
.ps-sig { margin: 0; color: var(--muted); font-size: .92rem; min-height: 1.4em; }
.ps-cad { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.ps-cad button { width: 48px; height: 48px; border: 1.5px solid var(--line-strong); border-radius: 50%; background: var(--surface); color: var(--fg); font: inherit; font-size: 1.5rem; font-weight: 700; line-height: 1; cursor: pointer; }
.ps-cad span b { font-family: var(--mono); font-size: 1.6rem; }
.ps-pulso { width: 16px; height: 16px; border-radius: 50%; background: var(--accent); opacity: .25; }
.ps-datos { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 18px; font-size: .9rem; color: var(--muted); }
.ps-datos b { font-family: var(--mono); color: var(--fg); }
.ps-habla { width: 100%; padding: 12px; border: 2px solid var(--accent); border-radius: var(--r-md); background: var(--accent-soft); text-align: left; }
.ps-habla b { display: block; } .ps-habla p { margin: 2px 0 8px; }
.ps-habla div { display: grid; gap: 6px; }
.ps-habla button { padding: 10px 12px; min-height: 44px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
.ps-marcha .ps-acc { justify-content: center; }
.ps-marcha .ps-acc button[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.ps-cifras { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 12px; }
.ps-cifras div { padding: 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); text-align: center; }
.ps-cifras b { display: block; font-family: var(--mono); font-size: 1.6rem; line-height: 1.1; color: var(--accent-deep, var(--accent)); }
.ps-cifras small { color: var(--muted); font-size: .78rem; }
.ps-rpe { display: grid; gap: 6px; margin: 0 0 12px; }
.ps-rpe input { width: 100%; accent-color: var(--accent); }
.ps-rpe output { font-family: var(--mono); font-size: 1.4rem; font-weight: 700; }
:root[data-theme="contrast"] .ps-semana, :root[data-theme="contrast"] .ps-habla { background: var(--surface); }
@media (forced-colors: active) { .ps-reloj .v { stroke: Highlight; } .ps-barra i.k-ligero { background: Highlight; } }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .ps-marcha.suena .ps-pulso { animation: ps-late var(--ps-paso, .6s) infinite; } }
@keyframes ps-late { 0% { opacity: 1; scale: 1.25; } 60%, 100% { opacity: .25; scale: 1; } }
`;

/* --- estado de la ventana y del paseo --- */
let dlg = null, A = null, VOZ = null, O = { ...DEF }, P = null; // P = paseo en marcha
const cu = () => dlg.querySelector("#ps-cuerpo");
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const LANGS = { es: "es-ES", en: "en-GB", ca: "ca-ES", gl: "gl-ES", eu: "eu-ES" };
/** Frase para la voz: en el idioma elegido si el dispositivo tiene voz para él; si no, en español. */
function frase(k, vars) { const l = idioma(), lang = LANGS[l] || "es-ES"; if (l !== "es" && VOZ) { const v = VOZ.voz(lang); if (v.conocida && !v.voz) return { t: txDe("es", k, vars), lang: "es-ES" }; } return { t: tx(k, vars), lang }; }
const decir = (k, vars, corta = true) => { if (VOZ && O.voz) { VOZ.on = true; VOZ.decir([frase(k, vars)], { corta }); } };
const transcurrido = () => (P ? P.acum + (P.t0 ? (Date.now() - P.t0) / 1000 : 0) : 0);

function crear() {
  if (!document.getElementById("ps-css")) { const st = document.createElement("style"); st.id = "ps-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "paseo"; dlg.className = "ficha alta ps-dlg"; dlg.setAttribute("aria-labelledby", "ps-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="ps-cab-t"></p><button type="button" class="btn-sec sm" id="ps-cerrar"></button></div><div class="ficha-cuerpo" id="ps-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#ps-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => { detener(); P = null; });
  dlg.addEventListener("cancel", (ev) => { if (P && !P.fin) { ev.preventDefault(); pausar(); } }); // Escape en marcha: pausa, no cierra
  dlg.addEventListener("change", (ev) => { const i = ev.target.closest("[data-ps-op]"); if (i) { O[i.dataset.psOp] = i.checked; guardar(O); } const r = ev.target.closest("#ps-rpe"); if (r) dlg.querySelector("#ps-rpe-v").textContent = r.value; });
  dlg.addEventListener("input", (ev) => { const r = ev.target.closest("#ps-rpe"); if (r) dlg.querySelector("#ps-rpe-v").textContent = r.value; });
  dlg.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ps]"); if (!b) return;
    const a = b.dataset.ps, v = b.dataset.v;
    if (a === "modo") { O.modo = v; guardar(O); pintarPrep(); dlg.querySelector(`[data-ps="modo"][data-v="${v}"]`)?.focus(); }
    else if (a === "min") { O.min = Number(v); guardar(O); pintarPrep(); dlg.querySelector(`[data-ps="min"][data-v="${v}"]`)?.focus(); }
    else if (a === "cad") { O.cad = Number(v); guardar(O); pintarPrep(); dlg.querySelector(`[data-ps="cad"][data-v="${v}"]`)?.focus(); }
    else if (a === "sem-") { O.sem = Math.max(1, O.sem - 1); O.hechos = 0; guardar(O); pintarPrep(); }
    else if (a === "sem+") { O.sem = Math.min(8, O.sem + 1); O.hechos = 0; guardar(O); pintarPrep(); }
    else if (a === "empezar") empezar();
    else if (a === "pausa") (P.t0 ? pausar() : reanudar());
    else if (a === "cad-" || a === "cad+") { O.cad = Math.max(70, Math.min(130, O.cad + (a === "cad+" ? 5 : -5))); guardar(O); refrescar(true); }
    else if (a === "metro") { O.metro = !O.metro; guardar(O); b.setAttribute("aria-pressed", String(O.metro)); refrescar(true); }
    else if (a === "voz") { O.voz = !O.voz; guardar(O); b.setAttribute("aria-pressed", String(O.voz)); if (!O.voz) VOZ?.callar(); }
    else if (a === "habla") { const antes = O.cad; O.cad = ajusteHabla(O.cad, v); guardar(O); P.habla.push(v); P.preguntando = false; A.toast(tx("h_" + v + "_r"), { ms: 3500 }); if (O.cad !== antes) refrescar(true); pintarHabla(); }
    else if (a === "fin") terminar();
    else if (a === "guardar") guardarPaseo(true);
    else if (a === "no-guardar") guardarPaseo(false);
  });
}
/* --- preparación --- */
function planActual() { return O.modo === "prog" ? planSemana(O.sem) : planLibre(O.min); }
const barra = (plan) => { const T = duracion(plan); return `<div class="ps-barra" aria-hidden="true">${plan.map((x) => `<i class="k-${x.k}" style="width:${((x.s / T) * 100).toFixed(2)}%"></i>`).join("")}</div>`; };
function cuidados() {
  let ids = []; let pulso = false;
  try { const res = A.res(); ids = A.porquesDe(res.items.flatMap((it) => [...it.senales])); pulso = !!(res.perfil?.fc_no_valida?.length || res.perfil?.bradicardia?.length); } catch {}
  const lineas = [...(pulso ? [tx("pulso")] : []), ...ids.filter((id) => ["azucar", "tension", "calor", "agua", "sangrado"].includes(id)).slice(0, 3).map((id) => t("cuid." + id))];
  return lineas.length ? `<div class="ps-cuida"><b>${tx("cuida")}</b><ul>${lineas.map((x) => `<li>${x}</li>`).join("")}</ul></div>` : "";
}
function pintarPrep() {
  const plan = planActual(), T = Math.round(duracion(plan) / 60), L = Math.round(ligero(plan) / 60), [r, a, b] = SEMANAS[O.sem - 1];
  const chip = (k, v, txt) => `<button type="button" data-ps="${k}" data-v="${v}" aria-pressed="${String(O[k] === v)}">${txt}</button>`;
  dlg.querySelector("#ps-cab-t").textContent = tx("titulo");
  cu().innerHTML = `<div class="ps-tabs" role="tablist"><button type="button" role="tab" data-ps="modo" data-v="libre" aria-selected="${O.modo !== "prog"}">${tx("m_libre")}</button><button type="button" role="tab" data-ps="modo" data-v="prog" aria-selected="${O.modo === "prog"}">${tx("m_prog")}</button></div>
    <p class="ps-intro">${tx("intro")}</p>
    ${O.modo === "prog"
      ? `<div class="ps-semana"><b>${tx("sem_de", { n: O.sem })}</b><ol class="ps-pasos8" aria-hidden="true">${SEMANAS.map((_, i) => `<li class="${i + 1 < O.sem ? "hecha" : i + 1 === O.sem ? "actual" : ""}"></li>`).join("")}</ol><p>${r > 1 ? tx("sem_x", { r, a, b }) : tx("sem_x1", { a })}</p><p class="ps-sub">${tx("hechos", { a: Math.min(3, O.hechos) })}. ${tx("sem_sub")}</p><div class="ps-acc"><button type="button" class="btn-sec sm" data-ps="sem-"${O.sem <= 1 ? " disabled" : ""}>${tx("repetir")}</button><button type="button" class="btn-sec sm" data-ps="sem+"${O.sem >= 8 ? " disabled" : ""}>${tx("saltar")}</button></div></div>`
      : `<h3 id="ps-l-min">${tx("cuanto")}</h3><div class="ps-chips" role="group" aria-labelledby="ps-l-min">${DURACIONES.map((m) => chip("min", m, tx("min", { n: m }))).join("")}</div>`}
    <h3>${tx("plan")}</h3>${barra(plan)}<p class="ps-sub" id="ps-resumen">${tx("total", { n: T })} · ${tx("ligero_tot", { n: L })}</p>
    <h3 id="ps-l-cad">${tx("ritmo")}</h3><div class="ps-chips" role="group" aria-labelledby="ps-l-cad">${CADENCIAS.map((c) => chip("cad", c, String(c))).join("")}</div>
    <p class="ps-sub"><b>${O.cad} ${tx("ppm")}</b>: ${tx("r_" + (Math.round(O.cad / 10) * 10))}. ${tx("ritmo_x")}</p>
    <div class="ps-ops"><label><input type="checkbox" data-ps-op="metro"${O.metro ? " checked" : ""}> ${tx("metro")}</label><label><input type="checkbox" data-ps-op="voz"${O.voz ? " checked" : ""}> ${tx("voz")}</label><label><input type="checkbox" data-ps-op="sensor"${O.sensor ? " checked" : ""}> <span>${tx("sensor")}<br><small>${tx("sensor_x")}</small></span></label></div>
    ${cuidados()}
    <div class="ps-acc"><button type="button" class="btn" data-ps="empezar">${tx("empezar")}</button></div>
    <p class="ps-nota">${tx("seguridad")}</p>
    <h3>${tx("fuentes")}</h3><ul class="ps-fuentes">${FUENTES.map((f) => `<li>${f.cita}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>: ${tx("f_" + f.id)}</li>`).join("")}<li>${tx("f_prog")}</li></ul>`;
}
/* --- en marcha --- */
async function empezar() {
  const plan = planActual();
  P = { plan, total: duracion(plan), acum: 0, t0: null, i: -1, mitad: false, minuto: false, habla: [], momentos: momentosHabla(plan), preguntando: false, pasos: contarPasos([]), sensor: false, fin: false, modo: O.modo, sem: O.sem };
  // dentro del toque: sonido, permiso del sensor y pantalla encendida
  if (!navigator.webdriver) { try { P.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (P.ctx.state === "suspended") P.ctx.resume(); } catch {} }
  if (O.voz) { try { VOZ = await A.cargarVoz(); VOZ.on = true; } catch { VOZ = null; } }
  if (O.sensor) await activarSensor();
  try { P.despierta = await navigator.wakeLock?.request?.("screen"); } catch {}
  pintarMarcha(); reanudar();
  decir("v_inicio", { n: Math.round(P.total / 60) });
}
async function activarSensor() {
  try {
    if (typeof DeviceMotionEvent === "undefined") return;
    if (typeof DeviceMotionEvent.requestPermission === "function" && (await DeviceMotionEvent.requestPermission()) !== "granted") return;
    P.oyente = (ev) => { const g = ev.accelerationIncludingGravity; if (!g || g.x == null || !P || !P.t0) return; P.sensor = true; contarPasos([{ t: Date.now(), x: g.x, y: g.y, z: g.z }], P.pasos); };
    window.addEventListener("devicemotion", P.oyente);
  } catch {}
}
function pintarMarcha() {
  dlg.querySelector("#ps-cab-t").textContent = P.modo === "prog" ? `${tx("titulo")} · ${tx("sem", { n: P.sem })}` : tx("titulo");
  const C = 2 * Math.PI * 54;
  cu().innerHTML = `<div class="ps-marcha" id="ps-marcha">
    <p class="ps-seg" id="ps-seg" aria-live="polite"></p>
    <div class="ps-reloj"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="f" cx="60" cy="60" r="54"/><circle class="v" id="ps-arco" cx="60" cy="60" r="54" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg><div><b id="ps-t" role="timer">${mmss(P.total)}</b><small>${tx("quedan")}</small></div></div>
    <p class="ps-sig" id="ps-sig"></p>
    <div class="ps-cad"><button type="button" data-ps="cad-" aria-label="${tx("mas_lento")}">−</button><span><b id="ps-cad">${O.cad}</b> ${tx("ppm")}</span><button type="button" data-ps="cad+" aria-label="${tx("mas_rapido")}">+</button><span class="ps-pulso" aria-hidden="true"></span></div>
    <div class="ps-datos" id="ps-datos"${O.sensor ? "" : " hidden"}><span>${tx("pasos")} <b id="ps-pasos">0</b></span><span>${tx("medido")} <b id="ps-rm">—</b></span></div>
    <div class="ps-habla" id="ps-habla" hidden></div>
    <div class="ps-acc"><button type="button" class="btn" data-ps="pausa" id="ps-pausa">${tx("pausa")}</button><button type="button" class="btn-sec" data-ps="metro" aria-pressed="${O.metro}">${tx("metro")}</button><button type="button" class="btn-sec" data-ps="voz" aria-pressed="${O.voz}">${tx("voz")}</button><button type="button" class="btn-sec" data-ps="fin">${tx("terminar")}</button></div>
    <p class="ps-nota">${tx("seguridad")}</p></div>`;
}
function pintarHabla() {
  const el = dlg.querySelector("#ps-habla"); if (!el) return;
  el.hidden = !P.preguntando;
  el.innerHTML = P.preguntando ? `<b>${tx("habla")}</b><p>${tx("habla_p")}</p><div>${["facil", "bien", "cuesta"].map((k) => `<button type="button" data-ps="habla" data-v="${k}">${tx("h_" + k)}</button>`).join("")}</div>` : "";
  if (P.preguntando) el.scrollIntoView({ block: "nearest" });
}
function reanudar() { if (!P || P.fin || P.t0) return; P.t0 = Date.now(); P.sig = 0; P.reloj = setInterval(tic, 200); const b = dlg.querySelector("#ps-pausa"); if (b) b.textContent = tx("pausa"); tic(); }
function pausar() { if (!P || !P.t0) return; P.acum = transcurrido(); P.t0 = null; clearInterval(P.reloj); VOZ?.callar(); const b = dlg.querySelector("#ps-pausa"); if (b) b.textContent = tx("seguir"); refrescar(); }
/** Programa los clics del metrónomo con un poco de antelación (el reloj del sonido es más fino que el de la página). */
function metronomo(suena) {
  const c = P.ctx; if (!c || !suena) { if (P) P.sig = 0; return; }
  const paso = 60 / O.cad; if (!P.sig || P.sig < c.currentTime) P.sig = c.currentTime + 0.05;
  while (P.sig < c.currentTime + 0.45) {
    try { const o = c.createOscillator(), g = c.createGain(); P.lado = !P.lado; o.type = "square"; o.frequency.value = P.lado ? 880 : 660; g.gain.setValueAtTime(0.0001, P.sig); g.gain.exponentialRampToValueAtTime(0.18, P.sig + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, P.sig + 0.05); o.connect(g); g.connect(c.destination); o.start(P.sig); o.stop(P.sig + 0.07); } catch {}
    P.sig += paso;
  }
}
function refrescar(soloRitmo = false) {
  if (!P) return; const caja = dlg.querySelector("#ps-marcha"); if (!caja) return;
  const tt = Math.min(P.total, transcurrido()), x = tramoEn(P.plan, tt) || { i: P.plan.length - 1, tramo: P.plan.at(-1), resto: 0 };
  const suena = !!P.t0 && O.metro && x.tramo.k === "ligero";
  caja.classList.toggle("suena", suena); caja.style.setProperty("--ps-paso", (60 / O.cad).toFixed(3) + "s");
  dlg.querySelector("#ps-cad").textContent = O.cad;
  if (soloRitmo) { if (P) P.sig = 0; return; }
  caja.dataset.k = x.tramo.k;
  dlg.querySelector("#ps-seg").textContent = tx("k_" + x.tramo.k);
  dlg.querySelector("#ps-t").textContent = mmss(Math.ceil(P.total - tt));
  const C = 2 * Math.PI * 54; dlg.querySelector("#ps-arco").setAttribute("stroke-dashoffset", (C * (1 - tt / P.total)).toFixed(1));
  const sig = P.plan[x.i + 1];
  dlg.querySelector("#ps-sig").textContent = `${mmss(Math.ceil(x.resto))} ${tx("tramo")} · ${sig ? tx("despues", { x: tx("k_" + sig.k).toLowerCase(), n: Math.round(sig.s / 60) }) : tx("ultimo")}`;
  if (P.sensor) { dlg.querySelector("#ps-datos").hidden = false; dlg.querySelector("#ps-pasos").textContent = P.pasos.n; dlg.querySelector("#ps-rm").textContent = cadenciaMedida(P.pasos, Date.now()) ?? "—"; }
}
function tic() {
  if (!P || P.fin) return;
  const tt = transcurrido();
  if (tt >= P.total) { terminar(true); return; }
  const x = tramoEn(P.plan, tt);
  if (x.i !== P.i) { // cambio de tramo: aviso
    const primero = P.i === -1; P.i = x.i;
    if (!primero) { A.vibrar?.(x.tramo.k === "ligero" ? 200 : 80); decir({ ligero: "v_ligero", suave: "v_suave", enfria: "v_enfria", calienta: "v_suave" }[x.tramo.k], { n: Math.max(1, Math.round(x.tramo.s / 60)) }); }
  }
  if (!P.mitad && P.total >= 600 && tt >= P.total / 2) { P.mitad = true; decir("v_mitad", null, false); }
  if (!P.minuto && P.total >= 300 && P.total - tt <= 60) { P.minuto = true; decir("v_minuto", null, false); }
  if (P.momentos.length && tt >= P.momentos[0] && !P.preguntando) { P.momentos.shift(); P.preguntando = true; A.vibrar?.(60); decir("v_habla", null, false); pintarHabla(); }
  metronomo(O.metro && x.tramo.k === "ligero");
  refrescar();
}
function detener() {
  if (!P) return;
  clearInterval(P.reloj); if (P.oyente) window.removeEventListener("devicemotion", P.oyente);
  try { P.ctx?.close(); } catch {} try { P.despierta?.release?.(); } catch {}
  VOZ?.callar();
}
function terminar(completo = false) {
  if (!P || P.fin) return;
  P.acum = Math.min(P.total, transcurrido()); P.t0 = null; P.fin = true; P.completo = completo; detener();
  if (completo) { A.vibrar?.(300); if (VOZ && O.voz) { VOZ.on = true; VOZ.decir([frase("v_fin")], { corta: true }); } }
  const min = Math.round(P.acum / 60), lig = Math.round(ligeroHasta(P.plan, P.acum) / 60);
  dlg.querySelector("#ps-cab-t").textContent = tx("fin_tit");
  cu().innerHTML = `<div class="ps-cifras"><div><b id="ps-f-min">${min}</b><small>${tx("fin_min")}</small></div><div><b>${lig}</b><small>${tx("fin_lig")}</small></div><div><b>${P.sensor ? P.pasos.n : "—"}</b><small>${tx("fin_pasos")}</small></div></div>
    ${P.acum < 120 ? `<p class="ps-nota">${tx("corto")}</p><div class="ps-acc"><button type="button" class="btn" data-ps="no-guardar">${A.cerrar()}</button></div>`
      : `<div class="ps-rpe"><label for="ps-rpe">${tx("esfuerzo")}</label><output id="ps-rpe-v" for="ps-rpe">4</output><input type="range" id="ps-rpe" min="0" max="10" step="1" value="4"></div>
    <div class="ps-acc"><button type="button" class="btn" data-ps="guardar">${tx("guardar")}</button><button type="button" class="btn-sec" data-ps="no-guardar">${tx("no_guardar")}</button></div>`}
    <p class="ps-nota">${tx("seguridad")}</p>`;
  cu().scrollTop = 0;
}
function guardarPaseo(si) {
  const p = P; if (!p) { dlg.close(); return; }
  if (si) {
    const rpe = Number(dlg.querySelector("#ps-rpe")?.value) || 4, min = Math.max(1, Math.round(p.acum / 60));
    A.registrarSesion({ fecha: A.hoyISO(), tipo: "aerobico", min, rpe, sintomas: [], paseo: { cad: O.cad, ...(p.sensor ? { pasos: p.pasos.n } : {}), ...(p.habla.length ? { habla: p.habla } : {}) } });
    let aviso = tx("guardado");
    if (p.modo === "prog" && p.completo) { const r = trasPaseo(O); O = r.o; guardar(O); if (r.nueva) aviso = tx("sem_nueva", { n: O.sem }); else if (r.fin) aviso = tx("prog_fin"); }
    A.toast(`<span class="celebra">✓</span> ${aviso}`, { ms: 6000 });
  }
  dlg.close();
}
/** Abre la ventana del paseo. arg = "prog" la abre en el programa de 8 semanas. */
export function abrir(api, arg = null) {
  A = api; O = leer(); if (arg === "prog") O.modo = "prog";
  if (!dlg) crear();
  if (P) { detener(); P = null; }
  dlg.querySelector("#ps-cerrar").textContent = api.cerrar();
  pintarPrep();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#ps-cerrar").focus();
  if (navigator.webdriver) window.__paPaseo = { saltar: (s) => { if (P) { P.acum += s; tic(); } }, fijar: (s) => { if (P) { pausar(); P.acum = s; P.i = (tramoEn(P.plan, s) || { i: 0 }).i; refrescar(); } }, estado: () => (P ? { t: transcurrido(), i: P.i, fin: P.fin, preguntando: P.preguntando, cad: O.cad } : null) };
}
