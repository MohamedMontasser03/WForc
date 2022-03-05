let version = "Dev-1.8";

const staticCache = "static-assets";
const lazyCache = "lazy-assets";
const dynamicCache = "dynamic-assets";
const staticAssets = [
  "/",
  "/index.html",
  "/css/index.css",
  "/js/index.js",
  "/res/favicon.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(staticCache).then(async (cache) => {
      let keys = await cache.keys();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        cache.delete(key);
      }
      cache.addAll(staticAssets);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.open(lazyCache).then(async (cache) => {
      let keys = await cache.keys();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        cache.delete(key);
      }
    })
  );

  clients.claim();
});

self.addEventListener("fetch", (e) => {
  if(!event.request.url.startsWith('http')){
     return fetch(e.request).catch((err) => console.log(err, cache));
}
  let url = new URL(e.request.url);
  let name = url.href.replace(url.search, "");
  let cache =
    url.hostname == location.hostname && staticAssets.includes(url.pathname)
      ? staticCache
      : url.hostname == location.hostname
      ? lazyCache
      : dynamicCache;

  e.respondWith(
    caches.match(cache === dynamicCache ? name : e.request).then((cacheRes) => {
      switch (cache) {
        case staticCache:
          return cacheRes || fetch(e.request).catch((err) => console.log(err));
        case lazyCache:
          return (
            cacheRes ||
            fetch(e.request).then((fetchRes) => {
              return caches.open(cache).then((c) => {
                c.put(e.request.url, fetchRes.clone());
                return fetchRes;
              });
            })
          );
        case dynamicCache:
          return fetch(e.request).then(
            (fetchRes) => {
              return caches.open(cache).then((c) => {
                if (cacheRes) {
                  c.delete(name);
                }
                  c.put(name, fetchRes.clone());
                return fetchRes;
              });
            },
            (err) => cacheRes
          );
        default:
          return fetch(e.request).catch((err) => console.log(err, cache));
      }
    })
  );
});

self.addEventListener("message", (e) => {
  switch (e.data.type) {
    case 0:
      sendMessage({ type: 0, msg: "SW ECHO" }, e.source.id);
      break;
  }
});

async function sendMessage(data, clientId) {
  let allClient = [];

  if (clientId) {
    let client = await clients.get(clientId);
    allClient.push(client);
  } else {
    allClient = await clients.matchAll({ includeUncontrolled: true });
  }

  return Promise.all(
    allClient.map((c) => {
      return c.postMessage(data);
    })
  );
}
