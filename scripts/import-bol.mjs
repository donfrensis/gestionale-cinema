#!/usr/bin/env node
/**
 * scripts/import-bol.mjs
 *
 * Importa / aggiorna TUTTI i film dal catalogo BOL LiveTicket.
 *
 * Per ogni film presente su BOL:
 *   - Se esiste già nel DB (matchato per bolId) → aggiorna i dettagli
 *   - Se NON esiste nel DB                      → lo crea
 *
 * Flags:
 *   --new-only     Importa solo i film nuovi (bolId > max nel DB), senza aggiornare gli esistenti
 *   --dry-run      Stampa cosa farebbe senza toccare il DB
 *   --skip-details Salta il fetch dei dettagli (più veloce, ma salva solo titolo e bolId)
 *
 * Utilizzo:
 *   node --env-file=.env scripts/import-bol.mjs
 *   node --env-file=.env scripts/import-bol.mjs --new-only
 *   node --env-file=.env scripts/import-bol.mjs --dry-run
 *
 * Oppure dal host Docker:
 *   docker exec -it <container> sh -c "cd /app/gestionale-cinema && node --env-file=.env scripts/import-bol.mjs"
 */

import { PrismaClient } from '@prisma/client'
import { parse as parseHtml } from 'node-html-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Flags ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const NEW_ONLY     = args.includes('--new-only')
const DRY_RUN      = args.includes('--dry-run')
const SKIP_DETAILS = args.includes('--skip-details')

// ─── Config ───────────────────────────────────────────────────────────────────
const BOL_USERNAME   = process.env.BOL_USERNAME
const BOL_PASSWORD   = process.env.BOL_PASSWORD
const BOL_BASE_URL   = process.env.BOL_BASE_URL   || 'http://bol.gostec.it'
const BOL_THEATER_ID = process.env.BOL_THEATER_ID || '3871'

if (!BOL_USERNAME || !BOL_PASSWORD) {
  console.error('❌ Variabili BOL_USERNAME e BOL_PASSWORD non impostate. Usare --env-file=.env')
  process.exit(1)
}

// ─── Session BOL ──────────────────────────────────────────────────────────────
let _sessionCookies = null
let _lastLogin = 0
const SESSION_TTL = 15 * 60 * 1000

async function loginBol() {
  const now = Date.now()
  if (_sessionCookies && (now - _lastLogin) < SESSION_TTL) return _sessionCookies

  console.log('🔐 Login su BOL LiveTicket...')
  const res = await fetch(`${BOL_BASE_URL}/autentica.asp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      user: BOL_USERNAME, pass: BOL_PASSWORD,
      Op: 'Login', IdCassa: '10', InfoExtra: '10',
    }),
    redirect: 'manual',
    cache: 'no-store',
  })

  const cookies = res.headers.getSetCookie?.() ?? []
  if (!cookies.length) throw new Error('Nessun cookie ricevuto durante il login BOL')

  _sessionCookies = cookies.map(c => c.split(';')[0])
  _lastLogin = now
  console.log('✅ Login BOL riuscito')
  return _sessionCookies
}

// ─── Lista film ───────────────────────────────────────────────────────────────
async function getBolFilmsList() {
  const cookies = await loginBol()
  const res = await fetch(`${BOL_BASE_URL}/opere_principale.asp`, {
    headers: { 'Cookie': cookies.join('; ') },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Lista film BOL: HTTP ${res.status}`)

  const html = await res.text()
  const root = parseHtml(html)
  const films = []
  const seen = new Set()

  for (const link of root.querySelectorAll('a[href*="opera_crea.asp"]')) {
    const href = link.getAttribute('href') || ''
    const m = href.match(/[?&]ID=(\d+)/i)
    if (!m) continue
    const bolId = parseInt(m[1])
    if (!bolId || seen.has(bolId)) continue
    seen.add(bolId)
    const title = link.textContent.trim()
    if (title) films.push({ bolId, title })
  }

  return films
}

