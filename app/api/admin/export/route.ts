import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/storage'
import { generateExcel } from '@/lib/exportExcel'
import { requireAdmin, storageErrorResponse } from '@/lib/http'
import type { ExportCategory } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: ExportCategory[] = ['all', 'guests', 'drinks']

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = requireAdmin(req)
  if (denied) return denied

  const cat = req.nextUrl.searchParams.get('category') as ExportCategory | null
  const category: ExportCategory = cat && VALID.includes(cat) ? cat : 'all'

  let entries
  try {
    entries = await getStorage().readEntries()
  } catch (err) {
    return storageErrorResponse(err, 'admin export')
  }
  const idsParam = req.nextUrl.searchParams.get('ids')
  if (idsParam) {
    const ids = new Set(idsParam.split(',').filter(Boolean))
    entries = entries.filter((e) => ids.has(e.id))
  }

  const buffer   = await generateExcel(entries, category)
  const filename = `rsvp_${category}_${new Date().toISOString().slice(0, 10)}.xlsx`

  // Uint8Array вместо Buffer — исправляет ошибку типов TS2345 (Buffer не входит в BodyInit)
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  })
}
