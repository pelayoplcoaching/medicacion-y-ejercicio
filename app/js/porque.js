/* «¿Por qué?» (mejora grande 1): explicadores animados del mecanismo que hay detrás de cada aviso.
   Contenido de la base de conocimiento (en español, como las reglas), coherente con los textos de las reglas de esas señales
   y con sus mismas fuentes. Cada explicador: escena SVG en cuatro pasos (se avanza a mano; el movimiento es de una vez y se
   apaga con «reducir movimiento»), qué hacer y fuentes. Se carga al pulsar un «¿Por qué?», no al abrir la aplicación. */
import { t } from "./i18n.js?v=202611230752";
import { tC } from "./tr.js?v=202611230752";

/* ---------- piezas de dibujo (trazo lineal como los pictogramas de los ejercicios) ---------- */
const P = (d, c = "q-l", extra = "") => `<path class="${c}" d="${d}"${extra}/>`;
const C = (x, y, r, c = "q-l", extra = "") => `<circle class="${c}" cx="${x}" cy="${y}" r="${r}"${extra}/>`;
const T = (x, y, txt, ancla = "", clase = "") => `<text class="q-tx${clase ? " " + clase : ""}" x="${x}" y="${y}"${ancla ? ` text-anchor="${ancla}"` : ""}>${txt}</text>`;
const G = (c, ...hijos) => `<g class="${c}">${hijos.join("")}</g>`;
const corazon = (x, y, s = 1, c = "q-fa") => `<path class="${c}" transform="translate(${x} ${y}) scale(${s})" d="M0 30C-28 10-34-12-20-22C-11-28-3-24 0-16C3-24 11-28 20-22C34-12 28 10 0 30Z"/>`;
const gota = (x, y, s = 1, c = "q-fa") => `<path class="${c}" transform="translate(${x} ${y}) scale(${s})" d="M0-9C5-2 7 2 7 4A7 7 0 0 1-7 4C-7 2-5-2 0-9Z"/>`;
const pastilla = (x, y, c = "") => `<g class="${c}" transform="translate(${x} ${y}) rotate(-30)"><rect class="q-fb" x="-15" y="-7" width="30" height="14" rx="7"/><path class="q-p" d="M0-7V7"/><rect class="q-l2" x="-15" y="-7" width="30" height="14" rx="7"/></g>`;
const flecha = (x1, y1, x2, y2, c = "q-m") => {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 7, p = (g) => `${(x2 - L * Math.cos(a + g)).toFixed(1)} ${(y2 - L * Math.sin(a + g)).toFixed(1)}`;
  return `<path class="${c}" d="M${x1} ${y1}L${x2} ${y2}M${p(0.5)}L${x2} ${y2}L${p(-0.5)}"/>`;
};
const estrella = (x, y, r = 14, c = "q-o") => { let d = ""; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, r1 = i % 2 ? r * 0.45 : r; d += `${i ? "L" : "M"}${(x + r1 * Math.cos(a)).toFixed(1)} ${(y + r1 * Math.sin(a)).toFixed(1)}`; } return P(d + "Z", c); };
const bocadillo = (x, y, w = 76, h = 36, c = "") => G(c, P(`M${x + 8} ${y}h${w - 16}a8 8 0 0 1 8 8v${h - 16}a8 8 0 0 1-8 8h-${w - 36}l-12 11v-11h-8a8 8 0 0 1-8-8v-${h - 16}a8 8 0 0 1 8-8z`, "q-fs q-l2"), P(`M${x + 14} ${y + 13}h${w - 28}M${x + 14} ${y + 23}h${w - 44}`, "q-m"));
const prohibido = (x, y, r = 16) => C(x, y, r, "q-r") + P(`M${x - r * 0.7} ${y - r * 0.7}L${x + r * 0.7} ${y + r * 0.7}`, "q-r");
const taza = (x, y) => P(`M${x - 12} ${y - 10}h24v14a10 10 0 0 1-10 10h-4a10 10 0 0 1-10-10z M${x + 12} ${y - 6}h4a5 5 0 0 1 0 10h-4`, "q-l2") + P(`M${x - 5} ${y - 16}q3-5 0-9M${x + 3} ${y - 16}q3-5 0-9`, "q-p");
const silla = (x, y) => P(`M${x} ${y - 46}V${y}M${x} ${y - 20}h28V${y}M${x + 28} ${y - 20}`, "q-p");
const reloj = (x, y, r = 14) => C(x, y, r, "q-l2") + P(`M${x} ${y - r + 5}V${y}l7 5`, "q-l2");
const medidor = (cx, cy, r) => P(`M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}`, "q-pista") + [...Array(7)].map((_, i) => { const a = Math.PI + (i * Math.PI) / 6, r1 = r - 14, r2 = r - 8; return P(`M${(cx + r1 * Math.cos(a)).toFixed(1)} ${(cy + r1 * Math.sin(a)).toFixed(1)}L${(cx + r2 * Math.cos(a)).toFixed(1)} ${(cy + r2 * Math.sin(a)).toFixed(1)}`, "q-p"); }).join("");
/** Figura de pie (cabeza en y-58 respecto a los pies). */
const figura = (x, y, c = "") => G(c, C(x, y - 108, 10, "q-l"), P(`M${x} ${y - 96}V${y - 50}M${x} ${y - 86}l-13 22M${x} ${y - 86}l13 22M${x} ${y - 50}l-8 48M${x} ${y - 50}l8 48`));

