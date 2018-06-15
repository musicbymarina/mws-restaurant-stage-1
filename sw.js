/**
* @description Set a name for the current cache and Default files to always cache
*
*/
const cacheName = 'mws-v3';

const imagesToCache = [
'/img/1.jpg',
'/img/2.jpg',
'/img/3.jpg',
'/img/4.jpg',
'/img/5.jpg',
'/img/6.jpg',
'/img/7.jpg',
'/img/8.jpg',
'/img/9.jpg',
'/img/10.jpg',
'/img/1_small.jpg',
'/img/2_small.jpg',
'/img/3_small.jpg',
'/img/4_small.jpg',
'/img/5_small.jpg',
'/img/6_small.jpg',
'/img/7_small.jpg',
'/img/8_small.jpg',
'/img/9_small.jpg',
'/img/10_small.jpg',
'/img/1.webp',
'/img/2.webp',
'/img/3.webp',
'/img/4.webp',
'/img/5.webp',
'/img/6.webp',
'/img/7.webp',
'/img/8.webp',
'/img/9.webp',
'/img/10.webp',
'/img/1_small.webp',
'/img/2_small.webp',
'/img/3_small.webp',
'/img/4_small.webp',
'/img/5_small.webp',
'/img/6_small.webp',
'/img/7_small.webp',
'/img/8_small.webp',
'/img/9_small.webp',
'/img/10_small.webp',
];

const cacheFiles = [
  '/',
  'index.html',
  'restaurant.html',
  './js/dbhelper.js',
  './js/main.js',
   './js/idb.js',
  './js/restaurant_info.js',
   './js/IndexController.js',
  './css/styles.css',
  'manifest.json',
  'icon.png',
  ...imagesToCache
];

/**
* @description Delays the event until the Promise is resolved, 
* open the cache and add all the default files to the cache.
* @param {string} install - Install event
* @param {string} function
*/
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installed');
    event.waitUntil(
      caches.open(cacheName).then(cache => {
      console.log('[ServiceWorker] Caching cacheFiles');
      return cache.addAll(cacheFiles);
      })
  ); 
});

/**
* @description Delete the cached previous file if a new version of the cache is available:
* Get all the cache keys (cacheName), If a cached item is saved under a previous cacheName, 
* delete that cached file
* @param {string} install - Activate event
* @param {string} function
*/
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activated');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
      cacheNames
      .filter(thisCacheName => {
        return (thisCacheName.startsWith('mws-') && !thisCacheName.includes(cacheName));
      })
      .map(thisCacheName => {
          console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
          return caches.delete(thisCacheName);
      }));
    })
  );
});


/**
* @description Answers to the event request :
* Open the cache name, if the cache matches with the response, send the response directly.
* Otherwise, check to the network and put the clone of the answer to the cache before answering
* @param {string} fetch - Fetch event
* @param {string} function
*/
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch event now', event.request.url);

  event.respondWith(
    caches.open(cacheName)
    .then(cache => {
      return cache.match(event.request)
      .then(response => {
        console.log("[ServiceWorker] Found in Cache", event.request.url, response);
            return response || fetch(event.request).then(response => {
            console.log('[ServiceWorker] not Found in Cache, need to search in the network', event.request.url);
              if (response.url.includes('.jpg') || response.url.includes('.webp')) {
                if (response.url.includes(location.origin)) {
                  cache.put(event.request, response.clone());
                  console.log('[ServiceWorker] New images Cached', event.request.url);
                  return response;
                }
              }
          cache.put(event.request, response.clone());
          console.log('[ServiceWorker] New Data Cached', event.request.url);
          return response;
        });
      });
    })
  );
});