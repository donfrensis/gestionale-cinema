// src/components/Public/ProgrammazioneHeader.tsx
import NotificationToggle from './NotificationToggle'

export default function ProgrammazioneHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#0a1628',
        borderBottom: '1px solid #1e3050',
        height: '56px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 12px 0 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Contenitore che ritaglia: largo 100, alto 60 (100 - 20 top - 25 bottom) */}
        <div style={{ width: 100, height: 55, overflow: 'hidden', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-512x512.svg"
            width={100}
            height={100}
            style={{ marginTop: -20 }}
            alt="Cinema Everest Galluzzo"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f5f5f5' }}>
            Programmazione
          </span>
          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>
            Cinema Everest Galluzzo
          </span>
        </div>
      </div>
      <NotificationToggle />
    </header>
  )
}
