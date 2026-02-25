// src/lib/mymovies-scraper.ts
//
// Utility di scraping per MyMovies.it — SOLO lato server.
//
// ── SCOPERTA DELL'URL DI RICERCA ─────────────────────────────────────────────
// Verifica preliminare eseguita il 2025-02-24:
//   curl -s "https://www.mymovies.it/database/" | grep -i "action|method|form"
//     → nessun output: il form è gestito via JavaScript, non come GET classico.
//   curl -s -G "https://www.mymovies.it/database/" --data-urlencode "titolo=oppenheimer" | grep "film/20"
//     → solo link a /film/2024/, /film/2023/…  (pagine annuali, non risultati)
//   curl -s "https://www.mymovies.it/film/cerca/?q=oppenheimer" | grep "film/20"
//     → la pagina esiste ma restituisce un 404 HTML, i risultati reali
//       vengono caricati via XHR dal frontend Angular.
//
// Analizzando il JavaScript della pagina cerca/, si trova l'endpoint reale:
//   https://www.mymovies.it/ricerca/ricerca.php?limit=true&q=TITOLO
// che restituisce JSON con struttura { esito, risultati: { film: { elenco } } }.
// Ogni elemento elenco ha: titolo, url, descrizione ("ANNO - Regista"), bgcolor.
// Gli elementi con bgcolor="#d1d1d1" sono sponsorizzati e vengono scartati.
//
// ── STRUTTURA PAGINA FILM ────────────────────────────────────────────────────
// URL: https://www.mymovies.it/film/ANNO/SLUG/
// La pagina è HTML statico (no JS rendering necessario).
// Dati estratti da una <table> con righe <tr><td>label</td><td>valore</td></tr>:
//
//   Regista   → riga con testo "Regia di", valore è <a href="/persone/...">Nome</a>
//   Uscita IT → riga con testo "Uscita", valore ha due <a>:
//               es. "mercoledì 23"  e  "agosto 2023"
//   Genere    → riga con testo "Genere", testo libero con virgola finale
//               es. "Biografico, Drammatico, Storico,"
//
// ── AGGIORNAMENTO SELETTORI ──────────────────────────────────────────────────
// Se MyMovies cambia layout, aggiornare le costanti qui sotto:

/** URL base dell'API di ricerca (endpoint XHR scoperto analizzando il JS del sito) */
const SEARCH_API_URL = 'https://www.mymovies.it/ricerca/ricerca.php'

/** Pattern che identifica una pagina film valida (film/ANNO/SLUG/) */
const FILM_URL_PATTERN = /^https:\/\/www\.mymovies\.it\/film\/\d{4}\/[^/]+\/$/

/** Testo del label della riga "Regista" nella tabella dettagli */
const LABEL_REGIA = 'Regia di'

/** Testo del label della riga "Data uscita italiana" nella tabella dettagli */
const LABEL_USCITA = 'Uscita'

/** Testo del label della riga "Genere" nella tabella dettagli */
const LABEL_GENERE = 'Genere'

/** User-Agent da usare in tutte le fetch verso MyMovies */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ─────────────────────────────────────────────────────────────────────────────

import { parse as parseHtml } from 'node-html-parser'

export interface MyMoviesSearchResult {
  title: string
  year: string
  director: string
  url: string  // URL completo della pagina film, es. https://www.mymovies.it/film/2023/oppenheimer/
}

export interface MyMoviesDetail {
  director: string | null
  italianReleaseDate: Date | null
  genre: string | null
  myMoviesUrl: string
}

/** Mappa mese italiano → numero (1-based) */
const ITALIAN_MONTHS: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4,
  maggio: 5, giugno: 6, luglio: 7, agosto: 8,
  settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
}

/**
 * Converte una stringa di data italiana (es. "mercoledì 23 agosto 2023")
 * in un oggetto Date (mezzanotte UTC).
 * Restituisce null se il parsing fallisce.
 */
