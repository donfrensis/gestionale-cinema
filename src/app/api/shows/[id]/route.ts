//  src/app/api/shows/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/db"
import { z } from "zod"

// Tipo aggiornato per Next.js 15
type RouteParams = { params: Promise<{ id: string }> }

const updateShowSchema = z.object({
  datetime: z.string().refine((value) => {
    try {
      new Date(value);
      return true;
    } catch {
      return false;
    }
  }, "Formato data/ora non valido"),
  filmId: z.number().int().positive().optional(),
  bolId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional()
})

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params;
    const showId = parseInt(params.id)

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
      return NextResponse.json({ error: "Show not found" }, { status: 404 })
    }

    // Formattiamo la risposta
    const formattedShow = {
      ...show,
      datetime: new Date(show.datetime).toISOString().slice(0, 16)
    }

    return NextResponse.json(formattedShow)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params;
    const showId = parseInt(params.id)

    const json = await request.json()
    const validatedData = updateShowSchema.parse(json)

    // Prepariamo i dati per l'update
    const updateData: {
      datetime?: Date
      filmId?: number
      bolId?: number | null
      notes?: string | null
    } = {}
    
    if (validatedData.datetime) updateData.datetime = new Date(validatedData.datetime)
    if (validatedData.filmId) updateData.filmId = validatedData.filmId
    if (validatedData.bolId) updateData.bolId = validatedData.bolId
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const show = await prisma.show.update({
      where: { id: showId },
      data: updateData,
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

    // Formattiamo la risposta
    const formattedShow = {
      ...show,
      datetime: show.datetime.toISOString()
    }

    return NextResponse.json(formattedShow)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params;
    const showId = parseInt(params.id)

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { cashReport: true }
    })

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 })
    }

    if (show.cashReport) {
      return NextResponse.json(
        { error: "Cannot delete show with associated cash report" },
        { status: 400 }
      )
    }

    await prisma.show.delete({
      where: { id: showId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}