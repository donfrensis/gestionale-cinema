// src/components/Shows/BulkShowsForm.tsx

import React, { useEffect } from 'react'; // Aggiungi import di useEffect
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Film } from '@prisma/client';

// Schema per un singolo spettacolo
const showSchema = z.object({
  datetime: z.string().min(1, { message: 'Data e ora sono obbligatorie' }),
  filmId: z.number().int().positive({ message: 'Seleziona un film' }),
  bolId: z.number().int().optional().nullable(),
  notes: z.string().optional(),
});

// Schema per la creazione di più spettacoli
const bulkShowsSchema = z.object({
  shows: z.array(showSchema).min(1, { message: 'Aggiungi almeno uno spettacolo' }),
  sendNotification: z.boolean().default(true),
});

type BulkShowsFormValues = z.infer<typeof bulkShowsSchema>;

interface BulkShowsFormProps {
  films: Film[];
  onSubmit: (data: BulkShowsFormValues) => void;
  onCancel: () => void;
}

// Aggiungi questa funzione per generare la data e ora predefinita
function getDefaultDateTime() {
  const now = new Date();
  now.setHours(21, 15, 0, 0); // Imposta l'ora alle 21:15
  
  // Formatta la data in formato ISO (YYYY-MM-DDTHH:MM)
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + 'T' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}

export default function BulkShowsForm({ films, onSubmit, onCancel }: BulkShowsFormProps) {
  const { register, control, handleSubmit, formState: { errors }, setValue } = useForm<BulkShowsFormValues>({
    resolver: zodResolver(bulkShowsSchema),
    defaultValues: {
      shows: [{ datetime: getDefaultDateTime(), filmId: 0, bolId: null, notes: '' }],
      sendNotification: true,
    },
  });

  // Gestione dell'array di spettacoli
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'shows',
  });

  // Aggiunge un nuovo spettacolo vuoto
  const addShow = () => {
    append({ datetime: getDefaultDateTime(), filmId: 0, bolId: null, notes: '' });
  };

  // Nuovo useEffect per impostare automaticamente il film più recente
  useEffect(() => {
    // Se ci sono film disponibili, seleziona il primo (che sarà il più recente perché ordinato in BulkShowsFormModal)
    if (films.length > 0) {
      // Imposta il valore per tutti gli spettacoli attualmente nel form
      fields.forEach((_, index) => {
        setValue(`shows.${index}.filmId`, films[0].id);
      });
    }
  }, [films, fields, setValue]);

  // Gestisce l'invio del form
  const handleFormSubmit = async (values: BulkShowsFormValues) => {
    // Converte i valori numerici
    const formattedValues = {
      ...values,
      shows: values.shows.map(show => ({
        ...show,
        filmId: Number(show.filmId),
        bolId: show.bolId ? Number(show.bolId) : null,
      })),
    };

    try {
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Errore nell\'invio dei dati:', error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: 'Si è verificato un errore durante il salvataggio degli spettacoli.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
        <h3 className="text-lg font-medium mb-2">Creazione multipla di spettacoli</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Questo modulo ti permette di creare più spettacoli contemporaneamente. 
          Compila i dettagli per ogni spettacolo e usa il pulsante Aggiungi spettacolo per aggiungerne altri.
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded-md mb-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Spettacolo #{index + 1}</h4>
            {fields.length > 1 && (
              <Button 
                type="button" 
                variant="destructive" 
                size="sm" 
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span>Rimuovi</span>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Film */}
            <div className="space-y-2">
              <Label htmlFor={`shows.${index}.filmId`}>Film *</Label>
              <select
                {...register(`shows.${index}.filmId` as const, { valueAsNumber: true })}
                id={`shows.${index}.filmId`}
                className="w-full p-2 border rounded-md"
              >
                <option value={0}>Seleziona un film</option>
                {films.map((film) => (
                  <option key={film.id} value={film.id}>
                    {film.title}
                  </option>
                ))}
              </select>
              {errors.shows?.[index]?.filmId && (
                <p className="text-sm text-red-600">{errors.shows[index]?.filmId?.message}</p>
              )}
            </div>

            {/* Data e ora */}
            <div className="space-y-2">
              <Label htmlFor={`shows.${index}.datetime`}>Data e ora *</Label>
              <Input
                {...register(`shows.${index}.datetime` as const)}
                id={`shows.${index}.datetime`}
                type="datetime-local"
              />
              {errors.shows?.[index]?.datetime && (
                <p className="text-sm text-red-600">{errors.shows[index]?.datetime?.message}</p>
              )}
            </div>

            {/* BOL ID */}
            <div className="space-y-2">
              <Label htmlFor={`shows.${index}.bolId`}>ID BOL (opzionale)</Label>
              <Input
                {...register(`shows.${index}.bolId` as const, { valueAsNumber: true })}
                id={`shows.${index}.bolId`}
                type="number"
                placeholder="ID spettacolo BOL"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor={`shows.${index}.notes`}>Note (opzionale)</Label>
              <Textarea
                {...register(`shows.${index}.notes` as const)}
                id={`shows.${index}.notes`}
                placeholder="Note sullo spettacolo"
                rows={2}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Pulsante per aggiungere un nuovo spettacolo */}
      <Button 
        type="button" 
        variant="outline" 
        onClick={addShow}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        <span>Aggiungi spettacolo</span>
      </Button>

      {/* Opzione per notifica */}
      <div className="flex items-center space-x-2 border-t pt-4 mt-6">
        <Switch
          id="sendNotification"
          {...register('sendNotification')}
        />
        <Label htmlFor="sendNotification">
          Invia notifica agli operatori
        </Label>
      </div>

      {/* Pulsanti */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit">
          Crea {fields.length > 1 ? fields.length : ''} Spettacol{fields.length > 1 ? 'i' : 'o'}
        </Button>
      </div>
    </form>
  );
}