const CACHE_PREFIX = "pixelpopup-workspace-static-";
const CACHE_NAME = CACHE_PREFIX + "__WORKSPACE_BUILD_ID__";
const OFFLINE_URL = "/workspace-offline.html";
const STATIC_FILES = [OFFLINE_URL, "/workspace-icons/icon-192.png", "/workspace-icons/icon-512.png", "/workspace-icons/maskable-512.png", "/workspace-icons/apple-touch-icon-180.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)));
  // Keep the default waiting lifecycle. Never replace a running editor.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.mode !== "navigate" || request.destination !== "document" || url.origin !== self.location.origin || !/^\/(dashboard|business)(\/|$)/.test(url.pathname)) return;
  // All private data, authentication, downloads and other routes pass through.
  event.respondWith(fetch(request, { cache: "no-store" }).catch(async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    } catch { /* Storage may be unavailable or evicted; retain a useful response. */ }
    return new Response("You are offline. Reconnect and reload the workspace.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }));
});
