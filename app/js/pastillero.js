/* Mi pastillero (mejora grande 14): sus tomas de cada día por momentos (desayuno, comida, cena y al acostarse, a las
   horas que haya puesto en «¿Cuándo?»), los fármacos «cuando lo necesite» y los que no son diarios (semanales, mensuales)
   aparte, una línea del día con las tomas y las horas mejores y peores para entrenar (la misma ventana de «¿Cuándo?»,
   que sale de los horarios de la base), qué tener en cuenta tras cada toma y su semana de ejercicio. Se imprime como
   hoja de la semana en A4 apaisado: una casilla por toma y por día para marcarla, y la sesión de cada día.
   Los fármacos semanales o mensuales nunca se ponen en las casillas diarias (el metotrexato semanal tomado a diario
   es un error grave y conocido). Textos de la interfaz en los cinco idiomas dentro del módulo. Se carga al abrirlo. */
import { t, idioma } from "./i18n.js?v=202611230120";

export const MOMENTOS = ["desayuno", "comida", "cena", "noche"];
const hh = (h) => `${String(h).padStart(2, "0")}:00`;
/** «semana» | «mes» | «año» si la unidad no es diaria (mg/semana, mg/3 meses…); si es diaria, null. */
export function periodo(unidad = "mg") { const m = /semana|mes|año/.exec(unidad); return m ? m[0] : null; }
/** Reparte los fármacos por momento del día; los «a demanda» y los que no son diarios van aparte. */
export function compartimentos(meds) {
  const por = Object.fromEntries(MOMENTOS.map((m) => [m, []])), demanda = [], periodicos = [];
  for (const m of meds || []) {
    if (m.aDemanda) { demanda.push(m); continue; }
    if (periodo(m.unidad)) { periodicos.push(m); continue; }
    for (const mo of (m.momentos?.length ? m.momentos : ["desayuno"])) if (por[mo]) por[mo].push(m);
  }
  return { por, demanda, periodicos, tomas: Object.values(por).reduce((n, xs) => n + xs.length, 0) };
}
/** Qué tener en cuenta tras cada toma, a partir de los motivos de la ventana de entrenamiento (sin repetir). */
export function trasToma(ventana, momento) {
  const vistos = new Set();
  return (ventana?.motivos || []).filter((x) => x.momento === momento).sort((a, b) => (a.desde ?? 0) - (b.desde ?? 0))
    .filter((x) => { const k = `${x.farmaco}|${x.motivo}`; if (vistos.has(k)) return false; vistos.add(k); return true; });
}
/** Dosis legible de una toma: «5 mg», «12 UI», «2 inhalaciones»; si no es diaria, con su periodo: «15 mg/semana». */
export function dosisTxt(m) {
  if (m.dosis == null || m.dosis === "" || !Number.isFinite(Number(m.dosis))) return "";
  const u = m.unidad || "mg";
  return `${Number(m.dosis).toLocaleString(idioma() === "en" ? "en-GB" : "es-ES")} ${periodo(u) ? u : u.replace(/\/día$/, "")}`;
}

