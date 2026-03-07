'use client'
// src/components/Public/ShowList.tsx

import ShowCard, { ShowCardData, FilmGroup } from './ShowCard'

export default function ShowList({ shows }: { shows: ShowCardData[] }) {
  if (shows.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          gap: '12px',
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>🎬</span>
        <p style={{ margin: 0 }}>Nessuna programmazione disponibile al momento.</p>
        <p style={{ margin: 0 }}>Torna presto!</p>
      </div>
    )
  }

  // Raggruppa per film.title mantenendo l'ordine del primo spettacolo di ogni film
  const groupMap = new Map<string, FilmGroup>()
  for (const show of shows) {
    const key = show.film.title
    if (!groupMap.has(key)) {
      groupMap.set(key, { film: show.film, shows: [] })
    }
    groupMap.get(key)!.shows.push({ id: show.id, datetime: show.datetime })
  }
  const groups = Array.from(groupMap.values())

  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      {groups.map(group => (
        <ShowCard key={group.film.title} group={group} />
      ))}
    </div>
  )
}
