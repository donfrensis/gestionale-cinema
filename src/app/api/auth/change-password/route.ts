//  src/app/api/auth/change-password/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { message: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      );
    }

    // Hash della nuova password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Aggiorna l'utente
    await prisma.user.update({
      where: { id: Number(session.user.id) },
      data: {
        passwordHash,
        firstAccess: false
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'Errore durante il cambio password' },
      { status: 500 }
    );
  }
}