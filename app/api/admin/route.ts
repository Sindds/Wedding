import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { computeStats } from '@/lib/stats'
import { requireAdmin, readJsonBody, storageErrorResponse } from '@/lib/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = requireAdmin(req)
  if (denied) return denied

  try {
    const entries = await getStorage().readEntries()
    return NextResponse.json(
      { entries, stats: computeStats(entries) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    return storageErrorResponse(err, 'admin GET')
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = requireAdmin(req)
  if (denied) return denied

  const body = await readJsonBody(req, 64_000)
  if (!body.ok) return NextResponse.json({ error: 'Некорректный JSON' }, { status: body.status })

  const ids = (body.data as { ids?: unknown })?.ids
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  try {
    const deleted = await getStorage().deleteEntries(ids)
    return NextResponse.json({ success: true, deleted })
  } catch (err) {
    return storageErrorResponse(err, 'admin DELETE')
  }
}
