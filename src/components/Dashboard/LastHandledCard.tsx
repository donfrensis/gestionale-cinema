// src/components/Home/LastHandledCard.tsx
import { CalendarDays } from 'lucide-react';  // Rimosso Euro che non usiamo
import { type LastHandledCardProps } from './types';
import { Decimal } from '@prisma/client/runtime/library';

export default function LastHandledCard({ show }: LastHandledCardProps) {
  if (!show) {
    return null;
  }

  const formatCurrency = (amount: number | Decimal |null | undefined) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const calculateTotal = () => {
    const cashIncome = Number(show.closing_total || 0);
    const posIncome = Number(show.pos_total || 0);
    const subscriptionIncome = Number(show.subscription_sold || 0);
    return cashIncome + posIncome + subscriptionIncome;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Ultimo Evento Gestito</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{show.film_title}</h3>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(show.date).toLocaleDateString('it-IT')} {new Date(show.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-500">Incasso Biglietteria</div>
              <div className="text-lg font-medium">{formatCurrency(show.ticket_system_total)}</div>
            </div>
            {(show.pos_total ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Pagamenti POS</div>
                <div className="text-lg font-medium">{formatCurrency(show.pos_total)}</div>
              </div>
            )}
            {(show.subscription_sold ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Abbonamenti</div>
                <div className="text-lg font-medium">{formatCurrency(show.subscription_sold)}</div>
              </div>
            )}
            {(show.cash_handed_over ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Prelievo Contanti</div>
                <div className="text-lg font-medium">{formatCurrency(show.cash_handed_over)}</div>
              </div>
            )}
            <div className="col-span-2 pt-4 border-t">
              <div className="text-sm text-gray-500">Totale Incasso</div>
              <div className="text-xl font-semibold">{formatCurrency(calculateTotal())}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}