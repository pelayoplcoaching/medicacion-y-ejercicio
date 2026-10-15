#!/usr/bin/env python3
"""Genera app/data/marcas.json a partir del Nomenclátor de prescripción de la AEMPS (CIMA).

Uso (desde la raíz del repositorio):
    python3 scripts/build_cima.py                              # descarga el nomenclátor y lo procesa
    python3 scripts/build_cima.py data/raw/prescripcion.zip    # usa el zip ya descargado
    python3 scripts/build_cima.py data/raw/Prescripcion.xml    # usa el XML ya extraído
    python3 scripts/build_cima.py --inspeccionar               # solo muestra la estructura del XML (sin escribir)

Fuente: https://listadomedicamentos.aemps.gob.es/prescripcion.zip  (actualización diaria, público, sin clave)
Documentación: https://www.aemps.gob.es/medicamentos-de-uso-humano/nomenclator-de-prescripcion/

Salida: app/data/marcas.json → presentaciones comercializadas cuyo principio activo está en kb.json:
    [{"nombre": "EMCONCOR 5 mg comprimidos", "principios": ["bisoprolol"], "dosis": [5], "unidad": "mg"}, ...]
La app la usa para autocompletar por nombre comercial y para preseleccionar la dosis por comprimido.

Las etiquetas del XML se detectan automáticamente (busca "nomco", "prese", "comercializ", "principio", "dosis", "unidad").
Si la detección falla, ejecute con --inspeccionar y ajuste TAGS_FIJAS.
"""
import io
import json
import re
import sys
import unicodedata
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "app" / "data" / "kb.json"
OUT = ROOT / "app" / "data" / "marcas.json"
OUT_FICHAS = ROOT / "app" / "data" / "fichas.json"
URL = "https://listadomedicamentos.aemps.gob.es/prescripcion.zip"
URL_DICC_PA = "https://listadomedicamentos.aemps.gob.es/DICCIONARIO_PRINCIPIOS_ACTIVOS.xml"

# Etiquetas conocidas del Prescripcion.xml. Se usan si existen; si no, se detectan por nombre parecido.
TAGS_FIJAS = {
    "medicamento": "prescription",
    "nombre": "des_nomco",          # nombre comercial
    "presentacion": "des_prese",    # descripción de la presentación
    "comercializado": "sw_comercializado",
    "pa": "composicion_pa",
    "pa_codigo": "cod_principio_activo",
    "pa_nombre": "nom_principio_activo",
    "pa_dosis": "dosis_pa",
    "pa_unidad": "unidad_dosis_pa",
}
# Pistas para detectar cada etiqueta cuando la fija no existe (substring, sin mayúsculas)
PISTAS = {
    "nombre": ["nomco", "nombre_com", "nom_med", "nombre"],
    "presentacion": ["prese", "presentacion"],
    "comercializado": ["comercializ"],
    "pa": ["composicion_pa", "principio_activo", "principioactivo", "principio"],
    "pa_codigo": ["cod_principio", "codigo_principio", "cod_pa"],
    "pa_nombre": ["nom_principio", "nombre_principio", "des_principio", "nom_pa", "nombre"],
    "pa_dosis": ["dosis"],
    "pa_unidad": ["unidad"],
}


