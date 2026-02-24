//  src/components/Shows/ShowFilters.tsx
'use client'

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateFilter = 'week' | 'month' | 'year' | 'yearMonth' | 'all'

interface ShowFiltersProps {
  onDateFilterChange: (value: DateFilter) => void
  dateFilter: DateFilter
}

export default function ShowFilters({ onDateFilterChange, dateFilter }: ShowFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Select value={dateFilter} onValueChange={(value: DateFilter) => onDateFilterChange(value)}>
        <SelectTrigger className="w-45">
          <SelectValue placeholder="Seleziona periodo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tutti gli spettacoli</SelectItem>
          <SelectItem value="week">Ultima settimana</SelectItem>
          <SelectItem value="month">Ultimo mese</SelectItem>
          <SelectItem value="year">Anno corrente</SelectItem>
          <SelectItem value="yearMonth">Anno e mese correnti</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}