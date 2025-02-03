// src/components/Home/LastHandledCard.tsx
import { CalendarDays } from 'lucide-react';  // Rimosso Euro che non usiamo
import { type LastHandledCardProps } from './types';

export default function LastHandledCard({ event }: LastHandledCardProps) {
  if (!event) {
    return null;
  }

  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const calculateTotal = () => {
    const cashIncome = Number(event.closing_total || 0);
    const posIncome = Number(event.pos_total || 0);
    const subscriptionIncome = Number(event.subscription_sold || 0);
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
            <h3 className="text-lg font-medium">{event.film_title}</h3>
            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(event.date).toLocaleDateString('it-IT')} {new Date(event.time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-gray-500">Incasso Biglietteria</div>
              <div className="text-lg font-medium">{formatCurrency(event.ticket_system_total)}</div>
            </div>
            {(event.pos_total ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Pagamenti POS</div>
                <div className="text-lg font-medium">{formatCurrency(event.pos_total)}</div>
              </div>
            )}
            {(event.subscription_sold ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Abbonamenti</div>
                <div className="text-lg font-medium">{formatCurrency(event.subscription_sold)}</div>
              </div>
            )}
            {(event.cash_handed_over ?? 0) > 0 && (
              <div>
                <div className="text-sm text-gray-500">Prelievo Contanti</div>
                <div className="text-lg font-medium">{formatCurrency(event.cash_handed_over)}</div>
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