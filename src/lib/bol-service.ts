// src/lib/bol-service.ts
import { parse } from 'node-html-parser';
import 'server-only';
import fs from 'fs';
import path from 'path';

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
    
    // Calcola l'inizio e la fine del periodo (30 minuti prima e 45 dopo)
    const startTime = new Date(showDateTime);
    startTime.setMinutes(startTime.getMinutes() - 45);
    
    const endTime = new Date(showDateTime);
    endTime.setMinutes(endTime.getMinutes() + 60);
    
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

// ---------------------------------------------------------------------------
// POSTER LOCALE
// ---------------------------------------------------------------------------

/**
 * Scarica il poster da BOL e lo salva in /public/posters/[bolId].[ext].
 * Restituisce il path locale "/posters/[bolId].[ext]" oppure null in caso di errore.
 * Non riscaricare se il file locale esiste già.
 * Non lancia eccezioni.
 */
export async function downloadAndSavePoster(
  bolId: number,
  remoteUrl: string
): Promise<string | null> {
  try {
    const postersDir = path.join(process.cwd(), 'public', 'posters')
    await fs.promises.mkdir(postersDir, { recursive: true })

    const urlExt = remoteUrl.split('.').pop()?.split('?')[0]?.toLowerCase()
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt ?? '') ? urlExt : 'jpg'
    const filename = `${bolId}.${ext}`
    const localPath = path.join(postersDir, filename)
    const publicPath = `/posters/${filename}`

    if (fs.existsSync(localPath)) return publicPath

    const res = await fetch(remoteUrl)
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.promises.writeFile(localPath, buffer)
    return publicPath
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// IMPORT FILM DA BOL
// ---------------------------------------------------------------------------

/**
 * Dati di un film estratti da BOL
 */
export interface BolFilmData {
  bolId: number;
  title: string;
  duration?: number | null;
  cinetelId?: string | null;
  nationality?: string | null;
  producer?: string | null;
  distributor?: string | null;
  posterUrl?: string | null;
  myMoviesUrl?: string | null;
}

/**
 * Recupera la lista di tutti i film dal catalogo BOL (opere_principale.asp)
 */
export async function getBolFilmsList(): Promise<Pick<BolFilmData, 'bolId' | 'title'>[]> {
  const { baseUrl } = getBolConfig();
  const cookies = await loginBol();

  const response = await fetch(`${baseUrl}/opere_principale.asp`, {
    headers: { 'Cookie': cookies.join('; ') },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Impossibile recuperare la lista film da BOL (stato: ${response.status})`);
  }

  const html = await response.text();
  return parseBolFilmsListHtml(html);
}

/**
 * Recupera i dettagli di un singolo film da BOL (opera_crea.asp)
 */
export async function getBolFilmDetails(bolId: number): Promise<BolFilmData> {
  const { baseUrl } = getBolConfig();
  const theaterId = process.env.BOL_THEATER_ID || '3871';
  const cookies = await loginBol();

  const url = `${baseUrl}/opera_crea.asp?ID_Teatro=${theaterId}&ID=${bolId}&Op=Apri&Archiviati=0`;
  const response = await fetch(url, {
    headers: { 'Cookie': cookies.join('; ') },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Impossibile recuperare i dettagli del film ${bolId} da BOL (stato: ${response.status})`);
  }

  const html = await response.text();
  return parseBolFilmDetailsHtml(bolId, html);
}

/**
 * Analizza l'HTML di opere_principale.asp per estrarre la lista film.
 *
 * La pagina BOL tipicamente presenta una tabella con link del tipo:
 *   opera_crea.asp?ID_Teatro=3871&ID=285137&Op=Apri
 * Da cui estraiamo bolId e il testo del link come titolo.
 */
function parseBolFilmsListHtml(html: string): Pick<BolFilmData, 'bolId' | 'title'>[] {
  const root = parse(html);
  const films: Pick<BolFilmData, 'bolId' | 'title'>[] = [];
  const seen = new Set<number>();

  // Cerca tutti i link che puntano a opera_crea.asp con parametro ID=
  const links = root.querySelectorAll('a[href*="opera_crea.asp"]');
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const idMatch = href.match(/[?&]ID=(\d+)/i);
    if (!idMatch) continue;

    const bolId = parseInt(idMatch[1]);
    if (!bolId || seen.has(bolId)) continue;
    seen.add(bolId);

    const title = link.textContent.trim();
    if (!title) continue;

    films.push({ bolId, title });
  }

  return films;
}

