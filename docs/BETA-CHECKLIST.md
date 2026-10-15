# Lista de comprobación para la beta · Pauta Activa

Estado en la beta 3 (v0.19.0-beta.3, 2026-10-15). Marcar al completar; lo pendiente es responsabilidad clínica o decisión de producto, no técnica.

## Contenido clínico
- [x] Revisión clínica completa de la base: todas las reglas con `revisado = sí`, fuente y nivel de evidencia (`docs/REVISION-CLINICA-2026-10-15.md`). Pendiente: muestreo del autor (10 % por grupo + todas las de nivel atención).
- [x] Revisión de las 209 interacciones curadas: fuente por fila (`scripts/fuentes_ddi.py`, beta 3) y criterio de inclusión de DDInter (solo mayores/moderadas). Pendiente: muestreo del autor de las de nivel mayor.
- [ ] Ampliar los casos de validación (`app/data/casos.json`) a ≥ 25 viñetas, incluyendo casos "negativos" (sin alertas esperadas) y una por situación clínica.
- [ ] Umbrales de dosis alta (`umbral_mg`) revisados en los principios de riesgo (opioides, benzodiacepinas, diuréticos, insulina, corticoides).
- [x] Regenerar el nomenclátor (`scripts/build_cima.py`) con el XML más reciente de AEMPS; `marcas.json` incluye `cn` (11 102 presentaciones) y el escáner está activo (beta 2).

## Seguridad y privacidad
- [x] Ningún dato sale del dispositivo (verificado: sin fetch/XHR a terceros salvo bibliotecas en cdnjs y Tally abierto por el usuario).
- [x] Formulario de sugerencias sin datos identificativos (lista de principios/dosis y versión).
- [x] Páginas legales (aviso, privacidad, accesibilidad, metodología, regulatorio).
- [ ] Revisión jurídica externa del posicionamiento regulatorio (herramienta informativa vs. producto sanitario según MDR 2017/745, regla 11) y del aviso legal.
- [ ] Política de versiones de la base: quién aprueba cada regeneración y cómo se comunica al usuario (hoy: fecha en `kb.version` y «Novedades»).

## Calidad técnica
- [x] `scripts/test.mjs` 126/126 · `scripts/ui_test.mjs` 122/122 · axe 0 incidencias · Lighthouse móvil ≥ 90, escritorio 100.
- [x] Sin conexión: precache de la app y de los datos; aviso de nueva versión.
- [ ] Probar en dispositivos reales: iOS Safari (instalación, dictado, cámara), Android Chrome (BarcodeDetector), lectores de pantalla (VoiceOver/TalkBack) en el flujo de medicación y SPPB.
- [ ] Prueba de carga con listas largas (≥ 20 fármacos) y nomenclátor completo en móviles de gama baja.
- [ ] Revisar traducciones EN/CA/GL/EU por hablantes nativos (en especial los textos clínicos del cribado, SPPB y zona).

## Experiencia de usuario
- [ ] Prueba con 5–8 pacientes reales (mayores, polimedicados) y 3–5 profesionales (medicina interna, AP, fisioterapia, CAFD): tarea «introduce tu medicación y descarga tu plan» sin ayuda; medir tiempo, errores y comprensión de Lo esencial.
- [ ] Revisar el texto de las reglas con criterio de lectura fácil (frases cortas, sin siglas sin explicar) en el modo paciente.
- [x] Canal de feedback: hoja dentro de la app con contexto técnico + formulario Tally prerrellenado (beta 2). Pendiente: ritmo de respuesta.

## Publicación
- [x] Etiquetas `v0.16.0-beta.0` … `v0.18.0-beta.2` en git y notas de versión en «Novedades»; pendiente `v0.19.0-beta.3`.
- [ ] Dominio definitivo y HTTPS verificados; `sitemap.xml` y `robots.txt` actualizados.
- [ ] Página de presentación / difusión (FBE) con los límites de la herramienta claramente expuestos.
- [ ] Plan de mantenimiento: regeneración trimestral del nomenclátor, revisión anual de guías (ACSM, ESC, ADA), registro de incidencias.
