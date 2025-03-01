// src/components/Cash/CashForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CashReport } from '@prisma/client';

type CashBreakdown = {
  "50": number;
  "20": number;
  "10": number;
  "5": number;
  "2": number;
  "1": number;
  "050": number;
  other: number;
};

const denominations = [
  { label: "50€", value: 50, field: "50" },
  { label: "20€", value: 20, field: "20" },
  { label: "10€", value: 10, field: "10" },
  { label: "5€", value: 5, field: "5" },
  { label: "2€", value: 2, field: "2" },
  { label: "1€", value: 1, field: "1" },
  { label: "0.50€", value: 0.5, field: "050" }
] as const;

interface CashFormProps {
  showId: number;
  type: 'opening' | 'closing';
  expectedOpeningTotal: number | null;
  currentReport: CashReport | null;
  onClose: () => void;
}

export function CashForm({ 
  showId, 
  type, 
  expectedOpeningTotal, 
  currentReport,
  onClose 
}: CashFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stato per i conteggi cassa
  const [cashData, setCashData] = useState<CashBreakdown>({
    "50": 0,
    "20": 0,
    "10": 0,
    "5": 0,
    "2": 0,
    "1": 0,
    "050": 0,
    other: 0
  });

  // Stato per i totali di chiusura
  const [closingData, setClosingData] = useState({
    ticketSystemTotal: 0,
    posTotal: 0,
    subscriptionTotal: 0
  });

  // Calcola il totale dalle denominazioni
  const calculateTotal = () => {
    return denominations.reduce((acc, { value, field }) => {
      return acc + (cashData[field] * value);
    }, Number(cashData.other));
  };

  // Gestisce il submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Verifica il totale all'apertura
    if (type === 'opening' && expectedOpeningTotal !== null) {
      const currentTotal = calculateTotal();
      if (Math.abs(currentTotal - expectedOpeningTotal) > 0.01) {
        setError(`Il fondo cassa (${currentTotal.toFixed(2)}€) non corrisponde al totale atteso (${expectedOpeningTotal.toFixed(2)}€)`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const endpoint = type === 'opening' 
        ? '/api/cash/open'
        : `/api/cash/close/${currentReport?.id}`;

      const response = await fetch(endpoint, {
        method: type === 'opening' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showId,
          cashData,
          ...(type === 'closing' && {
            ticketSystemTotal: closingData.ticketSystemTotal,
            posTotal: closingData.posTotal,
            subscriptionTotal: closingData.subscriptionTotal
          })
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      // Utilizziamo onClose invece di router.refresh + router.back
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore inaspettato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {type === 'opening' && expectedOpeningTotal !== null && (
        <div className="bg-gray-50 p-4 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Fondo Cassa Atteso</h4>
          <div>Totale atteso: {expectedOpeningTotal.toFixed(2)}€</div>
        </div>
      )}

      {/* Conteggio denominazioni */}
      <div className="space-y-4">
        <h3 className="font-medium">Conteggio Contanti</h3>
        {denominations.map(({ label, field, value }) => (
          <div key={field} className="flex items-center gap-4">
            <Label className="w-20">{label}</Label>
            <Input
              type="number"
              min="0"
              value={cashData[field] || ''}
              onChange={(e) => setCashData(prev => ({
                ...prev,
                [field]: e.target.value === '' ? 0 : parseInt(e.target.value)
              }))}
              className="w-24"
            />
            <div className="text-sm text-gray-500">
              {((cashData[field] || 0) * value).toFixed(2)}€
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <Label className="w-20">Altro (&lt;0.50€)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={cashData.other || ''}
            onChange={(e) => setCashData(prev => ({
              ...prev,
              other: e.target.value === '' ? 0 : parseFloat(e.target.value)
            }))}
            className="w-24"
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Totale:</span>
            <span className="text-lg">{calculateTotal().toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Campi aggiuntivi per chiusura */}
      {type === 'closing' && (
        <div className="space-y-4">
          <h3 className="font-medium">Totali e Verifiche</h3>
          
          <div className="space-y-2">
            <Label className="text-red-500">
              Totale da C1 Biglietteria (esclusi biglietti emessi da abbonamenti)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={closingData.ticketSystemTotal || ''}
              onChange={(e) => setClosingData(prev => ({
                ...prev,
                ticketSystemTotal: e.target.value === '' ? 0 : parseFloat(e.target.value)
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Incasso Bancomat</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={closingData.posTotal || ''}
              onChange={(e) => setClosingData(prev => ({
                ...prev,
                posTotal: e.target.value === '' ? 0 : parseFloat(e.target.value)
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Nuovi Abbonamenti</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={closingData.subscriptionTotal || ''}
              onChange={(e) => setClosingData(prev => ({
                ...prev,
                subscriptionTotal: e.target.value === '' ? 0 : parseFloat(e.target.value)
              }))}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex gap-2 items-center text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annulla
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="gap-2"
        >
          <Calculator className="w-4 h-4" />
          {type === 'opening' ? 'Registra Apertura' : 'Registra Chiusura'}
        </Button>
      </div>
    </form>
  );
}