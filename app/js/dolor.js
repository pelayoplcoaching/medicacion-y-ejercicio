/* «Me duele…»: el plan se adapta al dolor (segunda tanda de mejoras grandes, 7). Se carga bajo demanda (data-abre="dolor").
   1. Zona (rodilla, cadera, zona lumbar, hombro, cuello, mano o muñeca, tobillo o pie) y señales de alarma que piden consulta.
   2. Semáforo del dolor (modelo de vigilancia del dolor de Thomeé 1997 y Silbernagel 2007): hasta 2, zona segura; de 3 a 5,
      aceptable si a la mañana siguiente ha vuelto a su nivel y no va a más de una semana a otra; más de 5, demasiado.
   3. Su plan con ese dolor: qué ejercicios se quedan, cuáles se hacen de otra manera y cuáles se cambian por otro. «Adaptar mi
      plan» lo aplica (cambios de la biblioteca y versión «más fácil») y «Quitar las adaptaciones» lo deja como estaba.
   4. Cruce con la medicación: analgésicos que tapan el dolor, fármacos que debilitan los tendones, estatinas, anticoagulantes…
   5. Diario del dolor por zona, con su tendencia.
   Estado en localStorage («medex.dolor»): { zona, hist: [{ f, z, n }], aplicado: { zona, cambios, variantes } | null }.
   CONTENIDO NUEVO, PENDIENTE DE REVISIÓN CLÍNICA. Textos de la interfaz en cinco idiomas; el contenido clínico (CONT), en
   español como el resto de reglas de la aplicación. Fuentes comprobadas en PubMed (22/11/2026). */
import { idioma } from "./i18n.js?v=202611222111";

