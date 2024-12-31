// src/utils/serviceWorkerRegistration.ts

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // Wait for the page to load
      window.addEventListener('load', () => {
        const swUrl = `${import.meta.env.BASE_URL}sw.js`;
        
        navigator.serviceWorker
          .register(swUrl, {
            scope: '/',
            type: 'module', // Add this for Vite
          })
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration);
            
            // Add update handling
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('New content is available; please refresh.');
                    } else {
                      console.log('Content is cached for offline use.');
                    }
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    }
  }