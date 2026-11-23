/* Biblioteca de ejercicios (segunda tanda de mejoras grandes, 4). Se carga bajo demanda.
   45 ejercicios con dibujo: los 17 de las sesiones tipo y 28 más (en silla, con banda, en el suelo, agarre, potencia y movilidad).
   Sirve para dos cosas: hojearlos con filtros (zona del cuerpo, material y postura) y cambiar un ejercicio del plan por otro
   del mismo tipo («Cambiar»). Lo cambiado se guarda en el dispositivo (localStorage «medex.cambios»: nombre del ejercicio
   original -> id del que lo sustituye) y la aplicación lo aplica al plan, a la sesión guiada y a la hoja imprimible.
   Los dibujos y la ficha animada viven en movimiento.js; la aplicación se los pasa (un módulo bajo demanda no importa a otro).
   Textos de la interfaz en cinco idiomas; los de cada ejercicio, en español como el resto del contenido de las sesiones. */
import { idioma } from "./i18n.js?v=202611231104";
import { sesionTipo, normalizar } from "./engine.js?v=202611231104";
import { tC } from "./tr.js?v=202611231104";

const TXT = {
  es: { titulo: "Biblioteca de ejercicios", intro: "{n} ejercicios con su dibujo. Toque uno para ver cómo se hace.", zona: "Zona", material: "Con qué", postura: "Postura", todo: "Todo", cualquiera: "Cualquiera",
    z_piernas: "Piernas", z_cadera: "Cadera y glúteos", z_empuje: "Pecho y hombros", z_traccion: "Espalda", z_brazos: "Brazos y agarre", z_tronco: "Tronco", z_equilibrio: "Equilibrio", z_corazon: "Corazón y pulmones", z_movilidad: "Movilidad",
    m_nada: "Sin nada", m_silla: "Silla", m_banda: "Banda elástica", m_peso: "Botellas o mancuernas", m_pared: "Pared o mueble firme", m_escalon: "Escalón", m_suelo: "Esterilla", m_pelota: "Pelota o toalla", m_bici: "Bicicleta estática",
    p_sentado: "Sentado", p_pie: "De pie", p_suelo: "En el suelo", niv_1: "Suave", niv_2: "Medio", niv_3: "Exigente", nivel: "Nivel",
    cuenta: "{n} ejercicios", cuenta_1: "1 ejercicio", vacio: "Ningún ejercicio con esos filtros.", quitar: "Quitar filtros", ver: "Ver cómo se hace", en_plan: "En su plan", nuevo: "Nuevo",
    cambiar_tit: "Cambiar «{x}»", cambiar_intro: "Ejercicios que trabajan lo mismo. Elija el que le venga mejor hoy: por el material que tiene, por una molestia o por variar.", usar: "Usar este", original: "Volver al original", ahora: "Ahora en su plan",
    cambiado: "Cambiado: {a} → {b}", restaurado: "Ha vuelto «{a}» a su plan", deshacer: "Deshacer", ver_todos: "Ver toda la biblioteca", volver: "Volver al cambio",
    nota: "Los cambios se guardan en este dispositivo y valen para el plan, la sesión guiada y la hoja imprimible. Si un ejercicio le produce dolor, pare y elija otro.", sin_alt: "No hay alternativas para este ejercicio." },
  en: { titulo: "Exercise library", intro: "{n} exercises with drawings. Tap one to see how it is done.", zona: "Area", material: "Equipment", postura: "Position", todo: "All", cualquiera: "Any",
    z_piernas: "Legs", z_cadera: "Hips and glutes", z_empuje: "Chest and shoulders", z_traccion: "Back", z_brazos: "Arms and grip", z_tronco: "Core", z_equilibrio: "Balance", z_corazon: "Heart and lungs", z_movilidad: "Mobility",
    m_nada: "Nothing", m_silla: "Chair", m_banda: "Resistance band", m_peso: "Bottles or dumbbells", m_pared: "Wall or sturdy furniture", m_escalon: "Step", m_suelo: "Mat", m_pelota: "Ball or towel", m_bici: "Exercise bike",
    p_sentado: "Seated", p_pie: "Standing", p_suelo: "On the floor", niv_1: "Gentle", niv_2: "Moderate", niv_3: "Demanding", nivel: "Level",
    cuenta: "{n} exercises", cuenta_1: "1 exercise", vacio: "No exercises match those filters.", quitar: "Clear filters", ver: "See how it is done", en_plan: "In your plan", nuevo: "New",
    cambiar_tit: "Swap “{x}”", cambiar_intro: "Exercises that train the same thing. Pick the one that suits you today: the equipment you have, a sore spot or simply for variety.", usar: "Use this one", original: "Back to the original", ahora: "Now in your plan",
    cambiado: "Swapped: {a} → {b}", restaurado: "“{a}” is back in your plan", deshacer: "Undo", ver_todos: "See the whole library", volver: "Back to the swap",
    nota: "Swaps are saved on this device and apply to the plan, the guided session and the printable sheet. If an exercise hurts, stop and choose another.", sin_alt: "There are no alternatives for this exercise." },
  ca: { titulo: "Biblioteca d'exercicis", intro: "{n} exercicis amb el seu dibuix. Toqueu-ne un per veure com es fa.", zona: "Zona", material: "Amb què", postura: "Postura", todo: "Tot", cualquiera: "Qualsevol",
    z_piernas: "Cames", z_cadera: "Maluc i glutis", z_empuje: "Pit i espatlles", z_traccion: "Esquena", z_brazos: "Braços i agafada", z_tronco: "Tronc", z_equilibrio: "Equilibri", z_corazon: "Cor i pulmons", z_movilidad: "Mobilitat",
    m_nada: "Sense res", m_silla: "Cadira", m_banda: "Banda elàstica", m_peso: "Ampolles o manuelles", m_pared: "Paret o moble ferm", m_escalon: "Esglaó", m_suelo: "Estoreta", m_pelota: "Pilota o tovallola", m_bici: "Bicicleta estàtica",
    p_sentado: "Assegut", p_pie: "Dret", p_suelo: "A terra", niv_1: "Suau", niv_2: "Mitjà", niv_3: "Exigent", nivel: "Nivell",
    cuenta: "{n} exercicis", cuenta_1: "1 exercici", vacio: "Cap exercici amb aquests filtres.", quitar: "Treure filtres", ver: "Veure com es fa", en_plan: "Al vostre pla", nuevo: "Nou",
    cambiar_tit: "Canviar «{x}»", cambiar_intro: "Exercicis que treballen el mateix. Trieu el que us vagi millor avui: pel material que teniu, per una molèstia o per variar.", usar: "Fer servir aquest", original: "Tornar a l'original", ahora: "Ara al vostre pla",
    cambiado: "Canviat: {a} → {b}", restaurado: "«{a}» ha tornat al vostre pla", deshacer: "Desfer", ver_todos: "Veure tota la biblioteca", volver: "Tornar al canvi",
    nota: "Els canvis es desen en aquest dispositiu i valen per al pla, la sessió guiada i el full imprimible. Si un exercici us fa mal, pareu i trieu-ne un altre.", sin_alt: "No hi ha alternatives per a aquest exercici." },
  gl: { titulo: "Biblioteca de exercicios", intro: "{n} exercicios co seu debuxo. Toque un para ver como se fai.", zona: "Zona", material: "Con que", postura: "Postura", todo: "Todo", cualquiera: "Calquera",
    z_piernas: "Pernas", z_cadera: "Cadeira e glúteos", z_empuje: "Peito e ombreiros", z_traccion: "Costas", z_brazos: "Brazos e agarre", z_tronco: "Tronco", z_equilibrio: "Equilibrio", z_corazon: "Corazón e pulmóns", z_movilidad: "Mobilidade",
    m_nada: "Sen nada", m_silla: "Cadeira", m_banda: "Banda elástica", m_peso: "Botellas ou pesas", m_pared: "Parede ou moble firme", m_escalon: "Chanzo", m_suelo: "Esteira", m_pelota: "Pelota ou toalla", m_bici: "Bicicleta estática",
    p_sentado: "Sentado", p_pie: "De pé", p_suelo: "No chan", niv_1: "Suave", niv_2: "Medio", niv_3: "Esixente", nivel: "Nivel",
    cuenta: "{n} exercicios", cuenta_1: "1 exercicio", vacio: "Ningún exercicio con eses filtros.", quitar: "Quitar filtros", ver: "Ver como se fai", en_plan: "No seu plan", nuevo: "Novo",
    cambiar_tit: "Cambiar «{x}»", cambiar_intro: "Exercicios que traballan o mesmo. Escolla o que lle veña mellor hoxe: polo material que ten, por unha molestia ou por variar.", usar: "Usar este", original: "Volver ao orixinal", ahora: "Agora no seu plan",
    cambiado: "Cambiado: {a} → {b}", restaurado: "«{a}» volveu ao seu plan", deshacer: "Desfacer", ver_todos: "Ver toda a biblioteca", volver: "Volver ao cambio",
    nota: "Os cambios gárdanse neste dispositivo e valen para o plan, a sesión guiada e a folla imprimible. Se un exercicio lle produce dor, pare e escolla outro.", sin_alt: "Non hai alternativas para este exercicio." },
  eu: { titulo: "Ariketa-liburutegia", intro: "{n} ariketa bere marrazkiarekin. Ukitu bat nola egiten den ikusteko.", zona: "Gunea", material: "Zerekin", postura: "Jarrera", todo: "Dena", cualquiera: "Edozein",
    z_piernas: "Hankak", z_cadera: "Aldaka eta gluteoak", z_empuje: "Bularra eta sorbaldak", z_traccion: "Bizkarra", z_brazos: "Besoak eta heldulekua", z_tronco: "Enborra", z_equilibrio: "Oreka", z_corazon: "Bihotza eta birikak", z_movilidad: "Mugikortasuna",
    m_nada: "Ezer gabe", m_silla: "Aulkia", m_banda: "Banda elastikoa", m_peso: "Botilak edo pisuak", m_pared: "Horma edo altzari sendoa", m_escalon: "Mailaren bat", m_suelo: "Esterilla", m_pelota: "Pilota edo eskuoihala", m_bici: "Bizikleta estatikoa",
    p_sentado: "Eserita", p_pie: "Zutik", p_suelo: "Lurrean", niv_1: "Leuna", niv_2: "Ertaina", niv_3: "Zorrotza", nivel: "Maila",
    cuenta: "{n} ariketa", cuenta_1: "Ariketa 1", vacio: "Ez dago ariketarik iragazki horiekin.", quitar: "Kendu iragazkiak", ver: "Ikusi nola egiten den", en_plan: "Zure planean", nuevo: "Berria",
    cambiar_tit: "Aldatu «{x}»", cambiar_intro: "Gauza bera lantzen duten ariketak. Aukeratu gaur hobekien datorkizuna: duzun materialagatik, minen batengatik edo aldatzeagatik.", usar: "Erabili hau", original: "Itzuli jatorrizkora", ahora: "Orain zure planean",
    cambiado: "Aldatuta: {a} → {b}", restaurado: "«{a}» zure planera itzuli da", deshacer: "Desegin", ver_todos: "Ikusi liburutegi osoa", volver: "Itzuli aldaketara",
    nota: "Aldaketak gailu honetan gordetzen dira eta planerako, saio gidaturako eta inprimatzeko orrirako balio dute. Ariketa batek mina ematen badizu, gelditu eta aukeratu beste bat.", sin_alt: "Ez dago ariketa honen ordezkorik." },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Catálogo. id = dibujo de movimiento.js; z = zona; m = material; p = postura; niv = nivel (1 suave, 2 medio, 3 exigente);
   pat = patrones de movimiento (dos ejercicios que comparten uno se pueden cambiar entre sí); de = nombre del bloque de las
   sesiones tipo del que salen los textos (los 13 primeros); n, d, c, f, x, min = nombre, cómo se hace, la clave, más fácil,
   más difícil y minutos orientativos de los demás. */
const CAT = tC([
  { id: "silla", de: "Levantarse de la silla", z: "piernas", m: ["silla"], p: "pie", niv: 1, pat: ["piernas"] },
  { id: "sentadilla", de: "Sentadilla a la silla", z: "piernas", m: ["silla"], p: "pie", niv: 2, pat: ["piernas"] },
  { id: "talones", de: "Elevación de talones", z: "piernas", m: ["silla"], p: "pie", niv: 1, pat: ["pantorrilla"] },
  { id: "rodilla", de: "Extensión de rodilla sentado", z: "piernas", m: ["silla"], p: "sentado", niv: 1, pat: ["piernas"] },
  { id: "brazo", de: "Flexión de brazos con botella o banda", z: "brazos", m: ["peso"], p: "pie", niv: 1, pat: ["brazos"] },
  { id: "puente", de: "Puente de glúteo o marcha en el sitio", z: "cadera", m: ["suelo"], p: "suelo", niv: 1, pat: ["cadera"] },
  { id: "pared", de: "Empuje (flexiones en pared o inclinadas)", z: "empuje", m: ["pared"], p: "pie", niv: 1, pat: ["empuje"] },
  { id: "remo", de: "Remo con banda elástica", z: "traccion", m: ["banda"], p: "pie", niv: 1, pat: ["traccion"] },
  { id: "bisagra", de: "Bisagra de cadera", z: "cadera", m: ["peso"], p: "pie", niv: 2, pat: ["cadera"] },
  { id: "hombro", de: "Press de hombro ligero", z: "empuje", m: ["peso"], p: "pie", niv: 2, pat: ["empuje"] },
  { id: "unpie", de: "Apoyo sobre un pie", z: "equilibrio", m: ["silla"], p: "pie", niv: 2, pat: ["equilibrio"] },
  { id: "talonpunta", de: "Marcha talón-punta", z: "equilibrio", m: ["pared"], p: "pie", niv: 2, pat: ["equilibrio"] },
  { id: "giro", de: "Giros lentos y alcances", z: "equilibrio", m: [], p: "pie", niv: 1, pat: ["equilibrio"] },
  { id: "marcha", n: "Caminar a paso ligero", z: "corazon", m: [], p: "pie", niv: 1, pat: ["aerobico"], min: 20, d: "A un ritmo en el que puede hablar pero no cantar. Empiece con 10 minutos y sume 5 cada semana.", c: "Hombros relajados, mirada al frente y brazos sueltos.", f: "Tramos de 3–5 minutos con pausas; vale el pasillo de casa.", x: "Intercale 1 minuto más rápido cada 3 minutos, o busque una cuesta suave." },
  { id: "bici", n: "Bicicleta estática o elíptica", z: "corazon", m: ["bici"], p: "sentado", niv: 1, pat: ["aerobico"], min: 20, d: "Pedaleo suave y continuo, a un ritmo en el que puede hablar. De 10 a 30 minutos.", c: "Sillín a la altura de la cadera: la rodilla queda casi estirada abajo.", f: "Sin resistencia, 5–10 minutos.", x: "Intervalos: 3 minutos cómodos y 1 algo más fuerte, 5–6 veces." },
  { id: "estirar", n: "Estiramiento suave de pie", z: "movilidad", m: [], p: "pie", niv: 1, pat: ["movilidad"], min: 3, d: "Suba los brazos despacio por los lados cogiendo aire, y bájelos soltándolo. 5–6 veces.", c: "Sin rebotes y sin dolor: solo hasta notar que tira un poco.", f: "Sentado, subiendo los brazos hasta donde llegue.", x: "Con los brazos arriba, añada una inclinación suave a cada lado." },
  { id: "respirar", n: "Respiración tranquila", z: "movilidad", m: [], p: "pie", niv: 1, pat: ["movilidad"], min: 2, d: "Coja aire por la nariz en 3–4 segundos y suéltelo despacio por la boca en 5–6. Repítalo 6–8 veces al terminar la sesión.", c: "El abdomen se hincha al coger aire; los hombros no suben.", f: "Sentado, con una mano en el abdomen." },
  // --- los 28 nuevos ---
  { id: "marcha_sentado", n: "Marcha sentado", z: "corazon", m: ["silla"], p: "sentado", niv: 1, pat: ["aerobico", "piernas"], min: 4, d: "Sentado, levante las rodillas una y otra como si caminara, moviendo los brazos. De 1 a 3 minutos, 2–3 veces.", c: "Espalda larga, sin echarse hacia atrás; el pie baja controlado.", f: "Solo las piernas, con las manos en el asiento.", x: "Más rápido, o estirando la rodilla al frente cada cuatro pasos." },
  { id: "remo_sentado", n: "Remo sentado con banda", z: "traccion", m: ["silla", "banda"], p: "sentado", niv: 1, pat: ["traccion"], min: 4, d: "Sentado, con la banda pasada por los pies y las piernas estiradas hacia delante. Tire de los codos hacia atrás. 2 series de 10–15.", c: "Junte las escápulas al final; el tronco no se mueve.", f: "Banda más suave, o las rodillas algo dobladas.", x: "Aguante 2 segundos atrás, o use una banda más dura." },
  { id: "press_sentado", n: "Empuje de pecho sentado con banda", z: "empuje", m: ["silla", "banda"], p: "sentado", niv: 1, pat: ["empuje"], min: 4, d: "Sentado, con la banda pasada por detrás del respaldo o de la espalda. Empuje las manos al frente hasta casi estirar los codos. 2 series de 10–15.", c: "Suelte el aire al empujar; la espalda sigue en el respaldo.", f: "Banda más suave, o un brazo cada vez.", x: "Banda más dura, volviendo en 3 segundos." },
  { id: "abduccion_sentado", n: "Abrir las rodillas con banda, sentado", z: "cadera", m: ["silla", "banda"], p: "sentado", niv: 1, pat: ["cadera"], min: 3, d: "Sentado, con la banda alrededor de los muslos, justo por encima de las rodillas. Separe las rodillas contra la banda y vuelva despacio. 2 series de 12–15.", c: "Los pies no se mueven; aguante un segundo con las rodillas abiertas.", f: "Sin banda, empujando con las manos por fuera de las rodillas.", x: "Banda más dura, aguantando 3 segundos abierto." },
  { id: "talones_sentado", n: "Talones y puntas, sentado", z: "piernas", m: ["silla"], p: "sentado", niv: 1, pat: ["pantorrilla"], min: 3, d: "Sentado, con los pies apoyados: levante los talones, bájelos y levante las puntas. 2 series de 15–20.", c: "Despacio y con todo el recorrido: es la bomba que mueve la sangre de las piernas.", f: "Un pie cada vez.", x: "Con una botella apoyada sobre cada rodilla." },
  { id: "giro_sentado", n: "Giro de tronco sentado", z: "tronco", m: ["silla"], p: "sentado", niv: 1, pat: ["tronco", "movilidad"], min: 3, d: "Sentado en la mitad delantera de la silla, con los brazos cruzados o al frente. Gire el tronco a un lado, vuelva al centro y gire al otro. 8–10 veces por lado.", c: "Crezca hacia arriba antes de girar; la cabeza acompaña al tronco.", f: "Con las manos en los muslos y menos recorrido.", x: "Con una botella sujeta con las dos manos delante del pecho." },
  { id: "abduccion_pie", n: "Pierna al lado, de pie", z: "cadera", m: ["silla"], p: "pie", niv: 1, pat: ["cadera", "equilibrio"], min: 4, d: "De pie, con una mano en el respaldo. Separe una pierna hacia el lado, sin inclinar el tronco, y vuelva despacio. 2 series de 10–12 por pierna.", c: "La punta del pie mira al frente; el cuerpo no se balancea.", f: "Menos recorrido y las dos manos en el respaldo.", x: "Con una banda en los tobillos, o sin tocar el suelo entre repeticiones." },
  { id: "extension_cadera", n: "Pierna atrás, de pie", z: "cadera", m: ["silla"], p: "pie", niv: 1, pat: ["cadera"], min: 4, d: "De pie, con las manos en el respaldo. Lleve una pierna estirada hacia atrás, apretando el glúteo, y vuelva. 2 series de 10–12 por pierna.", c: "El tronco casi no se inclina y la zona lumbar no se arquea.", f: "Menos recorrido.", x: "Con una banda en los tobillos, o aguantando 2 segundos atrás." },
  { id: "curl_femoral", n: "Talón al glúteo, de pie", z: "piernas", m: ["silla"], p: "pie", niv: 1, pat: ["piernas", "cadera"], min: 4, d: "De pie, con las manos en el respaldo. Doble una rodilla llevando el talón hacia el glúteo y baje despacio. 2 series de 10–12 por pierna.", c: "Las rodillas siguen juntas: solo se mueve la pierna de rodilla para abajo.", f: "Menos recorrido, alternando las piernas.", x: "Con una tobillera lastrada de 0,5–1 kg o una banda en los tobillos." },
  { id: "zancada", n: "Zancada con apoyo", z: "piernas", m: ["silla"], p: "pie", niv: 2, pat: ["piernas"], min: 5, d: "De pie, con una mano en un respaldo o una mesa. Dé un paso largo hacia delante, baje la rodilla de atrás hacia el suelo y vuelva. 2 series de 6–10 por pierna.", c: "El tronco baja recto, como en un ascensor; la rodilla de delante mira a la punta del pie.", f: "Paso más corto y bajando solo un poco.", x: "Sin apoyo, o con una botella en cada mano." },
  { id: "escalon", n: "Subir al escalón", z: "piernas", m: ["escalon"], p: "pie", niv: 2, pat: ["piernas", "aerobico"], min: 5, d: "Frente a un escalón bajo, con la barandilla o la pared a mano. Suba con una pierna, junte la otra y baje con cuidado. 2 series de 8–10 por pierna.", c: "Apoye el pie entero y empuje con la pierna de arriba.", f: "Escalón más bajo y agarrado a la barandilla.", x: "Baje en 3 segundos, o suba sin apoyar el segundo pie." },
  { id: "sentadilla_pared", n: "Sentadilla apoyado en la pared", z: "piernas", m: ["pared"], p: "pie", niv: 2, pat: ["piernas"], min: 4, d: "Con la espalda en la pared y los pies adelantados, deslícese hacia abajo hasta donde esté cómodo y aguante de 10 a 30 segundos. 3 veces.", c: "Respire todo el rato: cuente en voz alta para no aguantar el aire.", f: "Baje solo un poco y aguante 10 segundos.", x: "Muslos casi paralelos al suelo, 30–45 segundos." },
  { id: "paso_lateral", n: "Pasos laterales", z: "cadera", m: [], p: "pie", niv: 1, pat: ["cadera", "equilibrio"], min: 4, d: "De pie, con las rodillas algo dobladas, dé 8–10 pasos hacia un lado y vuelva. 3 idas y vueltas, junto a una pared o una encimera.", c: "Pasos cortos y controlados; los pies no se cruzan.", f: "Con una mano rozando la pared.", x: "Con una banda por encima de las rodillas o en los tobillos." },
  { id: "remo_mancuerna", n: "Remo con botella, apoyado", z: "traccion", m: ["peso", "silla"], p: "pie", niv: 2, pat: ["traccion"], min: 5, d: "Inclinado, con una mano apoyada en una silla firme o una mesa y la espalda recta. Con la otra mano, suba la botella o la mancuerna hacia la cadera. 2 series de 10–12 por brazo.", c: "El codo sube pegado al cuerpo; el tronco no gira.", f: "Botella de medio litro y menos inclinación.", x: "Garrafa o mancuerna más pesada, bajando en 3 segundos." },
  { id: "triceps", n: "Extensión de tríceps con banda", z: "brazos", m: ["banda"], p: "pie", niv: 1, pat: ["brazos", "empuje"], min: 4, d: "Con la banda sujeta arriba (en lo alto de una puerta cerrada) y los codos pegados al cuerpo. Estire los brazos hacia abajo y vuelva despacio. 2 series de 10–15.", c: "Solo se mueve el antebrazo; los hombros, lejos de las orejas.", f: "Banda más suave, un brazo cada vez.", x: "Banda más dura, aguantando 2 segundos abajo." },
  { id: "elevacion_lateral", n: "Elevación lateral de brazos", z: "empuje", m: ["peso"], p: "pie", niv: 1, pat: ["empuje", "brazos"], min: 4, d: "De pie o sentado, con una botella pequeña en cada mano. Suba los brazos hacia los lados hasta la altura de los hombros y baje despacio. 2 series de 8–12.", c: "Codos un poco doblados; suba sin encoger los hombros.", f: "Sin peso, o un brazo cada vez.", x: "Botellas de 1–1,5 L, bajando en 3 segundos." },
  { id: "jalon_banda", n: "Jalón con banda", z: "traccion", m: ["banda"], p: "pie", niv: 1, pat: ["traccion"], min: 4, d: "Con la banda sujeta arriba (en lo alto de una puerta cerrada) y los brazos estirados hacia ella. Tire de los codos hacia abajo y atrás, hacia los costados. 2 series de 10–15.", c: "Pecho arriba; piense en llevar los codos a los bolsillos de atrás.", f: "Sentado, con una banda suave.", x: "Banda más dura, aguantando 2 segundos abajo." },
  { id: "flexion_inclinada", n: "Flexiones en una mesa", z: "empuje", m: ["pared"], p: "pie", niv: 2, pat: ["empuje"], min: 5, d: "Con las manos en el borde de una mesa o una encimera firme y el cuerpo recto. Baje el pecho hacia el borde y empuje. 2 series de 6–12.", c: "Cuerpo en línea de la cabeza a los talones; codos a 45°.", f: "En la pared.", x: "En un apoyo más bajo (un banco firme), o bajando en 3 segundos." },
  { id: "plancha", n: "Plancha", z: "tronco", m: ["suelo"], p: "suelo", niv: 3, pat: ["tronco"], min: 3, d: "Boca abajo, apoyado en los antebrazos y en las puntas de los pies, con el cuerpo recto como una tabla. Aguante de 10 a 30 segundos, 3 veces.", c: "Respire todo el rato; apriete el abdomen y los glúteos.", f: "Con las rodillas apoyadas, o con las manos en una mesa.", x: "40–60 segundos, o levantando un pie unos segundos." },
  { id: "cuadrupedia", n: "Brazo y pierna contrarios, a cuatro patas", z: "tronco", m: ["suelo"], p: "suelo", niv: 2, pat: ["tronco", "cadera"], min: 4, d: "A cuatro patas, estire un brazo al frente y la pierna contraria hacia atrás, aguante 3–5 segundos y cambie. 6–8 veces por lado.", c: "La espalda no se mueve: imagine un vaso de agua encima.", f: "Solo la pierna, o solo el brazo.", x: "Aguante 10 segundos, o junte codo y rodilla debajo antes de estirar." },
  { id: "bocaarriba", n: "Brazo y pierna contrarios, boca arriba", z: "tronco", m: ["suelo"], p: "suelo", niv: 2, pat: ["tronco"], min: 4, d: "Boca arriba, con los brazos hacia el techo y las rodillas dobladas en el aire. Baje despacio un brazo hacia atrás y estire la pierna contraria, sin tocar el suelo, y vuelva. 6–8 veces por lado.", c: "La zona lumbar sigue pegada al suelo; suelte el aire al estirar.", f: "Solo las piernas, apoyando el talón en el suelo.", x: "Más lento: 5 segundos estirado." },
  { id: "levantarse_suelo", n: "Levantarse del suelo con una silla", z: "piernas", m: ["suelo", "silla"], p: "suelo", niv: 3, pat: ["piernas"], min: 5, d: "Con una silla firme al lado: póngase de rodillas, adelante un pie, apoye las manos en el asiento y empuje con la pierna hasta ponerse de pie. 3–5 veces, cambiando de pierna. Las primeras veces, con alguien cerca.", c: "Sin prisa: una pausa en cada paso y unos segundos de pie antes de andar.", f: "Solo de rodillas a un pie adelantado y vuelta, con las manos en la silla.", x: "Sin silla, apoyando las manos en la rodilla adelantada." },
  { id: "silla_rapida", n: "Levantarse rápido de la silla", z: "piernas", m: ["silla"], p: "pie", niv: 2, pat: ["piernas"], min: 4, d: "Como levantarse de la silla, pero subiendo lo más rápido que pueda con seguridad y bajando despacio, en 3 segundos. 2 series de 6–8, con un descanso largo entre ellas.", c: "Rápido solo al subir. La serie termina cuando ya no sube rápido, no cuando no puede más.", f: "Silla más alta (con un cojín) y manos en los reposabrazos.", x: "Con una mochila ligera, o sin llegar a sentarse del todo." },
  { id: "paseo_carga", n: "Paseo con carga", z: "brazos", m: ["peso"], p: "pie", niv: 2, pat: ["brazos"], min: 4, d: "Con una bolsa o una garrafa en cada mano, camine erguido 20–30 pasos, descanse y repita 3–4 veces.", c: "Hombros atrás y abajo; el peso, repartido en las dos manos.", f: "Peso ligero y recorrido corto, por el pasillo.", x: "Más peso, o todo en una mano y cambiando a la vuelta, sin inclinarse." },
  { id: "agarre", n: "Apretar una pelota o una toalla", z: "brazos", m: ["pelota"], p: "sentado", niv: 1, pat: ["brazos"], min: 3, d: "Con una pelota blanda o una toalla enrollada en la mano, apriete fuerte 3–5 segundos y suelte. 10 veces con cada mano.", c: "Respire mientras aprieta; el hombro, relajado.", f: "Menos fuerza y menos tiempo.", x: "Retuerza la toalla como para escurrirla, 10 veces hacia cada lado." },
  { id: "tandem", n: "De pie con un pie delante del otro", z: "equilibrio", m: ["silla"], p: "pie", niv: 1, pat: ["equilibrio"], min: 3, d: "Junto a un apoyo, coloque un pie justo delante del otro, talón con punta, y aguante 10–30 segundos. 3 veces con cada pie delante.", c: "Mirada al frente, a un punto fijo; la mano roza el apoyo.", f: "Los pies medio solapados, uno algo adelantado.", x: "Sin tocar el apoyo, pero con él al alcance de la mano, girando la cabeza despacio a los lados o cerrando los ojos unos segundos." },
  { id: "puntillas", n: "Caminar de puntillas y de talones", z: "equilibrio", m: ["pared"], p: "pie", niv: 2, pat: ["equilibrio", "pantorrilla"], min: 3, d: "Junto a una pared o una encimera, camine 10 pasos de puntillas y vuelva sobre los talones. 3 idas y vueltas.", c: "Pasos cortos, cuerpo erguido y la mano cerca del apoyo.", f: "Solo de puntillas, con la mano en el apoyo.", x: "Sin apoyo, o más despacio." },
  { id: "estirar_gemelo", n: "Estirar la pantorrilla en la pared", z: "movilidad", m: ["pared"], p: "pie", niv: 1, pat: ["movilidad", "pantorrilla"], min: 3, d: "Con las manos en la pared, una pierna atrás con la rodilla estirada y el talón en el suelo. Acérquese a la pared hasta notar que tira la pantorrilla. 20–30 segundos, 2 veces por pierna.", c: "El talón de atrás no se levanta; sin rebotes.", f: "Menos paso atrás.", x: "Después, doble un poco la rodilla de atrás para estirar más abajo." },
]);
export const ZONAS = ["piernas", "cadera", "empuje", "traccion", "brazos", "tronco", "equilibrio", "corazon", "movilidad"];
export const MATERIALES = ["nada", "silla", "banda", "peso", "pared", "escalon", "suelo", "pelota"];
export const POSTURAS = ["sentado", "pie", "suelo"];
/** Ejercicios del plan que no se cambian: el bloque de marcha o bici se ajusta con sus variantes, no con otro ejercicio. */
const NUEVOS = new Set(CAT.slice(17).map((e) => e.id));

/** Bloque de las sesiones tipo por su nombre (primero el nivel estándar). */
function bloqueMotor(nombre) {
  for (const tipo of ["fuerza", "fuerza_eq", "equilibrio", "aerobico"]) for (const fragil of [false, true]) { const b = sesionTipo(tipo, { fragil, minutosAer: fragil ? 10 : 30 }).bloques.find((x) => x.nombre === nombre); if (b) return b; }
  return null;
}
let cache = null;
/** Los 45 ejercicios, cada uno con forma de bloque de sesión (nombre, detalle, clave, facil, dificil, min, pict) más sus etiquetas. */
export function catalogo() {
  return (cache ||= CAT.map((e) => {
    const b = e.de ? bloqueMotor(e.de) : null;
    return { id: e.id, pict: e.id, nombre: e.de || e.n, detalle: b?.detalle || e.d, clave: b?.clave || e.c, facil: b?.facil || e.f, dificil: b?.dificil || e.x, min: b?.min || e.min, zona: e.z, material: e.m, postura: e.p, nivel: e.niv, pat: e.pat, nuevo: NUEVOS.has(e.id) };
  }));
}
export const porId = (id) => catalogo().find((e) => e.id === id) || null;
export const porNombre = (nombre) => catalogo().find((e) => e.nombre === nombre) || null;
export const nombres = () => catalogo().map((e) => e.nombre);
/** Bloque listo para una sesión (sin las etiquetas del catálogo). */
export function bloqueDe(id) { const e = porId(id); return e ? { nombre: e.nombre, detalle: e.detalle, clave: e.clave, facil: e.facil, dificil: e.dificil, min: e.min, pict: e.pict } : null; }
/** Patrones del ejercicio del plan con ese nombre o con ese dibujo (los nombres de las sesiones frágil y estándar comparten dibujo). */
function patronesDe(nombre, pict) { const e = porNombre(nombre) || porId(pict); return e ? { e, pat: e.pat } : null; }
/** Alternativas a un ejercicio del plan: comparten patrón de movimiento. Primero las de su misma postura y las más suaves. */
export function alternativas(nombre, pict = null) {
  const o = patronesDe(nombre, pict); if (!o) return [];
  return catalogo().filter((e) => e.id !== o.e.id && e.pat.some((p) => o.pat.includes(p)))
    .sort((a, b) => Number(b.pat[0] === o.pat[0]) - Number(a.pat[0] === o.pat[0]) || Number(b.postura === o.e.postura) - Number(a.postura === o.e.postura) || a.nivel - b.nivel);
}
/** ¿Se puede cambiar este bloque del plan? (los de marcha o bici y el calentamiento no). */
export const cambiable = (nombre, pict = null) => { const o = patronesDe(nombre, pict); return !!o && !o.pat.includes("aerobico") && !o.pat.includes("movilidad") && alternativas(nombre, pict).length > 0; };
/** Filtro de la biblioteca. f = { zona, material, postura, q }. «nada» = ejercicios que no piden material. */
export function filtrar({ zona = null, material = null, postura = null, q = "" } = {}) {
  const n = normalizar(q || "");
  return catalogo().filter((e) => (!zona || e.zona === zona) && (!postura || e.postura === postura) && (!material || (material === "nada" ? !e.material.length : e.material.includes(material))) && (!n || normalizar(e.nombre).includes(n)));
}

/* --- cambios guardados (nombre del ejercicio original -> id del catálogo) --- */
const CLAVE = "medex.cambios";
export function leerCambios() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && porId(v))) : {}; } catch { return {}; } }
function guardarCambios(c) { try { if (Object.keys(c).length) localStorage.setItem(CLAVE, JSON.stringify(c)); else localStorage.removeItem(CLAVE); } catch {} }
/** Aplica los cambios guardados a una sesión tipo: mismo sitio y mismos minutos, otro ejercicio. `de` recuerda el original. */
export function aplicar(ses, cambios = leerCambios()) {
  if (!ses || !Object.keys(cambios).length) return ses;
  return { ...ses, bloques: ses.bloques.map((b) => { const n = cambios[b.nombre] && bloqueDe(cambios[b.nombre]); return n ? { ...n, min: b.min, de: b.nombre, dePict: b.pict } : b; }) };
}

