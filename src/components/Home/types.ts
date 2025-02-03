//  src/components/Home/types.ts

export type ShowEvent = {
  id: number;
  date: string;
  time: string;
  film_title: string;
  operator_name?: string;
  is_closed: boolean;
  report_id?: number;
  event_timing?: 'current' | 'next' | 'past';  // Per il timing dell'evento
  is_manageable?: boolean;                     // Per ManageCashButton
  // Campi aggiuntivi per LastHandledCard
  closing_total?: number;
  pos_total?: number;
  subscription_sold?: number;
  cash_handed_over?: number;
  ticket_system_total?: number;
};

export type EventsTableProps = {
  events: ShowEvent[];
};

export type CurrentTaskCardProps = {
  event?: ShowEvent | null;
};

// Aggiungiamo il tipo per LastHandledCard
export type LastHandledCardProps = {
  event?: ShowEvent | null;
};