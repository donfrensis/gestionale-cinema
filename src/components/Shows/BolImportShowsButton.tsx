'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { BolShowPreview } from '@/app/api/shows/import-bol/route'
import { generateMessages, type ShowForMessage } from '@/lib/generate-messages'

export default function BolImportShowsButton() {
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previews, setPreviews] = useState<BolShowPreview[] | null>(null)
  const [unmatched, setUnmatched] = useState<string[]>([])
  const [sendNotification, setSendNotification] = useState(true)
  const [messages, setMessages] = useState<{ whatsapp: string; email: string } | null>(null)
  const [copiedWA, setCopiedWA] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleFetchPreview = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/shows/import-bol')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante il recupero da BOL')
      }

      if (data.shows.length === 0) {
        toast({
          title: 'Nessun nuovo spettacolo',
          description: 'Tutti gli spettacoli BOL sono già presenti nel database.',
        })
        return
      }

      setPreviews(data.shows)
      setUnmatched(data.unmatched || [])
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore BOL',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!previews) return
    setImporting(true)
    try {
      const res = await fetch('/api/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shows: previews.map((p) => ({
            datetime: p.datetime,
            filmId: p.filmId,
            bolId: p.bolId,
          })),
          sendNotification,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Errore durante l'importazione")
      }

      toast({
        title: 'Spettacoli importati',
        description: `${data.shows.length} spettacol${data.shows.length === 1 ? 'o importato' : 'i importati'}${
          data.notificationSent ? ' e notifica inviata' : ' senza inviare notifiche'
        }`,
      })

      // Fetch all shows to build complete cinema-week messages
      const allShowsRes = await fetch('/api/shows')
      const allShows: ShowForMessage[] = allShowsRes.ok ? await allShowsRes.json() : []

      const msgs = generateMessages(data.shows as ShowForMessage[], allShows)
      setPreviews(null)
      setMessages(msgs)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore importazione',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setImporting(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'wa' | 'email') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'wa') {
        setCopiedWA(true)
        setTimeout(() => setCopiedWA(false), 2000)
      } else {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      }
    } catch {
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile copiare negli appunti' })
    }
  }

  const handleCloseMessages = () => {
    setMessages(null)
    router.refresh()
  }

  const formatDatetime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleFetchPreview} disabled={loading}>
        <Download className="h-4 w-4 mr-2" />
        {loading ? 'Recupero da BOL...' : 'Importa da BOL'}
      </Button>

      {/* Preview dialog */}
      {previews && (
        <Dialog open onOpenChange={() => setPreviews(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Importa spettacoli da BOL ({previews.length})
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {previews.map((p) => {
                const { date, time } = formatDatetime(p.datetime)
                return (
                  <div
                    key={p.bolId}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                  >
                    <span className="font-medium truncate">{p.filmTitle}</span>
                    <span className="text-gray-500 whitespace-nowrap">
                      {date} {time}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      BOL #{p.bolId}
                    </span>
                  </div>
                )
              })}
            </div>

            {unmatched.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  {unmatched.length} spettacol{unmatched.length === 1 ? 'o ignorato' : 'i ignorati'} (film non trovato nel DB):
                </p>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-0.5">
                  {unmatched.map((t) => (
                    <li key={t} className="text-xs">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center space-x-2 border-t pt-4">
              <Switch
                id="bol-notify"
                checked={sendNotification}
                onCheckedChange={setSendNotification}
              />
              <Label htmlFor="bol-notify">Invia notifica agli operatori</Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviews(null)} disabled={importing}>
                Annulla
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing
                  ? 'Importazione...'
                  : `Importa ${previews.length} spettacol${previews.length === 1 ? 'o' : 'i'}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Messages dialog */}
      {messages && (
        <Dialog open onOpenChange={handleCloseMessages}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Messaggi Programmazione</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-5 py-2">
              {/* WhatsApp */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">WhatsApp</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(messages.whatsapp, 'wa')}
                  >
                    {copiedWA
                      ? <Check className="h-4 w-4 mr-1 text-green-600" />
                      : <Copy className="h-4 w-4 mr-1" />}
                    {copiedWA ? 'Copiato!' : 'Copia WhatsApp'}
                  </Button>
                </div>
                <textarea
                  className="w-full h-52 text-xs font-mono p-2 border rounded resize-y bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                  value={messages.whatsapp}
                  readOnly
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Email</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(messages.email, 'email')}
                  >
                    {copiedEmail
                      ? <Check className="h-4 w-4 mr-1 text-green-600" />
                      : <Copy className="h-4 w-4 mr-1" />}
                    {copiedEmail ? 'Copiato!' : 'Copia Email'}
                  </Button>
                </div>
                <textarea
                  className="w-full h-52 text-xs font-mono p-2 border rounded resize-y bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                  value={messages.email}
                  readOnly
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleCloseMessages}>Chiudi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
