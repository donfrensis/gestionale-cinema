self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  // Il gestionale invia sempre JSON; un payload di testo semplice (es. test da
  // DevTools) diventa comunque una notifica invece di un errore silenzioso.
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  const title = data.title ?? 'Cinema Everest Galluzzo'
  const options = {
    body: data.body ?? 'Nuova programmazione disponibile!',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    data: { url: data.url ?? '/programmazione' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/programmazione')
  )
})
