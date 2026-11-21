"""Limpieza de style.css en dos pasos:
  paso 1 (--muertas): quita declaraciones siempre pisadas, reglas y bloques que se quedan vacios, comentarios huerfanos,
          selectores imposibles, fotogramas repetidos, variables sin uso y las animaciones antiguas ya sustituidas por las pa-*.
  paso 2 (--comentarios): escribe docs/ESTILOS-MEJORAS.md con la descripcion de cada mejora numerada y deja en la hoja solo el numero.
Uso: python3 aplica.py ENTRADA SALIDA [--muertas] [--comentarios]"""
import re, sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
from cssparse import parsea, recorre, selectores

ent, sal = sys.argv[1], sys.argv[2]
s = open(ent, encoding="utf-8").read()
cortes = []  # (ini, fin, reemplazo)

def corta(ini, fin, rep=""):
    cortes.append((ini, fin, rep))

def aplica(texto, cortes):
    cortes = sorted(set(cortes), key=lambda c: (c[0], -c[1]))
    out, pos = [], 0
    for ini, fin, rep in cortes:
        if ini < pos: continue  # contenido en un corte mayor ya aplicado
        out.append(texto[pos:ini]); out.append(rep); pos = fin
    out.append(texto[pos:])
    return "".join(out)

def hasta_fin_linea(texto, fin):
    """Extiende un corte por los espacios y un salto de linea siguientes."""
    while fin < len(texto) and texto[fin] in " \t": fin += 1
    if fin < len(texto) and texto[fin] == "\n": fin += 1
    return fin

if "--muertas" in sys.argv:
    plan = json.load(open(os.path.join(os.path.dirname(__file__), "plan.json")))
    muertas = {tuple(x) for x in plan["muertas"]}
    nodos = parsea(s)
    quitadas = set()  # ini de nodos quitados enteros

    # 1) selectores imposibles (clase que no existe en la app)
    IMPOSIBLES = re.compile(r"\.senales-chips(?![\w-])")
    reglas_sel = {}
    for n in recorre(nodos):
        if n["tipo"] == "rule" and IMPOSIBLES.search(n["sel"]):
            buenos = [x for x in selectores(n["sel"]) if not IMPOSIBLES.search(x)]
            if buenos: reglas_sel[n["ini"]] = ", ".join(buenos)
            else: quitadas.add(n["ini"])

    # 2) animaciones antiguas sustituidas por las pa-* (y sus fotogramas si se quedan sin uso)
    ANTIGUAS = {"entra-tab", "dlg-aparece", "abrir", "subir"}
    decl_antiguas = set()
    for n in recorre(nodos):
        if n["tipo"] != "rule": continue
        for d in n["decls"]:
            if d["tipo"] == "decl" and d["prop"] == "animation" and re.match(r"([\w-]+)", d["valor"]).group(1) in ANTIGUAS:
                decl_antiguas.add((d["ini"], d["fin"]))

    # 3) fotogramas repetidos: queda el ultimo
    kf = [n for n in recorre(nodos) if n["tipo"] == "at" and n.get("keyframes")]
    vistos = {}
    for n in kf:
        nm = n["pre"].split()[1]
        if nm in vistos: quitadas.add(vistos[nm]["ini"])
        vistos[nm] = n

    # 4) variables sin uso
    VARS = {"--dur-larga", "--dur-media", "--lavanda", "--marca-h", "--neon", "--noche-2", "--cm-23", "--cm-26", "--cm-3", "--cm-6", "--cm-60", "--cm-86", "--cm-87", "--cm-88", "--cm-89", "--cm-90"}

    def decl_fuera(d):
        return (d["ini"], d["fin"]) in muertas or (d["ini"], d["fin"]) in decl_antiguas or d["prop"] in VARS

    def procesa(lista):
        """Marca cortes y devuelve True si toda la lista queda vacia (sin reglas ni at-reglas vivas)."""
        vivos_por_pos = []
        for n in lista:
            if n["tipo"] == "comment": vivos_por_pos.append(("c", n)); continue
            vivo = True
            if n["ini"] in quitadas: vivo = False
            elif n["tipo"] == "rule":
                ds = [d for d in n["decls"] if d["tipo"] == "decl"]
                fuera = [d for d in ds if decl_fuera(d)]
                if ds and len(fuera) == len(ds): vivo = False
                else:
                    for d in fuera: corta(d["ini"], hasta_fin_linea(s, d["fin"]) if s[d["fin"]:d["fin"] + 1] == "\n" else min(len(s), d["fin"] + (1 if s[d["fin"]:d["fin"] + 1] == " " else 0)))
                    if n["ini"] in reglas_sel: corta(n["ini"], n["bini"] - 1, reglas_sel[n["ini"]] + " ")
            elif n["tipo"] == "at" and n.get("hijos") is not None:
                if procesa(n["hijos"]): vivo = False
            elif n["tipo"] == "at" and n.get("keyframes"):
                nm = n["pre"].split()[1]
                if nm in ANTIGUAS and not usa_animacion(nm): vivo = False
            elif n["tipo"] == "at" and n.get("decls"):
                ds = [d for d in n["decls"] if d["tipo"] == "decl"]
                for d in ds:
                    if d["prop"] in VARS: corta(d["ini"], d["fin"])
            if not vivo: corta(n["ini"], hasta_fin_linea(s, n["fin"]))
            vivos_por_pos.append(("v" if vivo else "x", n))
        # comentarios numerados huerfanos: los que solo preceden reglas quitadas
        for i, (est, n) in enumerate(vivos_por_pos):
            if est != "c" or not re.match(r"/\*\s*\d", n["texto"]): continue
            sig = []
            for est2, n2 in vivos_por_pos[i + 1:]:
                if est2 == "c": break
                sig.append(est2)
            if sig and all(e == "x" for e in sig): corta(n["ini"], hasta_fin_linea(s, n["fin"]))
        return all(e != "v" for e, _ in vivos_por_pos if e != "c") and any(e == "x" for e, _ in vivos_por_pos)

    def usa_animacion(nm):
        for n in recorre(nodos):
            if n["tipo"] != "rule": continue
            for d in n["decls"]:
                if d["tipo"] == "decl" and d["prop"] in ("animation", "animation-name") and (d["ini"], d["fin"]) not in decl_antiguas and (d["ini"], d["fin"]) not in muertas:
                    if re.search(r"(?<![\w-])" + re.escape(nm) + r"(?![\w-])", d["valor"]): return True
        return False

    procesa(nodos)
    s = aplica(s, cortes); cortes = []

