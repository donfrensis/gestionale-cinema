//  src/lib/notifications.ts

import { PrismaClient } from '@prisma/client';

// Tipo di notifica
export type NotificationType = 
  | 'NEW_EVENTS'        // Quando vengono aggiunti nuovi spettacoli (raggruppa più eventi)
  | 'EVENT_MODIFIED'    // Quando viene modificato uno spettacolo
  | 'EVENT_CANCELLED'   // Quando viene cancellato uno spettacolo
  | 'EVENT_TAKEN'       // Quando un operatore si rende disponibile (solo per admin)
  | 'EVENT_WITHDRAWN';  // Quando un operatore rimuove la disponibilità (solo per admin)

// Priorità della notifica
export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// Interfaccia per i dati della notifica
export interface NotificationData {
  title: string;
  body: string;
  url?: string;
  type: NotificationType;
  priority?: NotificationPriority;
  recipientIds?: number[];  // ID degli utenti destinatari specifici
  adminOnly?: boolean;      // Se true, invia solo agli admin
}

// Funzione per generare la priorità basata sul tipo di notifica
export function getPriorityFromType(type: NotificationType): NotificationPriority {
  const priorities: Record<NotificationType, NotificationPriority> = {
    'EVENT_WITHDRAWN': 'HIGH',
    'EVENT_CANCELLED': 'HIGH',
    'EVENT_MODIFIED': 'MEDIUM',
    'EVENT_TAKEN': 'MEDIUM',
    'NEW_EVENTS': 'MEDIUM'
  };
  
  return priorities[type] || 'MEDIUM';
}

// Funzione per salvare una notifica nel database
export async function saveNotification(db: PrismaClient, data: NotificationData) {
  try {
    // Determina gli ID dei destinatari
    let recipientIds: number[] = [];
    
    if (data.recipientIds && data.recipientIds.length > 0) {
      // Usa gli ID specifici se forniti
      recipientIds = data.recipientIds;
    } else if (data.adminOnly) {
      // Seleziona tutti gli admin se la notifica è solo per admin
      const admins = await db.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      });
      recipientIds = admins.map(admin => admin.id);
    } else {
      // Altrimenti notifica tutti gli utenti
      const allUsers = await db.user.findMany({
        select: { id: true }
      });
      recipientIds = allUsers.map(user => user.id);
    }
    
    // Priorità predefinita se non specificata
    const priority = data.priority || getPriorityFromType(data.type);
    
    // Crea le notifiche per ogni destinatario
    const notificationPromises = recipientIds.map(userId => 
      db.notification.create({
        data: {
          userId,
          title: data.title,
          body: data.body,
          url: data.url,
          type: data.type,
          priority
        }
      })
    );
    
    // Esegui tutte le promesse in parallelo
    await Promise.all(notificationPromises);
    
    return {
      success: true,
      count: recipientIds.length,
      recipients: recipientIds
    };
  } catch (error) {
    console.error('Errore nel salvataggio delle notifiche:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

// Funzione per segnare una notifica come letta
export async function markNotificationAsRead(db: PrismaClient, notificationId: number) {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    return { success: true };
  } catch (error) {
    console.error('Errore nel marcare la notifica come letta:', error);
    return { success: false };
  }
}

// Funzione per ottenere le notifiche di un utente
export async function getUserNotifications(db: PrismaClient, userId: number, limit = 20, onlyUnread = false) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        ...(onlyUnread ? { isRead: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    return { success: true, notifications };
  } catch (error) {
    console.error('Errore nel recupero delle notifiche:', error);
    return { success: false, notifications: [] };
  }
}