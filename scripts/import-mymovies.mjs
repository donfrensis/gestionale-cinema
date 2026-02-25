#!/usr/bin/env node
/**
 * scripts/import-mymovies.mjs
 *
 * Arricchisce i film dell'ultima stagione con dati da MyMovies.it:
 * regista (director), data uscita italiana (italianReleaseDate), genere (genre), URL MyMovies.
 *
 * Logica:
 *   1. Trova i film che hanno almeno uno spettacolo nell'ultima stagione
 *      (default: a partire dal 1° settembre dell'anno scorso)
 *   2. Per i film che hanno già myMoviesUrl: aggiorna auto i dettagli mancanti
 *   3. Per i film senza myMoviesUrl: cerca su MyMovies, mostra risultati,
 *      chiede conferma prima di salvare (replica il comportamento dell'app)
 *
 * Flags:
 *   --since=YYYY-MM-DD   Data inizio stagione (default: 1 settembre anno scorso)
 *   --all                Processa tutti i film, non solo quelli con dati mancanti
 *   --all-films          Processa tutti i film nel DB (ignora filtro stagione/spettacoli)
 *   --dry-run            Stampa cosa farebbe senza toccare il DB
 *   --auto               Non chiedere conferma se c'è un solo risultato
 *
 * Utilizzo:
 *   node --env-file=.env scripts/import-mymovies.mjs
 *   node --env-file=.env scripts/import-mymovies.mjs --since=2024-09-01
 *   node --env-file=.env scripts/import-mymovies.mjs --all --auto
 *   node --env-file=.env scripts/import-mymovies.mjs --all-films --auto
 *
 * Oppure dal host Docker:
 *   docker exec -it <container> sh -c "cd /app/gestionale-cinema && node --env-file=.env scripts/import-mymovies.mjs"
 */

import { PrismaClient } from '@prisma/client'
import { parse as parseHtml } from 'node-html-parser'
import * as readline from 'readline'

// ─── Flags ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN   = args.includes('--dry-run')
const ALL       = args.includes('--all')
const ALL_FILMS = args.includes('--all-films')
const AUTO      = args.includes('--auto')

const sinceArg = args.find(a => a.startsWith('--since='))
const SINCE_DATE = sinceArg
  ? new Date(sinceArg.split('=')[1])
  : (() => {
      // Default: 1 settembre dell'anno scorso
      const d = new Date()
      d.setFullYear(d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1, 8, 1)
      d.setHours(0, 0, 0, 0)
      return d
    })()

if (isNaN(SINCE_DATE.getTime())) {
  console.error('❌ Data --since non valida. Formato: YYYY-MM-DD')
  process.exit(1)
}

// ─── Readline helper ──────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(resolve => rl.question(q, resolve))

// ─── MyMovies scraper ─────────────────────────────────────────────────────────
const SEARCH_URL   = 'https://www.mymovies.it/ricerca/ricerca.php'
const FILM_PATTERN = /^https:\/\/www\.mymovies\.it\/film\/\d{4}\/[^/]+\/$/
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const MONTHS = {
  gennaio:1, febbraio:2, marzo:3, aprile:4, maggio:5, giugno:6,
  luglio:7, agosto:8, settembre:9, ottobre:10, novembre:11, dicembre:12
}

function parseItalianDate(raw) {
  const m = raw.match(/(\d+)\s+([a-zà-ú]+)\s+(\d{4})/i)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase()]
  if (!month) return null
  return new Date(Date.UTC(parseInt(m[3]), month - 1, parseInt(m[1])))
}

