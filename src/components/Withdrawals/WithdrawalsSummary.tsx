//  src/components/Withdrawals/WithdrawalsSummary.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';

// Definizione degli interfacce per i tipi di dati
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

// Interfaccia per le props del componente
interface WithdrawalsSummaryProps {
  withdrawals: Withdrawal[];
  deposits: BankDeposit[];
}

const WithdrawalsSummary = ({ withdrawals, deposits }: WithdrawalsSummaryProps) => {
  // Stati per i totali
  const [totalWithdrawn, setTotalWithdrawn] = useState<number>(0);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  // Calcola i totali quando cambiano i dati
  useEffect(() => {
    // Calcola totale prelievi
    const withdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    setTotalWithdrawn(withdrawn);
    
    // Calcola totale versamenti
    const deposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
    setTotalDeposited(deposited);
    
    // Calcola importo in attesa di versamento
    const pending = withdrawals
      .filter(w => w.depositId === null)
      .reduce((sum, w) => sum + Number(w.amount), 0);
    setPendingAmount(pending);
  }, [withdrawals, deposits]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Totale Prelevato</span>
            <span className="text-2xl font-bold">€ {formatNumber(totalWithdrawn)}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Totale Versato</span>
            <span className="text-2xl font-bold">€ {formatNumber(totalDeposited)}</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className={pendingAmount > 0 ? "border-amber-300 bg-amber-50" : ""}>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Da Versare</span>
            <span className={`text-2xl font-bold ${pendingAmount > 0 ? "text-amber-600" : ""}`}>
              € {formatNumber(pendingAmount)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalsSummary;