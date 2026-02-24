// src/components/Shows/ShowListCard.tsx - con quadratura
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Pencil, Trash2, Euro, Check, AlertCircle, Plus, Search, ShieldCheck, ShieldX, ShieldAlert, CreditCard, Coins  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Show } from '@/components/Dashboard/types';
import BolImportShowsButton from './BolImportShowsButton';

interface ShowListCardProps {
  shows: Show[];
}

export default function ShowListCard({ shows }: ShowListCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo spettacolo?')) return;

    try {
      const res = await fetch(`/api/shows/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Errore durante l'eliminazione");
      }

      toast({
        title: 'Spettacolo eliminato',
        description: 'Lo spettacolo è stato eliminato con successo',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
        variant: 'destructive',
      });
    }
  };

  const filteredShows = shows.filter(show =>
    show.film_title.toLowerCase().includes(search.toLowerCase()) ||
    show.bolId?.toString().includes(search) ||
    show.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('it-IT'),
      time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      weekday: date.toLocaleDateString('it-IT', { weekday: 'long' })
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      // Forza la visualizzazione del separatore delle migliaia
      useGrouping: true
    }).format(amount || 0);
  };

  const getCashStatus = (show: Show) => {
    if (!show.report_id) {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Non Aperta
        </div>
      );
    }

    if (show.is_closed) {
      // Se lo show ha dati di quadratura
      if (show.balance_difference !== undefined) {
        const isBalanced = Math.abs(show.balance_difference) <= 0.01;
        
        return (
          <div className="flex gap-2">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              Chiusa
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
              {isBalanced ? (
                <span className="text-green-600 flex items-center">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Quadratura
                </span>
              ) : (
                <span className={`flex items-center ${show.balance_difference < 0 ? "text-red-600" : "text-orange-600"}`}>
                  {show.balance_difference < 0 ? 
                    <ShieldX className="h-3 w-3 mr-1" /> :
                    <ShieldAlert className="h-3 w-3 mr-1" />
                  }
                  Quadratura&nbsp;
                  {show.balance_difference > 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(show.balance_difference))}
                </span>
              )}
            </div>
          </div>
        );
      } else {
        // Senza dati di quadratura, mostra solo "Chiusa"
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Chiusa
          </div>
        );
      }
    }

    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Euro className="h-3 w-3 mr-1" />
        Aperta
      </div>
    );
  };
  
  // Ottieni le informazioni sugli incassi per uno show
  const getIncomeInfo = (show: Show) => {
    // Se non c'è report o non è chiuso, non mostriamo gli incassi
    if (!show.report_id || !show.is_closed) {
      return null;
    }
    
    const cashIncome = show.cash_difference || 0;
    const posIncome = show.pos_total || 0;
    // const ticketTotal = show.ticket_total || 0;
    // const subscriptionTotal = show.subscription_total || 0;
    const totalIncome = cashIncome + posIncome;
    
    return (
      <div className="flex items-center gap-3 mt-2">
        <span className="text-sm text-gray-500">Incasso:</span>
        {cashIncome > 0 && (
          <div className="inline-flex items-center text-sm">
            <Coins className="h-4 w-4 mr-1 text-green-600" />
            {formatCurrency(cashIncome)}
          </div>
        )}
        {posIncome > 0 && (
          <div className="inline-flex items-center text-sm">
            <CreditCard className="h-4 w-4 mr-1 text-blue-600" />
            {formatCurrency(posIncome)}
          </div>
        )}
        <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
          Totale: {formatCurrency(totalIncome)}
        </div>
      </div>
    );
  };

  if (!filteredShows.length) {
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
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/shows/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Spettacolo
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shows/bulk">
                <Plus className="h-4 w-4 mr-2" />
                Creazione Multipla
              </Link>
            </Button>
            <BolImportShowsButton />
          </div>
        </div>
        <div className="rounded-md border p-8 text-center text-gray-500">
          Nessuno spettacolo trovato
        </div>
      </div>
    );
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
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/shows/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Spettacolo
            </Link>
          </Button>
          <Button asChild variant="outline">
              <Link href="/shows/bulk">
                <Plus className="h-4 w-4 mr-2" />
                Creazione Multipla
              </Link>
            </Button>
          <BolImportShowsButton />
          </div>
      </div>

      <div className="rounded-md border">
        <div className="px-4 py-3 border-b border-red-500">
          <h2 className="text-base font-semibold">Programmazione</h2>
        </div>

        <div className="divide-y p-4">
          {filteredShows.map((show) => {
            const { date, time, weekday } = formatDateTime(show.datetime);
            
            return (
              <div 
                key={show.id} 
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium">{show.film_title}</h3>
                      {getCashStatus(show)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      {date} {time}
                      <span className="text-gray-400 ml-1">({weekday})</span>
                      {show.operator_name && (
                        <span className="ml-2 text-gray-500">
                          Operatore: {show.operator_name}
                        </span>
                      )}
                    </div>
                    {getIncomeInfo(show)}
                    {show.bolId && (
                      <div className="text-sm text-gray-500 mt-1">
                        ID BOL: {show.bolId}
                      </div>
                    )}
                    {show.notes && (
                      <div className="text-sm text-gray-500 mt-1">
                        Note: {show.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* Pulsante Modifica - solo per spettacoli senza cassa */}
                    {!show.report_id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link href={`/shows/${show.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifica
                        </Link>
                      </Button>
                    )}
                    
                    {/* Pulsante Gestisci/Visualizza Cassa */}
                    <Button 
                      size="sm"
                      onClick={() => router.push(`/shows/${show.id}/cash`)}
                      disabled={show.is_closed ? false : !show.is_manageable}
                      variant={!show.is_closed && show.is_manageable ? 'default' : 'secondary'}
                    >
                      <Euro className="h-4 w-4 mr-2" />
                      {show.is_closed 
                        ? 'Visualizza Cassa' 
                        : show.is_manageable 
                          ? 'Gestisci Cassa'
                          : 'In Attesa'
                      }
                    </Button>
                    
                    {/* Pulsante Elimina - solo per spettacoli senza cassa */}
                    {!show.report_id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(show.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}