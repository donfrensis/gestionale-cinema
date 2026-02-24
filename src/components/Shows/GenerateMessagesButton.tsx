'use client'

import { useState } from 'react'
import { MessageSquare, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { generateMessages, getCurrentCinemaWeek, type ShowForMessage } from '@/lib/generate-messages'

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function GenerateMessagesButton() {
  const { start: defaultStart, end: defaultEnd } = getCurrentCinemaWeek()

  const [step, setStep] = useState<'idle' | 'picking' | 'messages'>('idle')
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart))
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd))
  const [generating, setGenerating] = useState(false)
  const [messages, setMessages] = useState<{ whatsapp: string; email: string } | null>(null)
  const [copiedWA, setCopiedWA] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const { toast } = useToast()

  const handleOpen = () => {
    // Reset defaults to current cinema week each time the dialog opens
    const { start, end } = getCurrentCinemaWeek()
    setStartDate(toDateInputValue(start))
    setEndDate(toDateInputValue(end))
    setStep('picking')
  }

  const handleClose = () => {
    setStep('idle')
    setMessages(null)
    setCopiedWA(false)
    setCopiedEmail(false)
  }

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Seleziona data inizio e fine.' })
      return
    }
    if (endDate < startDate) {
      toast({ variant: 'destructive', title: 'Errore', description: 'La data fine deve essere >= data inizio.' })
      return
    }

    setGenerating(true)
    try {
      const res = await fetch(`/api/shows?start=${startDate}&end=${endDate}`)
      if (!res.ok) throw new Error('Errore nel recupero degli spettacoli')
      const shows: ShowForMessage[] = await res.json()

      if (shows.length === 0) {
        toast({ title: 'Nessuno spettacolo', description: 'Nessuno spettacolo nel periodo selezionato.' })
        return
      }

      const msgs = generateMessages(shows, shows, {
        start: new Date(startDate),
        end: new Date(endDate),
      })

      setMessages(msgs)
      setStep('messages')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setGenerating(false)
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

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <MessageSquare className="h-4 w-4 mr-2" />
        Genera Messaggi
      </Button>

      {/* Date selection dialog */}
      {step === 'picking' && (
        <Dialog open onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Genera Messaggi Programmazione</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="gm-start">Data Inizio</Label>
                <Input
                  id="gm-start"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gm-end">Data Fine</Label>
                <Input
                  id="gm-end"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={generating}>
                Annulla
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generazione...' : 'Genera'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Messages dialog */}
      {step === 'messages' && messages && (
        <Dialog open onOpenChange={handleClose}>
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
              <Button variant="outline" onClick={() => setStep('picking')}>
                Modifica date
              </Button>
              <Button onClick={handleClose}>Chiudi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
