# Mejoras de estilo numeradas (Pauta Activa)

En `app/css/style.css` cada mejora lleva solo su número (`/* 392 */`) para que la hoja pese menos; aquí está qué es cada una.
Este documento se generó en la limpieza del 21/11/2026 a partir de los comentarios de la hoja. Al añadir mejoras nuevas, apúntalas aquí con el mismo número.


## TANDAS DE BELLEZA FBE 1-3 (60 mejoras) - 21112026 Estilo tecnologico de fuerzabasadaenevidencia.com: rejilla, hilos de l

| N.º | Qué hace | Selector |
|---|---|---|
| 1 | Radio comun que faltaba (guia, lo esencial, de un vistazo) y brillo de neon | `:root` |
| 2 | Papel tecnico muy tenue en modo claro | `:root:not([data-theme="dark"]):not([data-theme="contrast"]) body` |
| 3 | Esquinas de visor en los paneles (la cabecera queda por encima para que el menu "Mas" no se tape) | `.cabecera` |
| 4 | Titulos de panel: linea fina con nodo de luz | `.panel > h2` |
| 5 | Etiquetas de campo con mas aire y unidades en letra de terminal | `.fila > label small, #dosis-wrap .unidad` |
| 6 | Boton principal: filo interior y brillo de neon al pasar | `.btn` |
| 7 | Boton secundario: borde que se enciende al pasar | `.btn-sec:hover` |
| 8 | Foco: anillo de luz con halo | `:root:not([data-theme="contrast"]) :is(a, button, summary, input, select, textarea):focus-` |
| 9 | Barra de desplazamiento fina en el color de marca | `html, .contenedor > aside, .hoja-cuerpo, .hoja-opciones` |
| 10 | Campos: borde que se ilumina al pasar y al escribir | `input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):hover, select:hover, ` |
| 11 | Desplegables con flecha propia en lila | `select:not([multiple])` |
| 12 | Casillas: la fila marcada se nota (fondo y texto en acento) | `.check` |
| 13 | Lupa del buscador en el morado de FBE | `.buscador input` |
| 14 | Sugerencias: cristal y barra de luz en la elegida | `#sugerencias` |
| 15 | Medicamentos de la lista: rail de luz a la izquierda y elevacion al pasar | `#lista-meds li` |
| 16 | Dosis en cifras de terminal | `#lista-meds .med-dosis, .editor input, #dosis` |
| 17 | Chips de datos: rectangulos tecnicos | `.chip` |
| 18 | Botones-chip: brillo suave al pasar y al estar activos | `.chip-btn:hover` |
| 19 | Paciente / profesional: la opcion elegida con filo de luz | `.modo` |
| 20 | Pestanas fijas: cristal, hilo de luz debajo y la activa con nodo | `.tabs` |
| 21 | Veredicto: brillo del color del nivel en la esquina y filo interior | `.veredicto` |
| 22 | Franja resumen: cifras de terminal y un hilo del color de cada nivel | `.tile` |
| 23 | Lo esencial: borde de degradado de marca | `.esencial` |
| 24 | Puntos de lo esencial con halo | `.esencial li .punto, details.farmaco ul li.nivel-precaucion .punto, .lista-cambios li.nive` |
| 25 | De un vistazo: rotulos de terminal y filo de luz arriba | `.vistazo h3` |
| 26 | Tabla del plan: cabecera de terminal y fila resaltada al pasar | `.tabla-plan thead th` |
| 27 | Secciones plegables: barra de luz a la izquierda al abrirlas | `details.seccion > summary` |
| 28 | Tarjeta de farmaco: barra del nivel con brillo y anillo al abrir | `details.farmaco summary .barra` |
| 29 | Reglas e interacciones: un velo del color del nivel desde el borde | `article.regla, article.ddi` |
| 30 | Sellos de nivel: rectangulos de terminal | `.nivel` |
| 31 | Fuentes y pies de tarjeta en letra de terminal | `article footer, details.farmaco .fuentes, .fuente-regla` |
| 32 | Indice lateral: carril de luz en la seccion activa | `.indice-informe` |
| 33 | Hoy: hilo de luz arriba y rejilla en la esquina | `.hoy, .plan-dia, .completitud` |
| 34 | Cifras del dia y de la semana alineadas, en terminal | `.hoy-resumen b, .plan-obj p, .evo-tiles .num, .delta` |
| 35 | Barra de "su plan esta al N %": degradado con nodo de luz al final | `.comp-barra` |
| 36 | Descargas: panel de terminal con rejilla y borde de degradado | `.descargas` |
| 37 | Senales de alarma: carril rojo con brillo | `details.alarma` |
| 38 | "Si nota algo": acento a la izquierda al abrir | `details.sintomas[open]` |
| 39 | El signo + de las interacciones, en terminal | `.ddi .mas` |
| 40 | Avisos: carril de acento a la izquierda | `.banner, .aviso-import, .util, .plan-prog` |
| 41 | Anillo del objetivo semanal: valor con halo y cifra de terminal | `.anillo .valor, .anillo-crono .valor` |
| 42 | Tira de dias: hoy con anillo de luz, el elegido con borde de degradado | `.tira .dia` |
| 43 | Bloques de la sesion: minutos en terminal y separadores punteados | `.bloques .min` |
| 44 | Dia del plan: esquinas de visor | `.plan-dia::after` |
| 45 | Cronometro de la sesion: cifras de terminal con halo | `.crono #crono` |
| 46 | Ejercicios de la sesion guiada: casilla marcada con brillo | `.bloques.grande label:has(input:checked)` |
| 47 | Hojas y fichas: fondo noche con desenfoque y hilo de luz arriba | `dialog.hoja::backdrop, dialog.ficha::backdrop` |
| 48 | Opciones para anadir: icono con anillo de luz y elevacion al pasar | `.hoja-opciones button` |
| 49 | Menu "Mas": cristal y hilo de luz | `.menu-lista` |
| 50 | Barra inferior del movil: hilo de luz arriba e indicador de luz en la activa | `.barra-inferior` |
| 51 | Insignias numericas en terminal con aro de separacion | `.nav-badge, .tabs .cnt, .chip-btn b` |
| 52 | Recorrido en tres pasos: el actual con luz, los hechos con brillo verde | `.recorrido li.actual b` |
| 53 | Avisos flotantes: cristal noche con filo lila | `.toast` |
| 54 | Visita guiada: caja con borde de degradado y foco con halo | `.tour-caja` |
| 55 | Boton de ayuda "?": letra de terminal y brillo al pasar | `.btn-ayuda` |
| 56 | Palabras del glosario: subrayado de puntos en lila | `abbr.glos` |
| 57 | Carga de la base: barrido de luz lila (solo mientras carga) | `body.cargando aside .panel::after` |
| 58 | Estado vacio: ilustracion sobre un circulo de rejilla con halo | `.ilustracion` |
| 59 | Pie y firma: hilo de luz y enlaces en terminal | `.pie` |
| 60 | Consulta del profesional: panel tecnico con rotulo de terminal | `.consulta` |

## TANDAS DE BELLEZA FBE 4-6 (mejoras 61-120) - 21112026 Misma linea que las tandas 1-3: rejilla, hilos de luz, letra de te

| N.º | Qué hace | Selector |
|---|---|---|
| 61 | Cabecera en el movil: logo alineado arriba con el titulo y lema mas compacto | `.cabecera` |
| 62 | Nombre de la app con brillo: degradado de blanco a lavanda | `.cabecera h1 > span[data-i18n="meta.titulo"], .cabecera h1:not(:has(span))` |
| 63 | Recorrido: en la columna de escritorio las etiquetas ya no se cortan ("Su medic...") | `.recorrido:has(#btn-siguiente[hidden]) li` |
| 64 | Recorrido: hilo que une los pasos y se vuelve verde al completarlos | `.recorrido li` |
| 65 | Numeracion de los tres bloques (01 datos, 02 medicacion, 03 informe), como en la web | `#panel-datos > h2.h-ayuda` |
| 66 | Menu "Mas": columna de iconos alineada y separadores entre grupos | `.menu-lista [role=menuitem]:not(:has(.ic-menu, svg))` |
| 67 | Campos numericos sin flechas: mas limpios (teclado y rueda siguen sirviendo) | `input[type="number"]` |
| 68 | Casillas propias: esquinas suaves, borde lila al pasar y marca dibujada al elegir | `:root:not([data-theme="contrast"]) input[type="checkbox"]:not(.chip-btn input)` |
| 69 | Bloques plegables de datos: fila que se ilumina al pasar y flecha en acento al abrir | `details.bloque > summary` |
| 70 | Anadir rapido: signo + delante de cada farmaco frecuente | `#rapido .chip-btn::before` |
| 71 | Pildora de dosis: si no cabe en una linea pasa a rectangulo alineado a la izquierda | `#lista-meds .med-dosis .editar` |
| 72 | Sello "dosis alta": triangulo de aviso y borde del color de precaucion | `.chip-alta` |
| 73 | Iconos de grupo: anillo fino y, en modo oscuro, fondos tintados en lugar de pastel claro | `.ic-grupo` |
| 74 | Momentos de toma: el elegido lleva marca y texto mas firme | `.momentos .mom[aria-pressed="true"]` |
| 75 | Boton "Mas formas de anadir": degradado de marca con rejilla en la esquina | `.btn-anadir` |
| 76 | Medicamento en pausa: rayado diagonal suave, se ve de un vistazo que no cuenta | `#lista-meds li.pausado` |
| 77 | Cabecera de combinacion (Entresto...): velo de marca y rotulo de terminal | `#lista-meds li.combo-cab` |
| 78 | Estado vacio: tarjeta de inicio con borde discontinuo y rejilla | `#sin-meds:not([hidden])` |
| 79 | Nota de privacidad: candado y tono de sello de confianza | `.privacidad` |
| 80 | Aviso "sin conexion": pildora de estado con punto, en letra de terminal | `.conexion` |
| 81 | Titulos equilibrados y parrafos sin palabras huerfanas | `h1, h2, h3, h4, .veredicto > p:first-of-type, .hoja-cab p, .ficha-cab p` |
| 82 | Veredicto: icono del nivel en un circulo delante del titular | `.veredicto > p:first-of-type` |
| 83 | Datos del contexto (edad, situaciones): pildoras con punto de marca | `.contexto-chips .chip` |
| 84 | "Su plan esta al N %": barra por tramos de 25 % | `.comp-barra` |
| 85 | Hoy: mini semana legible (huecos visibles, esquinas suaves, letras de terminal) | `.semana rect` |
| 86 | Hoy: la mejor franja horaria como pildora con reloj | `.hoy-franja` |
| 87 | Lo esencial: cada punto separado por un hilo discontinuo | `.esencial ol > li + li` |
| 88 | "Pare y consulte si nota...": triangulo de aviso delante | `details.alarma > summary .sub-label::before, details.sintomas > summary .sub-label::before` |
| 89 | "Si nota algo al entrenar": trazo de pulso delante | `details.sintomas > summary .sub-label::before` |
| 90 | De un vistazo: simbolo en cada columna y vinetas de su color | `.semaforo-col h4` |
| 91 | Plan semanal: filas alternas y tipo de ejercicio con titular ancho | `.tabla-plan tbody tr:nth-child(even) > *` |
| 92 | Hoy: rotulo con punto verde, como un indicador encendido | `.hoy-cab small::before` |
| 93 | Pestanas: el contador de la pestana abierta se rellena con su color | `.tabs button[aria-selected="true"] .cnt` |
| 94 | Reglas e interacciones: se elevan al pasar; farmacos implicados con punto | `article.regla, article.ddi` |
| 95 | Interacciones: el signo + en una pastilla redonda | `.ddi .mas` |
| 96 | Sellos de nivel (ATENCION, MAYOR...): punto de color delante | `.nivel` |
| 97 | Indice lateral numerado (01, 02...) en letra de terminal | `.indice-informe` |
| 98 | Descargas: las opciones para compartir en una rejilla ordenada, alineadas a la izquierda | `.descargas .acciones:not(:first-of-type)` |
| 99 | Secciones del detalle: fila que se ilumina al pasar | `details.seccion > summary` |
| 100 | Fuentes de cada interaccion y de cada farmaco: icono de libro delante | `article.ddi footer` |
| 101 | Fecha del dia del plan sin mayusculas raras ("Sabado, 21 de noviembre", no "21 De Noviembre") | `.plan-dia-cab h3` |
| 102 | Facil / Normal / Dificil: control segmentado en su propia linea | `.bloques .variantes` |
| 103 | Bloques de la sesion: minutos en pastilla y dibujo con anillo suave | `.bloques .min` |
| 104 | Tira de dias: punto en el dia de hoy, descanso con borde discontinuo y hechos en verde | `.tira .dia.hoy::after` |
| 105 | Objetivo semanal: tarjeta propia con rejilla y pista del anillo en lila | `.plan-cab` |
| 106 | Chequeo antes de la sesion: cada condicion marcada se ilumina en verde | `.chequeo > ul > li` |
| 107 | Cabeceras de las ventanas: titulo destacado a la izquierda y "Cerrar" siempre a la derecha | `.ficha-cab > p, .hoja-cab > p` |
| 109 | Hojas inferiores del movil: asa de arrastre tambien en las de anadir y ayuda | `dialog.hoja::before` |
| 110 | Boton principal: brillo superior de cristal | `:root:not([data-theme="contrast"]) .btn:not(.btn-anadir)` |
| 111 | Enlaces del texto: subrayado fino y separado que se refuerza al pasar; externos con flecha | `main a:not(.btn):not(.btn-sec), .ficha-cuerpo a:not(.btn):not(.btn-sec), .hoja-cuerpo a` |
| 112 | Paginas Acerca, Legal y Novedades: el texto en una hoja con titulos subrayados de marca | `main.acerca, main.legal, main.novedades` |
| 113 | Novedades: linea de tiempo con un nodo por fecha (la ultima en oro) | `main.novedades article` |
| 114 | Legal: indice de secciones fijo arriba, en cristal y en una sola fila deslizable | `main.legal .toc` |
| 115 | "Volver a la aplicacion": se desplaza hacia la izquierda al pasar | `.volver` |
| 116 | Modo oscuro: campos hundidos (mas oscuros que el panel) para distinguirlos | `:root[data-theme="dark"] :is(input:not([type="checkbox"]):not([type="radio"]):not([type="r` |
| 117 | Saltos del indice en escritorio: el titulo queda a la vista bajo las pestanas fijas | `#veredicto, #hoy, #esencial, #vistazo, #detalle-t, #descargas` |
| 118 | Cursor de escritura en el color de marca | `input, textarea` |
| 120 | Guia rapida: numeros con degradado de marca y capturas con marco de dispositivo | `.paso-guia h2 b` |

