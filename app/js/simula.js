/* «¿Qué cambia si…?» (mejora grande 16): simulador para pensar la retirada de medicamentos con el ejercicio en mente.
   La persona (o su médico) marca lo que quitaría y ve, frente a la lista actual: tomas al día, avisos de atención y
   precauciones, interacciones (y cuántas mayores), horas del día en que es mejor no entrenar, lo que ya no haría falta
   vigilar, si el pulso vuelve a servir para medir la intensidad, las interacciones y los avisos que desaparecerían y los
   cambios en su plan de ejercicio. Todo se calcula con el mismo motor que el informe (app.js le pasa «calc»). Avisa de
   los grupos que no se dejan de golpe o que no se deben dejar sin indicación (fichas técnicas; revisado por un clínico el
   22/11/2026). Nunca cambia la lista de verdad. Textos de la interfaz en cinco idiomas dentro del módulo. */
import { t, idioma } from "./i18n.js?v=202611231104";

/* grupos con aviso propio al quitarlos: «gradual» (no se dejan de golpe) e «imprescindible» (no se dejan sin indicación
   expresa). Fuente: fichas técnicas (AEMPS), apartados 4.2 y 4.4. Tras la validación externa del 23/11/2026: los
   antiepilépticos puros (antiepilepticos_otros) pasan a «imprescindible» (su retirada brusca puede provocar crisis) y
   sale de «gradual» el grupo de bupropión, agomelatina y moclobemida (la ficha de Valdoxan, 4.2, dice que no hace falta
   bajar la dosis al dejarlo). */
export const RETIRADA = {
  gradual: ["betabloqueantes", "corticoides", "benzodiacepinas", "hipnoticos_z", "isrs_isrsn", "triciclicos", "otros_antidepresivos", "antipsicoticos", "antipsicoticos_clozapina", "antiepilepticos", "levodopa", "antiparkinsonianos_otros", "opioides", "antihipertensivos_centrales", "litio", "relajantes_musculares"],
  imprescindible: ["antiepilepticos_otros", "hidrocortisona_sustitutiva", "insulina", "inmunosupresores_trasplante", "antirretrovirales", "anticoagulantes", "antiagregantes"],
};
export const retirada = (clase) => (RETIRADA.imprescindible.includes(clase) ? "imprescindible" : RETIRADA.gradual.includes(clase) ? "gradual" : null);
const ORDEN_NIVEL = { alerta: 0, mayor: 0, precaucion: 1, moderada: 1, menor: 2, info: 2 };
/** Lo que el informe calcularía con una lista concreta: d es el motor que le pasa la aplicación
    ({ evaluar(meds), prescripcion(res), ventana(meds), franja(ventana), unidad(pid), cuidados(señales) }). */
export function escenario(d, meds) {
  const res = d.evaluar(meds), P = d.prescripcion(res), v = d.ventana(meds), reglas = [], plan = {};
  for (const [amb, gs] of Object.entries(res.ambitos)) for (const g of gs) for (const r of g.reglas) if (r.nivel !== "info") reglas.push({ k: `${g.item.principio.id}|${amb}|${r.texto}`, nivel: r.nivel, txt: r.texto, farmaco: g.item.principio.nombre });
  for (const c of res.combinadas) if (c.regla.nivel !== "info") reglas.push({ k: "comb|" + (c.regla.id || c.regla.titulo), nivel: c.regla.nivel, txt: c.regla.titulo || c.texto, farmaco: "" });
  for (const a of ["aer", "fue", "eq"]) for (const f of ["frec", "int", "tiempo", "tipo"]) plan[`${a}.${f}`] = P[a][f];
  const diario = (m) => !/semana|mes|año/.test(m.unidad || d.unidad?.(m.pid) || "mg");
  return {
    tomas: meds.filter((m) => !m.aDemanda && diario(m)).reduce((n, m) => n + (m.momentos?.length || m.tomas || 1), 0),
    resumen: res.resumen, reglas, plan, franja: d.franja ? d.franja(v) : null,
    pulso: !["fc_no_valida", "bradicardia", "taquicardia"].some((s) => res.perfil[s]?.length),
    inter: res.interacciones.filter((x) => x.a.principio.id !== x.b.principio.id).map((x) => ({ k: [x.a.principio.id, x.b.principio.id].sort().join("|"), nivel: x.nivel, txt: `${x.a.principio.nombre} + ${x.b.principio.nombre}` })),
    cuidados: d.cuidados ? d.cuidados(res.items.flatMap((it) => [...it.senales])) : [],
    horas: { rojo: v.horas.filter((h) => h.nivel === "rojo").length, ambar: v.horas.filter((h) => h.nivel === "ambar").length },
  };
}
/** Lo que cambia de un escenario (A, la lista de ahora) a otro (B, sin los marcados). */
export function comparar(A, B) {
  const fuera = (xs, ys) => xs.filter((x) => !ys.some((y) => y.k === x.k)).sort((p, q) => (ORDEN_NIVEL[p.nivel] ?? 3) - (ORDEN_NIVEL[q.nivel] ?? 3));
  const may = (E) => E.inter.filter((x) => x.nivel === "mayor").length, horas = (E) => E.horas.rojo + E.horas.ambar;
  const plan = Object.keys(A.plan).filter((k) => A.plan[k] !== B.plan[k]).map((k) => ({ k, antes: A.plan[k], despues: B.plan[k] }));
  const D = {
    tomas: [A.tomas, B.tomas], alerta: [A.resumen.alerta, B.resumen.alerta], precaucion: [A.resumen.precaucion, B.resumen.precaucion],
    inter: [A.inter.length, B.inter.length], mayores: [may(A), may(B)], horas: [horas(A), horas(B)],
    interFuera: fuera(A.inter, B.inter), interNuevas: fuera(B.inter, A.inter),
    reglasFuera: fuera(A.reglas, B.reglas), reglasNuevas: fuera(B.reglas, A.reglas),
    cuidadosFuera: A.cuidados.filter((x) => !B.cuidados.some((y) => y.id === x.id)),
    plan, pulso: [A.pulso, B.pulso], franja: [A.franja, B.franja],
  };
  D.igual = !D.interFuera.length && !D.interNuevas.length && !D.reglasFuera.length && !D.reglasNuevas.length && !plan.length && D.horas[0] === D.horas[1] && D.alerta[0] === D.alerta[1] && D.precaucion[0] === D.precaucion[1];
  return D;
}

