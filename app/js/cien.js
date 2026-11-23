/* «De cada 100 personas…» (segunda tanda de mejoras grandes, 10). Se carga bajo demanda (data-abre="cien").
   Seis cajas de datos al estilo del Harding Center: qué les pasa a 100 personas como usted sin ejercicio y con ejercicio, en
   números absolutos y con un dibujo de 100 puntos; debajo, lo que no cambia, los efectos no deseados, el tipo de estudio, la
   certeza y la fuente con DOI. Las que corresponden a la situación clínica marcada salen primero.
   CONTENIDO CLÍNICO NUEVO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA. Las cifras son las de los resúmenes de PubMed (comprobadas
   el 22/11/2026) y se guardan exactas en «x»; lo que se enseña es su redondeo a personas enteras. La revisión de cardiopatía
   isquémica no da las cifras de cada grupo, solo la diferencia (NNT): se enseña así. Contenido en español, como la base;
   la interfaz, en cinco idiomas. */
import { idioma } from "./i18n.js?v=202611230207";

const TXT = {
  es: { titulo: "De cada 100 personas…", borrador: "Borrador pendiente de revisión clínica", intro: "Los porcentajes engañan; las personas se cuentan mejor. Aquí verá qué les pasa a 100 personas sin ejercicio y con ejercicio, según los mejores estudios.", para_usted: "Para su situación", otras: "Otras situaciones", todas: "Las seis cajas",
    sin: "Sin ejercicio", menos: "{n} de cada 100 lo evitan.", mas: "{n} más de cada 100 lo consiguen.", igual: "Sin diferencia clara.", solo_dif: "{n} menos de cada 100", exacto: "Cifras del estudio", certeza: "Certeza", estudio: "Tipo de estudio", fuente: "Fuente",
    ley_si: "le pasa", ley_si_mas: "lo consigue", ley_dif: "la diferencia", ley_no: "no le pasa", ley_no_mas: "no lo consigue", ley_resto: "no se sabe: la revisión solo da la diferencia", aria_array: "{t}: {n} de 100",
    nota: "Son medias de grupos: nadie puede saber si usted será una de esas personas. Sirven para hacerse una idea del tamaño del efecto y hablarlo con su médico.",
  },
  en: { titulo: "Out of 100 people…", borrador: "Draft pending clinical review", intro: "Percentages mislead; people are easier to count. Here you can see what happens to 100 people without exercise and with exercise, according to the best studies.", para_usted: "For your situation", otras: "Other situations", todas: "The six boxes",
    sin: "Without exercise", menos: "{n} in 100 avoid it.", mas: "{n} more in 100 achieve it.", igual: "No clear difference.", solo_dif: "{n} fewer in 100", exacto: "Study figures", certeza: "Certainty", estudio: "Type of study", fuente: "Source",
    ley_si: "it happens", ley_si_mas: "achieves it", ley_dif: "the difference", ley_no: "it does not happen", ley_no_mas: "does not achieve it", ley_resto: "unknown: the review only gives the difference", aria_array: "{t}: {n} of 100",
    nota: "These are group averages: nobody can know whether you will be one of those people. They give an idea of the size of the effect, to discuss with your doctor.",
  },
  ca: { titulo: "De cada 100 persones…", borrador: "Esborrany pendent de revisió clínica", intro: "Els percentatges enganyen; les persones es compten millor. Aquí veureu què els passa a 100 persones sense exercici i amb exercici, segons els millors estudis.", para_usted: "Per a la vostra situació", otras: "Altres situacions", todas: "Les sis caixes",
    sin: "Sense exercici", menos: "{n} de cada 100 ho eviten.", mas: "{n} més de cada 100 ho aconsegueixen.", igual: "Sense diferència clara.", solo_dif: "{n} menys de cada 100", exacto: "Xifres de l'estudi", certeza: "Certesa", estudio: "Tipus d'estudi", fuente: "Font",
    ley_si: "li passa", ley_si_mas: "ho aconsegueix", ley_dif: "la diferència", ley_no: "no li passa", ley_no_mas: "no ho aconsegueix", ley_resto: "no se sap: la revisió només dona la diferència", aria_array: "{t}: {n} de 100",
    nota: "Són mitjanes de grups: ningú no pot saber si sereu una d'aquestes persones. Serveixen per fer-se una idea de la mida de l'efecte i parlar-ne amb el metge.",
  },
  gl: { titulo: "De cada 100 persoas…", borrador: "Borrador pendente de revisión clínica", intro: "As porcentaxes enganan; as persoas cóntanse mellor. Aquí verá que lles pasa a 100 persoas sen exercicio e con exercicio, segundo os mellores estudos.", para_usted: "Para a súa situación", otras: "Outras situacións", todas: "As seis caixas",
    sin: "Sen exercicio", menos: "{n} de cada 100 evítano.", mas: "{n} máis de cada 100 conségueno.", igual: "Sen diferenza clara.", solo_dif: "{n} menos de cada 100", exacto: "Cifras do estudo", certeza: "Certeza", estudio: "Tipo de estudo", fuente: "Fonte",
    ley_si: "pásalle", ley_si_mas: "conségueo", ley_dif: "a diferenza", ley_no: "non lle pasa", ley_no_mas: "non o consegue", ley_resto: "non se sabe: a revisión só dá a diferenza", aria_array: "{t}: {n} de 100",
    nota: "Son medias de grupos: ninguén pode saber se vostede será unha desas persoas. Serven para facerse unha idea do tamaño do efecto e falalo co seu médico.",
  },
  eu: { titulo: "100 pertsonatik…", borrador: "Zirriborroa, berrikuspen klinikoaren zain", intro: "Ehunekoek nahastu egiten dute; pertsonak errazago zenbatzen dira. Hemen ikusiko duzu zer gertatzen zaien 100 pertsonari ariketarik gabe eta ariketarekin, ikerketa onenen arabera.", para_usted: "Zure egoerarako", otras: "Beste egoera batzuk", todas: "Sei kutxak",
    sin: "Ariketarik gabe", menos: "100etik {n}k saihesten dute.", mas: "100etik {n}k gehiagok lortzen dute.", igual: "Alde argirik gabe.", solo_dif: "100etik {n} gutxiago", exacto: "Ikerketaren zifrak", certeza: "Ziurtasuna", estudio: "Ikerketa mota", fuente: "Iturria",
    ley_si: "gertatzen zaio", ley_si_mas: "lortzen du", ley_dif: "aldea", ley_no: "ez zaio gertatzen", ley_no_mas: "ez du lortzen", ley_resto: "ez dakigu: berrikuspenak aldea bakarrik ematen du", aria_array: "{t}: 100etik {n}",
    nota: "Taldeen batezbestekoak dira: inork ezin du jakin zu pertsona horietako bat izango zaren. Efektuaren tamainaz jabetzeko eta medikuarekin hitz egiteko balio dute.",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Las cajas. filas: { t, x: [sin, con] exactos por 100 personas (o dif: personas de cada 100, si la fuente solo da la diferencia),
   ex: cifras tal como las da el estudio, cert: certeza (GRADE) si la da, mejor: "menos" (por defecto) | "mas", igual: sin diferencia clara }.
   La primera fila es la del dibujo. aplica(d): d = { conds: Set, edad, caidas }. */
export const CAJAS = [
  { id: "caidas", titulo: "Caídas en personas mayores", quien: "De cada 100 personas de 60 años o más que viven en su casa, a lo largo de un año:", con: "Con un programa de ejercicio",
    filas: [{ t: "Se caen al menos una vez", x: [48, 40.8], ex: "480 y 408 de cada 1000", cert: "alta" }],
    notas: ["Contando todas las caídas (una persona puede caerse varias veces): 850 por cada 1000 personas sin ejercicio y 655 con ejercicio, 195 menos.", "Los programas que las reducen son sobre todo los de equilibrio y ejercicios funcionales, solos o con fuerza.", "Lo que apenas cambia: la calidad de vida (certeza baja).", "Efectos no deseados: casi siempre leves, sobre todo molestias de músculos y articulaciones."],
    tipo: "Revisión Cochrane de 108 ensayos (23 407 personas)", f: { cita: "Sherrington et al., Cochrane Database Syst Rev 2019", doi: "10.1002/14651858.CD012424.pub2" }, aplica: (d) => (d.edad || 0) >= 60 || !!d.caidas },
  { id: "ic", titulo: "Insuficiencia cardiaca", quien: "De cada 100 personas con insuficiencia cardiaca, en el primer año:", con: "Con rehabilitación con ejercicio",
    filas: [{ t: "Ingresan en el hospital por cualquier causa", x: [23.7, 16.5], ex: "23,7 % y 16,5 %", cert: "moderada" }, { t: "Ingresan por la insuficiencia cardiaca", x: [11.1, 7.1], ex: "11,1 % y 7,1 %", cert: "baja" }, { t: "Fallecen", x: [5.8, 5.1], ex: "5,8 % y 5,1 %", cert: "baja", igual: true }],
    notas: ["La diferencia en la mortalidad del primer año no es clara: puede deberse al azar.", "La calidad de vida puede mejorar de forma apreciable (certeza baja)."],
    tipo: "Revisión Cochrane de 44 ensayos (5783 personas)", f: { cita: "Long et al., Cochrane Database Syst Rev 2019", doi: "10.1002/14651858.CD003331.pub5" }, aplica: (d) => d.conds.has("insuficiencia_cardiaca") },
  { id: "ci", titulo: "Tras un infarto, un stent o un bypass", quien: "De cada 100 personas con enfermedad coronaria (infarto, stent, bypass o angina), entre 6 y 12 meses después:", con: "Con rehabilitación con ejercicio",
    filas: [{ t: "Ingresos en el hospital por cualquier causa", dif: 100 / 12, ex: "uno evitado por cada 12 personas (riesgo relativo 0,58)", cert: "moderada" }, { t: "Infartos", dif: 100 / 75, ex: "uno evitado por cada 75 personas (riesgo relativo 0,72)", cert: "alta" }],
    notas: ["La revisión da la diferencia (a cuántas personas hay que tratar para evitar un caso), no las cifras de cada grupo: por eso aquí no hay dos columnas.", "Mortalidad cardiovascular en el primer año: poca o ninguna diferencia (certeza moderada); a más largo plazo puede reducirse."],
    tipo: "Revisión Cochrane de 85 ensayos (23 430 personas)", f: { cita: "Dibben et al., Cochrane Database Syst Rev 2021", doi: "10.1002/14651858.CD001800.pub4" }, aplica: (d) => d.conds.has("cardiopatia_isquemica") },
  { id: "fa", titulo: "Fibrilación auricular", quien: "De cada 100 personas con fibrilación auricular con síntomas, al cabo de un año:", con: "Con 6 meses de ejercicio aeróbico",
    filas: [{ t: "Siguen sin fibrilación", x: [20, 40], ex: "20 % y 40 %", mejor: "mas" }],
    notas: ["También se redujeron los síntomas.", "Es un solo ensayo, con 120 personas: la cifra puede cambiar con más estudios."],
    tipo: "Ensayo aleatorizado (120 personas)", f: { cita: "Elliott et al., JACC Clin Electrophysiol 2023", doi: "10.1016/j.jacep.2022.12.002" }, aplica: (d) => d.conds.has("fibrilacion_auricular") },
  { id: "dm2", titulo: "Diabetes tipo 2: menos medicación", quien: "De cada 100 personas con diabetes tipo 2 de menos de diez años y sin insulina, al cabo de un año:", con: "Con ejercicio intensivo (5 o 6 sesiones por semana) y dieta", sin: "Con los cuidados habituales",
    filas: [{ t: "Pueden reducir la medicación para la glucosa", x: [26.4, 73.5], ex: "26,4 % y 73,5 % (diferencia: 47,1 puntos)", mejor: "mas" }],
    notas: ["La reducción la decidió el equipo médico según los análisis: nadie la dejó por su cuenta.", "Efectos no deseados: 32 en el grupo de ejercicio (64 personas) y 5 en el otro (34 personas), sobre todo molestias de músculos y articulaciones y bajadas leves de azúcar.", "Es un solo ensayo, con 98 personas."],
    tipo: "Ensayo aleatorizado (98 personas, 12 meses)", f: { cita: "Johansen et al., JAMA 2017", doi: "10.1001/jama.2017.10169" }, aplica: (d) => d.conds.has("diabetes") },
  { id: "prediabetes", titulo: "Evitar la diabetes cuando el azúcar ya está alto", quien: "De cada 100 personas con la glucosa alta (sin llegar a diabetes) y sobrepeso, cada año:", con: "Con 150 minutos de actividad a la semana y un 7 % menos de peso", sin: "Sin el programa",
    filas: [{ t: "Desarrollan diabetes", x: [11.0, 4.8], ex: "11,0 y 4,8 casos por 100 personas y año" }],
    notas: ["Con metformina fueron 8 (7,8): los cambios de vida funcionaron mejor que el fármaco.", "Haría falta que 7 personas siguieran el programa tres años para evitar un caso (6,9).", "El programa unía actividad física y pérdida de peso: no se puede separar cuánto se debe a cada cosa."],
    tipo: "Ensayo aleatorizado (3234 personas, 2,8 años de seguimiento)", f: { cita: "Knowler et al., N Engl J Med 2002 (Diabetes Prevention Program)", doi: "10.1056/NEJMoa012512" }, aplica: (d) => d.conds.has("obesidad") && !d.conds.has("diabetes") },
];
const red = (v) => Math.round(v + 1e-9);
/** Los números que se enseñan de una fila: personas enteras de cada 100 y la diferencia. */
export function numeros(f) {
  if (f.dif != null) return { solo: true, dif: red(f.dif) };
  const sin = red(f.x[0]), con = red(f.x[1]);
  return { solo: false, sin, con, dif: Math.abs(sin - con), mas: f.mejor === "mas" };
}
/** La frase que resume la primera fila. */
export function lectura(f) {
  const n = numeros(f);
  if (f.igual) return tx("igual");
  if (n.solo) return tx("solo_dif", { n: n.dif }) + ".";
  return tx(n.mas ? "mas" : "menos", { n: n.dif });
}
/** Las cajas que corresponden a la persona (ids). */
export const propias = (d) => CAJAS.filter((c) => c.aplica(d)).map((c) => c.id);

const CSS = `
.cn-dlg { width: min(820px, calc(100vw - 16px)); }
.cn-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.cn-intro { margin: 0 0 6px; color: var(--muted); }
.cn-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.cn-caja { margin: 0 0 12px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.cn-caja.mia { border-color: var(--accent); }
.cn-caja h4 { margin: 0 0 2px; font-size: 1.12rem; line-height: 1.25; }
.cn-quien { margin: 0 0 10px; color: var(--muted); font-size: .92rem; }
.cn-tabla { width: 100%; border-collapse: collapse; }
.cn-tabla th, .cn-tabla td { padding: 8px 6px; border-top: 1px solid var(--line); text-align: left; vertical-align: top; }
.cn-tabla thead th { border-top: 0; font-size: .78rem; font-weight: 700; color: var(--muted); line-height: 1.25; }
.cn-tabla tbody th { font-weight: 600; line-height: 1.3; }
.cn-tabla td { width: 22%; } .cn-tabla thead td { border-top: 0; }
.cn-tabla td b { display: block; font-family: var(--mono); font-size: 1.5rem; line-height: 1; }
.cn-tabla tbody th small { display: block; margin-top: 2px; color: var(--muted); font-size: .76rem; font-weight: 400; }
.cn-tabla td.con b { color: var(--accent-deep, var(--accent)); }
.cn-dibujo { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: end; margin: 12px 0 0; }
.cn-dibujo.uno { grid-template-columns: minmax(0, 220px); }
.cn-dibujo figure { margin: 0; }
.cn-dibujo figcaption { margin: 0 0 4px; font-size: .78rem; font-weight: 700; color: var(--muted); }
.cn-dibujo svg { display: block; width: 100%; max-width: 220px; height: auto; }
.cn-p-no { fill: var(--line-strong); } .cn-p-si { fill: var(--alerta); } .cn-p-si.mas { fill: var(--info); }
.cn-p-dif { fill: none; stroke: var(--accent); stroke-width: 2; }
.cn-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 0 0; padding: 0; list-style: none; font-size: .78rem; color: var(--muted); }
.cn-ley li { display: inline-flex; align-items: center; gap: 5px; } .cn-ley svg { width: 12px; height: 12px; }
.cn-lee { margin: 10px 0 0; padding: 8px 12px; border-left: 4px solid var(--accent); border-radius: var(--r-sm); background: var(--accent-soft); font-weight: 700; }
.cn-notas { margin: 10px 0 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: .9rem; }
.cn-meta { margin: 10px 0 0; font-size: .8rem; color: var(--muted); }
.cn-meta a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
.cn-dlg a:focus-visible, .cn-dlg button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.cn-nota { margin: 14px 0 0; font-size: .84rem; color: var(--muted); }
@media (max-width: 520px) { .cn-tabla td { width: 27%; } .cn-tabla td b { font-size: 1.3rem; } }
@media (forced-colors: active) { .cn-p-si { fill: CanvasText; } .cn-p-no { fill: GrayText; } .cn-p-dif { stroke: Highlight; } }
/* 861-863: figuras de persona en lugar de puntos, la columna «con ejercicio» resaltada y las figuras que entran contando */
.cn-p-dif { stroke-width: .9; fill: color-mix(in srgb, var(--accent) 16%, transparent); }
.cn-p-no { opacity: .55; }
.cn-tabla td.con { background: linear-gradient(180deg, var(--accent-soft), transparent 3.2em); box-shadow: inset 0 3px 0 var(--accent); border-radius: 8px 8px 0 0; }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .cn-caja svg g[style] { animation: cn-cuenta .28s ease-out both; animation-delay: calc(var(--i) * 7ms); } }
@keyframes cn-cuenta { from { opacity: 0; } }
:root[data-theme="contrast"] .cn-tabla td.con { background: none; }
`;
/** Figura de una persona (cabeza y tronco) en una casilla de 10 × 10, centrada en el origen. */
const PERSONA = '<circle cy="-2.6" r="1.7"/><path d="M-2.6 4v-2.2a2.6 2.6 0 0 1 5.2 0V4z"/>';
/** Dibujo de 100 figuras: las primeras «si» llenas, las «dif» siguientes en contorno y el resto apagadas. */
export function puntos(si, dif, mas = false) {
  let s = "";
  for (let i = 0; i < 100; i++) { const cx = 5 + (i % 10) * 10, cy = 5 + Math.floor(i / 10) * 10; const cls = i < si ? "cn-p-si" + (mas ? " mas" : "") : i < si + dif ? "cn-p-dif" : "cn-p-no"; s += `<g class="${cls}" transform="translate(${cx} ${cy})${cls === "cn-p-no" ? " scale(.6)" : ""}" style="--i:${i}">${PERSONA}</g>`; }
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${s}</svg>`;
}
const muestra = (cls, r) => `<svg viewBox="-6 -6 12 12" aria-hidden="true"><g class="${cls}" transform="scale(${(r / 3.4).toFixed(2)})">${PERSONA}</g></svg>`;

let dlg = null, A = null, mias = [];
const cu = () => dlg.querySelector("#cn-cuerpo");
/** Lo que la aplicación sabe de la persona. */
export const contexto = (api) => ({ conds: new Set(api.estado.condiciones || []), edad: api.estado.edad || null, caidas: !!api.estado.caidas });
function caja(c) {
  const f0 = c.filas[0], n0 = numeros(f0), solo = n0.solo;
  const sinT = c.sin || tx("sin");
  const fila = (f) => { const n = numeros(f), pie = `<small>${tx("exacto")}: ${f.ex}${f.cert ? ` · ${tx("certeza")}: ${f.cert}` : ""}${f.igual ? ` · ${tx("igual")}` : ""}</small>`; return n.solo ? `<tr><th scope="row">${f.t}${pie}</th><td class="con" colspan="2"><b>−${n.dif}</b></td></tr>` : `<tr><th scope="row">${f.t}${pie}</th><td><b>${n.sin}</b></td><td class="con"><b>${n.con}</b></td></tr>`; };
  const etiqueta = (t, n) => tx("aria_array", { t, n });
  const dibujo = solo
    ? `<div class="cn-dibujo uno"><figure role="img" aria-label="${tx("solo_dif", { n: n0.dif })}: ${f0.t}"><figcaption>${c.con}</figcaption>${puntos(0, n0.dif)}</figure></div>`
    : n0.mas
      ? `<div class="cn-dibujo"><figure role="img" aria-label="${etiqueta(sinT, n0.sin)}"><figcaption>${sinT}</figcaption>${puntos(n0.sin, 0, true)}</figure><figure role="img" aria-label="${etiqueta(c.con, n0.con)}"><figcaption>${c.con}</figcaption>${puntos(n0.sin, n0.con - n0.sin, true)}</figure></div>`
      : `<div class="cn-dibujo"><figure role="img" aria-label="${etiqueta(sinT, n0.sin)}"><figcaption>${sinT}</figcaption>${puntos(n0.sin, 0)}</figure><figure role="img" aria-label="${etiqueta(c.con, n0.con)}"><figcaption>${c.con}</figcaption>${puntos(n0.con, n0.sin - n0.con)}</figure></div>`;
  const ley = solo ? [["cn-p-dif", 3.6, tx("ley_dif")], ["cn-p-no", 2, tx("ley_resto")]] : [["cn-p-si" + (n0.mas ? " mas" : ""), 4.5, tx(n0.mas ? "ley_si_mas" : "ley_si")], ["cn-p-dif", 3.6, tx("ley_dif")], ["cn-p-no", 2, tx(n0.mas ? "ley_no_mas" : "ley_no")]];
  return `<article class="cn-caja${mias.includes(c.id) ? " mia" : ""}" id="cn-${c.id}" data-id="${c.id}"><h4>${c.titulo}</h4><p class="cn-quien">${c.quien}</p>
    <table class="cn-tabla"><thead><tr><td></td>${solo ? `<th scope="col" colspan="2">${c.con}</th>` : `<th scope="col">${sinT}</th><th scope="col">${c.con}</th>`}</tr></thead><tbody>${c.filas.map(fila).join("")}</tbody></table>
    ${dibujo}<ul class="cn-ley" aria-hidden="true">${ley.map(([cls, r, t]) => `<li>${muestra(cls, r)}${t}</li>`).join("")}</ul>
    <p class="cn-lee">${f0.t}: ${lectura(f0).replace(/^./, (ch) => ch.toLowerCase())}</p>
    <ul class="cn-notas">${c.notas.map((x) => `<li>${x}</li>`).join("")}</ul>
    <p class="cn-meta"><b>${tx("estudio")}:</b> ${c.tipo}. <b>${tx("fuente")}:</b> ${c.f.cita}. <a href="https://doi.org/${c.f.doi}" target="_blank" rel="noopener">doi:${c.f.doi}</a></p></article>`;
}
function crear() {
  if (!document.getElementById("cn-css")) { const st = document.createElement("style"); st.id = "cn-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "cien"; dlg.className = "ficha alta cn-dlg"; dlg.setAttribute("aria-labelledby", "cn-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="cn-cab-t"></p><button type="button" class="btn-sec sm" id="cn-cerrar"></button></div><div class="ficha-cuerpo" id="cn-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#cn-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
function pintar() {
  dlg.querySelector("#cn-cab-t").textContent = tx("titulo");
  const a = CAJAS.filter((c) => mias.includes(c.id)), b = CAJAS.filter((c) => !mias.includes(c.id));
  cu().innerHTML = `<p class="cn-borrador">${tx("borrador")}</p><p class="cn-intro">${tx("intro")}</p>
    ${a.length ? `<h3>${tx("para_usted")}</h3><div id="cn-mias">${a.map(caja).join("")}</div>` : ""}
    <h3>${a.length ? tx("otras") : tx("todas")}</h3><div id="cn-resto">${b.map(caja).join("")}</div>
    <p class="cn-nota">${tx("nota")}</p>`;
}
/** Abre la ventana. arg = id de la caja a la que ir (opcional). */
export function abrir(api, arg = null) {
  A = api;
  if (!dlg) crear();
  mias = propias(contexto(api));
  dlg.querySelector("#cn-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  if (arg && CAJAS.some((c) => c.id === arg)) dlg.querySelector("#cn-" + arg)?.scrollIntoView({ block: "start" });
  dlg.querySelector("#cn-cerrar").focus();
}
