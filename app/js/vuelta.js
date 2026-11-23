/* Volver tras un parón, una enfermedad o un ingreso (segunda tanda de mejoras grandes, 8). Se carga bajo demanda (data-abre="vuelta").
   Tres preguntas (por qué paró, cuánto tiempo y cómo está hoy) y una respuesta: si hoy toca esperar, consultar o volver, y con
   qué escalones: semanas de vuelta con el porcentaje de la dosis habitual, minutos de paseo, series y esfuerzo.
   Si hay un programa de 12 semanas en marcha, propone retrocederlo los pasos que tocan; si no, empezar uno.
   Estado en localStorage («medex.vuelta»): { motivo, tiempo, inicio (ISO) }.
   CONTENIDO NUEVO, PENDIENTE DE REVISIÓN CLÍNICA: los escalones y las reglas de espera son una propuesta de esta aplicación.
   Textos de la interfaz en cinco idiomas; el contenido clínico (CONT), en español. Fuentes comprobadas en PubMed (22/11/2026). */
import { t, idioma } from "./i18n.js?v=202611230120";

const TXT = {
  es: { titulo: "Volver tras un parón", borrador: "Borrador pendiente de revisión clínica", intro: "Parar pasa. Lo importante es cómo se vuelve: sin prisa y sin empezar donde lo dejó.", p_motivo: "¿Por qué paró?", p_tiempo: "¿Cuánto tiempo lleva sin entrenar?", p_hoy: "¿Cómo está hoy? Marque lo que le pase",
    m_vida: "Sin motivo de salud", m_vida_x: "viaje, trabajo, desgana…", m_infeccion: "Catarro, gripe u otra infección", m_lesion: "Una lesión o un dolor", m_ingreso: "Un ingreso o una operación", m_corazon: "Corazón o pulmón", m_corazon_x: "infarto, angina, insuficiencia cardiaca, embolia…",
    t_t1: "Menos de 2 semanas", t_t2: "De 2 a 4 semanas", t_t3: "De 1 a 3 meses", t_t4: "Más de 3 meses", ninguna: "Nada de esto",
    v_adelante: "Puede volver", v_espera: "Hoy toca esperar", v_consulta: "Antes, consulte", v_medico: "Con el visto bueno de su médico", v_indicacion: "Siga lo que le indicaron",
    perdido: "Qué ha perdido y qué no", escalones: "Su vuelta, por semanas", sem: "Semana {n}", pct: "{n} % de lo habitual", paseo: "paseo de {n} min", ser: "{n} series", ser_1: "1 serie", rpe: "esfuerzo {x}", despues: "Después", despues_x: "Su plan de siempre.", ahora: "Esta semana", empezada: "Vuelta empezada el {d}.",
    empezar: "Empezar la vuelta hoy", reiniciar: "Empezar de nuevo", guardado: "Vuelta apuntada. Su plan de siempre le espera al final.",
    acciones: "Para ponerlo en marcha", a_rato: "Una sesión suave de 10 minutos", a_programa: "Empezar el programa de 12 semanas", a_programa_x: "Nivel sugerido: {x}.", a_retro: "Retroceder mi programa {n} pasos", a_retro_1: "Retroceder mi programa 1 paso", a_retro_ini: "Volver a la semana 1 de mi programa", a_retro_x: "Está en la semana {a}; quedaría en la {b}.", a_retro_ok: "Programa en la semana {n}.", a_retro_no: "Su programa ya está donde toca (semana {n}).", a_dolor: "Abrir «Me duele…»", n_suave: "Desde la silla", n_medio: "Coger fondo",
    cuida: "Con su medicación", prox: "Para la próxima vez", fuentes: "En qué se basa",
    f_bosquet: "metanálisis de 103 estudios: al dejar el entrenamiento de fuerza se pierde fuerza, más cuanto más dura el parón, y más a partir de los 65 años y en personas poco activas.",
    f_spiering: "revisión: con una sesión por semana y una serie por ejercicio la fuerza se mantiene hasta 32 semanas en jóvenes (en mayores, hasta dos sesiones y dos o tres series); el fondo, hasta 15 semanas con dos sesiones o con 13-26 minutos por sesión, siempre que no baje la intensidad.",
    f_velilla: "ensayo con 370 personas muy mayores ingresadas (edad media, 87 años): el ingreso hizo perder capacidad funcional y un programa de ejercicio durante la estancia lo revirtió (2,2 puntos más de SPPB que la atención habitual), sin efectos adversos.",
    f_nota: "Los escalones de la vuelta y las reglas de espera son una propuesta orientativa de esta aplicación; tras un ingreso o un problema de corazón mandan las indicaciones de su equipo médico." },
  en: { titulo: "Coming back after a break", borrador: "Draft pending clinical review", intro: "Breaks happen. What matters is how you come back: unhurried, and not where you left off.", p_motivo: "Why did you stop?", p_tiempo: "How long since you last trained?", p_hoy: "How are you today? Tick what applies",
    m_vida: "No health reason", m_vida_x: "travel, work, no motivation…", m_infeccion: "A cold, flu or other infection", m_lesion: "An injury or pain", m_ingreso: "A hospital stay or an operation", m_corazon: "Heart or lung", m_corazon_x: "heart attack, angina, heart failure, embolism…",
    t_t1: "Less than 2 weeks", t_t2: "2 to 4 weeks", t_t3: "1 to 3 months", t_t4: "More than 3 months", ninguna: "None of these",
    v_adelante: "You can come back", v_espera: "Today, wait", v_consulta: "Seek advice first", v_medico: "With your doctor's go-ahead", v_indicacion: "Follow what you were told",
    perdido: "What you have lost and what you have not", escalones: "Your return, week by week", sem: "Week {n}", pct: "{n}% of your usual", paseo: "{n}-min walk", ser: "{n} sets", ser_1: "1 set", rpe: "effort {x}", despues: "After that", despues_x: "Your usual plan.", ahora: "This week", empezada: "Return started on {d}.",
    empezar: "Start the return today", reiniciar: "Start over", guardado: "Return logged. Your usual plan is waiting at the end.",
    acciones: "To get going", a_rato: "A gentle 10-minute session", a_programa: "Start the 12-week programme", a_programa_x: "Suggested level: {x}.", a_retro: "Take my programme back {n} steps", a_retro_1: "Take my programme back 1 step", a_retro_ini: "Back to week 1 of my programme", a_retro_x: "You are on week {a}; it would go to week {b}.", a_retro_ok: "Programme on week {n}.", a_retro_no: "Your programme is already where it should be (week {n}).", a_dolor: "Open “It hurts…”", n_suave: "From the chair", n_medio: "Building up",
    cuida: "With your medication", prox: "For next time", fuentes: "What it is based on",
    f_bosquet: "meta-analysis of 103 studies: stopping resistance training reduces strength, more the longer the break, and more from age 65 and in inactive people.",
    f_spiering: "review: one session a week and one set per exercise maintain strength for up to 32 weeks in younger people (in older people, up to two sessions and two or three sets); endurance, for up to 15 weeks with two sessions or 13-26 minutes per session, as long as intensity is kept.",
    f_velilla: "trial in 370 very old hospitalised people (mean age 87): the stay reduced functional capacity and an exercise programme during it reversed that (2.2 SPPB points more than usual care), with no adverse effects.",
    f_nota: "The return steps and the waiting rules are this app's own guideline proposal; after a hospital stay or a heart problem, your medical team's instructions come first." },
  ca: { titulo: "Tornar després d'una aturada", borrador: "Esborrany pendent de revisió clínica", intro: "Aturar-se passa. L'important és com es torna: sense pressa i sense començar on ho vau deixar.", p_motivo: "Per què us vau aturar?", p_tiempo: "Quant de temps fa que no entreneu?", p_hoy: "Com esteu avui? Marqueu el que us passi",
    m_vida: "Sense motiu de salut", m_vida_x: "viatge, feina, desgana…", m_infeccion: "Refredat, grip o una altra infecció", m_lesion: "Una lesió o un dolor", m_ingreso: "Un ingrés o una operació", m_corazon: "Cor o pulmó", m_corazon_x: "infart, angina, insuficiència cardíaca, embòlia…",
    t_t1: "Menys de 2 setmanes", t_t2: "De 2 a 4 setmanes", t_t3: "D'1 a 3 mesos", t_t4: "Més de 3 mesos", ninguna: "Res d'això",
    v_adelante: "Podeu tornar", v_espera: "Avui toca esperar", v_consulta: "Abans, consulteu", v_medico: "Amb el vistiplau del metge", v_indicacion: "Seguiu el que us van indicar",
    perdido: "Què heu perdut i què no", escalones: "La vostra tornada, per setmanes", sem: "Setmana {n}", pct: "{n} % de l'habitual", paseo: "passeig de {n} min", ser: "{n} sèries", ser_1: "1 sèrie", rpe: "esforç {x}", despues: "Després", despues_x: "El vostre pla de sempre.", ahora: "Aquesta setmana", empezada: "Tornada començada el {d}.",
    empezar: "Començar la tornada avui", reiniciar: "Començar de nou", guardado: "Tornada apuntada. El vostre pla de sempre us espera al final.",
    acciones: "Per posar-ho en marxa", a_rato: "Una sessió suau de 10 minuts", a_programa: "Començar el programa de 12 setmanes", a_programa_x: "Nivell suggerit: {x}.", a_retro: "Fer retrocedir el meu programa {n} passos", a_retro_1: "Fer retrocedir el meu programa 1 pas", a_retro_ini: "Tornar a la setmana 1 del meu programa", a_retro_x: "Sou a la setmana {a}; quedaria a la {b}.", a_retro_ok: "Programa a la setmana {n}.", a_retro_no: "El vostre programa ja és on toca (setmana {n}).", a_dolor: "Obrir «Em fa mal…»", n_suave: "Des de la cadira", n_medio: "Agafar fons",
    cuida: "Amb la vostra medicació", prox: "Per a la propera vegada", fuentes: "En què es basa",
    f_bosquet: "metaanàlisi de 103 estudis: en deixar l'entrenament de força es perd força, més com més dura l'aturada, i més a partir dels 65 anys i en persones poc actives.",
    f_spiering: "revisió: amb una sessió per setmana i una sèrie per exercici la força es manté fins a 32 setmanes en joves (en gent gran, fins a dues sessions i dues o tres sèries); el fons, fins a 15 setmanes amb dues sessions o amb 13-26 minuts per sessió, sempre que no baixi la intensitat.",
    f_velilla: "assaig amb 370 persones molt grans ingressades (edat mitjana, 87 anys): l'ingrés va fer perdre capacitat funcional i un programa d'exercici durant l'estada ho va revertir (2,2 punts més de SPPB que l'atenció habitual), sense efectes adversos.",
    f_nota: "Els esglaons de la tornada i les regles d'espera són una proposta orientativa d'aquesta aplicació; després d'un ingrés o d'un problema de cor manen les indicacions del vostre equip mèdic." },
  gl: { titulo: "Volver tras un parón", borrador: "Borrador pendente de revisión clínica", intro: "Parar pasa. O importante é como se volve: sen présa e sen comezar onde o deixou.", p_motivo: "Por que parou?", p_tiempo: "Canto tempo leva sen adestrar?", p_hoy: "Como está hoxe? Marque o que lle pase",
    m_vida: "Sen motivo de saúde", m_vida_x: "viaxe, traballo, desgana…", m_infeccion: "Catarro, gripe ou outra infección", m_lesion: "Unha lesión ou unha dor", m_ingreso: "Un ingreso ou unha operación", m_corazon: "Corazón ou pulmón", m_corazon_x: "infarto, anxina, insuficiencia cardíaca, embolia…",
    t_t1: "Menos de 2 semanas", t_t2: "De 2 a 4 semanas", t_t3: "De 1 a 3 meses", t_t4: "Máis de 3 meses", ninguna: "Nada disto",
    v_adelante: "Pode volver", v_espera: "Hoxe toca agardar", v_consulta: "Antes, consulte", v_medico: "Co visto e prace do seu médico", v_indicacion: "Siga o que lle indicaron",
    perdido: "Que perdeu e que non", escalones: "A súa volta, por semanas", sem: "Semana {n}", pct: "{n} % do habitual", paseo: "paseo de {n} min", ser: "{n} series", ser_1: "1 serie", rpe: "esforzo {x}", despues: "Despois", despues_x: "O seu plan de sempre.", ahora: "Esta semana", empezada: "Volta comezada o {d}.",
    empezar: "Comezar a volta hoxe", reiniciar: "Comezar de novo", guardado: "Volta apuntada. O seu plan de sempre agárdao ao final.",
    acciones: "Para poñelo en marcha", a_rato: "Unha sesión suave de 10 minutos", a_programa: "Comezar o programa de 12 semanas", a_programa_x: "Nivel suxerido: {x}.", a_retro: "Retroceder o meu programa {n} pasos", a_retro_1: "Retroceder o meu programa 1 paso", a_retro_ini: "Volver á semana 1 do meu programa", a_retro_x: "Está na semana {a}; quedaría na {b}.", a_retro_ok: "Programa na semana {n}.", a_retro_no: "O seu programa xa está onde toca (semana {n}).", a_dolor: "Abrir «Dóeme…»", n_suave: "Desde a cadeira", n_medio: "Coller fondo",
    cuida: "Coa súa medicación", prox: "Para a próxima vez", fuentes: "En que se basea",
    f_bosquet: "metanálise de 103 estudos: ao deixar o adestramento de forza pérdese forza, máis canto máis dura o parón, e máis a partir dos 65 anos e en persoas pouco activas.",
    f_spiering: "revisión: cunha sesión por semana e unha serie por exercicio a forza mantense ata 32 semanas en mozos (en maiores, ata dúas sesións e dúas ou tres series); o fondo, ata 15 semanas con dúas sesións ou con 13-26 minutos por sesión, sempre que non baixe a intensidade.",
    f_velilla: "ensaio con 370 persoas moi maiores ingresadas (idade media, 87 anos): o ingreso fixo perder capacidade funcional e un programa de exercicio durante a estadía reverteuno (2,2 puntos máis de SPPB ca a atención habitual), sen efectos adversos.",
    f_nota: "Os chanzos da volta e as regras de espera son unha proposta orientativa desta aplicación; tras un ingreso ou un problema de corazón mandan as indicacións do seu equipo médico." },
  eu: { titulo: "Etenaldi baten ondoren itzuli", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Gelditzea gertatzen da. Garrantzitsuena nola itzultzen den da: presarik gabe eta utzi zenuen lekuan hasi gabe.", p_motivo: "Zergatik gelditu zinen?", p_tiempo: "Zenbat denbora daramazu entrenatu gabe?", p_hoy: "Nola zaude gaur? Markatu gertatzen zaizuna",
    m_vida: "Osasun-arrazoirik gabe", m_vida_x: "bidaia, lana, gogorik eza…", m_infeccion: "Katarroa, gripea edo beste infekzio bat", m_lesion: "Lesio bat edo mina", m_ingreso: "Ospitaleratzea edo ebakuntza", m_corazon: "Bihotza edo birikak", m_corazon_x: "infartua, angina, bihotz-gutxiegitasuna, enbolia…",
    t_t1: "2 aste baino gutxiago", t_t2: "2-4 aste", t_t3: "1-3 hilabete", t_t4: "3 hilabete baino gehiago", ninguna: "Hauetako bat ere ez",
    v_adelante: "Itzul zaitezke", v_espera: "Gaur itxaron egin behar da", v_consulta: "Lehenik, kontsultatu", v_medico: "Zure medikuaren oniritziarekin", v_indicacion: "Jarraitu esan zizutena",
    perdido: "Zer galdu duzun eta zer ez", escalones: "Zure itzulera, astez aste", sem: "{n}. astea", pct: "ohikoaren % {n}", paseo: "{n} min-ko ibilaldia", ser: "{n} serie", ser_1: "Serie 1", rpe: "ahalegina {x}", despues: "Gero", despues_x: "Zure betiko plana.", ahora: "Aste honetan", empezada: "Itzulera {d}(e)an hasita.",
    empezar: "Hasi itzulera gaur", reiniciar: "Hasi berriro", guardado: "Itzulera idatzita. Zure betiko plana amaieran duzu zain.",
    acciones: "Martxan jartzeko", a_rato: "10 minutuko saio leun bat", a_programa: "Hasi 12 asteko programa", a_programa_x: "Proposatutako maila: {x}.", a_retro: "Atzeratu nire programa {n} urrats", a_retro_1: "Atzeratu nire programa urrats 1", a_retro_ini: "Itzuli nire programaren 1. astera", a_retro_x: "{a}. astean zaude; {b}.ean geratuko litzateke.", a_retro_ok: "Programa {n}. astean.", a_retro_no: "Zure programa dagokion lekuan dago jada ({n}. astea).", a_dolor: "Ireki «Mina dut…»", n_suave: "Aulkitik", n_medio: "Oinarria hartu",
    cuida: "Zure botikekin", prox: "Hurrengorako", fuentes: "Zertan oinarritzen den",
    f_bosquet: "103 ikerketaren metaanalisia: indar-entrenamendua uztean indarra galtzen da, etenaldia zenbat eta luzeagoa orduan eta gehiago, eta gehiago 65 urtetik aurrera eta pertsona ez-aktiboetan.",
    f_spiering: "berrikuspena: astean saio batekin eta ariketa bakoitzeko serie batekin indarra 32 aste arte mantentzen da gazteetan (adinekoetan, bi saio eta bi edo hiru serie arte); erresistentzia, 15 aste arte bi saiorekin edo saioko 13-26 minuturekin, intentsitatea jaisten ez bada.",
    f_velilla: "ospitaleratutako 370 pertsona oso adinekorekin egindako saiakuntza (batez besteko adina, 87 urte): egonaldiak gaitasun funtzionala galarazi zuen eta egonaldian egindako ariketa-programa batek hori irauli zuen (ohiko arretak baino 2,2 SPPB puntu gehiago), kontrako efekturik gabe.",
    f_nota: "Itzuleraren mailak eta itxaroteko arauak aplikazio honen proposamen orientagarria dira; ospitaleratze baten edo bihotzeko arazo baten ondoren, zure mediku-taldearen aginduek agintzen dute." },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

export const FUENTES = [
  { id: "bosquet", cita: "Bosquet L et al. Scand J Med Sci Sports 2013;23:e140-9", doi: "10.1111/sms.12047" },
  { id: "spiering", cita: "Spiering BA et al. J Strength Cond Res 2021;35:1449-58", doi: "10.1519/JSC.0000000000003964" },
  { id: "velilla", cita: "Martínez-Velilla N et al. JAMA Intern Med 2019;179:28-36", doi: "10.1001/jamainternmed.2018.4869" },
];
export const MOTIVOS = ["vida", "infeccion", "lesion", "ingreso", "corazon"];
export const TIEMPOS = ["t1", "t2", "t3", "t4"];

/* Contenido clínico (español). */
export const CONT = {
  /* ¿Cómo está hoy? d = qué implica: "consulta" (y u = urgencias si es en reposo), "espera" o "indicacion". motivos = en cuáles se pregunta. */
  hoy: [
    { id: "pecho", d: "consulta", u: true, motivos: ["infeccion", "ingreso", "corazon", "vida", "lesion"], t: "Dolor en el pecho, palpitaciones o falta de aire que antes no tenía." },
    { id: "fiebre", d: "espera", motivos: ["infeccion", "ingreso", "corazon"], t: "Ha tenido fiebre en las últimas 48 horas." },
    { id: "abajo", d: "espera", motivos: ["infeccion", "ingreso"], t: "Tos de pecho, dolores por todo el cuerpo, vómitos o diarrea." },
    { id: "agotado", d: "espera", motivos: ["infeccion", "ingreso", "corazon"], t: "Un cansancio que le obliga a acostarse durante el día." },
    { id: "herida", d: "indicacion", motivos: ["ingreso"], t: "Tiene una herida de operación sin cerrar o le dijeron que no hiciera esfuerzos." },
    { id: "mareo", d: "suave", motivos: ["infeccion", "ingreso", "corazon", "vida"], t: "Se marea al ponerse de pie." },
  ],
  veredicto: {
    adelante: "Puede volver hoy mismo, empezando por debajo de donde lo dejó y subiendo por semanas.",
    espera: "Hoy no. Vuelva cuando lleve 48 horas sin fiebre y los síntomas vayan claramente a mejor. Mientras tanto, si se encuentra con fuerzas, paseos cortos por casa.",
    consulta: "No haga ejercicio y consúltelo. Si le ocurre en reposo o no cede al parar, llame al 112.",
    medico: "Antes de volver, hable con su médico o con la unidad de rehabilitación cardiaca: le dirán desde cuándo y con qué intensidad. Los escalones de abajo son orientativos para cuando tenga su visto bueno.",
    indicacion: "Siga lo que le dijeron al alta. Mientras tanto, y si se lo han permitido, caminar y los ejercicios que no tiren de la herida.",
    mareo: "Se marea al levantarse: empiece con ejercicios sentado, levántese despacio y beba agua. Si no se le pasa en unos días, consúltelo.",
    lesion: "Si paró por una lesión o un dolor, la vuelta depende de la zona: mírelo en «Me duele…».",
  },
  perdido: {
    t1: "En menos de dos semanas apenas se pierde nada. Puede notar el primer día algo más de fatiga, nada más.",
    t2: "Entre dos y cuatro semanas la fuerza aguanta bastante; lo primero que se nota es el fondo: se cansará antes.",
    t3: "De uno a tres meses se pierde parte de la fuerza y bastante fondo, más a partir de los 65 años y si antes se movía poco.",
    t4: "Con más de tres meses conviene tomárselo casi como un comienzo, con calma. Volver compensa a cualquier edad.",
  },
  extra: {
    infeccion: "Tras una infección, la primera semana es de prueba: si reaparecen la fiebre o el cansancio, pare un par de días y retroceda un escalón.",
    ingreso: "Tras un ingreso se pierde más de lo que parece, sobre todo en las piernas. Empiece por levantarse de la silla, caminar por casa y ejercicios sentado.",
    corazon: "Lo habitual es volver dentro de un programa de rehabilitación, con la intensidad que le marquen. No se guíe por el pulso si toma fármacos que lo frenan.",
  },
  prox: "La próxima vez que no pueda entrenar, no lo deje del todo: una sesión corta por semana, con una serie de cada ejercicio, mantiene casi todo lo ganado.",
};

/* --- lógica --- */
/** Qué toca hoy. r = { motivo, checks: [ids] }. Devuelve "consulta" | "medico" | "espera" | "indicacion" | "adelante". */
export function veredicto(r) {
  const ch = (r.checks || []).map((id) => CONT.hoy.find((x) => x.id === id)).filter(Boolean);
  if (ch.some((x) => x.d === "consulta")) return "consulta";
  if (ch.some((x) => x.d === "espera")) return "espera";
  if (r.motivo === "corazon") return "medico";
  if (ch.some((x) => x.d === "indicacion")) return "indicacion";
  return "adelante";
}
/** Preguntas de «¿Cómo está hoy?» para un motivo. */
export const preguntasHoy = (motivo) => CONT.hoy.filter((x) => x.motivos.includes(motivo));
const r5 = (n) => Math.round(n / 5) * 5;
/** Escalones de la vuelta. Semanas según el tiempo parado (1 a 4), una más tras una infección y dos más tras un ingreso o un problema
    de corazón; el porcentaje sube en línea recta desde el de partida hasta el 90 %. Con fragilidad o desde los 75 años, 10 puntos menos de partida.
    Devuelve [{ n, pct, ser (series: 1, 2 o null = las habituales), rpe }]. */
export function escalones({ motivo = "vida", tiempo = "t2", fragil = false, edad = null } = {}) {
  const base = { t1: [1, 80], t2: [2, 65], t3: [3, 50], t4: [4, 40] }[tiempo] || [2, 65];
  const mas = motivo === "infeccion" ? 1 : motivo === "ingreso" || motivo === "corazon" ? 2 : 0;
  const n = base[0] + mas, ini = Math.max(30, base[1] - mas * 10 - (fragil || (edad || 0) >= 75 ? 10 : 0));
  return [...Array(n)].map((_, i) => { const pct = n === 1 ? ini : r5(ini + ((90 - ini) * i) / (n - 1)); return { n: i + 1, pct, ser: pct < 60 ? 1 : pct < 85 ? 2 : null, rpe: pct < 60 ? "3–4" : pct < 85 ? "4–5" : "5–6" }; });
}
/** Pasos que conviene retroceder en el programa de 12 semanas. */
export function pasosAtras({ motivo = "vida", tiempo = "t2" } = {}) {
  const t = { t1: 0, t2: 1, t3: 3, t4: 12 }[tiempo] ?? 1;
  return Math.min(12, t + (motivo === "infeccion" ? 1 : motivo === "ingreso" || motivo === "corazon" ? 2 : 0));
}
/** Semana de la vuelta en la que está (1…), o 0 si aún no ha empezado; n + 1 = ya la ha terminado. */
export function semanaDeVuelta(inicio, n, hoy = new Date()) {
  if (!inicio) return 0;
  const d = Math.floor((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - new Date(inicio + "T00:00")) / 864e5);
  return d < 0 ? 0 : Math.min(n + 1, Math.floor(d / 7) + 1);
}
/** Nivel del programa de 12 semanas que se sugiere al volver. */
export const nivelSugerido = ({ motivo, tiempo, fragil }) => (fragil || motivo === "ingreso" || motivo === "corazon" || tiempo === "t4" ? "suave" : "medio");

/* --- estado --- */
const CLAVE = "medex.vuelta";
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return { motivo: MOTIVOS.includes(o?.motivo) ? o.motivo : null, tiempo: TIEMPOS.includes(o?.tiempo) ? o.tiempo : null, inicio: /^\d{4}-\d\d-\d\d$/.test(o?.inicio || "") ? o.inicio : null }; } catch { return { motivo: null, tiempo: null, inicio: null }; } }
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {} };

