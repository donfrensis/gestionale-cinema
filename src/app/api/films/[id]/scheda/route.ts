// src/app/api/films/[id]/scheda/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

type Params = { params: Promise<{ id: string }> }

// POST /api/films/[id]/scheda — Carica/sostituisce la scheda PDF
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const { id } = await params
  const film = await prisma.film.findUnique({ where: { id: parseInt(id) }, select: { bolId: true } })
  if (!film) {
    return NextResponse.json({ error: 'Film non trovato' }, { status: 404 })
  }
  if (film.bolId === null) {
    return NextResponse.json({ error: 'Il film non ha un bolId associato' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
  }

  const isPdf =
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    return NextResponse.json({ error: 'Il file deve essere un PDF' }, { status: 400 })
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Il file supera i 10 MB' }, { status: 400 })
  }

  const schedeDir = path.join(process.cwd(), 'public', 'schede')
  await fs.promises.mkdir(schedeDir, { recursive: true })

  const filePath = path.join(schedeDir, `${film.bolId}.pdf`)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.promises.writeFile(filePath, buffer)

  return NextResponse.json({ success: true, path: `/schede/${film.bolId}.pdf` })
}

// DELETE /api/films/[id]/scheda — Rimuove la scheda PDF
export async function DELETE(_request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const { id } = await params
  const film = await prisma.film.findUnique({ where: { id: parseInt(id) }, select: { bolId: true } })
  if (!film) {
    return NextResponse.json({ error: 'Film non trovato' }, { status: 404 })
  }
  if (film.bolId === null) {
    return NextResponse.json({ error: 'Il film non ha un bolId associato' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'public', 'schede', `${film.bolId}.pdf`)
  try {
    await fs.promises.unlink(filePath)
  } catch {
    // File non esiste — ignorare
  }

  return NextResponse.json({ success: true })
}