## TANDAS DE BELLEZA FBE 7-9 (mejoras 121-180) - 21112026 Donde el aspecto estaba mas flojo: controles de formulario, venta

| N.º | Qué hace | Selector |
|---|---|---|
| 121 | Botones de opcion (radio) propios, a juego con las casillas | `:root:not([data-theme="contrast"]) input[type="radio"]:not(.chip-btn input)` |
| 122 | Si / No del cribado como pastillas que se encienden al elegir | `.crib-preg > .check:has(input[type="radio"])` |
| 123 | Deslizador del esfuerzo (RPE): pista de verde a rojo y tirador blanco con anillo | `:root:not([data-theme="contrast"]) input[type="range"]` |
| 124 | Valor del esfuerzo como pastilla grande junto al deslizador | `.registro output, .sesion-fin output` |
| 125 | Desplegables que no recortan su texto ("Elegir una plantilla") | `.plantilla-fila > label > select` |
| 126 | Areas de texto: altura comoda, solo crecen en vertical y con interlineado amplio | `textarea` |
| 127 | Unidades junto a los rotulos (lpm, mg/dL, mmHg, %) como pastillas grises | `.fila > label small, .unidad-mini, #dosis-wrap .unidad` |
| 128 | Formulario de dosis: campos, unidad y boton alineados abajo en una fila | `#dosis-wrap > .fila` |
| 129 | Dosis por comprimido sin el signo + (son dosis, no farmacos que anadir) y con borde de marca | `#dosis-presets .chip-btn` |
| 130 | Etiquetas largas (sintomas, "Ha notado algo?") en letra normal, mas facil de leer | `details.sintomas .chip-btn, .registro .chips .chip-btn:not(:has(input[type="radio"])), .re` |
| 131 | Tipos de sugerencia como tarjetas seleccionables | `#fb-tipos` |
| 132 | Campo de contrasena con candado | `input[type="password"]` |
| 133 | "Registrar sesion": formulario en tarjeta suave con hilo de luz | `#form-registro` |
| 134 | SPPB: cronometro grande en letra de terminal y anillo mayor | `#sppb-crono` |
| 135 | SPPB: "Paso 1 de 5" en pastilla y dibujo de la prueba en baldosa grande | `.sppb-progreso` |
| 136 | Sesion guiada y SPPB: el cronometro en una tarjeta con rejilla | `#sesion .crono, #sppb .crono` |
| 137 | Sesion guiada: el cierre (esfuerzo y constantes) en su propia tarjeta | `.sesion-fin` |
| 138 | Ventanas largas: sombra arriba y abajo cuando hay mas contenido al desplazar | `.ficha-cuerpo, .hoja-cuerpo` |
| 139 | Glosario: cada termino como etiqueta de terminal, con separadores | `.glosario dt` |
| 140 | Hojas de ayuda: icono "?" delante del titulo y primer parrafo destacado | `#ayuda .hoja-cab p` |
| 141 | Franja horaria (pestana "Cuando"): extremos redondeados y relieve suave en cada hora | `.timeline .hora` |
| 142 | Franja horaria: rojo rayado y ambar punteado, para no depender solo del color | `.timeline .hora.nivel-rojo` |
| 143 | Franja horaria: las horas en letra de terminal, con aire por encima | `.timeline` |
| 144 | "Mejores momentos": pastillas con reloj | `.mejores b` |
| 145 | Hora de las tomas: los cuatro momentos en rejilla, con rotulo de terminal | `.horas-tomas` |
| 146 | Sello "revisada" con marca de verificacion | `.estado-regla.ok::before` |
| 147 | Etiquetas de evidencia (ficha tecnica, guia, revision) con punto del tipo | `.evidencia` |
| 148 | Reglas dentro de cada tarjeta de farmaco: separadas por hilos discontinuos | `details.farmaco .cuerpo > ul > li + li` |
| 149 | Tarjeta de farmaco abierta: cuerpo con un velo tenue del color de su nivel | `details.farmaco[open] > .cuerpo` |
| 150 | Grupos de cada pestana ("Farmacos con avisos"...): hilo de degradado en lugar de linea gris | `details.seccion > summary` |
| 151 | Ficha del farmaco y ventanas: subtitulos como rotulos de terminal con hilo | `.ficha-cuerpo h3` |
| 152 | Ficha: reglas con punto con halo y separadas por hilos | `.ficha-cuerpo ul.reglas li + li` |
| 153 | Ficha: interacciones en mini tarjetas | `.ficha-cuerpo .ddi-mini` |
| 154 | Modo profesional: filo del color del modo en lo alto de cada panel | `body[data-modo="profesional"] .panel` |
| 155 | "Paciente en consulta": botones en rejilla de dos columnas y ayuda al final | `.consulta .acciones` |
| 156 | Datos clinicos del profesional (FG, FEVI, NYHA, SPPB, Vivifrail, DAI) en rejilla ordenada | `#bloque-pro .fila:not(.plantilla-fila)` |
| 157 | Nota del profesional (cuando se activan reglas especificas) como aviso con icono | `small[data-i18n="pro.nota"]` |
| 158 | Resultado del cribado y del SPPB: icono segun el nivel | `.crib-resultado` |
| 159 | Preguntas del cribado en tarjetas suaves | `#bloque-cribado fieldset.crib-preg` |
| 160 | Escritorio sin medicacion: la columna del informe muestra un boceto decorativo en lugar de un hueco vacio | `body.sin-meds .contenedor::after` |
| 161 | Presentacion: portada con rejilla de fondo y brillo violeta | `.pres .hero` |
| 162 | Presentacion: titular con degradado de noche a violeta | `.pres .hero h1` |
| 163 | Presentacion: capturas de la portada con marco de dispositivo | `.pres .hero figure img` |
| 164 | Presentacion: cifras con hilo de color arriba y rotulos de terminal | `.pres .cifras div` |
| 165 | Presentacion: tarjetas "Para quien" con icono en degradado y elevacion al pasar | `.pres .tarjeta, .pres .funcion, .pres .pasos3 li` |
| 166 | Presentacion: la captura de cada funcion se acerca un poco al pasar | `.pres .funcion img` |
| 167 | Presentacion: "Lo que no es" con icono de aviso | `.pres .limites h2` |
| 168 | Presentacion: pasos numerados con circulo en degradado y halo | `.pres .pasos3 li::before` |
| 169 | Presentacion: firma con hilo de luz arriba | `.pres .firma-pres` |
| 170 | Guia: preguntas frecuentes como tarjetas plegables con flecha que gira | `.faq details` |
| 171 | Guia: el consejo con icono de bombilla | `.consejo` |
| 172 | Recorrido guiado: caja con hilo de luz y paso en pastilla | `.tour-caja` |
| 173 | Recorrido guiado: el elemento enfocado con doble anillo lila | `.tour-foco` |
| 174 | Avisos dentro de la cabecera (base actualizada, reevaluacion, solo lectura): cristal sobre la banda noche | `.cabecera .banner` |
| 175 | Avisos de importacion y medicamentos no reconocidos con icono | `.no-reconocidos > p` |
| 176 | Cambios al sustituir la lista: + nuevo (verde), - retirado (rojo), ~ dosis (ambar) | `.cambios ul` |
| 177 | Boton "Vaciar": tono de peligro al pasar | `#btn-vaciar:hover, #btn-vaciar:focus-visible` |
| 178 | Recorrido de arriba con boton "Siguiente": en escritorio, solo los circulos (antes salian nombres cortados "S...") | `.recorrido:has(#btn-siguiente:not([hidden])) li` |
| 179 | Casillas con textos largos alineadas con la primera linea | `.condiciones .check` |
| 180 | Paginas secundarias: el subtitulo de la cabecera en letra de terminal, como en la app | `.cabecera:not(:has(.subtitulo)) .autor` |

## MEJORAS VISUALES 181-230 (bloque V) - 21112026 Sale de revisar capturas de movil y escritorio, claro y oscuro, ventanas 

