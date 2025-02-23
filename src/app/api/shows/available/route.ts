//  src/app/api/shows/available/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const user = await auth()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const now = new Date()
    
    // Troviamo il giovedì precedente
    const prevThursday = new Date()
    prevThursday.setDate(now.getDate() - ((now.getDay() + 3) % 7))
    prevThursday.setHours(0, 0, 0, 0)

    const shows = await prisma.show.findMany({
      where: {
        datetime: {
          gte: prevThursday
        }
      },
      include: {
        film: {
          select: {
            id: true,
            title: true
          }
        },
        operator: {
          select: {
            username: true
          }
        },
        availability: {
          where: {
            userId: parseInt(user.id)
          },
          select: {
            status: true
          }
        }
      },
      orderBy: {
        datetime: 'asc'
      },
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
    console.error('Failed to fetch shows:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}