/* «Aprende» (mejora grande 2): diez lecciones de dos minutos con tarjetas y tres preguntas de autocomprobación.
   Contenido en español, como la base, con sus fuentes (las cifras, comprobadas en PubMed el 21/11/2026: OMS 2020,
   Arem 2015, Sherrington 2019, Fragala 2019, Colberg 2016, Gardner 2012) o las mismas guías que citan las reglas.
   Lo que se acierta se guarda solo en este dispositivo («medex.aprende»). Se carga al abrir «Aprende». */
import { t } from "./i18n.js?v=202611222111";

const OMS = { txt: "OMS 2020: guía de actividad física y sedentarismo (Bull et al., Br J Sports Med 2020)", doi: "10.1136/bjsports-2020-102955" };
export const LECCIONES = [
  { id: "moverse", icono: "M12 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-2 6h4l2 5-2 1-1-2v9h-2v-6h-1v6H8v-9l-1 2-2-1z", titulo: "Moverse también es un tratamiento",
    tarjetas: ["El ejercicio regular reduce el riesgo de enfermedad del corazón, diabetes, algunos cánceres, depresión y caídas, y ayuda a controlar casi todas las enfermedades crónicas.",
      "El salto que más cuenta es empezar: en un análisis de más de 660 000 personas, quienes se movían menos del mínimo recomendado ya tenían un 20 % menos de mortalidad que quienes no se movían nada.",
      "Al llegar al mínimo recomendado, el riesgo era un 31 % menor; multiplicarlo por tres a cinco solo lo llevaba al 39 %. Más es algo mejor, pero lo esencial se consigue con el mínimo.",
      "Su medicación casi nunca impide moverse: lo que cambia es cómo. Para eso están sus avisos y su plan."],
    preguntas: [
      { p: "¿Qué cambio aporta más beneficio?", o: ["Pasar de no moverse a moverse un poco", "Pasar de 5 a 10 horas de ejercicio a la semana", "Ninguno: solo cuenta llegar a 150 minutos"], ok: 0, x: "El mayor beneficio está en empezar: incluso por debajo del mínimo, el riesgo ya baja." },
      { p: "Si toma varios fármacos, ¿qué hace la medicación con el ejercicio?", o: ["Lo prohíbe casi siempre", "Casi nunca lo impide; cambia cómo hacerlo", "No influye en nada"], ok: 1, x: "Algunos fármacos cambian el pulso, la tensión o el azúcar; por eso el ejercicio se adapta, no se suprime." },
      { p: "¿Qué pasa si se mueve más del doble del mínimo?", o: ["Aumenta el riesgo", "Da lo mismo que no moverse", "El riesgo sigue bajando, aunque cada vez menos"], ok: 2, x: "Más es algo mejor, sin daño demostrado incluso con cantidades muy altas; lo esencial se consigue con el mínimo." }],
    fuentes: [OMS, { txt: "Arem et al., JAMA Intern Med 2015 (661 137 personas)", doi: "10.1001/jamainternmed.2015.0533" }] },
  { id: "cuanto", icono: "M7 2h10v2H7zm5 3a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-1 2h2v4l3 2-1 1.6-4-2.6z", titulo: "¿Cuánto movimiento hace falta?",
    tarjetas: ["La OMS recomienda a los adultos 150–300 minutos a la semana de actividad moderada (o 75–150 de vigorosa), repartidos como mejor le venga.",
      "Además, ejercicios de fuerza de los grandes grupos musculares al menos 2 días a la semana.",
      "A partir de los 65 años se añade el equilibrio: actividad variada que combine equilibrio y fuerza 3 o más días a la semana.",
      "Y un mensaje clave: algo es mejor que nada. Cualquier rato cuenta (ya no hace falta que sean tandas de 10 minutos); si está empezando, empiece por poco."],
    preguntas: [
      { p: "¿Cuántos minutos de actividad moderada a la semana recomienda la OMS?", o: ["30", "150–300", "1000"], ok: 1, x: "150–300 minutos de actividad moderada, o 75–150 de vigorosa, repartidos a lo largo de la semana." },
      { p: "¿Cuántos días de fuerza a la semana?", o: ["Al menos 2", "Ninguno si camina mucho", "Solo si se es joven"], ok: 0, x: "La fuerza va aparte del caminar: al menos 2 días a la semana, a cualquier edad." },
      { p: "Si hoy solo puede caminar 10 minutos, ¿merece la pena?", o: ["No, por debajo de 30 minutos no sirve", "Sí: algo es mejor que nada", "Solo si es en ayunas"], ok: 1, x: "Todo cuenta. La OMS dejó de exigir tandas mínimas: cualquier rato suma." }],
    fuentes: [OMS] },
  { id: "intensidad", icono: "M4 18a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0zm7-1 4-7 1.5 1-4 7.2a1.5 1.5 0 1 1-1.5-1.2z", titulo: "Medir el esfuerzo sin reloj",
    tarjetas: ["El esfuerzo moderado acelera la respiración pero le deja hablar: puede decir frases, pero no cantar. Es la prueba del habla.",
      "La escala de esfuerzo percibido (Borg, de 6 a 20) traduce esa sensación: moderado es 12–13, «algo duro».",
      "Con algunos fármacos (betabloqueantes, verapamilo, digoxina, ivabradina…) el pulso no refleja el esfuerzo. La prueba del habla y la escala de Borg siguen valiendo.",
      "Si no puede ni hablar, va demasiado fuerte; si puede cantar, puede subir un poco."],
    preguntas: [
      { p: "¿Cómo es un esfuerzo moderado?", o: ["No puedo decir ni una palabra", "Puedo cantar sin problema", "Puedo hablar con frases, pero no cantar"], ok: 2, x: "Esa es la prueba del habla: respiración acelerada, pero con aire para conversar." },
      { p: "Con un betabloqueante, ¿qué guía es la buena?", o: ["La sensación de esfuerzo y la prueba del habla", "Las zonas de pulso del reloj", "La fórmula 220 menos la edad"], ok: 0, x: "El betabloqueante frena el pulso: las zonas y fórmulas de pulso le harían pasarse de esfuerzo." },
      { p: "En la escala de Borg (6–20), ¿qué número es moderado?", o: ["6–7", "12–13", "19–20"], ok: 1, x: "12–13 es «algo duro»: moderado. 6 es reposo y 20, el máximo." }],
    fuentes: [{ txt: "ACSM: Guidelines for Exercise Testing and Prescription, 11.ª ed." }] },
  { id: "fuerza", icono: "M2 10h2V8h2v8H4v-2H2zm18 0h2v4h-2v2h-2V8h2zM7 11h10v2H7z", titulo: "Fuerza a cualquier edad",
    tarjetas: ["Con los años se pierde músculo y fuerza, y se nota al subir escaleras, levantarse de una silla o llevar la compra.",
      "El entrenamiento de fuerza es la herramienta más potente para frenarlo: mejora la fuerza, la masa muscular, la movilidad y la independencia, también en personas muy mayores.",
      "Funciona con 2–3 sesiones a la semana, ejercicios de los grandes grupos musculares y una carga que canse al final de la serie sin perder la técnica (en su plan, 8–15 repeticiones).",
      "Respire de forma continua, progrese poco a poco y pare ante dolor articular o dolor en el pecho."],
    preguntas: [
      { p: "¿Cuántas sesiones de fuerza a la semana?", o: ["Una al mes", "2–3", "Todos los días hasta agotarse"], ok: 1, x: "2–3 sesiones semanales, con un día de descanso entre ellas para el mismo grupo muscular." },
      { p: "¿A partir de qué edad deja de servir el entrenamiento de fuerza?", o: ["A los 60", "A los 75", "No hay edad: sirve también en personas muy mayores"], ok: 2, x: "Los estudios incluyen a personas de más de 90 años: el músculo responde siempre." },
      { p: "¿Qué hacer con la respiración al hacer fuerza?", o: ["Aguantar el aire", "Respirar de forma continua, soltando el aire al empujar", "Da igual"], ok: 1, x: "Aguantar el aire dispara la tensión; respirando, el esfuerzo es más seguro." }],
    fuentes: [{ txt: "Fragala et al., posicionamiento de la NSCA sobre fuerza en mayores, J Strength Cond Res 2019", doi: "10.1519/JSC.0000000000003230" }, OMS] },
  { id: "caidas", icono: "M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 5h2l1 6 4 2-1 1.8-4-2-1 3 3 5h-2.3L10 18l-2 4H5.8l3-6z", titulo: "El equilibrio se entrena",
    tarjetas: ["Al menos uno de cada tres mayores de 65 años se cae cada año.",
      "Los programas de ejercicio reducen las caídas en torno a un 23 % (revisión Cochrane de 108 ensayos con más de 23 000 personas).",
      "Los que más funcionan combinan equilibrio y ejercicios funcionales (levantarse, girar, apoyarse en un pie), mejor si se añade fuerza.",
      "Entrene siempre con un apoyo cerca. Si toma medicación que da sueño o baja la tensión, todavía más."],
    preguntas: [
      { p: "¿Cuánto reducen las caídas los programas de ejercicio?", o: ["Nada", "En torno a una cuarta parte (23 %)", "Las evitan todas"], ok: 1, x: "Con evidencia de alta certeza: unas 195 caídas menos por cada 1000 personas en un año." },
      { p: "¿Qué tipo de ejercicio previene más las caídas?", o: ["Equilibrio y ejercicios funcionales, mejor junto con fuerza", "Solo estiramientos", "Solo caminar deprisa"], ok: 0, x: "Equilibrio y ejercicios funcionales son la base; sumar fuerza probablemente ayuda aún más." },
      { p: "¿Cómo se entrena el equilibrio con seguridad?", o: ["Con los ojos cerrados desde el primer día", "Con un apoyo al alcance (pared, silla, barandilla)", "En una superficie resbaladiza"], ok: 1, x: "El apoyo cerca permite retarse sin riesgo; se progresa poco a poco." }],
    fuentes: [{ txt: "Sherrington et al., Cochrane 2019: ejercicio para prevenir caídas en mayores", doi: "10.1002/14651858.CD012424.pub2" }] },
  { id: "alarma", icono: "M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z", titulo: "Cuándo parar",
    tarjetas: ["Moverse es seguro para la gran mayoría, incluso con enfermedades del corazón. Aun así, hay señales que obligan a parar.",
      "Pare si nota dolor u opresión en el pecho, mareo intenso o sensación de desmayo, falta de aire que no mejora al parar o palpitaciones que no ceden.",
      "Si no ceden en pocos minutos, o hay desmayo, dificultad para hablar o debilidad de un lado del cuerpo, llame al 112.",
      "Las molestias musculares leves al día siguiente son normales (agujetas); el dolor en el pecho no lo es nunca."],
    preguntas: [
      { p: "Nota opresión en el pecho mientras camina. ¿Qué hace?", o: ["Seguir más despacio hasta terminar", "Tomar un analgésico y seguir", "Parar y, si no cede en pocos minutos, llamar al 112"], ok: 2, x: "El dolor u opresión en el pecho con el esfuerzo es una señal de alarma: parar siempre." },
      { p: "¿Qué es normal al empezar a entrenar?", o: ["Agujetas leves al día siguiente", "Desmayarse al terminar", "Palpitaciones que no ceden"], ok: 0, x: "Las agujetas aparecen a las 24–48 horas y se van solas en pocos días." },
      { p: "¿Cuál de estas NO es una señal de alarma?", o: ["Falta de aire que no mejora al parar", "Respirar más rápido pero poder hablar", "Mareo intenso"], ok: 1, x: "Respirar más deprisa es lo esperable con el esfuerzo moderado." }],
    fuentes: [{ txt: "ACSM: Guidelines for Exercise Testing and Prescription, 11.ª ed." }] },
  { id: "medicacion", icono: "M7.1 3.1a5 5 0 0 1 7 0l6.8 6.8a5 5 0 0 1-7 7L7.1 10.1a5 5 0 0 1 0-7zm1.4 1.4a3 3 0 0 0 0 4.2l2.8 2.8 4.2-4.2-2.8-2.8a3 3 0 0 0-4.2 0z", titulo: "Medicación y ejercicio: qué puede cambiar",
    tarjetas: ["Algunos fármacos cambian cómo responde el cuerpo al esfuerzo: el pulso, la tensión, el azúcar, el equilibrio o la coagulación.",
      "Eso no quiere decir que no pueda moverse, sino que conviene adaptar el tipo de ejercicio, la intensidad o la hora.",
      "Por ejemplo: con betabloqueantes, guíese por la respiración; con insulina, mida la glucosa; con diuréticos, beba y evite la hora de máximo efecto; con anticoagulantes, evite golpes.",
      "No cambie ni deje ningún fármaco por su cuenta para hacer ejercicio: coméntelo antes con su médico."],
    preguntas: [
      { p: "¿Puede dejar un fármaco los días que entrena?", o: ["Sí, si se encuentra bien", "No, sin hablarlo antes con su médico", "Solo los de la tensión"], ok: 1, x: "Cualquier cambio de dosis se habla antes con el médico, aunque sea por el ejercicio." },
      { p: "Con un diurético potente (furosemida), ¿cuándo es mejor no entrenar?", o: ["En las 2–4 horas siguientes a la toma", "Por la tarde", "Nunca se puede entrenar"], ok: 0, x: "Es cuando más efecto hace: más ganas de orinar y más bajada de tensión." },
      { p: "Casi siempre, ¿qué cambia la medicación en el ejercicio?", o: ["Si se puede hacer o no", "Nada", "Cómo hacerlo: tipo, intensidad u hora"], ok: 2, x: "El ejercicio casi nunca está contraindicado: se adapta." }],
    fuentes: [{ txt: "ACSM: Guidelines for Exercise Testing and Prescription, 11.ª ed., apéndice A (medicación)" }, { txt: "Fichas técnicas de la AEMPS (apartados 4.4 y 4.8)" }] },
  { id: "azucar", icono: "M12 2c4 5 6 8.5 6 11a6 6 0 0 1-12 0c0-2.5 2-6 6-11zm0 4C9.6 9 8 11.6 8 13a4 4 0 0 0 8 0c0-1.4-1.6-4-4-7z", titulo: "Azúcar y ejercicio",
    tarjetas: ["El ejercicio ayuda a controlar la diabetes: los músculos toman glucosa al moverse y la insulina funciona mejor durante horas e incluso días.",
      "Con insulina o algunos fármacos (sulfonilureas, repaglinida), el ejercicio puede provocar bajadas de azúcar durante la sesión y hasta 24 horas después.",
      "Mida la glucosa antes; si está baja, tome hidratos antes de empezar, y lleve siempre azúcar de acción rápida.",
      "Señales de bajada: sudor frío, temblor, hambre repentina o confusión. Pare, tome 15 g de azúcar, espere 15 minutos y vuelva a medir."],
    preguntas: [
      { p: "¿Por qué el ejercicio baja el azúcar?", o: ["Porque se pierde azúcar con el sudor", "Porque los músculos toman glucosa al moverse", "No lo baja"], ok: 1, x: "Al contraerse, el músculo capta glucosa por su cuenta, y la insulina funciona mejor después." },
      { p: "Con insulina, ¿cuánto puede durar el riesgo de bajada tras entrenar?", o: ["Hasta 24 horas", "Cinco minutos", "Una semana"], ok: 0, x: "Puede aparecer horas después, incluso de noche: mida antes de acostarse los días de sesiones largas." },
      { p: "Nota temblor y sudor frío al caminar. ¿Qué hace?", o: ["Acelerar para terminar antes", "Beber solo agua", "Parar, tomar 15 g de azúcar y volver a medir a los 15 minutos"], ok: 2, x: "Es la regla de los 15: 15 g de azúcar rápido y nueva medida a los 15 minutos." }],
    fuentes: [{ txt: "Colberg et al., posicionamiento de la ADA sobre ejercicio y diabetes, Diabetes Care 2016", doi: "10.2337/dc16-1728" }, { txt: "ADA Standards of Care 2024 (ejercicio)" }] },
  { id: "tension", icono: "M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 5.5 5.5 5.5 0 0 1 21.5 12C19 16.5 12 21 12 21zm-5-9h3l1.5-3 2 6 1.5-3H17", titulo: "La tensión y el ejercicio",
    tarjetas: ["El ejercicio aeróbico regular baja la tensión unos 5–8 mmHg, y la fuerza moderada también ayuda.",
      "Tras cada sesión, la tensión queda más baja durante unas horas. Es bueno, pero con algunos fármacos puede marear al levantarse.",
      "Al hacer fuerza, no aguante el aire: la tensión se dispara durante unos segundos.",
      "Con 180/110 o más en reposo, no entrene hasta controlarla; con 160/100 o más, solo intensidad ligera-moderada hasta ajustar el tratamiento."],
    preguntas: [
      { p: "¿Cuánto baja la tensión el ejercicio aeróbico regular?", o: ["Nada", "Unos 5–8 mmHg", "Unos 50 mmHg"], ok: 1, x: "Es una bajada parecida a la de algunos fármacos, y se suma a ellos." },
      { p: "¿Qué hacer con la respiración al levantar peso?", o: ["Aguantarla para tener más fuerza", "Soltar el aire al empujar, sin aguantarlo", "Respirar solo por la nariz"], ok: 1, x: "Aguantar el aire (Valsalva) dispara la tensión; respirando, la subida es mucho menor." },
      { p: "Su tensión en reposo es 185/112. ¿Entrena hoy?", o: ["No, hasta controlarla con su médico", "Sí, a tope para bajarla", "Sí, pero solo pesas"], ok: 0, x: "Por encima de 180/110 en reposo no se entrena hasta controlarla." }],
    fuentes: [{ txt: "ESC 2024: guía de hipertensión arterial" }, { txt: "ACSM: Guidelines for Exercise Testing and Prescription, 11.ª ed." }] },
  { id: "constancia", icono: "M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2zm12 7H5v10h14zm-9 2 1.5 1.5L15 9l1.4 1.4-4.9 4.9L8.6 12.4z", titulo: "Cómo convertirlo en costumbre",
    tarjetas: ["Las costumbres se forman repitiendo lo mismo en la misma situación: después del desayuno, antes de comer, al volver del trabajo.",
      "Prepare un plan «cuando-entonces»: «Cuando termine de desayunar, saldré a caminar 15 minutos». Cuanto más concreto, mejor funciona.",
      "Empiece por poco y súbalo despacio: mejor 10 minutos casi todos los días que una hora un día y nada el resto.",
      "Si falla un día, no pasa nada: lo que cuenta es retomarlo. Por eso su racha perdona una semana de descanso."],
    preguntas: [
      { p: "¿Qué ayuda más a crear la costumbre?", o: ["Esperar a tener ganas", "Hacerlo siempre en el mismo momento del día", "Hacerlo solo el fin de semana, mucho rato"], ok: 1, x: "Repetir en la misma situación hace que, con el tiempo, salga casi solo." },
      { p: "¿Qué es un plan «cuando-entonces»?", o: ["Decidir cuándo y dónde: «cuando termine de desayunar, caminaré»", "Hacerlo cuando sobre tiempo", "Pagar un gimnasio"], ok: 0, x: "Atar el ejercicio a algo que ya hace cada día es de lo que mejor funciona." },
      { p: "Lleva dos días sin moverse. ¿Qué hace?", o: ["Dejarlo hasta el mes que viene", "Compensar con una sesión el doble de larga", "Retomarlo hoy, aunque sea poco"], ok: 2, x: "Fallar un día no rompe la costumbre; abandonar sí. Vuelva hoy, con poco." }],
    fuentes: [{ txt: "Gardner, Lally y Wardle, «Making health habitual», Br J Gen Pract 2012", doi: "10.3399/bjgp12X659466" }, OMS] },
];
const POR_ID = Object.fromEntries(LECCIONES.map((l) => [l.id, l]));

