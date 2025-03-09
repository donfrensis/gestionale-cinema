// src/app/api/cash/close/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { calculateTotalFromCashJson } from '@/components/Dashboard/types';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Risolvi i parametri in modo asincrono
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    // Usa authOptions con getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    console.log('Session:', JSON.stringify(session, null, 2));

    const data = await request.json();
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    // Recupera il report usando l'ID già estratto
    const report = await prisma.cashReport.findUnique({
      where: { id }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report non trovato' },
        { status: 404 }
      );
    }

    if (report.closingDateTime) {
      return NextResponse.json(
        { error: 'Il report è già stato chiuso' },
        { status: 400 }
      );
    }

    // Verifica migliorata dell'autorizzazione
    const isAdmin = session.user.isAdmin === true;
    const isReportOwner = report.operatorId === Number(session.user.id);

    console.log('User is admin:', isAdmin);
    console.log('User is report owner:', isReportOwner);
    console.log('User ID:', session.user.id);
    console.log('Report operator ID:', report.operatorId);

    if (!isReportOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato a chiudere questo report' },
        { status: 403 }
      );
    }

    // Calcolo della quadratura
    // 1. Calcola il totale dell'apertura
    const openingTotal = calculateTotalFromCashJson(report.openingCash);
    console.log('Opening total:', Number(openingTotal));

    // 2. Calcola il totale della chiusura
    const closingTotal = calculateTotalFromCashJson(data.cashData);
    console.log('Closing total:', Number(closingTotal));

    // 3. Calcola la differenza di contanti (quanto contante è stato incassato)
    const cashDifference = Number(closingTotal) - Number(openingTotal);
    console.log('Cash difference:', cashDifference);

    // 4. Incassi dichiarati (totale biglietteria + abbonamenti)
    const declaredIncome = Number(data.ticketSystemTotal) + Number(data.subscriptionTotal);
    console.log('Declared income:', declaredIncome);

    // 5. Incassi effettivi (differenza contanti + POS)
    const actualIncome = cashDifference + Number(data.posTotal);
    console.log('Actual income:', actualIncome);

    // 6. Differenza di quadratura
    const balanceDifference = declaredIncome - actualIncome;
    console.log('Balance difference:', balanceDifference);

    // 7. Verifica se è bilanciato (con tolleranza di 0.01€)
    const isBalanced = Math.abs(balanceDifference) <= 0.01;
    console.log('Is balanced:', isBalanced);

    // Aggiorna il report con i dati di chiusura
    const updatedReport = await prisma.cashReport.update({
      where: { id },
      data: {
        closingCash: data.cashData,
        posTotal: data.posTotal,
        ticketTotal: data.ticketSystemTotal,
        subscriptionTotal: data.subscriptionTotal,
        closingDateTime: new Date()
      }
    });

    // Restituisci il report aggiornato con i dati di quadratura
    return NextResponse.json({
      ...updatedReport,
      cashDifference,
      declaredIncome,
      actualIncome,
      balanceDifference,
      isBalanced
    });

  } catch (error) {
    console.error('Error closing cash report:', error);
    return NextResponse.json(
      { error: 'Errore durante la chiusura del report' },
      { status: 500 }
    );
  }
}