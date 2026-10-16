# Revisión jurídica de Pauta Activa · versión 1.0 (16/10/2026)

**Alcance y límites.** Revisión preparada por Claude a petición del autor, con el marco español y de la Unión Europea vigente a la fecha, leyendo la aplicación, sus textos legales (`app/legal.html`), la presentación, el flujo de datos y las licencias. **No es asesoramiento jurídico ni sustituye a un abogado o a un consultor regulatorio**; su finalidad es dejar identificados los riesgos, priorizarlos, aplicar ya las correcciones que no requieren decisión del autor y señalar con precisión qué debe confirmar un profesional. Las correcciones aplicadas en esta revisión están en el mismo commit (`legal.html`, textos del veredicto en cinco idiomas, `presentacion.html`).

## Resumen ejecutivo

| # | Asunto | Riesgo | Estado |
|---|---|---|---|
| 1 | Calificación como producto sanitario (MDR 2017/745, regla 11) | **Alto** — es el único punto que puede obligar a cambiar el producto | Mitigado en textos; **requiere consulta de calificación a la AEMPS** |
| 2 | Protección de datos (RGPD / LOPDGDD) | Bajo — no hay tratamiento por el titular; quedan matices del modo profesional y del canal de sugerencias | Corregido en `legal.html` |
| 3 | LSSI (identificación del prestador, profesión regulada) | Medio — faltaban datos obligatorios | **Corregido** (colegiación, NIF y domicilio añadidos el 16/10) |
| 4 | Responsabilidad civil y cláusulas de exoneración | Medio | Textos ajustados; **confirmar cobertura del seguro de RC profesional** |
| 5 | Publicidad de medicamentos | Bajo | Sin cambios; criterio documentado |
| 6 | Propiedad intelectual, licencias y datos reutilizados | Bajo | Correcto; añadida atribución explícita |
| 7 | Accesibilidad (RD 1112/2018, Ley 11/2023) | Bajo (no exigible) | Declaración voluntaria correcta |
| 8 | Marca y dominio | Medio | **Búsqueda y registro en OEPM pendientes** |
| 9 | Deontología médica y relación médico-paciente | Bajo | Textos ajustados |

## 1. ¿Es Pauta Activa un producto sanitario? (MDR 2017/745)

**Marco.** El artículo 2.1 del Reglamento (UE) 2017/745 define producto sanitario, entre otros, como el *programa informático* destinado por el fabricante a ser utilizado en personas con fines de «diagnóstico, prevención, seguimiento, predicción, pronóstico, tratamiento o alivio de una enfermedad». La guía MDCG 2019-11 (calificación y clasificación de software) establece cinco pasos: (1) es software; (2) es accesorio o producto en sí; (3) hace algo más que almacenar, archivar, comunicar o buscar (sí: aplica reglas y calcula); (4) actúa en beneficio de pacientes individuales (sí); (5) **tiene finalidad médica según el artículo 2.1** — este es el paso decisivo. La regla 11 del anexo VIII clasifica el software «destinado a proporcionar información utilizada para tomar decisiones con fines diagnósticos o terapéuticos» como clase IIa como mínimo (IIb/III si la decisión puede causar daño grave o muerte).

**Análisis.** Juegan a favor de la calificación como *no* producto sanitario: la finalidad declarada (organizar información pública para preparar una conversación con el médico), la ausencia de diagnóstico, el carácter de prescripción del ejercicio como intervención de estilo de vida (la MDCG 2019-11 excluye el software de bienestar y *fitness*), la no comercialización y el hecho de que en el modo profesional la prescripción la firma y asume el prescriptor. Juegan en contra: la salida es **individualizada** (medicación, dosis, edad, situación clínica, SPPB, FC), contiene **avisos de seguridad** («pare y consulte», «no combine X con Y», interacciones mayores), un **cribado de preparticipación** (algoritmo ACSM) y una **zona de intensidad** por paciente, y el documento profesional se titula «prescripción de ejercicio físico adaptada al tratamiento». Un evaluador podría entender que la información «se utiliza para tomar decisiones con fines terapéuticos» (qué ejercicio hacer con esta medicación), lo que apuntaría a software de clase IIa bajo la regla 11. No existe jurisprudencia española clara sobre apps de este tipo; la práctica de la AEMPS es analizar la finalidad prevista declarada y la funcionalidad real.

**Conclusión.** La posición actual («herramienta informativa, no producto sanitario») es defendible pero no segura. El riesgo real no es sancionador a corto plazo (producto gratuito, sin publicidad, de un médico colegiado, con límites explícitos), sino que un hospital o servicio de salud que quiera adoptarla pida el marcado CE, o que la AEMPS, ante una consulta o una denuncia, la califique como producto sanitario y haya que retirarla o certificarla.

