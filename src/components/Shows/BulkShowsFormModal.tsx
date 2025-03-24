// src/components/Shows/BulkShowsFormModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import BulkShowsForm from './BulkShowsForm';

// Definiamo interfacce per i tipi di dati
interface ShowFormData {
  datetime: string;
  filmId: number;
  bolId?: number | null;
  notes?: string;
}

interface BulkShowsFormValues {
  shows: ShowFormData[];
  sendNotification: boolean;
}

interface BulkShowsFormModalProps {
  title: string;
}

export default function BulkShowsFormModal({ title }: BulkShowsFormModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);

  // Carica i film appena il componente è montato
  useEffect(() => {
    const fetchFilms = async () => {
      try {
        const response = await fetch('/api/films');
        if (!response.ok) {
          throw new Error('Errore nel caricamento dei film');
        }
        const data = await response.json();
        // Ordina i film per createdAt in ordine decrescente (i più recenti prima)
        const sortedFilms = [...data].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      
        setFilms(sortedFilms);
      } catch (error) {
        console.error('Errore nel caricamento dei film:', error);
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: 'Impossibile caricare i film'
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchFilms();
  }, [toast]);

  // Gestisce la chiusura del modale
  const handleClose = () => {
    router.back();
  };

  // Gestisce la sottomissione del form con il tipo corretto
  const handleSubmit = async (data: BulkShowsFormValues) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione degli spettacoli');
      }

      const result = await response.json();
      
      toast({
        title: 'Spettacoli creati',
        description: `${result.shows.length} spettacoli creati con successo${
          result.notificationSent ? ' e notifica inviata' : ' senza inviare notifiche'
        }`,
      });

      // Chiudi il modale e aggiorna la pagina
      router.refresh();
      router.back();
    } catch (error) {
      console.error('Errore:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore sconosciuto',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4">Caricamento...</p>
          </div>
        ) : (
          <BulkShowsForm
            films={films}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}