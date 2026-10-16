# Lista de comprobación para la beta · Pauta Activa

Estado en la versión 1.0 (v1.0.0, 2026-10-16). Lo pendiente es responsabilidad clínica, jurídica o de difusión del autor. Marcar al completar; lo pendiente es responsabilidad clínica o decisión de producto, no técnica.

## Contenido clínico
- [x] Revisión clínica completa de la base: todas las reglas con `revisado = sí`, fuente y nivel de evidencia (`docs/REVISION-CLINICA-2026-10-15.md`). Muestreo sistemático realizado el 16/10 (349 textos, `docs/MUESTREO-CLINICO-2026-10-16.md`); pendiente: confirmación del autor de las 7 correcciones de contenido/nivel con la hoja de revisión.
- [x] Revisión de las 209 interacciones curadas: fuente por fila (`scripts/fuentes_ddi.py`, beta 3) y criterio de inclusión de DDInter (solo mayores/moderadas). Pendiente: muestreo del autor de las de nivel mayor.
- [x] Casos de validación ampliados a 25 (`app/data/casos.json`), con casos negativos y uno por situación clínica (v1.0).
- [ ] Umbrales de dosis alta (`umbral_mg`) revisados en los principios de riesgo (opioides, benzodiacepinas, diuréticos, insulina, corticoides).
- [x] Regenerar el nomenclátor (`scripts/build_cima.py`) con el XML más reciente de AEMPS; `marcas.json` incluye `cn` (11 102 presentaciones) y el escáner está activo (beta 2).

## Seguridad y privacidad
- [x] Ningún dato sale del dispositivo (verificado: sin fetch/XHR a terceros salvo bibliotecas en cdnjs y Tally abierto por el usuario).
- [x] Formulario de sugerencias sin datos identificativos (lista de principios/dosis y versión).
- [x] Páginas legales (aviso, privacidad, accesibilidad, metodología, regulatorio).
- [x] Revisión jurídica interna del posicionamiento (MDR 2017/745 regla 11, RGPD, LSSI, RC, licencias, marca): `docs/REVISION-JURIDICA-2026-10-16.md`; textos legales y veredicto ajustados. Pendiente: consulta de calificación a la AEMPS, seguro de RC y registro de marca.
- [x] Política de versiones de la base: la app detecta la versión nueva y muestra al usuario qué avisos cambian en su informe y en sus pacientes guardados (v1.0); aprueba el autor.

## Calidad técnica
- [x] `scripts/test.mjs` 126/126 · `scripts/ui_test.mjs` 122/122 · axe 0 incidencias · Lighthouse móvil ≥ 90, escritorio 100.
- [x] Sin conexión: precache de la app y de los datos; aviso de nueva versión.
- [ ] Probar en dispositivos reales: iOS Safari (instalación, dictado, cámara), Android Chrome (BarcodeDetector), lectores de pantalla (VoiceOver/TalkBack) en el flujo de medicación y SPPB.
- [ ] Prueba de carga con listas largas (≥ 20 fármacos) y nomenclátor completo en móviles de gama baja.
- [ ] Revisar traducciones EN/CA/GL/EU por hablantes nativos (en especial los textos clínicos del cribado, SPPB y zona).

## Experiencia de usuario
- [ ] Prueba con 5–8 pacientes reales (mayores, polimedicados) y 3–5 profesionales (medicina interna, AP, fisioterapia, CAFD): tarea «introduce tu medicación y descarga tu plan» sin ayuda; medir tiempo, errores y comprensión de Lo esencial.
- [x] Lectura fácil: índice INFLESZ medido en cada versión (`scripts/legibilidad.mjs`, umbral en `test.mjs`); 50 textos reescritos (v1.0).
- [x] Canal de feedback: hoja dentro de la app con contexto técnico + formulario Tally prerrellenado (beta 2). Pendiente: ritmo de respuesta.

## Publicación
- [x] Etiquetas `v0.16.0-beta.0` … `v0.18.0-beta.2` en git y notas de versión en «Novedades»; pendiente `v0.19.0-beta.3`.
- [ ] Dominio definitivo y HTTPS verificados; `sitemap.xml` y `robots.txt` actualizados.
- [x] Página de presentación (`presentacion.html`) con los límites de la herramienta claramente expuestos (v1.0).
- [ ] Plan de mantenimiento: regeneración trimestral del nomenclátor, revisión anual de guías (ACSM, ESC, ADA), registro de incidencias.
