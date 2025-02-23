//  src/types/shows.ts
import { Film, User } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export type ShowStatus = "NOT_OPENED" | "OPENED" | "CLOSED"
export type CashStatus = "BALANCED" | "UNBALANCED" | null

export interface Show {
  id: number
  datetime: string     // formattata da toISOString()
  filmId: number
  film: Film
  operatorId: number | null
  operator: User | null
  bolId: number | null
  notes: string | null
  cashReport?: {
    id: number
    operatorId: number
    operator: User
    openingDateTime: Date
    closingDateTime: Date | null
    posTotal: Decimal | null
    ticketTotal: Decimal | null
    subscriptionTotal: Decimal | null
    notes: string | null
  } | null
}

export interface CreateShowInput {
  datetime: string
  filmId: number
  bolId?: number | null
  notes?: string | null
}

export interface UpdateShowInput extends Partial<CreateShowInput> {
  id: number
}

// export const formatShowTime = (time: string): string => {
//  return time.slice(0, 5) // Prende solo HH:mm
//}

export const formatShowDate = (datetime: string): string => {
  const dt = new Date(datetime)
  const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
  const days = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
  
  const day = dt.getDate()
  const month = months[dt.getMonth()]
  const dayName = days[dt.getDay()]
  
  return `${day} ${month}\n${dayName}`
}

export const getShowStatus = (show: Show): ShowStatus => {
  if (!show.cashReport) return "NOT_OPENED"
  if (!show.cashReport.closingDateTime) return "OPENED"
  return "CLOSED"
}

export const getCashStatus = (show: Show): CashStatus => {
  if (!show.cashReport || !show.cashReport.closingDateTime) return null
  // TODO: implementare la logica per determinare se la cassa è quadrata
  return "BALANCED"
}