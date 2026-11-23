/* Su medicación en el cuerpo (segunda tanda de mejoras grandes, 9). Se carga bajo demanda (data-abre="cuerpo").
   Una figura con once zonas: en cada una, qué hacen ahí los medicamentos de la lista, con el cuidado al moverse y el enlace
   a su «¿Por qué?». No añade contenido clínico: los efectos son las señales de la base revisada (kb.senales) tal como están,
   los cuidados son los del panel de hoy («cuid.*») y las explicaciones, las de js/porque.js. Aquí solo se reparten por zonas.
   Textos de la interfaz en cinco idiomas. */
import { t, idioma } from "./i18n.js?v=202611231042";

const TXT = {
  es: { titulo: "Su medicación en el cuerpo", intro: "Toque una zona para ver qué hacen ahí sus medicamentos y qué conviene cuidar al moverse.", resumen: "Su medicación actúa en <b>{a}</b> de {b} zonas.", resumen0: "Con su lista de hoy, ninguna zona pide un cuidado especial al moverse.",
    zonas: "Zonas del cuerpo", n1: "1 medicamento actúa aquí", n: "{n} medicamentos actúan aquí", n0: "Ninguno de sus medicamentos actúa aquí de forma que cambie el ejercicio.", cuida: "Al moverse", ficha: "Ver la ficha de {x}", sin_meds: "Añada su medicación y verá dónde actúa cada medicamento.", anadir: "Añadir medicación",
    nota: "Los efectos que se enseñan son los de la base revisada de esta aplicación. Que un medicamento pueda actuar en una zona no significa que a usted le vaya a pasar.", cuenta1: "1 medicamento", cuenta: "{n} medicamentos", cuenta0: "ninguno", varios: "Algunos medicamentos actúan en más de una zona.",
    z_cerebro: "Cerebro y equilibrio", z_defensas: "Defensas", z_corazon: "Corazón y circulación", z_higado: "Hígado", z_azucar: "Azúcar en sangre", z_rinon: "Riñón, agua y sales", z_piel: "Piel y calor", z_sangre: "Sangre", z_hueso: "Hueso", z_musculo: "Músculo", z_tendon: "Tendones",
  },
  en: { titulo: "Your medication in your body", intro: "Tap an area to see what your medicines do there and what to look after when you move.", resumen: "Your medication acts on <b>{a}</b> of {b} areas.", resumen0: "With today's list, no area needs special care when you move.",
    zonas: "Body areas", n1: "1 medicine acts here", n: "{n} medicines act here", n0: "None of your medicines acts here in a way that changes exercise.", cuida: "When you move", ficha: "See the sheet for {x}", sin_meds: "Add your medication to see where each medicine acts.", anadir: "Add medication",
    nota: "The effects shown come from this app's reviewed knowledge base. That a medicine can act on an area does not mean it will happen to you.", cuenta1: "1 medicine", cuenta: "{n} medicines", cuenta0: "none", varios: "Some medicines act on more than one area.",
    z_cerebro: "Brain and balance", z_defensas: "Immune defences", z_corazon: "Heart and circulation", z_higado: "Liver", z_azucar: "Blood sugar", z_rinon: "Kidney, water and salts", z_piel: "Skin and heat", z_sangre: "Blood", z_hueso: "Bone", z_musculo: "Muscle", z_tendon: "Tendons",
  },
  ca: { titulo: "La vostra medicació al cos", intro: "Toqueu una zona per veure què hi fan els vostres medicaments i què convé cuidar en moure-us.", resumen: "La vostra medicació actua en <b>{a}</b> de {b} zones.", resumen0: "Amb la llista d'avui, cap zona demana una cura especial en moure-us.",
    zonas: "Zones del cos", n1: "1 medicament actua aquí", n: "{n} medicaments actuen aquí", n0: "Cap dels vostres medicaments actua aquí de manera que canviï l'exercici.", cuida: "En moure-us", ficha: "Veure la fitxa de {x}", sin_meds: "Afegiu la vostra medicació i veureu on actua cada medicament.", anadir: "Afegir medicació",
    nota: "Els efectes que es mostren són els de la base revisada d'aquesta aplicació. Que un medicament pugui actuar en una zona no vol dir que us hagi de passar.", cuenta1: "1 medicament", cuenta: "{n} medicaments", cuenta0: "cap", varios: "Alguns medicaments actuen en més d'una zona.",
    z_cerebro: "Cervell i equilibri", z_defensas: "Defenses", z_corazon: "Cor i circulació", z_higado: "Fetge", z_azucar: "Sucre a la sang", z_rinon: "Ronyó, aigua i sals", z_piel: "Pell i calor", z_sangre: "Sang", z_hueso: "Os", z_musculo: "Múscul", z_tendon: "Tendons",
  },
  gl: { titulo: "A súa medicación no corpo", intro: "Toque unha zona para ver que fan aí os seus medicamentos e que convén coidar ao moverse.", resumen: "A súa medicación actúa en <b>{a}</b> de {b} zonas.", resumen0: "Coa lista de hoxe, ningunha zona pide un coidado especial ao moverse.",
    zonas: "Zonas do corpo", n1: "1 medicamento actúa aquí", n: "{n} medicamentos actúan aquí", n0: "Ningún dos seus medicamentos actúa aquí de forma que cambie o exercicio.", cuida: "Ao moverse", ficha: "Ver a ficha de {x}", sin_meds: "Engada a súa medicación e verá onde actúa cada medicamento.", anadir: "Engadir medicación",
    nota: "Os efectos que se amosan son os da base revisada desta aplicación. Que un medicamento poida actuar nunha zona non significa que a vostede lle vaia pasar.", cuenta1: "1 medicamento", cuenta: "{n} medicamentos", cuenta0: "ningún", varios: "Algúns medicamentos actúan en máis dunha zona.",
    z_cerebro: "Cerebro e equilibrio", z_defensas: "Defensas", z_corazon: "Corazón e circulación", z_higado: "Fígado", z_azucar: "Azucre no sangue", z_rinon: "Ril, auga e sales", z_piel: "Pel e calor", z_sangre: "Sangue", z_hueso: "Óso", z_musculo: "Músculo", z_tendon: "Tendóns",
  },
  eu: { titulo: "Zure botikak gorputzean", intro: "Ukitu gune bat zure botikek han zer egiten duten eta mugitzean zer zaindu behar den ikusteko.", resumen: "Zure botikek {b} gunetatik <b>{a}</b>(e)tan eragiten dute.", resumen0: "Gaurko zerrendarekin, gune batek ere ez du zaintza berezirik eskatzen mugitzean.",
    zonas: "Gorputzeko guneak", n1: "Botika 1ek eragiten du hemen", n: "{n} botikak eragiten dute hemen", n0: "Zure botiketako batek ere ez du hemen ariketa aldatzeko moduan eragiten.", cuida: "Mugitzean", ficha: "Ikusi {x} botikaren fitxa", sin_meds: "Gehitu zure botikak eta bakoitzak non eragiten duen ikusiko duzu.", anadir: "Gehitu botikak",
    nota: "Erakusten diren efektuak aplikazio honen oinarri berrikusikoak dira. Botika batek gune batean eragin dezakeenak ez du esan nahi zuri gertatuko zaizunik.", cuenta1: "botika 1", cuenta: "{n} botika", cuenta0: "bat ere ez", varios: "Botika batzuek gune batean baino gehiagotan eragiten dute.",
    z_cerebro: "Garuna eta oreka", z_defensas: "Defentsak", z_corazon: "Bihotza eta zirkulazioa", z_higado: "Gibela", z_azucar: "Odoleko azukrea", z_rinon: "Giltzurruna, ura eta gatzak", z_piel: "Azala eta beroa", z_sangre: "Odola", z_hueso: "Hezurra", z_musculo: "Giharra", z_tendon: "Tendoiak",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Las once zonas, de arriba abajo: señales de la base que se enseñan en cada una y dónde va su punto en la figura (en % de la caja).
   Una señal puede estar en dos zonas (el efecto anticolinérgico: confusión y menos sudor). */
export const ZONAS = [
  { id: "cerebro", s: ["sedacion", "caidas", "anticolinergico", "serotoninergico"], x: 50, y: 8.6 },
  { id: "defensas", s: ["inmunosupresion"], x: 50, y: 19.1 },
  { id: "corazon", s: ["bradicardia", "fc_no_valida", "taquicardia", "qt", "hipotension", "hipertension"], x: 58, y: 27.7 },
  { id: "higado", s: ["hepatotoxico"], x: 40, y: 35 },
  { id: "azucar", s: ["hipoglucemia", "enmascara_hipoglucemia"], x: 60, y: 39.5 },
  { id: "rinon", s: ["deshidratacion", "renal", "hiperpotasemia", "hipopotasemia", "hiponatremia", "litio"], x: 46, y: 47.5 },
  { id: "piel", s: ["calor", "fotosensibilidad", "anticolinergico"], x: 82, y: 40 },
  { id: "sangre", s: ["sangrado", "trombosis"], x: 18, y: 40 },
  { id: "hueso", s: ["hueso"], x: 59, y: 59.5 },
  { id: "musculo", s: ["miopatia", "perdida_muscular", "fatiga"], x: 41, y: 68 },
  { id: "tendon", s: ["tendon"], x: 58, y: 91 },
];
/** Señales de la base que no son un efecto en una zona: las que solo marcan la familia del medicamento y el aviso de dopaje. */
export const MARCAS = ["ieca_ara", "diuretico", "aine", "estatina", "fibrato", "corticoide", "dopaje"];

/** Reparte el perfil del informe (señal → medicamentos) por zonas. perfil = res.perfil; senales = kb.senales (textos revisados).
    Devuelve, por zona: efectos [{ s, texto, meds: [{ pid, nombre }] }] y meds (sin repetir). */
export function mapa(perfil, senales) {
  return ZONAS.map((z) => {
    const efectos = z.s.filter((s) => senales?.[s] && perfil?.[s]?.length).map((s) => ({ s, texto: senales[s], meds: perfil[s].map((it) => ({ pid: it.principio.id, nombre: it.principio.nombre })) }));
    const vistos = new Map(); for (const e of efectos) for (const m of e.meds) vistos.set(m.pid, m);
    return { id: z.id, x: z.x, y: z.y, efectos, meds: [...vistos.values()] };
  });
}
/** La zona que se abre al entrar: la que más medicamentos reúne (a igualdad, la de más arriba); sin ninguno, null. */
export const zonaInicial = (m) => m.reduce((mejor, z) => (z.meds.length > (mejor?.meds.length || 0) ? z : mejor), null)?.id || null;

const CSS = `
.cp-dlg { width: min(880px, calc(100vw - 16px)); }
.cp-intro { margin: 0 0 6px; color: var(--muted); }
.cp-res { margin: 0 0 12px; }
.cp-res b { font-family: var(--mono); font-size: 1.15em; color: var(--accent-deep, var(--accent)); }
.cp-cuerpo { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 12px; align-items: start; }
.cp-fig { position: relative; width: 170px; aspect-ratio: 200 / 440; }
.cp-fig svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.cp-fig .cp-sil { fill: var(--accent-soft); stroke: var(--accent-soft); stroke-linecap: round; stroke-linejoin: round; }
.cp-p { position: absolute; translate: -50% -50%; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border-radius: 50%; border: 1.5px solid var(--line-strong); background: var(--surface); color: var(--muted); font-family: var(--mono); font-size: .78rem; font-weight: 700; line-height: 1; cursor: pointer; }
.cp-p.con { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.cp-p.activa { box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px var(--accent); }
.cp-p:not(.con)::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--line-strong); }
.cp-zonas { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.cp-zonas button { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 8px; align-items: center; width: 100%; min-height: 30px; padding: 3px 8px 3px 4px; border: 1px solid transparent; border-radius: var(--r-sm); background: none; color: var(--fg); font: inherit; font-size: .88rem; line-height: 1.2; text-align: left; cursor: pointer; }
.cp-zonas button i { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--line-strong); font-family: var(--mono); font-style: normal; font-size: .74rem; font-weight: 700; color: var(--muted); }
.cp-zonas button.con { font-weight: 700; } .cp-zonas button.con i { border-color: var(--accent); background: var(--accent); color: var(--surface); }
.cp-zonas button:not(.con) { color: var(--muted); }
.cp-zonas button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--fg); }
.cp-dlg button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.cp-det { grid-column: 1 / -1; padding: 14px; border: 1.5px solid var(--accent); border-radius: var(--r-md); background: var(--surface); }
.cp-det h3 { margin: 0; font-size: 1.15rem; }
.cp-det .cp-n { margin: 2px 0 10px; color: var(--muted); font-size: .9rem; }
.cp-ef { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.cp-ef li { padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); }
.cp-ef li > b { display: block; line-height: 1.3; }
.cp-meds { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 0; }
.cp-meds button { padding: 3px 10px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface); color: var(--fg); font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; }
.cp-cuida-t { margin: 14px 0 6px; font-family: var(--mono); font-size: .7rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.cp-cuida { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.cp-cuida li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding: 6px 10px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .92rem; }
.cp-cuida span { flex: 1 1 180px; }
.cp-vacio { margin: 0; color: var(--muted); }
.cp-acc { margin: 10px 0 0; }
.cp-nota { margin: 12px 0 0; font-size: .82rem; color: var(--muted); }
:root[data-theme="contrast"] .cp-fig .cp-sil { fill: var(--surface-2); stroke: var(--surface-2); }
@media (min-width: 760px) { .cp-cuerpo { grid-template-columns: 200px 220px minmax(0, 1fr); gap: 18px; } .cp-fig { width: 200px; } .cp-det { grid-column: auto; } .cp-p { width: 30px; height: 30px; } .cp-zonas button { min-height: 36px; } }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .cp-p { transition: box-shadow .18s, scale .18s; } html:not(.pa-quieto) .cp-p.activa { scale: 1.12; } }
@media (forced-colors: active) { .cp-p.con, .cp-zonas button.con i { background: Highlight; color: HighlightText; } .cp-p.activa, .cp-zonas button[aria-pressed="true"] { outline: 3px solid Highlight; } .cp-fig .cp-sil { fill: GrayText; stroke: GrayText; } }
/* 859-860: la figura con degradado; los puntos con medicamentos brillan y el elegido late una vez */
.cp-fig .cp-sil { fill: color-mix(in srgb, var(--accent) 16%, var(--surface)); stroke: color-mix(in srgb, var(--accent) 16%, var(--surface)); filter: drop-shadow(0 6px 10px color-mix(in srgb, var(--accent) 22%, transparent)); }
.cp-p { transition: scale .15s, box-shadow .2s; }
.cp-p.con { box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent); }
.cp-p.con.activa { box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px var(--accent), 0 0 16px 6px color-mix(in srgb, var(--accent) 45%, transparent); }
@media (hover: hover) { .cp-p:hover { scale: 1.12; } }
@media screen and (prefers-reduced-motion: no-preference) { html:not(.pa-quieto) .cp-p.activa { animation: cp-late .5s var(--ease-salida, ease-out); } }
@keyframes cp-late { 40% { scale: 1.25; } }
:root[data-theme="contrast"] .cp-fig .cp-sil { filter: none; } :root[data-theme="contrast"] .cp-p.con { box-shadow: none; }
`;
/* Figura de frente: cabeza, tronco y extremidades de trazo grueso. Es solo el fondo de los puntos (decorativa). */
const FIGURA = `<svg viewBox="0 0 200 440" aria-hidden="true" focusable="false"><g class="cp-sil"><circle cx="100" cy="38" r="26" stroke-width="2"/><path d="M92 58h16v24H92z" stroke-width="6"/><path d="M68 82h64q16 0 16 16l-8 138q-1 14-14 14H74q-13 0-14-14L52 98q0-16 16-16z" stroke-width="2"/><path d="M60 100 44 172l-4 62M140 100l16 72 4 62" fill="none" stroke-width="24"/><path d="M84 244l-2 86 2 84M116 244l2 86-2 84" fill="none" stroke-width="30"/></g></svg>`;

let dlg = null, A = null, zona = null, M = [];
const cu = () => dlg.querySelector("#cp-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const cuenta = (n) => (n === 0 ? tx("cuenta0") : n === 1 ? tx("cuenta1") : tx("cuenta", { n }));
function crear() {
  if (!document.getElementById("cp-css")) { const st = document.createElement("style"); st.id = "cp-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "cuerpo"; dlg.className = "ficha alta cp-dlg"; dlg.setAttribute("aria-labelledby", "cp-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="cp-cab-t"></p><button type="button" class="btn-sec sm" id="cp-cerrar"></button></div><div class="ficha-cuerpo" id="cp-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#cp-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    const b = ev.target.closest("[data-cp]"); if (!b) return;
    const a = b.dataset.cp, v = b.dataset.v;
    if (a === "zona") { zona = v; pintar(); dlg.querySelector(`.cp-zonas [data-v="${v}"]`)?.focus(); if (b.classList.contains("cp-p")) dlg.querySelector("#cp-det")?.scrollIntoView({ block: "nearest" }); }
    else if (a === "ficha") { dlg.close(); A.verFicha(v); }
    else if (a === "anadir") { dlg.close(); document.querySelector("#btn-anadir")?.click(); }
  });
}
function detalle(z) {
  if (!A.estado.meds.length) return `<p class="cp-vacio">${tx("sin_meds")}</p><p class="cp-acc"><button type="button" class="btn" data-cp="anadir">${tx("anadir")}</button></p>`;
  if (!z) return `<p class="cp-vacio">${tx("resumen0")}</p>`;
  const n = z.meds.length, pqs = A.porquesDe(z.efectos.map((e) => e.s)).filter((id) => t("cuid." + id) !== "cuid." + id);
  return `<h3 id="cp-det-t">${tx("z_" + z.id)}</h3><p class="cp-n">${n === 0 ? tx("n0") : n === 1 ? tx("n1") : tx("n", { n })}</p>
    ${n ? `<ul class="cp-ef">${z.efectos.map((e) => `<li data-s="${e.s}"><b>${esc(e.texto)}</b><span class="cp-meds">${e.meds.map((m) => `<button type="button" data-cp="ficha" data-v="${esc(m.pid)}" aria-label="${esc(tx("ficha", { x: m.nombre }))}">${esc(m.nombre)}</button>`).join("")}</span></li>`).join("")}</ul>` : ""}
    ${pqs.length ? `<h4 class="cp-cuida-t">${tx("cuida")}</h4><ul class="cp-cuida" id="cp-cuida">${pqs.map((id) => `<li><span>${t("cuid." + id)}</span><button type="button" class="pq-mini" data-porque="${id}" aria-label="${t("pq.titulo")} ${t("pq.b." + id)}">${t("pq.titulo")}</button></li>`).join("")}</ul>` : ""}`;
}
function pintar() {
  dlg.querySelector("#cp-cab-t").textContent = tx("titulo");
  const con = M.filter((z) => z.meds.length).length, z = M.find((x) => x.id === zona) || null;
  const total = new Set(M.flatMap((x) => x.meds.map((m) => m.pid))).size, suma = M.reduce((s, x) => s + x.meds.length, 0);
  cu().innerHTML = `<p class="cp-intro">${tx("intro")}</p>${A.estado.meds.length ? `<p class="cp-res" id="cp-res">${con ? tx("resumen", { a: con, b: M.length }) : tx("resumen0")}</p>` : ""}
    <div class="cp-cuerpo">
      <div class="cp-fig">${FIGURA}${M.map((x) => `<button type="button" class="cp-p${x.meds.length ? " con" : ""}${x.id === zona ? " activa" : ""}" style="left:${x.x}%;top:${x.y}%" data-cp="zona" data-v="${x.id}" tabindex="-1" aria-hidden="true">${x.meds.length || ""}</button>`).join("")}</div>
      <ul class="cp-zonas" id="cp-zonas" aria-label="${tx("zonas")}">${M.map((x) => `<li><button type="button" class="${x.meds.length ? "con" : ""}" data-cp="zona" data-v="${x.id}" aria-pressed="${x.id === zona}" aria-label="${tx("z_" + x.id)}: ${cuenta(x.meds.length)}"><i aria-hidden="true">${x.meds.length || "·"}</i><span>${tx("z_" + x.id)}</span></button></li>`).join("")}</ul>
      <div class="cp-det" id="cp-det" aria-live="polite">${detalle(z)}</div>
    </div>
    <p class="cp-nota">${suma > total ? tx("varios") + " " : ""}${tx("nota")}</p>`;
}
/** Abre la ventana. arg = zona que se quiere ver (opcional). */
export function abrir(api, arg = null) {
  A = api;
  if (!dlg) crear();
  let perfil = {}; try { perfil = api.estado.meds.length ? api.res().perfil : {}; } catch {}
  M = mapa(perfil, api.datos?.kb?.senales || {});
  zona = ZONAS.some((z) => z.id === arg) ? arg : zonaInicial(M);
  dlg.querySelector("#cp-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#cp-cerrar").focus();
}
