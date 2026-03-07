import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { calculateTotalFromCashJson } from '@/components/Dashboard/types';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const data = await request.json();
    
    // Verifica se c'è già un report aperto
    const openReport = await prisma.cashReport.findFirst({
      where: {
        closingDateTime: null
      }
    });

    if (openReport) {
      return NextResponse.json(
        { error: 'Esiste già un report aperto' },
        { status: 400 }
      );
    }

    // Controlla che lo show esista
    const show = await prisma.show.findUnique({
      where: { id: data.showId }
    });

    if (!show) {
      return NextResponse.json(
        { error: 'Spettacolo non trovato' },
        { status: 404 }
      );
    }

    // Verifica la quadratura con l'ultimo report chiuso
    const lastShowWithClosedReport = await prisma.show.findFirst({
      where: {
        cashReport: {
          closingDateTime: { not: null }
        }
      },
      include: {
        cashReport: true
      },
      orderBy: {
        datetime: 'desc' // Ordina per data dello show, non per data di chiusura
      }
    });

    if (lastShowWithClosedReport?.cashReport?.closingCash) {
      const lastClosedReport = lastShowWithClosedReport.cashReport;
  
      // Calcola il totale dell'ultima chiusura
      const lastClosingTotal = calculateTotalFromCashJson(lastClosedReport.closingCash);

      // Trova i prelievi fatti dopo la CHIUSURA del report precedente
      const withdrawals = await prisma.withdrawal.findMany({
        where: {
          createdAt: {
            gte: lastClosedReport.closingDateTime! // Usa la data di chiusura effettiva
          }
        }
      });

      // Calcola il totale atteso (chiusura - prelievi)
      const totalWithdrawals = withdrawals.reduce((sum, w) =>
        sum + Number(w.amount), 0
      );

      const expectedTotal = Number(lastClosingTotal) - totalWithdrawals;

      // Calcola il totale attuale
      const currentTotal = calculateTotalFromCashJson(data.cashData);

      // Verifica la quadratura con una tolleranza di 0.01
      if (Math.abs(expectedTotal - Number(currentTotal)) > 0.01) {
        return NextResponse.json(
          { 
            error: 'Il fondo cassa non corrisponde alla chiusura precedente',
            expected: expectedTotal,
            actual: Number(currentTotal)
          },
          { status: 400 }
        );
      }
    }

    // Converti l'ID utente in numero in modo sicuro
    const operatorId = parseInt(session.user.id as string);
    if (isNaN(operatorId)) {
      return NextResponse.json(
        { error: 'ID utente non valido' },
        { status: 400 }
      );
    }

    // Crea il nuovo report
    const newReport = await prisma.cashReport.create({
      data: {
        showId: data.showId,
        operatorId: operatorId,
        openingCash: data.cashData,
        openingDateTime: new Date()
      }
    });

    // Assegna l'operatore allo show se non è già assegnato
    if (!show.operatorId) {
      await prisma.show.update({
        where: { id: data.showId },
        data: { operatorId: operatorId }
      });
    }

    return NextResponse.json(newReport);

  } catch (error) {
    console.error('Error opening cash report:', error);
    return NextResponse.json(
      { error: 'Errore durante l\'apertura del report' },
      { status: 500 }
    );
  }
}