"""Busca en style.css: declaraciones muertas (pisadas siempre por una posterior), reglas vacias,
clases/ids que no existen en la app, fotogramas sin usar o repetidos y variables sin usar.
Uso: python3 analiza.py [--aplica]  (sin --aplica solo informa)."""
import re, sys, os, json, glob
sys.path.insert(0, os.path.dirname(__file__))
from cssparse import parsea, recorre, selectores, norm_sel

APP = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "app")
CSS = os.path.join(APP, "css/style.css")
s = open(CSS, encoding="utf-8").read()
nodos = parsea(s)

# --- comprobacion: el analizador cubre todo el texto ---
cubierto = bytearray(len(s))
for n in nodos:
    for k in range(n["ini"], n["fin"]): cubierto[k] = 1
resto = "".join(s[k] for k in range(len(s)) if not cubierto[k]).strip()
assert not resto, "texto sin analizar: %r" % resto[:200]

fuentes = ""
for f in glob.glob(APP + "/*.html") + glob.glob(APP + "/js/*.js") + glob.glob(APP + "/js/i18n/*.js") + [APP + "/sw.js"]:
    fuentes += open(f, encoding="utf-8").read() + "\n"

ARRIESGADOS = re.compile(r"color-mix\(|\bd?[sl]?v[hw]\b|\d(dvh|svh|lvh|dvw|svw|lvw)\b|\bmin\(|\bmax\(|\bclamp\(|oklch\(|oklab\(|\blab\(|\blch\(|light-dark\(|\bcolor\(|round\(|anchor\(|calc-size\(|attr\(", re.I)
ABREVIADAS = {
    "background": {"background-color", "background-image", "background-position", "background-size", "background-repeat", "background-attachment", "background-origin", "background-clip"},
    "margin": {"margin-top", "margin-right", "margin-bottom", "margin-left"},
    "padding": {"padding-top", "padding-right", "padding-bottom", "padding-left"},
    "transition": {"transition-property", "transition-duration", "transition-timing-function", "transition-delay"},
    "outline": {"outline-color", "outline-style", "outline-width"},
    "overflow": {"overflow-x", "overflow-y"},
    "border-radius": {"border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"},
    "border": {"border-color", "border-style", "border-width", "border-top", "border-right", "border-bottom", "border-left",
               "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
               "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
               "border-top-style", "border-right-style", "border-bottom-style", "border-left-style"},
    "font": {"font-style", "font-variant", "font-weight", "font-size", "line-height", "font-family", "font-stretch"},
    "flex": {"flex-grow", "flex-shrink", "flex-basis"},
    "list-style": {"list-style-type", "list-style-position", "list-style-image"},
    "text-decoration": {"text-decoration-line", "text-decoration-color", "text-decoration-style", "text-decoration-thickness"},
}

# --- A: declaraciones muertas ---
ocurr = []  # (orden, ctx, selectores, decl, regla)
orden = 0
for n in recorre(nodos):
    if n["tipo"] != "rule": continue
    sels = [re.sub(r"\s+", " ", x) for x in selectores(n["sel"])]
    for d in n["decls"]:
        if d["tipo"] != "decl": continue
        ocurr.append((orden, n["ctx"], sels, d, n)); orden += 1

por_sel = {}
for o in ocurr:
    for sl in o[2]: por_sel.setdefault(sl, []).append(o)

def cubre(y, x):
    """y (posterior) pisa siempre a x."""
    if not (x[1][:len(y[1])] == y[1]): return False  # el contexto de y debe ser prefijo del de x
    dx, dy = x[3], y[3]
    if dy["prop"] != dx["prop"] and dx["prop"] not in ABREVIADAS.get(dy["prop"], ()): return False
    if dx["imp"] and not dy["imp"]: return False
    if ARRIESGADOS.search(dy["valor"]) and dy["valor"] != dx["valor"]: return False
    if dy["prop"].startswith("--") and dy["prop"] != dx["prop"]: return False
    return True

muertas = []
for x in ocurr:
    vivo = False
    for sl in x[2]:
        if not any(y[0] > x[0] and cubre(y, x) for y in por_sel[sl]): vivo = True; break
    if not vivo: muertas.append(x)

