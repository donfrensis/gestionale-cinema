//  src/components/availability/AvailabilituCalendar.tsx
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Calendar, Clock, MessageSquare } from 'lucide-react'

interface Show {
  id: number
  date: string
  time: string
  film: {
    id: number
    title: string
  }
  operator_id: number | null
  notes?: string
}

export default function AvailabilityCalendar() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [noteInput, setNoteInput] = useState('')
  const [activeShowId, setActiveShowId] = useState<number | null>(null)

  useEffect(() => {
    fetchShows()
  }, [])

  const fetchShows = async () => {
    try {
      const today = new Date()
      // Troviamo il giovedì della settimana corrente
      const thursdayOffset = (4 - today.getDay() + 7) % 7
      const nextThursday = new Date(today)
      nextThursday.setDate(today.getDate() + thursdayOffset)
      nextThursday.setHours(0, 0, 0, 0)

      const response = await fetch('/api/shows/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate: nextThursday })
      })

      if (!response.ok) throw new Error('Failed to fetch shows')
      const data = await response.json()
      setShows(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare gli spettacoli"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (showId: number) => {
    try {
      const response = await fetch(`/api/shows/${showId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteInput })
      })
      
      if (!response.ok) throw new Error('Failed to assign show')
      
      await fetchShows()
      setNoteInput('')
      setActiveShowId(null)
      
      toast({
        title: "Successo",
        description: "Spettacolo assegnato"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile assegnare lo spettacolo"
      })
    }
  }

  const handleWithdraw = async (showId: number) => {
    try {
      const response = await fetch(`/api/shows/${showId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteInput })
      })
      
      if (!response.ok) throw new Error('Failed to withdraw from show')
      
      await fetchShows()
      setNoteInput('')
      setActiveShowId(null)

      toast({
        title: "Successo",
        description: "Rinuncia registrata"
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile registrare la rinuncia"
      })
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
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Eventi Disponibili</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shows.map((show) => (
            <div 
              key={show.id}
              className="bg-white rounded-lg shadow p-4 space-y-2 border"
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(show.date).toLocaleDateString()}</span>
                <Clock className="h-4 w-4 ml-2" />
                <span>{show.time}</span>
              </div>
              
              <div className="font-medium">{show.film.title}</div>

              {activeShowId === show.id && (
                <div className="space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Aggiungi una nota..."
                    className="w-full p-2 border rounded-md text-sm"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAssign(show.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                    >
                      Conferma
                    </button>
                    <button
                      onClick={() => setActiveShowId(null)}
                      className="border px-3 py-1 rounded-md text-sm"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
              
              {show.operator_id ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assegnato</span>
                  <button
                    onClick={() => {
                      setActiveShowId(show.id)
                      setNoteInput('')
                    }}
                    className="text-red-600 text-sm hover:text-red-700"
                  >
                    Rinuncia
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveShowId(show.id)
                    setNoteInput('')
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Segnati Disponibile
                </button>
              )}

              {show.notes && (
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <MessageSquare className="h-4 w-4 mt-0.5" />
                  <span>{show.notes}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}