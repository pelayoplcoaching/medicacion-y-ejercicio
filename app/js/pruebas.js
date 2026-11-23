/* Pruebas de forma física (mejora grande 8): la batería Senior Fitness Test de Rikli y Jones, guiada paso a paso con
   dibujo animado, cronómetro, contador grande y avisos de voz. Cada resultado se compara con el rango habitual de su
   edad y sexo (percentiles 25-75 de 7183 personas de 60 a 94 años; Rikli y Jones 1999, tal como lo publica el Senior
   Fitness Test Manual, 2.ª ed., 2013), con la zona de riesgo de perder movilidad (Jones y Rikli 2002) y, donde se ha
   podido contrastar, con la meta para mantener la autonomía (Rikli y Jones 2013). Se repite cada 8-12 semanas para
   compararse consigo mismo y complementa al SPPB (que mide fragilidad). Los textos de la interfaz van en los cinco
   idiomas dentro del propio módulo (no engordan i18n.js); el contenido de las pruebas, en español, como el resto de
   explicadores. Nada sale del dispositivo: el historial va en el estado de la aplicación. Se carga al abrirla. */
import { t, idioma } from "./i18n.js?v=202611231042";
import { tC } from "./tr.js?v=202611231042";

/* ---------- baremos ---------- */
/** Orden del manual: la de 6 minutos, al final. La resistencia se mide con una de las dos (paso2 o andar6). */
export const ORDEN = ["silla", "brazo", "paso2", "sentado", "espalda", "levantarse", "andar6"];
/* Rango habitual = percentiles 25-75 por sexo (m mujer, h hombre) y banda de edad: 60-64, 65-69, 70-74, 75-79, 80-84,
   85-89 y 90-94. Unidades del baremo: repeticiones o pasos; yardas (andar 6 min); pulgadas (flexibilidad: negativo = no
   llega); segundos (levantarse: [rápido, lento], menos es mejor). Comprobado con el manual de 2013 y con Jones y Rikli 2002. */
export const NORMAS = {
  silla: { m: [[12, 17], [11, 16], [10, 15], [10, 15], [9, 14], [8, 13], [4, 11]], h: [[14, 19], [12, 18], [12, 17], [11, 17], [10, 15], [8, 14], [7, 12]] },
  brazo: { m: [[13, 19], [12, 18], [12, 17], [11, 17], [10, 16], [10, 15], [8, 13]], h: [[16, 22], [15, 21], [14, 21], [13, 19], [13, 19], [11, 17], [10, 14]] },
  paso2: { m: [[75, 107], [73, 107], [68, 101], [68, 100], [60, 90], [55, 85], [44, 72]], h: [[87, 115], [86, 116], [80, 110], [73, 109], [71, 103], [59, 91], [52, 86]] },
  sentado: { m: [[-0.5, 5], [-0.5, 4.5], [-1, 4], [-1.5, 3.5], [-2, 3], [-2.5, 2.5], [-4.5, 1]], h: [[-2.5, 4], [-3, 3], [-3, 3], [-4, 2], [-5.5, 1.5], [-5.5, 0.5], [-6.5, -0.5]] },
  espalda: { m: [[-3, 1.5], [-3.5, 1.5], [-4, 1], [-5, 0.5], [-5.5, 0], [-7, -1], [-8, -1]], h: [[-6.5, 0], [-7.5, -1], [-8, -1], [-9, -2], [-9.5, -2], [-9.5, -3], [-10.5, -4]] },
  levantarse: { m: [[4.4, 6], [4.8, 6.4], [4.9, 7.1], [5.2, 7.4], [5.7, 8.7], [6.2, 9.6], [7.3, 11.5]], h: [[3.8, 5.6], [4.3, 5.9], [4.4, 6.2], [4.6, 7.2], [5.2, 7.6], [5.5, 8.9], [6.2, 10]] },
  andar6: { m: [[545, 660], [500, 635], [480, 615], [435, 585], [385, 540], [340, 510], [275, 440]], h: [[610, 735], [560, 700], [545, 680], [470, 640], [445, 605], [380, 570], [305, 500]] },
};
/** Zona de riesgo de perder movilidad, igual a cualquier edad (Jones y Rikli 2002): por debajo; en segundos, por encima.
 *  La de flexibilidad no se usa: cae dentro del rango habitual de muchas edades y no se ha relacionado con la autonomía
 *  (Rikli y Jones 2013 no dan meta para ella), así que alarmaría sin motivo. */
export const RIESGO = { silla: 8, brazo: 11, paso2: 65, andar6: 350, levantarse: 9 };
/** Meta para seguir valiéndose por sí mismo hasta edades avanzadas (Rikli y Jones 2013); solo las que se han podido contrastar con dos fuentes. */
export const META = { silla: { m: [15, 15, 14, 13, 12, 11, 9], h: [17, 16, 15, 14, 13, 11, 9] }, paso2: { m: [97, 93, 89, 84, 78, 70, 60], h: [106, 101, 95, 88, 80, 71, 60] } };
/** Días hasta repetirlas (8 semanas; el manual propone volver a medir a lo largo del programa, aquí cada 8-12 semanas). */
export const REPETIR_DIAS = 56;

const YARDA = 0.9144, PULGADA = 2.54;
const FLEX = new Set(["sentado", "espalda"]);
/** Banda de edad del baremo (0 = 60-64 … 6 = 90-94; desde 95, la última); por debajo de 60, sin baremo (-1). */
export const banda = (edad) => (edad == null || !Number.isFinite(Number(edad)) || edad < 60 ? -1 : Math.min(6, Math.floor((edad - 60) / 5)));
/** Del baremo a lo que se mide aquí (metros y centímetros), con el redondeo con que se enseña: así lo que se ve y lo que se clasifica coinciden. */
const aqui = (id, x) => (id === "andar6" ? Math.round(x * YARDA) : FLEX.has(id) ? Math.round(x * PULGADA * 10) / 10 : x);
const sx = (s) => (s === "m" || s === "h" ? s : null);
/** Rango habitual en unidades de aquí, ordenado de menos a más ([lo, hi]); null sin baremo. */
export const rango = (id, edad, sexo) => { const b = banda(edad), s = sx(sexo); return b < 0 || !s || !NORMAS[id] ? null : NORMAS[id][s][b].map((x) => aqui(id, x)); };
/** Umbral de la zona de riesgo en unidades de aquí (null si la prueba no tiene). */
export const umbral = (id) => (RIESGO[id] == null ? null : aqui(id, RIESGO[id]));
const enRiesgo = (id, v) => { const u = umbral(id); return u != null && (id === "levantarse" ? v > u : v < u); };

/** Compara un resultado (en metros, centímetros, segundos o repeticiones) con su edad y sexo.
 *  nivel: bajo | normal | alto (o null sin baremo); pos: 0 = borde peor del rango habitual, 1 = borde mejor. */
export function clasificar(id, valor, edad, sexo) {
  if (!NORMAS[id] || valor == null || !Number.isFinite(Number(valor))) return null;
  const v = Number(valor), riesgo = enRiesgo(id, v), r = rango(id, edad, sexo);
  if (!r) return { nivel: null, riesgo, pos: null, rango: null, meta: null, metaOk: null };
  const [lo, hi] = r, pos = id === "levantarse" ? (hi - v) / (hi - lo) : (v - lo) / (hi - lo);
  const meta = META[id]?.[sx(sexo)]?.[banda(edad)] ?? null;
  return { nivel: pos < 0 ? "bajo" : pos > 1 ? "alto" : "normal", riesgo, pos, rango: r, meta, metaOk: meta == null ? null : v >= meta };
}
/** El mejor de los intentos (en segundos, el menor). */
export const mejorDe = (id, xs) => { const v = xs.map(Number).filter((x) => Number.isFinite(x)); return v.length ? (id === "levantarse" ? Math.min(...v) : Math.max(...v)) : null; };
/** Metros andados: vueltas completas × metros por vuelta + lo de la última vuelta. */
export const distancia = (vueltas, mVuelta, extra = 0) => Math.round((Number(vueltas) || 0) * (Number(mVuelta) || 0) + (Number(extra) || 0));
/** Resumen de una batería: filas clasificadas, cuántas en lo habitual o por encima, puntos fuertes y dónde más puede ganar. */
export function resumen(r, edad, sexo) {
  const filas = ORDEN.filter((id) => r[id] != null && Number.isFinite(Number(r[id]))).map((id) => ({ id, valor: Number(r[id]), c: clasificar(id, r[id], edad, sexo) }));
  const con = filas.filter((f) => f.c?.nivel), orden = [...con].sort((a, b) => b.c.pos - a.c.pos);
  return {
    filas, total: con.length, habituales: con.filter((f) => f.c.nivel !== "bajo").length,
    riesgo: filas.filter((f) => f.c?.riesgo).map((f) => f.id),
    fuertes: orden.filter((f) => f.c.pos >= 0.75).slice(0, 2).map((f) => f.id),
    // primero las que están en zona de riesgo; después, las más alejadas de lo habitual
    mejorar: con.filter((f) => f.c.nivel === "bajo" || f.c.riesgo).sort((a, b) => (b.c.riesgo - a.c.riesgo) || (a.c.pos - b.c.pos)).slice(0, 2).map((f) => f.id),
  };
}