// ─── Dettagli film ────────────────────────────────────────────────────────────
async function getBolFilmDetails(bolId) {
  const cookies = await loginBol()
  const url = `${BOL_BASE_URL}/opera_crea.asp?ID_Teatro=${BOL_THEATER_ID}&ID=${bolId}&Op=Apri&Archiviati=0`
  const res = await fetch(url, {
    headers: { 'Cookie': cookies.join('; ') },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Dettagli film ${bolId}: HTTP ${res.status}`)

  const html = await res.text()
  const root = parseHtml(html)

  const getInput = (name) => {
    const el = root.querySelector(`input[name="${name}"], textarea[name="${name}"]`)
            || root.querySelector(`input[id="${name}"], textarea[id="${name}"]`)
    return el ? (el.getAttribute('value') || el.attrs?.value || el.textContent?.trim() || null) : null
  }

  const durationRaw = getInput('Durata')
  const posterImg = root.querySelector('img[src*="poster"], img[src*="locandina"], img[src*="cover"]')
  const posterSrc = posterImg?.getAttribute('src') || null
  const posterUrl = posterSrc
    ? (posterSrc.startsWith('http') ? posterSrc : `${BOL_BASE_URL}/${posterSrc.replace(/^\//, '')}`)
    : null

  const myMoviesLink = root.querySelector('a[href*="mymovies"]')

  return {
    bolId,
    title:       getInput('Titolo') || '',
    duration:    durationRaw ? parseInt(durationRaw) || null : null,
    cinetelId:   getInput('CodCinetelEffettivo') || null,
    nationality: getInput('Naz') || null,
    producer:    getInput('Produttore') || null,
    distributor: getInput('DistFilm') || null,
    posterUrl,
    myMoviesUrl: myMoviesLink?.getAttribute('href') || null,
  }
}

// ─── Download poster locale ───────────────────────────────────────────────────
async function downloadAndSavePoster(bolId, remoteUrl) {
  try {
    const postersDir = path.join(__dirname, '..', 'public', 'posters')
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

// ─── Pausa tra richieste ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const prisma = new PrismaClient()

  try {
    console.log(`\n🎬 Import film da BOL${DRY_RUN ? ' [DRY RUN]' : ''}${NEW_ONLY ? ' [solo nuovi]' : ' [aggiorna tutti]'}`)
    console.log('─'.repeat(60))

    // 1. Film presenti su BOL
    console.log('\n📥 Recupero lista film da BOL...')
    const bolFilms = await getBolFilmsList()
    console.log(`   → ${bolFilms.length} film trovati su BOL`)

    // 2. Film nel DB con bolId
    const dbFilms = await prisma.film.findMany({
      where: { bolId: { not: null } },
      select: { id: true, bolId: true, title: true, posterUrl: true },
    })
    const dbByBolId = new Map(dbFilms.map(f => [f.bolId, f]))
    console.log(`   → ${dbFilms.length} film nel DB con bolId`)

    // 3. Determina cosa fare
    let maxBolId = 0
    if (NEW_ONLY) {
      const latest = await prisma.film.findFirst({
        where: { bolId: { not: null } },
        orderBy: { bolId: 'desc' },
        select: { bolId: true },
      })
      maxBolId = latest?.bolId ?? 0
      console.log(`   → Importo solo bolId > ${maxBolId}`)
    }

    const toProcess = NEW_ONLY
      ? bolFilms.filter(f => f.bolId > maxBolId)
      : bolFilms

    if (toProcess.length === 0) {
      console.log('\n✅ Nessun film da processare.')
      return
    }

    console.log(`\n🔄 Film da processare: ${toProcess.length}`)
    console.log('─'.repeat(60))

    // 4. Processa
    let created = 0, updated = 0, errors = 0

    for (let i = 0; i < toProcess.length; i++) {
      const { bolId, title } = toProcess[i]
      const existingFilm = dbByBolId.get(bolId)
      const action = existingFilm ? 'UPDATE' : 'CREATE'

      process.stdout.write(
        `[${String(i + 1).padStart(3)}/${toProcess.length}] ${action} bolId=${bolId} "${title.substring(0, 40)}"...`
      )

      try {
        // title usato solo per la creazione; myMoviesUrl non viene mai preso da BOL
        let data = { bolId, title, importedFrom: 'BOL' }

        if (!SKIP_DETAILS) {
          await sleep(300) // evita flood BOL
          const details = await getBolFilmDetails(bolId)

          // Scarica poster locale se disponibile
          let posterUrl = details.posterUrl ?? undefined
          if (details.posterUrl) {
            const localPath = await downloadAndSavePoster(bolId, details.posterUrl)
            posterUrl = localPath ?? undefined
          }

          data = {
            ...data,
            ...(details.title     && { title: details.title }),
            duration:    details.duration    ?? undefined,
            cinetelId:   details.cinetelId   ?? undefined,
            nationality: details.nationality ?? undefined,
            producer:    details.producer    ?? undefined,
            distributor: details.distributor ?? undefined,
            posterUrl,
            myMoviesUrl: details.myMoviesUrl ?? undefined,
          }
        }

        // Rimuovi undefined per non sovrascrivere con null
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined)
        )

        if (!DRY_RUN) {
          if (existingFilm) {
            // Su film esistenti: NON sovrascrivere title (già corretto nel DB)
            // e NON toccare myMoviesUrl (BOL non lo conosce, viene da MyMovies)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { title: _title, myMoviesUrl: _mmUrl, ...updateData } = cleanData
            // Aggiorna posterUrl solo se il valore attuale è ancora un URL BOL remoto
            if (updateData.posterUrl !== undefined && existingFilm.posterUrl && !existingFilm.posterUrl.startsWith('http')) {
              delete updateData.posterUrl
            }
            await prisma.film.update({ where: { id: existingFilm.id }, data: updateData })
            updated++
          } else {
            // Film nuovo: usa tutti i dati BOL così come sono (myMoviesUrl non arriverà mai da BOL)
            await prisma.film.create({ data: { ...cleanData, duration: cleanData.duration ?? null } })
            created++
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          action === 'CREATE' ? created++ : updated++
        }

        console.log(' ✅')
      } catch (err) {
        console.log(` ❌ ${err.message}`)
        errors++
      }
    }

    // 5. Riepilogo
    console.log('\n' + '─'.repeat(60))
    console.log('📊 Riepilogo:')
    console.log(`   Creati:    ${created}`)
    console.log(`   Aggiornati: ${updated}`)
    console.log(`   Errori:    ${errors}`)
    if (DRY_RUN) console.log('\n   ⚠️  Modalità DRY RUN: nessuna modifica al DB')

  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error('\n💥 Errore fatale:', err.message)
  process.exit(1)
})
