'use client'

import { motion } from 'motion/react'
import { EASE_OUT } from '@/components/motion/tokens'

/**
 * Небесные часы: 60 минутных делений, звёзды вместо часовых меток, цифры 12/3/6/9 каллиграфией,
 * окошко «16:00». Итоговое положение стрелок (16:00) записано прямо в разметке (transform у внешней группы),
 * анимация лишь докручивает их из 12:00 — поэтому без анимаций часы всё равно показывают 16:00.
 */
const C = 100
const MIN_TICK = (2 * Math.PI * 86) / 60

function Sparkle({ x, y, s }: { x: number; y: number; s: number }) {
  return <path className="clock-star" d={`M${x} ${y - s}L${x + s * 0.28} ${y - s * 0.28}L${x + s} ${y}L${x + s * 0.28} ${y + s * 0.28}L${x} ${y + s}L${x - s * 0.28} ${y + s * 0.28}L${x - s} ${y}L${x - s * 0.28} ${y - s * 0.28}Z`} />
}

export default function CelestialClock() {
  const marks = Array.from({ length: 12 }, (_, i) => {
    const t = ((i * 30 - 90) * Math.PI) / 180
    if (i % 3 === 0) {
      const label = i === 0 ? '12' : String(i)
      return <text key={i} className="clock-num" x={C + 64 * Math.cos(t)} y={C + 64 * Math.sin(t)}>{label}</text>
    }
    return <Sparkle key={i} x={C + 72 * Math.cos(t)} y={C + 72 * Math.sin(t)} s={4.2} />
  })
  const sweep = (from: number) => ({
    initial: { rotate: from }, whileInView: { rotate: 0 }, viewport: { once: true, margin: '-10% 0px' },
    transition: { duration: 2, ease: EASE_OUT }, style: { originX: 0.5, originY: 1 },
  })

  return (
    <div className="clock" data-testid="clock" aria-hidden="true">
      <svg viewBox="0 0 200 200" focusable="false">
        <circle className="clock-face" cx={C} cy={C} r={96} />
        <circle className="clock-ring" cx={C} cy={C} r={90} strokeWidth={1} />
        <circle className="clock-ticks" cx={C} cy={C} r={86} style={{ strokeWidth: 5, strokeDasharray: `0.8 ${MIN_TICK - 0.8}` }} />
        <circle className="clock-inner" cx={C} cy={C} r={42} />
        {marks}
        <rect className="clock-window" x={78} y={126} width={44} height={22} rx={11} />
        <text className="clock-digital" x={C} y={137.5}>16:00</text>

        {/* минутная — на 12 (4 полных оборота при появлении) */}
        <g transform={`rotate(0 ${C} ${C})`}>
          <motion.g className="clock-sweep" {...sweep(-1440)}>
            <path className="clock-hand-min" d="M100 100 L97.4 95 L100 22 L102.6 95 Z" />
            <Sparkle x={100} y={20} s={5} />
          </motion.g>
        </g>
        {/* часовая — на 4, то есть 16:00 */}
        <g transform={`rotate(120 ${C} ${C})`}>
          <motion.g className="clock-sweep" {...sweep(-120)}>
            <path className="clock-hand-hour" d="M100 100 C94 88 94 68 100 50 C106 68 106 88 100 100 Z" />
          </motion.g>
        </g>
        <circle className="clock-jewel" cx={C} cy={C} r={4.5} />
      </svg>
    </div>
  )
}