/** Lecciones recomendadas según los mecanismos de su lista y su edad (primero las suyas, luego el resto en orden). */
export function recomendadas({ presentes = [], edad = null, hipertension = false } = {}) {
  const r = new Set();
  if (presentes.includes("azucar")) r.add("azucar");
  if (presentes.includes("pulso") || presentes.includes("acelera")) r.add("intensidad");
  if (presentes.some((p) => ["tension", "tension_alta"].includes(p)) || hipertension) r.add("tension");
  if (presentes.some((p) => ["equilibrio", "sangrado"].includes(p)) || (edad != null && edad >= 65)) r.add("caidas");
  if (presentes.length >= 3) r.add("medicacion");
  return [...r];
}
const leer = () => { try { return JSON.parse(localStorage.getItem("medex.aprende") || "{}") || {}; } catch { return {}; } };
const escribir = (x) => { try { localStorage.setItem("medex.aprende", JSON.stringify(x)); } catch {} };
export const hechas = () => Object.keys(leer()).filter((k) => POR_ID[k]).length;

const CSS = `
.apr-dlg .apr-intro { margin: 0 0 10px; color: var(--muted); font-size: .92rem; }
.apr-prog { height: 8px; margin: 0 0 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.apr-prog > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), var(--marca-clara)); }
.apr-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.apr-lista button { display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.apr-lista button:hover { border-color: var(--accent); }
.apr-lista .apr-ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--accent-soft); }
.apr-lista .apr-ic svg { width: 22px; height: 22px; fill: var(--accent-deep); }
.apr-lista b { display: block; font-size: .98rem; line-height: 1.3; }
.apr-lista small { color: var(--muted); font-size: .8rem; }
.apr-lista .apr-chip { padding: 3px 8px; border-radius: 999px; background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .74rem; font-weight: 700; white-space: nowrap; }
.apr-lista .apr-chip.ok { background: var(--info-soft); color: var(--info-ink); }
.apr-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
.apr-cab small { font-family: var(--mono); font-size: .72rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
.apr-tarjeta { min-height: 9.5em; margin: 6px 0 10px; padding: 18px; border-radius: var(--r-md); background: linear-gradient(160deg, var(--accent-soft), var(--surface-2)); border: 1px solid var(--line); font-size: 1.12rem; line-height: 1.5; }
.apr-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.apr-puntos { display: flex; gap: 6px; }
.apr-puntos i { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--accent); }
.apr-puntos i.on { background: var(--accent); }
.apr-preg { margin: 6px 0 10px; font-size: 1.08rem; font-weight: 700; line-height: 1.35; }
.apr-opciones { display: grid; gap: 8px; }
.apr-opciones button { width: 100%; min-height: 48px; padding: 10px 14px; border: 2px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.apr-opciones button:hover:not(:disabled) { border-color: var(--accent); }
.apr-opciones button.bien { border-color: var(--info); background: var(--info-soft); color: var(--info-ink); font-weight: 700; }
.apr-opciones button.mal { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.apr-opciones button:disabled { cursor: default; }
.apr-expl { margin: 10px 0; padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .95rem; }
.apr-expl b { display: block; }
.apr-final { text-align: center; padding: 10px 0; }
.apr-final .apr-nota { font-size: 2.4rem; font-weight: 800; font-family: var(--mono); color: var(--accent-deep); }
.apr-fuentes { margin: 12px 0 0; padding-left: 1.1em; font-size: .8rem; color: var(--muted); display: grid; gap: 4px; }
.apr-fuentes a { color: inherit; }
.apr-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 12px; }
:root[data-theme="contrast"] .apr-tarjeta { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .apr-tarjeta, html:not(.pa-quieto) .apr-expl { animation: apr-entra .35s var(--ease-salida, ease-out) both; }
}
@keyframes apr-entra { from { opacity: 0; translate: 12px 0; } }
`;
let dlg = null, ctx = {};
function crear() {
  if (!document.getElementById("apr-css")) { const st = document.createElement("style"); st.id = "apr-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "aprende"; dlg.className = "ficha apr-dlg"; dlg.setAttribute("aria-labelledby", "apr-tit");
  dlg.innerHTML = `<div class="ficha-cab"><p id="apr-tit">${t("apr.titulo")}</p><button type="button" class="btn-sec sm" id="apr-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="apr-cuerpo" aria-live="polite"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#apr-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
const cuerpo = () => dlg.querySelector("#apr-cuerpo");
const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
function lista() {
  const prog = leer(), rec = recomendadas(ctx);
  const orden = [...rec.map((id) => POR_ID[id]), ...LECCIONES.filter((l) => !rec.includes(l.id))];
  const n = hechas();
  cuerpo().innerHTML = `<p class="apr-intro">${t("apr.intro")}</p>
    <div class="apr-cab"><small>${t("apr.progreso", { n, t: LECCIONES.length })}</small></div>
    <div class="apr-prog" role="img" aria-label="${t("apr.progreso", { n, t: LECCIONES.length })}"><i style="width:${Math.round((n / LECCIONES.length) * 100)}%"></i></div>
    <ul class="apr-lista">${orden.map((l) => { const h = prog[l.id]; return `<li><button type="button" data-apr="${l.id}"><span class="apr-ic">${ic(l.icono)}</span><span><b>${l.titulo}</b><small>${t("apr.min")}</small></span>${h ? `<span class="apr-chip ok">${t("apr.hecha", { a: h.aciertos, t: 3 })}</span>` : rec.includes(l.id) ? `<span class="apr-chip">${t("apr.recomendada")}</span>` : "<span></span>"}</button></li>`; }).join("")}</ul>`;
  cuerpo().querySelectorAll("[data-apr]").forEach((b) => b.addEventListener("click", () => leccion(b.dataset.apr)));
  cuerpo().scrollTop = 0;
}
function leccion(id, i = 0) {
  const l = POR_ID[id]; if (!l) return lista();
  const n = l.tarjetas.length;
  cuerpo().innerHTML = `
    <div class="apr-cab"><small>${t("apr.tarjeta", { n: i + 1, t: n })}</small><button type="button" class="btn-sec sm" data-volver>${t("apr.volver")}</button></div>
    <h2 class="pq-titulo">${l.titulo}</h2>
    <div class="apr-tarjeta">${l.tarjetas[i]}</div>
    <div class="apr-nav"><button type="button" class="btn-sec sm" data-ant${i === 0 ? " disabled" : ""}>${t("apr.anterior")}</button><span class="apr-puntos" aria-hidden="true">${l.tarjetas.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</span><button type="button" class="btn sm" data-sig>${i === n - 1 ? t("apr.preguntas") : t("apr.siguiente")}</button></div>`;
  cuerpo().querySelector("[data-volver]").addEventListener("click", lista);
  cuerpo().querySelector("[data-ant]").addEventListener("click", () => leccion(id, i - 1));
  cuerpo().querySelector("[data-sig]").addEventListener("click", () => (i === n - 1 ? pregunta(id, 0, 0) : leccion(id, i + 1)));
  cuerpo().querySelector("[data-sig]").focus();
}
function pregunta(id, k, aciertos) {
  const l = POR_ID[id], q = l.preguntas[k], n = l.preguntas.length;
  cuerpo().innerHTML = `
    <div class="apr-cab"><small>${t("apr.pregunta", { n: k + 1, t: n })}</small><button type="button" class="btn-sec sm" data-volver>${t("apr.volver")}</button></div>
    <p class="apr-preg">${q.p}</p>
    <div class="apr-opciones" role="group" aria-label="${q.p}">${q.o.map((o, j) => `<button type="button" data-o="${j}">${o}</button>`).join("")}</div>
    <div class="apr-sigue"></div>`;
  cuerpo().querySelector("[data-volver]").addEventListener("click", lista);
  cuerpo().querySelectorAll("[data-o]").forEach((b) => b.addEventListener("click", () => {
    const j = Number(b.dataset.o), bien = j === q.ok;
    cuerpo().querySelectorAll("[data-o]").forEach((x) => { x.disabled = true; if (Number(x.dataset.o) === q.ok) x.classList.add("bien"); });
    if (!bien) b.classList.add("mal");
    const a = aciertos + (bien ? 1 : 0);
    cuerpo().querySelector(".apr-sigue").innerHTML = `<p class="apr-expl"><b>${bien ? t("apr.bien") : t("apr.mal")}</b>${q.x}</p><div class="apr-nav"><span></span><button type="button" class="btn sm" data-sig>${k === n - 1 ? t("apr.ver_resultado") : t("apr.siguiente")}</button></div>`;
    const s = cuerpo().querySelector("[data-sig]");
    s.addEventListener("click", () => (k === n - 1 ? final(id, a) : pregunta(id, k + 1, a)));
    s.focus();
  }));
}
function final(id, aciertos) {
  const l = POR_ID[id], n = l.preguntas.length;
  const prog = leer(); prog[id] = { aciertos: Math.max(aciertos, prog[id]?.aciertos || 0), fecha: new Date().toISOString().slice(0, 10) }; escribir(prog);
  const sig = LECCIONES.find((x) => !prog[x.id]);
  cuerpo().innerHTML = `
    <h2 class="pq-titulo">${l.titulo}</h2>
    <div class="apr-final"><div class="apr-nota">${aciertos}/${n}</div><p>${aciertos === n ? t("apr.genial") : t("apr.repasar")}</p></div>
    <p class="pq-fuentes">${t("apr.fuentes")}:</p>
    <ul class="apr-fuentes">${l.fuentes.map((f) => `<li>${f.txt}${f.doi ? ` · <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : ""}</li>`).join("")}</ul>
    <div class="apr-acciones"><button type="button" class="btn-sec sm" data-rep>${t("apr.repetir")}</button>${sig ? `<button type="button" class="btn sm" data-otra="${sig.id}">${t("apr.otra")}</button>` : ""}<button type="button" class="btn-sec sm" data-volver>${t("apr.volver")}</button></div>`;
  cuerpo().querySelector("[data-rep]").addEventListener("click", () => leccion(id, 0));
  cuerpo().querySelector("[data-otra]")?.addEventListener("click", (ev) => leccion(ev.currentTarget.dataset.otra, 0));
  cuerpo().querySelector("[data-volver]").addEventListener("click", lista);
  document.dispatchEvent(new CustomEvent("aprende", { detail: { id, aciertos } }));
}
/** Abre «Aprende»: la lista, o directamente una lección. c: { presentes, edad, hipertension }. */
export function abrir(id = null, c = {}) {
  if (!dlg) crear();
  ctx = c;
  if (id && POR_ID[id]) leccion(id, 0); else lista();
  if (!dlg.open) dlg.showModal();
}