/* ---------- las pruebas (contenido en español, como los demás explicadores) ---------- */
export const PRUEBAS = tC({
  silla: { tipo: "cuenta", tiempo: 30, max: 60, ud: "reps", mat: ["silla"], cuida: ["tension", "tension_alta", "equilibrio"], ej: ["Levantarse de la silla", "Sentadilla a la silla"],
    nombre: "Levantarse de la silla (30 segundos)", corto: "Piernas", mide: "Fuerza de piernas",
    pasos: ["Siéntese en el centro de la silla, con la espalda recta, los pies apoyados en el suelo y los brazos cruzados sobre el pecho.", "Al oír «¡Ya!», levántese del todo y vuelva a sentarse del todo, tantas veces como pueda en 30 segundos.", "Cuenta cada vez que queda de pie del todo. Si al acabar el tiempo ya ha subido más de la mitad, cuenta como una más.", "Antes, pruebe una o dos veces despacio para coger el movimiento."] },
  brazo: { tipo: "cuenta", tiempo: 30, max: 60, ud: "reps", mat: ["silla", "pesa"], cuida: ["tension_alta", "musculo", "tendon"], ej: ["Flexión de brazos con botella o banda", "Remo con banda elástica"],
    nombre: "Flexión de brazo (30 segundos)", corto: "Brazos", mide: "Fuerza de brazos",
    pasos: ["Siéntese con la espalda recta y la pesa en la mano del brazo más fuerte, colgando junto a la silla, con la palma hacia el cuerpo.", "Al oír «¡Ya!», suba la pesa doblando el codo y girando la palma hacia arriba; luego bájela hasta estirar el brazo del todo.", "El codo queda pegado al cuerpo: solo se mueve el antebrazo.", "Cuente las veces que sube y baja completas en 30 segundos."],
    nota: "Pesa de 2,3 kg en mujeres y de 3,6 kg en hombres. Si usa otra, anótela y use siempre la misma: la comparación con su edad será aproximada, pero podrá compararse consigo mismo." },
  paso2: { tipo: "cuenta", tiempo: 120, max: 250, ud: "pasos", mat: ["cinta", "apoyo"], cuida: ["equilibrio", "pulso", "azucar", "acelera"], ej: ["Marcha, bici o elíptica", "Marcha a paso cómodo"],
    nombre: "Marcha en el sitio (2 minutos)", corto: "Resistencia", mide: "Resistencia: corazón y pulmones",
    pasos: ["Marque en la pared, con cinta, la altura de la mitad del muslo: a medio camino entre la rótula y el hueso de la cadera.", "Al oír «¡Ya!», marche en el sitio durante 2 minutos subiendo cada rodilla hasta la marca.", "Cuente cada vez que la rodilla derecha llega a la marca.", "Si no llega a la marca, baje el ritmo o pare a descansar: el reloj sigue. Puede apoyarse con una mano."] },
  sentado: { tipo: "flex", ud: "cm", mat: ["silla", "regla", "ayuda"], cuida: ["tension"], ej: ["Bisagra de cadera", "Enfriamiento"],
    nombre: "Flexibilidad sentado", corto: "Flexibilidad de piernas", mide: "Flexibilidad de la parte de atrás de las piernas y de la espalda baja",
    pasos: ["Siéntese en el borde de la silla. Doble una pierna con el pie apoyado y estire la otra delante, con el talón en el suelo y la punta del pie hacia arriba.", "Con una mano sobre la otra, inclínese despacio desde la cadera, con la espalda recta, y estírese hacia la punta del pie. Aguante 2 segundos.", "Que le midan los centímetros que le faltan hasta la punta del pie, o los que la pasa. Sin rebotes y sin llegar al dolor.", "Hágalo 2 veces y quédese con el mejor."],
    nota: "Si tiene osteoporosis importante, sáltese esta prueba." },
  espalda: { tipo: "flex", ud: "cm", mat: ["regla", "ayuda"], cuida: ["equilibrio"], ej: ["Giros lentos y alcances", "Press de hombro ligero"],
    nombre: "Rascarse la espalda", corto: "Flexibilidad de hombros", mide: "Flexibilidad de los hombros",
    pasos: ["De pie, lleve una mano por encima del hombro hacia la espalda, con la palma hacia la espalda y los dedos hacia abajo.", "Lleve la otra por detrás de la cintura, con la palma hacia fuera, subiendo por la espalda.", "Intente que se toquen, o se crucen, los dedos corazón de las dos manos, sin forzar.", "Que le midan los centímetros entre los dedos, o lo que se cruzan. Hágalo 2 veces y quédese con el mejor."] },
  levantarse: { tipo: "crono", ud: "s", mat: ["silla", "marca", "ayuda"], cuida: ["equilibrio", "sangrado", "tension", "tendon"], ej: ["Marcha talón-punta", "Levantarse de la silla"],
    nombre: "Levantarse, andar 2,44 m y volver", corto: "Agilidad", mide: "Agilidad y equilibrio en movimiento",
    pasos: ["Siéntese con las manos sobre los muslos y un pie un poco por delante del otro.", "Al oír «¡Ya!», levántese, camine lo más rápido que pueda sin correr, rodee la marca y vuelva a sentarse.", "El tiempo cuenta desde «¡Ya!» hasta que vuelve a estar sentado del todo.", "Hágalo 2 veces y quédese con el mejor. Mejor con alguien al lado."] },
  andar6: { tipo: "vueltas", tiempo: 360, ud: "m", mat: ["recorrido"], cuida: ["pulso", "azucar", "acelera", "calor", "agua"], ej: ["Marcha, bici o elíptica", "Marcha a paso cómodo"],
    nombre: "Andar 6 minutos", corto: "Resistencia", mide: "Resistencia: corazón y pulmones",
    pasos: ["Al oír «¡Ya!», camine lo más rápido que pueda, sin correr, durante 6 minutos, dando vueltas al recorrido.", "Puede parar a descansar y seguir: el reloj no se para.", "Cuente las vueltas con el botón. Al acabar, sume los metros de la última vuelta a medias.", "Pare si nota mareo, dolor en el pecho, mucha falta de aire o dolor."] },
});
const MATERIAL = tC({
  silla: "Una silla sin brazos, de unos 43 cm de alto, apoyada contra la pared.",
  pesa: "Una pesa de 2,3 kg (mujeres) o de 3,6 kg (hombres).",
  cinta: "Cinta adhesiva para marcar la pared a media altura del muslo.",
  apoyo: "La pared o una silla al lado, por si necesita apoyarse.",
  regla: "Una regla o una cinta métrica.",
  ayuda: "Alguien que le ayude a medir y a contar.",
  marca: "Una marca (un cono o una botella) a 2,44 m del borde del asiento.",
  recorrido: "Un recorrido llano y medido: por ejemplo, un rectángulo de 18,3 × 4,6 m (45,7 m por vuelta, como el original) con marcas, o una pista.",
});
/** Fuentes (las de estudios, con DOI). */
export const FUENTES = tC([
  { txt: "Rikli y Jones. Functional fitness normative scores for community-residing older adults, ages 60-94. J Aging Phys Act 1999 (7183 personas)", doi: "10.1123/japa.7.2.162" },
  { txt: "Rikli y Jones. Senior Fitness Test Manual, 2.ª ed. Human Kinetics, 2013 (rangos habituales)" },
  { txt: "Jones y Rikli. Measuring functional fitness of older adults. The Journal on Active Aging, 2002 (zona de riesgo)" },
  { txt: "Rikli y Jones. Criterion-referenced clinically relevant fitness standards for maintaining physical independence in later years. Gerontologist 2013 (meta de autonomía)", doi: "10.1093/geront/gns071" },
  { txt: "Jones, Rikli y Beam. A 30-s chair-stand test as a measure of lower body strength in community-residing older adults. Res Q Exerc Sport 1999", doi: "10.1080/02701367.1999.10608028" },
]);

