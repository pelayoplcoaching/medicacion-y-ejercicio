#!/usr/bin/env python3
"""Fábrica de contenido asistida por IA (beta 3): genera el encargo («prompt») para que un modelo de lenguaje
proponga un bloque de la base de conocimiento, que después valida scripts/validar_bloque.py y revisa el autor clínico.

No llama a ninguna API: escribe un fichero Markdown con todo lo que el modelo necesita (esquema exacto del bloque,
señales y condiciones válidas, estilo de redacción, obligación de citar fuente y nivel de evidencia, enlace a la ficha
técnica en CIMA) para pegarlo en Claude, ChatGPT o el modelo que se prefiera. La respuesta (un JSON) se guarda en
data/propuestas/ y se comprueba con validar_bloque.py antes de fusionarla con merge_kb.py.

Uso:
    python3 scripts/propuesta_ia.py --principio lenalidomida --clase quimio_oral_tki
    python3 scripts/propuesta_ia.py --principio tolvaptan --clase NUEVA --nombre-clase "Vaptanes"
    python3 scripts/propuesta_ia.py --ddi "apixaban + claritromicina"
    python3 scripts/propuesta_ia.py --candidatos            # lista los principios frecuentes del nomenclátor sin regla
"""
import argparse
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KB = json.loads((ROOT / "app/data/kb.json").read_text(encoding="utf-8"))
MARCAS = json.loads((ROOT / "app/data/marcas.json").read_text(encoding="utf-8"))
FICHAS = json.loads((ROOT / "app/data/fichas.json").read_text(encoding="utf-8"))
OUT = ROOT / "data/propuestas"
AMBITOS = ["general", "aerobico", "fuerza", "equilibrio"]
CONDICIONES = ["diabetes", "insuficiencia_cardiaca", "renal", "renal_grave", "marcapasos", "osteoporosis", "epoc_asma", "oxigeno", "embarazo", "nyha34", "fevi_baja", "fragil", "prefragil",
               "hipertension", "cardiopatia_isquemica", "fibrilacion_auricular", "aneurisma_aorta", "ictus", "cancer", "artrosis", "epilepsia", "hepatopatia", "obesidad"]


