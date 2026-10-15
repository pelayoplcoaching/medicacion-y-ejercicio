# Auditoría Lighthouse · 15/10/2026 · Pauta Activa v0.15.0-alfa

Método: Lighthouse 13.5 sobre Chromium (headless nuevo), navegador en español (`--lang=es-ES`), servidor estático local con compresión gzip (equivalente a GitHub Pages), caché vacía. Móvil: Moto G Power emulado, 4G lento simulado, CPU ×4. Escritorio: preset `desktop`.

## Móvil

| Categoría | Puntuación |
|---|---|
| Rendimiento | 92 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

| Métrica | Valor |
|---|---|
| First Contentful Paint | 1.8 s |
| Largest Contentful Paint | 2.7 s |
| Total Blocking Time | 190 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 1.8 s |
| Time to Interactive | 3.3 s |

## Escritorio

| Categoría | Puntuación |
|---|---|
| Rendimiento | 100 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

| Métrica | Valor |
|---|---|
| First Contentful Paint | 0.4 s |
| Largest Contentful Paint | 0.6 s |
| Total Blocking Time | 20 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 0.5 s |
| Time to Interactive | 0.8 s |

## Correcciones aplicadas en esta auditoría

- Logos de cabecera y firma a su tamaño real (152 px y 80 px) en lugar del PNG de 1024 px; `fetchpriority="high"` en el logo.
- `kb.json` compacto (−35 %); `merge_kb.py` lo escribe así a partir de ahora.
- Fase 2 de datos (nomenclátor, DDInter, fichas) en `requestIdleCallback`: la interfaz responde antes.
- `modulepreload` de los módulos y `preload` de `kb.json` y `ddi_curated.json`: sin cascada de descargas.
- Fuentes con `font-display: optional` y fuente de reserva con métricas ajustadas a Manrope (`size-adjust`, `ascent/descent-override`, medidas sobre texto en español): sin salto al cargar la fuente.
- `data-modo="paciente"` en el HTML y el botón «Instalar» en una línea de estado con altura reservada: el titular no cambia de altura al arrancar la app (CLS 0).
- `aplicarIdioma` no reescribe el DOM cuando el texto no cambia; la app espera a la hoja de estilos antes de tocar el DOM.
- Los iconos se insertan antes de la primera pintura.

Pendiente: minificar CSS/JS en el despliegue (ahorro estimado 17 KiB), el aviso de `bfcache` se debe al `Cache-Control: no-store` del servidor local de pruebas, no a la aplicación.
