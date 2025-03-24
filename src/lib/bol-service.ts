// src/lib/bol-service.ts
import { parse } from 'node-html-parser';
import 'server-only';

/**
 * Configurazione per l'integrazione BOL LiveTicket
 */
interface BolConfig {
  username: string;
  password: string;
  baseUrl: string;
}

/**
 * Dati di incasso estratti da BOL
 */
export interface BolTicketData {
  ticketTotal: number;       // Totale incasso biglietti
  subscriptionTotal: number; // Totale incasso abbonamenti
  totalAmount: number;       // Totale complessivo
  ticketCount: number;       // Numero biglietti venduti
  subscriptionCount: number; // Numero abbonamenti utilizzati
  success: boolean;          // Indica se l'operazione è riuscita
  error?: string;            // Messaggio di errore, se presente
}

// Memorizza i cookie di sessione per riutilizzarli
let sessionCookies: string[] | null = null;
let lastLoginTime: number = 0;
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minuti in millisecondi

/**
 * Ottiene la configurazione BOL dalle variabili d'ambiente
 */
function getBolConfig(): BolConfig {
  const username = process.env.BOL_USERNAME;
  const password = process.env.BOL_PASSWORD;
  const baseUrl = process.env.BOL_BASE_URL || 'http://bol.gostec.it';

  if (!username || !password) {
    throw new Error('Configurazione BOL incompleta. Definire BOL_USERNAME e BOL_PASSWORD nelle variabili d\'ambiente.');
  }

  return { username, password, baseUrl };
}

/**
 * Effettua il login a BOL e ottiene i cookie di sessione
 */
async function loginBol(): Promise<string[]> {
  const { username, password, baseUrl } = getBolConfig();
  
  // Se abbiamo già una sessione valida, la riutilizziamo
  const now = Date.now();
  if (sessionCookies && (now - lastLoginTime) < SESSION_TIMEOUT) {
    return sessionCookies;
  }

  console.log('Effettuando il login su BOL LiveTicket...');
  
  try {
    const response = await fetch(`${baseUrl}/autentica.asp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        user: username,
        pass: password,
        Op: 'Login',
        IdCassa: '10',
        InfoExtra: '10',
      }),
      redirect: 'manual', // Importante per catturare i cookie anche in caso di redirect
      cache: 'no-store',
    });

    // Estrai i cookie dalla risposta
    const cookies = response.headers.getSetCookie();
    if (!cookies || cookies.length === 0) {
      throw new Error('Nessun cookie ricevuto durante il login');
    }

    // Salva i cookie di sessione
    sessionCookies = cookies;
    lastLoginTime = now;
    
    console.log('Login su BOL riuscito');
    return cookies;
  } catch (error) {
    console.error('Errore durante il login su BOL:', error);
    throw new Error('Impossibile effettuare il login su BOL LiveTicket');
  }
}

/**
 * Formatta una data per BOL (DD/MM/YYYY)
 */
function formatBolDate(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Formatta un'ora per BOL (HH.MM)
 */
function formatBolTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Recupera i dati di incasso per uno spettacolo specifico
 * @param showDate - Data dello spettacolo (YYYY-MM-DD)
 * @param showTime - Ora dello spettacolo (HH:MM)
 * @param bolId - ID dello spettacolo su BOL (opzionale)
 */
export async function getBolTicketData(showDate: string, showTime: string): Promise<BolTicketData> {
  try {
    // Converti la data e l'ora in un oggetto Date
    const showDateTime = new Date(`${showDate}T${showTime}`);
    
    // Calcola l'inizio e la fine del periodo (30 minuti prima e dopo)
    const startTime = new Date(showDateTime);
    startTime.setMinutes(startTime.getMinutes() - 30);
    
    const endTime = new Date(showDateTime);
    endTime.setMinutes(endTime.getMinutes() + 30);
    
    // Formatta le date e le ore per BOL
    const bolDate = formatBolDate(showDateTime);
    const startTimeStr = formatBolTime(startTime);
    const endTimeStr = formatBolTime(endTime);
    
    // Effettua il login e ottieni i cookie
    const cookies = await loginBol();
    
    // Prepara i parametri per la richiesta
    const params = new URLSearchParams({
      CF_Organizzatore: '*',
      ID_TeatroMulti: '*',
      HelperData: bolDate,
      DataInizio: bolDate,
      OraInizio: startTimeStr,
      DataFine: bolDate,
      OraFine: endTimeStr,
      ID_Spettacolo: '*',
      TxtDescOperatore: '(tutti gli operatori)',
      ID_PuntoVendita: '*',
      ID_Cassa: '*',
      TxtTitoloOpera: '(tutti i titoli)',
      CodTipoCanale: 'OPBT', // Operatori biglietteria
      ID_Rivenditore: '*',
      ID_Iniziativa: '0',
      // Checkbox per i tipi di report
      IncPerUtenteTariffa: '1',      // operatore e tariffa (biglietti)
      IncPerCampagnaTariffaAbb: '1', // campagna e tariffa (abbonamenti)
      // Include operazioni di...
      IncProvBO: '1',                // botteghino
      IncProvVO: '1',                // vendita online
      IncProvPVGO: '1',              // LiveTicket point
      IncProvPVCL: '1',              // punti vendita
      // Limitazioni titoli accesso
      IncSenzaIvaPreassolta: '1',    // con IVA da assolvere
      IncSenzaTessPrep: '1',         // non legati a tessere prepagate
      TotaliBiglAbbTPP: '1',         // Somma i totali dei diversi prospetti
      postback: '1'
    });
    
    // Costruisci l'URL con la configurazione
    const { baseUrl } = getBolConfig();
    const incassiUrl = `${baseUrl}/servizio/incassi.asp`;
    
    // Effettua la richiesta POST
    const response = await fetch(incassiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; ')
      },
      body: params.toString(),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Richiesta fallita con stato: ${response.status}`);
    }

    const html = await response.text();
    
    // Analizza l'HTML della risposta per estrarre i dati di incasso
    return parseIncassiHtml(html);
  } catch (error) {
    console.error('Errore durante il recupero dei dati BOL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      ticketTotal: 0,
      subscriptionTotal: 0,
      totalAmount: 0,
      ticketCount: 0,
      subscriptionCount: 0
    };
  }
}

