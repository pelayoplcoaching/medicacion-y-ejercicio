/* Estadísticas y exportación de la consulta (v1.0; modo profesional): resumen de los pacientes guardados en este
   dispositivo, CSV anonimizado y texto para copiar. Sale de app.js en la v1.2.13 para no cargarlo al abrir: se carga al
   pulsar «Estadísticas». app.js le pasa los datos y las funciones del motor (d). */
import { t } from "./i18n.js?v=202611231104";
import { tL } from "./tr.js?v=202611231104";

/** d: { perfiles, evaluar(e) → { ctx, res, crib }, sit(c), senales, crib(k) }. */
export function estadisticas(d) {
  const filas = [];
  for (const pf of d.perfiles) {
    try {
      const e = pf.estado, { ctx, res, crib } = d.evaluar(e);
      let reevalVencida = false; if (e.prescrito?.fecha) { const f = new Date(e.prescrito.fecha); f.setDate(f.getDate() + (e.prescrito.semanas || 6) * 7); reevalVencida = f < new Date(); }
      filas.push({ pf, e, ctx, res, crib, reevalVencida });
    } catch {}
  }
  const cuenta = (xs) => { const m = new Map(); for (const x of xs) if (x) m.set(x, (m.get(x) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const edades = filas.map((f) => f.e.edad).filter((x) => x != null);
  const media = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  return {
    n: filas.length, filas,
    edadMedia: media(edades), edadMin: edades.length ? Math.min(...edades) : null, edadMax: edades.length ? Math.max(...edades) : null, mayores: filas.filter((f) => f.e.edad >= 65).length, caidas: filas.filter((f) => f.e.caidas).length,
    farmacosMedia: media(filas.map((f) => f.res.items.length)), alertasMedia: media(filas.map((f) => f.res.resumen.alerta)), precMedia: media(filas.map((f) => f.res.resumen.precaucion)),
    conMayor: filas.filter((f) => f.res.interacciones.some((x) => x.nivel === "mayor")).length,
    situaciones: cuenta(filas.flatMap((f) => [...f.ctx.condiciones].map((c) => d.sit(c)))),
    grupos: cuenta(filas.flatMap((f) => [...new Set(f.res.items.map((it) => it.clase.nombre))])),
    principios: cuenta(filas.flatMap((f) => f.res.items.map((it) => it.principio.nombre))),
    senales: cuenta(filas.flatMap((f) => Object.keys(f.res.perfil).filter((k) => d.senales[k] && f.res.perfil[k].length).map((k) => d.senales[k]))),
    ddi: cuenta(filas.flatMap((f) => f.res.interacciones.filter((x) => x.nivel !== "menor").map((x) => `${[x.a.principio.nombre, x.b.principio.nombre].sort().join(" + ")} (${x.nivel})`))),
    combinadas: cuenta(filas.flatMap((f) => f.res.combinadas.filter((c) => c.regla.nivel !== "info").map((c) => c.regla.titulo))),
    cribado: cuenta(filas.map((f) => (f.crib?.clave && f.crib.clave !== "sin_datos" ? d.crib(f.crib.clave) : null))),
    prescritos: filas.filter((f) => f.e.prescrito).length, vencidas: filas.filter((f) => f.reevalVencida).length,
    sppbMedia: media(filas.map((f) => f.e.sppb?.total ?? (f.e.pro?.sppb != null && f.e.pro.sppb !== "" ? Number(f.e.pro.sppb) : null)).filter((x) => x != null)),
  };
}
export function csvConsulta(st) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cab = ["id", "codigo", "fecha_guardado", "edad", "caidas", "situaciones", "n_farmacos", "principios", "atencion", "precaucion", "ddi_mayores", "ddi_moderadas", "cribado", "sppb", "fc_reposo", "prescrito", "reevaluacion", "reeval_vencida"];
  const filas = st.filas.map(({ pf, e, ctx, res, crib, reevalVencida }) => {
    const f1 = e.prescrito?.fecha ? (() => { const d = new Date(e.prescrito.fecha); d.setDate(d.getDate() + (e.prescrito.semanas || 6) * 7); return d.toISOString().slice(0, 10); })() : "";
    return [pf.id, pf.nombre, new Date(pf.fecha).toISOString().slice(0, 10), e.edad ?? "", e.caidas ? 1 : 0, [...ctx.condiciones].join(";"), res.items.length, res.items.map((it) => it.principio.id).join(";"), res.resumen.alerta, res.resumen.precaucion, res.interacciones.filter((x) => x.nivel === "mayor").length, res.interacciones.filter((x) => x.nivel === "moderada").length, crib?.clave || "", e.sppb?.total ?? e.pro?.sppb ?? "", e.fcReposo ?? "", e.prescrito?.fecha ? new Date(e.prescrito.fecha).toISOString().slice(0, 10) : "", f1, reevalVencida ? 1 : 0].map(esc).join(";");
  });
  return "﻿" + [cab.join(";"), ...filas].join("\r\n");
}
export function resumenConsulta(st, version, kbVersion) {
  const top = (xs, k = 5) => xs.slice(0, k).map(([a, n]) => `${a} (${n})`).join(", ") || "—";
  return [tL`PAUTA ACTIVA · RESUMEN DE LA CONSULTA · ${new Date().toLocaleDateString(tL("es-ES"))} · v${version} · base ${kbVersion}`,
    tL`Pacientes guardados: ${st.n}${st.edadMedia != null ? tL` · edad media ${st.edadMedia} años (${st.edadMin}–${st.edadMax}); ≥ 65 años: ${st.mayores}` : ""} · con caídas en el último año: ${st.caidas}.`,
    tL`Medicación: ${st.farmacosMedia ?? "—"} fármacos por paciente. Avisos: ${st.alertasMedia ?? "—"} de atención y ${st.precMedia ?? "—"} de precaución por paciente; ${st.conMayor} paciente(s) con alguna interacción mayor.`,
    tL`Situaciones clínicas: ${top(st.situaciones)}.`, tL`Grupos más frecuentes: ${top(st.grupos)}.`, tL`Principios activos más frecuentes: ${top(st.principios, 8)}.`,
    tL`Efectos a vigilar más frecuentes: ${top(st.senales)}.`, tL`Interacciones más frecuentes: ${top(st.ddi)}.`, tL`Avisos por combinación o situación: ${top(st.combinadas)}.`,
    tL`Cribado ACSM: ${top(st.cribado)}.${st.sppbMedia != null ? tL` SPPB medio ${st.sppbMedia}/12.` : ""}`,
    tL`Prescripciones de ejercicio: ${st.prescritos} activas, ${st.vencidas} con reevaluación vencida.`,
    tL("Datos calculados en el dispositivo a partir de listas anonimizadas; sin nombres ni números de historia.")].join("\n");
}
/** Rellena y abre el diálogo #estadisticas. d: lo de «estadisticas» más { version, kbVersion, descargar(nombre, texto, tipo), toast, hoy }. */
export function abrir(d) {
  const st = estadisticas(d), dlg = document.getElementById("estadisticas"), c = document.getElementById("estadisticas-cuerpo");
  const lista = (titulo, xs, k = 6) => (xs.length ? `<div class="stats-bloque"><h4>${titulo}</h4><ol class="stats-lista">${xs.slice(0, k).map(([a, n]) => `<li><span title="${a}">${a}</span><b>${n}</b><i style="width:${Math.round((n / xs[0][1]) * 100)}%"></i></li>`).join("")}</ol></div>` : "");
  c.innerHTML = !st.n ? `<p class="banner">${t("stats.vacio")}</p>` : `
    <div class="evo-tiles">
      <div class="tile tile-ddi"><span class="num">${st.n}</span><span>${t("stats.pacientes")}</span></div>
      <div class="tile tile-ddi"><span class="num">${st.edadMedia ?? "—"}</span><span>${t("stats.edad")}</span></div>
      <div class="tile tile-ddi"><span class="num">${st.farmacosMedia ?? "—"}</span><span>${t("stats.farmacos")}</span></div>
      <div class="tile tile-${st.alertasMedia >= 2 ? "alerta" : "precaucion"}"><span class="num">${st.alertasMedia ?? "—"}</span><span>${t("stats.alertas")}</span></div>
    </div>
    <p class="muted">${t("stats.mayores")}: <b>${st.conMayor}</b> · ${t("stats.presc", { n: st.prescritos, v: st.vencidas })}${st.sppbMedia != null ? tL` · SPPB ${st.sppbMedia}/12` : ""}</p>
    <div class="stats-cols">${lista(t("stats.sit"), st.situaciones)}${lista(t("stats.grupos"), st.grupos)}${lista(t("stats.principios"), st.principios, 8)}${lista(t("stats.senales"), st.senales)}${lista(t("stats.ddi"), st.ddi)}${lista(t("stats.comb"), st.combinadas)}${lista(t("stats.crib"), st.cribado, 5)}</div>
    <div class="acciones"><button type="button" class="btn-sec sm" id="stats-csv">${t("stats.csv")}</button><button type="button" class="btn-sec sm" id="stats-resumen">${t("stats.resumen")}</button></div>
    <p class="muted"><small>${t("stats.nota")}</small></p>`;
  document.getElementById("stats-csv")?.addEventListener("click", () => d.descargar(`consulta-pauta-activa-${d.hoy}.csv`, csvConsulta(st), "text/csv"));
  document.getElementById("stats-resumen")?.addEventListener("click", async () => { const txt = resumenConsulta(st, d.version, d.kbVersion); try { await navigator.clipboard.writeText(txt); d.toast(t("stats.copiado"), { ms: 3000 }); } catch { d.descargar(`consulta-resumen-${d.hoy}.txt`, txt, "text/plain"); } });
  dlg.showModal();
}
