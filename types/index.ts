// ─── RSVP ─────────────────────────────────────────────────────────────

export type DrinkOption =
  | 'wine'
  | 'champagne'
  | 'whiskey'
  | 'vodka'
  | 'beer'
  | 'no_alcohol'
  | 'custom'

export interface RsvpFormData {
  name:        string
  drinks:      DrinkOption[]
  customDrink: string
}

export interface RsvpEntry extends RsvpFormData {
  id:          string
  submittedAt: string
}

// ─── API ──────────────────────────────────────────────────────────────

export interface ApiSuccessResponse { success: true;  id: string }
export interface ApiErrorResponse   { success: false; error: string }
export type ApiResponse = ApiSuccessResponse | ApiErrorResponse

// ─── Admin ────────────────────────────────────────────────────────────

export type ExportCategory = 'all' | 'guests' | 'drinks'

export interface AdminStats {
  total:       number
  drinkCounts: Record<string, number>
}

// ─── UI ───────────────────────────────────────────────────────────────

export interface CheckboxOption {
  value: string
  label: string
}
