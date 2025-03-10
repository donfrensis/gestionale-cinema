// src/app/api/users/[id]/reset-password/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth-options';

// Aggiornato per Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/users/[id]/reset-password - Reset password di un utente
export async function POST(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verifica che l'utente sia autenticato e sia un amministratore
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Accesso asincrono ai parametri in Next.js 15
    const params = await context.params;
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'ID utente non valido' },
        { status: 400 }
      );
    }

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Genera una password temporanea (base per il primo accesso)
    const temporaryPassword = 'cassacinema';
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Aggiorna l'utente impostando la password temporanea e firstAccess a true
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        firstAccess: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nel reset della password:', error);
    return NextResponse.json(
      { message: 'Errore nel reset della password' },
      { status: 500 }
    );
  }
}