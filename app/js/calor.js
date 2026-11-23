/* «Hoy hace calor» (mejora grande 10): la persona dice qué tiempo hace hoy (sin enviar su ubicación ni consultar ningún
   servicio) y la aplicación le dice cuándo moverse, cómo beber, qué ropa llevar, qué medicamentos de su lista importan con
   el calor (con su «¿Por qué?») y cuándo parar y pedir ayuda. Recomendaciones de la OMS (#KeepCool, 2026) y de las
   posturas del ACSM sobre líquidos (Sawka 2007) y golpe de calor al hacer ejercicio (Armstrong 2007). Las cuatro bandas
   de temperatura son orientativas: sirven para que cada uno sitúe su día, no son umbrales oficiales (esos dependen de la
   provincia). Textos de la interfaz en los cinco idiomas dentro del módulo; el consejo, en español como el resto de
   explicadores. Se carga al abrirlo. */
import { t, idioma } from "./i18n.js?v=202611230800";
import { tC, tL } from "./tr.js?v=202611230800";

export const NIVELES = 4; // 0 fresco o templado · 1 calor · 2 mucho calor · 3 calor extremo
/** Mecanismos de su lista que importan con calor: el calor en sí, el agua y las sales, y el sol. */
export const MECANISMOS = ["calor", "agua", "sol"];
/** Cuándo moverse, según el nivel del día. */
const CUANDO = tC([
  "Puede moverse a la hora que le venga bien. Si sale al sol, con gorra y una botella de agua.",
  "Mejor a primera hora de la mañana o al caer la tarde, y por la sombra; evite las horas centrales del día.",
  "Solo a primera hora de la mañana, antes de que apriete, o dentro de casa en un sitio fresco. Baje la intensidad (que pueda hablar con frases largas) y acorte la sesión si lo nota.",
  "Hoy, mejor sin ejercicio intenso fuera: una sesión corta y suave dentro, en la habitación más fresca, o déjela para mañana temprano. Intente pasar 2 o 3 horas del día en un sitio fresco.",
]);
const AGUA = tC([
  "Beba agua a menudo, antes, durante (a sorbos) y después, aunque no tenga sed; evite el alcohol y las bebidas azucaradas o con cafeína.",
  "Al hacer ejercicio, lo que se busca es no perder más del 2 % del peso por el sudor: si suda mucho, pésese antes y después y reponga lo perdido.",
]);
const AGUA_LIMITE = "Si su médico le ha limitado los líquidos (por el corazón o el riñón), siga su indicación y pregúntele qué hacer los días de calor.";
const AGUA_MAYOR = "Con los años se nota menos la sed: beba con horario, sin esperar a tenerla.";
const ROPA = tC(["Ropa ligera, holgada y de colores claros; gorra o sombrero si sale.", "Busque la sombra y, al volver, una ducha templada o paños húmedos ayudan a bajar la temperatura."]);
const SOL = "Alguno de sus medicamentos aumenta la sensibilidad al sol: protector solar alto y manga larga si va a estar al aire libre.";
const PARAR = tC(["Si nota mareo, dolor de cabeza, náuseas, calambres o un cansancio fuera de lo normal: pare, póngase a la sombra o en un sitio fresco, beba y refrésquese. Si no mejora en media hora o va a peor, pida ayuda médica.", "Si alguien está confuso, se comporta de forma extraña, convulsiona o pierde el conocimiento, o tiene la piel muy caliente (seca o empapada en sudor): llame al 112 y refrésquele mientras llega la ayuda."]);
export const FUENTES = tC([
  { txt: "OMS Europa. #KeepCool in the heat (hoja informativa, 8 de junio de 2026)" },
  { txt: "Sawka et al. ACSM position stand: exercise and fluid replacement. Med Sci Sports Exerc 2007", doi: "10.1249/mss.0b013e31802ca597" },
  { txt: "Armstrong et al. ACSM position stand: exertional heat illness during training and competition. Med Sci Sports Exerc 2007", doi: "10.1249/MSS.0b013e31802fa199" },
]);
/** El consejo del día: { cuando, agua[], ropa[], sol, parar[] } según el nivel, la edad, si tiene limitados los líquidos y los mecanismos de su lista. */
export function consejo(nivel, { edad = null, limiteLiquidos = false, mecanismos = [] } = {}) {
  const n = Math.max(0, Math.min(NIVELES - 1, Number(nivel) || 0));
  return {
    nivel: n, cuando: CUANDO[n],
    agua: [...AGUA, ...(edad != null && edad >= 65 ? [tL(AGUA_MAYOR)] : []), ...(limiteLiquidos ? [tL(AGUA_LIMITE)] : [])],
    ropa: ROPA, sol: mecanismos.includes("sol") ? tL(SOL) : "", parar: PARAR, limiteLiquidos,
  };
}
/** Los fármacos de su lista que importan con calor, con sus mecanismos (de los que hay «¿Por qué?»). */
export const farmacosConCalor = (items) => (items || []).map((x) => ({ nombre: x.nombre, ids: MECANISMOS.filter((m) => x.ids.includes(m)) })).filter((x) => x.ids.length);