| N.º | Qué hace | Selector |
|---|---|---|
| 181 | Botones de toma en una fila de cuatro iguales (antes "Noche" bajaba sola); letra algo mas estrecha para que quepa | `#lista-meds li` |
| 182 | Pausar y quitar arriba a la derecha, como botones redondos con fondo (antes flotaban a media altura) | `#lista-meds .med-acciones` |
| 183 | Dosis larga en una linea con su lapiz: ahora la dosis ocupa todo el ancho de la tarjeta | `#lista-meds .med-dosis` |
| 184 | Nombre del grupo en una sola linea con puntos suspensivos (el completo, al pasar por encima) | `#lista-meds .med-nombre small` |
| 185 | Aviso del caso de ejemplo con su boton para vaciar dentro | `.banner-ejemplo` |
| 186 | Contador de farmacos junto al titulo de la lista | `.cuenta-meds` |
| 187 | Edad y pulso en reposo en la misma fila tambien en el movil | `#panel-datos > .fila > label[for]` |
| 188 | Plegables de datos con icono propio y "N marcadas" | `.marcadas` |
| 189 | Botones "?" de ayuda mas discretos: sin borde, fondo suave, mas pequenos; se encienden al pasar | `.btn-ayuda` |
| 190 | Hoja "Como quiere anadir": cada via con su color y "Buscar por nombre" como recomendada | `.hoja-opciones button[data-ic="camara"] svg` |
| 191 | Movil: tarjetas de "Farmacos con avisos" con el nombre arriba y el texto a todo el ancho (antes, columna estrechisima) | `details.farmaco summary` |
| 192 | Movil: la etiqueta de nivel encima del titulo de cada regla o interaccion, para que el titulo no se parta | `article.regla > header, article.ddi > header` |
| 193 | "Ver mi plan / Descargar / Compartir" en una fila de tres iguales (antes "Compartir" bajaba solo) | `.veredicto-acciones` |
| 194 | "De un vistazo": las dos primeras tarjetas lado a lado y "Evite" a todo el ancho, en dos columnas | `.semaforo` |
| 195 | Pestanas y tira de dias: se difuminan en el borde cuando hay mas a ese lado (antes se cortaban a media palabra) | `.tabs.hay-der, .tira.hay-der` |
| 196 | Tarjeta "Hoy": la franja "mejor entre ..." en su propia linea, bajo el titulo | `.hoy-cab h3` |
| 197 | Mini semana de "Hoy": siete columnas legibles con la inicial, los minutos y el tipo de sesion; hoy resaltado | `.hoy-semana` |
| 198 | Resumen de la semana alineado a la izquierda, con la tarjeta | `.hoy-resumen` |
| 199 | Recorrido terminado: "Todo listo" junto a los tres circulos | `.rec-listo` |
| 200 | "Pare y consulte si nota...": icono mas grande y texto mas fuerte, distinto de "Si nota algo al entrenar" | `details.alarma > summary .sub-label` |
| 201 | Tira de dias colocada en el dia elegido u hoy (ver 195 para el difuminado) | `.tira` |
| 202 | Hoy con anillo de marca; los dias ya pasados, atenuados | `.tira .dia.hoy` |
| 203 | "Mis dias de ejercicio": los dias del resumen como circulos y botones grandes para elegirlos | `.dias-resumen` |
| 204 | Acciones del dia: "Empezar" a todo el ancho; "Marcar como hecha" e "Imprimir" lado a lado | `.plan-dia > .acciones` |
| 205 | Calendario, compartir semana y CSV: botones del mismo ancho | `.plan > .acciones` |
| 206 | "Siguiente paso" del plan con icono de progreso | `.plan-prog` |
| 207 | Sesion guiada: casilla mas grande; el bloque hecho se tacha y se atenua entero | `.bloques.grande input` |
| 208 | Constantes (glucosa, tension, pulso) en rejilla de dos; la glucosa, con sus dos campos, a todo el ancho | `.constantes` |
| 209 | Esfuerzo: "muy suave / moderado / muy duro" bajo la barra | `.rpe-campo` |
| 210 | SPPB: el campo "Segundos" dentro de la tarjeta del cronometro | `.crono-sppb` |
| 211 | "Llevese este informe": los cuatro PDF como tarjetas con icono y una linea de para que sirve; el principal, relleno | `.docs` |
| 212 | Opciones de compartir en rejilla de dos columnas, todas con icono | `.descargas .acciones.compartir, .descargas .acciones.compartir-enlaces` |
| 213 | "Enviar una sugerencia o error" como enlace discreto al final | `.descargas > .btn-sugerencia` |
| 214 | Ventana de sugerencias: la casilla "Adjuntar datos tecnicos" junto a su texto (antes en lineas separadas) | `#feedback-form > label.check` |
| 215 | Menu "Mas": todos los elementos con su icono en un circulo, alineados | `.menu-lista [role=menuitem] > svg` |
| 216 | Ficha del farmaco: icono del grupo junto al nombre y los efectos en lista con punto | `.ficha-titulo` |
| 217 | Recorrido guiado: la caja junto a lo que explica, con una flecha (la coloca app.js) | `.tour-flecha` |
| 218 | Modo profesional: los cuatro botones de "Paciente en consulta" con la misma altura | `.consulta .acciones` |
| 219 | "Soy paciente / Soy profesional" con el icono de cada modo | `.modo button` |
| 220 | Barra inferior: los numeros ya no tapan el dibujo (anillo del color de la barra) | `.nav-badge` |
| 221 | Pie ordenado: firma centrada con su logo y enlaces legales sin partir | `.firma` |
| 222 | Legal: el indice de secciones se reparte en dos lineas en lugar de cortarse | `main.legal .toc` |
| 223 | Acerca de: cada seccion en su tarjeta con icono y el estado de la base en cifras | `main.acerca` |
| 224 | Novedades: la entrada mas reciente destacada en su tarjeta | `main.novedades article:first-of-type` |
| 225 | Guia: "Abrir la aplicacion" al final y, en el movil, siempre a mano abajo | `.guia-abrir` |
| 226 | Paginas secundarias: "Volver a la aplicacion" se queda arriba al bajar (en Legal ya esta fijo el indice) | `:is(main.acerca, main.novedades, .guia-pag) > .volver` |
| 227 | Modo oscuro: iconos de grupo con su color sobre fondo tenue (sin el brillo que los blanqueaba), en la lista, el informe y la ficha | `:root[data-theme="dark"] .ic-grupo` |
| 228 | Foco de teclado bien visible en pestanas, dias, botones de toma, documentos y acciones del veredicto | `.tabs [role=tab]:focus-visible, .tira .dia:focus-visible, .momentos .mom:focus-visible, .d` |
| 229 | Plegables del informe: icono segun el tipo junto al titulo y contador en pastilla | `details.seccion > summary h3` |
| 230 | "Su plan esta al N %": la cifra grande y los dos botones del mismo alto y ancho | `.comp-num` |

## TRES TANDAS DE 50 MEJORAS VISUALES Y DE BELLEZA (231-380) - 21112026 Sin color-mix (no necesitan reservas para Safari an

| N.º | Qué hace | Selector |
|---|---|---|
| 231 | Edad y pulso en reposo: las dos etiquetas ocupan lo mismo y los campos quedan a la misma altura | `label[for="edad"] > .lbl, label[for="fc-reposo"] > .lbl` |
| 232 | "lpm, opcional" como texto suave de terminal, sin pildora | `label[for="fc-reposo"] .unidad-mini` |
| 233 | Cabecera de los plegables de datos: el texto se parte bien y "N marcadas" no se rompe | `details.bloque > summary .sub-label` |
| 234 | Situacion marcada: la fila entera se ilumina | `.condiciones .check` |
| 235 | Separador fino entre situaciones en el movil | `.condiciones .check + .check` |
| 236 | "Medir la forma fisica (SPPB)" ocupa la fila en el movil | `.sppb-acciones` |
| 237 | Lista: si el grupo repite el nombre del producto no se escribe (y no queda una linea vacia) | `#lista-meds .med-nombre small:empty` |
| 238 | Momentos de la toma enteros en el movil ("Desayuno", no "Desay...") | `#lista-meds .momentos` |
| 239 | "sin dosis" en ambar con borde discontinuo: invita a completarla | `#lista-meds li.sin-dosis .med-dosis .editar` |
| 240 | Suplementos y plantas con su filo de color en la lista | `#lista-meds li[data-tipo="planta"]` |
| 241 | Nombres largos en dos lineas como maximo | `#lista-meds .med-nombre strong` |
| 242 | Pausar y quitar, discretos hasta pasar el raton por la tarjeta | `#lista-meds .med-acciones button` |
| 244 | Lo escrito, resaltado en cada resultado del buscador | `:is(#sugerencias, #ficha-sugerencias) mark` |
| 245 | El grupo de cada resultado, en dos lineas como maximo | `:is(#sugerencias, #ficha-sugerencias) li small` |
| 246 | Icono del grupo delante de cada resultado | `:is(#sugerencias, #ficha-sugerencias) li.con-ic` |
| 247 | Resultado elegido con el teclado: anillo por dentro, que no se corta | `:is(#sugerencias, #ficha-sugerencias) li:focus-visible` |
| 248 | Dosis habituales en cifras de terminal y con ancho minimo | `#dosis-presets .chip-btn` |
| 249 | El formulario de dosis, con filo de acento: se ve que es el paso siguiente | `#dosis-wrap` |
| 250 | Plegable de suplementos: abierto, con un velo verde muy suave | `.sup-rapido[open]` |
| 251 | Botones rapidos de suplementos en tres columnas iguales en el movil | `.sup-chips` |
| 252 | "Anadir rapido": rotulo de terminal | `#rapido > small` |
| 253 | "Recomendado" en oro en la hoja de anadir | `.hoja-opciones .recomendado` |
| 254 | Opciones de la hoja de anadir: el icono crece un poco al pasar | `.hoja-opciones button .ic, .hoja-opciones button svg` |
| 255 | Contador de la lista en terminal | `.cuenta-meds` |
| 256 | Banda de ejemplo: borde discontinuo para que se lea como "de prueba" | `.banner-ejemplo` |
| 257 | Aviso de privacidad mas pequeno y con mas aire | `.privacidad` |
| 258 | Ilustracion del estado vacio con un halo suave | `.ilustracion img` |
| 259 | Tarjetas de la lista con un poco mas de aire entre ellas en pantallas grandes | `#lista-meds` |
| 260 | Cabecera de las combinaciones de marca en terminal | `#lista-meds li.combo-cab strong` |
| 261 | Paso a paso: el paso actual con un halo | `#recorrido-pasos .paso.actual b` |
| 262 | Boton "Siguiente": la flecha avanza un poco al pasar | `#btn-siguiente .flecha` |
| 263 | Botones de ayuda "?" con borde fino y del color del acento al pasar | `.btn-ayuda` |
| 264 | "Alguna caida en el ultimo ano" marcada como tarjeta | `label.check:has(#caidas:checked)` |
| 265 | Campos numericos de datos: cifra grande y centrada | `#edad, #fc-reposo` |
| 266 | Plegables de datos abiertos con fondo suave en la cabecera | `details.bloque[open] > summary` |
| 267 | Listas guardadas: cada lista como tarjeta con filo | `.perfiles li` |
| 268 | "Consultar un farmaco" y "Listas guardadas" del mismo alto | `.cab-panel .btn-sec.sm` |
| 269 | Medicamento anadido tal cual (sin informacion): rayado suave | `#lista-meds li.libre` |
| 270 | Nombre del producto un poco mas grande en la lista | `#lista-meds .med-nombre strong` |
| 271 | Etiqueta Planta/Suplemento separada del grupo con un punto de aire | `#lista-meds .etq-tipo` |
| 272 | Pildora de dosis alta junto a la dosis, sin saltar de linea | `#lista-meds .med-dosis .chip-alta` |
| 273 | Lista pausada: el nombre tachado suave | `#lista-meds li.pausado .med-nombre strong` |
| 274 | Buscador: icono de lupa del color del acento al escribir | `.buscador input:focus` |
| 275 | Resultados del buscador con separador entre ellos | `:is(#sugerencias, #ficha-sugerencias) li + li` |
| 276 | "Anadir tal cual" con borde discontinuo y texto en cursiva suave | `#sugerencias li.libre-op span` |
| 277 | Plegable de suplementos: contador de "N en su lista" con punto verde | `.sup-cuenta::before` |
| 278 | Mas formas de anadir y Vaciar en la misma fila desde 420 px | `.acciones-anadir` |
| 279 | Modo paciente/profesional: el inactivo atenua su icono | `.modo button[aria-checked="false"] svg` |
| 280 | Datos basicos: la nota "Rellene solo lo que sepa" con ancho de lectura comodo | `.modo-nota` |
| 281 | Veredicto con el titular equilibrado en sus lineas | `.veredicto > p:first-of-type` |
| 282 | Boton del cribado del veredicto a todo el ancho en el movil | `.veredicto-crib .btn-sec` |
| 283 | Ver mi plan, Descargar y Compartir del mismo ancho en el movil | `.veredicto-acciones` |
| 284 | Completitud del plan con filo del acento | `.completitud` |
| 285 | Lo que falta, con vinetas del acento | `.comp-lista li::marker` |
| 286 | "Que tener en cuenta" equilibrado | `.cabecera-informe h2` |
| 287 | Botones de "Hoy" con sombra del acento | `.hoy-botones .btn` |
| 289 | Lo esencial: el arranque en negrita, con el color del texto | `.esencial li b, .esencial li strong` |
| 290 | Nota de "Lo esencial" en cursiva suave | `.esencial-nota` |
| 291 | "Pare y consulte": vinetas rojas | `details.alarma ul li::marker` |
| 292 | "Si nota algo": sintomas con mas aire | `details.sintomas .chips` |
| 293 | De un vistazo: la fila del plan que se senala, resaltada | `.vistazo .tabla-plan tbody tr:hover` |
| 294 | El ritmo del paciente en una caja suave | `.vistazo .ritmo` |
| 295 | Cifras del resumen con interletraje apretado | `#resumen .tile .num` |
| 296 | Pestanas elegidas con el teclado: anillo por dentro | `.tabs button:focus-visible` |
| 297 | Contadores de las secciones en cifras de terminal | `details.seccion > summary .resumen-sec b` |
| 298 | Linea del grupo de cada farmaco mas legible | `details.farmaco summary small` |
| 299 | La frase de aviso de cada farmaco cerrado, en dos lineas como maximo | `.una-frase` |
| 300 | Reglas del farmaco con interlineado comodo | `details.farmaco ul li` |
| 301 | Fuente de cada interaccion: las palabras largas no desbordan | `article.ddi footer` |
| 302 | "Que hacer" de cada interaccion en una caja | `article.ddi .accion` |
| 303 | Interacciones mayores con un velo rojo muy suave | `article.ddi.ddi-mayor` |
| 304 | Nota de fuentes al pie mas pequena | `.nota-fuentes` |
| 305 | "Hora de sus tomas": los cuatro campos caben en el movil (antes se salian por la derecha) | `.fila.horas-tomas input[type="number"]` |
| 306 | Mejores momentos un poco mas grandes | `.mejores b` |
| 307 | Por que: la franja horaria en terminal | `ul.motivos li b` |
| 308 | Efectos que se acumulan: cifra en terminal | `#perfil li .num` |
| 309 | Cada documento con una flecha de descarga discreta en la esquina (blanca en el principal) | `.docs .btn-doc` |
| 310 | Compartir: el boton que queda solo al final ocupa toda la fila | `.descargas .acciones.compartir > :last-child:nth-child(odd), .descargas .compartir-enlaces` |
| 311 | Notas de descargas con ancho de lectura | `.descargas small` |
| 312 | Ficha: el nombre del producto equilibrado | `.ficha-titulo span` |
| 313 | Ficha: la linea del grupo con interlineado comodo | `.ficha-cuerpo .clase-nombre` |
| 314 | Ficha: "Anadir a mi lista" siempre a mano al final de la ventana | `.ficha-cuerpo #ficha-anadir` |
| 315 | Rotulos de las cifras del resumen mas pequenos | `#resumen .tile span:not(.num)` |
| 316 | Titulos de las secciones plegables equilibrados | `details.seccion > summary h3` |
| 317 | Sello "revisada/borrador" mas discreto | `.estado-regla` |
| 318 | Nivel de evidencia sin partirse | `.evidencia` |
| 319 | Terminos del glosario con subrayado punteado fino y separado | `abbr.glos` |
| 320 | "Detalle por pestanas" con hilo inferior | `.detalle-t` |
| 321 | La ayuda "?" de las acciones del veredicto, centrada | `.veredicto-acciones .btn-ayuda` |
| 322 | Al saltar a "Hoy" no queda pegado al borde | `.hoy, #esencial, #vistazo, #descargas` |
| 323 | Nombres de cada interaccion equilibrados | `article.ddi header h4` |
| 324 | Tarjeta de farmaco abierta con algo mas de sombra | `details.farmaco[open]` |
| 325 | Titulos de los avisos por combinacion equilibrados | `article.regla header h4` |
| 326 | Farmacos implicados en cada aviso en terminal | `article.regla .chip` |
| 327 | Indice del informe en escritorio: el enlace al pasar, del color del acento | `#indice-informe a:hover` |
| 328 | Texto del informe con interlineado de lectura | `#informe-texto` |
| 329 | Logo de la firma con esquinas redondeadas | `.firma img` |
| 330 | Enlaces del pie con subrayado separado | `.pie-legal a, .pie a` |
| 331 | Objetivo semanal: la cifra del anillo en terminal | `.plan-cab svg text` |
| 332 | Racha en negrita | `.plan-racha` |
| 333 | Mis dias: botones de dia del mismo tamano | `.dias-chips .chip-btn` |
| 334 | Tira de dias: los pasados, mas atenuados | `.tira .dia.pasado` |
| 335 | Tira de dias: el descanso con rayado suave | `.tira .dia.descanso` |
| 336 | Banda del dia con las esquinas de arriba redondeadas | `.plan-dia .plan-banda` |
| 337 | Bloques de la sesion separados por una linea discontinua | `.bloques.con-picto > li + li` |
| 338 | Intensidad y tiempo (FITT) en una caja suave | `.plan-fitt` |
| 339 | "Empezar sesion" a todo el ancho en el movil | `#btn-sesion` |
| 340 | Progreso sin datos: mensaje centrado | `.plan-prog.pocos_datos` |
| 341 | Imagenes de la sesion guiada con esquinas redondeadas | `.ses-img, .sppb-img` |
| 342 | Cronometros con cifras que no bailan | `.crono, .crono-seg` |
| 343 | Pasos del SPPB con su progreso en terminal | `.sppb-progreso` |
| 344 | Chequeo previo: lo marcado, iluminado | `.chequeo label.check:has(input:checked)` |
| 345 | Cierre de la sesion con titular equilibrado | `.sesion-fin h3, .sesion-fin h2` |
| 347 | Avisos breves (toast) en seminegrita | `.toast` |
| 348 | Menu "Mas": cada opcion separada por un hilo | `.menu-lista > a + a, .menu-lista > button + a, .menu-lista > a + button` |
| 349 | Menu "Mas" abierto con sombra profunda | `.menu-mas[open] .menu-lista` |
| 350 | Titulos de las hojas inferiores equilibrados | `.hoja-cab h2, .hoja-cab h3` |
| 351 | Ficha: lista de interacciones con interlineado comodo | `.ficha-cuerpo .ddi-mini li` |
| 352 | Legal: en el movil el indice va en una fila que se desliza (antes tapaba el texto al bajar) | `main.legal .toc` |
| 353 | Enlaces con forma de boton, sin subrayado (presentacion, guia, paginas) | `a.btn, a.btn-sec` |
| 354 | "Volver a la aplicacion" flotante con fondo y sombra: no se mezcla con el texto | `.volver` |
| 355 | Novedades: la entrada al pasar el raton, con el filo del acento | `main.novedades article:hover h2` |
| 356 | Acerca de: cifras de la base grandes y alineadas | `#estado-kb dd` |
| 357 | Acerca de: lista de casos de validacion mas compacta | `#validacion-lista` |
| 358 | Presentacion: cifras alineadas | `.pres .cifras b` |
| 359 | Presentacion: capturas de cada funcion con esquinas redondeadas | `.pres .funcion img` |
| 360 | Escritorio: al volver a la app, cabecera compacta (sin la introduccion ni el lema) | `html.retorno .cabecera .intro, html.retorno .cabecera .lema` |
| 361 | Linea de version: las cifras largas se parten sin desbordar | `.estado-linea small` |
| 362 | Insignias de la barra inferior con cifras alineadas | `.nav-badge` |
| 363 | Oscuro: filo de suplementos y plantas mas claro | `:root[data-theme="dark"] #lista-meds li[data-tipo="planta"]` |
| 364 | Alto contraste: el filo de suplementos en el color del texto | `:root[data-theme="contrast"] #lista-meds li[data-tipo]` |
| 365 | Impresion: sin resaltados ni filos de color | `mark` |
| 366 | Dias de la tira elegidos con el teclado: anillo separado | `.tira .dia:focus-visible` |
| 367 | Diario: caja de notas mas comoda | `.registro textarea` |
| 368 | Tendencia del plan con rotulos de terminal | `.tendencia small` |
| 369 | Recordatorio de los dias de ejercicio en una caja suave | `.aviso-plan` |
| 370 | De un vistazo: rotulos de las tres columnas con aire | `.semaforo-col h4` |
| 371 | Aviso de reevaluacion con filo dorado | `.banner-reeval` |
| 372 | Glosario: los terminos del color del acento | `.glosario dt` |
| 373 | Estadisticas de la consulta con filas redondeadas | `.stats-lista li` |
| 374 | Efectos que se acumulan: los farmacos de cada efecto con interlineado comodo | `#perfil li small` |
| 375 | Aviso de datos guardados con filo ambar | `#aviso-datos` |
| 376 | Botones desactivados con cursor de "no disponible" | `.btn:disabled, .btn-sec:disabled` |
| 377 | Texto seleccionado con los colores de la marca | `::selection` |
| 378 | Escritorio: barra de desplazamiento fina del color de la marca | `html` |
| 379 | Titulos de las paginas secundarias equilibrados | `:is(main.acerca, main.legal, main.novedades, .guia-pag, .pres) :is(h2, h3)` |
| 380 | Alto contraste: sin velos ni rayados de esta ronda | `:root[data-theme="contrast"] :is(article.ddi.ddi-mayor, .tira .dia.descanso, #lista-meds l` |

