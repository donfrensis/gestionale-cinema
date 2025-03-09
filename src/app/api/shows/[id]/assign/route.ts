// src/app/api/shows/[id]/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { notifyEventTaken } from '@/lib/server-notifications';

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
      return new NextResponse('Cannot assign to past shows', { status: 400 });
    }

    // Aggiorna la disponibilità o crea una nuova
    if (show.availability.length > 0) {
      await prisma.availability.update({
        where: {
          id: show.availability[0].id
        },
        data: {
          status: 'CONFIRMED',
          notes: notes || null
        }
      });
    } else {
      await prisma.availability.create({
        data: {
          showId,
          userId: parseInt(user.id),
          status: 'CONFIRMED',
          notes: notes || null
        }
      });
    }

    // Aggiorna lo spettacolo con l'operatore assegnato
    await prisma.show.update({
      where: { id: showId },
      data: {
        operatorId: parseInt(user.id)
      }
    });

    // Invia notifica agli amministratori
    await notifyEventTaken(prisma, parseInt(user.id), showId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning show:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}