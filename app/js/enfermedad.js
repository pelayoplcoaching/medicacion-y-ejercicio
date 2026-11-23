/* Plan para los días de enfermedad (segunda tanda de mejoras grandes, 18). Se carga bajo demanda (data-abre="enfermedad").
   Cuando hay vómitos, diarrea o fiebre, algunos medicamentos conviene pausarlos y retomarlos al recuperarse. La aplicación
   dice cuáles de la lista están en esa pauta y por qué, y ayuda a prepararla: la persona marca lo que ya ha acordado con su
   médico y se lleva la hoja impresa. NUNCA indica dejar un medicamento por cuenta propia: es una pauta que se pacta antes.
   CONTENIDO CLÍNICO NUEVO: BORRADOR PENDIENTE DE REVISIÓN CLÍNICA. Fuente: «Medicines and acute dehydrating illness.
   Medication Sick Day Guidance», versión 4 (2026), del Gobierno de Escocia y Healthcare Improvement Scotland (hoja para
   pacientes y hoja para profesionales, consultadas el 22/11/2026): definición (dos o más vómitos o diarreas, o fiebre con
   sudores o tiritona, no leve), los seis grupos, las sulfonilureas según la glucosa, retomar tras 24–48 horas comiendo y
   bebiendo con normalidad, sin dosis de más, consultar si dura más de 72 horas y la cautela en la insuficiencia cardiaca.
   Lo que se sabe de su eficacia: Watson 2022 (PubMed). El descanso con fiebre es la regla ya revisada de la aplicación.
   Contenido en español, como la base; la interfaz, en cinco idiomas. Estado: «medex.enfermedad» = { acordado: [ids] }. */
import { idioma, t } from "./i18n.js?v=202611230006";
import { APP_VERSION } from "./version.js?v=202611230006";

