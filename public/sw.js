// public/sw.js

const CACHE_NAME = 'asset-grid-cache-v1';
console.log("I am service worker");

// Expand the URLs to cache to include your application's core assets
const urlsToCache = [
  '/',
  '/asset/upload',
  '/index.html',
  '/manifest.json',
  // Add your application's main JavaScript and CSS files
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/displayassets.tsx'
];

// Installation phase - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('Caching pre-defined URLs');
        await cache.addAll(urlsToCache);
        await self.skipWaiting();
      } catch (error) {
        console.error('Cache initialization failed:', error);
      }
    })()
  );
});

// Activation phase - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('Deleting old cache:', key);
              return caches.delete(key);
            }
          })
        );
        await self.clients.claim();
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    })()
  );
});

// Fetch event handler - implement network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // First, try to get the resource from the network
        try {
          console.log('Fetching resource:', event.request.url);
          const networkResponse = await fetch(event.request);
          
          // If successful, cache the response for future offline use
          if (networkResponse.ok) {
            // Only cache successful responses
            console.log('Caching new resource:', event.request.url);
            await cache.put(event.request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (networkError) {
          console.log('Network request failed, falling back to cache');
          
          // If network request fails, try to get it from cache
          const cachedResponse = await cache.match(event.request);
          
          if (cachedResponse) {
            console.log('Found in cache:', event.request.url);
            return cachedResponse;
          }

          // For navigation requests (HTML pages), return the offline page
          if (event.request.mode === 'navigate') {
            const offlineResponse = await cache.match('/asset/search');
            if (offlineResponse) {
              return offlineResponse;
            }
          }
          
          // If not in cache and network failed, throw error
          throw new Error('Resource not found in cache');
        }
      } catch (error) {
        console.error('Fetch handling failed:', error);
        
        // If all else fails, return a simple offline message for HTML requests
        if (event.request.mode === 'navigate') {
          return new Response('You are offline and the page is not cached.', {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        throw error;
      }
    })()
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});