export const TXT = {
  es: { titulo: "Mi pastillero", intro: "Sus tomas de cada día y las mejores horas para moverse.", dia: "Su día", mejor: "Mejor para entrenar", precaucion: "Con precaución", evitar: "Mejor no entrenar", toma: "Toma (n.º de fármacos)", demanda: "Cuando lo necesite", periodicos: "No son diarios", periodicos_x: "No los tome cada día: siga el día que le indicaron.", vacio: "Sin tomas en este momento.", sin_meds: "Añada su medicación para ver su pastillero.", tras: "Después de esta toma", semana: "Su semana de ejercicio", franja: "Mejor entre {f}", horas: "Cambiar las horas de las tomas", imprimir: "Imprimir la hoja de la semana", h_tit: "Mi pastillero y mi ejercicio", h_sem: "Semana del ____ al ____", h_nombre: "Nombre", h_ej: "Ejercicio", h_marque: "Marque cada toma al tomarla y cada sesión al hacerla.", h_mejor: "Mejores horas para entrenar: {f}", h_sin: "Sin restricciones de horario por su medicación.", h_dia: "Día: ________", tomas: "{n} tomas al día", toma1: "1 toma al día", t_aer: "Aeróbico", t_fue: "Fuerza", t_fue_eq: "Fuerza y equilibrio", t_eq: "Equilibrio", t_desc: "Descanso", t_paseo: "Paseo", nota: "Las horas de las tomas son las de «¿Cuándo?»; cámbielas allí si no coinciden con las suyas." },
  en: { titulo: "My pill organiser", intro: "Your daily doses and the best times to move.", dia: "Your day", mejor: "Best for training", precaucion: "With caution", evitar: "Better not to train", toma: "Dose (no. of medicines)", demanda: "As needed", periodicos: "Not daily", periodicos_x: "Do not take them every day: follow the day you were told.", vacio: "No doses at this time.", sin_meds: "Add your medication to see your pill organiser.", tras: "After this dose", semana: "Your exercise week", franja: "Best between {f}", horas: "Change the dose times", imprimir: "Print the weekly sheet", h_tit: "My pill organiser and my exercise", h_sem: "Week from ____ to ____", h_nombre: "Name", h_ej: "Exercise", h_marque: "Tick each dose when you take it and each session when you do it.", h_mejor: "Best times to train: {f}", h_sin: "No time restrictions from your medication.", h_dia: "Day: ________", tomas: "{n} doses a day", toma1: "1 dose a day", t_aer: "Aerobic", t_fue: "Strength", t_fue_eq: "Strength and balance", t_eq: "Balance", t_desc: "Rest", t_paseo: "Walk", nota: "Dose times are the ones in “When?”; change them there if they don't match yours." },
  ca: { titulo: "El meu pastiller", intro: "Les seves preses de cada dia i les millors hores per moure's.", dia: "El seu dia", mejor: "Millor per entrenar", precaucion: "Amb precaució", evitar: "Millor no entrenar", toma: "Presa (n.º de fàrmacs)", demanda: "Quan ho necessiti", periodicos: "No són diaris", periodicos_x: "No els prengui cada dia: segueixi el dia que li van indicar.", vacio: "Sense preses en aquest moment.", sin_meds: "Afegeixi la seva medicació per veure el pastiller.", tras: "Després d'aquesta presa", semana: "La seva setmana d'exercici", franja: "Millor entre {f}", horas: "Canviar les hores de les preses", imprimir: "Imprimir el full de la setmana", h_tit: "El meu pastiller i el meu exercici", h_sem: "Setmana del ____ al ____", h_nombre: "Nom", h_ej: "Exercici", h_marque: "Marqui cada presa en prendre-la i cada sessió en fer-la.", h_mejor: "Millors hores per entrenar: {f}", h_sin: "Sense restriccions d'horari per la seva medicació.", h_dia: "Dia: ________", tomas: "{n} preses al dia", toma1: "1 presa al dia", t_aer: "Aeròbic", t_fue: "Força", t_fue_eq: "Força i equilibri", t_eq: "Equilibri", t_desc: "Descans", t_paseo: "Passeig", nota: "Les hores de les preses són les de «Quan?»; canviï-les allà si no coincideixen amb les seves." },
  gl: { titulo: "O meu pastilleiro", intro: "As súas tomas de cada día e as mellores horas para moverse.", dia: "O seu día", mejor: "Mellor para adestrar", precaucion: "Con precaución", evitar: "Mellor non adestrar", toma: "Toma (n.º de fármacos)", demanda: "Cando o precise", periodicos: "Non son diarios", periodicos_x: "Non os tome cada día: siga o día que lle indicaron.", vacio: "Sen tomas neste momento.", sin_meds: "Engada a súa medicación para ver o seu pastilleiro.", tras: "Despois desta toma", semana: "A súa semana de exercicio", franja: "Mellor entre {f}", horas: "Cambiar as horas das tomas", imprimir: "Imprimir a folla da semana", h_tit: "O meu pastilleiro e o meu exercicio", h_sem: "Semana do ____ ao ____", h_nombre: "Nome", h_ej: "Exercicio", h_marque: "Marque cada toma ao tomala e cada sesión ao facela.", h_mejor: "Mellores horas para adestrar: {f}", h_sin: "Sen restricións de horario pola súa medicación.", h_dia: "Día: ________", tomas: "{n} tomas ao día", toma1: "1 toma ao día", t_aer: "Aeróbico", t_fue: "Forza", t_fue_eq: "Forza e equilibrio", t_eq: "Equilibrio", t_desc: "Descanso", t_paseo: "Paseo", nota: "As horas das tomas son as de «Cando?»; cámbieas alí se non coinciden coas súas." },
  eu: { titulo: "Nire pilula-kutxa", intro: "Zure eguneroko hartualdiak eta mugitzeko ordurik onenak.", dia: "Zure eguna", mejor: "Entrenatzeko onena", precaucion: "Kontuz", evitar: "Hobe ez entrenatu", toma: "Hartualdia (botika kopurua)", demanda: "Behar duzunean", periodicos: "Ez dira egunerokoak", periodicos_x: "Ez hartu egunero: jarraitu esan zizuten eguna.", vacio: "Ez dago hartualdirik une honetan.", sin_meds: "Gehitu zure botikak zure pilula-kutxa ikusteko.", tras: "Hartualdi honen ondoren", semana: "Zure ariketa-astea", franja: "Onena tarte honetan: {f}", horas: "Aldatu hartualdien orduak", imprimir: "Inprimatu asteko orria", h_tit: "Nire pilula-kutxa eta nire ariketa", h_sem: "Astea: ____(e)tik ____(e)ra", h_nombre: "Izena", h_ej: "Ariketa", h_marque: "Markatu hartualdi bakoitza hartzean eta saio bakoitza egitean.", h_mejor: "Entrenatzeko ordurik onenak: {f}", h_sin: "Zure botikengatik ez dago ordutegi-murrizketarik.", h_dia: "Eguna: ________", tomas: "{n} hartualdi egunean", toma1: "Hartualdi 1 egunean", t_aer: "Aerobikoa", t_fue: "Indarra", t_fue_eq: "Indarra eta oreka", t_eq: "Oreka", t_desc: "Atsedena", t_paseo: "Ibilaldia", nota: "Hartualdien orduak «Noiz?» ataleko berak dira; alda itzazu han zureekin bat ez badatoz." },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
/** Nombre corto del tipo de sesión del plan (cabe en la tira de la semana y en la hoja). */
const TIPOS = { aerobico: "t_aer", fuerza: "t_fue", fuerza_eq: "t_fue_eq", equilibrio: "t_eq", descanso: "t_desc", paseo: "t_paseo" };
export const tipoTxt = (tipo) => (TIPOS[tipo] ? tx(TIPOS[tipo]) : tipo);
const ICON = { desayuno: "M12 4v2M5 12H3M21 12h-2M6.3 6.3 5 5M17.7 6.3 19 5M7 16a5 5 0 0 1 10 0M3 19h18", comida: "M12 3v2M12 19v2M5 12H3M21 12h-2M6.3 6.3 5 5M17.7 6.3 19 5M6.3 17.7 5 19M17.7 17.7 19 19M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", cena: "M7 16a5 5 0 0 1 10 0M3 19h18M12 7v3M8 9l1 2M16 9l-1 2", noche: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" };
const PILDORA = "M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7", CALENDARIO = "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4";
const ic = (d) => `<svg class="pt-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;

/** Línea del día (6 a 24 h): idoneidad para entrenar por horas, tomas marcadas (con el n.º de fármacos) y marcas horarias. */
export function lineaDia(ventana, horas, por, franja) {
  const H = ventana?.horas || [], ancho = 100 / 18;
  const tramos = H.map((x) => `<span class="pt-h n-${x.nivel}" style="left:${((x.h - 6) * ancho).toFixed(3)}%;width:${ancho.toFixed(3)}%"></span>`).join("");
  const conToma = MOMENTOS.filter((m) => por[m]?.length && horas?.[m] != null && horas[m] >= 6);
  const tomas = conToma.map((m, i) => `<span class="pt-toma" style="left:${((Math.min(horas[m], 23.5) - 6) * ancho + ancho / 2).toFixed(3)}%;--i:${i}"><b>${por[m].length}</b></span>`).join("");
  const marcas = [6, 9, 12, 15, 18, 21, 24].map((h) => `<span class="pt-m" style="left:${((h - 6) * ancho).toFixed(3)}%">${h}</span>`).join("");
  const aria = `${tx("dia")}: ${conToma.map((m) => hh(horas[m])).join(", ")}${franja ? `. ${tx("franja", { f: franja })}` : ""}`;
  return `<div class="pt-linea" role="img" aria-label="${aria}">${tramos}${tomas}</div><div class="pt-marcas" aria-hidden="true">${marcas}</div>`;
}

const CSS = `
.pt-dlg .pt-intro { margin: 0 0 10px; color: var(--muted); font-size: .92rem; }
.pt-dlg .pt-intro b { color: var(--fg); font-family: var(--mono); font-size: .86rem; }
.pt-dia { margin: 0 0 14px; padding: 12px 12px 6px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.pt-dia h3, .pt-dlg .pt-sec-t { margin: 0 0 14px; font-size: 1rem; }
.pt-dlg .pt-sec-t { margin-bottom: 8px; }
.pt-linea { position: relative; height: 34px; border-radius: 10px; background: var(--surface-2); }
.pt-h { position: absolute; top: 0; bottom: 0; }
.pt-h.n-verde { background: var(--info-soft); box-shadow: inset 0 -4px 0 var(--info); }
.pt-h.n-ambar { background: var(--precaucion-soft); box-shadow: inset 0 -4px 0 var(--precaucion); }
.pt-h.n-rojo { background: var(--alerta-soft); box-shadow: inset 0 -4px 0 var(--alerta); }
.pt-h.n-neutro { background: transparent; }
.pt-h:first-child { border-radius: 10px 0 0 10px; }
.pt-h:nth-child(18) { border-radius: 0 10px 10px 0; }
.pt-toma { position: absolute; top: -10px; translate: -50% 0; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--accent); color: var(--accent-fg); border: 2px solid var(--surface); font: 800 .78rem var(--mono); box-shadow: 0 4px 10px -4px var(--accent); }
.pt-marcas { position: relative; height: 18px; margin-top: 4px; }
.pt-m { position: absolute; translate: -50% 0; font: 600 .7rem var(--mono); color: var(--muted); }
.pt-m:first-child { translate: 0 0; }
.pt-m:last-child { translate: -100% 0; }
.pt-ley { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 6px 0 4px; padding: 0; list-style: none; font-size: .8rem; color: var(--muted); }
.pt-ley i { display: inline-block; width: 12px; height: 12px; margin-right: 5px; border-radius: 3px; vertical-align: -1px; }
.pt-ley .l-v i { background: var(--info-soft); box-shadow: inset 0 -3px 0 var(--info); }
.pt-ley .l-a i { background: var(--precaucion-soft); box-shadow: inset 0 -3px 0 var(--precaucion); }
.pt-ley .l-r i { background: var(--alerta-soft); box-shadow: inset 0 -3px 0 var(--alerta); }
.pt-ley .l-t i { border-radius: 50%; background: var(--accent); }
.pt-mejores { margin: 4px 0 6px; font-size: .9rem; }
.pt-mejores b { font-family: var(--mono); color: var(--info-ink); }
.pt-cajas { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); align-items: start; gap: 10px; margin: 0 0 14px; }
.pt-caja { position: relative; padding: 12px; border: 1.5px solid var(--line-strong); border-radius: var(--r-lg); background: linear-gradient(160deg, var(--surface), var(--surface-2)); }
.pt-caja.vacia { border-style: dashed; border-color: var(--line); background: var(--surface); }
.pt-caja.vacia .pt-caja-ic { background: var(--surface-2); color: var(--muted); }
.pt-caja.pt-per { border-color: var(--precaucion); background: var(--precaucion-soft); }
.pt-caja.pt-per .pt-caja-ic { background: var(--surface); color: var(--precaucion-ink); }
.pt-caja-cab { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pt-caja-ic { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; background: var(--accent-soft); color: var(--accent-deep); }
.pt-caja-cab b { display: block; line-height: 1.2; }
.pt-caja-cab small { font-family: var(--mono); color: var(--muted); font-size: .78rem; }
.pt-i { width: 20px; height: 20px; }
.pt-meds { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.pt-meds li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: center; padding: 6px 8px; border-radius: var(--r-sm); background: var(--surface); border: 1px solid var(--line); }
.pt-meds li > svg { width: 22px; height: 22px; }
.pt-meds li small { display: block; color: var(--muted); font-size: .74rem; }
.pt-meds .pt-dosis { font: 700 .82rem var(--mono); color: var(--accent-deep); white-space: nowrap; }
.pt-per-x { margin: 8px 0 0; font-size: .82rem; color: var(--precaucion-ink); font-weight: 600; }
.pt-tras { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; font-size: .82rem; }
.pt-tras li { padding-left: 14px; position: relative; }
.pt-tras li::before { content: ""; position: absolute; left: 0; top: .45em; width: 8px; height: 8px; border-radius: 50%; background: var(--precaucion); }
.pt-tras li.n-rojo::before { background: var(--alerta); }
.pt-tras li.n-verde::before { background: var(--info); }
.pt-tras time { font-family: var(--mono); font-size: .78rem; color: var(--muted); }
.pt-caja-vacia { margin: 0; font-size: .85rem; color: var(--muted); }
.pt-semana { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin: 0 0 6px; padding: 0; }
.pt-semana li { list-style: none; display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 10px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .84rem; line-height: 1.2; }
.pt-semana li.hoy-pt { box-shadow: inset 0 0 0 2px var(--accent); background: var(--accent-soft); }
.pt-semana li.descanso { color: var(--muted); }
.pt-semana b { flex: none; min-width: 2.6em; font: 800 .76rem var(--mono); text-transform: uppercase; color: var(--accent-deep); }
.pt-ti { flex: none; width: 18px; height: 18px; fill: currentColor; color: var(--accent); }
.pt-semana li.descanso .pt-ti { color: var(--muted); }
.pt-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 14px 0 6px; }
.pt-nota { margin: 8px 0 0; font-size: .8rem; color: var(--muted); text-align: center; }
:root[data-theme="contrast"] .pt-caja { background: var(--surface); }
@media (forced-colors: active) { .pt-h.n-rojo { background: CanvasText; } .pt-h.n-ambar { background: GrayText; } .pt-toma { background: Highlight; color: HighlightText; forced-color-adjust: none; } }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .pt-dlg[open] .pt-caja { animation: pt-entra .45s var(--ease-salida) both; }
  html:not(.pa-quieto) .pt-dlg[open] .pt-caja:nth-child(2) { animation-delay: 60ms; }
  html:not(.pa-quieto) .pt-dlg[open] .pt-caja:nth-child(3) { animation-delay: 120ms; }
  html:not(.pa-quieto) .pt-dlg[open] .pt-caja:nth-child(n+4) { animation-delay: 180ms; }
  html:not(.pa-quieto) .pt-dlg[open] .pt-toma { animation: pt-cae .5s var(--ease-salida) both; animation-delay: calc(var(--i, 0) * 80ms + 150ms); }
}
@keyframes pt-entra { from { opacity: 0; translate: 0 8px; } }
@keyframes pt-cae { from { opacity: 0; translate: -50% -10px; } }
.hoja-pastillero { display: none; }
@page pastillero { size: A4 landscape; margin: 10mm; }
@media print {
  body.imprimir-pastillero > *:not(#hoja-pastillero) { display: none !important; }
  body.imprimir-pastillero #hoja-pastillero { display: block; page: pastillero; color: #000; font: 10pt/1.3 "Archivo", system-ui, sans-serif; }
  #hoja-pastillero .hp-cab { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid #593ede; }
  #hoja-pastillero h1 { margin: 0; font-size: 17pt; }
  #hoja-pastillero .hp-cab p { margin: 0; font-size: 10pt; }
  #hoja-pastillero table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  #hoja-pastillero th, #hoja-pastillero td { border: 1px solid #999; padding: 4px 5px; vertical-align: top; }
  #hoja-pastillero thead th { background: #eeecff; font-size: 10pt; text-transform: capitalize; }
  #hoja-pastillero tbody th { width: 15%; text-align: left; background: #f6f6f9; font-size: 9.5pt; }
  #hoja-pastillero tbody th small { display: block; font-weight: 400; color: #444; }
  #hoja-pastillero td div { display: flex; align-items: flex-start; gap: 4px; margin: 1px 0; font-size: 8.5pt; line-height: 1.15; }
  #hoja-pastillero td i { flex: none; width: 10px; height: 10px; margin-top: 1px; border: 1.2px solid #000; border-radius: 2px; }
  #hoja-pastillero tr.hp-ej td, #hoja-pastillero tr.hp-ej th { background: #f3f0ff; }
  #hoja-pastillero .hp-pie { margin-top: 6px; font-size: 9pt; }
  #hoja-pastillero .hp-pie p { margin: 2px 0; }
  #hoja-pastillero .hp-per { padding: 3px 6px; border-left: 3px solid #b7791f; background: #fff7e6; }
  #hoja-pastillero .hp-pie small { color: #555; }
}
`;
let dlg = null, ctx = {};
const cu = () => dlg.querySelector("#pt-cuerpo");
function crear() {
  if (!document.getElementById("pt-css")) { const st = document.createElement("style"); st.id = "pt-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "pastillero"; dlg.className = "ficha pt-dlg"; dlg.setAttribute("aria-labelledby", "pt-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="pt-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="pt-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="pt-cuerpo"></div>`;
  document.body.append(dlg);
  if (!document.getElementById("hoja-pastillero")) { const h = document.createElement("section"); h.id = "hoja-pastillero"; h.className = "hoja-pastillero"; document.body.append(h); }
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#pt-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
/** Lunes a domingo en el idioma de la app: d es el getDay() (0 = domingo). */
export const diasSemana = () => [1, 2, 3, 4, 5, 6, 0].map((d) => { const f = new Date(2024, 0, 7 + d); return { d, corto: f.toLocaleDateString(idioma(), { weekday: "short" }).replace(".", ""), largo: f.toLocaleDateString(idioma(), { weekday: "long" }) }; });
const conDosis = (m) => `${m.nombre}${dosisTxt(m) ? ` ${dosisTxt(m)}` : ""}`;
const medHtml = (m) => `<li>${m.ic || ic(PILDORA)}<span>${m.nombre}${m.nota ? `<small>${m.nota}</small>` : ""}</span><span class="pt-dosis">${dosisTxt(m)}</span></li>`;
/** La hoja de la semana para imprimir: 7 días con una casilla por toma, la sesión de cada día y, al pie, lo que no es diario. */
export function hoja(c) {
  const { por, demanda, periodicos } = compartimentos(c.meds), dias = diasSemana(), momentos = MOMENTOS.filter((m) => por[m].length);
  const casilla = (txt) => `<div><i></i><span>${txt}</span></div>`;
  return `<header class="hp-cab"><div><h1>${tx("h_tit")}</h1><p>${tx("h_sem")} · ${tx("h_nombre")}: ______________________</p></div><p>${tx("h_marque")}</p></header>
    <table><thead><tr><th scope="col"></th>${dias.map((x) => `<th scope="col">${x.largo}</th>`).join("")}</tr></thead><tbody>
      ${momentos.map((m) => `<tr><th scope="row">${c.momentos?.[m] || m}<small>${hh(c.horas?.[m] ?? 0)}</small></th>${dias.map(() => `<td>${por[m].map((x) => casilla(conDosis(x))).join("")}</td>`).join("")}</tr>`).join("")}
      <tr class="hp-ej"><th scope="row">${tx("h_ej")}</th>${dias.map((x) => { const tipo = c.plan?.[x.d] || "descanso"; return `<td>${tipo === "descanso" ? tipoTxt(tipo) : casilla(`${tipoTxt(tipo)}${c.franja ? ` · ${c.franja}` : ""}`)}</td>`; }).join("")}</tr>
    </tbody></table>
    <div class="hp-pie">${periodicos.length ? `<p class="hp-per"><b>${tx("periodicos")}:</b> ${periodicos.map((x) => `${conDosis(x)} · ${tx("h_dia")}`).join(" · ")}. ${tx("periodicos_x")}</p>` : ""}${demanda.length ? `<p><b>${tx("demanda")}:</b> ${demanda.map(conDosis).join(" · ")}</p>` : ""}<p>${c.franja ? tx("h_mejor", { f: c.franja }) : tx("h_sin")}</p><small>Pauta Activa v${c.version || ""}</small></div>`;
}
function imprimir() {
  document.getElementById("hoja-pastillero").innerHTML = hoja(ctx);
  document.body.classList.add("imprimir-pastillero");
  const fin = () => { document.body.classList.remove("imprimir-pastillero"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch { fin(); } }, 120);
}
function caja(titulo, hora, icono, xs, extra = "", clase = "") {
  return `<section class="pt-caja${xs.length ? "" : " vacia"}${clase}"><div class="pt-caja-cab"><span class="pt-caja-ic">${ic(icono)}</span><span><b>${titulo}</b>${hora ? `<small>${hora}</small>` : ""}</span></div>
    ${xs.length ? `<ul class="pt-meds">${xs.map(medHtml).join("")}</ul>` : `<p class="pt-caja-vacia">${tx("vacio")}</p>`}${extra}</section>`;
}
function pintar() {
  if (!ctx.meds?.length) { cu().innerHTML = `<p class="pt-intro">${tx("sin_meds")}</p>`; return; }
  const { por, demanda, periodicos, tomas } = compartimentos(ctx.meds), v = ctx.ventana || { horas: [], mejores: [], motivos: [] };
  const hoy = new Date().getDay(), hay = (n) => v.horas.some((x) => x.nivel === n);
  const tras = (m) => { const tr = trasToma(v, m); return por[m].length && tr.length ? `<ul class="pt-tras" aria-label="${tx("tras")}">${tr.slice(0, 3).map((x) => `<li class="n-${x.nivel}"><b>${x.farmaco}</b> <time>${hh(x.desde)}–${hh(x.hasta)}</time>: ${x.motivo}</li>`).join("")}</ul>` : ""; };
  cu().innerHTML = `<p class="pt-intro">${tx("intro")} <b>${tomas === 1 ? tx("toma1") : tx("tomas", { n: tomas })}</b></p>
    <section class="pt-dia" aria-labelledby="pt-dia-t"><h3 id="pt-dia-t">${tx("dia")}</h3>${lineaDia(v, ctx.horas, por, ctx.franja)}
      <ul class="pt-ley"><li class="l-t"><i></i>${tx("toma")}</li>${hay("verde") ? `<li class="l-v"><i></i>${tx("mejor")}</li>` : ""}${hay("ambar") ? `<li class="l-a"><i></i>${tx("precaucion")}</li>` : ""}${hay("rojo") ? `<li class="l-r"><i></i>${tx("evitar")}</li>` : ""}</ul>
      ${ctx.franja ? `<p class="pt-mejores">${tx("franja", { f: `<b>${ctx.franja}</b>` })}</p>` : ""}
    </section>
    <div class="pt-cajas">${MOMENTOS.map((m) => caja(ctx.momentos?.[m] || m, hh(ctx.horas?.[m] ?? 0), ICON[m], por[m], tras(m))).join("")}
      ${periodicos.length ? caja(tx("periodicos"), "", CALENDARIO, periodicos, `<p class="pt-per-x">${tx("periodicos_x")}</p>`, " pt-per") : ""}
      ${demanda.length ? caja(tx("demanda"), "", PILDORA, demanda) : ""}
    </div>
    <h3 class="pt-sec-t">${tx("semana")}</h3>
    <ul class="pt-semana">${diasSemana().map((x) => { const tipo = ctx.plan?.[x.d] || "descanso"; return `<li class="${tipo === "descanso" ? "descanso" : ""}${x.d === hoy ? " hoy-pt" : ""}"${x.d === hoy ? ' aria-current="date"' : ""}><b>${x.corto}</b>${ctx.iconos?.[tipo] || ""}<span>${tipoTxt(tipo)}</span></li>`; }).join("")}</ul>
    <div class="pt-acciones"><button type="button" class="btn" data-pt-imprimir="">${tx("imprimir")}</button><button type="button" class="btn-sec sm" data-pt-horas="">${tx("horas")}</button></div>
    <p class="pt-nota">${tx("nota")}</p>`;
  cu().querySelector("[data-pt-imprimir]").addEventListener("click", imprimir);
  cu().querySelector("[data-pt-horas]").addEventListener("click", () => { dlg.close(); ctx.irHoras?.(); });
}
/** Abre «Mi pastillero». c: { meds: [{ nombre, dosis, unidad, momentos, aDemanda, ic, nota }], horas, ventana, franja, plan, iconos, momentos, version, irHoras }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c;
  dlg.querySelector("#pt-cab-t").textContent = tx("titulo");
  dlg.querySelector("#pt-cerrar").textContent = t("ficha.cerrar");
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
