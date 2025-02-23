// src/app/api/films/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import type { FilmFormData } from '@/types/films'

// GET /api/films - Lista film (solo admin)
export async function GET() {
    try {
      // Verifica autenticazione e ruolo admin
      const session = await getServerSession(authOptions)
      if (!session?.user?.isAdmin) {
        return NextResponse.json(
          { error: 'Non autorizzato' },
          { status: 403 }
        )
      }
  
      const films = await prisma.film.findMany({
        orderBy: {
          title: 'asc'
        }
      })
      
      return NextResponse.json(films)
    } catch (error) {
      console.error('Error fetching films:', error)
      return NextResponse.json(
        { error: 'Errore nel recupero dei film' },
        { status: 500 }
      )
    }
  }

// POST /api/films - Crea nuovo film
export async function POST(request: Request) {
  try {
    // Verifica autenticazione e ruolo admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 403 }
      )
    }

    // Parsing e validazione dati
    const data = await request.json() as FilmFormData
    
    // Validazioni base
    if (!data.title?.trim()) {
      return NextResponse.json(
        { error: 'Il titolo è obbligatorio' },
        { status: 400 }
      )
    }
    
    // Verifica film duplicato
    const existingFilm = await prisma.film.findFirst({
      where: {
        title: {
          equals: data.title.trim().toLowerCase() // Case insensitive
        }
      }
    })

    if (existingFilm) {
      return NextResponse.json(
        { error: 'Film già presente nel sistema' },
        { status: 400 }
      )
    }

    // Creazione nuovo film
    const newFilm = await prisma.film.create({
      data: {
        title: data.title.trim(),
        duration: data.duration,
        bolId: data.bolId,
        cinetelId: data.cinetelId,
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null
      }
    })

    return NextResponse.json(newFilm)
  } catch (error) {
    console.error('Error creating film:', error)
    return NextResponse.json(
      { error: 'Errore nella creazione del film' },
      { status: 500 }
    )
  }
}