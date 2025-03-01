//  src/components/Dashboard/types.ts
import { Decimal } from '@prisma/client/runtime/library';
import { JsonValue } from '@prisma/client/runtime/library';

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

export type Show = {
  id: number;
  datetime: string;
  film_title: string;
  operator_name?: string;
  is_closed: boolean;
  report_id?: number;
  bolId?: number | null;
  notes?: string | null;
  show_timing?: 'current' | 'next' | 'past';
  is_manageable?: boolean;
  // Campi relativi alla cassa e alla quadratura
  cash_difference?: number;    // Differenza tra contanti chiusura e apertura
  pos_total?: number;          // Totale incassato con POS
  ticket_total?: number;       // Totale incassato da biglietteria
  subscription_total?: number; // Totale incassato da abbonamenti
  balance_difference?: number; // Differenza di quadratura
};

export type ShowsTableProps = {
  shows: Show[];
};

export type CurrentTaskCardProps = {
  show?: Show | null;
};

export function calculateTotalFromCashJson(cashJson: JsonValue | undefined | null): Decimal {
  if (!cashJson) return new Decimal(0);
  
  try {
    // Se è già un oggetto, usalo direttamente
    const cash = typeof cashJson === 'string' 
      ? JSON.parse(cashJson) as CashBreakdown
      : cashJson as unknown as CashBreakdown;
    
    // Verifica che sia un oggetto valido
    if (typeof cash !== 'object' || cash === null) {
      console.error("Invalid cash object:", cash);
      return new Decimal(0);
    }
    
    return new Decimal(
      (Number(cash['50'] || 0) * 50) +
      (Number(cash['20'] || 0) * 20) +
      (Number(cash['10'] || 0) * 10) +
      (Number(cash['5'] || 0) * 5) +
      (Number(cash['2'] || 0) * 2) +
      (Number(cash['1'] || 0) * 1) +
      (Number(cash['050'] || 0) * 0.5) +
      Number(cash.other || 0)
    );
  } catch (error) {
    console.error("Error parsing cash JSON:", error, cashJson);
    return new Decimal(0);
  }
};