const CSS = `
.bib-dlg { width: min(900px, calc(100vw - 16px)); }
.bib-intro { margin: 0 0 10px; color: var(--muted); font-size: .92rem; }
.bib-fil { display: grid; gap: 6px; margin: 0 0 10px; }
.bib-fila { display: grid; grid-template-columns: 74px minmax(0, 1fr); align-items: center; gap: 8px; }
.bib-fila > span { font-family: var(--mono); font-size: .68rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.bib-chips { display: flex; gap: 6px; overflow-x: auto; padding: 3px 2px 5px; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
.bib-chips button { flex: none; padding: 6px 12px; min-height: 34px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--fg); font: inherit; font-size: .84rem; white-space: nowrap; cursor: pointer; }
.bib-chips button:hover { background: var(--surface-2); }
.bib-chips button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent); color: var(--surface); font-weight: 700; }
.bib-chips button:focus-visible, .bib-t:focus-visible, .bib-dib:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.bib-cuenta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 8px; font-family: var(--mono); font-size: .74rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.bib-lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
.bib-lista > li { display: grid; }
.bib-t { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 2px 12px; align-items: center; align-content: center; width: 100%; padding: 8px 10px 8px 8px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
button.bib-t:hover { border-color: var(--accent); background: var(--surface-2); }
.bib-t .picto, .bib-dib .picto { grid-row: span 3; width: 64px; height: 64px; flex-basis: 64px; }
.bib-t b { font-size: .95rem; line-height: 1.2; }
.bib-t small { color: var(--muted); font-size: .78rem; line-height: 1.3; }
.bib-niv { display: flex; align-items: center; gap: 6px; font-size: .74rem; color: var(--muted); }
.bib-niv i { display: inline-flex; gap: 3px; }
.bib-niv i u { width: 7px; height: 7px; border-radius: 50%; background: var(--line-strong); text-decoration: none; }
.bib-niv i u.on { background: var(--accent); }
.bib-chip { justify-self: start; padding: 1px 8px; border-radius: 999px; background: var(--accent-soft); color: var(--accent-deep, var(--accent)); font-size: .68rem; font-weight: 700; white-space: nowrap; }
.bib-chip.plan { background: var(--info-soft); color: var(--info-ink); }
.bib-tit-fila { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
div.bib-t { grid-template-columns: 64px minmax(0, 1fr) auto; cursor: default; }
div.bib-t > .bib-tit-fila, div.bib-t > small, div.bib-t > .bib-niv { grid-column: 2; }
div.bib-t.actual { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
.bib-dib { grid-row: span 3; position: relative; padding: 0; border: 0; border-radius: 12px; background: none; color: inherit; cursor: pointer; }
.bib-dib .picto { display: block; }
div.bib-t .btn-sec, div.bib-t .btn { grid-row: 1 / span 3; grid-column: 3; align-self: center; white-space: nowrap; }
.bib-vacio { margin: 6px 0 0; padding: 14px; border: 1px dashed var(--line-strong); border-radius: var(--r-md); color: var(--muted); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.bib-nota { margin: 14px 0 0; font-size: .8rem; color: var(--muted); }
.bib-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; }
@media (max-width: 520px) { .bib-fila { grid-template-columns: 1fr; gap: 0; } .bib-lista { grid-template-columns: 1fr; } div.bib-t { grid-template-columns: 56px minmax(0, 1fr); } div.bib-t .btn-sec, div.bib-t .btn { grid-row: auto; grid-column: 2; justify-self: start; margin-top: 4px; } .bib-t .picto, .bib-dib .picto { width: 56px; height: 56px; } .bib-t { grid-template-columns: 56px minmax(0, 1fr); } }
:root[data-theme="contrast"] .bib-chips button[aria-pressed="true"] { outline: 2px solid var(--fg); }
@media (forced-colors: active) { .bib-chips button[aria-pressed="true"] { border: 3px solid Highlight; } }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .bib-lista > li { animation: bib-entra .26s var(--ease-salida, ease-out) both; } }
@keyframes bib-entra { from { opacity: 0; translate: 0 6px; } }
/* 854: la dificultad, en tres barras que suben */
.bib-niv i { align-items: flex-end; gap: 2px; height: 12px; }
.bib-niv i u { width: 5px; height: 5px; border-radius: 2px; }
.bib-niv i u:nth-child(2) { height: 8.500px; } .bib-niv i u:nth-child(3) { height: 12px; }
`;

