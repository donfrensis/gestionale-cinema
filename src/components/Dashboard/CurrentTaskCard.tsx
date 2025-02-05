// src/components/Home/CurrentTaskCard.tsx

import { CalendarDays, AlertCircle, Clock } from 'lucide-react';
import { type Show } from './types';
import ManageCashButton from '@/components/Shows/ManageCashButton';

interface CurrentTaskCardProps {
  show?: Show | null;
}

export default function CurrentTaskCard({ show }: CurrentTaskCardProps) {
  if (!show) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Nessun evento da gestire al momento</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch(show.show_timing) {  // Dobbiamo aggiungere questo campo al tipo Show
      case 'current':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Clock className="h-3 w-3 mr-1" />
            In corso
          </span>
        );
      case 'next':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Prossimo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Evento da Gestire</h2>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-medium">{show.film_title}</h3>
              {getStatusBadge()}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {new Date(show.date).toLocaleDateString('it-IT')} {new Date(show.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {show.operator_name ? (
                <>Operatore: {show.operator_name}</>
              ) : (
                <span className="text-orange-600">Nessun operatore assegnato</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <ManageCashButton show={{
              ...show,
              is_manageable: true
            }} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}