export const TXT = {
  es: { titulo: "Calor y medicación", pregunta: "¿Qué tiempo hace hoy?", privado: "Usted elige el tiempo de hoy: no se usa su ubicación ni se consulta ningún servicio.", n0: "Fresco o templado", n1: "Calor", n2: "Mucho calor", n3: "Calor extremo", h0: "menos de 25 °C", h1: "unos 25–31 °C", h2: "32–37 °C o aviso amarillo o naranja", h3: "38 °C o más, o aviso rojo", hoy: "Hoy: {x}", cuando: "Cuándo moverse", agua: "Agua", ropa: "Ropa y sol", meds: "Su medicación y el calor", sin_meds: "Ninguno de sus medicamentos aumenta especialmente el riesgo con calor; lo demás sigue valiendo.", parar: "Pare y pida ayuda si…", fuentes: "Fuentes", nota: "Las bandas de temperatura son orientativas: si en su zona hay aviso por calor, haga caso al aviso.", guardado: "Recordado para hoy." },
  en: { titulo: "Heat and medication", pregunta: "What's the weather like today?", privado: "You choose today's weather: your location is not used and no service is consulted.", n0: "Cool or mild", n1: "Hot", n2: "Very hot", n3: "Extreme heat", h0: "below 25 °C", h1: "about 25–31 °C", h2: "32–37 °C or a yellow or orange warning", h3: "38 °C or more, or a red warning", hoy: "Today: {x}", cuando: "When to move", agua: "Water", ropa: "Clothes and sun", meds: "Your medication and the heat", sin_meds: "None of your medicines particularly increases the risk in the heat; the rest still applies.", parar: "Stop and get help if…", fuentes: "Sources", nota: "The temperature bands are a guide: if there is a heat warning in your area, follow the warning.", guardado: "Remembered for today." },
  ca: { titulo: "Calor i medicació", pregunta: "Quin temps fa avui?", privado: "Vostè tria el temps d'avui: no s'utilitza la seva ubicació ni es consulta cap servei.", n0: "Fresc o temperat", n1: "Calor", n2: "Molta calor", n3: "Calor extrema", h0: "menys de 25 °C", h1: "uns 25–31 °C", h2: "32–37 °C o avís groc o taronja", h3: "38 °C o més, o avís vermell", hoy: "Avui: {x}", cuando: "Quan moure's", agua: "Aigua", ropa: "Roba i sol", meds: "La seva medicació i la calor", sin_meds: "Cap dels seus medicaments augmenta especialment el risc amb calor; la resta continua valent.", parar: "Aturi's i demani ajuda si…", fuentes: "Fonts", nota: "Les franges de temperatura són orientatives: si a la seva zona hi ha avís per calor, faci cas a l'avís.", guardado: "Recordat per a avui." },
  gl: { titulo: "Calor e medicación", pregunta: "Que tempo fai hoxe?", privado: "Vostede escolle o tempo de hoxe: non se usa a súa localización nin se consulta ningún servizo.", n0: "Fresco ou temperado", n1: "Calor", n2: "Moita calor", n3: "Calor extrema", h0: "menos de 25 °C", h1: "uns 25–31 °C", h2: "32–37 °C ou aviso amarelo ou laranxa", h3: "38 °C ou máis, ou aviso vermello", hoy: "Hoxe: {x}", cuando: "Cando moverse", agua: "Auga", ropa: "Roupa e sol", meds: "A súa medicación e a calor", sin_meds: "Ningún dos seus medicamentos aumenta especialmente o risco coa calor; o demais segue valendo.", parar: "Pare e pida axuda se…", fuentes: "Fontes", nota: "As bandas de temperatura son orientativas: se na súa zona hai aviso por calor, faga caso ao aviso.", guardado: "Lembrado para hoxe." },
  eu: { titulo: "Beroa eta botikak", pregunta: "Zer eguraldi dago gaur?", privado: "Zuk aukeratzen duzu gaurko eguraldia: ez da zure kokapena erabiltzen ezta zerbitzurik kontsultatzen ere.", n0: "Fresko edo epel", n1: "Beroa", n2: "Bero handia", n3: "Muturreko beroa", h0: "25 °C baino gutxiago", h1: "25–31 °C inguru", h2: "32–37 °C edo abisu horia edo laranja", h3: "38 °C edo gehiago, edo abisu gorria", hoy: "Gaur: {x}", cuando: "Noiz mugitu", agua: "Ura", ropa: "Arropa eta eguzkia", meds: "Zure botikak eta beroa", sin_meds: "Zure botiketako batek ere ez du bereziki arriskua handitzen beroarekin; gainerakoak balio du.", parar: "Gelditu eta eskatu laguntza baldin eta…", fuentes: "Iturriak", nota: "Tenperatura-tarteak orientagarriak dira: zure eremuan bero-abisua badago, egin kasu abisuari.", guardado: "Gaurko gogoratuta." },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}

