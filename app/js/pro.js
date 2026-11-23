/* Herramientas del modo profesional que salen de app.js en la v1.3.0 (segunda tanda de mejoras grandes, 1):
   informe de evolución para la reevaluación y casos (exportar, importar, lista en CSV y caso de prueba).
   Se cargan al pulsar su botón; app.js les pasa en «a» el estado ya evaluado y lo que toca la aplicación. */
import { t, idioma } from "./i18n.js?v=202611231042";
import { SINTOMAS, textoEvolucion, cribadoACSM, comprobarCaso, momentosPorDefecto } from "./engine.js?v=202611231042";
import { APP_VERSION } from "./version.js?v=202611231042";
import { tL } from "./tr.js?v=202611231042";

const $ = (s) => document.querySelector(s);
let preparado = false;

/* ---------- informe de evolución para la reevaluación ---------- */
export function abrirEvolucion(a) {
  const evo = a.evo; if (!evo) return;
  if (!preparado) { preparado = true; $("#evolucion-cerrar")?.addEventListener("click", () => $("#evolucion").close()); }
  const dlg = $("#evolucion"); const f = (iso) => new Date(iso + "T12:00").toLocaleDateString(idioma());
  const nombres = a.nombres; const nom = (m) => nombres[m.pid] || m.pid;
  const c = evo.comp; const flecha = (d) => (d == null ? "" : d > 0 ? ` <b class="delta up">+${d}</b>` : d < 0 ? ` <b class="delta down">${d}</b>` : ' <b class="delta">=</b>');
  const medsTxt = c.medicacion ? ([c.medicacion.nuevos.length ? `${t("evo.nuevos")}: ${c.medicacion.nuevos.map(nom).join(", ")}` : "", c.medicacion.retirados.length ? `${t("evo.retirados")}: ${c.medicacion.retirados.map(nom).join(", ")}` : "", c.medicacion.cambios.length ? `${t("evo.dosis")}: ${c.medicacion.cambios.map(nom).join(", ")}` : ""].filter(Boolean).join(" · ") || t("evo.sin_cambios")) : "—";
  const maxMin = Math.max(1, ...evo.porSemana.map((w) => w.min));
  const sint = Object.entries(evo.sintomas).map(([k, n]) => `${SINTOMAS.find((x) => x.id === k)?.nombre || k} (${n})`).join(", ");
  $("#evolucion-cuerpo").innerHTML = `
    <p class="muted">${t("evo.periodo", { a: f(evo.desde), b: f(evo.hasta), s: evo.semanas, r: f(evo.prevista) })}</p>
    ${evo.sesiones ? "" : `<p class="banner">${t("evo.sin_registros")}</p>`}
    <div class="evo-tiles">
      <div class="tile tile-${evo.valoracion === "buena" ? "info" : evo.valoracion === "parcial" ? "precaucion" : evo.valoracion === "baja" ? "alerta" : "ddi"}"><span class="num">${evo.adherencia != null ? evo.adherencia + " %" : "—"}</span><span>${t("evo.adherencia")}</span></div>
      <div class="tile tile-ddi"><span class="num">${evo.sesiones}</span><span>${t("evo.sesiones")} <small>${t("evo.de_previstas", { n: evo.previstas })}</small></span></div>
      <div class="tile tile-ddi"><span class="num">${evo.minutosSemana}</span><span>${t("evo.min_semana")}</span></div>
      <div class="tile tile-ddi"><span class="num">${evo.rpeMedio ?? "—"}</span><span>${t("evo.rpe")}</span></div>
    </div>
    <p class="evo-val nivel-${evo.valoracion === "buena" ? "info" : evo.valoracion === "parcial" ? "precaucion" : "alerta"}">${t("evo.val." + evo.valoracion)}</p>
    <h4>${t("evo.semanas")}</h4>
    <div class="evo-barras" role="img" aria-label="${t("evo.semanas")}: ${evo.porSemana.map((w) => w.min).join(", ")}">${evo.porSemana.map((w) => `<div class="evo-barra" title="${f(w.desde)}: ${w.min} min"><span style="height:${Math.round((w.min / maxMin) * 100)}%"></span><small>${w.min}</small></div>`).join("")}</div>
    <h4>${t("evo.comparativa")}</h4>
    <table class="tabla-plan evo-tabla"><thead><tr><th></th><th scope="col">${t("evo.antes")}</th><th scope="col">${t("evo.ahora")}</th></tr></thead><tbody>
      <tr><th scope="row">${t("evo.sppb")}</th><td>${c.sppb.antes ?? "—"}</td><td>${c.sppb.ahora ?? "—"}${flecha(c.sppb.delta)}</td></tr>
      <tr><th scope="row">${t("evo.fc")}</th><td>${c.fcReposo.antes ?? "—"}</td><td>${c.fcReposo.ahora ?? "—"}${flecha(c.fcReposo.delta)}</td></tr>
      <tr><th scope="row">${t("evo.meds")}</th><td colspan="2">${medsTxt}</td></tr>
    </tbody></table>
    ${evo.conBase ? "" : `<p class="muted"><small>${t("evo.sin_base")}</small></p>`}
    <p><b>${t("evo.sintomas")}:</b> ${sint || t("evo.ninguno")}.${evo.constantes.glucosa ? ` ${t("evo.glucosa", { n: evo.constantes.glucosa.n, m: evo.constantes.glucosa.media, h: evo.constantes.glucosa.hipos })}.` : ""}</p>
    <div class="acciones"><button type="button" class="btn-sec sm" id="evo-copiar">${t("evo.copiar")}</button><button type="button" class="btn-sec sm" id="evo-pdf">${t("evo.pdf")}</button><button type="button" class="btn sm" id="evo-renovar">${t("evo.renovar")}</button></div>`;
  $("#evo-copiar").addEventListener("click", async () => { const txt = textoEvolucion(evo, { nombres }); try { await navigator.clipboard.writeText(txt); a.toast(t("evo.copiado"), { ms: 3000 }); } catch { a.descargarTexto(`evolucion-${evo.hasta}.txt`, txt, "text/plain"); } });
  $("#evo-pdf").addEventListener("click", () => a.pdfEvolucion(evo, nombres));
  $("#evo-renovar").addEventListener("click", () => { a.renovar(evo); dlg.close(); });
  dlg.showModal();
}

