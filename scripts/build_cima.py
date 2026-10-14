#!/usr/bin/env python3
"""Genera app/data/marcas.json a partir del Nomenclátor de prescripción de la AEMPS (CIMA).

Uso:
    python3 scripts/build_cima.py                # descarga el nomenclátor y lo procesa
    python3 scripts/build_cima.py data/raw/Prescripcion.xml   # usa un XML ya descargado

Fuente: https://listadomedicamentos.aemps.gob.es/prescripcion.zip  (actualización diaria, público, sin clave)
Documentación: https://www.aemps.gob.es/medicamentos-de-uso-humano/nomenclator-de-prescripcion/

Salida: app/data/marcas.json → lista de presentaciones comercializadas cuyo principio activo está en kb.json:
    [{"nombre": "EMCONCOR 5 mg comprimidos", "principios": ["bisoprolol"], "dosis": [5], "unidad": "mg"}, ...]
La app la usa para autocompletar por nombre comercial y para preseleccionar la dosis por comprimido.

Si la AEMPS cambia la estructura del XML, ajuste las etiquetas en TAGS (abajo).
"""
import io
import json
import re
import sys
import unicodedata
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = ROOT / "app" / "data" / "kb.json"
OUT = ROOT / "app" / "data" / "marcas.json"
URL = "https://listadomedicamentos.aemps.gob.es/prescripcion.zip"

# Etiquetas del XML Prescripcion.xml (nomenclátor de prescripción)
TAGS = {
    "medicamento": "prescription",
    "nombre": "des_nomco",          # nombre comercial
    "presentacion": "des_prese",    # descripción de la presentación
    "comercializado": "sw_comercializado",
    "pa_lista": "principios_activos",
    "pa": "principio_activo",
    "pa_nombre": "nom_principio_activo",
    "pa_dosis": "dosis_pa",
    "pa_unidad": "unidad_dosis_pa",
}


def quitar_acentos(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def cargar_alias_kb():
    """Mapa de nombre de principio (sin acentos, minúsculas) → id de kb.json.
    Incluye el nombre, el id y sinónimos frecuentes del nomenclátor (sales, DCI)."""
    kb = json.loads(KB.read_text(encoding="utf-8"))
    alias = {}
    for clase in kb["clases"]:
        for p in clase["principios"]:
            alias[quitar_acentos(p["id"].replace("_", " "))] = p["id"]
            base = re.sub(r"\(.*?\)", "", p["nombre"]).strip()
            alias[quitar_acentos(base)] = p["id"]
    # sinónimos manuales nomenclátor → id
    extra = {
        "acido acetilsalicilico": "aas",
        "insulina glargina": "insulina_basal", "insulina detemir": "insulina_basal", "insulina degludec": "insulina_basal",
        "insulina isofanica": "insulina_basal", "insulina humana isofanica": "insulina_basal",
        "insulina aspart": "insulina_rapida", "insulina lispro": "insulina_rapida", "insulina glulisina": "insulina_rapida",
        "insulina humana": "insulina_rapida",
        "levodopa": "levodopa", "carbidopa": None, "benserazida": None, "entacapona": None,
        "isosorbida mononitrato": "mononitrato_isosorbida", "mononitrato de isosorbida": "mononitrato_isosorbida",
        "acido zoledronico": "zoledronico", "acido alendronico": "alendronato", "acido risedronico": "risedronato",
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
    }
    alias.update(extra)
    return alias


def resolver(nombre_pa: str, alias: dict):
    n = quitar_acentos(nombre_pa)
    n = re.sub(r"\b(hidrocloruro|clorhidrato|sodico|sodica|potasico|calcico|magnesico|mesilato|maleato|tartrato|succinato|besilato|hemifumarato|fumarato|bromuro|acetato|sulfato|fosfato|cilexetilo|medoxomilo|etexilato|citrato)\b", "", n)
    n = " ".join(n.split())
    if n in alias:
        return alias[n]
    # intentar por la primera palabra (p. ej. "metoprolol tartrato" → metoprolol)
    primera = n.split(" ")[0]
    return alias.get(primera)


def main(xml_path: str | None):
    alias = cargar_alias_kb()
    if xml_path:
        data = Path(xml_path).read_bytes()
    else:
        print("Descargando nomenclátor…")
        with urllib.request.urlopen(URL, timeout=120) as r:
            z = zipfile.ZipFile(io.BytesIO(r.read()))
        nombre = next(n for n in z.namelist() if n.lower().endswith(".xml") and "prescripcion" in n.lower())
        data = z.read(nombre)

    root = ET.fromstring(data)
    salida = []
    vistos = set()
    for med in root.iter(TAGS["medicamento"]):
        if (med.findtext(TAGS["comercializado"]) or "").strip().upper() not in ("S", "1", "TRUE", ""):
            continue
        nombre = (med.findtext(TAGS["nombre"]) or med.findtext(TAGS["presentacion"]) or "").strip()
        if not nombre:
            continue
        pas, dosis, unidad = [], [], None
        for pa in med.iter(TAGS["pa"]):
            pid = resolver(pa.findtext(TAGS["pa_nombre"]) or "", alias)
            if pid is None:
                continue
            pas.append(pid)
            try:
                dosis.append(float((pa.findtext(TAGS["pa_dosis"]) or "").replace(",", ".")))
            except ValueError:
                dosis.append(None)
            unidad = unidad or (pa.findtext(TAGS["pa_unidad"]) or "").strip().lower()
        if not pas:
            continue
        clave = (nombre.upper(), tuple(pas))
        if clave in vistos:
            continue
        vistos.add(clave)
        salida.append({"nombre": nombre.upper(), "principios": pas, "dosis": dosis, "unidad": unidad or "mg"})

    salida.sort(key=lambda x: x["nombre"])
    OUT.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(salida):,} presentaciones guardadas en {OUT}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else None)