export const TXT = {
  es: { titulo: "¿Qué cambia si…?", aviso: "Es una simulación para preparar la conversación con su médico: no deje ni cambie ninguna medicación por su cuenta.", quitaria: "¿Qué medicamentos quitaría?", sin: "Sin él", vacio: "Marque uno o varios medicamentos para ver qué cambiaría en sus avisos, sus interacciones y su plan de ejercicio.", probar: "Probar sin {x}", probar_x: "Es el que más avisos e interacciones suma.", tomas: "Tomas al día", alerta: "Avisos de atención", precaucion: "Precauciones", inter: "Interacciones", mayores: "{n} mayores", mayores1: "1 mayor", mayores_d: "mayores: {a} → {b}", horas: "Horas a evitar para entrenar", antes: "antes {n}", vigilar: "Ya no haría falta vigilar", pulso_si: "El pulso volvería a servir para medir la intensidad (zonas de frecuencia cardiaca).", franja_ya: "Podría entrenar a cualquier hora: ya no habría horas que evitar por la medicación.", franja: "Mejor hora para entrenar: {a} → {b}", inter_fuera: "Interacciones que desaparecerían", plan: "Su plan de ejercicio cambiaría", reglas_fuera: "Avisos que desaparecerían", y_mas: "y {n} más", igual: "Sus avisos, sus interacciones y su plan de ejercicio serían los mismos.", gradual: "No se deja de golpe: si su médico decide retirarlo, lo hará poco a poco.", imprescindible: "Imprescindible: no lo deje nunca sin una indicación expresa de su médico.", imp_c: "Imprescindible", grad_c: "No se deja de golpe", copiar: "Copiar el resumen", copiado: "Resumen copiado", reiniciar: "Volver a empezar", sim: "Simulación", quitando: "Sin: {x}", nota: "Simulación orientativa con las reglas de la aplicación: no sustituye la valoración médica.", p_aer_frec: "Aeróbico · frecuencia", p_aer_int: "Aeróbico · intensidad", p_aer_tiempo: "Aeróbico · tiempo", p_aer_tipo: "Aeróbico · cómo", p_fue_frec: "Fuerza · frecuencia", p_fue_int: "Fuerza · intensidad", p_fue_tiempo: "Fuerza · tiempo", p_fue_tipo: "Fuerza · cómo", p_eq_frec: "Equilibrio · frecuencia", p_eq_int: "Equilibrio · intensidad", p_eq_tiempo: "Equilibrio · tiempo", p_eq_tipo: "Equilibrio · cómo", alerta_n: "atención", precaucion_n: "precaución", mayor_n: "mayor", moderada_n: "moderada", menor_n: "menor" },
  en: { titulo: "What changes if…?", aviso: "This is a simulation to prepare the conversation with your doctor: do not stop or change any medication on your own.", quitaria: "Which medicines would you remove?", sin: "Without it", vacio: "Tick one or more medicines to see what would change in your warnings, your interactions and your exercise plan.", probar: "Try without {x}", probar_x: "It adds the most warnings and interactions.", tomas: "Doses a day", alerta: "Attention warnings", precaucion: "Cautions", inter: "Interactions", mayores: "{n} major", mayores1: "1 major", mayores_d: "major: {a} → {b}", horas: "Hours to avoid training", antes: "before {n}", vigilar: "No longer needed to watch", pulso_si: "Your pulse would be valid again to measure intensity (heart-rate zones).", franja_ya: "You could train at any time: no hours to avoid because of your medication.", franja: "Best time to train: {a} → {b}", inter_fuera: "Interactions that would disappear", plan: "Your exercise plan would change", reglas_fuera: "Warnings that would disappear", y_mas: "and {n} more", igual: "Your warnings, interactions and exercise plan would stay the same.", gradual: "Not to be stopped suddenly: if your doctor decides to withdraw it, it will be done gradually.", imprescindible: "Essential: never stop it without your doctor's express instruction.", imp_c: "Essential", grad_c: "Not to be stopped suddenly", copiar: "Copy the summary", copiado: "Summary copied", reiniciar: "Start again", sim: "Simulation", quitando: "Without: {x}", nota: "An orientative simulation with the app's rules: it does not replace a medical assessment.", p_aer_frec: "Aerobic · frequency", p_aer_int: "Aerobic · intensity", p_aer_tiempo: "Aerobic · time", p_aer_tipo: "Aerobic · how", p_fue_frec: "Strength · frequency", p_fue_int: "Strength · intensity", p_fue_tiempo: "Strength · time", p_fue_tipo: "Strength · how", p_eq_frec: "Balance · frequency", p_eq_int: "Balance · intensity", p_eq_tiempo: "Balance · time", p_eq_tipo: "Balance · how", alerta_n: "attention", precaucion_n: "caution", mayor_n: "major", moderada_n: "moderate", menor_n: "minor" },
  ca: { titulo: "Què canvia si…?", aviso: "És una simulació per preparar la conversa amb el seu metge: no deixi ni canviï cap medicació pel seu compte.", quitaria: "Quins medicaments trauria?", sin: "Sense", vacio: "Marqui un o diversos medicaments per veure què canviaria en els seus avisos, les seves interaccions i el seu pla d'exercici.", probar: "Provar sense {x}", probar_x: "És el que suma més avisos i interaccions.", tomas: "Preses al dia", alerta: "Avisos d'atenció", precaucion: "Precaucions", inter: "Interaccions", mayores: "{n} majors", mayores1: "1 major", mayores_d: "majors: {a} → {b}", horas: "Hores a evitar per entrenar", antes: "abans {n}", vigilar: "Ja no caldria vigilar", pulso_si: "El pols tornaria a servir per mesurar la intensitat (zones de freqüència cardíaca).", franja_ya: "Podria entrenar a qualsevol hora: ja no hi hauria hores a evitar per la medicació.", franja: "Millor hora per entrenar: {a} → {b}", inter_fuera: "Interaccions que desapareixerien", plan: "El seu pla d'exercici canviaria", reglas_fuera: "Avisos que desapareixerien", y_mas: "i {n} més", igual: "Els seus avisos, interaccions i pla d'exercici serien els mateixos.", gradual: "No es deixa de cop: si el seu metge decideix retirar-lo, ho farà a poc a poc.", imprescindible: "Imprescindible: no el deixi mai sense una indicació expressa del seu metge.", imp_c: "Imprescindible", grad_c: "No es deixa de cop", copiar: "Copiar el resum", copiado: "Resum copiat", reiniciar: "Tornar a començar", sim: "Simulació", quitando: "Sense: {x}", nota: "Simulació orientativa amb les regles de l'aplicació: no substitueix la valoració mèdica.", p_aer_frec: "Aeròbic · freqüència", p_aer_int: "Aeròbic · intensitat", p_aer_tiempo: "Aeròbic · temps", p_aer_tipo: "Aeròbic · com", p_fue_frec: "Força · freqüència", p_fue_int: "Força · intensitat", p_fue_tiempo: "Força · temps", p_fue_tipo: "Força · com", p_eq_frec: "Equilibri · freqüència", p_eq_int: "Equilibri · intensitat", p_eq_tiempo: "Equilibri · temps", p_eq_tipo: "Equilibri · com", alerta_n: "atenció", precaucion_n: "precaució", mayor_n: "major", moderada_n: "moderada", menor_n: "menor" },
  gl: { titulo: "Que cambia se…?", aviso: "É unha simulación para preparar a conversa co seu médico: non deixe nin cambie ningunha medicación pola súa conta.", quitaria: "Que medicamentos quitaría?", sin: "Sen el", vacio: "Marque un ou varios medicamentos para ver que cambiaría nos seus avisos, as súas interaccións e o seu plan de exercicio.", probar: "Probar sen {x}", probar_x: "É o que máis avisos e interaccións suma.", tomas: "Tomas ao día", alerta: "Avisos de atención", precaucion: "Precaucións", inter: "Interaccións", mayores: "{n} maiores", mayores1: "1 maior", mayores_d: "maiores: {a} → {b}", horas: "Horas a evitar para adestrar", antes: "antes {n}", vigilar: "Xa non faría falta vixiar", pulso_si: "O pulso volvería servir para medir a intensidade (zonas de frecuencia cardíaca).", franja_ya: "Podería adestrar a calquera hora: xa non habería horas que evitar pola medicación.", franja: "Mellor hora para adestrar: {a} → {b}", inter_fuera: "Interaccións que desaparecerían", plan: "O seu plan de exercicio cambiaría", reglas_fuera: "Avisos que desaparecerían", y_mas: "e {n} máis", igual: "Os seus avisos, interaccións e plan de exercicio serían os mesmos.", gradual: "Non se deixa de golpe: se o seu médico decide retiralo, farao pouco a pouco.", imprescindible: "Imprescindible: non o deixe nunca sen unha indicación expresa do seu médico.", imp_c: "Imprescindible", grad_c: "Non se deixa de golpe", copiar: "Copiar o resumo", copiado: "Resumo copiado", reiniciar: "Volver empezar", sim: "Simulación", quitando: "Sen: {x}", nota: "Simulación orientativa coas regras da aplicación: non substitúe a valoración médica.", p_aer_frec: "Aeróbico · frecuencia", p_aer_int: "Aeróbico · intensidade", p_aer_tiempo: "Aeróbico · tempo", p_aer_tipo: "Aeróbico · como", p_fue_frec: "Forza · frecuencia", p_fue_int: "Forza · intensidade", p_fue_tiempo: "Forza · tempo", p_fue_tipo: "Forza · como", p_eq_frec: "Equilibrio · frecuencia", p_eq_int: "Equilibrio · intensidade", p_eq_tiempo: "Equilibrio · tempo", p_eq_tipo: "Equilibrio · como", alerta_n: "atención", precaucion_n: "precaución", mayor_n: "maior", moderada_n: "moderada", menor_n: "menor" },
  eu: { titulo: "Zer aldatzen da…?", aviso: "Zure medikuarekin hitz egiteko simulazio bat da: ez utzi eta ez aldatu botikarik zure kabuz.", quitaria: "Zein botika kenduko zenituzke?", sin: "Gabe", vacio: "Markatu botika bat edo gehiago zure abisuetan, elkarreraginetan eta ariketa-planean zer aldatuko litzatekeen ikusteko.", probar: "Probatu {x} gabe", probar_x: "Abisu eta elkarreragin gehien batzen dituena da.", tomas: "Hartualdiak egunean", alerta: "Arreta-abisuak", precaucion: "Kontuz ibiltzekoak", inter: "Elkarreraginak", mayores: "{n} larri", mayores1: "1 larri", mayores_d: "larriak: {a} → {b}", horas: "Entrenatzeko saihesteko orduak", antes: "lehen {n}", vigilar: "Ez litzateke zaindu beharko", pulso_si: "Pultsuak berriro balioko luke intentsitatea neurtzeko (bihotz-maiztasunaren eremuak).", franja_ya: "Edozein ordutan entrenatu ahal izango zenuke: botikengatik ez legoke saihesteko ordurik.", franja: "Entrenatzeko ordurik onena: {a} → {b}", inter_fuera: "Desagertuko liratekeen elkarreraginak", plan: "Zure ariketa-plana aldatuko litzateke", reglas_fuera: "Desagertuko liratekeen abisuak", y_mas: "eta beste {n}", igual: "Zure abisuak, elkarreraginak eta ariketa-plana berdinak izango lirateke.", gradual: "Ez da bat-batean uzten: medikuak kentzea erabakitzen badu, pixkanaka egingo du.", imprescindible: "Ezinbestekoa: ez utzi inoiz zure medikuaren berariazko aginduarik gabe.", imp_c: "Ezinbestekoa", grad_c: "Ez da bat-batean uzten", copiar: "Kopiatu laburpena", copiado: "Laburpena kopiatuta", reiniciar: "Hasi berriro", sim: "Simulazioa", quitando: "Gabe: {x}", nota: "Aplikazioaren arauekin egindako simulazio orientagarria: ez du balorazio medikoa ordezkatzen.", p_aer_frec: "Aerobikoa · maiztasuna", p_aer_int: "Aerobikoa · intentsitatea", p_aer_tiempo: "Aerobikoa · denbora", p_aer_tipo: "Aerobikoa · nola", p_fue_frec: "Indarra · maiztasuna", p_fue_int: "Indarra · intentsitatea", p_fue_tiempo: "Indarra · denbora", p_fue_tipo: "Indarra · nola", p_eq_frec: "Oreka · maiztasuna", p_eq_int: "Oreka · intentsitatea", p_eq_tiempo: "Oreka · denbora", p_eq_tipo: "Oreka · nola", alerta_n: "arreta", precaucion_n: "kontuz", mayor_n: "larria", moderada_n: "ertaina", menor_n: "arina" },
};
export function tx(k, vars) {
  const s = (TXT[idioma()] || TXT.es)[k] ?? TXT.es[k] ?? k;
  return vars ? s.replace(/\{(\w+)\}/g, (m, n) => (vars[n] ?? m)) : s;
}
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const PLAN_K = { "aer.frec": "p_aer_frec", "aer.int": "p_aer_int", "aer.tiempo": "p_aer_tiempo", "aer.tipo": "p_aer_tipo", "fue.frec": "p_fue_frec", "fue.int": "p_fue_int", "fue.tiempo": "p_fue_tiempo", "fue.tipo": "p_fue_tipo", "eq.frec": "p_eq_frec", "eq.int": "p_eq_int", "eq.tiempo": "p_eq_tiempo", "eq.tipo": "p_eq_tipo" };
const NIVEL_K = { alerta: "alerta_n", precaucion: "precaucion_n", mayor: "mayor_n", moderada: "moderada_n", menor: "menor_n" };
const planTxt = (k) => (PLAN_K[k] ? tx(PLAN_K[k]) : k);
const nivelTxt = (n) => (NIVEL_K[n] ? tx(NIVEL_K[n]) : n);

