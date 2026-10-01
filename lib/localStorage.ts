import type { RsvpFormData, RsvpEntry } from '@/types'

const DRAFT_KEY     = 'wedding_rsvp_draft'
const SUBMITTED_KEY = 'wedding_rsvp_submitted'

export function saveDraft(data: Partial<RsvpFormData>): void {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch {}
}

export function loadDraft(): Partial<RsvpFormData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}

export function saveSubmittedEntry(e: Pick<RsvpEntry, 'id' | 'submittedAt' | 'name'>): void {
  try { localStorage.setItem(SUBMITTED_KEY, JSON.stringify(e)) } catch {}
}

export function loadSubmittedEntry(): Pick<RsvpEntry, 'id' | 'submittedAt' | 'name'> | null {
  try {
    const raw = localStorage.getItem(SUBMITTED_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
