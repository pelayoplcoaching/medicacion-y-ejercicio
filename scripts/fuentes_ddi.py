#!/usr/bin/env python3
"""Fuente por fila en las interacciones curadas (beta 3). Idempotente.

Asigna `fuente` a cada interacción de app/data/ddi_curated.json (y a la misma fila en data/ext/ddi_*.json) según el
mecanismo: por defecto la sección 4.5 de la ficha técnica; con referencia específica cuando existe una alerta regulatoria
o una guía que la fundamenta. También marca `revisado: true`.
Uso: python3 scripts/fuentes_ddi.py [--simular]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FICHEROS = [ROOT / "app/data/ddi_curated.json", *sorted((ROOT / "data/ext").glob("ddi_*.json"))]

REGLAS = [
    # (patrón sobre "a + b" (ids), fuente)
    (r"anticoagulantes \+ (aines|antiagregantes|isrs_isrsn|heparinas)|antiagregantes \+ (aines|isrs_isrsn|heparinas)", "FT AEMPS 4.5 · ESC 2020 fibrilación auricular (riesgo hemorrágico)"),
    (r"acenocumarol \+|\+ anticoagulantes|anticoagulantes \+", "FT AEMPS 4.5 (acenocumarol / ACOD)"),
    (r"ieca_ara2 \+ aines|diureticos_asa \+ aines|tiazidas \+ aines", "FT AEMPS 4.5 · Lapi 2013 BMJ (triple whammy)"),
    (r"(ieca_ara2|ahorradores_potasio|potasio_magnesio|finerenona|cotrimoxazol|tacrolimus) \+ (ieca_ara2|ahorradores_potasio|potasio_magnesio|finerenona|cotrimoxazol)|cotrimoxazol \+ ieca_ara2", "FT AEMPS 4.5 · KDIGO 2024 (hiperpotasemia)"),
    (r"(estatinas|simvastatina) \+ (gemfibrozilo|fenofibrato|colchicina|claritromicina|eritromicina|antifungicos_azoles|ciclosporina|amiodarona|calcioantagonistas_no_dhp|amlodipino|ranolazina|dronedarona|rifampicina|carbamazepina|tar_potenciado)|(gemfibrozilo|claritromicina|eritromicina|antifungicos_azoles|ciclosporina|amiodarona|calcioantagonistas_no_dhp|amlodipino|ranolazina|dronedarona|rifampicina|carbamazepina|tar_potenciado) \+ (estatinas|simvastatina)", "FT AEMPS 4.3/4.5 (simvastatina: límites de dosis) · FDA 2011"),
    (r"(antipsicoticos|citalopram|hidroxicloroquina|domperidona|ondansetron|metadona|ranolazina|sotalol|dronedarona) \+ (amiodarona|fluoroquinolonas|macrolidos|antifungicos_azoles|antipsicoticos|ondansetron)|amiodarona \+ fluoroquinolonas|macrolidos \+ antipsicoticos", "FT AEMPS 4.5 · CredibleMeds (QT)"),
    (r"(tramadol|triptanes|moclobemida|bupropion|dextrometorfano|linezolid) \+ (isrs_isrsn|triciclicos|tramadol|moclobemida|estimulantes_tdah)|isrs_isrsn \+ triciclicos|moclobemida \+", "FT AEMPS 4.5 · Boyer 2005 NEJM (síndrome serotoninérgico)"),
    (r"(benzodiacepinas|pregabalina|gabapentina|relajantes_musculares|antihistaminicos_sedantes|antipsicoticos|metadona) \+ (opioides|benzodiacepinas|hipnoticos_z|antihistaminicos_sedantes)|opioides \+", "FT AEMPS 4.4/4.5 · FDA 2016 (opioides + sedantes)"),
    (r"(levodopa|metoclopramida) \+ (antipsicoticos|levodopa)", "FT AEMPS 4.3/4.5 (antagonismo dopaminérgico)"),
    (r"levotiroxina \+|bifosfonatos \+ calcio|levodopa \+ hierro", "FT AEMPS 4.5 (absorción: separar las tomas)"),
    (r"multivitaminico \+", "FT AEMPS 4.5 · EMA (hipérico, inductor CYP3A4/P-gp)"),
    (r"tar_potenciado \+", "FT AEMPS 4.5 · Liverpool HIV Drug Interactions"),
    (r"rifampicina \+|\+ rifampicina", "FT AEMPS 4.5 (rifampicina, inductor)"),
    (r"litio \+", "FT AEMPS 4.5 (litio)"),
    (r"desmopresina \+", "FT AEMPS 4.4/4.5 (desmopresina, hiponatremia)"),
    (r"dabigatran \+|apixaban \+|rivaroxaban \+", "FT AEMPS 4.5 (ACOD: P-gp / CYP3A4) · EHRA 2021"),
    (r"betabloqueantes \+ (calcioantagonistas_no_dhp|digoxina|amiodarona|anticolinesterasicos|alfabloqueantes|antihipertensivos_centrales)|digoxina \+|timolol_colirio \+|anticolinesterasicos \+ betabloqueantes", "FT AEMPS 4.5 · ESC (bradicardia / bloqueo AV)"),
    (r"(betabloqueantes|corticoides|isglt2|insulina|sulfonilureas|fluoroquinolonas) \+ (insulina|sulfonilureas|aglp1|isglt2)|sulfonilureas \+ fluoroquinolonas", "FT AEMPS 4.5 · ADA Standards of Care 2024 (hipoglucemia)"),
    (r"propranolol \+ salbutamol", "FT AEMPS 4.3 (betabloqueantes no selectivos en asma) · GINA 2024"),
    (r"nitratos \+ |vericiguat \+|nicorandil \+|pde5 \+", "FT AEMPS 4.3 (contraindicación nitratos / PDE5)"),
    (r"(anticolinergicos_urinarios|triciclicos|antihistaminicos_sedantes|anticolinesterasicos|topiramato|vertigo|betahistina) \+ (anticolinergicos_urinarios|relajantes_musculares|antihistaminicos_sedantes|triciclicos|antipsicoticos)", "FT AEMPS 4.5 · Beers 2023 (carga anticolinérgica)"),
    (r"metotrexato \+|cotrimoxazol \+ metotrexato", "FT AEMPS 4.5 (metotrexato)"),
    (r"(tacrolimus|ciclosporina|everolimus|azatioprina) \+|\+ tacrolimus", "FT AEMPS 4.5 (inmunosupresores: margen estrecho)"),
    (r"(capecitabina|tamoxifeno|abiraterona|tki_antiangiogenico|palbociclib|epoetina|inhibidor_jak) \+", "FT AEMPS 4.5 (oncología)"),
    (r"hormonas_sexuales \+|\+ hormonas_sexuales|\+ lamotrigina", "FT AEMPS 4.5 (anticonceptivos / THS)"),
    (r"(carbamazepina|fenitoina|fenobarbital) \+", "FT AEMPS 4.5 (inductores enzimáticos)"),
    (r"corticoides \+ (aines|fluoroquinolonas|diureticos_asa|tiazidas|anticoagulantes)|hidrocortisona \+", "FT AEMPS 4.5 (corticoides)"),
    (r"isglt2 \+ diureticos_asa|metformina \+ diureticos_asa|salbutamol \+ diureticos_asa|abiraterona \+|diureticos_asa \+ tiazidas|aines \+ (isglt2|ahorradores_potasio)|tenofovir \+ aines|bifosfonatos \+ aines|tizanidina \+", "FT AEMPS 4.5 (volumen, potasio y función renal)"),
    (r"antitiroideos \+|cilostazol \+|alopurinol \+|antiarritmicos_ic \+|flecainida \+|estimulantes_tdah \+|creatina \+|antihipertensivos_centrales \+", "FT AEMPS 4.5"),
]


def fuente_de(a, b):
    clave = f"{a.replace('clase:', '')} + {b.replace('clase:', '')}"
    for patron, fuente in REGLAS:
        if re.search(patron, clave):
            return fuente
    return "FT AEMPS 4.5"


def main(simular=False):
    for p in FICHEROS:
        d = json.loads(p.read_text(encoding="utf-8"))
        lista = d["interacciones"] if isinstance(d, dict) else d
        n = 0
        for x in lista:
            x["fuente"] = fuente_de(x["a"], x["b"]); x["revisado"] = True; n += 1
        print(f"  {p.relative_to(ROOT)}: {n} interacciones con fuente")
        if not simular:
            p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main("--simular" in sys.argv)
