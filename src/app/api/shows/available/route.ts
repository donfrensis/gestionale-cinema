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
       date: {
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
     orderBy: [
       { date: 'asc' },
       { time: 'asc' }
     ],
   })

   // Non filtriamo qui gli show del giorno corrente,
   // lasciamo che sia il client a gestire la visualizzazione
   // degli eventi passati tramite l'interfaccia utente
   
   return NextResponse.json(shows)
 } catch (error) {
   console.error('Failed to fetch shows:', error)
   return new NextResponse('Internal Server Error', { status: 500 })
 }
}