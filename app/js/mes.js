/* Resumen del mes (mejora grande 12): el mes en movimiento comparado con el anterior (sesiones, minutos, días activos,
   días de fuerza y de equilibrio, mejor semana, hitos de sus metas y pruebas de forma física) y una imagen para compartir
   con la familia o con el médico. La del médico añade el esfuerzo medio, las sesiones con síntomas y los cuidados de su
   medicación, con o sin los nombres de los fármacos. La imagen se dibuja en el propio dispositivo (canvas) y se comparte
   con el menú del sistema o se descarga: nada sale de la aplicación sin que la persona lo decida. Textos de la interfaz
   en los cinco idiomas dentro del módulo. Se carga al abrirlo. */
import { t, idioma } from "./i18n.js?v=202611230120";

/* ---------- cálculo ---------- */
const DIA = 864e5;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deISO = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d, 12); };
const lunesDe = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
export const diasDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();
const FUERZA = new Set(["fuerza", "fuerza_eq"]), EQUILIBRIO = new Set(["fuerza_eq", "equilibrio"]);
/** Resumen de un mes (mes 0-11) a partir del diario de sesiones; hastaDia corta el mes (para comparar «a estas alturas»). */
export function resumenMes(diario, anio, mes, hastaDia = 31) {
  const pref = `${anio}-${String(mes + 1).padStart(2, "0")}-`;
  const del = (diario || []).filter((x) => typeof x?.fecha === "string" && x.fecha.startsWith(pref) && Number(x.fecha.slice(8, 10)) <= hastaDia);
  const porDia = {}; for (const x of del) porDia[x.fecha] = (porDia[x.fecha] || 0) + (Number(x.min) || 0);
  const unicos = (set) => new Set(del.filter((x) => set.has(x.tipo)).map((x) => x.fecha)).size;
  const rpes = del.map((x) => Number(x.rpe)).filter((r) => Number.isFinite(r) && r > 0);
  // semanas (de lunes a domingo) que tocan el mes; la mejor, por minutos (contando solo los días del mes)
  const semanas = new Map();
  for (const [f, m] of Object.entries(porDia)) { const l = iso(lunesDe(deISO(f))); semanas.set(l, (semanas.get(l) || 0) + m); }
  let mejor = null; for (const [l, m] of semanas) if (!mejor || m > mejor.min) mejor = { desde: l, min: m };
  return {
    anio, mes, sesiones: del.length, minutos: del.reduce((n, x) => n + (Number(x.min) || 0), 0), dias: Object.keys(porDia).length,
    diasFuerza: unicos(FUERZA), diasEquilibrio: unicos(EQUILIBRIO), porDia,
    rpe: rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null,
    conSintomas: del.filter((x) => Array.isArray(x.sintomas) && x.sintomas.length).length,
    masLarga: del.reduce((n, x) => Math.max(n, Number(x.min) || 0), 0), mejorSemana: mejor,
  };
}
/** Diferencias con otro mes (normalmente el anterior). */
export const comparar = (a, b) => ({ sesiones: a.sesiones - b.sesiones, minutos: a.minutos - b.minutos, dias: a.dias - b.dias, hayAntes: b.sesiones > 0 });
/** Mes anterior. */
export const anterior = (anio, mes) => (mes === 0 ? [anio - 1, 11] : [anio, mes - 1]);
/** Meses con algo que enseñar: desde la primera sesión del diario hasta el mes actual (como mucho 24). */
export function meses(diario, ahora = new Date()) {
  const fs = (diario || []).map((x) => x?.fecha).filter((f) => typeof f === "string" && /^\d{4}-\d\d-\d\d$/.test(f)).sort();
  const fin = [ahora.getFullYear(), ahora.getMonth()];
  let [a, m] = fs.length ? [Number(fs[0].slice(0, 4)), Number(fs[0].slice(5, 7)) - 1] : fin;
  const out = [];
  while (a < fin[0] || (a === fin[0] && m <= fin[1])) { out.push([a, m]); [a, m] = m === 11 ? [a + 1, 0] : [a, m + 1]; }
  return out.slice(-24);
}
/** Hitos de sus metas conseguidos en ese mes: [{ meta, hito }]. */
export function hitosDelMes(metas, POR_ID, anio, mes) {
  const out = [];
  for (const id of metas?.ids || []) (metas.hitos?.[id] || []).forEach((ts, k) => { if (!ts) return; const d = new Date(ts); if (d.getFullYear() === anio && d.getMonth() === mes) out.push({ id, k, meta: POR_ID?.[id]?.corto || id, hito: POR_ID?.[id]?.hitos?.[k] || "" }); });
  return out;
}

