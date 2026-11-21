"""Analizador CSS sencillo con posiciones, para limpiar sin reformatear.

Nodos: comment, at (con bloque de reglas o de declaraciones, o sin bloque), rule.
Cada declaracion guarda su texto, posicion (inicio, fin incluido el ';') y si es !important.
"""
import re

AT_REGLAS = {"media", "supports", "layer", "container", "document", "scope", "starting-style"}
AT_DECL = {"font-face", "property", "page", "view-transition", "counter-style", "font-feature-values"}


def _salta_cadena(s, i):
    q = s[i]; i += 1
    while i < len(s):
        if s[i] == "\\": i += 2; continue
        if s[i] == q: return i + 1
        i += 1
    return i


def _hasta(s, i, fin, chars):
    """Avanza hasta el primer caracter de chars a nivel 0 (fuera de cadenas, comentarios, parentesis y corchetes)."""
    prof = 0
    while i < fin:
        c = s[i]
        if c in "\"'": i = _salta_cadena(s, i); continue
        if s.startswith("/*", i):
            j = s.find("*/", i + 2); i = (j + 2) if j >= 0 else fin; continue
        if c in "([": prof += 1
        elif c in ")]": prof -= 1
        elif prof == 0 and c in chars: return i
        i += 1
    return fin


def _cierre(s, i):
    """i apunta a '{'; devuelve la posicion de su '}'."""
    prof = 0
    while i < len(s):
        c = s[i]
        if c in "\"'": i = _salta_cadena(s, i); continue
        if s.startswith("/*", i):
            j = s.find("*/", i + 2); i = j + 2; continue
        if c == "{": prof += 1
        elif c == "}":
            prof -= 1
            if prof == 0: return i
        i += 1
    raise ValueError("llave sin cerrar en %d" % i)


def declaraciones(s, ini, fin):
    out = []
    i = ini
    while i < fin:
        while i < fin and s[i] in " \t\r\n": i += 1
        if i >= fin: break
        if s.startswith("/*", i):
            j = s.find("*/", i + 2); out.append({"tipo": "comment", "ini": i, "fin": j + 2}); i = j + 2; continue
        j = _hasta(s, i, fin, ";{")
        if j < fin and s[j] == "{": raise ValueError("bloque anidado en declaraciones en %d" % j)
        texto = s[i:j].strip()
        f = j + 1 if j < fin else fin
        if texto:
            m = re.match(r"(-{0,2}[A-Za-z][\w-]*)\s*:(.*)$", texto, re.S)
            if m:
                val = m.group(2).strip()
                imp = bool(re.search(r"!\s*important\s*$", val))
                if imp: val = re.sub(r"!\s*important\s*$", "", val).strip()
                out.append({"tipo": "decl", "prop": m.group(1).lower(), "valor": val, "imp": imp, "ini": i, "fin": f})
        i = f
    return out


def parsea(s, ini=0, fin=None, contexto=()):
    fin = len(s) if fin is None else fin
    nodos = []
    i = ini
    while i < fin:
        while i < fin and s[i] in " \t\r\n": i += 1
        if i >= fin: break
        if s.startswith("/*", i):
            j = s.find("*/", i + 2); nodos.append({"tipo": "comment", "ini": i, "fin": j + 2, "texto": s[i:j + 2], "ctx": contexto}); i = j + 2; continue
        if s[i] == "}": raise ValueError("llave suelta en %d" % i)
        if s[i] == "@":
            m = re.match(r"@([\w-]+)", s[i:])
            nombre = m.group(1).lower()
            j = _hasta(s, i, fin, ";{")
            pre = s[i:j].strip()
            if j >= fin or s[j] == ";":
                nodos.append({"tipo": "at", "nombre": nombre, "pre": pre, "ini": i, "fin": j + 1, "ctx": contexto}); i = j + 1; continue
            k = _cierre(s, j)
            nodo = {"tipo": "at", "nombre": nombre, "pre": pre, "ini": i, "fin": k + 1, "bini": j + 1, "bfin": k, "ctx": contexto}
            if nombre in AT_REGLAS:
                nodo["hijos"] = parsea(s, j + 1, k, contexto + (pre,))
            elif nombre.endswith("keyframes"):
                nodo["keyframes"] = True
            elif nombre in AT_DECL:
                nodo["decls"] = declaraciones(s, j + 1, k)
            nodos.append(nodo); i = k + 1; continue
        j = _hasta(s, i, fin, "{;")
        if j >= fin or s[j] == ";": raise ValueError("regla sin bloque en %d: %r" % (i, s[i:i + 60]))
        k = _cierre(s, j)
        sel = s[i:j].strip()
        nodos.append({"tipo": "rule", "sel": sel, "ini": i, "fin": k + 1, "bini": j + 1, "bfin": k, "ctx": contexto, "decls": declaraciones(s, j + 1, k)})
        i = k + 1
    return nodos


def recorre(nodos):
    for n in nodos:
        yield n
        if n.get("hijos"):
            yield from recorre(n["hijos"])


def selectores(sel):
    """Parte una lista de selectores por las comas de nivel 0."""
    out, prof, ini, i = [], 0, 0, 0
    while i < len(sel):
        c = sel[i]
        if c in "\"'": i = _salta_cadena(sel, i); continue
        if c in "([": prof += 1
        elif c in ")]": prof -= 1
        elif c == "," and prof == 0: out.append(sel[ini:i].strip()); ini = i + 1
        i += 1
    out.append(sel[ini:].strip())
    return [x for x in out if x]


def norm_sel(sel):
    return ", ".join(re.sub(r"\s+", " ", x) for x in selectores(sel))
