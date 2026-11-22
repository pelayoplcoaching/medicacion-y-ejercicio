/* Mapa de interacciones (mejora grande 17): las interacciones de su lista de un vistazo, con dos vistas que se eligen.
   «Tabla de cruces»: un triángulo como las tablas de distancias de los mapas de carreteras (cada casilla es el cruce de
   dos medicamentos; la mejor para listas largas). «Red»: diagrama de arcos (cada medicamento en una fila y un arco por
   interacción; la más clara con pocas). Gravedad por color, forma y grosor (mayor, moderada, menor), filtros por
   gravedad que hacen de leyenda, «Dónde se concentran» (los medicamentos que más participan) y una ficha con el efecto,
   qué hacer y la fuente al tocar un cruce, un arco o un medicamento. El texto completo sigue en la lista de debajo.
   Textos de la interfaz en cinco idiomas dentro del módulo. Se carga al abrir la pestaña de interacciones. */
import { idioma } from "./i18n.js?v=202611220123";

export const NIVELES = ["mayor", "moderada", "menor"];
const PESO = { mayor: 3, moderada: 2, menor: 1 };
export const FILA = 48;

/** Nodos (un medicamento por principio con alguna interacción) y aristas. Las duplicidades (el mismo principio dos veces)
    marcan el nodo y no son arcos. */
export function grafo(pares) {
  const nodos = new Map(), aristas = [];
  const nodo = (x) => { if (!nodos.has(x.id)) nodos.set(x.id, { id: x.id, nombre: x.nombre, peso: 0, n: 0, max: null, dups: [], cuenta: { mayor: 0, moderada: 0, menor: 0 } }); return nodos.get(x.id); };
  pares.forEach((p, k) => {
    const A = nodo(p.a), B = nodo(p.b);
    if (p.a.id === p.b.id) { A.dups.push(p); return; }
    aristas.push({ ...p, k });
    for (const N of [A, B]) { N.peso += PESO[p.nivel] || 1; N.n++; N.cuenta[p.nivel] = (N.cuenta[p.nivel] || 0) + 1; if (!N.max || (PESO[p.nivel] || 0) > PESO[N.max]) N.max = p.nivel; }
  });
  return { nodos: [...nodos.values()], aristas };
}
/** Orden de las filas: por grupos conectados (el más cargado primero) y, dentro de cada grupo, desde el medicamento más
    implicado hacia los que más se relacionan con los ya colocados (así los arcos son cortos y los cruces, pocos). */
export function orden(nodos, aristas) {
  const ady = new Map(nodos.map((n) => [n.id, new Map()]));
  for (const e of aristas) { const w = PESO[e.nivel] || 1; for (const [x, y] of [[e.a.id, e.b.id], [e.b.id, e.a.id]]) ady.get(x)?.set(y, (ady.get(x).get(y) || 0) + w); }
  const porPeso = [...nodos].sort((x, y) => y.peso - x.peso || x.nombre.localeCompare(y.nombre, "es"));
  const puesto = new Set(), res = [];
  for (const ini of porPeso) {
    if (puesto.has(ini.id)) continue;
    const comp = new Set([ini.id]), cola = [ini.id];
    while (cola.length) { const v = cola.shift(); for (const w of ady.get(v).keys()) if (!comp.has(w)) { comp.add(w); cola.push(w); } }
    const grupo = porPeso.filter((n) => comp.has(n.id)), fila = [ini]; puesto.add(ini.id);
    while (fila.length < grupo.length) {
      let mejor = null, mv = -1;
      for (const n of grupo) {
        if (puesto.has(n.id)) continue;
        const v = fila.reduce((s, m, i) => s + (ady.get(n.id).get(m.id) || 0) * (1 + i / fila.length), 0);
        if (v > mv) { mejor = n; mv = v; }
      }
      fila.push(mejor); puesto.add(mejor.id);
    }
    res.push(...fila);
  }
  return res;
}
/** Arco entre las filas i y j del diagrama: curva hacia la izquierda desde el punto de cada fila (x), más abierta cuanto más lejos. */
export function arco(i, j, x, maxD) {
  const y1 = i * FILA + FILA / 2, y2 = j * FILA + FILA / 2, d = Math.min(maxD, 18 + Math.abs(j - i) * FILA * 0.42);
  return `M${x} ${y1}C${(x - d).toFixed(1)} ${y1} ${(x - d).toFixed(1)} ${y2} ${x} ${y2}`;
}
/** Vista por defecto: con muchas interacciones o medicamentos, la tabla de cruces; con pocas, la red. */
export const vistaPorDefecto = (nA, nN) => (nA > 6 || nN > 7 ? "tabla" : "red");

