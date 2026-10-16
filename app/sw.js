/* Service worker: la aplicación y la base de conocimiento funcionan sin conexión.
   El nombre de la caché cambia con cada despliegue (scripts/bump_version.py lo sella), de modo que
   una versión nueva se descarga en segundo plano y se activa cuando el usuario pulsa "Actualizar". */
const VERSION = "202610161629";
const CACHE = "medex-" + VERSION;
const APP = ["./", "index.html", "novedades.html", "acerca.html", "manifest.webmanifest", "css/style.css", "js/app.js", "js/engine.js", "js/parser.js", "js/informes.js", "js/pictos.js", "js/ocr.js", "js/libs.js", "js/i18n.js", "js/version.js",
  "data/kb.json", "data/ddi_curated.json", "data/ddi.json", "data/marcas.json",
  "assets/logo.png", "assets/logo-app.png", "assets/logo-80.png", "assets/logo-app-152.png", "legal.html", "guia.html", "presentacion.html", "assets/presentacion/vistazo.webp", "assets/presentacion/sesion.webp", "assets/presentacion/consulta.webp", "assets/guia/1-datos.webp", "assets/guia/2-buscar.webp", "assets/guia/3-anadir.webp", "assets/guia/4-informe.webp", "assets/guia/5-plan.webp", "assets/guia/6-descargas.webp", "assets/favicon.png", "assets/icon-192.png", "assets/icon-512.png", "assets/fonts/Manrope-400.woff2", "assets/fonts/Manrope-700.woff2", "assets/fonts/Manrope-800.woff2", "data/fichas.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP.map((u) => new Request(u, { cache: "reload" })))).catch(() => {}));
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
