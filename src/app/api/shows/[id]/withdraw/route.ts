// src/app/api/shows/[id]/withdraw/route.ts
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

   const existingAvailability = await prisma.availability.findUnique({
     where: {
       showId_userId: {
         showId,
         userId: parseInt(user.id)
       }
     }
   })

   if (!existingAvailability) {
     return new NextResponse('No availability found for this show', { status: 404 })
   }

   await prisma.availability.update({
     where: {
       id: existingAvailability.id
     },
     data: {
       status: "WITHDRAWN",
       notes: notes || null
     }
   })

   await prisma.show.update({
     where: { id: showId },
     data: { operatorId: null }
   })

   return NextResponse.json({ success: true })
 } catch (error) {
   console.error('Failed to withdraw from show:', error)
   return new NextResponse('Internal Server Error', { status: 500 })
 }
}