const TXT = {
  es: { titulo: "Me duele…", borrador: "Borrador pendiente de revisión clínica", intro: "Con dolor casi siempre se puede seguir moviéndose, de otra manera. Diga dónde le duele y cuánto, y le digo qué hacer con su plan.", donde: "¿Dónde le duele?",
    z_rodilla: "Rodilla", z_cadera: "Cadera", z_lumbar: "Zona lumbar", z_hombro: "Hombro", z_cuello: "Cuello", z_mano: "Mano o muñeca", z_tobillo: "Tobillo o pie",
    alarma: "Antes de nada: ¿alguna de estas?", alarma_no: "Ninguna de ellas", semaforo: "Semáforo del dolor", cuanto: "¿Cuánto duele al hacer ejercicio o justo después? (0 nada, 10 el peor imaginable)", manana: "A la mañana siguiente, ¿ha vuelto a como estaba?", sube: "¿Va a más de una semana a otra?", si: "Sí", no: "No", nose: "Aún no lo sé",
    v_verde: "Verde: adelante", v_amarillo: "Amarillo: adelante, con adaptaciones", v_rojo: "Rojo: baje la carga", v_alarma: "Hoy no: consulte", plan: "Su plan con dolor de {x}", conviene: "Lo que suele sentar bien", general: "Y además",
    a_cambia: "Cámbielo por", a_adapta: "Hágalo así", sin_cambios: "El resto de ejercicios de su plan no carga esa zona: se quedan como están.", sin_plan: "Añada su medicación para ver su plan adaptado.", aplicar: "Adaptar mi plan", quitar: "Quitar las adaptaciones", aplicado: "Plan adaptado: {a} ejercicios cambiados y {b} en su versión más fácil.", aplicado_0: "Su plan no necesita cambios para esa zona.", quitado: "Adaptaciones retiradas: su plan vuelve a como estaba.", activo: "Su plan está adaptado por dolor de {x}.", deshacer: "Deshacer",
    meds: "Con su medicación", diario: "Diario del dolor", apuntar: "Apuntar el dolor de hoy ({n})", apuntado: "Apuntado: {z}, {n} de 10.", t_sube: "Va a más: las tres últimas veces duele más que las tres anteriores.", t_baja: "Va a menos: buena señal.", t_igual: "Se mantiene estable.", t_pocos: "Con seis apuntes verá aquí si va a más o a menos.", borrar: "Borrar el último",
    fuentes: "En qué se basa", f_thomee: "ensayo en síndrome femoropatelar que introdujo el modelo de vigilancia del dolor; a los 12 meses, el 85 % hacía deporte sin dolor.", f_silbernagel: "ensayo en tendinopatía de Aquiles: seguir con la actividad vigilando el dolor no dio peor resultado que el reposo activo.", f_smith: "revisión de 7 ensayos (385 personas) en dolor musculoesquelético crónico: los ejercicios que duelen algo dan un pequeño beneficio a corto plazo y, a medio y largo plazo, lo mismo que los indoloros.",
    f_nota: "Las adaptaciones por zona son una propuesta de esta aplicación a partir de la práctica habitual; no sustituyen a la valoración de un fisioterapeuta o de su médico.", ver: "Ver" },
  en: { titulo: "It hurts…", borrador: "Draft pending clinical review", intro: "With pain you can nearly always keep moving, in a different way. Say where it hurts and how much, and I will tell you what to do with your plan.", donde: "Where does it hurt?",
    z_rodilla: "Knee", z_cadera: "Hip", z_lumbar: "Lower back", z_hombro: "Shoulder", z_cuello: "Neck", z_mano: "Hand or wrist", z_tobillo: "Ankle or foot",
    alarma: "First of all: any of these?", alarma_no: "None of them", semaforo: "Pain traffic light", cuanto: "How much does it hurt during exercise or right after? (0 nothing, 10 the worst imaginable)", manana: "By the next morning, is it back to how it was?", sube: "Is it getting worse from one week to the next?", si: "Yes", no: "No", nose: "I do not know yet",
    v_verde: "Green: go ahead", v_amarillo: "Amber: go ahead, with adaptations", v_rojo: "Red: lower the load", v_alarma: "Not today: seek advice", plan: "Your plan with {x} pain", conviene: "What usually feels good", general: "And also",
    a_cambia: "Swap it for", a_adapta: "Do it like this", sin_cambios: "The rest of your exercises do not load that area: they stay as they are.", sin_plan: "Add your medication to see your adapted plan.", aplicar: "Adapt my plan", quitar: "Remove the adaptations", aplicado: "Plan adapted: {a} exercises swapped and {b} in their easier version.", aplicado_0: "Your plan needs no changes for that area.", quitado: "Adaptations removed: your plan is back to how it was.", activo: "Your plan is adapted for {x} pain.", deshacer: "Undo",
    meds: "With your medication", diario: "Pain diary", apuntar: "Log today's pain ({n})", apuntado: "Logged: {z}, {n} out of 10.", t_sube: "Getting worse: the last three entries hurt more than the three before.", t_baja: "Getting better: a good sign.", t_igual: "Holding steady.", t_pocos: "With six entries you will see here whether it is getting better or worse.", borrar: "Delete the last one",
    fuentes: "What it is based on", f_thomee: "trial in patellofemoral pain that introduced the pain-monitoring model; at 12 months, 85% were doing sport without pain.", f_silbernagel: "trial in Achilles tendinopathy: continuing activity while monitoring pain did no worse than active rest.", f_smith: "review of 7 trials (385 people) in chronic musculoskeletal pain: exercises that hurt a little give a small short-term benefit and, in the medium and long term, the same as pain-free ones.",
    f_nota: "The adaptations by area are this app's own proposal based on common practice; they do not replace an assessment by a physiotherapist or your doctor.", ver: "See" },
  ca: { titulo: "Em fa mal…", borrador: "Esborrany pendent de revisió clínica", intro: "Amb dolor gairebé sempre es pot continuar movent-se, d'una altra manera. Digueu on us fa mal i quant, i us dic què fer amb el vostre pla.", donde: "On us fa mal?",
    z_rodilla: "Genoll", z_cadera: "Maluc", z_lumbar: "Zona lumbar", z_hombro: "Espatlla", z_cuello: "Coll", z_mano: "Mà o canell", z_tobillo: "Turmell o peu",
    alarma: "Abans de res: alguna d'aquestes?", alarma_no: "Cap d'elles", semaforo: "Semàfor del dolor", cuanto: "Quant fa mal en fer exercici o just després? (0 gens, 10 el pitjor imaginable)", manana: "L'endemà al matí, ha tornat a com estava?", sube: "Va a més d'una setmana a l'altra?", si: "Sí", no: "No", nose: "Encara no ho sé",
    v_verde: "Verd: endavant", v_amarillo: "Groc: endavant, amb adaptacions", v_rojo: "Vermell: baixeu la càrrega", v_alarma: "Avui no: consulteu", plan: "El vostre pla amb dolor de {x}", conviene: "El que sol anar bé", general: "I a més",
    a_cambia: "Canvieu-lo per", a_adapta: "Feu-lo així", sin_cambios: "La resta d'exercicis del vostre pla no carrega aquesta zona: es queden com estan.", sin_plan: "Afegiu la vostra medicació per veure el pla adaptat.", aplicar: "Adaptar el meu pla", quitar: "Treure les adaptacions", aplicado: "Pla adaptat: {a} exercicis canviats i {b} en la versió més fàcil.", aplicado_0: "El vostre pla no necessita canvis per a aquesta zona.", quitado: "Adaptacions retirades: el vostre pla torna a com estava.", activo: "El vostre pla està adaptat per dolor de {x}.", deshacer: "Desfer",
    meds: "Amb la vostra medicació", diario: "Diari del dolor", apuntar: "Apuntar el dolor d'avui ({n})", apuntado: "Apuntat: {z}, {n} de 10.", t_sube: "Va a més: les tres últimes vegades fa més mal que les tres anteriors.", t_baja: "Va a menys: bon senyal.", t_igual: "Es manté estable.", t_pocos: "Amb sis apunts veureu aquí si va a més o a menys.", borrar: "Esborrar l'últim",
    fuentes: "En què es basa", f_thomee: "assaig en síndrome femoropatel·lar que va introduir el model de vigilància del dolor; als 12 mesos, el 85 % feia esport sense dolor.", f_silbernagel: "assaig en tendinopatia d'Aquil·les: continuar amb l'activitat vigilant el dolor no va donar pitjor resultat que el repòs actiu.", f_smith: "revisió de 7 assajos (385 persones) en dolor musculoesquelètic crònic: els exercicis que fan una mica de mal donen un petit benefici a curt termini i, a mitjà i llarg termini, el mateix que els indolors.",
    f_nota: "Les adaptacions per zona són una proposta d'aquesta aplicació a partir de la pràctica habitual; no substitueixen la valoració d'un fisioterapeuta o del vostre metge.", ver: "Veure" },
  gl: { titulo: "Dóeme…", borrador: "Borrador pendente de revisión clínica", intro: "Con dor case sempre se pode seguir movéndose, doutra maneira. Diga onde lle doe e canto, e dígolle que facer co seu plan.", donde: "Onde lle doe?",
    z_rodilla: "Xeonllo", z_cadera: "Cadeira", z_lumbar: "Zona lumbar", z_hombro: "Ombreiro", z_cuello: "Pescozo", z_mano: "Man ou pulso", z_tobillo: "Nocello ou pé",
    alarma: "Antes de nada: algunha destas?", alarma_no: "Ningunha delas", semaforo: "Semáforo da dor", cuanto: "Canto doe ao facer exercicio ou xusto despois? (0 nada, 10 o peor imaxinable)", manana: "Á mañá seguinte, volveu a como estaba?", sube: "Vai a máis dunha semana a outra?", si: "Si", no: "Non", nose: "Aínda non o sei",
    v_verde: "Verde: adiante", v_amarillo: "Amarelo: adiante, con adaptacións", v_rojo: "Vermello: baixe a carga", v_alarma: "Hoxe non: consulte", plan: "O seu plan con dor de {x}", conviene: "O que adoita sentar ben", general: "E ademais",
    a_cambia: "Cámbieo por", a_adapta: "Fágao así", sin_cambios: "O resto de exercicios do seu plan non carga esa zona: quedan como están.", sin_plan: "Engada a súa medicación para ver o seu plan adaptado.", aplicar: "Adaptar o meu plan", quitar: "Quitar as adaptacións", aplicado: "Plan adaptado: {a} exercicios cambiados e {b} na súa versión máis fácil.", aplicado_0: "O seu plan non precisa cambios para esa zona.", quitado: "Adaptacións retiradas: o seu plan volve a como estaba.", activo: "O seu plan está adaptado por dor de {x}.", deshacer: "Desfacer",
    meds: "Coa súa medicación", diario: "Diario da dor", apuntar: "Apuntar a dor de hoxe ({n})", apuntado: "Apuntado: {z}, {n} de 10.", t_sube: "Vai a máis: as tres últimas veces doe máis ca as tres anteriores.", t_baja: "Vai a menos: bo sinal.", t_igual: "Mantense estable.", t_pocos: "Con seis apuntamentos verá aquí se vai a máis ou a menos.", borrar: "Borrar o último",
    fuentes: "En que se basea", f_thomee: "ensaio en síndrome femoropatelar que introduciu o modelo de vixilancia da dor; aos 12 meses, o 85 % facía deporte sen dor.", f_silbernagel: "ensaio en tendinopatía de Aquiles: seguir coa actividade vixiando a dor non deu peor resultado ca o repouso activo.", f_smith: "revisión de 7 ensaios (385 persoas) en dor musculoesquelética crónica: os exercicios que doen algo dan un pequeno beneficio a curto prazo e, a medio e longo prazo, o mesmo ca os indoloros.",
    f_nota: "As adaptacións por zona son unha proposta desta aplicación a partir da práctica habitual; non substitúen a valoración dun fisioterapeuta ou do seu médico.", ver: "Ver" },
  eu: { titulo: "Mina dut…", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Minarekin ia beti mugitzen jarraitu daiteke, beste modu batean. Esan non duzun mina eta zenbat, eta zure planarekin zer egin esango dizut.", donde: "Non duzu mina?",
    z_rodilla: "Belauna", z_cadera: "Aldaka", z_lumbar: "Gerrialdea", z_hombro: "Sorbalda", z_cuello: "Lepoa", z_mano: "Eskua edo eskumuturra", z_tobillo: "Orkatila edo oina",
    alarma: "Ezer baino lehen: hauetakoren bat?", alarma_no: "Bat ere ez", semaforo: "Minaren semaforoa", cuanto: "Zenbat min ematen du ariketa egitean edo justu ondoren? (0 ezer ez, 10 irudika daitekeen okerrena)", manana: "Hurrengo goizean, lehen bezala dago?", sube: "Astetik astera okerrera doa?", si: "Bai", no: "Ez", nose: "Oraindik ez dakit",
    v_verde: "Berdea: aurrera", v_amarillo: "Horia: aurrera, egokitzapenekin", v_rojo: "Gorria: jaitsi karga", v_alarma: "Gaur ez: kontsultatu", plan: "Zure plana {x} minarekin", conviene: "Ondo etorri ohi dena", general: "Eta gainera",
    a_cambia: "Aldatu honekin", a_adapta: "Egin horrela", sin_cambios: "Zure planeko gainerako ariketek ez dute gune hori kargatzen: dauden bezala geratzen dira.", sin_plan: "Gehitu zure botikak plan egokitua ikusteko.", aplicar: "Egokitu nire plana", quitar: "Kendu egokitzapenak", aplicado: "Plana egokituta: {a} ariketa aldatuta eta {b} bertsio errazenean.", aplicado_0: "Zure planak ez du aldaketarik behar gune horretarako.", quitado: "Egokitzapenak kenduta: zure plana lehen bezala dago.", activo: "Zure plana {x} minagatik egokituta dago.", deshacer: "Desegin",
    meds: "Zure botikekin", diario: "Minaren egunkaria", apuntar: "Idatzi gaurko mina ({n})", apuntado: "Idatzita: {z}, 10etik {n}.", t_sube: "Okerrera doa: azken hiru aldietan aurreko hiruretan baino min gehiago.", t_baja: "Hobera doa: seinale ona.", t_igual: "Egonkor mantentzen da.", t_pocos: "Sei oharrekin hemen ikusiko duzu hobera edo okerrera doan.", borrar: "Ezabatu azkena",
    fuentes: "Zertan oinarritzen den", f_thomee: "patela-femur sindromeko saiakuntza, minaren zaintza-eredua sartu zuena; 12 hilabetera, % 85ek kirola minik gabe egiten zuen.", f_silbernagel: "Akilesen tendinopatiako saiakuntza: mina zainduz jardueran jarraitzeak ez zuen atseden aktiboak baino emaitza okerragorik eman.", f_smith: "7 saiakuntzaren berrikuspena (385 pertsona) muskulu-eskeletoko min kronikoan: min pixka bat ematen duten ariketek onura txiki bat ematen dute epe laburrean eta, epe ertain eta luzean, minik gabekoek adina.",
    f_nota: "Guneko egokitzapenak aplikazio honen proposamena dira, ohiko praktikan oinarrituta; ez dute fisioterapeuta baten edo zure medikuaren balorazioa ordezkatzen.", ver: "Ikusi" },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

export const FUENTES = [
  { id: "thomee", cita: "Thomeé R. Phys Ther 1997;77:1690-703", doi: "10.1093/ptj/77.12.1690" },
  { id: "silbernagel", cita: "Silbernagel KG et al. Am J Sports Med 2007;35:897-906", doi: "10.1177/0363546506298279" },
  { id: "smith", cita: "Smith BE et al. Br J Sports Med 2017;51:1679-87", doi: "10.1136/bjsports-2016-097383" },
];
export const ZONAS = ["rodilla", "cadera", "lumbar", "hombro", "cuello", "mano", "tobillo"];

/* Contenido clínico (español). Por zona: cambia = { dibujo del ejercicio: dibujo del que lo sustituye }; adapta = { dibujo: cómo hacerlo };
   conviene = lo que suele sentar bien; general = consejos; alarma = señales propias de la zona (u: true = urgencias). */
export const CONT = {
  veredicto: {
    verde: "Hasta 2 sobre 10 es zona segura: haga su sesión normal.",
    amarillo: "De 3 a 5 es aceptable: puede entrenar, mejor con las adaptaciones de abajo. El dolor debe ir cediendo en unas horas y a la mañana siguiente estar como siempre.",
    rojo: "Es demasiado: más de 5, o no ha vuelto a su nivel a la mañana siguiente, o va a más cada semana. Baje la carga (menos repeticiones, la versión más fácil o el ejercicio alternativo) hasta volver a la zona aceptable. Si en una o dos semanas no mejora, consulte.",
    alarma: "No entrene esa zona y consúltelo con su médico. El resto del cuerpo, solo si se encuentra bien.",
    urgente: "Llame al 112 o acuda a urgencias.",
  },
  alarma: [
    { id: "golpe", t: "Empezó tras una caída o un golpe y no puede apoyar o mover la zona, o está deformada." },
    { id: "caliente", t: "La articulación está hinchada, roja y caliente, o tiene fiebre." },
    { id: "noche", t: "Duele en reposo o por la noche y no cede al cambiar de postura." },
    { id: "fuerza", t: "Ha perdido fuerza o sensibilidad, o nota un hormigueo que no se va." },
  ],
  zonas: {
    rodilla: {
      cambia: { zancada: "extension_cadera", escalon: "puente", sentadilla_pared: "rodilla", silla_rapida: "silla", levantarse_suelo: "puente", puntillas: "talones" },
      adapta: { silla: "Silla más alta (con un cojín) y ayúdese de las manos; baje solo hasta donde lo tolere.", sentadilla: "Menos recorrido: siéntese en una silla alta. Las rodillas, en la dirección de los pies.", rodilla: "Solo el tramo del movimiento que no duele, y sin peso.", bici: "Sillín alto y poca resistencia.", marcha: "En llano y con pasos cortos; por ahora, evite las cuestas abajo y las escaleras." },
      conviene: "Fortalecer la cadera y el muslo descarga la rodilla: puente de glúteo, pierna atrás y al lado, talones y bicicleta suave.",
      general: ["Caliente un par de minutos más de lo habitual.", "El frío local 10 minutos después puede aliviar; no sustituye a ajustar la carga."],
      alarma: [{ id: "bloqueo", t: "La rodilla se bloquea o le falla, o se hinchó de golpe tras un giro." }, { id: "tvp", t: "La pantorrilla está hinchada, caliente y dolorosa, sobre todo en una sola pierna.", u: true }],
    },
    cadera: {
      cambia: { zancada: "silla", sentadilla_pared: "silla", abduccion_pie: "abduccion_sentado", paso_lateral: "abduccion_sentado", levantarse_suelo: "puente", escalon: "talones" },
      adapta: { silla: "Silla más alta: que la cadera no baje por debajo de las rodillas.", sentadilla: "Menos recorrido; siéntese en una silla alta.", bisagra: "Sin peso y con poco recorrido.", puente: "Suba solo hasta donde no duela.", marcha: "Pasos más cortos y en llano; mejor varios paseos cortos que uno largo.", bici: "Sillín alto y sin resistencia." },
      conviene: "Movimiento suave y frecuente: puente bajo, abrir las rodillas sentado, bicicleta sin resistencia y paseos cortos.",
      general: ["Evite cruzar las piernas y los asientos muy bajos.", "Si usa bastón, llévelo en la mano contraria a la cadera que duele."],
      alarma: [{ id: "fractura", t: "Tras una caída no puede apoyar la pierna, o la pierna ha quedado más corta o girada hacia fuera.", u: true }],
    },
    lumbar: {
      cambia: { bisagra: "puente", remo_mancuerna: "remo_sentado", plancha: "cuadrupedia", hombro: "press_sentado", paseo_carga: "agarre", levantarse_suelo: "silla" },
      adapta: { silla: "Espalda larga; menos recorrido si tira.", sentadilla: "Espalda larga y menos recorrido; sin peso añadido.", remo: "Sentado o con la espalda apoyada, sin echar el tronco hacia atrás.", giro: "Giros pequeños y lentos, sin forzar.", giro_sentado: "Giros pequeños y lentos, sin forzar.", bocaarriba: "Solo las piernas, apoyando el talón en el suelo.", marcha: "Caminar suele aliviar: a su ritmo y en llano." },
      conviene: "Seguir activo es lo que mejor funciona: caminar, puente de glúteo y los ejercicios a cuatro patas y boca arriba.",
      general: ["Cambie de postura a menudo: ni mucho rato sentado ni mucho de pie.", "Para coger peso del suelo, acérquelo al cuerpo y doble las rodillas."],
      alarma: [{ id: "esfinter", t: "Le cuesta orinar o controlar la orina o las heces, o nota acorchada la zona de la entrepierna.", u: true }, { id: "vertebra", t: "El dolor de espalda empezó de golpe con un esfuerzo pequeño y tiene osteoporosis o toma corticoides." }, { id: "ciatica", t: "El dolor baja por la pierna por debajo de la rodilla, con debilidad en el pie." }],
    },
    hombro: {
      cambia: { hombro: "remo", elevacion_lateral: "remo_sentado", flexion_inclinada: "pared", plancha: "bocaarriba", jalon_banda: "remo" },
      adapta: { pared: "Manos más bajas que los hombros y menos recorrido.", press_sentado: "Banda suave y sin llegar a estirar del todo.", brazo: "Codo pegado al cuerpo y peso ligero.", remo: "Codos pegados al cuerpo y hombros lejos de las orejas.", remo_sentado: "Codos pegados al cuerpo y hombros lejos de las orejas.", estirar: "Suba los brazos solo hasta donde no duela.", triceps: "Codos pegados; si molesta, banda más suave." },
      conviene: "Movimientos por debajo de la altura del hombro: remo con banda suave y todo el trabajo de piernas, que no cambia.",
      general: ["No duerma sobre ese hombro mientras duela.", "Evite por ahora levantar peso por encima de la cabeza."],
      alarma: [{ id: "corazon", t: "El dolor en el hombro o el brazo izquierdo, el pecho o la mandíbula aparece con el esfuerzo y cede al parar.", u: true }],
    },
    cuello: {
      cambia: { hombro: "remo_sentado", plancha: "cuadrupedia", elevacion_lateral: "remo", jalon_banda: "remo_sentado" },
      adapta: { remo: "Hombros lejos de las orejas y mirada al frente.", remo_sentado: "Hombros lejos de las orejas y mirada al frente.", pared: "La cabeza, en línea con el cuerpo, sin adelantarla.", flexion_inclinada: "La cabeza, en línea con el cuerpo, sin adelantarla.", giro: "La cabeza acompaña al tronco: no gire el cuello hasta el límite.", giro_sentado: "La cabeza acompaña al tronco: no gire el cuello hasta el límite.", bocaarriba: "La cabeza descansa en el suelo; un cojín fino si lo necesita.", bici: "Manillar alto para no forzar el cuello." },
      conviene: "Caminar con los brazos sueltos y el remo suave con los hombros relajados.",
      general: ["Revise la altura de la pantalla y del móvil: a la altura de los ojos.", "Respire sin subir los hombros."],
      alarma: [{ id: "neuro", t: "Mareo intenso, visión doble o dificultad para hablar o tragar.", u: true }, { id: "brazo", t: "El dolor baja por el brazo con pérdida de fuerza en la mano." }],
    },
    mano: {
      cambia: { pared: "press_sentado", flexion_inclinada: "press_sentado", plancha: "bocaarriba", cuadrupedia: "bocaarriba", agarre: "estirar", remo_mancuerna: "remo_sentado", levantarse_suelo: "silla" },
      adapta: { brazo: "Con banda en lugar de botella, o sin peso.", remo: "Banda con asas o enrollada en el antebrazo, sin apretar la mano.", remo_sentado: "Banda con asas o enrollada en el antebrazo, sin apretar la mano.", jalon_banda: "Banda con asas o enrollada en el antebrazo, sin apretar la mano.", hombro: "Peso muy ligero o sin peso.", elevacion_lateral: "Sin peso.", talones: "Apoye el antebrazo en lugar de agarrar.", unpie: "Apoye el antebrazo en lugar de agarrar." },
      conviene: "Las piernas y los paseos no cambian. Abrir y cerrar la mano en agua templada suele aliviar.",
      general: ["Evite cargar bolsas con los dedos: mejor en el antebrazo o en mochila."],
      alarma: [],
    },
    tobillo: {
      cambia: { talones: "talones_sentado", puntillas: "tandem", unpie: "tandem", talonpunta: "tandem", escalon: "rodilla", zancada: "silla", paso_lateral: "abduccion_sentado", silla_rapida: "silla" },
      adapta: { marcha: "En llano, con calzado firme y en tramos cortos; estos días la bicicleta suave carga menos.", sentadilla: "El peso, en todo el pie; sin ponerse de puntillas.", silla: "El peso, en todo el pie; sin ponerse de puntillas.", estirar_gemelo: "Suave y sin rebote; no lo haga si lo que duele es el tendón de detrás del tobillo.", tandem: "Con las dos manos en el apoyo." },
      conviene: "Bicicleta suave, ejercicios sentado y todo el tren superior.",
      general: ["Calzado cerrado y con suela firme también en casa.", "Si se hincha, pierna en alto un rato después."],
      alarma: [{ id: "aquiles", t: "Notó un dolor brusco o un chasquido detrás del tobillo, como una pedrada." }, { id: "tvp", t: "La pantorrilla está hinchada, caliente y dolorosa, sobre todo en una sola pierna.", u: true }],
    },
  },
  /* Cruce con la medicación: clases (ids de la base) o señales que disparan cada aviso; {f} = fármacos de su lista; z = zonas en las que se enseña (sin z, en todas). */
  cruces: [
    { id: "analgesico", clases: ["aines", "paracetamol", "metamizol", "opioides", "analgesicos_topicos", "relajantes_musculares"], t: "Toma {f}. Los analgésicos pueden tapar el dolor mientras hacen efecto: valore el semáforo también cuando se pase y a la mañana siguiente. No tome uno solo para aguantar la sesión." },
    { id: "tendon", senales: ["tendon"], t: "{f} debilita los tendones. Un dolor nuevo en un tendón, sobre todo detrás del tobillo, no se entrena: pare y consulte." },
    { id: "estatina", senales: ["estatina", "miopatia"], t: "Con {f}, un dolor muscular en los dos lados del cuerpo, con debilidad u orina oscura, no son agujetas: pare y consulte." },
    { id: "sangrado", z: ["rodilla", "cadera", "hombro", "mano", "tobillo"], senales: ["sangrado"], t: "Con {f}, una articulación que se hincha tras un golpe o un esfuerzo puede ser un sangrado dentro de ella: consulte." },
    { id: "hueso", z: ["lumbar"], senales: ["hueso", "corticoide"], t: "Con {f}, un dolor de espalda que empieza de golpe puede ser un aplastamiento de una vértebra: consulte antes de seguir." },
    { id: "aine", senales: ["aine"], t: "Los antiinflamatorios ({f}), con calor o poca agua, cargan el riñón: beba y evite tomarlos antes de una sesión larga." },
    { id: "sedacion", clases: ["opioides", "relajantes_musculares"], t: "{f} puede dar sueño y restar reflejos: los ejercicios de equilibrio, siempre con apoyo." },
  ],
};

/* --- lógica --- */
/** Semáforo del dolor. d = { n (0-10), manana: true | false | null (¿ha vuelto a como estaba?), sube: true | false | null, alarmas: [ids], urgente }. */
export function semaforo(d) {
  if (d.alarmas?.length) return "alarma";
  if (d.n > 5 || d.manana === false || d.sube === true) return "rojo";
  return d.n >= 3 ? "amarillo" : "verde";
}
/** Señales de alarma de una zona: las generales más las propias. */
export const alarmasDe = (zona) => [...CONT.alarma, ...(CONT.zonas[zona]?.alarma || [])];
/** Qué hacer con cada ejercicio de unas sesiones para una zona. bloques: [{ nombre, pict, de?, dePict?, facil? }].
    Se mira el ejercicio que la persona tiene ahora en su plan; los que cambió esta herramienta (propios: nombres originales) se miran
    por su original, para que la lista no cambie al aplicar. Devuelve [{ nombre, clave (nombre original, la clave de «medex.cambios»),
    pict, accion: "cambia" | "adapta", por (id) | texto, facil }]. */
export function consejos(zona, bloques, propios = []) {
  const Z = CONT.zonas[zona]; if (!Z) return [];
  const vistos = new Set(), out = [];
  for (const b of bloques) {
    const mio = !!b.de && propios.includes(b.de), nombre = mio ? b.de : b.nombre, clave = b.de || b.nombre, pict = mio ? b.dePict : b.pict;
    if (!b.clave || vistos.has(clave)) continue; vistos.add(clave); // el calentamiento y la vuelta a la calma no llevan consejo propio
    // el bloque «Marcha, bici o elíptica» lleva el dibujo de la bici: se le dan los dos consejos
    const texto = pict === "bici" ? [Z.adapta.marcha, Z.adapta.bici && `En bicicleta: ${Z.adapta.bici.charAt(0).toLowerCase()}${Z.adapta.bici.slice(1)}`].filter(Boolean).join(" ") : Z.adapta[pict];
    if (Z.cambia[pict]) out.push({ nombre, clave, pict, accion: "cambia", por: Z.cambia[pict] });
    else if (texto) out.push({ nombre, clave, pict, accion: "adapta", texto, facil: !!b.facil });
  }
  return out;
}
/** Avisos por medicación para una zona. items: [{ principio: { nombre }, clase: { id }, senales: Set }]. Sin zona, todos. */
export function cruces(items, zona = null) {
  const out = [];
  for (const c of CONT.cruces) {
    if (zona && c.z && !c.z.includes(zona)) continue;
    const f = [...new Set(items.filter((it) => (c.clases && c.clases.includes(it.clase?.id)) || (c.senales && c.senales.some((s) => it.senales?.has?.(s)))).map((it) => it.principio.nombre))];
    if (f.length) out.push({ id: c.id, texto: c.t.replace("{f}", f.slice(0, 3).join(", ")), farmacos: f });
  }
  return out;
}
/** Tendencia del dolor de una zona: compara la media de los tres últimos apuntes con la de los tres anteriores. */
export function tendencia(hist, zona) {
  const v = hist.filter((x) => x.z === zona).map((x) => x.n); if (v.length < 6) return { clave: "pocos", n: v.length };
  const m = (l) => l.reduce((a, b) => a + b, 0) / l.length, d = m(v.slice(-3)) - m(v.slice(-6, -3));
  return { clave: d >= 1.5 ? "sube" : d <= -1.5 ? "baja" : "igual", dif: Math.round(d * 10) / 10 };
}
/** Cambios que «Adaptar mi plan» haría: { cambios: { nombre original: id }, variantes: { nombre: "facil" } }, sin pisar lo que la persona ya eligió. */
export function adaptacion(lista, actuales = { cambios: {}, variantes: {} }) {
  const cambios = {}, variantes = {};
  for (const c of lista) {
    if (c.accion === "cambia" && !actuales.cambios[c.clave]) cambios[c.clave] = c.por;
    if (c.accion === "adapta" && c.facil && !actuales.variantes[c.nombre]) variantes[c.nombre] = "facil";
  }
  return { cambios, variantes };
}

/* --- estado --- */
const CLAVE = "medex.dolor";
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return { zona: ZONAS.includes(o?.zona) ? o.zona : null, hist: Array.isArray(o?.hist) ? o.hist.filter((x) => ZONAS.includes(x?.z) && x.n >= 0 && x.n <= 10).slice(-120) : [], aplicado: o?.aplicado && ZONAS.includes(o.aplicado.zona) ? o.aplicado : null }; } catch { return { zona: null, hist: [], aplicado: null }; } }
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {} };
const leerJson = (k) => { try { const o = JSON.parse(localStorage.getItem(k) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; } };
const ponerJson = (k, o) => { try { if (Object.keys(o).length) localStorage.setItem(k, JSON.stringify(o)); else localStorage.removeItem(k); } catch {} };

const CSS = `
.dl-dlg { width: min(760px, calc(100vw - 16px)); }
.dl-dlg .ficha-cuerpo { max-height: calc(100dvh - 110px); }
.dl-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border: 1px dashed var(--precaucion); border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .76rem; font-weight: 700; }
.dl-intro { margin: 0 0 12px; color: var(--muted); }
.dl-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.dl-donde { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 14px; align-items: center; }
.dl-fig { width: 110px; height: auto; color: var(--line-strong); }
.dl-fig .cuerpo { fill: none; stroke: currentColor; stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
.dl-fig .p { fill: var(--surface); stroke: var(--muted); stroke-width: 2; cursor: pointer; }
.dl-fig .p.on { fill: var(--alerta); stroke: var(--alerta); }
.dl-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.dl-chips button { padding: 8px 14px; min-height: 44px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--fg); font: inherit; font-weight: 700; cursor: pointer; }
.dl-chips button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.dl-dlg button:focus-visible, .dl-dlg input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.dl-alarmas { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.dl-alarmas label { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 10px; align-items: start; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); cursor: pointer; }
.dl-alarmas input { width: 20px; height: 20px; margin: 2px 0 0; accent-color: var(--alerta); }
.dl-alarmas label:has(input:checked) { border-color: var(--alerta); background: var(--alerta-soft); }
.dl-escala { display: grid; gap: 4px; margin: 0 0 10px; }
.dl-escala input { width: 100%; accent-color: var(--accent); }
.dl-escala .dl-n { display: flex; justify-content: space-between; align-items: baseline; }
.dl-escala output { font-family: var(--mono); font-size: 1.8rem; font-weight: 700; line-height: 1; }
.dl-zonas3 { display: grid; grid-template-columns: 3fr 3fr 5fr; height: 8px; border-radius: 999px; overflow: hidden; }
.dl-zonas3 i:nth-child(1) { background: var(--info); } .dl-zonas3 i:nth-child(2) { background: var(--precaucion); } .dl-zonas3 i:nth-child(3) { background: var(--alerta); }
.dl-preg { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; margin: 8px 0 0; }
.dl-preg span { font-weight: 600; }
.dl-seg { display: inline-flex; border: 1.5px solid var(--line-strong); border-radius: 999px; overflow: hidden; }
.dl-seg button { padding: 6px 14px; min-height: 38px; border: 0; background: var(--surface); color: var(--fg); font: inherit; font-size: .9rem; cursor: pointer; }
.dl-seg button + button { border-left: 1px solid var(--line-strong); }
.dl-seg button[aria-pressed="true"] { background: var(--accent); color: var(--surface); font-weight: 700; }
.dl-ver { margin: 12px 0 0; padding: 12px 14px; border-radius: var(--r-md); border: 1.5px solid var(--info); background: var(--info-soft); color: var(--info-ink); }
.dl-ver b { display: flex; align-items: center; gap: 8px; font-size: 1.05rem; margin-bottom: 4px; }
.dl-ver b::before { content: ""; width: 14px; height: 14px; border-radius: 50%; background: currentColor; flex: none; }
.dl-ver p { margin: 0; }
.dl-ver.amarillo { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.dl-ver.rojo, .dl-ver.alarma { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.dl-plan { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.dl-plan li { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 4px 12px; align-items: center; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.dl-plan .picto { grid-row: span 2; }
.dl-plan b { font-size: .95rem; line-height: 1.25; }
.dl-plan small { font-size: .86rem; line-height: 1.35; color: var(--fg); }
.dl-plan small em { font-style: normal; font-family: var(--mono); font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep, var(--accent)); margin-right: 6px; }
.dl-plan .dl-ok { color: var(--info-ink); font-weight: 800; }
.dl-plan li.cambia { border-left: 4px solid var(--precaucion); } .dl-plan li.adapta { border-left: 4px solid var(--info); }
.dl-plan .dl-por { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px 2px 2px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface-2); color: var(--fg); font: inherit; font-size: .86rem; font-weight: 700; cursor: pointer; vertical-align: middle; }
.dl-plan .dl-por .picto { width: 30px; height: 30px; flex-basis: 30px; border-radius: 50%; padding: 2px; }
.dl-nota { margin: 8px 0 0; font-size: .86rem; color: var(--muted); }
.dl-caja { margin: 8px 0 0; padding: 10px 12px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--line); font-size: .92rem; }
.dl-caja ul { margin: 4px 0 0; padding-left: 1.1em; }
.dl-activo { margin: 0 0 10px; padding: 10px 12px; border-radius: var(--r-md); border: 1.5px solid var(--accent); background: var(--accent-soft); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-weight: 600; }
.dl-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
.dl-meds { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.dl-meds li { padding: 8px 12px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .92rem; }
.dl-graf { display: flex; align-items: flex-end; gap: 4px; height: 64px; margin: 8px 0 4px; padding: 0 2px; border-bottom: 1px solid var(--line-strong); }
.dl-graf i { flex: 1 1 0; max-width: 22px; min-height: 3px; border-radius: 4px 4px 0 0; background: var(--info); }
.dl-graf i.m { background: var(--precaucion); } .dl-graf i.a { background: var(--alerta); }
.dl-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.dl-fuentes a { color: var(--accent-deep, var(--accent)); }
:root[data-theme="contrast"] .dl-activo { background: var(--surface); }
@media (max-width: 520px) { .dl-donde { grid-template-columns: 80px minmax(0, 1fr); } .dl-fig { width: 80px; } }
@media (forced-colors: active) { .dl-fig .p.on { fill: Highlight; } .dl-graf i { background: CanvasText; } .dl-zonas3 i { border: 1px solid CanvasText; } }
`;

/* Figura de frente: un punto (o dos) por zona. */
const PUNTOS = { cuello: [[60, 40]], hombro: [[38, 50], [82, 50]], lumbar: [[60, 98]], cadera: [[48, 116], [72, 116]], mano: [[24, 122], [96, 122]], rodilla: [[50, 162], [70, 162]], tobillo: [[50, 206], [70, 206]] };
const figura = (zona) => `<svg class="dl-fig" viewBox="0 0 120 224" aria-hidden="true" focusable="false"><circle class="cuerpo" cx="60" cy="20" r="13"/><path class="cuerpo" d="M60 34v10M38 50h44M38 50l-12 36-2 34M82 50l12 36 2 34M44 50l2 62h28l2-62M50 112v50l0 44M70 112v50l0 44"/>${ZONAS.flatMap((z) => PUNTOS[z].map(([x, y]) => `<circle class="p${z === zona ? " on" : ""}" data-dl="zona" data-v="${z}" cx="${x}" cy="${y}" r="${z === zona ? 8 : 6}"/>`)).join("")}</svg>`;

let dlg = null, A = null, BIB = null, S = null, D = { n: 3, manana: null, sube: null, alarmas: [] };
const cu = () => dlg.querySelector("#dl-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function crear() {
  if (!document.getElementById("dl-css")) { const st = document.createElement("style"); st.id = "dl-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "dolor"; dlg.className = "ficha dl-dlg"; dlg.setAttribute("aria-labelledby", "dl-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="dl-cab-t"></p><button type="button" class="btn-sec sm" id="dl-cerrar"></button></div><div class="ficha-cuerpo" id="dl-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#dl-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("input", (ev) => { if (ev.target.id === "dl-n") { D.n = Number(ev.target.value); dlg.querySelector("#dl-n-v").textContent = D.n; pintarVeredicto(); const b = dlg.querySelector('[data-dl="apuntar"]'); if (b) b.textContent = tx("apuntar", { n: D.n }); } });
  dlg.addEventListener("change", (ev) => { const i = ev.target.closest("[data-dl-alarma]"); if (i) { D.alarmas = [...dlg.querySelectorAll("[data-dl-alarma]:checked")].map((x) => x.dataset.dlAlarma); pintarVeredicto(); } });
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-dl]"); if (!b) return;
    const a = b.dataset.dl, v = b.dataset.v;
    if (a === "zona") { S.zona = v; guardar(S); D = { n: D.n, manana: null, sube: null, alarmas: [] }; pintar(); dlg.querySelector(`button[data-dl="zona"][data-v="${v}"]`)?.focus(); }
    else if (a === "manana" || a === "sube") { D[a] = v === "si" ? true : v === "no" ? false : null; b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); pintarVeredicto(); }
    else if (a === "aplicar") aplicar();
    else if (a === "quitar") quitar();
    else if (a === "apuntar") { S.hist.push({ f: A.hoyISO(), z: S.zona, n: D.n }); S.hist = S.hist.slice(-120); guardar(S); A.toast(tx("apuntado", { z: tx("z_" + S.zona), n: D.n }), { ms: 3000 }); pintarDiario(); }
    else if (a === "borrar") { const i = S.hist.map((x) => x.z).lastIndexOf(S.zona); if (i >= 0) { S.hist.splice(i, 1); guardar(S); pintarDiario(); } }
    else if (a === "ver") { const e = BIB?.porId(v); if (e) A.abrirEjercicio(e.nombre); }
  });
}
/** Ejercicios de todas las sesiones del plan de la persona (sin repetir). */
function bloquesPlan() {
  try { const f = A.esFragil(), tipos = [...new Set(Object.values(A.planActual()))].filter((x) => x && x !== "descanso"); return tipos.flatMap((tp) => A.sesionDe(tp, { fragil: f, minutosAer: f ? 10 : 30 }).bloques); } catch { return []; }
}
function aplicar() {
  if (S.aplicado) quitar(true);
  const ad = adaptacion(consejos(S.zona, bloquesPlan()), { cambios: leerJson("medex.cambios"), variantes: leerJson("medex.variantes") });
  ponerJson("medex.cambios", { ...leerJson("medex.cambios"), ...ad.cambios }); ponerJson("medex.variantes", { ...leerJson("medex.variantes"), ...ad.variantes });
  S.aplicado = { zona: S.zona, cambios: Object.keys(ad.cambios), variantes: Object.keys(ad.variantes) }; guardar(S); A.render(); pintar();
  const n = S.aplicado.cambios.length, m = S.aplicado.variantes.length;
  A.toast(n + m ? tx("aplicado", { a: n, b: m }) : tx("aplicado_0"), n + m ? { accion: tx("deshacer"), onAccion: () => quitar(), ms: 7000 } : { ms: 4000 });
}
/** Retira solo lo que puso «Adaptar mi plan» (si la persona cambió algo después a mano, eso se respeta). */
function quitar(callado = false) {
  const ap = S.aplicado; if (!ap) return;
  const cam = leerJson("medex.cambios"), vars = leerJson("medex.variantes"), Z = CONT.zonas[ap.zona];
  for (const n of ap.cambios || []) if (Object.values(Z.cambia).includes(cam[n])) delete cam[n];
  for (const n of ap.variantes || []) if (vars[n] === "facil") delete vars[n];
  ponerJson("medex.cambios", cam); ponerJson("medex.variantes", vars);
  S.aplicado = null; guardar(S);
  if (!callado) { A.render(); pintar(); A.toast(tx("quitado"), { ms: 4000 }); }
}
function pintarVeredicto() {
  const el = dlg.querySelector("#dl-ver"); if (!el) return;
  const k = semaforo(D), urg = D.alarmas.some((id) => alarmasDe(S.zona).find((x) => x.id === id)?.u);
  el.className = "dl-ver " + k; el.dataset.k = k;
  el.innerHTML = `<b>${tx("v_" + k)}</b><p>${CONT.veredicto[k]}${urg ? ` <strong>${CONT.veredicto.urgente}</strong>` : ""}</p>`;
}
function pintarDiario() {
  const el = dlg.querySelector("#dl-diario"); if (!el) return;
  const v = S.hist.filter((x) => x.z === S.zona).slice(-14), tn = tendencia(S.hist, S.zona);
  el.innerHTML = `${v.length ? `<div class="dl-graf" role="img" aria-label="${tx("diario")}: ${v.map((x) => x.n).join(", ")}">${v.map((x) => `<i class="${x.n > 5 ? "a" : x.n >= 3 ? "m" : ""}" style="height:${Math.max(5, x.n * 10)}%" title="${x.f}: ${x.n}"></i>`).join("")}</div>` : ""}
    <p class="dl-nota" id="dl-tend">${tx("t_" + tn.clave)}</p>
    <div class="dl-acc"><button type="button" class="btn-sec" data-dl="apuntar">${tx("apuntar", { n: D.n })}</button>${v.length ? `<button type="button" class="btn-sec sm" data-dl="borrar">${tx("borrar")}</button>` : ""}</div>`;
}
function pintar() {
  dlg.querySelector("#dl-cab-t").textContent = tx("titulo");
  const z = S.zona, Z = z ? CONT.zonas[z] : null;
  const chips = `<div class="dl-chips" role="group" aria-labelledby="dl-l-zona">${ZONAS.map((k) => `<button type="button" data-dl="zona" data-v="${k}" aria-pressed="${String(z === k)}">${tx("z_" + k)}</button>`).join("")}</div>`;
  let cuerpo = `<span class="dl-borrador">${tx("borrador")}</span><p class="dl-intro">${tx("intro")}</p>
    ${S.aplicado ? `<div class="dl-activo"><span>${tx("activo", { x: tx("z_" + S.aplicado.zona).toLowerCase() })}</span><button type="button" class="btn-sec sm" data-dl="quitar">${tx("quitar")}</button></div>` : ""}
    <h3 id="dl-l-zona">${tx("donde")}</h3><div class="dl-donde">${figura(z)}${chips}</div>`;
  if (Z) {
    const mio = S.aplicado?.zona === z ? S.aplicado : null, lista = consejos(z, bloquesPlan(), S.aplicado?.cambios || []);
    const hecho = (c) => !!mio && (c.accion === "cambia" ? mio.cambios.includes(c.clave) : mio.variantes.includes(c.nombre));
    let cz = []; try { cz = cruces(A.res().items, z); } catch {}
    const seg = (k) => `<span class="dl-seg" role="group">${[["si", tx("si")], ["no", tx("no")], ["nose", tx("nose")]].map(([v, txt]) => `<button type="button" data-dl="${k}" data-v="${v}" aria-pressed="${String(D[k] === (v === "si" ? true : v === "no" ? false : null))}">${txt}</button>`).join("")}</span>`;
    cuerpo += `<h3>${tx("alarma")}</h3><ul class="dl-alarmas">${alarmasDe(z).map((x) => `<li><label><input type="checkbox" data-dl-alarma="${x.id}"${D.alarmas.includes(x.id) ? " checked" : ""}><span>${x.t}</span></label></li>`).join("")}</ul>
      <h3>${tx("semaforo")}</h3>
      <div class="dl-escala"><label for="dl-n">${tx("cuanto")}</label><div class="dl-n"><output id="dl-n-v" for="dl-n">${D.n}</output></div><input type="range" id="dl-n" min="0" max="10" step="1" value="${D.n}"><div class="dl-zonas3" aria-hidden="true"><i></i><i></i><i></i></div></div>
      <div class="dl-preg"><span>${tx("manana")}</span>${seg("manana")}</div><div class="dl-preg"><span>${tx("sube")}</span>${seg("sube")}</div>
      <div id="dl-ver" class="dl-ver" aria-live="polite"></div>
      <h3>${tx("plan", { x: tx("z_" + z).toLowerCase() })}</h3>
      ${lista.length ? `<ol class="dl-plan" id="dl-plan">${lista.map((c) => { const e = c.accion === "cambia" ? BIB?.porId(c.por) : null; return `<li class="${c.accion}${hecho(c) ? " hecho" : ""}">${A.dibujo(c.pict)}<b>${esc(c.nombre)}${hecho(c) ? ' <span class="dl-ok" aria-hidden="true">✓</span>' : ""}</b><small><em>${tx("a_" + c.accion)}</em>${e ? `<button type="button" class="dl-por" data-dl="ver" data-v="${e.id}" aria-label="${tx("ver")}: ${esc(e.nombre)}">${A.dibujo(e.id)}${esc(e.nombre)}</button>` : esc(c.texto || "")}</small></li>`; }).join("")}</ol><p class="dl-nota">${tx("sin_cambios")}</p>
        <div class="dl-acc">${mio ? `<button type="button" class="btn-sec" data-dl="quitar">${tx("quitar")}</button>` : `<button type="button" class="btn" data-dl="aplicar">${tx("aplicar")}</button>`}</div>` : `<p class="dl-nota">${tx("sin_cambios")}</p>`}
      <div class="dl-caja"><b>${tx("conviene")}</b><br>${Z.conviene}${Z.general.length ? `<ul>${Z.general.map((g) => `<li>${g}</li>`).join("")}</ul>` : ""}</div>
      ${cz.length ? `<h3>${tx("meds")}</h3><ul class="dl-meds" id="dl-meds">${cz.map((c) => `<li>${esc(c.texto)}</li>`).join("")}</ul>` : ""}
      <h3>${tx("diario")}</h3><div id="dl-diario"></div>`;
  }
  cuerpo += `<h3>${tx("fuentes")}</h3><ul class="dl-fuentes">${FUENTES.map((f) => `<li>${f.cita}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>: ${tx("f_" + f.id)}</li>`).join("")}<li>${tx("f_nota")}</li></ul>`;
  cu().innerHTML = cuerpo;
  if (Z) { pintarVeredicto(); pintarDiario(); }
}
/** Abre la ventana. arg = zona para abrirla ya elegida. */
export async function abrir(api, arg = null) {
  A = api;
  try { BIB = await api.cargarBiblio(); } catch { BIB = null; }
  if (!dlg) crear();
  S = leer(); if (ZONAS.includes(arg)) S.zona = arg;
  D = { n: 3, manana: null, sube: null, alarmas: [] };
  dlg.querySelector("#dl-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#dl-cerrar").focus();
}
