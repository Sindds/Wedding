'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DRINK_OPTIONS, LIMITS } from '@/lib/constants'
import { normalizeRsvpPayload, validateRsvpForm, type ValidationError } from '@/lib/validation'
import { clearDraft, loadDraft, saveDraft, saveSubmittedEntry } from '@/lib/localStorage'
import { IconAlert, IconCheck, IconSparkle, Spinner } from '@/components/icons'
import { EASE_OUT, exitTransition } from '@/components/motion/tokens'
import type { DrinkOption, RsvpFormData } from '@/types'

const EMPTY: RsvpFormData = { name: '', drinks: [], customDrink: '' }
type Field = keyof RsvpFormData
type Status = 'idle' | 'sending' | 'done'

const errorMotion = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: EASE_OUT } },
  exit:    { opacity: 0, height: 0, transition: exitTransition },
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p key={message} id={id} className="error-text" {...errorMotion}>
          <IconAlert /> <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}

export default function RsvpForm() {
  const [data, setData]       = useState<RsvpFormData>(EMPTY)
  const [errors, setErrors]   = useState<Partial<Record<Field, string>>>({})
  const [status, setStatus]   = useState<Status>('idle')
  const [netError, setNetErr] = useState('')
  const [guestName, setGuest] = useState('')
  const loaded = useRef(false)

  const nameRef   = useRef<HTMLInputElement>(null)
  const drinksRef = useRef<HTMLButtonElement>(null)
  const customRef = useRef<HTMLInputElement>(null)

  // Черновик: читаем один раз и пропускаем через нормализацию — так старое поле attendance отбрасывается
  useEffect(() => {
    const draft = loadDraft()
    if (draft) setData(normalizeRsvpPayload(draft))
    loaded.current = true
  }, [])

  useEffect(() => {
    if (loaded.current && status === 'idle') saveDraft(data)
  }, [data, status])

  const errorOf = (list: ValidationError[]) =>
    Object.fromEntries(list.filter((e) => e.field !== 'submit').map((e) => [e.field, e.message])) as Partial<Record<Field, string>>

  function update<K extends Field>(key: K, value: RsvpFormData[K]) {
    setData((d) => ({ ...d, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validateField(key: Field) {
    const msg = errorOf(validateRsvpForm(data))[key]
    setErrors((e) => ({ ...e, [key]: msg }))
  }

  function toggleDrink(value: DrinkOption) {
    const drinks = data.drinks.includes(value) ? data.drinks.filter((d) => d !== value) : [...data.drinks, value]
    setData((d) => ({ ...d, drinks, customDrink: drinks.includes('custom') ? d.customDrink : '' }))
    setErrors((e) => ({ ...e, drinks: undefined, customDrink: undefined }))
  }

  function focusFirstError(errs: Partial<Record<Field, string>>) {
    const order: Array<[Field, { current: HTMLElement | null }]> = [
      ['name', nameRef], ['drinks', drinksRef], ['customDrink', customRef],
    ]
    const first = order.find(([f]) => errs[f])
    const el = first?.[1].current
    if (el) {
      el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      el.focus({ preventScroll: true })
    }
  }

  async function send(payload: RsvpFormData, attempt = 1): Promise<Response> {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status >= 500 && attempt < 2) return send(payload, attempt + 1)
    return res
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setNetErr('')
    const payload = normalizeRsvpPayload(data)
    const errs = errorOf(validateRsvpForm(payload))
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) {
      focusFirstError(errs)
      return
    }
    setStatus('sending')
    try {
      const res = await send(payload)
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.success) {
        setNetErr(body.error || 'Не удалось отправить ответ. Попробуйте ещё раз.')
        setStatus('idle')
        return
      }
      saveSubmittedEntry({ id: body.id, submittedAt: new Date().toISOString(), name: payload.name })
      clearDraft()
      setGuest(payload.name.split(/\s+/)[0])
      setStatus('done')
    } catch {
      setNetErr('Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз — введённые данные сохранены.')
      setStatus('idle')
    }
  }

  function reset() {
    setData(EMPTY); setErrors({}); setStatus('idle')
  }

  const describe = (id: string, has?: string) => (has ? id : undefined)

  return (
    <AnimatePresence mode="wait" initial={false}>
      {status === 'done' ? (
        <motion.div key="done" className="success" role="status"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } }}>
          <motion.span initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
            style={{ color: 'var(--color-accent)' }}>
            <IconSparkle size={44} />
          </motion.span>
          <p className="success-title">Спасибо, {guestName}!</p>
          <p>Ваш ответ получен. Ждём встречи 12 декабря.</p>
          <button type="button" className="btn-quiet" onClick={reset}>Отправить ещё один ответ</button>
        </motion.div>
      ) : (
        <motion.form key="form" className="form" noValidate onSubmit={onSubmit} exit={{ opacity: 0, y: -8, transition: exitTransition }}>
          <div className="field-group">
            <label htmlFor="guest-name" className="label">Ваше имя и фамилия</label>
            <input
              ref={nameRef} id="guest-name" className="field" type="text" autoComplete="name"
              placeholder="Пиван Пиванов" maxLength={LIMITS.name} value={data.name}
              aria-invalid={errors.name ? 'true' : 'false'} aria-describedby={describe('guest-name-error', errors.name)}
              onChange={(e) => update('name', e.target.value)} onBlur={() => data.name && validateField('name')}
            />
            <FieldError id="guest-name-error" message={errors.name} />
          </div>

          <fieldset className="field-group" aria-describedby={describe('drinks-error', errors.drinks)}>
            <legend className="label">Что предпочитаете пить?</legend>
            <div className="chips">
              {DRINK_OPTIONS.map((opt, i) => {
                const on = data.drinks.includes(opt.value)
                return (
                  <motion.button
                    key={opt.value} ref={i === 0 ? drinksRef : undefined} type="button" className="chip" data-value={opt.value}
                    aria-pressed={on} onClick={() => toggleDrink(opt.value)}
                    whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.span key="check" style={{ display: 'inline-flex' }}
                          initial={{ width: 0, opacity: 0 }} animate={{ width: 16, opacity: 1 }} exit={{ width: 0, opacity: 0 }}>
                          <IconCheck />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {opt.label}
                  </motion.button>
                )
              })}
            </div>
            <FieldError id="drinks-error" message={errors.drinks} />
          </fieldset>

          <AnimatePresence initial={false}>
            {data.drinks.includes('custom') && (
              <motion.div key="custom" className="field-group" style={{ overflow: 'hidden' }}
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0, transition: exitTransition }}
                transition={{ duration: 0.3, ease: EASE_OUT }}>
                <label htmlFor="guest-custom" className="label">Ваш вариант напитка</label>
                <input
                  ref={customRef} id="guest-custom" className="field" type="text" placeholder="Например, морс"
                  maxLength={LIMITS.customDrink} value={data.customDrink}
                  aria-invalid={errors.customDrink ? 'true' : 'false'} aria-describedby={describe('guest-custom-error', errors.customDrink)}
                  onChange={(e) => update('customDrink', e.target.value)}
                />
                <FieldError id="guest-custom-error" message={errors.customDrink} />
              </motion.div>
            )}
          </AnimatePresence>


          <AnimatePresence initial={false}>
            {netError && (
              <motion.div key="net" className="alert" role="alert" {...errorMotion}>
                <IconAlert size={18} /> <span>{netError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button type="submit" className="btn btn-block" disabled={status === 'sending'} whileTap={{ scale: 0.98 }}>
            {status === 'sending' ? (<><Spinner /> Отправляем…</>) : 'Отправить ответ'}
          </motion.button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
