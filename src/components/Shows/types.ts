//  src/components/Shows/types.ts
export type Show = {
  id: number
  datetime: string
  film_title: string
  operator_name?: string
  bolId: number | null
  notes: string | null
  is_closed: boolean
  report_id?: number
}
  
export interface ShowListProps {
  shows: Show[]
}