import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import {
  generateNewsletterSections,
  generateCampaignSubject,
  generatePreviewText,
  type FilmForNewsletter,
} from '@/lib/generate-newsletter'
import { createMailchimpDraft } from '@/lib/mailchimp-service'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { startDate, endDate } = await req.json()
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate e endDate sono richiesti' },
        { status: 400 },
      )
    }

    const [sy, sm, sd] = (startDate as string).split('-').map(Number)
    const [ey, em, ed] = (endDate as string).split('-').map(Number)
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0)
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999)

    const shows = await prisma.show.findMany({
      where: { datetime: { gte: start, lte: end } },
      include: { film: true },
      orderBy: { datetime: 'asc' },
    })

    const filmMap = new Map<number, { film: (typeof shows)[0]['film']; shows: typeof shows }>()
    for (const show of shows) {
      if (!filmMap.has(show.film.id)) {
        filmMap.set(show.film.id, { film: show.film, shows: [] })
      }
      filmMap.get(show.film.id)!.shows.push(show)
    }

    const distinctFilms = Array.from(filmMap.values())

    if (distinctFilms.length === 0) {
      return NextResponse.json(
        { error: 'Nessuno spettacolo nel periodo selezionato' },
        { status: 400 },
      )
    }

    if (distinctFilms.length > 2) {
      return NextResponse.json(
        { error: 'Più di 2 film nel periodo selezionato: usare un range più stretto' },
        { status: 400 },
      )
    }

    const films: FilmForNewsletter[] = distinctFilms.map(({ film, shows: filmShows }) => ({
      title: film.title,
      director: film.director,
      bolId: film.bolId,
      myMoviesUrl: film.myMoviesUrl,
      shows: filmShows.map(s => ({ datetime: s.datetime })),
    }))

    const dateRange = { start, end }
    const sections = generateNewsletterSections(films, dateRange)
    const subject = generateCampaignSubject(dateRange)
    const previewText = generatePreviewText(films)

    const { id: campaignId, webId, archiveUrl } = await createMailchimpDraft({
      subject,
      previewText,
      sections,
    })

    return NextResponse.json({ success: true, campaignId, webId, archiveUrl })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 },
    )
  }
}
