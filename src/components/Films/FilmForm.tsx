// src/components/Films/FilmForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { X, Save } from 'lucide-react'

interface FilmFormProps {
  film?: Film
  onClose: () => void
}

interface FormData {
  title: string
  duration: number | null
  bolId: number | null
  cinetelId: string
  description: string
  notes: string
}

export default function FilmForm({ film, onClose }: FilmFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: film?.title || '',
    duration: film?.duration || null,
    bolId: film?.bolId || null,
    cinetelId: film?.cinetelId || '',
    description: film?.description || '',
    notes: film?.notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = film ? `/api/films/${film.id}` : '/api/films'
      const method = film ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante il salvataggio')
      }

      toast({
        title: film ? 'Film aggiornato' : 'Film creato',
        description: `Il film "${formData.title}" è stato ${film ? 'aggiornato' : 'creato'} con successo.`
      })

      router.refresh()
      onClose()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error instanceof Error ? error.message : 'Errore durante il salvataggio'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Titolo</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              title: e.target.value
            }))}
            required
            placeholder="Titolo del film"
          />
        </div>

        <div>
          <Label htmlFor="duration">Durata (minuti)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration ?? ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              duration: e.target.value === '' ? null : parseInt(e.target.value)
            }))}
            placeholder="Durata in minuti"
          />
        </div>

        <div>
          <Label htmlFor="bolId">ID BOL</Label>
          <Input
            id="bolId"
            type="number"
            value={formData.bolId ?? ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              bolId: e.target.value === '' ? null : parseInt(e.target.value)
            }))}
            placeholder="ID BOL LiveTicket"
          />
        </div>

        <div>
          <Label htmlFor="cinetelId">ID Cinetel</Label>
          <Input
            id="cinetelId"
            value={formData.cinetelId}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              cinetelId: e.target.value
            }))}
            placeholder="ID Cinetel"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrizione</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              description: e.target.value
            }))}
            placeholder="Descrizione del film"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              notes: e.target.value
            }))}
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
          {loading ? 'Salvataggio...' : film ? 'Salva Modifiche' : 'Crea Film'}
        </Button>
      </div>
    </form>
  )
}