/* ---------- escenas: cada una en un lienzo de 320 × 180; clases q-dN (desde el paso N), q-sN (solo el paso N), q-hN (hasta antes del N) ---------- */
const ESCENAS = tC({
  pulso: G("",
    G("adr q-h4", flecha(8, 62, 38, 76, "q-o"), flecha(6, 96, 40, 96, "q-o"), flecha(8, 130, 38, 116, "q-o")),
    G("escudo q-d2 q-h4", P("M46 74L60 68L74 74V92C74 104 66 112 60 116C54 112 46 104 46 92Z", "q-fb"), P("M53 92L58 97L67 86", "q-l2")),
    G("late", corazon(116, 92, 1.25)),
    medidor(244, 122, 58),
    P("M275 72A58 58 0 0 1 302 122", "q-zona q-d3"),
    T(306, 54, "zona del reloj", "end", "q-d3"),
    P("M244 122V74", "q-fantasma q-d3"),
    P("M244 122V72", "aguja"), C(244, 122, 6, "q-ff"),
    T(186, 144, "lento"), T(302, 144, "rápido", "end"),
    bocadillo(138, 14, 82, 38, "q-d4")),
  azucar: G("",
    `<rect class="q-fw" x="12" y="46" width="214" height="42" rx="8"/>`, P("M12 46H226M12 88H226", "q-p"),
    G("musculo", `<ellipse class="q-fb" cx="268" cy="67" rx="42" ry="30"/>`, P("M240 56q28 10 56 0M236 70q32 10 64 0M242 84q26 8 52 0", "q-p")),
    ...[[40, 67], [72, 58], [100, 76], [132, 60], [160, 74], [190, 62]].map(([x, y], i) => `<rect class="q-fo glu g${i + 1}" x="${x - 6}" y="${y - 6}" width="12" height="12" rx="3"/>`),
    pastilla(118, 24, "q-d3 q-h4"),
    G("q-s4", `<rect class="q-fo" x="34" y="10" width="40" height="28" rx="5"/>`, T(54, 29, "15 g", "middle", "q-txf")),
    T(24, 132, "azúcar en sangre"),
    `<rect class="q-pista2" x="24" y="140" width="272" height="12" rx="6"/>`, `<rect class="q-fa nivel" x="24" y="140" width="272" height="12" rx="6"/>`,
    `<rect class="q-fr q-baja" x="24" y="140" width="40" height="12" rx="6" fill-opacity=".25"/>`,
    G("q-s3", P("M126 134l9-16 9 16z", "q-fr"), T(135, 132, "!", "middle", "q-txb"))),
  sangrado: G("",
    `<rect class="q-fw" x="0" y="96" width="320" height="84"/>`, P("M0 96H320", "q-p"),
    P("M14 142H306", "q-vaso"),
    G("q-h4", estrella(160, 52, 18)),
    flecha(160, 74, 160, 92, "q-o q-h4"),
    G("q-s1", gota(150, 126, 1, "q-fr"), gota(166, 116, 1.1, "q-fr"), gota(178, 128, 0.9, "q-fr")),
    C(162, 132, 16, "q-moraton q-s2"), `<rect class="q-fa tapon q-s2" x="148" y="133" width="28" height="16" rx="8"/>`,
    C(162, 128, 40, "q-moraton q-s3"), `<rect class="q-fa tapon2 q-s3" x="156" y="135" width="12" height="12" rx="6"/>`, G("q-s3", reloj(250, 56)),
    G("q-s4", C(92, 48, 20, "q-l"), P("M54 94q2-24 38-24t38 24", "q-l"), estrella(68, 26, 12), `<rect class="q-fr" x="230" y="34" width="12" height="36" rx="2"/><rect class="q-fr" x="218" y="46" width="36" height="12" rx="2"/>`)),
  tension: G("",
    silla(62, 144),
    G("q-h2", C(76, 60, 10, "q-fa cabeza0"), P("M76 72V106H110V142M76 82l18 14")),
    flecha(124, 92, 148, 92, "q-m q-d2 q-h4"),
    G("q-d2 q-h4", C(178, 36, 10, "q-fa cabeza"), P("M178 48V94M178 58l-12 22M178 58l12 22"), P("M178 94l-8 48M178 94l8 48")),
    G("sangre q-d2 q-h4", flecha(204, 56, 204, 132, "q-r"), flecha(152, 56, 152, 132, "q-r")),
    P("M196 22c8-6 16 0 10 6s-14 2-8-4", "q-m q-s3"), P("M152 22c-8-6-16 0-10 6s14 2 8-4", "q-m q-s3"),
    G("q-s4", silla(206, 150), C(220, 104, 6), P("M220 111V128H236V150"), flecha(242, 120, 254, 120), C(266, 98, 6), P("M266 105V128L272 150M266 116l8 8"), flecha(280, 120, 292, 120), C(304, 86, 6), P("M304 93V124L299 150M304 124l5 26"), T(256, 172, "despacio", "middle"))),
  agua: G("",
    C(93, 22, 14, "q-p"), `<rect class="q-p" x="34" y="42" width="118" height="122" rx="40"/>`,
    P("M90 82c-14 0-20 14-16 26s20 18 26 8c4-6-4-10-2-18s8-16-8-16z", "q-fb"),
    pastilla(68, 62, "q-d1"),
    G("q-s1", gota(98, 134, 1), gota(104, 150, 0.9)),
    G("q-d2", gota(30, 70, 1), gota(158, 84, 1), gota(36, 118, 0.9), gota(156, 132, 0.8)),
    G("q-s3", C(178, 112, 11, "q-fs q-l2"), T(178, 116, "K", "middle", "q-txb"), C(196, 86, 11, "q-fs q-l2"), T(196, 90, "Na", "middle", "q-txb"), P("M114 150l8-10 2 8 8-10", "q-o")),
    `<rect class="q-p" x="226" y="28" width="64" height="124" rx="12"/>`, `<rect class="q-fa agua-nivel" x="230" y="32" width="56" height="116" rx="9"/>`,
    T(258, 170, "agua del cuerpo", "middle"),
    G("q-s4", P("M190 12h22l-3 30h-16z", "q-l2"), P("M194 26h16", "q-m"), gota(204, 52, 0.8))),
  calor: G("",
    figura(120, 160),
    G("q-h4", P("M110 100q4-5 0-10q-4-5 0-10M130 100q4-5 0-10q-4-5 0-10", "q-o")),
    G("q-h2", gota(96, 64, 0.9), gota(146, 76, 0.9)), G("q-h4", gota(100, 100, 0.8)),
    pastilla(70, 118, "q-d2 q-h4"),
    G("q-s3", P("M108 40l-6-6M132 40l6-6M120 34v-8", "q-r")),
    `<rect class="q-p" x="246" y="24" width="18" height="112" rx="9"/>`, C(255, 144, 16, "q-fr"), `<rect class="q-fr mercurio" x="250" y="30" width="8" height="112" rx="4"/>`,
    G("q-s4", P("M52 44a50 50 0 0 1 136 0z", "q-fs q-l2"), P("M120 44V30", "q-l2"), P("M200 120h22l-3 30h-16z", "q-l2"), P("M204 134h14", "q-m"))),
  equilibrio: G("",
    P("M16 150H304", "q-p"),
    T(40, 18, "reflejos"), `<rect class="q-pista2" x="40" y="24" width="240" height="10" rx="5"/>`, `<rect class="q-fa reflejo" x="40" y="24" width="240" height="10" rx="5"/>`,
    G("cuerpo q-h3", C(130, 54, 10), P("M130 66V108M130 76l-14 20M130 76l16 14M130 108l-14 40M130 108l18 38")),
    `<path class="q-fo" d="M156 150a10 7 0 0 1 20 0z"/>`,
    pastilla(250, 72, "q-d2 q-h4"),
    G("q-s3", C(84, 136, 10), P("M96 138H150M108 138l10-14M150 138l20 6M150 138l18-10"), C(152, 140, 12, "q-golpe")),
    G("q-s4", silla(220, 150), C(176, 54, 10), P("M176 66V108M176 76l40 26M176 76l-14 20M176 108V150M176 108l14 14l-4 8"))),
  musculo: G("",
    P("M40 72L150 100L224 56", "q-brazo"), C(228, 52, 10, "q-fw q-l2"),
    `<ellipse class="q-fs q-l2 biceps" cx="100" cy="80" rx="38" ry="18" transform="rotate(14 100 80)"/>`,
    G("q-s1", P("M92 52l-4-10M106 52l2-11M118 58l8-8", "q-o"), `<rect class="q-l2" x="232" y="102" width="56" height="48" rx="6"/>`, P("M232 116h56", "q-l2"), T(260, 140, "2–4 días", "middle")),
    G("q-s2", P("M228 140h20v-20h20v-20h20v-20", "q-m"), flecha(288, 80, 300, 60)),
    G("q-s3", P("M216 104h28l-4 40h-20z", "q-l2"), `<path class="q-orina" d="M220 118h20l-3 24h-14z"/>`, P("M282 96l14 26h-28z", "q-fr"), T(282, 118, "!", "middle", "q-txb")),
    G("q-s4", P("M222 50h30M226 42v16M248 42v16", "q-l"), P("M262 108l10 10 20-24", "q-ok"))),
  tendon: G("",
    P("M98 16C80 50 84 82 112 100C118 106 120 120 120 140", "q-l"), P("M150 16C150 60 148 100 146 140", "q-l"),
    P("M120 140C112 148 114 160 128 160H196C200 152 192 146 178 144L146 140", "q-l"),
    G("fibras", P("M116 104C121 116 122 128 122 150", "q-fib f1"), P("M122 102C127 116 128 128 128 152", "q-fib f2"), P("M128 100C133 116 134 128 134 152", "q-fib f3")),
    pastilla(226, 40, "q-d2 q-h4"),
    G("q-s3", flecha(70, 140, 70, 96), P("M116 118l12 6-10 6 12 6", "q-r")),
    G("q-s4", C(214, 96, 5), P("M214 102v18l-6 14M214 120l6 14M214 108l-7 8M214 108l7 6"), C(252, 128, 9, "q-l2"), C(276, 128, 9, "q-l2"), P("M252 128l10-16h12l2 16M262 112l-4-6", "q-l2"), P("M226 150q8-6 16 0t16 0t16 0t16 0", "q-m"), T(256, 172, "4 semanas", "middle"))),
  ritmo: G("",
    P("M10 100H40Q48 88 56 100H70L74 106L82 40L90 112L96 100H118Q132 76 146 100H310", "q-ecg q-h2"),
    P("M10 100H40Q48 88 56 100H70L74 106L82 40L90 112L96 100H150Q164 76 178 100H310", "q-ecg q-d2"),
    G("qt-corto q-h2", P("M72 128H146M72 122V134M146 122V134", "q-m"), T(109, 146, "QT", "middle")),
    G("q-d2", P("M72 128H178M72 122V134M178 122V134", "q-r"), T(125, 146, "QT más largo", "middle")),
    G("q-s3", C(208, 34, 12, "q-fs q-l2"), T(208, 38, "K", "middle", "q-txb"), flecha(224, 28, 224, 44, "q-r"), gota(248, 34, 1.3, "q-fa"), pastilla(282, 34), P("M232 100l6-22 6 30 6-34 6 26 6-12 6 12", "q-r")),
    G("q-s4", taza(222, 44), prohibido(222, 40, 20), corazon(282, 34, 0.75, "q-fr"))),
  acelera: G("",
    G("late", corazon(64, 88, 1.15)),
    P("M120 96H150L156 60L162 120L168 96H220L226 60L232 120L238 96H310", "q-ecg q-h2"),
    P("M120 96H134L140 60L146 120L152 96H166L172 60L178 120L184 96H198L204 60L210 120L216 96H230L236 60L242 120L248 96H262L268 60L274 120L280 96H310", "q-ecg q-d2"),
    pastilla(36, 30, "q-d2 q-h4"),
    G("q-s3", P("M92 140c4-8 8 8 12 0s8 8 12 0", "q-o"), P("M286 30l12 22h-24z", "q-fr"), T(286, 49, "!", "middle", "q-txb")),
    G("q-s4", bocadillo(122, 128, 80, 34), taza(270, 148), prohibido(270, 144, 20))),
  fuerza_hueso: G("",
    G("muslo", `<path class="q-fb" d="M60 30C40 60 40 110 66 150H112C130 110 126 60 106 30Z"/>`, P("M70 50q12 50 4 94M96 46q8 50-2 98", "q-p")),
    G("", P("M212 24c-14 0-18 16-8 22v92c-10 6-6 22 8 22s16-8 18-14c2 6 6 14 18 14s18-16 8-22V46c10-6 6-22-8-22s-16 8-18 14c-2-6-4-14-18-14z", "q-l2")),
    G("densidad", ...[[222, 64], [236, 78], [222, 94], [238, 108], [224, 124], [232, 52], [230, 140]].map(([x, y]) => C(x, y, 4, "q-fo"))),
    pastilla(150, 30, "q-s1"),
    G("q-s2", P("M138 96h40M144 86v20M172 86v20", "q-l")),
    G("q-s3", C(160, 118, 18, "q-l2"), P("M150 116h20M154 124h12", "q-m"), T(160, 154, "proteína", "middle"), `<rect class="q-l2" x="270" y="24" width="40" height="36" rx="5"/>`, T(290, 48, "2–3", "middle", "q-txb")),
    G("q-s4", silla(276, 150), P("M188 36l12-6 12 6v12c0 10-6 16-12 18-6-2-12-8-12-18z", "q-fs q-l2"))),
  sol: G("",
    G("sol", C(56, 42, 18, "q-fo"), P("M56 14v-8M56 70v8M28 42h-8M84 42h8M36 22l-6-6M76 62l6 6M36 62l-6 6M76 22l6-6", "q-o")),
    G("rayos", P("M78 60L140 120M86 50L206 120M70 66L104 120", "q-rayo")),
    `<rect class="q-fw" x="0" y="120" width="320" height="60"/>`, P("M0 120H320", "q-p"),
    `<rect class="q-fr quemado" x="0" y="120" width="320" height="16" opacity="0"/>`,
    G("q-d2 q-h3", ...[[150, 150], [196, 160], [240, 146], [116, 158]].map(([x, y]) => `<path class="q-fb" d="M${x - 8} ${y}l4-7h8l4 7-4 7h-8z"/>`)),
    G("q-s3", P("M210 40a26 14 0 0 1 52 0z", "q-fa"), P("M196 42h80", "q-l"), `<rect class="q-fo" x="282" y="70" width="22" height="40" rx="5"/>`, T(293, 96, "50", "middle", "q-txb")),
    G("q-s4", P("M210 100a26 26 0 0 1 52 0", "q-o"), P("M196 100h80", "q-p"), flecha(236, 64, 236, 44, "q-m"), T(236, 114, "primera hora", "middle"))),
  tension_alta: G("",
    C(70, 56, 10), P("M70 68V110M70 76L54 32M70 76L86 32M70 110l-10 40M70 110l10 40"), P("M38 30h64M42 20v20M98 20v20", "q-l"),
    G("q-s2", P("M66 60h8", "q-r"), T(70, 170, "aguanta el aire", "middle")),
    G("q-s3", P("M84 58q10-2 14 4M86 66q12 0 16 6", "q-m"), T(70, 170, "suelta el aire", "middle")),
    pastilla(130, 30, "q-d1 q-h4"),
    medidor(236, 120, 58), P("M266 70A58 58 0 0 1 294 120", "q-zona2"),
    P("M236 120V72", "aguja"), C(236, 120, 6, "q-ff"),
    G("q-s4", `<rect class="q-fs q-l2" x="112" y="128" width="96" height="34" rx="8"/>`, T(160, 151, "180/110", "middle", "q-txb"), P("M114 130L206 160", "q-r"))),
  cansancio: G("",
    `<rect class="q-l2" x="40" y="54" width="96" height="52" rx="10"/>`, `<rect class="q-ff" x="136" y="70" width="8" height="20" rx="2"/>`, `<rect class="q-fa bateria" x="46" y="60" width="84" height="40" rx="6"/>`,
    pastilla(88, 30, "q-d1 q-h3"),
    T(232, 18, "cuánto cuesta", "middle"), `<rect class="q-pista2" x="220" y="26" width="24" height="124" rx="12"/>`, `<rect class="q-fo esfuerzo" x="220" y="26" width="24" height="124" rx="12"/>`,
    G("q-s3", C(88, 140, 16, "q-fo"), P("M88 116v-6M88 170v-6M64 140h-6M118 140h-6", "q-o"), reloj(150, 140, 12)),
    G("q-s4", P("M152 150h18v-16h18v-16h18v-16", "q-m"))),
});