## TRES TANDAS MAS: BELLEZA, VISUAL Y MOVIMIENTO FUTURISTA (381-530) Todo movimiento es de una vez (al cargar, al abrir, al

| N.º | Qué hace | Selector |
|---|---|---|
| 381 | Tokens de movimiento: curva de salida, curva de muelle y tres duraciones | `:root` |
| 382 | Fotogramas propios (pa-*) | `` |
| 383 | Al cargar, la cabecera se enfoca: aparece con un leve desenfoque que se aclara | `html:not(.pa-quieto) .cabecera` |
| 384 | El logo entra con un giro corto y un rebote | `html:not(.pa-quieto) .cabecera .logo` |
| 385 | El titulo se revela de izquierda a derecha | `html:not(.pa-quieto) .cabecera h1` |
| 386 | Lema, subtitulo y autor llegan detras | `html:not(.pa-quieto) :is(.cabecera .subtitulo, .cabecera .autor, .cabecera .intro, .cabece` |
| 387 | Los paneles de la columna suben en cascada al abrir la app | `html:not(.pa-quieto) .contenedor > aside > .panel` |
| 388 | La barra inferior sube desde el borde al aparecer | `html:not(.pa-quieto) .barra-inferior:not([hidden])` |
| 391 | Barra de "su plan esta al N %": se rellena y la cruza un destello cuando cambia | `html:not(.pa-quieto) .comp-barra.rellena span` |
| 394 | El contenido de cada pestana entra con un enfoque corto | `html:not(.pa-quieto) #contenido-tab.entra` |
| 401 | Veredicto: un barrido de luz lo recorre al aparecer el informe | `.veredicto::before` |
| 403 | El medicamento recien anadido entra deslizando ademas de iluminarse | `html:not(.pa-quieto) #lista-meds li.nuevo` |
| 408 | Las insignias de la barra inferior laten una vez cuando cambia su numero | `html:not(.pa-quieto) .nav-badge.late` |
| 409 | Hoja de anadir: sube con muelle en el movil y se acerca en escritorio | `html:not(.pa-quieto) dialog.hoja[open]` |
| 410 | Sus opciones entran en cascada cada vez que se abre | `html:not(.pa-quieto) .hoja-opciones button` |
| 413 | Ventanas en el movil: suben con muelle | `html:not(.pa-quieto) dialog.ficha[open]` |
| 414 | El velo de detras de las ventanas se funde | `html:not(.pa-quieto) dialog[open]::backdrop` |
| 415 | Menu "Mas": se despliega desde su esquina | `html:not(.pa-quieto) .menu-mas[open] .menu-lista` |
| 416 | Y sus opciones caen en cascada | `html:not(.pa-quieto) .menu-mas[open] .menu-lista > *` |
| 418 | Luz que sigue al raton: se enciende suave | `html:not(.pa-quieto) .con-luz` |
| 419 | Aviso breve: una linea fina se vacia mientras dura | `.toast::after` |
| 421 | Casillas de Datos: la marca da un pequeno salto al marcarla | `html:not(.pa-quieto) .condiciones input[type="checkbox"]:checked` |
| 423 | Plegables: lo de dentro cae desde arriba con mas suavidad al abrir | `html:not(.pa-quieto) :is(details.farmaco[open] > .cuerpo, details.alarma[open] > ul, detai` |
| 425 | Recorrido guiado: la caja entra subiendo | `html:not(.pa-quieto) .tour:not([hidden]) .tour-caja` |
| 426 | Y la flecha cae y rebota una vez | `html:not(.pa-quieto) .tour-flecha:not([hidden])` |
| 427 | Imagenes de las ventanas (sesion, SPPB, cribado) se enfocan al abrir | `html:not(.pa-quieto) :is(dialog[open] .ses-img, dialog[open] .sppb-img img, dialog[open] .` |
| 428 | El aviso de version nueva cae desde arriba | `html:not(.pa-quieto) .aviso-actualizar:not([hidden])` |
| 429 | Los avisos de la cabecera aparecen con un fundido | `html:not(.pa-quieto) .cabecera :is(.banner, .conexion):not([hidden])` |
| 430 | Hoja de ayuda: el texto aparece tras la hoja | `html:not(.pa-quieto) #ayuda[open] .hoja-cuerpo` |
| 409, 412 | Ventanas en escritorio: se acercan con un enfoque | `html:not(.pa-quieto) :is(dialog.ficha[open], dialog.hoja[open])` |
| 389 | Barra inferior: la pastilla del apartado activo crece desde el centro | `.barra-inferior button` |
| 390 | Y su linea de luz superior se abre desde el centro | `.barra-inferior button::before` |
| 392 | Cifras que cuentan (resumen y "su plan esta al N %"): brillan mientras cuentan | `.tile .num, .comp-num` |
| 393 | Barra inferior: el icono del apartado activo sube un poco con muelle | `.barra-inferior button.activo svg` |
| 395 | Pestanas: color, fondo y anillo cambian con transicion | `.tabs button` |
| 396 | Y el icono de la elegida se agranda con muelle | `.tabs button svg` |
| 402 | Veredicto: al cambiar de nivel, los colores se funden en vez de saltar | `.veredicto` |
| 404 | Boton principal: un destello lo cruza al pasar el raton (una vez por pasada) | `.btn` |
| 405 | Boton principal: su halo crece suave al pasar el raton | `.btn` |
| 406 | Boton secundario: su anillo aparece suave | `.btn-sec` |
| 407 | Boton de ayuda "?": anillo de luz con transicion | `.btn-ayuda:hover, .btn-ayuda:focus-visible` |
| 411 | Hoja de anadir: el icono de cada opcion gira un poco al pasar el raton | `.hoja-opciones button:hover svg` |
| 417 | Menu "Mas": la opcion bajo el raton lleva un filo de luz | `.menu-lista [role=menuitem]` |
| 418 | Luz que sigue al raton sobre tarjetas, documentos y cifras (solo con raton; no se mueve sola) | `:is(details.farmaco, .btn-doc, #lista-meds li, .completitud, .vistazo, .tile, .veredicto, ` |
| 420 | Aviso breve: entra con un pequeno muelle | `.toast` |
| 422 | Chips: se hunden con muelle al pulsarlos y cambian de color con transicion | `.chip-btn` |
| 424 | Flechas de los plegables: giran con muelle | `:is(details.farmaco summary, details.seccion > summary, details.bloque > summary) .flecha` |
| 397 | Tarjetas del informe y filas de la lista entran al aparecer | `html:not(.pa-quieto) :where(details.seccion, details.farmaco, article.ddi, article.regla, ` |
| 398 | Los bloques grandes entran al llegar a ellos | `html:not(.pa-quieto) :where(.esencial, .vistazo, .hoy, .completitud, .descargas, .plan-dia` |
| 399 | Paginas secundarias: cada seccion entra al llegar a ella | `html:not(.pa-quieto) :where(main.acerca section, main.legal section, .paso-guia, .guia-pag` |
| 400 | Barra de progreso de lectura en lo alto (solo si el navegador sabe ligarla al desplazamiento) | `html:not(.pa-quieto) body::before` |
| 431 | Barra inferior: cristal mas hondo, con algo mas de color detras | `.barra-inferior` |
| 432 | Barra inferior en oscuro: resplandor morado bajo su linea de luz | `:root[data-theme="dark"] .barra-inferior` |
| 433 | Cifras del resumen: esquinas de visor, como un panel de mando | `.tile::after` |
| 434 | Cifras del resumen en oscuro: resplandor tenue | `:root[data-theme="dark"] .tile .num` |
| 435 | Veredicto: halo del color de su nivel (con filtro, para conservar su filo interior) | `.veredicto.v-alerta` |
| 436 | Campos: al escribir, el anillo de foco suma un resplandor | `input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):focus, select:focus, ` |
| 437 | Buscador: el mismo resplandor, algo mas amplio | `.buscador input:focus` |
| 438 | Campos numericos (edad, dosis, tomas, constantes): digitos de ancho fijo | `input[type="number"]` |
| 439 | Resultados de la busqueda: filo de luz a la izquierda al pasar o elegir | `#sugerencias li` |
| 440 | Palabras del glosario: se iluminan al pasar el raton | `abbr.glos` |
| 441 | Barra de "su plan esta al N %": cabeza de luz al final del relleno | `.comp-barra span` |
| 442 | Pestana elegida: su contador con resplandor | `.tabs button[aria-selected="true"] .cnt` |
| 443 | Ventanas: brillo superior de cristal | `dialog.ficha, dialog.hoja` |
| 444 | Ventanas en oscuro: borde de luz mas visible | `:root[data-theme="dark"] :is(dialog.ficha, dialog.hoja)` |
| 445 | Lo esencial y fichas: el punto de precaucion tambien con halo | `.esencial li.nivel-precaucion .punto, details.farmaco ul li.nivel-precaucion .punto` |
| 446 | Interacciones importantes: halo rojo tenue | `article.ddi.ddi-mayor` |
| 447 | Semana de "hoy": las barras con un brillo suave | `.sem-barra i` |
| 448 | Y la barra del dia de hoy, mas luminosa | `.sem-dia.hoy .sem-barra` |
| 449 | Resumen en oscuro: la rejilla entre cifras con un hilo de luz | `:root[data-theme="dark"] #resumen` |
| 450 | Lo esencial: hilo de luz bajo su cabecera | `.esencial-cab` |
| 451 | De un vistazo: al pasar el raton, el resplandor de cada columna crece | `.semaforo-col` |
| 452 | Safari de escritorio: barra de desplazamiento fina con el degradado de la marca | `::-webkit-scrollbar` |
| 453 | Imagenes en oscuro: un punto menos de brillo para no deslumbrar | `:root[data-theme="dark"] :is(.plan-banda, .ses-img, .sppb-img img, .crib-img, .paso-guia i` |
| 454 | Fondo en oscuro: aurora fija muy tenue en lo alto (quieta) | `:root[data-theme="dark"] body::after` |
| 455 | Barra de progreso de lectura: degradado de la marca al oro, con brillo | `body::before` |
| 456 | Aviso de version nueva: borde de luz y sombra mas honda | `.aviso-actualizar` |
| 457 | Insignias de la barra inferior: halo del color de aviso | `.nav-badge` |
| 458 | Nivel de evidencia: su punto con halo | `.evidencia::before` |
| 459 | Regla revisada: la marca de visto con brillo en oscuro | `:root[data-theme="dark"] .estado-regla.ok` |
| 460 | Tira de dias: el dia elegido con resplandor | `.tira .dia.sel` |
| 461 | Datos del contexto (chips del informe): brillo superior de cristal | `.contexto-chips .chip` |
| 462 | Documentos para descargar: anillo de la marca al pasar el raton | `.btn-doc` |
| 463 | Hoja de anadir: el circulo del icono se ilumina al pasar el raton | `.hoja-opciones button svg` |
| 464 | Recorrido guiado: el numero de paso con brillo de terminal | `.tour-paso` |
| 465 | Logo de la cabecera: su brillo se intensifica al pasar el raton | `.cabecera .logo` |
| 466 | Paginas secundarias: los enlaces del texto con un subrayado que crece al pasar | `:is(main.acerca, main.legal, .guia-pag, main.novedades) :is(p, li, dd) a:not(.btn):not(.bt` |
| 467 | Selector de idioma de la cabecera: anillo de luz al pasar el raton | `.cabecera .utiles .idioma select` |
| 468 | Presentacion en oscuro: las cifras con resplandor | `:root[data-theme="dark"] .pres .cifras b` |
| 469 | Guia: las capturas con un marco de luz al pasar el raton | `.paso-guia img` |
| 470 | Legal: las pildoras del indice se iluminan con transicion | `main.legal .toc a` |
| 471 | Acerca: cada seccion con un borde de luz al pasar el raton | `main.acerca section` |
| 472 | Presentacion: las funciones se elevan con luz al pasar el raton | `.pres .funcion` |
| 473 | Hojas inferiores del movil: el asa de arrastre con brillo | `dialog.hoja::before, dialog.ficha::before` |
| 474 | Botones desactivados: sin halo ni brillo | `.btn:disabled` |
| 475 | Pie de las interacciones: hilo de luz encima de las fuentes | `p.nota-fuentes` |
| 476 | SPPB: la pildora de "paso N de M" con resplandor | `.sppb-progreso` |
| 477 | Resumen de hoy: las cifras con digitos de ancho fijo | `.hoy-resumen b` |
| 478 | Imagen de cada dia del plan: se funde por abajo con la tarjeta | `.plan-dia > .plan-banda` |
| 479 | Alto contraste: sin luces, halos, cristal ni esquinas de esta ronda | `:root[data-theme="contrast"] :is(article.ddi.ddi-mayor, .tira .dia.sel, .tira .dia.hoy.sel` |
| 480 | Impresion: nada de lo nuevo (ni luces, ni barra de lectura, ni mascaras) | `body::before, body::after, .tile::after, .comp-barra span::after, .veredicto::before, .btn` |
| 483 | Datos: la fila de una casilla marcada se tine con transicion | `.condiciones .check` |
| 484 | Medicacion: el icono de "Mas formas de anadir" sube un poco al pasar el raton | `#btn-anadir svg` |
| 486 | Lista: el lapiz de editar la dosis se inclina al pasar el raton | `#lista-meds .med-dosis .editar svg` |
| 494 | Descargas: la flecha de cada documento baja al pasar el raton | `.docs .btn-doc::after` |
| 510 | Menu "Mas": los tres puntos giran al abrirlo | `.menu-mas > summary > span[aria-hidden="true"]` |
| 528 | Paciente / profesional: la opcion elegida cambia con transicion | `.modo button` |
| 529 | Pantallas pequenas: las entradas recorren menos distancia | `:root` |
| 481 | Datos: la cuenta de casillas marcadas late al cambiar | `html:not(.pa-quieto) :is(.marcadas, .cuenta-meds).late` |
| 482 | Medicacion: el contador de la lista late al cambiar | `html:not(.pa-quieto) :is(.marcadas, .cuenta-meds).late` |
| 485 | Buscador: la lista de resultados se despliega desde el campo al aparecer | `html:not(.pa-quieto) #sugerencias:not([hidden])` |
| 487 | Suplementos y plantas: al abrir el plegable, las fichas se despliegan | `html:not(.pa-quieto) .sup-rapido[open] .sup-chips` |
| 488 | Informe: los botones del veredicto entran en cascada al aparecer el informe | `html:not(.pa-quieto) #veredicto-acciones > *` |
| 489 | Informe: el titulo se revela de izquierda a derecha | `html:not(.pa-quieto) .cabecera-informe h2` |
| 492 | Pestanas: el contador de la elegida late al elegirla | `html:not(.pa-quieto) .tabs button[aria-selected="true"] .cnt` |
| 503 | Sesion: la lista de comprobacion entra en cascada al abrirla | `html:not(.pa-quieto) #chequeo li` |
| 504 | Cronometro de la sesion y del SPPB: el anillo entra girando | `html:not(.pa-quieto) .crono > svg` |
| 505 | SPPB: el titulo de cada prueba se revela al cambiar de paso | `html:not(.pa-quieto) #sppb-cuerpo h2` |
| 506 | SPPB: la pildora de "paso N de M" cae al cambiar de paso | `html:not(.pa-quieto) #sppb-cuerpo .sppb-progreso` |
| 507 | Ficha de consulta: las partes del farmaco entran en cascada al elegirlo | `html:not(.pa-quieto) #ficha-cuerpo > *` |
| 508 | Recorrido guiado: el anillo del paso se cierra sobre lo que senala | `html:not(.pa-quieto) .tour-foco` |
| 509 | Codigo QR: aparece con un pequeno rebote | `html:not(.pa-quieto) dialog.qr[open] .qr-cuerpo :is(img, canvas, svg)` |
| 511 | Cabecera: los botones de arriba llegan en cascada al abrir la app | `html:not(.pa-quieto) .utiles > *` |
| 512 | La linea de estado de la base aparece despues | `html:not(.pa-quieto) #kb-version` |
| 517 | Guia: las respuestas frecuentes caen al abrirlas | `html:not(.pa-quieto) .guia-pag .faq details[open] > :not(summary)` |
| 519 | Legal: las pildoras del indice llegan en cascada | `html:not(.pa-quieto) main.legal .toc a` |
| 521 | Presentacion: el titular se revela | `html:not(.pa-quieto) .pres .hero h1` |
| 522 | Presentacion: las cifras llegan en cascada | `html:not(.pa-quieto) .pres .cifras > *` |
| 523 | Presentacion: las capturas del principio se enfocan | `html:not(.pa-quieto) .pres .hero figure img` |
| 527 | Paginas secundarias: el boton "Volver" entra desde la izquierda | `html:not(.pa-quieto) .volver` |
| 530 | A quien vuelve a la app, la cabecera no le repite toda la entrada: solo un fundido | `html.retorno:not(.pa-quieto) :is(.cabecera, .cabecera .logo, .cabecera h1, .utiles > *)` |
| 490 | De un vistazo: las tres columnas entran escalonadas | `html:not(.pa-quieto) .semaforo-col` |
| 491 | Lo esencial: cada punto entra uno a uno | `html:not(.pa-quieto) .esencial ol > li` |
| 493 | Pestanas en el movil: las que estaban fuera entran al desplazar la fila | `html:not(.pa-quieto) .tabs button` |
| 495 | Descargas: los cuatro documentos llegan escalonados | `html:not(.pa-quieto) .docs .btn-doc` |
| 496 | Hoy: las barras de la semana crecen desde abajo | `html:not(.pa-quieto) .sem-barra i` |
| 497 | Hoy: los dias de la semana aparecen en cascada | `html:not(.pa-quieto) .semana > *` |
| 498 | Mi plan: el anillo crece al llegar | `html:not(.pa-quieto) .plan-cab .anillo` |
| 499 | Mi plan: la racha llega tras el anillo | `html:not(.pa-quieto) .plan-cab .plan-racha` |
| 500 | Mi plan: los dias de la tira entran al desplazarla | `html:not(.pa-quieto) .tira .dia` |
| 501 | Mi plan: los bloques de la sesion del dia, uno a uno | `html:not(.pa-quieto) .plan-dia ol.bloques > li` |
| 502 | Mi plan: la imagen del dia se aclara al llegar | `html:not(.pa-quieto) .plan-dia > .plan-banda` |
| 513 | Pie: la firma aparece al llegar al final | `html:not(.pa-quieto) :is(.pie, p.pie, .pie-legal)` |
| 514 | Acerca: los datos de la base llegan uno a uno | `html:not(.pa-quieto) #estado-kb > div` |
| 515 | Guia: las capturas se aclaran al llegar | `html:not(.pa-quieto) .paso-guia img` |
| 516 | Guia: el numero de cada paso salta al llegar | `html:not(.pa-quieto) .paso-guia h2 b` |
| 518 | Novedades: el punto dorado de cada version se enciende al llegar | `html:not(.pa-quieto) main.novedades article::after` |
| 520 | Legal: los titulos se revelan al llegar | `html:not(.pa-quieto) main.legal h2` |
| 524 | Presentacion: las tarjetas de "Para quien" llegan escalonadas | `html:not(.pa-quieto) .pres .tarjetas .tarjeta` |
| 525 | Presentacion: los pasos para empezar, uno a uno | `html:not(.pa-quieto) .pres ol.pasos3 > li` |
| 526 | Presentacion: los enlaces del autor llegan en cascada | `html:not(.pa-quieto) .pres .firma-pres .enlaces > *` |

