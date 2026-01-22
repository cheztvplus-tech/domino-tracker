const CACHE_NAME = "domino-tracker-cache-v1.001";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./tiles-black/",
  "./tiles-white/",
  "./tiles-red/",
  "./tiles-green/",
  "./tiles-purple/",
  "./sets.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );

});
