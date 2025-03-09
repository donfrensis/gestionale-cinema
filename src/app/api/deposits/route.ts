// src/app/api/deposits/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/deposits - Ottieni tutti i versamenti
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica che l'utente sia autenticato e sia un amministratore
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Ottieni tutti i versamenti effettivi dal database
    const deposits = await prisma.bankDeposit.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    // Ottieni informazioni sugli admin
    const adminIds = deposits.map(d => d.adminId);
    const admins = await prisma.user.findMany({
      where: {
        id: { in: adminIds }
      },
      select: {
        id: true,
        username: true
      }
    });

    // Formato dei dati per il frontend
    const formattedDeposits = deposits.map(deposit => {
      const admin = admins.find(a => a.id === deposit.adminId);
      
      return {
        id: deposit.id,
        amount: deposit.amount.toString(),
        date: deposit.date.toISOString(),
        reference: deposit.reference,
        adminId: deposit.adminId,
        admin: {
          username: admin?.username || 'Sconosciuto'
        },
        notes: deposit.notes,
        createdAt: deposit.createdAt.toISOString()
      };
    });

    return NextResponse.json(formattedDeposits);
  } catch (error) {
    console.error('Errore nel recupero dei versamenti:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei versamenti' },
      { status: 500 }
    );
  }
}

// POST /api/deposits - Crea un nuovo versamento
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica che l'utente sia autenticato e sia un amministratore
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { amount, date, reference, notes, withdrawalIds } = await request.json();

    // Verifica che i dati necessari siano stati forniti
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Importo non valido' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { message: 'Data non valida' },
        { status: 400 }
      );
    }

    if (!withdrawalIds || !Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      return NextResponse.json(
        { message: 'Seleziona almeno un prelievo da collegare' },
        { status: 400 }
      );
    }

    // Crea il nuovo versamento e collega i prelievi
    const deposit = await prisma.bankDeposit.create({
      data: {
        amount: parseFloat(amount.toString()),
        date: new Date(date),
        reference: reference || null,
        adminId: parseInt(session.user.id),
        notes: notes || null
      }
    });

    // Aggiorna i prelievi con l'ID del versamento
    await prisma.withdrawal.updateMany({
      where: {
        id: { in: withdrawalIds }
      },
      data: {
        depositId: deposit.id
      }
    });

    // Ottieni il nome dell'admin per includere nella risposta
    const admin = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { username: true }
    });

    // Restituisci il deposito con informazioni aggiuntive
    return NextResponse.json({
      ...deposit,
      admin: { username: admin?.username || 'Sconosciuto' }
    }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del versamento:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione del versamento' },
      { status: 500 }
    );
  }
}