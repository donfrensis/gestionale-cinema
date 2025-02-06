// src/app/api/shows/[id]/assign/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await auth()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const paramsData = await context.params
    const { notes } = await request.json()
    const showId = parseInt(paramsData.id)

    // Prima verifichiamo se esiste già una availability per questo utente e show
    const existingAvailability = await prisma.availability.findUnique({
      where: {
        showId_userId: {
          showId,
          userId: parseInt(user.id)
        }
      }
    })

    if (existingAvailability) {
      // Se esiste, aggiorniamo lo stato invece di creare un nuovo record
      await prisma.availability.update({
        where: {
          id: existingAvailability.id
        },
        data: {
          status: "CONFIRMED",
          notes: notes || null
        }
      })
    } else {
      // Se non esiste, lo creiamo
      await prisma.availability.create({
        data: {
          showId,
          userId: parseInt(user.id),
          status: "CONFIRMED",
          notes: notes || null
        }
      })
    }

    // Aggiorna lo show con l'operatore
    await prisma.show.update({
      where: { id: showId },
      data: { operatorId: parseInt(user.id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to assign show:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}