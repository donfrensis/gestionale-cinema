// Questo è un service worker personalizzato per gestire le notifiche push
self.addEventListener('install', function () {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
  });
  
  self.addEventListener('push', function (event) {
    if (event.data) {
      try {
        const data = event.data.json();
        const options = {
          body: data.body || 'Nuova notifica',
          icon: data.icon || '/icons/icon-192x192.svg',
          badge: '/icons/icon-192x192.svg',
          data: { url: data.url || '/' }
        };
        
        event.waitUntil(
          self.registration.showNotification(data.title || 'Gestionale Cinema', options)
        );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Fallback per messaggio di testo
        const options = {
          body: event.data.text() || 'Nuova notifica',
          icon: '/icons/icon-192x192.svg'
        };
        
        event.waitUntil(
          self.registration.showNotification('Gestionale Cinema', options)
        );
      }
    }
  });
  
  self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            return client.navigate(url);
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  });