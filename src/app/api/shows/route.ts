// src/app/api/shows/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await auth()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Ottieni il parametro view dalla query
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'home') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Recupera gli show di oggi
      const todayShows = await prisma.show.findMany({
        where: {
          date: {
            equals: today
          }
        },
        include: {
          film: true,
          operator: true,
          cashReport: true
        },
        orderBy: [
          { time: 'asc' }
        ],
      })

      // Trova lo show corrente/prossimo
      const currentTime = new Date()
      const currentShow = todayShows.find(show => {
        const showTime = new Date(show.time)
        return showTime > currentTime
      }) || null

      // Trova l'ultimo show completato
      const lastHandled = await prisma.show.findFirst({
        where: {
          cashReport: {
            closingDateTime: {
              not: null
            }
          }
        },
        include: {
          film: true,
          cashReport: true
        },
        orderBy: [
          { date: 'desc' },
          { time: 'desc' }
        ]
      })

      return NextResponse.json({
        todayShows,
        currentShow,
        lastHandled
      })
    }

    return new NextResponse('Invalid view parameter', { status: 400 })
  } catch (error) {
    console.error('Failed to fetch shows:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}