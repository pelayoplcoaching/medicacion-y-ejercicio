/* Ilustraciones de los ejercicios (v1.0): trazo lineal, 96×96, pensadas para verse grandes en pantalla y en papel.
   Figura en trazo grueso; apoyos (silla, pared, banda) en trazo fino; flecha de movimiento en el color de acento. Sin texto dentro del dibujo. */

const cab = (x, y) => `<circle class="fig" cx="${x}" cy="${y}" r="6"/>`;
const fig = (d) => `<path class="fig" d="${d}"/>`;
const prop = (d) => `<path class="prop" d="${d}"/>`;
const suelo = (x1 = 8, x2 = 88) => `<path class="prop" d="M${x1} 84H${x2}"/>`;
/** Flecha recta de (x1,y1) a (x2,y2) con punta. */
function flecha(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 5;
  const p = (ang) => `${(x2 - L * Math.cos(a + ang)).toFixed(1)} ${(y2 - L * Math.sin(a + ang)).toFixed(1)}`;
  return `<path class="mov" d="M${x1} ${y1}L${x2} ${y2}M${p(0.5)}L${x2} ${y2}L${p(-0.5)}"/>`;
}
/** Flecha curva (arco) entre dos puntos. */
const arco = (x1, y1, x2, y2, r, sweep = 1) => {
  const a = Math.atan2(y2 - y1, x2 - x1) + (sweep ? -0.9 : 0.9), L = 5;
  const p = (ang) => `${(x2 - L * Math.cos(a + ang)).toFixed(1)} ${(y2 - L * Math.sin(a + ang)).toFixed(1)}`;
  return `<path class="mov" d="M${x1} ${y1}A${r} ${r} 0 0 ${sweep} ${x2} ${y2}M${p(0.5)}L${x2} ${y2}L${p(-0.5)}"/>`;
};
const silla = (x) => prop(`M${x} 34v50M${x} 58h20v26M${x + 20} 58v26`); // respaldo a la izquierda, asiento hacia la derecha

