// src/app/api/shows/import-bol/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import { getBolShowsList } from '@/lib/bol-service'

export interface BolShowPreview {
  bolId: number
  filmId: number    // ID film nel nostro DB
  filmTitle: string
  datetime: string  // formato "YYYY-MM-DDTHH:mm"
}

export interface ImportBolShowsPreview {
  shows: BolShowPreview[]
  unmatched: string[]  // titoli shows ignorati (film non trovato in DB)
}

/**
 * Converte data e ora dal formato BOL (DD/MM/YYYY, HH.MM) al formato datetime-local (YYYY-MM-DDTHH:mm).
 * Il formato risultante viene accettato direttamente da new Date() nell'API POST /api/shows.
 */
function bolToLocalDatetime(date: string, time: string): string {
  const [day, month, year] = date.split('/')
  const [hours, minutes = '00'] = time.split('.')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

// GET /api/shows/import-bol - Anteprima shows da importare da BOL (solo admin)
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    // 1. Trova il bolId massimo già presente nel DB
    const maxBolIdResult = await prisma.show.findFirst({
      where: { bolId: { not: null } },
      orderBy: { bolId: 'desc' },
      select: { bolId: true },
    })
    const maxExistingBolId = maxBolIdResult?.bolId ?? null

    // 2. Recupera tutti gli shows dalla pagina BOL
    const bolShows = await getBolShowsList()

    // 3. Filtra: solo shows con bolId maggiore dell'ultimo inserito
    const newBolShows = maxExistingBolId !== null
      ? bolShows.filter((s) => s.bolId > maxExistingBolId)
      : bolShows

    if (newBolShows.length === 0) {
      return NextResponse.json<ImportBolShowsPreview>({ shows: [], unmatched: [] })
    }

    // 4. Carica i film corrispondenti dal DB (matching per film.bolId = filmBolId)
    const filmBolIds = [...new Set(newBolShows.map((s) => s.filmBolId))]
    const films = await prisma.film.findMany({
      where: { bolId: { in: filmBolIds } },
      select: { id: true, bolId: true, title: true },
    })
    const filmByBolId = new Map(
      films.map((f) => [f.bolId!, { id: f.id, title: f.title }])
    )

    // 5. Costruisci la preview: solo shows con film trovato in DB
    const shows: BolShowPreview[] = []
    const unmatched: string[] = []

    for (const s of newBolShows) {
      const film = filmByBolId.get(s.filmBolId)
      if (!film) {
        unmatched.push(`${s.filmTitle} (BOL Opera ID: ${s.filmBolId})`)
        console.warn(`Show BOL ${s.bolId} ignorato: film con bolId ${s.filmBolId} non trovato nel DB`)
        continue
      }

      shows.push({
        bolId: s.bolId,
        filmId: film.id,
        filmTitle: film.title,
        datetime: bolToLocalDatetime(s.date, s.time),
      })
    }

    return NextResponse.json<ImportBolShowsPreview>({ shows, unmatched })
  } catch (error) {
    console.error('Errore preview import shows BOL:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore durante il recupero da BOL' },
      { status: 500 }
    )
  }
}