const TXT = {
  es: { titulo: "Plan para los días de enfermedad", borrador: "Borrador pendiente de revisión clínica", de_su_lista: "De su lista", ninguno: "Ninguno de sus medicamentos está en esta pauta.", sin_meds: "Añada su medicación y verá cuáles entran en esta pauta.", todos: "Los grupos de la pauta", otros: "Los demás grupos de la pauta", segun: "Según la glucosa", acordado: "Acordado con mi médico: pausarlo esos días", por_acordar: "Por acordar", ya: "Acordado", retomar: "Cuándo retomarlos", consultar: "Cuándo consultar", ejercicio: "¿Y el ejercicio?", sabe: "Qué se sabe", fuentes: "Fuentes",
    imprimir: "Imprimir mi plan", preguntas: "Llevarlo a mis preguntas", vuelta: "Volver tras un parón", hoja_fecha: "Fecha", hoja_nombre: "Nombre", hoja_med: "Medicamento", hoja_que: "Qué hago", hoja_pausar: "Pausar esos días (acordado)", hoja_preguntar: "Preguntar en la consulta", hoja_pie: "Preparado con Pauta Activa. Esta hoja se rellena con su médico, enfermera o farmacéutico: no sustituye su consejo.", n_acordados: "{a} de {b} acordados",
  },
  en: { titulo: "Sick-day plan", borrador: "Draft pending clinical review", de_su_lista: "From your list", ninguno: "None of your medicines is in this guidance.", sin_meds: "Add your medication to see which ones are in this guidance.", todos: "The groups in the guidance", otros: "The other groups in the guidance", segun: "Depending on glucose", acordado: "Agreed with my doctor: pause it on those days", por_acordar: "To be agreed", ya: "Agreed", retomar: "When to restart", consultar: "When to seek advice", ejercicio: "What about exercise?", sabe: "What is known", fuentes: "Sources",
    imprimir: "Print my plan", preguntas: "Take it to my questions", vuelta: "Coming back after a break", hoja_fecha: "Date", hoja_nombre: "Name", hoja_med: "Medicine", hoja_que: "What I do", hoja_pausar: "Pause on those days (agreed)", hoja_preguntar: "Ask at the appointment", hoja_pie: "Prepared with Pauta Activa. Fill this sheet in with your doctor, nurse or pharmacist: it does not replace their advice.", n_acordados: "{a} of {b} agreed",
  },
  ca: { titulo: "Pla per als dies de malaltia", borrador: "Esborrany pendent de revisió clínica", de_su_lista: "De la vostra llista", ninguno: "Cap dels vostres medicaments és en aquesta pauta.", sin_meds: "Afegiu la vostra medicació i veureu quins entren en aquesta pauta.", todos: "Els grups de la pauta", otros: "Els altres grups de la pauta", segun: "Segons la glucosa", acordado: "Acordat amb el meu metge: aturar-lo aquells dies", por_acordar: "Per acordar", ya: "Acordat", retomar: "Quan reprendre'ls", consultar: "Quan consultar", ejercicio: "I l'exercici?", sabe: "Què se sap", fuentes: "Fonts",
    imprimir: "Imprimir el meu pla", preguntas: "Portar-ho a les meves preguntes", vuelta: "Tornar després d'una aturada", hoja_fecha: "Data", hoja_nombre: "Nom", hoja_med: "Medicament", hoja_que: "Què faig", hoja_pausar: "Aturar aquells dies (acordat)", hoja_preguntar: "Preguntar a la consulta", hoja_pie: "Preparat amb Pauta Activa. Aquest full s'omple amb el metge, la infermera o el farmacèutic: no en substitueix el consell.", n_acordados: "{a} de {b} acordats",
  },
  gl: { titulo: "Plan para os días de enfermidade", borrador: "Borrador pendente de revisión clínica", de_su_lista: "Da súa lista", ninguno: "Ningún dos seus medicamentos está nesta pauta.", sin_meds: "Engada a súa medicación e verá cales entran nesta pauta.", todos: "Os grupos da pauta", otros: "Os demais grupos da pauta", segun: "Segundo a glicosa", acordado: "Acordado co meu médico: pausalo eses días", por_acordar: "Por acordar", ya: "Acordado", retomar: "Cando retomalos", consultar: "Cando consultar", ejercicio: "E o exercicio?", sabe: "Que se sabe", fuentes: "Fontes",
    imprimir: "Imprimir o meu plan", preguntas: "Levalo ás miñas preguntas", vuelta: "Volver tras un parón", hoja_fecha: "Data", hoja_nombre: "Nome", hoja_med: "Medicamento", hoja_que: "Que fago", hoja_pausar: "Pausar eses días (acordado)", hoja_preguntar: "Preguntar na consulta", hoja_pie: "Preparado con Pauta Activa. Esta folla énchese co seu médico, enfermeira ou farmacéutico: non substitúe o seu consello.", n_acordados: "{a} de {b} acordados",
  },
  eu: { titulo: "Gaixotasun-egunetarako plana", borrador: "Zirriborroa, berrikuspen klinikoaren zain", de_su_lista: "Zure zerrendatik", ninguno: "Zure botiketako bat ere ez dago jarraibide honetan.", sin_meds: "Gehitu zure botikak eta jarraibide honetan zein sartzen diren ikusiko duzu.", todos: "Jarraibideko taldeak", otros: "Jarraibideko gainerako taldeak", segun: "Glukosaren arabera", acordado: "Medikuarekin adostuta: egun horietan eten", por_acordar: "Adosteko", ya: "Adostuta", retomar: "Noiz hartu berriro", consultar: "Noiz kontsultatu", ejercicio: "Eta ariketa?", sabe: "Zer dakigun", fuentes: "Iturriak",
    imprimir: "Inprimatu nire plana", preguntas: "Eraman nire galderetara", vuelta: "Etenaldi baten ondoren itzuli", hoja_fecha: "Data", hoja_nombre: "Izena", hoja_med: "Botika", hoja_que: "Zer egiten dut", hoja_pausar: "Egun horietan eten (adostuta)", hoja_preguntar: "Kontsultan galdetu", hoja_pie: "Pauta Activarekin prestatua. Orri hau medikuarekin, erizainarekin edo farmazialariarekin betetzen da: ez du haien aholkua ordezkatzen.", n_acordados: "{b}tik {a} adostuta",
  },
};
export const tx = (k, vars) => { let s = TXT[idioma()]?.[k] ?? TXT.es[k] ?? k; if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b); return s; };