let dlg = null, A = null, modo = null, fil = { zona: null, material: null, postura: null };
const cu = () => dlg.querySelector("#bib-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const etiquetas = (e) => [tx("z_" + e.zona), ...(e.material.length ? e.material.map((m) => tx("m_" + m)) : [tx("m_nada")])].join(" · ");
const nivelHtml = (e) => `<span class="bib-niv"><i aria-hidden="true">${[1, 2, 3].map((k) => `<u class="${k <= e.nivel ? "on" : ""}"></u>`).join("")}</i>${tx("niv_" + e.nivel)}</span>`;
const dibujo = (e) => A.dibujo(e.id);

function crear() {
  if (!document.getElementById("bib-css")) { const st = document.createElement("style"); st.id = "bib-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "biblioteca"; dlg.className = "ficha alta bib-dlg"; dlg.setAttribute("aria-labelledby", "bib-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="bib-cab-t"></p><button type="button" class="btn-sec sm" id="bib-cerrar"></button></div><div class="ficha-cuerpo" id="bib-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#bib-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const chip = ev.target.closest("[data-bib-f]");
    if (chip) { const k = chip.dataset.bibF, v = chip.dataset.v || null; fil[k] = v; pintar(); dlg.querySelector(`[data-bib-f="${k}"][data-v="${v || ""}"]`)?.focus(); return; }
    if (ev.target.closest("[data-bib-quitar]")) { fil = { zona: null, material: null, postura: null }; pintar(); return; }
    const ver = ev.target.closest("[data-bib-ver]");
    if (ver) { ev.preventDefault(); const e = porId(ver.dataset.bibVer); if (e) A.verEjercicio(bloqueDe(e.id)); return; }
    const usar = ev.target.closest("[data-bib-usar]");
    if (usar) { elegir(usar.dataset.bibUsar); return; }
    if (ev.target.closest("[data-bib-original]")) { elegir(null); return; }
    if (ev.target.closest("[data-bib-todos]")) { modo = { ...modo, todos: true }; pintar(); cu().scrollTop = 0; return; }
    if (ev.target.closest("[data-bib-volver]")) { modo = { ...modo, todos: false }; pintar(); cu().scrollTop = 0; }
  });
}
/** Guarda el cambio (id) o lo quita (null) y avisa a la aplicación para que vuelva a pintar. */
function elegir(id) {
  const c = leerCambios(), antes = c[modo.nombre] || null, orig = modo.nombre;
  if (id) c[orig] = id; else delete c[orig];
  guardarCambios(c);
  dlg.close();
  const deshacer = () => { const c2 = leerCambios(); if (antes) c2[orig] = antes; else delete c2[orig]; guardarCambios(c2); A.cambiado?.(); };
  A.cambiado?.();
  A.toast(id ? tx("cambiado", { a: esc(orig), b: esc(porId(id).nombre) }) : tx("restaurado", { a: esc(orig) }), { accion: tx("deshacer"), onAccion: deshacer, ms: 7000 });
}
function tarjeta(e, { cambio = false, actual = false, enPlan = false } = {}) {
  const cuerpo = `<span class="bib-tit-fila"><b>${esc(e.nombre)}</b>${actual ? `<span class="bib-chip plan">${tx("ahora")}</span>` : enPlan ? `<span class="bib-chip plan">${tx("en_plan")}</span>` : ""}</span><small>${etiquetas(e)}</small>${nivelHtml(e)}`;
  return cambio
    ? `<li><div class="bib-t${actual ? " actual" : ""}"><button type="button" class="bib-dib" data-bib-ver="${e.id}" aria-label="${tx("ver")}: ${esc(e.nombre)}">${dibujo(e)}</button>${cuerpo}${actual ? "" : `<button type="button" class="btn-sec sm" data-bib-usar="${e.id}" aria-label="${tx("usar")}: ${esc(e.nombre)}">${tx("usar")}</button>`}</div></li>`
    : `<li><button type="button" class="bib-t" data-bib-ver="${e.id}" aria-label="${tx("ver")}: ${esc(e.nombre)}">${dibujo(e)}${cuerpo}</button></li>`;
}
const chips = (k, valores, pref, todoK) => `<div class="bib-fila"><span id="bib-l-${k}">${tx(k)}</span><div class="bib-chips" role="group" aria-labelledby="bib-l-${k}"><button type="button" data-bib-f="${k}" data-v="" aria-pressed="${!fil[k]}">${tx(todoK)}</button>${valores.map((v) => `<button type="button" data-bib-f="${k}" data-v="${v}" aria-pressed="${fil[k] === v}">${tx(pref + v)}</button>`).join("")}</div></div>`;