**Correcciones aplicadas.**
- El **veredicto** deja de ser una declaración de aptitud de la persona («Puede hacer ejercicio…») y pasa a describir la medicación («Su medicación no añade precauciones especiales…» / «Su medicación añade N puntos de atención…»), en los cinco idiomas. Es el cambio con más peso: el software informa sobre los fármacos, no «autoriza» al paciente.
- `legal.html` incorpora una **declaración de finalidad prevista** (*intended purpose*) explícita, el razonamiento MDCG 2019-11 y el compromiso de no incorporar funciones de diagnóstico o de ajuste de tratamiento sin reevaluar la calificación.
- Se mantiene que las decisiones las toma el profesional y que el documento profesional es una prescripción del prescriptor, no del programa.

**Pendiente (autor).**
1. **Consulta de calificación a la AEMPS** (Departamento de Productos Sanitarios; procedimiento de consulta sobre calificación, gratuito), aportando la finalidad prevista, capturas y `legal.html`. Es la vía más barata para tener certeza antes de que la use un servicio hospitalario de forma institucional.
2. Si la AEMPS la considera producto sanitario o si se quiere una adopción institucional: certificación de clase IIa (sistema de gestión de calidad ISO 13485, IEC 62304 para el ciclo de vida del software, evaluación clínica, organismo notificado). Coste y plazo relevantes (meses y decenas de miles de euros); valorar entonces una entidad titular distinta de la persona física.
3. Mientras tanto: no usar en la difusión términos como «diagnóstico», «seguro para usted», «tratamiento» o «dispositivo médico»; no vender ni cobrar por la herramienta; mantener el uso institucional como «apoyo informativo» validado por el servicio, no como sistema de ayuda a la decisión clínica integrado en la historia.

## 2. Protección de datos (RGPD y LOPDGDD)

**Hecho relevante:** el titular **no trata datos personales**: no hay servidor propio, cuentas, cookies de seguimiento ni analítica; todo el cálculo y almacenamiento ocurren en el navegador del usuario (`localStorage`, cifrado opcional de la copia de seguridad). Esto sitúa el grueso de la aplicación fuera del ámbito del RGPD para el titular (no es responsable ni encargado de los datos que el usuario guarda en su propio dispositivo).

Matices que sí requieren texto, todos incorporados en `legal.html`:
- **Modo profesional.** Si un médico guarda pacientes (aunque sea con códigos) en su dispositivo, el **responsable del tratamiento es el profesional o su centro**, conforme a su política de dispositivos y a la LOPDGDD; la aplicación no tiene acceso. Se añade esta advertencia y la recomendación de usar códigos, dispositivos corporativos cifrados y borrar al terminar. El CSV de estadísticas y la exportación FHIR son ficheros que el profesional genera y custodia.
- **Canal de sugerencias (Tally).** Es el único flujo en el que el titular recibe datos: lo que el usuario escribe y los datos técnicos (versión, pantalla, lista de principios activos sin identificadores). Tally (Bélgica) actúa como encargado, con alojamiento en la UE y DPA disponible; el correo de contacto (Gmail) implica transferencia a Google LLC bajo el Marco de Privacidad de Datos UE-EE. UU. Base jurídica: interés legítimo (mejora y seguridad de la herramienta) y consentimiento implícito al enviar voluntariamente el formulario. Se informa de ello, del plazo de conservación (mientras dure la revisión del aviso, máximo 24 meses) y de cómo ejercer derechos.
- **Registros de servidor de terceros** (GitHub Pages, cdnjs/Cloudflare, tessdata.projectnaptha.com): pueden registrar la IP al servir archivos estáticos; se informa.
- **Cookies / almacenamiento local.** Solo almacenamiento estrictamente necesario para el funcionamiento (artículo 22.2 LSSI): no requiere banner de consentimiento; se informa en la política.
- **Enlaces `#lista=` / `#ver=` y QR.** Llevan datos de salud sin identificadores en el fragmento de la URL (no viaja al servidor). Quien lo reciba puede leerlo: el usuario decide con quién lo comparte. Se mantiene la advertencia.
- **Menores.** La herramienta no está dirigida a menores; se declara.

**Pendiente (autor).** Firmar/archivar el DPA de Tally (se acepta en su panel), y si el correo de contacto pasa a ser un dominio propio, actualizar el texto.

## 3. LSSI (Ley 34/2002)

Aunque la herramienta es gratuita, se ofrece bajo el dominio de una actividad económica (Fuerza Basada en Evidencia), por lo que aplica el deber de información del **artículo 10**: nombre o denominación, NIF, domicilio o dirección de contacto, correo electrónico y, por tratarse de una **profesión regulada**, colegio profesional, número de colegiado, título y Estado de expedición, y normas profesionales aplicables. `legal.html` incorpora ahora colegio y número (282875610, Ilustre Colegio Oficial de Médicos de Madrid), título y referencia al Código de Deontología Médica. El NIF y el domicilio de contacto se añadieron el mismo día, con lo que el artículo 10 queda cubierto.

