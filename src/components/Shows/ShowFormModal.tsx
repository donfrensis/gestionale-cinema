//  src/components/Shows/ShowFormModal.tsx
"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ShowForm from "./ShowForm"
import { Show } from "@/types/shows"

interface ShowFormModalProps {
  show?: Show
  title: string
}

export default function ShowFormModal({ show, title }: ShowFormModalProps) {
  const router = useRouter()

  const handleClose = () => {
    // Forziamo entrambi i refresh prima di chiudere
    router.refresh()
    window.location.reload()
    router.back()
    setTimeout(() => {
      router.push('/shows')
    }, 100)
  }

  // Formatta la data nel formato che il form datetime-local si aspetta (YYYY-MM-DDTHH:mm)
  const formattedShow = show ? {
    ...show,
    datetime: show.datetime.replace(' ', 'T').replace('Z', '')
  } : undefined

  return (
    <Dialog 
      open={true} 
      onOpenChange={handleClose}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ShowForm 
          show={formattedShow} 
          onClose={handleClose} 
        />
      </DialogContent>
    </Dialog>
  )
}