if "--comentarios" in sys.argv:
    # documento con cada mejora numerada (seccion, numero, descripcion, primer selector)
    nodos = parsea(s)
    filas, seccion = [], "Base"
    planos = []
    def aplana(lista):
        for n in lista:
            planos.append(n)
            if n.get("hijos"): aplana(n["hijos"])
    aplana(nodos)
    PAT = re.compile(r"/\*\s*(\d{1,3}(?:-\d{1,3})?)((?:\s*\(escritorio\))?(?:\s*y\s*\d{1,3})*)\.\s*(.*?)\s*\*/", re.S)
    for i, n in enumerate(planos):
        if n["tipo"] != "comment": continue
        t = n["texto"]
        if re.search(r"={5,}", t):
            seccion = re.sub(r"\s+", " ", re.sub(r"[=*/]", "", t)).strip()
            continue
        m = PAT.match(t)
        if not m: continue
        extra = re.findall(r"\d{1,3}", m.group(2))
        numero = m.group(1) + (", " + ", ".join(extra) if extra else "")
        sel = next((p["sel"] for p in planos[i + 1:i + 4] if p["tipo"] == "rule"), "")
        filas.append((seccion, numero, re.sub(r"\s+", " ", m.group(3)), re.sub(r"\s+", " ", sel)[:90]))
        corta(n["ini"], n["fin"], "/* " + numero + " */")
    s = aplica(s, cortes); cortes = []
    doc = ["# Mejoras de estilo numeradas (Pauta Activa)", "",
           "En `app/css/style.css` cada mejora lleva solo su número (`/* 392 */`) para que la hoja pese menos; aquí está qué es cada una.",
           "Este documento se generó en la limpieza del 21/11/2026 a partir de los comentarios de la hoja. Al añadir mejoras nuevas, apúntalas aquí con el mismo número.", ""]
    actual = None
    for sec, num, desc, sel in filas:
        if sec != actual:
            doc += ["", "## " + sec[:120], "", "| N.º | Qué hace | Selector |", "|---|---|---|"]; actual = sec
        doc.append("| %s | %s | `%s` |" % (num, desc.replace("|", "\\|"), sel.replace("|", "\\|").replace("`", "'")))
    open(sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else os.path.join(os.path.dirname(__file__), "ESTILOS-MEJORAS.md"), "w").write("\n".join(doc) + "\n")
    # lineas en blanco sobrantes
    s = re.sub(r"\n[ \t]*\n+", "\n", s)

open(sal, "w", encoding="utf-8").write(s)
print("de", len(open(ent, encoding="utf-8").read()), "a", len(s), "bytes")
