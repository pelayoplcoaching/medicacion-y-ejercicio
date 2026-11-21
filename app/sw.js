/* Service worker: la aplicación y la base de conocimiento funcionan sin conexión.
   El nombre de la caché cambia con cada despliegue (scripts/bump_version.py lo sella), de modo que
   una versión nueva se descarga en segundo plano y se activa cuando el usuario pulsa "Actualizar".
   - Se precarga solo lo que hace falta para usar la app sin conexión, ilustraciones incluidas; las capturas
     de la guía y de la presentación se guardan cuando se visitan esas páginas.
   - Lo que la página pide con ?v= se precarga con esa misma dirección: el navegador lo toma de su caché
     y no se descarga dos veces. Lo demás se revalida con el servidor (si no ha cambiado, no se descarga).
   - Datos (data/*.json): se sirven de la caché al instante y se actualizan en segundo plano. */
const VERSION = "202611211544";
const CACHE = "medex-" + VERSION;
// la página los pide con ?v=VERSION (incluye los que se cargan al elegir idioma o al pedir un PDF)
const SELLADOS = ["css/style.css", "js/app.js", "js/version.js", "js/libs.js", "js/i18n.js", "js/pictos.js", "js/engine.js", "js/parser.js", "js/informes.js", "js/ocr.js", "js/pdf.js",
  "js/i18n/en.js", "js/i18n/ca.js", "js/i18n/gl.js", "js/i18n/eu.js"];
// imprescindibles sin sello: si alguno falla, la instalación falla y sigue funcionando la versión anterior
const NUCLEO = ["./", "index.html", "novedades.html", "acerca.html", "legal.html", "guia.html", "manifest.webmanifest",
  "data/kb.json", "data/ddi_curated.json", "data/ddi.json", "data/marcas.json", "data/fichas.json",
  "assets/fonts/Archivo-latin.woff2", "assets/fonts/Archivo-latin-ext.woff2", "assets/fbe.svg", "assets/lobo.svg",
  "assets/logo-app-152.png", "assets/logo-80.png", "assets/logo-pdf.png", "assets/favicon.png", "assets/icon-192.png"];
// ilustraciones de la app: se intentan todas, pero una que falle no impide instalar
const IMAGENES = ["copia", "cribado", "inicio-escritorio", "inicio-vacio", "plan-aerobico", "plan-equilibrio", "plan-fuerza", "plan-paseo", "sesion-antes", "sesion-fin",
  "sintoma-calambres", "sintoma-calor", "sintoma-cansancio", "sintoma-hipoglucemia", "sintoma-inestabilidad", "sintoma-mareo", "sintoma-palpitaciones", "sintoma-piel", "sintoma-sangrado", "sintoma-tendon",
  "sppb-lado", "sppb-marcha", "sppb-semitandem", "sppb-silla", "sppb-tandem", "tour-datos", "tour-informe", "tour-medicacion", "tour-plan"].map((n) => `assets/img/${n}.webp`);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await c.addAll([...SELLADOS.map((u) => `${u}?v=${VERSION}`), ...NUCLEO.map((u) => new Request(u, { cache: "no-cache" }))]);
    await Promise.all(IMAGENES.map((u) => c.add(new Request(u, { cache: "no-cache" })).catch(() => {})));
  }));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("medex-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "activar") self.skipWaiting(); });
// recordatorios locales: al tocar la notificación se abre (o se enfoca) la aplicación
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => { const c = cs.find((x) => "focus" in x); return c ? c.focus() : self.clients.openWindow("./"); }));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const propio = url.origin === location.origin;
  const cdn = /cdnjs\.cloudflare\.com|tessdata\.projectnaptha\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!propio && !cdn) return;
  // datos: de la caché al instante; en segundo plano se pide la versión del servidor para la próxima apertura
  if (propio && /\/data\/[^/]+\.json$/.test(url.pathname)) {
    const red = fetch(req, { cache: "no-cache" }).then((resp) => {
      if (!resp.ok) return resp;
      const copia = resp.clone();
      return caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}).then(() => resp);
    });
    e.waitUntil(red.catch(() => {}));
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || red));
    return;
  }
  // propio: caché primero (la caché es de esta versión, así que da igual el ?v=); CDN: caché primero, se guarda al descargar
  e.respondWith(
    caches.match(req, { ignoreSearch: propio }).then((hit) => hit || fetch(req).then((resp) => {
      if (resp.ok || resp.type === "opaque") { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}); }
      return resp;
    }).catch(() => (propio && req.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
