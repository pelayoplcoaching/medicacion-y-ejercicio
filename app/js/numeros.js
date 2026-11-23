/* Números antes de entrenar (segunda tanda de mejoras grandes, 17). Se carga bajo demanda (data-abre="numeros").
   La persona escribe los números que tenga hoy (glucosa, tensión, pulso en reposo, saturación, temperatura) y la aplicación
   le dice si adelante, hoy suave u hoy no, con el porqué de cada uno. Ninguno es obligatorio.
   CONTENIDO CLÍNICO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA. Lo que ya estaba revisado en la aplicación se reutiliza tal cual:
   la glucosa con insulina o sulfonilureas (regla de la base: 90, 125 y 250 mg/dL; bajada por debajo de 70), la tensión
   sistólica (90, 160 y 180 mmHg, las franjas de «Mis constantes»), la saturación con oxígeno (≥ 88–90 %) y la fiebre (24–48 h
   sin fiebre). Son NUEVOS y están por revisar: la tensión diastólica (100 y 110), el pulso en reposo (40, 50, 100 y 120),
   las décimas (37,5 °C), la saturación sin enfermedad respiratoria (92 %) y la redacción de todos los consejos.
   Los umbrales están en UMBRALES; los textos, en CONT (en español, como la base); la interfaz, en cinco idiomas. */
import { idioma } from "./i18n.js?v=202611231042";
import { ALARMA } from "./engine.js?v=202611231042";
import { tC } from "./tr.js?v=202611231042";

