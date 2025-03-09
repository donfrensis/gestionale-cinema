//  src/app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import { NotificationType, NotificationPriority } from '@/lib/notifications';

const prisma = new PrismaClient();

// Configura web-push con le chiavi VAPID
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: 'mailto:admin@esempio.it'
};

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Verifica che l'utente sia autenticato e sia un amministratore
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const username = session.user.username || '';
    const currentUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, isAdmin: true }
    });
    
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Accesso non autorizzato' },
        { status: 403 }
      );
    }
    
    // Estrai i dati dalla richiesta
    const {
      title,
      body,
      url,
      type,
      priority,
      recipientIds,
      adminOnly
    } = await req.json() as {
      title: string;
      body: string;
      url?: string;
      type: NotificationType;
      priority?: NotificationPriority;
      recipientIds?: number[];
      adminOnly?: boolean;
    };
    
    // Valida i dati
    if (!title || !body || !type) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      );
    }
    
    // Determina gli ID dei destinatari
    let userIds: number[] = [];
    
    if (recipientIds && recipientIds.length > 0) {
      // Usa gli ID specifici se forniti
      userIds = recipientIds;
    } else if (adminOnly) {
      // Seleziona tutti gli admin se la notifica è solo per admin
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true }
      });
      userIds = admins.map(admin => admin.id);
    } else {
      // Altrimenti notifica tutti gli utenti
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      userIds = allUsers.map(user => user.id);
    }
    
    // Salva la notifica nel database per ogni destinatario
    const notificationPromises = userIds.map(userId =>
      prisma.notification.create({
        data: {
          userId,
          title,
          body,
          url: url || null,
          type,
          priority: priority || 'MEDIUM',
        }
      })
    );
    
    await Promise.all(notificationPromises);
    
    // Recupera le subscription per gli utenti coinvolti
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds
        }
      }
    });
    
    // Prepara i dati per la notifica push
    const pushPayload = JSON.stringify({
      title,
      body,
      url: url || '/',
      type,
      priority: priority || 'MEDIUM'
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
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint }
          });
        }
        
        return { success: false, endpoint: subscription.endpoint, error };
      }
    });
    
    const results = await Promise.all(pushPromises);
    
    return NextResponse.json({
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total: results.length
    });
    
  } catch (error) {
    console.error('Errore nell\'invio delle notifiche push:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}