const CSS = `
.vt-dlg { width: min(720px, calc(100vw - 16px)); }
.vt-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border: 1px dashed var(--precaucion); border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .76rem; font-weight: 700; }
.vt-intro { margin: 0 0 12px; color: var(--muted); }
.vt-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.vt-ops { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
.vt-ops button { display: grid; gap: 2px; padding: 10px 14px; min-height: 48px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
.vt-ops button small { font-weight: 400; color: var(--muted); font-size: .82rem; }
.vt-ops button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
.vt-ops.cortas { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.vt-dlg button:focus-visible, .vt-dlg input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.vt-hoy { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.vt-hoy label { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; align-items: start; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); cursor: pointer; }
.vt-hoy input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--alerta); }
.vt-hoy label:has(input:checked) { border-color: var(--precaucion); background: var(--precaucion-soft); }
.vt-ver { margin: 12px 0 0; padding: 12px 14px; border-radius: var(--r-md); border: 1.5px solid var(--info); background: var(--info-soft); color: var(--info-ink); }
.vt-ver b { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; margin-bottom: 4px; }
.vt-ver b::before { content: ""; width: 14px; height: 14px; border-radius: 50%; background: currentColor; flex: none; }
.vt-ver p { margin: 0; } .vt-ver p + p { margin-top: 6px; }
.vt-ver.espera, .vt-ver.medico, .vt-ver.indicacion { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.vt-ver.consulta { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.vt-caja { margin: 0; padding: 10px 12px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--line); font-size: .94rem; }
.vt-caja p { margin: 0; } .vt-caja p + p { margin-top: 6px; }
.vt-esc { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.vt-esc li { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 4px 12px; align-items: center; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.vt-esc li.actual { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); background: var(--accent-soft); }
.vt-esc li.hecha { opacity: .6; }
.vt-esc b { font-size: .95rem; }
.vt-esc .vt-pct { grid-row: span 2; display: grid; gap: 4px; }
.vt-esc .vt-pct strong { font-family: var(--mono); font-size: 1.5rem; line-height: 1; color: var(--accent-deep, var(--accent)); }
.vt-esc .vt-barra { height: 6px; border-radius: 999px; background: var(--line-strong); overflow: hidden; }
.vt-esc .vt-barra i { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
.vt-esc small { color: var(--fg); font-size: .88rem; }
.vt-esc .vt-chip { margin-left: 6px; padding: 1px 8px; border-radius: 999px; background: var(--accent); color: var(--surface); font-size: .7rem; font-weight: 700; }
.vt-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
.vt-accs { display: grid; gap: 8px; }
.vt-accs button { display: grid; gap: 2px; padding: 10px 14px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; font-weight: 700; text-align: left; cursor: pointer; }
.vt-accs button:hover { border-color: var(--accent); background: var(--accent-soft); }
.vt-accs button small { font-weight: 400; color: var(--muted); font-size: .84rem; }
.vt-nota { margin: 8px 0 0; font-size: .86rem; color: var(--muted); }
.vt-cuida { margin: 0; padding: 8px 12px 8px 28px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .9rem; }
.vt-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.vt-fuentes a { color: var(--accent-deep, var(--accent)); }
@media (max-width: 520px) { .vt-esc li { grid-template-columns: 78px minmax(0, 1fr); } .vt-esc .vt-pct strong { font-size: 1.25rem; } }
@media (forced-colors: active) { .vt-esc .vt-barra i { background: Highlight; } .vt-ops button[aria-pressed="true"] { border: 3px solid Highlight; } }
`;