# --- C: clases e ids que no aparecen en la app ---
prefijos = set(re.findall(r"([a-z][\w-]*-)\$\{", fuentes)) | set(re.findall(r"[\"'`]([a-z][\w-]*-)[\"'`]\s*\+", fuentes))
def usado(tok):
    if re.search(r"(?<![\w-])" + re.escape(tok) + r"(?![\w-])", fuentes): return True
    return any(tok.startswith(p) for p in prefijos)
def sin_funciones(sel):
    out, i = "", 0
    while i < len(sel):
        m = re.match(r":(not|is|where|has|nth-child|nth-of-type|nth-last-child)\(", sel[i:])
        if m:
            prof, j = 0, i + len(m.group(0)) - 1
            while j < len(sel):
                if sel[j] == "(": prof += 1
                elif sel[j] == ")":
                    prof -= 1
                    if prof == 0: break
                j += 1
            i = j + 1; continue
        out += sel[i]; i += 1
    return out
inutiles = {}
for n in recorre(nodos):
    if n["tipo"] != "rule": continue
    for sl in selectores(n["sel"]):
        limpio = re.sub(r"\[[^\]]*\]", "", sin_funciones(sl))
        toks = re.findall(r"\.([A-Za-z_][\w-]*)", limpio) + re.findall(r"#([A-Za-z_][\w-]*)", limpio)
        malos = [t for t in toks if not usado(t)]
        if malos: inutiles.setdefault(" ".join(sorted(set(malos))), []).append((sl, n["ctx"]))

# --- D: fotogramas ---
kf = [n for n in recorre(nodos) if n["tipo"] == "at" and n.get("keyframes")]
nombres_anim = set()
for o in ocurr:
    if o[3]["prop"] in ("animation", "animation-name"): nombres_anim |= set(re.findall(r"[\w-]+", o[3]["valor"]))
kf_sin_uso = [n for n in kf if n["pre"].split()[1] not in nombres_anim and not re.search(r"[\"'`]" + re.escape(n["pre"].split()[1]) + r"[\"'`]", fuentes)]
vistos, kf_repes = {}, []
for n in kf:
    nm = n["pre"].split()[1]
    if nm in vistos: kf_repes.append((vistos[nm], n))
    vistos[nm] = n

# --- E: variables sin usar ---
definidas = {}
for n in recorre(nodos):
    for d in n.get("decls", []) or []:
        if d["tipo"] == "decl" and d["prop"].startswith("--"): definidas.setdefault(d["prop"], []).append(d)
props_reg = [n for n in recorre(nodos) if n["tipo"] == "at" and n["nombre"] == "property"]
usos = set(re.findall(r"var\(\s*(--[\w-]+)", s)) | set(re.findall(r"(--[\w-]+)", fuentes))
# las animaciones de fotogramas tambien "usan" las variables registradas que animan
for n in kf: usos |= set(re.findall(r"(--[\w-]+)\s*:", s[n["ini"]:n["fin"]]))
var_sin_uso = {k: v for k, v in definidas.items() if k not in usos}

# --- informe ---
print("declaraciones muertas:", len(muertas), "· bytes", sum(m[3]["fin"] - m[3]["ini"] for m in muertas))
for m in muertas[:400]:
    print("  ", (" @" + " @".join(m[1])) if m[1] else "", "|", m[4]["sel"][:70].replace("\n", " "), "|", s[m[3]["ini"]:m[3]["fin"]][:90].replace("\n", " "))
print("\nselectores que nunca pueden coincidir (clase/id inexistente):")
for k, v in sorted(inutiles.items()):
    print("  ", k, "->", len(v), "|", v[0][0][:80])
print("\nfotogramas sin uso:", [n["pre"] for n in kf_sin_uso])
print("fotogramas repetidos:", [(a["pre"], a["ctx"], b["ctx"]) for a, b in kf_repes])
print("variables sin uso:", sorted(var_sin_uso))
print("@property sin uso:", [n["pre"] for n in props_reg if n["pre"].split()[1] not in usos])
json.dump({"muertas": [[m[3]["ini"], m[3]["fin"]] for m in muertas]}, open(os.path.join(os.path.dirname(__file__), "plan.json"), "w"))
