// src/components/Films/FilmFormModal.tsx
'use client'

import { useState } from "react"
import { type Film } from "@prisma/client"
import FilmForm from "@/components/Films/FilmForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { X, Save } from "lucide-react"

interface FilmFormModalProps {
  film?: Film
  mode: 'new' | 'edit'
}

export default function FilmFormModal({ film, mode }: FilmFormModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    router.refresh()
    router.back()
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="flex flex-col max-h-[90vh] max-w-lg w-full">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === 'new' ? 'Nuovo Film' : 'Modifica Film'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <FilmForm film={film} onClose={handleClose} onLoadingChange={setLoading} />
        </div>
        <div className="shrink-0 flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button type="submit" form="film-form" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvataggio...' : film ? 'Salva Modifiche' : 'Crea Film'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
