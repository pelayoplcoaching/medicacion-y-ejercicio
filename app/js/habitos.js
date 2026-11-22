/* «Alcohol, tabaco y café con su medicación» (mejora grande 5): cruza tres respuestas de «Sus datos» (si bebe, si fuma
   o lo ha dejado hace menos de un año y cuántos cafés toma) con la lista de medicamentos. Cada aviso dice qué pasa, qué
   hacer y de dónde sale: la ficha técnica de la AEMPS (apartado citado, comprobado en CIMA el 22/11/2026), la EFSA (2015)
   para la cafeína y, para el tabaco y el café con levotiroxina, artículos con su DOI comprobados en PubMed. Contenido en
   español (como el resto del contenido clínico) revisado por un clínico el 22/11/2026; la interfaz, en cinco idiomas.
   Se carga al pintar «Antes de empezar». */
import { idioma } from "./i18n.js?v=202611222025";

/** Respuestas posibles de cada hábito, en el orden del formulario. */
export const VALORES = { alcohol: ["no", "aveces", "diario"], tabaco: ["no", "si", "dejado"], cafe: ["poco", "medio", "mucho"] };
export const ORDEN_H = ["alcohol", "tabaco", "cafe"];
const ORDEN_N = { alerta: 3, precaucion: 2, info: 1 };

const FT = (txt) => ({ txt }); // ficha técnica (CIMA), sin DOI
const D = (txt, doi) => ({ txt, doi }); // artículo con DOI
const EFSA = D("EFSA 2015, opinión científica sobre la seguridad de la cafeína", "10.2903/j.efsa.2015.4102");
const KROON = D("Kroon 2007, Am J Health Syst Pharm (revisión de interacciones del tabaco)", "10.2146/ajhp060414");

/**
 * Reglas. h: hábito; v: respuestas a las que se aplica; si: condición sobre la lista (senal, pids, excluir, sinPids) o la
 * persona (condicion, sinCondicion, edadMin, edadMax: con edad desconocida vale la de edadMax); nivel, titulo y texto
 * pueden depender de la respuesta ({ aveces: …, diario: … }); {farmacos} se sustituye por los fármacos implicados;
 * extras: frases que se añaden si está alguno de sus pids; calc: frase calculada; ft: enlazar la ficha de cada implicado.
 */
