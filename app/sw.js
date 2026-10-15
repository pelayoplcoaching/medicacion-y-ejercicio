/* Service worker: la aplicación y la base de conocimiento funcionan sin conexión.
   El nombre de la caché cambia con cada despliegue (scripts/bump_version.py lo sella), de modo que
   una versión nueva se descarga en segundo plano y se activa cuando el usuario pulsa "Actualizar". */
const VERSION = "202610151136";
const CACHE = "medex-" + VERSION;
const APP = ["./", "index.html", "novedades.html", "acerca.html", "manifest.webmanifest", "css/style.css", "js/app.js", "js/engine.js", "js/parser.js", "js/informes.js", "js/ocr.js", "js/libs.js", "js/i18n.js",
  "data/kb.json", "data/ddi_curated.json", "data/ddi.json", "data/marcas.json",
  "assets/logo.png", "assets/logo-app.png", "assets/favicon.png", "assets/icon-192.png", "assets/icon-512.png", "assets/fonts/Manrope-400.woff2", "assets/fonts/Manrope-700.woff2", "assets/fonts/Manrope-800.woff2", "data/fichas.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP.map((u) => new Request(u, { cache: "reload" })))).catch(() => {}));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("medex-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "activar") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const propio = url.origin === location.origin;
  const cdn = /cdnjs\.cloudflare\.com|tessdata\.projectnaptha\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!propio && !cdn) return;
  // datos (data/*.json): red primero con reserva en caché, para que una base nueva llegue sin reinstalar la app
  if (propio && /\/data\/[^/]+\.json$/.test(url.pathname)) {
    e.respondWith(fetch(e.request).then((resp) => { if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {}); } return resp; }).catch(() => caches.match(e.request)));
    return;
  }
  // propio: caché primero (los ficheros llevan sello de versión); CDN: caché primero, se guarda al descargar
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((resp) => {
      if (resp.ok || resp.type === "opaque") { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {}); }
      return resp;
    }).catch(() => (propio && e.request.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
