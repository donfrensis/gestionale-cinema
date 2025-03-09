// src/app/api/shows/[id]/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyEventWithdrawn } from '@/lib/server-notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const showId = parseInt(params.id);
    if (isNaN(showId)) {
      return new NextResponse('Invalid show ID', { status: 400 });
    }

    const data = await request.json();
    const { notes } = data;

    // Verifica che lo spettacolo esista
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        film: true,
        availability: {
          where: { userId: parseInt(user.id) }
        }
      }
    });

    if (!show) {
      return new NextResponse('Show not found', { status: 404 });
    }

    // Verifica se lo spettacolo è già passato
    if (new Date(show.datetime) < new Date()) {
      return new NextResponse('Cannot withdraw from past shows', { status: 400 });
    }

    // Verifica se l'utente è l'operatore assegnato
    if (show.operatorId !== parseInt(user.id) && !user.isAdmin) {
      return new NextResponse('You are not assigned to this show', { status: 403 });
    }

    // Aggiorna la disponibilità
    if (show.availability.length > 0) {
      await prisma.availability.update({
        where: {
          id: show.availability[0].id
        },
        data: {
          status: 'WITHDRAWN',
          notes: notes || null
        }
      });
    } else {
      await prisma.availability.create({
        data: {
          showId,
          userId: parseInt(user.id),
          status: 'WITHDRAWN',
          notes: notes || null
        }
      });
    }

    // Rimuovi l'operatore dallo spettacolo
    await prisma.show.update({
      where: { id: showId },
      data: {
        operatorId: null
      }
    });

    // Invia notifica agli amministratori
    await notifyEventWithdrawn(prisma, parseInt(user.id), showId, notes || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error withdrawing from show:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}