//  src/app/shows/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import ShowsTable from "@/components/Shows/ShowsTable"

export default async function ShowsPage() {

  const session = await getServerSession(authOptions)
  if (!session?.user.isAdmin) {
    redirect("/")
  }

  const shows = await prisma.show.findMany({
    include: {
      film: true,
      operator: true,
      cashReport: {
        include: {
          operator: true
        }
      }
    },
    orderBy: {
      datetime: "desc"
    }
  })

  // Formattiamo i dati nello stesso modo della Dashboard
  const formattedShows = shows.map(show => {
    const localDate = new Date(show.datetime)
    const localDateStr = localDate.getFullYear() + '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(localDate.getDate()).padStart(2, '0') + 'T' +
      String(localDate.getHours()).padStart(2, '0') + ':' +
      String(localDate.getMinutes()).padStart(2, '0') + ':' +
      String(localDate.getSeconds()).padStart(2, '0')

    const formatted = {
      id: show.id,
      datetime: localDateStr,
      film_title: show.film.title,
      operator_name: show.operator?.username,
      bolId: show.bolId,
      notes: show.notes,
      is_closed: show.cashReport !== null ? show.cashReport?.closingDateTime !== null : false,
      report_id: show.cashReport?.id
    }

    return formatted
  })

  return (
    <div className="container py-6">
      <ShowsTable shows={formattedShows} />
    </div>
  )
}