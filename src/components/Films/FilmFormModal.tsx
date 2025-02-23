// src/components/Films/FilmFormModal.tsx
'use client'

import { type Film } from "@prisma/client"
import FilmForm from "@/components/Films/FilmForm"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

interface FilmFormModalProps {
  film?: Film
  mode: 'new' | 'edit'
}

export default function FilmFormModal({ film, mode }: FilmFormModalProps) {
  const router = useRouter()

  const handleClose = () => {
    router.refresh()
    router.back()
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'new' ? 'Nuovo Film' : 'Modifica Film'}</DialogTitle>
        </DialogHeader>
        <FilmForm 
          film={film} 
          onClose={handleClose}  // Qui usiamo handleClose invece di router.back()
        />
      </DialogContent>
    </Dialog>
  )
}