/**
 * Analizza l'HTML di opera_crea.asp per estrarre i dettagli del film.
 * Usa i nomi esatti dei campi presenti nel form BOL.
 */
function parseBolFilmDetailsHtml(bolId: number, html: string): BolFilmData {
  const root = parse(html);

  const getInputValue = (name: string): string | null => {
    // Cerca prima per name, poi per id
    let el = root.querySelector(`input[name="${name}"], textarea[name="${name}"]`);
    if (!el) {
      el = root.querySelector(`input[id="${name}"], textarea[id="${name}"]`);
    }
    
    if (!el) return null;
    
    // Prova a ottenere il valore in diversi modi (per gestire readonly, disabled, ecc.)
    const value = el.getAttribute('value') || 
                  el.attrs?.value || 
                  el.textContent?.trim();
    
    return value?.trim() || null;
  };

  // Estrai i campi usando i nomi esatti del form BOL
  const title = getInputValue('Titolo') || '';
  const durationRaw = getInputValue('Durata');
  const duration = durationRaw ? parseInt(durationRaw) || null : null;
  const cinetelId = getInputValue('CodCinetelEffettivo') || null;
  const nationality = getInputValue('Naz') || null;
  const producer = getInputValue('Produttore') || null;
  const distributor = getInputValue('DistFilm') || null;

  // Poster: cerca un tag <img> con src che contenga "poster" o "locandina"
  const posterImg = root.querySelector('img[src*="poster"], img[src*="locandina"], img[src*="cover"]');
  const posterSrc = posterImg?.getAttribute('src') || null;
  let posterUrl: string | null = null;
  if (posterSrc) {
    const { baseUrl } = getBolConfig();
    posterUrl = posterSrc.startsWith('http') ? posterSrc : `${baseUrl}/${posterSrc.replace(/^\//, '')}`;
  }

  // Link MyMovies: cerca <a> con href che contenga "mymovies"
  const myMoviesLink = root.querySelector('a[href*="mymovies"]');
  const myMoviesUrl = myMoviesLink?.getAttribute('href') || null;

  return {
    bolId,
    title,
    duration,
    cinetelId,
    nationality,
    producer,
    distributor,
    posterUrl,
    myMoviesUrl,
  };
}

// ---------------------------------------------------------------------------
// IMPORT SHOWS DA BOL
// ---------------------------------------------------------------------------

/**
 * Dati di uno show estratti dalla pagina spett_principale.asp di BOL
 */
export interface BolShowData {
  bolId: number;
  filmBolId: number;   // ID Opera (link opera_crea.asp) per il matching con film.bolId
  filmTitle: string;
  date: string;        // formato DD/MM/YYYY
  time: string;        // formato HH.MM
}

/**
 * Recupera la lista degli spettacoli dalla pagina principale di BOL
 */
