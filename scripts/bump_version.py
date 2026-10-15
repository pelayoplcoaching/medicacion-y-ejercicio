#!/usr/bin/env python3
"""Añade/actualiza ?v=<fecha-hora> a css/style.css y js/app.js en app/index.html para evitar cachés antiguas.
Ejecútelo antes de cada commit que cambie CSS o JS (scripts/build_artifact.py lo llama automáticamente)."""
import re
from datetime import datetime, timezone
from pathlib import Path
p = Path(__file__).resolve().parent.parent / "app" / "index.html"
v = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
s = p.read_text(encoding="utf-8")
s = re.sub(r'(href="css/style\.css)(\?v=\d+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="js/app\.js)(\?v=\d+)?"', rf'\1?v={v}"', s)
p.write_text(s, encoding="utf-8")
sw = p.parent / "sw.js"
if sw.exists():
    t = sw.read_text(encoding="utf-8")
    t = re.sub(r'const VERSION = "[^"]*";', f'const VERSION = "{v}";', t)
    sw.write_text(t, encoding="utf-8")
for js in (p.parent / "js").glob("*.js"):
    t = js.read_text(encoding="utf-8")
    t2 = re.sub(r'(from "\./[a-z]+\.js)(\?v=\d+)?"', rf'\1?v={v}"', t)
    if t2 != t: js.write_text(t2, encoding="utf-8")
print("versión", v)