/* ---------- textos de la interfaz en los cinco idiomas ---------- */
export const TXT = {
  es: {
    titulo: "Pruebas de forma física", sub: "Senior Fitness Test (Rikli y Jones) · baremos de 60 a 94 años",
    intro: "Seis pruebas sencillas para medir la fuerza, la resistencia, la flexibilidad y la agilidad. Cada resultado se compara con personas de su edad y sexo y, si las repite cada 8–12 semanas, con usted mismo. Solo se guardan en este dispositivo.",
    ultima: "Última vez: {d}", desde: "Repítalas a partir del {d}", toca: "Toca repetirlas (cada 8–12 semanas)", evolucion: "Su evolución",
    sexo: "Para compararle con su edad", mujer: "Mujer", hombre: "Hombre", nodecir: "Prefiero no decirlo", edad: "Edad",
    aer: "Prueba de resistencia", paso2: "Marcha en el sitio, 2 min (en casa)", andar6: "Andar 6 min (recorrido medido)",
    menor60: "Los baremos son de 60 a 94 años: a su edad, úselas para compararse consigo mismo.", sinsexo: "Sin el sexo no se puede comparar con su edad, pero sí consigo mismo.", mayor94: "Por encima de 94 años se compara con el grupo de 90 a 94.",
    necesita: "Qué necesita", seguridad: "Antes de empezar", segx: "No haga las pruebas sin hablarlo antes con su médico si:",
    seg1: "su médico le ha dicho que no haga ejercicio;", seg2: "nota dolor u opresión en el pecho, o mareo, al hacer esfuerzos;", seg3: "tiene insuficiencia cardiaca;", seg4: "tiene la tensión alta sin controlar (160/100 o más).",
    segic: "Ha marcado insuficiencia cardiaca: haga las pruebas solo con el visto bueno de su médico.", crib: "Según el chequeo previo, conviene que lo hable antes con su médico.",
    fragil: "Con su resultado del SPPB, hágalas acompañado y sáltese las de andar si no se siente seguro.", segok: "No me pasa nada de esto (o tengo el visto bueno de mi médico)",
    empezar: "Empezar", prueba: "Prueba {n} de {t}", atras: "Atrás", saltar: "Saltar esta prueba", ver: "Ver resultados", voz: "Avisos con voz",
    cuenta: "Cuenta", mas1: "Sumar una", menos1: "Restar una", resultado: "Resultado", reps: "repeticiones", pasos: "pasos", vueltas: "vueltas",
    intento: "Intento {n}", mejor: "Se queda el mejor", falta_cm: "Me faltan", justo: "Llego justo", paso_cm: "Me paso",
    vuelta_m: "Metros por vuelta", extra_m: "Metros de la última vuelta", total: "Distancia", falta: "Escriba el resultado o pulse «Saltar esta prueba».", osteo: "Ha marcado osteoporosis en sus datos.",
    res: "Sus resultados", resn: "en lo habitual para su edad o por encima", resriesgo: "{n} en zona de riesgo",
    bajo: "Por debajo de lo habitual", normal: "En lo habitual", alto: "Por encima de lo habitual", sinbaremo: "Sin baremo",
    habitual: "Habitual a su edad: {r}", riesgo: "Zona de riesgo de perder movilidad", meta: "Meta para mantener la autonomía: {n}", meta_c: "meta", antes: "La vez anterior ({d}): {v}",
    fuertes: "Sus puntos fuertes", mejorar: "Dónde más puede ganar", ejercicios: "Ejercicios de su plan que ayudan:", todobien: "Todo en lo habitual para su edad o por encima: siga con su plan.",
    guardar: "Guardar resultados", guardado: "Resultados guardados. Repita las pruebas a partir del {d}.", guardado_b: "Guardado", copiar: "Copiar para el médico", copiado: "Resultados copiados.", otra: "Hacerlas otra vez",
    cambios: "Los cambios pequeños pueden deberse al día: fíjese en la tendencia de varias mediciones.", fuentes: "Fuentes",
    nota: "Orientativo: compara con 7183 personas de 60 a 94 años de EE. UU. No sustituye a la valoración de su médico.", pie: "Baremos: Senior Fitness Test (Rikli y Jones). Orientativo.",
    v_ya: "¡Ya!", v_tiempo: "Tiempo.", v_mitad: "Mitad del tiempo.", v_q30: "Quedan 30 segundos.", v_q2: "Quedan dos minutos.", v_q1: "Queda un minuto.", v_pare: "Tiempo. Pare donde está.",
  },
  en: {
    titulo: "Fitness tests", sub: "Senior Fitness Test (Rikli and Jones) · norms for ages 60 to 94",
    intro: "Six simple tests of strength, endurance, flexibility and agility. Each result is compared with people of your age and sex and, if you repeat them every 8–12 weeks, with yourself. They are only saved on this device.",
    ultima: "Last time: {d}", desde: "Repeat them from {d}", toca: "Time to repeat them (every 8–12 weeks)", evolucion: "Your progress",
    sexo: "To compare you with your age group", mujer: "Woman", hombre: "Man", nodecir: "I'd rather not say", edad: "Age",
    aer: "Endurance test", paso2: "Marching on the spot, 2 min (at home)", andar6: "6-minute walk (measured course)",
    menor60: "The norms cover ages 60 to 94: at your age, use the tests to compare with yourself.", sinsexo: "Without your sex we cannot compare you with your age group, but you can compare with yourself.", mayor94: "Over 94, you are compared with the 90–94 group.",
    necesita: "What you need", seguridad: "Before you start", segx: "Do not do the tests without talking to your doctor first if:",
    seg1: "your doctor has told you not to exercise;", seg2: "you feel chest pain or tightness, or dizziness, on exertion;", seg3: "you have heart failure;", seg4: "you have uncontrolled high blood pressure (160/100 or more).",
    segic: "You ticked heart failure: only do the tests with your doctor's approval.", crib: "According to the pre-exercise check, you should talk to your doctor first.",
    fragil: "Given your SPPB result, do them with someone and skip the walking tests if you don't feel safe.", segok: "None of this applies to me (or my doctor has approved it)",
    empezar: "Start", prueba: "Test {n} of {t}", atras: "Back", saltar: "Skip this test", ver: "See results", voz: "Voice cues",
    cuenta: "Count", mas1: "Add one", menos1: "Take one away", resultado: "Result", reps: "repetitions", pasos: "steps", vueltas: "laps",
    intento: "Attempt {n}", mejor: "Best attempt", falta_cm: "Short by", justo: "Just touching", paso_cm: "Past by",
    vuelta_m: "Metres per lap", extra_m: "Metres of the last lap", total: "Distance", falta: "Enter the result or press “Skip this test”.", osteo: "You ticked osteoporosis in your details.",
    res: "Your results", resn: "within the usual range for your age or above", resriesgo: "{n} in the risk zone",
    bajo: "Below the usual range", normal: "Within the usual range", alto: "Above the usual range", sinbaremo: "No norms",
    habitual: "Usual at your age: {r}", riesgo: "Risk zone for losing mobility", meta: "Target to stay independent: {n}", meta_c: "target", antes: "Previous time ({d}): {v}",
    fuertes: "Your strengths", mejorar: "Where you can gain most", ejercicios: "Exercises in your plan that help:", todobien: "Everything within the usual range for your age or above: keep up your plan.",
    guardar: "Save results", guardado: "Results saved. Repeat the tests from {d}.", guardado_b: "Saved", copiar: "Copy for the doctor", copiado: "Results copied.", otra: "Do them again",
    cambios: "Small changes can be down to the day: look at the trend over several measurements.", fuentes: "Sources",
    nota: "For guidance only: compares you with 7,183 people aged 60 to 94 in the USA. It does not replace your doctor's assessment.", pie: "Norms: Senior Fitness Test (Rikli and Jones). For guidance only.",
    v_ya: "Go!", v_tiempo: "Time.", v_mitad: "Halfway.", v_q30: "30 seconds left.", v_q2: "Two minutes left.", v_q1: "One minute left.", v_pare: "Time. Stop where you are.",
  },
  ca: {
    titulo: "Proves de forma física", sub: "Senior Fitness Test (Rikli i Jones) · barems de 60 a 94 anys",
    intro: "Sis proves senzilles per mesurar la força, la resistència, la flexibilitat i l'agilitat. Cada resultat es compara amb persones de la seva edat i sexe i, si les repeteix cada 8–12 setmanes, amb vostè mateix. Només es desen en aquest dispositiu.",
    ultima: "Última vegada: {d}", desde: "Repeteixi-les a partir del {d}", toca: "Toca repetir-les (cada 8–12 setmanes)", evolucion: "La seva evolució",
    sexo: "Per comparar-lo amb la seva edat", mujer: "Dona", hombre: "Home", nodecir: "Prefereixo no dir-ho", edad: "Edat",
    aer: "Prova de resistència", paso2: "Marxa al lloc, 2 min (a casa)", andar6: "Caminar 6 min (recorregut mesurat)",
    menor60: "Els barems són de 60 a 94 anys: a la seva edat, utilitzi-les per comparar-se amb vostè mateix.", sinsexo: "Sense el sexe no es pot comparar amb la seva edat, però sí amb vostè mateix.", mayor94: "Per sobre de 94 anys es compara amb el grup de 90 a 94.",
    necesita: "Què necessita", seguridad: "Abans de començar", segx: "No faci les proves sense parlar-ne abans amb el seu metge si:",
    seg1: "el seu metge li ha dit que no faci exercici;", seg2: "nota dolor o opressió al pit, o mareig, quan fa esforços;", seg3: "té insuficiència cardíaca;", seg4: "té la pressió alta sense controlar (160/100 o més).",
    segic: "Ha marcat insuficiència cardíaca: faci les proves només amb el vistiplau del seu metge.", crib: "Segons la revisió prèvia, convé que ho parli abans amb el seu metge.",
    fragil: "Amb el seu resultat de l'SPPB, faci-les acompanyat i salti's les de caminar si no se sent segur.", segok: "No em passa res d'això (o tinc el vistiplau del meu metge)",
    empezar: "Començar", prueba: "Prova {n} de {t}", atras: "Enrere", saltar: "Saltar aquesta prova", ver: "Veure resultats", voz: "Avisos amb veu",
    cuenta: "Compte", mas1: "Sumar-ne una", menos1: "Treure'n una", resultado: "Resultat", reps: "repeticions", pasos: "passos", vueltas: "voltes",
    intento: "Intent {n}", mejor: "Es queda el millor", falta_cm: "Em falten", justo: "Hi arribo just", paso_cm: "Em passo",
    vuelta_m: "Metres per volta", extra_m: "Metres de l'última volta", total: "Distància", falta: "Escrigui el resultat o premi «Saltar aquesta prova».", osteo: "Ha marcat osteoporosi a les seves dades.",
    res: "Els seus resultats", resn: "dins del que és habitual per a la seva edat o per sobre", resriesgo: "{n} en zona de risc",
    bajo: "Per sota del que és habitual", normal: "Dins del que és habitual", alto: "Per sobre del que és habitual", sinbaremo: "Sense barem",
    habitual: "Habitual a la seva edat: {r}", riesgo: "Zona de risc de perdre mobilitat", meta: "Objectiu per mantenir l'autonomia: {n}", meta_c: "objectiu", antes: "La vegada anterior ({d}): {v}",
    fuertes: "Els seus punts forts", mejorar: "On pot guanyar més", ejercicios: "Exercicis del seu pla que hi ajuden:", todobien: "Tot dins del que és habitual per a la seva edat o per sobre: continuï amb el seu pla.",
    guardar: "Desar els resultats", guardado: "Resultats desats. Repeteixi les proves a partir del {d}.", guardado_b: "Desat", copiar: "Copiar per al metge", copiado: "Resultats copiats.", otra: "Fer-les una altra vegada",
    cambios: "Els canvis petits poden ser cosa del dia: fixi's en la tendència de diverses mesures.", fuentes: "Fonts",
    nota: "Orientatiu: compara amb 7.183 persones de 60 a 94 anys dels EUA. No substitueix la valoració del seu metge.", pie: "Barems: Senior Fitness Test (Rikli i Jones). Orientatiu.",
    v_ya: "Ja!", v_tiempo: "Temps.", v_mitad: "Meitat del temps.", v_q30: "Queden 30 segons.", v_q2: "Queden dos minuts.", v_q1: "Queda un minut.", v_pare: "Temps. Aturi's on és.",
  },
  gl: {
    titulo: "Probas de forma física", sub: "Senior Fitness Test (Rikli e Jones) · baremos de 60 a 94 anos",
    intro: "Seis probas sinxelas para medir a forza, a resistencia, a flexibilidade e a axilidade. Cada resultado compárase con persoas da súa idade e sexo e, se as repite cada 8–12 semanas, con vostede mesmo. Só se gardan neste dispositivo.",
    ultima: "Última vez: {d}", desde: "Repítaas a partir do {d}", toca: "Toca repetilas (cada 8–12 semanas)", evolucion: "A súa evolución",
    sexo: "Para comparalo coa súa idade", mujer: "Muller", hombre: "Home", nodecir: "Prefiro non dicilo", edad: "Idade",
    aer: "Proba de resistencia", paso2: "Marcha no sitio, 2 min (na casa)", andar6: "Camiñar 6 min (percorrido medido)",
    menor60: "Os baremos son de 60 a 94 anos: á súa idade, úseas para compararse con vostede mesmo.", sinsexo: "Sen o sexo non se pode comparar coa súa idade, pero si con vostede mesmo.", mayor94: "Por riba de 94 anos compárase co grupo de 90 a 94.",
    necesita: "Que necesita", seguridad: "Antes de comezar", segx: "Non faga as probas sen falalo antes co seu médico se:",
    seg1: "o seu médico lle dixo que non faga exercicio;", seg2: "nota dor ou opresión no peito, ou mareo, ao facer esforzos;", seg3: "ten insuficiencia cardíaca;", seg4: "ten a tensión alta sen controlar (160/100 ou máis).",
    segic: "Marcou insuficiencia cardíaca: faga as probas só co visto e prace do seu médico.", crib: "Segundo a revisión previa, convén que o fale antes co seu médico.",
    fragil: "Co seu resultado do SPPB, fágaas acompañado e sáltese as de camiñar se non se sente seguro.", segok: "Non me pasa nada disto (ou teño o visto e prace do meu médico)",
    empezar: "Comezar", prueba: "Proba {n} de {t}", atras: "Atrás", saltar: "Saltar esta proba", ver: "Ver resultados", voz: "Avisos con voz",
    cuenta: "Conta", mas1: "Sumar unha", menos1: "Restar unha", resultado: "Resultado", reps: "repeticións", pasos: "pasos", vueltas: "voltas",
    intento: "Intento {n}", mejor: "Queda o mellor", falta_cm: "Fáltanme", justo: "Chego xusto", paso_cm: "Pásome",
    vuelta_m: "Metros por volta", extra_m: "Metros da última volta", total: "Distancia", falta: "Escriba o resultado ou prema «Saltar esta proba».", osteo: "Marcou osteoporose nos seus datos.",
    res: "Os seus resultados", resn: "no habitual para a súa idade ou por riba", resriesgo: "{n} en zona de risco",
    bajo: "Por debaixo do habitual", normal: "No habitual", alto: "Por riba do habitual", sinbaremo: "Sen baremo",
    habitual: "Habitual á súa idade: {r}", riesgo: "Zona de risco de perder mobilidade", meta: "Meta para manter a autonomía: {n}", meta_c: "meta", antes: "A vez anterior ({d}): {v}",
    fuertes: "Os seus puntos fortes", mejorar: "Onde máis pode gañar", ejercicios: "Exercicios do seu plan que axudan:", todobien: "Todo no habitual para a súa idade ou por riba: siga co seu plan.",
    guardar: "Gardar resultados", guardado: "Resultados gardados. Repita as probas a partir do {d}.", guardado_b: "Gardado", copiar: "Copiar para o médico", copiado: "Resultados copiados.", otra: "Facelas outra vez",
    cambios: "Os cambios pequenos poden deberse ao día: fíxese na tendencia de varias medicións.", fuentes: "Fontes",
    nota: "Orientativo: compara con 7183 persoas de 60 a 94 anos dos EUA. Non substitúe a valoración do seu médico.", pie: "Baremos: Senior Fitness Test (Rikli e Jones). Orientativo.",
    v_ya: "Xa!", v_tiempo: "Tempo.", v_mitad: "Metade do tempo.", v_q30: "Quedan 30 segundos.", v_q2: "Quedan dous minutos.", v_q1: "Queda un minuto.", v_pare: "Tempo. Pare onde está.",
  },
  eu: {
    titulo: "Sasoi fisikoko probak", sub: "Senior Fitness Test (Rikli eta Jones) · 60 eta 94 urte bitarteko baremoak",
    intro: "Sei proba erraz indarra, erresistentzia, malgutasuna eta arintasuna neurtzeko. Emaitza bakoitza zure adin eta sexuko pertsonekin alderatzen da eta, 8–12 astean behin errepikatzen badituzu, zeure buruarekin. Gailu honetan bakarrik gordetzen dira.",
    ultima: "Azken aldia: {d}", desde: "Errepika itzazu data honetatik aurrera: {d}", toca: "Errepikatzeko garaia da (8–12 astean behin)", evolucion: "Zure bilakaera",
    sexo: "Zure adinarekin alderatzeko", mujer: "Emakumea", hombre: "Gizona", nodecir: "Nahiago dut ez esan", edad: "Adina",
    aer: "Erresistentzia proba", paso2: "Lekuan martxan, 2 min (etxean)", andar6: "6 minutuz ibili (ibilbide neurtua)",
    menor60: "Baremoak 60 eta 94 urte bitartekoak dira: zure adinean, erabili zeure buruarekin alderatzeko.", sinsexo: "Sexurik gabe ezin da zure adinarekin alderatu, baina bai zeure buruarekin.", mayor94: "94 urtetik gora, 90–94 taldearekin alderatzen da.",
    necesita: "Zer behar duzun", seguridad: "Hasi aurretik", segx: "Ez egin probak aurretik medikuarekin hitz egin gabe, baldin eta:",
    seg1: "medikuak ariketarik ez egiteko esan badizu;", seg2: "ahalegina egitean bularreko mina edo estutasuna, edo zorabioa, sentitzen baduzu;", seg3: "bihotz-gutxiegitasuna baduzu;", seg4: "tentsio altua kontrolatu gabe baduzu (160/100 edo gehiago).",
    segic: "Bihotz-gutxiegitasuna markatu duzu: egin probak medikuaren oniritziarekin bakarrik.", crib: "Aurretiko azterketaren arabera, komeni da lehenago medikuarekin hitz egitea.",
    fragil: "Zure SPPB emaitzarekin, egin itzazu norbaitekin eta saltatu ibiltzekoak seguru sentitzen ez bazara.", segok: "Hauetako ezer ez zait gertatzen (edo medikuaren oniritzia dut)",
    empezar: "Hasi", prueba: "{n}. proba ({t}tik)", atras: "Atzera", saltar: "Saltatu proba hau", ver: "Ikusi emaitzak", voz: "Ahots bidezko abisuak",
    cuenta: "Kontaketa", mas1: "Bat gehitu", menos1: "Bat kendu", resultado: "Emaitza", reps: "errepikapen", pasos: "urrats", vueltas: "itzuli",
    intento: "{n}. saiakera", mejor: "Onena gordetzen da", falta_cm: "Falta zaizkit", justo: "Justu iristen naiz", paso_cm: "Pasatzen naiz",
    vuelta_m: "Metroak itzuliko", extra_m: "Azken itzuliko metroak", total: "Distantzia", falta: "Idatzi emaitza edo sakatu «Saltatu proba hau».", osteo: "Osteoporosia markatu duzu zure datuetan.",
    res: "Zure emaitzak", resn: "zure adinerako ohikoaren barruan edo gainetik", resriesgo: "{n} arrisku-eremuan",
    bajo: "Ohikoaren azpitik", normal: "Ohikoaren barruan", alto: "Ohikoaren gainetik", sinbaremo: "Baremorik gabe",
    habitual: "Zure adinean ohikoa: {r}", riesgo: "Mugikortasuna galtzeko arrisku-eremua", meta: "Autonomiari eusteko helburua: {n}", meta_c: "helburua", antes: "Aurreko aldia ({d}): {v}",
    fuertes: "Zure indarguneak", mejorar: "Non irabaz dezakezun gehien", ejercicios: "Laguntzen duten zure planeko ariketak:", todobien: "Dena zure adinerako ohikoaren barruan edo gainetik: jarraitu zure planarekin.",
    guardar: "Gorde emaitzak", guardado: "Emaitzak gorde dira. Errepikatu probak data honetatik aurrera: {d}.", guardado_b: "Gordeta", copiar: "Kopiatu medikuarentzat", copiado: "Emaitzak kopiatu dira.", otra: "Egin berriro",
    cambios: "Aldaketa txikiak egunaren araberakoak izan daitezke: begiratu hainbat neurketaren joera.", fuentes: "Iturriak",
    nota: "Orientagarria: AEBko 60 eta 94 urte bitarteko 7.183 pertsonarekin alderatzen du. Ez du medikuaren balorazioa ordezkatzen.", pie: "Baremoak: Senior Fitness Test (Rikli eta Jones). Orientagarria.",
    v_ya: "Orain!", v_tiempo: "Denbora.", v_mitad: "Denboraren erdia.", v_q30: "30 segundo falta dira.", v_q2: "Bi minutu falta dira.", v_q1: "Minutu bat falta da.", v_pare: "Denbora. Gelditu zauden lekuan.",
  },
};
/** Texto de la interfaz en el idioma elegido (si falta, en español). */
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}

