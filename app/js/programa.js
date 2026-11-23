/* Programa de 12 semanas que progresa solo (segunda tanda de mejoras grandes, 3). Se carga bajo demanda (y al arrancar si hay
   un programa en marcha). Tres niveles y tres fases (adaptación, construcción, consolidación); cada semana fija cuántas
   sesiones, cuántos minutos de paseo, cuántas series y con qué esfuerzo. Cada lunes mira la semana anterior en el diario y
   decide: subir un paso, repetir, o retroceder tras un parón. Cierra con una revisión guiada.
   Estado en localStorage («medex.programa»): { v, nivel, paso (1-12), lunes (ISO del lunes de la semana en curso del programa),
   hist: [{ lunes, paso, ses, obj, min, rpe, clave }], fin, mant, ciclo, creado }.
   CONTENIDO NUEVO, PENDIENTE DE REVISIÓN CLÍNICA: las tablas de dosis y las reglas de decisión son una propuesta elaborada a
   partir de las recomendaciones citadas en FUENTES (comprobadas en PubMed); no salen de un estudio concreto. */
import { idioma } from "./i18n.js?v=202611231104";
import { tC } from "./tr.js?v=202611231104";

const TXT = {
  es: { titulo: "Programa de 12 semanas", borrador: "Borrador pendiente de revisión clínica", intro: "De menos a más y a su ritmo: cada semana, un poco más de paseo y de fuerza. El programa mira su diario y decide solo si toca subir, repetir o aflojar.",
    elegir: "Elija por dónde empezar", n_suave: "Desde la silla", n_suave_x: "Para empezar con calma: paseos de 5 minutos y una serie de cada ejercicio. Termina en 20 minutos y dos series.", n_medio: "Coger fondo", n_medio_x: "Si ahora se mueve poco: de 10 a 30 minutos de paseo y de una a tres series.", n_activo: "Subir un escalón", n_activo_x: "Si ya hace ejercicio casi todas las semanas: de 20 a 45 minutos y hasta tres series, con versiones más difíciles.",
    recomendado: "Recomendado", rec_suave: "Por su nivel de forma actual.", rec_activo: "Por lo que hay en su diario de las últimas semanas.", rec_medio: "Es el punto de partida habitual.",
    empezar: "Empezar el programa", empieza_hoy: "La semana 1 es esta.", empieza_lunes: "La semana 1 empieza el lunes {d}. Hasta entonces puede ir probando las sesiones.", volver: "Volver",
    fase: "Fase {n}", fase_1: "Adaptación", fase_2: "Construcción", fase_3: "Consolidación", fase_1_x: "Aprender los ejercicios y coger la costumbre, con esfuerzo suave.", fase_2_x: "Más minutos y más series, con esfuerzo moderado.", fase_3_x: "Se mantiene el volumen y sube la dificultad.", semanas: "semanas {a}–{b}",
    sem_de: "Semana {n} de 12", descarga: "Descarga", pruebas: "Pruebas", previa: "Empieza el lunes", mant: "Mantenimiento", programa: "Programa",
    obj_ses: "{n} sesiones", obj_ses_1: "1 sesión", obj_aer: "paseo de {n} min", obj_ser: "{n} series", obj_ser_1: "1 serie", obj_rpe: "esfuerzo {a}–{b} de 10", obj_min: "unos {n} min",
    esta: "Esta semana", lleva: "Sesiones hechas: {a}. Objetivo: {b}.", hint_dificil: "Pruebe la versión «más difícil» en dos ejercicios.", hint_descarga: "Semana más ligera a propósito, para asimilar lo trabajado.", hint_pruebas: "Semana de pruebas: repita las pruebas de forma física y compare.", hint_mant: "Se mantienen las dosis de la semana 11.",
    v_avanza: "Sube un paso", v_avanza_x: "Sesiones hechas: {a} (objetivo: {b}). Pasa a la semana {n}.", v_poco: "Se repite", v_poco_x: "Sesiones hechas: {a} (objetivo: {b}). Sin prisa: la semana {n} se repite.", v_duro: "Se repite", v_duro_x: "El esfuerzo medio fue de {r} sobre 10, alto para subir. La semana {n} se repite.",
    v_sintomas: "Se repite", v_sintomas_x: "Apuntó mareo, palpitaciones, dolor en el pecho, bajada de azúcar o sangrado. No se sube; si se repite, coméntelo con su médico. Si tuvo dolor en el pecho, o palpitaciones con mareo, consulte antes de la próxima sesión.", v_pausa: "En pausa", v_pausa_x: "Semana sin sesiones. Se retoma donde estaba.", v_atras: "Un paso atrás", v_atras_x: "Dos semanas o más sin sesiones: se retoma en la semana {n}.", v_fin: "Programa completado", v_fin_x: "Ha terminado las 12 semanas.", v_vuelta: "Vuelta tras un parón", v_vuelta_x: "Retrocedido a la semana {n} para volver poco a poco.",
    anterior: "La semana pasada", como: "Cómo decide el programa", regla_1: "Cada lunes mira la semana anterior en su diario.", regla_2: "Si hizo al menos dos de cada tres sesiones previstas y el esfuerzo medio no llegó a 7,5 sobre 10, sube un paso.", regla_3: "Si hizo menos sesiones, o el esfuerzo fue de 7,5 o más, la semana se repite.", regla_4: "Si apuntó mareo, palpitaciones, dolor en el pecho, bajada de azúcar o sangrado, no sube.", regla_5: "Una semana sin sesiones no cambia nada. A partir de la segunda seguida, retrocede un paso por semana.",
    tabla: "Las 12 semanas", hecha: "Hecha", actual: "En curso", historial: "Lo que ha pasado", h_sem: "Semana {n}", h_ses: "sesiones: {a} (objetivo: {b})", h_min: "{n} min",
    cambiar_nivel: "Cambiar de nivel", dejar: "Dejar el programa", dejado: "Programa retirado. Su plan vuelve a las dosis de siempre.", deshacer: "Deshacer", empezado: "Programa en marcha: {x}",
    rev_tit: "Revisión de las 12 semanas", rev_intro: "Ha completado el programa. Mire lo conseguido y decida cómo seguir.", rev_semanas: "semanas", rev_ses: "sesiones", rev_min: "minutos", rev_ini: "Al empezar", rev_fin: "Al terminar", rev_min_sem: "{n} min por semana", rev_rpe: "esfuerzo medio {r}",
    rev_pruebas: "Repita ahora las pruebas de forma física para compararlas con las del principio.", rev_pruebas_btn: "Hacer las pruebas", rev_sig: "¿Y ahora?", sig_subir: "Otro ciclo, un nivel más", sig_subir_x: "Semana 1 del nivel «{x}».", sig_repetir: "Repetir este nivel", sig_repetir_x: "Otras 12 semanas con las mismas dosis.", sig_mant: "Mantener lo conseguido", sig_mant_x: "Se queda con las dosis de la semana 11, sin subir más.",
    fuentes: "En qué se basa", fuentes_x: "La progresión es una propuesta elaborada a partir de estas recomendaciones; las cifras de cada semana no salen de un estudio concreto. Las semanas de descarga son una práctica habitual del entrenamiento, sin ensayos que fijen cuándo ponerlas.",
    f_garber: "progresar poco a poco en intensidad y volumen puede reducir los riesgos; 150 min a la semana, fuerza 2–3 días y equilibrio.", f_acsm09: "para empezar, cargas que permitan 8–12 repeticiones, 2–3 días por semana; subir la carga un 2–10 % cuando sobran una o dos repeticiones.", f_fragala: "recomendaciones de entrenamiento de fuerza en personas mayores.", f_izquierdo: "consenso internacional de ejercicio en personas mayores (ICFSR).", f_bull: "150–300 min semanales de actividad moderada y fuerza para todas las edades.", f_casas: "ensayo del programa Vivifrail, de tres meses: 1,40 puntos más en la prueba SPPB que el grupo de control.",
    ver: "Ver el programa", ver_rev: "Ver la revisión", serie_chip: "programa" },
  en: { titulo: "12-week programme", borrador: "Draft pending clinical review", intro: "From less to more, at your own pace: a little more walking and strength work each week. The programme reads your diary and decides by itself whether to step up, repeat or ease off.",
    elegir: "Choose where to start", n_suave: "From the chair", n_suave_x: "A gentle start: 5-minute walks and one set of each exercise. It ends at 20 minutes and two sets.", n_medio: "Building up", n_medio_x: "If you move little now: from 10 to 30 minutes of walking and from one to three sets.", n_activo: "One step up", n_activo_x: "If you already exercise most weeks: from 20 to 45 minutes and up to three sets, with harder versions.",
    recomendado: "Recommended", rec_suave: "Because of your current fitness level.", rec_activo: "Because of what your diary shows for the last few weeks.", rec_medio: "It is the usual starting point.",
    empezar: "Start the programme", empieza_hoy: "Week 1 is this week.", empieza_lunes: "Week 1 starts on Monday {d}. Until then you can try the sessions.", volver: "Back",
    fase: "Phase {n}", fase_1: "Adaptation", fase_2: "Building", fase_3: "Consolidation", fase_1_x: "Learn the exercises and build the habit, at a gentle effort.", fase_2_x: "More minutes and more sets, at a moderate effort.", fase_3_x: "Volume holds and difficulty goes up.", semanas: "weeks {a}–{b}",
    sem_de: "Week {n} of 12", descarga: "Deload", pruebas: "Tests", previa: "Starts on Monday", mant: "Maintenance", programa: "Programme",
    obj_ses: "{n} sessions", obj_ses_1: "1 session", obj_aer: "{n}-min walk", obj_ser: "{n} sets", obj_ser_1: "1 set", obj_rpe: "effort {a}–{b} out of 10", obj_min: "about {n} min",
    esta: "This week", lleva: "Sessions done: {a}. Target: {b}.", hint_dificil: "Try the “harder” version in two exercises.", hint_descarga: "A lighter week on purpose, to absorb the work done.", hint_pruebas: "Test week: repeat the fitness tests and compare.", hint_mant: "Week-11 doses are kept.",
    v_avanza: "One step up", v_avanza_x: "Sessions done: {a} (target: {b}). On to week {n}.", v_poco: "Repeated", v_poco_x: "Sessions done: {a} (target: {b}). No rush: week {n} is repeated.", v_duro: "Repeated", v_duro_x: "Average effort was {r} out of 10, too high to step up. Week {n} is repeated.",
    v_sintomas: "Repeated", v_sintomas_x: "You logged dizziness, palpitations, chest pain, low blood sugar or bleeding. No step up; if it happens again, tell your doctor. If you had chest pain, or palpitations with dizziness, seek advice before your next session.", v_pausa: "Paused", v_pausa_x: "A week with no sessions. It picks up where it was.", v_atras: "One step back", v_atras_x: "Two or more weeks with no sessions: it picks up at week {n}.", v_fin: "Programme completed", v_fin_x: "You have finished the 12 weeks.", v_vuelta: "Back after a break", v_vuelta_x: "Taken back to week {n} to return gradually.",
    anterior: "Last week", como: "How the programme decides", regla_1: "Every Monday it looks at the previous week in your diary.", regla_2: "If you did at least two out of three planned sessions and average effort stayed below 7.5 out of 10, it steps up.", regla_3: "If you did fewer sessions, or effort was 7.5 or more, the week is repeated.", regla_4: "If you logged dizziness, palpitations, chest pain, low blood sugar or bleeding, it does not step up.", regla_5: "One week with no sessions changes nothing. From the second in a row, it goes back one step per week.",
    tabla: "The 12 weeks", hecha: "Done", actual: "Current", historial: "What has happened", h_sem: "Week {n}", h_ses: "sessions: {a} (target: {b})", h_min: "{n} min",
    cambiar_nivel: "Change level", dejar: "Leave the programme", dejado: "Programme removed. Your plan returns to its usual doses.", deshacer: "Undo", empezado: "Programme running: {x}",
    rev_tit: "12-week review", rev_intro: "You have completed the programme. Look at what you achieved and decide how to go on.", rev_semanas: "weeks", rev_ses: "sessions", rev_min: "minutes", rev_ini: "At the start", rev_fin: "At the end", rev_min_sem: "{n} min per week", rev_rpe: "average effort {r}",
    rev_pruebas: "Repeat the fitness tests now to compare them with the first ones.", rev_pruebas_btn: "Do the tests", rev_sig: "What now?", sig_subir: "Another cycle, one level up", sig_subir_x: "Week 1 of the “{x}” level.", sig_repetir: "Repeat this level", sig_repetir_x: "Another 12 weeks with the same doses.", sig_mant: "Keep what you have gained", sig_mant_x: "You stay on week-11 doses, with no further increase.",
    fuentes: "What it is based on", fuentes_x: "The progression is a proposal built from these recommendations; the figures for each week do not come from one particular study. Deload weeks are common training practice, with no trials that set when to place them.",
    f_garber: "gradual progression of intensity and volume may reduce risks; 150 min a week, strength 2–3 days and balance.", f_acsm09: "to start, loads allowing 8–12 repetitions, 2–3 days a week; raise the load by 2–10% when one or two repetitions are to spare.", f_fragala: "resistance training recommendations for older adults.", f_izquierdo: "international consensus on exercise in older adults (ICFSR).", f_bull: "150–300 min a week of moderate activity and muscle strengthening for all ages.", f_casas: "trial of the three-month Vivifrail programme: 1.40 points more on the SPPB test than the control group.",
    ver: "See the programme", ver_rev: "See the review", serie_chip: "programme" },
  ca: { titulo: "Programa de 12 setmanes", borrador: "Esborrany pendent de revisió clínica", intro: "De menys a més i al vostre ritme: cada setmana, una mica més de passeig i de força. El programa mira el vostre diari i decideix sol si toca pujar, repetir o afluixar.",
    elegir: "Trieu per on començar", n_suave: "Des de la cadira", n_suave_x: "Per començar amb calma: passejos de 5 minuts i una sèrie de cada exercici. Acaba en 20 minuts i dues sèries.", n_medio: "Agafar fons", n_medio_x: "Si ara us moveu poc: de 10 a 30 minuts de passeig i d'una a tres sèries.", n_activo: "Pujar un esglaó", n_activo_x: "Si ja feu exercici gairebé totes les setmanes: de 20 a 45 minuts i fins a tres sèries, amb versions més difícils.",
    recomendado: "Recomanat", rec_suave: "Pel vostre nivell de forma actual.", rec_activo: "Pel que hi ha al vostre diari de les últimes setmanes.", rec_medio: "És el punt de partida habitual.",
    empezar: "Començar el programa", empieza_hoy: "La setmana 1 és aquesta.", empieza_lunes: "La setmana 1 comença el dilluns {d}. Fins aleshores podeu anar provant les sessions.", volver: "Tornar",
    fase: "Fase {n}", fase_1: "Adaptació", fase_2: "Construcció", fase_3: "Consolidació", fase_1_x: "Aprendre els exercicis i agafar el costum, amb esforç suau.", fase_2_x: "Més minuts i més sèries, amb esforç moderat.", fase_3_x: "Es manté el volum i puja la dificultat.", semanas: "setmanes {a}–{b}",
    sem_de: "Setmana {n} de 12", descarga: "Descàrrega", pruebas: "Proves", previa: "Comença dilluns", mant: "Manteniment", programa: "Programa",
    obj_ses: "{n} sessions", obj_ses_1: "1 sessió", obj_aer: "passeig de {n} min", obj_ser: "{n} sèries", obj_ser_1: "1 sèrie", obj_rpe: "esforç {a}–{b} de 10", obj_min: "uns {n} min",
    esta: "Aquesta setmana", lleva: "Sessions fetes: {a}. Objectiu: {b}.", hint_dificil: "Proveu la versió «més difícil» en dos exercicis.", hint_descarga: "Setmana més lleugera expressament, per assimilar la feina feta.", hint_pruebas: "Setmana de proves: repetiu les proves de forma física i compareu.", hint_mant: "Es mantenen les dosis de la setmana 11.",
    v_avanza: "Puja un pas", v_avanza_x: "Sessions fetes: {a} (objectiu: {b}). Passeu a la setmana {n}.", v_poco: "Es repeteix", v_poco_x: "Sessions fetes: {a} (objectiu: {b}). Sense pressa: la setmana {n} es repeteix.", v_duro: "Es repeteix", v_duro_x: "L'esforç mitjà ha estat de {r} sobre 10, alt per pujar. La setmana {n} es repeteix.",
    v_sintomas: "Es repeteix", v_sintomas_x: "Heu apuntat mareig, palpitacions, dolor al pit, baixada de sucre o sagnat. No es puja; si es repeteix, comenteu-ho amb el metge. Si heu tingut dolor al pit, o palpitacions amb mareig, consulteu abans de la propera sessió.", v_pausa: "En pausa", v_pausa_x: "Setmana sense sessions. Es reprèn on era.", v_atras: "Un pas enrere", v_atras_x: "Dues setmanes o més sense sessions: es reprèn a la setmana {n}.", v_fin: "Programa completat", v_fin_x: "Heu acabat les 12 setmanes.", v_vuelta: "Tornada després d'una aturada", v_vuelta_x: "Retrocedit a la setmana {n} per tornar a poc a poc.",
    anterior: "La setmana passada", como: "Com decideix el programa", regla_1: "Cada dilluns mira la setmana anterior al vostre diari.", regla_2: "Si heu fet almenys dues de cada tres sessions previstes i l'esforç mitjà no ha arribat a 7,5 sobre 10, puja un pas.", regla_3: "Si heu fet menys sessions, o l'esforç ha estat de 7,5 o més, la setmana es repeteix.", regla_4: "Si heu apuntat mareig, palpitacions, dolor al pit, baixada de sucre o sagnat, no puja.", regla_5: "Una setmana sense sessions no canvia res. A partir de la segona seguida, retrocedeix un pas per setmana.",
    tabla: "Les 12 setmanes", hecha: "Feta", actual: "En curs", historial: "El que ha passat", h_sem: "Setmana {n}", h_ses: "sessions: {a} (objectiu: {b})", h_min: "{n} min",
    cambiar_nivel: "Canviar de nivell", dejar: "Deixar el programa", dejado: "Programa retirat. El vostre pla torna a les dosis de sempre.", deshacer: "Desfer", empezado: "Programa en marxa: {x}",
    rev_tit: "Revisió de les 12 setmanes", rev_intro: "Heu completat el programa. Mireu el que heu aconseguit i decidiu com seguir.", rev_semanas: "setmanes", rev_ses: "sessions", rev_min: "minuts", rev_ini: "En començar", rev_fin: "En acabar", rev_min_sem: "{n} min per setmana", rev_rpe: "esforç mitjà {r}",
    rev_pruebas: "Repetiu ara les proves de forma física per comparar-les amb les del principi.", rev_pruebas_btn: "Fer les proves", rev_sig: "I ara?", sig_subir: "Un altre cicle, un nivell més", sig_subir_x: "Setmana 1 del nivell «{x}».", sig_repetir: "Repetir aquest nivell", sig_repetir_x: "12 setmanes més amb les mateixes dosis.", sig_mant: "Mantenir el que heu aconseguit", sig_mant_x: "Us quedeu amb les dosis de la setmana 11, sense pujar més.",
    fuentes: "En què es basa", fuentes_x: "La progressió és una proposta elaborada a partir d'aquestes recomanacions; les xifres de cada setmana no surten d'un estudi concret. Les setmanes de descàrrega són una pràctica habitual de l'entrenament, sense assajos que fixin quan posar-les.",
    f_garber: "progressar a poc a poc en intensitat i volum pot reduir els riscos; 150 min a la setmana, força 2–3 dies i equilibri.", f_acsm09: "per començar, càrregues que permetin 8–12 repeticions, 2–3 dies per setmana; pujar la càrrega un 2–10 % quan sobren una o dues repeticions.", f_fragala: "recomanacions d'entrenament de força en persones grans.", f_izquierdo: "consens internacional d'exercici en persones grans (ICFSR).", f_bull: "150–300 min setmanals d'activitat moderada i força per a totes les edats.", f_casas: "assaig del programa Vivifrail, de tres mesos: 1,40 punts més a la prova SPPB que el grup de control.",
    ver: "Veure el programa", ver_rev: "Veure la revisió", serie_chip: "programa" },
  gl: { titulo: "Programa de 12 semanas", borrador: "Borrador pendente de revisión clínica", intro: "De menos a máis e ao seu ritmo: cada semana, un pouco máis de paseo e de forza. O programa mira o seu diario e decide só se toca subir, repetir ou afrouxar.",
    elegir: "Escolla por onde comezar", n_suave: "Desde a cadeira", n_suave_x: "Para comezar con calma: paseos de 5 minutos e unha serie de cada exercicio. Remata en 20 minutos e dúas series.", n_medio: "Coller fondo", n_medio_x: "Se agora se move pouco: de 10 a 30 minutos de paseo e dunha a tres series.", n_activo: "Subir un chanzo", n_activo_x: "Se xa fai exercicio case todas as semanas: de 20 a 45 minutos e ata tres series, con versións máis difíciles.",
    recomendado: "Recomendado", rec_suave: "Polo seu nivel de forma actual.", rec_activo: "Polo que hai no seu diario das últimas semanas.", rec_medio: "É o punto de partida habitual.",
    empezar: "Comezar o programa", empieza_hoy: "A semana 1 é esta.", empieza_lunes: "A semana 1 comeza o luns {d}. Ata entón pode ir probando as sesións.", volver: "Volver",
    fase: "Fase {n}", fase_1: "Adaptación", fase_2: "Construción", fase_3: "Consolidación", fase_1_x: "Aprender os exercicios e coller o costume, con esforzo suave.", fase_2_x: "Máis minutos e máis series, con esforzo moderado.", fase_3_x: "Mantense o volume e sobe a dificultade.", semanas: "semanas {a}–{b}",
    sem_de: "Semana {n} de 12", descarga: "Descarga", pruebas: "Probas", previa: "Comeza o luns", mant: "Mantemento", programa: "Programa",
    obj_ses: "{n} sesións", obj_ses_1: "1 sesión", obj_aer: "paseo de {n} min", obj_ser: "{n} series", obj_ser_1: "1 serie", obj_rpe: "esforzo {a}–{b} de 10", obj_min: "uns {n} min",
    esta: "Esta semana", lleva: "Sesións feitas: {a}. Obxectivo: {b}.", hint_dificil: "Probe a versión «máis difícil» en dous exercicios.", hint_descarga: "Semana máis lixeira adrede, para asimilar o traballado.", hint_pruebas: "Semana de probas: repita as probas de forma física e compare.", hint_mant: "Mantéñense as doses da semana 11.",
    v_avanza: "Sobe un paso", v_avanza_x: "Sesións feitas: {a} (obxectivo: {b}). Pasa á semana {n}.", v_poco: "Repítese", v_poco_x: "Sesións feitas: {a} (obxectivo: {b}). Sen présa: a semana {n} repítese.", v_duro: "Repítese", v_duro_x: "O esforzo medio foi de {r} sobre 10, alto para subir. A semana {n} repítese.",
    v_sintomas: "Repítese", v_sintomas_x: "Apuntou mareo, palpitacións, dor no peito, baixada de azucre ou sangrado. Non se sobe; se se repite, coménteo co seu médico. Se tivo dor no peito, ou palpitacións con mareo, consulte antes da próxima sesión.", v_pausa: "En pausa", v_pausa_x: "Semana sen sesións. Retómase onde estaba.", v_atras: "Un paso atrás", v_atras_x: "Dúas semanas ou máis sen sesións: retómase na semana {n}.", v_fin: "Programa completado", v_fin_x: "Rematou as 12 semanas.", v_vuelta: "Volta tras un parón", v_vuelta_x: "Retrocedido á semana {n} para volver pouco a pouco.",
    anterior: "A semana pasada", como: "Como decide o programa", regla_1: "Cada luns mira a semana anterior no seu diario.", regla_2: "Se fixo polo menos dúas de cada tres sesións previstas e o esforzo medio non chegou a 7,5 sobre 10, sobe un paso.", regla_3: "Se fixo menos sesións, ou o esforzo foi de 7,5 ou máis, a semana repítese.", regla_4: "Se apuntou mareo, palpitacións, dor no peito, baixada de azucre ou sangrado, non sobe.", regla_5: "Unha semana sen sesións non cambia nada. A partir da segunda seguida, retrocede un paso por semana.",
    tabla: "As 12 semanas", hecha: "Feita", actual: "En curso", historial: "O que pasou", h_sem: "Semana {n}", h_ses: "sesións: {a} (obxectivo: {b})", h_min: "{n} min",
    cambiar_nivel: "Cambiar de nivel", dejar: "Deixar o programa", dejado: "Programa retirado. O seu plan volve ás doses de sempre.", deshacer: "Desfacer", empezado: "Programa en marcha: {x}",
    rev_tit: "Revisión das 12 semanas", rev_intro: "Completou o programa. Mire o conseguido e decida como seguir.", rev_semanas: "semanas", rev_ses: "sesións", rev_min: "minutos", rev_ini: "Ao comezar", rev_fin: "Ao rematar", rev_min_sem: "{n} min por semana", rev_rpe: "esforzo medio {r}",
    rev_pruebas: "Repita agora as probas de forma física para comparalas coas do principio.", rev_pruebas_btn: "Facer as probas", rev_sig: "E agora?", sig_subir: "Outro ciclo, un nivel máis", sig_subir_x: "Semana 1 do nivel «{x}».", sig_repetir: "Repetir este nivel", sig_repetir_x: "Outras 12 semanas coas mesmas doses.", sig_mant: "Manter o conseguido", sig_mant_x: "Queda coas doses da semana 11, sen subir máis.",
    fuentes: "En que se basea", fuentes_x: "A progresión é unha proposta elaborada a partir destas recomendacións; as cifras de cada semana non saen dun estudo concreto. As semanas de descarga son unha práctica habitual do adestramento, sen ensaios que fixen cando poñelas.",
    f_garber: "progresar pouco a pouco en intensidade e volume pode reducir os riscos; 150 min á semana, forza 2–3 días e equilibrio.", f_acsm09: "para comezar, cargas que permitan 8–12 repeticións, 2–3 días por semana; subir a carga un 2–10 % cando sobran unha ou dúas repeticións.", f_fragala: "recomendacións de adestramento de forza en persoas maiores.", f_izquierdo: "consenso internacional de exercicio en persoas maiores (ICFSR).", f_bull: "150–300 min semanais de actividade moderada e forza para todas as idades.", f_casas: "ensaio do programa Vivifrail, de tres meses: 1,40 puntos máis na proba SPPB que o grupo de control.",
    ver: "Ver o programa", ver_rev: "Ver a revisión", serie_chip: "programa" },
  eu: { titulo: "12 asteko programa", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Gutxitik gehiagora eta zure erritmoan: astero, ibilaldi eta indar pixka bat gehiago. Programak zure egunkaria begiratzen du eta berak erabakitzen du igo, errepikatu edo lasaitu behar den.",
    elegir: "Aukeratu nondik hasi", n_suave: "Aulkitik", n_suave_x: "Lasai hasteko: 5 minutuko ibilaldiak eta ariketa bakoitzeko serie bat. 20 minutu eta bi serierekin amaitzen da.", n_medio: "Oinarria hartu", n_medio_x: "Orain gutxi mugitzen bazara: 10etik 30 minutura ibiltzen eta serie batetik hirura.", n_activo: "Maila bat igo", n_activo_x: "Ia astero ariketa egiten baduzu: 20tik 45 minutura eta hiru serie arte, bertsio zailagoekin.",
    recomendado: "Gomendatua", rec_suave: "Zure egungo sasoi-mailagatik.", rec_activo: "Azken asteetako egunkarian dagoenagatik.", rec_medio: "Ohiko abiapuntua da.",
    empezar: "Hasi programa", empieza_hoy: "1. astea hau da.", empieza_lunes: "1. astea {d} astelehenean hasiko da. Ordura arte saioak probatzen joan zaitezke.", volver: "Itzuli",
    fase: "{n}. fasea", fase_1: "Egokitzapena", fase_2: "Eraikuntza", fase_3: "Sendotzea", fase_1_x: "Ariketak ikasi eta ohitura hartu, ahalegin leunarekin.", fase_2_x: "Minutu eta serie gehiago, ahalegin moderatuarekin.", fase_3_x: "Bolumena mantentzen da eta zailtasuna igotzen da.", semanas: "{a}–{b} asteak",
    sem_de: "{n}. astea 12tik", descarga: "Deskarga", pruebas: "Probak", previa: "Astelehenean hasten da", mant: "Mantentzea", programa: "Programa",
    obj_ses: "{n} saio", obj_ses_1: "Saio 1", obj_aer: "{n} min-ko ibilaldia", obj_ser: "{n} serie", obj_ser_1: "Serie 1", obj_rpe: "ahalegina {a}–{b} 10etik", obj_min: "{n} min inguru",
    esta: "Aste honetan", lleva: "Egindako saioak: {a}. Helburua: {b}.", hint_dificil: "Probatu «zailagoa» bertsioa bi ariketatan.", hint_descarga: "Aste arinagoa nahita, egindakoa barneratzeko.", hint_pruebas: "Proba-astea: errepikatu sasoi-probak eta alderatu.", hint_mant: "11. asteko dosiak mantentzen dira.",
    v_avanza: "Urrats bat gora", v_avanza_x: "Egindako saioak: {a} (helburua: {b}). {n}. astera pasatzen zara.", v_poco: "Errepikatu egiten da", v_poco_x: "Egindako saioak: {a} (helburua: {b}). Presarik gabe: {n}. astea errepikatzen da.", v_duro: "Errepikatu egiten da", v_duro_x: "Batez besteko ahalegina 10etik {r} izan da, altua igotzeko. {n}. astea errepikatzen da.",
    v_sintomas: "Errepikatu egiten da", v_sintomas_x: "Zorabioa, palpitazioak, bularreko mina, azukre-jaitsiera edo odoljarioa idatzi duzu. Ez da igotzen; errepikatzen bada, esan medikuari. Bularreko mina izan baduzu, edo palpitazioak zorabioarekin, kontsultatu hurrengo saioaren aurretik.", v_pausa: "Etenda", v_pausa_x: "Saiorik gabeko astea. Zegoen lekuan jarraitzen du.", v_atras: "Urrats bat atzera", v_atras_x: "Bi aste edo gehiago saiorik gabe: {n}. astean jarraitzen du.", v_fin: "Programa osatuta", v_fin_x: "12 asteak amaitu dituzu.", v_vuelta: "Etenaldi baten ondorengo itzulera", v_vuelta_x: "{n}. astera atzeratuta, pixkanaka itzultzeko.",
    anterior: "Joan den astean", como: "Nola erabakitzen duen programak", regla_1: "Astelehenero aurreko astea begiratzen du zure egunkarian.", regla_2: "Aurreikusitako hiru saiotik gutxienez bi egin badituzu eta batez besteko ahalegina 10etik 7,5era iritsi ez bada, urrats bat igotzen du.", regla_3: "Saio gutxiago egin badituzu, edo ahalegina 7,5 edo gehiago izan bada, astea errepikatzen da.", regla_4: "Zorabioa, palpitazioak, bularreko mina, azukre-jaitsiera edo odoljarioa idatzi baduzu, ez du igotzen.", regla_5: "Saiorik gabeko aste batek ez du ezer aldatzen. Bigarren jarraitutik aurrera, urrats bat atzera asteko.",
    tabla: "12 asteak", hecha: "Eginda", actual: "Abian", historial: "Gertatutakoa", h_sem: "{n}. astea", h_ses: "saioak: {a} (helburua: {b})", h_min: "{n} min",
    cambiar_nivel: "Aldatu maila", dejar: "Utzi programa", dejado: "Programa kenduta. Zure plana betiko dosietara itzuli da.", deshacer: "Desegin", empezado: "Programa abian: {x}",
    rev_tit: "12 asteen berrikuspena", rev_intro: "Programa osatu duzu. Begiratu lortutakoa eta erabaki nola jarraitu.", rev_semanas: "aste", rev_ses: "saio", rev_min: "minutu", rev_ini: "Hasieran", rev_fin: "Amaieran", rev_min_sem: "{n} min asteko", rev_rpe: "batez besteko ahalegina {r}",
    rev_pruebas: "Errepikatu orain sasoi-probak hasierakoekin alderatzeko.", rev_pruebas_btn: "Egin probak", rev_sig: "Eta orain?", sig_subir: "Beste ziklo bat, maila bat gorago", sig_subir_x: "«{x}» mailako 1. astea.", sig_repetir: "Errepikatu maila hau", sig_repetir_x: "Beste 12 aste dosi berdinekin.", sig_mant: "Mantendu lortutakoa", sig_mant_x: "11. asteko dosiekin geratzen zara, gehiago igo gabe.",
    fuentes: "Zertan oinarritzen den", fuentes_x: "Progresioa gomendio hauetatik abiatuta egindako proposamena da; aste bakoitzeko zifrak ez datoz ikerketa jakin batetik. Deskarga-asteak entrenamenduko ohiko praktika dira, noiz jarri finkatzen duen saiakuntzarik gabe.",
    f_garber: "intentsitatean eta bolumenean pixkanaka aurrera egiteak arriskuak murriztu ditzake; 150 min astean, indarra 2–3 egunetan eta oreka.", f_acsm09: "hasteko, 8–12 errepikapen ahalbidetzen dituzten kargak, astean 2–3 egunetan; karga % 2–10 igo errepikapen bat edo bi sobera daudenean.", f_fragala: "adinekoen indar-entrenamendurako gomendioak.", f_izquierdo: "adinekoen ariketari buruzko nazioarteko adostasuna (ICFSR).", f_bull: "astean 150–300 min jarduera moderatu eta indarra adin guztietarako.", f_casas: "hiru hilabeteko Vivifrail programaren saiakuntza: SPPB proban kontrol-taldeak baino 1,40 puntu gehiago.",
    ver: "Ikusi programa", ver_rev: "Ikusi berrikuspena", serie_chip: "programa" },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Fuentes (comprobadas en PubMed el 22/11/2026). */
export const FUENTES = tC([
  { id: "garber", cita: "Garber CE et al. Med Sci Sports Exerc 2011;43:1334-59", doi: "10.1249/MSS.0b013e318213fefb" },
  { id: "acsm09", cita: "American College of Sports Medicine. Med Sci Sports Exerc 2009;41:687-708", doi: "10.1249/MSS.0b013e3181915670" },
  { id: "fragala", cita: "Fragala MS et al. J Strength Cond Res 2019;33:2019-52", doi: "10.1519/JSC.0000000000003230" },
  { id: "izquierdo", cita: "Izquierdo M et al. J Nutr Health Aging 2021;25:824-53", doi: "10.1007/s12603-021-1665-8" },
  { id: "bull", cita: "Bull FC et al. Br J Sports Med 2020;54:1451-62", doi: "10.1136/bjsports-2020-102955" },
  { id: "casas", cita: "Casas-Herrero Á et al. J Cachexia Sarcopenia Muscle 2022;13:884-93", doi: "10.1002/jcsm.12925" },
]);

/* Dosis por nivel y semana: [sesiones, minutos del bloque principal del paseo, series de fuerza]. Semanas 4 y 8, de descarga; la 12, de pruebas. */
export const NIVELES = ["suave", "medio", "activo"];
const TABLA = {
  suave: [[3, 5, 1], [3, 6, 1], [4, 8, 1], [3, 6, 1], [4, 10, 1], [4, 12, 2], [5, 14, 2], [4, 10, 1], [5, 15, 2], [5, 17, 2], [5, 20, 2], [4, 15, 2]],
  medio: [[3, 10, 1], [3, 12, 1], [4, 14, 1], [3, 12, 1], [4, 16, 2], [4, 20, 2], [5, 22, 2], [4, 18, 1], [5, 25, 2], [5, 28, 3], [5, 30, 3], [4, 25, 2]],
  activo: [[4, 20, 2], [4, 24, 2], [5, 26, 2], [4, 22, 1], [5, 30, 2], [5, 32, 3], [5, 36, 3], [4, 28, 2], [5, 40, 3], [5, 42, 3], [5, 45, 3], [4, 35, 2]],
};
const RPE = { suave: [[3, 4], [4, 5], [5, 6]], medio: [[3, 4], [4, 6], [5, 7]], activo: [[4, 5], [5, 6], [6, 7]] };
export const faseDe = (paso) => (paso <= 4 ? 1 : paso <= 8 ? 2 : 3);
/** Lo que pide el programa en una semana (paso 1-12) de un nivel. */
export function semana(nivel, paso) {
  const n = TABLA[nivel] ? nivel : "medio", p = Math.min(12, Math.max(1, paso | 0)), [ses, aer, ser] = TABLA[n][p - 1], fase = faseDe(p);
  return { nivel: n, paso: p, fase, descarga: p === 4 || p === 8, pruebas: p === 12, ses, aer, ser, rpe: RPE[n][fase - 1], dificil: p >= (n === "suave" ? 10 : 9) && p <= 11 };
}

/* --- fechas (locales) --- */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fecha = (s) => new Date(s + "T12:00");
const masDias = (s, n) => { const d = fecha(s); d.setDate(d.getDate() + n); return iso(d); };
const lunesDe = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); };

