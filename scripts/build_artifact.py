#!/usr/bin/env python3
"""Empaqueta app/ en dist/artifact.html (CSS y JS en línea) para publicarlo como artefacto de claude.ai.
Los JSON de app/data se publican como ficheros adjuntos (data/*.json) y se cargan con fetch relativo."""
import re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(ROOT / "scripts" / "bump_version.py")], check=True)
app = ROOT / "app"
html = (app / "index.html").read_text(encoding="utf-8")
css = (app / "css/style.css").read_text(encoding="utf-8").replace('url("../assets/', 'url("assets/')
mods = []
# idiomas: en la web se descargan al elegirlos (js/i18n/xx.js); aquí van en línea como constantes
for f in sorted((app / "js" / "i18n").glob("*.js")):
    js = f.read_text(encoding="utf-8").replace("export default {", f"const I18N_{f.stem.upper()} = {{", 1)
    mods.append(js)
# módulos bajo demanda (v1.2): en la web se piden con import(); aquí cada uno va en su propio ámbito (sus nombres no chocan).
# Desde la v1.3 también el lector de listas (parser) y el de fotos (ocr), que usan nombres de libs.js y engine.js, ya en línea antes.
LAZY = [f.stem for f in sorted((app / "js").glob("*.js")) if re.search(r'import\("\./' + f.stem + r'\.js', (app / "js/app.js").read_text(encoding="utf-8"))]
FIJOS = ["version", "libs", "i18n", "tr", "engine", "pictos", "informes"]  # van en línea tal cual, antes que los demás
# pdf.js va como los demás módulos bajo demanda, en su propio ámbito: en línea chocaba con app.js (PQ_SENAL y PQ_ORDEN están en los dos
# desde la v1.2.18) y el artefacto no arrancaba. scripts/artifact_test.mjs lo comprueba desde la v1.3.0.
for nombre in [*FIJOS, *[n for n in LAZY if n not in FIJOS], "app"]:
    js = (app / "js" / f"{nombre}.js").read_text(encoding="utf-8")
    if nombre in LAZY:
        exp = re.findall(r"^export (?:async function|function|const|class) ([A-Za-z0-9_$]+)", js, flags=re.M)
        js = re.sub(r"^export (async function|const|function|class) ", r"\1 ", js, flags=re.M)
        js = re.sub(r"^import .*?;\n", "", js, flags=re.M)
        mods.append(f"const MOD_{nombre.upper()} = (() => {{\n{js}\nreturn {{ {', '.join(exp)} }};\n}})();")
        continue
    js = re.sub(r"^export (async function|const|function|class) ", r"\1 ", js, flags=re.M)
    js = re.sub(r"^import .*?;\n", "", js, flags=re.M)
    # import() dinámicos: todo está ya en el mismo módulo
    js = re.sub(r'import\("\./i18n/([a-z]+)\.js(\?v=\d+)?"\)', lambda m: f"Promise.resolve({{ default: I18N_{m.group(1).upper()} }})", js)
    js = re.sub(r'import\("\./([a-z0-9]+)\.js(\?v=\d+)?"\)', lambda m: f"Promise.resolve(MOD_{m.group(1).upper()})" if m.group(1) in LAZY else m.group(0), js)
    mods.append(js)
engine = "\n".join(mods[:-1]); appjs = mods[-1]
# quedarnos con el contenido de <head> útil y el <body>
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
head = re.sub(r"<meta charset[^>]*>|<meta name=\"viewport\"[^>]*>|<link rel=\"stylesheet\" href=\"css/style.css\">", "", head)
body = re.search(r"<body[^>]*>(.*?)</body>", html, re.S).group(1)
body = re.sub(r'<script type="module" src="js/app\.js[^"]*"></script>', "", body)
out = f"{head.strip()}\n<style>\n{css}\n</style>\n{body}\n<script type=\"module\">\n{engine}\n{appjs}\n</script>\n"
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist/artifact.html").write_text(out, encoding="utf-8")
print("dist/artifact.html", len(out), "bytes")
