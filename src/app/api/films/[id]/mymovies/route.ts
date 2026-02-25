// src/app/api/films/[id]/mymovies/route.ts
// POST /api/films/[id]/mymovies
// Body: { myMoviesUrl: string }
// Recupera dati da MyMovies.it e aggiorna il film. Richiede autenticazione admin.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { fetchMyMoviesDetail } from '@/lib/mymovies-scraper'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const params = await context.params
    const filmId = parseInt(params.id)
    if (isNaN(filmId)) {
      return NextResponse.json({ error: 'ID non valido' }, { status: 400 })
    }

    const body = await request.json() as { myMoviesUrl?: string }
    const myMoviesUrl = body.myMoviesUrl?.trim()
    if (!myMoviesUrl) {
      return NextResponse.json({ error: 'myMoviesUrl obbligatorio' }, { status: 400 })
    }

    const existingFilm = await prisma.film.findUnique({ where: { id: filmId } })
    if (!existingFilm) {
      return NextResponse.json({ error: 'Film non trovato' }, { status: 404 })
    }

    const detail = await fetchMyMoviesDetail(myMoviesUrl)

    const updatedFilm = await prisma.film.update({
      where: { id: filmId },
      data: {
        myMoviesUrl: detail.myMoviesUrl,
        director: detail.director ?? existingFilm.director,
        italianReleaseDate: detail.italianReleaseDate ?? existingFilm.italianReleaseDate,
        genre: detail.genre ?? existingFilm.genre,
      },
    })

    return NextResponse.json(updatedFilm)
  } catch (error) {
    console.error('Error in mymovies route:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
