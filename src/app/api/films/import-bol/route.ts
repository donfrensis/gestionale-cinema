// src/app/api/films/import-bol/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { getBolFilmsList, getBolFilmDetails } from '@/lib/bol-service'

export interface ImportBolResult {
  imported: number
  skipped: number
  errors: string[]
}

// POST /api/films/import-bol - Importa film da BOL LiveTicket (solo admin)
export async function POST(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // 1. Recupera la lista film da BOL
    const bolFilms = await getBolFilmsList()

    if (bolFilms.length === 0) {
      return NextResponse.json<ImportBolResult>({ imported: 0, skipped: 0, errors: [] })
    }

    // 2. Carica tutti i bolId già presenti nel DB in un'unica query
    const existingBolIds = new Set(
      (
        await prisma.film.findMany({
          where: { bolId: { in: bolFilms.map((f) => f.bolId) } },
          select: { bolId: true },
        })
      )
        .map((f) => f.bolId)
        .filter((id): id is number => id !== null)
    )

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // 3. Per ogni film non ancora presente, recupera i dettagli e crea il record
    for (const { bolId, title } of bolFilms) {
      if (existingBolIds.has(bolId)) {
        skipped++
        continue
      }

      try {
        const details = await getBolFilmDetails(bolId)

        await prisma.film.create({
          data: {
            title: details.title || title,
            bolId: details.bolId,
            duration: details.duration ?? null,
            cinetelId: details.cinetelId ?? null,
            nationality: details.nationality ?? null,
            producer: details.producer ?? null,
            distributor: details.distributor ?? null,
            posterUrl: details.posterUrl ?? null,
            myMoviesUrl: details.myMoviesUrl ?? null,
            importedFrom: 'BOL',
          },
        })

        imported++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Film BOL ${bolId} ("${title}"): ${msg}`)
        console.error(`Errore import film BOL ${bolId}:`, err)
      }
    }

    return NextResponse.json<ImportBolResult>({ imported, skipped, errors })
  } catch (error) {
    console.error('Errore import BOL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore durante l\'importazione da BOL' },
      { status: 500 }
    )
  }
}
