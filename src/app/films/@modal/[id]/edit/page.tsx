// src/app/films/@modal/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import FilmFormModal from "@/components/Films/FilmFormModal"

export default async function EditFilmPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  const filmId = parseInt(resolvedParams.id)
  const film = await prisma.film.findUnique({
    where: { id: filmId }
  })
  

  if (!film) {
    notFound()
  }

  return <FilmFormModal mode="edit" film={film} />
}