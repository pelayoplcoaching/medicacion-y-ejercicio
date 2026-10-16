#!/usr/bin/env python3
"""Muestreo clínico de la versión 1.0 (16/10/2026): correcciones derivadas de la lectura de la muestra
(41 reglas de atención, 37 del bloque 10, 112 aleatorias al 10 % por grupo, 60 combinadas y 99 interacciones mayores).
Idempotente; se aplica en las fuentes (data/ext y app/data/kb.json; ddi_curated.json y data/ext/ddi_*.json).
Detalle y razonamiento en docs/MUESTREO-CLINICO-2026-10-16.md.
Uso: python3 scripts/muestreo_v1.py [--simular]
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_revision import Fuentes, cargar, guardar  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DDI_FILES = [ROOT / "app/data/ddi_curated.json", *sorted((ROOT / "data/ext").glob("ddi_*.json"))]

# 1) Textos corregidos: (clase, ámbito, texto antiguo (prefijo único), texto nuevo, fuente, evidencia)
TEXTOS = [
    ("ic_nuevos", "general", "No combine con nitratos ni con fármacos para la disfunción eréctil: la bajada de tensión puede ser grave.",
     "No lo combine con fármacos para la disfunción eréctil (sildenafilo, tadalafilo) ni con riociguat: la bajada de tensión puede ser grave. Si usa nitroglicerina de rescate, tómela sentado y dígaselo a su cardiólogo: con vericiguat la tensión puede bajar más de lo habitual.", "FT AEMPS 4.3/4.4/4.5 (vericiguat)", "ft"),
    ("deshabituacion", "general", "El ejercicio aeróbico de 20–30 minutos reduce el deseo de fumar o beber durante horas: úselo como herramienta en los momentos de más craving.",
     "Un paseo rápido o 10–20 minutos de ejercicio aeróbico reducen el deseo de fumar durante un rato (hasta una hora): úselo como herramienta en los momentos de más ganas.", "Taylor 2007 Addiction (metaanálisis); Haasova 2013", "guia"),
    ("antivirales_herpes", "general", "En la fase aguda del zóster o de un brote con fiebre, descanso relativo; retome el ejercicio progresivamente cuando el dolor lo permita. El ejercicio regular se asocia a menos recurrencias de herpes.",
     "En la fase aguda del zóster o de un brote con fiebre, descanso relativo; retome el ejercicio progresivamente cuando el dolor lo permita.", "Revisión clínica (ACSM GETP 11.ª ed., enfermedad aguda)", "revision"),
]
# 2) Fuente corregida sin cambiar el texto: (clase, ámbito, prefijo del texto, fuente, evidencia)
FUENTES = [
    ("insulina", "general", "Mida la glucosa antes de entrenar. Por debajo de 90 mg/dL", "ADA Standards of Care 2024 · Riddell 2017 Lancet Diabetes Endocrinol (consenso ejercicio DM1)", "guia"),
    ("antipsicoticos", "general", "Da menos sueño y engorda menos que otros antipsicóticos.", "FT AEMPS 4.8 (lurasidona) · criterio clínico (acatisia y actividad)", "revision"),
    ("pde5", "general", "El ejercicio regular, sobre todo aeróbico, mejora la función eréctil por sí mismo.", "Silva 2017 Br J Sports Med (metaanálisis)", "guia"),
    ("triptanes", "general", "El ejercicio aeróbico regular reduce la frecuencia de las migrañas.", "Varkey 2011 Cephalalgia; Amin 2018 J Headache Pain", "guia"),
    ("preventivos_migrana_cgrp", "aerobico", "Indicado; el aeróbico regular es por sí mismo preventivo de la migraña.", "Varkey 2011 Cephalalgia; Amin 2018 J Headache Pain", "guia"),
    ("otros_antidepresivos_2", "general", "El ejercicio regular potencia el efecto antidepresivo.", "Schuch 2016 J Psychiatr Res; NICE NG222", "guia"),
    ("isrs_isrsn", "general", "El ejercicio regular tiene un efecto antidepresivo demostrado y potencia el tratamiento.", "Schuch 2016 J Psychiatr Res; NICE NG222", "guia"),
    ("isrs_isrsn", "aerobico", "Indicado y recomendable; el efecto sobre el ánimo es mayor con sesiones regulares de 30–45 minutos.", "Schuch 2016 J Psychiatr Res; NICE NG222", "guia"),
    ("isrs_isrsn", "fuerza", "Indicado. La fuerza también mejora los síntomas depresivos.", "Gordon 2018 JAMA Psychiatry (metaanálisis fuerza y depresión)", "guia"),
    ("benzodiacepinas", "general", "El ejercicio regular, sobre todo aeróbico y a media tarde, mejora el sueño y la ansiedad", "Kredlow 2015 J Behav Med (ejercicio y sueño); NICE NG222", "guia"),
    ("testosterona", "general", "El entrenamiento de fuerza potencia el efecto del tratamiento sobre músculo y hueso.", "Endocrine Society 2018 (hipogonadismo) · ACSM GETP 11.ª ed.", "guia"),
    ("testosterona", "fuerza", "Muy recomendable: es donde más se nota el beneficio del tratamiento.", "Endocrine Society 2018 (hipogonadismo) · ACSM GETP 11.ª ed.", "guia"),
    ("hormonas_sexuales", "general", "El ejercicio regular reduce el riesgo de trombosis asociado a los estrógenos.", "ESC 2019 embolia pulmonar (factores de riesgo) · ACSM GETP 11.ª ed.", "guia"),
    ("hormonas_sexuales", "fuerza", "Muy recomendable en la menopausia para proteger hueso y masa muscular.", "Beck 2017 (ESSA) ejercicio y osteoporosis", "guia"),
    ("levodopa", "aerobico", "Muy recomendable (caminar rápido, bici, cinta): mejora la movilidad", "Schenkman 2018 JAMA Neurol (SPARX); Osborne 2022 (APTA guía Parkinson)", "guia"),
    ("levodopa", "fuerza", "Indicado, con énfasis en piernas, extensores de espalda", "Osborne 2022 (APTA guía Parkinson)", "guia"),
    ("antiparkinsonianos_otros", "aerobico", "Muy recomendable (cinta, bici, caminar rápido) a intensidad moderada-alta si está en ON.", "Schenkman 2018 JAMA Neurol (SPARX); Osborne 2022 (APTA guía Parkinson)", "guia"),
    ("antiparkinsonianos_otros", "fuerza", "Indicado, con énfasis en piernas, extensores y amplitud de movimiento.", "Osborne 2022 (APTA guía Parkinson)", "guia"),
    ("opioides", "aerobico", "Indicado y recomendable para el dolor crónico;", "Geneen 2017 Cochrane (ejercicio y dolor crónico)", "guia"),
    ("opioides", "fuerza", "Muy recomendable: mejora el dolor y protege músculo y hueso.", "Geneen 2017 Cochrane (ejercicio y dolor crónico)", "guia"),
    ("anticolinergicos_urinarios", "general", "El entrenamiento del suelo pélvico y perder peso mejoran la urgencia urinaria", "EAU 2024 incontinencia (tratamiento conservador)", "guia"),
    ("urologicos_otros", "general", "El entrenamiento del suelo pélvico y la pérdida de peso reducen los síntomas urinarios.", "EAU 2024 incontinencia (tratamiento conservador)", "guia"),
    ("colirios_glaucoma", "aerobico", "Indicado; beneficioso para la presión intraocular.", "Zhu 2018 (metaanálisis ejercicio y PIO) · criterio clínico", "guia"),
    ("eii_mesalazina", "general", "El ejercicio moderado mejora la fatiga y la densidad ósea en la enfermedad inflamatoria intestinal.", "ECCO 2023 (EII, manejo no farmacológico)", "guia"),
    ("inmunosupresores_trasplante", "general", "El ejercicio moderado y regular está indicado tras el trasplante", "KDIGO 2009 trasplante renal (actividad física) · ACSM GETP 11.ª ed.", "guia"),
    ("antirretrovirales", "general", "El ejercicio de fuerza y aeróbico mejora la composición corporal, el colesterol y la salud cardiovascular", "EACS 2023 (comorbilidades) · O'Brien 2016 Cochrane", "guia"),
    ("inmunoterapia_oncologica", "general", "El ejercicio moderado es seguro y mejora la fatiga y la tolerancia al tratamiento", "ACSM 2019 ejercicio y cáncer (Campbell) · ESMO 2020", "guia"),
    ("hidroxicloroquina", "aerobico", "Indicado; mejora la fatiga del lupus y la artritis.", "EULAR 2018 actividad física en artritis/espondiloartritis", "guia"),
    ("metotrexato", "aerobico", "Indicado. Mejora el cansancio que produce la enfermedad inflamatoria.", "EULAR 2018 actividad física en artritis/espondiloartritis", "guia"),
    ("biologicos_jak", "aerobico", "Indicado. Reduce el cansancio que producen las enfermedades inflamatorias.", "EULAR 2018 actividad física en artritis/espondiloartritis", "guia"),
    ("antipsicoticos", "fuerza", "Muy recomendable para contrarrestar el aumento de peso y la pérdida de forma.", "Firth 2019 Lancet Psychiatry (salud física en enfermedad mental)", "guia"),
    ("antipsicoticos_depot", "general", "El ejercicio regular, fuerza incluida, es parte esencial del tratamiento para el aumento de peso", "Firth 2019 Lancet Psychiatry (salud física en enfermedad mental)", "guia"),
    ("antipsicoticos_depot", "fuerza", "Muy recomendable.", "Firth 2019 Lancet Psychiatry (salud física en enfermedad mental)", "guia"),
    ("antipsicoticos_clozapina", "fuerza", "Muy recomendable; cargas moderadas y respiración continua.", "Firth 2019 Lancet Psychiatry (salud física en enfermedad mental)", "guia"),
    ("anticolinesterasicos", "general", "El ejercicio debe hacerse acompañado y con instrucciones sencillas y repetidas.", "Forbes 2015 Cochrane (ejercicio y demencia) · criterio clínico", "guia"),
    ("tuberculostaticos", "fuerza", "Indicado para recuperar la masa muscular perdida con la enfermedad.", "Revisión clínica (OMS 2020 actividad física)", "revision"),
    ("antiagregantes_vasculares", "fuerza", "Recomendable, con énfasis en pantorrillas y piernas.", "ESC 2017 arteriopatía periférica (ejercicio supervisado)", "guia"),
    ("orlistat", "fuerza", "Recomendable para conservar músculo durante la pérdida de peso.", "EASO 2024 · ACSM GETP 11.ª ed.", "guia"),
    ("pioglitazona", "fuerza", "Recomendable, con especial énfasis en piernas y espalda para proteger el hueso.", "FT AEMPS 4.4 (fracturas) · Beck 2017 (ESSA)", "guia"),
    ("pioglitazona", "equilibrio", "Recomendable para prevenir caídas y fracturas.", "FT AEMPS 4.4 (fracturas) · Beck 2017 (ESSA)", "guia"),
    ("corticoides", "aerobico", "Indicado, de intensidad moderada. Caminar rápido o subir escaleras protege también el hueso.", "FT AEMPS 4.8 (osteoporosis) · Beck 2017 (ESSA)", "guia"),
    ("antiepilepticos_otros", "fuerza", "Indicado; fenitoína y fenobarbital a largo plazo debilitan el hueso, la fuerza lo protege.", "FT AEMPS 4.4 (osteomalacia) · Beck 2017 (ESSA)", "guia"),
    ("eii_mesalazina", "fuerza", "Indicado; importante para el hueso si ha tomado corticoides.", "ECCO 2023 · Beck 2017 (ESSA)", "guia"),
    ("heparinas", "equilibrio", "Recomendable, con apoyo si hay inmovilización reciente.", "Revisión clínica", "revision"),
    ("respiratorio_otros", "fuerza", "Muy recomendable en EPOC.", "GOLD 2024 (rehabilitación respiratoria)", "guia"),
    ("estatinas", "aerobico", "Indicado y beneficioso. Las estatinas no reducen la mejora de la forma física", "Revisión clínica (Mikus 2013 JACC; metaanálisis posteriores)", "revision"),
    ("isglt2", "aerobico", "Indicado, y especialmente beneficioso en la insuficiencia cardíaca.", "ESC 2021 insuficiencia cardíaca · FT AEMPS 4.4 (volumen)", "guia"),
    ("inmunoterapia_oncologica", "fuerza", "Recomendable: ayuda a conservar el músculo durante el tratamiento.", "ACSM 2019 ejercicio y cáncer (Campbell)", "guia"),
    ("antirretrovirales", "fuerza", "Muy recomendable.", "EACS 2023 (comorbilidades) · O'Brien 2016 Cochrane", "guia"),
    ("antirretrovirales", "aerobico", "Indicado sin limitación.", "EACS 2023 (comorbilidades) · O'Brien 2016 Cochrane", "guia"),
    ("deshabituacion", "aerobico", "Indicado. Al dejar de fumar, la capacidad para el ejercicio mejora en pocas semanas.", "Revisión clínica", "revision"),
    ("inmunosupresores_trasplante", "fuerza", "Muy recomendable: contrarresta la pérdida de masa muscular y ósea.", "KDIGO 2009 trasplante renal · ACSM GETP 11.ª ed.", "guia"),
    ("inmunosupresores_trasplante", "aerobico", "Indicado a intensidad moderada, con progresión gradual.", "KDIGO 2009 trasplante renal · FT AEMPS 4.4 (infecciones)", "guia"),
]
# 3) Nivel corregido (recomendación prioritaria, no riesgo): alerta → precaución
NIVELES = [
    ("aglp1", "fuerza", "El entrenamiento de fuerza es la parte más importante del plan mientras toma este fármaco", "precaucion"),
    ("bifosfonatos", "equilibrio", "Prevenir caídas es tan importante como el fármaco", "precaucion"),
    ("osteoporosis_anabolicos", "equilibrio", "Prevenir caídas es parte del tratamiento", "precaucion"),
    ("hormonoterapia_prostata", "general", "La fuerza es el tratamiento principal de los efectos de esta medicación", "precaucion"),
]
# 4) Interacciones: (a, b, cambios)
DDI = [
    ("vericiguat", "clase:nitratos", {"nivel": "moderada", "efecto": "Posible bajada de tensión adicional. Los nitratos de acción prolongada se usaron junto a vericiguat en el ensayo principal sin señal de riesgo; la nitroglicerina sublingual no está bien estudiada.", "accion": "No es una contraindicación: su cardiólogo debe conocer la combinación. Tome la nitroglicerina de rescate sentado y levántese despacio.", "fuente": "FT AEMPS 4.4/4.5 (vericiguat) · VICTORIA 2020"}),
    ("vericiguat", "clase:pde5", {"accion": "No recomendado por el riesgo de hipotensión sintomática: evitar la combinación.", "fuente": "FT AEMPS 4.4 (vericiguat)"}),
    ("clase:antiagregantes", "clase:aines", {"accion": "Evitar. Paracetamol como alternativa. Si se usa ibuprofeno, tomarlo al menos 30 minutos después de la aspirina (o 8 horas antes) para no anular su efecto.", "fuente": "FT AEMPS 4.5 · FDA 2006 (ibuprofeno y aspirina) · ESC 2020 FA (riesgo hemorrágico)"}),
]


def buscar_regla(F, cid, amb, prefijo):
    for p, c, tipo in F.clases():
        if c["id"] != cid:
            continue
        for r in c.get(amb if tipo == "clase" else amb + "_add", []):
            if r["texto"].startswith(prefijo):
                yield p, r


def main(simular=False):
    F = Fuentes()
    n = {"textos": 0, "fuentes": 0, "niveles": 0, "ddi": 0}
    pendientes = []
    for cid, amb, viejo, nuevo, fuente, ev in TEXTOS:
        k = 0
        for p, r in buscar_regla(F, cid, amb, viejo):
            r["texto"] = nuevo; r["fuente"] = fuente; r["evidencia"] = ev; F.tocados.add(p); k += 1
        if k: n["textos"] += 1
        elif not any(True for _ in buscar_regla(F, cid, amb, nuevo)): pendientes.append(f"texto {cid}/{amb}")
    for cid, amb, pref, fuente, ev in FUENTES:
        k = 0
        for p, r in buscar_regla(F, cid, amb, pref):
            if r.get("fuente") != fuente or r.get("evidencia") != ev:
                r["fuente"] = fuente; r["evidencia"] = ev; F.tocados.add(p); k += 1
        if k: n["fuentes"] += 1
        elif not any(True for _ in buscar_regla(F, cid, amb, pref)): pendientes.append(f"fuente {cid}/{amb}")
    for cid, amb, pref, nivel in NIVELES:
        k = 0
        for p, r in buscar_regla(F, cid, amb, pref):
            if r["nivel"] != nivel: r["nivel"] = nivel; F.tocados.add(p); k += 1
        if k: n["niveles"] += 1
        elif not any(True for _ in buscar_regla(F, cid, amb, pref)): pendientes.append(f"nivel {cid}/{amb}")
    for a, b, cambios in DDI:
        k = 0
        for p in DDI_FILES:
            d = cargar(p); lista = d["interacciones"] if isinstance(d, dict) else d
            tocado = False
            for x in lista:
                if {x["a"], x["b"]} == {a, b}:
                    for kk, v in cambios.items():
                        if x.get(kk) != v: x[kk] = v; tocado = True
            if tocado:
                k += 1
                if not simular: guardar(p, d)
        if k: n["ddi"] += 1
    print(n, "pendientes:", pendientes or "ninguno")
    if not simular:
        print(F.guardar(), "ficheros de reglas guardados")


if __name__ == "__main__":
    main("--simular" in sys.argv)
