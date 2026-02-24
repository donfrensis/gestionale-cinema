// src/components/Cash/CashFormModal.tsx
'use client'

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CashForm } from "./CashForm"
import type { CashReport } from '@prisma/client'

interface CashFormModalProps {
  showId: number
  showTitle: string
  showDatetime: string
  type: 'opening' | 'closing'
  expectedOpeningTotal?: number
  currentReport: CashReport | null
  returnPath?: string // Nuovo parametro opzionale
}

export default function CashFormModal({ 
  showId, 
  showTitle, 
  showDatetime,
  type, 
  expectedOpeningTotal = 0, 
  currentReport,
  returnPath = '/shows' // Default a /shows se non specificato 
}: CashFormModalProps) {
  const router = useRouter()

  const handleClose = () => {
    // Forziamo entrambi i refresh prima di chiudere
    router.refresh()
    window.location.reload()
    router.back()
    setTimeout(() => {
      router.push(returnPath) // Usa il percorso di ritorno specificato
    }, 100)
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>
            {type === 'opening' ? "Apertura Cassa" : "Chiusura Cassa"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-sm text-gray-500 mb-4">
          {showTitle} - {new Date(showDatetime.replace('Z', '')).toLocaleString('it-IT', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        <CashForm 
          showId={showId}
          type={type}
          expectedOpeningTotal={expectedOpeningTotal}
          currentReport={currentReport}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  )
}