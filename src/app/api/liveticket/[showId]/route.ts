// src/app/api/liveticket/[showId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getBolTicketData } from '@/lib/bol-service';

export async function GET(
  request: Request,
  context: { params: Promise<{ showId: string }> }
): Promise<Response> {
  try {
    // Verifica l'autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Ottieni i parametri in modo asincrono
    const params = await context.params;
    const showId = parseInt(params.showId);

    // Recupera lo spettacolo dal database
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { film: true }
    });

    if (!show) {
      return NextResponse.json({ error: 'Spettacolo non trovato' }, { status: 404 });
    }

    // Verifica se lo spettacolo ha un ID BOL
    if (!show.bolId) {
      return NextResponse.json(
        { 
          error: 'ID BOL mancante per questo spettacolo',
          manualEntryRequired: true 
        }, 
        { status: 400 }
      );
    }

    // Formatta la data e l'ora dello spettacolo
    const showDate = show.datetime.toISOString().split('T')[0];
    const showTime = show.datetime.toTimeString().substring(0, 5);

    // Recupera i dati da BOL LiveTicket
    const bolData = await getBolTicketData(showDate, showTime);

    if (!bolData.success) {
      return NextResponse.json(
        { 
          error: bolData.error || 'Errore nel recupero dei dati da BOL LiveTicket',
          manualEntryRequired: true 
        }, 
        { status: 500 }
      );
    }

    // Ritorna i dati di incasso
    return NextResponse.json({
      showId: show.id,
      bolId: show.bolId,
      film: show.film.title,
      showDate,
      showTime,
      ...bolData
    });
  } catch (error) {
    console.error('Errore nella richiesta BOL LiveTicket:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Errore sconosciuto',
        manualEntryRequired: true 
      }, 
      { status: 500 }
    );
  }
}