/* Pasos de cada escena que cambian valores (agujas, niveles, posiciones) además de mostrar u ocultar piezas. */
const CSS = `
.pq-escena { --pq-a: var(--accent); --pq-b: var(--marca-clara); --pq-o: var(--oro); --pq-r: var(--alerta); --pq-f: var(--fg); --pq-s: var(--accent-soft); margin: 4px 0 10px; padding: 8px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--line); }
.pq-escena svg { display: block; width: 100%; height: auto; max-height: 240px; overflow: visible; }
.pq-escena svg * { stroke-linecap: round; stroke-linejoin: round; }
.pq-escena .q-l { fill: none; stroke: var(--pq-f); stroke-width: 3.4; }
.pq-escena .q-l2 { fill: none; stroke: var(--pq-f); stroke-width: 2.2; }
.pq-escena .q-p { fill: none; stroke: var(--pq-f); stroke-width: 1.8; stroke-opacity: .45; }
.pq-escena .q-m { fill: none; stroke: var(--pq-a); stroke-width: 2.8; }
.pq-escena .q-o { fill: none; stroke: var(--pq-o); stroke-width: 2.8; }
.pq-escena .q-r { fill: none; stroke: var(--pq-r); stroke-width: 2.8; }
.pq-escena .q-fw { fill: var(--surface); } .pq-escena .q-fa { fill: var(--pq-a); } .pq-escena .q-fb { fill: var(--pq-b); } .pq-escena .q-fo { fill: var(--pq-o); } .pq-escena .q-fr { fill: var(--pq-r); } .pq-escena .q-ff { fill: var(--pq-f); } .pq-escena .q-fs { fill: var(--pq-s); }
.pq-escena .q-tx { fill: var(--muted); font: 600 11px/1 var(--font); }
.pq-escena .q-txb { fill: var(--pq-f); font-weight: 800; font-size: 13px; }
.pq-escena .q-txf { fill: #2a1d00; font-weight: 800; }
.pq-escena .q-pista { fill: none; stroke: var(--line-strong); stroke-width: 12; stroke-opacity: .5; }
.pq-escena .q-pista2 { fill: var(--line); }
.pq-escena .q-zona { fill: none; stroke: var(--pq-o); stroke-width: 12; stroke-opacity: .8; }
.pq-escena .q-zona2 { fill: none; stroke: var(--pq-r); stroke-width: 12; stroke-opacity: .7; }
.pq-escena .q-fantasma { fill: none; stroke: var(--pq-o); stroke-width: 3; stroke-dasharray: 4 5; }
.pq-escena .aguja { fill: none; stroke: var(--pq-f); stroke-width: 4; transform-box: view-box; }
.pq-escena .q-vaso { fill: none; stroke: var(--pq-r); stroke-width: 10; stroke-opacity: .75; }
.pq-escena .q-moraton { fill: var(--pq-a); fill-opacity: .28; }
.pq-escena .q-golpe { fill: none; stroke: var(--pq-r); stroke-width: 3; stroke-dasharray: 3 4; }
.pq-escena .q-brazo { fill: none; stroke: var(--pq-f); stroke-width: 14; stroke-opacity: .85; }
.pq-escena .q-orina { fill: #8a5a1c; }
.pq-escena .q-ok { fill: none; stroke: var(--info); stroke-width: 4; }
.pq-escena .q-fib { fill: none; stroke: var(--pq-a); stroke-width: 3; }
.pq-escena .q-ecg { fill: none; stroke: var(--pq-a); stroke-width: 3; }
.pq-escena .q-rayo { fill: none; stroke: var(--pq-o); stroke-width: 2.4; stroke-dasharray: 6 6; }
.pq-escena :is(.q-d2, .q-d3, .q-d4, .q-s1, .q-s2, .q-s3, .q-s4) { opacity: 0; }
.pq-escena[data-paso="1"] :is(.q-s1, .q-d1), .pq-escena[data-paso="2"] :is(.q-s2, .q-d2), .pq-escena[data-paso="3"] :is(.q-s3, .q-d2, .q-d3), .pq-escena[data-paso="4"] :is(.q-s4, .q-d2, .q-d3, .q-d4) { opacity: 1; }
.pq-escena[data-paso="2"] .q-h2, .pq-escena[data-paso="3"] :is(.q-h2, .q-h3), .pq-escena[data-paso="4"] :is(.q-h2, .q-h3, .q-h4) { opacity: 0; }
.pq-escena svg[data-e="pulso"] .aguja { transform-origin: 244px 122px; rotate: 52deg; }
.pq-escena:not([data-paso="1"]) svg[data-e="pulso"] .aguja { rotate: 0deg; }
.pq-escena svg[data-e="pulso"] .q-fantasma { transform-box: view-box; transform-origin: 244px 122px; rotate: 52deg; }
.pq-escena svg[data-e="azucar"] .nivel { transform-box: fill-box; transform-origin: left center; scale: .62 1; }
.pq-escena[data-paso="2"] svg[data-e="azucar"] .nivel { scale: .45 1; }
.pq-escena[data-paso="3"] svg[data-e="azucar"] .nivel { scale: .14 1; fill: var(--pq-r); }
.pq-escena[data-paso="4"] svg[data-e="azucar"] .nivel { scale: .5 1; }
.pq-escena:is([data-paso="2"], [data-paso="3"], [data-paso="4"]) svg[data-e="azucar"] .g4 { translate: 116px 0; }
.pq-escena:is([data-paso="2"], [data-paso="3"], [data-paso="4"]) svg[data-e="azucar"] .g5 { translate: 106px -2px; }
.pq-escena:is([data-paso="2"], [data-paso="3"], [data-paso="4"]) svg[data-e="azucar"] .g6 { translate: 92px 2px; }
.pq-escena[data-paso="3"] svg[data-e="azucar"] .g1 { translate: 204px 4px; }
.pq-escena[data-paso="3"] svg[data-e="azucar"] .g2 { translate: 186px -6px; }
.pq-escena[data-paso="3"] svg[data-e="azucar"] .g3 { translate: 176px 4px; }
.pq-escena svg[data-e="azucar"] .musculo { transform-box: fill-box; transform-origin: center; }
.pq-escena:is([data-paso="2"], [data-paso="3"]) svg[data-e="azucar"] .musculo { scale: 1.06; }
.pq-escena svg[data-e="sangrado"] .tapon2 { transform-box: fill-box; transform-origin: center; }
.pq-escena svg[data-e="tension"] .cabeza { transition: fill .6s; }
.pq-escena[data-paso="3"] svg[data-e="tension"] .cabeza { fill: var(--surface); stroke: var(--pq-f); stroke-width: 2; }
.pq-escena svg[data-e="tension"] .sangre { translate: 0 -16px; }
.pq-escena:is([data-paso="2"], [data-paso="3"]) svg[data-e="tension"] .sangre { translate: 0 0; }
.pq-escena svg[data-e="agua"] .agua-nivel, .pq-escena svg[data-e="calor"] .mercurio, .pq-escena svg[data-e="cansancio"] .esfuerzo { transform-box: fill-box; transform-origin: center bottom; scale: 1 .8; fill-opacity: .85; }
.pq-escena[data-paso="2"] svg[data-e="agua"] .agua-nivel { scale: 1 .5; }
.pq-escena[data-paso="3"] svg[data-e="agua"] .agua-nivel { scale: 1 .36; }
.pq-escena[data-paso="4"] svg[data-e="agua"] .agua-nivel { scale: 1 .74; }
.pq-escena svg[data-e="calor"] .mercurio { scale: 1 .42; }
.pq-escena[data-paso="2"] svg[data-e="calor"] .mercurio { scale: 1 .7; }
.pq-escena[data-paso="3"] svg[data-e="calor"] .mercurio { scale: 1 .92; }
.pq-escena[data-paso="4"] svg[data-e="calor"] .mercurio { scale: 1 .46; }
.pq-escena svg[data-e="equilibrio"] .reflejo, .pq-escena svg[data-e="cansancio"] .bateria { transform-box: fill-box; transform-origin: left center; scale: .3 1; }
.pq-escena:is([data-paso="2"], [data-paso="3"]) svg[data-e="equilibrio"] .reflejo { scale: .82 1; fill: var(--pq-r); }
.pq-escena[data-paso="4"] svg[data-e="equilibrio"] .reflejo { scale: .42 1; }
.pq-escena svg[data-e="equilibrio"] .cuerpo { transform-box: view-box; transform-origin: 130px 150px; }
.pq-escena[data-paso="2"] svg[data-e="equilibrio"] .cuerpo { rotate: 11deg; }
.pq-escena[data-paso="3"] svg[data-e="musculo"] .biceps { fill: var(--pq-r); fill-opacity: .45; }
.pq-escena:is([data-paso="2"], [data-paso="3"]) svg[data-e="tendon"] :is(.f1, .f3) { stroke-dasharray: 4 6; stroke-opacity: .45; }
.pq-escena svg[data-e="fuerza_hueso"] .muslo { transform-box: fill-box; transform-origin: center bottom; }
.pq-escena[data-paso="1"] svg[data-e="fuerza_hueso"] .muslo { scale: .82; }
.pq-escena[data-paso="1"] svg[data-e="fuerza_hueso"] .densidad { opacity: .25; }
.pq-escena[data-paso="2"] svg[data-e="sol"] .q-rayo { stroke-width: 4.5; }
.pq-escena[data-paso="2"] svg[data-e="sol"] .quemado { opacity: .45; }
.pq-escena svg[data-e="tension_alta"] .aguja { transform-origin: 236px 120px; rotate: -10deg; }
.pq-escena[data-paso="1"] svg[data-e="tension_alta"] .aguja { rotate: 22deg; }
.pq-escena[data-paso="2"] svg[data-e="tension_alta"] .aguja { rotate: 72deg; stroke: var(--pq-r); }
.pq-escena[data-paso="3"] svg[data-e="tension_alta"] .aguja { rotate: 28deg; }
.pq-escena svg[data-e="cansancio"] .bateria { scale: .82 1; }
.pq-escena:not([data-paso="1"]) svg[data-e="cansancio"] .bateria { scale: .42 1; fill: var(--pq-o); }
.pq-escena svg[data-e="cansancio"] .esfuerzo { scale: 1 .38; }
.pq-escena:is([data-paso="2"], [data-paso="3"]) svg[data-e="cansancio"] .esfuerzo { scale: 1 .74; fill: var(--pq-r); }
.pq-escena[data-paso="4"] svg[data-e="cansancio"] .esfuerzo { scale: 1 .5; }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .pq-escena svg * { transition: opacity .45s ease, translate .9s var(--ease-salida, ease-out), rotate .9s var(--ease-salida, ease-out), scale .8s var(--ease-salida, ease-out), fill .5s, stroke .5s, stroke-width .5s; }
  html:not(.pa-quieto) .pq-escena[data-paso="1"] .late { animation: pq-late .9s ease-in-out 3; transform-box: fill-box; transform-origin: center; }
  html:not(.pa-quieto) .pq-escena svg[data-e="sangrado"] .tapon2 { transition-delay: .6s; }
}
@keyframes pq-late { 0%, 100% { scale: 1; } 30% { scale: 1.08; } 50% { scale: .98; } }
.pq-dlg .pq-titulo { margin: 0 0 4px; font-size: 1.22rem; line-height: 1.25; text-wrap: balance; }
.pq-dlg .pq-por { margin: 0 0 6px; color: var(--muted); font-size: .88rem; }
.pq-dlg .pq-paso { min-height: 4.6em; margin: 0; font-size: 1.02rem; line-height: 1.5; }
.pq-dlg .pq-paso b { display: block; margin-bottom: 2px; font-family: var(--mono); font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
.pq-dlg .pq-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0 4px; }
.pq-dlg .pq-puntos { display: flex; gap: 6px; }
.pq-dlg .pq-puntos button { width: 12px; height: 12px; min-height: 0; padding: 0; border-radius: 50%; border: 2px solid var(--accent); background: transparent; cursor: pointer; }
.pq-dlg .pq-puntos button[aria-current="step"] { background: var(--accent); }
.pq-dlg .pq-hacer { margin: 6px 0 0; padding-left: 1.2em; display: grid; gap: 4px; }
.pq-dlg .pq-fuentes, .pq-dlg .pq-nota { margin: 8px 0 0; font-size: .8rem; color: var(--muted); }
.pq-dlg .pq-otros { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
:root[data-theme="contrast"] .pq-escena { background: var(--surface); }
@media (forced-colors: active) { .pq-escena .q-fa, .pq-escena .q-fb, .pq-escena .q-fo, .pq-escena .q-fr { fill: CanvasText; } .pq-escena .q-m, .pq-escena .q-o, .pq-escena .q-r { stroke: Highlight; } }
`;

