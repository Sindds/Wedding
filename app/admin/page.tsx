'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import SpaceBackground from '@/components/sky/SpaceBackground'
import { IconAlert, IconDownload, IconLogout, IconRefresh, IconTrash, Spinner } from '@/components/icons'
import { EASE_OUT } from '@/components/motion/tokens'
import { DRINK_LABELS, drinkLabel } from '@/lib/constants'
import type { AdminStats, ExportCategory, RsvpEntry } from '@/types'

const TOKEN_KEY = 'wedding_admin_token'

/** Текст ошибки из ответа API ({ error }) или запасной вариант. Сервер объясняет причину: нет ADMIN_TOKEN, не подключена база и т. п. */
async function serverError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return typeof body?.error === 'string' && body.error ? body.error : fallback
  } catch {
    return fallback
  }
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function AdminPage() {
  const [token, setToken]       = useState('')
  const [password, setPassword] = useState('')
  const [entries, setEntries]   = useState<RsvpEntry[] | null>(null)
  const [stats, setStats]       = useState<AdminStats | null>(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyExport, setBusy]   = useState<ExportCategory | 'selected' | null>(null)

  const load = useCallback(async (t: string) => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-token': t }, cache: 'no-store' })
      if (res.status === 401) { setError('Неверный пароль'); setToken(''); sessionStorage.removeItem(TOKEN_KEY); return }
      if (!res.ok) { setError(await serverError(res, 'Не удалось загрузить ответы')); return }
      const body = await res.json()
      setEntries(body.entries); setStats(body.stats); setToken(t)
      sessionStorage.setItem(TOKEN_KEY, t)
    } catch {
      setError('Нет соединения с сервером')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY)
    if (saved) load(saved)
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...(entries ?? [])].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    return q ? list.filter((e) => e.name.toLowerCase().includes(q)) : list
  }, [entries, query])

  async function exportXlsx(category: ExportCategory, ids?: string[]) {
    setBusy(ids ? 'selected' : category)
    try {
      const qs = new URLSearchParams({ category })
      if (ids?.length) qs.set('ids', ids.join(','))
      const res = await fetch(`/api/admin/export?${qs}`, { headers: { 'x-admin-token': token } })
      if (!res.ok) { setError('Не удалось сформировать файл'); return }
      const name = res.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]
        ?? `rsvp_${category}_${new Date().toISOString().slice(0, 10)}.xlsx`
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setBusy(null)
    }
  }

  async function removeSelected() {
    if (!selected.size || !window.confirm(`Удалить выбранные ответы (${selected.size})? Это действие нельзя отменить.`)) return
    const res = await fetch('/api/admin', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ ids: [...selected] }),
    })
    if (!res.ok) { setError(await serverError(res, 'Не удалось удалить')); return }
    setSelected(new Set()); load(token)
  }

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY); setToken(''); setEntries(null); setStats(null); setPassword('')
  }

  if (!token || !entries || !stats) {
    return (
      <>
        <SpaceBackground />
        <main className="admin-login">
          <motion.form className="panel admin-login-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }}
            onSubmit={(e) => { e.preventDefault(); if (password) load(password) }}>
            <h1 className="section-title">Ответы гостей</h1>
            <div className="field-group">
              <label htmlFor="admin-pass" className="label">Пароль администратора</label>
              <input id="admin-pass" className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <AnimatePresence initial={false}>
              {error && (
                <motion.p key={error} className="alert" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <IconAlert size={18} /> <span>{error}</span>
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" className="btn btn-block" disabled={loading || !password}>
              {loading ? <><Spinner /> Проверяем…</> : 'Войти'}
            </button>
          </motion.form>
        </main>
      </>
    )
  }

  const drinkRows = Object.entries(stats.drinkCounts).sort((a, b) => b[1] - a[1])

  return (
    <>
      <SpaceBackground />
      <main className="admin">
        <div className="admin-top">
          <h1 className="section-title">Ответы гостей</h1>
          <div className="admin-actions">
            <button type="button" className="btn-quiet" onClick={() => load(token)} disabled={loading}><IconRefresh size={18} /> Обновить</button>
            <button type="button" className="btn-quiet" onClick={logout}><IconLogout size={18} /> Выйти</button>
          </div>
        </div>

        {error && <p className="alert" role="alert"><IconAlert size={18} /> <span>{error}</span></p>}

        <div className="admin-grid">
          <section className="panel" aria-labelledby="stat-title">
            <h2 id="stat-title" className="label">Всего ответов</h2>
            <p className="admin-total" data-testid="stat-total">{stats.total}</p>
            <div className="admin-actions admin-actions--stack">
              <button type="button" className="btn" onClick={() => exportXlsx('all')} disabled={!!busyExport}>
                {busyExport === 'all' ? <Spinner /> : <IconDownload size={18} />} Скачать всё
              </button>
              <button type="button" className="btn-quiet" onClick={() => exportXlsx('guests')} disabled={!!busyExport}><IconDownload size={18} /> Список гостей</button>
              <button type="button" className="btn-quiet" onClick={() => exportXlsx('drinks')} disabled={!!busyExport}><IconDownload size={18} /> Напитки</button>
            </div>
          </section>

          <section className="panel" aria-labelledby="drinks-title">
            <h2 id="drinks-title" className="label">Напитки</h2>
            {drinkRows.length === 0 ? <p className="admin-muted">Пока нет ответов</p> : (
              <ul className="admin-bars">
                {drinkRows.map(([key, n]) => {
                  const pct = stats.total ? Math.round((n / stats.total) * 100) : 0
                  return (
                    <li key={key}>
                      <div className="admin-bar-head"><span>{DRINK_LABELS[key] ?? key}</span><span>{n} · {pct}%</span></div>
                      <div className="admin-bar"><motion.span initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: EASE_OUT }} /></div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="panel" aria-labelledby="list-title">
          <div className="admin-list-head">
            <h2 id="list-title" className="label">Список ({filtered.length})</h2>
            <div className="admin-actions">
              <label htmlFor="admin-search" className="sr-only">Поиск по имени</label>
              <input id="admin-search" className="field admin-search" type="search" placeholder="Поиск…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {selected.size > 0 && (
                <>
                  <button type="button" className="btn-quiet" onClick={() => exportXlsx('all', [...selected])}><IconDownload size={18} /> Выбранные ({selected.size})</button>
                  <button type="button" className="btn-quiet btn-danger" onClick={removeSelected}><IconTrash size={18} /> Удалить</button>
                </>
              )}
            </div>
          </div>
          {filtered.length === 0 ? <p className="admin-muted">Ничего не найдено</p> : (
            <ul className="admin-entries">
              {filtered.map((e) => (
                <li key={e.id} className="admin-entry">
                  <input type="checkbox" id={`sel-${e.id}`} className="admin-check" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  <label htmlFor={`sel-${e.id}`} className="admin-entry-body">
                    <span className="admin-entry-name">{e.name}</span>
                    <span className="admin-muted">{fmtDate(e.submittedAt)}</span>
                    <span>{e.drinks.map((d) => drinkLabel(e, d)).join(', ')}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
