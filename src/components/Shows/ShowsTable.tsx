// src/components/Shows/ShowsTable.tsx
"use client"
import { Clock, Check, AlertCircle, AlertTriangle, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Show } from '@/components/Dashboard/types';

interface ShowsTableProps {
  shows: Show[];
}

export default function ShowsTable({ shows }: ShowsTableProps) {
  const [search, setSearch] = useState('')

  if (!shows?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center text-gray-500 text-xs">
          Nessun evento programmato
        </div>
      </div>
    );
  }

  // Filtra gli show in base alla ricerca
  const filteredShows = shows.filter(show =>
    show.film_title?.toLowerCase().includes(search.toLowerCase())
  );

  // Raggruppa gli eventi per data
  const showsByDate = filteredShows.reduce<Record<string, Show[]>>((acc, show) => {
    const showDate = show.datetime;
    const dateString = new Date(showDate).toISOString().split('T')[0];
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(show);
    return acc;
  }, {});

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dayMonth = new Intl.DateTimeFormat('it-IT', { 
        day: 'numeric',
        month: 'long'
      }).format(date);
      const weekday = new Intl.DateTimeFormat('it-IT', { 
        weekday: 'long'
      }).format(date);
      return (
        <div className="py-0.5">
          <div>{dayMonth}</div>
          <div className="text-gray-400 text-[11px]">{weekday}</div>
        </div>
      );
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
      return dateString;
    }
  };

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

      <div className="border-2 bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b-2 border-red-500">
          <h2 className="text-base font-semibold">Programmazione</h2>
        </div>
        
        <div className="px-4">
          <table className="min-w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b-2 border-gray-500">
                <th className="py-2 pr-4 text-left font-medium w-32">Data</th>
                <th className="py-2 px-4 text-left font-medium w-20">Ora</th>
                <th className="py-2 px-4 text-left font-medium">Film</th>
                <th className="py-2 px-4 text-left font-medium w-36">Operatore</th>
                <th className="py-2 pl-4 text-right font-medium w-28">Cassa</th>
                <th className="py-2 pl-4 text-right font-medium w-28">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-400">
              {Object.entries(showsByDate).map(([date, dayShows]) => (
                dayShows.map((show, showIndex) => (
                  <tr key={show.id} className="hover:bg-gray-50">
                    {showIndex === 0 && (
                      <td className="pr-4 text-xs font-medium text-gray-500" rowSpan={dayShows.length}>
                        {formatDate(date)}
                      </td>
                    )}
                    <td className="py-1 px-4 text-xs whitespace-nowrap">
                      {new Date(show.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-1 px-4 text-xs whitespace-nowrap">
                      {show.film_title}
                    </td>
                    <td className="py-1 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {show.operator_name ? (
                        <>{show.operator_name}</>
                      ) : (
                        <span className="text-red-600">
                          <AlertTriangle className="inline h-3 w-3" />
                          &nbsp;Scoperto</span>
                      )}
                    </td>
                    <td className="py-1 pl-4 text-right whitespace-nowrap">
                      {show.is_closed ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-0.5" />
                          Chiusa
                        </span>
                      ) : show.report_id ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-0.5" />
                          Aperta
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <AlertCircle className="h-3 w-3 mr-0.5" />
                          Non Aperta
                        </span>
                      )}
                    </td>
                    <td className="py-1 pl-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        asChild
                      >
                        <Link href={`/shows/${show.id}/edit`}>Modifica</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}