## OTRAS TRES TANDAS (531-680): TRANSICIONES NATIVAS, TACTO, PROFUNDIDAD Y DETALLES. Mismas reglas que el bloque 381-530: u

| N.º | Qué hace | Selector |
|---|---|---|
| 531-534 | Plegables: se abren y se cierran deslizando su altura (531), sin cortar sombras ni anillos (532), con fundido (533) y algo mas rapidos los pequenos (534) | `html:not(.pa-quieto) details:not(.menu-mas)` |
| 535 | Al pasar de una pagina de la app a otra (Acerca, Guia, Novedades...), transicion en vez de salto | `` |
| 536 | La cabecera viaja de una pagina a la siguiente | `.cabecera` |
| 537 | La pagina que se va sube y se funde; la nueva llega desde abajo | `::view-transition-old(root)` |
| 538 | El viaje de la cabecera con su propia curva | `::view-transition-group(pa-cabecera)` |
| 539 | Tema claro/oscuro: el nuevo se abre en circulo desde el boton (el circulo lo dibuja app.js) | `html.vt-tema::view-transition-old(root), html.vt-tema::view-transition-new(root)` |
| 540 | Cambio de idioma: fundido cruzado (app.js; usa las curvas de 537) | `` |
| 541 | Pestanas: el contenido entra desde el lado de la pestana elegida | `html:not(.pa-quieto) #contenido-tab.entra[data-dir="dcha"]` |
| 542 | Onda que sale del punto donde se pulsa (la anima app.js con la API de animaciones) | `html:not(.pa-quieto) :is(.btn-sec, .chip-btn, .tabs button, .menu-lista [role=menuitem]).o` |
| 557 | Aviso con accion: el boton llega un instante despues | `html:not(.pa-quieto) .toast.cuenta .btn-sec` |
| 558 | Visto de "guardado": un anillo verde se expande | `html:not(.pa-quieto) .celebra` |
| 559 | Resultado del chequeo: se despliega al aparecer | `html:not(.pa-quieto) .chequeo-resultado:not([hidden])` |
| 560 | Aviso de sesion suave: lo cruza un barrido de luz | `html:not(.pa-quieto) .chequeo-aviso` |
| 561 | Glosario: los terminos llegan en cascada | `html:not(.pa-quieto) #ayuda[open] .glosario > :nth-child(-n+12)` |
| 562 | Sugerencias: los tipos llegan en cascada | `html:not(.pa-quieto) dialog[open] #fb-tipos > .check` |
| 563 | Ficha de consulta: los resultados se despliegan desde el campo | `html:not(.pa-quieto) #ficha-sugerencias:not([hidden])` |
| 576 | Hoja de anadir: la etiqueta "Recomendado" la cruza un brillo | `html:not(.pa-quieto) dialog[open] .recomendado` |
| 577 | El aviso de "esto es un ejemplo" entra al aparecer | `html:not(.pa-quieto) .banner-ejemplo:not([hidden])` |
| 578 | Lista vacia: la ilustracion cae flotando | `html:not(.pa-quieto) #sin-meds:not([hidden]) .ilustracion` |
| 543 | Documentos y opciones de la hoja: se inclinan un poco hacia el puntero (solo con raton) | `.docs, .hoja-opciones` |
| 544-548 | Profundidad ligada al desplazamiento | `` |
| 544 | El logo y el titulo se quedan un poco atras al bajar | `html:not(.pa-quieto) .cabecera .logo` |
| 545 | La cabecera se aleja un poco al salir de la vista | `html:not(.pa-quieto) .cabecera` |
| 548 | La barra de lectura brilla en dorado al llegar al final | `html:not(.pa-quieto) body::before` |
| 546 | Ventanas largas (ficha, sesion, SPPB...): linea de lectura bajo su cabecera | `dialog.ficha` |
| 547 | Y en las hojas (ayuda, glosario) | `dialog.hoja` |
| 549 | Barra inferior: el icono rebota al pulsar | `.barra-inferior button svg` |
| 550 | Pestanas: se hunden un poco al pulsar | `.tabs button:active` |
| 551 | Opciones de la hoja de anadir: se hunden al pulsar | `.hoja-opciones button:active` |
| 552 | Documentos: bajan un poco al pulsar | `.btn-doc:active` |
| 553 | Dias de la tira: bajan un poco al pulsar | `.tira .dia:active` |
| 554 | Momentos de la toma: se hunden con muelle | `.momentos .mom` |
| 555 | Sesion: al marcar un bloque, una linea lo tacha de izquierda a derecha | `.bloques.grande li label b` |
| 556 | Y su dibujo encoge con transicion | `.bloques.grande .picto` |
| 571 | Interacciones: las tarjetas se elevan (sombra) al pasar el raton | `:is(article.ddi, details.farmaco)` |
| 572 | Fichas de farmaco: igual | `:is(article.ddi, details.farmaco)` |
| 573 | Lista: el icono del grupo crece al pasar el raton por la fila | `#lista-meds li .ic-grupo` |
| 574 | Menu: el icono de cada opcion se desplaza al pasar | `.menu-lista .ic-menu` |
| 575 | Anadir rapido: el "+" gira al pasar | `#rapido .chip-btn::before` |
| 580 | Boton "Escuchar": el altavoz crece al pasar | `:is(.escuchar-tab, .esencial-cab) .btn-sec svg` |
| 579 | Enlaces a la ficha tecnica: flecha que avanza al pasar | `.enlace-ft::after` |
| 564-570 | Entradas al llegar (pestanas Cuando, Antes de empezar e Interacciones) | `.barra-imp` |
| 564 | Cuando: la franja de horas se dibuja de izquierda a derecha | `html:not(.pa-quieto) .timeline` |
| 565 | Cuando: las horas buenas y regulares saltan | `html:not(.pa-quieto) .timeline .hora:not(.nivel-neutro)` |
| 566 | Cuando: los mejores momentos llegan deslizando | `html:not(.pa-quieto) .mejores b` |
| 567 | Carga de precauciones: las barras se rellenan | `html:not(.pa-quieto) .barra-imp span` |
| 568 | Interacciones: el "+" entre farmacos gira al llegar | `html:not(.pa-quieto) article.ddi .mas` |
| 569 | Lo esencial: la nota final aparece con fundido | `html:not(.pa-quieto) .esencial-nota` |
| 570 | Efectos que se acumulan: las filas llegan una a una | `html:not(.pa-quieto) #perfil li` |
| 582 | Datos: la fila de "Alguna caida" se tine con transicion | `label.check:has(#caidas)` |
| 583 | Botones de ayuda "?": giran un poco al pasar el raton | `.btn-ayuda` |
| 581 | Datos: al abrir un plegable de situacion, las casillas llegan en cascada | `html:not(.pa-quieto) #panel-datos details[open] .condiciones > .check` |
| 584 | Medicacion: el formulario de dosis se despliega al elegir un producto | `html:not(.pa-quieto) #dosis-wrap:not([hidden])` |
| 585 | Medicacion: las dosis habituales llegan en cascada | `html:not(.pa-quieto) #dosis-presets:not([hidden]) > *` |
| 586 | Medicacion: el contador de suplementos late al cambiar | `html:not(.pa-quieto) .sup-cuenta.late` |
| 587 | Medicacion: los avisos de una importacion se despliegan al aparecer | `html:not(.pa-quieto) :is(.aviso-import, .no-reconocidos, .cambios):not([hidden])` |
| 588 | Medicacion: la nota de privacidad aparece despues | `html:not(.pa-quieto) .privacidad` |
| 601 | Sesion: los bloques llegan en cascada al empezar | `html:not(.pa-quieto) #sesion-cuerpo .bloques.grande > li` |
| 604 | SPPB: la explicacion de cada prueba aparece tras el titulo | `html:not(.pa-quieto) #sppb-cuerpo > p:not(.sppb-progreso)` |
| 605 | SPPB: el campo de segundos llega el ultimo | `html:not(.pa-quieto) #sppb-cuerpo .crono-seg` |
| 606 | Ventanas: el titulo se revela al abrir | `html:not(.pa-quieto) dialog[open] :is(.ficha-cab, .hoja-cab) > p:first-child` |
| 607 | Ventanas: el boton Cerrar llega desde la derecha | `html:not(.pa-quieto) dialog[open] :is(.ficha-cab, .hoja-cab) > .btn-sec` |
| 608 | Recorrido: la imagen de cada paso aparece con un rebote | `html:not(.pa-quieto) .tour:not([hidden]) .tour-img:not([hidden])` |
| 609 | Recorrido: el numero de paso cae | `html:not(.pa-quieto) .tour:not([hidden]) .tour-paso` |
| 610 | Modo profesional: un brillo dorado cruza la etiqueta PROFESIONAL al aparecer | `html:not(.pa-quieto) .badge-pro` |
| 615 | Guia: el boton "Abrir la aplicacion" sube al cargar | `html:not(.pa-quieto) .guia-abrir .btn` |
| 618 | Presentacion: la entradilla llega tras el titular | `html:not(.pa-quieto) .pres .hero .lead` |
| 619 | Presentacion: los botones del principio llegan en cascada | `html:not(.pa-quieto) .pres .hero .acciones > *` |
| 628 | Hoja de anadir: "Dictar" encendido lanza un anillo de luz | `html:not(.pa-quieto) #btn-dictar[aria-pressed="true"] svg` |
| 629 | Recorrido 1-2-3: "Todo listo" aparece con un rebote | `html:not(.pa-quieto) .rec-listo:not([hidden])` |
| 630 | Primera vez: los botones de empezar llegan en cascada | `html:not(.pa-quieto) #sin-meds:not([hidden]) .acciones > *` |
| 589 | Informe: las cuatro cifras del resumen se encienden escalonadas | `html:not(.pa-quieto) #resumen .tile` |
| 590 | Informe: los datos del contexto aparecen al llegar | `html:not(.pa-quieto) #contexto > *` |
| 591 | Informe: "El detalle, por tipo de ejercicio" se revela | `html:not(.pa-quieto) .detalle-t` |
| 592 | Informe: el titulo de las descargas se revela | `html:not(.pa-quieto) .descargas h3` |
| 593 | Informe: los botones de compartir llegan en cascada | `html:not(.pa-quieto) :is(.compartir, .compartir-enlaces) > *` |
| 594 | Informe: la nota de las descargas aparece la ultima | `html:not(.pa-quieto) .descargas > small` |
| 595 | Hoy: los botones llegan en cascada | `html:not(.pa-quieto) .hoy-botones > *` |
| 596 | Hoy: el punto de la cabecera se enciende | `html:not(.pa-quieto) .hoy-cab small::before` |
| 597 | Mi plan: la tendencia y el progreso entran al llegar | `html:not(.pa-quieto) :is(.tendencia, .plan-prog)` |
| 598 | Mi plan: los botones del dia llegan en cascada | `html:not(.pa-quieto) .plan-dia .acciones > *` |
| 599 | Mi plan: la nota FITT aparece con fundido | `html:not(.pa-quieto) .plan-fitt` |
| 600 | Mi plan: el aviso de los dias de ejercicio entra al llegar | `html:not(.pa-quieto) .aviso-plan` |
| 602 | Sesion: el cierre (esfuerzo y terminar) entra al llegar | `html:not(.pa-quieto) .sesion-fin` |
| 603 | Sesion: la imagen final se aclara | `html:not(.pa-quieto) .sesion-fin .ses-img` |
| 611 | Acerca: el titulo de cada seccion se revela | `html:not(.pa-quieto) main.acerca h2` |
| 612 | Acerca: las listas llegan una a una | `html:not(.pa-quieto) main.acerca li` |
| 613 | Legal: los recuadros destacados se acercan | `html:not(.pa-quieto) main.legal .destacado` |
| 614 | Guia: el pie de cada captura aparece tras ella | `html:not(.pa-quieto) .paso-guia figcaption` |
| 616 | Guia: las preguntas frecuentes llegan una a una | `html:not(.pa-quieto) .guia-pag .faq details` |
| 617 | Novedades: cada cambio llega deslizando | `html:not(.pa-quieto) main.novedades li` |
| 620 | Presentacion: las capturas de las funciones se aclaran | `html:not(.pa-quieto) .pres .funcion img` |
| 621 | Presentacion: los limites llegan uno a uno | `html:not(.pa-quieto) .pres .limites li` |
| 622 | Presentacion: la firma del autor se acerca | `html:not(.pa-quieto) .pres .firma-pres` |
| 623 | Presentacion: los iconos de "Para quien" giran al llegar | `html:not(.pa-quieto) .pres .tarjeta .ic-big` |
| 624 | Lo esencial: el boton Escuchar llega desde la derecha | `html:not(.pa-quieto) .esencial-cab .btn-sec` |
| 625 | De un vistazo: el ritmo entra al llegar | `html:not(.pa-quieto) .vistazo .ritmo` |
| 626 | Pacientes guardados: llegan uno a uno | `html:not(.pa-quieto) .perfiles li` |
| 627 | Estadisticas de la consulta: las filas llegan una a una | `html:not(.pa-quieto) .stats-lista li` |
| 631 | Efectos que se acumulan: el numero en una pildora de luz | `#perfil li .num` |
| 632 | Titulos de tarjetas y ventanas equilibrados en sus lineas | `:is(#informe, dialog) :is(h3, h4)` |
| 633 | Pantallas muy estrechas: las palabras largas se parten con guion | `:is(#informe, dialog, #lista-meds) :is(p, li, dd)` |
| 634 | Digitos de ancho fijo en la tabla del plan, la franja de horas y la semana | `.tabla-plan td, .timeline .hora span, .tira .dia .n, .mejores b, .sem-ini, .hoy-resumen` |
| 635 | Ventanas: al llegar al final, el desplazamiento no arrastra la pagina de detras | `.ficha-cuerpo, .hoja-cuerpo` |
| 636 | Movil: sin el destello gris al tocar (cada control ya tiene su respuesta) | `:is(button, a, summary, label, [role="option"])` |
| 637 | Movil: respuesta inmediata al toque, sin esperar al doble toque | `:is(button, a, summary, label, input, select)` |
| 638 | Campos con un valor fuera de rango: borde y anillo rojos al salir de ellos | `:is(input, textarea):user-invalid:not(:focus)` |
| 639 | Campos: borde, anillo y fondo cambian con transicion | `input, select, textarea` |
| 640 | Foco con teclado: anillo doble con resplandor | `:is(button, a, summary, select, [tabindex]):focus-visible` |
| 641 | Datos tecnicos de una sugerencia: aspecto de terminal | `.fb-contexto` |
| 642 | Glosario: hilo de luz entre terminos en lugar de la raya de puntos | `.glosario dd` |
| 643 | Glosario: cada termino con un borde fino de luz | `.glosario dt` |
| 644 | Cuando: las horas regulares (ambar) tambien con su resplandor | `.timeline .hora.nivel-ambar` |
| 645 | Carga de precauciones: barras con brillo superior de cristal | `.barra-imp span` |
| 646 | Carga de precauciones: pista con marcas de medidor | `.barra-imp` |
| 647 | Interacciones: el "+" entre farmacos con un anillo de luz | `.ddi .mas` |
| 648 | Ficha de consulta vacia: caja punteada sobre la rejilla | `.ficha-cuerpo > .vacio` |
| 649 | Menu "Mas": un hilo de luz separa los ajustes de las paginas | `.menu-lista a[role=menuitem]:first-of-type` |
| 650 | Menu "Mas": el tamano de letra elegido en una pildora de terminal | `#letra-estado:not(:empty)` |
| 651 | Documentos: el icono se ilumina al pasar el raton | `.btn-doc svg` |
| 652 | Pacientes guardados: la fila se ilumina al pasar el raton | `.perfiles li` |
| 653 | Sesion: los extremos de la escala de esfuerzo con su color | `.rpe-escala > :first-child` |
| 654 | Sesion: el valor del esfuerzo en una pildora de neon | `.rpe-campo output` |
| 655 | SPPB: "No puede hacerlo" en tono ambar | `#sppb-nopuede` |
| 656 | Chequeo: "por tal farmaco" en letra de terminal | `.chequeo li small` |
| 657 | Recorrido: la caja con un borde de luz | `.tour-caja` |
| 658 | Recorrido: el fondo oscurece mas en los bordes | `.tour-fondo` |
| 659 | Visto de "guardado" con resplandor verde | `.celebra` |
| 660 | Aviso de version nueva: el boton "Actualizar" en dorado | `.aviso-actualizar .btn-sec` |
| 661 | Presentacion: las tarjetas de "Para quien" con borde de luz al pasar | `.pres .tarjeta` |
| 662 | Acerca: las cifras de la base, mas grandes | `#estado-kb dd` |
| 663-668 | Tema oscuro: campos (663), separadores de bloques (664), pestanas (665), glosario (666), "Que hacer" (667) y pista de la barra del plan (668) con luz morada | `:root[data-theme="dark"] :where(input:not([type="checkbox"]):not([type="radio"]):not([type` |
| 669 | Interacciones: "Que hacer" con un filo de luz a la izquierda | `article.ddi p.accion` |
| 670 | Lista: el icono del grupo con anillo de luz al pasar el raton por la fila | `#lista-meds li:hover .ic-grupo` |
| 671 | Escritorio: la columna izquierda se difumina arriba y abajo mientras queda por desplazar | `` |
| 672 | Escritorio: el indice del informe con un rail que se llena al leer | `.indice-informe` |
| 673 | Hoja de anadir: "Recomendado" con resplandor dorado | `.hoja-opciones .recomendado` |
| 674 | Lo esencial: cada punto se ilumina un poco al pasar el raton | `.esencial ol > li` |
| 675 | Buscadores: la "x" de borrar en el color de la marca | `input[type="search"]::-webkit-search-cancel-button` |
| 676 | Pie de la app: enlaces con un subrayado que crece al pasar | `.contenedor :is(.pie, .pie-legal) a` |
| 677 | Datos: la fila de cada situacion se ilumina al pasar el raton | `.condiciones .check:hover` |
| 678 | Ficha de consulta: los resultados con el filo de luz de la busqueda | `#ficha-sugerencias li` |
| 679 | Alto contraste: sin luces, anillos, rejillas ni mascaras de esta ronda | `:root[data-theme="contrast"] :is(#perfil li .num, .glosario dt, .ddi .mas, .timeline .hora` |
| 680 | Impresion: nada de lo nuevo | `.contenedor > aside` |