def slug(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def ejemplo_clase():
    c = next(x for x in KB["clases"] if x["id"] == "fluoroquinolonas")
    ej = {k: c[k] for k in ("id", "nombre", "atc", "resumen", "senales") if k in c}
    ej["principios"] = [{k: v for k, v in c["principios"][0].items() if k in ("id", "nombre", "marcas", "umbral_mg")}]
    for amb in AMBITOS:
        ej[amb] = [{k: v for k, v in r.items() if k in ("nivel", "texto", "si", "fuente", "evidencia")} for r in c.get(amb, [])[:2]]
    return ej


def ficha_de(principio):
    pid = slug(principio)
    for p in KB["clases"]:
        for pr in p["principios"]:
            if pr["id"] == pid and pr.get("ficha"):
                return pr["ficha"]
    if pid in FICHAS:
        return FICHAS[pid]
    for m in MARCAS:
        if m.get("ft") and slug(m.get("pa", "")) == pid:
            return m["ft"]
    return f"https://cima.aemps.es/cima/publico/lista.html (buscar «{principio}»)"


def presentaciones(principio):
    pid = slug(principio)
    out = [m["nombre"] for m in MARCAS if pid in [slug(x) for x in m.get("principios", [])] or slug(m.get("pa", "")) == pid]
    return out[:12]


def cabecera():
    return f"""# Encargo para el modelo: propuesta de contenido para Pauta Activa

Eres farmacólogo clínico e internista, y escribes para una aplicación española (Pauta Activa · Medicación y Ejercicio) que, a partir
de la medicación habitual de una persona, le dice qué tener en cuenta para hacer ejercicio aeróbico, de fuerza y de equilibrio.
El resultado lo revisará un médico antes de publicarse. Base actual: versión {KB['version']}, {len(KB['clases'])} grupos, {sum(len(c['principios']) for c in KB['clases'])} principios activos.

## Reglas de redacción (obligatorias)
- Español de España, trato de «usted», frases cortas, sin siglas sin explicar, sin alarmismo. Lenguaje que entienda una persona de 75 años.
- Cada regla: entre 60 y 450 caracteres, accionable (qué hacer, cuándo, cuánto), y empieza por lo más importante.
- Niveles: `info` (útil, no cambia el plan) · `precaucion` (adaptación concreta) · `alerta` (debe tenerse en cuenta antes de entrenar o consultar; no significa que no pueda hacer ejercicio).
- Ámbitos: `general` (antes de empezar), `aerobico`, `fuerza`, `equilibrio`. Entre 1 y 4 reglas por ámbito; «Sin limitación específica.» es una regla válida.
- Cada regla lleva `fuente` (sección de la ficha técnica, p. ej. «FT AEMPS 4.4», o guía con año, p. ej. «ESC 2021 insuficiencia cardíaca») y `evidencia`: `ft` (ficha técnica), `guia` (guía o consenso), `criterios` (Beers, STOPP/START), `base` (base de interacciones), `revision` (criterio clínico sin fuente concreta).
- No inventes efectos adversos ni frecuencias; si la ficha técnica no lo recoge, usa `evidencia: "revision"` y dilo en una nota.
- Condiciones opcionales por regla con `si`: {{"dosis": "alta"}}, {{"edad_min": 65}}, {{"principio": "<id>"}}, {{"condicion": "<una de {', '.join(CONDICIONES)}>"}}.
- Señales válidas (vocabulario común del motor): {', '.join(sorted(KB['senales']))}. Si necesitas una nueva, decláralo en `senales_nuevas` con una etiqueta corta.
- Umbral de dosis alta por principio (`umbral_mg.alta`, en mg/día, o la unidad que indiques con `unidad`): solo si tiene sentido clínico.
- Responde ÚNICAMENTE con un bloque JSON válido (sin comentarios ni texto fuera del JSON), con la estructura del ejemplo.
"""


def encargo_clase(principio, clase, nombre_clase):
    ej = json.dumps(ejemplo_clase(), ensure_ascii=False, indent=1)
    existente = next((c for c in KB["clases"] if c["id"] == clase), None)
    if existente:
        contexto = f"""## Dónde encaja
El principio activo **{principio}** debe incorporarse al grupo existente `{clase}` («{existente['nombre']}»: {existente['resumen']}).
Señales del grupo: {', '.join(existente.get('senales', []))}. Devuelve un bloque `clases_parche` con `id: "{clase}"`, `principios_add` (el principio con `id`, `nombre`, `marcas`, `umbral_mg` si procede y `ficha`) y, solo si el fármaco tiene particularidades que el grupo no cubre, reglas en `general_add`/`aerobico_add`/`fuerza_add`/`equilibrio_add` con `si: {{"principio": "{slug(principio)}"}}`.

```json
{{"clases_parche": [{{"id": "{clase}", "principios_add": [{{"id": "{slug(principio)}", "nombre": "{principio.capitalize()}", "marcas": [], "ficha": "{ficha_de(principio)}"}}], "general_add": []}}]}}
```"""
    else:
        contexto = f"""## Dónde encaja
No existe un grupo adecuado: crea una clase nueva `{slug(nombre_clase or principio)}` («{nombre_clase or principio}») con el principio **{principio}** y, si procede, otros principios del mismo grupo comercializados en España. Estructura exacta (ejemplo real de la base, recortado):

```json
{ej}
```"""
    return f"""{cabecera()}
{contexto}

## Material
- Ficha técnica (CIMA, AEMPS): {ficha_de(principio)} — lee sobre todo 4.2 (posología), 4.4 (advertencias), 4.5 (interacciones), 4.7 (conducción) y 4.8 (reacciones adversas).
- Presentaciones comercializadas que lo contienen: {', '.join(presentaciones(principio)) or 'no encontradas en el nomenclátor'}.
- Pregúntate, por este orden: ¿cambia el pulso o la tensión en esfuerzo? ¿hipoglucemia? ¿sedación o caídas? ¿sangrado? ¿calor y sudoración? ¿músculo, tendón o hueso? ¿riñón e hidratación? ¿QT y electrolitos? ¿horario de la toma respecto a la sesión? ¿interacciones relevantes con lo que esa persona suele tomar?

## Entrega
Solo el JSON. Si algo no está en la ficha técnica ni en una guía, no lo afirmes: márcalo con `evidencia: "revision"` y añade `"nota": "..."` en la regla explicando el razonamiento.
"""


def encargo_ddi(par):
    a, b = [x.strip() for x in re.split(r"\+|,", par, maxsplit=1)]
    return f"""{cabecera()}
## Interacción a documentar
Par: **{a} + {b}**. Devuelve un JSON con una lista de una o varias interacciones en el formato de `data/ext/ddi_*.json`:

```json
[{{"a": "{slug(a)}", "b": "clase:<id_de_clase> o {slug(b)}", "nivel": "mayor|moderada|menor", "efecto": "Qué puede pasar, en una o dos frases.", "accion": "Qué hacer (evitar, separar tomas, vigilar qué, consultar).", "fuente": "FT AEMPS 4.5 (<fármaco>) · <guía/año si procede>"}}]
```
- `a` y `b` son ids de principio (minúsculas, sin acentos) o `clase:<id>` para un grupo entero. Grupos disponibles: {', '.join(c['id'] for c in KB['clases'])}.
- `mayor`: evitar o requiere control estrecho; `moderada`: vigilar o ajustar; `menor`: informativa.
- Fichas técnicas: {ficha_de(a)} · {ficha_de(b)}. Cita la sección 4.5 de la que lo recoja.
- Solo el JSON.
"""


def candidatos():
    ids = {pr["id"] for c in KB["clases"] for pr in c["principios"]}
    cnt = Counter()
    for m in MARCAS:
        if m.get("pa") and m.get("clase"):
            cnt[m["pa"]] += 1
    print("Principios clasificados solo por ATC (heredan el grupo; candidatos a reglas propias):")
    for pa, n in cnt.most_common(40):
        print(f"  {n:4d}  {pa}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--principio")
    ap.add_argument("--clase", help="id de clase existente o NUEVA")
    ap.add_argument("--nombre-clase")
    ap.add_argument("--ddi", help='par "a + b"')
    ap.add_argument("--candidatos", action="store_true")
    a = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    if a.candidatos:
        candidatos(); return
    if a.ddi:
        p = OUT / f"ddi_{slug(a.ddi)}.prompt.md"; p.write_text(encargo_ddi(a.ddi), encoding="utf-8"); print("Encargo escrito en", p.relative_to(ROOT)); return
    if not a.principio:
        ap.error("indique --principio, --ddi o --candidatos")
    clase = a.clase or "NUEVA"
    if clase != "NUEVA" and not any(c["id"] == clase for c in KB["clases"]):
        ap.error(f"la clase {clase} no existe; use NUEVA o uno de: " + ", ".join(c["id"] for c in KB["clases"]))
    p = OUT / f"{slug(a.principio)}.prompt.md"
    p.write_text(encargo_clase(a.principio, clase, a.nombre_clase), encoding="utf-8")
    print("Encargo escrito en", p.relative_to(ROOT))
    print("Siguiente paso: pegue el encargo en el modelo, guarde su JSON como", (OUT / f"{slug(a.principio)}.json").relative_to(ROOT), "y ejecute scripts/validar_bloque.py sobre él.")


if __name__ == "__main__":
    main()
