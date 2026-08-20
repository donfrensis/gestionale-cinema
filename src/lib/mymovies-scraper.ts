// src/lib/mymovies-scraper.ts
//
// Utility di scraping per MyMovies.it — SOLO lato server.
//
// ── AGGIORNAMENTO 2025 ───────────────────────────────────────────────────────
// L'endpoint XHR originale (/ricerca/ricerca.php?limit=true&q=TITOLO) non è
// più disponibile (risponde 400). MyMovies ha migrato la ricerca su una pagina
// HTML server-side accessibile via GET:
//
//   https://www.mymovies.it/ricerca/avanzata/?titolo=TITOLO&ordina_per=rank&ordina_dir=desc
//
// Struttura della pagina risultati:
//   - Tutti i film sono in una singola colonna (.mm-col), elencati come div fratelli
//   - Ogni film ha un div "ancora" con id="poster-div-N" (il poster)
//   - Il div con titolo e testo è il fratello successivo con classe "mm-white mm-padding-8"
//   - I risultati sono ordinati per rank MyMovies (non per similarità al titolo cercato)
//     → lo script ri-ordina i risultati mettendo prima i match più simili al titolo
//
// ── STRUTTURA PAGINA FILM ────────────────────────────────────────────────────
// URL: https://www.mymovies.it/film/ANNO/SLUG/
// Invariata: dati estratti da <table> con righe <tr><td>label</td><td>valore</td></tr>.
//
// ── AGGIORNAMENTO SELETTORI ──────────────────────────────────────────────────
// Se MyMovies cambia layout, aggiornare le costanti qui sotto:

/** URL base della pagina di ricerca avanzata */
const SEARCH_BASE_URL = 'https://www.mymovies.it/ricerca/avanzata/'

/** Pattern che identifica una pagina film valida (film/ANNO/SLUG/) */
const FILM_URL_PATTERN = /^https:\/\/www\.mymovies\.it\/film\/\d{4}\/[^/]+\/$/

/** Classe CSS del div fratello del poster che contiene titolo e testo del film */

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
  url: string
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

function parseItalianDate(raw: string): Date | null {
  const match = raw.match(/(\d+)\s+([a-zà-ú]+)\s+(\d{4})/i)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const monthName = match[2].toLowerCase()
  const year = parseInt(match[3], 10)
  const month = ITALIAN_MONTHS[monthName]
  if (!month) return null
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Calcola un punteggio di similarità tra titolo risultato e query di ricerca.
 * Punteggio più alto = più rilevante. Usato per ri-ordinare i risultati MyMovies
 * che di default sono ordinati per rank del sito, non per somiglianza al titolo.
 *
 * Priorità (dal più alto al più basso):
 *   3 — titolo esattamente uguale alla query (case-insensitive)
 *   2 — titolo inizia con la query
 *   1 — la query è contenuta all'inizio del titolo dopo articoli ("il", "la", "l'", "the", "der", "le")
 *   0 — match parziale generico
 */
function titleSimilarityScore(title: string, query: string): number {
  const t = title.toLowerCase().trim()
  const q = query.toLowerCase().trim()
  if (t === q) return 3
  if (t.startsWith(q)) return 2
  // rimuovi articolo iniziale dal titolo e confronta
  const withoutArticle = t.replace(/^(il|la|lo|gli|le|l'|i|un|una|the|der|le|les)\s+/i, '')
  if (withoutArticle.startsWith(q)) return 1
  return 0
}

/**
 * Cerca film su MyMovies tramite la pagina di ricerca avanzata (HTML).
 * I risultati vengono ri-ordinati per somiglianza al titolo cercato.
 * Non lancia eccezioni: in caso di errore restituisce array vuoto.
 */
export async function searchMyMovies(title: string): Promise<MyMoviesSearchResult[]> {
  try {
    const params = new URLSearchParams({
      titolo: title,
      ordina_per: 'rank',
      ordina_dir: 'desc',
    })
    const url = `${SEARCH_BASE_URL}?${params.toString()}`

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    })
    if (!res.ok) return []

    const html = await res.text()
    const root = parseHtml(html)
    const results: MyMoviesSearchResult[] = []
    const seen = new Set<string>()

    // I film sono in una lista piatta di div fratelli.
    // Ogni film ha un div ancora con id="poster-div-N".
    // Il div con titolo e testo è il fratello successivo con classe INFO_DIV_CLASS.
    const posterDivs = root.querySelectorAll('[id^="poster-div-"]')

    for (const posterDiv of posterDivs) {
      // URL del film: dal link immagine nel poster
      const posterLink = posterDiv.querySelector('a[href*="/film/"]')
      const filmUrl = posterLink?.getAttribute('href') ?? ''
      if (!FILM_URL_PATTERN.test(filmUrl) || seen.has(filmUrl)) continue
      seen.add(filmUrl)

      const yearMatch = filmUrl.match(/\/film\/(\d{4})\//)
      const year = yearMatch?.[1] ?? ''

      // Trova il div fratello con il testo del film (titolo, regista, ecc.)
      let infoNode = posterDiv.nextElementSibling
      for (let i = 0; i < 5; i++) {
        if (!infoNode) break
        const cls = infoNode.classNames ?? infoNode.getAttribute?.('class') ?? ''
        if (cls.includes('mm-white') && cls.includes('mm-padding-8')) break
        infoNode = infoNode.nextElementSibling
      }

      const titleLink = infoNode?.querySelector(`a[href="${filmUrl}"]`)
                     ?? infoNode?.querySelector('a[href*="/film/"]')
      const titleRaw = titleLink?.text.trim() ?? ''
      // MyMovies mostra i titoli in MAIUSCOLO nella lista
      const titleText = titleRaw.length > 0
        ? titleRaw.charAt(0).toUpperCase() + titleRaw.slice(1).toLowerCase()
        : ''

      const blockText = infoNode?.text ?? ''
      const dirMatch = blockText.match(/Un film di ([^.]+)\./i)
      const director = dirMatch?.[1]?.trim() ?? ''

      if (titleText && filmUrl) {
        results.push({ title: titleText, year, director, url: filmUrl })
      }
    }

    // Ri-ordina: match esatti prima, poi parziali, mantenendo rank MyMovies come tiebreaker
    results.sort((a, b) =>
      titleSimilarityScore(b.title, title) - titleSimilarityScore(a.title, title)
    )

    return results
  } catch {
    return []
  }
}

/**
 * Recupera regista, data uscita italiana e genere dalla pagina film di MyMovies.
 * Non lancia eccezioni: i campi non trovati vengono restituiti come null.
 */
export async function fetchMyMoviesDetail(url: string): Promise<MyMoviesDetail> {
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

    const rows = root.querySelectorAll('tr')

    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      if (cells.length < 2) continue
      const label = cells[0].text.trim()

      if (label === LABEL_REGIA && base.director === null) {
        const links = cells[1].querySelectorAll('a')
        const names = links.map(a => a.text.trim()).filter(Boolean).join(', ')
        base.director = names || null
      }

      if (label === LABEL_USCITA && base.italianReleaseDate === null) {
        base.italianReleaseDate = parseItalianDate(cells[1].text.trim())
      }

      if (label === LABEL_GENERE && base.genre === null) {
        const raw = cells[1].text.trim()
        base.genre = raw.replace(/,\s*$/, '').trim() || null
      }
    }
  } catch {
    // Errore di rete o parsing: ritorna quello che abbiamo
  }

  return base
}