const TERM = "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0zM12 9v7";
const ic = (d) => `<svg class="cal-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const CSS = `
.cal-dlg .cal-priv { margin: 0 0 10px; font-size: .86rem; color: var(--muted); }
.cal-chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin: 0 0 12px; }
.cal-chips button { display: grid; gap: 2px; padding: 10px 12px; border: 1.5px solid var(--line-strong); border-radius: var(--r-md); background: var(--surface); color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.cal-chips button b { font-size: .95rem; }
.cal-chips button small { font-size: .76rem; color: var(--muted); }
.cal-chips button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--accent); }
.cal-chips button.n2[aria-pressed="true"] { border-color: var(--precaucion); background: var(--precaucion-soft); box-shadow: inset 0 0 0 1px var(--precaucion); }
.cal-chips button.n3[aria-pressed="true"] { border-color: var(--alerta); background: var(--alerta-soft); box-shadow: inset 0 0 0 1px var(--alerta); }
.cal-cab { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; align-items: center; margin: 0 0 6px; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--line); background: linear-gradient(135deg, var(--info-soft), var(--surface) 70%); }
.cal-cab.n1 { background: linear-gradient(135deg, var(--precaucion-soft), var(--surface) 70%); }
.cal-cab.n2 { border-color: var(--precaucion); background: linear-gradient(135deg, var(--precaucion-soft), var(--surface) 60%); }
.cal-cab.n3 { border-color: var(--alerta); background: linear-gradient(135deg, var(--alerta-soft), var(--surface) 60%); }
.cal-ic { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: var(--info); color: var(--surface); }
.cal-cab.n1 .cal-ic, .cal-cab.n2 .cal-ic { background: var(--precaucion); }
.cal-cab.n3 .cal-ic { background: var(--alerta); }
.cal-i { width: 28px; height: 28px; }
.cal-dlg .cal-cab h2 { margin: 0; font-size: 1.15rem; }
.cal-cab p { margin: 2px 0 0; font-size: .95rem; }
.cal-lista { margin: 4px 0 0; padding-left: 1.2em; display: grid; gap: 6px; }
.cal-lista li.fuerte { font-weight: 700; color: var(--precaucion-ink); }
.cal-meds { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 6px; }
.cal-meds li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 8px 12px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); }
.cal-meds b { margin-right: auto; }
.cal-parar { margin: 4px 0 0; padding: 10px 14px 10px 30px; border-radius: var(--r-md); background: var(--alerta-soft); color: var(--alerta-ink); display: grid; gap: 6px; }
.cal-nota { margin: 10px 0 0; font-size: .8rem; color: var(--muted); }
.cal-fuentes { margin: 6px 0 0; padding-left: 1.1em; display: grid; gap: 3px; font-size: .78rem; color: var(--muted); }
.cal-fuentes a { color: inherit; }
:root[data-theme="contrast"] .cal-cab { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .cal-cab { animation: cal-entra .35s var(--ease-salida, ease-out) both; } }
@keyframes cal-entra { from { opacity: 0; translate: 0 6px; } }
`;
let dlg = null, ctx = {};
const cu = () => dlg.querySelector("#cal-cuerpo");
function crear() {
  if (!document.getElementById("cal-css")) { const st = document.createElement("style"); st.id = "cal-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "calor"; dlg.className = "ficha cal-dlg"; dlg.setAttribute("aria-labelledby", "cal-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="cal-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="cal-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="cal-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#cal-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
function pintar() {
  const n = ctx.nivel, meds = farmacosConCalor(ctx.farmacos), mec = [...new Set(meds.flatMap((m) => m.ids))];
  const k = n == null ? null : consejo(n, { edad: ctx.edad, limiteLiquidos: ctx.limiteLiquidos, mecanismos: mec });
  cu().innerHTML = `<p class="cal-priv">${tx("privado")}</p>
    <div class="cal-chips" role="group" aria-label="${tx("pregunta")}">${[0, 1, 2, 3].map((i) => `<button type="button" class="n${i}" data-nivel="${i}" aria-pressed="${n === i}"><b>${tx("n" + i)}</b><small>${tx("h" + i)}</small></button>`).join("")}</div>
    ${k ? `<div class="cal-cab n${k.nivel}"><span class="cal-ic">${ic(TERM)}</span><div><h2>${tx("hoy", { x: tx("n" + k.nivel).toLowerCase() })}</h2><p>${k.cuando}</p></div></div>
      <h3>${tx("agua")}</h3><ul class="cal-lista">${k.agua.map((x) => `<li${x === tL(AGUA_LIMITE) ? ' class="fuerte"' : ""}>${x}</li>`).join("")}</ul>
      <h3>${tx("ropa")}</h3><ul class="cal-lista">${[...k.ropa, ...(k.sol ? [k.sol] : [])].map((x) => `<li>${x}</li>`).join("")}</ul>
      <h3>${tx("meds")}</h3>${meds.length ? `<ul class="cal-meds">${meds.map((m) => `<li><b>${m.nombre}</b>${m.ids.map((id) => `<button type="button" class="chip chip-btn pq-btn" data-porque="${id}">${t("pq.b." + id)}</button>`).join("")}</li>`).join("")}</ul>` : `<p>${tx("sin_meds")}</p>`}
      <h3>${tx("parar")}</h3><ul class="cal-parar">${k.parar.map((x) => `<li>${x}</li>`).join("")}</ul>
      <p class="cal-nota">${tx("nota")}</p>
      <p class="pq-fuentes">${tx("fuentes")}:</p><ul class="cal-fuentes">${FUENTES.map((f) => `<li>${f.txt}${f.doi ? ` · <a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : ""}</li>`).join("")}</ul>` : ""}`;
  cu().querySelectorAll("[data-nivel]").forEach((b) => b.addEventListener("click", () => { ctx.nivel = Number(b.dataset.nivel); ctx.guardar?.(ctx.nivel); pintar(); cu().querySelector(`[data-nivel="${ctx.nivel}"]`)?.focus(); }));
}
/** Abre «Calor y medicación». c: { nivel (o null), edad, limiteLiquidos, farmacos: [{ nombre, ids }], guardar(nivel) }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c;
  dlg.querySelector("#cal-cab-t").textContent = tx("titulo");
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