## TRES TANDAS 681-830: SALIDAS Y TRANSICIONES DE VISTA, ADAPTACION AL DISPOSITIVO Y DETALLES Mismas reglas: una vez y nunc

| N.º | Qué hace | Selector |
|---|---|---|
| 681 | Ventanas en el movil: se cierran bajando | `html:not(.pa-quieto) :is(dialog.ficha, dialog.hoja)` |
| 683 | Hojas (anadir, ayuda): tambien se cierran bajando | `html:not(.pa-quieto) dialog.hoja:not([open])` |
| 684 | El velo de detras de las ventanas se desvanece al cerrar | `html:not(.pa-quieto) dialog::backdrop` |
| 685 | Menu "Mas": se desvanece al cerrarse | `html:not(.pa-quieto) details.menu-mas::details-content` |
| 686 | Resultados del buscador: se desvanecen al cerrarse | `html:not(.pa-quieto) :is(#sugerencias, #ficha-sugerencias)` |
| 687 | Y los de la ficha de consulta | `html:not(.pa-quieto) :is(#sugerencias, #ficha-sugerencias)` |
| 688 | Aviso breve: entra desde un leve desenfoque | `html:not(.pa-quieto) .toast` |
| 699 | El titulo "Pauta Activa" se despliega a lo ancho al abrir | `html:not(.pa-quieto) .cabecera h1` |
| 717 | Sesion: la casilla de cada bloque salta al marcarla | `` |
| 727 | Chequeo antes de la sesion: la casilla salta al marcarla | `html:not(.pa-quieto) :is(.bloques.grande input, #chequeo input, #fb-tipos input, .crib-pre` |
| 728 | Sugerencias: la casilla de cada tipo salta al marcarla | `html:not(.pa-quieto) :is(.bloques.grande input, #chequeo input, #fb-tipos input, .crib-pre` |
| 729 | Cribado de seguridad: la respuesta elegida salta | `html:not(.pa-quieto) :is(.bloques.grande input, #chequeo input, #fb-tipos input, .crib-pre` |
| 723 | Paginas: al saltar a un apartado desde un enlace, su titulo destella | `html:not(.pa-quieto) :is(main.legal, main.acerca, .pres) section:target > h2` |
| 724 | Informe: al saltar desde el indice, el apartado destella | `html:not(.pa-quieto) :is(#veredicto, #hoy, #esencial, #vistazo, #detalle-t, #descargas):ta` |
| 682 | Ventanas y hojas en escritorio: se cierran alejandose | `html:not(.pa-quieto) :is(dialog.ficha, dialog.hoja):not([open])` |
| 710 | Ventanas largas: la linea de lectura se vuelve dorada al final | `html:not(.pa-quieto) :is(.ficha-cab, .hoja-cab)::after` |
| 711 | Y en las hojas | `html:not(.pa-quieto) :is(.ficha-cab, .hoja-cab)::after` |
| 702 | Titulos de los paneles de datos y medicacion: se despliegan a lo ancho al llegar | `html:not(.pa-quieto) :is(#panel-datos > h2, #panel-medicacion .cab-panel > h2)` |
| 689-696 | Transiciones de vista de la lista, del plan y del recorrido (las lanza app.js con conTransicion) | `html.vt-lista #lista-meds > li` |
| 689 | Lista: al quitar un medicamento, el resto se recoloca deslizandose | `html.vt-lista #lista-meds > li` |
| 690 | Lista: el que se quita sale hacia la izquierda encogiendose | `::view-transition-old(*.pa-med):only-child` |
| 692 | Lista: al deshacer, vuelve a aparecer en su sitio | `::view-transition-new(*.pa-med):only-child` |
| 691 | Lista: al pausar o reanudar, la fila cambia con un fundido (grupo propio) | `html.vt-dia .plan-dia` |
| 696 | Combinaciones a dosis fijas: al quitarlas, su cabecera sale con sus filas | `html.vt-dia .plan-dia` |
| 693 | Mi plan: al elegir otro dia, la tarjeta del dia cambia con un fundido que sube | `html.vt-dia .plan-dia` |
| 694 | Mi plan: el dia elegido vuela de su sitio al nuevo en la tira | `html.vt-dia .tira .dia.sel` |
| 695 | Recorrido guiado: la caja se desliza de un paso al siguiente | `html.vt-tour .tour-caja` |
| 697 | Pestanas: al quedarse fijas arriba, una linea de luz las subraya | `.tabs` |
| 698 | Y la elegida brilla un poco mas | `.tabs` |
| 700 | Cifras del resumen: se ensanchan al pasar el raton | `.tile .num` |
| 701 | Cifras que cuentan: se ensanchan mientras cuentan | `.comp-num` |
| 703 | Barra inferior: la etiqueta del apartado activo se ensancha | `.barra-inferior button span` |
| 704 | Menu: el texto de la opcion se ensancha al pasar | `.menu-lista [role=menuitem] > span:not(.ic-menu)` |
| 705 | Situaciones marcadas: el texto gana peso con transicion | `.condiciones .check` |
| 706 | Buscadores: al enfocarlos se encienden con un destello que se recoge | `html:not(.pa-quieto) .buscador input:focus` |
| 707 | La caja de sugerencias crece con lo que escribes | `#fb-texto, .registro textarea` |
| 708 | Y las notas del diario | `#fb-texto, .registro textarea` |
| 709 | Pildoras de altura fija con el texto centrado opticamente | `.nav-badge, #perfil li .num, .rpe-campo output` |
| 712 | Dias de la tira: se elevan al pasar el raton | `.tira .dia` |
| 713 | Dias de la semana de Hoy: crecen al pasar el raton | `.semana > *` |
| 714 | Pestanas: el icono se inclina al pasar el raton | `.tabs button svg` |
| 715 | Plegables: la flecha da un saltito al pasar el raton | `:is(details.farmaco summary, details.seccion > summary, details.bloque > summary) .flecha` |
| 719 | Compartir y botones del veredicto: el icono sube al pasar el raton | `:is(.compartir, .compartir-enlaces, #veredicto-acciones) button svg` |
| 720 | Presentacion: el icono de cada tarjeta de "Para quien" sube al pasar | `.pres .tarjeta .ic-big` |
| 721 | Guia: el numero de cada paso gira al pasar | `.paso-guia h2 b` |
| 722 | Novedades: el punto dorado brilla mas al pasar por su version | `main.novedades article::after` |
| 725 | Glosario: el termino se ilumina al pasar el raton | `.glosario dt` |
| 716 | Esfuerzo: el pulgar del control crece al arrastrarlo | `input[type="range"]::-webkit-slider-thumb` |
| 718 | Contador de cada pestana: cambia de color con transicion | `.tabs .cnt` |
| 726 | Sesion: al terminar un bloque, su dibujo gira un poco | `.bloques.grande .picto` |
| 730 | Boton de ayuda "?": se hunde al pulsarlo | `.btn-ayuda:active` |
| 731 | Contraste alto del sistema: bordes mas marcados en tarjetas, paneles y campos | `:is(.panel, details.farmaco, article.ddi, .semaforo-col, .tile, .btn-doc, .hoja-opciones b` |
| 732 | Contraste alto: el texto secundario mas oscuro (tema claro) | `:root[data-theme="light"]` |
| 733 | Contraste alto: sin resplandores decorativos en cifras y titulos | `:is(.tile .num, .tour-paso, .pres .cifras b, .crono #crono, .estado-regla.ok)` |
| 734 | Contraste alto: barras y ventanas sin cristal | `:is(.barra-inferior, .tabs, .toast)` |
| 735 | Contraste alto: todos los enlaces subrayados | `a:not(.btn):not(.btn-sec):not([role="menuitem"])` |
| 736 | Contraste alto: anillo de foco mas grueso | `:focus-visible` |
| 737 | Contraste alto: la pestana elegida con borde | `.tabs button[aria-selected="true"]` |
| 738 | Contraste alto: chips con borde del color del texto | `.chip-btn` |
| 739 | Contraste alto: sin luz que sigue al raton ni ondas | `.con-luz, .onda` |
| 740 | Colores forzados (Windows): pastillas, insignias y contadores con borde visible | `:is(.nav-badge, .tabs .cnt, .marcadas, .cuenta-meds, .sup-cuenta, .badge-pro, .recomendado` |
| 741 | Colores forzados: el apartado activo de la barra inferior con contorno | `.barra-inferior button.activo` |
| 742 | Colores forzados: barras de progreso y de la semana visibles | `:is(.comp-barra span, .barra-imp span, .sem-barra i, body::before)` |
| 743 | Colores forzados: puntos de nivel visibles | `.punto` |
| 744 | Colores forzados: sin mascaras que oculten texto o imagenes | `:is(.contenedor > aside, .plan-dia > .plan-banda)` |
| 745 | Colores forzados: la pestana elegida con borde | `.tabs button[aria-selected="true"]` |
| 746 | Colores forzados: botones desactivados en gris del sistema | `:is(.btn, .btn-sec):disabled` |
| 747 | Colores forzados: el foco del recorrido con contorno | `.tour-foco` |
| 748 | Transparencia reducida: barras, pestanas y avisos opacos | `:is(.barra-inferior, .tabs)` |
| 749 | Transparencia reducida: el velo de las ventanas sin desenfoque y mas opaco | `dialog::backdrop` |
| 750 | Transparencia reducida: sin aurora ni textura de fondo | `body::after` |
| 751 | Pantallas de color amplio: la linea de lectura y el apartado activo, en un neon mas vivo | `body::before` |
| 752 | Pantallas de color amplio: el resplandor de las cifras en oscuro, mas vivo | `:root[data-theme="dark"] .tile .num` |
| 753 | Movil en horizontal: barra inferior mas baja | `.barra-inferior button` |
| 754 | Movil en horizontal: cabecera con menos aire | `.cabecera` |
| 755 | Movil en horizontal: ventanas a casi toda la altura | `dialog.ficha, dialog.hoja` |
| 756 | Movil en horizontal: pestanas mas bajas | `.tabs button` |
| 757 | Movil en horizontal: la imagen del dia del plan mas baja | `.plan-dia > .plan-banda` |
| 758 | Movil en horizontal: el contenido respeta la muesca de la camara | `.contenedor` |
| 759 | App instalada: la cabecera respeta la zona de la camara | `.cabecera` |
| 760 | App instalada: sin seleccionar texto por error en la barra y las pestanas | `:is(.barra-inferior, .tabs, .tira)` |
| 761 | App instalada: sin el estirado al desplazar mas alla del final | `html` |
| 762 | App instalada: sin el boton de instalar en el menu | `#btn-instalar` |
| 763 | Teclado: la tarjeta plegable con el foco en su titulo muestra su borde de luz | `details:has(> summary:focus-visible)` |
| 764 | Teclado: la fila de la lista con el foco dentro se ilumina | `#lista-meds > li:has(:focus-visible)` |
| 765 | Teclado: el dia de la tira con el foco sube un poco | `.tira .dia:focus-visible` |
| 766 | Letra grande: las pildoras de numero crecen en proporcion | `html.letra-grande :is(#perfil li .num, .rpe-campo output)` |
| 767 | Letra grande: etiquetas de la barra inferior mayores | `html.letra-grande .barra-inferior button` |
| 768 | Pantallas de alta densidad: separadores de bloques mas finos y nitidos | `.bloques li` |
| 769 | Pantallas muy pequenas: etiquetas de la barra inferior mas pequenas | `.barra-inferior button` |
| 770 | Pantallas muy pequenas: pestanas con menos relleno | `.tabs button` |
| 771 | Tabletas: la barra inferior flota como una pastilla centrada | `.barra-inferior` |
| 772 | Escritorio con poca altura: la tarjeta del recorrido mas compacta | `.tour-caja` |
| 773 | Pantallas de tinta electronica: sin animaciones ni transiciones | `*, *::before, *::after` |
| 774 | Colores invertidos del sistema: las fotos y dibujos se ven bien | `img, .picto` |
| 775 | Oscuro: textura de grano finisima y quieta sobre el fondo, en toda la pantalla | `:root[data-theme="dark"] body::after` |
| 776 | Contraste alto de la app: el buscador sin destello, las pestanas sin linea de luz y sin transiciones de vista de la lista | `:root[data-theme="contrast"] .tabs::after` |
| 777 | Contraste alto de la app: los dias de la tira y de la semana sin crecer ni elevarse | `:root[data-theme="contrast"] :is(.tira .dia, .semana > *)` |
| 778 | Contraste alto de la app: el titulo sin desplegarse a lo ancho | `:root[data-theme="contrast"] :is(.cabecera h1, #panel-datos > h2, #panel-medicacion .cab-p` |
| 779 | Impresion: sin el grano del fondo | `body::after` |
| 780 | Impresion: las pildoras de numero con borde, para que se lean en blanco y negro | `:is(#perfil li .num, .rpe-campo output)` |
| 781 | "Su plan esta al N %": esquinas de visor | `` |
| 782 | De un vistazo: esquinas de visor | `` |
| 783 | Cabecera de Mi plan: esquinas de visor | `.vistazo, .semaforo-col, .crono` |
| 784 | Columnas del semaforo: esquinas de visor | `.vistazo, .semaforo-col, .crono` |
| 809 | Cronometro de la sesion y del SPPB: esquinas de visor | `.vistazo, .semaforo-col, .crono` |
| 785 | Semana de Hoy: las barras vacias con un rayado suave | `.sem-barra` |
| 786 | Tira de dias: el numero de hoy mas ancho | `.tira .dia.hoy .n` |
| 787 | Veredicto: el icono del nivel con un anillo de neon de su color | `.veredicto.v-alerta > p:first-of-type::before` |
| 788 | Resumen en claro: separadores con un hilo de luz | `:root[data-theme="light"] #resumen` |
| 789 | Pestanas: el contador de las no elegidas con un borde fino | `.tabs button:not([aria-selected="true"]) .cnt` |
| 790 | Fichas de farmaco abiertas: el icono del grupo con anillo de su color | `details.farmaco[open] .ic-grupo` |
| 791 | Interacciones importantes: la etiqueta de nivel con resplandor rojo | `article.ddi.ddi-mayor .nivel` |
| 792 | Interacciones: hilo de luz antes de las fuentes | `article.ddi footer` |
| 793 | Cuando: las horas de cada toma en letra de terminal y centradas | `.fila.horas-tomas input[type="number"]` |
| 794 | Legal: cada apartado con su numero de terminal | `main.legal` |
| 795 | Guia: cada captura con esquinas de visor | `:is(.paso-guia figure, .pres .hero figure)` |
| 796 | Presentacion: la captura principal con esquinas de visor | `:is(.paso-guia figure, .pres .hero figure)` |
| 797 | Paginas secundarias: "Volver" de cristal (claro) | `:is(main.acerca, main.novedades, .guia-pag) > .volver` |
| 798 | Y en oscuro | `:root[data-theme="dark"] :is(main.acerca, main.novedades, .guia-pag) > .volver` |
| 799 | Menu "Mas": las iniciales de cada icono en letra de terminal | `.menu-lista .ic-menu` |
| 800 | Cabecera: punto verde de "listo" delante de la version de la base | `#kb-version:not(:empty)::before` |
| 801 | Lista: los momentos de la toma elegidos con un brillo | `.momentos .mom[aria-pressed="true"]` |
| 802 | Lista: la etiqueta de dosis alta con resplandor ambar | `.chip-alta` |
| 803 | Buscador: lo escrito, resaltado con un subrayado de luz | `:is(#sugerencias, #ficha-sugerencias) mark` |
| 804 | Suplementos y plantas: el plegable abierto con borde de luz | `.sup-rapido[open]` |
| 805 | Hoy: las cifras de la semana en neon | `.hoy-resumen b` |
| 806 | Mi plan: los dias de ejercicio elegidos, con brillo | `.dias-resumen b.on` |
| 807 | Mi plan: la variante elegida (mas facil, normal, mas dificil) con resplandor | `.variantes button[aria-pressed="true"]` |
| 808 | Sesion: la tarjeta de cierre con un hilo de luz arriba | `.sesion-fin` |
| 810 | SPPB: la imagen de cada prueba con esquinas de visor | `.sppb-img` |
| 811 | Chequeo antes de la sesion: la imagen con un halo | `.chequeo .ses-img` |
| 812 | Aviso de version nueva: un punto dorado de novedad | `.aviso-actualizar::before` |
| 813 | Recorrido: la flecha con resplandor | `.tour-flecha` |
| 814 | Ventanas: el boton Cerrar con borde de luz | `:is(.ficha-cab, .hoja-cab) > .btn-sec` |
| 815 | Escritorio: un hilo de luz vertical separa la columna de la medicacion | `.contenedor > aside` |
| 816 | Oscuro: los documentos con borde de luz | `` |
| 817 | Oscuro: las tarjetas de interaccion con borde de luz | `:root[data-theme="dark"] :is(.btn-doc, article.ddi, .tira .dia:not(.sel))` |
| 818 | Oscuro: los dias de la tira con borde de luz | `:root[data-theme="dark"] :is(.btn-doc, article.ddi, .tira .dia:not(.sel))` |
| 819 | Oscuro: la barra de "su plan" con un filo de luz | `:root[data-theme="dark"] :is(.btn-doc, article.ddi, .tira .dia:not(.sel))` |
| 820 | Claro: los documentos con un degradado muy suave | `:root[data-theme="light"] .btn-doc` |
| 821 | Claro: las columnas del semaforo sobre la rejilla tecnica | `:root[data-theme="light"] .semaforo-col` |
| 822 | Glosario: la definicion con interlineado de lectura | `.glosario dd` |
| 823 | Plegables de Datos: el contador de marcadas en letra de terminal | `.marcadas` |
| 824 | Toda la app: las cifras de los chips de dias de la semana en terminal | `.dias-chips .chip-btn` |
| 825 | Documentos: el nombre del documento en seminegrita ancha | `.btn-doc b` |
| 826 | Alto contraste: sin esquinas de visor, rayados, cristal ni puntos de estado | `:root[data-theme="contrast"] :is(.completitud, .vistazo, .plan-cab, .semaforo-col, .crono,` |
| 827 | Alto contraste: "Volver" opaco y sin desenfoque | `:root[data-theme="contrast"] :is(main.acerca, main.novedades, .guia-pag) > .volver` |
| 828 | Alto contraste: sin halos ni anillos nuevos | `:root[data-theme="contrast"] :is(.veredicto > p:first-of-type)::before` |
| 829 | Impresion: sin esquinas de visor, puntos de estado ni rayados | `:is(.completitud, .vistazo, .plan-cab, .semaforo-col, .crono, .paso-guia figure, .pres .he` |
| 830 | Colores forzados: sin esquinas de visor ni rayados | `:is(.completitud, .vistazo, .plan-cab, .semaforo-col, .crono, .paso-guia figure, .pres .he` |

