//  src/app/api/shows/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { z } from "zod"

const showSchema = z.object({
  datetime: z.string(),  // Accettiamo qualsiasi stringa
  filmId: z.number().int().positive(),
  bolId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        datetime: 'desc'
      }
    })

    // Formattiamo i dati mantenendo l'ora locale
    const formattedShows = shows.map(show => {
      const localDate = new Date(show.datetime)
      const localDateStr = localDate.getFullYear() + '-' +
        String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(localDate.getDate()).padStart(2, '0') + 'T' +
        String(localDate.getHours()).padStart(2, '0') + ':' +
        String(localDate.getMinutes()).padStart(2, '0') + ':' +
        String(localDate.getSeconds()).padStart(2, '0')

      return {
        ...show,
        datetime: localDateStr
      }
    })

    return NextResponse.json(formattedShows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json()
    const validatedData = showSchema.parse(json)
    
    // Creiamo un nuovo show con i dati validati usando Date come nella modifica
    const show = await prisma.show.create({
      data: {
        datetime: new Date(validatedData.datetime),
        filmId: validatedData.filmId,
        bolId: validatedData.bolId,
        notes: validatedData.notes
      },
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

    // Formattiamo la risposta come abbiamo fatto per la lista
    const localDate = new Date(show.datetime)
    const localDateStr = localDate.getFullYear() + '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(localDate.getDate()).padStart(2, '0') + 'T' +
      String(localDate.getHours()).padStart(2, '0') + ':' +
      String(localDate.getMinutes()).padStart(2, '0') + ':' +
      String(localDate.getSeconds()).padStart(2, '0')

    const formattedShow = {
      ...show,
      datetime: localDateStr
    }

    return NextResponse.json(formattedShow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}