/* ---------- formato ---------- */
const num = (v, d = 0) => Number(v).toLocaleString(idioma(), { minimumFractionDigits: d, maximumFractionDigits: d });
const conSigno = (v) => (v > 0 ? "+" : "") + num(v, Number.isInteger(v) ? 0 : 1).replace(/^-/, "−");
/** Valor con su unidad, como se enseña. */
export function fmt(id, v) {
  const u = PRUEBAS[id].ud;
  if (u === "cm") return `${conSigno(v)} cm`;
  if (u === "s") return `${num(v, 1)} s`;
  if (u === "m") return `${num(v)} m`;
  return `${num(v)} ${tx(u)}`;
}
/** Igual, con la cifra y la unidad separadas para darles distinto tamaño. */
const fmtHtml = (id, v) => { const u = PRUEBAS[id].ud; return `<span class="sft-val"><b>${u === "cm" ? conSigno(v) : num(v, u === "s" ? 1 : 0)}</b> <span class="sft-ud">${["cm", "s", "m"].includes(u) ? u : tx(u)}</span></span>`; };
const fmtCorto = (id, v) => { const u = PRUEBAS[id].ud; return u === "cm" ? conSigno(v) : u === "s" ? `${num(v)} s` : u === "m" ? `${num(v)} m` : num(v); };
export function rangoTxt(id, r) {
  if (!r) return "";
  const u = PRUEBAS[id].ud;
  if (u === "cm") return `${conSigno(r[0])} – ${conSigno(r[1])} cm`;
  if (u === "s") return `${num(r[0], 1)}–${num(r[1], 1)} s`;
  return `${num(r[0])}–${num(r[1])}${u === "m" ? " m" : ""}`;
}
const fecha = (ms) => new Date(ms).toLocaleDateString(idioma(), { day: "numeric", month: "short" });
const fechaLarga = (ms) => new Date(ms).toLocaleDateString(idioma(), { day: "numeric", month: "long", year: "numeric" });

/* ---------- dibujos (mismo trazo que los ejercicios animados: figura gruesa, apoyos finos, movimiento en el color de acento) ---------- */
const prop = (d) => `<path class="prop" d="${d}"/>`;
const suelo = (x1 = 6, x2 = 90) => prop(`M${x1} 84H${x2}`);
const sillaLat = (x) => prop(`M${x} 34v50M${x} 58h20v26M${x + 20} 58v26`);
const SVG = (cuerpo, clase = "sft-svg") => `<svg class="${clase}" viewBox="0 0 96 96" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">${cuerpo}</svg>`;
const RITMOS = { ida: { orden: "aba", t: "0;0.5;1", dur: 3.2, rep: 3 }, aguanta: { orden: "abba", t: "0;0.3;0.7;1", dur: 4.4, rep: 2 }, rapido: { orden: "aba", t: "0;0.5;1", dur: 1.1, rep: 8 } };
const anim = (attr, vals, r) => `<animate attributeName="${attr}" values="${vals.join(";")}" keyTimes="${r.t}" dur="${r.dur}s" repeatCount="${r.rep}" begin="indefinite" fill="freeze" calcMode="spline" keySplines="${r.t.split(";").slice(1).map(() => ".45 0 .55 1").join(";")}"/>`;
const secuencia = (r, a, b) => [...r.orden].map((k) => (k === "a" ? a : b));
/* Cada prueba: fondo fijo, cabeza y figura en la postura de partida y de llegada (mismos trazos para que el navegador
   interpole) y piezas extra que se mueven (pesa, distancia entre las manos). Las dos de recorrido son esquemas con un punto. */