/* ---------- casos: exportar / importar (JSON anonimizado con huella), lista en CSV, caso de prueba ---------- */
async function huella(txt) { try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 16); } catch { return "sin-huella"; } }

export async function exportarCaso(a) {
  const caso = a.caso; const cuerpo = JSON.stringify(caso);
  const doc = { app: "pauta-activa", formato: 1, version_app: APP_VERSION, version_base: a.kbVersion, fecha: new Date().toISOString().slice(0, 10), huella: await huella(cuerpo + a.kbVersion), caso };
  a.descargarTexto(`caso-${doc.fecha}-${doc.huella.slice(0, 6)}.json`, JSON.stringify(doc, null, 1), "application/json");
  a.toast(t("caso.exportado"), { ms: 4000 });
}

/** Lee un caso exportado, comprueba su huella y deja los medicamentos listos; aplicarlo al estado es cosa de app.js (a.aplicarCaso). */
export async function importarCaso(f, a) {
  try {
    const d = JSON.parse(await f.text());
    const c = d.caso || d; if (!Array.isArray(c.meds)) throw new Error("formato");
    const integra = d.huella ? (await huella(JSON.stringify(c) + d.version_base)) === d.huella : null;
    const meds = c.meds.map((m) => (m.libre ? { pid: "libre:" + String(m.nombre).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_"), nombre: m.nombre, libre: true, dosis: m.dosis ?? null, tomas: m.tomas || 1, unidad: "mg", momentos: momentosPorDefecto(m.tomas || 1) } : m));
    a.aplicarCaso(c, meds);
    a.toast(integra === false ? t("caso.importado_alterado") : t("caso.importado", { v: d.version_base || "?" }), { ms: 6000 });
  } catch { a.toast(t("caso.error"), { ms: 5000 }); }
}

export function listaCsv(a) {
  const filas = [["principio_activo", "grupo", "dosis_por_toma", "unidad", "tomas_dia", "dosis_diaria", "categoria_dosis", "momentos", "a_demanda", "en_pausa", "senales"]];
  let k = 0;
  for (const m of a.meds) {
    if (m.libre) { filas.push([m.nombre, tL("(sin información)"), m.dosis ?? "", "mg", m.tomas || 1, "", "", "", "", "", ""]); continue; }
    const it = a.res.items[k++]; if (!it) continue;
    filas.push([it.principio.nombre, it.clase.nombre, it.dosisPorToma ?? "", it.unidad, it.tomas, it.dosisTotal ?? "", it.dosisCat, (m.momentos || []).join("|"), it.aDemanda ? "sí" : "no", m.pausado ? "sí" : "no", [...it.senales].join("|")]);
  }
  const csv = "﻿" + filas.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  a.descargarTexto(`medicacion-${a.hoy}.csv`, csv, "text/csv;charset=utf-8");
  a.toast(t("caso.csv_ok"), { ms: 3000 });
}

/** Caso de prueba para scripts/test.mjs a partir de la lista actual (a.meds son los activos; a.cribado, si está respondido). */
export function casoPrueba(a) {
  const { ctx, res } = a;
  const senales = [...new Set(res.items.flatMap((it) => [...it.senales]))].filter((s) => !/^(ieca_ara|diuretico|aine|estatina|fibrato|corticoide)$/.test(s));
  const caso = { id: "c" + Date.now().toString(36), titulo: prompt(t("caso.titulo_prompt"), "") || tL("Caso sin título"), descripcion: `${ctx.edad ? ctx.edad + tL(" años, ") : ""}${res.items.map((i) => i.principio.nombre).join(" + ")}`,
    meds: a.meds.map((m) => ({ pid: m.pid, dosis: m.dosis, tomas: m.tomas, ...(m.unidad ? { unidad: m.unidad } : {}), ...(m.aDemanda ? { aDemanda: true } : {}) })),
    ctx: { edad: ctx.edad, caidas: ctx.caidas, condiciones: [...ctx.condiciones], ...(ctx.fg != null ? { fg: ctx.fg } : {}), ...(ctx.fevi != null ? { fevi: ctx.fevi } : {}), ...(ctx.nyha != null ? { nyha: ctx.nyha } : {}) },
    ...(a.cribado ? { cribado: a.cribado } : {}),
    esperado: { alerta_min: res.resumen.alerta, precaucion_min: res.resumen.precaucion, mayores_min: res.interacciones.filter((x) => x.nivel === "mayor").length, senales, combinadas_incluye: res.combinadas.map((c) => c.regla.titulo.toLowerCase()).slice(0, 4), ...(a.cribado ? { cribado: cribadoACSM(a.cribado).clave } : {}) } };
  const r = comprobarCaso(a.datos, caso);
  a.descargarTexto(`caso-prueba-${caso.id}.json`, JSON.stringify(caso, null, 1), "application/json");
  a.toast(r.ok ? t("caso.prueba_ok") : t("caso.prueba_fallo", { f: r.fallos.join("; ") }), { ms: 6000 });
}