export const PICTOS = {
  // levantarse de la silla / sentadilla a la silla
  silla: `${suelo()}${silla(14)}${cab(52, 20)}${fig("M50 26l-6 26M44 52l10 10-4 22M44 52l-2 14 2 18M50 34l18 6")}${flecha(76, 62, 76, 40)}`,
  sentadilla: `${suelo()}${silla(14)}${cab(56, 22)}${fig("M54 28l-8 24M46 52l12 8-2 24M46 52l-4 12 4 20M52 36l22 2")}${flecha(84, 42, 84, 62)}${flecha(84, 62, 84, 42).replace('class="mov"', 'class="mov" opacity=".45"')}`,
  // elevación de talones con apoyo
  talones: `${suelo()}${prop("M22 40v44M16 40h12")}${cab(50, 14)}${fig("M50 20v34M50 30l-24 12M50 30l10 10M47 54v20l10 10M53 54v20l10 10")}${flecha(38, 82, 38, 68)}`,
  // extensión de rodilla sentado
  rodilla: `${suelo()}${prop("M28 24v60M28 52h30M30 52v32M56 52v32")}${cab(40, 16)}${fig("M40 22v30M40 52h18M58 52l22-6 6-2M58 52v30M40 32l12 10")}${arco(70, 68, 82, 50, 16, 0)}`,
  // flexión de brazos con botella
  brazo: `${suelo()}${cab(48, 14)}${fig("M48 20v32M48 52l-6 32M48 52l8 32M48 28l-8 16M48 28l8 14 2-12")}<rect class="prop" x="55" y="22" width="7" height="11" rx="2"/>${arco(72, 44, 64, 28, 12, 0)}`,
  // puente de glúteo
  puente: `${suelo()}${cab(14, 74)}${fig("M20 70l26-18 16 6 2 26M62 58l-4 26M22 72l18 10")}${flecha(46, 42, 46, 30)}`,
  // empuje en pared
  pared: `${suelo()}${prop("M80 8v76")}${cab(62, 22)}${fig("M58 30l-12 26-8 28M46 56l-4 28M58 32l10 2 10 2M60 36l8 4 10 0")}${flecha(40, 44, 54, 44)}`,
  // remo con banda
  remo: `${suelo()}${prop("M84 12v72")}${cab(32, 16)}${fig("M32 22v30M32 52l-6 32M32 52l8 32M32 30l-10 12 14 4M32 30l-6 14 12 2")}<path class="prop" stroke-dasharray="3 3" d="M38 46L84 40"/>${flecha(66, 54, 48, 54)}`,
  // bisagra de cadera
  bisagra: `${suelo()}${cab(80, 36)}${fig("M74 38L48 52l-4 32M48 52l6 32M62 46l2 20M62 46l-2 20")}${flecha(40, 50, 28, 50)}`,
  // press de hombro ligero
  hombro: `${suelo()}${cab(48, 20)}${fig("M48 26v28M48 54l-6 30M48 54l6 30M48 32l-10-6v-14M48 32l10-6v-14")}<rect class="prop" x="34" y="4" width="8" height="10" rx="2"/><rect class="prop" x="54" y="4" width="8" height="10" rx="2"/>${flecha(76, 32, 76, 12)}`,
  // apoyo sobre un pie
  unpie: `${suelo()}${prop("M20 42v42M14 42h12")}${cab(50, 14)}${fig("M50 20v32M50 52v32M50 52l12 10-2 14M50 28l-26 14M50 28l10 12")}`,
  // marcha talón-punta (vista desde arriba)
  talonpunta: `<path class="prop" d="M48 6v84"/><ellipse class="fig" cx="48" cy="22" rx="6" ry="10"/><ellipse class="fig" cx="48" cy="48" rx="6" ry="10"/><ellipse class="fig" cx="48" cy="74" rx="6" ry="10"/><circle class="fig" cx="48" cy="10" r="2"/><circle class="fig" cx="48" cy="36" r="2"/><circle class="fig" cx="48" cy="62" r="2"/>`,
  // giros lentos y alcances
  giro: `${suelo()}${cab(48, 20)}${fig("M48 26v28M48 54l-8 30M48 54l8 30M48 32l18-14M48 32l-18 2")}${arco(22, 40, 74, 40, 30, 1)}`,
  // marcha / caminar
  marcha: `${suelo()}${cab(50, 14)}${fig("M50 20l-4 30M46 50l-12 16-4 18M46 50l12 16 8 18M50 28l12 12M50 28l-14 14")}<path class="mov" d="M14 40h12M10 50h12M14 60h10"/>`,
  // bici estática
  bici: `${suelo()}<circle class="prop" cx="24" cy="70" r="12"/><circle class="prop" cx="72" cy="70" r="12"/>${prop("M24 70l16-26h18l14 26M40 44l-6-8h-6M58 44v-6h8M44 70h12M52 70l4-10")}${cab(52, 18)}${fig("M52 24l-8 22 8 14 2 10M44 46l12 10M50 32l16 4")}`,
  // estiramiento
  estirar: `${suelo()}${cab(48, 20)}${fig("M48 26v28M48 54l-7 30M48 54l7 30M48 32l-10-14M48 32l10-14")}`,
  // respiración / enfriamiento
  respirar: `${suelo()}${cab(48, 20)}${fig("M48 26v28M48 54l-7 30M48 54l7 30M48 34l-14 4M48 34l14 4")}${arco(22, 30, 30, 16, 10, 1)}${arco(74, 30, 66, 16, 10, 0)}`,
};

/** SVG inline listo para insertar; `tam` en píxeles (por defecto hereda del CSS). */
export function picto(id, { clase = "picto", tam = null } = {}) {
  const d = PICTOS[id]; if (!d) return "";
  return `<svg class="${clase}" viewBox="0 0 96 96" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round"${tam ? ` width="${tam}" height="${tam}"` : ""}>${d}</svg>`;
}
