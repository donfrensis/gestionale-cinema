// src/components/Films/FilmList.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { Plus, Pencil, Clock, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Film } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

type SortConfig = {
 key: keyof Film
 direction: 'asc' | 'desc'
}

export default function FilmList() {
 const [films, setFilms] = useState<Film[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [filterText, setFilterText] = useState('')
 const [sortConfig, setSortConfig] = useState<SortConfig>({
   key: 'createdAt',
   direction: 'desc'
 })
 const { toast } = useToast()

 useEffect(() => {
   const fetchFilms = async () => {
     try {
       const res = await fetch('/api/films')
       if (!res.ok) throw new Error('Errore nel caricamento dei film')
       const data = await res.json()
       setFilms(data)
     } catch (err) {
       console.error('Error fetching films:', err)
       setError('Errore nel caricamento dei film')
       toast({
         variant: "destructive",
         title: "Errore",
         description: "Impossibile caricare la lista dei film"
       })
     } finally {
       setLoading(false)
     }
   }

   fetchFilms()
 }, [toast])

 const handleSort = (key: keyof Film) => {
   setSortConfig(prevConfig => ({
     key,
     direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
   }))
 }

 const getSortIcon = (key: keyof Film) => {
   if (sortConfig.key === key) {
     return sortConfig.direction === 'asc' ? 
       <ArrowUp className="h-4 w-4" /> : 
       <ArrowDown className="h-4 w-4" />
   }
   return <ArrowUpDown className="h-4 w-4 opacity-30" />
 }

 const sortedFilms = [...films].sort((a, b) => {
   const aValue = a[sortConfig.key]
   const bValue = b[sortConfig.key]

   if (aValue === null) return 1
   if (bValue === null) return -1

   if (sortConfig.key === 'createdAt') {
     return sortConfig.direction === 'asc' ? 
       new Date(aValue).getTime() - new Date(bValue).getTime() :
       new Date(bValue).getTime() - new Date(aValue).getTime()
   }

   if (typeof aValue === 'number' && typeof bValue === 'number') {
     return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
   }

   const stringA = String(aValue).toLowerCase()
   const stringB = String(bValue).toLowerCase()
   return sortConfig.direction === 'asc' ? 
     stringA.localeCompare(stringB) : 
     stringB.localeCompare(stringA)
 })

 const filteredAndSortedFilms = sortedFilms.filter(film => 
   film.title.toLowerCase().includes(filterText.toLowerCase())
 )

 // Header della tabella cliccabile per l'ordinamento
 const SortableHeader = ({ label, sortKey }: { label: string, sortKey: keyof Film }) => (
   <th 
     scope="col" 
     className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
     onClick={() => handleSort(sortKey)}
   >
     <div className="flex items-center gap-1">
       {label}
       {getSortIcon(sortKey)}
     </div>
   </th>
 )

 if (loading) {
   return <div className="p-4">Caricamento film...</div>
 }

 if (error) {
   return <div className="p-4 text-red-600">Errore: {error}</div>
 }

 return (
  <div className="space-y-4">
    <div className="flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca film..."
          className="pl-8"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      <Button asChild>
        <Link href="/films/new">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Film
        </Link>
      </Button>
    </div>

     <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-gray-200">
         <thead className="bg-gray-50">
           <tr>
             <SortableHeader label="Titolo" sortKey="title" />
             <SortableHeader label="Durata" sortKey="duration" />
             <SortableHeader label="ID BOL" sortKey="bolId" />
             <SortableHeader label="ID Cinetel" sortKey="cinetelId" />
             <SortableHeader label="Data Inserimento" sortKey="createdAt" />
             <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
               Azioni
             </th>
           </tr>
         </thead>
         <tbody className="bg-white divide-y divide-gray-200">
           {filteredAndSortedFilms.map((film) => (
             <tr key={film.id} className="hover:bg-gray-50">
               <td className="px-6 py-4">
                 <div className="font-medium">{film.title}</div>
                 {film.description && (
                   <div className="text-sm text-gray-500">{film.description}</div>
                 )}
               </td>
               <td className="px-6 py-4 whitespace-nowrap">
                 {film.duration && (
                   <span className="inline-flex items-center gap-1">
                     <Clock className="h-4 w-4" />
                     {film.duration} min
                   </span>
                 )}
               </td>
               <td className="px-6 py-4 whitespace-nowrap">
                 {film.bolId}
               </td>
               <td className="px-6 py-4 whitespace-nowrap">
                 {film.cinetelId}
               </td>
               <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                 {new Date(film.createdAt).toLocaleDateString()}
               </td>
               <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-2"
                   asChild
                 >
                   <Link href={`/films/${film.id}/edit`}>
                     <Pencil className="h-4 w-4" />
                     Modifica
                   </Link>
                 </Button>
               </td>
             </tr>
           ))}
         </tbody>
       </table>
     </div>
     <Button 
      asChild
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg bg-blue-500 text-white hover:bg-blue-600"
    >
      <Link href="/films/new">
        <Plus className="h-6 w-6" />
        <span className="sr-only">Nuovo Film</span>
      </Link>
    </Button>
   </div>
 )
}