/* ---------- contenido ---------- */
export const PORQUE = tC({
  pulso: { titulo: "¿Por qué el pulso no sirve para medir el esfuerzo?",
    pasos: ["Al moverse, la adrenalina acelera el corazón y el pulso sube con el esfuerzo. En eso se basan las «zonas de pulso» de relojes y máquinas.",
      "Su medicación frena esa señal: el pulso sube menos de lo normal para el mismo esfuerzo (con los betabloqueantes, unos 20 o 30 latidos menos).",
      "Sus músculos trabajan igual. Si persigue la zona de pulso del reloj, acabará haciendo bastante más esfuerzo del que le toca.",
      "Guíese por la respiración: debe poder hablar con frases cortas, pero no cantar. Es la prueba del habla, y vale con cualquier medicación."],
    hacer: ["Use la sensación de esfuerzo (escala de Borg) o la prueba del habla, no las fórmulas de pulso máximo ni las zonas del reloj.", "Caliente y enfríe 5–10 minutos: con el pulso frenado, el cuerpo tarda más en adaptarse.", "Mareo, falta de aire que no mejora al parar o pulso muy lento con síntomas: pare y consúltelo."],
    fuentes: ["ACSM GETP 11.ª ed., ap. A", "FT AEMPS 4.4", "ESC 2020 cardiología del deporte"] },
  azucar: { titulo: "¿Por qué el ejercicio puede bajarle el azúcar?",
    pasos: ["El azúcar (glucosa) viaja por la sangre y es el combustible de los músculos.",
      "Al moverse, los músculos lo toman de la sangre por su cuenta, aunque haya poca insulina. Por eso el ejercicio baja el azúcar.",
      "Su medicación también lo baja. Las dos cosas se suman y puede llegar una bajada durante el ejercicio o hasta 24 horas después, incluso de noche.",
      "Con un plan sencillo se entrena con seguridad: mida antes, lleve azúcar rápido y, si nota una bajada, pare y tome 15 g."],
    hacer: ["Mida la glucosa antes de entrenar y, los días de sesiones largas o intensas, también antes de acostarse.", "Lleve siempre azúcar de acción rápida (sobres, glucosa o zumo); si entrena solo, avise a alguien.", "Señales de bajada: sudor frío, temblor, hambre repentina o confusión. Con un betabloqueante, el temblor y las palpitaciones pueden no avisar; el sudor sí.", "Si las bajadas se repiten los días de ejercicio, hable con su médico de ajustar la dosis."],
    fuentes: ["ADA Standards of Care 2024 (ejercicio)", "Riddell 2017 Lancet Diabetes Endocrinol", "FT AEMPS 4.4"] },
  sangrado: { titulo: "¿Por qué hay que cuidar los golpes?",
    pasos: ["Con un golpe se rompen pequeños vasos y sale un poco de sangre bajo la piel.",
      "Normalmente las plaquetas y la coagulación forman un tapón en pocos minutos y queda un moratón pequeño.",
      "Su medicación hace que el tapón tarde más en formarse: los moratones son más grandes y un golpe fuerte puede sangrar por dentro.",
      "El ejercicio está indicado; lo que cambia es evitar golpes y caídas. Por eso el equilibrio es tan importante para usted."],
    hacer: ["Evite deportes de contacto y actividades con riesgo de caída a velocidad.", "Entrene el equilibrio 2–3 veces por semana, con un apoyo al alcance.", "Golpe en la cabeza aunque parezca leve, hematomas grandes sin golpe, sangre en la orina o heces negras: acuda a urgencias."],
    fuentes: ["FT AEMPS 4.4", "ESC 2020 cardiología del deporte"] },
  tension: { titulo: "¿Por qué puede marearse al levantarse o al terminar?",
    pasos: ["Sentado, la sangre llega sin esfuerzo a la cabeza.",
      "Al ponerse de pie, la sangre tiende a bajar a las piernas. Su medicación relaja los vasos o baja la tensión, y el cuerpo tarda más en compensarlo.",
      "Por un momento llega menos sangre a la cabeza: mareo, visión borrosa o flojera. Al terminar el ejercicio pasa algo parecido: la tensión queda más baja unas horas.",
      "Se evita con cambios lentos: siéntese en el borde, espere unos segundos y levántese. Y termine siempre bajando el ritmo poco a poco."],
    hacer: ["Enfríe 5–10 minutos al final, sin pararse de golpe.", "Levántese despacio, sobre todo al salir de la cama o tras ejercicios en el suelo.", "Beba agua y evite entrenar en las horas de máximo efecto de la dosis y los primeros días tras un cambio de dosis.", "Si se marea a menudo o llega a desmayarse, consulte: puede que haya que ajustar algún fármaco."],
    fuentes: ["FT AEMPS 4.4", "ACSM GETP 11.ª ed., ap. A"] },
  agua: { titulo: "¿Por qué hay que cuidar el agua y las sales?",
    pasos: ["Algunos fármacos hacen que el riñón elimine más agua y sales; otros necesitan que no le falte agua, como el litio.",
      "Al hacer ejercicio también se pierde agua y sal con el sudor. Las dos pérdidas se suman.",
      "Si falta agua o potasio pueden aparecer mareo, calambres, debilidad o palpitaciones, y el riñón sufre.",
      "La solución es beber antes de tener sed, también durante y después del ejercicio, y elegir bien la hora."],
    hacer: ["Beba antes, durante y después; con calor o en sesiones largas, algo más. Si tiene limitado el líquido por el corazón o el riñón, siga la cantidad que le indicó su médico.", "Con diuréticos fuertes (furosemida, torasemida), evite entrenar en las 2–4 horas siguientes a la toma.", "No tome antiinflamatorios (ibuprofeno, naproxeno…) para las agujetas: con deshidratación pueden dañar el riñón.", "Calambres frecuentes, debilidad o palpitaciones: coméntelo con su médico (puede necesitar un análisis). Con litio, consulte si nota temblor, diarrea o confusión."],
    fuentes: ["FT AEMPS 4.4", "ACSM GETP 11.ª ed., ap. A"] },
  calor: { titulo: "¿Por qué tolera peor el calor?",
    pasos: ["Al moverse, el cuerpo produce calor y lo elimina sudando y llevando sangre a la piel.",
      "Algunos fármacos reducen el sudor; otros quitan agua o frenan el paso de sangre a la piel. El calor se acumula antes.",
      "Señales de que se está pasando: dolor de cabeza, náuseas, mareo o piel caliente y seca. Si aparecen, pare, busque la sombra y refrésquese.",
      "Con calor, entrene a primera hora o en un interior fresco, beba antes de tener sed y baje la intensidad."],
    hacer: ["En verano, evite las horas centrales; mejor a primera hora o en un lugar climatizado.", "Beba antes de tener sed (salvo que tenga limitado el líquido) y use ropa ligera.", "Baje la intensidad los días de calor o humedad: el mismo esfuerzo cuesta más."],
    fuentes: ["FT AEMPS 4.4", "ACSM GETP 11.ª ed., ap. A"] },
  equilibrio: { titulo: "¿Por qué aumenta el riesgo de caídas?",
    pasos: ["Mantener el equilibrio es un trabajo continuo: el cerebro corrige cada tropiezo en décimas de segundo.",
      "Su medicación da sueño, enlentece los reflejos o baja la tensión: esa corrección llega más tarde.",
      "Un tropiezo que antes se quedaba en susto puede acabar en caída y, en mayores, en fractura de cadera.",
      "El mejor antídoto es entrenar el equilibrio y la fuerza de piernas, siempre con un apoyo al alcance."],
    hacer: ["Entrene el equilibrio 2–3 veces por semana junto a una pared, una silla o una barandilla.", "No entrene en las horas siguientes a la toma si le da sueño.", "Calzado con suela firme, buena luz y sin alfombras sueltas.", "Hable con su médico: a veces se puede reducir algún fármaco que da sueño."],
    fuentes: ["FT AEMPS 4.4", "FT AEMPS 4.7", "ACSM GETP 11.ª ed., ap. A"] },
  musculo: { titulo: "¿Cómo distinguir las agujetas de un problema muscular?",
    pasos: ["Las agujetas normales aparecen a las 24–48 horas, en el músculo que ha trabajado, y se van en 2–4 días.",
      "Con su medicación el músculo puede ser algo más sensible al ejercicio nuevo o muy intenso. No es motivo para no entrenar: se progresa poco a poco.",
      "No es normal el dolor por todo el cuerpo o en músculos que no ha trabajado, la debilidad real ni la orina oscura. Entonces, pare y consulte.",
      "Empiece con cargas ligeras las primeras semanas, sin llegar al fallo, y suba cuando lo haga con buena técnica."],
    hacer: ["Las primeras 2–3 semanas: cargas ligeras, pocas series y sin bajadas lentas con mucho peso.", "No añada fármacos nuevos sin comentarlo: algunos antibióticos y antifúngicos suben el riesgo.", "Dolor generalizado, debilidad u orina oscura: consulte; puede necesitar un análisis (CK)."],
    fuentes: ["FT AEMPS 4.4", "FT AEMPS 4.8"] },
  tendon: { titulo: "¿Por qué hay que proteger los tendones?",
    pasos: ["El tendón une el músculo al hueso, como el de Aquiles en el talón. Está hecho de fibras muy resistentes.",
      "Algunos fármacos (los antibióticos del grupo de las quinolonas y los corticoides en tratamientos largos) debilitan esas fibras.",
      "Un salto, un sprint o un cambio brusco de dirección pueden entonces dañarlo o romperlo, sobre todo pasados los 60 años.",
      "Mientras dure el tratamiento (con las quinolonas, 4 semanas más), elija actividades sin impacto: caminar, bici o nadar."],
    hacer: ["Evite saltos, carrera intensa, cambios bruscos de dirección y cargas máximas.", "Si aparece dolor en el talón, la pantorrilla, el hombro o el codo, pare y consulte.", "Con corticoides prolongados la fuerza es muy recomendable, pero con progresión lenta y sin ejercicios explosivos."],
    fuentes: ["FT AEMPS 4.4", "FT AEMPS 4.8", "nota AEMPS 2018 quinolonas"] },
  ritmo: { titulo: "¿Qué es el «QT» y por qué importa?",
    pasos: ["En cada latido, el corazón se activa y luego se «recarga». En el electrocardiograma, ese tiempo se llama intervalo QT.",
      "Algunos fármacos alargan la recarga. Por sí solo no suele dar síntomas, pero deja al corazón más sensible.",
      "El riesgo de arritmia sube si se suman cosas: potasio o magnesio bajos, deshidratación, pulso muy lento u otro fármaco que también alargue el QT.",
      "Con ejercicio moderado y estas precauciones se entrena con seguridad. Avise si nota palpitaciones o se desmaya."],
    hacer: ["Evite estimulantes: bebidas energéticas, preentrenos y descongestionantes.", "Hidrátese y, si toma diuréticos, pregunte por el control de potasio y magnesio.", "Palpitaciones que no ceden, mareo intenso o desmayo: pare y consulte (puede necesitar un electrocardiograma)."],
    fuentes: ["FT AEMPS 4.4", "FT AEMPS 4.8"] },
  acelera: { titulo: "¿Por qué se le acelera el corazón?",
    pasos: ["En reposo, el corazón late a un ritmo tranquilo y sube con el esfuerzo.",
      "Su medicación lo estimula: el pulso va más rápido en reposo y sube más de lo que pide el esfuerzo.",
      "Puede notar palpitaciones o temblor, y el reloj le dirá que va más fuerte de lo que en realidad va.",
      "Guíese por la sensación de esfuerzo, baje la intensidad si nota palpitaciones y no añada otros estimulantes."],
    hacer: ["Intensidad por sensación de esfuerzo o prueba del habla, no por pulso.", "Evite el exceso de café, las bebidas energéticas, los preentrenos y los descongestionantes.", "Palpitaciones que duran minutos, con mareo o con dolor en el pecho: pare y consulte."],
    fuentes: ["FT AEMPS 4.4", "ACSM GETP 11.ª ed., ap. A", "GINA 2024"] },
  fuerza_hueso: { titulo: "¿Por qué la fuerza es su mejor aliada?",
    pasos: ["Algunos tratamientos favorecen que se pierda músculo o que el hueso se debilite (corticoides prolongados, algunos fármacos para adelgazar o para el cáncer de próstata).",
      "El entrenamiento de fuerza manda la señal contraria: el músculo se mantiene o crece y el hueso se refuerza.",
      "Funciona con 2–3 sesiones a la semana y con suficiente proteína en las comidas (salvo que su médico se la haya limitado).",
      "Con el hueso más frágil, trabaje también el equilibrio para no caerse, siempre con apoyo."],
    hacer: ["Fuerza 2–3 días por semana con los grandes grupos musculares (piernas, espalda, empuje).", "Progrese poco a poco y sin saltos si el hueso está débil.", "Proteína en cada comida: legumbres, huevo, lácteos, pescado o carne."],
    fuentes: ["FT AEMPS 4.4", "ADA/EASD 2022 consenso obesidad-DM2", "ACSM 2019 ejercicio y cáncer (Campbell)"] },
  sol: { titulo: "¿Por qué se quema antes con el sol?",
    pasos: ["El sol llega a la piel y, con tiempo, la enrojece.",
      "Su medicación hace la piel más sensible a la luz: se quema antes y con menos sol, incluso en días nublados.",
      "Protéjase: gorra o sombrero, ropa que cubra y protector solar alto.",
      "Elija las primeras horas de la mañana o las últimas de la tarde, o entrene a la sombra."],
    hacer: ["Protector 50 y ropa que cubra si entrena al aire libre.", "Evite las horas centrales del día.", "Si aparece una erupción o una quemadura con poco sol, consulte."],
    fuentes: ["FT AEMPS 4.8", "FT AEMPS 4.4"] },
  tension_alta: { titulo: "¿Por qué hay que vigilar la tensión al hacer fuerza?",
    pasos: ["Su medicación puede subir la tensión arterial.",
      "Si aguanta el aire al hacer fuerza (lo que se llama maniobra de Valsalva), la tensión se dispara durante unos segundos.",
      "Respirando de forma continua (soltando el aire al empujar), la subida es mucho menor.",
      "Mídase la tensión: con 180/110 o más en reposo, no entrene hasta controlarla; con 160/100 o más, solo intensidad ligera-moderada hasta ajustar el tratamiento."],
    hacer: ["Respire siempre durante la fuerza; evite las cargas máximas y los esfuerzos mantenidos sin moverse.", "Mídase la tensión en reposo de vez en cuando y anótela en el diario.", "Dolor de cabeza intenso, dolor en el pecho o visión borrosa con el esfuerzo: pare y consulte."],
    fuentes: ["FT AEMPS 4.4", "ESC 2024 HTA", "ACSM GETP 11.ª ed."] },
  cansancio: { titulo: "¿Por qué se cansa antes?",
    pasos: ["Algunos tratamientos dan cansancio o reducen la capacidad de esfuerzo: el mismo paseo cuesta más.",
      "No es falta de voluntad: el cuerpo tiene menos margen. Si fuerza como antes, el cansancio se acumula.",
      "Busque su mejor momento del día y prefiera sesiones más cortas y frecuentes.",
      "Progrese despacio y valore la constancia. Si el cansancio es nuevo o va a más, coméntelo con su médico."],
    hacer: ["Guíese por la sensación de esfuerzo, no por lo que hacía antes.", "Varias sesiones cortas, de 10 minutos, también suman.", "Cansancio nuevo, intenso o que va a más: consulte."],
    fuentes: ["FT AEMPS 4.4", "ACSM 2019 ejercicio y cáncer (Campbell)"] },
});
export const PQ_IDS = Object.keys(PORQUE);
/** Lección de «Aprende» relacionada con cada explicador (js/aprende.js). */
const LECCION = { pulso: "intensidad", acelera: "intensidad", azucar: "azucar", tension: "tension", tension_alta: "tension", equilibrio: "caidas", sangrado: "caidas", fuerza_hueso: "fuerza", musculo: "fuerza", agua: "medicacion", calor: "medicacion", ritmo: "alarma", cansancio: "constancia" };

