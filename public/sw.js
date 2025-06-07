/*
 * Service Worker with Cache-First Strategy and Background Updates
 *
 * Strategy:
 * 1. Always serve from cache first for immediate response
 * 2. Check for updates in background using ETag/Last-Modified headers
 * 3. Update cache with newer resources when available
 * 4. Time-based freshness check (1 min for HTML, 5 min for other assets)
 * 5. Graceful fallback to offline page for failed navigation requests
 */

const CACHE_NAME = 'text-diff-checker-v2-fast';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.png',
];

// Install Service Worker - Skip waiting for immediate activation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - Fast installation mode');

  // Skip waiting immediately for faster activation
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Starting aggressive caching of static assets');
        const now = Date.now().toString();

        // Use Promise.allSettled for faster, non-blocking cache operations
        const cachePromises = STATIC_ASSETS.map(async (url) => {
          try {
            const request = new Request(url, {
              cache: 'reload',
              mode: 'cors',
              credentials: 'same-origin'
            });

            const response = await fetch(request);

            if (response.ok) {
              const headers = new Headers(response.headers);
              headers.set('sw-cache-date', now);
              headers.set('sw-install-time', now);

              const responseWithTimestamp = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: headers
              });

              await cache.put(url, responseWithTimestamp);
              console.log('Service Worker: Cached', url);
            } else {
              console.warn('Service Worker: Failed to fetch', url, response.status);
            }
          } catch (error) {
            console.warn('Service Worker: Could not cache', url, error.message);
            // Don't throw - continue with other assets
          }
        });

        // Wait for all cache operations to complete or fail
        await Promise.allSettled(cachePromises);
        console.log('Service Worker: Initial caching complete');

      } catch (error) {
        console.error('Service Worker: Critical installation error', error);
        // Don't prevent installation even if caching fails
      }
    })()
  );
});

// Activate Service Worker - Take control immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - Taking control immediately');

  // Take control of all clients immediately
  self.clients.claim();

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches aggressively
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(async (cacheName) => {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          });

        await Promise.all(deletePromises);
        console.log('Service Worker: Cache cleanup complete');

        // Notify all clients that SW is ready
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_READY',
            version: CACHE_NAME,
            timestamp: Date.now()
          });
        });

        console.log('Service Worker: Activation complete, controlling', clients.length, 'clients');

      } catch (error) {
        console.error('Service Worker: Activation error', error);
        // Don't prevent activation even if cleanup fails
      }
    })()
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Forced skip waiting');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_RESPONSE',
      version: CACHE_NAME,
      cacheCount: 0 // Will be updated by cache count
    });
  }
});

// Intercept network requests
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Cache-first strategy with background update
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);

          // Serve from cache immediately, but check for updates in background
          if (shouldCache(event.request.url)) {
            checkForUpdates(event.request, cachedResponse);
          }

          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetchAndCache(event.request);
      })
      .catch((error) => {
        console.log('Service Worker: Cache match failed', error);
        return fetchAndCache(event.request);
      })
  );
});

// Fetch from network and cache if successful
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // Check if response is valid
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // Clone response for caching
      const responseToCache = response.clone();

      // Cache static resources
      if (shouldCache(request.url)) {
        caches.open(CACHE_NAME)
          .then((cache) => {
            console.log('Service Worker: Caching new resource', request.url);

            // Add cache timestamp
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-date', Date.now().toString());

            const responseWithTimestamp = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });

            cache.put(request, responseWithTimestamp);
          });
      }

      return response;
    })
    .catch((error) => {
      console.log('Service Worker: Fetch failed', error);

      // If navigation request (HTML page), return offline page
      if (request.destination === 'document') {
        return caches.match('/offline.html');
      }

      // For other resources, throw error
      throw error;
    });
}

// Check for updates in background
function checkForUpdates(request, cachedResponse) {
  // Don't spam the network - implement a simple time-based check
  const cacheDate = cachedResponse.headers.get('sw-cache-date');
  const now = Date.now();
  const cacheAge = cacheDate ? now - parseInt(cacheDate) : Infinity;

  // Only check for updates if cache is older than 5 minutes for most resources
  // or 1 minute for HTML files (more critical)
  const maxAge = request.destination === 'document' ? 60000 : 300000;

  if (cacheAge < maxAge) {
    return; // Cache is still fresh enough
  }

  fetch(request)
    .then((networkResponse) => {
      if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
        return;
      }

      // Check if the network response is different from cached version
      const networkEtag = networkResponse.headers.get('etag');
      const networkLastModified = networkResponse.headers.get('last-modified');
      const cachedEtag = cachedResponse.headers.get('etag');
      const cachedLastModified = cachedResponse.headers.get('last-modified');

      let shouldUpdate = false;

      // Compare ETags if available
      if (networkEtag && cachedEtag) {
        shouldUpdate = networkEtag !== cachedEtag;
      }
      // Compare Last-Modified if ETags not available
      else if (networkLastModified && cachedLastModified) {
        shouldUpdate = new Date(networkLastModified) > new Date(cachedLastModified);
      }
      // If no cache headers, assume we should update
      else {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        console.log('Service Worker: Updating cached resource', request.url);

        // Add our own cache timestamp
        const responseToCache = networkResponse.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-cache-date', now.toString());

        const updatedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        });

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, updatedResponse);
          });
      } else {
        console.log('Service Worker: Cached resource is up to date', request.url);

        // Update cache timestamp even if content hasn't changed
        const headers = new Headers(cachedResponse.headers);
        headers.set('sw-cache-date', now.toString());

        const updatedResponse = new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers
        });

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, updatedResponse);
          });
      }
    })
    .catch((error) => {
      console.log('Service Worker: Background update failed', error);
      // Silently fail - we already served from cache
    });
}

// Determine if resource should be cached
function shouldCache(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;

  // Cache static resources
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname === '/' ||
    pathname.endsWith('.html')
  );
}