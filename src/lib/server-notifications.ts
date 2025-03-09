//  src/lib/server-notifications.ts

import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { NotificationData, getPriorityFromType, saveNotification } from './notifications';

// Configura web-push con le chiavi VAPID
function setupWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('Chiavi VAPID mancanti. Le notifiche push non funzioneranno.');
    return false;
  }
  
  try {
    webpush.setVapidDetails(
      'mailto:admin@example.com', // Sostituisci con l'email dell'amministratore
      vapidPublicKey,
      vapidPrivateKey
    );
    return true;
  } catch (error) {
    console.error('Errore nella configurazione di web-push:', error);
    return false;
  }
}

// Inizializza webpush
setupWebPush();

// Funzione per inviare notifiche dal server
export async function sendServerNotification(db: PrismaClient, options: NotificationData) {
  try {
    // Salva la notifica nel database
    const saveResult = await saveNotification(db, options);
    
    if (!saveResult.success) {
      return saveResult;
    }
    
    // Recupera le subscription per gli utenti coinvolti
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: {
          in: saveResult.recipients
        }
      }
    });
    
    if (subscriptions.length === 0) {
      return {
        ...saveResult,
        pushSent: 0,
      };
    }
    
    // Prepara i dati per la notifica push
    const pushPayload = JSON.stringify({
      title: options.title,
      body: options.body,
      url: options.url || '/',
      type: options.type,
      priority: options.priority || getPriorityFromType(options.type)
    });
    
    // Invia le notifiche push
    const pushPromises = subscriptions.map(async subscription => {
      try {
        const pushConfig = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };
        
        await webpush.sendNotification(pushConfig, pushPayload);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error(`Errore invio notifica a ${subscription.endpoint}:`, error);
        
        // Se la subscription non è più valida, la eliminiamo
        if (error && typeof error === 'object' && 'statusCode' in error && 
          (error.statusCode === 404 || error.statusCode === 410)) {
          await db.pushSubscription.delete({
            where: { endpoint: subscription.endpoint }
          });
        }
        
        return { success: false, endpoint: subscription.endpoint, error };
      }
    });
    
    const results = await Promise.allSettled(pushPromises);
    const successful = results.filter(r => 
      r.status === 'fulfilled' && 
      r.value && 
      typeof r.value === 'object' && 
      'success' in r.value && 
      r.value.success
    ).length;
    
    return {
      ...saveResult,
      pushSent: successful,
      pushTotal: subscriptions.length
    };
    
  } catch (error) {
    console.error('Errore nell\'invio delle notifiche server:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

// Funzione per inviare notifica quando viene aggiunto un nuovo gruppo di spettacoli
export async function notifyNewEvents(db: PrismaClient, showCount: number) {
  return await sendServerNotification(db, {
    title: 'Nuovi spettacoli disponibili',
    body: `Sono stati aggiunti ${showCount} nuovi spettacoli. Controlla la tua disponibilità.`,
    type: 'NEW_EVENTS',
    url: '/availability',
    adminOnly: false
  });
}

// Funzione per inviare notifica quando uno spettacolo viene modificato
export async function notifyEventModified(db: PrismaClient, showId: number, showTitle: string, showDate: Date) {
  const formattedDate = showDate.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return await sendServerNotification(db, {
    title: 'Spettacolo modificato',
    body: `Lo spettacolo "${showTitle}" del ${formattedDate} è stato modificato.`,
    type: 'EVENT_MODIFIED',
    url: '/availability',
    adminOnly: false
  });
}

// Funzione per inviare notifica quando uno spettacolo viene cancellato
export async function notifyEventCancelled(db: PrismaClient, showTitle: string, showDate: Date) {
  const formattedDate = showDate.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return await sendServerNotification(db, {
    title: 'Spettacolo cancellato',
    body: `Lo spettacolo "${showTitle}" del ${formattedDate} è stato cancellato.`,
    type: 'EVENT_CANCELLED',
    url: '/availability',
    adminOnly: false
  });
}

// Funzione per inviare notifica quando un operatore si rende disponibile
export async function notifyEventTaken(db: PrismaClient, operatorId: number, showId: number) {
  try {
    // Recupera i dettagli dell'operatore e dello spettacolo
    const operator = await db.user.findUnique({
      where: { id: operatorId },
      select: { username: true }
    });
    
    const show = await db.show.findUnique({
      where: { id: showId },
      select: {
        datetime: true,
        film: {
          select: { title: true }
        }
      }
    });
    
    if (!operator || !show) {
      throw new Error('Dati non trovati');
    }
    
    // Formatta la data
    const formattedDate = show.datetime.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Invia la notifica agli amministratori
    return await sendServerNotification(db, {
      title: 'Nuovo operatore disponibile',
      body: `${operator.username} si è reso disponibile per lo spettacolo "${show.film.title}" del ${formattedDate}`,
      type: 'EVENT_TAKEN',
      url: '/shows',
      adminOnly: true
    });
    
  } catch (error) {
    console.error('Errore nell\'invio della notifica di presa in carico:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

// Funzione per inviare notifica quando un operatore rinuncia
export async function notifyEventWithdrawn(db: PrismaClient, operatorId: number, showId: number, reason: string) {
  try {
    // Recupera i dettagli dell'operatore e dello spettacolo
    const operator = await db.user.findUnique({
      where: { id: operatorId },
      select: { username: true }
    });
    
    const show = await db.show.findUnique({
      where: { id: showId },
      select: {
        datetime: true,
        film: {
          select: { title: true }
        }
      }
    });
    
    if (!operator || !show) {
      throw new Error('Dati non trovati');
    }
    
    // Formatta la data
    const formattedDate = show.datetime.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Costruisci il messaggio
    let message = `${operator.username} ha rinunciato allo spettacolo "${show.film.title}" del ${formattedDate}`;
    
    if (reason) {
      message += `. Motivo: ${reason}`;
    }
    
    // Invia la notifica agli amministratori
    return await sendServerNotification(db, {
      title: 'Rinuncia operatore',
      body: message,
      type: 'EVENT_WITHDRAWN',
      url: '/shows',
      adminOnly: true,
      priority: 'HIGH'
    });
    
  } catch (error) {
    console.error('Errore nell\'invio della notifica di rinuncia:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}