//  src/app/api/shows/available/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await auth()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { fromDate } = await request.json()
    const startDate = new Date(fromDate)
    
    const shows = await prisma.show.findMany({
      where: {
        date: {
          gte: startDate,
        },
        time: {
          gt: new Date().toTimeString() // Per gli spettacoli di oggi, solo quelli non ancora iniziati
        }
      },
      include: {
        film: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ],
    })

    return NextResponse.json(shows)
  } catch (error) {
    console.error('Failed to fetch shows:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}