// src/app/api/films/mymovies-search/route.ts
// GET /api/films/mymovies-search?q=TITOLO
// Cerca film su MyMovies.it e restituisce i risultati senza salvare nulla nel DB.
// Richiede autenticazione admin.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { searchMyMovies } from '@/lib/mymovies-scraper'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    if (!q) {
      return NextResponse.json({ error: 'Parametro q obbligatorio' }, { status: 400 })
    }

    const results = await searchMyMovies(q)
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in mymovies-search:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
