'use client'

import SpaceBackground from '@/components/sky/SpaceBackground'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <SpaceBackground />
      <main className="status-page">
        <p className="eyebrow">Что-то пошло не так</p>
        <h1 className="status-title">Звёзды на минутку погасли</h1>
        <p className="status-text">Попробуйте обновить страницу — обычно этого достаточно.</p>
        <button type="button" className="btn" onClick={reset}>Попробовать снова</button>
      </main>
    </>
  )
}