/** El resumen en texto, para copiarlo a la historia clínica o mandarlo. */
export function textoResumen(D, nombres, version = "") {
  const L = [`${tx("titulo")} · ${tx("sim")} (Pauta Activa${version ? " v" + version : ""})`, tx("quitando", { x: nombres.join(", ") })];
  const par = (k, a) => `${tx(k)}: ${a[0]} → ${a[1]}`;
  L.push(`- ${[par("tomas", D.tomas), par("alerta", D.alerta), par("precaucion", D.precaucion), `${par("inter", D.inter)} (${tx("mayores", { n: `${D.mayores[0]} → ${D.mayores[1]}` })})`, par("horas", D.horas)].join("; ")}.`);
  if (D.cuidadosFuera.length) L.push(`- ${tx("vigilar")}: ${D.cuidadosFuera.map((x) => x.txt.toLowerCase()).join(", ")}.`);
  if (!D.pulso[0] && D.pulso[1]) L.push(`- ${tx("pulso_si")}`);
  if (D.interFuera.length) L.push(`- ${tx("inter_fuera")}: ${D.interFuera.map((x) => `${x.txt} (${nivelTxt(x.nivel)})`).join("; ")}.`);
  for (const p of D.plan) L.push(`- ${planTxt(p.k)}: «${p.antes}» → «${p.despues}»`);
  if (D.igual) L.push(`- ${tx("igual")}`);
  L.push(tx("nota"));
  return L.join("\n");
}