export async function getBolShowsList(): Promise<BolShowData[]> {
  const { baseUrl } = getBolConfig();
  const theaterId = process.env.BOL_THEATER_ID || '3871';
  const cookies = await loginBol();

  const response = await fetch(
    `${baseUrl}/spett_principale.asp?ID_Teatro=${theaterId}`,
    { headers: { 'Cookie': cookies.join('; ') }, cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error(`Impossibile recuperare gli shows da BOL (stato: ${response.status})`);
  }

  const html = await response.text();
  return parseBolShowsListHtml(html);
}

/**
 * Analizza l'HTML di spett_principale.asp per estrarre la lista degli spettacoli.
 *
 * Ogni riga ha la struttura:
 *   <td><a href="javascript:ApriGenerali(3871, 1337, 0)" title="Titolo Film">...</a></td>
 *   <td align="center">02/03/2026</td>
 *   <td align="center">20.30</td>
 *   <td><a href="/opera_crea.asp?ID_Teatro=3871&ID=285138&...">Opera</a></td>
 */
function parseBolShowsListHtml(html: string): BolShowData[] {
  const root = parse(html);
  const shows: BolShowData[] = [];
  const seen = new Set<number>();

  const links = root.querySelectorAll('a[href*="ApriGenerali"]');
  
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const idMatch = href.match(/ApriGenerali\(\d+,\s*(\d+)/);
    if (!idMatch) continue;

    const bolId = parseInt(idMatch[1]);
    if (!bolId || seen.has(bolId)) continue;
    seen.add(bolId);

    const filmTitle = link.getAttribute('title') || link.textContent.trim();

    const row = link.closest('tr');
    if (!row) continue;

    const cells = row.querySelectorAll('td');
    
    // Cerca la cella con la data (formato DD/MM/YYYY)
    let date = '';
    let time = '';
    
    for (let i = 0; i < cells.length; i++) {
      const text = cells[i].textContent.trim();
      // Cerca formato data DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        date = text;
        // L'ora è nella cella successiva
        if (i + 1 < cells.length) {
          time = cells[i + 1].textContent.trim();
        }
        break;
      }
    }
    
    if (!date || !time) continue;

    // Cerca il link opera_crea.asp in tutta la riga
    const operaLink = row.querySelector('a[href*="opera_crea.asp"]');
    if (!operaLink) continue;

    const operaHref = operaLink.getAttribute('href') || '';
    const operaIdMatch = operaHref.match(/[?&]ID=(\d+)/i);
    if (!operaIdMatch) continue;

    const filmBolId = parseInt(operaIdMatch[1]);

    shows.push({ bolId, filmBolId, filmTitle, date, time });
  }

  return shows;
}

// ---------------------------------------------------------------------------
// CARTELLONE BOL
// ---------------------------------------------------------------------------

/**
 * Riga del cartellone BOL estratta dalla pagina incassi.asp (raggruppamento per titolo ed evento)
 */
export interface BolCartelloneRow {
  datetime: Date;
  titolo: string;
  emessi: number;
  annullati: number;
  venduti: number;
  imponibile: number;
  iva: number;
  totale: number;
}

/**
 * Recupera i dati del cartellone BOL per un intervallo di date.
 * Chiama incassi.asp con raggruppamento "titolo ed evento" (IncPerTitoloSpett=1).
 * @param dataInizio - formato "DD/MM/YYYY"
 * @param dataFine   - formato "DD/MM/YYYY"
 */
