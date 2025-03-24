//  src/app/api/auth/users/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Endpoint per ottenere gli username per il form di login
// Non richiede autenticazione poiché viene utilizzato prima del login
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
      orderBy: {
        username: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero degli utenti' },
      { status: 500 }
    );
  }
}