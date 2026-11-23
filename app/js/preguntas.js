/* Mis preguntas para la consulta (segunda tanda de mejoras grandes, 11). Se carga bajo demanda (data-abre="preguntas").
   Con los avisos del informe, las interacciones, los efectos de la medicación, el cribado y los hábitos propone preguntas para
   llevar al médico, la enfermera o el farmacéutico. La persona elige, añade las suyas y las imprime, las comparte o las copia.
   Son preguntas, no consejos: no dicen qué hacer, sino qué preguntar. Estado en localStorage («medex.preguntas»):
   { sel: [ids], propias: [{ t, s }], lista: bool }. Textos en cinco idiomas. */
import { idioma } from "./i18n.js?v=202611230120";
import { APP_VERSION } from "./version.js?v=202611230120";

const TXT = {
  es: { titulo: "Mis preguntas para la consulta", intro: "Elija las que quiera llevar a su médico, enfermera o farmacéutico. Con dos o tres basta: la consulta es corta.", sin_meds: "Añada su medicación y las preguntas se ajustarán a ella. Mientras tanto, estas sirven para cualquier consulta.",
    elegidas0: "Ninguna elegida todavía", elegidas1: "1 elegida", elegidas: "{n} elegidas", sugeridas: "Marcar las sugeridas", sugerida: "Sugerida", limpiar: "Desmarcar todas",
    g_propias: "Sus propias preguntas", g_empezar: "Antes de empezar", g_meds: "Por su medicación", g_combi: "Por las combinaciones", g_habitos: "Por sus hábitos", g_general: "Para cualquier consulta",
    propia_l: "Añada una pregunta suya", propia_ph: "Escriba aquí su pregunta", anadir: "Añadir", quitar: "Quitar", con_lista: "Incluir mi lista de medicación en la hoja",
    imprimir: "Imprimir", compartir: "Compartir", copiar: "Copiar", copiado: "Preguntas copiadas.", copia_error: "No se ha podido copiar.", falta: "Elija al menos una pregunta.",
    consejo: "Empiece por la que más le preocupa. Si no da tiempo a todas, pregunte cuándo puede resolver el resto.",
    hoja_fecha: "Fecha", hoja_nombre: "Nombre", hoja_meds: "Mi medicación", hoja_pie: "Preparada con Pauta Activa. Esta hoja es para hablar en la consulta: no sustituye el consejo de su médico.",
    q_empezar_valoracion: "¿Puedo empezar a hacer ejercicio ya o necesito antes alguna prueba o revisión?", q_empezar_intenso: "Ya hago ejercicio moderado: ¿puedo pasar a ejercicio intenso?", q_parar: "¿Qué síntomas deben hacerme parar y consultar?", q_que_ejercicio: "¿Qué tipo de ejercicio me conviene más y cuál debería evitar?",
    q_aviso: "En mi informe sale un aviso importante con {x}: ¿qué debo tener en cuenta al hacer ejercicio?",
    q_azucar: "Con {x}: ¿tengo que medirme el azúcar antes y después del ejercicio? ¿Con qué cifra no debo empezar?", q_azucar_oculta: "Con {x} pueden pasar desapercibidos los síntomas de una bajada de azúcar: ¿en qué debo fijarme?", q_pulso: "Con {x} el pulso no me sirve de guía: ¿cómo sé si el esfuerzo es el adecuado?",
    q_mareo: "Si me mareo al levantarme o al terminar el ejercicio, ¿qué hago? ¿Puede tener que ver con {x}?", q_calor_agua: "Los días de mucho calor, o si tengo vómitos o diarrea, ¿tengo que cambiar algo con {x}?", q_analisis: "Si empiezo a hacer más ejercicio, ¿necesito algún análisis (sodio, potasio, riñón) por {x}?",
    q_golpes: "Con {x}: ¿qué ejercicios o deportes debo evitar por el riesgo de golpes, y qué hago si me doy uno?", q_musculo: "Si noto dolor o debilidad muscular con {x}, ¿cuándo debo consultar?", q_tendon: "Con {x}: ¿hasta cuándo debo evitar saltos, carreras y cargas altas?",
    q_sueno: "Con {x} puedo notar sueño: ¿a qué hora conviene la toma para entrenar con seguridad?", q_caidas: "Me preocupan las caídas: ¿puede tener que ver con {x}? ¿Se puede ajustar?", q_caidas0: "Me preocupan las caídas: ¿alguno de mis medicamentos puede influir?",
    q_hueso: "Con {x}: ¿me conviene hacer ejercicios de fuerza para proteger el hueso y el músculo?", q_cafe: "Con {x}: ¿puedo tomar café, bebidas energéticas o preentrenos antes de entrenar?", q_sol: "Con {x}: ¿tengo que protegerme del sol de forma especial si entreno al aire libre?",
    q_calor: "Con {x}: ¿aguanto peor el calor? ¿Qué precauciones tomo en verano?", q_tension_alta: "Con {x}: ¿qué cifra de tensión es demasiado alta para entrenar ese día?", q_cansancio: "Me noto con menos energía para el ejercicio: ¿puede ser por {x}?",
    q_defensas: "Con {x}: ¿puedo ir al gimnasio o a la piscina con normalidad?", q_dopaje: "Compito con licencia: ¿necesito una autorización de uso terapéutico por {x}?", q_trombosis: "Con {x}: ¿qué síntomas en las piernas o al respirar deben hacerme consultar?",
    q_ddi: "Tomo {x} a la vez: ¿hay que ajustar algo o vigilar algún síntoma?", q_poli: "Tomo {n} medicamentos: ¿podemos revisar si los sigo necesitando todos?", q_hora: "Si entreno por la mañana (o por la tarde), ¿me conviene cambiar la hora de alguna pastilla?",
    q_alcohol: "¿El alcohol que tomo cambia algo con mi medicación o con el ejercicio?", q_tabaco: "Quiero dejar de fumar: ¿qué ayuda hay y cómo encaja con el ejercicio?", q_cafeina: "Tomo bastante café: ¿influye en mi medicación o en el pulso al entrenar?",
    q_suplementos: "¿Puedo tomar suplementos (proteína, creatina, magnesio…) con mi medicación?", q_objetivo: "¿Qué objetivo razonable puedo marcarme para los próximos tres meses?", q_seguimiento: "¿Cuándo conviene que volvamos a revisar cómo voy?", q_dolor: "Si me duele una articulación al hacer ejercicio, ¿sigo, cambio o paro?",
  },
  en: { titulo: "My questions for the appointment", intro: "Choose the ones you want to take to your doctor, nurse or pharmacist. Two or three are enough: appointments are short.", sin_meds: "Add your medication and the questions will adapt to it. Meanwhile, these work for any appointment.",
    elegidas0: "None chosen yet", elegidas1: "1 chosen", elegidas: "{n} chosen", sugeridas: "Tick the suggested ones", sugerida: "Suggested", limpiar: "Untick all",
    g_propias: "Your own questions", g_empezar: "Before starting", g_meds: "Because of your medication", g_combi: "Because of the combinations", g_habitos: "Because of your habits", g_general: "For any appointment",
    propia_l: "Add a question of your own", propia_ph: "Write your question here", anadir: "Add", quitar: "Remove", con_lista: "Include my medication list on the sheet",
    imprimir: "Print", compartir: "Share", copiar: "Copy", copiado: "Questions copied.", copia_error: "Could not copy.", falta: "Choose at least one question.",
    consejo: "Start with the one that worries you most. If there is no time for all of them, ask when you can sort out the rest.",
    hoja_fecha: "Date", hoja_nombre: "Name", hoja_meds: "My medication", hoja_pie: "Prepared with Pauta Activa. This sheet is for talking at the appointment: it does not replace your doctor's advice.",
    q_empezar_valoracion: "Can I start exercising now, or do I need a test or check-up first?", q_empezar_intenso: "I already do moderate exercise: can I move on to vigorous exercise?", q_parar: "Which symptoms should make me stop and seek advice?", q_que_ejercicio: "Which kind of exercise suits me best, and which should I avoid?",
    q_aviso: "My report shows an important warning with {x}: what should I bear in mind when exercising?",
    q_azucar: "With {x}: do I need to check my blood sugar before and after exercise? At what reading should I not start?", q_azucar_oculta: "With {x} the symptoms of low blood sugar can go unnoticed: what should I look out for?", q_pulso: "With {x} my pulse is not a good guide: how do I know the effort is right?",
    q_mareo: "If I feel dizzy when I stand up or when I finish exercising, what should I do? Could it be related to {x}?", q_calor_agua: "On very hot days, or if I have vomiting or diarrhoea, should I change anything about {x}?", q_analisis: "If I start exercising more, do I need any blood test (sodium, potassium, kidney) because of {x}?",
    q_golpes: "With {x}: which exercises or sports should I avoid because of the risk of knocks, and what do I do if I get one?", q_musculo: "If I notice muscle pain or weakness with {x}, when should I seek advice?", q_tendon: "With {x}: until when should I avoid jumping, running and heavy loads?",
    q_sueno: "With {x} I may feel sleepy: what is the best time for the dose so I can train safely?", q_caidas: "I am worried about falls: could it be related to {x}? Can it be adjusted?", q_caidas0: "I am worried about falls: could any of my medicines be involved?",
    q_hueso: "With {x}: should I do strength exercises to protect bone and muscle?", q_cafe: "With {x}: can I have coffee, energy drinks or pre-workout products before training?", q_sol: "With {x}: do I need special sun protection if I train outdoors?",
    q_calor: "With {x}: do I cope worse with heat? What precautions should I take in summer?", q_tension_alta: "With {x}: what blood pressure reading is too high to train that day?", q_cansancio: "I have less energy for exercise: could it be because of {x}?",
    q_defensas: "With {x}: can I go to the gym or the pool as normal?", q_dopaje: "I compete with a licence: do I need a therapeutic use exemption for {x}?", q_trombosis: "With {x}: which symptoms in my legs or breathing should make me seek advice?",
    q_ddi: "I take {x} together: does anything need adjusting, or should I watch for any symptom?", q_poli: "I take {n} medicines: can we review whether I still need them all?", q_hora: "If I train in the morning (or in the afternoon), should I change the time of any tablet?",
    q_alcohol: "Does the alcohol I drink change anything with my medication or with exercise?", q_tabaco: "I want to stop smoking: what help is there, and how does it fit with exercise?", q_cafeina: "I drink quite a lot of coffee: does it affect my medication or my pulse when training?",
    q_suplementos: "Can I take supplements (protein, creatine, magnesium…) with my medication?", q_objetivo: "What reasonable goal can I set for the next three months?", q_seguimiento: "When should we review how I am doing?", q_dolor: "If a joint hurts when I exercise, do I carry on, change or stop?",
  },
  ca: { titulo: "Les meves preguntes per a la consulta", intro: "Trieu les que vulgueu portar al metge, la infermera o el farmacèutic. Amb dues o tres n'hi ha prou: la consulta és curta.", sin_meds: "Afegiu la vostra medicació i les preguntes s'hi ajustaran. Mentrestant, aquestes serveixen per a qualsevol consulta.",
    elegidas0: "Cap de triada encara", elegidas1: "1 triada", elegidas: "{n} triades", sugeridas: "Marcar les suggerides", sugerida: "Suggerida", limpiar: "Desmarcar-les totes",
    g_propias: "Les vostres pròpies preguntes", g_empezar: "Abans de començar", g_meds: "Per la vostra medicació", g_combi: "Per les combinacions", g_habitos: "Pels vostres hàbits", g_general: "Per a qualsevol consulta",
    propia_l: "Afegiu una pregunta vostra", propia_ph: "Escriviu aquí la vostra pregunta", anadir: "Afegir", quitar: "Treure", con_lista: "Incloure la meva llista de medicació al full",
    imprimir: "Imprimir", compartir: "Compartir", copiar: "Copiar", copiado: "Preguntes copiades.", copia_error: "No s'ha pogut copiar.", falta: "Trieu almenys una pregunta.",
    consejo: "Comenceu per la que més us preocupa. Si no hi ha temps per a totes, pregunteu quan podeu resoldre la resta.",
    hoja_fecha: "Data", hoja_nombre: "Nom", hoja_meds: "La meva medicació", hoja_pie: "Preparat amb Pauta Activa. Aquest full és per parlar a la consulta: no substitueix el consell del vostre metge.",
    q_empezar_valoracion: "Puc començar a fer exercici ja o necessito abans alguna prova o revisió?", q_empezar_intenso: "Ja faig exercici moderat: puc passar a exercici intens?", q_parar: "Quins símptomes m'han de fer parar i consultar?", q_que_ejercicio: "Quin tipus d'exercici em convé més i quin hauria d'evitar?",
    q_aviso: "Al meu informe surt un avís important amb {x}: què he de tenir en compte en fer exercici?",
    q_azucar: "Amb {x}: m'he de mesurar el sucre abans i després de l'exercici? Amb quina xifra no he de començar?", q_azucar_oculta: "Amb {x} poden passar desapercebuts els símptomes d'una baixada de sucre: en què m'he de fixar?", q_pulso: "Amb {x} el pols no em serveix de guia: com sé si l'esforç és l'adequat?",
    q_mareo: "Si em marejo en aixecar-me o en acabar l'exercici, què faig? Pot tenir a veure amb {x}?", q_calor_agua: "Els dies de molta calor, o si tinc vòmits o diarrea, he de canviar alguna cosa amb {x}?", q_analisis: "Si començo a fer més exercici, necessito alguna anàlisi (sodi, potassi, ronyó) per {x}?",
    q_golpes: "Amb {x}: quins exercicis o esports he d'evitar pel risc de cops, i què faig si me'n dono un?", q_musculo: "Si noto dolor o debilitat muscular amb {x}, quan he de consultar?", q_tendon: "Amb {x}: fins quan he d'evitar salts, curses i càrregues altes?",
    q_sueno: "Amb {x} puc tenir son: a quina hora convé la presa per entrenar amb seguretat?", q_caidas: "Em preocupen les caigudes: pot tenir a veure amb {x}? Es pot ajustar?", q_caidas0: "Em preocupen les caigudes: algun dels meus medicaments hi pot influir?",
    q_hueso: "Amb {x}: em convé fer exercicis de força per protegir l'os i el múscul?", q_cafe: "Amb {x}: puc prendre cafè, begudes energètiques o preentrenaments abans d'entrenar?", q_sol: "Amb {x}: m'he de protegir del sol de manera especial si entreno a l'aire lliure?",
    q_calor: "Amb {x}: aguanto pitjor la calor? Quines precaucions prenc a l'estiu?", q_tension_alta: "Amb {x}: quina xifra de tensió és massa alta per entrenar aquell dia?", q_cansancio: "Em noto amb menys energia per a l'exercici: pot ser per {x}?",
    q_defensas: "Amb {x}: puc anar al gimnàs o a la piscina amb normalitat?", q_dopaje: "Competeixo amb llicència: necessito una autorització d'ús terapèutic per {x}?", q_trombosis: "Amb {x}: quins símptomes a les cames o en respirar m'han de fer consultar?",
    q_ddi: "Prenc {x} alhora: cal ajustar alguna cosa o vigilar algun símptoma?", q_poli: "Prenc {n} medicaments: podem revisar si els continuo necessitant tots?", q_hora: "Si entreno al matí (o a la tarda), em convé canviar l'hora d'alguna pastilla?",
    q_alcohol: "L'alcohol que prenc canvia alguna cosa amb la meva medicació o amb l'exercici?", q_tabaco: "Vull deixar de fumar: quina ajuda hi ha i com encaixa amb l'exercici?", q_cafeina: "Prenc força cafè: influeix en la meva medicació o en el pols en entrenar?",
    q_suplementos: "Puc prendre suplements (proteïna, creatina, magnesi…) amb la meva medicació?", q_objetivo: "Quin objectiu raonable em puc marcar per als propers tres mesos?", q_seguimiento: "Quan convé que tornem a revisar com vaig?", q_dolor: "Si em fa mal una articulació en fer exercici, continuo, canvio o paro?",
  },
  gl: { titulo: "As miñas preguntas para a consulta", intro: "Escolla as que queira levar ao seu médico, enfermeira ou farmacéutico. Con dúas ou tres abonda: a consulta é curta.", sin_meds: "Engada a súa medicación e as preguntas axustaranse a ela. Mentres tanto, estas serven para calquera consulta.",
    elegidas0: "Ningunha escollida aínda", elegidas1: "1 escollida", elegidas: "{n} escollidas", sugeridas: "Marcar as suxeridas", sugerida: "Suxerida", limpiar: "Desmarcar todas",
    g_propias: "As súas propias preguntas", g_empezar: "Antes de comezar", g_meds: "Pola súa medicación", g_combi: "Polas combinacións", g_habitos: "Polos seus hábitos", g_general: "Para calquera consulta",
    propia_l: "Engada unha pregunta súa", propia_ph: "Escriba aquí a súa pregunta", anadir: "Engadir", quitar: "Quitar", con_lista: "Incluír a miña lista de medicación na folla",
    imprimir: "Imprimir", compartir: "Compartir", copiar: "Copiar", copiado: "Preguntas copiadas.", copia_error: "Non se puido copiar.", falta: "Escolla polo menos unha pregunta.",
    consejo: "Comece pola que máis lle preocupa. Se non dá tempo a todas, pregunte cando pode resolver o resto.",
    hoja_fecha: "Data", hoja_nombre: "Nome", hoja_meds: "A miña medicación", hoja_pie: "Preparada con Pauta Activa. Esta folla é para falar na consulta: non substitúe o consello do seu médico.",
    q_empezar_valoracion: "Podo comezar a facer exercicio xa ou necesito antes algunha proba ou revisión?", q_empezar_intenso: "Xa fago exercicio moderado: podo pasar a exercicio intenso?", q_parar: "Que síntomas deben facerme parar e consultar?", q_que_ejercicio: "Que tipo de exercicio me convén máis e cal debería evitar?",
    q_aviso: "No meu informe sae un aviso importante con {x}: que debo ter en conta ao facer exercicio?",
    q_azucar: "Con {x}: teño que medir o azucre antes e despois do exercicio? Con que cifra non debo comezar?", q_azucar_oculta: "Con {x} poden pasar desapercibidos os síntomas dunha baixada de azucre: en que me debo fixar?", q_pulso: "Con {x} o pulso non me serve de guía: como sei se o esforzo é o axeitado?",
    q_mareo: "Se me mareo ao erguerme ou ao rematar o exercicio, que fago? Pode ter que ver con {x}?", q_calor_agua: "Os días de moita calor, ou se teño vómitos ou diarrea, teño que cambiar algo con {x}?", q_analisis: "Se comezo a facer máis exercicio, necesito algunha análise (sodio, potasio, ril) por {x}?",
    q_golpes: "Con {x}: que exercicios ou deportes debo evitar polo risco de golpes, e que fago se me dou un?", q_musculo: "Se noto dor ou debilidade muscular con {x}, cando debo consultar?", q_tendon: "Con {x}: ata cando debo evitar saltos, carreiras e cargas altas?",
    q_sueno: "Con {x} podo notar sono: a que hora convén a toma para adestrar con seguridade?", q_caidas: "Preocúpanme as caídas: pode ter que ver con {x}? Pódese axustar?", q_caidas0: "Preocúpanme as caídas: algún dos meus medicamentos pode influír?",
    q_hueso: "Con {x}: convenme facer exercicios de forza para protexer o óso e o músculo?", q_cafe: "Con {x}: podo tomar café, bebidas enerxéticas ou preadestramentos antes de adestrar?", q_sol: "Con {x}: teño que protexerme do sol de forma especial se adestro ao aire libre?",
    q_calor: "Con {x}: aguanto peor a calor? Que precaucións tomo no verán?", q_tension_alta: "Con {x}: que cifra de tensión é demasiado alta para adestrar ese día?", q_cansancio: "Nótome con menos enerxía para o exercicio: pode ser por {x}?",
    q_defensas: "Con {x}: podo ir ao ximnasio ou á piscina con normalidade?", q_dopaje: "Compito con licenza: necesito unha autorización de uso terapéutico por {x}?", q_trombosis: "Con {x}: que síntomas nas pernas ou ao respirar deben facerme consultar?",
    q_ddi: "Tomo {x} á vez: hai que axustar algo ou vixiar algún síntoma?", q_poli: "Tomo {n} medicamentos: podemos revisar se os sigo necesitando todos?", q_hora: "Se adestro pola mañá (ou pola tarde), convenme cambiar a hora dalgunha pastilla?",
    q_alcohol: "O alcohol que tomo cambia algo coa miña medicación ou co exercicio?", q_tabaco: "Quero deixar de fumar: que axuda hai e como encaixa co exercicio?", q_cafeina: "Tomo bastante café: inflúe na miña medicación ou no pulso ao adestrar?",
    q_suplementos: "Podo tomar suplementos (proteína, creatina, magnesio…) coa miña medicación?", q_objetivo: "Que obxectivo razoable podo marcarme para os próximos tres meses?", q_seguimiento: "Cando convén que volvamos revisar como vou?", q_dolor: "Se me doe unha articulación ao facer exercicio, sigo, cambio ou paro?",
  },
  eu: { titulo: "Nire galderak kontsultarako", intro: "Aukeratu zure medikuari, erizainari edo farmazialariari eraman nahi dizkiozunak. Bi edo hirurekin nahikoa da: kontsulta laburra da.", sin_meds: "Gehitu zure botikak eta galderak haietara egokituko dira. Bitartean, hauek edozein kontsultarako balio dute.",
    elegidas0: "Oraindik bat ere ez aukeratuta", elegidas1: "1 aukeratuta", elegidas: "{n} aukeratuta", sugeridas: "Markatu iradokitakoak", sugerida: "Iradokia", limpiar: "Kendu marka guztiei",
    g_propias: "Zure galderak", g_empezar: "Hasi aurretik", g_meds: "Zure botikengatik", g_combi: "Konbinazioengatik", g_habitos: "Zure ohiturengatik", g_general: "Edozein kontsultarako",
    propia_l: "Gehitu zure galdera bat", propia_ph: "Idatzi hemen zure galdera", anadir: "Gehitu", quitar: "Kendu", con_lista: "Sartu nire botiken zerrenda orrian",
    imprimir: "Inprimatu", compartir: "Partekatu", copiar: "Kopiatu", copiado: "Galderak kopiatuta.", copia_error: "Ezin izan da kopiatu.", falta: "Aukeratu gutxienez galdera bat.",
    consejo: "Hasi gehien kezkatzen zaituenetik. Denetarako astirik ez badago, galdetu gainerakoak noiz argitu ditzakezun.",
    hoja_fecha: "Data", hoja_nombre: "Izena", hoja_meds: "Nire botikak", hoja_pie: "Pauta Activarekin prestatua. Orri hau kontsultan hitz egiteko da: ez du zure medikuaren aholkua ordezkatzen.",
    q_empezar_valoracion: "Has naiteke ariketa egiten jada, ala aurretik proba edo azterketaren bat behar dut?", q_empezar_intenso: "Ariketa moderatua egiten dut jada: ariketa bizira pasa naiteke?", q_parar: "Zein sintomak behartu behar naute gelditzera eta kontsultatzera?", q_que_ejercicio: "Zein ariketa mota komeni zait gehien eta zein saihestu beharko nuke?",
    q_aviso: "Nire txostenean ohar garrantzitsu bat ageri da ({x}): zer hartu behar dut kontuan ariketa egitean?",
    q_azucar: "{x} hartzen dut: azukrea neurtu behar dut ariketaren aurretik eta ondoren? Zein zifrarekin ez dut hasi behar?", q_azucar_oculta: "{x} hartuta azukre-jaitsieraren sintomak oharkabean pasa daitezke: zeri erreparatu behar diot?", q_pulso: "{x} hartuta, pultsuak ez dit gidari gisa balio: nola jakin esfortzua egokia den?",
    q_mareo: "Altxatzean edo ariketa amaitzean zorabiatzen banaiz, zer egin behar dut? Zerikusia izan dezake honekin: {x}?", q_calor_agua: "{x} hartzen dut: bero handiko egunetan, edo goragalea edo beherakoa badut, zerbait aldatu behar dut?", q_analisis: "{x} hartzen dut: ariketa gehiago egiten hasten banaiz, analisiren bat behar dut (sodioa, potasioa, giltzurruna)?",
    q_golpes: "{x} hartzen dut: zein ariketa edo kirol saihestu behar ditut kolpe-arriskuagatik, eta zer egin kolpe bat hartzen badut?", q_musculo: "{x} hartuta giharretako mina edo ahultasuna nabaritzen badut, noiz kontsultatu behar dut?", q_tendon: "{x} hartzen dut: noiz arte saihestu behar ditut jauziak, lasterketak eta karga handiak?",
    q_sueno: "{x} hartuta logura izan dezaket: zein ordutan komeni da hartzea segurtasunez entrenatzeko?", q_caidas: "Erorikoek kezkatzen naute: zerikusia izan dezake honekin: {x}? Doitu daiteke?", q_caidas0: "Erorikoek kezkatzen naute: nire botiketakoren batek eragin dezake?",
    q_hueso: "{x} hartzen dut: komeni zait indar-ariketak egitea hezurra eta giharra babesteko?", q_cafe: "{x} hartzen dut: har ditzaket kafea, edari energetikoak edo entrenamendu aurrekoak entrenatu aurretik?", q_sol: "{x} hartzen dut: eguzkitik bereziki babestu behar dut kanpoan entrenatzen badut?",
    q_calor: "{x} hartzen dut: beroa okerrago jasaten dut? Zer neurri hartu behar ditut udan?", q_tension_alta: "{x} hartzen dut: zein tentsio-zifra da altuegia egun horretan entrenatzeko?", q_cansancio: "Ariketarako energia gutxiago nabaritzen dut: izan daiteke honengatik: {x}?",
    q_defensas: "{x} hartzen dut: joan naiteke gimnasiora edo igerilekura normaltasunez?", q_dopaje: "Lizentziarekin lehiatzen naiz: erabilera terapeutikorako baimena behar dut honengatik: {x}?", q_trombosis: "{x} hartzen dut: hanketako edo arnasketako zein sintomak eraman behar naute kontsultatzera?",
    q_ddi: "{x} batera hartzen ditut: zerbait doitu behar da edo sintomaren bat zaindu?", q_poli: "{n} botika hartzen ditut: berrikus dezakegu denak behar ditudan oraindik?", q_hora: "Goizean (edo arratsaldean) entrenatzen badut, komeni zait pilularen baten ordua aldatzea?",
    q_alcohol: "Hartzen dudan alkoholak zerbait aldatzen du nire botikekin edo ariketarekin?", q_tabaco: "Erretzeari utzi nahi diot: zer laguntza dago eta nola uztartzen da ariketarekin?", q_cafeina: "Kafe dezente hartzen dut: eragiten du nire botiketan edo entrenatzean dudan pultsuan?",
    q_suplementos: "Har ditzaket osagarriak (proteina, kreatina, magnesioa…) nire botikekin?", q_objetivo: "Zein helburu zentzudun jar dezaket hurrengo hiru hilabeteetarako?", q_seguimiento: "Noiz komeni da nola nabilen berriro berrikustea?", q_dolor: "Ariketa egitean artikulazio batek min ematen badit, jarraitu, aldatu ala gelditu?",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };
const enLista = (l) => { try { return new Intl.ListFormat(idioma(), { style: "long", type: "conjunction" }).format(l); } catch { return l.join(", "); } };

export const GRUPOS = ["empezar", "meds", "combi", "habitos", "general"];
/* Preguntas por efecto de la medicación: [id, señales de la base que la hacen salir, importancia]. El texto es «q_<id>» y nombra los medicamentos. */
export const POR_SENAL = [
  ["azucar", ["hipoglucemia"], 80], ["golpes", ["sangrado"], 78], ["pulso", ["fc_no_valida", "bradicardia"], 76], ["mareo", ["hipotension"], 74], ["calor_agua", ["deshidratacion", "renal", "litio"], 72],
  ["tendon", ["tendon"], 70], ["musculo", ["miopatia"], 68], ["sueno", ["sedacion"], 64], ["cafe", ["qt", "taquicardia"], 58], ["analisis", ["hiperpotasemia", "hipopotasemia", "hiponatremia"], 56],
  ["hueso", ["hueso", "perdida_muscular"], 54], ["tension_alta", ["hipertension"], 52], ["calor", ["calor", "anticolinergico"], 50], ["trombosis", ["trombosis"], 48], ["defensas", ["inmunosupresion"], 46],
  ["sol", ["fotosensibilidad"], 44], ["cansancio", ["fatiga"], 42], ["dopaje", ["dopaje"], 40],
];
const MAX_NOMBRES = 3, MAX_DDI = 3, MAX_AVISOS = 2;

/** Genera las preguntas. d = { items: [{ pid, nombre, senales: [], alerta }], inter: [{ a, b, nivel }] (nombres), habitos: { alcohol, tabaco, cafe },
    crib (clave del cribado), caidas (bool), n (medicamentos) }. Devuelve [{ id, g, pr, base, vars }] ordenadas por grupo e importancia. */
export function generar(d = {}) {
  const items = d.items || [], P = [];
  const pon = (id, g, pr, base = id, vars = {}) => P.push({ id, g, pr, base, vars });
  const nombres = (l) => enLista([...new Set(l.map((it) => it.nombre))].slice(0, MAX_NOMBRES));
  if (d.crib === "valoracion_antes" || d.crib === "parar") pon("empezar_valoracion", "empezar", 100);
  if (d.crib === "valoracion_vigoroso") pon("empezar_intenso", "empezar", 95);
  pon("parar", "empezar", 30); pon("que_ejercicio", "empezar", 28);
  items.filter((it) => it.alerta).slice(0, MAX_AVISOS).forEach((it, i) => pon("aviso:" + it.pid, "meds", 90 - i, "aviso", { x: it.nombre }));
  for (const [id, ss, pr] of POR_SENAL) { const l = items.filter((it) => ss.some((s) => it.senales.includes(s))); if (l.length) pon(id, "meds", pr, id, { x: nombres(l) }); }
  const azu = items.filter((it) => it.senales.includes("hipoglucemia")), oc = items.filter((it) => it.senales.includes("enmascara_hipoglucemia"));
  if (azu.length && oc.length) pon("azucar_oculta", "meds", 79, "azucar_oculta", { x: nombres(oc) });
  const cai = items.filter((it) => it.senales.includes("caidas"));
  if (cai.length >= 2 || (d.caidas && cai.length)) pon("caidas", "meds", d.caidas ? 88 : 66, "caidas", { x: nombres(cai) });
  else if (d.caidas) pon("caidas", "meds", 88, "caidas0");
  const orden = { mayor: 0, moderada: 1 };
  (d.inter || []).filter((x) => x.nivel in orden).sort((a, b) => orden[a.nivel] - orden[b.nivel]).slice(0, MAX_DDI).forEach((x, i) => pon(`ddi:${[x.pa, x.pb].sort().join("+")}`, "combi", (x.nivel === "mayor" ? 85 : 60) - i, "ddi", { x: enLista([x.a, x.b]) }));
  if ((d.n || 0) >= 5) pon("poli", "combi", 55, "poli", { n: d.n });
  if ((d.n || 0) >= 2) pon("hora", "combi", 35);
  const h = d.habitos || {};
  if (h.alcohol === "aveces" || h.alcohol === "diario") pon("alcohol", "habitos", h.alcohol === "diario" ? 62 : 38);
  if (h.tabaco === "si") pon("tabaco", "habitos", 61);
  if (h.cafe === "mucho") pon("cafeina", "habitos", 36);
  pon("suplementos", "general", 20); pon("dolor", "general", 18); pon("objetivo", "general", 16); pon("seguimiento", "general", 14);
  return P.sort((a, b) => GRUPOS.indexOf(a.g) - GRUPOS.indexOf(b.g) || b.pr - a.pr);
}
/** El texto de una pregunta, en el idioma de la interfaz. */
export const texto = (q) => tx("q_" + q.base, q.vars);
/** Las tres que más importan, sin repetir tipo (un aviso, una combinación…); se proponen, no se marcan solas. */
export function sugeridas(P) {
  const vistas = new Set(), s = [];
  for (const q of [...P].sort((a, b) => b.pr - a.pr)) { if (vistas.has(q.base)) continue; vistas.add(q.base); s.push(q.id); if (s.length === 3) break; }
  return s;
}
/** Lo elegido, en el orden de la hoja: primero las propias, luego las generadas por importancia. */
export function elegidas(P, o) {
  const sel = new Set(o?.sel || []);
  return [...(o?.propias || []).filter((x) => x.s).map((x) => x.t), ...[...P].filter((q) => sel.has(q.id)).sort((a, b) => b.pr - a.pr).map(texto)];
}
/** Texto plano para compartir o copiar. */
export function textoPlano(lista, meds = []) {
  return [tx("titulo"), "", ...lista.map((q, i) => `${i + 1}. ${q}`), ...(meds.length ? ["", tx("hoja_meds") + ":", ...meds.map((m) => "- " + m)] : [])].join("\n");
}

const CLAVE = "medex.preguntas", MAX_PROPIAS = 8, MAX_LARGO = 240;
export function leer() {
  try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null") || {}; return { sel: Array.isArray(o.sel) ? o.sel.filter((x) => typeof x === "string").slice(0, 60) : [], propias: (Array.isArray(o.propias) ? o.propias : []).filter((x) => x && typeof x.t === "string" && x.t.trim()).slice(0, MAX_PROPIAS).map((x) => ({ t: x.t.slice(0, MAX_LARGO), s: x.s !== false })), lista: o.lista !== false }; } catch { return { sel: [], propias: [], lista: true }; }
}
const guardar = (o) => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {} };

