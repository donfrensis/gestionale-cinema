//  src/app/api/films/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'
import type { FilmFormData } from '@/types/films'

type RouteParams = { params: { id: string } }

// GET /api/films/[id] - Dettagli film
export async function GET(request: Request, { params }: RouteParams) {
 try {
   // Verifica autenticazione e ruolo admin
   const session = await getServerSession(authOptions)
   if (!session?.user?.isAdmin) {
     return NextResponse.json(
       { error: 'Non autorizzato' },
       { status: 403 }
     )
   }

   const resolvedParams = await params
   const film = await prisma.film.findUnique({
     where: { id: parseInt(resolvedParams.id) },
     include: {
       shows: {
         select: {
           id: true,
           date: true,
           time: true
         }
       }
     }
   })

   if (!film) {
     return NextResponse.json(
       { error: 'Film non trovato' },
       { status: 404 }
     )
   }

   return NextResponse.json(film)
 } catch (error) {
   console.error('Error fetching film:', error)
   return NextResponse.json(
     { error: 'Errore nel recupero del film' },
     { status: 500 }
   )
 }
}

// PUT /api/films/[id] - Aggiorna film
export async function PUT(request: Request, { params }: RouteParams) {
 try {
   // Verifica autenticazione e ruolo admin
   const session = await getServerSession(authOptions)
   if (!session?.user?.isAdmin) {
     return NextResponse.json(
       { error: 'Non autorizzato' },
       { status: 403 }
     )
   }

   const data = await request.json() as FilmFormData
   
   // Validazioni base
   if (!data.title?.trim()) {
     return NextResponse.json(
       { error: 'Il titolo è obbligatorio' },
       { status: 400 }
     )
   }
   
   // Verifica esistenza film
   const resolvedParams = await params
   const filmId = parseInt(resolvedParams.id)
   const existingFilm = await prisma.film.findUnique({
     where: { id: filmId }
   })

   if (!existingFilm) {
     return NextResponse.json(
       { error: 'Film non trovato' },
       { status: 404 }
     )
   }

   // Verifica titolo duplicato (escludendo il film corrente)
   const duplicateFilm = await prisma.film.findFirst({
     where: {
       AND: [
         {
           title: {
             equals: data.title.trim().toLowerCase()
           }
         },
         {
           id: {
             not: filmId
           }
         }
       ]
     }
   })

   if (duplicateFilm) {
     return NextResponse.json(
       { error: 'Esiste già un film con questo titolo' },
       { status: 400 }
     )
   }

   // Aggiornamento film
   const updatedFilm = await prisma.film.update({
     where: { id: filmId },
     data: {
       title: data.title.trim(),
       duration: data.duration,
       bolId: data.bolId,
       cinetelId: data.cinetelId,
       description: data.description?.trim() || null,
       notes: data.notes?.trim() || null
     }
   })

   return NextResponse.json(updatedFilm)
 } catch (error) {
   console.error('Error updating film:', error)
   return NextResponse.json(
     { error: 'Errore nell\'aggiornamento del film' },
     { status: 500 }
   )
 }
}

// DELETE /api/films/[id] - Elimina film
export async function DELETE(request: Request, { params }: RouteParams) {
 try {
   // Verifica autenticazione e ruolo admin
   const session = await getServerSession(authOptions)
   if (!session?.user?.isAdmin) {
     return NextResponse.json(
       { error: 'Non autorizzato' },
       { status: 403 }
     )
   }

   const resolvedParams = await params
   const filmId = parseInt(resolvedParams.id)

   // Verifica se il film ha spettacoli associati
   const filmWithShows = await prisma.film.findUnique({
     where: { id: filmId },
     include: {
       shows: {
         take: 1 // Ne basta uno per sapere se ce ne sono
       }
     }
   })

   if (filmWithShows?.shows.length) {
     return NextResponse.json(
       { error: 'Impossibile eliminare il film perché è utilizzato in uno o più spettacoli' },
       { status: 400 }
     )
   }

   // Eliminazione film
   await prisma.film.delete({
     where: { id: filmId }
   })

   return NextResponse.json({ success: true })
 } catch (error) {
   console.error('Error deleting film:', error)
   return NextResponse.json(
     { error: 'Errore nell\'eliminazione del film' },
     { status: 500 }
   )
 }
}