// src/components/Cash/CashForm.tsx - con l'integrazione SumUp
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Tipo per le transazioni SumUp
interface SumUpTransaction {
  id: string;
  transaction_code: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
}

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
  const [activeTab, setActiveTab] = useState<string>("cash");

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

  // Stato per le transazioni SumUp
  const [sumupTransactions, setSumupTransactions] = useState<SumUpTransaction[]>([]);
  const [sumupTotal, setSumupTotal] = useState<number>(0);
  const [loadingSumup, setLoadingSumup] = useState<boolean>(false);
  const [sumupError, setSumupError] = useState<string | null>(null);
  const [sumupNotConfigured, setSumupNotConfigured] = useState<boolean>(false);

  // Calcola il totale dalle denominazioni
  const calculateTotal = () => {
    return denominations.reduce((acc, { value, field }) => {
      return acc + (cashData[field] * value);
    }, Number(cashData.other));
  };

  // Carica le transazioni SumUp
  const loadSumupTransactions = useCallback(async () => {
    if (type !== 'closing') return;
    
    setLoadingSumup(true);
    setSumupError(null);
    setSumupNotConfigured(false);
    
    try {
      const response = await fetch(`/api/sumup/${showId}`);
      
      if (!response.ok) {
        // Controlla se l'errore è dovuto alla mancata configurazione
        if (response.status === 503) {
          setSumupNotConfigured(true);
          const data = await response.json();
          throw new Error(data.error || 'SumUp non configurato');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel recupero delle transazioni');
      }
      
      const data = await response.json();
      setSumupTransactions(data.transactions);
      setSumupTotal(data.total);
      
      // Aggiorna automaticamente il campo posTotal con il totale di SumUp
      setClosingData(prev => ({
        ...prev,
        posTotal: data.total
      }));
      
    } catch (err) {
      console.error('Errore nel caricamento delle transazioni:', err);
      setSumupError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoadingSumup(false);
    }
  }, [showId, type]);

  // Formatta la data/ora della transazione
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Carica le transazioni SumUp all'avvio se è una chiusura
  useEffect(() => {
    if (type === 'closing') {
      loadSumupTransactions();
    }
  }, [type, loadSumupTransactions]);

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
        throw new Error(data.error || "Errore durante il salvataggio");
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

      {type === 'closing' ? (
        <Tabs defaultValue="cash" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="cash" className="flex-1">Contanti</TabsTrigger>
            <TabsTrigger value="pos" className="flex-1">SumUp POS</TabsTrigger>
            <TabsTrigger value="totals" className="flex-1">Totali</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cash">
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
          </TabsContent>
          
          <TabsContent value="pos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transazioni SumUp</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSumupTransactions} 
                  disabled={loadingSumup}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Aggiorna
                </Button>
              </CardHeader>
              <CardContent>
                {loadingSumup ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                    <span className="ml-2">Caricamento transazioni SumUp...</span>
                  </div>
                ) : sumupError ? (
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700">
                    <h3 className="font-bold">Errore</h3>
                    <p>{sumupError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadSumupTransactions}
                      className="mt-4"
                    >
                      Riprova
                    </Button>
                  </div>
                ) : sumupNotConfigured ? (
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 text-yellow-700">
                    <h3 className="font-bold">SumUp non configurato</h3>
                    <p className="mb-2">La integrazione con SumUp non è configurata correttamente.</p>
                    <p>Per configurare SumUp, è necessario aggiungere le seguenti variabili ambiente:</p>
                    <ul className="list-disc pl-5 mt-2">
                      <li>SUMUP_API_KEY - La chiave API di SumUp</li>
                      <li>SUMUP_MERCHANT_CODE - Il codice merchant del tuo account SumUp</li>
                    </ul>
                  </div>
                ) : sumupTransactions.length === 0 ? (
                  <div className="text-center p-4">
                    <p>Nessuna transazione SumUp trovata per questo spettacolo</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-2 text-left">Codice</th>
                            <th className="px-4 py-2 text-left">Data/Ora</th>
                            <th className="px-4 py-2 text-right">Importo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sumupTransactions.map((tx) => (
                            <tr key={tx.id} className="border-b">
                              <td className="px-4 py-2 font-mono text-sm">{tx.transaction_code}</td>
                              <td className="px-4 py-2 text-sm">{formatTransactionDate(tx.timestamp)}</td>
                              <td className="px-4 py-2 text-right">{tx.amount.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="font-medium">Totale incasso POS:</span>
                      <span className="text-lg font-bold">{sumupTotal.toFixed(2)}€</span>
                    </div>
                    <div className="mt-4">
                      <Label className="block mb-2">
                        Totale POS (auto-compilato da SumUp)
                      </Label>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="totals">
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
          </TabsContent>
        </Tabs>
      ) : (
        /* Conteggio denominazioni per apertura cassa */
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