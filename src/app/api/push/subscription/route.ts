//  src/app/api/push/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Endpoint per salvare o aggiornare una subscription
export async function POST(req: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const user = await auth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const subscription = await req.json();
    
    // Verifica che la subscription sia valida
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Subscription non valida' },
        { status: 400 }
      );
    }
    
    // Salva o aggiorna la subscription nel database
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        userId: parseInt(user.id),
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
        updatedAt: new Date()
      },
      create: {
        userId: parseInt(user.id),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nella registrazione della subscription:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Endpoint per cancellare una subscription
export async function DELETE(req: NextRequest) {
  try {
    // Verifica che l'utente sia autenticato
    const user = await auth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }
    
    const { endpoint } = await req.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint non specificato' },
        { status: 400 }
      );
    }
    
    // Cancella la subscription dal database
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nella cancellazione della subscription:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}