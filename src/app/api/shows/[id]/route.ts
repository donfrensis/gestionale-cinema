//  src/app/api/shows/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notifyEventModified, notifyEventCancelled } from "@/lib/server-notifications"; // Importato i moduli di notifica

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

    // Ottieni le informazioni dello spettacolo prima della modifica
    const existingShow = await prisma.show.findUnique({
      where: { id: showId },
      include: { film: true }
    });

    if (!existingShow) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 })
    }

    const json = await request.json()
    
    // Estrai l'opzione sendNotification, di default è true
    const sendNotification = json.sendNotification !== false;
    
    // Crea una copia dei dati senza il campo sendNotification
    const dataToValidate = { ...json };
    // Rimuovi sendNotification se presente
    if ('sendNotification' in dataToValidate) {
      delete dataToValidate.sendNotification;
    }
    
    const validatedData = updateShowSchema.parse(dataToValidate)

    // Prepariamo i dati per l'update
    const updateData: {
      datetime?: Date
      filmId?: number
      bolId?: number | null
      notes?: string | null
    } = {}
    
    if (validatedData.datetime) updateData.datetime = new Date(validatedData.datetime)
    if (validatedData.filmId) updateData.filmId = validatedData.filmId
    if (validatedData.bolId !== undefined) updateData.bolId = validatedData.bolId
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

    // Invia notifica a tutti gli utenti per la modifica dello spettacolo
    // solo se l'opzione è attivata
    if (sendNotification) {
      await notifyEventModified(prisma, showId, show.film.title, show.datetime);
    }

    // Formattiamo la risposta
    const formattedShow = {
      ...show,
      datetime: show.datetime.toISOString()
    }

    return NextResponse.json({
      ...formattedShow,
      notificationSent: sendNotification
    })
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

    // Estrai l'opzione sendNotification, di default è true
    let sendNotification = true;
    try {
      const body = await request.text();
      if (body) {
        const json = JSON.parse(body);
        sendNotification = json.sendNotification !== false;
      }
    } catch {
      // Se il body è vuoto o non è un JSON valido, usa il default (true)
      console.log("No valid request body in DELETE, using default notification setting");
    }

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { 
        cashReport: true,
        film: true
      }
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

    // Prima di eliminare lo spettacolo, invia una notifica di cancellazione
    if (sendNotification) {
      await notifyEventCancelled(prisma, show.film.title, show.datetime);
    }

    await prisma.show.delete({
      where: { id: showId }
    })

    return NextResponse.json({ 
      success: true,
      notificationSent: sendNotification
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}