#!/usr/bin/env python3
"""Cierre de la revisión clínica (beta 2): fuente, nivel de evidencia y estado «revisada» de todas las reglas.

Aplica, sobre las FUENTES (data/ext/*.json y app/data/kb.json), la revisión realizada el 15/10/2026:
  - correcciones de texto (insulina: umbrales de glucosa y ajuste de insulina unificados; benzodiacepinas en mayores;
    paracetamol: dosis máxima);
  - fuente y nivel de evidencia por clase, con ajustes por regla según su contenido (criterios Beers/STOPP en mayores,
    ACSM para intensidad y Valsalva, consensos de diabetes, OMS para volúmenes, FT para efectos adversos concretos);
  - fuente de las reglas combinadas que no la tenían;
  - revisado = true en todas las reglas.
Después ejecuta merge_kb.py. Es idempotente. Uso: python3 scripts/revision_beta2.py [--simular]
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_revision import Fuentes, KB, guardar  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
AMB = ["general", "aerobico", "fuerza", "equilibrio"]

# ---------- fuente por defecto de cada clase: (fuente, evidencia) ----------
FT44 = ("FT AEMPS 4.4", "ft"); FT48 = ("FT AEMPS 4.8", "ft"); FT47 = ("FT AEMPS 4.7", "ft"); FT45 = ("FT AEMPS 4.5", "ft"); FT42 = ("FT AEMPS 4.2", "ft"); FT43 = ("FT AEMPS 4.3", "ft")
ACSM = ("ACSM GETP 11.ª ed., ap. A", "guia")
ADA = ("ADA Standards of Care 2024 (ejercicio)", "guia")
ONCO = ("ACSM 2019 ejercicio y cáncer (Campbell)", "guia")
BEERS = ("Beers 2023", "criterios")
POR_CLASE = {
    # cardiovascular: efectos sobre FC/TA en esfuerzo
    "betabloqueantes": ACSM, "calcioantagonistas_no_dhp": ACSM, "ivabradina": ACSM, "digoxina": ACSM, "amiodarona": FT48, "nitratos": ACSM,
    "alfabloqueantes": ACSM, "antihipertensivos_centrales": ACSM, "vasodilatadores_directos": ACSM, "calcioantagonistas_dhp": ACSM, "ieca_ara2": ACSM,
    "diureticos_asa": ACSM, "tiazidas": ACSM, "ahorradores_potasio": FT44, "antiarritmicos_ic": ("ESC 2020 cardiología del deporte", "guia"),
    "sotalol_dronedarona": FT44, "antianginosos_otros": FT44, "ic_nuevos": FT44, "antiagregantes_vasculares": ("ESC 2017 arteriopatía periférica", "guia"),
    # diabetes y endocrino
    "insulina": ADA, "sulfonilureas": ADA, "metformina": ADA, "isglt2": FT44, "aglp1": ("ADA/EASD 2022 consenso obesidad-DM2", "guia"), "pioglitazona": FT44,
    "idpp4": ADA, "antidiabeticos_otros": FT44, "levotiroxina": FT42, "antitiroideos": FT44, "hidrocortisona_sustitutiva": ("Endocrine Society 2016 insuficiencia suprarrenal", "guia"),
    "hormonas_sexuales": FT44, "testosterona": FT44, "desmopresina": FT44, "orlistat": FT48,
    # lípidos y músculo
    "estatinas": FT44, "fibratos": FT44, "colchicina": FT45, "bempedoico": FT44, "ezetimiba_otros_lipidos": FT48,
    # sangre
    "anticoagulantes": ("ESC 2020 cardiología del deporte", "guia"), "antiagregantes": FT44, "heparinas": FT44, "epo_hematinicos": FT44, "hierro_vitd": FT48, "potasio_magnesio": FT45,
    # SNC
    "benzodiacepinas": FT47, "hipnoticos_z": FT47, "isrs_isrsn": FT44, "triciclicos": FT48, "otros_antidepresivos": FT48, "otros_antidepresivos_2": FT44,
    "antipsicoticos": FT44, "antipsicoticos_clozapina": FT44, "antipsicoticos_depot": FT44, "antiepilepticos": FT47, "antiepilepticos_otros": FT44,
    "levodopa": FT44, "antiparkinsonianos_otros": FT44, "opioides": FT44, "litio": FT44, "estimulantes_tdah": FT44, "anticolinesterasicos": FT44,
    "triptanes": FT43, "preventivos_migrana_cgrp": FT44, "relajantes_musculares": FT47, "antihistaminicos_sedantes": FT47, "melatonina_otros_sueno": FT42,
    "vertigo": FT44, "deshabituacion": FT44, "ansioliticos_no_bzd": FT48,
    # respiratorio
    "broncodilatadores": ("GINA 2024", "guia"), "corticoides_inhalados": ("GINA 2024", "guia"), "respiratorio_otros": FT44, "oxigeno": ("GOLD 2024 / rehabilitación respiratoria", "guia"), "resfriado_tos": FT44,
    # dolor e inflamación
    "aines": FT44, "paracetamol": FT42, "metamizol": FT44, "analgesicos_topicos": FT44, "corticoides": FT48, "antiespasmodicos": FT48, "laxantes": FT42,
    # digestivo, hueso, urológico, oftalmológico, dermatológico
    "ibp": FT44, "digestivo_otros": FT44, "eii_mesalazina": FT44, "bifosfonatos": FT42, "osteoporosis_anabolicos": FT44, "anticolinergicos_urinarios": FT44,
    "urologicos_otros": FT44, "pde5": FT43, "colirios_glaucoma": FT44, "isotretinoina": FT48, "acetazolamida": FT48, "alopurinol": FT42,
    # infecciones e inmunidad
    "fluoroquinolonas": ("FT AEMPS 4.4 · nota AEMPS 2018 quinolonas", "ft"), "macrolidos": FT45, "antifungicos_azoles": FT45, "antirretrovirales": FT45, "tuberculostaticos": FT45,
    "antibioticos_comunes": FT44, "antivirales_herpes": FT44, "hidroxicloroquina": FT44, "metotrexato": FT44, "inmunosupresores_trasplante": FT45, "biologicos_jak": FT44, "farme_sinteticos": FT44,
    # oncología
    "hormonoterapia_cancer_mama": ONCO, "hormonoterapia_prostata": ONCO, "quimio_oral_tki": ONCO, "inmunoterapia_oncologica": FT44, "antiemeticos": FT44,
    # suplementos
    "suplementos_deportivos": ("Revisión clínica (ISSN 2017 creatina; FT de los fármacos citados)", "revision"),
}

# ---------- ajustes por regla según el contenido (el primero que coincide) ----------
AJUSTES = [
    (r"mayores de 65|mayor de 65|en mayores|edad_min", BEERS),
    (r"consenso internacional|tipo 1|insulina basal nocturna|reducir la basal", ("Riddell 2017 Lancet Diabetes Endocrinol (consenso ejercicio DM1)", "guia")),
    (r"HOPE", ("Irwin 2015 J Clin Oncol (ensayo HOPE)", "guia")),
    (r"Vivifrail", ("Vivifrail", "guia")),
    (r"150 min|150 minutos", ("OMS 2020 actividad física", "guia")),
    (r"regla del cuello", ("ACSM GETP 11.ª ed. (enfermedad aguda)", "guia")),
    (r"Valsalva|apnea|isométrico|zonas de pulso|sensación de esfuerzo|escala de Borg|prueba del habla|frecuencia cardíaca máxima|enfriamiento", ACSM),
    (r"rehabilitación cardíaca|rehabilitación respiratoria|claudicación|marcha supervisada", ("ESC/ERS: rehabilitación supervisada", "guia")),
    (r"antiinflamatorio|ibuprofeno|naproxeno|triple whammy", FT45),
    (r"QT|electrolitos|potasio|sodio|magnesio", FT44),
    (r"fotosensib|protección solar|sol intenso", FT48),
    (r"tendón|tendin|Aquiles|rotura", FT44),
    (r"golpe de calor|sudoración|sudar|regular la temperatura|calor", FT44),
    (r"trombosis|pantorrilla", FT44),
    (r"miocarditis|neumonitis|miositis|agranulocitosis|defensas", FT44),
]
SIN_LIMITACION = re.compile(r"^(Sin limitación|Sin precauciones|Indicado\.?$|Seguro\.?$|Recomendable\.?$)", re.I)

# ---------- fuente de las reglas combinadas sin fuente ----------
COMBINADAS = {
    "hipotension_multiple": "ACSM GETP 11.ª ed., ap. A", "hipotension_triple": "ACSM GETP 11.ª ed., ap. A", "sedantes_multiples": "Beers 2023 · STOPP/START v3",
    "caidas_mayor": "Beers 2023 · STOPP/START v3", "bb_hipoglucemia": "ADA Standards of Care 2024 · FT AEMPS 4.4", "triple_whammy": "FT AEMPS 4.5 (IECA/ARA-II, AINE) · Lapi 2013 BMJ",
    "renal_deshidratacion": "KDIGO 2024 ERC", "hiperpotasemia": "FT AEMPS 4.5", "sangrado_multiple": "FT AEMPS 4.5", "qt_multiple": "FT AEMPS 4.5 · CredibleMeds",
    "estatina_fibrato": "FT AEMPS 4.5 (gemfibrozilo contraindicado con estatinas)", "miopatia_multiple": "FT AEMPS 4.5", "corticoide_quinolona": "FT AEMPS 4.4 · nota AEMPS 2018",
    "anticolinergico_multiple": "Beers 2023 (carga anticolinérgica)", "calor_multiple": "FT AEMPS 4.4 · ACSM GETP (calor)", "hiponatremia_multiple": "FT AEMPS 4.4 · Beers 2023",
    "bradicardia_multiple": "ACSM GETP 11.ª ed., ap. A · FT AEMPS 4.5", "serotoninergico_multiple": "FT AEMPS 4.5", "perdida_muscular_multiple": "FT AEMPS 4.8 · OMS 2020",
    "litio_riesgo": "FT AEMPS 4.5 (litio)", "litio_aine": "FT AEMPS 4.5 (litio)", "litio_ieca": "FT AEMPS 4.5 (litio)", "hipopotasemia_multiple": "FT AEMPS 4.5",
    "hipopotasemia_qt": "FT AEMPS 4.4 · CredibleMeds", "trombosis_multiple": "FT AEMPS 4.4", "hipertension_multiple": "ESC 2024 hipertensión", "fotosensibilidad_multiple": "FT AEMPS 4.8",
    "inmunosupresion_multiple": "FT AEMPS 4.4", "fatiga_multiple": "FT AEMPS 4.8", "estimulante_taquicardia": "FT AEMPS 4.5", "renal_metformina": "FT AEMPS 4.2 (metformina) · KDIGO 2024",
    "renal_hiperk": "KDIGO 2024 ERC", "ic_ejercicio": "ESC 2021 insuficiencia cardíaca", "marcapasos_fc": "ESC 2020 cardiología del deporte", "diabetes_bb": "ADA Standards of Care 2024",
    "diabetes_pies": "ADA Standards of Care 2024 (pie diabético)", "osteoporosis_plan": "Beck 2017 (ESSA) ejercicio y osteoporosis", "osteoporosis_sedantes": "Beers 2023 · STOPP/START v3",
    "epoc_bb": "GOLD 2024", "epoc_plan": "GOLD 2024 / GINA 2024", "renal_grave": "KDIGO 2024 ERC", "nyha34": "ESC 2021 insuficiencia cardíaca", "fevi_baja": "ESC 2021 insuficiencia cardíaca",
    "dai_fc": "ESC 2020 cardiología del deporte", "fragil_plan": "Vivifrail · OMS 2020", "prefragil_plan": "Vivifrail · OMS 2020", "embarazo": "ACOG 2020 · OMS 2020",
    "oxigeno_cond": "GOLD 2024 / rehabilitación respiratoria", "renal_acod": "FT AEMPS 4.2 (ACOD) · KDIGO 2024",
}

# ---------- correcciones de texto ----------
CAMBIOS = [
    ("insulina", "general", "Mida la glucosa antes de entrenar. Si está por debajo de 90 mg/dL, tome 15–30 g de hidratos (zumo, 3–4 galletas, plátano) y espere. Si está por encima de 250 mg/dL con cetonas o se encuentra mal, no entrene y consulte.",
     "Mida la glucosa antes de entrenar. Por debajo de 90 mg/dL: tome 10–20 g de hidratos de absorción rápida (zumo, 3–4 galletas, plátano) y espere a que suba. Entre 90 y 125: tome 10 g si va a hacer aeróbico. Entre 126 y 250: puede empezar. Por encima de 250: compruebe cetonas; con cetonas o malestar, no entrene y consulte.", None),
    ("insulina", "general", "Glucosa antes de empezar: por debajo de 90 mg/dL tome 15–30 g de hidratos y espere; entre 90 y 125, tome 10–20 g si va a hacer aeróbico; entre 126 y 250, puede empezar; por encima de 250 con cetonas, no entrene.", None, "ELIMINAR"),
    ("insulina", "general", "Si va a entrenar en las 2 horas siguientes a una comida, hable con su médico o educadora sobre reducir la insulina rápida de esa comida (habitualmente un 25–50 % según la intensidad). No ajuste dosis por su cuenta sin un plan acordado.", None, "ELIMINAR"),
    ("benzodiacepinas", "equilibrio", "En mayores de 65 años las benzodiacepinas duplican el riesgo de caída y fractura de cadera. El entrenamiento de equilibrio y fuerza de piernas es prioritario, siempre con apoyo, y conviene hablar con su médico sobre la posibilidad de reducir o retirar el fármaco.",
     "En mayores de 65 años las benzodiacepinas aumentan claramente el riesgo de caída y de fractura de cadera (en torno a un 50 % más). El entrenamiento de equilibrio y fuerza de piernas es prioritario, siempre con apoyo, y conviene hablar con su médico sobre la posibilidad de reducir o retirar el fármaco.", None),
    ("paracetamol", "general", "No supere 3 g al día de forma continuada (menos si pesa poco, bebe alcohol o tiene enfermedad hepática). Recuerde que muchos preparados 'para el resfriado' también lo contienen.",
     "No supere 3 g al día de forma continuada sin consultarlo (el máximo en adultos sanos es 4 g; menos si pesa poco, bebe alcohol o tiene enfermedad hepática). Recuerde que muchos preparados 'para el resfriado' también lo contienen.", None),
]


def fuente_regla(cid, r):
    txt = r["texto"]
    for patron, fe in AJUSTES:
        if re.search(patron, txt, re.I):
            return fe
    base = POR_CLASE.get(cid, ("Revisión clínica", "revision"))
    if SIN_LIMITACION.match(txt.strip()):
        return (base[0], "revision")
    return base


def main(simular=False):
    f = Fuentes()
    # 1) correcciones de texto
    for cid, amb, texto, nuevo, accion in [(c[0], c[1], c[2], c[3], c[4] if len(c) > 4 else None) for c in CAMBIOS]:
        n = f.regla(cid, amb, texto, nuevo=nuevo, eliminar=(accion == "ELIMINAR"), revisado=True)
        print(f"  {'eliminada' if accion else 'corregida'} {cid}/{amb}: {n} fuente(s)")
    # la regla del consenso de DM1 pasa de info a precaución (es la que queda sobre ajustes de insulina)
    for p, c, tipo in f.clases():
        if c["id"] == "insulina" and tipo == "clase":
            for r in c.get("general", []):
                if r["texto"].startswith("Orientación general que debe pactar"):
                    r["nivel"] = "precaucion"; f.tocados.add(p)
    # 2) fuente, evidencia y revisado en todas las reglas
    vistas = set(); n = 0
    for p, c, tipo in f.clases():
        cid = c["id"]
        for amb in AMB:
            for r in c.get(amb if tipo == "clase" else amb + "_add", []):
                fuente, ev = fuente_regla(cid, r)
                r["fuente"] = fuente; r["evidencia"] = ev; r["revisado"] = True; f.tocados.add(p); n += 1; vistas.add((cid, amb, r["texto"]))
        for pr in c.get("principios", []) + c.get("principios_add", []):
            for amb in AMB:
                for r in pr.get(amb, []) or []:
                    fuente, ev = fuente_regla(cid, r)
                    r["fuente"] = fuente; r["evidencia"] = ev; r["revisado"] = True; f.tocados.add(p); n += 1
    print(f"  reglas con fuente, evidencia y revisado: {n} entradas en fuentes ({len(vistas)} reglas distintas)")
    # 3) reglas combinadas
    m = 0
    for p, d in f.docs.items():
        for r in d.get("reglas_combinadas", []):
            if not r.get("fuente") and r["id"] in COMBINADAS:
                r["fuente"] = COMBINADAS[r["id"]]; f.tocados.add(p); m += 1
            r["revisado"] = True; f.tocados.add(p)
    print(f"  reglas combinadas con fuente añadida: {m}")
    if simular:
        print("(simulación: no se escribe nada)"); return
    for p in f.tocados:
        guardar(p, f.docs[p])
    subprocess.run([sys.executable, str(ROOT / "scripts" / "merge_kb.py")], check=True)


if __name__ == "__main__":
    main("--simular" in sys.argv)
