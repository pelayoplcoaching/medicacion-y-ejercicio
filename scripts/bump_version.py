#!/usr/bin/env python3
"""Añade/actualiza ?v=<fecha-hora> a css/style.css y js/app.js en app/index.html para evitar cachés antiguas.
Ejecútelo antes de cada commit que cambie CSS o JS (scripts/build_artifact.py lo llama automáticamente).
También sella los import() dinámicos (pdf.js, i18n/xx.js), la precarga del idioma del script en línea de
index.html y recalcula la huella sha256 de ese script en la política de seguridad (CSP)."""
import re, hashlib, base64
from datetime import datetime, timezone
from pathlib import Path
p = Path(__file__).resolve().parent.parent / "app" / "index.html"
v = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
s = p.read_text(encoding="utf-8")
s = re.sub(r'(href="css/style\.css)(\?v=\d+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="js/app\.js)(\?v=\d+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(rel="modulepreload" href="js/[a-z0-9]+\.js)(\?v=\d+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(\+"\.js\?v=)\d+"', rf'\g<1>{v}"', s)  # precarga del diccionario del idioma (script en línea)
m = re.search(r"<script>(.*?)</script>", s, re.S)
if m:  # la CSP solo permite ese script en línea por su huella: recalcularla
    h = base64.b64encode(hashlib.sha256(m.group(1).encode("utf-8")).digest()).decode()
    s = re.sub(r"'sha256-[A-Za-z0-9+/=]+'", f"'sha256-{h}'", s, count=1)
p.write_text(s, encoding="utf-8")
sw = p.parent / "sw.js"
if sw.exists():
    t = sw.read_text(encoding="utf-8")
    t = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{v}";', t)
    sw.write_text(t, encoding="utf-8")
for js in [*(p.parent / "js").glob("*.js"), *(p.parent / "js" / "i18n").glob("*.js")]:
    t = js.read_text(encoding="utf-8")
    t2 = re.sub(r'(from "\./[a-z0-9]+\.js)(\?v=\d+)?"', rf'\1?v={v}"', t)
    t2 = re.sub(r'(import\("\./(?:i18n/)?[a-z0-9]+\.js)(\?v=\d+)?"\)', rf'\1?v={v}")', t2)
    if t2 != t: js.write_text(t2, encoding="utf-8")
print("versión", v)
