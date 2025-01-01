// Define the cache name for storing assets
const CACHE_NAME = 'asset-grid-cache-v1';
console.log("Service Worker Initialized");

// Define the specific API endpoint we want to cache
const CACHED_API_ENDPOINT = '/api/assets/get-user-assets';

// Define core application assets to cache during installation
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets but remove dynamic routes
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/components/displayassets.tsx'
];

// Installation event handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Open our cache and store initial assets
        const cache = await caches.open(CACHE_NAME);
        console.log('Caching initial static assets');
        await cache.addAll(urlsToCache);
        // Force the waiting service worker to become the active service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('Cache initialization failed:', error);
      }
    })()
  );
});

// Activation event handler
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Get all existing cache keys
        const cacheKeys = await caches.keys();
        // Remove any old caches
        await Promise.all(
          cacheKeys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('Removing old cache:', key);
              return caches.delete(key);
            }
          })
        );
        // Take control of all clients immediately
        await self.clients.claim();
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    })()
  );
});

// Fetch event handler with selective interception
self.addEventListener('fetch', (event) => {
  // First, check if this is our target API endpoint
  if (event.request.url.includes(CACHED_API_ENDPOINT)) {
    // Handle the assets API request with cache strategy
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          
          // Try network first
          try {
            console.log('Fetching assets from network:', event.request.url);
            const networkResponse = await fetch(event.request);
            
            if (networkResponse.ok) {
              // Cache the successful response
              console.log('Caching new assets response');
              await cache.put(event.request, networkResponse.clone());
            }
            
            return networkResponse;
          } catch (networkError) {
            console.log('Network request failed, checking cache for assets');
            
            // Try to get from cache
            const cachedResponse = await cache.match(event.request);
            
            if (cachedResponse) {
              console.log('Returning cached assets');
              return cachedResponse;
            }
            
            // If not in cache, throw error
            throw new Error('Assets not available offline');
          }
        } catch (error) {
          console.error('Assets fetch failed:', error);
          // Return an empty array or appropriate fallback for the assets endpoint
          return new Response(JSON.stringify([]), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
  } else {
    // For all other requests, let them pass through normally
    // This ensures we don't interfere with other API calls or dynamic content
    return;
  }
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});