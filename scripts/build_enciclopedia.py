#!/usr/bin/env python3
"""Genera la enciclopedia pública «X y ejercicio» (app/enciclopedia/): una página estática por cada principio de la base
(fármacos, suplementos y plantas) y por cada situación clínica, más un índice con buscador, y las añade a sitemap.xml.

Solo publica contenido YA REVISADO de la base (reglas con «revisado»: true): no inventa ni resume nada. Cada página invita a
abrir la aplicación con ese medicamento (../#farmaco=<id>) o con la receta de esa situación (../#abre=receta:<id>).

Uso: python3 scripts/build_enciclopedia.py     (hay que repetirlo cuando cambie app/data/kb.json; scripts/test.mjs lo vigila)
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
SAL = APP / "enciclopedia"
SITIO = "https://medicacionyejercicio.fuerzabasadaenevidencia.com"
AUTOR = "Dr. Pelayo Fernández Cidón"
kb = json.loads((APP / "data/kb.json").read_text(encoding="utf-8"))
fichas = json.loads((APP / "data/fichas.json").read_text(encoding="utf-8"))
i18n = (APP / "js/i18n.js").read_text(encoding="utf-8")

e = lambda s: html.escape(str(s), quote=True)
slug = lambda pid: pid.replace("_", "-")
AMBITOS = [("general", "En general"), ("aerobico", "Ejercicio aeróbico"), ("fuerza", "Ejercicio de fuerza"), ("equilibrio", "Equilibrio y caídas")]
NIVEL = {k: v["etiqueta"] for k, v in kb["niveles"].items()}
MARCADORES = {"ieca_ara", "diuretico", "aine", "estatina", "fibrato", "corticoide", "serotoninergico"}  # señales que nombran una familia, no un efecto
TIPO = {"suplemento": "Suplemento", "planta": "Planta medicinal"}
# situaciones clínicas: id → (clave del nombre en el diccionario, reglas revisadas propias de la situación)
SITUACIONES = [
    ("diabetes", "sit.diabetes", ["diabetes_pies"]), ("insuficiencia_cardiaca", "sit.ic", ["ic_ejercicio"]), ("renal", "sit.renal.pac", ["renal_grave"]),
    ("marcapasos", "sit.marcapasos", ["marcapasos_fc", "dai_fc"]), ("osteoporosis", "sit.osteoporosis", ["osteoporosis_plan"]), ("epoc_asma", "sit.epoc", ["epoc_plan"]),
    ("oxigeno", "sit.oxigeno", ["oxigeno_cond"]), ("embarazo", "sit.embarazo", ["embarazo"]), ("hipertension", "sit.hipertension", ["hipertension_cond"]),
    ("cardiopatia_isquemica", "sit.cardiopatia", ["cardiopatia_isquemica"]), ("fibrilacion_auricular", "sit.fa", ["fibrilacion_auricular"]), ("aneurisma_aorta", "sit.aneurisma", ["aneurisma_aorta"]),
    ("ictus", "sit.ictus", ["ictus"]), ("cancer", "sit.cancer", ["cancer_cond"]), ("artrosis", "sit.artrosis", ["artrosis"]), ("epilepsia", "sit.epilepsia", ["epilepsia_cond"]),
    ("hepatopatia", "sit.hepatopatia", ["hepatopatia_cond"]), ("obesidad", "sit.obesidad", ["obesidad_cond"]),
]
COND_TXT = {"renal": "enfermedad del riñón"}


def nombre_sit(clave):
    m = re.search(r'"' + re.escape(clave) + r'": "((?:[^"\\]|\\.)*)"', i18n)
    assert m, clave
    return json.loads('"' + m.group(1) + '"')


def recorta(txt, n=158):
    txt = " ".join(txt.split()).replace("'", "’")
    if len(txt) <= n:
        return txt
    c = txt[: n - 1]
    return c[: c.rfind(" ")].rstrip(",;:. ") + "…"


def condicion(si, nombres):
    """Etiqueta de una regla condicional («Con dosis altas», «Desde los 65 años»…)."""
    if not si:
        return ""
    p = []
    if si.get("dosis") == "alta":
        p.append("con dosis altas")
    if si.get("edad_min"):
        p.append(f"desde los {si['edad_min']} años")
    if si.get("condicion"):
        p.append("si tiene " + COND_TXT.get(si["condicion"], nombres.get(si["condicion"], si["condicion"]).lower()))
    t = ", ".join(p)
    return t[:1].upper() + t[1:] if t else ""


def regla_html(r, nombres):
    cond = condicion({k: v for k, v in (r.get("si") or {}).items() if k != "principio"}, nombres)
    return ('<li class="regla n-' + r["nivel"] + '"><span class="niv">' + e(NIVEL[r["nivel"]]) + "</span>" + ('<span class="cond">' + e(cond) + "</span>" if cond else "")
            + "<p>" + e(r["texto"]) + "</p>" + ("<small>Fuente: " + e(r["fuente"]) + "</small>" if r.get("fuente") else "") + "</li>")


CSS = """/* Enciclopedia «X y ejercicio» de Pauta Activa: hoja propia, pequeña y sin dependencias (generada por scripts/build_enciclopedia.py). */
@font-face { font-family: "Archivo"; src: url("../assets/fonts/Archivo-latin.woff2") format("woff2"); font-weight: 400 800; font-stretch: 75% 125%; font-display: swap; }
:root { color-scheme: light dark; --noche: #140B3A; --bg: #f6f6f9; --surface: #fff; --surface-2: #eeecff; --fg: #151423; --muted: #55546a; --line: #dddce6; --line-strong: #c6c3d9; --accent: #593ede; --accent-deep: #462abf; --accent-fg: #fff;
  --alerta: #b4233c; --alerta-soft: #fbeaed; --precaucion: #9a6a12; --precaucion-soft: #fbf1da; --info: #1f8a5b; --info-soft: #e3f3ea; --r: 16px;
  --font: "Archivo", "Segoe UI", system-ui, -apple-system, Helvetica, Arial, sans-serif; --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) { :root { --bg: #0e0d15; --surface: #181626; --surface-2: #211f32; --fg: #eeecff; --muted: #a9a7bd; --line: #343249; --line-strong: #4a4766; --accent: #a49cff; --accent-deep: #c9c4ff; --accent-fg: #140b3a;
  --alerta: #ff8fa3; --alerta-soft: #3a1c25; --precaucion: #f0c674; --precaucion-soft: #2e2718; --info: #5fd3a0; --info-soft: #12301f; } }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 1.0625rem/1.6 var(--font); }
a { color: var(--accent-deep); text-underline-offset: 3px; }
a:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.cab { background: var(--noche); color: #fff; }
.cab > div { max-width: 860px; margin: 0 auto; padding: 12px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; }
.cab a { color: #fff; text-decoration: none; font-weight: 700; }
.marca { display: inline-flex; align-items: center; gap: 10px; font-size: 1.05rem; }
.marca img { border-radius: 8px; }
.cab nav { display: flex; align-items: center; gap: 14px; font-size: .95rem; }
.btn { display: inline-block; padding: 10px 18px; border-radius: 999px; background: var(--accent); color: var(--accent-fg) !important; font-weight: 700; text-decoration: none; }
.cab .btn { background: #fff; color: var(--noche) !important; padding: 7px 14px; }
main { max-width: 860px; margin: 0 auto; padding: 20px 16px 48px; }
.miga { margin: 0 0 10px; font-size: .86rem; color: var(--muted); }
.miga a { color: inherit; }
h1 { margin: 0 0 6px; font-size: clamp(1.7rem, 5vw, 2.5rem); line-height: 1.12; letter-spacing: -.01em; text-wrap: balance; }
h2 { margin: 30px 0 10px; font-size: 1.25rem; line-height: 1.25; }
.sub { margin: 0 0 4px; color: var(--muted); }
.sub b { color: var(--fg); }
.etq { display: inline-block; margin: 0 6px 0 0; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--line-strong); font: 700 .74rem/1.5 var(--mono); letter-spacing: .04em; text-transform: uppercase; }
.resumen { margin: 14px 0 0; padding: 14px 16px; border-left: 4px solid var(--accent); border-radius: 0 var(--r) var(--r) 0; background: var(--surface); font-size: 1.1rem; }
.nota { margin: 10px 0 0; color: var(--muted); }
ul.efectos, ul.reglas, ul.lista, ul.indice { list-style: none; margin: 0; padding: 0; }
ul.efectos { display: flex; flex-wrap: wrap; gap: 8px; }
ul.efectos li { padding: 6px 12px; border-radius: 12px; background: var(--surface-2); font-size: .95rem; }
ul.reglas { display: grid; gap: 10px; }
.regla { padding: 12px 14px; border: 1px solid var(--line); border-left-width: 5px; border-radius: var(--r); background: var(--surface); }
.regla p { margin: 4px 0 0; }
.regla small { display: block; margin-top: 6px; color: var(--muted); font-size: .8rem; }
.niv { font: 700 .72rem/1.4 var(--mono); letter-spacing: .05em; text-transform: uppercase; }
.cond { margin-left: 10px; padding: 1px 8px; border-radius: 999px; background: var(--surface-2); font-size: .8rem; font-weight: 700; }
.n-info { border-left-color: var(--info); } .n-info .niv { color: var(--info); }
.n-precaucion { border-left-color: var(--precaucion); } .n-precaucion .niv { color: var(--precaucion); }
.n-alerta { border-left-color: var(--alerta); background: var(--alerta-soft); } .n-alerta .niv { color: var(--alerta); }
.cta { margin: 34px 0 0; padding: 22px 20px; border-radius: 24px; background: var(--noche); color: #fff; }
.cta h2 { margin: 0 0 6px; color: #fff; }
.cta p { margin: 0 0 14px; color: #dcd8ff; }
.cta .btn { background: #fff; color: var(--noche) !important; }
ul.lista { display: flex; flex-wrap: wrap; gap: 8px; }
ul.lista a { display: inline-block; padding: 6px 12px; border: 1px solid var(--line-strong); border-radius: 999px; background: var(--surface); text-decoration: none; font-size: .95rem; }
ul.lista a:hover, ul.indice a:hover { border-color: var(--accent); }
ol.fuentes { margin: 0; padding-left: 1.3em; color: var(--muted); font-size: .92rem; }
.pie { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--line); color: var(--muted); font-size: .86rem; }
.pie p { margin: 0 0 8px; }
.busca { width: 100%; margin: 16px 0 6px; padding: 14px 16px; border: 2px solid var(--line-strong); border-radius: var(--r); background: var(--surface); color: var(--fg); font: inherit; font-size: 1.1rem; }
.cuenta { margin: 0 0 8px; color: var(--muted); font-size: .9rem; min-height: 1.5em; }
.letras { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 10px; padding: 0; list-style: none; }
.letras a { display: grid; place-items: center; min-width: 36px; min-height: 36px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line); text-decoration: none; font-weight: 700; }
h2.letra { margin: 22px 0 8px; font: 800 1.5rem/1 var(--mono); color: var(--accent-deep); }
ul.indice { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
ul.indice a { display: block; height: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); text-decoration: none; color: var(--fg); }
ul.indice b { display: block; line-height: 1.3; }
.etq-q { display: block; margin-top: 14px; }
ul.indice small { display: block; color: var(--muted); font-size: .8rem; line-height: 1.35; }
/* Mejoras 877-880 (23/11/2026): cabecera de noche con cifras y buscador, icono del nivel en cada regla, letras fijas con recuento y tarjetas del indice con flecha. */
.hero, .cta { background: radial-gradient(60% 130% at 92% -20%, #4a2fd0 0, transparent 62%), radial-gradient(45% 90% at 0 120%, #2a1a7a 0, transparent 70%), var(--noche); }
.hero { color: #fff; border-radius: 0 0 28px 28px; }
.hero > div { max-width: 860px; margin: 0 auto; padding: 14px 16px 26px; }
.hero .miga, .hero .sub, .hero .cuenta { color: #cfcaf5; } .hero .sub b { color: #fff; }
.hero .etq { border-color: #fff6; color: #fff; }
.hero :focus-visible { outline-color: #fff; }
.cifras { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; padding: 0; list-style: none; }
.cifras li { flex: 1 1 96px; padding: 9px 12px; border-radius: 14px; background: #ffffff14; border: 1px solid #ffffff2e; color: #dcd8ff; font-size: .88rem; line-height: 1.3; }
.cifras b { display: block; font: 800 1.6rem/1.1 var(--mono); color: #fff; }
.hero .busca { margin-bottom: 0; padding-left: 48px; border-color: transparent; color: #151423; box-shadow: 0 12px 30px #0006; background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23593ede' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-4-4'/%3E%3C/svg%3E") 14px 50% / 22px no-repeat; }
.hero .cuenta { margin: 8px 0 0; min-height: 0; }
.niv { display: inline-flex; align-items: center; gap: 6px; vertical-align: middle; }
.niv::before { content: ""; width: 16px; height: 16px; background: currentColor; -webkit-mask: var(--ic) center / contain no-repeat; mask: var(--ic) center / contain no-repeat; }
.n-info { --ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill-rule='evenodd' d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 8h2v7h-2zm0-4h2v2h-2z'/%3E%3C/svg%3E"); }
.n-precaucion { --ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill-rule='evenodd' d='M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E"); }
.n-alerta { --ic: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill-rule='evenodd' d='M8 2h8l6 6v8l-6 6H8l-6-6V8zm3 5h2v7h-2zm0 9h2v2h-2z'/%3E%3C/svg%3E"); }
ul.efectos li { border-left: 3px solid var(--accent); }
.letras { position: sticky; top: 0; z-index: 2; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 10px; padding: 8px 16px; background: color-mix(in srgb, var(--bg) 86%, transparent); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.letras li { flex: none; }
section.grupo { scroll-margin-top: 64px; }
h2.letra { display: flex; align-items: center; gap: 10px; }
h2.letra small { padding: 3px 8px; border-radius: 999px; background: var(--surface-2); color: var(--muted); font: 700 .74rem/1 var(--mono); }
h2.letra::after { content: ""; flex: 1; height: 1px; background: var(--line); }
ul.indice a { position: relative; padding-right: 30px; transition: translate .15s, border-color .15s, box-shadow .15s; }
ul.indice a::after { content: "\\203a"; position: absolute; right: 12px; top: 50%; translate: 0 -55%; color: var(--line-strong); font-size: 1.4rem; line-height: 1; }
ul.indice a:hover { translate: 0 -2px; box-shadow: 0 8px 18px #593ede24; } ul.indice a:hover::after { color: var(--accent); }
#situaciones ul.indice a { border-left: 4px solid var(--accent); }
.tp { display: inline-block; margin: 2px 0; padding: 0 7px; border-radius: 999px; background: var(--info-soft); color: var(--info); font: 700 .66rem/1.7 var(--mono); font-style: normal; letter-spacing: .04em; text-transform: uppercase; }
@media (min-width: 700px) { .letras { overflow: visible; margin-inline: 0; padding-inline: 0; } .letras li { flex: 1 1 0; } .letras a { min-width: 0; } }
@media (prefers-reduced-motion: reduce) { ul.indice a { transition: none; } }
[hidden] { display: none !important; }
@media print { .cab nav, .cta, .busca, .letras, .cifras { display: none; } body, .hero { background: #fff; } .hero, .hero .sub, .hero .sub b, .hero .miga, .hero .etq { color: #000; } }
"""

JS = """// Buscador del índice de la enciclopedia (sin dependencias): por nombre o marca y, si no hay ninguno, por familia. Sin tildes.
const q = document.querySelector("#q"), cuenta = document.querySelector("#cuenta"), items = [...document.querySelectorAll("ul.indice li")];
const norm = (s) => s.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
const propio = items.map((li) => norm(li.dataset.b || li.textContent)), familia = items.map((li) => norm(li.dataset.f || ""));
function filtrar() {
  const t = norm(q.value.trim()); let n = 0;
  const porNombre = !!t && propio.some((x) => x.includes(t));
  items.forEach((li, i) => { const ok = !t || (porNombre ? propio[i].includes(t) : familia[i].includes(t)); li.hidden = !ok; if (ok) n++; });
  document.querySelectorAll("section.grupo").forEach((s) => { s.hidden = !s.querySelector("li:not([hidden])"); });
  document.querySelector(".letras").hidden = !!t;
  cuenta.textContent = t ? (n ? n + (n === 1 ? " resultado" : " resultados") : "Sin resultados: pruebe con otro nombre o con la marca.") : "";
}
q.addEventListener("input", filtrar);
if (q.value) filtrar();
"""


def pagina(archivo, titulo, descripcion, cuerpo, ld, miga, cab):
    canon = f"{SITIO}/enciclopedia/{archivo}" if archivo != "index.html" else f"{SITIO}/enciclopedia/"
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descripcion)}">
<link rel="canonical" href="{canon}">
<meta name="pa-base" content="{e(kb['version'])}">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="Pauta Activa">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descripcion)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="{SITIO}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="preload" href="../assets/fonts/Archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="enc.css?v={e(kb['version'])}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
<header class="cab"><div><a class="marca" href="../"><img src="../assets/logo-80.png" alt="" width="32" height="32">Pauta Activa</a><nav><a href="./">Enciclopedia</a><a class="btn" href="../">Abrir la aplicación</a></nav></div></header>
<div class="hero"><div>
{miga}
{cab}
</div></div>
<main>
{cuerpo}
<footer class="pie">
<p>{e(kb['aviso'])}</p>
<p>Contenido de la base de conocimiento de Pauta Activa (versión {e(kb['version'])}). Autor: {AUTOR}, médico internista. Todas las recomendaciones llevan su fuente y están revisadas. <a href="../acerca.html">Fuentes y método</a> · <a href="../legal.html">Información legal</a> · <a href="./">Índice de la enciclopedia</a></p>
</footer>
</main>
</body>
</html>
"""


def persona():
    return {"@type": "Person", "name": "Pelayo Fernández Cidón", "jobTitle": "Médico internista", "url": "https://fuerzabasadaenevidencia.com/"}


def main():
    nombres_sit = {sid: nombre_sit(k) for sid, k, _ in SITUACIONES}
    SAL.mkdir(exist_ok=True)
    for f in SAL.glob("*.html"):
        f.unlink()
    (SAL / "enc.css").write_text(CSS, encoding="utf-8")
    (SAL / "enc.js").write_text(JS, encoding="utf-8")
    urls, entradas = [], []

    for c in kb["clases"]:
        tipo = c.get("tipo") or "farmaco"
        for p in c["principios"]:
            pid, nom = p["id"], p["nombre"]
            ptipo = p.get("tipo") or tipo
            archivo = slug(pid) + ".html"
            marcas = p.get("marcas") or []
            senales = [s for s in dict.fromkeys([*c.get("senales", []), *p.get("senales_extra", [])]) if s not in MARCADORES and s in kb["senales"]]
            secciones = []
            n_reglas = 0
            for amb, tit in AMBITOS:
                rs = [r for r in c.get(amb, []) if r.get("revisado") is True and (not (r.get("si") or {}).get("principio") or r["si"]["principio"] == pid)]
                if rs:
                    n_reglas += len(rs)
                    secciones.append(f'<section id="{amb}"><h2>{tit}</h2><ul class="reglas">{"".join(regla_html(r, nombres_sit) for r in rs)}</ul></section>')
            coma = lambda v: str(v).replace(".", ",")
            horario = "".join('<p class="nota">Mejor no entrenar entre ' + coma(h["desde"]) + " y " + coma(h["hasta"]) + " horas después de la toma: " + e(h["motivo"]) + ".</p>" for h in (p.get("horario") or {}).get("evitar", []))
            hermanos = [q for q in c["principios"] if q["id"] != pid]
            fuentes = [*c.get("fuentes", [])]
            ft = fichas.get(pid)
            etq = f'<span class="etq">{TIPO[ptipo]}</span>' if ptipo in TIPO else ""
            corto = nom.split(" (")[0]
            marcas_html = '<p class="sub">También como: ' + e(", ".join(marcas)) + "</p>" if marcas else ""
            nota_html = '<p class="nota">' + e(p["nota"]) + "</p>" if p.get("nota") else ""
            efectos_html = '<section id="efectos"><h2>Qué puede notar al moverse</h2><ul class="efectos">' + "".join("<li>" + e(kb["senales"][x]) + "</li>" for x in senales) + "</ul></section>" if senales else ""
            hermanos_html = '<section id="familia"><h2>Otros de la misma familia</h2><ul class="lista">' + "".join('<li><a href="' + slug(q["id"]) + '.html">' + e(q["nombre"]) + "</a></li>" for q in hermanos) + "</ul></section>" if hermanos else ""
            fuentes_html = "".join("<li>" + e(x) + "</li>" for x in fuentes) + ('<li><a href="' + e(ft) + '" rel="noopener nofollow">Ficha técnica de ' + e(corto) + " (AEMPS, CIMA)</a></li>" if ft else "")
            cab = f"""<h1>{e(nom)} y ejercicio físico</h1>
{marcas_html}
<p class="sub">{etq}Familia: <b>{e(c['nombre'])}</b></p>"""
            cuerpo = f"""<p class="resumen">{e(c['resumen'])}</p>
{nota_html}{horario}
{efectos_html}
{''.join(secciones)}
<section class="cta"><h2>¿Toma algo más?</h2><p>Esta página habla de un solo medicamento. Pauta Activa cruza toda su lista, con sus dosis y su situación, y le prepara un plan de ejercicio a su medida. Sin registro: sus datos no salen de su dispositivo.</p><a class="btn" href="../#farmaco={pid}">Abrir {e(corto)} en Pauta Activa</a></section>
{hermanos_html}
<section id="fuentes"><h2>Fuentes</h2><ol class="fuentes">{fuentes_html}</ol></section>"""
            # descripción: si el principio tiene regla propia (familias que agrupan productos distintos), esa; si no, el resumen de la familia
            propia = next((r["texto"] for amb, _ in AMBITOS for r in c.get(amb, []) if r.get("revisado") is True and (r.get("si") or {}).get("principio") == pid), None)
            desc = recorta(f"{nom}{' (' + ', '.join(marcas[:2]) + ')' if marcas else ''} y ejercicio: {propia or c['resumen']}")
            ld = {"@context": "https://schema.org", "@type": "MedicalWebPage", "name": f"{nom} y ejercicio físico", "description": desc, "inLanguage": "es", "url": f"{SITIO}/enciclopedia/{archivo}",
                  "about": {"@type": "DietarySupplement" if ptipo in TIPO else "Drug", "name": nom, **({"alternateName": marcas} if marcas else {})},
                  "audience": {"@type": "Patient"}, "lastReviewed": kb["fecha"], "dateModified": kb["fecha"], "author": persona(), "reviewedBy": persona(),
                  "publisher": {"@type": "Organization", "name": "Fuerza Basada en Evidencia", "url": "https://fuerzabasadaenevidencia.com/"}, "isPartOf": {"@type": "WebSite", "name": "Pauta Activa", "url": SITIO + "/"}}
            miga = f'<p class="miga"><a href="./">Enciclopedia</a> › {e(c["nombre"])} › {e(nom)}</p>'
            (SAL / archivo).write_text(pagina(archivo, f"{nom} y ejercicio físico: qué tener en cuenta · Pauta Activa", desc, cuerpo, ld, miga, cab), encoding="utf-8")
            urls.append(archivo)
            entradas.append({"archivo": archivo, "nombre": nom, "marcas": marcas, "familia": c["nombre"], "tipo": ptipo, "n": n_reglas})

    reglas = {r["id"]: r for r in kb["reglas_combinadas"] if r.get("revisado") is True}
    sit_entradas = []
    for sid, clave, propias in SITUACIONES:
        nom = nombres_sit[sid]
        archivo = f"situacion-{slug(sid)}.html"
        rs = [reglas[r] for r in propias if r in reglas]
        # reglas que cruzan la situación con la medicación: solo se nombran (su texto depende de la lista de cada persona)
        cruces = [r for r in kb["reglas_combinadas"] if r.get("revisado") is True and r["id"] not in propias and (f'"{sid}"' in json.dumps(r["si"]) or (sid == "renal" and '"renal_grave"' in json.dumps(r["si"])))]
        bloque = "".join('<li class="regla n-' + r["nivel"] + '"><span class="niv">' + e(NIVEL[r["nivel"]]) + '</span><span class="cond">' + e(r["titulo"]) + "</span><p>" + e(r["texto"]) + "</p>" + ("<small>Fuente: " + e(r["fuente"]) + "</small>" if r.get("fuente") else "") + "</li>" for r in rs)
        cruces_html = ('<section id="cruces"><h2>Y según su medicación</h2><p>Pauta Activa cruza además esta situación con lo que toma. Entre otras cosas, avisa de:</p><ul class="lista">'
                       + "".join('<li><a href="../#abre=receta:' + sid + '">' + e(r["titulo"]) + "</a></li>" for r in cruces) + "</ul></section>") if cruces else ""
        fuentes_html = "".join("<li>" + e(x) + "</li>" for x in dict.fromkeys(r["fuente"] for r in rs if r.get("fuente")))
        cab = f"""<h1>{e(nom)} y ejercicio físico</h1>
<p class="sub"><span class="etq">Situación clínica</span>Qué cambia al hacer ejercicio</p>"""
        cuerpo = f"""<section id="especifico"><h2>Lo que conviene saber</h2><ul class="reglas">{bloque}</ul></section>
{cruces_html}
<section class="cta"><h2>Su receta de ejercicio</h2><p>En la aplicación tiene la dosis de referencia para esta situación (frecuencia, intensidad, tiempo y tipo), cruzada con su medicación, y un plan semanal. Sin registro: sus datos no salen de su dispositivo.</p><a class="btn" href="../#abre=receta:{sid}">Ver la receta en Pauta Activa</a></section>
<section id="fuentes"><h2>Fuentes</h2><ol class="fuentes">{fuentes_html}</ol></section>"""
        desc = recorta(f"{nom} y ejercicio físico: {rs[0]['texto'] if rs else ''}")
        ld = {"@context": "https://schema.org", "@type": "MedicalWebPage", "name": f"{nom} y ejercicio físico", "description": desc, "inLanguage": "es", "url": f"{SITIO}/enciclopedia/{archivo}",
              "about": {"@type": "MedicalCondition", "name": nom}, "audience": {"@type": "Patient"}, "lastReviewed": kb["fecha"], "dateModified": kb["fecha"], "author": persona(), "reviewedBy": persona(),
              "publisher": {"@type": "Organization", "name": "Fuerza Basada en Evidencia", "url": "https://fuerzabasadaenevidencia.com/"}, "isPartOf": {"@type": "WebSite", "name": "Pauta Activa", "url": SITIO + "/"}}
        miga = f'<p class="miga"><a href="./">Enciclopedia</a> › Situaciones clínicas › {e(nom)}</p>'
        (SAL / archivo).write_text(pagina(archivo, f"{nom} y ejercicio físico: qué tener en cuenta · Pauta Activa", desc, cuerpo, ld, miga, cab), encoding="utf-8")
        urls.append(archivo)
        sit_entradas.append((archivo, nom))

    # índice: situaciones y, por orden alfabético, todos los principios
    sin_tilde = lambda s: s.translate(str.maketrans("ÁÉÍÓÚÜáéíóúü", "AEIOUUaeiouu"))
    entradas.sort(key=lambda x: sin_tilde(x["nombre"]).lower())
    grupos = {}
    for x in entradas:
        grupos.setdefault(sin_tilde(x["nombre"])[0].upper(), []).append(x)
    item = lambda x: ("<li data-b=\"" + e(" ".join([x["nombre"], *x["marcas"]])) + "\" data-f=\"" + e(x["familia"]) + "\"><a href=\"" + x["archivo"] + "\"><b>" + e(x["nombre"]) + "</b>" + ('<i class="tp">' + TIPO[x["tipo"]] + "</i>" if x["tipo"] in TIPO else "") + "<small>" + e(x["familia"]) + (" · " + e(", ".join(x["marcas"][:3])) if x["marcas"] else "") + "</small></a></li>")
    n_f = sum(1 for x in entradas if x["tipo"] == "farmaco")
    sit_html = "".join('<li data-b="' + e(n) + '"><a href="' + a + '"><b>' + e(n) + "</b><small>Qué cambia al hacer ejercicio</small></a></li>" for a, n in sit_entradas)
    letras_html = "".join('<li><a href="#l-' + k + '">' + k + "</a></li>" for k in sorted(grupos))
    grupos_html = "".join('<section class="grupo" id="l-' + k + '"><h2 class="letra">' + k + " <small>" + str(len(grupos[k])) + '</small></h2><ul class="indice">' + "".join(item(x) for x in grupos[k]) + "</ul></section>" for k in sorted(grupos))
    cab = f"""<h1>Medicamentos y ejercicio físico</h1>
<p class="sub">Qué tener en cuenta al moverse con cada medicamento y en cada situación clínica. Con sus fuentes.</p>
<ul class="cifras"><li><b>{n_f}</b> principios activos</li><li><b>{len(entradas) - n_f}</b> suplementos y plantas</li><li><b>{len(sit_entradas)}</b> situaciones clínicas</li></ul>
<label for="q" class="sub etq-q"><b>Busque su medicamento</b> por el nombre, la marca o la familia</label>
<input class="busca" id="q" type="search" placeholder="Por ejemplo: bisoprolol, Sintrom, estatinas…" autocomplete="off">
<p class="cuenta" id="cuenta" role="status" aria-live="polite"></p>"""
    cuerpo = f"""<section class="grupo" id="situaciones"><h2>Situaciones clínicas</h2><ul class="indice">{sit_html}</ul></section>
<h2 id="az">Medicamentos, suplementos y plantas</h2>
<ul class="letras">{letras_html}</ul>
{grupos_html}
<section class="cta"><h2>¿Toma varios?</h2><p>Lo importante suele estar en la combinación. Pauta Activa cruza toda su lista, con sus dosis y su situación, y le prepara un plan de ejercicio a su medida. Sin registro: sus datos no salen de su dispositivo.</p><a class="btn" href="../">Abrir Pauta Activa</a></section>
<script src="enc.js?v={e(kb['version'])}" defer></script>"""
    desc = f"Qué tener en cuenta al hacer ejercicio con {len(entradas)} medicamentos, suplementos y plantas y en {len(sit_entradas)} situaciones clínicas. Con sus fuentes y buscador."
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Medicamentos y ejercicio físico: enciclopedia de Pauta Activa", "description": desc, "inLanguage": "es", "url": f"{SITIO}/enciclopedia/", "author": persona(),
          "isPartOf": {"@type": "WebSite", "name": "Pauta Activa", "url": SITIO + "/"}}
    (SAL / "index.html").write_text(pagina("index.html", "Medicamentos y ejercicio físico: enciclopedia · Pauta Activa", desc, cuerpo, ld, '<p class="miga"><a href="../">Pauta Activa</a> › Enciclopedia</p>', cab), encoding="utf-8")

    # sitemap: se quitan las direcciones anteriores de la enciclopedia y se vuelven a poner
    sm = APP / "sitemap.xml"
    x = re.sub(r"\s*<url><loc>[^<]*/enciclopedia/[^<]*</loc>.*?</url>", "", sm.read_text(encoding="utf-8"))
    nuevas = "".join(f"\n  <url><loc>{SITIO}/enciclopedia/{u}</loc><lastmod>{kb['fecha']}</lastmod></url>" for u in ["", *urls])
    sm.write_text(x.replace("\n</urlset>", nuevas + "\n</urlset>"), encoding="utf-8")
    print(f"enciclopedia: {len(entradas)} principios + {len(sit_entradas)} situaciones + índice · base {kb['version']}")


if __name__ == "__main__":
    main()
