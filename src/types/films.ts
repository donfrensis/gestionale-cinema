// src/types/films.ts
import { Film } from '@prisma/client'

export type FilmFormData = {
  title: string
  duration?: number | null
  bolId?: number | null
  cinetelId?: string | null
  description?: string | null
  notes?: string | null
}

export type FilmWithShows = Film & {
  shows: {
    id: number
    date: Date
    time: Date
  }[]
}