export const TXT = {
  es: { titulo: "Mapa de interacciones", resumen: "{n} interacciones entre {m} de sus {t} medicamentos", resumen1: "1 interacción entre 2 de sus {t} medicamentos", mayor: "Mayor", moderada: "Moderada", menor: "Menor", tabla: "Tabla de cruces", red: "Red", vista: "Ver como", filtro: "Gravedad que se muestra", top: "Dónde se concentran", n_int: "{n} interacciones", n_int1: "1 interacción", n_may: "{n} mayores", n_may1: "1 mayor", que_hacer: "Qué hacer", ver: "Ver en la lista", sim: "¿Qué cambia sin él?", con: "con {x}", sin: "Sin interacciones registradas con el resto de su lista: {x}.", dup: "Aparece dos veces en su lista", borrador: "borrador", ayuda_tabla: "Cada casilla es el cruce de dos medicamentos: siga la columna hacia arriba y la fila hacia la derecha.", ayuda_red: "Cada arco une dos medicamentos que interactúan.", toque: "Toque una casilla, un arco o un medicamento para ver el detalle.", aria_tabla: "Tabla de cruces de {m} medicamentos", aria_red: "Red de {n} interacciones" },
  en: { titulo: "Interaction map", resumen: "{n} interactions among {m} of your {t} medicines", resumen1: "1 interaction between 2 of your {t} medicines", mayor: "Major", moderada: "Moderate", menor: "Minor", tabla: "Cross table", red: "Network", vista: "View as", filtro: "Severity shown", top: "Where they cluster", n_int: "{n} interactions", n_int1: "1 interaction", n_may: "{n} major", n_may1: "1 major", que_hacer: "What to do", ver: "See in the list", sim: "What changes without it?", con: "with {x}", sin: "No interactions recorded with the rest of your list: {x}.", dup: "Appears twice in your list", borrador: "draft", ayuda_tabla: "Each square is where two medicines cross: follow the column up and the row to the right.", ayuda_red: "Each arc joins two medicines that interact.", toque: "Tap a square, an arc or a medicine to see the details.", aria_tabla: "Cross table of {m} medicines", aria_red: "Network of {n} interactions" },
  ca: { titulo: "Mapa d'interaccions", resumen: "{n} interaccions entre {m} dels seus {t} medicaments", resumen1: "1 interacció entre 2 dels seus {t} medicaments", mayor: "Major", moderada: "Moderada", menor: "Menor", tabla: "Taula d'encreuaments", red: "Xarxa", vista: "Veure com", filtro: "Gravetat que es mostra", top: "On es concentren", n_int: "{n} interaccions", n_int1: "1 interacció", n_may: "{n} majors", n_may1: "1 major", que_hacer: "Què fer", ver: "Veure a la llista", sim: "Què canvia sense ell?", con: "amb {x}", sin: "Sense interaccions registrades amb la resta de la llista: {x}.", dup: "Apareix dues vegades a la llista", borrador: "esborrany", ayuda_tabla: "Cada casella és l'encreuament de dos medicaments: segueixi la columna cap amunt i la fila cap a la dreta.", ayuda_red: "Cada arc uneix dos medicaments que interaccionen.", toque: "Toqui una casella, un arc o un medicament per veure'n el detall.", aria_tabla: "Taula d'encreuaments de {m} medicaments", aria_red: "Xarxa de {n} interaccions" },
  gl: { titulo: "Mapa de interaccións", resumen: "{n} interaccións entre {m} dos seus {t} medicamentos", resumen1: "1 interacción entre 2 dos seus {t} medicamentos", mayor: "Maior", moderada: "Moderada", menor: "Menor", tabla: "Táboa de cruces", red: "Rede", vista: "Ver como", filtro: "Gravidade que se amosa", top: "Onde se concentran", n_int: "{n} interaccións", n_int1: "1 interacción", n_may: "{n} maiores", n_may1: "1 maior", que_hacer: "Que facer", ver: "Ver na lista", sim: "Que cambia sen el?", con: "con {x}", sin: "Sen interaccións rexistradas co resto da súa lista: {x}.", dup: "Aparece dúas veces na súa lista", borrador: "borrador", ayuda_tabla: "Cada casa é o cruce de dous medicamentos: siga a columna cara arriba e a fila cara á dereita.", ayuda_red: "Cada arco une dous medicamentos que interactúan.", toque: "Toque unha casa, un arco ou un medicamento para ver o detalle.", aria_tabla: "Táboa de cruces de {m} medicamentos", aria_red: "Rede de {n} interaccións" },
  eu: { titulo: "Elkarreraginen mapa", resumen: "{n} elkarreragin zure {t} botiketatik {m}ren artean", resumen1: "Elkarreragin 1 zure {t} botiketatik 2ren artean", mayor: "Larria", moderada: "Ertaina", menor: "Arina", tabla: "Gurutzeen taula", red: "Sarea", vista: "Ikusi honela", filtro: "Erakusten den larritasuna", top: "Non pilatzen diren", n_int: "{n} elkarreragin", n_int1: "Elkarreragin 1", n_may: "{n} larri", n_may1: "1 larri", que_hacer: "Zer egin", ver: "Ikusi zerrendan", sim: "Zer aldatzen da hura gabe?", con: "honekin: {x}", sin: "Zure zerrendako besteekin ez dago elkarreraginik erregistratuta: {x}.", dup: "Bi aldiz agertzen da zure zerrendan", borrador: "zirriborroa", ayuda_tabla: "Lauki bakoitza bi botikaren gurutzea da: jarraitu zutabea gorantz eta errenkada eskuinera.", ayuda_red: "Arku bakoitzak elkarri eragiten dioten bi botika lotzen ditu.", toque: "Ukitu lauki bat, arku bat edo botika bat xehetasuna ikusteko.", aria_tabla: "{m} botikaren gurutzeen taula", aria_red: "{n} elkarreraginen sarea" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
/* forma de cada gravedad (además del color): triángulo, rombo y círculo */
const FORMA = { mayor: "M12 3.5 21.5 20h-19z", moderada: "M12 3 21 12 12 21 3 12z", menor: "M12 5.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z" };
export const glifo = (nivel, cls = "im-g") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${FORMA[nivel] || FORMA.menor}"/></svg>`;
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
.im-mapa { margin: 0 0 18px; padding: 14px; border: 1px solid var(--line); border-radius: var(--r-lg); background: linear-gradient(170deg, var(--surface), var(--surface-2)); }
.im-cab { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; margin-bottom: 10px; }
.im-cab h3 { margin: 0; font-size: 1.05rem; }
.im-cab p { margin: 0; color: var(--muted); font-size: .86rem; }
.im-barra { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.im-filtros, .im-vista { display: flex; flex-wrap: wrap; gap: 6px; }
.im-f { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 4px 12px 4px 8px; border-radius: 999px; border: 1.5px solid var(--line-strong); background: var(--surface); color: var(--fg); font: 600 .84rem var(--font); cursor: pointer; }
.im-f b { font-family: var(--mono); }
.im-f[aria-pressed="false"] { opacity: .55; border-style: dashed; }
.im-f[aria-pressed="false"] .im-g { fill: var(--muted); }
.im-vista button { min-height: 36px; padding: 4px 12px; border-radius: 999px; border: 1.5px solid var(--line-strong); background: var(--surface); color: var(--fg); font: 600 .84rem var(--font); cursor: pointer; }
.im-vista button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
.im-g { width: 14px; height: 14px; flex: none; }
.n-mayor > .im-g, .im-f.n-mayor .im-g, .im-chip.n-mayor .im-g { fill: var(--alerta); }
.n-moderada > .im-g, .im-f.n-moderada .im-g, .im-chip.n-moderada .im-g { fill: var(--precaucion); }
.n-menor > .im-g, .im-f.n-menor .im-g, .im-chip.n-menor .im-g { fill: var(--info); }
.im-top { margin: 0 0 12px; }
.im-top h4 { margin: 0 0 6px; font-size: .9rem; }
.im-top ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.im-top button { width: 100%; display: grid; grid-template-columns: minmax(96px, 34%) minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 6px 8px; border: 0; border-radius: var(--r-sm); background: transparent; color: var(--fg); font: inherit; text-align: left; cursor: pointer; }
.im-top button:hover, .im-top button[aria-pressed="true"] { background: var(--accent-soft); }
.im-top .im-bar { position: relative; height: 10px; border-radius: 0 4px 4px 0; background: var(--surface-2); overflow: hidden; }
.im-top .im-bar i { position: absolute; inset: 0 auto 0 0; width: var(--w); border-radius: 0 4px 4px 0; background: var(--accent); }
.im-top .im-bar i.n-mayor { background: var(--alerta); }
.im-top small { color: var(--muted); font-size: .78rem; white-space: nowrap; }
.im-top small b { color: var(--fg); font-family: var(--mono); }
.im-cuerpo { display: grid; gap: 12px; }
.im-mapa.im-ancho .im-cuerpo { grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); align-items: start; }
.im-mapa.im-ancho .im-ficha { position: sticky; top: 12px; }
.im-ayuda { margin: 0 0 8px; font-size: .8rem; color: var(--muted); }
.im-tabla { overflow-x: auto; padding: 4px 2px 6px; scrollbar-width: thin; }
.im-rejilla { display: grid; gap: 3px; width: max-content; min-width: 100%; }
.im-c { width: var(--c); height: var(--c); border-radius: 6px; display: grid; place-items: center; padding: 0; border: 1px solid transparent; }
.im-c.im-vac { background: var(--surface-2); border-color: var(--line); opacity: .7; }
.im-c.im-vac.im-guia { background: var(--accent-soft); border-color: var(--accent); opacity: 1; }
button.im-c.im-guia { box-shadow: 0 0 0 2px var(--accent-soft); }
.im-nom.im-guia { background: var(--accent-soft); }
button.im-c { cursor: pointer; }
button.im-c .im-g { width: 58%; height: 58%; }
button.im-c.n-mayor { background: var(--alerta); border-color: var(--alerta); }
button.im-c.n-mayor .im-g { fill: var(--surface); }
button.im-c.n-moderada { background: var(--precaucion-soft); border: 1.5px solid var(--precaucion); }
button.im-c.n-moderada .im-g { fill: var(--precaucion); }
button.im-c.n-menor { background: var(--info-soft); border: 1.5px solid var(--info); }
button.im-c.n-menor .im-g { fill: var(--info); }
button.im-c.on { outline: 3px solid var(--accent); outline-offset: 2px; position: relative; z-index: 1; }
.im-rejilla.hay-sel button.im-c:not(.on):not(.rel) { opacity: .45; }
.im-nom { display: flex; align-items: center; gap: 6px; min-height: var(--c); padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--fg); font: 600 .86rem var(--font); text-align: left; white-space: nowrap; cursor: pointer; }
.im-nom:hover { background: var(--accent-soft); }
.im-nom.on, .im-nom[aria-pressed="true"] { background: var(--accent-soft); color: var(--accent-deep); box-shadow: inset 3px 0 0 var(--accent); }
.im-nom .im-dup, .im-nodo .im-dup { font: 700 .7rem var(--mono); color: var(--precaucion-ink); background: var(--precaucion-soft); border-radius: 999px; padding: 1px 6px; }
.im-red { display: grid; grid-template-columns: var(--w) minmax(0, 1fr); }
.im-svg { display: block; overflow: visible; }
.im-l { fill: none; stroke-linecap: round; }
.im-a.n-mayor .im-l { stroke: var(--alerta); stroke-width: 3.5; }
.im-a.n-moderada .im-l { stroke: var(--precaucion); stroke-width: 2.5; stroke-dasharray: 7 5; }
.im-a.n-menor .im-l { stroke: var(--info); stroke-width: 2; stroke-dasharray: 1.5 5; }
.im-hit { fill: none; stroke: transparent; stroke-width: 14; pointer-events: stroke; cursor: pointer; }
.im-a:hover .im-l { stroke-width: 4.5; }
.im-a.dim { opacity: .18; }
.im-a.on .im-l { stroke-width: 5; filter: drop-shadow(0 0 4px var(--accent-soft)); }
.im-p { stroke: var(--surface); stroke-width: 2; }
.im-p.n-mayor { fill: var(--alerta); } .im-p.n-moderada { fill: var(--precaucion); } .im-p.n-menor { fill: var(--info); } .im-p.n-ninguno { fill: var(--muted); }
.im-p.dim { opacity: .3; }
.im-filas { list-style: none; margin: 0; padding: 0; }
.im-filas li { height: ${FILA}px; display: flex; align-items: center; }
.im-nodo { width: 100%; height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 10px; border: 0; border-radius: var(--r-sm); background: transparent; color: var(--fg); font: 600 .9rem var(--font); text-align: left; cursor: pointer; }
.im-nodo:hover { background: var(--accent-soft); }
.im-nodo[aria-pressed="true"], .im-nodo.on { background: var(--accent-soft); color: var(--accent-deep); }
.im-nodo.dim { opacity: .45; }
.im-nodo .im-txt { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; line-height: 1.15; }
.im-cnt { flex: none; display: inline-flex; align-items: center; gap: 4px; font: 700 .76rem var(--mono); color: var(--muted); }
.im-ficha { padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface); min-height: 120px; }
.im-ficha.n-mayor { border-color: var(--alerta); box-shadow: inset 4px 0 0 var(--alerta); }
.im-ficha.n-moderada { border-color: var(--precaucion); box-shadow: inset 4px 0 0 var(--precaucion); }
.im-ficha.n-menor { border-color: var(--info); box-shadow: inset 4px 0 0 var(--info); }
.im-ficha h4 { margin: 4px 0 6px; font-size: 1rem; }
.im-ficha p { margin: 0 0 8px; font-size: .9rem; line-height: 1.45; }
.im-ficha .im-fuente { font-size: .78rem; color: var(--muted); }
.im-ficha .im-vacio { color: var(--muted); }
.im-chip { display: inline-flex; align-items: center; gap: 5px; margin: 0; padding: 2px 10px 2px 7px; border-radius: 999px; font: 700 .76rem var(--font); }
.im-chip.n-mayor { background: var(--alerta-soft); color: var(--alerta-ink); }
.im-chip.n-moderada { background: var(--precaucion-soft); color: var(--precaucion-ink); }
.im-chip.n-menor { background: var(--info-soft); color: var(--info-ink); }
.im-mini { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 4px; }
.im-mini button { width: 100%; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 8px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-2); color: var(--fg); font: inherit; font-size: .86rem; text-align: left; cursor: pointer; }
.im-mini button:hover { border-color: var(--accent); }
.im-ficha .im-sim { margin-top: 10px; }
.im-sin { margin: 10px 0 0; font-size: .82rem; color: var(--muted); }
:root[data-theme="contrast"] .im-mapa { background: var(--surface); }
:root[data-theme="contrast"] .im-c.im-vac { opacity: 1; }
@media (forced-colors: active) { button.im-c { border: 2px solid CanvasText; } button.im-c .im-g, .im-g { fill: CanvasText; } .im-a .im-l { stroke: CanvasText; } button.im-c.on { outline-color: Highlight; } }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .im-rejilla .im-c:not(.im-vac) { animation: im-pop .4s var(--ease-salida) both; animation-delay: calc(var(--d, 0) * 28ms); }
  html:not(.pa-quieto) .im-a { animation: im-entra .5s var(--ease-salida) both; animation-delay: calc(var(--d, 0) * 40ms); }
  html:not(.pa-quieto) .im-top .im-bar i { animation: im-crece .7s var(--ease-salida) both; transform-origin: left; }
  html:not(.pa-quieto) .im-ficha > * { animation: im-entra .3s var(--ease-salida) both; }
  html:not(.pa-quieto) .ddi.im-marca { animation: pa-marca 1.4s ease-out; }
  button.im-c, .im-a .im-l { transition: transform .15s, stroke-width .15s, opacity .2s; }
  html:not(.pa-quieto) button.im-c:hover { transform: scale(1.1); }
}
@keyframes im-pop { from { opacity: 0; transform: scale(.4); } }
@keyframes im-entra { from { opacity: 0; transform: translateX(6px); } }
@keyframes im-crece { from { transform: scaleX(0); } }
`;
function estilos() { if (!document.getElementById("im-css")) { const st = document.createElement("style"); st.id = "im-css"; st.textContent = CSS; document.head.append(st); } }
const leerVista = () => { try { return localStorage.getItem("medex.im-vista"); } catch { return null; } };
const guardarVista = (v) => { try { localStorage.setItem("medex.im-vista", v); } catch {} };
let filtro = new Set(NIVELES); // se recuerda mientras dure la sesión, entre redibujados

/** La tabla de cruces: triángulo inferior; fila i, columna j (j < i) = cruce de los medicamentos i y j. */
function tabla(N, A, c) {
  const pos = new Map(N.map((n, i) => [n.id, i])), cel = new Map();
  for (const e of A) { const i = pos.get(e.a.id), j = pos.get(e.b.id); cel.set(`${Math.max(i, j)}|${Math.min(i, j)}`, e); }
  const n = N.length, h = [];
  N.forEach((nd, i) => {
    for (let j = 0; j < i; j++) {
      const e = cel.get(`${i}|${j}`), st = `grid-row:${i + 1};grid-column:${j + 1};--d:${i + j}`;
      h.push(e ? `<button type="button" class="im-c n-${e.nivel}" style="${st}" data-k="${e.k}" data-r="${i}" data-col="${j}" aria-label="${esc(`${N[j].nombre} + ${nd.nombre}: ${tx(e.nivel)}`)}">${glifo(e.nivel)}</button>` : `<span class="im-c im-vac" style="${st}" data-r="${i}" data-col="${j}" aria-hidden="true"></span>`);
    }
    h.push(`<button type="button" class="im-nom" style="grid-row:${i + 1};grid-column:${i + 1} / -1" data-n="${esc(nd.id)}" aria-pressed="false">${esc(nd.nombre)}${nd.dups.length ? ' <span class="im-dup">×2</span>' : ""}</button>`);
  });
  return `<p class="im-ayuda">${tx("ayuda_tabla")}</p><div class="im-tabla"><div class="im-rejilla" role="group" aria-label="${esc(tx("aria_tabla", { m: n }))}" style="--c:${c}px;grid-template-columns:${n > 1 ? `repeat(${n - 1}, var(--c)) ` : ""}max-content;grid-auto-rows:minmax(var(--c), auto)">${h.join("")}</div></div>`;
}
/** La red: una fila por medicamento (con su número de interacciones) y un arco por interacción, a la izquierda. */
function red(N, A) {
  const pos = new Map(N.map((n, i) => [n.id, i])), n = N.length;
  const W = Math.round(Math.max(64, Math.min(150, 0.75 * (18 + (n - 1) * FILA * 0.42) + 22))), x = W - 12, maxD = (x - 4) / 0.75;
  const arcos = [...A].sort((p, q) => (PESO[p.nivel] || 0) - (PESO[q.nivel] || 0)).map((e) => {
    const i = pos.get(e.a.id), j = pos.get(e.b.id), d = arco(Math.min(i, j), Math.max(i, j), x, maxD);
    return `<g class="im-a n-${e.nivel}" data-k="${e.k}" style="--d:${Math.min(i, j)}"><path class="im-l" d="${d}"/><path class="im-hit" d="${d}"/></g>`;
  }).join("");
  const puntos = N.map((nd, i) => `<circle class="im-p n-${nd.max || "ninguno"}" data-n="${esc(nd.id)}" cx="${x}" cy="${i * FILA + FILA / 2}" r="6"/>`).join("");
  const filas = N.map((nd) => `<li><button type="button" class="im-nodo" data-n="${esc(nd.id)}" aria-pressed="false"><span class="im-txt">${esc(nd.nombre)}</span>${nd.dups.length ? '<span class="im-dup">×2</span>' : ""}<span class="im-cnt">${nd.max ? glifo(nd.max) : ""}${nd.n}<span class="sr-only"> · ${esc(nd.n === 1 ? tx("n_int1") : tx("n_int", { n: nd.n }))}</span></span></button></li>`).join("");
  return `<p class="im-ayuda">${tx("ayuda_red")}</p><div class="im-red" style="--w:${W}px"><svg class="im-svg" width="${W}" height="${n * FILA}" viewBox="0 0 ${W} ${n * FILA}" aria-hidden="true" focusable="false">${arcos}${puntos}</svg><ol class="im-filas" aria-label="${esc(tx("aria_red", { n: A.length }))}">${filas}</ol></div>`;
}
function fichaPar(e) {
  return `<p class="im-chip n-${e.nivel}">${glifo(e.nivel)}${tx(e.nivel)}${e.borrador ? ` · ${tx("borrador")}` : ""}</p>
    <h4>${esc(e.a.nombre)} + ${esc(e.b.nombre)}</h4><p>${esc(e.efecto)}</p>${e.accion ? `<p><b>${tx("que_hacer")}:</b> ${esc(e.accion)}</p>` : ""}
    <p class="im-fuente">${esc(e.fuente)}</p><button type="button" class="btn-sec sm" data-im-ver="${e.i}">${tx("ver")}</button>`;
}
function fichaNodo(nd, A, simular) {
  const ps = A.filter((e) => e.a.id === nd.id || e.b.id === nd.id).sort((p, q) => (PESO[q.nivel] || 0) - (PESO[p.nivel] || 0));
  const may = nd.cuenta.mayor || 0;
  return `<h4>${esc(nd.nombre)}</h4><p>${nd.n === 1 ? tx("n_int1") : tx("n_int", { n: nd.n })}${may ? ` · ${may === 1 ? tx("n_may1") : tx("n_may", { n: may })}` : ""}</p>
    <ul class="im-mini">${ps.map((e) => `<li><button type="button" data-im-par="${e.k}"><span class="im-chip n-${e.nivel}">${glifo(e.nivel)}${tx(e.nivel)}</span>${esc(tx("con", { x: e.a.id === nd.id ? e.b.nombre : e.a.nombre }))}</button></li>`).join("")}
    ${nd.dups.map((e) => `<li><button type="button" data-im-ver="${e.i}"><span class="im-chip n-${e.nivel}">${glifo(e.nivel)}${tx(e.nivel)}</span>${tx("dup")}</button></li>`).join("")}</ul>
    ${simular ? `<button type="button" class="btn-sec sm im-sim" data-im-sim="${esc(nd.id)}">${tx("sim")}</button>` : ""}`;
}
/** Dibuja el mapa en «caja». c: { pares: [{ i, a: { id, nombre }, b, nivel, efecto, accion, fuente, borrador }], todos: [{ id, nombre }], onVer(i) }. */
export function pintar(caja, c = {}) {
  estilos();
  const G = grafo(c.pares || []), todos = c.todos || [];
  if (!G.aristas.length && !G.nodos.some((n) => n.dups.length)) { caja.hidden = true; return; }
  const N = orden(G.nodos, G.aristas), porK = new Map(G.aristas.map((e) => [e.k, e])), porId = new Map(N.map((n) => [n.id, n]));
  const cuenta = Object.fromEntries(NIVELES.map((l) => [l, G.aristas.filter((e) => e.nivel === l).length]));
  for (const l of NIVELES) if (!cuenta[l]) filtro.add(l); // un nivel sin casos nunca queda «apagado» sin poder verse
  let vista = leerVista() || vistaPorDefecto(G.aristas.length, N.length), sel = G.aristas.length ? { k: G.aristas[0].k } : { n: N[0].id }, foco = false;
  const ids = new Set(N.map((n) => n.id)), sin = todos.filter((x) => !ids.has(x.id));
  const top = [...N].filter((n) => n.peso > 0).sort((p, q) => q.peso - p.peso).slice(0, 3), pmax = top[0]?.peso || 1;
  caja.hidden = false; caja.classList.add("im-mapa");
  caja.innerHTML = `<div class="im-cab"><h3>${tx("titulo")}</h3><p>${G.aristas.length === 1 ? tx("resumen1", { t: todos.length }) : tx("resumen", { n: G.aristas.length, m: N.filter((n) => n.n).length, t: todos.length })}</p></div>
    <div class="im-barra"><div class="im-filtros" role="group" aria-label="${tx("filtro")}">${NIVELES.filter((l) => cuenta[l]).map((l) => `<button type="button" class="im-f n-${l}" data-im-f="${l}" aria-pressed="${filtro.has(l)}">${glifo(l)}${tx(l)} <b>${cuenta[l]}</b></button>`).join("")}</div>
      <div class="im-vista" role="group" aria-label="${tx("vista")}"><button type="button" data-im-v="tabla" aria-pressed="${vista === "tabla"}">${tx("tabla")}</button><button type="button" data-im-v="red" aria-pressed="${vista === "red"}">${tx("red")}</button></div></div>
    ${G.aristas.length >= 3 ? `<div class="im-top"><h4>${tx("top")}</h4><ol>${top.map((n) => `<li><button type="button" data-n="${esc(n.id)}" aria-pressed="false"><span>${esc(n.nombre)}</span><span class="im-bar" aria-hidden="true"><i class="${n.cuenta.mayor ? "n-mayor" : ""}" style="--w:${Math.max(8, Math.round((n.peso / pmax) * 100))}%"></i></span><small><b>${n.n}</b>${n.cuenta.mayor ? ` · ${n.cuenta.mayor === 1 ? tx("n_may1") : tx("n_may", { n: n.cuenta.mayor })}` : ""}</small></button></li>`).join("")}</ol></div>` : ""}
    <div class="im-cuerpo"><div class="im-vis"></div><div class="im-ficha" aria-live="polite"></div></div>
    ${sin.length ? `<p class="im-sin">${esc(tx("sin", { x: sin.map((x) => x.nombre).join(", ") }))}</p>` : ""}`;
  const vis = caja.querySelector(".im-vis"), ficha = caja.querySelector(".im-ficha");
  const ajustarAncho = () => caja.classList.toggle("im-ancho", caja.clientWidth >= 700);
  ajustarAncho();
  if ("ResizeObserver" in window && !caja.__ro) { caja.__ro = new ResizeObserver(ajustarAncho); caja.__ro.observe(caja); }
  const visibles = () => G.aristas.filter((e) => filtro.has(e.nivel));
  /* resalta lo elegido (un cruce o un medicamento con los suyos) y atenúa el resto; la ficha se rehace solo al elegir */
  function resaltar() {
    const A = visibles(), e = sel.k != null ? porK.get(sel.k) : null, nd = sel.n != null ? porId.get(sel.n) : null;
    const ks = new Set(e ? [e.k] : nd ? A.filter((x) => x.a.id === nd.id || x.b.id === nd.id).map((x) => x.k) : []);
    const relN = new Set(nd ? [nd.id] : []); for (const x of A) if (ks.has(x.k)) { relN.add(x.a.id); relN.add(x.b.id); }
    const hay = foco && (ks.size > 0 || !!nd);
    vis.querySelectorAll(".im-a").forEach((g) => { const on = ks.has(Number(g.dataset.k)); g.classList.toggle("on", on); g.classList.toggle("dim", hay && !on); });
    vis.querySelectorAll(".im-p, .im-nodo").forEach((p) => p.classList.toggle("dim", hay && !relN.has(p.dataset.n)));
    vis.querySelectorAll("button.im-c").forEach((b) => { const k = Number(b.dataset.k); b.classList.toggle("on", !!e && ks.has(k)); b.classList.toggle("rel", ks.has(k)); });
    vis.querySelector(".im-rejilla")?.classList.toggle("hay-sel", hay);
    caja.querySelectorAll(".im-nom, .im-nodo, .im-top button").forEach((b) => { b.classList.toggle("on", !!e && relN.has(b.dataset.n)); b.setAttribute("aria-pressed", String(!!nd && b.dataset.n === nd.id)); });
    guiaSel();
  }
  function marcar() {
    resaltar();
    const e = sel.k != null ? porK.get(sel.k) : null, nd = sel.n != null ? porId.get(sel.n) : null;
    ficha.className = "im-ficha" + (e ? ` n-${e.nivel}` : "");
    ficha.innerHTML = e ? fichaPar(e) : nd ? fichaNodo(nd, visibles(), !!c.onSimular) : `<p class="im-vacio">${tx("toque")}</p>`;
  }
  /* guía en L desde la casilla hasta los dos nombres (como seguir con el dedo una tabla de distancias) */
  function guia(i, j) {
    vis.querySelectorAll(".im-guia").forEach((x) => x.classList.remove("im-guia"));
    if (!Number.isFinite(i) || !Number.isFinite(j)) return;
    vis.querySelectorAll(".im-c").forEach((x) => { const r = Number(x.dataset.r), cl = Number(x.dataset.col); if ((r === i && cl > j && cl < i) || (cl === j && r > j && r < i)) x.classList.add("im-guia"); });
    vis.querySelectorAll(".im-nom").forEach((x, k) => { if (k === i || k === j) x.classList.add("im-guia"); });
  }
  const guiaSel = () => { const b = sel.k != null ? vis.querySelector(`button.im-c[data-k="${sel.k}"]`) : null; guia(Number(b?.dataset.r), Number(b?.dataset.col)); };
  function dibujar() {
    const A = visibles();
    const c0 = Math.floor(((vis.clientWidth || caja.clientWidth - 28 || 320) - 110) / Math.max(N.length - 1, 1));
    vis.innerHTML = vista === "tabla" ? tabla(N, A, Math.max(26, Math.min(36, c0))) : red(N, A);
    if (sel.k != null && !A.some((e) => e.k === sel.k)) sel = A.length ? { k: A[0].k } : { n: N[0].id };
    marcar();
  }
  caja.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-im-f], [data-im-v], [data-k], [data-n], [data-im-par], [data-im-ver], [data-im-sim]");
    if (!b || !caja.contains(b)) return;
    if (b.dataset.imF) { const l = b.dataset.imF; if (filtro.has(l) && filtro.size === 1) return; filtro.has(l) ? filtro.delete(l) : filtro.add(l); b.setAttribute("aria-pressed", String(filtro.has(l))); dibujar(); return; }
    if (b.dataset.imV) { vista = b.dataset.imV; guardarVista(vista); caja.querySelectorAll("[data-im-v]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.imV === vista))); dibujar(); return; }
    if (b.dataset.imVer != null) { c.onVer?.(Number(b.dataset.imVer)); return; }
    if (b.dataset.imSim) { c.onSimular?.(b.dataset.imSim); return; }
    foco = true;
    if (b.dataset.imPar != null) { sel = { k: Number(b.dataset.imPar) }; marcar(); return; }
    if (b.dataset.k != null) { sel = { k: Number(b.dataset.k) }; marcar(); return; }
    if (b.dataset.n != null) { sel = sel.n === b.dataset.n ? (G.aristas.length ? { k: visibles()[0]?.k ?? G.aristas[0].k } : { n: b.dataset.n }) : { n: b.dataset.n }; marcar(); }
  });
  /* guía al pasar el ratón o al enfocar una casilla, sin cambiar la selección */
  const alPasar = (ev) => { const b = ev.target.closest?.("button.im-c"); if (b) guia(Number(b.dataset.r), Number(b.dataset.col)); };
  vis.addEventListener("pointerover", alPasar); vis.addEventListener("focusin", alPasar);
  vis.addEventListener("pointerleave", guiaSel); vis.addEventListener("focusout", (ev) => { if (!vis.contains(ev.relatedTarget)) guiaSel(); });
  /* flechas arriba y abajo entre medicamentos de la red */
  vis.addEventListener("keydown", (ev) => {
    const b = ev.target.closest?.(".im-nodo"); if (!b || !["ArrowDown", "ArrowUp"].includes(ev.key)) return;
    const bs = [...vis.querySelectorAll(".im-nodo")], i = bs.indexOf(b), sig = bs[i + (ev.key === "ArrowDown" ? 1 : -1)];
    if (sig) { ev.preventDefault(); sig.focus(); }
  });
  dibujar();
}
