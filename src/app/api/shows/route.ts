// src/app/api/shows/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth-options';
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notifyNewEvents } from "@/lib/server-notifications" 

const showSchema = z.object({
  datetime: z.string(),
  filmId: z.number().int().positive(),
  bolId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional()
})

// Schema modificato per includere l'opzione di notifica
const bulkCreateSchema = z.object({
  shows: z.array(showSchema),
  sendNotification: z.boolean().default(true) // Opzione per l'admin di decidere se inviare la notifica
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
    
    // Verifica se è una richiesta per batch o per singolo spettacolo
    const isBulkCreation = json.shows && Array.isArray(json.shows);
    
    if (isBulkCreation) {
      // Gestione creazione in batch con opzione di notifica
      const validatedData = bulkCreateSchema.parse(json);
      const { shows, sendNotification } = validatedData;
      
      // Creazione in batch di tutti gli spettacoli
      const showPromises = shows.map(item => 
        prisma.show.create({
          data: {
            datetime: new Date(item.datetime),
            filmId: item.filmId,
            bolId: item.bolId,
            notes: item.notes
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
      );
      
      const createdShows = await Promise.all(showPromises);
      
      // Invia notifica solo se l'admin ha scelto di farlo
      if (sendNotification && createdShows.length > 0) {
        await notifyNewEvents(prisma, createdShows.length);
      }
      
      // Formatta la risposta
      const formattedShows = createdShows.map(show => {
        const localDate = new Date(show.datetime);
        const localDateStr = localDate.getFullYear() + '-' +
          String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
          String(localDate.getDate()).padStart(2, '0') + 'T' +
          String(localDate.getHours()).padStart(2, '0') + ':' +
          String(localDate.getMinutes()).padStart(2, '0') + ':' +
          String(localDate.getSeconds()).padStart(2, '0');
          
        return {
          ...show,
          datetime: localDateStr
        };
      });
      
      return NextResponse.json({
        shows: formattedShows,
        notificationSent: sendNotification
      });
    } else {
      // Gestione singolo spettacolo (può includere l'opzione sendNotification)
      const sendNotification = json.sendNotification !== false; // Se non specificato, invia per default
      
      // Crea una copia dei dati senza il campo sendNotification
      const dataToValidate = { ...json };
      // Rimuovi sendNotification se presente
      if ('sendNotification' in dataToValidate) {
        delete dataToValidate.sendNotification;
      }
      
      // Usiamo lo schema esistente per validare i dati
      const validatedData = showSchema.parse(dataToValidate);
      
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
      });
      
      // Formattiamo la risposta
      const localDate = new Date(show.datetime);
      const localDateStr = localDate.getFullYear() + '-' +
        String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(localDate.getDate()).padStart(2, '0') + 'T' +
        String(localDate.getHours()).padStart(2, '0') + ':' +
        String(localDate.getMinutes()).padStart(2, '0') + ':' +
        String(localDate.getSeconds()).padStart(2, '0');
      
      const formattedShow = {
        ...show,
        datetime: localDateStr
      };
      
      // Invia notifica solo se specificato (default: true)
      if (sendNotification) {
        await notifyNewEvents(prisma, 1);
      }
      
      return NextResponse.json({
        show: formattedShow,
        notificationSent: sendNotification
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}