export const REGLAS = [
  // ---------- alcohol ----------
  { id: "alc_sedacion", h: "alcohol", v: ["aveces", "diario"], si: { senal: "sedacion" }, nivel: { aveces: "precaucion", diario: "alerta" }, ft: true,
    titulo: { aveces: "Alcohol y medicamentos que dan sueño", diario: "Alcohol a diario con medicamentos que dan sueño" },
    texto: {
      aveces: "El alcohol suma su efecto al de {farmacos}: más sueño, reflejos más lentos y más riesgo de caídas. No beba antes de hacer ejercicio ni de conducir, y los días que beba deje para otro día los ejercicios de equilibrio más exigentes.",
      diario: "Beber a diario con {farmacos} suma sueño y torpeza y aumenta el riesgo de caídas y de accidentes. Coméntelo con su médico. Mientras tanto, no beba antes de hacer ejercicio ni de conducir.",
    },
    fuentes: [FT("Fichas técnicas, apartado 4.5 (p. ej., lorazepam: «El efecto sedante puede potenciarse cuando se administra el producto en combinación con alcohol»)")] },
  { id: "alc_hipoglucemia", h: "alcohol", v: ["aveces", "diario"], si: { senal: "hipoglucemia" }, nivel: "alerta", ft: true,
    titulo: "Alcohol, ejercicio y bajadas de azúcar",
    texto: "Con {farmacos}, el alcohol frena la respuesta del cuerpo a una bajada de azúcar y el ejercicio gasta azúcar: juntos facilitan una hipoglucemia, que puede llegar horas después, incluso por la noche. Si bebe, hágalo comiendo, no beba después de entrenar sin haber comido, mírese el azúcar antes de dormir y lleve siempre azúcar encima.",
    fuentes: [FT("Ficha técnica de gliclazida, 4.4 y 4.5 (el alcohol «aumenta la reacción hipoglucémica (inhibiendo las reacciones compensatorias)»; evitarlo); de insulina, 4.5")] },
  { id: "alc_metformina", h: "alcohol", v: ["diario"], si: { pids: ["metformina"] }, nivel: "precaucion", ft: true,
    titulo: "Alcohol a diario y metformina",
    texto: "Con la metformina, el consumo excesivo de alcohol aumenta el riesgo de acidosis láctica, sobre todo en ayunas o con deshidratación. Beba agua durante el ejercicio, no entrene en ayunas los días que beba y coméntelo con su médico.",
    fuentes: [FT("Ficha técnica de metformina, 4.3, 4.4 y 4.5")] },
  { id: "alc_acenocumarol", h: "alcohol", v: ["aveces", "diario"], si: { pids: ["acenocumarol"] }, nivel: { aveces: "precaucion", diario: "alerta" }, ft: true,
    titulo: "Alcohol y Sintrom",
    texto: "La ficha técnica de Sintrom (acenocumarol) pide evitar el alcohol: puede frenar su eliminación y aumentar el riesgo de sangrado. Si bebe, que sea poco y sin cambios bruscos, y dígalo en su control de INR. Con el ejercicio, cuide los golpes y las caídas.",
    fuentes: [FT("Ficha técnica de Sintrom, 4.5: «Evitar tomar zumo de grosella o alcohol durante el tratamiento con Sintrom»")] },
  { id: "alc_sangrado", h: "alcohol", v: ["diario"], si: { senal: "sangrado", excluir: ["acenocumarol"] }, nivel: "precaucion", ft: true,
    titulo: "Alcohol a diario y riesgo de sangrado",
    texto: "Beber a diario suma riesgo de sangrado al de {farmacos}: el alcohol irrita el estómago (más aún con la aspirina y los antiinflamatorios) y facilita las caídas y los golpes. Beba poco y nunca antes de hacer ejercicio.",
    fuentes: [FT("Ficha técnica de ácido acetilsalicílico, 4.4: en quienes toman «tres o más bebidas alcohólicas al día puede provocar hemorragia gástrica»")] },
  { id: "alc_hipotension", h: "alcohol", v: ["aveces", "diario"], si: { senal: "hipotension" }, nivel: "info", ft: true,
    titulo: "Alcohol y medicamentos que bajan la tensión",
    texto: "El alcohol dilata los vasos y suma su efecto al de {farmacos}: más mareo al levantarse o al terminar el ejercicio, sobre todo con calor. Si bebe, que no sea antes de entrenar; levántese despacio y beba agua.",
    fuentes: [FT("Fichas técnicas, apartado 4.5 (p. ej., nitratos: «Con el alcohol, además de la hipotensión, puede acentuarse la disminución de la capacidad de reacción»)")] },
  { id: "alc_paracetamol", h: "alcohol", v: ["diario"], si: { pids: ["paracetamol"] }, nivel: "precaucion", ft: true,
    titulo: "Alcohol a diario y paracetamol",
    texto: "Con 3 o más bebidas alcohólicas al día, la ficha técnica pide precaución con el paracetamol y, si el consumo de alcohol es crónico, no pasar de 2 g al día (por ejemplo, 4 comprimidos de 500 mg). Téngalo en cuenta si lo toma para el dolor después del ejercicio.",
    fuentes: [FT("Ficha técnica de paracetamol, 4.2 y 4.4")] },
  { id: "alc_metronidazol", h: "alcohol", v: ["aveces", "diario"], si: { pids: ["metronidazol"] }, nivel: "alerta", ft: true,
    titulo: "Nada de alcohol con metronidazol",
    texto: "Mientras tome metronidazol y hasta al menos un día después de terminarlo, no beba alcohol ni tome medicamentos que lo lleven: puede dar enrojecimiento, vómitos y palpitaciones (efecto antabús).",
    fuentes: [FT("Ficha técnica de Flagyl, 4.4 y 4.5")] },
  { id: "alc_disulfiram", h: "alcohol", v: ["aveces", "diario"], si: { pids: ["disulfiram"] }, nivel: "alerta", ft: true,
    titulo: "Disulfiram y alcohol",
    texto: "Con disulfiram, incluso una cantidad mínima de alcohol provoca a los pocos minutos una reacción intensa, con sofoco, palpitaciones y malestar. Ojo con el alcohol escondido en salsas, vinagre, enjuagues bucales o jarabes. Si está bebiendo mientras lo toma, hable cuanto antes con su médico.",
    fuentes: [FT("Ficha técnica de Antabus, 4.3 y 4.4")] },
  { id: "alc_metotrexato", h: "alcohol", v: ["aveces", "diario"], si: { pids: ["metotrexato"] }, nivel: { aveces: "precaucion", diario: "alerta" }, ft: true,
    titulo: "Alcohol y metotrexato",
    texto: "La ficha técnica pide evitar el alcohol durante el tratamiento con metotrexato, o reducirlo al mínimo, porque aumenta el daño del hígado. Coméntelo en su próximo control.",
    fuentes: [FT("Ficha técnica de metotrexato, 4.4 y 4.5")] },
  { id: "alc_agomelatina", h: "alcohol", v: ["aveces", "diario"], si: { pids: ["agomelatina"] }, nivel: "precaucion", ft: true,
    titulo: "Alcohol y agomelatina",
    texto: "La ficha técnica desaconseja combinar agomelatina y alcohol; además, beber bastante es un factor de riesgo para el hígado con este fármaco.",
    fuentes: [FT("Ficha técnica de Valdoxan, 4.4 y 4.5")] },
  { id: "alc_higado", h: "alcohol", v: ["diario"], si: { senal: "hepatotoxico" }, nivel: "precaucion",
    titulo: "Alcohol a diario y productos que pueden dañar el hígado",
    texto: "{farmacos} {se ha|se han} relacionado con casos de daño en el hígado, y beber a diario le suma carga. Valore con su médico si de verdad {lo necesita|los necesita}. Señales de alarma: cansancio intenso, orina oscura y piel u ojos amarillos.",
    fuentes: [{ txt: "LiverTox (NIH)", url: "https://www.ncbi.nlm.nih.gov/books/NBK547852/" }] },

  // ---------- tabaco ----------
  { id: "tab_cyp_fuerte", h: "tabaco", v: ["si", "dejado"], si: { pids: ["clozapina", "olanzapina", "olanzapina_depot", "teofilina"] }, nivel: { si: "precaucion", dejado: "alerta" }, ft: true,
    titulo: { si: "Si deja de fumar, avise antes a su médico", dejado: "Ha dejado de fumar: avise a su médico" },
    texto: {
      si: "El humo del tabaco acelera la eliminación de {farmacos}. Al dejar de fumar, que es una gran decisión, {su nivel|sus niveles} en la sangre {sube|suben} en los días siguientes y {puede|pueden} dar efectos adversos. Avise antes a su médico para ajustar la dosis o hacer un control. Los parches o chicles de nicotina no evitan este cambio: lo produce el humo, no la nicotina.",
      dejado: "El humo del tabaco aceleraba la eliminación de {farmacos}. Al dejar de fumar, {su nivel|sus niveles} en la sangre {sube|suben} y {puede|pueden} dar efectos adversos (más sueño, mareo, nervios o palpitaciones, según el fármaco). Si su médico aún no lo sabe, avísele pronto para revisar la dosis. Los parches o chicles de nicotina no evitan este cambio: lo produce el humo, no la nicotina.",
    },
    fuentes: [FT("Fichas técnicas de clozapina, 4.5 («En casos de interrupción brusca del hábito de fumar, puede aumentar la concentración plasmática de clozapina»), olanzapina, 4.2 y 4.5, y teofilina, 4.2 y 4.5"), KROON] },
  { id: "tab_cyp_otros", h: "tabaco", v: ["si", "dejado"], si: { pids: ["duloxetina", "ropinirol", "agomelatina"] }, nivel: { si: "info", dejado: "precaucion" }, ft: true,
    titulo: { si: "Fumar cambia el efecto de algunos de sus fármacos", dejado: "Dejar de fumar puede cambiar el efecto de algunos fármacos" },
    texto: {
      si: "El tabaco acelera la eliminación de {farmacos}. Si deja de fumar, el efecto puede aumentar: coméntelo con su médico por si hay que ajustar la dosis.",
      dejado: "Mientras fumaba, el tabaco aceleraba la eliminación de {farmacos}. Tras dejarlo, el efecto puede aumentar (por ejemplo, más mareo o sueño): coméntelo con su médico por si hay que ajustar la dosis.",
    },
    extras: [{ pids: ["duloxetina"], v: ["si"], texto: " Con la duloxetina, los fumadores tienen niveles en la sangre casi un 50 % más bajos." }],
    fuentes: [FT("Fichas técnicas de duloxetina, 4.5, ropinirol, 4.4, y Valdoxan, 4.5")] },
  { id: "tab_ahc35", h: "tabaco", v: ["si"], si: { pids: ["anticonceptivo_combinado"], edadMin: 35 }, nivel: "alerta", ft: true,
    titulo: "Tabaco y anticonceptivo combinado a partir de los 35",
    texto: "Fumar con la píldora, el parche o el anillo combinados aumenta el riesgo de trombosis arterial (infarto, ictus), sobre todo a partir de los 35 años. La ficha técnica aconseja encarecidamente a las mujeres de más de 35 años que siguen fumando que usen otro método: hable con su médico o su matrona.",
    fuentes: [FT("Ficha técnica de anticonceptivos hormonales combinados, 4.4 (factores de riesgo de tromboembolismo arterial)")] },
  { id: "tab_ahc", h: "tabaco", v: ["si"], si: { pids: ["anticonceptivo_combinado"], edadMax: 34 }, nivel: "precaucion", ft: true,
    titulo: "Tabaco y anticonceptivo combinado",
    texto: "Fumar con la píldora, el parche o el anillo combinados aumenta el riesgo de trombosis arterial (infarto, ictus). La ficha técnica aconseja no fumar si se usan y, a partir de los 35 años, cambiar de método si se sigue fumando.",
    fuentes: [FT("Ficha técnica de anticonceptivos hormonales combinados, 4.4 (factores de riesgo de tromboembolismo arterial)")] },
  { id: "tab_ics", h: "tabaco", v: ["si"], si: { pids: ["ics", "laba_ics"] }, nivel: "info",
    titulo: "Tabaco e inhaladores con corticoide",
    texto: "En el asma, fumar puede restar eficacia a los inhaladores con corticoide, como el suyo. Es un motivo más para intentar dejarlo; si le cuesta controlar los síntomas, coméntelo con su médico.",
    fuentes: [KROON] },
  { id: "tab_ganas", h: "tabaco", v: ["si", "dejado"], si: {}, nivel: "info",
    titulo: { si: "El ejercicio quita las ganas de fumar", dejado: "Si le vienen ganas de fumar, muévase" },
    texto: {
      si: "Un rato de actividad moderada (por ejemplo, 10-15 minutos andando a paso vivo) reduce las ganas de fumar en el momento. Por sí solo no ha demostrado que ayude a dejarlo a largo plazo: úselo como una ayuda más, junto al tratamiento y el apoyo de su médico o enfermera.",
      dejado: "Cuando aparezcan las ganas, un rato de actividad moderada (por ejemplo, 10-15 minutos andando a paso vivo) las reduce en el momento. Úselo como una ayuda más, junto al apoyo de su médico o enfermera.",
    },
    fuentes: [D("Haasova 2013, Addiction (metaanálisis con datos individuales)", "10.1111/j.1360-0443.2012.04034.x"), D("Ussher 2019, revisión Cochrane", "10.1002/14651858.CD002295.pub6")] },

  // ---------- café ----------
  { id: "caf_teofilina", h: "cafe", v: ["medio", "mucho"], si: { pids: ["teofilina"] }, nivel: { medio: "info", mucho: "precaucion" }, ft: true,
    titulo: "Café y teofilina",
    texto: "La cafeína y la teofilina son de la misma familia y sus efectos se suman: nervios, temblor, palpitaciones o insomnio. La ficha técnica pide evitar cantidades altas de café, té, cacao o refrescos de cola.",
    fuentes: [FT("Ficha técnica de teofilina, 4.5")] },
  { id: "caf_litio", h: "cafe", v: ["medio", "mucho"], si: { pids: ["litio"] }, nivel: "precaucion", ft: true,
    titulo: "Café y litio",
    texto: "La cafeína hace bajar el litio en la sangre. Lo importante es no cambiar de golpe: si deja el café o toma mucho más, su nivel de litio puede subir o bajar. Mantenga una cantidad estable y avise a su médico antes de cambiarla.",
    fuentes: [FT("Ficha técnica de Plenur, 4.5: las xantinas (p. ej., cafeína, teofilina) disminuyen los niveles de litio")] },
  { id: "caf_clozapina", h: "cafe", v: ["medio", "mucho"], si: { pids: ["clozapina"] }, nivel: "precaucion", ft: true,
    titulo: "Café y clozapina",
    texto: "La cafeína sube el nivel de clozapina en la sangre; según su ficha técnica, baja alrededor de un 50 % tras 5 días sin cafeína. Mantenga estable lo que toma y avise a su médico antes de cambiarlo mucho.",
    fuentes: [FT("Ficha técnica de clozapina, 4.5")] },
  { id: "caf_cipro", h: "cafe", v: ["medio", "mucho"], si: { pids: ["ciprofloxacino"] }, nivel: "info", ft: true,
    titulo: "Café y ciprofloxacino",
    texto: "El ciprofloxacino hace que la cafeína se acumule. Mientras lo tome, si nota nervios, palpitaciones o le cuesta dormir, tome menos café.",
    fuentes: [FT("Ficha técnica de ciprofloxacino, 4.5")] },
  { id: "caf_levotiroxina", h: "cafe", v: ["medio", "mucho"], si: { pids: ["levotiroxina"] }, nivel: "info", ft: true,
    titulo: "Café y levotiroxina",
    texto: "Tome la levotiroxina en ayunas, con agua, al menos media hora antes del desayuno. El café tomado a la vez reduce su absorción; espere al menos media hora (mejor una) para tomarlo.",
    fuentes: [FT("Ficha técnica de Eutirox, 4.2"), D("Benvenga 2008, Thyroid", "10.1089/thy.2007.0222")] },
  { id: "caf_bifosfonato", h: "cafe", v: ["medio", "mucho"], si: { pids: ["alendronato", "risedronato", "ibandronato"] }, nivel: "info", ft: true,
    titulo: "Café y su medicamento para los huesos",
    texto: "Tome {farmacos} solo con agua y espere antes de tomar café o desayunar: el café reduce mucho su absorción.",
    extras: [
      { pids: ["alendronato"], texto: " Con el alendronato, espere al menos media hora: tomarlo con café redujo su absorción alrededor de un 60 %." },
      { pids: ["risedronato"], texto: " Con el risedronato, espere al menos media hora." },
      { pids: ["ibandronato"], texto: " Con el ibandronato, espere una hora." },
    ],
    fuentes: [FT("Fichas técnicas de alendronato, 4.2 y 5.2; risedronato, 4.2; e ibandronato, 4.2")] },
  { id: "caf_hierro", h: "cafe", v: ["medio", "mucho"], si: { pids: ["hierro_oral", "ferrimanitol_ovoalbumina"] }, nivel: "info", ft: true,
    titulo: "Café, té y hierro",
    texto: "El café y el té reducen mucho la absorción del hierro. Deje al menos 2 horas entre el hierro y el café o el té.",
    fuentes: [FT("Ficha técnica de Tardyferon, 4.5")] },
  { id: "caf_suplemento", h: "cafe", v: ["medio", "mucho"], si: { pids: ["cafeina"] }, nivel: "precaucion",
    titulo: "Café y cafeína en suplementos",
    texto: "Además del café, toma un suplemento con cafeína: sume los dos. Una taza de café de filtro lleva unos 90 mg. Para un adulto sano, la EFSA considera seguro hasta 400 mg al día y hasta 200 mg de una vez.",
    calc: (imp, v) => {
      const d = imp.reduce((s, it) => s + (Number(it.dosisTotal) || 0), 0);
      if (!d) return "";
      const t = Math.round(d + (v === "mucho" ? 360 : 90));
      return ` Con ${Math.round(d)} mg al día del suplemento y su café, la suma es de al menos ${t} mg al día${t > 400 ? ", por encima de 400 mg" : ""}.`;
    },
    fuentes: [EFSA] },
  { id: "caf_embarazo", h: "cafe", v: ["medio", "mucho"], si: { condicion: "embarazo" }, nivel: { medio: "info", mucho: "precaucion" },
    titulo: "Café en el embarazo o la lactancia",
    texto: {
      medio: "En el embarazo y la lactancia, la EFSA considera seguro hasta 200 mg de cafeína al día: unas 2 tazas de café de filtro. Con 3 tazas podría pasarse un poco.",
      mucho: "En el embarazo y la lactancia, la EFSA considera seguro hasta 200 mg de cafeína al día: unas 2 tazas de café de filtro. Con 4 o más está por encima: coméntelo con su matrona o su médico.",
    },
    fuentes: [EFSA] },
  { id: "caf_mucho", h: "cafe", v: ["mucho"], si: { sinCondicion: "embarazo", sinPids: ["cafeina"] }, nivel: "info",
    titulo: "¿Cuánto café es razonable?",
    texto: "Para un adulto sano, la EFSA considera seguro hasta 400 mg de cafeína al día (unas 4 tazas de café de filtro) y hasta 200 mg de una vez, incluso menos de 2 horas antes de un ejercicio intenso. Si toma más, o nota palpitaciones, nervios o mal sueño, redúzcalo poco a poco.",
    fuentes: [EFSA] },
];