let dlg = null, A = null, PRG = null, S = null, checks = [];
const cu = () => dlg.querySelector("#vt-cuerpo");
function crear() {
  if (!document.getElementById("vt-css")) { const st = document.createElement("style"); st.id = "vt-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "vuelta"; dlg.className = "ficha alta vt-dlg"; dlg.setAttribute("aria-labelledby", "vt-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="vt-cab-t"></p><button type="button" class="btn-sec sm" id="vt-cerrar"></button></div><div class="ficha-cuerpo" id="vt-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#vt-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("change", (ev) => { if (ev.target.closest("[data-vt-hoy]")) { checks = [...dlg.querySelectorAll("[data-vt-hoy]:checked")].map((x) => x.dataset.vtHoy); pintarResto(); } });
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-vt]"); if (!b) return;
    const a = b.dataset.vt, v = b.dataset.v;
    if (a === "motivo") { S.motivo = v; S.inicio = null; checks = []; guardar(S); pintar(); dlg.querySelector(`[data-vt="motivo"][data-v="${v}"]`)?.focus(); }
    else if (a === "tiempo") { S.tiempo = v; S.inicio = null; guardar(S); pintar(); dlg.querySelector(`[data-vt="tiempo"][data-v="${v}"]`)?.focus(); }
    else if (a === "empezar") { S.inicio = A.hoyISO(); guardar(S); A.toast(tx("guardado"), { ms: 4000 }); pintarResto(); }
    else if (a === "reiniciar") { S = { motivo: null, tiempo: null, inicio: null }; checks = []; guardar(S); pintar(); cu().scrollTop = 0; }
    else if (a === "rato") { dlg.close(); A.abrir("rato"); }
    else if (a === "programa") { dlg.close(); A.abrirPrograma(); }
    else if (a === "dolor") { dlg.close(); A.abrir("dolor"); }
    else if (a === "retro") { const r = PRG?.retroceder?.(Number(v)); if (r) { A.render(); A.toast(tx("a_retro_ok", { n: r.paso }), { ms: 4000 }); pintarResto(); } }
  });
}
function accionesHtml(k) {
  const p = PRG?.leer?.(), activo = p && !p.fin && !p.mant;
  // el programa ya retrocede solo tras dos semanas sin sesiones: esos pasos se descuentan de los que se proponen aquí
  let ya = 0; if (activo) for (let i = p.hist.length - 1; i >= 0 && ["pausa", "atras"].includes(p.hist[i].clave); i--) if (p.hist[i].clave === "atras") ya++;
  const atras = Math.max(0, pasosAtras(S) - ya);
  let prog = "";
  if (activo) { const b = Math.max(1, p.paso - atras); prog = b < p.paso ? `<button type="button" data-vt="retro" data-v="${atras}"><span>${b === 1 && atras >= 12 ? tx("a_retro_ini") : atras === 1 ? tx("a_retro_1") : tx("a_retro", { n: p.paso - b })}</span><small>${tx("a_retro_x", { a: p.paso, b })}</small></button>` : `<p class="vt-nota">${tx("a_retro_no", { n: p.paso })}</p>`; }
  else prog = `<button type="button" data-vt="programa"><span>${tx("a_programa")}</span><small>${tx("a_programa_x", { x: tx("n_" + nivelSugerido({ ...S, fragil: A.esFragil() })) })}</small></button>`;
  return `<h3>${tx("acciones")}</h3><div class="vt-accs">${k === "adelante" || k === "indicacion" ? `<button type="button" data-vt="rato"><span>${tx("a_rato")}</span></button>` : ""}${prog}${S.motivo === "lesion" ? `<button type="button" data-vt="dolor"><span>${tx("a_dolor")}</span></button>` : ""}</div>`;
}
function pintarResto() {
  const el = dlg.querySelector("#vt-resto"); if (!el || !S.motivo || !S.tiempo) return;
  const k = veredicto({ motivo: S.motivo, checks }), fragil = A.esFragil(), esc = escalones({ ...S, fragil, edad: Number(A.estado?.edad) || null });
  let aer = 30; try { aer = A.sesionDe("aerobico", { fragil, minutosAer: fragil ? 10 : 30 }).bloques[1].min; } catch {}
  const actual = semanaDeVuelta(S.inicio, esc.length), parado = k === "espera" || k === "consulta";
  let cuid = []; try { cuid = A.porquesDe(A.res().items.flatMap((it) => [...it.senales])).filter((id) => ["tension", "agua", "azucar", "equilibrio"].includes(id)).slice(0, 3); } catch {}
  el.innerHTML = `<div class="vt-ver ${k}" id="vt-ver" data-k="${k}" aria-live="polite"><b>${tx("v_" + k)}</b><p>${CONT.veredicto[k]}</p>${checks.includes("mareo") && !parado ? `<p>${CONT.veredicto.mareo}</p>` : ""}${S.motivo === "lesion" ? `<p>${CONT.veredicto.lesion}</p>` : ""}</div>
    <h3>${tx("perdido")}</h3><div class="vt-caja"><p>${CONT.perdido[S.tiempo]}</p>${CONT.extra[S.motivo] ? `<p>${CONT.extra[S.motivo]}</p>` : ""}</div>
    ${parado ? "" : `<h3>${tx("escalones")}</h3>${S.inicio ? `<p class="vt-nota">${tx("empezada", { d: new Date(S.inicio + "T12:00").toLocaleDateString(idioma(), { day: "numeric", month: "long" }) })}</p>` : ""}
    <ol class="vt-esc" id="vt-esc">${esc.map((e) => `<li class="${actual === e.n ? "actual" : actual > e.n ? "hecha" : ""}"><span class="vt-pct"><strong>${e.pct} %</strong><span class="vt-barra" aria-hidden="true"><i style="width:${e.pct}%"></i></span></span><b>${tx("sem", { n: e.n })}${actual === e.n ? `<span class="vt-chip">${tx("ahora")}</span>` : ""}</b><small>${[tx("paseo", { n: Math.max(3, Math.round((aer * e.pct) / 100)) }), e.ser === 1 ? tx("ser_1") : e.ser ? tx("ser", { n: e.ser }) : null, tx("rpe", { x: e.rpe })].filter(Boolean).join(" · ")}</small></li>`).join("")}<li class="${actual > esc.length ? "actual" : ""}"><span class="vt-pct"><strong>100 %</strong><span class="vt-barra" aria-hidden="true"><i style="width:100%"></i></span></span><b>${tx("despues")}</b><small>${tx("despues_x")}</small></li></ol>
    <div class="vt-acc">${S.inicio ? "" : `<button type="button" class="btn" data-vt="empezar">${tx("empezar")}</button>`}<button type="button" class="btn-sec" data-vt="reiniciar">${tx("reiniciar")}</button></div>
    ${accionesHtml(k)}`}
    ${cuid.length && !parado ? `<h3>${tx("cuida")}</h3><ul class="vt-cuida">${cuid.map((id) => `<li>${t("cuid." + id)}</li>`).join("")}</ul>` : ""}
    <h3>${tx("prox")}</h3><div class="vt-caja"><p>${CONT.prox}</p></div>`;
}
function pintar() {
  dlg.querySelector("#vt-cab-t").textContent = tx("titulo");
  const op = (k, v, txt, sub) => `<button type="button" data-vt="${k}" data-v="${v}" aria-pressed="${String(S[k] === v)}"><span>${txt}</span>${sub ? `<small>${sub}</small>` : ""}</button>`;
  const preg = S.motivo ? preguntasHoy(S.motivo) : [];
  cu().innerHTML = `<span class="vt-borrador">${tx("borrador")}</span><p class="vt-intro">${tx("intro")}</p>
    <h3 id="vt-l-m">${tx("p_motivo")}</h3><div class="vt-ops" role="group" aria-labelledby="vt-l-m">${MOTIVOS.map((m) => op("motivo", m, tx("m_" + m), TXT.es["m_" + m + "_x"] ? tx("m_" + m + "_x") : "")).join("")}</div>
    ${S.motivo ? `<h3 id="vt-l-t">${tx("p_tiempo")}</h3><div class="vt-ops cortas" role="group" aria-labelledby="vt-l-t">${TIEMPOS.map((x) => op("tiempo", x, tx("t_" + x))).join("")}</div>` : ""}
    ${S.motivo && S.tiempo && preg.length ? `<h3>${tx("p_hoy")}</h3><ul class="vt-hoy">${preg.map((x) => `<li><label><input type="checkbox" data-vt-hoy="${x.id}"${checks.includes(x.id) ? " checked" : ""}><span>${x.t}</span></label></li>`).join("")}</ul>` : ""}
    <div id="vt-resto"></div>
    <h3>${tx("fuentes")}</h3><ul class="vt-fuentes">${FUENTES.map((f) => `<li>${f.cita}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>: ${tx("f_" + f.id)}</li>`).join("")}<li>${tx("f_nota")}</li></ul>`;
  pintarResto();
}
/** Abre la ventana. */
export async function abrir(api) {
  A = api;
  try { PRG = await api.cargarPrograma(); } catch { PRG = null; }
  if (!dlg) crear();
  S = leer(); checks = [];
  dlg.querySelector("#vt-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#vt-cerrar").focus();
}
