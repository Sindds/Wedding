/** Общие motion-токены: одна «ритмика» для всего сайта. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN  = [0.55, 0, 1, 0.45] as const

export const DURATION = {
  fast:  0.16,
  base:  0.28,
  slow:  0.6,
  hero:  1.1,
} as const

/** Выход быстрее входа (~65%) — правило exit-faster-than-enter. */
export const exitTransition = { duration: DURATION.base * 0.65, ease: EASE_IN }

export const springSoft  = { type: 'spring', stiffness: 170, damping: 26 } as const
export const springSnap  = { type: 'spring', stiffness: 420, damping: 32 } as const
