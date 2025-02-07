// src/app/films/page.tsx
import { Suspense } from 'react'
import FilmList from '@/components/Films/FilmList'

export const metadata = {
  title: 'Gestione Film - Cinema Management',
}

export default async function FilmsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Caricamento film...</div>}>
        <FilmList />
      </Suspense>
    </div>
  )
}