const ESC = {
  silla: { fondo: suelo() + sillaLat(12), cab: [[31, 24], [47, 19]], fig: ["M30 31l-4 25M26 56l20 0 1 28M26 56l18 2 2 26M30 35l6 8-8-2", "M46 26l-1 26M45 52l1 16 1 16M45 52l-1 16 2 16M46 30l6 8-8-2"], ritmo: "ida" },
  brazo: { fondo: suelo() + prop("M20 26v58M20 56h24v28M22 56v28"), cab: [[32, 23], [32, 23]], fig: ["M31 30l-1 25M30 55l20 0 1 29M30 55l19 2 1 27M31 34l4 12 9 7M32 33l3 14 2 14", "M31 30l-1 25M30 55l20 0 1 29M30 55l19 2 1 27M31 34l4 12 9 7M32 33l3 14 6-13"], extras: [{ el: '<rect class="sft-pesa" width="8" height="5" rx="1.5"', a: { x: [33, 37], y: [59, 32] } }], ritmo: "ida" },
  paso2: { fondo: suelo() + prop("M84 10v74") + '<path class="mov" d="M78 58h10"/>', cab: [[48, 14], [48, 15]], fig: ["M48 20l0 32M48 52l12 6-2 16M48 52l-1 16 1 16M48 28l9 9 4-3M48 28l-7 10 2 6", "M48 20l0 32M48 52l-1 16 1 16M48 52l12 6-2 16M48 28l-7 10 2 6M48 28l9 9 4-3"], ritmo: "rapido" },
  sentado: { fondo: suelo() + sillaLat(8) + '<path class="mov" d="M75 69v14"/>', cab: [[32, 24], [56, 35]], fig: ["M28 56l3-25M28 56l14 1 1 27M28 56l22 13 22 13 3-7M31 35l10 6 10 2", "M28 56l22-16M28 56l14 1 1 27M28 56l22 13 22 13 3-7M49 43l11 14 10 13"], ritmo: "aguanta" },
  espalda: { fondo: suelo(), cab: [[48, 15], [48, 15]], fig: ["M48 22l0 30M48 52l-6 32M48 52l6 32M41 26l14 0M55 26l3-14-8 18M41 26l-4 18 9-4", "M48 22l0 30M48 52l-6 32M48 52l6 32M41 26l14 0M55 26l3-14-7 22M41 26l-4 18 10-7"], extras: [{ el: '<path class="mov" stroke-dasharray="2 2"', a: { d: ["M50 30L46 40", "M51 34L47 37"] } }, { el: '<circle class="sft-mano" r="2.8"', a: { cx: [50, 51], cy: [30, 34] } }, { el: '<circle class="sft-mano" r="2.8"', a: { cx: [46, 47], cy: [40, 37] } }], encima: true, ritmo: "aguanta" },
  levantarse: { ruta: true },
  andar6: { ruta: true },
};
const etiqueta = (el) => el.match(/^<(\w+)/)[1];
const extrasEn = (e, i) => (e.extras || []).map((x) => `${x.el} ${Object.entries(x.a).map(([k, v]) => `${k}="${v[i]}"`).join(" ")}/>`).join("");
/** Dibujo de una prueba en una postura (0 = partida, 1 = llegada). */
export function postura(id, i = 0) {
  const e = ESC[id]; if (!e || e.ruta) return recorrido(id, false);
  const [x, y] = e.cab[i], fig = `<circle class="fig" cx="${x}" cy="${y}" r="6"/><path class="fig" d="${e.fig[i]}"/>`;
  return SVG(e.fondo + (e.encima ? fig + extrasEn(e, i) : extrasEn(e, i) + fig));
}
/** Esquemas con recorrido: levantarse y rodear la marca a 2,44 m, y dar vueltas al rectángulo de 6 minutos. */
function recorrido(id, moverse) {
  const punto = (cx, cy, ruta, dur, rep) => `<circle class="sft-punto" cx="${cx}" cy="${cy}" r="3.2">${moverse ? `<animateMotion path="${ruta}" dur="${dur}s" repeatCount="${rep}" begin="indefinite" fill="freeze" calcMode="paced"/>` : ""}</circle>`;
  if (id === "levantarse") {
    return SVG(suelo(4, 92) + prop("M6 44v40M6 62h16v22") + prop("M75 84L80 70L85 84") + prop("M22 90H80M22 88v4M80 88v4")
      + '<circle class="fig" cx="15" cy="36" r="5"/><path class="fig" d="M14 42l-2 19M12 61l12 0 1 23M14 46l6 9"/>'
      + '<path class="sft-ruta" d="M28 74C44 64 66 64 76 68C84 72 84 80 76 81C64 82 42 81 28 76"/>'
      + `<text x="51" y="95.5" text-anchor="middle">2,44 m</text>` + punto(28, 74, "M0 0C16-10 38-10 48-6C56-2 56 6 48 7C36 8 14 7 0 2", 3.6, 3), moverse ? "sft-svg anim" : "sft-svg");
  }
  const marcas = [12, 30, 48, 66, 84].map((x) => `<circle class="sft-cono" cx="${x}" cy="34" r="1.8"/><circle class="sft-cono" cx="${x}" cy="54" r="1.8"/>`).join("");
  return SVG('<rect class="prop" x="12" y="34" width="72" height="20" rx="3"/>' + marcas + '<path class="sft-ruta" d="M12 28h20M28 25l4 3-4 3"/>'
    + `<text x="48" y="47" text-anchor="middle">6 min</text><text x="48" y="68" text-anchor="middle">45,7 m</text>` + punto(12, 34, "M0 0h72v20h-72z", 4.8, 2), moverse ? "sft-svg anim" : "sft-svg");
}
/** Dibujo animado (espera a `mover`) o, con «reducir movimiento», las dos posturas quietas una junto a otra. */
export function escena(id, { quieto = false } = {}) {
  const e = ESC[id]; if (!e) return "";
  if (e.ruta) return recorrido(id, !quieto);
  if (quieto) return `<div class="sft-dos"><figure>${postura(id, 0)}<figcaption>${t("ej.inicio")}</figcaption></figure><figure>${postura(id, 1)}<figcaption>${t("ej.final")}</figcaption></figure></div>`;
  const r = RITMOS[e.ritmo], [a, b] = e.cab;
  const extras = (e.extras || []).map((x) => `${x.el} ${Object.entries(x.a).map(([k, v]) => `${k}="${v[0]}"`).join(" ")}>${Object.entries(x.a).map(([k, v]) => anim(k, secuencia(r, v[0], v[1]), r)).join("")}</${etiqueta(x.el)}>`).join("");
  const fig = `<circle class="fig" cx="${a[0]}" cy="${a[1]}" r="6">${anim("cx", secuencia(r, a[0], b[0]), r)}${anim("cy", secuencia(r, a[1], b[1]), r)}</circle><path class="fig" d="${e.fig[0]}">${anim("d", secuencia(r, e.fig[0], e.fig[1]), r)}</path>`;
  return SVG(e.fondo + (e.encima ? fig + extras : extras + fig), "sft-svg anim");
}
/** Arranca todas las animaciones de un dibujo a la vez. */
export function mover(svg) { if (!svg || quieto()) return; svg.querySelectorAll("animate, animateMotion").forEach((a) => { try { a.beginElement(); } catch {} }); }
const quieto = () => matchMedia("(prefers-reduced-motion: reduce)").matches || !!navigator.webdriver || document.documentElement.classList.contains("pa-quieto");
const ic = (d) => `<svg class="sft-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
export const ICONOS = {
  silla: "M6 3v18M6 12h9v9M18 15V5M15 8l3-3 3 3",
  brazo: "M3.5 9v6M6.5 7v10M17.5 7v10M20.5 9v6M6.5 12h11",
  paso2: "M3 12h4l2-5 4 10 2-5h6",
  sentado: "M3 12h12M11 8l4 4-4 4M20 5v14",
  espalda: "M8 3c4 0 6 3 6 7M16 21c-4 0-6-3-6-7M12 10.5v3",
  levantarse: "M3 18c1-7 9-9 12-4M15 14l.3-3.3M15 14l-3.2-.9M16 21l3-8 3 8",
  andar6: "M4 7h16v10H4zM8 4v3M8 17v3",
};

/* ---------- la batería ---------- */
let dlg = null, ctx = {}, run = null, reloj = null, wake = null, V = null;
const cu = () => dlg.querySelector("#sft-cuerpo");
const q = (s) => cu().querySelector(s);
const qa = (s) => cu().querySelectorAll(s);
const idsDe = (aer) => ORDEN.filter((id) => id !== (aer === "andar6" ? "paso2" : "andar6"));
const leerNum = (el) => { const v = parseFloat(String(el?.value ?? "").replace(",", ".")); return Number.isFinite(v) ? v : null; };
const vibrar = (p) => { try { ctx.vibrar ? ctx.vibrar(p) : navigator.vibrate?.(p); } catch {} };
const VOZ_LANG = { es: "es-ES", en: "en-GB", ca: "ca-ES", gl: "gl-ES", eu: "eu-ES" };
/** Frase de voz en el idioma elegido; sin voz instalada para ese idioma, en español (como el entrenador de la sesión). */
function decir(k) {
  if (!V?.on) return;
  const l = idioma(), lang = VOZ_LANG[l] || "es-ES";
  if (l !== "es") { const v = V.voz(lang); if (v.conocida && !v.voz) return V.decir([{ t: TXT.es[k], lang: "es-ES" }], { corta: true }); }
  V.decir([{ t: tx(k), lang }], { corta: true });
}
const pitar = (f, ms) => { if (V?.on) V.pitar(f, ms); };
async function pantallaEncendida() { try { wake = await navigator.wakeLock?.request("screen"); } catch { wake = null; } }
function liberarPantalla() { try { wake?.release?.(); } catch {} wake = null; }
function pararReloj() { if (reloj) { clearInterval(reloj.int); reloj = null; } liberarPantalla(); }
/** Cuenta atrás (dur en s; Infinity = cronómetro). Los avisos se dicen al pasar su segundo (si el reloj salta más de 5 s, se omiten). */
function arrancarReloj(dur, { alTick, alAcabar, avisos = [] }) {
  pararReloj();
  reloj = { inicio: Date.now(), dur, int: 0, hechos: new Set() };
  const yo = reloj;
  const tick = () => {
    if (reloj !== yo) return;
    const s = (Date.now() - yo.inicio) / 1000;
    for (const a of avisos) if (s >= a.s && !yo.hechos.has(a.s)) { yo.hechos.add(a.s); if (s - a.s < 5) decir(a.k); }
    alTick(Math.min(s, dur));
    if (s >= dur) { pararReloj(); alAcabar?.(); }
  };
  yo.int = setInterval(tick, 100); tick();
}
if (typeof navigator !== "undefined" && navigator.webdriver && typeof window !== "undefined") window.__paSft = { adelantar: (s) => { if (reloj) reloj.inicio -= s * 1000; } };
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const anillo = (p) => `<svg class="sft-anillo" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="fondo" cx="60" cy="60" r="52"/><circle class="valor" cx="60" cy="60" r="52" stroke-dasharray="${(p * 326.7).toFixed(1)} 326.7"/></svg>`;

function cuidadosHtml(lista, max = 2) {
  const ms = (lista || []).filter((m) => (ctx.presentes || []).includes(m)).slice(0, max);
  return ms.length ? `<h3>${t("ej.cuidado")}</h3><ul class="hoy-cuidados">${ms.map((m) => `<li><span>${t("cuid." + m)}</span><button type="button" class="pq-mini" data-porque="${m}" aria-label="${t("pq.titulo")} ${t("pq.b." + m)}">${t("pq.titulo")}</button></li>`).join("")}</ul>` : "";
}
const avisoBaremo = () => {
  if (run.edad != null && run.edad < 60) return tx("menor60");
  if (!sx(run.sexo)) return tx("sinsexo");
  if (run.edad != null && run.edad > 94) return tx("mayor94");
  return "";
};
function serie(id) { return (ctx.sft?.hist || []).filter((h) => h.r?.[id] != null).map((h) => ({ f: h.f, v: h.r[id], edad: h.edad, sexo: h.sexo })); }
function spark(id, s) {
  if (s.length < 2) return "";
  const vs = s.map((p) => p.v), mn = Math.min(...vs), mx = Math.max(...vs), d = mx - mn || 1, menos = id === "levantarse";
  const pts = s.map((p, k) => [4 + (k * 72) / (s.length - 1), menos ? 4 + ((p.v - mn) / d) * 16 : 20 - ((p.v - mn) / d) * 16].map((x) => x.toFixed(1)));
  const u = pts[pts.length - 1];
  return `<svg class="sft-spark" viewBox="0 0 80 24" aria-hidden="true" focusable="false"><polyline points="${pts.map((p) => p.join(",")).join(" ")}"/><circle cx="${u[0]}" cy="${u[1]}" r="2.6"/></svg>`;
}
function evolucionHtml() {
  const ids = ORDEN.filter((id) => serie(id).length);
  if (!ids.length) return "";
  return `<section class="sft-evo"><h3>${tx("evolucion")}</h3><div class="sft-evo-grid">${ids.map((id) => {
    const s = serie(id), u = s[s.length - 1], c = clasificar(id, u.v, u.edad, u.sexo);
    return `<div class="sft-evo-c"><span class="sft-evo-ic">${ic(ICONOS[id])}</span><span><b>${PRUEBAS[id].corto}</b><small>${fmt(id, u.v)}${c?.nivel ? ` · ${tx(c.nivel)}` : ""}</small></span>${spark(id, s)}</div>`;
  }).join("")}</div></section>`;
}

function inicio() {
  pararReloj();
  const hist = ctx.sft?.hist || [], ult = hist[hist.length - 1], ids = idsDe(run.aer);
  const toca = ult ? Date.now() - ult.f >= REPETIR_DIAS * 864e5 : false;
  const mats = [...new Set(ids.flatMap((id) => PRUEBAS[id].mat))];
  const aviso = avisoBaremo();
  cu().innerHTML = `
    <div class="sft-hero"><span class="sft-hero-ic" aria-hidden="true">${ic(ICONOS.paso2)}</span><div><h2 class="sft-tit" tabindex="-1">${tx("titulo")}</h2><p class="sft-sub">${tx("sub")}</p></div></div>
    <p class="sft-intro">${tx("intro")}</p>
    ${ult ? `<p class="sft-prox${toca ? " toca" : ""}">${toca ? tx("toca") : tx("desde", { d: fecha(ult.f + REPETIR_DIAS * 864e5) })} · ${tx("ultima", { d: fecha(ult.f) })}</p>` : ""}
    ${evolucionHtml()}
    <div class="sft-form">
      <fieldset class="sft-seg"><legend>${tx("sexo")}</legend><div class="sft-seg-op">${[["m", "mujer"], ["h", "hombre"], ["", "nodecir"]].map(([v, k]) => `<label><input type="radio" name="sft-sexo" value="${v}"${(run.sexo || "") === v ? " checked" : ""}><span>${tx(k)}</span></label>`).join("")}</div></fieldset>
      <label class="sft-edad"><span>${tx("edad")}</span><input type="number" id="sft-edad" min="40" max="110" step="1" inputmode="numeric" value="${run.edad ?? ""}"></label>
      <fieldset class="sft-seg"><legend>${tx("aer")}</legend><div class="sft-seg-op">${["paso2", "andar6"].map((v) => `<label><input type="radio" name="sft-aer" value="${v}"${run.aer === v ? " checked" : ""}><span>${tx(v)}</span></label>`).join("")}</div></fieldset>
    </div>
    ${aviso ? `<p class="sft-aviso">${aviso}</p>` : ""}
    <ol class="sft-mapa">${ids.map((id, k) => `<li><span class="sft-mapa-n">${k + 1}</span><span class="sft-mapa-ic">${ic(ICONOS[id])}</span><span><b>${PRUEBAS[id].nombre}</b><small>${PRUEBAS[id].mide}</small></span></li>`).join("")}</ol>
    <h3>${tx("necesita")}</h3>
    <ul class="sft-nec">${mats.map((m) => `<li>${MATERIAL[m]}</li>`).join("")}</ul>
    ${cuidadosHtml([...new Set(ids.flatMap((id) => PRUEBAS[id].cuida))], 3)}
    <div class="sft-seguridad">
      <p><b>${tx("seguridad")}</b></p>
      <p>${tx("segx")}</p>
      <ul>${[1, 2, 3, 4].map((k) => `<li>${tx("seg" + k)}</li>`).join("")}</ul>
      ${ctx.ic ? `<p class="sft-alerta">${tx("segic")}</p>` : ""}${ctx.consultar ? `<p class="sft-alerta">${tx("crib")}</p>` : ""}${ctx.fragil ? `<p class="sft-alerta suave">${tx("fragil")}</p>` : ""}
      <label class="check sft-ok"><input type="checkbox" id="sft-ok"${run.ok ? " checked" : ""}> <span>${tx("segok")}</span></label>
    </div>
    <div class="sft-acciones"><button type="button" class="btn" id="sft-empezar"${run.ok ? "" : " disabled"}>${tx("empezar")}</button></div>
    <p class="sft-nota">${tx("nota")}</p>`;
  qa('input[name="sft-sexo"]').forEach((r) => r.addEventListener("change", () => { run.sexo = r.value || null; inicio(); q(`input[name="sft-sexo"][value="${r.value}"]`)?.focus(); }));
  qa('input[name="sft-aer"]').forEach((r) => r.addEventListener("change", () => { run.aer = r.value; inicio(); q(`input[name="sft-aer"][value="${r.value}"]`)?.focus(); }));
  q("#sft-edad").addEventListener("change", (ev) => { const v = leerNum(ev.target); run.edad = v != null && v >= 18 && v <= 120 ? Math.round(v) : null; inicio(); q("#sft-edad").focus(); });
  q("#sft-ok").addEventListener("change", (ev) => { run.ok = ev.target.checked; q("#sft-empezar").disabled = !run.ok; });
  q("#sft-empezar").addEventListener("click", () => { run.r = {}; prueba(0); });
}

function medidaHtml(id) {
  const P = PRUEBAS[id], v = run.r[id];
  const voz = V?.disponible?.() ? `<label class="sft-voz"><input type="checkbox" data-voz${run.voz ? " checked" : ""}> <span>${tx("voz")}</span></label>` : "";
  const ini = `<button type="button" class="btn" data-ini>${t("sesion.iniciar")}</button>`;
  const contador = (n, ud) => `<div class="sft-contador"><output class="sft-n" aria-live="polite">${n}</output><small>${tx(ud)}</small><div class="sft-botones"><button type="button" class="sft-menos" data-menos aria-label="${tx("menos1")}">−1</button><button type="button" class="sft-mas" data-mas aria-label="${tx("mas1")}">+1</button></div></div>`;
  if (P.tipo === "cuenta") return `<div class="sft-reloj"><div class="sft-anillo-w">${anillo(0)}<output class="sft-t">${mmss(P.tiempo)}</output></div>${contador(v ?? 0, P.ud)}</div>
    <div class="sft-fila">${ini}${voz}</div>
    <label class="sft-valor"><span>${tx("resultado")}</span><input type="number" data-valor min="0" max="${P.max}" step="1" inputmode="numeric" value="${v ?? ""}"><span>${tx(P.ud)}</span></label>`;
  if (P.tipo === "vueltas") return `<div class="sft-reloj"><div class="sft-anillo-w">${anillo(0)}<output class="sft-t">${mmss(P.tiempo)}</output></div>${contador(0, "vueltas")}</div>
    <div class="sft-fila">${ini}${voz}</div>
    <div class="sft-vueltas"><label><span>${tx("vuelta_m")}</span><input type="number" data-mv min="5" max="1000" step="0.1" inputmode="decimal" value="45.7"><span>m</span></label><label><span>${tx("vueltas")}</span><input type="number" data-vu min="0" max="200" step="1" inputmode="numeric" value=""></label><label><span>${tx("extra_m")}</span><input type="number" data-ex min="0" max="1000" step="1" inputmode="numeric" value="${v != null ? v : ""}"><span>m</span></label></div>
    <p class="sft-mejor">${tx("total")}: <b data-total>${v != null ? fmt(id, v) : "—"}</b></p>`;
  if (P.tipo === "crono") return `<div class="sft-reloj sft-crono"><output class="sft-t">${num(0, 1)} s</output></div>
    <div class="sft-fila">${ini}${voz}</div>
    <div class="sft-intentos">${[0, 1].map((k) => `<label><span>${tx("intento", { n: k + 1 })}</span><input type="number" data-int="${k}" min="1" max="60" step="0.1" inputmode="decimal" value="${k === 0 && v != null ? v : ""}"><span>s</span></label>`).join("")}</div>
    <p class="sft-mejor">${tx("mejor")}: <b data-mejor>${v != null ? fmt(id, v) : "—"}</b></p>`;
  return `<div class="sft-intentos sft-flex">${[0, 1].map((k) => { const s0 = k === 0 && v != null ? Math.sign(v) : -1; return `<fieldset><legend>${tx("intento", { n: k + 1 })}</legend>
      <div class="sft-seg-op sft-signo">${[["-1", "falta_cm"], ["0", "justo"], ["1", "paso_cm"]].map(([s, key]) => `<label><input type="radio" name="sft-s${k}" value="${s}"${String(s0) === s ? " checked" : ""}><span>${tx(key)}</span></label>`).join("")}</div>
      <label class="sft-cm"><input type="number" data-cm="${k}" min="0" max="60" step="0.5" inputmode="decimal" value="${k === 0 && v ? Math.abs(v) : ""}"${s0 === 0 ? " disabled" : ""} aria-label="${tx("intento", { n: k + 1 })} (cm)"><span>cm</span></label></fieldset>`; }).join("")}</div>
    <p class="sft-mejor">${tx("mejor")}: <b data-mejor>${v != null ? fmt(id, v) : "—"}</b></p>`;
}
/** Lee el resultado de la pantalla de una prueba (null si falta). */
function leerValor(id) {
  const P = PRUEBAS[id];
  if (P.tipo === "cuenta") { const v = leerNum(q("[data-valor]")); return v != null && v >= 0 && v <= P.max ? Math.round(v) : null; }
  if (P.tipo === "crono") return mejorDe(id, [...qa("[data-int]")].map(leerNum).filter((x) => x != null && x > 0 && x <= 60));
  if (P.tipo === "flex") return mejorDe(id, [0, 1].map((k) => { const s = Number(q(`input[name="sft-s${k}"]:checked`)?.value ?? -1); if (s === 0) return 0; const cm = leerNum(q(`[data-cm="${k}"]`)); return cm != null && cm >= 0 && cm <= 60 ? s * cm : null; }).filter((x) => x != null));
  const mv = leerNum(q("[data-mv]")), vu = leerNum(q("[data-vu]")), ex = leerNum(q("[data-ex]")) ?? 0;
  return mv > 0 && vu != null && vu >= 0 ? distancia(Math.round(vu), mv, Math.max(0, ex)) : (vu == null && ex > 0 ? Math.round(ex) : null);
}
function enlazarMedida(id) {
  const P = PRUEBAS[id], rel = q(".sft-reloj"), out = q(".sft-t"), ini = q("[data-ini]");
  const voz = q("[data-voz]");
  voz?.addEventListener("change", () => { run.voz = voz.checked; V?.guardar?.(voz.checked); });
  const n = { v: P.tipo === "cuenta" ? Number(run.r[id] ?? 0) : 0 };
  const destino = P.tipo === "cuenta" ? q("[data-valor]") : q("[data-vu]");
  const pintarN = () => { const o = q(".sft-n"); if (o) o.textContent = n.v; if (destino) destino.value = n.v; if (P.tipo === "vueltas") total(); };
  const total = () => { const v = leerValor(id); q("[data-total]").textContent = v != null ? fmt(id, v) : "—"; };
  const mejor = () => { const v = leerValor(id), b = q("[data-mejor]"); if (b) b.textContent = v != null ? fmt(id, v) : "—"; };
  q("[data-mas]")?.addEventListener("click", () => { n.v++; pintarN(); vibrar(12); });
  q("[data-menos]")?.addEventListener("click", () => { n.v = Math.max(0, n.v - 1); pintarN(); });
  destino?.addEventListener("input", () => { const v = leerNum(destino); n.v = v != null && v >= 0 ? Math.round(v) : 0; const o = q(".sft-n"); if (o) o.textContent = n.v; if (P.tipo === "vueltas") total(); });
  qa("[data-mv], [data-ex]").forEach((el) => el.addEventListener("input", total));
  qa("[data-int], [data-cm]").forEach((el) => el.addEventListener("input", mejor));
  qa('.sft-signo input').forEach((r) => r.addEventListener("change", () => { const k = r.name.slice(-1), cm = q(`[data-cm="${k}"]`); cm.disabled = r.value === "0"; if (r.value === "0") cm.value = ""; else cm.focus(); mejor(); }));
  if (!ini) return;
  const preparar = () => { if (V) { V.on = !!run.voz; V.preparar(); } };
  if (P.tipo === "crono") {
    ini.addEventListener("click", () => {
      if (reloj) { const s = Math.round(((Date.now() - reloj.inicio) / 1000) * 10) / 10; pararReloj(); out.textContent = `${num(s, 1)} s`; ini.textContent = t("sesion.iniciar"); rel.classList.remove("corre"); pitar(440, 200); vibrar([20, 60, 20]);
        const ins = [...qa("[data-int]")], hueco = ins.find((x) => !x.value) || ins[ins.length - 1]; hueco.value = s; mejor(); return; }
      preparar(); decir("v_ya"); pitar(880, 150); vibrar(15);
      rel.classList.add("corre"); ini.textContent = t("sppb.parar");
      arrancarReloj(600, { alTick: (s) => { out.textContent = `${num(s, 1)} s`; } });
    });
    return;
  }
  const avisos = P.tiempo === 120 ? [{ s: 60, k: "v_mitad" }, { s: 90, k: "v_q30" }] : P.tiempo === 360 ? [{ s: 180, k: "v_mitad" }, { s: 240, k: "v_q2" }, { s: 300, k: "v_q1" }] : [];
  ini.addEventListener("click", () => {
    if (reloj) { pararReloj(); rel.classList.remove("corre"); ini.textContent = t("sesion.iniciar"); return; }
    preparar(); n.v = 0; pintarN(); decir("v_ya"); pitar(880, 150); vibrar(15);
    rel.classList.add("corre"); rel.classList.remove("acabado"); ini.textContent = t("sppb.parar");
    if (P.tiempo >= 120) pantallaEncendida();
    const c = q(".sft-anillo .valor");
    arrancarReloj(P.tiempo, {
      avisos,
      alTick: (s) => { out.textContent = mmss(Math.ceil(P.tiempo - s)); c.setAttribute("stroke-dasharray", `${((s / P.tiempo) * 326.7).toFixed(1)} 326.7`); },
      alAcabar: () => { rel.classList.remove("corre"); rel.classList.add("acabado"); ini.textContent = t("sesion.iniciar"); decir(P.tipo === "vueltas" ? "v_pare" : "v_tiempo"); pitar(440, 500); vibrar([30, 80, 30]); (P.tipo === "vueltas" ? q("[data-ex]") : q("[data-valor]"))?.focus({ preventScroll: true }); },
    });
  });
}

function prueba(i) {
  pararReloj();
  const ids = idsDe(run.aer);
  if (i < 0) return inicio();
  if (i >= ids.length) return resultados();
  run.i = i;
  const id = ids[i], P = PRUEBAS[id], qto = quieto();
  const nota = [P.nota, id === "sentado" && ctx.osteoporosis ? tx("osteo") : ""].filter(Boolean).join(" ");
  cu().innerHTML = `
    <div class="sft-cab"><small>${tx("prueba", { n: i + 1, t: ids.length })} · ${P.mide}</small><span class="sft-puntos" aria-hidden="true">${ids.map((_, k) => `<i class="${k < i ? "hecha" : k === i ? "ahora" : ""}"></i>`).join("")}</span></div>
    <h2 class="sft-tit" tabindex="-1">${P.nombre}</h2>
    <div class="sft-escena" aria-hidden="true">${escena(id, { quieto: qto })}</div>
    ${qto ? "" : `<div class="sft-ctrl"><button type="button" class="btn-sec sm" data-otra>${t("ej.repetir")}</button></div>`}
    <h3>${t("ej.como")}</h3>
    <ol class="sft-como">${P.pasos.map((p) => `<li>${p}</li>`).join("")}</ol>
    ${nota ? `<p class="sft-aviso${id === "sentado" && ctx.osteoporosis ? " fuerte" : ""}">${nota}</p>` : ""}
    ${cuidadosHtml(P.cuida)}
    <div class="sft-medida" data-prueba="${id}">${medidaHtml(id)}</div>
    <p class="sft-falta" role="alert" hidden>${tx("falta")}</p>
    <div class="sft-nav"><button type="button" class="btn-sec sm" data-atras>${tx("atras")}</button><button type="button" class="btn-sec sm" data-saltar>${tx("saltar")}</button><button type="button" class="btn" data-sig>${i === ids.length - 1 ? tx("ver") : t("apr.siguiente")}</button></div>`;
  enlazarMedida(id);
  const svg = q(".sft-escena svg.anim");
  q("[data-otra]")?.addEventListener("click", () => mover(svg));
  q("[data-atras]").addEventListener("click", () => prueba(i - 1));
  q("[data-saltar]").addEventListener("click", () => { delete run.r[id]; prueba(i + 1); });
  q("[data-sig]").addEventListener("click", () => {
    const v = leerValor(id);
    if (v == null) { q(".sft-falta").hidden = false; q(".sft-medida input[type=number]:not([disabled])")?.focus(); return; }
    run.r[id] = v; prueba(i + 1);
  });
  cu().scrollTop = 0;
  q(".sft-tit").focus({ preventScroll: true });
  requestAnimationFrame(() => mover(svg));
}

function escala(id, valor, c) {
  const [a, b] = ESCALA[id], X = (v) => 12 + 276 * Math.max(0, Math.min(1, (v - a) / (b - a)));
  const p = [`<rect class="sft-e-pista" x="12" y="25" width="276" height="6" rx="3"/>`];
  const u = umbral(id);
  if (u != null) { const x1 = X(a), x2 = X(u); p.push(`<rect class="sft-e-riesgo" x="${Math.min(x1, x2).toFixed(1)}" y="21" width="${Math.abs(x2 - x1).toFixed(1)}" height="14" rx="3"/>`); }
  if (c?.rango) { const x1 = X(c.rango[0]), x2 = X(c.rango[1]); p.push(`<rect class="sft-e-normal" x="${Math.min(x1, x2).toFixed(1)}" y="20" width="${Math.max(4, Math.abs(x2 - x1)).toFixed(1)}" height="16" rx="8"/>`); }
  if (c?.meta != null) { const x = X(c.meta).toFixed(1); p.push(`<path class="sft-e-meta" d="M${x} 14v28"/><text class="sft-e-tm" x="${x}" y="10">${tx("meta_c")}</text>`); }
  const xv = X(valor);
  p.push(`<g class="sft-e-mov" style="--d:${(xv - 12).toFixed(1)}px"><circle class="sft-e-punto" cx="${xv.toFixed(1)}" cy="28" r="7"/></g>`);
  p.push(`<text class="sft-e-eje" x="12" y="52">${fmtCorto(id, a)}</text><text class="sft-e-eje" x="288" y="52" text-anchor="end">${fmtCorto(id, b)}</text>`);
  const aria = [fmt(id, valor), c?.rango ? tx("habitual", { r: rangoTxt(id, c.rango) }) : "", c?.riesgo ? tx("riesgo") : ""].filter(Boolean).join(". ");
  return `<svg class="sft-escala" viewBox="0 0 300 56" role="img" aria-label="${aria}">${p.join("")}</svg>`;
}
/** Extremos de la escala dibujada (izquierda = peor, derecha = mejor; en segundos va al revés). */
const ESCALA = { silla: [0, 30], brazo: [0, 35], paso2: [0, 160], sentado: [-25, 20], espalda: [-35, 15], levantarse: [14, 2], andar6: [0, 800] };
const MEJOR_SUBE = (id) => id !== "levantarse";

function textoCopia() {
  const sexoTxt = run.sexo ? tx(run.sexo === "m" ? "mujer" : "hombre").toLowerCase() : "";
  const L = [`${tx("titulo")} (Senior Fitness Test) · ${fechaLarga(Date.now())}${run.edad ? ` · ${run.edad} ${t("perf.anos")}` : ""}${sexoTxt ? ` · ${sexoTxt}` : ""}`];
  for (const id of ORDEN) if (run.r[id] != null) {
    const c = clasificar(id, run.r[id], run.edad, run.sexo);
    L.push(`- ${PRUEBAS[id].nombre}: ${fmt(id, run.r[id])}${c?.nivel ? ` (${tx(c.nivel).toLowerCase()}; ${tx("habitual", { r: rangoTxt(id, c.rango) }).toLowerCase()})` : ""}${c?.riesgo ? ` · ${tx("riesgo").toLowerCase()}` : ""}`);
  }
  L.push(tx("pie"));
  return L.join("\n");
}
function resultados() {
  pararReloj();
  const R = resumen(run.r, run.edad, run.sexo), prev = (ctx.sft?.hist || [])[(ctx.sft?.hist || []).length - 1];
  const aviso = avisoBaremo();
  const ejs = [...new Set(R.mejorar.flatMap((id) => PRUEBAS[id].ej))].slice(0, 4);
  const filas = R.filas.map((f, k) => {
    const P = PRUEBAS[f.id], c = f.c, a = prev?.r?.[f.id];
    let antes = "";
    if (a != null) { const d = f.valor - a, mejor = MEJOR_SUBE(f.id) ? d > 0 : d < 0; antes = `<p class="sft-antes">${tx("antes", { d: fecha(prev.f), v: fmt(f.id, a) })}${d ? ` <span class="${mejor ? "d-mejor" : "d-peor"}">${mejor ? "▲" : "▼"} ${fmtCorto(f.id, Math.abs(Math.round(d * 10) / 10)).replace(/^\+/, "")}</span>` : " ="}</p>`; }
    return `<li style="--k:${k}"><div class="sft-res-cab"><span class="sft-res-ic">${ic(ICONOS[f.id])}</span><span><b>${P.corto}</b><small>${P.nombre}</small></span><span class="sft-chip n-${c?.nivel || "no"}">${c?.nivel ? tx(c.nivel) : tx("sinbaremo")}</span></div>
      <div class="sft-res-val">${fmtHtml(f.id, f.valor)}${c?.rango ? `<small>${tx("habitual", { r: rangoTxt(f.id, c.rango) })}</small>` : ""}${c?.meta != null ? `<small class="sft-meta-t${c.metaOk ? " ok-meta" : ""}">${tx("meta", { n: c.meta })}</small>` : ""}</div>
      ${escala(f.id, f.valor, c)}
      ${c?.riesgo ? `<p class="sft-riesgo">${tx("riesgo")}</p>` : ""}${antes}</li>`;
  }).join("");
  cu().innerHTML = `
    <h2 class="sft-tit" tabindex="-1">${tx("res")}</h2>
    <p class="sft-sub">${fechaLarga(Date.now())}${run.edad ? ` · ${run.edad} ${t("perf.anos")}` : ""}${run.sexo ? ` · ${tx(run.sexo === "m" ? "mujer" : "hombre")}` : ""}</p>
    ${aviso ? `<p class="sft-aviso">${aviso}</p>` : ""}
    ${R.total ? `<div class="sft-res-top"><span class="sft-res-n">${R.habituales}/${R.total}</span><span><b>${tx("resn")}</b>${R.riesgo.length ? `<small class="sft-res-r">${tx("resriesgo", { n: R.riesgo.length })}</small>` : ""}</span></div>` : ""}
    <ul class="sft-res">${filas}</ul>
    ${R.total ? `<div class="sft-claves">
      ${R.fuertes.length ? `<div class="sft-clave bien"><b>${tx("fuertes")}</b><p>${R.fuertes.map((id) => PRUEBAS[id].corto).join(" · ")}</p></div>` : ""}
      ${R.mejorar.length ? `<div class="sft-clave mejora"><b>${tx("mejorar")}</b><p>${R.mejorar.map((id) => PRUEBAS[id].corto).join(" · ")}</p><p class="sft-ej-t">${tx("ejercicios")}</p><div class="sft-ej">${ejs.map((e) => `<button type="button" class="chip chip-btn" data-ejercicio="${e}">${e}</button>`).join("")}</div></div>` : `<div class="sft-clave bien"><p>${tx("todobien")}</p></div>`}
    </div>` : ""}
    ${prev ? `<p class="sft-nota">${tx("cambios")}</p>` : ""}
    <div class="sft-acciones"><button type="button" class="btn" data-guardar${R.filas.length ? "" : " disabled"}>${tx("guardar")}</button><button type="button" class="btn-sec sm" data-copiar${R.filas.length ? "" : " disabled"}>${tx("copiar")}</button><button type="button" class="btn-sec sm" data-otra-vez>${tx("otra")}</button></div>
    <p class="pq-fuentes">${tx("fuentes")}:</p>
    <ul class="sft-fuentes">${FUENTES.map((f) => `<li>${f.txt}${f.doi ? ` · <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : ""}</li>`).join("")}</ul>
    <p class="sft-nota">${tx("nota")}</p>`;
  q("[data-guardar]").addEventListener("click", (ev) => {
    const entrada = { f: Date.now(), edad: run.edad, sexo: sx(run.sexo), r: { ...run.r } };
    const sft = { sexo: sx(run.sexo), aer: run.aer, hist: [...(ctx.sft?.hist || []), entrada].slice(-20) };
    ctx.sft = sft; ctx.guardar?.(sft);
    ev.currentTarget.disabled = true; ev.currentTarget.textContent = tx("guardado_b");
    ctx.toast?.(tx("guardado", { d: fecha(entrada.f + REPETIR_DIAS * 864e5) }), { ms: 6000 });
    vibrar([20, 60, 20]);
    document.dispatchEvent(new CustomEvent("pruebas", { detail: entrada }));
  });
  q("[data-copiar]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(textoCopia()); ctx.toast?.(tx("copiado"), { ms: 3000 }); } catch { ctx.toast?.(textoCopia().split("\n")[0], { ms: 3000 }); } });
  q("[data-otra-vez]").addEventListener("click", () => { run = nuevoRun(); inicio(); });
  cu().scrollTop = 0;
  q(".sft-tit").focus({ preventScroll: true });
}

const CSS = `
.sft-dlg h2 { margin: 0 0 6px; font-size: 1.25rem; }
.sft-dlg .sft-tit { outline: none; }
.sft-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.sft-hero { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: center; margin: 0 0 10px; padding: 14px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--accent-soft), var(--surface-2)); border: 1px solid var(--line); }
.sft-dlg .sft-hero h2 { margin: 0; }
.sft-hero-ic { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: var(--accent); color: var(--accent-fg); box-shadow: 0 8px 22px -10px var(--accent); }
.sft-hero-ic .sft-i { width: 30px; height: 30px; }
.sft-sub { color: var(--muted); font-size: .86rem; }
.sft-intro { margin: 0 0 10px; font-size: .95rem; }
.sft-prox { display: inline-block; margin: 0 0 6px; padding: 5px 12px; border-radius: 999px; background: var(--info-soft); color: var(--info-ink); font-size: .84rem; font-weight: 700; }
.sft-prox.toca { background: var(--precaucion-soft); color: var(--precaucion-ink); }
.sft-evo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.sft-evo-c { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 4px 8px; align-items: center; padding: 10px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); }
.sft-evo-c b { display: block; font-size: .88rem; line-height: 1.2; }
.sft-evo-c small { font-size: .76rem; }
.sft-evo-ic, .sft-mapa-ic, .sft-res-ic { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: var(--accent-soft); color: var(--accent-deep); }
.sft-i { width: 20px; height: 20px; }
.sft-spark { grid-column: 1 / -1; width: 100%; height: 24px; }
.sft-spark polyline { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.sft-spark circle { fill: var(--accent-deep); }
.sft-form { display: grid; gap: 12px; margin: 14px 0 10px; }
.sft-seg { border: 0; margin: 0; padding: 0; min-width: 0; }
.sft-seg legend { padding: 0; margin-bottom: 6px; font-weight: 700; font-size: .9rem; }
.sft-seg-op { display: flex; flex-wrap: wrap; gap: 6px; }
.sft-seg-op label { position: relative; display: inline-flex; }
.sft-seg-op input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.sft-seg-op span { display: inline-flex; align-items: center; min-height: 40px; padding: 6px 14px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); font-size: .9rem; line-height: 1.25; }
.sft-seg-op input:checked + span { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-deep); font-weight: 700; }
.sft-seg-op input:focus-visible + span { outline: 3px solid var(--accent); outline-offset: 2px; }
.sft-seg-op input:disabled + span { opacity: .5; }
.sft-edad { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: .9rem; }
.sft-edad input { width: 6em; }
.sft-mapa { list-style: none; margin: 14px 0; padding: 0; display: grid; gap: 6px; }
.sft-mapa li { display: grid; grid-template-columns: 22px 32px minmax(0, 1fr); gap: 10px; align-items: center; padding: 8px 10px; border-radius: var(--r-sm); background: var(--surface-2); }
.sft-mapa-n { font-family: var(--mono); font-weight: 800; color: var(--accent); text-align: center; }
.sft-mapa b { display: block; font-size: .92rem; line-height: 1.25; }
.sft-mapa small { font-size: .78rem; }
.sft-nec { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: .92rem; }
.sft-seguridad { margin: 16px 0 8px; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--precaucion); background: var(--precaucion-soft); }
.sft-seguridad ul { margin: 6px 0 8px; padding-left: 1.2em; display: grid; gap: 2px; font-size: .92rem; }
.sft-alerta { margin: 6px 0; padding: 8px 10px; border-radius: var(--r-sm); background: var(--alerta-soft); color: var(--alerta-ink); font-weight: 700; font-size: .9rem; }
.sft-alerta.suave { background: var(--surface); color: var(--fg); font-weight: 400; }
.sft-ok { margin-top: 8px; font-weight: 700; }
.sft-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 14px 0 8px; }
.sft-nota { margin: 8px 0 0; font-size: .8rem; color: var(--muted); text-align: center; }
.sft-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
.sft-cab small { font-family: var(--mono); font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.sft-puntos { display: flex; flex: none; gap: 5px; }
.sft-puntos i { width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--accent); }
.sft-puntos i.hecha { background: var(--accent); }
.sft-puntos i.ahora { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.sft-escena { display: grid; place-items: center; margin: 6px 0; padding: 10px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--line); }
.sft-svg { display: block; width: 100%; max-width: 240px; height: auto; color: var(--fg); }
.sft-svg .fig { stroke: currentColor; stroke-width: 3.6; }
.sft-svg .prop { stroke: currentColor; stroke-width: 2.2; opacity: .5; }
.sft-svg .mov { stroke: var(--accent); stroke-width: 2.6; }
.sft-svg .sft-pesa, .sft-svg .sft-punto { fill: var(--accent); stroke: none; }
.sft-svg .sft-mano { fill: var(--accent); stroke: var(--surface-2); stroke-width: 1.2; }
.sft-svg .sft-cono { fill: var(--accent-deep); stroke: none; }
.sft-svg .sft-ruta { stroke: var(--accent); stroke-width: 1.8; stroke-dasharray: 2.5 3; }
.sft-svg text { fill: var(--muted); stroke: none; font: 700 6px var(--mono); }
.sft-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
.sft-dos figure { margin: 0; text-align: center; }
.sft-dos .sft-svg { max-width: 160px; margin: 0 auto; }
.sft-dos figcaption { margin-top: 2px; font-family: var(--mono); font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.sft-ctrl { display: flex; justify-content: center; margin: 0 0 4px; }
.sft-como { margin: 0; padding-left: 1.3em; display: grid; gap: 6px; }
.sft-como li::marker { color: var(--accent); font-weight: 800; }
.sft-aviso { margin: 10px 0 0; padding: 8px 12px; border-left: 3px solid var(--precaucion); border-radius: 0 var(--r-sm) var(--r-sm) 0; background: var(--precaucion-soft); font-size: .9rem; }
.sft-aviso.fuerte { border-left-color: var(--alerta); background: var(--alerta-soft); }
.sft-medida { margin: 16px 0 6px; padding: 16px 14px; border-radius: var(--r-lg); border: 1px solid var(--line-strong); background: linear-gradient(160deg, var(--surface-2), var(--surface)); }
.sft-reloj { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px 22px; }
.sft-anillo-w { position: relative; width: 132px; height: 132px; flex: none; }
.sft-anillo { display: block; width: 100%; height: 100%; transform: rotate(-90deg); }
.sft-anillo .fondo { fill: none; stroke: var(--line); stroke-width: 9; }
.sft-anillo .valor { fill: none; stroke: var(--accent); stroke-width: 9; stroke-linecap: round; }
.sft-t { position: absolute; inset: 0; display: grid; place-items: center; font: 800 1.7rem/1 var(--mono); font-variant-numeric: tabular-nums; }
.sft-crono .sft-t { position: static; font-size: 2.6rem; }
.sft-reloj.corre .sft-t { color: var(--accent-deep); }
.sft-reloj.acabado .sft-t { color: var(--info-ink); }
.sft-contador { display: grid; justify-items: center; gap: 2px; }
.sft-n { font: 800 3rem/1 var(--mono); font-variant-numeric: tabular-nums; color: var(--accent-deep); }
.sft-contador small { font-size: .8rem; }
.sft-botones { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.sft-mas { width: 84px; height: 84px; border: 0; border-radius: 50%; background: var(--accent); color: var(--accent-fg); font: 800 1.6rem/1 var(--mono); box-shadow: 0 8px 20px -8px var(--accent); touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.sft-menos { width: 48px; height: 48px; border: 1.5px solid var(--line-strong); border-radius: 50%; background: var(--surface); font: 700 1rem/1 var(--mono); touch-action: manipulation; }
.sft-mas:active { transform: scale(.94); }
.sft-fila { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; margin-top: 14px; }
.sft-voz { display: inline-flex; align-items: center; gap: 6px; font-size: .88rem; }
.sft-valor, .sft-intentos label, .sft-vueltas label { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: .92rem; }
.sft-valor { justify-content: center; margin-top: 14px; }
.sft-valor input, .sft-intentos input, .sft-vueltas input { width: 6.5em; }
.sft-intentos { display: grid; gap: 10px; margin-top: 14px; }
.sft-vueltas { display: grid; gap: 8px; margin-top: 14px; }
.sft-vueltas label > span:first-child { min-width: 11em; }
.sft-intentos label > span:first-child { min-width: 6em; }
.sft-intentos.sft-flex { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
.sft-flex fieldset { margin: 0; padding: 8px 10px 10px; min-width: 0; border: 1px solid var(--line); border-radius: var(--r-sm); }
.sft-flex legend { padding: 0 4px; font-weight: 700; font-size: .85rem; }
.sft-flex .sft-cm { margin-top: 8px; }
.sft-flex .sft-cm input { width: 6.5em; }
.sft-mejor { margin: 12px 0 0; text-align: center; font-size: .95rem; }
.sft-mejor b { font-family: var(--mono); font-size: 1.15rem; color: var(--accent-deep); }
.sft-falta { margin: 8px 0 0; color: var(--alerta-ink); font-weight: 700; text-align: center; }
.sft-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.sft-nav [data-sig] { margin-left: auto; }
@media (max-width: 479px) { .sft-nav [data-sig] { flex: 1 0 auto; } }
.sft-res-top { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; align-items: center; margin: 10px 0 14px; padding: 14px 16px; border-radius: var(--r-md); border: 1px solid var(--line); background: linear-gradient(135deg, var(--accent-soft), var(--surface-2)); }
.sft-res-n { font: 800 2.4rem/1 var(--mono); color: var(--accent-deep); }
.sft-res-top b { display: block; line-height: 1.3; }
.sft-res-r { display: block; margin-top: 2px; color: var(--alerta-ink); font-weight: 700; }
.sft-res { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sft-res > li { padding: 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.sft-res-cab { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; gap: 10px; align-items: center; }
.sft-res-cab b { display: block; line-height: 1.2; }
.sft-res-cab small { display: block; font-size: .78rem; }
.sft-chip { padding: 3px 9px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font-size: .74rem; font-weight: 700; white-space: nowrap; }
.sft-chip.n-alto, .sft-chip.n-normal { background: var(--info-soft); color: var(--info-ink); }
.sft-chip.n-bajo { background: var(--precaucion-soft); color: var(--precaucion-ink); }
.sft-res-val { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; margin: 8px 0 0; }
.sft-val { white-space: nowrap; }
.sft-val b { font: 800 1.6rem/1.1 var(--mono); font-variant-numeric: tabular-nums; }
.sft-ud { color: var(--muted); font-size: .85rem; font-weight: 700; }
.sft-res-val small { font-size: .82rem; }
.sft-meta-t.ok-meta { color: var(--info-ink); font-weight: 700; }
.sft-escala { display: block; width: 100%; max-width: 480px; height: auto; margin-top: 4px; overflow: visible; }
.sft-e-pista { fill: var(--surface-2); stroke: var(--line-strong); stroke-width: 1; }
.sft-e-riesgo { fill: url(#sft-rayas); stroke: var(--alerta); stroke-width: 1; stroke-dasharray: 2 2; }
.sft-raya { stroke: var(--alerta); stroke-width: 2.2; opacity: .6; }
.sft-e-normal { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.4; }
.sft-e-meta { stroke: var(--info); stroke-width: 2; stroke-dasharray: 3 2; }
.sft-e-tm { fill: var(--info-ink); font: 700 8px var(--mono); text-anchor: middle; }
.sft-e-punto { fill: var(--accent-deep); stroke: var(--surface); stroke-width: 3; }
.sft-e-eje { fill: var(--muted); font: 600 9px var(--mono); }
.sft-riesgo { margin: 6px 0 0; color: var(--alerta-ink); font-weight: 700; font-size: .88rem; }
.sft-antes { margin: 4px 0 0; color: var(--muted); font-size: .84rem; }
.sft-antes .d-mejor { color: var(--info-ink); font-weight: 700; }
.sft-antes .d-peor { color: var(--precaucion-ink); font-weight: 700; }
.sft-claves { display: grid; gap: 10px; margin: 14px 0 6px; }
.sft-clave { padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); }
.sft-clave.bien { background: var(--info-soft); color: var(--info-ink); }
.sft-clave.mejora { background: var(--surface-2); }
.sft-clave b { display: block; margin-bottom: 2px; }
.sft-ej-t { margin-top: 8px; font-size: .86rem; color: var(--muted); }
.sft-ej { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.sft-fuentes { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 3px; font-size: .78rem; color: var(--muted); }
.sft-fuentes a { color: inherit; }
:root[data-theme="contrast"] .sft-hero, :root[data-theme="contrast"] .sft-res-top, :root[data-theme="contrast"] .sft-medida, :root[data-theme="contrast"] .sft-escena { background: var(--surface); }
@media (forced-colors: active) {
  .sft-svg .fig, .sft-svg .prop { stroke: CanvasText; }
  .sft-svg .mov, .sft-svg .sft-ruta, .sft-e-normal, .sft-anillo .valor { stroke: Highlight; }
  .sft-e-punto, .sft-svg .sft-punto, .sft-svg .sft-pesa { fill: Highlight; }
}
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .sft-e-mov { animation: sft-desliza .9s var(--ease-salida, ease-out) both; animation-delay: calc(var(--k, 0) * 70ms + .15s); }
  html:not(.pa-quieto) .sft-res > li { animation: sft-entra .45s var(--ease-salida, ease-out) both; animation-delay: calc(var(--k, 0) * 70ms); }
  html:not(.pa-quieto) .sft-reloj.corre .sft-mas { animation: sft-late 1.2s ease-in-out infinite; }
  html:not(.pa-quieto) .sft-anillo .valor { transition: stroke-dasharray .12s linear; }
}
@keyframes sft-desliza { from { transform: translateX(calc(var(--d) * -1)); } }
@keyframes sft-entra { from { opacity: 0; translate: 0 10px; } }
@keyframes sft-late { 0%, 100% { box-shadow: 0 0 0 0 var(--accent-soft), 0 8px 20px -8px var(--accent); } 50% { box-shadow: 0 0 0 12px transparent, 0 8px 20px -8px var(--accent); } }
@media print { .sft-dlg { display: none !important; } }
`;
function nuevoRun() { const s = ctx.sft || {}; return { sexo: sx(s.sexo), edad: ctx.edad ?? null, aer: s.aer === "andar6" ? "andar6" : "paso2", r: {}, i: 0, ok: false, voz: V ? V.preferida() : false }; }
function crear() {
  if (!document.getElementById("sft-css")) { const st = document.createElement("style"); st.id = "sft-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "pruebas"; dlg.className = "ficha sesion sft-dlg"; dlg.setAttribute("aria-labelledby", "sft-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="sft-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="sft-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="sft-cuerpo"></div><svg class="sft-defs" aria-hidden="true" focusable="false"><defs><pattern id="sft-rayas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path class="sft-raya" d="M0 0v6"/></pattern></defs></svg>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => { dlg.removeAttribute("open"); dlg.dispatchEvent(new Event("close")); }; }
  dlg.querySelector("#sft-cerrar").addEventListener("click", () => dlg.close());
  // sin cerrar al tocar fuera ni con Escape mientras corre el reloj: una prueba a medias no se pierde por un toque
  dlg.addEventListener("cancel", (ev) => { if (reloj) ev.preventDefault(); });
  dlg.addEventListener("close", () => { pararReloj(); try { V?.callar?.(); } catch {} });
}
/** Abre la batería. c: { edad, sft, presentes, fragil, consultar, ic, osteoporosis, cargarVoz, toast, vibrar, guardar }. */
export async function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c;
  if (!V && typeof c.cargarVoz === "function") { try { V = await c.cargarVoz(); } catch { V = null; } }
  run = nuevoRun();
  dlg.querySelector("#sft-cab-t").textContent = tx("titulo");
  inicio();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
