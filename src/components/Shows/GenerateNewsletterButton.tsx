'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
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
import { getCurrentCinemaWeek } from '@/lib/generate-messages'

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function GenerateNewsletterButton() {
  const { start: defaultStart, end: defaultEnd } = getCurrentCinemaWeek()

  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState(toDateInputValue(defaultStart))
  const [endDate, setEndDate] = useState(toDateInputValue(defaultEnd))
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleOpen = () => {
    const { start, end } = getCurrentCinemaWeek()
    setStartDate(toDateInputValue(start))
    setEndDate(toDateInputValue(end))
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Seleziona data inizio e fine.' })
      return
    }
    if (endDate < startDate) {
      toast({ variant: 'destructive', title: 'Errore', description: 'La data fine deve essere >= data inizio.' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/mailchimp/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore nella creazione della bozza')
      }

      const campaignUrl = `https://us4.mailchimp.com/campaigns/edit?id=${data.webId}`
      window.open(campaignUrl, '_blank', 'noopener,noreferrer')
      toast({
        title: 'Bozza creata su Mailchimp',
        description: 'La campagna è stata aperta in una nuova scheda.',
      })
      setOpen(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        <Mail className="h-4 w-4 mr-2" />
        Crea bozza Mailchimp
      </Button>

      {open && (
        <Dialog open onOpenChange={handleClose}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Crea bozza Mailchimp</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="mc-start">Data Inizio</Label>
                <Input
                  id="mc-start"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mc-end">Data Fine</Label>
                <Input
                  id="mc-end"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Annulla
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creazione...' : 'Crea bozza'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