## 20 mejoras grandes (v1.2)

Bloque «20 MEJORAS GRANDES (v1.2)» al final de la hoja; cada mejora lleva un comentario `/* G<n> ... */` con su número de la propuesta.

| N.º | Qué hace | Selector |
|---|---|---|
| G6 | Entrenador por voz: cronómetro fijo arriba, línea «ahora» (n/N, nombre, tiempo que queda, «Siguiente»), casilla de la voz, ejercicio en curso resaltado con barra de tiempo, ventana de la sesión en columna flexible | `#sesion .crono`, `.crono-ahora`, `.voz-check`, `.bloques.grande > li.en-curso` |
| G11 | Semana activa: tokens `--r-a1..3` y `--m12-0..3` (claro, oscuro y contraste), anillos concéntricos que se rellenan, leyenda con marca de cumplido, racha en dos líneas, mapa de 12 semanas (rejilla por columnas, hoy, elegido, futuro, marcas de semana cumplida, leyenda); día elegido de la tira con borde en alto contraste | `.anillos`, `.anillos-ley`, `.plan-cab.con-anillos`, `.mapa-semanas`, `.mapa12`, `.m12-*` |
| G1 | «¿Por qué?»: chips «Entender por qué» bajo los avisos de cada medicamento (icono de interrogación en línea, versión oscura y de contraste) y botón en los efectos a vigilar; las escenas animadas llevan sus estilos en `js/porque.js` | `.pq-chips`, `.pq-btn`, `#perfil li .pq-mini` |
| G19 | «Hoy» de un vistazo: cuidados del día (ámbar, con «¿Por qué?»), botón «Solo lo de hoy» y modo sencillo (oculta todo salvo `#sencillo`, letra mayor, botón grande, anillos compactos, alarma); `.pq-mini` pasa a ser general | `.hoy-cuidados`, `.hoy-cuid`, `body.sencillo`, `.sencillo-vista`, `.sen-*`, `.pq-mini` |