/* Los seis grupos de la tarjeta, en su orden, y las sulfonilureas aparte. es(it): si un medicamento de la lista es del grupo
   (it = elemento de res.items: { principio, clase, senales }). */
export const GRUPOS = [
  { id: "isglt2", nombre: "Inhibidores de SGLT2 (los que acaban en «-gliflozina»)", porque: "Hacen orinar más y pueden empeorar la pérdida de líquido. Pausarlos esos días ayuda a evitar una cetoacidosis, que con estos fármacos puede darse con el azúcar normal.", es: (it) => it.clase?.id === "isglt2" },
  { id: "ieca", nombre: "IECA (los que acaban en «-pril») y ARA-II (los que acaban en «-sartán»)", porque: "Con deshidratación pueden empeorar el funcionamiento del riñón.", es: (it) => it.senales.has("ieca_ara") },
  { id: "diuretico", nombre: "Diuréticos", porque: "Pueden causar deshidratación o empeorarla.", es: (it) => it.senales.has("diuretico") },
  { id: "metformina", nombre: "Metformina", porque: "Con deshidratación se elimina peor y aumenta el riesgo de acidosis láctica.", es: (it) => it.clase?.id === "metformina" },
  { id: "aine", nombre: "Antiinflamatorios (ibuprofeno, naproxeno, diclofenaco…)", porque: "Con deshidratación aumentan el riesgo de daño agudo del riñón. Si los toma para la fiebre, hay que sopesarlo.", es: (it) => it.senales.has("aine") },
];
export const SULFONILUREAS = { id: "sulfonilurea", nombre: "Sulfonilureas (gliclazida, glimepirida, glibenclamida)", porque: "No están en la tarjeta. Se puede valorar pausarlas si la glucosa está baja, pero la enfermedad puede subirla: la decisión se toma mirando la glucosa.", es: (it) => it.clase?.id === "sulfonilureas" };

export const CONT = {
  que_es: "Cuando tiene vómitos o diarrea (dos o más veces) o fiebre con sudores o tiritona (no unas décimas), el cuerpo pierde líquido. Algunos medicamentos conviene pausarlos esos días y retomarlos al recuperarse.",
  pacto: "Es una pauta que se acuerda de antemano con su médico, enfermera o farmacéutico. No la aplique por su cuenta: prepárela aquí y llévela a la consulta.",
  retomar: "Al recuperarse: normalmente tras 24–48 horas comiendo y bebiendo con normalidad. Tómelos como siempre; no tome dosis de más para compensar las que no tomó.",
  consultar: "Si la enfermedad dura más de 72 horas, consulte para que le revisen.",
  isglt2_aviso: "Con un inhibidor de SGLT2, si come o bebe poco hay riesgo de cetoacidosis aunque el azúcar esté normal: náuseas, vómitos, dolor de barriga o respiración acelerada obligan a consultar.",
  ic: "Con insuficiencia cardiaca moderada o grave esta pauta puede no ser adecuada: pida antes consejo a su especialista.",
  insulina: "Esta pauta no habla de la insulina: no la cambie sin las instrucciones de su equipo de diabetes.",
  ejercicio: "Con fiebre o deshidratación, descanse. Retome el ejercicio cuando lleve 24–48 horas sin fiebre, a intensidad baja.",
  sabe: "Muchas guías recomiendan esta pauta, pero una revisión de 74 documentos encontró muy pocos estudios que hayan medido si evita complicaciones, y ninguno que lo demostrara. Por eso se pacta persona a persona y no se aplica a ciegas.",
};
export const FUENTES = [
  { txt: "Medicines and acute dehydrating illness. Medication Sick Day Guidance, versión 4 (2026). Gobierno de Escocia y Healthcare Improvement Scotland: hoja para pacientes y hoja para profesionales", url: "https://www.healthcareimprovementscotland.scot/wp-content/uploads/2026/05/NHS-Medicine-sick-day-guidance-Professional-June-2026.pdf" },
  { txt: "Watson et al. Sick day medication guidance for people with diabetes, kidney disease, or cardiovascular disease: a systematic scoping review. Kidney Med 2022", doi: "10.1016/j.xkme.2022.100491" },
];

