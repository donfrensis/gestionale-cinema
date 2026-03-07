// src/app/api/public/shows/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/public/shows — Programmazione futura (pubblica, nessuna autenticazione)
export async function GET(): Promise<NextResponse> {
  try {
    const shows = await prisma.show.findMany({
      where: { datetime: { gte: new Date() } },
      orderBy: { datetime: 'asc' },
      select: {
        id: true,
        datetime: true,
        film: {
          select: {
            title: true,
            duration: true,
            director: true,
            genre: true,
            posterUrl: true,
            myMoviesUrl: true,
            bolId: true,
          },
        },
      },
    })

    const formatted = shows.map(show => {
      const d = new Date(show.datetime)
      const datetime =
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0') + 'T' +
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0')
      return { ...show, datetime }
    })

    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Errore public/shows:', error)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