const CSS = `
.pg-dlg { width: min(760px, calc(100vw - 16px)); }
.pg-dlg .ficha-cuerpo { padding-bottom: 0; }
.pg-intro { margin: 0 0 10px; color: var(--muted); }
.pg-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 6px; }
.pg-barra b { margin-right: auto; font-family: var(--mono); font-size: .86rem; }
.pg-dlg h3 { margin: 16px 0 6px; font-size: 1rem; }
.pg-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.pg-q { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; gap: 10px; align-items: start; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); cursor: pointer; }
.pg-q input { width: 22px; height: 22px; margin: 1px 0 0; accent-color: var(--accent); }
.pg-q span { line-height: 1.35; }
.pg-q:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); }
.pg-q:has(input:focus-visible) { outline: 3px solid var(--accent); outline-offset: 2px; }
.pg-sug { align-self: center; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--accent); font-family: var(--mono); font-size: .64rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-deep, var(--accent)); background: var(--surface); }
.pg-propia { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center; }
.pg-pie button[aria-disabled="true"] { opacity: .55; }
.pg-nueva { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; margin: 8px 0 0; }
.pg-nueva label { grid-column: 1 / -1; font-size: .88rem; font-weight: 700; }
.pg-nueva input { min-height: 44px; padding: 8px 12px; border: 1.5px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); font: inherit; }
.pg-dlg button:focus-visible, .pg-nueva input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.pg-opc { display: flex; align-items: center; gap: 8px; margin: 14px 0 0; font-size: .92rem; }
.pg-opc input { width: 20px; height: 20px; accent-color: var(--accent); }
.pg-consejo { margin: 10px 0 0; font-size: .86rem; color: var(--muted); }
.pg-pie { position: sticky; bottom: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 14px -16px 0; padding: 10px 16px; border-top: 1px solid var(--line); background: var(--surface); }
.pg-pie small { flex: 1 1 100%; color: var(--muted); }
#pg-hoja { display: none; }
@media (max-width: 520px) { .pg-q { grid-template-columns: 26px minmax(0, 1fr); } .pg-sug { grid-column: 2; justify-self: start; } }
@media (forced-colors: active) { .pg-q:has(input:checked) { outline: 2px solid Highlight; } }
@media print {
  body.pg-imprime > *:not(#pg-hoja) { display: none !important; }
  body.pg-imprime #pg-hoja { display: block; color: #000; background: #fff; font: 12.5pt/1.45 system-ui, sans-serif; }
  #pg-hoja h1 { margin: 0 0 4pt; font-size: 19pt; } #pg-hoja h2 { margin: 16pt 0 4pt; font-size: 12pt; }
  #pg-hoja .pg-h-cab { margin: 0 0 14pt; padding-bottom: 8pt; border-bottom: 1.5pt solid #000; font-size: 10.5pt; }
  #pg-hoja ol { margin: 0; padding-left: 20pt; } #pg-hoja ol li { margin: 0 0 6pt; break-inside: avoid; font-weight: 600; }
  #pg-hoja ol li i { display: block; height: 20pt; border-bottom: .6pt dotted #555; }
  #pg-hoja ul { margin: 0; padding-left: 16pt; columns: 2; font-size: 10.5pt; }
  #pg-hoja footer { margin-top: 18pt; padding-top: 6pt; border-top: .6pt solid #888; font-size: 9pt; color: #333; }
}
`;

