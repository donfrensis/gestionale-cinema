// src/app/api/withdrawals/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/withdrawals - Ottieni tutti i prelievi
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

    // Ottieni tutti i prelievi
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Ottieni gli username degli admin
    const adminIds = [...new Set(withdrawals.map(w => w.adminId))];
    const admins = await prisma.user.findMany({
      where: {
        id: { in: adminIds }
      },
      select: {
        id: true,
        username: true
      }
    });
    
    // Mappa gli admin ai prelievi
    const withdrawalsWithAdmins = withdrawals.map(withdrawal => ({
      ...withdrawal,
      admin: {
        username: admins.find(a => a.id === withdrawal.adminId)?.username || 'Sconosciuto'
      }
    }));

    return NextResponse.json(withdrawalsWithAdmins);
  } catch (error) {
    console.error('Errore nel recupero dei prelievi:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dei prelievi' },
      { status: 500 }
    );
  }
}

// POST /api/withdrawals - Crea un nuovo prelievo
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

    const { amount, notes } = await request.json();

    // Verifica che l'importo sia stato fornito e sia valido
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Importo non valido' },
        { status: 400 }
      );
    }

    // Crea il nuovo prelievo
    const withdrawal = await prisma.withdrawal.create({
      data: {
        amount,
        adminId: parseInt(session.user.id),
        notes: notes || null
      }
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del prelievo:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione del prelievo' },
      { status: 500 }
    );
  }
}