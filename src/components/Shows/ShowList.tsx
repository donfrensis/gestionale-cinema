'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { type ShowListProps } from './types'

export default function ShowList({ shows }: ShowListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo spettacolo?')) return

    try {
      const res = await fetch(`/api/shows/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Errore durante l'eliminazione")
      }

      toast({
        title: 'Spettacolo eliminato',
        description: 'Lo spettacolo è stato eliminato con successo',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
        variant: 'destructive',
      })
    }
  }

  const filteredShows = shows.filter(show =>
    show.film_title.toLowerCase().includes(search.toLowerCase()) ||
    show.bolId?.toString().includes(search) ||
    show.notes?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateTimeString: string) => {
    if (!mounted) return null
    
    const date = new Date(dateTimeString)
    const dayMonth = new Intl.DateTimeFormat('it-IT', { 
      day: 'numeric',
      month: 'long'
    }).format(date)
    const weekday = new Intl.DateTimeFormat('it-IT', { 
      weekday: 'long'
    }).format(date)
    return (
      <div>
        <div>{dayMonth}</div>
        <div className="text-gray-500 text-sm">{weekday}</div>
      </div>
    )
  }

  const formatTime = (dateTimeString: string) => {
    if (!mounted) return null
    
    const date = new Date(dateTimeString)
    return new Intl.DateTimeFormat('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date)
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca..."
              className="pl-8"
              disabled
            />
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Spettacolo
          </Button>
        </div>
        <div className="rounded-md border">
          <div className="p-8 text-center text-gray-500">
            Caricamento...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link href="/shows/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Spettacolo
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Data</TableHead>
              <TableHead className="w-20">Ora</TableHead>
              <TableHead className="w-48">Film</TableHead>
              <TableHead className="w-32">Operatore</TableHead>
              <TableHead className="w-24">ID BOL</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-28">Stato</TableHead>
              <TableHead className="w-48 text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShows.map((show) => (
              <TableRow key={show.id}>
                <TableCell>{formatDate(show.datetime)}</TableCell>
                <TableCell>{formatTime(show.datetime)}</TableCell>
                <TableCell>{show.film_title}</TableCell>
                <TableCell>{show.operator_name || '-'}</TableCell>
                <TableCell>{show.bolId || '-'}</TableCell>
                <TableCell>{show.notes || '-'}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                      show.is_closed
                        ? 'bg-green-50 text-green-800 ring-green-600/20'
                        : show.report_id
                          ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                          : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                    )}
                  >
                    {show.is_closed ? "Chiusa" : 
                     show.report_id ? "Cassa aperta" : "Non aperta"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    asChild
                  >
                    <Link href={`/shows/${show.id}/edit`}>Modifica</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(show.id)}
                    disabled={!!show.report_id}
                  >
                    Elimina
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredShows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Nessuno spettacolo trovato
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}