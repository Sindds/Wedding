'use client'

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/**
 * Космос в несколько слоёв (как в Star Walk 2):
 *  • дальний — Млечный Путь (WebP), медленно «дышит» яркостью;
 *  • ближний — звёздное небо, делает полный оборот за 10 минут;
 *  • яркие звёзды с лучами мерцают каждая в своём ритме;
 *  • изредка пролетают падающие звёзды.
 * Прокрутка и курсор (на компьютере) дают параллакс: ближний слой смещается сильнее дальнего.
 * При «уменьшить движение» всё неподвижно (см. globals.css).
 */
const GLINTS: Array<{ x: number; y: number; warm?: boolean; tw: number; d: number }> = [
  { x: 12, y: 9, tw: 3.1, d: 0 },    { x: 86, y: 7, tw: 4.2, d: 1.3 },  { x: 70, y: 22, warm: true, tw: 3.6, d: 0.6 },
  { x: 6, y: 38, tw: 5.0, d: 2.2 },  { x: 93, y: 44, tw: 2.8, d: 0.9 }, { x: 24, y: 58, warm: true, tw: 4.6, d: 1.8 },
  { x: 62, y: 66, tw: 3.3, d: 2.9 }, { x: 88, y: 79, warm: true, tw: 3.9, d: 0.3 }, { x: 16, y: 86, tw: 4.4, d: 1.1 },
  { x: 47, y: 93, tw: 3.0, d: 2.5 }, { x: 38, y: 16, tw: 5.2, d: 3.4 }, { x: 55, y: 48, tw: 4.0, d: 0.7 },
]
const METEORS = [
  { x: '82%', y: '6%',  angle: '-35deg', dur: '11s', delay: '2s' },
  { x: '95%', y: '30%', angle: '-28deg', dur: '17s', delay: '7s' },
  { x: '60%', y: '2%',  angle: '-42deg', dur: '23s', delay: '13s' },
  { x: '100%', y: '55%', angle: '-32deg', dur: '29s', delay: '19s' },
]

export default function SpaceBackground() {
  const reduce = useReducedMotion()
  const sky = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const farY = useTransform(scrollYProgress, [0, 1], ['0%', '-5%'])
  const nearY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])

  useEffect(() => {
    if (reduce || !window.matchMedia('(pointer: fine)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const el = sky.current
        if (!el) return
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [reduce])

  return (
    <div ref={sky} className="sky" data-testid="sky" aria-hidden="true">
      <div className="sky-far">
        <motion.div className="sky-milky" style={{ y: reduce ? 0 : farY }} />
      </div>
      <div className="sky-near">
        <motion.div style={{ position: 'absolute', inset: 0, y: reduce ? 0 : nearY }}>
          <div className="sky-rotor" />
        </motion.div>
        <div className="sky-stars-2" />
        {GLINTS.map((g, i) => (
          <span key={i} className={g.warm ? 'glint glint--warm' : 'glint'}
            style={{ left: `${g.x}%`, top: `${g.y}%`, ['--tw' as string]: `${g.tw}s`, ['--tw-delay' as string]: `${g.d}s` }} />
        ))}
      </div>
      {METEORS.map((m, i) => (
        <span key={i} className="meteor" data-testid="meteor"
          style={{ ['--x' as string]: m.x, ['--y' as string]: m.y, ['--angle' as string]: m.angle, ['--dur' as string]: m.dur, ['--delay' as string]: m.delay }} />
      ))}
    </div>
  )
}