/**
 * Analizza l'HTML della pagina degli incassi di BOL per estrarre i dati di vendita
 */
function parseIncassiHtml(html: string): BolTicketData {
  try {
    const root = parse(html);
    
    // Valori predefiniti
    let ticketTotal = 0;
    let subscriptionTotal = 0;
    let ticketCount = 0;
    let subscriptionCount = 0;
    
    // Analizza la sezione dei totali complessivi (in fondo alla pagina)
    // Cerca le righe nella tabella dei totali complessivi
    const totalRows = root.querySelectorAll('pre');
    
    // Cerca i testi specifici che contengono le informazioni che ci servono
    for (const pre of totalRows) {
      const text = pre.textContent;
      
      // Cerca i totali per BIGLIETTI
      if (text.includes('BIGLIETTI') && text.includes('TOTALI COMPLESSIVI')) {
        // Estrai le righe della tabella
        const lines = text.split('\n');
        
        for (const line of lines) {
          // Cerca la riga dei BIGLIETTI
          if (line.trim().startsWith('BIGLIETTI')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 7) {
              // Formato: BIGLIETTI X X X IMPORTO IMPORTO TOTALE IMPORTO
              ticketCount = parseInt(parts[3]) || 0;
              ticketTotal = parseFloat(parts[6].replace(',', '.')) || 0;
            }
          }
          
          // Cerca la riga degli ABBONAMENTI
          else if (line.trim().startsWith('ABBONAMENTI')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 7) {
              // Formato: ABBONAMENTI X X X IMPORTO IMPORTO TOTALE IMPORTO
              subscriptionCount = parseInt(parts[3]) || 0;
              subscriptionTotal = parseFloat(parts[6].replace(',', '.')) || 0;
            }
          }
          
          // Cerca la riga dei TOTALI COMPLESSIVI
          else if (line.trim().startsWith('TOTALI COMPLESSIVI')) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 7) {
              // Questa è una verifica aggiuntiva, ma possiamo anche calcolare il totale
              const totalAmount = parseFloat(parts[6].replace(',', '.')) || 0;
              // Se abbiamo già i totali parziali, questo dovrebbe essere la somma
              if (Math.abs((ticketTotal + subscriptionTotal) - totalAmount) > 0.01) {
                console.warn('Il totale non corrisponde alla somma dei totali parziali');
              }
            }
          }
        }
      }
    }
    
    // Calcola il totale complessivo come somma dei subtotali
    const totalAmount = ticketTotal + subscriptionTotal;
    
    return {
      ticketTotal,
      subscriptionTotal,
      totalAmount,
      ticketCount,
      subscriptionCount,
      success: true
    };
  } catch (error) {
    console.error('Errore durante il parsing dei dati BOL:', error);
    return {
      success: false,
      error: 'Errore durante l\'analisi dei dati BOL',
      ticketTotal: 0,
      subscriptionTotal: 0,
      totalAmount: 0,
      ticketCount: 0,
      subscriptionCount: 0
    };
  }
}