/** Nombre para la frase: sin el paréntesis final y en minúscula si es un nombre común («Insulina basal (…)» → «insulina basal»). */
export function corto(nombre = "") {
  const n = String(nombre).replace(/\s*\([^)]*\)\s*$/, "").trim();
  return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]/.test(n) ? n[0].toLowerCase() + n.slice(1) : n;
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function lista(nombres) {
  try { return new Intl.ListFormat("es", { type: "conjunction" }).format(nombres); } catch { return nombres.join(", "); }
}
const elegir = (x, v) => (x && typeof x === "object" && !Array.isArray(x) ? x[v] : x);

/**
 * Avisos para la lista y las respuestas. items: los de evaluar() del motor ({ principio, clase, senales, dosisTotal });
 * hab: { alcohol, tabaco, cafe }; ctx: { edad, condiciones }. Devuelve [{ id, h, v, nivel, titulo, texto, implicados,
 * fuentes, ft }] por hábito y, dentro, de más a menos grave. El texto lleva los nombres en <b> (HTML escapado).
 */
export function evaluar(items = [], hab = {}, ctx = {}) {
  const cond = ctx.condiciones instanceof Set ? ctx.condiciones : new Set(ctx.condiciones || []);
  const ids = new Set(items.map((it) => it.principio?.id));
  const out = [];
  for (const r of REGLAS) {
    const v = hab?.[r.h];
    if (!v || !r.v.includes(v)) continue;
    const si = r.si || {};
    if (si.condicion && !cond.has(si.condicion)) continue;
    if (si.sinCondicion && cond.has(si.sinCondicion)) continue;
    if (si.edadMin != null && !(ctx.edad != null && ctx.edad >= si.edadMin)) continue;
    if (si.edadMax != null && ctx.edad != null && ctx.edad > si.edadMax) continue;
    if (si.sinPids && si.sinPids.some((p) => ids.has(p))) continue;
    let imp = [];
    if (si.senal || si.pids) {
      imp = items.filter((it) => (!si.senal || it.senales?.has(si.senal)) && (!si.pids || si.pids.includes(it.principio.id)) && !(si.excluir || []).includes(it.principio.id))
        .filter((it, i, a) => a.findIndex((x) => x.principio.id === it.principio.id) === i);
      if (!imp.length) continue;
    }
    let texto = elegir(r.texto, v) || "";
    for (const e of r.extras || []) if ((!e.v || e.v.includes(v)) && imp.some((it) => e.pids.includes(it.principio.id))) texto += e.texto;
    if (r.calc) texto += r.calc(imp, v);
    texto = esc(texto);
    if (texto.includes("{farmacos}")) {
      const inicio = texto.startsWith("{farmacos}");
      const nombres = imp.map((it, i) => { const n = corto(it.principio.nombre); return `<b>${esc(inicio && i === 0 ? n[0].toUpperCase() + n.slice(1) : n)}</b>`; });
      texto = texto.replace("{farmacos}", lista(nombres));
    }
    texto = texto.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (m, uno, varios) => (imp.length > 1 ? varios : uno));
    out.push({ id: r.id, h: r.h, v, nivel: elegir(r.nivel, v), titulo: elegir(r.titulo, v), texto, implicados: imp, fuentes: r.fuentes || [], ft: !!r.ft });
  }
  return out.sort((a, b) => ORDEN_H.indexOf(a.h) - ORDEN_H.indexOf(b.h) || ORDEN_N[b.nivel] - ORDEN_N[a.nivel]);
}

