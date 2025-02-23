// src/app/shows/@modal/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import ShowFormModal from "@/components/Shows/ShowFormModal"

interface EditShowPageProps {
  params: { id: string }
}

export default async function EditShowPage({ params }: EditShowPageProps) {
  const resolvedParams = await params
  const showId = parseInt(resolvedParams.id)
  
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      film: true,
      operator: true,
      cashReport: {
        include: {
          operator: true
        }
      }
    }
  })

  if (!show) {
    notFound()
  }

  // Formattiamo i dati per il form
  const formattedShow = {
    ...show,
    datetime: show.datetime.toISOString()
  }

  return <ShowFormModal show={formattedShow} title="Modifica spettacolo" />
}