/** HTML de la escena de un explicador en un paso (1–4). */
export function escena(id, paso = 1) {
  return `<figure class="pq-escena" data-paso="${paso}" aria-hidden="true"><svg viewBox="0 0 320 180" data-e="${id}" focusable="false">${ESCENAS[id] || ""}</svg></figure>`;
}

/* ---------- ventana ---------- */
let dlg = null, actual = null, paso = 1, opciones = {};
/** Añade una vez los estilos de las escenas (van con el módulo, no en la hoja general). */
export function estilos() { if (!document.getElementById("pq-css")) { const st = document.createElement("style"); st.id = "pq-css"; st.textContent = CSS; document.head.append(st); } }
function crear() {
  estilos();
  dlg = document.createElement("dialog");
  dlg.id = "porque"; dlg.className = "ficha pq-dlg"; dlg.setAttribute("aria-labelledby", "pq-cab");
  dlg.innerHTML = `<div class="ficha-cab"><p id="pq-cab">${t("pq.titulo")}</p><button type="button" class="btn-sec sm" id="pq-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="pq-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#pq-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  dlg.addEventListener("keydown", (ev) => {
    if (ev.target.closest("input, textarea, select")) return;
    if (ev.key === "ArrowRight") { ev.preventDefault(); ir(paso + 1); } else if (ev.key === "ArrowLeft") { ev.preventDefault(); ir(paso - 1); }
  });
}
function pintar() {
  const e = PORQUE[actual], n = e.pasos.length, farm = opciones.farmacos?.[actual] || [];
  const otros = (opciones.presentes || []).filter((x) => x !== actual);
  const cuerpo = dlg.querySelector("#pq-cuerpo");
  cuerpo.innerHTML = `
    <h2 class="pq-titulo">${e.titulo}</h2>
    ${farm.length ? `<p class="pq-por">${t("pq.por", { f: farm.join(", ") })}</p>` : ""}
    ${escena(actual, paso)}
    <p class="pq-paso" aria-live="polite"><b>${t("pq.paso", { n: paso, t: n })}</b>${e.pasos[paso - 1]}</p>
    <div class="pq-nav">
      <button type="button" class="btn-sec sm" data-pq="ant"${paso === 1 ? " disabled" : ""}>${t("pq.anterior")}</button>
      <span class="pq-puntos" role="group" aria-label="${t("pq.titulo")}">${e.pasos.map((_, i) => `<button type="button" data-pq-ir="${i + 1}" aria-label="${t("pq.paso", { n: i + 1, t: n })}"${i + 1 === paso ? ' aria-current="step"' : ""}></button>`).join("")}</span>
      <button type="button" class="btn sm" data-pq="sig">${paso === n ? t("pq.otra_vez") : t("pq.siguiente")}</button>
    </div>
    <h3>${t("pq.hacer")}</h3>
    <ul class="pq-hacer">${e.hacer.map((x) => `<li>${x}</li>`).join("")}</ul>
    <p class="pq-fuentes">${t("pq.fuentes")}: ${e.fuentes.join(" · ")}</p>
    <p class="pq-nota">${t("pq.nota")}</p>
    ${LECCION[actual] ? `<p class="pq-leccion"><button type="button" class="btn-sec sm" data-aprende="${LECCION[actual]}">${t("apr.relacionada")}</button></p>` : ""}
    ${otros.length ? `<h3>${t("pq.otros")}</h3><div class="pq-otros">${otros.map((x) => `<button type="button" class="chip chip-btn" data-pq-otro="${x}">${t("pq.b." + x)}</button>`).join("")}</div>` : ""}`;
  cuerpo.querySelector('[data-pq="ant"]').addEventListener("click", () => ir(paso - 1));
  cuerpo.querySelector('[data-pq="sig"]').addEventListener("click", () => ir(paso === n ? 1 : paso + 1));
  cuerpo.querySelectorAll("[data-pq-ir]").forEach((b) => b.addEventListener("click", () => ir(Number(b.dataset.pqIr))));
  cuerpo.querySelectorAll("[data-pq-otro]").forEach((b) => b.addEventListener("click", () => { actual = b.dataset.pqOtro; paso = 1; pintar(); cuerpo.scrollTop = 0; cuerpo.querySelector('[data-pq="sig"]')?.focus(); }));
}
/** Cambia de paso sin volver a pintar la escena: así las piezas se mueven de un estado al otro. */
function ir(p) {
  const e = PORQUE[actual]; if (!e) return;
  const n = e.pasos.length; p = Math.max(1, Math.min(n, p)); if (p === paso) return;
  paso = p;
  const c = dlg.querySelector("#pq-cuerpo");
  c.querySelector(".pq-escena").dataset.paso = String(p);
  c.querySelector(".pq-paso").innerHTML = `<b>${t("pq.paso", { n: p, t: n })}</b>${e.pasos[p - 1]}`;
  c.querySelector('[data-pq="ant"]').disabled = p === 1;
  c.querySelector('[data-pq="sig"]').textContent = p === n ? t("pq.otra_vez") : t("pq.siguiente");
  c.querySelectorAll("[data-pq-ir]").forEach((b) => { if (Number(b.dataset.pqIr) === p) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
}
/** Abre el explicador `id`. farmacos: id → nombres de la lista con ese mecanismo; presentes: otros explicadores de su lista. */
export function abrir(id, opts = {}) {
  if (!PORQUE[id]) return;
  if (!dlg) crear();
  actual = id; paso = 1; opciones = opts;
  pintar();
  if (!dlg.open) dlg.showModal();
  dlg.querySelector('[data-pq="sig"]')?.focus();
}
