import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

type RouteParams = { params: Promise<{ filename: string }> }

export async function GET(_req: Request, context: RouteParams) {
  const { filename } = await context.params
  if (!/^\d+\.pdf$/i.test(filename)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const filePath = path.join(process.cwd(), 'public', 'schede', filename)
  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