def quitar_acentos(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def local(tag: str) -> str:
    """Nombre de etiqueta sin espacio de nombres."""
    return tag.split("}", 1)[1] if "}" in tag else tag


def iter_local(el, tag):
    """Como el.iter(tag) pero ignorando el espacio de nombres (el XML de la AEMPS lo lleva)."""
    for e in el.iter():
        if local(e.tag) == tag:
            yield e


ESTOP = {"terapia", "hormonal", "combinado", "menopausia", "cefalosporina", "progestageno", "estradiol", "estrogenos", "insulina", "heparina", "hierro", "calcio", "vitamina", "potasio", "magnesio", "regular", "basal", "rapida", "mezcla", "analogo", "humana", "otros", "otras", "sedante", "clasico", "depot", "colirio", "tratamiento"}


UNIDADES = {"mg": "mg", "g": "g", "gramos": "g", "microgramos": "mcg", "microgramo": "mcg", "mcg": "mcg", "µg": "mcg", "ug": "mcg",
            "ui": "UI", "u.i.": "UI", "unidades internacionales": "UI", "unidades": "UI", "u": "UI"}
UNIDAD_KB = {}  # id de principio → unidad de kb.json (sin sufijo /semana…)


def convertir(dosis, unidad_aemps: str, pid: str):
    """Convierte la dosis a la unidad del principio en kb.json; None si no es comparable."""
    if dosis is None:
        return None
    if "/" in (unidad_aemps or ""):  # concentraciones (mg/ml): no son dosis por toma
        return None
    u = UNIDADES.get((unidad_aemps or "").strip().lower())
    k = UNIDADES.get(UNIDAD_KB.get(pid, "mg").split("/")[0].strip().lower(), "mg")
    if k == "UI" or u == "UI":  # insulinas, heparinas, epoetina: la dosis la pone el paciente, nunca la presentación
        return None
    if u == k:
        return dosis
    f = {("mcg", "mg"): 1e-3, ("g", "mg"): 1e3, ("mg", "mcg"): 1e3, ("mg", "g"): 1e-3, ("g", "mcg"): 1e6}.get((u, k))
    return round(dosis * f, 4) if f else None


ATC_CLASE = {}  # prefijo ATC → id de clase (de kb.json); se aplica el prefijo más largo que coincida
# códigos que comparten prefijo con una clase pero no pertenecen a ella clínicamente
ATC_EXCLUIR = {
    "B01AC09", "B01AC11", "B01AC21", "B01AC27",   # prostaciclinas (hipertensión pulmonar), no antiagregantes
    "J05AF08", "J05AF10", "J05AF11",              # adefovir, entecavir, telbivudina: hepatitis B, no VIH
    "J01AA12",                                     # tigeciclina IV
    "N05CD08",                                     # midazolam (hospital)
    "G03CA04",                                     # estriol (uso vaginal)
    "M01AX05", "M01AX25",                          # glucosamina, condroitín: no son AINE
    "J01CR05",                                     # piperacilina/tazobactam IV
    "G03AD01", "G03AD02", "G03XB02",               # anticoncepción de urgencia / ulipristal: no es terapia continuada
}


def clase_por_atc(cod: str):
    cod = (cod or "").strip().upper()
    if cod in ATC_EXCLUIR:
        return None
    for n in range(len(cod), 2, -1):
        c = ATC_CLASE.get(cod[:n])
        if c:
            return c
    return None


def cargar_alias_kb():
    """Mapa de nombre de principio (sin acentos, minúsculas) → id de kb.json.
    Incluye el nombre, el id y sinónimos frecuentes del nomenclátor (sales, DCI)."""
    kb = json.loads(KB.read_text(encoding="utf-8"))
    alias = {}
    for clase in kb["clases"]:
        for pref in clase.get("atc") or []:
            ATC_CLASE[pref.upper()] = clase["id"]
    for clase in kb["clases"]:
        for p in clase["principios"]:
            UNIDAD_KB[p["id"]] = p.get("unidad") or "mg"
            alias[quitar_acentos(p["id"].replace("_", " "))] = p["id"]
            base = re.sub(r"\(.*?\)", "", p["nombre"]).strip()
            alias[quitar_acentos(base)] = p["id"]
            # "Finasterida / dutasterida", "Cefalosporina oral (cefuroxima, cefixima)", "Doxiciclina / minociclina"…
            for trozo in re.split(r"[(),/]| o | y |\+", p["nombre"]):
                t = quitar_acentos(trozo.strip())
                t = re.sub(r"\b(oral|orales|transdermico|inyectable|inhalado|colirio|topico|topica|nasal|con|sin|de|la|el|los|las|solo|sola|en|para)\b", "", t)
                t = " ".join(t.split())
                if len(t) >= 5 and " " not in t and not t.startswith("anti") and t not in ESTOP:
                    alias.setdefault(t, p["id"])
            for s in p.get("sinonimos", []) or []:
                alias[quitar_acentos(s)] = p["id"]
    # sinónimos manuales nomenclátor → id (None = componente que no interesa, p. ej. inhibidor de descarboxilasa)
    extra = {
        "acido acetilsalicilico": "aas",
        "insulina glargina": "insulina_basal", "insulina detemir": "insulina_basal", "insulina degludec": "insulina_basal",
        "insulina isofanica": "insulina_basal", "insulina humana isofanica": "insulina_basal",
        "insulina aspart": "insulina_rapida", "insulina asparta": "insulina_rapida", "insulina glulisina": "insulina_rapida", "insulina lispro": "insulina_rapida",
        "insulina degludec": "insulina_basal", "insulina detemir": "insulina_basal", "insulina glargina": "insulina_basal", "insulina humana isofanica": "insulina_basal",
        "nicotina": "nicotina_sustitutiva", "nicotina resinato": "nicotina_sustitutiva", "nicotina bitartrato": "nicotina_sustitutiva", "insulina lispro": "insulina_rapida", "insulina glulisina": "insulina_rapida",
        "insulina humana": "insulina_rapida",
        "levodopa": "levodopa", "carbidopa": None, "benserazida": None, "entacapona": None,
        "isosorbida mononitrato": "mononitrato_isosorbida", "mononitrato de isosorbida": "mononitrato_isosorbida",
        "acido zoledronico": "zoledronico", "acido alendronico": "alendronato", "acido risedronico": "risedronato", "acido ibandronico": "ibandronato",
        "acido valproico": "valproato", "valproato sodico": "valproato",
        "hierro": "hierro_oral", "sulfato ferroso": "hierro_oral", "hierro sacarosa": None,
        "colecalciferol": "vitamina_d", "calcifediol": "vitamina_d",
        "calcio carbonato": "calcio_vitd",
        "fentanilo": "fentanilo", "buprenorfina": "buprenorfina",
        "salmeterol": "laba_ics", "formoterol": "laba_ics", "vilanterol": "laba_ics",
        "budesonida": "laba_ics", "fluticasona": "laba_ics", "beclometasona": "laba_ics",
        "tiotropio": "lama", "glicopirronio": "lama", "umeclidinio": "lama", "aclidinio": "lama",
        "sacubitrilo": "sacubitrilo_valsartan",
        "alirocumab": "evolocumab", "inclisiran": "evolocumab",
        "icosapento de etilo": "omega3", "omega 3": "omega3",
        "naloxona": None, "paracetamol": "paracetamol",
        # nomenclátor AEMPS: nombres invertidos y componentes que no interesan
        "acetilsalicilico acido": "aas", "acetilsalicilico": "aas", "lisina acetilsalicilato": "aas",
        "clavulanato potasio": None, "clavulanico acido": None, "clavulanato": None,
        "etinilestradiol": "anticonceptivo_combinado", "estradiol": "ths_estrogenos", "estradiol valerato": "ths_estrogenos",
        "drospirenona": None, "levonorgestrel": "progestageno_solo", "desogestrel": "progestageno_solo", "dienogest": None,
        "gestodeno": None, "norgestimato": None, "noretisterona": None, "nomegestrol": None, "clormadinona": None, "ciproterona": None,
        "potasio cloruro": "potasio_oral", "cloruro potasio": "potasio_oral", "potasio": "potasio_oral",
        "calcio": "calcio_vitd", "calcio carbonato": "calcio_vitd", "carbonato calcico": "calcio_vitd", "calcio citrato": "calcio_vitd",
        "magnesio": "magnesio_oral", "magnesio oxido": "magnesio_oral", "magnesio pidolato": "magnesio_oral",
        "oxigeno": None, "oxido nitroso": None, "sodio cloruro": None, "sodio": None, "glucosa": None, "glucosa monohidrato": None,
        "sodio bicarbonato": None, "agua": None, "agua para inyectables": None, "clorhexidina": None, "clorhexidina digluconato": None,
        "inmunoglobulina humana normal": None, "albumina humana": None,
        "cefuroxima": "cefalosporina", "cefixima": "cefalosporina", "cefadroxilo": "cefalosporina", "cefalexina": "cefalosporina", "cefditoreno": "cefalosporina",
        "minociclina": "doxiciclina", "fosfomicina": "nitrofurantoina", "fosfomicina trometamol": "nitrofurantoina",
        "trimetoprima": "cotrimoxazol", "sulfametoxazol": None,
        "dutasterida": "finasterida", "vibegron": "mirabegron",
        "cetirizina": "antihistaminico_no_sedante", "levocetirizina": "antihistaminico_no_sedante", "loratadina": "antihistaminico_no_sedante",
        "desloratadina": "antihistaminico_no_sedante", "bilastina": "antihistaminico_no_sedante", "ebastina": "antihistaminico_no_sedante",
        "fexofenadina": "antihistaminico_no_sedante", "rupatadina": "antihistaminico_no_sedante",
    }
    for k, v in extra.items():
        alias.setdefault(k, v)
    return alias


SALES = r"\b(hidrocloruro|clorhidrato|sodico|sodica|potasico|calcico|magnesico|mesilato|maleato|tartrato|succinato|besilato|hemifumarato|fumarato|bromuro|acetato|sulfato|fosfato|cilexetilo|medoxomilo|etexilato|citrato|monohidrato|dihidrato|trihidrato|anhidro|anhidra|micronizado|micronizada|axetilo|pivoxilo|propanodiol|hemihidrato|sesquihidrato|hidrobromuro|bromhidrato|lactato|gluconato|carbonato|hidroxido|trometamol|dipropionato|furoato|propionato|valerato|cipionato|enantato|undecanoato|palmitato|pamoato|decanoato|hiclato|disodico|dipotasico|tosilato|camsilato|oxalato|benzoato|estearato|dihidrocloruro|monohidrocloruro|de|del)\b"


def limpiar_pa(nombre: str) -> str:
    """Nombre de principio activo sin la sal, en mayúscula inicial: 'LURASIDONA HIDROCLORURO' → 'Lurasidona'."""
    n = re.sub(r"[,;:()]", " ", nombre.lower())
    n = re.sub(SALES, "", quitar_acentos(n))
    n = " ".join(n.split()) or nombre.lower()
    return n[:1].upper() + n[1:]


def resolver(nombre_pa: str, alias: dict):
    n = quitar_acentos(nombre_pa)
    n = re.sub(r"[,;:()]", " ", n)
    n = re.sub(SALES, "", n)
    n = " ".join(n.split())
    if n in alias:
        return alias[n]
    # "ibandronico acido" (orden del nomenclátor) → "acido ibandronico" / "ibandronico"
    if n.endswith(" acido"):
        r = n[:-6].strip()
        for cand in ("acido " + r, r):
            if cand in alias:
                return alias[cand]
    # por la primera palabra (p. ej. "metoprolol tartrato" → metoprolol); la clave debe existir, aunque sea None
    primera = n.split(" ")[0] if n else ""
    if primera in alias:
        return alias[primera]
    return "?"


def descargar(url: str) -> bytes:
    print(f"Descargando {url} …")
    req = urllib.request.Request(url, headers={"User-Agent": "medicacion-y-ejercicio/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def leer_xml(origen: str | None):
    """Devuelve (bytes del XML principal, bytes del diccionario de principios activos o None)."""
    data = descargar(URL) if origen is None else Path(origen).read_bytes()
    dicc = None
    if data[:2] == b"PK":  # zip
        z = zipfile.ZipFile(io.BytesIO(data))
        xmls = [n for n in z.namelist() if n.lower().endswith(".xml")]
        if not xmls:
            sys.exit(f"El zip no contiene ningún XML: {z.namelist()}")
        nombre = next((n for n in xmls if "prescripcion" in n.lower()), xmls[0])
        print(f"Ficheros del zip: {', '.join(z.namelist())}")
        print(f"Usando {nombre}")
        data = z.read(nombre)
        d = next((n for n in xmls if "principio" in n.lower()), None)
        if d:
            print(f"Diccionario de principios activos: {d}")
            dicc = z.read(d)
    if dicc is None:
        # el diccionario puede estar junto al xml descargado a mano, o en la web de la AEMPS
        if origen:
            for cand in Path(origen).parent.glob("*.xml"):
                if "principio" in cand.name.lower():
                    print(f"Diccionario de principios activos: {cand}")
                    dicc = cand.read_bytes()
                    break
        if dicc is None:
            try:
                dicc = descargar(URL_DICC_PA)
            except Exception as e:  # noqa: BLE001
                print(f"  (no se pudo descargar el diccionario: {e})")
    return data, dicc


def cargar_diccionario_pa(data: bytes | None) -> dict:
    """Código de principio activo → nombre, leyendo el DICCIONARIO_PRINCIPIOS_ACTIVOS.xml de la AEMPS.
    Detecta la estructura: la "entrada" es la etiqueta más repetida cuyos hijos son hojas con texto; dentro,
    el código es la etiqueta con "cod" (texto numérico) y el nombre la primera hoja con texto no numérico."""
    if not data:
        return {}
    root = ET.fromstring(data)

    def es_num(t):
        return t.replace(".", "").replace(",", "").isdigit()

    # candidatos a entrada: elementos con ≥2 hijos hoja con texto
    cand = Counter()
    for e in root.iter():
        hojas = [h for h in e if len(h) == 0 and (h.text or "").strip()]
        if len(hojas) >= 2:
            cand[local(e.tag)] += 1
    if not cand:
        print("  Diccionario: no se encontró ninguna entrada con varios campos")
        return {}
    entrada = cand.most_common(1)[0][0]
    out = {}
    for e in iter_local(root, entrada):
        # Estructura AEMPS (2026): <principiosactivos><nroprincipioactivo>350</nroprincipioactivo>
        #   <codigoprincipioactivo>12A</codigoprincipioactivo><principioactivo>PARACETAMOL</principioactivo>
        # Prescripcion.xml referencia el NUMÉRICO (cod_principio_activo = nroprincipioactivo).
        campos = {local(h.tag).lower(): (h.text or "").strip() for h in e if len(h) == 0 and (h.text or "").strip()}
        cod = campos.get("nroprincipioactivo") or next((v for k, v in campos.items() if ("nro" in k or "cod" in k) and es_num(v)), None)
        nom = campos.get("principioactivo") or next((v for k, v in campos.items() if v != cod and not es_num(v) and "fecha" not in k and not re.fullmatch(r"[\dA-Z]{1,6}", v)), None)
        if cod and nom:
            out[cod] = nom
    print(f"Diccionario: {len(out):,} principios activos (entrada <{entrada}>)")
    if not out:
        print("  Primeras entradas del diccionario, para ajustar el lector:")
        n = 0
        for e in root.iter():
            if n > 40:
                break
            txt = (e.text or "").strip()
            print(f"    {local(e.tag)}" + (f": {txt[:60]}" if txt else ""))
            n += 1
    return out


def detectar_tags(root) -> dict:
    """Devuelve el diccionario de etiquetas, usando las fijas si existen y buscando parecidas si no."""
    presentes = Counter(local(e.tag) for e in root.iter())
    tags = {}

    # 1) elemento "medicamento": la etiqueta fija si existe; si no, el hijo directo del root más repetido
    if presentes.get(TAGS_FIJAS["medicamento"]):
        tags["medicamento"] = TAGS_FIJAS["medicamento"]
    else:
        hijos = Counter(local(h.tag) for h in root)
        tags["medicamento"] = hijos.most_common(1)[0][0]
        print(f"· Etiqueta de medicamento detectada: <{tags['medicamento']}> ({hijos[tags['medicamento']]:,} elementos)")

    primero = next(iter_local(root, tags["medicamento"]))
    campos_med = Counter(local(e.tag) for e in primero.iter())

    def buscar(clave, universo):
        fijo = TAGS_FIJAS[clave]
        if fijo in universo:
            return fijo
        for pista in PISTAS[clave]:
            cands = [t for t in universo if pista in t.lower() and t != tags["medicamento"]]
            if cands:
                print(f"· Etiqueta «{clave}» detectada como <{cands[0]}>")
                return cands[0]
        return None

    for clave in ("nombre", "presentacion", "comercializado", "pa"):
        tags[clave] = buscar(clave, campos_med)
    # campos dentro de cada principio activo
    if tags["pa"]:
        pa0 = next(iter_local(primero, tags["pa"]), None)
        universo_pa = Counter(local(e.tag) for e in pa0.iter()) if pa0 is not None else Counter()
        # quitar la propia etiqueta del principio
        universo_pa.pop(tags["pa"], None)
        for clave in ("pa_codigo", "pa_nombre", "pa_dosis", "pa_unidad"):
            tags[clave] = buscar(clave, universo_pa)
    else:
        for clave in ("pa_codigo", "pa_nombre", "pa_dosis", "pa_unidad"):
            tags[clave] = None
    return tags


def inspeccionar(root):
    hijos = Counter(local(h.tag) for h in root)
    print(f"Raíz: <{local(root.tag)}>  hijos directos: {dict(hijos.most_common(5))}")
    med_tag = hijos.most_common(1)[0][0]
    primero = next(iter_local(root, med_tag))
    print(f"\nPrimer <{med_tag}> (etiqueta → texto):")
    for e in primero.iter():
        txt = (e.text or "").strip()
        if txt:
            print(f"  {local(e.tag)}: {txt[:70]}")
        else:
            print(f"  {local(e.tag)}")
    print("\nEtiquetas detectadas:")
    for k, v in detectar_tags(root).items():
        print(f"  {k}: {v}")


ACORTAR = [
    (r"\bCOMPRIMIDOS? (RECUBIERTOS? )?(CON PELICULA|CON CUBIERTA PELICULAR)\b", "COMPRIMIDOS"),
    (r"\bCOMPRIMIDOS? (DE LIBERACION|DE LIBERACIÓN) (PROLONGADA|MODIFICADA|RETARDADA)\b", "COMP. LIB. PROLONGADA"),
    (r"\bCAPSULAS? DURAS?( DE LIBERACION (PROLONGADA|MODIFICADA))?\b", "CAPSULAS"),
    (r"\bCAPSULAS? BLANDAS?\b", "CAPSULAS"),
    (r"\bCOMPRIMIDOS? BUCODISPERSABLES?\b", "COMP. BUCODISPERSABLE"),
    (r"\bPOLVO (Y DISOLVENTE )?PARA (SOLUCION|SUSPENSION) (INYECTABLE|PARA PERFUSION)( Y PARA PERFUSION)?\b", "INYECTABLE"),
    (r"\bSOLUCION INYECTABLE( Y PARA PERFUSION)?( EN (JERINGA|PLUMA) PRECARGADA)?\b", "INYECTABLE"),
    (r"\bSOLUCION PARA PERFUSION\b", "PERFUSION"),
    (r"\bPOLVO PARA INHALACION( EN CAPSULA DURA)?\b", "INHALADOR"),
    (r"\bSUSPENSION PARA INHALACION EN ENVASE A PRESION\b", "INHALADOR"),
    (r"\bSOLUCION ORAL EN (SOBRES?|FRASCO)\b", "SOLUCION ORAL"),
    (r"\bSOLUCION ORAL EN GOTAS\b", "GOTAS ORALES"),
    (r"\bEN (SOBRES?|FRASCO|ENVASE UNIDOSIS)\b", ""),
    (r"\s{2,}", " "),
]


def acortar(nombre: str) -> str:
    n = nombre.upper()
    for pat, rep in ACORTAR:
        n = re.sub(pat, rep, n)
    return n.strip()


def texto(el, tag):
    if not tag:
        return ""
    # findtext ignora espacios de nombres si la etiqueta no lo lleva; buscamos manualmente
    for e in el.iter():
        if local(e.tag) == tag:
            return (e.text or "").strip()
    return ""


def main(argv):
    solo_inspeccionar = "--inspeccionar" in argv
    args = [a for a in argv if not a.startswith("--")]
    origen = args[0] if args else None

    alias = cargar_alias_kb()
    data, dicc_bytes = leer_xml(origen)
    try:
        root = ET.fromstring(data)
    except ET.ParseError as e:
        sys.exit(f"No se pudo leer el XML: {e}")

    if solo_inspeccionar:
        inspeccionar(root)
        return

    tags = detectar_tags(root)
    dicc = cargar_diccionario_pa(dicc_bytes) if tags.get("pa_codigo") else {}
    faltan = [k for k in ("medicamento", "nombre", "pa") if not tags.get(k)]
    if not tags.get("pa_nombre") and not (tags.get("pa_codigo") and dicc):
        faltan.append("pa_nombre (o pa_codigo + diccionario de principios activos)")
    if faltan:
        inspeccionar(root)
        sys.exit(f"\nNo se detectaron las etiquetas {faltan}. Ajuste TAGS_FIJAS en scripts/build_cima.py.")

    salida, vistos = [], set()
    fichas = {}  # id de principio → URL de la ficha técnica (primera presentación comercializada)
    n_total = n_comerc = n_sin_pa = 0
    sin_resolver = Counter()
    por_atc = Counter()
    for med in iter_local(root, tags["medicamento"]):
        n_total += 1
        com = texto(med, tags["comercializado"]).upper()
        if com not in ("S", "1", "TRUE", "SI", "SÍ", ""):
            continue
        if texto(med, "sw_envase_clinico") == "1":  # envases clínicos de hospital: no los verá un paciente
            continue
        n_comerc += 1
        nombre = texto(med, tags["nombre"]) or texto(med, tags["presentacion"])
        if not nombre:
            continue
        url_ft = texto(med, "url_fictec")
        pas, dosis, unidad = [], [], None
        desconocidos = []  # (nombre PA, dosis, unidad) sin equivalente en la base
        atc = texto(med, "cod_atc")
        for pa in iter_local(med, tags["pa"]):
            nom_pa = texto(pa, tags["pa_nombre"]) if tags.get("pa_nombre") else dicc.get(texto(pa, tags["pa_codigo"]), "")
            pid = resolver(nom_pa, alias)
            if pid == "?":
                if nom_pa:
                    sin_resolver[quitar_acentos(nom_pa)] += 1
                    desconocidos.append((nom_pa, texto(pa, tags["pa_dosis"]), texto(pa, tags["pa_unidad"])))
                continue
            if pid is None:
                continue
            pas.append(pid)
            try:
                d = float(texto(pa, tags["pa_dosis"]).replace(",", "."))
            except ValueError:
                d = None
            dosis.append(convertir(d, texto(pa, tags["pa_unidad"]), pid))
            unidad = unidad or UNIDAD_KB.get(pid, "mg")
        if not pas:
            # sin principio en la base: clasificar por el código ATC (reglas del grupo, sin reglas específicas)
            clase = clase_por_atc(atc) if desconocidos else None
            if clase:
                nombre_pa = " + ".join(dict.fromkeys(limpiar_pa(d[0]) for d in desconocidos))
                d0 = desconocidos[0]
                try:
                    dd = float(d0[1].replace(",", "."))
                except ValueError:
                    dd = None
                u = UNIDADES.get(d0[2].strip().lower())
                if "/" in d0[2] or u == "UI":
                    dd = None
                dd = dd if u == "mg" else (round(dd / 1000, 4) if (u == "mcg" and dd is not None) else (dd * 1000 if (u == "g" and dd is not None) else None))
                if dd is not None and float(dd).is_integer():
                    dd = int(dd)
                clave = (acortar(nombre).upper(), nombre_pa, dd)
                if clave in vistos:
                    continue
                vistos.add(clave)
                fila = {"nombre": acortar(nombre).upper(), "atc": atc, "pa": nombre_pa, "clase": clase}
                if url_ft and "INYECTABLE" not in nombre.upper():
                    fila["ft"] = url_ft
                if dd is not None:
                    fila["dosis"] = [dd]
                salida.append(fila)
                por_atc[clase] += 1
                continue
            n_sin_pa += 1
            continue
        if url_ft and len(pas) == 1 and "INYECTABLE" not in nombre.upper():
            fichas.setdefault(pas[0], url_ft)
        if "anticonceptivo_combinado" in pas:  # etinilestradiol + progestágeno = un solo principio de la base
            dosis = [d for p_, d in zip(pas, dosis) if p_ == "anticonceptivo_combinado"][:1]
            pas = ["anticonceptivo_combinado"]
        nombre = acortar(nombre)
        dosis = [int(d) if d is not None and float(d).is_integer() else d for d in dosis]
        if all(d is None for d in dosis):
            dosis = []
        clave = (nombre.upper(), tuple(pas), tuple(dosis))
        if clave in vistos:
            continue
        vistos.add(clave)
        fila = {"nombre": nombre.upper(), "principios": pas}
        if dosis:
            fila["dosis"] = dosis
        salida.append(fila)

    salida.sort(key=lambda x: x["nombre"])
    if not salida:
        inspeccionar(root)
        sys.exit("\nNo se generó ninguna presentación: revise las etiquetas detectadas arriba.")

    OUT.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_FICHAS.write_text(json.dumps(dict(sorted(fichas.items())), ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(fichas):,} enlaces a fichas técnicas en {OUT_FICHAS.relative_to(ROOT)}")
    print(f"\nMedicamentos en el XML: {n_total:,} · comercializados: {n_comerc:,} · clasificados solo por ATC: {sum(por_atc.values()):,} · sin clase: {n_sin_pa:,}")
    if por_atc:
        print("Clasificados por ATC (grupo): " + ", ".join(f"{c} {n}" for c, n in por_atc.most_common(12)))
    print(f"{len(salida):,} presentaciones guardadas en {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")
    if sin_resolver:
        print("\nPrincipios activos más frecuentes que NO están en kb.json (candidatos a añadir):")
        for nom, n in sin_resolver.most_common(25):
            print(f"  {n:4d}  {nom}")
    # principios desconocidos pero clasificados por ATC: cuáles son, para revisarlos
    if por_atc:
        vistos_pa = Counter((f["clase"], f["pa"]) for f in salida if f.get("clase"))
        print("\nFármacos clasificados por ATC (revisar que el grupo sea correcto):")
        for (c, pa), n in vistos_pa.most_common(40):
            print(f"  {c:28s} {pa}")


if __name__ == "__main__":
    main(sys.argv[1:])