/** Qué medicamentos de la lista entran en la pauta. items = res.items. Devuelve { grupos: [{ ...grupo, meds: [nombres] }] (solo los que tienen alguno),
    sulfonilureas: [nombres], insulina: bool, n: medicamentos distintos en los seis grupos }. */
export function plan(items = []) {
  const nombres = (f) => [...new Set(items.filter(f).map((it) => it.principio.nombre))];
  const grupos = GRUPOS.map((g) => ({ id: g.id, nombre: g.nombre, porque: g.porque, meds: nombres(g.es) })).filter((g) => g.meds.length);
  return { grupos, sulfonilureas: nombres(SULFONILUREAS.es), insulina: items.some((it) => it.clase?.id === "insulina"), n: new Set(grupos.flatMap((g) => g.meds)).size };
}

const CLAVE = "medex.enfermedad", IDS = [...GRUPOS.map((g) => g.id), SULFONILUREAS.id];
export function leer() { try { const o = JSON.parse(localStorage.getItem(CLAVE) || "null"); return { acordado: (Array.isArray(o?.acordado) ? o.acordado : []).filter((id) => IDS.includes(id)) }; } catch { return { acordado: [] }; } }
const guardar = (o) => { try { if (o.acordado.length) localStorage.setItem(CLAVE, JSON.stringify(o)); else localStorage.removeItem(CLAVE); } catch {} };

const CSS = `
.sd-dlg { width: min(760px, calc(100vw - 16px)); }
.sd-borrador { display: inline-block; margin: 0 0 10px; padding: 3px 10px; border-radius: 999px; border: 1px dashed var(--precaucion); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .78rem; font-weight: 700; }
.sd-que { margin: 0 0 8px; }
.sd-pacto { margin: 0 0 4px; padding: 10px 12px; border-left: 4px solid var(--alerta); border-radius: var(--r-sm); background: var(--alerta-soft); color: var(--alerta-ink); font-weight: 700; }
.sd-dlg h3 { margin: 18px 0 8px; font-size: 1rem; }
.sd-n { font-family: var(--mono); font-size: .8rem; font-weight: 700; color: var(--muted); }
.sd-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sd-g { padding: 12px 14px; border: 1px solid var(--line); border-radius: var(--r-md); background: var(--surface); }
.sd-g.acordado { border-color: var(--info); }
.sd-g > b { display: block; line-height: 1.3; }
.sd-meds { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; padding: 0; list-style: none; }
.sd-meds li { padding: 2px 10px; border-radius: 999px; border: 1px solid var(--line-strong); font-size: .86rem; font-weight: 700; }
.sd-g p { margin: 0; font-size: .92rem; color: var(--muted); }
.sd-g label { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0 0; padding: 8px 10px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .92rem; font-weight: 600; cursor: pointer; }
.sd-g label input { flex: none; width: 22px; height: 22px; margin: 0; accent-color: var(--accent); }
.sd-g label:has(input:focus-visible), .sd-dlg button:focus-visible, .sd-dlg a:focus-visible, .sd-dlg summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.sd-otros { margin: 0; padding-left: 1.2em; display: grid; gap: 4px; font-size: .9rem; color: var(--muted); }
.sd-nota { margin: 8px 0 0; padding: 8px 12px; border-left: 4px solid var(--precaucion); border-radius: var(--r-sm); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .92rem; }
.sd-caja { margin: 0; padding: 10px 12px; border-radius: var(--r-sm); background: var(--surface-2); }
.sd-acc { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; }
.sd-fuentes { margin: 0; padding-left: 1.2em; display: grid; gap: 6px; font-size: .82rem; color: var(--muted); }
.sd-fuentes a { color: var(--accent-deep, var(--accent)); overflow-wrap: anywhere; }
#sd-hoja { display: none; }
@media print {
  body.sd-imprime > *:not(#sd-hoja) { display: none !important; }
  body.sd-imprime #sd-hoja { display: block; color: #000; background: #fff; font: 12pt/1.45 system-ui, sans-serif; }
  #sd-hoja h1 { margin: 0 0 4pt; font-size: 19pt; } #sd-hoja h2 { margin: 14pt 0 4pt; font-size: 12pt; }
  #sd-hoja .sd-h-cab { margin: 0 0 12pt; padding-bottom: 8pt; border-bottom: 1.5pt solid #000; font-size: 10.5pt; }
  #sd-hoja table { width: 100%; border-collapse: collapse; } #sd-hoja th, #sd-hoja td { padding: 5pt 6pt; border: .6pt solid #555; text-align: left; vertical-align: top; font-size: 11pt; }
  #sd-hoja p { margin: 0 0 6pt; } #sd-hoja footer { margin-top: 16pt; padding-top: 6pt; border-top: .6pt solid #888; font-size: 9pt; color: #333; }
}
`;

