'use client';

// src/components/Withdrawals/WithdrawalsDeposits.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose  
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  ClockIcon, 
  CheckIcon, 
  SearchIcon 
} from 'lucide-react';
import WithdrawalsSummary from './WithdrawalsSummary';
import { formatNumber } from '@/lib/utils';

// Tipi
interface Withdrawal {
  id: number;
  amount: number;
  adminId: number;
  admin: {
    username: string;
  };
  depositId: number | null;
  notes: string | null;
  createdAt: string;
}

interface BankDeposit {
  id: number;
  amount: number;
  date: string;
  reference: string | null;
  adminId: number;
  admin: {
    username: string;
  };
  withdrawals: Withdrawal[];
  notes: string | null;
  createdAt: string;
}

export default function WithdrawalsDeposits() {
  // Stati
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<BankDeposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<number[]>([]);
  
  // Form prelievo
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  
  // Form versamento
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [depositReference, setDepositReference] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  
  // Filtri di ricerca
  const [withdrawalSearch, setWithdrawalSearch] = useState('');
  const [depositSearch, setDepositSearch] = useState('');

  // Caricamento dati
  useEffect(() => {
    loadData();
  }, []);

  // Funzione di caricamento dati
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carica prelievi
      const withdrawalsRes = await fetch('/api/withdrawals');
      if (!withdrawalsRes.ok) throw new Error('Errore nel caricamento dei prelievi');
      const withdrawalsData = await withdrawalsRes.json();
      setWithdrawals(withdrawalsData);
      
      // Identifica prelievi in attesa di versamento
      const pending = withdrawalsData.filter((w: Withdrawal) => w.depositId === null);
      setPendingWithdrawals(pending);
      
      // Carica versamenti
      const depositsRes = await fetch('/api/deposits');
      if (!depositsRes.ok) throw new Error('Errore nel caricamento dei versamenti');
      const depositsData = await depositsRes.json();
      console.log("Deposits ricevuti:", depositsData); // DEBUG
      setDeposits(depositsData);
      
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare i dati. Riprova più tardi."
      });
    } finally {
      setLoading(false);
    }
  };

  // Gestione nuovo prelievo
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci un importo valido maggiore di zero"
      });
      return;
    }
    
    try {
      setSubmittingWithdrawal(true);
      
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(withdrawalAmount),
          notes: withdrawalNotes
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il salvataggio');
      }
      
      toast({
        title: "Successo",
        description: "Prelievo registrato con successo"
      });
      
      // Reset form e ricaricamento dati
      setWithdrawalAmount('');
      setWithdrawalNotes('');
      loadData();
      
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il salvataggio"
      });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Toggle selezione prelievo
  const toggleWithdrawalSelection = (id: number) => {
    setSelectedWithdrawals(prev => 
      prev.includes(id) 
        ? prev.filter(wId => wId !== id)
        : [...prev, id]
    );
  };

  // Calcola totale prelievi selezionati
  const calculateSelectedTotal = useCallback(() => {
    return pendingWithdrawals
      .filter(w => selectedWithdrawals.includes(w.id))
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [pendingWithdrawals, selectedWithdrawals]); // Aggiunto array delle dipendenze
  

  // Aggiorna importo versamento in base alla selezione
  useEffect(() => {
    const total = calculateSelectedTotal();
    setDepositAmount(total.toString());
  }, [calculateSelectedTotal, selectedWithdrawals]);

  // Gestione nuovo versamento
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedWithdrawals.length === 0) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Seleziona almeno un prelievo da versare"
      });
      return;
    }
    
    if (!depositAmount || Number(depositAmount) <= 0) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci un importo valido maggiore di zero"
      });
      return;
    }
    
    if (!depositDate) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Inserisci una data valida"
      });
      return;
    }
    
    try {
      setSubmittingDeposit(true);
      
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(depositAmount),
          date: depositDate,
          reference: depositReference,
          notes: depositNotes,
          withdrawalIds: selectedWithdrawals
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante il salvataggio');
      }
      
      toast({
        title: "Successo",
        description: "Versamento registrato con successo"
      });
      
      // Reset form e ricaricamento dati
      setDepositAmount('');
      setDepositDate(new Date().toISOString().split('T')[0]);
      setDepositReference('');
      setDepositNotes('');
      setSelectedWithdrawals([]);
      loadData();
      
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il salvataggio"
      });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Filtro prelievi
  const filteredWithdrawals = withdrawals.filter(w => {
    const searchTerm = withdrawalSearch.toLowerCase();
    return (
      w.amount.toString().includes(searchTerm) ||
      w.admin.username.toLowerCase().includes(searchTerm) ||
      (w.notes && w.notes.toLowerCase().includes(searchTerm)) ||
      new Date(w.createdAt).toLocaleDateString().includes(searchTerm)
    );
  });
  
  // Filtro versamenti
  const filteredDeposits = deposits.filter(d => {
    const searchTerm = depositSearch.toLowerCase();
    return (
      d.amount.toString().includes(searchTerm) ||
      d.admin.username.toLowerCase().includes(searchTerm) ||
      (d.reference && d.reference.toLowerCase().includes(searchTerm)) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm)) ||
      new Date(d.date).toLocaleDateString().includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Componente di riepilogo */}
      <WithdrawalsSummary withdrawals={withdrawals} deposits={deposits} />
      {/* Tabs principali */}
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdrawals">Prelievi</TabsTrigger>
          <TabsTrigger value="deposits">Versamenti</TabsTrigger>
        </TabsList>
        
        {/* Tab Prelievi */}
        <TabsContent value="withdrawals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Prelievi dalla Cassa</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  Nuovo Prelievo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registra Nuovo Prelievo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Importo (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Note</Label>
                    <Textarea
                      id="notes"
                      value={withdrawalNotes}
                      onChange={(e) => setWithdrawalNotes(e.target.value)}
                      placeholder="Note opzionali..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Annulla</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={submittingWithdrawal || !withdrawalAmount}
                    >
                      {submittingWithdrawal ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2" />
                      ) : null}
                      Registra Prelievo
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filtro prelievi */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca prelievi..."
              value={withdrawalSearch}
              onChange={(e) => setWithdrawalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Lista prelievi */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Amministratore</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.length > 0 ? (
                    filteredWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          € {formatNumber(withdrawal.amount)}
                        </TableCell>
                        <TableCell>{withdrawal.admin.username}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {withdrawal.notes || '-'}
                        </TableCell>
                        <TableCell>
                          {withdrawal.depositId ? (
                            <div className="flex items-center text-green-600">
                              <CheckIcon className="h-4 w-4 mr-1" />
                              <span>Versato</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-amber-600">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>Da versare</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {withdrawalSearch ? 'Nessun prelievo trovato' : 'Nessun prelievo registrato'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Versamenti */}
        <TabsContent value="deposits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Versamenti in Banca</h2>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  Nuovo Versamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Registra Nuovo Versamento</DialogTitle>
                </DialogHeader>
                
                {pendingWithdrawals.length === 0 ? (
                  <div className="py-4 text-center">
                    <p>Non ci sono prelievi in attesa di versamento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Colonna sinistra: selezione prelievi */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Prelievi da versare</h3>
                      <div className="bg-gray-50 rounded-md p-2 max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Importo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingWithdrawals.map((withdrawal) => (
                              <TableRow key={withdrawal.id} className="cursor-pointer hover:bg-gray-100" onClick={() => toggleWithdrawalSelection(withdrawal.id)}>
                                <TableCell className="p-2">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedWithdrawals.includes(withdrawal.id)}
                                    onChange={() => toggleWithdrawalSelection(withdrawal.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="p-2 text-sm">
                                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="p-2 text-sm font-medium">
                                  € {formatNumber(withdrawal.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-sm font-medium">
                          Totale selezionato: €{calculateSelectedTotal()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Colonna destra: form versamento */}
                    <div>
                      <form onSubmit={handleDepositSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="depositAmount">Importo Versamento (€)</Label>
                          <Input
                            id="depositAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            className="text-right"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="depositDate">Data Versamento</Label>
                          <Input
                            id="depositDate"
                            type="date"
                            value={depositDate}
                            onChange={(e) => setDepositDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="depositReference">Riferimento Operazione</Label>
                          <Input
                            id="depositReference"
                            value={depositReference}
                            onChange={(e) => setDepositReference(e.target.value)}
                            placeholder="Numero operazione bancaria..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="depositNotes">Note</Label>
                          <Textarea
                            id="depositNotes"
                            value={depositNotes}
                            onChange={(e) => setDepositNotes(e.target.value)}
                            placeholder="Note opzionali..."
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Annulla</Button>
                          </DialogClose>
                          <Button 
                            type="submit" 
                            disabled={
                              submittingDeposit || 
                              selectedWithdrawals.length === 0 || 
                              !depositAmount || 
                              !depositDate
                            }
                          >
                            {submittingDeposit ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2" />
                            ) : null}
                            Registra Versamento
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Filtro versamenti */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca versamenti..."
              value={depositSearch}
              onChange={(e) => setDepositSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Lista versamenti */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Riferimento</TableHead>
                    <TableHead>Amministratore</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeposits.length > 0 ? (
                    filteredDeposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell>
                          {new Date(deposit.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          € {formatNumber(deposit.amount)}
                        </TableCell>
                        <TableCell>
                          {deposit.reference || '-'}
                        </TableCell>
                        <TableCell>{deposit.admin.username}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {deposit.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {depositSearch ? 'Nessun versamento trovato' : 'Nessun versamento registrato'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}