// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/users - Ottieni tutti gli utenti
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

    // Ottieni tutti gli utenti
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        firstAccess: true,
        createdAt: true
      },
      orderBy: {
        username: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    return NextResponse.json(
      { message: 'Errore nel recupero degli utenti' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crea un nuovo utente
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

    const { username, password, isAdmin } = await request.json();

    // Verifica che username e password siano stati forniti
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica che la password sia abbastanza lunga
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      );
    }

    // Verifica che lo username non sia già in uso
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Username già in uso' },
        { status: 400 }
      );
    }

    // Hash della password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crea il nuovo utente
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        isAdmin: !!isAdmin,
        firstAccess: true
      }
    });

    return NextResponse.json({
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      firstAccess: newUser.firstAccess,
      createdAt: newUser.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dell\'utente:', error);
    return NextResponse.json(
      { message: 'Errore nella creazione dell\'utente' },
      { status: 500 }
    );
  }
}