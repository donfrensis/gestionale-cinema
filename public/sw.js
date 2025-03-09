// Service Worker per Gestionale Cinema
const CACHE_NAME = 'cinema-app-v1';
const OFFLINE_URL = '/offline.html';

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aperta');
        // Aggiungi la pagina offline alla cache
        return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      })
      .then(() => {
        // Forza l'attivazione immediata senza attendere la chiusura di tutte le schede
        return self.skipWaiting();
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          // Elimina le cache vecchie
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Prendi il controllo di tutte le pagine aperte
      return self.clients.claim();
    })
  );
});

// Gestione delle richieste fetch
self.addEventListener('fetch', (event) => {
  // Se la richiesta è per la pagina principale o una pagina navigabile
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Se offline, mostra la pagina offline
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Per le altre richieste, usa una strategia "network first, fallback to cache"
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clona la risposta e memorizzala nella cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Memorizza nella cache solo le risorse con status 200
          if (response.status === 200) {
            cache.put(event.request, responseToCache);
          }
        });
        return response;
      })
      .catch(() => {
        // Se offline, cerca nella cache
        return caches.match(event.request);
      })
  );
});

// Gestione degli eventi push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // Mostra la notifica
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      data: {
        url: data.url || '/',
        type: data.type
      },
      tag: `cinema-${data.type}-${Date.now()}`,
      // Imposta la vibrazione in base alla priorità
      vibrate: data.priority === 'HIGH' 
        ? [200, 100, 200, 100, 200] 
        : data.priority === 'MEDIUM'
          ? [200, 100, 200]
          : [200],
      // Auto chiusura per priorità basse
      requireInteraction: data.priority !== 'LOW'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('Errore nella gestione della notifica push:', error);
  }
});

// Gestione del click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // URL da aprire quando si clicca sulla notifica
  const url = event.notification.data.url;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Se c'è già una finestra aperta, focalizzala
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: url
            });
            return client.focus();
          }
        }
        
        // Altrimenti apri una nuova finestra
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});