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
for f in ["js/libs.js", "js/i18n.js", "js/engine.js", "js/parser.js", "js/informes.js", "js/ocr.js", "js/app.js"]:
    js = (app / f).read_text(encoding="utf-8")
    js = re.sub(r"^export (async function|const|function) ", r"\1 ", js, flags=re.M)
    js = re.sub(r"^import .*?;\n", "", js, flags=re.M)
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
