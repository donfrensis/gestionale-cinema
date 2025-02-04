//  src/components/Home/types.ts

export type Show = {
  id: number;
  date: string;
  time: string;
  film_title: string;
  operator_name?: string;
  is_closed: boolean;
  report_id?: number;
  show_timing?: 'current' | 'next' | 'past';  // Per il timing dell'evento
  is_manageable?: boolean;                     // Per ManageCashButton
  // Campi aggiuntivi per LastHandledCard
  closing_total?: number;
  pos_total?: number;
  subscription_sold?: number;
  cash_handed_over?: number;
  ticket_system_total?: number;
};

export type ShowsTableProps = {
  shows: Show[];
};

export type CurrentTaskCardProps = {
  show?: Show | null;
};

// Aggiungiamo il tipo per LastHandledCard
export type LastHandledCardProps = {
  show?: Show | null;
};