// src/app/programmazione/page.tsx
import { prisma } from '@/lib/db'
import ProgrammazioneHeader from '@/components/Public/ProgrammazioneHeader'
import ShowList from '@/components/Public/ShowList'

export const dynamic = 'force-dynamic'

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
    return { ...show, datetime }
  })

  return (
    <main>
      <ProgrammazioneHeader />
      <ShowList shows={formattedShows} />
    </main>
  )
}
