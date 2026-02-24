export interface ShowForMessage {
  datetime: string
  notes: string | null
  film: {
    title: string
    duration: number | null
    myMoviesUrl: string | null
  }
}

const IT_DAY_ABBR = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const IT_DAY_FULL = [
  'domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato',
]
const IT_MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

function getCinemaWeekRange(anchorShows: ShowForMessage[]): { start: Date; end: Date } {
  const dates = anchorShows.map(s => new Date(s.datetime))
  const anchor = new Date(Math.min(...dates.map(d => d.getTime())))
  anchor.setHours(0, 0, 0, 0)

  // Cinema week: Thursday → Wednesday
  // (dayOfWeek + 3) % 7 gives days elapsed since last Thursday
  // Thu=0, Fri=1, Sat=2, Sun=3, Mon=4, Tue=5, Wed=6
  const daysSinceThursday = (anchor.getDay() + 3) % 7
  const thursday = new Date(anchor)
  thursday.setDate(thursday.getDate() - daysSinceThursday)
  thursday.setHours(0, 0, 0, 0)

  const wednesday = new Date(thursday)
  wednesday.setDate(wednesday.getDate() + 6)
  wednesday.setHours(23, 59, 59, 999)

  return { start: thursday, end: wednesday }
}

/** Returns {start, end} for the cinema week (Thu→Wed) that contains today. */
export function getCurrentCinemaWeek(): { start: Date; end: Date } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysSinceThursday = (today.getDay() + 3) % 7
  const thursday = new Date(today)
  thursday.setDate(today.getDate() - daysSinceThursday)
  thursday.setHours(0, 0, 0, 0)
  const wednesday = new Date(thursday)
  wednesday.setDate(thursday.getDate() + 6)
  wednesday.setHours(23, 59, 59, 999)
  return { start: thursday, end: wednesday }
}

function formatTime(datetime: string, separator = ':'): string {
  const d = new Date(datetime)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}${separator}${m}`
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function generateWhatsAppMessage(weekShows: ShowForMessage[]): string {
  if (weekShows.length === 0) return ''

  const HEADER = '*C̤̈Ï̤N̤̈Ë̤M̤̈Ä̤ Ë̤V̤̈Ë̤R̤̈Ë̤S̤̈T̤̈ G̤̈Ä̤L̤̈L̤̈Ṳ̈Z̤̈Z̤̈Ö̤*'
  const FOOTER = 'Ci vediamo al  📽🏔🐓  !!!\nBuona giornata!!!'

  // Group by film title, preserving first-occurrence order
  const filmMap = new Map<string, { film: ShowForMessage['film']; shows: ShowForMessage[] }>()
  for (const show of weekShows) {
    const key = show.film.title
    if (!filmMap.has(key)) filmMap.set(key, { film: show.film, shows: [] })
    filmMap.get(key)!.shows.push(show)
  }

  const lines: string[] = [HEADER, '']

  for (const { film, shows } of filmMap.values()) {
    lines.push(`*${film.title.toUpperCase()}*`)
    lines.push(`_di [regista]_`)
    if (film.duration) lines.push(`_durata ${film.duration}'_`)
    lines.push('')

    for (const show of shows) {
      const d = new Date(show.datetime)
      const dayAbbr = IT_DAY_ABBR[d.getDay()]
      const dayNum = d.getDate()
      const time = formatTime(show.datetime)
      const notesSuffix = show.notes?.trim() ? ` ${show.notes.trim()}` : ''
      lines.push(`\`\`\` ${dayAbbr} ${dayNum} - ore ${time}${notesSuffix}\`\`\``)
    }

    lines.push('')
    lines.push(film.myMoviesUrl ?? '[URL non disponibile]')
    lines.push('')
  }

  lines.push(FOOTER)
  return lines.join('\n')
}

function generateEmailMessage(weekShows: ShowForMessage[], start: Date, end: Date): string {
  const HEADER =
    "Buongiorno, \n\nin calce la programmazione dell'Everest Galluzzo per le date in oggetto.\n\nCordiali saluti\nCinema Everest - Galluzzo\n\n______________________\n\n"

  // Group shows by calendar date
  const showsByDay = new Map<string, ShowForMessage[]>()
  for (const show of weekShows) {
    const k = dayKey(new Date(show.datetime))
    if (!showsByDay.has(k)) showsByDay.set(k, [])
    showsByDay.get(k)!.push(show)
  }

  // Iterate every day in [start, end] (both normalised to midnight)
  const iterStart = new Date(start)
  iterStart.setHours(0, 0, 0, 0)
  const iterEnd = new Date(end)
  iterEnd.setHours(0, 0, 0, 0)
  const numDays =
    Math.round((iterEnd.getTime() - iterStart.getTime()) / (24 * 60 * 60 * 1000)) + 1

  const dayParts: string[] = []

  for (let i = 0; i < numDays; i++) {
    const day = new Date(iterStart)
    day.setDate(day.getDate() + i)

    const heading = `${IT_DAY_FULL[day.getDay()]} ${day.getDate()} ${IT_MONTHS[day.getMonth()]}`
    const k = dayKey(day)
    const dayShows = showsByDay.get(k)

    if (dayShows && dayShows.length > 0) {
      const sorted = [...dayShows].sort(
        (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
      )
      const showLines = sorted.map(show => {
        const time = formatTime(show.datetime, '.')
        const isVO = /vos|v\.o\./i.test(show.notes ?? '')
        const voSuffix = isVO ? ' (V.O. sottot. in italiano)' : ''
        return `- ${show.film.title.toUpperCase()}${voSuffix} - ore ${time}`
      })
      dayParts.push(`${heading}\n${showLines.join('\n')}`)
    } else {
      dayParts.push(`${heading}\n- riposo`)
    }
  }

  return HEADER + dayParts.join('\n\n\n')
}

export function generateMessages(
  anchorShows: ShowForMessage[],
  allShows: ShowForMessage[],
  customRange?: { start: Date; end: Date },
): { whatsapp: string; email: string } {
  if (anchorShows.length === 0 && !customRange) return { whatsapp: '', email: '' }

  let rangeStart: Date
  let rangeEnd: Date

  if (customRange) {
    rangeStart = new Date(customRange.start)
    rangeStart.setHours(0, 0, 0, 0)
    rangeEnd = new Date(customRange.end)
    rangeEnd.setHours(23, 59, 59, 999)
  } else {
    const range = getCinemaWeekRange(anchorShows)
    rangeStart = range.start
    rangeEnd = range.end
  }

  const weekShows = allShows
    .filter(show => {
      const dt = new Date(show.datetime)
      return dt >= rangeStart && dt <= rangeEnd
    })
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

  return {
    whatsapp: generateWhatsAppMessage(weekShows),
    email: generateEmailMessage(weekShows, rangeStart, rangeEnd),
  }
}
