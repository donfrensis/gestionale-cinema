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
  show_timing?: 'current' | 'next' | 'past';
  is_manageable?: boolean;
  // Campi cassa
  pos_total?: Decimal;
  subscription_sold?: Decimal;
  ticket_system_total?: Decimal;
};

export type ShowsTableProps = {
  shows: Show[];
};

export type CurrentTaskCardProps = {
  show?: Show | null;
};

export function calculateTotalFromCashJson(cashJson: JsonValue | undefined | null): Decimal {
  if (!cashJson) return new Decimal(0);
  const cash = JSON.parse(cashJson.toString()) as CashBreakdown;
  return new Decimal(
    cash['50'] * 50 +
    cash['20'] * 20 +
    cash['10'] * 10 +
    cash['5'] * 5 +
    cash['2'] * 2 +
    cash['1'] * 1 +
    cash['050'] * 0.5 +
    cash.other
  );
};