const TXT = {
  es: { titulo: "Números antes de entrenar", borrador: "Borrador pendiente de revisión clínica", intro: "Escriba los números que tenga hoy. No hace falta ninguno para entrenar: sirven si ya se los mide.", para_usted: "Le conviene", ver: "Ver qué toca hoy", borrar: "Borrar", falta: "Escriba al menos un número.", rango: "Revise este número: no parece posible.",
    glucosa: "Glucosa", ta: "Tensión", ta_s: "Sistólica (la alta)", ta_d: "Diastólica (la baja)", pulso: "Pulso en reposo", spo2: "Saturación de oxígeno", temp: "Temperatura",
    v_verde: "Adelante", v_ambar: "Hoy, suave", v_rojo: "Hoy no entrene", empezar: "Ir a mi sesión de hoy", suave: "Preparar una sesión corta y suave", preguntas: "Mis preguntas para la consulta", urgente: "Cuándo pedir ayuda urgente (112)", fuentes: "De dónde salen estos umbrales",
  },
  en: { titulo: "Numbers before training", borrador: "Draft pending clinical review", intro: "Enter the numbers you have today. None is needed to train: they help if you already measure them.", para_usted: "Worth checking", ver: "See what today calls for", borrar: "Clear", falta: "Enter at least one number.", rango: "Check this number: it does not look possible.",
    glucosa: "Glucose", ta: "Blood pressure", ta_s: "Systolic (upper)", ta_d: "Diastolic (lower)", pulso: "Resting pulse", spo2: "Oxygen saturation", temp: "Temperature",
    v_verde: "Go ahead", v_ambar: "Easy today", v_rojo: "No training today", empezar: "Go to today's session", suave: "Set up a short, easy session", preguntas: "My questions for the appointment", urgente: "When to get urgent help (112)", fuentes: "Where these thresholds come from",
  },
  ca: { titulo: "Números abans d'entrenar", borrador: "Esborrany pendent de revisió clínica", intro: "Escriviu els números que tingueu avui. No en cal cap per entrenar: serveixen si ja us els mesureu.", para_usted: "Us convé", ver: "Veure què toca avui", borrar: "Esborrar", falta: "Escriviu almenys un número.", rango: "Reviseu aquest número: no sembla possible.",
    glucosa: "Glucosa", ta: "Pressió", ta_s: "Sistòlica (l'alta)", ta_d: "Diastòlica (la baixa)", pulso: "Pols en repòs", spo2: "Saturació d'oxigen", temp: "Temperatura",
    v_verde: "Endavant", v_ambar: "Avui, suau", v_rojo: "Avui no entreneu", empezar: "Anar a la meva sessió d'avui", suave: "Preparar una sessió curta i suau", preguntas: "Les meves preguntes per a la consulta", urgente: "Quan demanar ajuda urgent (112)", fuentes: "D'on surten aquests llindars",
  },
  gl: { titulo: "Números antes de adestrar", borrador: "Borrador pendente de revisión clínica", intro: "Escriba os números que teña hoxe. Non fai falta ningún para adestrar: serven se xa os mide.", para_usted: "Convenlle", ver: "Ver que toca hoxe", borrar: "Borrar", falta: "Escriba polo menos un número.", rango: "Revise este número: non parece posible.",
    glucosa: "Glicosa", ta: "Tensión", ta_s: "Sistólica (a alta)", ta_d: "Diastólica (a baixa)", pulso: "Pulso en repouso", spo2: "Saturación de osíxeno", temp: "Temperatura",
    v_verde: "Adiante", v_ambar: "Hoxe, suave", v_rojo: "Hoxe non adestre", empezar: "Ir á miña sesión de hoxe", suave: "Preparar unha sesión curta e suave", preguntas: "As miñas preguntas para a consulta", urgente: "Cando pedir axuda urxente (112)", fuentes: "De onde saen estes limiares",
  },
  eu: { titulo: "Zenbakiak entrenatu aurretik", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Idatzi gaur dituzun zenbakiak. Bat ere ez da behar entrenatzeko: neurtzen badituzu balio dute.", para_usted: "Komeni zaizu", ver: "Ikusi gaur zer dagokion", borrar: "Ezabatu", falta: "Idatzi gutxienez zenbaki bat.", rango: "Berrikusi zenbaki hau: ez dirudi posible.",
    glucosa: "Glukosa", ta: "Tentsioa", ta_s: "Sistolikoa (altua)", ta_d: "Diastolikoa (baxua)", pulso: "Pultsua atsedenean", spo2: "Oxigeno-saturazioa", temp: "Tenperatura",
    v_verde: "Aurrera", v_ambar: "Gaur, leun", v_rojo: "Gaur ez entrenatu", empezar: "Joan gaurko saiora", suave: "Prestatu saio labur eta leun bat", preguntas: "Nire galderak kontsultarako", urgente: "Noiz eskatu premiazko laguntza (112)", fuentes: "Nondik datozen atalase hauek",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Umbrales. «rev: true» = ya estaba revisado en la aplicación; «rev: false» = nuevo, por revisar. */
export const UMBRALES = {
  glucosa: { muy_baja: 54, baja: 70, justa: 90, aerobico: 125, alta: 250, rev: true }, // mg/dL · 54 = hipoglucemia de nivel 2 (ADA), añadido tras la validación externa del 23/11/2026 · regla de la insulina de la base y franjas de «Mis constantes»
  ta_s: { baja: 90, media: 160, alta: 180, rev: true }, // mmHg · franjas de «Mis constantes»
  ta_d: { media: 100, alta: 110, rev: false }, // mmHg
  pulso: { muy_bajo: 40, bajo: 50, alto: 100, muy_alto: 120, rev: false }, // lpm en reposo
  spo2: { muy_baja: 88, baja: 92, rev: false }, // % · el 88 es el de la regla del oxígeno de la base (≥ 88–90 %); el 92, nuevo
  temp: { decimas: 37.5, fiebre: 38, rev: false }, // °C · «con fiebre no entrene» ya estaba; las cifras son nuevas
};
/** Lo que se acepta en cada casilla (fuera de esto se pide revisar el número). */
export const RANGOS = { glucosa: [20, 600], ta_s: [60, 260], ta_d: [30, 160], pulso: [25, 220], spo2: [60, 100], temp: [35, 42] };
export const UNIDADES = tC({ glucosa: "mg/dL", ta_s: "mmHg", ta_d: "mmHg", pulso: "lpm", spo2: "%", temp: "°C" }, true);

/* Textos clínicos (en español). Los marcados con (R) reproducen una regla ya revisada de la aplicación. */
export const CONT = {
  veredicto: { verde: "Con estos números puede hacer su sesión de hoy.", ambar: "Hoy toca una sesión más suave. Mire el porqué en cada número.", rojo: "Hoy no entrene. Mire qué hacer en cada número." },
  nota: "Los números no lo dicen todo: si se encuentra mal, no entrene aunque salgan bien. Y si le salen bien pero no son los suyos de siempre, coméntelo.",
  g_muy_baja: "Muy baja. Trátela ya: tome 15–20 g de azúcar de absorción rápida (un vaso de zumo o de refresco con azúcar, o 3 sobres de azúcar) y repita la medida a los 15 minutos. Hoy no entrene; si no se recupera o se encuentra mal, pida ayuda médica.",
  g_baja_hipo: "Es una bajada de azúcar. Tome 15–20 g de azúcar de absorción rápida (un vaso de zumo o de refresco con azúcar, o 3 sobres de azúcar) y repita la medida a los 15 minutos; si sigue por debajo de 70, repita la toma. No empiece hasta pasar de 90 y encontrarse bien. Si baja de 54 o no se recupera, hoy no entrene y consulte.", // (R) + cierre nuevo
  g_justa_hipo: "Justa para empezar. Tome 10–20 g de hidratos de absorción rápida y espere a que suba antes de empezar.", // (R)
  g_bien_125: "Bien para moverse. Si usa insulina o una sulfonilurea y va a hacer ejercicio aeróbico de más de media hora, tome antes unos 10 g de hidratos.", // (R)
  g_bien: "Bien para moverse: puede empezar.", // (R)
  g_alta_hipo: "Alta. Si usa insulina o toma una «-gliflozina» y puede medirse las cetonas, mídalas. Con cetonas, vómitos, dolor de barriga o malestar, no entrene y consulte hoy. Sin cetonas y encontrándose bien, sesión suave y beba agua.", // (R) + cierre nuevo
  g_baja: "Baja. Coma algo antes de empezar y, si puede, repita la medida. Si nota temblor, sudor frío o debilidad, espere a que pase.",
  g_alta: "Alta. Si se encuentra bien, sesión suave y beba agua; con malestar, mucha sed o náuseas, no entrene y consulte.",
  t_alta: "Demasiado alta para entrenar hoy. Repose 5 minutos sentado y repita la medida; si sigue igual, no entrene y consulte. Si además tiene dolor de pecho, falta de aire, dolor de cabeza muy fuerte, visión borrosa o debilidad en un lado del cuerpo, llame al 112.",
  t_media: "Alta. Hoy, solo actividad ligera o moderada, sin esfuerzos máximos ni aguantar el aire.",
  t_baja: "Baja. Si se nota mareado o débil, hoy no. Si se encuentra bien, empiece sentado, levántese despacio y beba agua.",
  t_bien: "Bien para moverse.",
  p_muy_alto: "Muy rápido para estar en reposo. Repose 10 minutos y repita; si sigue en 120 o más, no entrene hoy y consulte. Si además nota dolor de pecho, falta de aire o mareo, llame al 112.",
  p_alto: "Más rápido de lo normal en reposo (puede ser por fiebre, falta de agua, nervios o café). Hoy, suave; si no es habitual en usted, coméntelo.",
  p_bien: "Bien para moverse.",
  p_bajo_bb: "Lento, lo esperable con su medicación. Si no se marea, puede empezar.",
  p_bajo: "Lento. Si es su pulso de siempre y se encuentra bien, puede entrenar suave; si es nuevo o se marea, consulte.",
  p_muy_bajo: "Muy lento. No entrene hoy y consulte, salvo que su médico ya conozca ese pulso y usted se encuentre bien. Con mareo, desmayo o dolor de pecho, llame al 112.",
  s_muy_baja: "Baja. Compruebe que el dedo está caliente y sin esmalte y repita. Si sigue por debajo de 88 %, no entrene y consulte hoy, salvo que sea su cifra de siempre y su médico la conozca. Si le falta el aire en reposo o tiene los labios azulados, llame al 112.",
  s_baja_resp: "En su límite. Si es su cifra de siempre, sesión suave por intervalos cortos, con el oxígeno pautado si lo tiene; pare si baja del valor que le indicó su neumólogo.",
  s_baja: "Más baja de lo normal. Repita la medida con el dedo caliente y sin esmalte; si se confirma, hoy no entrene y consulte hoy mismo. Si le falta el aire, llame al 112.",
  s_bien: "Bien para moverse.",
  f_fiebre: "Fiebre. No entrene: descanse hasta llevar 24–48 horas sin fiebre y retome a intensidad baja.", // (R)
  f_decimas: "Décimas. Si se encuentra bien, como mucho un paseo suave; si la temperatura sube o aparece malestar, descanse.",
  f_bien: "Sin fiebre.",
};
export const FUENTES = [
  { txt: "Glucosa: ADA Standards of Care 2024 (ejercicio) y consenso de ejercicio en diabetes tipo 1 (Riddell 2017, Lancet Diabetes Endocrinol)", doi: "10.1016/S2213-8587(17)30014-1" },
  { txt: "Tensión y pulso: criterio de la aplicación, más prudente que el que se atribuye al ACSM (no hacer ejercicio con más de 200/110 mmHg en reposo)" },
  { txt: "Saturación: criterio de la aplicación para el reposo; durante el esfuerzo, las guías de rehabilitación respiratoria piden mantenerla por encima de 88–90 %" },
  { txt: "Fiebre: regla de la aplicación (con infección activa y fiebre, no entrenar; retomar tras 24–48 h sin fiebre)" },
];

const ORDEN = { verde: 1, ambar: 2, rojo: 3 };
/** Evalúa los números. v = { glucosa, ta_s, ta_d, pulso, spo2, temp } (los que haya); d = { hipo, bb, resp }.
    Devuelve { nivel: "verde" | "ambar" | "rojo" | null, lineas: [{ campo, nivel, clave }] } (una línea por número; la tensión, una sola). */
export function evaluar(v = {}, d = {}) {
  const U = UMBRALES, L = [], hay = (k) => v[k] != null && v[k] !== "" && Number.isFinite(Number(v[k]));
  const pon = (campo, nivel, clave) => L.push({ campo, nivel, clave });
  if (hay("glucosa")) { const g = Number(v.glucosa), u = U.glucosa;
    if (g < u.muy_baja) pon("glucosa", "rojo", "g_muy_baja");
    else if (d.hipo) g < u.baja ? pon("glucosa", "rojo", "g_baja_hipo") : g < u.justa ? pon("glucosa", "ambar", "g_justa_hipo") : g <= u.aerobico ? pon("glucosa", "verde", "g_bien_125") : g <= u.alta ? pon("glucosa", "verde", "g_bien") : pon("glucosa", "ambar", "g_alta_hipo");
    else g < u.baja ? pon("glucosa", "ambar", "g_baja") : g <= u.alta ? pon("glucosa", "verde", "g_bien") : pon("glucosa", "ambar", "g_alta"); }
  if (hay("ta_s") || hay("ta_d")) { const s = hay("ta_s") ? Number(v.ta_s) : null, di = hay("ta_d") ? Number(v.ta_d) : null;
    if ((s != null && s >= U.ta_s.alta) || (di != null && di >= U.ta_d.alta)) pon("ta", "rojo", "t_alta");
    else if ((s != null && s >= U.ta_s.media) || (di != null && di >= U.ta_d.media)) pon("ta", "ambar", "t_media");
    else if (s != null && s < U.ta_s.baja) pon("ta", "ambar", "t_baja");
    else pon("ta", "verde", "t_bien"); }
  if (hay("pulso")) { const p = Number(v.pulso), u = U.pulso;
    p >= u.muy_alto ? pon("pulso", "rojo", "p_muy_alto") : p >= u.alto ? pon("pulso", "ambar", "p_alto") : p < u.muy_bajo ? pon("pulso", "rojo", "p_muy_bajo") : p < u.bajo ? (d.bb ? pon("pulso", "verde", "p_bajo_bb") : pon("pulso", "ambar", "p_bajo")) : pon("pulso", "verde", "p_bien"); }
  if (hay("spo2")) { const s = Number(v.spo2), u = U.spo2;
    s < u.muy_baja ? pon("spo2", "rojo", "s_muy_baja") : s < u.baja ? (d.resp ? pon("spo2", "ambar", "s_baja_resp") : pon("spo2", "rojo", "s_baja")) : pon("spo2", "verde", "s_bien"); }
  if (hay("temp")) { const x = Number(v.temp), u = U.temp;
    x >= u.fiebre ? pon("temp", "rojo", "f_fiebre") : x >= u.decimas ? pon("temp", "ambar", "f_decimas") : pon("temp", "verde", "f_bien"); }
  const nivel = L.reduce((m, l) => (ORDEN[l.nivel] > (ORDEN[m] || 0) ? l.nivel : m), null);
  return { nivel, lineas: L };
}
/** ¿Está el número dentro de lo posible? */
export const valido = (k, x) => x != null && Number.isFinite(Number(x)) && Number(x) >= RANGOS[k][0] && Number(x) <= RANGOS[k][1];
/** Los números que conviene mirar según la medicación y la situación: d = { hipo, diabetes, hta, hipotension, resp, ic }. */
export function recomendados(d = {}) {
  const r = [];
  if (d.hipo || d.diabetes) r.push("glucosa");
  if (d.hta || d.hipotension) r.push("ta");
  if (d.resp || d.ic) r.push("spo2");
  return r;
}

const CLAVE = "medex.numeros", CAMPOS = ["glucosa", "ta_s", "ta_d", "pulso", "spo2", "temp"];
/** Lo escrito hoy (para no tener que repetirlo si se vuelve a abrir); lo de otro día no se recupera. */
export function leer(hoy) { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null"); return o && o.fecha === hoy && o.v && typeof o.v === "object" ? Object.fromEntries(CAMPOS.filter((k) => valido(k, o.v[k])).map((k) => [k, Number(o.v[k])])) : {}; } catch { return {}; } }
const guardar = (hoy, v) => { try { if (Object.keys(v).length) localStorage.setItem(CLAVE, JSON.stringify({ fecha: hoy, v })); else localStorage.removeItem(CLAVE); } catch {} };

const CSS = `
.nm-dlg { width: min(720px, calc(100vw - 16px)); }
.nm-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.nm-intro { margin: 0 0 12px; color: var(--muted); }
.nm-campos { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.nm-campo { display: grid; gap: 4px; align-content: start; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.nm-campo.rec { border-color: var(--accent); }
.nm-campo.doble { grid-column: span 2; }
.nm-campo > b { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: .92rem; }
.nm-campo em { padding: 1px 8px; border-radius: 999px; border: 1px solid var(--accent); font-family: var(--mono); font-size: .62rem; font-style: normal; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-deep, var(--accent)); }
.nm-par { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.nm-campo label { display: grid; gap: 3px; font-size: .78rem; color: var(--muted); }
.nm-in { display: flex; align-items: center; gap: 6px; }
.nm-in input { width: 100%; min-width: 0; min-height: 44px; padding: 6px 10px; border: 1.5px solid var(--line-strong); border-radius: var(--r-sm); background: var(--surface); color: var(--fg); font: inherit; font-family: var(--mono); font-size: 1.15rem; font-weight: 700; }
.nm-in input[aria-invalid="true"] { border-color: var(--alerta); }
.nm-in span { font-size: .8rem; color: var(--muted); white-space: nowrap; }
.nm-err { margin: 0; font-size: .78rem; color: var(--alerta-ink); }
.nm-dlg input:focus-visible, .nm-dlg button:focus-visible, .nm-dlg summary:focus-visible, .nm-dlg a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.nm-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }
.nm-ver { margin: 16px 0 0; padding: 14px; border-radius: var(--r-md); border: 1.5px solid; }
.nm-ver[data-n="verde"] { border-color: var(--info); background: var(--info-soft); color: var(--info-ink); }
.nm-ver[data-n="ambar"] { border-color: var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); }
.nm-ver[data-n="rojo"] { border-color: var(--alerta); background: var(--alerta-soft); color: var(--alerta-ink); }
.nm-ver > b { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; }
.nm-ver > b i { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; border: 2px solid currentColor; font-style: normal; font-size: .9rem; }
.nm-ver > p { margin: 4px 0 0; }
.nm-lineas { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 8px; }
.nm-lineas li { display: grid; grid-template-columns: 12px minmax(0, 1fr); gap: 10px; padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); }
.nm-lineas li::before { content: ""; width: 12px; height: 12px; margin-top: 5px; border-radius: 50%; background: var(--info); }
.nm-lineas li[data-n="ambar"]::before { background: var(--precaucion); border-radius: 2px; }
.nm-lineas li[data-n="rojo"]::before { background: var(--alerta); border-radius: 0; rotate: 45deg; }
.nm-lineas b { display: block; } .nm-lineas span span { font-family: var(--mono); font-weight: 700; }
.nm-nota { margin: 12px 0 0; font-size: .88rem; color: var(--muted); }
.nm-det { margin: 12px 0 0; border: 1px solid var(--line); border-radius: var(--r-md); }
.nm-det summary { padding: 10px 12px; cursor: pointer; font-weight: 700; }
.nm-det ul { margin: 0; padding: 0 12px 12px 30px; display: grid; gap: 4px; font-size: .88rem; }
.nm-det a { color: var(--accent-deep, var(--accent)); }
@media (max-width: 520px) { .nm-campos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (forced-colors: active) { .nm-ver { border-width: 3px; } }
/* 870-871: el veredicto con un semaforo dibujado y las casillas que toman el color de su resultado */
.nm-ver { position: relative; padding-left: 58px; }
.nm-ver::before { content: ""; position: absolute; left: 14px; top: 14px; width: 28px; height: 68px; border-radius: 14px; background:
  radial-gradient(circle at 50% 14px, var(--nm-r, color-mix(in srgb, currentColor 22%, transparent)) 8px, transparent 9px),
  radial-gradient(circle at 50% 34px, var(--nm-a, color-mix(in srgb, currentColor 22%, transparent)) 8px, transparent 9px),
  radial-gradient(circle at 50% 54px, var(--nm-v, color-mix(in srgb, currentColor 22%, transparent)) 8px, transparent 9px),
  color-mix(in srgb, currentColor 12%, var(--surface)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, currentColor 45%, transparent); }
.nm-ver[data-n="verde"] { --nm-v: var(--info); } .nm-ver[data-n="ambar"] { --nm-a: var(--precaucion); } .nm-ver[data-n="rojo"] { --nm-r: var(--alerta); }
.nm-ver > b i { display: none; }
.nm-ver { min-height: 96px; }
@media (forced-colors: active) { .nm-ver::before { display: none; } .nm-ver { padding-left: 14px; } .nm-ver > b i { display: grid; } }
.nm-campo[data-n] { border-width: 1.5px; }
.nm-campo[data-n="verde"] { border-color: var(--info); background: linear-gradient(var(--info-soft), var(--surface) 62%); }
.nm-campo[data-n="ambar"] { border-color: var(--precaucion); background: linear-gradient(var(--precaucion-soft), var(--surface) 62%); }
.nm-campo[data-n="rojo"] { border-color: var(--alerta); background: linear-gradient(var(--alerta-soft), var(--surface) 62%); }
.nm-campo[data-n] { position: relative; }
.nm-campo[data-n] > b { padding-right: 18px; }
.nm-campo[data-n]::after { content: ""; position: absolute; right: 12px; top: 14px; width: 10px; height: 10px; border-radius: 50%; background: var(--info); }
.nm-campo[data-n="ambar"]::after { background: var(--precaucion); border-radius: 2px; }
.nm-campo[data-n="rojo"]::after { background: var(--alerta); border-radius: 0; rotate: 45deg; }
`;

let dlg = null, A = null, V = {}, D = {}, visto = false;
const cu = () => dlg.querySelector("#nm-cuerpo");
/** Lo que la aplicación sabe (qué números conviene mirar y cómo leerlos). */
export function contexto(api) {
  const e = api.estado, conds = new Set(e.condiciones || []); let sen = new Set(); try { sen = e.meds.length ? new Set(api.res().items.flatMap((it) => [...it.senales])) : sen; } catch {}
  return { hipo: sen.has("hipoglucemia"), diabetes: conds.has("diabetes"), bb: sen.has("bradicardia") || sen.has("fc_no_valida"), hta: conds.has("hipertension") || sen.has("hipertension"), hipotension: sen.has("hipotension"), resp: conds.has("epoc_asma") || conds.has("oxigeno"), ic: conds.has("insuficiencia_cardiaca") };
}
const fmt = (k, x) => (k === "temp" ? String(x).replace(".", ",") : String(x));
function leerCampos() {
  const v = {}, malos = [];
  for (const k of CAMPOS) { const i = dlg.querySelector(`#nm-${k}`), t = (i.value || "").trim().replace(",", "."); if (!t) { i.removeAttribute("aria-invalid"); continue; } if (valido(k, t)) { v[k] = Number(t); i.removeAttribute("aria-invalid"); } else { malos.push(k); i.setAttribute("aria-invalid", "true"); } }
  return { v, malos };
}
function crear() {
  if (!document.getElementById("nm-css")) { const st = document.createElement("style"); st.id = "nm-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "numeros"; dlg.className = "ficha alta nm-dlg"; dlg.setAttribute("aria-labelledby", "nm-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="nm-cab-t"></p><button type="button" class="btn-sec sm" id="nm-cerrar"></button></div><div class="ficha-cuerpo" id="nm-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#nm-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("submit", (ev) => { ev.preventDefault(); ver(); });
  dlg.addEventListener("input", (ev) => ev.target.closest?.(".nm-campo")?.removeAttribute("data-n")); // al cambiar un número, su casilla deja el color del veredicto anterior
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-nm]"); if (!b) return;
    if (b.dataset.nm === "borrar") { V = {}; visto = false; guardar(A.hoyISO(), V); pintar(); dlg.querySelector("#nm-glucosa, #nm-ta_s")?.focus(); }
    else if (b.dataset.nm === "empezar") { dlg.close(); const e = document.querySelector("#btn-empezar-hoy"); if (e && !e.hidden) e.click(); else A.irTab("plan"); }
  });
}
function ver() {
  const { v, malos } = leerCampos(), err = dlg.querySelector("#nm-err");
  if (malos.length || !Object.keys(v).length) { // con un número imposible (o sin ninguno) no se deja a la vista un veredicto anterior
    err.textContent = tx(malos.length ? "rango" : "falta"); dlg.querySelector("#nm-res").innerHTML = ""; visto = false;
    dlg.querySelector(malos.length ? `#nm-${malos[0]}` : ".nm-in input").focus(); return;
  }
  V = v; visto = true; guardar(A.hoyISO(), V); pintar();
  const r = dlg.querySelector("#nm-ver"); r?.scrollIntoView({ block: "nearest" }); r?.focus();
}
function resultado() {
  const r = evaluar(V, D); if (!r.nivel) return "";
  const nombre = (c) => (c === "ta" ? tx("ta") : tx(c)), valor = (c) => (c === "ta" ? [V.ta_s, V.ta_d].filter((x) => x != null).join("/") + " mmHg" : `${fmt(c, V[c])} ${UNIDADES[c]}`);
  const icono = { verde: "✓", ambar: "!", rojo: "×" }[r.nivel];
  return `<section class="nm-ver" id="nm-ver" data-n="${r.nivel}" tabindex="-1" aria-live="polite"><b><i aria-hidden="true">${icono}</i>${tx("v_" + r.nivel)}</b><p>${CONT.veredicto[r.nivel]}</p></section>
    <ul class="nm-lineas" id="nm-lineas">${r.lineas.map((l) => `<li data-n="${l.nivel}" data-c="${l.campo}" data-k="${l.clave}"><span><b>${nombre(l.campo)} · <span>${valor(l.campo)}</span> <span class="sr-only">(${tx("v_" + l.nivel)})</span></b>${CONT[l.clave]}</span></li>`).join("")}</ul>
    <div class="nm-acc">${r.nivel === "verde" ? `<button type="button" class="btn" data-nm="empezar">${tx("empezar")}</button>` : r.nivel === "ambar" ? `<button type="button" class="btn" data-abre="rato">${tx("suave")}</button>` : `<button type="button" class="btn-sec" data-abre="preguntas">${tx("preguntas")}</button>`}</div>
    <p class="nm-nota">${CONT.nota}</p>`;
}
function pintar() {
  dlg.querySelector("#nm-cab-t").textContent = tx("titulo");
  const rec = recomendados(D);
  const casilla = (k, etiqueta, nombre) => `<label for="nm-${k}">${etiqueta}<span class="nm-in"><input type="text" inputmode="decimal" id="nm-${k}" autocomplete="off" aria-label="${nombre} (${UNIDADES[k]})" value="${V[k] != null ? fmt(k, V[k]) : ""}"><span aria-hidden="true">${UNIDADES[k]}</span></span></label>`;
  const peor = { verde: 0, ambar: 1, rojo: 2 }, niv = {}; // tras el veredicto, cada casilla toma el color de su línea (la peor, si tiene dos)
  if (visto) for (const l of evaluar(V, D).lineas) if (!(l.campo in niv) || peor[l.nivel] > peor[niv[l.campo]]) niv[l.campo] = l.nivel;
  const campo = (id, cuerpo, doble = false) => `<div class="nm-campo${rec.includes(id) ? " rec" : ""}${doble ? " doble" : ""}" data-c="${id}"${niv[id] ? ` data-n="${niv[id]}"` : ""}><b>${tx(id)}${rec.includes(id) ? `<em>${tx("para_usted")}</em>` : ""}</b>${cuerpo}</div>`;
  const bloques = { glucosa: campo("glucosa", casilla("glucosa", "", tx("glucosa"))), ta: campo("ta", `<div class="nm-par">${casilla("ta_s", tx("ta_s"), `${tx("ta")}: ${tx("ta_s")}`)}${casilla("ta_d", tx("ta_d"), `${tx("ta")}: ${tx("ta_d")}`)}</div>`, true), pulso: campo("pulso", casilla("pulso", "", tx("pulso"))), spo2: campo("spo2", casilla("spo2", "", tx("spo2"))), temp: campo("temp", casilla("temp", "", tx("temp"))) };
  const orden = [...rec, ...["glucosa", "ta", "pulso", "spo2", "temp"].filter((k) => !rec.includes(k))];
  cu().innerHTML = `<p class="nm-borrador">${tx("borrador")}</p><p class="nm-intro">${tx("intro")}</p>
    <form id="nm-form" novalidate><div class="nm-campos">${orden.map((k) => bloques[k]).join("")}</div><p class="nm-err" id="nm-err" role="alert"></p>
    <div class="nm-acc"><button type="submit" class="btn">${tx("ver")}</button>${Object.keys(V).length ? `<button type="button" class="btn-sec" data-nm="borrar">${tx("borrar")}</button>` : ""}</div></form>
    <div id="nm-res">${visto ? resultado() : ""}</div>
    <details class="nm-det"><summary>${tx("urgente")}</summary><ul>${ALARMA.map((x) => `<li>${x}</li>`).join("")}</ul></details>
    <details class="nm-det"><summary>${tx("fuentes")}</summary><ul>${FUENTES.map((f) => `<li>${f.txt}${f.doi ? `. <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : ""}</li>`).join("")}</ul></details>`;
}
/** Abre la ventana. */
export function abrir(api) {
  A = api;
  if (!dlg) crear();
  D = contexto(api); V = leer(api.hoyISO()); visto = Object.keys(V).length > 0;
  dlg.querySelector("#nm-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#nm-cerrar").focus();
}