async function searchMyMovies(title) {
  try {
    const res = await fetch(`${SEARCH_URL}?limit=true&q=${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': UA }, cache: 'no-store',
    })
    if (!res.ok) return []
    const json = await res.json()
    if (json.esito !== 'SUCCESS') return []

    return (json.risultati?.film?.elenco ?? [])
      .filter(item => item.bgcolor !== '#d1d1d1' && FILM_PATTERN.test(item.url))
      .map(item => {
        const [year = '', ...dirParts] = item.descrizione.split(' - ')
        return { title: item.titolo, year: year.trim(), director: dirParts.join(' - ').trim(), url: item.url }
      })
  } catch { return [] }
}

async function fetchMyMoviesDetail(url) {
  const normalizedUrl = url.endsWith('/') ? url : url + '/'
  const base = { director: null, italianReleaseDate: null, genre: null, myMoviesUrl: normalizedUrl }
  try {
    const res = await fetch(normalizedUrl, { headers: { 'User-Agent': UA }, cache: 'no-store' })
    if (!res.ok) return base
    const root = parseHtml(await res.text())
    for (const row of root.querySelectorAll('tr')) {
      const cells = row.querySelectorAll('td')
      if (cells.length < 2) continue
      const label = cells[0].text.trim()
      if (label === 'Regia di' && !base.director) {
        const names = cells[1].querySelectorAll('a').map(a => a.text.trim()).filter(Boolean).join(', ')
        base.director = names || null
      }
      if (label === 'Uscita' && !base.italianReleaseDate) {
        base.italianReleaseDate = parseItalianDate(cells[1].text.trim())
      }
      if (label === 'Genere' && !base.genre) {
        base.genre = cells[1].text.trim().replace(/,\s*$/, '').trim() || null
      }
    }
  } catch {}
  return base
}

// ─── Pausa ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function hasMissingData(film) {
  return !film.director || !film.genre || !film.italianReleaseDate || !film.myMoviesUrl
}

function printFilmStatus(film) {
  const missing = []
  if (!film.director)           missing.push('director')
  if (!film.genre)              missing.push('genre')
  if (!film.italianReleaseDate) missing.push('uscita')
  if (!film.myMoviesUrl)        missing.push('myMoviesUrl')
  return missing.length ? `[mancano: ${missing.join(', ')}]` : '[completo]'
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const prisma = new PrismaClient()

  try {
    console.log(`\n🎬 Import MyMovies.it${DRY_RUN ? ' [DRY RUN]' : ''}`)
    console.log(`   Stagione da: ${ALL_FILMS ? '(tutti i film nel DB)' : SINCE_DATE.toLocaleDateString('it-IT')}`)
    console.log(`   Modalità:    ${ALL || ALL_FILMS ? 'tutti i film' : 'solo film con dati mancanti'}`)
    console.log('─'.repeat(60))

    // 1. Film da processare
    const filmsWithShows = await prisma.film.findMany({
      where: ALL_FILMS ? {} : {
        shows: { some: { datetime: { gte: SINCE_DATE } } },
      },
      select: {
        id: true, title: true, director: true, genre: true,
        italianReleaseDate: true, myMoviesUrl: true,
        _count: { select: { shows: true } },
      },
      orderBy: { title: 'asc' },
    })

    console.log(`\n📋 Film trovati: ${filmsWithShows.length}${ALL_FILMS ? '' : ` (spettacoli dal ${SINCE_DATE.toLocaleDateString('it-IT')})`}`)

    // 2. Filtra quelli con dati mancanti (a meno che --all)
    const toProcess = ALL ? filmsWithShows : filmsWithShows.filter(hasMissingData)
    const alreadyComplete = filmsWithShows.length - toProcess.length

    if (alreadyComplete > 0) console.log(`   → ${alreadyComplete} già completi, saltati`)
    console.log(`   → ${toProcess.length} da processare`)

    if (toProcess.length === 0) {
      console.log('\n✅ Nessun film da aggiornare.')
      return
    }

    // Statistiche
    const withUrl    = toProcess.filter(f => f.myMoviesUrl).length
    const withoutUrl = toProcess.filter(f => !f.myMoviesUrl).length
    console.log(`   → ${withUrl} con URL MyMovies (aggiornamento automatico)`)
    console.log(`   → ${withoutUrl} senza URL (richiede ricerca interattiva)`)

    console.log('\n' + '─'.repeat(60))

    let autoUpdated = 0, interactiveUpdated = 0, skipped = 0, errors = 0

    for (let i = 0; i < toProcess.length; i++) {
      const film = toProcess[i]
      const prefix = `[${String(i + 1).padStart(2)}/${toProcess.length}]`

      console.log(`\n${prefix} "${film.title}"`)
      console.log(`   ${printFilmStatus(film)}`)

      // ── Caso A: ha già l'URL MyMovies ──────────────────────────────────────
      if (film.myMoviesUrl) {
        process.stdout.write('   🔍 Fetch dettagli da URL salvato...')
        try {
          await sleep(500)
          const detail = await fetchMyMoviesDetail(film.myMoviesUrl)

          // Aggiorna solo i campi mancanti
          const updateData = {}
          if (!film.director           && detail.director)           updateData.director = detail.director
          if (!film.genre              && detail.genre)              updateData.genre = detail.genre
          if (!film.italianReleaseDate && detail.italianReleaseDate) updateData.italianReleaseDate = detail.italianReleaseDate

          if (Object.keys(updateData).length === 0) {
            console.log(' niente di nuovo')
            skipped++
            continue
          }

          console.log(` trovato: ${Object.keys(updateData).join(', ')}`)
          if (!DRY_RUN) {
            await prisma.film.update({ where: { id: film.id }, data: updateData })
          }
          autoUpdated++
        } catch (err) {
          console.log(` ❌ ${err.message}`)
          errors++
        }
        continue
      }

      // ── Caso B: senza URL → ricerca interattiva ────────────────────────────
      process.stdout.write('   🔍 Ricerca su MyMovies...')
      await sleep(600)
      const results = await searchMyMovies(film.title)

      if (results.length === 0) {
        console.log(' nessun risultato trovato')
        const alt = await ask('   ✏️  Inserisci URL MyMovies manualmente (invio per saltare): ')
        if (!alt.trim()) { skipped++; continue }
        results.push({ url: alt.trim(), title: film.title, year: '', director: '' })
      } else {
        console.log(` ${results.length} risultat${results.length === 1 ? 'o' : 'i'}`)
      }

      // Selezione risultato
      let chosen = null

      if (results.length === 1) {
        const r = results[0]
        console.log(`   → ${r.title} (${r.year}) - ${r.director}`)
        console.log(`      ${r.url}`)

        if (AUTO) {
          chosen = r
          console.log('   ✅ Selezionato automaticamente (--auto)')
        } else {
          const ans = await ask('   Importare questo film? [s/N] ')
          if (ans.toLowerCase() === 's' || ans.toLowerCase() === 'si' || ans === 'y') {
            chosen = r
          } else {
            console.log('   ⏭️  Saltato')
            skipped++
            continue
          }
        }
      } else {
        // Più risultati → mostra lista
        console.log('   Scegli il film corrispondente:')
        results.forEach((r, idx) => {
          console.log(`   ${idx + 1}. ${r.title} (${r.year}) - ${r.director}`)
          console.log(`      ${r.url}`)
        })
        console.log(`   0. Salta`)

        const ans = await ask('   Scelta [0]: ')
        const idx = parseInt(ans)
        if (!idx || idx < 1 || idx > results.length) {
          console.log('   ⏭️  Saltato')
          skipped++
          continue
        }
        chosen = results[idx - 1]
      }

      // Fetch dettagli del risultato scelto
      process.stdout.write(`   📄 Recupero dettagli da ${chosen.url}...`)
      try {
        await sleep(500)
        const detail = await fetchMyMoviesDetail(chosen.url)

        const updateData = {
          myMoviesUrl: detail.myMoviesUrl,
          ...(detail.director           && !film.director           && { director: detail.director }),
          ...(detail.genre              && !film.genre              && { genre: detail.genre }),
          ...(detail.italianReleaseDate && !film.italianReleaseDate && { italianReleaseDate: detail.italianReleaseDate }),
        }

        console.log('\n   📝 Dati trovati:')
        if (detail.director)           console.log(`      Regista:  ${detail.director}`)
        if (detail.italianReleaseDate) console.log(`      Uscita:   ${detail.italianReleaseDate.toLocaleDateString('it-IT')}`)
        if (detail.genre)              console.log(`      Genere:   ${detail.genre}`)
        console.log(`      URL:      ${detail.myMoviesUrl}`)

        // Conferma finale (saltata con --auto)
        if (!AUTO) {
          const confirm = await ask('   Salvare questi dati? [S/n] ')
          if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
            console.log('   ⏭️  Annullato')
            skipped++
            continue
          }
        }

        if (!DRY_RUN) {
          await prisma.film.update({ where: { id: film.id }, data: updateData })
        }
        console.log('   ✅ Salvato')
        interactiveUpdated++
      } catch (err) {
        console.log(` ❌ ${err.message}`)
        errors++
      }
    }

    // ─── Riepilogo ─────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60))
    console.log('📊 Riepilogo:')
    console.log(`   Aggiornati (auto):        ${autoUpdated}`)
    console.log(`   Aggiornati (interattivo): ${interactiveUpdated}`)
    console.log(`   Saltati:                  ${skipped}`)
    console.log(`   Errori:                   ${errors}`)
    if (DRY_RUN) console.log('\n   ⚠️  Modalità DRY RUN: nessuna modifica al DB')

  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('\n💥 Errore fatale:', err.message)
  rl.close()
  process.exit(1)
})
