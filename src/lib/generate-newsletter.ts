export interface ShowForNewsletter {
  datetime: Date
}

export interface FilmForNewsletter {
  title: string
  director: string | null
  bolId: number | null
  myMoviesUrl: string | null
  shows: ShowForNewsletter[]
}

export interface NewsletterSections {
  intro: string
  film_sx: string
  film_dx: string
}

const ICON_SCHEDA_URL = 'https://mcusercontent.com/1ed73b2160efc6b9b2a887777/images/3dbaf737-7fd7-b7a3-e2a4-0d62459e110f.png'
const ICON_MYMOVIES_URL = 'https://mcusercontent.com/1ed73b2160efc6b9b2a887777/images/e4d708f6-ba70-5d54-27d7-c9b1f90a57e4.png'
const ICON_LIVETICKET_URL = 'https://mcusercontent.com/1ed73b2160efc6b9b2a887777/images/17dc5521-8eb5-2342-188e-3d655f111230.png'
const LIVETICKET_URL = 'https://www.liveticket.it/everestgalluzzo'
const PUBLIC_BASE_URL = 'https://cinema.everestgalluzzo.it'

const IT_DAY_ABBR = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const IT_MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateRange(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${IT_MONTHS[start.getMonth()]}`
  }
  return `${start.getDate()} ${IT_MONTHS[start.getMonth()]} - ${end.getDate()} ${IT_MONTHS[end.getMonth()]}`
}

function formatShowTime(dt: Date): string {
  const day = IT_DAY_ABBR[dt.getDay()]
  const num = String(dt.getDate()).padStart(2, ' ')
  const hh = String(dt.getHours()).padStart(2, '0')
  const mm = String(dt.getMinutes()).padStart(2, '0')
  return `${day} ${num} - ore ${hh}.${mm}`
}

function renderShowTimes(shows: ShowForNewsletter[]): string {
  return [...shows]
    .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
    .map(
      show =>
        `<p style="text-align:center;font-family:'Courier New',Courier,monospace;color:rgb(0,0,205);font-size:14px;font-weight:bold;margin:6px 0;padding:0;">
        ${formatShowTime(show.datetime)}
       </p>`,
    )
    .join('\n')
}

function renderIcons(film: FilmForNewsletter): string {
  const parts: string[] = []
  if (film.bolId) {
    parts.push(
      `<a href="${PUBLIC_BASE_URL}/schede/${film.bolId}.pdf" target="_blank" style="text-decoration:none;">
        <img src="${ICON_SCHEDA_URL}" width="25" height="25" style="border:0;width:25px;height:25px;margin:0;">
       </a>`,
    )
  }
  if (film.myMoviesUrl) {
    parts.push(
      `<a href="${esc(film.myMoviesUrl)}" target="_blank" style="text-decoration:none;">
        <img src="${ICON_MYMOVIES_URL}" width="25" height="25" style="border:0;width:25px;height:25px;margin:0;">
       </a>`,
    )
  }
  parts.push(
    `<a href="${LIVETICKET_URL}" target="_blank" style="text-decoration:none;">
      <img src="${ICON_LIVETICKET_URL}" width="25" height="25" style="border:0;width:25px;height:25px;margin:0;">
     </a>`,
  )
  return `<p style="text-align:center;margin:16px 0 0 0;">${parts.join('&nbsp;&nbsp;&nbsp;')}</p>`
}

function generateFilmInfoBlock(film: FilmForNewsletter): string {
  const titleHtml = `<p style="text-align:center;margin:12px 0 6px 0;">
    <strong><span style="color:rgb(0,0,205);font-size:14px;">
      ${esc(film.title.toUpperCase())}
    </span></strong>
  </p>`

  const directorHtml = film.director
    ? `<p style="text-align:center;font-style:italic;font-size:13px;color:#333;margin:0 0 16px 0;">
        di ${esc(film.director)}
       </p>`
    : ''

  return [
    titleHtml,
    directorHtml,
    renderShowTimes(film.shows),
    renderIcons(film),
  ]
    .filter(Boolean)
    .join('\n')
}

function generateFilmFullBlock(film: FilmForNewsletter): string {
  const posterHtml = film.bolId
    ? `<p style="text-align:center;margin:0 0 6px 0;">
        <a href="${PUBLIC_BASE_URL}/schede/${film.bolId}.pdf" target="_blank">
          <img src="${PUBLIC_BASE_URL}/posters/${film.bolId}.jpg" width="175"
               alt="${esc(film.title)}"
               style="display:inline-block;border:0;max-width:100%;height:auto;">
        </a>
       </p>`
    : ''

  return [posterHtml, generateFilmInfoBlock(film)].filter(Boolean).join('\n')
}

export function generateNewsletterSections(
  films: FilmForNewsletter[],
  dateRange: { start: Date; end: Date },
): NewsletterSections {
  const rangeStr = formatDateRange(dateRange.start, dateRange.end)

  const intro = `<p style="text-align:center;margin:0;">
  <strong><span style="color:rgb(0,0,205);font-size:20px;">programmazione ${rangeStr}</span></strong><br>
  <span style="font-size:14px;">Potete trovare le nostre schede di lettura di ogni film cliccando su &nbsp;<img src="${ICON_SCHEDA_URL}" width="14" height="14" style="border:0;width:14px;height:14px;margin:0;vertical-align:middle;"></span><br>
  <span style="font-size:12px;">Ci vediamo al &nbsp;📽🏔🐓 &nbsp;!!! &nbsp;Buona giornata!</span>
</p>`

  if (films.length === 1) {
    const film = films[0]
    const film_sx = film.bolId
      ? `<p style="text-align:center;margin:0;">
        <a href="${PUBLIC_BASE_URL}/schede/${film.bolId}.pdf" target="_blank">
          <img src="${PUBLIC_BASE_URL}/posters/${film.bolId}.jpg" width="175"
               alt="${esc(film.title)}"
               style="display:inline-block;border:0;max-width:100%;height:auto;">
        </a>
       </p>`
      : ''
    const film_dx = generateFilmInfoBlock(film)
    return { intro, film_sx, film_dx }
  }

  // 2 film
  return {
    intro,
    film_sx: generateFilmFullBlock(films[0]),
    film_dx: generateFilmFullBlock(films[1]),
  }
}

export function generateCampaignSubject(dateRange: { start: Date; end: Date }): string {
  return `programmazione ${formatDateRange(dateRange.start, dateRange.end)}`
}

export function generatePreviewText(films: FilmForNewsletter[]): string {
  return films.map(f => f.title).join(' - ')
}
