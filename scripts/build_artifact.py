#!/usr/bin/env python3
"""Empaqueta app/ en dist/artifact.html (CSS y JS en línea) para publicarlo como artefacto de claude.ai.
Los JSON de app/data se publican como ficheros adjuntos (data/*.json) y se cargan con fetch relativo."""
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
app = ROOT / "app"
html = (app / "index.html").read_text(encoding="utf-8")
css = (app / "css/style.css").read_text(encoding="utf-8")
engine = (app / "js/engine.js").read_text(encoding="utf-8")
appjs = (app / "js/app.js").read_text(encoding="utf-8")
engine = re.sub(r"^export (const|function) ", r"\1 ", engine, flags=re.M)
appjs = re.sub(r"^import .*?;\n", "", appjs, flags=re.M)
# quedarnos con el contenido de <head> útil y el <body>
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
head = re.sub(r"<meta charset[^>]*>|<meta name=\"viewport\"[^>]*>|<link rel=\"stylesheet\" href=\"css/style.css\">", "", head)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
body = body.replace('<script type="module" src="js/app.js"></script>', "")
out = f"{head.strip()}\n<style>\n{css}\n</style>\n{body}\n<script type=\"module\">\n{engine}\n{appjs}\n</script>\n"
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist/artifact.html").write_text(out, encoding="utf-8")
print("dist/artifact.html", len(out), "bytes")