function parseItalianDate(raw: string): Date | null {
  // Cerca pattern: uno o più numeri, spazio, nome mese, spazio, anno a 4 cifre
  const match = raw.match(/(\d+)\s+([a-zà-ú]+)\s+(\d{4})/i)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthName = match[2].toLowerCase()
  const year = parseInt(match[3], 10)
  const month = ITALIAN_MONTHS[monthName]
  if (!month) return null
  // Date UTC per evitare shift di fuso orario
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Cerca film su MyMovies tramite l'API XHR.
 * Non lancia eccezioni: in caso di errore restituisce array vuoto.
 */
export async function searchMyMovies(title: string): Promise<MyMoviesSearchResult[]> {
  try {
    const url = `${SEARCH_API_URL}?limit=true&q=${encodeURIComponent(title)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      // next.js: non cachare le ricerche
      cache: 'no-store',
    })
    if (!res.ok) return []

    const json = await res.json() as {
      esito: string
      risultati?: {
        film?: {
          elenco?: Array<{
            titolo: string
            url: string
            descrizione: string
            bgcolor: string
          }>
        }
      }
    }

    if (json.esito !== 'SUCCESS') return []

    const elenco = json.risultati?.film?.elenco ?? []
    const results: MyMoviesSearchResult[] = []

    for (const item of elenco) {
      // Scarta elementi sponsorizzati (bgcolor grigio) e link non-film
      if (item.bgcolor === '#d1d1d1') continue
      if (!FILM_URL_PATTERN.test(item.url)) continue

      // descrizione ha formato "ANNO - Nome Regista"
      const [year = '', ...dirParts] = item.descrizione.split(' - ')
      const director = dirParts.join(' - ').trim()

      results.push({
        title: item.titolo,
        year: year.trim(),
        director,
        url: item.url,
      })
    }

    return results
  } catch {
    return []
  }
}

/**
 * Recupera regista e data uscita italiana dalla pagina film di MyMovies.
 * Non lancia eccezioni: i campi non trovati vengono restituiti come null.
 */
export async function fetchMyMoviesDetail(url: string): Promise<MyMoviesDetail> {
  // Normalizza URL: assicura che termini con /
  const normalizedUrl = url.endsWith('/') ? url : url + '/'

  const base: MyMoviesDetail = {
    director: null,
    italianReleaseDate: null,
    genre: null,
    myMoviesUrl: normalizedUrl,
  }

  try {
    const res = await fetch(normalizedUrl, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return base

    const html = await res.text()
    const root = parseHtml(html)

    // Cerca tutte le righe <tr> della tabella dettagli
    const rows = root.querySelectorAll('tr')

    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      if (cells.length < 2) continue
      const label = cells[0].text.trim()

      if (label === LABEL_REGIA && base.director === null) {
        // Possono esserci più registi: <a>Luc Dardenne</a>, <a>Jean-Pierre Dardenne</a>
        const links = cells[1].querySelectorAll('a')
        const names = links.map(a => a.text.trim()).filter(Boolean).join(', ')
        base.director = names || null
      }

      if (label === LABEL_USCITA && base.italianReleaseDate === null) {
        // Usa il testo completo della cella: "agosto 2023" può stare fuori dai tag <a>
        // es. HTML reale: <a>mercoledì 23</a> <a></a>agosto 2023
        const dateText = cells[1].text.trim()
        base.italianReleaseDate = parseItalianDate(dateText)
      }

      if (label === LABEL_GENERE && base.genre === null) {
        // MyMovies restituisce "Biografico, Drammatico, Storico," con virgola finale
        const raw = cells[1].text.trim()
        // Rimuove la virgola finale e normalizza gli spazi
        base.genre = raw.replace(/,\s*$/, '').trim() || null
      }
    }
  } catch {
    // Errore di rete o parsing: ritorna quello che abbiamo
  }

  return base
}
