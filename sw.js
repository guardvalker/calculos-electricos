const CACHE = "calculos-electricos-v4";
const ASSETS = [
  "./", "./index.html", "./manifest.json", "./style.css", "./app.js", "./engine.js", "./config.js", "./icons.js",
  "./modules/caida-tension.js", "./modules/seccion-cable.js", "./modules/corriente-circuito.js",
  "./modules/proteccion-termomagnetica.js", "./modules/demanda-tablero.js",
  "./modules/dimensionamiento-tablero.js", "./modules/balanceo-fases.js", "./modules/banco-capacitores.js",
  "./modules/luminarias.js", "./modules/conversor-lumens.js", "./modules/presupuesto.js",
  "./modules/conversor-unidades.js", "./modules/consumo-mensual.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
