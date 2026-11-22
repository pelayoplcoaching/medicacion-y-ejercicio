/* Centro de herramientas (segunda tanda de mejoras grandes, 2): todo lo que hace la aplicación en una pantalla ordenada,
   con un buscador único (herramientas, medicamentos, lecciones, explicaciones, ejercicios y glosario), favoritas y
   «Para usted hoy»: hasta tres sugerencias según la lista, el plan y lo que queda por hacer.
   Se carga al abrirlo (botón «Más» de la barra inferior, «Herramientas» de la cabecera o Ctrl/⌘ + K). No guarda nada fuera
   del dispositivo: las favoritas van en localStorage («medex.favoritas»). Textos de la interfaz en cinco idiomas. */
import { t, idioma } from "./i18n.js?v=202611222014";
import { normalizar, buscar, sesionTipo } from "./engine.js?v=202611222014";

const TXT = {
  es: { titulo: "Herramientas", buscar: "Buscar herramientas, medicamentos, ejercicios…", buscar_aria: "Buscar en toda la aplicación", hoy: "Para usted hoy", favoritas: "Sus favoritas", fav_on: "Quitar de favoritas", fav_off: "Añadir a favoritas", nada: "Nada con «{q}». Pruebe con otra palabra o mire las herramientas de abajo.", falta_meds: "Añada antes su medicación", solo_pro: "Modo profesional", atajo: "Ctrl + K abre este buscador desde cualquier pantalla.", n_res: "{n} resultados", limpiar: "Borrar la búsqueda",
    g_entender: "Entender", g_moverse: "Moverse", g_seguir: "Seguir", g_consulta: "Para la consulta", g_ajustes: "Ajustes y ayuda",
    r_herr: "Herramientas", r_meds: "Medicamentos", r_lecc: "Lecciones de 2 minutos", r_porque: "Explicaciones «¿Por qué?»", r_ejer: "Ejercicios", r_glos: "Glosario", en_lista: "en su lista", ver_ficha: "Ver su ficha",
    l_porque: "¿Por qué? Explicaciones animadas", l_beneficios: "Lo que el ejercicio hace por usted", l_sesion: "La sesión de hoy", l_sppb: "Prueba SPPB (equilibrio, marcha y silla)", l_habitos: "Alcohol, tabaco y café", l_cribado: "Cribado de seguridad", l_pdf: "Descargar el informe en PDF", l_compartir: "Compartir mi plan", l_listas: "Listas guardadas y copia de seguridad", l_ficha: "Consultar un medicamento", l_anadir: "Añadir medicación", l_ejemplo: "Ver un ejemplo", l_mapa: "Interacciones entre sus fármacos", l_cuando: "¿A qué hora entrenar?",
    d_aprende: "Diez lecciones cortas con tres preguntas", d_porque: "Qué hace cada fármaco al moverse, paso a paso", d_beneficios: "Cifras de los estudios para su situación", d_dosis: "La curva de minutos y pasos, con su punto", d_mapa: "Tabla y red de cruces, con su gravedad", d_cuando: "Mejores horas según sus tomas", d_glosario: "RPE, FITT, SPPB… en una línea", d_ficha: "Lo que cambia con un fármaco, sin añadirlo",
    d_plan: "Su semana, sus anillos y su racha", d_sesion: "Guiada, con cronómetro y voz", d_programa: "De menos a más; sube solo con su diario", d_rato: "De 5 a 30 minutos, con sus ejercicios", d_pildoras: "Uno o dos minutos, varias veces al día", d_paseo: "Metrónomo, voz y programa de 8 semanas", d_biblioteca: "45 con dibujo; cambie los de su plan", d_pruebas: "Senior Fitness Test con baremos por edad", d_sppb: "Tres pruebas, de 0 a 12 puntos", d_metas: "Para qué quiere estar en forma", d_calor: "Horas, agua y sus fármacos con calor",
    d_mes: "Compárese con el mes pasado", d_constantes: "Glucosa, tensión y pulso del diario", d_pastillero: "Sus tomas por momentos del día", d_habitos: "Cómo se cruzan con su medicación", d_cribado: "Tres preguntas antes de empezar",
    d_simula: "Simule retirar un medicamento", d_pdf: "Para usted, su médico o su entrenador", d_compartir: "Por WhatsApp o con un código QR", d_conversa: "Qué decir en 1, 5 o 20 minutos", d_listas: "Varias personas en este dispositivo",
    d_letra: "Más grande o más pequeña", d_tema: "Claro, oscuro o alto contraste", d_sencillo: "Solo lo de hoy, en grande", d_como: "Recorrido guiado por la pantalla", d_guia: "La aplicación en una página", d_presentacion: "Para quién es y cómo se hizo", d_novedades: "Lo último que ha cambiado", d_sugerencia: "Cuéntenos qué falta o qué falla", d_acerca: "Fuentes, método y autor", d_legal: "Aviso legal y privacidad",
    s_anadir: "Empiece por su medicación", s_anadir_x: "Con el nombre, una foto de la caja o la hoja de la receta.", s_ejemplo_x: "Un caso de muestra para ver qué hace la aplicación.", s_como_x: "Un recorrido de un minuto por la pantalla.",
    s_cribado: "Complete el cribado de seguridad", s_cribado_x: "Tres preguntas para saber si conviene una valoración médica antes.", s_calor: "Hoy hace calor: adapte la sesión", s_calor_x: "Horas más frescas, agua y qué fármacos suyos lo notan.", s_sesion: "Hoy toca: {x}", s_sesion_x: "Sesión guiada con cronómetro y voz.", s_hecho: "Sesión de hoy hecha", s_hecho_x: "Mire cómo va su semana.", s_mayores: "{n} interacciones importantes", s_mayores_x: "Véalas en el mapa, con qué hacer en cada una.", s_habitos: "Alcohol, tabaco y café", s_habitos_x: "Tres preguntas para cruzarlos con su medicación.", s_metas: "¿Para qué quiere estar en forma?", s_metas_x: "Elija hasta tres metas y el plan señalará qué las trabaja.", s_pruebas: "Mida su forma física", s_pruebas_x: "Seis pruebas sencillas con baremos para su edad.", s_aprende: "Aprenda algo en 2 minutos", s_aprende_x: "Lleva {n} de 10 lecciones.", s_pastillero: "Ordene sus tomas", s_pastillero_x: "El pastillero las reparte por momentos del día.", s_copia: "Haga una copia de seguridad", s_copia_x: "Todo vive solo en este dispositivo.", s_conversa: "Guía de conversación", s_conversa_x: "Consejo breve adaptado a esta persona.", s_dosis: "¿Cuánto movimiento hace falta?", s_dosis_x: "Lo que encontraron los grandes estudios." },
  en: { titulo: "Tools", buscar: "Search tools, medicines, exercises…", buscar_aria: "Search the whole app", hoy: "For you today", favoritas: "Your favourites", fav_on: "Remove from favourites", fav_off: "Add to favourites", nada: "Nothing for “{q}”. Try another word or browse the tools below.", falta_meds: "Add your medicines first", solo_pro: "Professional mode", atajo: "Ctrl + K opens this search from any screen.", n_res: "{n} results", limpiar: "Clear search",
    g_entender: "Understand", g_moverse: "Move", g_seguir: "Keep track", g_consulta: "For the appointment", g_ajustes: "Settings and help",
    r_herr: "Tools", r_meds: "Medicines", r_lecc: "2-minute lessons", r_porque: "“Why?” explainers", r_ejer: "Exercises", r_glos: "Glossary", en_lista: "on your list", ver_ficha: "See its sheet",
    l_porque: "Why? Animated explainers", l_beneficios: "What exercise does for you", l_sesion: "Today's session", l_sppb: "SPPB test (balance, gait and chair)", l_habitos: "Alcohol, tobacco and coffee", l_cribado: "Safety screening", l_pdf: "Download the report as PDF", l_compartir: "Share my plan", l_listas: "Saved lists and backup", l_ficha: "Look up a medicine", l_anadir: "Add medicines", l_ejemplo: "See an example", l_mapa: "Interactions between your medicines", l_cuando: "What time to train?",
    d_aprende: "Ten short lessons with three questions", d_porque: "What each medicine does when you move", d_beneficios: "Figures from studies for your situation", d_dosis: "The minutes and steps curve, with your point", d_mapa: "Table and network of pairs, by severity", d_cuando: "Best hours given your doses", d_glosario: "RPE, FITT, SPPB… in one line", d_ficha: "What a medicine changes, without adding it",
    d_plan: "Your week, rings and streak", d_sesion: "Guided, with timer and voice", d_programa: "From less to more; it steps up with your diary", d_rato: "5 to 30 minutes, with your exercises", d_pildoras: "One or two minutes, several times a day", d_paseo: "Metronome, voice and 8-week programme", d_biblioteca: "45 with drawings; swap the ones in your plan", d_pruebas: "Senior Fitness Test with age norms", d_sppb: "Three tests, 0 to 12 points", d_metas: "What you want to be fit for", d_calor: "Hours, water and your medicines in heat",
    d_mes: "Compare with last month", d_constantes: "Glucose, blood pressure and pulse", d_pastillero: "Your doses by time of day", d_habitos: "How they mix with your medicines", d_cribado: "Three questions before you start",
    d_simula: "Simulate stopping a medicine", d_pdf: "For you, your doctor or your trainer", d_compartir: "By WhatsApp or QR code", d_conversa: "What to say in 1, 5 or 20 minutes", d_listas: "Several people on this device",
    d_letra: "Bigger or smaller", d_tema: "Light, dark or high contrast", d_sencillo: "Only today, in large type", d_como: "Guided tour of the screen", d_guia: "The app on one page", d_presentacion: "Who it is for and how it was made", d_novedades: "What changed recently", d_sugerencia: "Tell us what is missing or broken", d_acerca: "Sources, method and author", d_legal: "Legal notice and privacy",
    s_anadir: "Start with your medicines", s_anadir_x: "By name, a photo of the box or your prescription sheet.", s_ejemplo_x: "A sample case to see what the app does.", s_como_x: "A one-minute tour of the screen.",
    s_cribado: "Complete the safety screening", s_cribado_x: "Three questions to know whether to see a doctor first.", s_calor: "It is hot today: adapt the session", s_calor_x: "Cooler hours, water and which medicines of yours matter.", s_sesion: "Today: {x}", s_sesion_x: "Guided session with timer and voice.", s_hecho: "Today's session done", s_hecho_x: "See how your week is going.", s_mayores: "{n} major interactions", s_mayores_x: "See them on the map, with what to do.", s_habitos: "Alcohol, tobacco and coffee", s_habitos_x: "Three questions to cross them with your medicines.", s_metas: "What do you want to be fit for?", s_metas_x: "Pick up to three goals and the plan will mark what trains them.", s_pruebas: "Measure your fitness", s_pruebas_x: "Six simple tests with norms for your age.", s_aprende: "Learn something in 2 minutes", s_aprende_x: "{n} of 10 lessons done.", s_pastillero: "Organise your doses", s_pastillero_x: "The pillbox sorts them by time of day.", s_copia: "Make a backup", s_copia_x: "Everything lives only on this device.", s_conversa: "Conversation guide", s_conversa_x: "Brief advice adapted to this person.", s_dosis: "How much movement is needed?", s_dosis_x: "What the large studies found." },
  ca: { titulo: "Eines", buscar: "Cerqueu eines, medicaments, exercicis…", buscar_aria: "Cerca a tota l'aplicació", hoy: "Per a vós avui", favoritas: "Les vostres preferides", fav_on: "Treu de preferides", fav_off: "Afegeix a preferides", nada: "Res amb «{q}». Proveu una altra paraula o mireu les eines de sota.", falta_meds: "Afegiu abans la medicació", solo_pro: "Mode professional", atajo: "Ctrl + K obre aquest cercador des de qualsevol pantalla.", n_res: "{n} resultats", limpiar: "Esborra la cerca",
    g_entender: "Entendre", g_moverse: "Moure's", g_seguir: "Seguir", g_consulta: "Per a la consulta", g_ajustes: "Ajustos i ajuda",
    r_herr: "Eines", r_meds: "Medicaments", r_lecc: "Lliçons de 2 minuts", r_porque: "Explicacions «Per què?»", r_ejer: "Exercicis", r_glos: "Glossari", en_lista: "a la vostra llista", ver_ficha: "Veure'n la fitxa",
    l_porque: "Per què? Explicacions animades", l_beneficios: "El que l'exercici fa per vós", l_sesion: "La sessió d'avui", l_sppb: "Prova SPPB (equilibri, marxa i cadira)", l_habitos: "Alcohol, tabac i cafè", l_cribado: "Cribratge de seguretat", l_pdf: "Descarregar l'informe en PDF", l_compartir: "Compartir el meu pla", l_listas: "Llistes desades i còpia de seguretat", l_ficha: "Consultar un medicament", l_anadir: "Afegir medicació", l_ejemplo: "Veure un exemple", l_mapa: "Interaccions entre els vostres fàrmacs", l_cuando: "A quina hora entrenar?",
    d_aprende: "Deu lliçons curtes amb tres preguntes", d_porque: "Què fa cada fàrmac en moure's, pas a pas", d_beneficios: "Xifres dels estudis per a la vostra situació", d_dosis: "La corba de minuts i passos, amb el vostre punt", d_mapa: "Taula i xarxa d'encreuaments, amb la gravetat", d_cuando: "Millors hores segons les preses", d_glosario: "RPE, FITT, SPPB… en una línia", d_ficha: "El que canvia amb un fàrmac, sense afegir-lo",
    d_plan: "La setmana, els anells i la ratxa", d_sesion: "Guiada, amb cronòmetre i veu", d_programa: "De menys a més; puja sol amb el vostre diari", d_rato: "De 5 a 30 minuts, amb els vostres exercicis", d_pildoras: "Un o dos minuts, diverses vegades al dia", d_paseo: "Metrònom, veu i programa de 8 setmanes", d_biblioteca: "45 amb dibuix; canvieu els del vostre pla", d_pruebas: "Senior Fitness Test amb barems per edat", d_sppb: "Tres proves, de 0 a 12 punts", d_metas: "Per a què voleu estar en forma", d_calor: "Hores, aigua i els vostres fàrmacs amb calor",
    d_mes: "Compareu-vos amb el mes passat", d_constantes: "Glucosa, tensió i pols del diari", d_pastillero: "Les preses per moments del dia", d_habitos: "Com es creuen amb la medicació", d_cribado: "Tres preguntes abans de començar",
    d_simula: "Simuleu retirar un medicament", d_pdf: "Per a vós, el metge o l'entrenador", d_compartir: "Per WhatsApp o amb un codi QR", d_conversa: "Què dir en 1, 5 o 20 minuts", d_listas: "Diverses persones en aquest dispositiu",
    d_letra: "Més gran o més petita", d_tema: "Clar, fosc o alt contrast", d_sencillo: "Només el d'avui, en gran", d_como: "Recorregut guiat per la pantalla", d_guia: "L'aplicació en una pàgina", d_presentacion: "Per a qui és i com es va fer", d_novedades: "L'últim que ha canviat", d_sugerencia: "Digueu-nos què falta o què falla", d_acerca: "Fonts, mètode i autor", d_legal: "Avís legal i privadesa",
    s_anadir: "Comenceu per la medicació", s_anadir_x: "Amb el nom, una foto de la capsa o el full de la recepta.", s_ejemplo_x: "Un cas de mostra per veure què fa l'aplicació.", s_como_x: "Un recorregut d'un minut per la pantalla.",
    s_cribado: "Completeu el cribratge de seguretat", s_cribado_x: "Tres preguntes per saber si convé una valoració mèdica abans.", s_calor: "Avui fa calor: adapteu la sessió", s_calor_x: "Hores més fresques, aigua i quins fàrmacs ho noten.", s_sesion: "Avui toca: {x}", s_sesion_x: "Sessió guiada amb cronòmetre i veu.", s_hecho: "Sessió d'avui feta", s_hecho_x: "Mireu com va la setmana.", s_mayores: "{n} interaccions importants", s_mayores_x: "Vegeu-les al mapa, amb què fer en cadascuna.", s_habitos: "Alcohol, tabac i cafè", s_habitos_x: "Tres preguntes per creuar-los amb la medicació.", s_metas: "Per a què voleu estar en forma?", s_metas_x: "Trieu fins a tres fites i el pla marcarà què les treballa.", s_pruebas: "Mesureu la forma física", s_pruebas_x: "Sis proves senzilles amb barems per a la vostra edat.", s_aprende: "Apreneu alguna cosa en 2 minuts", s_aprende_x: "Porteu {n} de 10 lliçons.", s_pastillero: "Ordeneu les preses", s_pastillero_x: "El pastiller les reparteix per moments del dia.", s_copia: "Feu una còpia de seguretat", s_copia_x: "Tot viu només en aquest dispositiu.", s_conversa: "Guia de conversa", s_conversa_x: "Consell breu adaptat a aquesta persona.", s_dosis: "Quant moviment cal?", s_dosis_x: "El que van trobar els grans estudis." },
  gl: { titulo: "Ferramentas", buscar: "Busque ferramentas, medicamentos, exercicios…", buscar_aria: "Buscar en toda a aplicación", hoy: "Para vostede hoxe", favoritas: "As súas favoritas", fav_on: "Quitar de favoritas", fav_off: "Engadir a favoritas", nada: "Nada con «{q}». Probe con outra palabra ou mire as ferramentas de abaixo.", falta_meds: "Engada antes a súa medicación", solo_pro: "Modo profesional", atajo: "Ctrl + K abre este buscador desde calquera pantalla.", n_res: "{n} resultados", limpiar: "Borrar a busca",
    g_entender: "Entender", g_moverse: "Moverse", g_seguir: "Seguir", g_consulta: "Para a consulta", g_ajustes: "Axustes e axuda",
    r_herr: "Ferramentas", r_meds: "Medicamentos", r_lecc: "Leccións de 2 minutos", r_porque: "Explicacións «Por que?»", r_ejer: "Exercicios", r_glos: "Glosario", en_lista: "na súa lista", ver_ficha: "Ver a súa ficha",
    l_porque: "Por que? Explicacións animadas", l_beneficios: "O que o exercicio fai por vostede", l_sesion: "A sesión de hoxe", l_sppb: "Proba SPPB (equilibrio, marcha e cadeira)", l_habitos: "Alcohol, tabaco e café", l_cribado: "Cribado de seguridade", l_pdf: "Descargar o informe en PDF", l_compartir: "Compartir o meu plan", l_listas: "Listas gardadas e copia de seguridade", l_ficha: "Consultar un medicamento", l_anadir: "Engadir medicación", l_ejemplo: "Ver un exemplo", l_mapa: "Interaccións entre os seus fármacos", l_cuando: "A que hora adestrar?",
    d_aprende: "Dez leccións curtas con tres preguntas", d_porque: "Que fai cada fármaco ao moverse, paso a paso", d_beneficios: "Cifras dos estudos para a súa situación", d_dosis: "A curva de minutos e pasos, co seu punto", d_mapa: "Táboa e rede de cruces, coa súa gravidade", d_cuando: "Mellores horas segundo as súas tomas", d_glosario: "RPE, FITT, SPPB… nunha liña", d_ficha: "O que cambia cun fármaco, sen engadilo",
    d_plan: "A súa semana, os aneis e a racha", d_sesion: "Guiada, con cronómetro e voz", d_programa: "De menos a máis; sobe só co seu diario", d_rato: "De 5 a 30 minutos, cos seus exercicios", d_pildoras: "Un ou dous minutos, varias veces ao día", d_paseo: "Metrónomo, voz e programa de 8 semanas", d_biblioteca: "45 con debuxo; cambie os do seu plan", d_pruebas: "Senior Fitness Test con baremos por idade", d_sppb: "Tres probas, de 0 a 12 puntos", d_metas: "Para que quere estar en forma", d_calor: "Horas, auga e os seus fármacos con calor",
    d_mes: "Compárese co mes pasado", d_constantes: "Glicosa, tensión e pulso do diario", d_pastillero: "As súas tomas por momentos do día", d_habitos: "Como se cruzan coa súa medicación", d_cribado: "Tres preguntas antes de empezar",
    d_simula: "Simule retirar un medicamento", d_pdf: "Para vostede, o seu médico ou o adestrador", d_compartir: "Por WhatsApp ou cun código QR", d_conversa: "Que dicir en 1, 5 ou 20 minutos", d_listas: "Varias persoas neste dispositivo",
    d_letra: "Máis grande ou máis pequena", d_tema: "Claro, escuro ou alto contraste", d_sencillo: "Só o de hoxe, en grande", d_como: "Percorrido guiado pola pantalla", d_guia: "A aplicación nunha páxina", d_presentacion: "Para quen é e como se fixo", d_novedades: "O último que cambiou", d_sugerencia: "Cóntenos que falta ou que falla", d_acerca: "Fontes, método e autor", d_legal: "Aviso legal e privacidade",
    s_anadir: "Empece pola súa medicación", s_anadir_x: "Co nome, unha foto da caixa ou a folla da receita.", s_ejemplo_x: "Un caso de mostra para ver que fai a aplicación.", s_como_x: "Un percorrido dun minuto pola pantalla.",
    s_cribado: "Complete o cribado de seguridade", s_cribado_x: "Tres preguntas para saber se convén unha valoración médica antes.", s_calor: "Hoxe vai calor: adapte a sesión", s_calor_x: "Horas máis frescas, auga e que fármacos seus o notan.", s_sesion: "Hoxe toca: {x}", s_sesion_x: "Sesión guiada con cronómetro e voz.", s_hecho: "Sesión de hoxe feita", s_hecho_x: "Mire como vai a súa semana.", s_mayores: "{n} interaccións importantes", s_mayores_x: "Véxaas no mapa, con que facer en cada unha.", s_habitos: "Alcohol, tabaco e café", s_habitos_x: "Tres preguntas para cruzalos coa súa medicación.", s_metas: "Para que quere estar en forma?", s_metas_x: "Escolla ata tres metas e o plan sinalará que as traballa.", s_pruebas: "Mida a súa forma física", s_pruebas_x: "Seis probas sinxelas con baremos para a súa idade.", s_aprende: "Aprenda algo en 2 minutos", s_aprende_x: "Leva {n} de 10 leccións.", s_pastillero: "Ordene as súas tomas", s_pastillero_x: "O pastilleiro repárteas por momentos do día.", s_copia: "Faga unha copia de seguridade", s_copia_x: "Todo vive só neste dispositivo.", s_conversa: "Guía de conversa", s_conversa_x: "Consello breve adaptado a esta persoa.", s_dosis: "Canto movemento fai falta?", s_dosis_x: "O que atoparon os grandes estudos." },
  eu: { titulo: "Tresnak", buscar: "Bilatu tresnak, botikak, ariketak…", buscar_aria: "Bilatu aplikazio osoan", hoy: "Zuretzat gaur", favoritas: "Zure gogokoak", fav_on: "Kendu gogokoetatik", fav_off: "Gehitu gogokoetara", nada: "Ezer ez «{q}» hitzarekin. Probatu beste hitz bat edo begiratu beheko tresnak.", falta_meds: "Gehitu lehenik zure botikak", solo_pro: "Profesional modua", atajo: "Ctrl + K sakatuta bilatzaile hau edozein pantailatan irekitzen da.", n_res: "{n} emaitza", limpiar: "Ezabatu bilaketa",
    g_entender: "Ulertu", g_moverse: "Mugitu", g_seguir: "Jarraitu", g_consulta: "Kontsultarako", g_ajustes: "Doikuntzak eta laguntza",
    r_herr: "Tresnak", r_meds: "Botikak", r_lecc: "2 minutuko ikasgaiak", r_porque: "«Zergatik?» azalpenak", r_ejer: "Ariketak", r_glos: "Glosarioa", en_lista: "zure zerrendan", ver_ficha: "Ikusi fitxa",
    l_porque: "Zergatik? Azalpen animatuak", l_beneficios: "Ariketak zuretzat egiten duena", l_sesion: "Gaurko saioa", l_sppb: "SPPB proba (oreka, ibilera eta aulkia)", l_habitos: "Alkohola, tabakoa eta kafea", l_cribado: "Segurtasun-baheketa", l_pdf: "Deskargatu txostena PDFan", l_compartir: "Partekatu nire plana", l_listas: "Gordetako zerrendak eta segurtasun-kopia", l_ficha: "Kontsultatu botika bat", l_anadir: "Gehitu botikak", l_ejemplo: "Ikusi adibide bat", l_mapa: "Zure botiken arteko interakzioak", l_cuando: "Zein ordutan entrenatu?",
    d_aprende: "Hamar ikasgai labur, hiru galderarekin", d_porque: "Botika bakoitzak zer egiten duen mugitzean", d_beneficios: "Azterlanen zifrak zure egoerarako", d_dosis: "Minutuen eta pausoen kurba, zure puntuarekin", d_mapa: "Gurutzaketen taula eta sarea, larritasunarekin", d_cuando: "Ordu onenak zure hartualdien arabera", d_glosario: "RPE, FITT, SPPB… lerro batean", d_ficha: "Botika batek aldatzen duena, gehitu gabe",
    d_plan: "Zure astea, eraztunak eta bolada", d_sesion: "Gidatua, kronometroarekin eta ahotsarekin", d_programa: "Gutxitik gehiagora; zure egunkariarekin igotzen da", d_rato: "5-30 minutu, zure ariketekin", d_pildoras: "Minutu bat edo bi, egunean hainbat aldiz", d_paseo: "Metronomoa, ahotsa eta 8 asteko programa", d_biblioteca: "45 marrazkiarekin; aldatu zure planekoak", d_pruebas: "Senior Fitness Test, adinaren araberako baremoekin", d_sppb: "Hiru proba, 0tik 12 puntura", d_metas: "Zertarako egon nahi duzun sasoian", d_calor: "Orduak, ura eta zure botikak beroarekin",
    d_mes: "Alderatu joan den hilarekin", d_constantes: "Egunkariko glukosa, tentsioa eta pultsua", d_pastillero: "Zure hartualdiak eguneko uneka", d_habitos: "Nola gurutzatzen diren zure botikekin", d_cribado: "Hiru galdera hasi aurretik",
    d_simula: "Simulatu botika bat kentzea", d_pdf: "Zuretzat, medikuarentzat edo entrenatzailearentzat", d_compartir: "WhatsApp bidez edo QR kodearekin", d_conversa: "Zer esan 1, 5 edo 20 minututan", d_listas: "Hainbat pertsona gailu honetan",
    d_letra: "Handiagoa edo txikiagoa", d_tema: "Argia, iluna edo kontraste handia", d_sencillo: "Gaurkoa bakarrik, handi", d_como: "Pantailan zeharreko ibilbide gidatua", d_guia: "Aplikazioa orrialde batean", d_presentacion: "Norentzat den eta nola egin zen", d_novedades: "Aldatu den azkena", d_sugerencia: "Esaguzu zer falta den edo zer dabilen gaizki", d_acerca: "Iturriak, metodoa eta egilea", d_legal: "Lege-oharra eta pribatutasuna",
    s_anadir: "Hasi zure botikekin", s_anadir_x: "Izenarekin, kaxaren argazki batekin edo errezetaren orriarekin.", s_ejemplo_x: "Lagin-kasu bat, aplikazioak zer egiten duen ikusteko.", s_como_x: "Minutu bateko ibilbidea pantailan zehar.",
    s_cribado: "Osatu segurtasun-baheketa", s_cribado_x: "Hiru galdera, aurretik mediku-balorazioa komeni den jakiteko.", s_calor: "Gaur bero egiten du: egokitu saioa", s_calor_x: "Ordu freskoagoak, ura eta zure zein botikak nabaritzen duten.", s_sesion: "Gaur: {x}", s_sesion_x: "Saio gidatua kronometroarekin eta ahotsarekin.", s_hecho: "Gaurko saioa eginda", s_hecho_x: "Begiratu nola doan zure astea.", s_mayores: "{n} interakzio garrantzitsu", s_mayores_x: "Ikusi mapan, bakoitzean zer egin.", s_habitos: "Alkohola, tabakoa eta kafea", s_habitos_x: "Hiru galdera zure botikekin gurutzatzeko.", s_metas: "Zertarako egon nahi duzu sasoian?", s_metas_x: "Aukeratu hiru helburu arte, eta planak zerk lantzen dituen adieraziko du.", s_pruebas: "Neurtu zure sasoia", s_pruebas_x: "Sei proba erraz, zure adinerako baremoekin.", s_aprende: "Ikasi zerbait 2 minututan", s_aprende_x: "10 ikasgaitik {n} eginda.", s_pastillero: "Antolatu zure hartualdiak", s_pastillero_x: "Pilula-kutxak eguneko uneka banatzen ditu.", s_copia: "Egin segurtasun-kopia bat", s_copia_x: "Dena gailu honetan bakarrik dago.", s_conversa: "Elkarrizketa-gida", s_conversa_x: "Aholku laburra, pertsona honi egokitua.", s_dosis: "Zenbat mugimendu behar da?", s_dosis_x: "Azterlan handiek aurkitu zutena." },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Iconos de trazo (24 × 24). */
const P = {
  paseo: "M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 22l2-7-3-3 1-5 4 3 3 1M8 13l-3 1M12 15l4 2 1 5",
  rato: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2.5M9 2h6",
  pildoras: "M13 3 5 14h6l-1 7 8-11h-6z",
  programa: "M4 19V9M9 19V5M14 19v-7M19 19V8M3 21h18",
  biblioteca: "M4 5h4v14H4zM10 5h4v14h-4zM16.5 6.2l3.4-1 3 12.6-3.4 1z",
  aprende: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h6M8 11h6",
  porque: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9M12 17h.01",
  beneficios: "M12 20s-7-4.4-7-9.6A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.4C19 15.6 12 20 12 20z",
  dosis: "M3 20h18M4 17c3-8 6-11 9-11s5 2 7 2",
  mapa: "M6 6h.01M18 6h.01M12 18h.01M6 6l6 12 6-12M6 6h12",
  cuando: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  glosario: "M5 4h14v16H5zM9 8h6M9 12h6M9 16h3",
  ficha: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  plan: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14l2 2 4-4",
  sesion: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM10 2h4M12 9v4l2.5 1.5",
  pruebas: "M3 12h4l2-5 4 10 2-5h6",
  sppb: "M7 21v-7h6l2-6M13 14v7M10 4a1.6 1.6 0 1 0 0-.01M5 21h14",
  metas: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  calor: "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0zM12 9v7",
  mes: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2",
  constantes: "M3 20h18M5 16l4-6 4 3 6-8",
  pastillero: "M4 6h16v12H4zM4 10h16M9.3 10v8M14.7 10v8",
  habitos: "M6 8h9v6a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4zM15 9h2a2 2 0 0 1 0 5h-2M8 3v2M12 3v2",
  cribado: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.500-7-10V6zM9 12l2 2 4-4",
  simula: "M4 7h11M4 17h7M19 7h1M15 17h5M15 4v6M11 14v6",
  pdf: "M7 3h7l4 4v14H7zM14 3v4h4M12 11v6M9.500 14.500 12 17l2.500-2.500",
  compartir: "M16 6a2.500 2.500 0 1 0 0-.01M6 12a2.500 2.500 0 1 0 0-.01M16 18a2.500 2.500 0 1 0 0-.01M8.200 11 13.800 7.200M8.200 13l5.600 3.800",
  conversa: "M4 4h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM20 9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2v3l-4-3h-3",
  listas: "M5 5h14v4H5zM5 11h14v4H5zM5 17h14v3H5zM8 7h.01M8 13h.01",
  letra: "M4 19 9 6l5 13M5.800 15h6.400M15 19l3-8 3 8M16.100 16.500h3.800",
  tema: "M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z",
  sencillo: "M5 4h14v16H5zM9 9h6M9 13h6",
  como: "M4 12h13M13 7l5 5-5 5M4 5v14",
  guia: "M6 3h9l4 4v14H6zM9 9h6M9 13h6M9 17h4",
  presentacion: "M4 5h16v11H4zM9 20h6M12 16v4",
  novedades: "M12 3l2.200 5.300 5.800.500-4.400 3.800 1.300 5.600L12 15.300 7.100 18.200l1.300-5.600L4 8.800l5.800-.500z",
  sugerencia: "M4 5h16v11H9l-5 4z",
  acerca: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.500h.01",
  legal: "M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0zM17 7l-3 7a3 3 0 0 0 6 0z",
  anadir: "M12 5v14M5 12h14",
  ejemplo: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  estrella: "M12 3.500l2.500 5.200 5.700.700-4.200 3.900 1.100 5.600L12 16.100l-5.100 2.800 1.100-5.600L3.800 9.400l5.700-.700z",
  lupa: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.300-4.300",
  ejercicio: "M12 5a1.800 1.800 0 1 0 0-.01M8 21l2-6-2-4 4-2 3 3 3 1M10 15l4 2v4",
};
const ic = (id, cls = "ce-i") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.900" stroke-linecap="round" stroke-linejoin="round"><path d="${P[id] || P.ficha}"/></svg>`;

/* Catálogo: grupo, etiqueta (clave del diccionario de la app, «k», o del módulo, «l»), palabras para el buscador y qué hace.
   d = atributo data-… que ya escucha la aplicación; tab = pestaña del informe; clic = botón que ya existe; f = función de «a»; url = página. */
export const HERRAMIENTAS = [
  { id: "aprende", g: "entender", k: "apr.menu", d: "aprende", p: "lecciones aprender curso preguntas" },
  { id: "porque", g: "entender", l: "l_porque", vista: "porque", p: "mecanismo explicacion animacion por que" },
  { id: "beneficios", g: "entender", l: "l_beneficios", f: "irBeneficios", meds: true, p: "beneficios estudios cifras evidencia" },
  { id: "dosis", g: "entender", k: "ds.menu", d: "dosis", p: "cuanto pasos minutos curva" },
  { id: "mapa", g: "entender", l: "l_mapa", tab: "interacciones", meds: true, p: "interacciones mapa cruces red" },
  { id: "cuando", g: "entender", l: "l_cuando", tab: "cuando", meds: true, p: "hora horario cuando ventana" },
  { id: "ficha", g: "entender", l: "l_ficha", clic: "#btn-consultar", p: "consultar farmaco ficha buscar medicamento" },
  { id: "glosario", g: "entender", k: "cab.glosario", clic: "#btn-glosario", p: "glosario terminos significado siglas" },
  { id: "plan", g: "moverse", k: "tab.plan", tab: "plan", meds: true, p: "plan semana anillos racha" },
  { id: "sesion", g: "moverse", l: "l_sesion", f: "sesionHoy", meds: true, p: "sesion hoy entrenar cronometro voz empezar" },
  { id: "programa", g: "moverse", k: "prg.tile", d: "programa", meds: true, p: "programa 12 semanas progresion fases subir nivel descarga" },
  { id: "rato", g: "moverse", k: "rato.titulo", d: "abre", dv: "rato", meds: true, p: "poco tiempo 5 10 20 30 minutos sesion corta rapida" },
  { id: "pildoras", g: "moverse", k: "rato.pildoras", d: "abre", dv: "rato", arg: "pildoras", p: "pildoras movimiento snacks minuto contador sentado" },
  { id: "paseo", g: "moverse", k: "paseo.btn", d: "abre", dv: "paseo", p: "paseo caminar andar metronomo ritmo pasos cadencia intervalos 8 semanas voz" },
  { id: "biblioteca", g: "moverse", k: "bib.tile", d: "biblioteca", p: "biblioteca ejercicios dibujos cambiar silla banda suelo material" },
  { id: "pruebas", g: "moverse", k: "sft.menu", d: "pruebas", p: "pruebas forma fisica test senior fitness silla" },
  { id: "sppb", g: "moverse", l: "l_sppb", clic: "#btn-sppb", p: "sppb equilibrio marcha fragilidad vivifrail" },
  { id: "metas", g: "moverse", k: "metas.menu", d: "metas", p: "metas objetivos escaleras compra nietos" },
  { id: "calor", g: "moverse", k: "calor.menu", d: "calor-ver", p: "calor verano agua hidratacion temperatura" },
  { id: "mes", g: "seguir", k: "mes.menu", d: "mes", p: "mes resumen imagen compartir familia" },
  { id: "constantes", g: "seguir", k: "ct.menu", d: "constantes", p: "constantes glucosa tension pulso graficas" },
  { id: "pastillero", g: "seguir", k: "pt.menu", d: "pastillero", meds: true, p: "pastillero tomas pastillas horas semana" },
  { id: "habitos", g: "seguir", l: "l_habitos", f: "irHabitos", p: "alcohol tabaco cafe fumar beber cafeina" },
  { id: "cribado", g: "seguir", l: "l_cribado", f: "irCribado", p: "cribado seguridad preguntas valoracion medica" },
  { id: "simula", g: "consulta", k: "sim.menu", d: "simula", meds: true, p: "simulador retirar quitar deprescribir que cambia" },
  { id: "pdf", g: "consulta", l: "l_pdf", f: "irDescargas", meds: true, p: "pdf descargar informe imprimir tarjeta nevera" },
  { id: "compartir", g: "consulta", l: "l_compartir", clic: "#btn-compartir", meds: true, p: "compartir whatsapp qr enlace" },
  { id: "conversa", g: "consulta", k: "cv.menu", d: "conversa", pro: true, p: "guia conversacion consulta consejo breve" },
  { id: "listas", g: "consulta", l: "l_listas", clic: "#btn-perfiles", p: "listas guardadas copia seguridad pacientes otro dispositivo" },
  { id: "sencillo", g: "ajustes", k: "sen.toggle", clic: "#btn-sencillo", p: "modo sencillo facil grande" },
  { id: "letra", g: "ajustes", k: "cab.letra", clic: "#btn-letra", p: "letra tamano grande accesibilidad" },
  { id: "tema", g: "ajustes", k: "cab.tema", clic: "#btn-tema", p: "tema oscuro claro contraste noche" },
  { id: "como", g: "ajustes", k: "cab.como", clic: "#btn-como", p: "como funciona recorrido ayuda tutorial" },
  { id: "guia", g: "ajustes", k: "cab.guia", url: "guia.html", p: "guia rapida manual" },
  { id: "presentacion", g: "ajustes", k: "cab.presentacion", url: "presentacion.html", p: "que es presentacion" },
  { id: "novedades", g: "ajustes", k: "cab.novedades", url: "novedades.html", p: "novedades cambios version" },
  { id: "sugerencia", g: "ajustes", k: "cab.sugerencia", clic: ".btn-sugerencia", p: "sugerencias opinion error fallo" },
  { id: "acerca", g: "ajustes", k: "cab.acerca", url: "acerca.html", p: "acerca fuentes autor metodo" },
  { id: "legal", g: "ajustes", k: "cab.legal", url: "legal.html", p: "legal privacidad aviso" },
];
const GRUPOS = ["entender", "moverse", "seguir", "consulta", "ajustes"];
const POR_ID = Object.fromEntries(HERRAMIENTAS.map((h) => [h.id, h]));
const nombre = (h) => (h.k ? t(h.k) : tx(h.l));

/** Favoritas guardadas (solo ids que siguen existiendo). */
export function leerFavoritas() { try { return JSON.parse(localStorage.getItem("medex.favoritas") || "[]").filter((id) => POR_ID[id]); } catch { return []; } }
function guardarFavoritas(l) { try { localStorage.setItem("medex.favoritas", JSON.stringify(l)); } catch {} }

/** «Para usted hoy»: hasta tres sugerencias, por orden de importancia. h = hechos que pasa la aplicación:
    { n, pro, edad, crib, calor, tipoHoy, etiquetaHoy, hecho, mayores, hab, metas, sft, lecciones, copia, hayDiario }. */
export function sugerencias(h, ahora = Date.now()) {
  const s = [];
  const pon = (id, titulo, texto, extra = {}) => s.push({ id, titulo, texto, ...extra });
  if (!h.n) {
    pon("anadir", tx("s_anadir"), tx("s_anadir_x"), { clic: "#btn-anadir" });
    pon("ejemplo", tx("l_ejemplo"), tx("s_ejemplo_x"), { clic: "#btn-ejemplo" });
    pon("como", t("cab.como"), tx("s_como_x"), { clic: "#btn-como" });
    return s;
  }
  if (h.crib === "sin_datos") pon("cribado", tx("s_cribado"), tx("s_cribado_x"));
  if ((h.calor ?? 0) >= 2) pon("calor", tx("s_calor"), tx("s_calor_x"));
  if (h.tipoHoy && h.tipoHoy !== "descanso") { if (h.hecho) pon("plan", tx("s_hecho"), tx("s_hecho_x")); else pon("sesion", tx("s_sesion", { x: h.etiquetaHoy }), tx("s_sesion_x")); }
  if (h.mayores > 0) pon("mapa", tx("s_mayores", { n: h.mayores }), tx("s_mayores_x"));
  if (h.pro) pon("conversa", tx("s_conversa"), tx("s_conversa_x"));
  if (!h.hab || Object.values(h.hab).some((v) => v == null)) pon("habitos", tx("s_habitos"), tx("s_habitos_x"));
  if (!h.metas) pon("metas", tx("s_metas"), tx("s_metas_x"));
  if ((h.edad ?? 0) >= 60 && (!h.sft || ahora - h.sft > 84 * 864e5)) pon("pruebas", tx("s_pruebas"), tx("s_pruebas_x"));
  if ((h.lecciones ?? 0) < 10) pon("aprende", tx("s_aprende"), tx("s_aprende_x", { n: h.lecciones ?? 0 }));
  if (h.n >= 5) pon("pastillero", tx("s_pastillero"), tx("s_pastillero_x"));
  if (h.hayDiario && ahora - (h.copia || 0) > 30 * 864e5) pon("listas", tx("s_copia"), tx("s_copia_x"));
  pon("dosis", tx("s_dosis"), tx("s_dosis_x"));
  return s.slice(0, 3);
}

/** Buscador: devuelve grupos de resultados para un texto. fuentes = { indice, enLista: Set(pid), lecciones, porques, ejercicios, glosario }. */
export function buscarTodo(q, f, { pro = false } = {}) {
  const n = normalizar(q); if (n.length < 2) return [];
  const pal = n.split(/\s+/).filter(Boolean);
  const casa = (txt) => { const x = normalizar(txt); return pal.every((w) => x.includes(w)); };
  const grupos = [];
  const herr = HERRAMIENTAS.filter((h) => (!h.pro || pro) && casa(`${nombre(h)} ${tx("d_" + h.id)} ${h.p}`));
  if (herr.length) grupos.push({ id: "herr", items: herr.map((h) => ({ tipo: "herr", h })) });
  if (f.indice) {
    const vistos = new Set(), meds = [];
    for (const e of buscar(f.indice, q, 12)) { if (e.tipo === "combo" || vistos.has(e.pid)) continue; vistos.add(e.pid); meds.push({ tipo: "med", e, enLista: f.enLista?.has(e.pid) }); if (meds.length >= 5) break; }
    if (meds.length) grupos.push({ id: "meds", items: meds.sort((a, b) => Number(b.enLista) - Number(a.enLista)) });
  }
  const lecc = (f.lecciones || []).filter((l) => casa(l.titulo));
  if (lecc.length) grupos.push({ id: "lecc", items: lecc.map((l) => ({ tipo: "lecc", l })) });
  const pq = (f.porques || []).filter((id) => casa(t("pq.b." + id)));
  if (pq.length) grupos.push({ id: "porque", items: pq.map((id) => ({ tipo: "porque", id })) });
  const ej = [...new Set([...(f.ejercicios || []), ...(f.masEjercicios?.() || [])])].filter((x) => casa(x));
  if (ej.length) grupos.push({ id: "ejer", items: ej.slice(0, 6).map((x) => ({ tipo: "ejer", nombre: x })) });
  const gl = Object.entries(f.glosario || {}).filter(([k, v]) => casa(k) || (n.length >= 4 && casa(v)));
  if (gl.length) grupos.push({ id: "glos", items: gl.slice(0, 5).map(([k, v]) => ({ tipo: "glos", k, v })) });
  return grupos;
}

/** Nombres de todos los ejercicios de las sesiones tipo (estándar y frágil), sin repetir. */
export function ejerciciosTipo() {
  const s = new Set();
  for (const tipo of ["fuerza_eq", "fuerza", "equilibrio"]) for (const fragil of [false, true]) for (const b of sesionTipo(tipo, { fragil }).bloques) if (b.pict && b.clave) s.add(b.nombre);
  return [...s];
}

const CSS = `
.ce-dlg { width: min(860px, calc(100vw - 16px)); }
.ce-dlg .ficha-cuerpo { padding-top: 2px; max-height: calc(100dvh - 166px); }
.ce-caja { padding: 10px 16px 8px; }
.ce-busca { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 12px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); box-shadow: var(--shadow); }
.ce-busca:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.ce-busca .ce-i { width: 20px; height: 20px; flex: none; color: var(--muted); }
#centro #ce-q, #centro #ce-q:focus, #centro #ce-q:focus-visible, #centro #ce-q:hover { flex: 1 1 auto; min-width: 0; min-height: 0; border: 0; border-radius: 0; outline: 0; box-shadow: none; background: none; color: var(--fg); font: inherit; font-size: 1rem; padding: 9px 0; -webkit-appearance: none; appearance: none; }
.ce-busca input::-webkit-search-cancel-button { display: none; }
.ce-busca button { flex: none; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 1.2rem; line-height: 1; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; }
.ce-busca button:hover { background: var(--surface-2); color: var(--fg); }
.ce-dlg .ce-tit:first-child { margin-top: 4px; }
.ce-tit { display: flex; align-items: baseline; gap: 8px; margin: 14px 0 8px; font-family: var(--mono); font-size: .72rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.ce-tit small { font: inherit; letter-spacing: 0; text-transform: none; opacity: .8; }
.ce-hoy { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; }
.ce-hoy button { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 4px 10px; align-items: center; padding: 12px; border: 1px solid var(--accent); border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface) 75%); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.ce-hoy button .ce-ic { grid-row: span 2; display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--accent); color: var(--surface); }
.ce-hoy button b { font-size: .98rem; line-height: 1.2; }
.ce-hoy button small { color: var(--muted); font-size: .8rem; line-height: 1.3; }
.ce-i { width: 22px; height: 22px; }
.ce-rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
.ce-t { position: relative; display: grid; }
.ce-t > .ce-b { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 2px 10px; align-items: center; align-content: center; padding: 10px 34px 10px 10px; min-height: 60px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; text-decoration: none; cursor: pointer; }
.ce-t > .ce-b:hover { border-color: var(--line-strong); background: var(--surface-2); }
.ce-t > .ce-b:focus-visible, .ce-hoy button:focus-visible, .ce-res button:focus-visible, .ce-fav:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.ce-b .ce-ic { grid-row: span 2; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: var(--accent-soft); color: var(--accent); }
.ce-t[data-g="entender"] .ce-ic { background: var(--info-soft); color: var(--info-ink); }
.ce-t[data-g="seguir"] .ce-ic { background: var(--precaucion-soft); color: var(--precaucion-ink); }
.ce-t[data-g="ajustes"] .ce-ic { background: var(--surface-2); color: var(--muted); }
.ce-b b { font-size: .9rem; line-height: 1.2; font-weight: 700; }
.ce-b small { color: var(--muted); font-size: .76rem; line-height: 1.25; }
.ce-t.no > .ce-b { opacity: .55; }
.ce-fav { position: absolute; top: 4px; right: 4px; display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 50%; background: transparent; color: var(--line-strong); cursor: pointer; }
.ce-fav .ce-i { width: 17px; height: 17px; }
.ce-fav:hover { background: var(--surface-2); color: var(--muted); }
.ce-fav[aria-pressed="true"] { color: var(--oro, var(--precaucion)); }
.ce-fav[aria-pressed="true"] .ce-i { fill: currentColor; }
.ce-res { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.ce-res button, .ce-res a.ce-b { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 2px 10px; align-items: center; width: 100%; padding: 9px 12px 9px 9px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; text-decoration: none; cursor: pointer; }
.ce-res button:hover, .ce-res button.activo { border-color: var(--accent); background: var(--accent-soft); }
.ce-res .ce-ic { grid-row: span 2; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--surface-2); color: var(--muted); }
.ce-res b { font-size: .92rem; line-height: 1.2; }
.ce-res small { grid-column: 2; color: var(--muted); font-size: .78rem; line-height: 1.3; }
.ce-res .ce-chip { grid-row: span 2; align-self: center; padding: 2px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-size: .7rem; font-weight: 700; white-space: nowrap; }
.ce-res li.glos { padding: 9px 12px; border: 1px dashed var(--line-strong); border-radius: var(--r-md); font-size: .88rem; }
.ce-nada { margin: 6px 0 0; padding: 14px; border: 1px dashed var(--line-strong); border-radius: var(--r-md); color: var(--muted); }
.ce-pie { margin: 16px 0 0; font-size: .76rem; color: var(--muted); }
@media (max-width: 520px) { .ce-rejilla { grid-template-columns: repeat(2, minmax(0, 1fr)); } .ce-b small { display: none; } .ce-t > .ce-b { min-height: 52px; } .ce-pie { display: none; } }
:root[data-theme="contrast"] .ce-hoy button { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .ce-hoy button { animation: ce-entra .32s var(--ease-salida, ease-out) both; } html:not(.pa-quieto) .ce-hoy button:nth-child(2) { animation-delay: .05s; } html:not(.pa-quieto) .ce-hoy button:nth-child(3) { animation-delay: .1s; } }
@keyframes ce-entra { from { opacity: 0; translate: 0 8px; } }
`;

let dlg = null, A = null, fuentes = null, vista = null;
const cu = () => dlg.querySelector("#ce-cuerpo");
const campo = () => dlg.querySelector("#ce-q");

function crear() {
  if (!document.getElementById("ce-css")) { const st = document.createElement("style"); st.id = "ce-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "centro"; dlg.className = "ficha ce-dlg"; dlg.setAttribute("aria-labelledby", "ce-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="ce-cab-t"></p><button type="button" class="btn-sec sm" id="ce-cerrar"></button></div>
    <div class="ce-caja"><div class="ce-busca" role="search">${ic("lupa")}<input type="search" id="ce-q" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button type="button" id="ce-limpiar" hidden>×</button></div></div>
    <div class="ficha-cuerpo" id="ce-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#ce-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  campo().addEventListener("input", () => { vista = null; pintar(); });
  dlg.querySelector("#ce-limpiar").addEventListener("click", () => { campo().value = ""; vista = null; pintar(); campo().focus(); });
  campo().addEventListener("keydown", (ev) => {
    const bs = [...cu().querySelectorAll(".ce-res button, .ce-res a")]; if (!bs.length) return;
    if (ev.key === "Enter") { ev.preventDefault(); (cu().querySelector(".ce-res .activo") || bs[0]).click(); }
    else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const i = bs.findIndex((b) => b.classList.contains("activo")), j = ev.key === "ArrowDown" ? (i + 1) % bs.length : (i - 1 + bs.length) % bs.length;
      bs.forEach((b, k) => b.classList.toggle("activo", k === j)); bs[j].scrollIntoView({ block: "nearest" });
    }
  });
  // Una sola escucha para todo lo que se pulsa dentro: favoritas, vistas, pestañas, botones que ya existen y funciones de la aplicación
  dlg.addEventListener("click", (ev) => {
    const fav = ev.target.closest(".ce-fav");
    if (fav) { ev.preventDefault(); const l = leerFavoritas(), id = fav.dataset.fav; guardarFavoritas(l.includes(id) ? l.filter((x) => x !== id) : [...l, id]); const y = dlg.querySelector(".ficha-cuerpo").scrollTop; pintar(); dlg.querySelector(".ficha-cuerpo").scrollTop = y; dlg.querySelector(`.ce-fav[data-fav="${id}"]`)?.focus(); return; }
    const b = ev.target.closest("[data-ce]"); if (!b) return;
    if (b.getAttribute("aria-disabled") === "true") { ev.preventDefault(); ev.stopPropagation(); A.toast(tx(b.dataset.motivo || "falta_meds"), { ms: 3500 }); return; }
    const [tipo, v] = [b.dataset.ce, b.dataset.v];
    if (tipo === "vista") { vista = v; campo().value = ""; pintar(); dlg.querySelector(".ficha-cuerpo").scrollTop = 0; return; }
    if (tipo === "url") return; // enlace normal
    dlg.close();
    if (tipo === "tab") A.irTab(v);
    else if (tipo === "clic") document.querySelector(v)?.click();
    else if (tipo === "f") A[v]?.();
    else if (tipo === "med") A.verFicha(v);
    // tipo «d»: el botón lleva su atributo data-… y lo recoge la escucha de la aplicación
  });
}

const attrsDe = (x) => x.d ? `data-ce="d" data-${x.d}="${x.dv ?? ""}"${x.arg ? ` data-arg="${x.arg}"` : ""}` : x.tab ? `data-ce="tab" data-v="${x.tab}"` : x.clic ? `data-ce="clic" data-v="${x.clic}"` : x.f ? `data-ce="f" data-v="${x.f}"` : x.vista ? `data-ce="vista" data-v="${x.vista}"` : "";
function teja(h, hechos, favs) {
  const falta = h.meds && !hechos.n;
  const cuerpo = `<span class="ce-ic">${ic(h.id)}</span><b>${nombre(h)}</b><small>${falta ? tx("falta_meds") : tx("d_" + h.id)}</small>`;
  const boton = h.url ? `<a class="ce-b" href="${h.url}" data-ce="url">${cuerpo}</a>` : `<button type="button" class="ce-b" ${attrsDe(h)}${falta ? ' aria-disabled="true"' : ""}>${cuerpo}</button>`;
  const es = favs.includes(h.id);
  return `<div class="ce-t${falta ? " no" : ""}" data-g="${h.g}" data-id="${h.id}">${boton}<button type="button" class="ce-fav" data-fav="${h.id}" aria-pressed="${es}" aria-label="${tx(es ? "fav_on" : "fav_off")}: ${nombre(h)}" title="${tx(es ? "fav_on" : "fav_off")}">${ic("estrella")}</button></div>`;
}
function resultado(r, hechos) {
  if (r.tipo === "herr") { const h = r.h, falta = h.meds && !hechos.n; const dentro = `<span class="ce-ic">${ic(h.id)}</span><b>${nombre(h)}</b><small>${falta ? tx("falta_meds") : tx("d_" + h.id)}</small>`; return h.url ? `<li><a class="ce-b" href="${h.url}" data-ce="url">${dentro}</a></li>` : `<li><button type="button" ${attrsDe(h)}${falta ? ' aria-disabled="true"' : ""}>${dentro}</button></li>`; }
  if (r.tipo === "med") return `<li><button type="button" data-ce="med" data-v="${r.e.pid}"><span class="ce-ic">${ic("ficha")}</span><b>${r.e.texto}</b><small>${tx("ver_ficha")}</small>${r.enLista ? `<span class="ce-chip">${tx("en_lista")}</span>` : ""}</button></li>`;
  if (r.tipo === "lecc") return `<li><button type="button" data-ce="d" data-aprende="${r.l.id}"><span class="ce-ic">${ic("aprende")}</span><b>${r.l.titulo}</b><small>${t("apr.menu")}</small></button></li>`;
  if (r.tipo === "porque") return `<li><button type="button" data-ce="d" data-porque="${r.id}"><span class="ce-ic">${ic("porque")}</span><b>${t("pq.b." + r.id)}</b><small>${tx("d_porque")}</small></button></li>`;
  if (r.tipo === "ejer") return `<li><button type="button" data-ce="d" data-ejercicio="${r.nombre}"><span class="ce-ic">${ic("ejercicio")}</span><b>${r.nombre}</b><small>${t("ej.ver")}</small></button></li>`;
  return `<li class="glos"><b>${r.k}</b>: ${r.v}</li>`;
}

function pintar() {
  const hechos = A.hechos(), favs = leerFavoritas(), q = campo().value.trim();
  dlg.querySelector("#ce-limpiar").hidden = !q && !vista;
  if (vista === "porque") {
    cu().innerHTML = `<h3 class="ce-tit">${tx("r_porque")}</h3><ul class="ce-res">${(fuentes.porques || []).map((id) => resultado({ tipo: "porque", id }, hechos)).join("")}</ul>`;
    return;
  }
  if (q.length >= 2) {
    const grupos = buscarTodo(q, fuentes, { pro: hechos.pro });
    const n = grupos.reduce((s, g) => s + g.items.length, 0);
    cu().innerHTML = n ? `<p class="sr-only" role="status">${tx("n_res", { n })}</p>` + grupos.map((g) => `<h3 class="ce-tit">${tx("r_" + g.id)} <small>${g.items.length}</small></h3><ul class="ce-res">${g.items.map((r) => resultado(r, hechos)).join("")}</ul>`).join("")
      : `<p class="ce-nada" role="status">${tx("nada", { q: q.replace(/[<>&"]/g, "") })}</p>`;
    cu().querySelector(".ce-res button, .ce-res a")?.classList.add("activo");
    return;
  }
  const sug = sugerencias(hechos);
  const visibles = HERRAMIENTAS.filter((h) => !h.pro || hechos.pro);
  cu().innerHTML = `<h3 class="ce-tit">${tx("hoy")}</h3><div class="ce-hoy">${sug.map((s) => { const h = POR_ID[s.id]; return `<button type="button" ${s.clic ? `data-ce="clic" data-v="${s.clic}"` : attrsDe(h)}><span class="ce-ic">${ic(P[s.id] ? s.id : "ficha")}</span><b>${s.titulo}</b><small>${s.texto}</small></button>`; }).join("")}</div>
    ${favs.length ? `<h3 class="ce-tit">${tx("favoritas")}</h3><div class="ce-rejilla ce-favs">${favs.map((id) => teja(POR_ID[id], hechos, favs)).join("")}</div>` : ""}
    ${GRUPOS.map((g) => { const l = visibles.filter((h) => h.g === g); return l.length ? `<h3 class="ce-tit">${tx("g_" + g)}</h3><div class="ce-rejilla">${l.map((h) => teja(h, hechos, favs)).join("")}</div>` : ""; }).join("")}
    <p class="ce-pie">${tx("atajo")}</p>`;
}

/** Abre el centro. a = { hechos(), indice, enLista (Set de pid), glosario, porques (ids), cargarAprende(), toast, irTab(t), verFicha(pid),
    sesionHoy(), irHabitos(), irCribado(), irBeneficios(), irDescargas() }. opts.foco: poner el cursor en el buscador. */
export function abrir(a, { foco = false } = {}) {
  if (!dlg) crear();
  A = a; vista = null;
  fuentes = { indice: a.indice, enLista: a.enLista, glosario: a.glosario, porques: a.porques, ejercicios: ejerciciosTipo(), masEjercicios: a.masEjercicios, lecciones: fuentes?.lecciones || [] };
  a.cargarAprende?.().then((m) => { fuentes.lecciones = (m.LECCIONES || []).map((l) => ({ id: l.id, titulo: l.titulo })); }).catch(() => {});
  dlg.querySelector("#ce-cab-t").textContent = tx("titulo");
  dlg.querySelector("#ce-cerrar").textContent = t("ficha.cerrar");
  campo().placeholder = tx("buscar"); campo().setAttribute("aria-label", tx("buscar_aria")); dlg.querySelector("#ce-limpiar").setAttribute("aria-label", tx("limpiar"));
  campo().value = "";
  pintar();
  if (!dlg.open) dlg.showModal();
  dlg.querySelector(".ficha-cuerpo").scrollTop = 0;
  if (foco || matchMedia("(hover: hover) and (pointer: fine)").matches) campo().focus(); else dlg.querySelector("#ce-cerrar").focus();
}
