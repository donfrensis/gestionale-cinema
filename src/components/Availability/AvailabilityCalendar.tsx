// src/components/Availability/AvailabilityCalendar.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MessageSquare, FilmIcon } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface Show {
 id: number
 date: string
 time: string
 film: {
   id: number
   title: string
 }
 operatorId: number | null
 operator?: {
   username: string
 }
 notes?: string
 availability: Array<{ status: string }>
}

export default function AvailabilityCalendar({ isAdmin }: { isAdmin: boolean }) {
 const [shows, setShows] = useState<Show[]>([])
 const [loading, setLoading] = useState(true)
 const [noteInput, setNoteInput] = useState('')
 const [activeShowId, setActiveShowId] = useState<number | null>(null)
 const [actionLoading, setActionLoading] = useState(false)

 useEffect(() => {
   fetchShows()
 }, [])

 const fetchShows = async () => {
   try {
     const response = await fetch('/api/shows/available', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({})
     })

     if (!response.ok) throw new Error('Failed to fetch shows')
     const data = await response.json()
     setShows(data)
   } catch (error) {
     console.error('Errore nel caricamento degli spettacoli:', error)
     toast({
       variant: "destructive",
       title: "Errore",
       description: "Impossibile caricare gli spettacoli. Riprova più tardi."
     })
   } finally {
     setLoading(false)
   }
 }

 const handleAssign = async (showId: number) => {
   try {
     setActionLoading(true)
     const response = await fetch(`/api/shows/${showId}/assign`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ notes: noteInput })
     })
     
     if (!response.ok) {
       const error = await response.text()
       throw new Error(error)
     }
     
     await fetchShows()
     setNoteInput('')
     setActiveShowId(null)
     
     toast({
       title: "Successo",
       description: "Ti sei assegnato allo spettacolo"
     })
   } catch (error) {
     console.error('Errore nell\'assegnazione dello spettacolo:', error)
     toast({
       variant: "destructive",
       title: "Errore",
       description: "Impossibile assegnarsi allo spettacolo. Riprova più tardi."
     })
   } finally {
     setActionLoading(false)
   }
 }

 const handleWithdraw = async (showId: number) => {
   try {
     setActionLoading(true)
     const response = await fetch(`/api/shows/${showId}/withdraw`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ notes: noteInput })
     })
     
     if (!response.ok) {
       const error = await response.text()
       throw new Error(error)
     }
     
     await fetchShows()
     setNoteInput('')
     setActiveShowId(null)

     toast({
       title: "Successo",
       description: "La tua rinuncia è stata registrata"
     })
   } catch (error) {
     console.error('Errore nella registrazione della rinuncia:', error)
     toast({
       variant: "destructive",
       title: "Errore",
       description: "Impossibile registrare la rinuncia. Riprova più tardi."
     })
   } finally {
     setActionLoading(false)
   }
 }

 if (loading) {
   return (
     <Card>
       <CardContent className="flex h-48 items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
       </CardContent>
     </Card>
   )
 }

 return (
   <Card className="shadow-none border-0 bg-transparent">
     <CardHeader>
       <h2 className="text-lg font-semibold">Eventi Disponibili</h2>
     </CardHeader>
     <CardContent>
       <div className="space-y-4">
         {shows.map((show) => {
           const now = new Date()
           const showDate = new Date(show.date)
           const showTime = new Date(show.time)
           
           const showDateTime = new Date(showDate)
           showDateTime.setHours(showTime.getHours())
           showDateTime.setMinutes(showTime.getMinutes())
           showDateTime.setSeconds(showTime.getSeconds())
           
           const isShowPassed = showDateTime < now

           return (
             <Card key={show.id} className="overflow-hidden">
               <div className="p-4 space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2 text-sm text-gray-600">
                     <Calendar className="h-4 w-4" />
                     <span>{new Date(show.date).toLocaleDateString()}</span>
                     <Clock className="h-4 w-4 ml-2" />
                     <span>{showTime.toLocaleTimeString().slice(0, 5)}</span>
                     <FilmIcon className="h-4 w-4 ml-2"/>
                     <span>{show.film.title}</span>
                   </div>
                   {show.operatorId && (
                     <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                       {show.operator?.username ? `${show.operator.username}` : ''}
                     </span>
                   )}
                 </div>
                 
                 {show.notes && (
                   <div className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                     <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                     <span>{show.notes}</span>
                   </div>
                 )}

                 {isShowPassed ? (
                   <Button variant="secondary" className="w-full" disabled>
                     Evento passato
                   </Button>
                 ) : activeShowId === show.id ? (
                   <div className="space-y-3">
                     <textarea
                       value={noteInput}
                       onChange={(e) => setNoteInput(e.target.value)}
                       placeholder="Aggiungi una nota (opzionale)..."
                       className="w-full p-2 border rounded text-sm"
                       rows={2}
                     />
                     <div className="flex space-x-2">
                       <Button
                         onClick={() => show.operatorId 
                           ? handleWithdraw(show.id)
                           : handleAssign(show.id)
                         }
                         disabled={actionLoading}
                         variant={show.operatorId ? "destructive" : "default"}
                         className="flex-1"
                       >
                         {actionLoading ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-2 border-white" />
                         ) : (
                           show.operatorId ? 'Conferma Rinuncia' : 'Confermo Disponibilità'
                         )}
                       </Button>
                       <Button
                         onClick={() => {
                           setActiveShowId(null)
                           setNoteInput('')
                         }}
                         variant="outline"
                         disabled={actionLoading}
                       >
                         Annulla
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <>
                     {!isAdmin && show.operatorId ? (
                       show.availability.length === 0 || show.availability[0].status !== 'CONFIRMED' ? (
                         <Button variant="secondary" className="w-full" disabled>
                           Non puoi rinunciare
                         </Button>
                       ) : (
                         <Button onClick={() => setActiveShowId(show.id)} variant="destructive" className="w-full">
                           Rinuncia
                         </Button>
                       )
                     ) : (
                       <Button onClick={() => setActiveShowId(show.id)} 
                         variant={show.operatorId ? "destructive" : "default"} 
                         className="w-full"
                       >
                         {show.operatorId ? 'Rinuncia' : 'Segnati Disponibile'}
                       </Button>
                     )}
                   </>
                 )}
               </div>
             </Card>
           )
         })}

         {shows.length === 0 && (
           <div className="text-center text-gray-500 py-8">
             Nessun evento disponibile in questo periodo
           </div>
         )}
       </div>
     </CardContent>
   </Card>
 )
}