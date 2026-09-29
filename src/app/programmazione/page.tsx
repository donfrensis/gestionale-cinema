// src/app/programmazione/page.tsx
import { statSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'
import ProgrammazioneHeader from '@/components/Public/ProgrammazioneHeader'
import ShowList from '@/components/Public/ShowList'

export const dynamic = 'force-dynamic'

// Aggiunge ?v=<data modifica file> ai poster locali: se il file viene sostituito,
// l'indirizzo cambia e browser + service worker scaricano la versione nuova
// (la route /posters/[filename] risponde con cache immutable di un anno).
// Poster remoti o file mancanti: URL restituito invariato.
function versionedPoster(url: string | null): string | null {
  if (!url || !url.startsWith('/posters/')) return url
  const clean = url.split('?')[0]
  try {
    const file = path.join(process.cwd(), 'public', 'posters', path.basename(clean))
    return `${clean}?v=${Math.floor(statSync(file).mtimeMs)}`
  } catch {
    return url
  }
}

export default async function ProgrammazionePage() {
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

  const formattedShows = shows.map(show => {
    const d = new Date(show.datetime)
    const datetime =
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + 'T' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0')
    return {
      ...show,
      datetime,
      film: { ...show.film, posterUrl: versionedPoster(show.film.posterUrl) },
    }
  })

  return (
    <main>
      <ProgrammazioneHeader />
      <ShowList shows={formattedShows} />
    </main>
  )
}
