// src/app/programmazione/layout.tsx
import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Programmazione Cinema Everest Galluzzo',
  description: 'La programmazione settimanale del Cinema Everest del Galluzzo. Ci vediamo al  📽🏔🐓  !!!',
  openGraph: {
    title: 'Programmazione Cinema Everest Galluzzo',
    description: 'La programmazione settimanale del Cinema Everest del Galluzzo . Ci vediamo al  📽🏔🐓  !!!',
    url: 'https://cinema.everestgalluzzo.it',
    siteName: 'Cinema Everest Galluzzo',
    locale: 'it_IT',
    type: 'website',
  },
}

export default function ProgrammazioneLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a1628" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest-public.json" />
        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body style={{ margin: 0, background: '#060e1a', color: '#f5f5f5' }}>
        <div className={robotoMono.variable}>
          {children}
        </div>
      </body>
    </html>
  )
}
