'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import type { ImportBolResult } from '@/app/api/films/import-bol/route'

export default function BolImportButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleImport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/films/import-bol', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'importazione')
      }

      const result = data as ImportBolResult
      const hasErrors = result.errors.length > 0

      toast({
        variant: hasErrors ? 'default' : 'default',
        title: hasErrors ? 'Importazione completata con avvisi' : 'Importazione completata',
        description: [
          `${result.imported} film importati`,
          result.skipped > 0 ? `${result.skipped} già presenti (saltati)` : null,
          hasErrors ? `${result.errors.length} errori` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })

      if (result.imported > 0) {
        router.refresh()
        window.dispatchEvent(new Event('refreshFilmList'))
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Errore importazione BOL',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleImport} disabled={loading}>
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Importazione...' : 'Importa da BOL'}
    </Button>
  )
}