export async function getBolCartellone(
  dataInizio: string,
  dataFine: string
): Promise<{ success: boolean; rows: BolCartelloneRow[]; error?: string }> {
  try {
    const cookies = await loginBol();
    const { baseUrl } = getBolConfig();

    const baseParams = {
      CF_Organizzatore: '*',
      ID_TeatroMulti: '*',
      HelperData: dataInizio,
      DataInizio: dataInizio,
      OraInizio: '00.00',
      DataFine: dataFine,
      OraFine: '23.59',
      ID_Spettacolo: '*',
      TxtDescOperatore: '(tutti gli operatori)',
      ID_PuntoVendita: '*',
      ID_Cassa: '*',
      TxtTitoloOpera: '(tutti i titoli)',
      CodTipoCanale: '*',
      ID_Rivenditore: '*',
      ID_Iniziativa: '0',
      IncProvBO: '1',
      IncProvVO: '1',
      IncProvPVGO: '1',
      IncProvPVCL: '1',
      IncSenzaIvaPreassolta: '1',
      IncConIvaPreassolta: '1',
      IncConIvaPreassoltaBa: '1',
      IncSenzaTessPrep: '1',
      IncConTessPrep: '1',
      UsaFormatoEsportabile: '1',
      postback: '1',
    };

    const incassiUrl = `${baseUrl}/servizio/incassi.asp`;
    const fetchOpts = (extra: Record<string, string>) => ({
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; '),
      },
      body: new URLSearchParams({ ...baseParams, ...extra }).toString(),
      cache: 'no-store' as const,
    });

    // BOL risponde in Windows-1252: decodificare manualmente per preservare
    // i caratteri accentati italiani (à, è, é, ì, ò, ù).
    const decode1252 = async (res: Response) => {
      const buf = await res.arrayBuffer();
      return new TextDecoder('windows-1252').decode(buf);
    };

    // Richiesta 1 — Biglietti (con UsaFormatoEsportabile: table inside <pre>)
    const respBiglietti = await fetch(incassiUrl, fetchOpts({ IncPerTitoloSpett: '1' }));
    if (!respBiglietti.ok) throw new Error(`Richiesta biglietti BOL fallita: ${respBiglietti.status}`);
    const htmlBiglietti = await decode1252(respBiglietti);
    const rowsBiglietti = parseCartelloneHtml(htmlBiglietti);

    // Richiesta 2 — Abbonamenti SENZA UsaFormatoEsportabile (incompatibile con IncPerDataAbb)
    const { UsaFormatoEsportabile: _fmtExport, ...baseParamsNoExport } = baseParams; // eslint-disable-line @typescript-eslint/no-unused-vars
    const fetchOptsAbb = (extra: Record<string, string>) => ({
      method: 'POST' as const,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; '),
      },
      body: new URLSearchParams({ ...baseParamsNoExport, ...extra }).toString(),
      cache: 'no-store' as const,
    });
    const respAbbonamenti = await fetch(incassiUrl, fetchOptsAbb({ IncPerDataAbb: '1' }));
    if (!respAbbonamenti.ok) throw new Error(`Richiesta abbonamenti BOL fallita: ${respAbbonamenti.status}`);
    const htmlAbbonamenti = await decode1252(respAbbonamenti);
    const rowsAbbonamenti = parseAbbonnamentiHtml(htmlAbbonamenti);

    // Unisce e ordina per datetime crescente
    const rows = [...rowsBiglietti, ...rowsAbbonamenti].sort(
      (a, b) => a.datetime.getTime() - b.datetime.getTime()
    );

    return { success: true, rows };
  } catch (error) {
    console.error('Errore durante il recupero del cartellone BOL:', error);
    return {
      success: false,
      rows: [],
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
    };
  }
}

/**
 * Analizza l'HTML della risposta di incassi.asp (formato esportabile, raggruppamento per titolo ed evento).
 * Cerca la <table> dentro il <pre> che segue il commento <!-- PER TITOLO ED EVENTO -->.
 * Ogni <tr> ha 9 <td>: titolo, data/ora, emessi, annullati, venduti, imponibile, iva, totale, prevendita.
 */
