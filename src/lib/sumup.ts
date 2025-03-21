// src/lib/sumup.ts
import { prisma } from '@/lib/db';

// Interfaccia per le transazioni SumUp
interface SumUpTransaction {
  id: string;
  transaction_code: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: string;
  payment_type: string;
}

/**
 * Servizio per interagire con l'API SumUp
 */
export class SumUpService {
  private static instance: SumUpService;
  private apiKey: string;
  private merchantCode: string;

  private constructor() {
    this.apiKey = process.env.SUMUP_API_KEY || '';
    this.merchantCode = process.env.SUMUP_MERCHANT_CODE || '';
  }

  /**
   * Ottiene l'istanza singleton del servizio
   */
  public static getInstance(): SumUpService {
    if (!SumUpService.instance) {
      SumUpService.instance = new SumUpService();
    }
    return SumUpService.instance;
  }

  /**
   * Verifica se il servizio è configurato correttamente
   */
  public isConfigured(): boolean {
    return !!this.apiKey && !!this.merchantCode;
  }

  /**
   * Recupera le transazioni SumUp per un periodo specifico
   */
  public async getTransactions(
    oldestTime?: Date,
    newestTime?: Date,
    limit = 500
  ): Promise<SumUpTransaction[]> {
    if (!this.isConfigured()) {
      throw new Error('SumUp non configurato. Verifica SUMUP_API_KEY e SUMUP_MERCHANT_CODE nelle variabili d\'ambiente.');
    }

    try {
      // Costruisci l'URL con i parametri
      let url = `https://api.sumup.com/v2.1/merchants/${this.merchantCode}/transactions/history`;
      
      // Aggiungi parametri opzionali
      const params = new URLSearchParams();
      
      if (oldestTime) {
        // Assicurati che la data sia in formato UTC (ISO con Z alla fine)
        params.append('oldest_time', oldestTime.toISOString().replace('Z', ''));
      }
      
      if (newestTime) {
        // Assicurati che la data sia in formato UTC (ISO con Z alla fine)
        params.append('newest_time', newestTime.toISOString().replace('Z', ''));
      }
      
      if (limit) {
        params.append('limit', limit.toString());
      }
      
      // Usa la notazione corretta per filtri array
      params.append('statuses[]', 'SUCCESSFUL');
      
      // Aggiungi i parametri all'URL
      url += `?${params.toString()}`;
      
      console.log(`Chiamata API SumUp: ${url}`);
      
      // Invia la richiesta
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Errore API SumUp: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      
      // Per debug: stampa le prime transazioni ricevute
      if (data.items && data.items.length > 0) {
        console.log(`Ricevute ${data.items.length} transazioni dall'API:`);
        data.items.slice(0, 3).forEach((tx: SumUpTransaction) => {
          console.log(`- ${tx.timestamp}: ${tx.amount}€ (${tx.transaction_code})`);
        });
      } else {
        console.log("Nessuna transazione ricevuta dall'API");
      }
      
      return data.items || [];
      
    } catch (error) {
      console.error('Errore nel recupero delle transazioni SumUp:', error);
      throw error;
    }
  }

  /**
   * Recupera e filtra le transazioni per uno specifico spettacolo
   * Usa una finestra temporale di 30 minuti prima e dopo l'inizio dello spettacolo
   */
  public async getTransactionsForShow(showId: number): Promise<{ transactions: SumUpTransaction[], total: number }> {
    try {
      // Recupera i dettagli dello spettacolo dal database
      const show = await prisma.show.findUnique({
        where: { id: showId }
      });
      
      if (!show) {
        throw new Error(`Spettacolo con ID ${showId} non trovato`);
      }
      
      // Ottieni il datetime dello spettacolo
      const showDateTime = new Date(show.datetime);
      
      // Calcola la finestra temporale esatta: 30 minuti prima e dopo l'inizio
      const startTime = new Date(showDateTime);
      startTime.setMinutes(startTime.getMinutes() - 30); // 30 minuti prima
      
      const endTime = new Date(showDateTime);
      endTime.setMinutes(endTime.getMinutes() + 30); // 30 minuti dopo
      
      // Log per debug in formato italiano
      const formatIT = (date: Date) => {
        return date.toLocaleString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      console.log(`Spettacolo ${showId} (${formatIT(showDateTime)})`);
      console.log(`Finestra temporale: ${formatIT(startTime)} - ${formatIT(endTime)}`);
      console.log(`Finestra temporale ISO: ${startTime.toISOString()} - ${endTime.toISOString()}`);
      
      // Recupera le transazioni per questa finestra temporale specifica
      // Assicurati che le date siano in formato UTC/ISO per l'API
      const transactions = await this.getTransactions(startTime, endTime);
      
      // Calcola il totale
      const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
      
      // Log delle transazioni trovate
      console.log(`Trovate ${transactions.length} transazioni per un totale di ${total}€`);
      transactions.forEach(tx => {
        // Converti il timestamp UTC di SumUp in data locale per il log
        const txDate = new Date(tx.timestamp);
        console.log(`- ${formatIT(txDate)}: ${tx.amount}€ (${tx.transaction_code})`);
      });
      
      return {
        transactions,
        total
      };
      
    } catch (error) {
      console.error(`Errore nel recupero delle transazioni per lo spettacolo ${showId}:`, error);
      throw error;
    }
  }
}

export const sumUpService = SumUpService.getInstance();