## 4. Responsabilidad y cláusulas

Frente a consumidores, las cláusulas que excluyen la responsabilidad por daños causados por negligencia no son válidas (artículos 86 y 130 TRLGDCU). Por eso los textos no «exoneran», sino que **delimitan el servicio**: información general, decisiones del profesional, no uso en urgencias, exactitud de los datos a cargo del usuario, actualización periódica sin garantía de ausencia de errores. Se añade la referencia al estándar de diligencia (fuentes, revisión clínica documentada, pruebas automáticas y aviso de cambios en la base), que es la mejor defensa material. **Pendiente (autor):** comprobar que la póliza de responsabilidad civil profesional (colegial o propia) cubre la «información sanitaria por medios digitales» o la actividad divulgativa; si no, ampliarla; y valorar que la titularidad formal pase a una persona jurídica si la difusión crece.

## 5. Publicidad de medicamentos

La aplicación muestra nombres comerciales del nomenclátor de la AEMPS con fines de identificación, sin promoción, sin enlaces de compra y sin recomendar un medicamento frente a otro: no constituye publicidad de medicamentos de prescripción dirigida al público (artículo 80 del texto refundido de la Ley de garantías, RDL 1/2015, y RD 1416/1994). Debe mantenerse así: nada de patrocinios, enlaces a farmacias o comparativas de marcas.

## 6. Propiedad intelectual, licencias y datos reutilizados

- **Código:** MIT. **Contenido clínico propio:** CC BY-NC-SA 4.0. Coherente con la reutilización de **DDInter 2.0** (CC BY-NC-SA 4.0), cuya cláusula NC se respeta (sin uso comercial) y cuya atribución se añade de forma explícita.
- **Nomenclátor de prescripción (AEMPS):** información pública reutilizable (Ley 37/2007 y condiciones de reutilización de la AEMPS: citar la fuente y no alterar su sentido). Correcto; se añade la cita y la fecha de regeneración.
- **Fichas técnicas (CIMA):** solo enlaces, no reproducción. **ACSM, guías ESC/ADA/KDIGO…:** se citan como fuente y se parafrasea en texto propio; no se reproducen tablas ni figuras.
- **Componentes:** jsPDF (MIT), pdf.js (Apache 2.0), Tesseract.js (Apache 2.0), qrcode-generator (MIT), Manrope (OFL), axe-core en pruebas (MPL 2.0). Compatibles con la distribución MIT; se listan en `acerca.html`.
- **Ilustraciones y textos:** propios.

## 7. Accesibilidad

El RD 1112/2018 obliga al sector público; la Ley 11/2023 (transposición de la Directiva de accesibilidad) alcanza a determinados servicios privados (comercio electrónico, banca, transporte…) desde junio de 2025 y no a esta herramienta. La declaración voluntaria sigue el modelo oficial («parcialmente conforme», WCAG 2.1 AA, canal de comunicación de barreras) y es correcta; se añade la fecha de la última revisión automática.

## 8. Marca, nombre y dominio

«Pauta Activa» se usa como nombre comercial del servicio. **Pendiente (autor):** búsqueda en OEPM/EUIPO de marcas iguales o similares en clases 9 (software), 41 (formación) y 44 (servicios médicos), y registro de la marca si está libre; coste reducido y evita tener que cambiar el nombre después de la difusión. Comprobar que el dominio está a nombre del titular con renovación automática.

## 9. Deontología y relación médico-paciente

El Código de Deontología Médica (OMC, 2022) exige en la información sanitaria digital veracidad, prudencia, identificación del autor y no inducir a la automedicación o a prescindir de la consulta. La aplicación cumple: autor identificado, fuentes, invitación constante a consultar, sin consejos de dosis. Se aclara en los textos que el uso de la herramienta **no establece relación médico-paciente** con el titular y que el modo profesional está destinado a profesionales sanitarios colegiados que asumen su prescripción.

## Lista de acciones para el autor (por prioridad)

1. ~~Añadir NIF y domicilio de contacto en el aviso legal~~ (hecho el 16/10).
2. Presentar consulta de calificación a la AEMPS con la finalidad prevista de `legal.html`; guardar la respuesta en `docs/`.
3. Confirmar la cobertura del seguro de RC profesional para esta actividad.
4. Búsqueda y registro de la marca «Pauta Activa» (OEPM, clases 9/41/44).
   (DOI obtenido el 16/10: 10.5281/zenodo.23423114.)
5. Aceptar y archivar el DPA de Tally; revisar anualmente la política de privacidad.
6. Si la herramienta se adopta de forma institucional en un centro: acuerdo escrito con el servicio (uso, responsable de los datos, versión aprobada) y, según la respuesta de la AEMPS, plan de certificación.
