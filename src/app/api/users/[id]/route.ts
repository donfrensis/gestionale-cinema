// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';

// Aggiornato per Next.js 15
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/users/[id] - Ottieni un utente specifico
export async function GET(request: Request, context: RouteParams) {
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

    // Ottieni l'utente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        firstAccess: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utente non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero dell\'utente' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Aggiorna un utente
export async function PUT(request: Request, context: RouteParams) {
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

    const { username, isAdmin } = await request.json();

    // Verifica che lo username sia stato fornito
    if (!username) {
      return NextResponse.json(
        { message: 'Username è obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica che l'utente esista
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Verifica che lo username non sia già in uso da un altro utente
    if (username !== existingUser.username) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (userWithSameUsername) {
        return NextResponse.json(
          { message: 'Username già in uso' },
          { status: 400 }
        );
      }
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        isAdmin: !!isAdmin
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      isAdmin: updatedUser.isAdmin,
      firstAccess: updatedUser.firstAccess,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'utente:', error);
    return NextResponse.json(
      { message: 'Errore nell\'aggiornamento dell\'utente' },
      { status: 500 }
    );
  }
}