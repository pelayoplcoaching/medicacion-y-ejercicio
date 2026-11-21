# Limpieza de la hoja de estilos

Herramientas de la limpieza del 21/11/2026 (v1.1.4). Sirven para repetirla cuando la hoja crezca.

1. `python3 analiza.py` — informa de declaraciones siempre pisadas por otra posterior (mismo selector, contexto que lo cubre, sin `!important` en contra y sin valores que un navegador antiguo no entienda), selectores de clases o ids que no existen en la app, fotogramas repetidos o sin uso y variables sin uso. Deja el plan en `plan.json`.
2. `python3 aplica.py ENTRADA SALIDA --muertas` — quita lo que marca el plan (y reglas, bloques y comentarios numerados que se queden vacíos). Las listas fijas de dentro (selectores, variables, animaciones antiguas) son las de aquella limpieza: revísalas antes de usarlo otra vez.
3. `node difestilos.mjs antes.css despues.css` — con el servidor local en el puerto 8765, compara los estilos calculados de todos los elementos (y sus `::before`/`::after`) en 34 pantallas y estados. Debe dar 0 diferencias (con `IGNORA=--var1,--var2` para las variables quitadas).
4. `aplica.py ... --comentarios` — pasa las descripciones de los comentarios numerados a una tabla Markdown (para `docs/ESTILOS-MEJORAS.md`) y deja en la hoja solo el número.