function pintar() {
  const enPlan = new Set(A.enPlan?.() || []);
  if (modo && !modo.todos) {
    // cambiar un ejercicio del plan: el actual, el original (si ya se había cambiado) y las alternativas
    const c = leerCambios(), actualId = c[modo.nombre] || null, orig = porNombre(modo.nombre) || porId(modo.pict);
    const alts = alternativas(modo.nombre, modo.pict).filter((e) => e.id !== actualId);
    dlg.querySelector("#bib-cab-t").textContent = tx("cambiar_tit", { x: modo.nombre });
    cu().innerHTML = `<p class="bib-intro">${tx("cambiar_intro")}</p>
      <ul class="bib-lista" id="bib-lista">${actualId ? tarjeta(porId(actualId), { cambio: true, actual: true }) : orig ? tarjeta({ ...orig, nombre: modo.nombre }, { cambio: true, actual: true }) : ""}${alts.map((e) => tarjeta(e, { cambio: true })).join("")}</ul>
      ${alts.length ? "" : `<p class="bib-vacio">${tx("sin_alt")}</p>`}
      <div class="bib-acc">${actualId ? `<button type="button" class="btn" data-bib-original>${tx("original")}</button>` : ""}<button type="button" class="btn-sec" data-bib-todos>${tx("ver_todos")}</button></div>
      <p class="bib-nota">${tx("nota")}</p>`;
    return;
  }
  const lista = filtrar(fil), hayFiltro = fil.zona || fil.material || fil.postura;
  dlg.querySelector("#bib-cab-t").textContent = tx("titulo");
  cu().innerHTML = `<p class="bib-intro">${tx("intro", { n: catalogo().length })}</p>
    <div class="bib-fil">${chips("zona", ZONAS, "z_", "todo")}${chips("material", MATERIALES, "m_", "cualquiera")}${chips("postura", POSTURAS, "p_", "cualquiera")}</div>
    <p class="bib-cuenta" aria-live="polite"><span id="bib-n">${lista.length === 1 ? tx("cuenta_1") : tx("cuenta", { n: lista.length })}</span>${hayFiltro ? `<button type="button" class="btn-sec sm" data-bib-quitar>${tx("quitar")}</button>` : ""}</p>
    ${lista.length ? `<ul class="bib-lista" id="bib-lista">${lista.map((e) => tarjeta(e, { enPlan: enPlan.has(e.nombre) })).join("")}</ul>` : `<p class="bib-vacio">${tx("vacio")}</p>`}
    ${modo ? `<div class="bib-acc"><button type="button" class="btn-sec" data-bib-volver>${tx("volver")}</button></div>` : ""}
    <p class="bib-nota">${tx("nota")}</p>`;
}

/** Abre la biblioteca. a = { dibujo(id) -> svg, verEjercicio(bloque), toast, cambiado(), enPlan() -> nombres }.
    opts.cambiar = { nombre, pict } abre directamente las alternativas a ese ejercicio del plan. */
export function abrir(a, { cambiar = null } = {}) {
  if (!dlg) crear();
  A = a; modo = cambiar ? { nombre: cambiar.nombre, pict: cambiar.pict || null, todos: false } : null;
  if (!cambiar) fil = { zona: null, material: null, postura: null };
  dlg.querySelector("#bib-cerrar").textContent = a.cerrar || "×";
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#bib-cerrar").focus();
}
export function cerrar() { if (dlg?.open) dlg.close(); }