let dlg = null, A = null, P = [], estado = { sel: [], propias: [], lista: true };
const cu = () => dlg.querySelector("#pg-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** Lo que la aplicación sabe (para generar las preguntas). */
export function contexto(api) {
  const e = api.estado; let res = null; try { res = e.meds.length ? api.res() : null; } catch {}
  const alerta = new Set(); if (res) for (const amb of Object.values(res.ambitos || {})) for (const g of amb) if (g.reglas?.some((r) => r.nivel === "alerta")) alerta.add(g.item.principio.id);
  return {
    items: (res?.items || []).map((it) => ({ pid: it.principio.id, nombre: it.principio.nombre, senales: [...it.senales], alerta: alerta.has(it.principio.id) })),
    inter: (res?.interacciones || []).map((x) => ({ a: x.a.principio.nombre, b: x.b.principio.nombre, pa: x.a.principio.id, pb: x.b.principio.id, nivel: x.nivel })),
    habitos: e.habitos || {}, crib: res ? api.cribadoActual(res).clave : null, caidas: !!e.caidas, n: res?.items.length || 0,
  };
}
/** La lista de medicación, tal como la escribiría la persona (nombre, dosis y tomas). */
export function listaMeds(api) {
  return api.estado.meds.filter((m) => !m.pausado).map((m) => `${m.libre ? m.nombre : api.indice.porId.get(m.pid)?.principio.nombre || m.pid}${m.dosis != null ? ` ${String(m.dosis).replace(".", ",")} ${m.unidad || "mg"}` : ""}${m.tomas > 1 ? ` × ${m.tomas}` : ""}`);
}
const lista = () => elegidas(P, estado);
function crear() {
  if (!document.getElementById("pg-css")) { const st = document.createElement("style"); st.id = "pg-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "preguntas"; dlg.className = "ficha alta pg-dlg"; dlg.setAttribute("aria-labelledby", "pg-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="pg-cab-t"></p><button type="button" class="btn-sec sm" id="pg-cerrar"></button></div><div class="ficha-cuerpo" id="pg-cuerpo"></div>`;
  document.body.append(dlg);
  const hoja = document.createElement("div"); hoja.id = "pg-hoja"; document.body.append(hoja);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#pg-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("change", (ev) => {
    const i = ev.target; if (!i.matches?.("[data-pg]")) return;
    if (i.dataset.pg === "sel") { const s = new Set(estado.sel); i.checked ? s.add(i.value) : s.delete(i.value); estado.sel = [...s]; }
    else if (i.dataset.pg === "propia") { const p = estado.propias[Number(i.value)]; if (p) p.s = i.checked; }
    else if (i.dataset.pg === "lista") estado.lista = i.checked;
    guardar(estado); pie();
  });
  dlg.addEventListener("submit", (ev) => { ev.preventDefault(); anadirPropia(); });
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("button[data-pg]"); if (!b) return;
    const a = b.dataset.pg;
    if (a === "sugeridas") { estado.sel = [...new Set([...estado.sel, ...sugeridas(P)])]; guardar(estado); pintar(); dlg.querySelector('[data-pg="sugeridas"]')?.focus(); }
    else if (a === "limpiar") { estado.sel = []; estado.propias.forEach((p) => { p.s = false; }); guardar(estado); pintar(); dlg.querySelector('[data-pg="sugeridas"]')?.focus(); }
    else if (a === "quitar") { estado.propias.splice(Number(b.dataset.v), 1); guardar(estado); pintar(); dlg.querySelector("#pg-nueva-i")?.focus(); }
    else if (a === "imprimir") imprimir();
    else if (a === "compartir") compartir();
    else if (a === "copiar") copiar();
  });
}
function anadirPropia() {
  const i = dlg.querySelector("#pg-nueva-i"), v = i.value.trim().replace(/\s+/g, " ").slice(0, MAX_LARGO);
  if (!v || estado.propias.length >= MAX_PROPIAS) return;
  estado.propias.push({ t: v, s: true }); guardar(estado); pintar(); dlg.querySelector("#pg-nueva-i")?.focus();
}
const medsHoja = () => (estado.lista ? listaMeds(A) : []);
function imprimir() {
  const l = lista(); if (!l.length) { A.toast(tx("falta"), { ms: 3000 }); return; }
  const hoja = document.getElementById("pg-hoja"), meds = medsHoja();
  hoja.innerHTML = `<h1>${tx("titulo")}</h1><p class="pg-h-cab">${tx("hoja_fecha")}: ${new Date().toLocaleDateString(idioma())} · ${tx("hoja_nombre")}: ______________________________</p>
    <ol>${l.map((q) => `<li>${esc(q)}<i></i><i></i></li>`).join("")}</ol>
    ${meds.length ? `<h2>${tx("hoja_meds")}</h2><ul>${meds.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
    <footer>${tx("hoja_pie")} · v${APP_VERSION}</footer>`;
  document.body.classList.add("pg-imprime");
  const fin = () => { document.body.classList.remove("pg-imprime"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch { fin(); } }, 120);
}
async function copiar() {
  const l = lista(); if (!l.length) { A.toast(tx("falta"), { ms: 3000 }); return; }
  try { await navigator.clipboard.writeText(textoPlano(l, medsHoja())); A.toast(tx("copiado"), { ms: 3000 }); } catch { A.toast(tx("copia_error"), { ms: 4000 }); }
}
async function compartir() {
  const l = lista(); if (!l.length) { A.toast(tx("falta"), { ms: 3000 }); return; }
  if (!navigator.share) return copiar();
  try { await navigator.share({ title: tx("titulo"), text: textoPlano(l, medsHoja()) }); } catch {}
}
function pie() {
  const n = lista().length, e = dlg.querySelector("#pg-n"); if (e) e.textContent = n === 0 ? tx("elegidas0") : n === 1 ? tx("elegidas1") : tx("elegidas", { n });
  dlg.querySelectorAll(".pg-pie button").forEach((b) => { b.setAttribute("aria-disabled", String(!n)); });
}
function pintar() {
  dlg.querySelector("#pg-cab-t").textContent = tx("titulo");
  const sel = new Set(estado.sel), sug = new Set(sugeridas(P)), arriba = cu().scrollTop;
  const fila = (q) => `<li><label class="pg-q"><input type="checkbox" data-pg="sel" value="${esc(q.id)}"${sel.has(q.id) ? " checked" : ""}><span>${esc(texto(q))}</span>${sug.has(q.id) ? `<em class="pg-sug">${tx("sugerida")}</em>` : ""}</label></li>`;
  cu().innerHTML = `<p class="pg-intro">${tx("intro")}${A.estado.meds.length ? "" : " " + tx("sin_meds")}</p>
    <div class="pg-barra"><b id="pg-n" aria-live="polite"></b><button type="button" class="btn-sec sm" data-pg="sugeridas">${tx("sugeridas")}</button><button type="button" class="btn-sec sm" data-pg="limpiar">${tx("limpiar")}</button></div>
    <h3>${tx("g_propias")}</h3>
    ${estado.propias.length ? `<ul class="pg-lista" id="pg-propias">${estado.propias.map((p, i) => `<li class="pg-propia"><label class="pg-q"><input type="checkbox" data-pg="propia" value="${i}"${p.s ? " checked" : ""}><span>${esc(p.t)}</span></label><button type="button" class="btn-sec sm" data-pg="quitar" data-v="${i}" aria-label="${tx("quitar")}: ${esc(p.t)}">${tx("quitar")}</button></li>`).join("")}</ul>` : ""}
    ${estado.propias.length < MAX_PROPIAS ? `<form class="pg-nueva"><label for="pg-nueva-i">${tx("propia_l")}</label><input type="text" id="pg-nueva-i" maxlength="${MAX_LARGO}" placeholder="${tx("propia_ph")}" autocomplete="off" enterkeyhint="done"><button type="submit" class="btn-sec">${tx("anadir")}</button></form>` : ""}
    ${GRUPOS.map((g) => { const l = P.filter((q) => q.g === g); return l.length ? `<h3>${tx("g_" + g)}</h3><ul class="pg-lista" data-g="${g}">${l.map(fila).join("")}</ul>` : ""; }).join("")}
    ${A.estado.meds.length ? `<label class="pg-opc"><input type="checkbox" data-pg="lista"${estado.lista ? " checked" : ""}> ${tx("con_lista")}</label>` : ""}
    <p class="pg-consejo">${tx("consejo")}</p>
    <div class="pg-pie"><button type="button" class="btn" data-pg="imprimir">${tx("imprimir")}</button><button type="button" class="btn-sec" data-pg="compartir">${tx("compartir")}</button><button type="button" class="btn-sec" data-pg="copiar">${tx("copiar")}</button></div>`;
  cu().scrollTop = arriba; pie();
}
/** Abre la ventana. */
export function abrir(api) {
  A = api;
  if (!dlg) crear();
  P = generar(contexto(api)); estado = leer();
  const validas = new Set(P.map((q) => q.id)); estado.sel = estado.sel.filter((id) => validas.has(id)); // lo elegido que ya no aplica (cambió la lista) no se lleva
  dlg.querySelector("#pg-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#pg-cerrar").focus();
}
