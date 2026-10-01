import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getStorage } from '@/lib/storage'
import { normalizeRsvpPayload, validateRsvpForm } from '@/lib/validation'
import { readJsonBody } from '@/lib/http'
import { LIMITS } from '@/lib/constants'
import type { RsvpEntry, ApiResponse } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  const body = await readJsonBody(req, LIMITS.bodyBytes)
  if (!body.ok) {
    const error = body.status === 413 ? 'Слишком большой ответ' : 'Некорректный формат данных'
    return NextResponse.json({ success: false, error }, { status: body.status })
  }

  const data = normalizeRsvpPayload(body.data)
  const errors = validateRsvpForm(data)
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: errors[0].message }, { status: 422 })
  }

  const entry: RsvpEntry = {
    id:          uuidv4(),
    submittedAt: new Date().toISOString(),
    ...data,
  }

  try {
    await getStorage().addEntry(entry)
    return NextResponse.json({ success: true, id: entry.id }, { status: 201 })
  } catch (err) {
    console.error('[RSVP POST]', err)
    return NextResponse.json({ success: false, error: 'Не удалось сохранить ответ, попробуйте ещё раз' }, { status: 500 })
  }
}