const CSS = `
.sim-dlg .sim-aviso { display: flex; gap: 10px; align-items: flex-start; margin: 0 0 14px; padding: 10px 12px; border-radius: var(--r-md); background: var(--precaucion-soft); color: var(--precaucion-ink); font-size: .88rem; font-weight: 600; line-height: 1.4; }
.sim-aviso svg { flex: none; width: 20px; height: 20px; fill: currentColor; margin-top: 1px; }
.sim-dlg h3 { margin: 0 0 8px; font-size: 1rem; }
.sim-meds { list-style: none; margin: 0 0 14px; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 6px; }
.sim-med { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 8px; align-items: center; min-height: 48px; padding: 6px 10px; border: 1.5px solid var(--line); border-radius: var(--r-md); background: var(--surface); cursor: pointer; }
.sim-med > svg { width: 22px; height: 22px; }
.sim-med .sim-nom { line-height: 1.2; font-weight: 600; }
.sim-med .sim-nom small { display: block; margin-top: 2px; font-weight: 600; font-size: .72rem; }
.sim-med small.gradual { color: var(--precaucion-ink); }
.sim-med small.imprescindible { color: var(--alerta-ink); }
.sim-sw { position: relative; width: 44px; height: 26px; }
.sim-sw input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.sim-sw span { position: absolute; inset: 0; border-radius: 999px; background: var(--surface-2); border: 1.5px solid var(--line-strong); pointer-events: none; }
.sim-sw span::after { content: ""; position: absolute; top: 3px; left: 3px; width: 17px; height: 17px; border-radius: 50%; background: var(--muted); transition: transform .2s var(--ease-salida), background .2s; }
.sim-sw input:checked + span { background: var(--alerta-soft); border-color: var(--alerta); }
.sim-sw input:checked + span::after { transform: translateX(18px); background: var(--alerta); }
.sim-sw input:focus-visible + span { outline: 3px solid var(--accent); outline-offset: 2px; }
.sim-med.quitado { border-color: var(--alerta); background: var(--alerta-soft); }
.sim-med.quitado .sim-nom > span { text-decoration: line-through; text-decoration-thickness: 2px; }
.sim-vacio { margin: 0; padding: 14px; border: 1.5px dashed var(--line-strong); border-radius: var(--r-md); color: var(--muted); }
.sim-vacio .btn { margin-top: 10px; }
.sim-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 0 0 14px; padding: 0; list-style: none; }
.sim-tile { display: grid; gap: 2px; align-content: start; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--r-md); background: linear-gradient(160deg, var(--surface), var(--surface-2)); }
.sim-tile small { color: var(--muted); font-size: .76rem; line-height: 1.2; }
.sim-tile b { font: 800 1.6rem/1.1 var(--mono); }
.sim-tile .sim-d { justify-self: start; display: inline-flex; align-items: center; gap: 3px; padding: 1px 8px; border-radius: 999px; font: 700 .76rem var(--mono); background: var(--surface-2); color: var(--muted); }
.sim-tile .sim-d.baja { background: var(--info-soft); color: var(--info-ink); }
.sim-tile .sim-d.sube { background: var(--alerta-soft); color: var(--alerta-ink); }
.sim-tile em { font-style: normal; font-size: .74rem; color: var(--muted); }
.sim-sec { margin: 0 0 14px; }
.sim-sec h4 { margin: 0 0 6px; font-size: .92rem; }
.sim-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.sim-chips li { padding: 4px 10px; border-radius: 999px; background: var(--info-soft); color: var(--info-ink); font-size: .84rem; font-weight: 600; }
.sim-ok { margin: 0 0 12px; padding: 8px 12px; border-left: 4px solid var(--info); border-radius: var(--r-sm); background: var(--info-soft); color: var(--info-ink); font-size: .88rem; font-weight: 600; }
.sim-lista { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.sim-lista li { display: flex; gap: 8px; align-items: baseline; font-size: .86rem; line-height: 1.35; }
.sim-lista li > i { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--muted); transform: translateY(-1px); }
.sim-lista li.n-alerta > i, .sim-lista li.n-mayor > i { background: var(--alerta); }
.sim-lista li.n-precaucion > i, .sim-lista li.n-moderada > i { background: var(--precaucion); }
.sim-lista li.n-menor > i { background: var(--info); }
.sim-lista li span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sim-lista li s { text-decoration-color: var(--muted); }
.sim-plan { display: grid; gap: 6px; margin: 0; }
.sim-plan > div { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; padding: 8px 10px; border-radius: var(--r-sm); background: var(--surface-2); font-size: .84rem; }
.sim-plan dt { font-weight: 700; }
.sim-plan dd { margin: 0; line-height: 1.35; }
.sim-plan dd.antes { color: var(--muted); text-decoration: line-through; }
.sim-plan dd.despues { color: var(--fg); }
.sim-ojo { margin: 0 0 12px; padding: 10px 12px; border-radius: var(--r-md); font-size: .86rem; line-height: 1.4; }
.sim-ojo.gradual { background: var(--precaucion-soft); color: var(--precaucion-ink); }
.sim-ojo.imprescindible { background: var(--alerta-soft); color: var(--alerta-ink); }
.sim-acciones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 6px 0; }
.sim-nota { margin: 8px 0 0; font-size: .78rem; color: var(--muted); text-align: center; }
:root[data-theme="contrast"] .sim-tile { background: var(--surface); }
@media screen and (prefers-reduced-motion: no-preference) {
  html:not(.pa-quieto) .sim-res > * { animation: sim-entra .35s var(--ease-salida) both; }
  html:not(.pa-quieto) .sim-tile b { animation: sim-num .45s var(--ease-salida) both; }
}
@keyframes sim-entra { from { opacity: 0; transform: translateY(6px); } }
@keyframes sim-num { from { opacity: 0; transform: translateY(-6px); } }
`;
const OJO = "M12 2 1 21h22L12 2zm-1 7h2v6h-2V9zm0 8h2v2h-2v-2z";
let dlg = null, ctx = {}, quitados = new Set(), ahora = null, ultimo = null;
const cu = () => dlg.querySelector("#sim-cuerpo");
function crear() {
  if (!document.getElementById("sim-css")) { const st = document.createElement("style"); st.id = "sim-css"; st.textContent = CSS; document.head.append(st); }
  dlg = document.createElement("dialog");
  dlg.id = "simula"; dlg.className = "ficha sim-dlg"; dlg.setAttribute("aria-labelledby", "sim-cab-t");
  dlg.innerHTML = `<div class="ficha-cab"><p id="sim-cab-t"></p><button type="button" class="btn-sec sm" id="sim-cerrar"></button></div><div class="ficha-cuerpo" id="sim-cuerpo"></div>`;
  document.body.append(dlg);
  if (typeof dlg.showModal !== "function") { dlg.showModal = () => dlg.setAttribute("open", ""); dlg.close = () => dlg.removeAttribute("open"); }
  dlg.querySelector("#sim-cerrar").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  const cuerpo = dlg.querySelector("#sim-cuerpo");
  cuerpo.addEventListener("change", (ev) => {
    const inp = ev.target.closest("[data-sim]"); if (!inp) return;
    inp.checked ? quitados.add(inp.dataset.sim) : quitados.delete(inp.dataset.sim);
    inp.closest(".sim-med").classList.toggle("quitado", inp.checked);
    resultado();
  });
  cuerpo.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-sim-probar], [data-sim-reiniciar], [data-sim-copiar]"); if (!b) return;
    if (b.dataset.simCopiar != null) {
      if (!ultimo) return;
      const txt = textoResumen(ultimo.D, ultimo.nombres, ctx.version);
      try { await navigator.clipboard.writeText(txt); ctx.toast?.(tx("copiado"), { ms: 2500 }); } catch { ctx.toast?.(txt.slice(0, 120) + "…", { ms: 6000 }); }
      return;
    }
    const p = b.dataset.simProbar;
    if (p) quitados.add(p); else quitados.clear();
    pintar(); cu().querySelector(p ? `[data-sim="${p}"]` : "[data-sim]")?.focus();
  });
}
const tile = (k, a, extra = "") => {
  const d = a[1] - a[0], cl = d < 0 ? "baja" : d > 0 ? "sube" : "";
  return `<li class="sim-tile"><small>${tx(k)}</small><b>${a[1]}</b><span class="sim-d ${cl}">${d === 0 ? "=" : (d > 0 ? "+" : "−") + Math.abs(d)}</span><em>${tx("antes", { n: a[0] })}${extra}</em></li>`;
};
function resultado() {
  const caja = cu().querySelector(".sim-res");
  if (!quitados.size) {
    ultimo = null; vivo("");
    const s = ctx.sugerido && ctx.meds.find((m) => m.pid === ctx.sugerido);
    caja.innerHTML = `<p class="sim-vacio">${tx("vacio")}${s ? `<br><button type="button" class="btn" data-sim-probar="${esc(s.pid)}">${esc(tx("probar", { x: s.nombre }))}</button><br><small>${tx("probar_x")}</small>` : ""}</p>`;
    return;
  }
  const B = ctx.calc(quitados), D = comparar(ahora, B), quit = ctx.meds.filter((m) => quitados.has(m.pid));
  const ojos = quit.filter((m) => retirada(m.clase)).sort((a, b) => (retirada(a.clase) === "imprescindible" ? -1 : 1) - (retirada(b.clase) === "imprescindible" ? -1 : 1));
  const M = 6;
  caja.innerHTML = `${ojos.map((m) => `<p class="sim-ojo ${retirada(m.clase)}"><b>${esc(m.nombre)}</b>: ${tx(retirada(m.clase))}</p>`).join("")}
    <ul class="sim-tiles">${tile("tomas", D.tomas)}${tile("alerta", D.alerta)}${tile("precaucion", D.precaucion)}${tile("inter", D.inter, D.mayores[0] || D.mayores[1] ? ` · ${tx("mayores_d", { a: D.mayores[0], b: D.mayores[1] })}` : "")}${tile("horas", D.horas)}</ul>
    ${D.igual ? `<p class="sim-ok">${tx("igual")}</p>` : ""}
    ${!D.pulso[0] && D.pulso[1] ? `<p class="sim-ok">${tx("pulso_si")}</p>` : ""}
    ${D.franja[0] && !D.franja[1] && D.horas[1] === 0 ? `<p class="sim-ok">${tx("franja_ya")}</p>` : D.franja[0] !== D.franja[1] && D.franja[0] && D.franja[1] ? `<p class="sim-ok">${tx("franja", { a: D.franja[0], b: D.franja[1] })}</p>` : ""}
    ${D.cuidadosFuera.length ? `<section class="sim-sec"><h4>${tx("vigilar")}</h4><ul class="sim-chips">${D.cuidadosFuera.map((x) => `<li>${esc(x.txt)}</li>`).join("")}</ul></section>` : ""}
    ${D.interFuera.length ? `<section class="sim-sec"><h4>${tx("inter_fuera")} (${D.interFuera.length})</h4><ul class="sim-lista">${D.interFuera.slice(0, M).map((x) => `<li class="n-${x.nivel}"><i aria-hidden="true"></i><span><b>${esc(x.txt)}</b> · ${nivelTxt(x.nivel)}</span></li>`).join("")}${D.interFuera.length > M ? `<li><span>${tx("y_mas", { n: D.interFuera.length - M })}</span></li>` : ""}</ul></section>` : ""}
    ${D.plan.length ? `<section class="sim-sec"><h4>${tx("plan")}</h4><dl class="sim-plan">${D.plan.map((p) => `<div><dt>${planTxt(p.k)}</dt><dd class="antes">${esc(p.antes)}</dd><dd class="despues">${esc(p.despues)}</dd></div>`).join("")}</dl></section>` : ""}
    ${D.reglasFuera.length ? `<section class="sim-sec"><h4>${tx("reglas_fuera")} (${D.reglasFuera.length})</h4><ul class="sim-lista">${D.reglasFuera.slice(0, M).map((x) => `<li class="n-${x.nivel}"><i aria-hidden="true"></i><span>${x.farmaco ? `<b>${esc(x.farmaco)}</b> · ` : ""}${esc(x.txt)}</span></li>`).join("")}${D.reglasFuera.length > M ? `<li><span>${tx("y_mas", { n: D.reglasFuera.length - M })}</span></li>` : ""}</ul></section>` : ""}
    <div class="sim-acciones"><button type="button" class="btn" data-sim-copiar="">${tx("copiar")}</button><button type="button" class="btn-sec sm" data-sim-reiniciar="">${tx("reiniciar")}</button></div>`;
  ultimo = { D, nombres: quit.map((m) => m.nombre) };
  vivo(`${tx("alerta")}: ${D.alerta[0]} → ${D.alerta[1]}. ${tx("inter")}: ${D.inter[0]} → ${D.inter[1]}.`);
}
const vivo = (s) => { const v = cu().querySelector("#sim-vivo"); if (v) v.textContent = s; };
function pintar() {
  cu().innerHTML = `<p class="sim-aviso"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${OJO}"/></svg><span>${tx("aviso")}</span></p>
    <h3 id="sim-q">${tx("quitaria")}</h3>
    <ul class="sim-meds" aria-labelledby="sim-q">${ctx.meds.map((m) => { const r = retirada(m.clase); return `<li><label class="sim-med${quitados.has(m.pid) ? " quitado" : ""}">${m.ic || ""}<span class="sim-nom"><span>${esc(m.nombre)}</span>${r ? `<small class="${r}">${tx(r === "imprescindible" ? "imp_c" : "grad_c")}</small>` : ""}</span><span class="sim-sw"><input type="checkbox" data-sim="${esc(m.pid)}"${quitados.has(m.pid) ? " checked" : ""} aria-label="${esc(`${tx("sin")}: ${m.nombre}`)}"><span></span></span></label></li>`; }).join("")}</ul>
    <div class="sim-res"></div><p class="sr-only" id="sim-vivo" aria-live="polite"></p>
    <p class="sim-nota">${tx("nota")}</p>`;
  resultado();
}
/** Abre el simulador. c: { meds: [{ pid, nombre, clase, ic }], lista (medicación activa), motor (ver «escenario»), quitar: [pid], sugerido, version, toast }. */
export function abrir(c = {}) {
  if (!dlg) crear();
  ctx = c; quitados = new Set((c.quitar || []).filter((p) => c.meds.some((m) => m.pid === p)));
  ctx.calc = c.calc || ((q) => escenario(c.motor, (c.lista || []).filter((m) => !q.has(m.pid))));
  ahora = ctx.calc(new Set());
  dlg.querySelector("#sim-cab-t").textContent = tx("titulo");
  dlg.querySelector("#sim-cerrar").textContent = t("ficha.cerrar");
  pintar();
  if (!dlg.open) dlg.showModal();
  cu().scrollTop = 0;
}