/* ---------- textos de la interfaz en los cinco idiomas ---------- */
export const TXT = {
  es: { titulo: "Resumen del mes", cab: "Mi mes en movimiento", sesiones: "sesiones", minutos: "minutos", dias: "días activos", mas: "▲ {n} más que {x}", menos: "▼ {n} menos que {x}", igual: "Igual que {x}", comp_mes: "el mes anterior", comp_hoy: "el mes anterior a estas alturas", primero: "Primer mes con registro", calendario: "Días con movimiento", moverse: "Moverse", fuerza: "Fuerza", equilibrio: "Equilibrio", min_obj: "{n} de ~{o} min", dias_obj: "{n} de ~{o} días", mejor: "Mejor semana: {n} min (desde el {d})", larga: "Sesión más larga: {n} min", hitos: "Hitos de sus metas: {n}", pruebas: "Pruebas de forma física: {x}", racha: "Racha amable: {n} semanas", racha1: "Racha amable: 1 semana", sesion1: "sesión", minuto1: "minuto", dia1: "día activo", esfuerzo: "Esfuerzo medio: {n}/10", sintomas: "Sesiones con algún síntoma: {n} de {t}", cuidados: "Cuidados con su medicación: {x}", farmacos: "Medicación: {x}", vacio: "Aún no hay sesiones registradas este mes.", animo_mas: "¡Más movimiento que el mes pasado!", animo_igual: "Constancia: el mismo ritmo que el mes pasado.", animo_menos: "Cada sesión cuenta: a por el mes que viene.", animo_primero: "El primer mes ya está en marcha.", pie: "Pauta Activa · sin nombre ni datos personales", pie_med: "Pauta Activa · sin nombre", para: "Para", familia: "La familia", medico: "El médico", sinnombres: "Sin los nombres de los fármacos", compartir: "Compartir la imagen", descargar: "Descargar", copiar: "Copiar el texto", copiado: "Texto copiado.", texto: "En texto", ant: "Mes anterior", sig: "Mes siguiente", nota: "La imagen se crea en este dispositivo y solo sale de él si usted la comparte.", alt: "Imagen del resumen del mes" },
  en: { titulo: "Monthly summary", cab: "My month on the move", sesiones: "sessions", minutos: "minutes", dias: "active days", mas: "▲ {n} more than {x}", menos: "▼ {n} fewer than {x}", igual: "Same as {x}", comp_mes: "last month", comp_hoy: "last month by this point", primero: "First month logged", calendario: "Days with movement", moverse: "Moving", fuerza: "Strength", equilibrio: "Balance", min_obj: "{n} of ~{o} min", dias_obj: "{n} of ~{o} days", mejor: "Best week: {n} min (from {d})", larga: "Longest session: {n} min", hitos: "Goal milestones: {n}", pruebas: "Fitness tests: {x}", racha: "Gentle streak: {n} weeks", racha1: "Gentle streak: 1 week", sesion1: "session", minuto1: "minute", dia1: "active day", esfuerzo: "Average effort: {n}/10", sintomas: "Sessions with a symptom: {n} of {t}", cuidados: "Care with your medication: {x}", farmacos: "Medication: {x}", vacio: "No sessions logged this month yet.", animo_mas: "More movement than last month!", animo_igual: "Consistency: the same pace as last month.", animo_menos: "Every session counts: on to next month.", animo_primero: "Your first month is under way.", pie: "Pauta Activa · no name or personal data", pie_med: "Pauta Activa · no name", para: "For", familia: "Family", medico: "The doctor", sinnombres: "Without medicine names", compartir: "Share the image", descargar: "Download", copiar: "Copy the text", copiado: "Text copied.", texto: "As text", ant: "Previous month", sig: "Next month", nota: "The image is created on this device and only leaves it if you share it.", alt: "Monthly summary image" },
  ca: { titulo: "Resum del mes", cab: "El meu mes en moviment", sesiones: "sessions", minutos: "minuts", dias: "dies actius", mas: "▲ {n} més que {x}", menos: "▼ {n} menys que {x}", igual: "Igual que {x}", comp_mes: "el mes anterior", comp_hoy: "el mes anterior a aquestes alçades", primero: "Primer mes amb registre", calendario: "Dies amb moviment", moverse: "Moure's", fuerza: "Força", equilibrio: "Equilibri", min_obj: "{n} de ~{o} min", dias_obj: "{n} de ~{o} dies", mejor: "Millor setmana: {n} min (des del {d})", larga: "Sessió més llarga: {n} min", hitos: "Fites de les seves metes: {n}", pruebas: "Proves de forma física: {x}", racha: "Ratxa amable: {n} setmanes", racha1: "Ratxa amable: 1 setmana", sesion1: "sessió", minuto1: "minut", dia1: "dia actiu", esfuerzo: "Esforç mitjà: {n}/10", sintomas: "Sessions amb algun símptoma: {n} de {t}", cuidados: "Cures amb la seva medicació: {x}", farmacos: "Medicació: {x}", vacio: "Encara no hi ha sessions registrades aquest mes.", animo_mas: "Més moviment que el mes passat!", animo_igual: "Constància: el mateix ritme que el mes passat.", animo_menos: "Cada sessió compta: a pel mes que ve.", animo_primero: "El primer mes ja està en marxa.", pie: "Pauta Activa · sense nom ni dades personals", pie_med: "Pauta Activa · sense nom", para: "Per a", familia: "La família", medico: "El metge", sinnombres: "Sense els noms dels fàrmacs", compartir: "Compartir la imatge", descargar: "Baixar", copiar: "Copiar el text", copiado: "Text copiat.", texto: "En text", ant: "Mes anterior", sig: "Mes següent", nota: "La imatge es crea en aquest dispositiu i només en surt si vostè la comparteix.", alt: "Imatge del resum del mes" },
  gl: { titulo: "Resumo do mes", cab: "O meu mes en movemento", sesiones: "sesións", minutos: "minutos", dias: "días activos", mas: "▲ {n} máis ca {x}", menos: "▼ {n} menos ca {x}", igual: "Igual ca {x}", comp_mes: "o mes anterior", comp_hoy: "o mes anterior a estas alturas", primero: "Primeiro mes con rexistro", calendario: "Días con movemento", moverse: "Moverse", fuerza: "Forza", equilibrio: "Equilibrio", min_obj: "{n} de ~{o} min", dias_obj: "{n} de ~{o} días", mejor: "Mellor semana: {n} min (desde o {d})", larga: "Sesión máis longa: {n} min", hitos: "Fitos das súas metas: {n}", pruebas: "Probas de forma física: {x}", racha: "Racha amable: {n} semanas", racha1: "Racha amable: 1 semana", sesion1: "sesión", minuto1: "minuto", dia1: "día activo", esfuerzo: "Esforzo medio: {n}/10", sintomas: "Sesións con algún síntoma: {n} de {t}", cuidados: "Coidados coa súa medicación: {x}", farmacos: "Medicación: {x}", vacio: "Aínda non hai sesións rexistradas este mes.", animo_mas: "Máis movemento ca o mes pasado!", animo_igual: "Constancia: o mesmo ritmo ca o mes pasado.", animo_menos: "Cada sesión conta: a polo mes que vén.", animo_primero: "O primeiro mes xa está en marcha.", pie: "Pauta Activa · sen nome nin datos persoais", pie_med: "Pauta Activa · sen nome", para: "Para", familia: "A familia", medico: "O médico", sinnombres: "Sen os nomes dos fármacos", compartir: "Compartir a imaxe", descargar: "Descargar", copiar: "Copiar o texto", copiado: "Texto copiado.", texto: "En texto", ant: "Mes anterior", sig: "Mes seguinte", nota: "A imaxe créase neste dispositivo e só sae del se vostede a comparte.", alt: "Imaxe do resumo do mes" },
  eu: { titulo: "Hilabeteko laburpena", cab: "Nire hilabetea mugimenduan", sesiones: "saio", minutos: "minutu", dias: "egun aktibo", mas: "▲ {n} gehiago {x} baino", menos: "▼ {n} gutxiago {x} baino", igual: "{x} bezala", comp_mes: "aurreko hilabetean", comp_hoy: "aurreko hilabetean garai honetan", primero: "Erregistratutako lehen hilabetea", calendario: "Mugimendua izan duten egunak", moverse: "Mugitu", fuerza: "Indarra", equilibrio: "Oreka", min_obj: "{n} / ~{o} min", dias_obj: "{n} / ~{o} egun", mejor: "Aste onena: {n} min ({d}(e)tik)", larga: "Saiorik luzeena: {n} min", hitos: "Zure helburuetako mugarriak: {n}", pruebas: "Sasoi fisikoko probak: {x}", racha: "Segida atsegina: {n} aste", racha1: "Segida atsegina: aste 1", sesion1: "saio", minuto1: "minutu", dia1: "egun aktibo", esfuerzo: "Batez besteko ahalegina: {n}/10", sintomas: "Sintomaren bat izan duten saioak: {n} / {t}", cuidados: "Zure botikekin kontuz: {x}", farmacos: "Botikak: {x}", vacio: "Oraindik ez dago saiorik hilabete honetan.", animo_mas: "Joan den hilabetean baino mugimendu gehiago!", animo_igual: "Iraunkortasuna: joan den hilabeteko erritmo bera.", animo_menos: "Saio bakoitzak balio du: hurrengo hilabetera!", animo_primero: "Lehen hilabetea martxan da.", pie: "Pauta Activa · izenik eta datu pertsonalik gabe", pie_med: "Pauta Activa · izenik gabe", para: "Norentzat", familia: "Familia", medico: "Medikua", sinnombres: "Botiken izenik gabe", compartir: "Partekatu irudia", descargar: "Deskargatu", copiar: "Kopiatu testua", copiado: "Testua kopiatu da.", texto: "Testuan", ant: "Aurreko hilabetea", sig: "Hurrengo hilabetea", nota: "Irudia gailu honetan sortzen da, eta zuk partekatzen baduzu bakarrik ateratzen da.", alt: "Hilabeteko laburpenaren irudia" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
const nombreMes = (anio, mes) => new Date(anio, mes, 15).toLocaleDateString(idioma(), { month: "long", year: "numeric" });
const fechaCorta = (s) => deISO(s).toLocaleDateString(idioma(), { day: "numeric", month: "short" });
const num = (v, d = 0) => Number(v).toLocaleString(idioma(), { minimumFractionDigits: d, maximumFractionDigits: d });
const delta = (n, x) => (n > 0 ? tx("mas", { n: num(n), x }) : n < 0 ? tx("menos", { n: num(-n), x }) : tx("igual", { x }));

/** Todo lo que va en el resumen (lo usan la imagen y el texto). c: { diario, objMin, eqN, metas, POR_ID, sft, pruebas, racha, cuidados, farmacos }. */
export function datosMes(c, anio, mes, { para = "familia", sinNombres = true } = {}) {
  const hoy = c.ahora || new Date(), enCurso = anio === hoy.getFullYear() && mes === hoy.getMonth();
  // el mes en curso se compara con los mismos días del anterior (si no, siempre saldría «menos»)
  const r = resumenMes(c.diario, anio, mes), [aa, am] = anterior(anio, mes), a = resumenMes(c.diario, aa, am, enCurso ? hoy.getDate() : 31), d = comparar(r, a);
  const semanasMes = diasDelMes(anio, mes) / 7;
  const hitos = hitosDelMes(c.metas, c.POR_ID, anio, mes);
  const sftMes = (c.sft?.hist || []).filter((h) => { const x = new Date(h.f); return x.getFullYear() === anio && x.getMonth() === mes; });
  let pruebas = "";
  if (sftMes.length && c.pruebas) { const u = sftMes[sftMes.length - 1], R = c.pruebas.resumen(u.r, u.edad, u.sexo); pruebas = R.total ? `${R.habituales}/${R.total} ${c.pruebas.tx("resn")}` : `${R.filas.length}`; }
  const destacados = [];
  if (r.mejorSemana && r.sesiones) destacados.push(tx("mejor", { n: num(r.mejorSemana.min), d: fechaCorta(r.mejorSemana.desde) }));
  if (r.masLarga) destacados.push(tx("larga", { n: num(r.masLarga) }));
  if (hitos.length) destacados.push(`${tx("hitos", { n: hitos.length })} · ${[...new Set(hitos.map((h) => h.meta))].join(", ")}`);
  if (pruebas) destacados.push(tx("pruebas", { x: pruebas }));
  if (c.racha) destacados.push(c.racha === 1 ? tx("racha1") : tx("racha", { n: c.racha }));
  const medico = []; let conNombres = false;
  if (para === "medico") {
    if (r.rpe != null) medico.push(tx("esfuerzo", { n: num(r.rpe, 1) }));
    if (r.sesiones) medico.push(tx("sintomas", { n: r.conSintomas, t: r.sesiones }));
    if (c.cuidados?.length) medico.push(tx("cuidados", { x: c.cuidados.join(", ") }));
    if (!sinNombres && c.farmacos?.length) { medico.push(tx("farmacos", { x: c.farmacos.join(", ") })); conNombres = true; }
  }
  const m = tx(enCurso ? "comp_hoy" : "comp_mes");
  return {
    r, a, d, enCurso, mesTxt: nombreMes(anio, mes),
    stats: [{ n: r.sesiones, k: r.sesiones === 1 ? "sesion1" : "sesiones", d: d.hayAntes ? delta(d.sesiones, m) : tx("primero") }, { n: r.minutos, k: r.minutos === 1 ? "minuto1" : "minutos", d: d.hayAntes ? delta(d.minutos, m) : "" }, { n: r.dias, k: r.dias === 1 ? "dia1" : "dias", d: d.hayAntes ? delta(d.dias, m) : "" }],
    barras: [
      { k: "moverse", v: r.minutos, o: Math.round(((c.objMin || 150) * semanasMes) / 10) * 10, txt: "min_obj" },
      { k: "fuerza", v: r.diasFuerza, o: Math.round(2 * semanasMes), txt: "dias_obj" },
      { k: "equilibrio", v: r.diasEquilibrio, o: Math.round((c.eqN || 2) * semanasMes), txt: "dias_obj" },
    ],
    destacados, medico,
    pie: tx(conNombres ? "pie_med" : "pie"),
    animo: !r.sesiones ? tx("vacio") : !d.hayAntes ? tx("animo_primero") : d.minutos > 0 ? tx("animo_mas") : d.minutos === 0 ? tx("animo_igual") : tx("animo_menos"),
  };
}
/** El resumen en texto (para copiar en un mensaje). */
export function textoMes(D) {
  const L = [`${tx("cab")} · ${D.mesTxt}`, D.stats.map((s) => `${num(s.n)} ${tx(s.k)}`).join(" · ") + (D.stats[0].d ? ` (${D.stats[0].d})` : "")];
  L.push(D.barras.map((b) => `${tx(b.k)}: ${tx(b.txt, { n: num(b.v), o: num(b.o) })}`).join(" · "));
  for (const x of [...D.destacados, ...D.medico]) L.push(`- ${x}`);
  L.push(D.animo, D.pie);
  return L.join("\n");
}

/* ---------- la imagen (1080 × 1350, se dibuja en el dispositivo) ---------- */
const C = { noche: "#140B3A", noche2: "#2B1C78", marca: "#593EDE", clara: "#A49CFF", oro: "#F0C674", fondo: "#F6F6F9", sup: "#FFFFFF", sup2: "#EEECFF", tinta: "#151423", gris: "#55546A", linea: "#DDDCE6", verde: "#1F8A5B", ambar: "#9A6A12" };
const FUENTE = '"Archivo", "Segoe UI", system-ui, -apple-system, Helvetica, Arial, sans-serif';
function rect(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else { g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); } }
/** Escribe un texto en varias líneas (como mucho `max`; la última, con puntos suspensivos si no cabe). Devuelve la y siguiente. */
function envolver(g, texto, x, y, ancho, alto, max = 2) {
  const pal = String(texto).split(/\s+/); let linea = "", n = 0;
  for (let i = 0; i < pal.length; i++) {
    const prueba = linea ? `${linea} ${pal[i]}` : pal[i];
    if (g.measureText(prueba).width > ancho && linea) {
      if (n === max - 1) { let l = linea; while (g.measureText(l + "…").width > ancho && l.length) l = l.slice(0, -1); g.fillText(l + "…", x, y); return y + alto; }
      g.fillText(linea, x, y); y += alto; n++; linea = pal[i];
    } else linea = prueba;
  }
  if (linea) { g.fillText(linea, x, y); y += alto; }
  return y;
}
export async function dibujar(canvas, D) {
  try { await Promise.race([Promise.all(["400 30px Archivo", "700 30px Archivo", "800 30px Archivo"].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1200))]); } catch {}
  const W = 1080, H = 1350, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  g.fillStyle = C.fondo; g.fillRect(0, 0, W, H);
  // cabecera de noche con anillos
  const cab = g.createLinearGradient(0, 0, W, 300); cab.addColorStop(0, C.noche); cab.addColorStop(1, C.noche2);
  g.fillStyle = cab; g.fillRect(0, 0, W, 300);
  g.lineCap = "round";
  [[150, C.marca, 0.82], [118, C.clara, 0.62], [86, C.oro, 0.45]].forEach(([r, col, p], k) => {
    g.lineWidth = 22; g.strokeStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(930, 150, r - k * 2, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = col; g.beginPath(); g.arc(930, 150, r - k * 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, D.barras[k] ? D.barras[k].v / Math.max(1, D.barras[k].o) : p)); g.stroke();
  });
  g.fillStyle = C.oro; g.font = `700 26px ${FUENTE}`; g.letterSpacing = "6px"; g.fillText("PAUTA ACTIVA", 56, 92); g.letterSpacing = "0px";
  g.fillStyle = "#FFFFFF"; g.font = `800 64px ${FUENTE}`; g.fillText(tx("cab"), 56, 172);
  g.fillStyle = C.clara; g.font = `600 40px ${FUENTE}`; g.fillText(D.mesTxt, 56, 232);
  // tres cifras con su comparación (en dos líneas si hace falta)
  D.stats.forEach((s, k) => {
    const x = 48 + k * 336, y = 326;
    g.fillStyle = C.sup; rect(g, x, y, 312, 226, 28); g.fill(); g.strokeStyle = C.linea; g.lineWidth = 2; g.stroke();
    g.fillStyle = C.noche; g.font = `800 88px ${FUENTE}`; g.fillText(num(s.n), x + 28, y + 100);
    g.fillStyle = C.gris; g.font = `600 30px ${FUENTE}`; g.fillText(tx(s.k), x + 28, y + 142);
    if (s.d) { g.fillStyle = /▲/.test(s.d) ? C.verde : /▼/.test(s.d) ? C.ambar : C.gris; g.font = `700 21px ${FUENTE}`; envolver(g, s.d, x + 28, y + 178, 262, 26, 2); }
  });
  // calendario del mes (casillas de 56 px: caben 6 filas)
  const { anio, mes, porDia } = D.r, x0 = 48, y0 = 616, c = 56, gap = 8;
  g.fillStyle = C.tinta; g.font = `800 32px ${FUENTE}`; g.fillText(tx("calendario"), x0, 598);
  const iniciales = [...Array(7)].map((_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(idioma(), { weekday: "narrow" }).toUpperCase());
  g.font = `700 21px ${FUENTE}`; g.fillStyle = C.gris; g.textAlign = "center";
  iniciales.forEach((l, i) => g.fillText(l, x0 + i * (c + gap) + c / 2, y0 + 20));
  const primero = (new Date(anio, mes, 1).getDay() + 6) % 7, nd = diasDelMes(anio, mes), hoy = iso(new Date());
  for (let d = 1; d <= nd; d++) {
    const p = primero + d - 1, col = p % 7, fila = Math.floor(p / 7), x = x0 + col * (c + gap), y = y0 + 36 + fila * (c + gap);
    const f = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, m = porDia[f] || 0, futuro = f > hoy;
    const nivel = m >= 40 ? 3 : m >= 20 ? 2 : m > 0 ? 1 : 0;
    g.fillStyle = futuro ? C.sup : [C.sup2, "#D6D1FF", C.clara, C.marca][nivel]; rect(g, x, y, c, c, 13); g.fill();
    if (futuro || !nivel) { g.strokeStyle = C.linea; g.lineWidth = 2; g.stroke(); }
    if (f === hoy) { g.strokeStyle = C.oro; g.lineWidth = 4; rect(g, x - 3, y - 3, c + 6, c + 6, 15); g.stroke(); }
    g.fillStyle = nivel >= 2 ? "#FFFFFF" : futuro ? "#B0AEC2" : C.gris; g.font = `700 21px ${FUENTE}`; g.fillText(String(d), x + c / 2, y + c / 2 + 8);
  }
  g.textAlign = "left";
  // barras de moverse, fuerza y equilibrio
  const xb = 536, wb = 496; let y = 598;
  for (const b of D.barras) {
    g.fillStyle = C.tinta; g.font = `800 29px ${FUENTE}`; g.fillText(tx(b.k), xb, y);
    g.fillStyle = C.gris; g.font = `600 21px ${FUENTE}`; g.textAlign = "right"; g.fillText(tx(b.txt, { n: num(b.v), o: num(b.o) }), xb + wb, y); g.textAlign = "left";
    g.fillStyle = C.sup2; rect(g, xb, y + 16, wb, 20, 10); g.fill();
    const p = Math.min(1, b.v / Math.max(1, b.o));
    if (p > 0) { const gr = g.createLinearGradient(xb, 0, xb + wb, 0); gr.addColorStop(0, C.marca); gr.addColorStop(1, C.clara); g.fillStyle = gr; rect(g, xb, y + 16, Math.max(20, wb * p), 20, 10); g.fill(); }
    y += 84;
  }
  // destacados
  y += 6; g.font = `600 25px ${FUENTE}`;
  for (const d of D.destacados.slice(0, 5)) {
    if (y > 1010) break;
    g.fillStyle = C.oro; g.beginPath(); g.arc(xb + 8, y - 9, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = C.tinta; y = envolver(g, d, xb + 28, y, wb - 28, 32, 2) + 8;
  }
  // franja final: para el médico, sus datos; para la familia, una frase
  const yf = 1044, hf = 234;
  g.fillStyle = D.medico.length ? C.sup : C.sup2; rect(g, 48, yf, 984, hf, 28); g.fill();
  if (D.medico.length) {
    g.strokeStyle = C.linea; g.lineWidth = 2; g.stroke();
    let yy = yf + 46;
    for (const m of D.medico.slice(0, 4)) {
      if (yy > yf + hf - 20) break;
      const [k, ...v] = m.split(": ");
      g.fillStyle = C.marca; g.font = `800 23px ${FUENTE}`; const ancho = v.length ? g.measureText(k + ": ").width : 0; if (v.length) g.fillText(k + ":", 76, yy);
      g.fillStyle = C.tinta; g.font = `600 23px ${FUENTE}`; yy = envolver(g, v.length ? v.join(": ") : m, 76 + ancho, yy, 928 - ancho, 30, 2) + 6;
    }
  } else { g.fillStyle = C.marca; g.font = `800 38px ${FUENTE}`; g.textAlign = "center"; envolver(g, D.animo, W / 2, yf + hf / 2 + 12, 900, 46, 2); g.textAlign = "left"; }
  g.fillStyle = C.gris; g.font = `600 22px ${FUENTE}`; g.textAlign = "center"; g.fillText(D.pie, W / 2, 1320); g.textAlign = "left";
  return canvas;
}

/* ---------- ventana ---------- */
const CSS = `
.mes-dlg .mes-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 10px; }
.mes-dlg .mes-nav h2 { margin: 0; font-size: 1.15rem; text-align: center; flex: 1; }
.mes-dlg .mes-nav button { min-width: 44px; }
.mes-img { display: block; width: 100%; max-width: 440px; height: auto; margin: 0 auto 12px; border-radius: var(--r-md); border: 1px solid var(--line); box-shadow: var(--shadow); background: var(--surface-2); aspect-ratio: 1080 / 1350; }
.mes-opc { display: grid; gap: 10px; justify-items: center; margin: 0 0 12px; }
.mes-seg { display: inline-flex; flex-wrap: wrap; justify-content: center; gap: 6px; border: 0; margin: 0; padding: 0; }
.mes-seg legend { width: 100%; margin-bottom: 4px; font-weight: 700; font-size: .88rem; text-align: center; }
.mes-seg label { position: relative; display: inline-flex; }
.mes-seg input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.mes-seg span { display: inline-flex; align-items: center; min-height: 40px; padding: 6px 16px; border: 1.5px solid var(--line-strong); border-radius: 999px; background: var(--surface); font-size: .9rem; }
.mes-seg input:checked + span { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-deep); font-weight: 700; }
.mes-seg input:focus-visible + span { outline: 3px solid var(--accent); outline-offset: 2px; }
.mes-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.mes-texto { margin: 12px 0 0; }
.mes-texto pre { margin: 8px 0 0; padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); white-space: pre-wrap; font: .86rem/1.5 var(--font); }
.mes-nota { margin: 10px 0 0; font-size: .8rem; color: var(--muted); text-align: center; }
`;
let dlg = null, ctx = {}, vista = { i: 0, para: "familia", sinNombres: true };
const cu = () => dlg.querySelector("#mes-cuerpo");
function crear() {
  if (!document.getElementById("mes-css")) { const st = document.createElement("style"); st.id = "mes-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "mes"; dlg.className = "ficha mes-dlg"; dlg.setAttribute("aria-labelledby", "mes-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="mes-cab-t">${tx("titulo")}</p><button type="button" class="btn-sec sm" id="mes-cerrar">${t("ficha.cerrar")}</button></div><div class="ficha-cuerpo" id="mes-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#mes-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
}
const nombreArchivo = (anio, mes) => `pauta-activa-${anio}-${String(mes + 1).padStart(2, "0")}.png`;
function descargar(blob, nombre) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
async function pintar() {
  const lista = meses(ctx.diario), [anio, mes] = lista[vista.i];
  const D = datosMes(ctx, anio, mes, vista), texto = textoMes(D);
  cu().innerHTML = `
    <div class="mes-nav"><button type="button" class="btn-sec sm" data-ant aria-label="${tx("ant")}"${vista.i === 0 ? " disabled" : ""}>‹</button><h2 id="mes-h">${D.mesTxt.charAt(0).toUpperCase() + D.mesTxt.slice(1)}</h2><button type="button" class="btn-sec sm" data-sig aria-label="${tx("sig")}"${vista.i === lista.length - 1 ? " disabled" : ""}>›</button></div>
    <img class="mes-img" alt="${tx("alt")}: ${texto.replace(/"/g, "'").replace(/\n/g, ". ")}" width="1080" height="1350">
    <div class="mes-opc">
      <fieldset class="mes-seg"><legend>${tx("para")}</legend>${["familia", "medico"].map((v) => `<label><input type="radio" name="mes-para" value="${v}"${vista.para === v ? " checked" : ""}><span>${tx(v)}</span></label>`).join("")}</fieldset>
      ${vista.para === "medico" && ctx.farmacos?.length ? `<label class="check"><input type="checkbox" id="mes-sin"${vista.sinNombres ? " checked" : ""}> <span>${tx("sinnombres")}</span></label>` : ""}
    </div>
    <div class="mes-acciones"><button type="button" class="btn" data-compartir>${tx("compartir")}</button><button type="button" class="btn-sec sm" data-descargar>${tx("descargar")}</button><button type="button" class="btn-sec sm" data-copiar>${tx("copiar")}</button></div>
    <details class="mes-texto"><summary>${tx("texto")}</summary><pre>${texto.replace(/</g, "&lt;")}</pre></details>
    <p class="mes-nota">${tx("nota")}</p>`;
  const canvas = document.createElement("canvas");
  await dibujar(canvas, D);
  const img = cu().querySelector(".mes-img"); if (img) img.src = canvas.toDataURL("image/png");
  cu().querySelector("[data-ant]").addEventListener("click", () => { vista.i--; pintar(); });
  cu().querySelector("[data-sig]").addEventListener("click", () => { vista.i++; pintar(); });
  cu().querySelectorAll('input[name="mes-para"]').forEach((r) => r.addEventListener("change", () => { vista.para = r.value; pintar(); }));
  cu().querySelector("#mes-sin")?.addEventListener("change", (ev) => { vista.sinNombres = ev.target.checked; pintar(); });
  const blob = () => new Promise((r) => canvas.toBlob(r, "image/png"));
  cu().querySelector("[data-compartir]").addEventListener("click", async () => {
    const b = await blob(), file = new File([b], nombreArchivo(anio, mes), { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: `${tx("cab")} · ${D.mesTxt}`, text: texto.split("\n").slice(0, 2).join("\n") }); return; } catch (e) { if (e?.name === "AbortError") return; } }
    descargar(b, nombreArchivo(anio, mes));
  });
  cu().querySelector("[data-descargar]").addEventListener("click", async () => descargar(await blob(), nombreArchivo(anio, mes)));
  cu().querySelector("[data-copiar]").addEventListener("click", async () => { try { await navigator.clipboard.writeText(texto); ctx.toast?.(tx("copiado"), { ms: 3000 }); } catch {} });
  document.dispatchEvent(new CustomEvent("mes-pintado", { detail: { anio, mes } }));
}
/** Abre el resumen del mes actual. c: { diario, objMin, eqN, metas, POR_ID, sft, pruebas, racha, cuidados, farmacos, toast }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c;
  dlg.querySelector("#mes-cab-t").textContent = tx("titulo");
  vista = { i: meses(c.diario).length - 1, para: vista.para, sinNombres: true };
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