/* --- estado --- */
const CLAVE = "medex.programa";
let P; // undefined = sin leer; null = no hay programa
const valido = (o) => o && typeof o === "object" && NIVELES.includes(o.nivel) && /^\d{4}-\d\d-\d\d$/.test(o.lunes || "") && o.paso >= 1 && o.paso <= 12 && Array.isArray(o.hist);
export function leer() { if (P === undefined) { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null"); P = valido(o) ? o : null; } catch { P = null; } } return P; }
function guardar(o) { P = o; try { if (o) localStorage.setItem(CLAVE, JSON.stringify(o)); else localStorage.removeItem(CLAVE); } catch {} }
/** Para las pruebas: fija el estado en memoria sin tocar el almacenamiento. */
export function _poner(o) { P = o; }
/** Programa nuevo. Si hoy es lunes, martes o miércoles, la semana 1 es esta; si no, empieza el lunes siguiente. */
export function nuevo(nivel, hoy = new Date(), ciclo = 1) {
  const l = lunesDe(hoy), tarde = ((hoy.getDay() + 6) % 7) > 2;
  return { v: 1, nivel, paso: 1, lunes: tarde ? masDias(l, 7) : l, hist: [], fin: null, mant: false, ciclo, creado: iso(hoy) };
}
/** Nivel que se propone: frágil -> suave; con 120 min o más de media en las cuatro últimas semanas completas -> activo; si no, medio. */
export function recomendar({ fragil = false, diario = [], hoy = new Date() } = {}) {
  if (fragil) return "suave";
  const l = lunesDe(hoy); let min = 0;
  for (const x of diario) if (x.fecha >= masDias(l, -28) && x.fecha < l) min += x.min || 0;
  return min / 4 >= 120 ? "activo" : "medio";
}
const ALARMA = ["mareo", "palpitaciones", "hipoglucemia", "sangrado", "dolor_pecho"];
/** Resumen de una semana del diario (de lunes a domingo). */
export function resumenSemana(diario, lunes) {
  const fin = masDias(lunes, 7), d = diario.filter((x) => x.fecha >= lunes && x.fecha < fin), conRpe = d.filter((x) => x.rpe);
  return { ses: d.length, min: d.reduce((n, x) => n + (x.min || 0), 0), rpe: conRpe.length ? Math.round((conRpe.reduce((n, x) => n + x.rpe, 0) / conRpe.length) * 10) / 10 : null, sint: d.some((x) => (x.sintomas || []).some((s) => ALARMA.includes(s))) };
}
/** Decisión sobre una semana terminada. r = resumenSemana; objSes = sesiones que pedía; vaciasAntes = semanas vacías seguidas justo antes. */
export function decidir(r, objSes, vaciasAntes = 0) {
  if (r.ses === 0) return vaciasAntes >= 1 ? "atras" : "pausa";
  if (r.sint) return "sintomas";
  if (r.rpe != null && r.rpe >= 7.5) return "duro";
  if (r.ses < Math.ceil((objSes * 2) / 3)) return "poco";
  return "avanza";
}
/** Sesiones que pide una semana con los días que la persona tiene en su plan. */
export const sesionesObjetivo = (sem, sesPlan) => Math.max(1, Math.min(sem.ses, sesPlan || sem.ses));
/** Pone el programa al día: evalúa cada semana ya terminada. Devuelve las decisiones nuevas (y las guarda). */
export function actualizar(diario, { sesPlan = 6, hoy = new Date() } = {}) {
  const p = leer(); if (!p || p.fin || p.mant) return [];
  const hoyIso = iso(hoy), nuevas = [];
  let o = { ...p, hist: [...p.hist] }, tope = 0;
  while (hoyIso >= masDias(o.lunes, 7) && tope++ < 80) {
    const s = semana(o.nivel, o.paso), obj = sesionesObjetivo(s, sesPlan), r = resumenSemana(diario, o.lunes);
    let vacias = 0; for (let i = o.hist.length - 1; i >= 0 && ["pausa", "atras"].includes(o.hist[i].clave); i--) vacias++;
    let clave = decidir(r, obj, vacias); const antes = o.paso;
    if (clave === "avanza") { if (o.paso >= 12) { o.fin = masDias(o.lunes, 6); clave = "fin"; } else o.paso++; }
    else if (clave === "atras") o.paso = Math.max(1, o.paso - 1);
    const h = { lunes: o.lunes, paso: antes, ses: r.ses, obj, min: r.min, rpe: r.rpe, clave, a: o.paso };
    o.hist.push(h); nuevas.push(h); o.lunes = masDias(o.lunes, 7);
    if (o.fin) break;
  }
  if (nuevas.length) { o.hist = o.hist.slice(-80); guardar(o); }
  return nuevas;
}
/** Retrocede el programa k pasos (vuelta tras un parón, js/vuelta.js) y vuelve a contar la semana desde este lunes.
    Devuelve el estado nuevo, o null si no hay programa en marcha o ya está en ese paso. */
export function retroceder(k, hoy = new Date()) {
  const p = leer(); if (!p || p.fin || p.mant || !(k > 0)) return null;
  const paso = Math.max(1, p.paso - k); if (paso === p.paso) return null;
  const l = lunesDe(hoy), o = { ...p, paso, lunes: l, hist: [...p.hist, { lunes: l, paso: p.paso, ses: 0, obj: 0, min: 0, rpe: null, clave: "vuelta", a: paso }].slice(-80) };
  guardar(o); return o;
}
/** Semana en vigor para el plan y las sesiones, o null si no hay programa (o está terminado y sin decidir cómo seguir). */
export function semanaActual(hoy = new Date()) {
  const p = leer(); if (!p) return null;
  if (p.mant) return { ...semana(p.nivel, 11), mant: true };
  if (p.fin) return null;
  if (iso(hoy) < p.lunes) return { ...semana(p.nivel, 1), previa: true };
  return semana(p.nivel, p.paso);
}
export const redondo = (n) => Math.max(5, Math.round(n / 5) * 5);
/** Objetivo de la semana: sesiones (según los días del plan) y minutos (sesiones × duración media de las sesiones del plan). */
export function objetivo(sem, minutosSesiones = []) {
  const ses = sesionesObjetivo(sem, minutosSesiones.length), media = minutosSesiones.length ? minutosSesiones.reduce((a, b) => a + b, 0) / minutosSesiones.length : 30;
  return { ses, min: redondo(ses * media) };
}
/* --- ajuste de las sesiones --- */
const FACTOR = { 1: 0.6, 2: 1, 3: 1.35 };
const RE_DOSIS = /(\d)(?:–\d)? (series de|sets of|×) /; // «sets of»: el mismo texto con el contenido en inglés
/** Pone las series de la semana en el texto de un ejercicio: «2–3 series de 8–15» -> «1 serie de 8–15»; «2 × 10» -> «3 × 10». */
export function conSeries(detalle, ser) { return String(detalle).replace(RE_DOSIS, (_, a, b) => `${ser} ${ser !== 1 ? b : b === "series de" ? "serie de" : b === "sets of" ? "set of" : b} `); }
/** Ajusta una sesión de fuerza a las series de la semana (texto y minutos de los ejercicios que van por series). La de paseo llega ya con sus minutos. */
export function ajustar(ses, sem) {
  if (!ses || !sem) return ses;
  if (ses.tipo !== "fuerza" && ses.tipo !== "fuerza_eq") return { ...ses, prog: sem };
  const f = FACTOR[sem.ser] || 1;
  const bloques = ses.bloques.map((b) => (b.clave && RE_DOSIS.test(b.detalle) ? { ...b, detalle: conSeries(b.detalle, sem.ser), min: Math.max(2, Math.round(b.min * f)), series: sem.ser } : b));
  return { ...ses, bloques, min: bloques.reduce((n, b) => n + b.min, 0), prog: sem };
}

/* --- textos de una semana --- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tSes = (n) => (n === 1 ? tx("obj_ses_1") : tx("obj_ses", { n }));
const tSer = (n) => (n === 1 ? tx("obj_ser_1") : tx("obj_ser", { n }));
export const seriesTexto = (n) => tSer(n);
export const dosisTexto = (s) => [tSes(s.ses), tx("obj_aer", { n: s.aer }), tSer(s.ser)].join(" · ");
const rpeTexto = (s) => tx("obj_rpe", { a: s.rpe[0], b: s.rpe[1] });
const mayus = (x) => x.charAt(0).toUpperCase() + x.slice(1);
const num = (n) => String(n).replace(".", idioma() === "en" ? "." : ",");
/** Frase de una decisión del historial. */
export function veredicto(h) {
  const v = { a: h.ses, b: h.obj, n: h.a ?? h.paso, r: h.rpe != null ? num(h.rpe) : "" };
  return { titulo: tx("v_" + h.clave), texto: tx("v_" + h.clave + "_x", v) };
}

const CSS = `
.prg-fin-img { display: block; width: 160px; height: 160px; margin: 0 auto 12px; border-radius: 26px; }
@media print { .prg-fin-img { display: none !important; } }
.prg-card { margin: 10px 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 70%); }
.prg-cab { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin: 0 0 8px; }
.prg-cab b { font-size: 1rem; }
.prg-fase { padding: 1px 9px; border-radius: 999px; background: var(--accent); color: var(--surface); font-size: .72rem; font-weight: 700; }
.prg-chip { padding: 1px 9px; border-radius: 999px; background: var(--info-soft); color: var(--info-ink); font-size: .72rem; font-weight: 700; }
.prg-pasos { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; margin: 0 0 10px; padding: 0; list-style: none; }
.prg-pasos li { height: 8px; border-radius: 999px; background: var(--line-strong); }
.prg-pasos li.hecha { background: var(--accent); }
.prg-pasos li.actual { background: var(--accent); box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent); }
.prg-pasos li.ligera:not(.hecha):not(.actual) { background: repeating-linear-gradient(90deg, var(--line-strong) 0 4px, transparent 4px 7px); }
.prg-pasos li:nth-child(4), .prg-pasos li:nth-child(8) { margin-right: 6px; }
.prg-obj { margin: 0 0 4px; font-size: .95rem; }
.prg-obj b { font-family: var(--mono); font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent-deep, var(--accent)); margin-right: 6px; }
.prg-sub { margin: 0 0 4px; font-size: .84rem; color: var(--muted); }
.prg-card .acciones { margin-top: 8px; }
.prg-dlg { width: min(820px, calc(100vw - 16px)); }
.prg-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border: 1px dashed var(--precaucion); border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .76rem; font-weight: 700; }
.prg-intro { margin: 0 0 12px; color: var(--muted); }
.prg-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.prg-niveles { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; margin: 0; padding: 0; border: 0; }
.prg-niveles legend { padding: 0; margin: 0 0 8px; font-weight: 700; }
.prg-niv { position: relative; display: grid; gap: 4px; align-content: start; padding: 12px 12px 12px 40px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); cursor: pointer; }
.prg-niv input { position: absolute; left: 12px; top: 14px; width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
.prg-niv:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); }
.prg-niv:has(input:focus-visible) { outline: 3px solid var(--accent); outline-offset: 2px; }
.prg-niv b { font-size: 1rem; }
.prg-niv small { color: var(--muted); font-size: .84rem; line-height: 1.35; }
.prg-niv .prg-chip { justify-self: start; }
.prg-niv em { font-style: normal; font-size: .78rem; color: var(--info-ink); }
.prg-cuando { margin: 12px 0 0; font-size: .9rem; }
.prg-fase-b { margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--line); border-left: 4px solid var(--accent); border-radius: var(--r-md); background: var(--surface); }
.prg-fase-b.f2 { border-left-color: var(--info); } .prg-fase-b.f3 { border-left-color: var(--oro, var(--precaucion)); }
.prg-fase-b h4 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin: 0 0 2px; font-size: .95rem; }
.prg-fase-b h4 small { font-family: var(--mono); font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.prg-fase-b > p { margin: 0 0 8px; font-size: .86rem; color: var(--muted); }
.prg-tabla { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.prg-tabla li { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 6px 8px; border-radius: var(--r-sm); font-size: .88rem; }
.prg-tabla li .prg-n { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--line-strong); font-family: var(--mono); font-size: .78rem; font-weight: 700; }
.prg-tabla li.hecha .prg-n { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.prg-tabla li.actual { background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
.prg-tabla li.actual .prg-n { border-color: var(--accent); color: var(--accent-deep, var(--accent)); }
.prg-tabla li .prg-e { font-size: .74rem; font-weight: 700; color: var(--muted); white-space: nowrap; }
.prg-tabla li.actual .prg-e { color: var(--accent-deep, var(--accent)); }
.prg-reglas { margin: 0; padding-left: 1.3em; display: grid; gap: 4px; font-size: .9rem; }
.prg-hist { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.prg-hist li { padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); font-size: .88rem; }
.prg-hist li b { margin-right: 6px; }
.prg-hist li small { display: block; color: var(--muted); }
.prg-hist li.v-avanza, .prg-hist li.v-fin { border-left: 4px solid var(--accent); }
.prg-hist li.v-sintomas { border-left: 4px solid var(--alerta); }
.prg-hist li.v-poco, .prg-hist li.v-duro, .prg-hist li.v-pausa, .prg-hist li.v-atras, .prg-hist li.v-vuelta { border-left: 4px solid var(--precaucion); }
.prg-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; }
.prg-acc.pegada { margin-top: 0; }
.prg-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.prg-fuentes a { color: var(--accent-deep, var(--accent)); }
.prg-nota { margin: 0 0 8px; font-size: .84rem; color: var(--muted); }
.prg-cifras { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 10px; }
.prg-cifras div { padding: 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); text-align: center; }
.prg-cifras b { display: block; font-family: var(--mono); font-size: 1.5rem; line-height: 1.1; color: var(--accent-deep, var(--accent)); }
.prg-cifras small { color: var(--muted); font-size: .78rem; }
.prg-comp { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 0 10px; }
.prg-comp div { padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface-2); }
.prg-comp div b { display: block; font-family: var(--mono); font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.prg-sig { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
.prg-sig button { display: grid; gap: 3px; padding: 12px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.prg-sig button:hover { border-color: var(--accent); background: var(--accent-soft); }
.prg-sig button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.prg-sig button small { color: var(--muted); font-size: .84rem; }
:root[data-theme="contrast"] .prg-card { background: var(--surface); }
@media (max-width: 520px) { .prg-tabla li { grid-template-columns: 30px minmax(0, 1fr); } .prg-tabla li .prg-e { grid-column: 2; } .prg-cifras b { font-size: 1.25rem; } }
@media (forced-colors: active) { .prg-pasos li.hecha, .prg-pasos li.actual { background: Highlight; } .prg-pasos li { border: 1px solid CanvasText; } }
@media print { .prg-card .acciones { display: none; } }
/* 847-849: la tira de 12 semanas con el color de cada fase, la dosis de la semana en fichas con icono y etiquetas de estado */
.prg-pasos li:nth-child(n+5):nth-child(-n+8) { --f: var(--info); } .prg-pasos li:nth-child(n+9) { --f: var(--oro, var(--precaucion)); }
.prg-pasos li { background: color-mix(in srgb, var(--f, var(--accent)) 22%, var(--line)); }
.prg-pasos li.hecha { background: var(--f, var(--accent)); }
.prg-pasos li.actual { background: var(--f, var(--accent)); box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--f, var(--accent)); }
.prg-pasos li.ligera:not(.hecha):not(.actual) { background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--f, var(--accent)) 45%, var(--line)) 0 4px, transparent 4px 7px); }
.prg-dosis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin: 2px 0 8px; }
@media (min-width: 560px) { .prg-dosis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.prg-dosis > div { display: grid; grid-template-columns: 30px minmax(0, 1fr); align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); font-size: .86rem; font-weight: 700; line-height: 1.25; }
.prg-dosis svg { width: 30px; height: 30px; padding: 6px; border-radius: 9px; background: var(--accent-soft); color: var(--accent-deep, var(--accent)); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.prg-dosis small { display: block; font-weight: 500; color: var(--muted); font-size: .76rem; }
.prg-tabla li .prg-e { padding: 1px 8px; border-radius: 999px; background: var(--surface-2); font-family: var(--mono); font-size: .64rem; letter-spacing: .04em; text-transform: uppercase; justify-self: start; }
.prg-tabla li .prg-e:empty { display: none; }
.prg-tabla li.actual .prg-e { background: var(--accent); color: var(--surface); }
.prg-tabla li.hecha .prg-e { background: var(--info-soft); color: var(--info-ink); }
@media (forced-colors: active) { .prg-tabla li .prg-e { border: 1px solid CanvasText; } }
`;
export function estilos() { if (typeof document !== "undefined" && !document.getElementById("prg-css")) { const st = document.createElement("style"); st.id = "prg-css"; st.textContent = CSS; document.head.append(st); } }

const pasosHtml = (paso, { todo = false } = {}) => `<ol class="prg-pasos" aria-hidden="true">${[...Array(12)].map((_, i) => `<li class="${[todo || i + 1 < paso ? "hecha" : i + 1 === paso ? "actual" : "", i === 3 || i === 7 ? "ligera" : ""].filter(Boolean).join(" ")}"></li>`).join("")}</ol>`;
/** Tarjeta del programa para Mi plan. c = { obj: { ses, min }, hechas: sesiones de esta semana }. */
export function tarjeta(c = {}, hoy = new Date()) {
  estilos();
  const p = leer(); if (!p) return "";
  if (p.fin && !p.mant) return `<div class="prg-card fin"><div class="prg-cab"><b>${tx("programa")} · ${tx("v_fin")}</b></div>${pasosHtml(12, { todo: true })}<p class="prg-sub">${tx("rev_intro")}</p><div class="acciones"><button type="button" class="btn sm" data-programa="">${tx("ver_rev")}</button></div></div>`;
  const s = semanaActual(hoy), ult = p.hist.at(-1);
  const cab = s.mant ? `<b>${tx("programa")} · ${tx("mant")}</b>` : `<b>${tx("programa")} · ${tx("sem_de", { n: s.paso })}</b><span class="prg-fase">${tx("fase_" + s.fase)}</span>${s.previa ? `<span class="prg-chip">${tx("previa")}</span>` : s.descarga ? `<span class="prg-chip">${tx("descarga")}</span>` : s.pruebas ? `<span class="prg-chip">${tx("pruebas")}</span>` : ""}`;
  const hint = s.mant ? tx("hint_mant") : s.descarga ? tx("hint_descarga") : s.pruebas ? tx("hint_pruebas") : s.dificil ? tx("hint_dificil") : "";
  const ses = c.obj?.ses ?? s.ses;
  return `<div class="prg-card"><div class="prg-cab">${cab}</div>${s.mant ? "" : pasosHtml(s.previa ? 0 : s.paso)}
    <p class="prg-obj"><b>${tx("esta")}</b></p><div class="prg-dosis">${[["M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 15l2 2 4-4", tSes(ses), c.obj?.min ? tx("obj_min", { n: c.obj.min }) : ""], ["M13 4.500a1.500 1.500 0 1 0 0-.01M9 21l2-6-2-3 1-4 4 2 3 1M11 15l3 2 1 4M8 11l2-3", tx("obj_aer", { n: s.aer }), ""], ["M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12", tSer(s.ser), ""], ["M4 16a8 8 0 1 1 16 0M12 16l4-6", rpeTexto(s), ""]].filter((x) => x[1]).map(([d, a, b]) => `<div><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${a}${b ? `<small>${b}</small>` : ""}</span></div>`).join("")}</div>
    ${c.hechas != null && !s.previa ? `<p class="prg-sub">${tx("lleva", { a: c.hechas, b: ses })}${hint ? " " + hint : ""}</p>` : hint ? `<p class="prg-sub">${hint}</p>` : ""}
    ${ult && !s.previa && !s.mant ? `<p class="prg-sub"><b>${tx("anterior")}:</b> ${esc(veredicto(ult).texto)}</p>` : ""}
    <div class="acciones"><button type="button" class="btn-sec sm" data-programa="">${tx("ver")}</button></div></div>`;
}

/* --- ventana --- */
let dlg = null, A = null, vista = null;
const cu = () => dlg.querySelector("#prg-cuerpo");
function crear() {
  estilos();
  dlg = document.createElement("dialog");
  dlg.id = "programa"; dlg.className = "ficha alta prg-dlg"; dlg.setAttribute("aria-labelledby", "prg-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="prg-cab-t"></p><button type="button" class="btn-sec sm" id="prg-cerrar"></button></div><div class="ficha-cuerpo" id="prg-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#prg-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-prg]"); if (!b) return;
    const a = b.dataset.prg;
    if (a === "empezar") { const n = dlg.querySelector('input[name="prg-nivel"]:checked')?.value || "medio"; empezar(n, leer()?.ciclo || 1); }
    else if (a === "nivel") { vista = "elegir"; pintar(); cu().scrollTop = 0; }
    else if (a === "volver") { vista = null; pintar(); cu().scrollTop = 0; }
    else if (a === "dejar") { const antes = leer(); guardar(null); A.cambiado?.(); dlg.close(); A.toast(tx("dejado"), { accion: tx("deshacer"), onAccion: () => { guardar(antes); A.cambiado?.(); }, ms: 8000 }); }
    else if (a === "subir") empezar(NIVELES[Math.min(2, NIVELES.indexOf(leer().nivel) + 1)], (leer().ciclo || 1) + 1);
    else if (a === "repetir") empezar(leer().nivel, (leer().ciclo || 1) + 1);
    else if (a === "mant") { guardar({ ...leer(), mant: true }); A.cambiado?.(); vista = null; pintar(); cu().scrollTop = 0; }
    else if (a === "pruebas") { dlg.close(); A.abrirPruebas?.(); }
  });
}
function empezar(nivel, ciclo) {
  const antes = leer(), o = { ...nuevo(nivel, A.hoy?.() || new Date(), ciclo), previo: antes?.hist?.length ? { nivel: antes.nivel, semanas: antes.hist.length } : undefined };
  guardar(o); vista = null; A.cambiado?.(); pintar(); cu().scrollTop = 0;
  A.toast(tx("empezado", { x: tx("n_" + nivel) }), { ms: 4000 });
}
const fuentesHtml = () => `<h3>${tx("fuentes")}</h3><p class="prg-nota">${tx("fuentes_x")}</p><ul class="prg-fuentes">${FUENTES.map((f) => `<li>${f.cita}. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>: ${tx("f_" + f.id)}</li>`).join("")}</ul>`;
const reglasHtml = () => `<h3>${tx("como")}</h3><ol class="prg-reglas">${[1, 2, 3, 4, 5].map((i) => `<li>${tx("regla_" + i)}</li>`).join("")}</ol>`;
function tablaHtml(nivel, paso, { fin = false } = {}) {
  return [1, 2, 3].map((f) => `<section class="prg-fase-b f${f}"><h4>${tx("fase", { n: f })} · ${tx("fase_" + f)} <small>${tx("semanas", { a: f * 4 - 3, b: f * 4 })}</small></h4><p>${tx("fase_" + f + "_x")} ${mayus(rpeTexto(semana(nivel, f * 4)))}.</p>
    <ol class="prg-tabla">${[0, 1, 2, 3].map((k) => { const s = semana(nivel, f * 4 - 3 + k), est = fin || s.paso < paso ? "hecha" : s.paso === paso ? "actual" : ""; return `<li class="${est}"><span class="prg-n">${s.paso}</span><span>${dosisTexto(s)}</span><span class="prg-e">${[s.descarga ? tx("descarga") : s.pruebas ? tx("pruebas") : "", est === "hecha" ? tx("hecha") + " ✓" : est === "actual" ? tx("actual") : ""].filter(Boolean).join(" · ")}</span></li>`; }).join("")}</ol></section>`).join("");
}
function elegirHtml(rec) {
  const hoy = A.hoy?.() || new Date(), n = nuevo("medio", hoy), tarde = n.lunes > lunesDe(hoy);
  const dia = fecha(n.lunes).toLocaleDateString(idioma(), { day: "numeric", month: "long" });
  return `<p class="prg-intro">${tx("intro")}</p>
    <fieldset class="prg-niveles"><legend>${tx("elegir")}</legend>${NIVELES.map((k) => `<label class="prg-niv"><input type="radio" name="prg-nivel" value="${k}"${k === rec ? " checked" : ""}><b>${tx("n_" + k)}</b>${k === rec ? `<span class="prg-chip">${tx("recomendado")}</span>` : ""}<small>${tx("n_" + k + "_x")}</small>${k === rec ? `<em>${tx("rec_" + k)}</em>` : ""}</label>`).join("")}</fieldset>
    <p class="prg-cuando">${tarde ? tx("empieza_lunes", { d: dia }) : tx("empieza_hoy")}</p>
    <div class="prg-acc"><button type="button" class="btn" data-prg="empezar">${tx("empezar")}</button>${leer() ? `<button type="button" class="btn-sec" data-prg="volver">${tx("volver")}</button>` : ""}</div>
    ${reglasHtml()}${fuentesHtml()}`;
}
/** Datos de la revisión final: totales y comparación de las dos primeras semanas con sesiones frente a las dos últimas. */
export function revision(p = leer()) {
  const con = (p?.hist || []).filter((h) => h.ses > 0), media = (l, k) => { const v = l.map((h) => h[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const ini = con.slice(0, 2), fin = con.slice(-2);
  return { semanas: p?.hist?.length || 0, ses: con.reduce((n, h) => n + h.ses, 0), min: con.reduce((n, h) => n + h.min, 0), ini: { min: Math.round(media(ini, "min") ?? 0), rpe: media(ini, "rpe") }, fin: { min: Math.round(media(fin, "min") ?? 0), rpe: media(fin, "rpe") } };
}
function revisionHtml(p) {
  const r = revision(p), sig = NIVELES[Math.min(2, NIVELES.indexOf(p.nivel) + 1)], rp = (x) => (x != null ? " · " + tx("rev_rpe", { r: num(Math.round(x * 10) / 10) }) : "");
  return `<img class="prg-fin-img" src="assets/img/programa-fin.webp" alt="" width="160" height="160" decoding="async"><p class="prg-intro">${tx("rev_intro")}</p>
    <div class="prg-cifras"><div><b>${r.semanas}</b><small>${tx("rev_semanas")}</small></div><div><b>${r.ses}</b><small>${tx("rev_ses")}</small></div><div><b>${r.min}</b><small>${tx("rev_min")}</small></div></div>
    <div class="prg-comp"><div><b>${tx("rev_ini")}</b>${tx("rev_min_sem", { n: r.ini.min })}${rp(r.ini.rpe)}</div><div><b>${tx("rev_fin")}</b>${tx("rev_min_sem", { n: r.fin.min })}${rp(r.fin.rpe)}</div></div>
    <p class="prg-nota">${tx("rev_pruebas")}</p><div class="prg-acc pegada"><button type="button" class="btn-sec" data-prg="pruebas">${tx("rev_pruebas_btn")}</button></div>
    <h3>${tx("rev_sig")}</h3><div class="prg-sig">${sig !== p.nivel ? `<button type="button" data-prg="subir"><b>${tx("sig_subir")}</b><small>${tx("sig_subir_x", { x: tx("n_" + sig) })}</small></button>` : ""}<button type="button" data-prg="repetir"><b>${tx("sig_repetir")}</b><small>${tx("sig_repetir_x")}</small></button><button type="button" data-prg="mant"><b>${tx("sig_mant")}</b><small>${tx("sig_mant_x")}</small></button></div>
    <h3>${tx("tabla")} · ${tx("n_" + p.nivel)}</h3>${tablaHtml(p.nivel, 13, { fin: true })}${historialHtml(p)}${fuentesHtml()}`;
}
const historialHtml = (p) => (p.hist.length ? `<h3>${tx("historial")}</h3><ol class="prg-hist">${[...p.hist].reverse().slice(0, 16).map((h) => { const v = veredicto(h); return `<li class="v-${h.clave}"><b>${tx("h_sem", { n: h.paso })}</b>${esc(v.titulo)}<small>${fecha(h.lunes).toLocaleDateString(idioma(), { day: "numeric", month: "short" })}${h.clave === "vuelta" ? "" : ` · ${tx("h_ses", { a: h.ses, b: h.obj })} · ${tx("h_min", { n: h.min })}${h.rpe != null ? " · " + tx("rev_rpe", { r: num(h.rpe) }) : ""}`}</small><small>${esc(v.texto)}</small></li>`; }).join("")}</ol>` : "");
function pintar() {
  const p = leer();
  dlg.querySelector("#prg-cab-t").textContent = p?.fin && !p.mant && vista !== "elegir" ? tx("rev_tit") : tx("titulo");
  if (!p || vista === "elegir") { cu().innerHTML = elegirHtml(p?.nivel || recomendar({ fragil: A.fragil, diario: A.diario?.() || [], hoy: A.hoy?.() || new Date() })); return; }
  if (p.fin && !p.mant) { cu().innerHTML = revisionHtml(p); return; }
  const s = semanaActual(A.hoy?.() || new Date());
  cu().innerHTML = `${tarjeta(A.contexto?.() || {}, A.hoy?.() || new Date()).replace(/<div class="acciones">.*?<\/div>/s, "")}
    <h3>${tx("tabla")} · ${tx("n_" + p.nivel)}</h3>${tablaHtml(p.nivel, s.mant ? 13 : s.previa ? 0 : s.paso, { fin: !!s.mant })}
    ${reglasHtml()}${historialHtml(p)}
    <div class="prg-acc"><button type="button" class="btn-sec" data-prg="nivel">${tx("cambiar_nivel")}</button><button type="button" class="btn-sec" data-prg="dejar">${tx("dejar")}</button></div>
    ${fuentesHtml()}`;
}
/** Abre la ventana del programa. a = { fragil, diario(), contexto() -> { obj, hechas }, toast, cambiado(), abrirPruebas(), cerrar (texto), hoy()? }. */
export function abrir(a) {
  if (!dlg) crear();
  A = a; vista = null;
  dlg.querySelector("#prg-cerrar").textContent = a.cerrar || "×";
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#prg-cerrar").focus();
}
export function cerrar() { if (dlg?.open) dlg.close(); }