function parseCartelloneHtml(html: string): BolCartelloneRow[] {
  const rows: BolCartelloneRow[] = [];

  // Trova il blocco dopo <!-- PER TITOLO ED EVENTO -->
  const markerIndex = html.indexOf('<!-- PER TITOLO ED EVENTO -->');
  const searchHtml = markerIndex >= 0 ? html.slice(markerIndex) : html;

  const root = parse(searchHtml);

  // node-html-parser tratta il contenuto di <pre> come testo grezzo (non parsato).
  // Recuperiamo il raw innerHTML e lo ri-parsiamo come HTML separatamente.
  const pre = root.querySelector('pre');
  if (!pre) return rows;

  const tableRoot = parse(pre.innerHTML);
  const table = tableRoot.querySelector('table');
  if (!table) return rows;

  const trs = tableRoot.querySelectorAll('tr');
  for (const tr of trs) {
    const tds = tr.querySelectorAll('td');
    if (tds.length < 8) continue;

    const titolo = tds[0].textContent.trim();
    const dataOraRaw = tds[1].textContent.trim(); // "DD/MM/YYYY HH.MM"
    const emessiRaw = tds[2].textContent.trim();
    const annullatiRaw = tds[3].textContent.trim();
    const vendutoRaw = tds[4].textContent.trim();
    const imponibileRaw = tds[5].textContent.trim();
    const ivaRaw = tds[6].textContent.trim();
    const totaleRaw = tds[7].textContent.trim();

    // Salta righe intestazione o senza dati numerici
    if (!dataOraRaw || !/\d{2}\/\d{2}\/\d{4}/.test(dataOraRaw)) continue;

    // Converti "DD/MM/YYYY HH.MM" in Date
    const dateMatch = dataOraRaw.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})\.(\d{2})/);
    if (!dateMatch) continue;
    const [, dd, mm, yyyy, hh, min] = dateMatch;
    const datetime = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);

    const parseNum = (s: string) => parseFloat(s.replace(',', '.')) || 0;

    rows.push({
      datetime,
      titolo,
      emessi: parseNum(emessiRaw),
      annullati: parseNum(annullatiRaw),
      venduti: parseNum(vendutoRaw),
      imponibile: parseNum(imponibileRaw),
      iva: parseNum(ivaRaw),
      totale: parseNum(totaleRaw),
    });
  }

  return rows;
}

/**
 * Analizza il testo a larghezza fissa della sezione <!-- PER DATA (ABBONAMENTI) -->.
 * Il <pre> contiene righe nel formato:
 *   DD/MM/YYYY    emessi    annullati    venduti    imponibile    iva    totale    prevendita
 * Vengono incluse solo le righe che iniziano con una data DD/MM/YYYY.
 */
function parseAbbonnamentiHtml(html: string): BolCartelloneRow[] {
  const rows: BolCartelloneRow[] = [];

  // Ricerca flessibile del marker (tolera spazi variabili nel commento HTML)
  const markerMatch = html.search(/<!--\s*PER DATA \(ABBONAMENTI\)\s*-->/i);
  if (markerMatch < 0) return rows;

  const searchHtml = html.slice(markerMatch);
  const root = parse(searchHtml);

  const pre = root.querySelector('pre');
  if (!pre) return rows;

  // node-html-parser tratta il contenuto di <pre> come testo grezzo: i tag HTML
  // interni (<hr>, <span>) vengono restituiti come testo letterale.
  // 1) Recupera il raw content (può contenere "<hr>", "<span>..." come stringhe)
  // 2) Rimuove i tag HTML con una regex
  // 3) Normalizza \u00a0 e altri whitespace non-standard in spazi ordinari
  const rawText = pre.innerText || pre.textContent || '';
  const text = rawText
    .replace(/<[^>]+>/g, '')          // strip tag HTML rimasti come testo
    .replace(/[\u00a0\u200b\r\t]+/g, ' ');
  const lines = text.split('\n');

  const dateLineRe = /^(\d{2})\/(\d{2})\/(\d{4})\s+(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(dateLineRe);
    if (!match) continue;

    const [, dd, mm, yyyy, rest] = match;
    const datetime = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);

    // Filtra parti vuote dopo lo split (doppi spazi residui)
    const parts = rest.trim().split(/\s+/).filter(p => p.length > 0);
    // Attesi almeno 7 campi: emessi annullati venduti imponibile iva totale prevendita
    if (parts.length < 7) continue;

    const parseNum = (s: string) => parseFloat(s.replace(',', '.')) || 0;

    rows.push({
      datetime,
      titolo: 'Abbonamenti',
      emessi:      parseNum(parts[0]),
      annullati:   parseNum(parts[1]),
      venduti:     parseNum(parts[2]),
      imponibile:  parseNum(parts[3]),
      iva:         parseNum(parts[4]),
      totale:      parseNum(parts[5]),
      // parts[6] = prevendita → ignorato
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// INCASSI
// ---------------------------------------------------------------------------

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
                // totale non quadra, ma continuiamo comunque
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