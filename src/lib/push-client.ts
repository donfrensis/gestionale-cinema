//  src/lib/push-client.ts

'use client';

// Funzione per verificare se il browser supporta le notifiche push
export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

// Funzione per richiedere il permesso per le notifiche
export async function askPermission() {
  if (!isPushNotificationSupported()) {
    return false;
  }
  
  try {
    const permissionResult = await Notification.requestPermission();
    return permissionResult === 'granted';
  } catch (error) {
    console.error('Errore nella richiesta di permesso:', error);
    return false;
  }
}

// Funzione per registrare il service worker
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Errore nella registrazione del service worker:', error);
    return null;
  }
}

// Funzione per ottenere la subscription attiva
export async function getSubscription() {
  if (!isPushNotificationSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Errore nel recupero della subscription:', error);
    return null;
  }
}

// Funzione per sottoscrivere alle notifiche push
export async function subscribeToPush() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications non supportate');
  }
  
  try {
    // Verifica se c'è già una subscription attiva
    const existingSubscription = await getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }
    
    // Richiedi il permesso se non è già stato concesso
    const permissionGranted = await askPermission();
    if (!permissionGranted) {
      throw new Error('Permesso per le notifiche non concesso');
    }
    
    // Registra il service worker se non è già registrato
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Impossibile registrare il service worker');
    }
    
    // Recupera la chiave pubblica VAPID
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicVapidKey) {
      throw new Error('Chiave VAPID pubblica non disponibile');
    }
    
    // Crea una nuova subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    
    // Invia la subscription al server
    await saveSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Errore nella sottoscrizione alle notifiche push:', error);
    throw error;
  }
}

// Funzione per cancellare la subscription
export async function unsubscribeFromPush() {
  try {
    const subscription = await getSubscription();
    
    if (!subscription) {
      return true;
    }
    
    // Cancella la subscription dal server
    await deleteSubscriptionFromServer(subscription);
    
    // Cancella la subscription lato client
    await subscription.unsubscribe();
    
    return true;
  } catch (error) {
    console.error('Errore nella cancellazione della subscription:', error);
    return false;
  }
}

// Funzione per salvare la subscription sul server
async function saveSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Errore nel salvataggio della subscription sul server');
    }
    
    return true;
  } catch (error) {
    console.error('Errore nella comunicazione con il server:', error);
    throw error;
  }
}

// Funzione per cancellare la subscription dal server
async function deleteSubscriptionFromServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/push/subscription', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });
    
    if (!response.ok) {
      throw new Error('Errore nella cancellazione della subscription dal server');
    }
    
    return true;
  } catch (error) {
    console.error('Errore nella comunicazione con il server:', error);
    throw error;
  }
}

// Utility function per convertire la chiave VAPID nel formato corretto
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}