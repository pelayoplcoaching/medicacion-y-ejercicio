// Contenido clínico en inglés (segunda tanda, 20): pone el motor y los informes a trabajar con el traductor instalado, como hace la
// aplicación con la interfaz en inglés, y devuelve por la salida un JSON con lo que las pruebas comprueban.
// Va en un proceso aparte porque instalar el traductor cambia en sitio las tablas del código (js/tr.js) y el proceso de
// scripts/test.mjs tiene que seguir en español. Uso: node scripts/contenido_prueba.mjs
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { url, modulos } from "./contenido_modulos.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const kb = json("app/data/kb.json"), ddi = json("app/data/ddi_curated.json"), D = json("app/data/en/contenido.json");
const out = { errores: [] };
try {
  const CO = await import(url("contenido")), TR = await import(url("tr"));
  const T = CO.traducir(kb, ddi, D);
  TR.instalarTraductor({ tr: T.tr, trObj: (o, todo) => T.trObj(o, false, todo) });
  // todos los módulos se cargan con el traductor ya puesto: ninguno debe fallar al traducirse sus tablas
  const M = {}; for (const m of modulos()) { try { M[m] = await import(url(m)); } catch (e) { out.errores.push(`${m}: ${e.message}`); } }
  const { construirIndice, evaluar, sesionTipo, loEsencial, ventanaEntrenamiento, ALARMA, SINTOMAS_ACSM, unidadPorDia, nivelEvidencia } = M.engine;
  const indice = construirIndice(kb, []), datos = { kb, ddiCurado: ddi, ddi: { pares: [] }, indice };
  const lista = [["bisoprolol", 5], ["enalapril", 20], ["metformina", 1700], ["acenocumarol", 4], ["atorvastatina", 40], ["lorazepam", 1], ["furosemida", 40]].map(([pid, dosis]) => ({ pid, dosis, tomas: 1 }));
  const ctx = { edad: 72, caidas: true, condiciones: new Set(["hipertension", "diabetes", "osteoporosis"]) };
  const res = evaluar(datos, lista, ctx);
  ctx.ventana = ventanaEntrenamiento(indice, lista);
  const P = M.informes.prescripcion(res, ctx);
  out.ambitos = Object.keys(res.ambitos);
  out.reglasPorAmbito = Object.values(res.ambitos).map((l) => l.reduce((n, g) => n + g.reglas.length, 0));
  out.niveles = [...new Set(Object.values(res.ambitos).flatMap((l) => l.flatMap((g) => g.reglas.map((r) => r.nivel))))].sort();
  out.evidencias = [...new Set(Object.values(res.ambitos).flatMap((l) => l.flatMap((g) => g.reglas.map((r) => nivelEvidencia(r)))))].sort();
  out.interacciones = res.interacciones.map((x) => [x.a.principio.id, x.b.principio.id, x.nivel, x.efecto].join(" | "));
  out.combinadas = res.combinadas.map((x) => x.regla.id);
  out.senales = Object.keys(res.perfil).sort();
  out.P = { aer: P.aer, fue: P.fue, eq: P.eq };
  out.AMBITOS = M.informes.AMBITOS;
  out.cribado = M.informes.CRIBADO_PDF.empezar;
  out.esencial = loEsencial(res, 3).map((x) => x.titulo || x.texto || String(x));
  out.sesion = sesionTipo("fuerza_eq", { fragil: false, minutosAer: 30 }).bloques.map((b) => ({ nombre: b.nombre, detalle: b.detalle, clave: b.clave || null, pict: b.pict || null }));
  out.historia = M.informes.textoHistoria(kb, res, ctx);
  out.vistazo = M.informes.listasVistazo(res, ctx);
  out.plan = M.informes.filasPlanPaciente(res, ctx);
  out.mecanismos = M.pdf.mecanismosDe(res).map((x) => [x.id, x.t || x.titulo || "", x.nombres]);
  out.alarma = ALARMA.slice(0, 2), out.sintomas = SINTOMAS_ACSM.slice(0, 2).map((x) => [x.id, x.texto]);
  out.unidad = unidadPorDia("mg");
  out.conSeries = M.programa.conSeries(out.sesion.find((b) => / sets of | × /.test(b.detalle))?.detalle || "", 1);
  out.glosa = { tl: TR.tL("fuerza"), plantilla: TR.tL`${3} años`, sin: TR.tL("texto que no existe") };
} catch (e) { out.errores.push(String(e.stack || e).slice(0, 600)); }
process.stdout.write(JSON.stringify(out, (k, v) => (v instanceof Set ? [...v] : v)));
