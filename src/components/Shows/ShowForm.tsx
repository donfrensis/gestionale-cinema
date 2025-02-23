//  src/components/Shows/ShowForm.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Film } from '@prisma/client'
import { Show, CreateShowInput } from "@/types/shows"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { X, Save } from 'lucide-react'

interface ShowFormProps {
  show?: Show
  onClose: () => void
}

export default function ShowForm({ show, onClose }: ShowFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [films, setFilms] = useState<Film[]>([])
  const [mounted, setMounted] = useState(false)

  // Inizializza i dati del form
  const [formData, setFormData] = useState<CreateShowInput>({
    datetime: '',
    filmId: 0,
    bolId: null,
    notes: ''
  })

  useEffect(() => {
    setMounted(true)
    if (show) {
      // Se stiamo modificando uno show esistente
      const date = new Date(show.datetime)
      const formattedDatetime = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + 'T' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0')

      setFormData({
        datetime: formattedDatetime,
        filmId: show.filmId,
        bolId: show.bolId,
        notes: show.notes || ''
      })
    } else {
      // Se stiamo creando un nuovo show
      const now = new Date()
      now.setHours(20, 30, 0, 0)
      // Formatta la data come YYYY-MM-DDTHH:mm
      const dateStr = 
        now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0')
      
      setFormData(prev => ({
        ...prev,
        datetime: dateStr
      }))
    }
  }, [show])

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        const response = await fetch("/api/films")
        if (!response.ok) {
          throw new Error("Errore nel caricamento dei film")
        }
        const data = await response.json()
        setFilms(data)
        // Se non è un edit e ci sono film, imposta il primo film
        if (!show && data.length > 0) {
          setFormData(prev => ({ ...prev, filmId: data[0].id }))
        }
      } catch (err) {
        toast({
          title: "Errore",
          description: err instanceof Error ? err.message : "Errore nel caricamento dei film",
          variant: "destructive"
        })
      }
    }
    fetchFilms()
  }, [show, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = show ? `/api/shows/${show.id}` : "/api/shows"
      const method = show ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof responseData.error === 'string' 
            ? responseData.error 
            : JSON.stringify(responseData.error)
        )
      }

      toast({
        title: show ? "Spettacolo modificato" : "Spettacolo creato",
        description: show 
          ? "Le modifiche sono state salvate con successo"
          : "Il nuovo spettacolo è stato creato con successo"
      })

      // Forziamo il refresh prima di chiudere
      router.refresh()
      window.location.reload()
      onClose()
    } catch (err) {
      toast({
        title: "Errore",
        description: err instanceof Error ? err.message : "Errore sconosciuto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="datetime">Data e Ora</Label>
          <Input
            id="datetime"
            type="datetime-local"
            required
            value={formData.datetime}
            onChange={e => 
              setFormData(prev => ({ 
                ...prev, 
                datetime: e.target.value
              }))
            }
          />
        </div>

        <div>
          <Label htmlFor="film">Film</Label>
          <select
            id="film"
            className="w-full px-3 py-2 border rounded-md"
            required
            value={formData.filmId}
            onChange={e => 
              setFormData(prev => ({ 
                ...prev, 
                filmId: parseInt(e.target.value) 
              }))
            }
          >
            <option value="">Seleziona un film</option>
            {films.map(film => (
              <option key={film.id} value={film.id}>
                {film.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="bolId">ID BOL</Label>
          <Input
            id="bolId"
            type="number"
            value={formData.bolId ?? ''}
            onChange={e => 
              setFormData(prev => ({ 
                ...prev, 
                bolId: e.target.value === '' ? null : parseInt(e.target.value)
              }))
            }
            placeholder="ID BOL LiveTicket"
          />
        </div>

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={e => 
              setFormData(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))
            }
            placeholder="Note aggiuntive"
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvataggio...' : show ? 'Salva Modifiche' : 'Crea Spettacolo'}
        </Button>
      </div>
    </form>
  )
}