// src/app/api/public/push/subscription/route.ts
// Nessuna autenticazione — endpoint pubblico per visitatori di cinema.everestgalluzzo.it
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST — registra o aggiorna una subscription
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { endpoint, keys } = body as {
      endpoint: string
      keys: { p256dh: string; auth: string }
    }

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
    }

    await prisma.publicPushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { p256dh: keys.p256dh, auth: keys.auth },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore registrazione public push subscription:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

// DELETE — rimuove una subscription
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { endpoint } = body as { endpoint: string }

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint mancante' }, { status: 400 })
    }

    await prisma.publicPushSubscription.deleteMany({ where: { endpoint } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Errore rimozione public push subscription:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
