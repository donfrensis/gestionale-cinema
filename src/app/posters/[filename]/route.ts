import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

type RouteParams = { params: Promise<{ filename: string }> }

export async function GET(_req: Request, context: RouteParams) {
  const { filename } = await context.params
  // Sicurezza: solo nomi file semplici, niente path traversal
  if (!/^\d+\.jpe?g$/i.test(filename)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const filePath = path.join(process.cwd(), 'public', 'posters', filename)
  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
