// src/components/Public/ShowCard.tsx
//
// Palette Cinema Everest Galluzzo:
//   oro:   #D4AF37  — orari, accento primario
//   verde: #009246  — link MyMovies
//   navy:  #0d1b2a  — sfondo card
//   bordo: #1e3050  — bordo/separatore

'use client'

import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'

export interface ShowCardData {
  id: number
  datetime: string
  film: {
    title: string
    duration: number | null
    director: string | null
    genre: string | null
    posterUrl: string | null
    myMoviesUrl: string | null
    bolId: number | null
  }
}

export interface FilmGroup {
  film: ShowCardData['film']
  shows: { id: number; datetime: string }[]
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

function formatShowtime(datetime: string): { dateLabel: string; timeLabel: string } {
  // datetime = "YYYY-MM-DDTHH:MM:SS" — no UTC conversion
  const [datePart, timePart] = datetime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':')

  const d = new Date(year, month - 1, day)
  // "gio 12 mar" — max 10 chars in it-IT short format
  const dateLabel = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)

  return { dateLabel, timeLabel: `${hh}:${mm}` }
}

export default function ShowCard({ group }: { group: FilmGroup }) {
  const { film, shows } = group
  const durationStr = film.duration ? formatDuration(film.duration) : null
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
    {/* ── Lightbox ── */}
    {lightbox && film.posterUrl && (
      <div
        onClick={() => setLightbox(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        {/* Pulsante chiudi */}
        <button
          onClick={() => setLightbox(false)}
          aria-label="Chiudi"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#f5f5f5',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
        {/* Immagine */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.posterUrl}
          alt={film.title}
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          }}
        />
      </div>
    )}
    <div
      style={{
        background: '#0d1b2a',
        border: '1px solid #1e3050',
        borderRadius: '12px',
        marginBottom: '10px',
        overflow: 'hidden',
      }}
    >
      {/* ── Header film ── */}
      <div style={{ padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {/* Riga 1: titolo */}
        <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5f5f5' }}>
          {film.title}
        </div>

        {/* Riga 2: regista (sx) + link MyMovies (dx) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {film.director ? `👤 ${film.director}` : ''}
          </span>
          {film.myMoviesUrl && (
            <a
              href={film.myMoviesUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#009246', display: 'flex', alignItems: 'center' }}
              aria-label="MyMovies"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        {/* Riga 3: genere */}
        {film.genre && (
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{film.genre}</div>
        )}

        {/* Riga 4: durata (sx) + link PDF (dx) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            {durationStr ? `⏱ ${durationStr}` : ''}
          </span>
          {film.bolId && (
            <a
              href={`/schede/${film.bolId}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#9ca3af', display: 'flex', alignItems: 'center' }}
              aria-label="Scheda PDF"
            >
              <FileText size={15} />
            </a>
          )}
        </div>
      </div>

      {/* ── Separatore ── */}
      <div style={{ borderTop: '1px solid #1e3050' }} />

      {/* ── Sezione inferiore: poster + orari ── */}
      <div style={{ display: 'flex', gap: '12px', padding: '10px 12px 12px', alignItems: 'flex-start' }}>
        {/* Poster */}
        <div
          onClick={() => film.posterUrl && setLightbox(true)}
          style={{
            width: '90px',
            minWidth: '90px',
            aspectRatio: '2/3',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#1a2a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: film.posterUrl ? 'zoom-in' : 'default',
          }}
        >
          {film.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={film.posterUrl}
              alt={film.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '1.5rem' }}>🎬</span>
          )}
        </div>

        {/* Orari — font monospaced, grid a 2 colonne */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '0.85rem',
          }}
        >
          {shows.map(show => {
            const { dateLabel, timeLabel } = formatShowtime(show.datetime)
            return (
              <div
                key={show.id}
                style={{
                  display: 'grid',
                  // 12ch copre "gio 12 mar" (10ch) + spazio respirazione
                  gridTemplateColumns: '12ch 1fr',
                }}
              >
                <span style={{ color: '#c8d6e5' }}>{dateLabel}</span>
                <span style={{ color: '#D4AF37', fontWeight: 600 }}>ore {timeLabel}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}
