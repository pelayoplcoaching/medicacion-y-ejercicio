# Lista de comprobación para la beta · Pauta Activa

Estado al cierre de la última ronda alfa (v0.16.0-beta.0, 2026-10-15). Marcar al completar; lo pendiente es responsabilidad clínica o decisión de producto, no técnica.

## Contenido clínico
- [ ] Revisión clínica completa de la base (hoja `export_revision.py`): todas las reglas con `revisado = sí`, fuente y nivel de evidencia. Prioridad: clases con más uso (cardiovascular, diabetes, anticoagulación, psicofármacos) y las 10 situaciones nuevas de beta 0.
- [ ] Revisión de las 209 interacciones curadas (`data/ddi_curated.json`) y criterio de inclusión de DDInter (solo mayores/moderadas).
- [ ] Ampliar los casos de validación (`app/data/casos.json`) a ≥ 25 viñetas, incluyendo casos "negativos" (sin alertas esperadas) y una por situación clínica.
- [ ] Umbrales de dosis alta (`umbral_mg`) revisados en los principios de riesgo (opioides, benzodiacepinas, diuréticos, insulina, corticoides).
- [ ] Regenerar el nomenclátor (`scripts/build_cima.py`) con el XML más reciente de AEMPS; comprobar que `marcas.json` incluye `cn` para activar el escáner.

## Seguridad y privacidad
- [x] Ningún dato sale del dispositivo (verificado: sin fetch/XHR a terceros salvo bibliotecas en cdnjs y Tally abierto por el usuario).
- [x] Formulario de sugerencias sin datos identificativos (lista de principios/dosis y versión).
- [x] Páginas legales (aviso, privacidad, accesibilidad, metodología, regulatorio).
- [ ] Revisión jurídica externa del posicionamiento regulatorio (herramienta informativa vs. producto sanitario según MDR 2017/745, regla 11) y del aviso legal.
- [ ] Política de versiones de la base: quién aprueba cada regeneración y cómo se comunica al usuario (hoy: fecha en `kb.version` y «Novedades»).

## Calidad técnica
- [x] `scripts/test.mjs` 126/126 · `scripts/ui_test.mjs` 112/112 · axe 0 incidencias · Lighthouse móvil ≥ 90, escritorio 100.
- [x] Sin conexión: precache de la app y de los datos; aviso de nueva versión.
- [ ] Probar en dispositivos reales: iOS Safari (instalación, dictado, cámara), Android Chrome (BarcodeDetector), lectores de pantalla (VoiceOver/TalkBack) en el flujo de medicación y SPPB.
- [ ] Prueba de carga con listas largas (≥ 20 fármacos) y nomenclátor completo en móviles de gama baja.
- [ ] Revisar traducciones EN/CA/GL por hablantes nativos (en especial los textos clínicos del cribado, SPPB y zona).

## Experiencia de usuario
- [ ] Prueba con 5–8 pacientes reales (mayores, polimedicados) y 3–5 profesionales (medicina interna, AP, fisioterapia, CAFD): tarea «introduce tu medicación y descarga tu plan» sin ayuda; medir tiempo, errores y comprensión de Lo esencial.
- [ ] Revisar el texto de las reglas con criterio de lectura fácil (frases cortas, sin siglas sin explicar) en el modo paciente.
- [ ] Decidir el canal de feedback definitivo (Tally actual vs. formulario propio) y el ritmo de respuesta.

## Publicación
- [ ] Etiqueta `v0.16.0-beta.0` en git y nota de versión en «Novedades» (hecho en el código; falta el push de la etiqueta).
- [ ] Dominio definitivo y HTTPS verificados; `sitemap.xml` y `robots.txt` actualizados.
- [ ] Página de presentación / difusión (FBE) con los límites de la herramienta claramente expuestos.
- [ ] Plan de mantenimiento: regeneración trimestral del nomenclátor, revisión anual de guías (ACSM, ESC, ADA), registro de incidencias.
