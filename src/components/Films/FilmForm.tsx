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
import { X, Save, Search, Check, Loader2 } from 'lucide-react'
import type { MyMoviesSearchResult } from '@/lib/mymovies-scraper'

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
  nationality: string
  producer: string
  distributor: string
  posterUrl: string
  myMoviesUrl: string
  director: string
  italianReleaseDate: string  // formato YYYY-MM-DD per <input type="date">
  genre: string
}

// ─── Stato della sezione MyMovies ────────────────────────────────────────────
type MyMoviesUiState =
  | { phase: 'idle' }
  | { phase: 'searching' }
  | { phase: 'no-results' }
  | { phase: 'results'; list: MyMoviesSearchResult[] }
  | { phase: 'preview'; result: MyMoviesSearchResult }
  | { phase: 'unavailable' }  // MyMovies non raggiungibile

/** Converte un oggetto Date (o stringa ISO) in "YYYY-MM-DD" per <input type="date"> */
function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (isNaN(d.getTime())) return ''
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formatta "YYYY-MM-DD" come "GG/MM/AAAA" per la visualizzazione */
function formatDateDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
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
    notes: film?.notes || '',
    nationality: film?.nationality || '',
    producer: film?.producer || '',
    distributor: film?.distributor || '',
    posterUrl: film?.posterUrl || '',
    myMoviesUrl: film?.myMoviesUrl || '',
    director: (film as Film & { director?: string | null })?.director || '',
    italianReleaseDate: toDateInputValue(
      (film as Film & { italianReleaseDate?: Date | null })?.italianReleaseDate
    ),
    genre: (film as Film & { genre?: string | null })?.genre || '',
  })

  // ─── MyMovies UI state ───────────────────────────────────────────────────
  const [mmState, setMmState] = useState<MyMoviesUiState>({ phase: 'idle' })
  const [mmSaving, setMmSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = film ? `/api/films/${film.id}` : '/api/films'
      const method = film ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Converti la stringa YYYY-MM-DD in ISO full per il backend
          italianReleaseDate: formData.italianReleaseDate
            ? new Date(formData.italianReleaseDate).toISOString()
            : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Errore durante il salvataggio')
      }

      toast({
        title: film ? 'Film aggiornato' : 'Film creato',
        description: `Il film "${formData.title}" è stato ${film ? 'aggiornato' : 'creato'} con successo.`,
      })

      router.refresh()
      window.dispatchEvent(new Event('refreshFilmList'))
      onClose()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore durante il salvataggio',
      })
    } finally {
      setLoading(false)
    }
  }

  // ─── MyMovies: cerca ─────────────────────────────────────────────────────
  const handleMyMoviesSearch = async () => {
    const q = formData.title.trim()
    if (!q) {
      toast({ variant: 'destructive', title: 'Titolo mancante', description: 'Inserisci prima il titolo del film.' })
      return
    }
    setMmState({ phase: 'searching' })
    try {
      const res = await fetch(`/api/films/mymovies-search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error('Risposta non valida')
      const results: MyMoviesSearchResult[] = await res.json()
      if (results.length === 0) {
        setMmState({ phase: 'no-results' })
      } else if (results.length === 1) {
        setMmState({ phase: 'preview', result: results[0] })
      } else {
        setMmState({ phase: 'results', list: results })
      }
    } catch {
      setMmState({ phase: 'unavailable' })
    }
  }

  // ─── MyMovies: conferma selezione e salva ────────────────────────────────
  const handleMyMoviesConfirm = async (result: MyMoviesSearchResult) => {
    if (!film?.id) {
      // Film non ancora salvato: pre-popola i campi senza chiamata API
      setFormData(prev => ({
        ...prev,
        myMoviesUrl: result.url,
        director: result.director || prev.director,
      }))
      setMmState({ phase: 'idle' })
      toast({ title: 'Dati pre-compilati', description: 'Salva il film per confermare.' })
      return
    }

    setMmSaving(true)
    try {
      const res = await fetch(`/api/films/${film.id}/mymovies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ myMoviesUrl: result.url }),
      })
      if (!res.ok) throw new Error('Errore dal server')
      const updated = await res.json() as Film & { director?: string | null; italianReleaseDate?: string | null; genre?: string | null }
      // Aggiorna il form con i dati recuperati
      setFormData(prev => ({
        ...prev,
        myMoviesUrl: updated.myMoviesUrl || prev.myMoviesUrl,
        director: (updated.director ?? prev.director) || '',
        italianReleaseDate: updated.italianReleaseDate
          ? toDateInputValue(updated.italianReleaseDate)
          : prev.italianReleaseDate,
        genre: (updated.genre ?? prev.genre) || '',
      }))
      setMmState({ phase: 'idle' })
      toast({ title: 'Dati MyMovies importati', description: 'I campi sono stati aggiornati.' })
    } catch {
      setMmState({ phase: 'unavailable' })
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile recuperare i dati da MyMovies.' })
    } finally {
      setMmSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* ── Campi base ───────────────────────────────────────────────── */}
        <div>
          <Label htmlFor="title">Titolo</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
              duration: e.target.value === '' ? null : parseInt(e.target.value),
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
              bolId: e.target.value === '' ? null : parseInt(e.target.value),
            }))}
            placeholder="ID BOL LiveTicket"
          />
        </div>

        <div>
          <Label htmlFor="cinetelId">ID Cinetel</Label>
          <Input
            id="cinetelId"
            value={formData.cinetelId}
            onChange={(e) => setFormData(prev => ({ ...prev, cinetelId: e.target.value }))}
            placeholder="ID Cinetel"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrizione</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrizione del film"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Note aggiuntive"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="nationality">Nazionalità</Label>
          <Input
            id="nationality"
            value={formData.nationality}
            onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
            placeholder="Es. Italia, USA"
          />
        </div>

        <div>
          <Label htmlFor="producer">Produttore</Label>
          <Input
            id="producer"
            value={formData.producer}
            onChange={(e) => setFormData(prev => ({ ...prev, producer: e.target.value }))}
            placeholder="Casa di produzione"
          />
        </div>

        <div>
          <Label htmlFor="distributor">Distributore</Label>
          <Input
            id="distributor"
            value={formData.distributor}
            onChange={(e) => setFormData(prev => ({ ...prev, distributor: e.target.value }))}
            placeholder="Casa di distribuzione"
          />
        </div>

        <div>
          <Label htmlFor="posterUrl">URL Locandina</Label>
          <Input
            id="posterUrl"
            value={formData.posterUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
            placeholder="https://..."
          />
        </div>

        {/* ── Sezione MyMovies ─────────────────────────────────────────── */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Dati MyMovies</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMyMoviesSearch}
              disabled={mmState.phase === 'searching' || mmSaving}
            >
              {mmState.phase === 'searching'
                ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Ricerca…</>
                : <><Search className="h-3 w-3 mr-1" />Cerca su MyMovies</>
              }
            </Button>
          </div>

          {/* ── Feedback UI MyMovies ─────────────────────────────────── */}
          {mmState.phase === 'unavailable' && (
            <p className="text-sm text-muted-foreground">
              MyMovies non è raggiungibile. I campi restano modificabili manualmente.
            </p>
          )}

          {mmState.phase === 'no-results' && (
            <p className="text-sm text-muted-foreground">
              Nessun risultato su MyMovies. Inserisci i dati manualmente.
            </p>
          )}

          {mmState.phase === 'results' && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-1">Seleziona un risultato:</p>
              <ul className="divide-y rounded border bg-background max-h-48 overflow-y-auto">
                {mmState.list.map((r) => (
                  <li key={r.url}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onClick={() => setMmState({ phase: 'preview', result: r })}
                    >
                      <span className="font-medium">{r.title}</span>
                      <span className="text-muted-foreground ml-2">({r.year})</span>
                      {r.director && <span className="text-muted-foreground ml-2">— {r.director}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mmState.phase === 'preview' && (
            <div className="rounded border bg-background px-3 py-2 space-y-1 text-sm">
              <p><span className="font-medium">{mmState.result.title}</span> ({mmState.result.year})</p>
              {mmState.result.director && (
                <p className="text-muted-foreground">Regia: {mmState.result.director}</p>
              )}
              <p className="text-xs text-muted-foreground break-all">{mmState.result.url}</p>
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleMyMoviesConfirm(mmState.result)}
                  disabled={mmSaving}
                >
                  {mmSaving
                    ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Salvataggio…</>
                    : <><Check className="h-3 w-3 mr-1" />Usa questi dati</>
                  }
                </Button>
                {/* Torna all'idle */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMmState({ phase: 'idle' })}
                  disabled={mmSaving}
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}

          {/* ── Campi editabili MyMovies ─────────────────────────────── */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="myMoviesUrl">URL MyMovies</Label>
              <Input
                id="myMoviesUrl"
                value={formData.myMoviesUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, myMoviesUrl: e.target.value }))}
                placeholder="https://www.mymovies.it/film/ANNO/slug/"
              />
            </div>

            <div>
              <Label htmlFor="director">Regista</Label>
              <Input
                id="director"
                value={formData.director}
                onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
                placeholder="Nome del regista"
              />
            </div>

            <div>
              <Label htmlFor="genre">Genere</Label>
              <Input
                id="genre"
                value={formData.genre}
                onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                placeholder="Es. Biografico, Drammatico, Storico"
              />
            </div>

            <div>
              <Label htmlFor="italianReleaseDate">
                Uscita italiana{' '}
                {formData.italianReleaseDate && (
                  <span className="text-muted-foreground font-normal">
                    ({formatDateDisplay(formData.italianReleaseDate)})
                  </span>
                )}
              </Label>
              <Input
                id="italianReleaseDate"
                type="date"
                value={formData.italianReleaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, italianReleaseDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Annulla
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvataggio...' : film ? 'Salva Modifiche' : 'Crea Film'}
        </Button>
      </div>
    </form>
  )
}
