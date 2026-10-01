'use client'

import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'

/**
 * reducedMotion="user": при системной настройке «Уменьшить движение» Motion не анимирует сдвиги,
 * масштаб и вращение; прозрачность анимирует — получается мягкое проявление без движения.
 * Класс motion-ready на <html> отключает CSS-страховку появления (см. конец globals.css).
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('motion-ready')
  }, [])
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
      {children}
    </MotionConfig>
  )
}
