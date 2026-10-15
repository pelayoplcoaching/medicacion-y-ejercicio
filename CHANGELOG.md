# Changelog · Pauta Activa

Versionado semántico (`MAYOR.MENOR.PARCHE-fase`). La versión de la aplicación (`app/js/version.js`) es independiente de la versión de la base de conocimiento (`app/data/kb.json` → `version`, fecha de la última regeneración). El detalle para usuarios está en `app/novedades.html`.

## 0.15.0-alfa · 2026-10-15 (alfa 15)
- Cribado preparticipación (algoritmo ACSM 2015) con tres preguntas; resultado en el veredicto, Lo esencial, PDF e historia clínica.
- Prescriptor en modo profesional (nombre, especialidad, centro, nº colegiado) y fecha de reevaluación con aviso al vencer; cabecera, número de documento, QR y bloque de firma en los PDF.
- Casos de validación clínica (`app/data/casos.json`, 10 viñetas) ejecutados en las pruebas y en «Acerca de»; «Guardar como caso de prueba» en modo profesional.
- Nivel de evidencia por regla (ficha técnica / guía / criterios / base / revisión / sin fuente) y columna EVIDENCIA en la hoja de revisión.
- Exportar e importar caso anonimizado (JSON con huella SHA-256), lista de medicación en CSV.
- Páginas legales (`legal.html`): aviso legal, privacidad, declaración de accesibilidad, metodología y limitaciones, posicionamiento regulatorio.
- Índice lateral del informe en escritorio e «Imprimir el plan».
- Auditoría Lighthouse (`docs/lighthouse-2026-10-15.md`): móvil 92/100/100/100, escritorio 100/100/100/100; CLS 0.
- Versionado formal: `version.js`, este CHANGELOG, etiqueta `v0.15.0-alfa`.

## 0.14.0-alfa · 2026-10-15 (alfa 14)
- Chequeo previo a la sesión, conciliación de la lista, constantes en el diario (+CSV), mis días de ejercicio, variantes más fácil/difícil con claves; pictogramas, iconos por grupo terapéutico, tendencia de 8 semanas, transición de pestañas, anillo del cronómetro, indicador sin conexión.

## 0.13.0-alfa · 2026-10-15 (alfa 13)
- Pestaña Mi plan, sesión guiada con cronómetro, progresión, «Añadir tal cual» para productos fuera de la base.

## Anteriores
Alfa 1–12 (2026-10-14 a 2026-10-15): ver `app/novedades.html`.