export const TXT = {
  es: { intro: "Lo que dicen las fichas técnicas y los estudios sobre sus hábitos y su medicación actual.", pregunta: "¿Bebe alcohol, fuma o toma bastante café? Responda tres preguntas en «Sus datos» y verá aquí cómo se cruzan con su medicación.", responder: "Responder ahora", cambiar: "Cambiar respuestas", tira: "Sus respuestas", sin: "Sin responder", ninguno: "Sin cruces destacados", ninguno_txt: "Con lo que ha respondido, no hay cruces destacados con su medicación actual. Si cambian sus hábitos o su medicación, vuelva a mirarlo.", fuente: "Fuente", g_alcohol: "Alcohol", g_tabaco: "Tabaco", g_cafe: "Café" },
  en: { intro: "What the summaries of product characteristics and the studies say about your habits and your current medicines.", pregunta: "Do you drink alcohol, smoke or have a lot of coffee? Answer three questions in “Your details” and you will see here how they interact with your medicines.", responder: "Answer now", cambiar: "Change answers", tira: "Your answers", sin: "Not answered", ninguno: "No notable interactions", ninguno_txt: "Based on your answers, there are no notable interactions with your current medicines. If your habits or your medicines change, check again.", fuente: "Source", g_alcohol: "Alcohol", g_tabaco: "Tobacco", g_cafe: "Coffee" },
  ca: { intro: "El que diuen les fitxes tècniques i els estudis sobre els seus hàbits i la seva medicació actual.", pregunta: "Beu alcohol, fuma o pren força cafè? Respongui tres preguntes a «Les seves dades» i veurà aquí com es creuen amb la seva medicació.", responder: "Respondre ara", cambiar: "Canviar les respostes", tira: "Les seves respostes", sin: "Sense respondre", ninguno: "Sense encreuaments destacats", ninguno_txt: "Amb el que ha respost, no hi ha encreuaments destacats amb la seva medicació actual. Si canvien els seus hàbits o la seva medicació, torni-ho a mirar.", fuente: "Font", g_alcohol: "Alcohol", g_tabaco: "Tabac", g_cafe: "Cafè" },
  gl: { intro: "O que din as fichas técnicas e os estudos sobre os seus hábitos e a súa medicación actual.", pregunta: "Bebe alcol, fuma ou toma bastante café? Responda tres preguntas en «Os seus datos» e verá aquí como se cruzan coa súa medicación.", responder: "Responder agora", cambiar: "Cambiar as respostas", tira: "As súas respostas", sin: "Sen responder", ninguno: "Sen cruzamentos destacados", ninguno_txt: "Co que respondeu, non hai cruzamentos destacados coa súa medicación actual. Se cambian os seus hábitos ou a súa medicación, volva miralo.", fuente: "Fonte", g_alcohol: "Alcol", g_tabaco: "Tabaco", g_cafe: "Café" },
  eu: { intro: "Fitxa teknikoek eta azterlanek zure ohiturei eta egungo botikei buruz diotena.", pregunta: "Alkohola edaten duzu, erretzen duzu edo kafe asko hartzen duzu? Erantzun hiru galdera «Zure datuak» atalean, eta hemen ikusiko duzu zure botikekin nola gurutzatzen diren.", responder: "Erantzun orain", cambiar: "Aldatu erantzunak", tira: "Zure erantzunak", sin: "Erantzun gabe", ninguno: "Gurutzaketa nabarmenik ez", ninguno_txt: "Zure erantzunen arabera, ez dago gurutzaketa nabarmenik zure egungo botikekin. Zure ohiturak edo botikak aldatzen badira, begiratu berriro.", fuente: "Iturria", g_alcohol: "Alkohola", g_tabaco: "Tabakoa", g_cafe: "Kafea" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}

const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
export const ICONO = {
  alcohol: SVG('<path d="M7 3h10l-.6 5.5a4.4 4.4 0 0 1-8.8 0L7 3z"/><path d="M7.4 7h9.2"/><path d="M12 13v7"/><path d="M8.5 21h7"/>'),
  tabaco: SVG('<rect x="2.5" y="13" width="14" height="4" rx="1"/><path d="M19 13v4"/><path d="M21.5 13v4"/><path d="M17.5 10c0-1.6 1.8-1.9 1.8-3.6S17.6 4.6 17.6 3"/>'),
  cafe: SVG('<path d="M4 9h12v4.5A5.5 5.5 0 0 1 10.5 19h-1A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M16 10.5h1.2a2.6 2.6 0 0 1 0 5.2H16"/><path d="M8 3.5c0 1.2 1 1.4 1 2.6M12 3.5c0 1.2 1 1.4 1 2.6"/>'),
};
/** Etiqueta de cada respuesta en la interfaz (claves de i18n.js, las mismas del formulario). */
export const CLAVE = { alcohol: { no: "hab.a_no", aveces: "hab.a_aveces", diario: "hab.a_diario" }, tabaco: { no: "hab.t_no", si: "hab.t_si", dejado: "hab.t_dejado" }, cafe: { poco: "hab.c_poco", medio: "hab.c_medio", mucho: "hab.c_mucho" } };

const CSS = `
.hab-intro { margin: 0 0 6px; color: var(--muted); font-size: .9rem; }
.hab-cab { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 6px; }
.hab-tira { display: flex; flex-wrap: wrap; gap: 8px; flex: 1 1 420px; margin: 0; padding: 0; list-style: none; }
.hab-p { display: flex; align-items: center; gap: 10px; flex: 1 1 150px; min-width: 0; margin: 0; padding: 9px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(165deg, var(--surface), var(--surface-2)); }
.hab-p svg, .hab-g svg { flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.hab-p svg { box-sizing: content-box; width: 22px; height: 22px; padding: 7px; border-radius: 50%; background: var(--accent-soft); color: var(--accent-deep); }
.hab-p > span { display: grid; gap: 1px; min-width: 0; }
.hab-p small { font: 600 .66rem/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.hab-p b { font-size: .9rem; line-height: 1.25; overflow-wrap: anywhere; }
.hab-p[data-v=""] { border-style: dashed; background: var(--surface); }
.hab-p[data-v=""] svg { background: var(--surface-2); color: var(--muted); }
.hab-p[data-v=""] b { color: var(--muted); font-weight: 600; }
.hab-g { display: flex; align-items: center; gap: 8px; margin: 16px 0 8px; font: 700 .74rem/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.hab-g svg { width: 18px; height: 18px; color: var(--accent-deep); }
.hab-g::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.hab-r footer { align-items: center; }
.hab-fuente { flex-basis: 100%; margin-top: 4px; font-size: .76rem; line-height: 1.4; color: var(--muted); }
.hab-fuente a, .hab-r .enlace-ft { color: var(--accent-deep); text-underline-offset: 2px; }
.hab-r .enlace-ft { font-size: .76rem; margin-right: 8px; }
.hab-vacio, .hab-bien { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin: 10px 0 0; padding: 12px 14px; border-radius: var(--r-md); font-size: .9rem; }
.hab-vacio { background: var(--surface-2); border: 1px dashed var(--line-strong); }
.hab-vacio p, .hab-bien p { flex: 1 1 260px; margin: 0; }
.hab-bien { background: var(--info-soft); color: var(--info-ink); }
:root[data-theme="contrast"] .hab-p { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .hab-r { animation: hab-entra .4s var(--ease-salida) both; }
  html:not(.pa-quieto) .hab-r:nth-of-type(2) { animation-delay: 50ms; }
  html:not(.pa-quieto) .hab-r:nth-of-type(n+3) { animation-delay: 100ms; }
}
@keyframes hab-entra { from { opacity: 0; transform: translateY(6px); } }
`;
function estilos() { if (!document.getElementById("hab-css")) { const st = document.createElement("style"); st.id = "hab-css"; st.textContent = CSS; document.head.append(st); } }

function fuenteHtml(f) {
  if (f.doi) return `<a href="https://doi.org/${esc(f.doi)}" target="_blank" rel="noopener">${esc(f.txt)}</a>`;
  if (f.url) return `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.txt)}</a>`;
  return esc(f.txt);
}
function tarjeta(a, c) {
  const etq = c.etiqueta || ((n) => n), glosar = c.glosar || ((s) => s);
  return `<article class="regla nivel-${a.nivel} hab-r" data-hab-r="${a.id}">
    <header><h4>${esc(a.titulo)}</h4><span class="nivel">${esc(etq(a.nivel))}</span></header>
    <p>${glosar(a.texto)}</p>
    <footer>${a.implicados.map((it) => `<span class="chip">${esc(it.principio.nombre)}</span>`).join("")}
      <span class="hab-fuente">${tx("fuente")}: ${a.fuentes.map(fuenteHtml).join(" · ")}${a.ft && c.ficha && a.implicados.length ? `<br>${a.implicados.map((it) => c.ficha(it.principio)).join("")}` : ""}</span></footer>
  </article>`;
}

/**
 * Pinta la sección en «cont». c: { items, habitos, ctx, t, etiqueta, glosar, ficha, responder }.
 * Devuelve { respondido, n, alerta, precaucion, info }.
 */
export function pintar(cont, c = {}) {
  estilos();
  const hab = c.habitos || {}, t = c.t || ((k) => k);
  const respondido = ORDEN_H.some((h) => hab[h]);
  const r = { respondido, n: 0, alerta: 0, precaucion: 0, info: 0 };
  if (!respondido) {
    cont.innerHTML = `<div class="hab-vacio"><p>${tx("pregunta")}</p><button type="button" class="btn sm hab-responder">${tx("responder")}</button></div>`;
  } else {
    const avisos = evaluar(c.items || [], hab, c.ctx || {});
    r.n = avisos.length;
    for (const a of avisos) r[a.nivel]++;
    const pill = (h) => `<li class="hab-p" data-h="${h}" data-v="${hab[h] || ""}">${ICONO[h]}<span><small>${tx("g_" + h)}</small><b>${esc(hab[h] ? t(CLAVE[h][hab[h]]) : tx("sin"))}</b></span></li>`;
    const grupos = ORDEN_H.filter((h) => avisos.some((a) => a.h === h))
      .map((h) => `<p class="hab-g">${ICONO[h]}${tx("g_" + h)}</p>${avisos.filter((a) => a.h === h).map((a) => tarjeta(a, c)).join("")}`).join("");
    cont.innerHTML = `<p class="hab-intro">${tx("intro")}</p>
      <div class="hab-cab"><ul class="hab-tira" aria-label="${esc(tx("tira"))}">${ORDEN_H.map(pill).join("")}</ul><button type="button" class="btn-sec sm hab-responder">${tx("cambiar")}</button></div>
      ${grupos || `<div class="hab-bien"><p>${tx("ninguno_txt")}</p></div>`}`;
  }
  cont.querySelector(".hab-responder")?.addEventListener("click", () => c.responder?.());
  return r;
}