let dlg = null, A = null, P = { grupos: [], sulfonilureas: [], insulina: false, n: 0 }, estado = { acordado: [] }, ic = false;
const cu = () => dlg.querySelector("#sd-cuerpo");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const filas = () => [...P.grupos, ...(P.sulfonilureas.length ? [{ id: SULFONILUREAS.id, nombre: SULFONILUREAS.nombre, porque: SULFONILUREAS.porque, meds: P.sulfonilureas, segun: true }] : [])];
function crear() {
  if (!document.getElementById("sd-css")) { const st = document.createElement("style"); st.id = "sd-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "enfermedad"; dlg.className = "ficha alta sd-dlg"; dlg.setAttribute("aria-labelledby", "sd-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="sd-cab-t"></p><button type="button" class="btn-sec sm" id="sd-cerrar"></button></div><div class="ficha-cuerpo" id="sd-cuerpo"></div>`;
  document.body.append(dlg);
  const hoja = document.createElement("div"); hoja.id = "sd-hoja"; document.body.append(hoja);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#sd-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("change", (ev) => {
    const i = ev.target; if (!i.matches?.("[data-sd-g]")) return;
    const s = new Set(estado.acordado); i.checked ? s.add(i.dataset.sdG) : s.delete(i.dataset.sdG); estado.acordado = IDS.filter((id) => s.has(id)); guardar(estado);
    i.closest(".sd-g").classList.toggle("acordado", i.checked); cuenta();
  });
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) { dlg.close(); return; }
    if (ev.target.closest('[data-sd="imprimir"]')) imprimir();
  });
}
function cuenta() { const e = dlg.querySelector("#sd-n"), f = filas(); if (e) e.textContent = f.length ? tx("n_acordados", { a: f.filter((g) => estado.acordado.includes(g.id)).length, b: f.length }) : ""; }
function imprimir() {
  const hoja = document.getElementById("sd-hoja"), f = filas();
  hoja.innerHTML = `<h1>${tx("titulo")}</h1><p class="sd-h-cab">${tx("hoja_fecha")}: ${new Date().toLocaleDateString(idioma())} · ${tx("hoja_nombre")}: ______________________________</p>
    <p>${CONT.que_es}</p>
    ${f.length ? `<table><thead><tr><th>${tx("hoja_med")}</th><th>${tx("hoja_que")}</th></tr></thead><tbody>${f.map((g) => `<tr><td><b>${esc(g.meds.join(", "))}</b><br>${g.nombre}</td><td>${estado.acordado.includes(g.id) ? "☑ " + tx("hoja_pausar") : "☐ " + tx("hoja_preguntar")}${g.segun ? `<br>${tx("segun")}` : ""}</td></tr>`).join("")}</tbody></table>` : `<p>${tx("ninguno")}</p>`}
    <h2>${tx("retomar")}</h2><p>${CONT.retomar}</p><h2>${tx("consultar")}</h2><p>${CONT.consultar}</p>
    ${P.grupos.some((g) => g.id === "isglt2") ? `<p>${CONT.isglt2_aviso}</p>` : ""}${ic ? `<p>${CONT.ic}</p>` : ""}${P.insulina ? `<p>${CONT.insulina}</p>` : ""}
    <footer>${tx("hoja_pie")} · v${APP_VERSION}</footer>`;
  document.body.classList.add("sd-imprime");
  const fin = () => { document.body.classList.remove("sd-imprime"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try { window.print(); } catch { fin(); } }, 120);
}
function tarjeta(g) {
  const ok = estado.acordado.includes(g.id);
  return `<li class="sd-g${ok ? " acordado" : ""}" data-id="${g.id}"><b>${g.nombre}</b><ul class="sd-meds">${g.meds.map((m) => `<li>${esc(m)}</li>`).join("")}</ul><p>${g.porque}</p><label><input type="checkbox" data-sd-g="${g.id}"${ok ? " checked" : ""}><span>${tx("acordado")}</span></label></li>`;
}
function pintar() {
  dlg.querySelector("#sd-cab-t").textContent = tx("titulo");
  const hayMeds = A.estado.meds.length > 0, mios = new Set(P.grupos.map((g) => g.id)), resto = GRUPOS.filter((g) => !mios.has(g.id));
  cu().innerHTML = `<p class="sd-borrador">${tx("borrador")}</p><p class="sd-que">${CONT.que_es}</p><p class="sd-pacto">${CONT.pacto}</p>
    <h3>${tx("de_su_lista")} <span class="sd-n" id="sd-n" aria-live="polite"></span></h3>
    ${P.grupos.length ? `<ul class="sd-lista" id="sd-mios">${P.grupos.map(tarjeta).join("")}</ul>` : `<p class="sd-caja" id="sd-ninguno">${hayMeds ? tx("ninguno") : tx("sin_meds")}</p>`}
    ${P.sulfonilureas.length ? `<h3>${tx("segun")}</h3><ul class="sd-lista" id="sd-su">${tarjeta({ id: SULFONILUREAS.id, nombre: SULFONILUREAS.nombre, porque: SULFONILUREAS.porque, meds: P.sulfonilureas })}</ul>` : ""}
    ${P.grupos.some((g) => g.id === "isglt2") ? `<p class="sd-nota" id="sd-isglt2">${CONT.isglt2_aviso}</p>` : ""}${ic ? `<p class="sd-nota" id="sd-ic">${CONT.ic}</p>` : ""}${P.insulina ? `<p class="sd-nota" id="sd-insulina">${CONT.insulina}</p>` : ""}
    ${resto.length ? `<h3>${P.grupos.length ? tx("otros") : tx("todos")}</h3><ul class="sd-otros" id="sd-otros">${resto.map((g) => `<li><b>${g.nombre}.</b> ${g.porque}</li>`).join("")}</ul>` : ""}
    <h3>${tx("retomar")}</h3><p class="sd-caja" id="sd-retomar">${CONT.retomar}</p>
    <h3>${tx("consultar")}</h3><p class="sd-caja" id="sd-consultar">${CONT.consultar}</p>
    <h3>${tx("ejercicio")}</h3><p class="sd-caja">${CONT.ejercicio}</p><div class="sd-acc"><button type="button" class="btn-sec sm" data-abre="vuelta">${tx("vuelta")}</button><button type="button" class="btn-sec sm" data-abre="numeros">${t("numeros.btn")}</button></div>
    <h3>${tx("sabe")}</h3><p class="sd-caja">${CONT.sabe}</p>
    <div class="sd-acc"><button type="button" class="btn" data-sd="imprimir">${tx("imprimir")}</button><button type="button" class="btn-sec" data-abre="preguntas">${tx("preguntas")}</button></div>
    <h3>${tx("fuentes")}</h3><ul class="sd-fuentes">${FUENTES.map((f) => `<li>${f.txt}. ${f.doi ? `<a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">doi:${f.doi}</a>` : `<a href="${f.url}" target="_blank" rel="noopener">healthcareimprovementscotland.scot</a>`}</li>`).join("")}</ul>`;
  cuenta();
}
/** Abre la ventana. */
export function abrir(api) {
  A = api;
  if (!dlg) crear();
  let items = []; try { items = api.estado.meds.length ? api.res().items : []; } catch {}
  P = plan(items); estado = leer(); ic = (api.estado.condiciones || []).includes("insuficiencia_cardiaca");
  const validos = new Set(filas().map((g) => g.id)); estado.acordado = estado.acordado.filter((id) => validos.has(id)); // lo acordado de un medicamento que ya no está no se arrastra
  dlg.querySelector("#sd-cerrar").textContent = api.cerrar();
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
  dlg.querySelector("#sd-cerrar").focus();
}
