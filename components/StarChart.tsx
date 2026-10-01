'use client'

import { motion, type Variants } from 'motion/react'
import { EASE_OUT } from '@/components/motion/tokens'
import { AQUARIUS, TAURUS, CHART, FIELD_STARS, layoutConstellation } from '@/components/chart/constellations'

/**
 * Карта неба в стиле старинного атласа. В центре — фото пары (половина диаметра карты).
 * Слева, у Марины, — созвездие Водолея, справа, у Дмитрия, — созвездие Тельца: настоящие звёзды
 * и линии фигур из каталога (см. components/chart/constellations.ts). Пунктир ведёт от каждой фигуры к фото.
 */
const C = CHART.c
export const PHOTO_R = CHART.photoR
const TICKS_SMALL = (2 * Math.PI * 300) / 72
const TICKS_BIG   = (2 * Math.PI * 300) / 12

const FIGURES = [layoutConstellation(AQUARIUS), layoutConstellation(TAURUS)]

const ring: Variants = {
  hidden: { opacity: 0, rotate: -14, scale: 0.94 },
  show:   { opacity: 1, rotate: 0, scale: 1, transition: { duration: 1.8, ease: EASE_OUT } },
}
const star: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show:   (i: number) => ({ opacity: 1, scale: 1, transition: { delay: 0.6 + i * 0.035, type: 'spring', stiffness: 260, damping: 18 } }),
}
const line: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show:   (i: number) => ({ pathLength: 1, opacity: 1, transition: { delay: 1.3 + i * 0.07, duration: 0.6, ease: EASE_OUT } }),
}

function Star({ x, y, size, warm, i }: { x: number; y: number; size: number; warm: boolean; i: number }) {
  return (
    <motion.g className="chart-star-g" variants={star} custom={i} initial="hidden" animate="show" data-reveal="">
      <circle className={warm ? 'chart-star-glow chart-star-glow--warm' : 'chart-star-glow'} cx={x} cy={y} r={size * 2.2} filter="url(#chart-glow)" />
      <circle className={warm ? 'chart-star chart-star--warm' : 'chart-star'} cx={x} cy={y} r={size} />
    </motion.g>
  )
}

export default function StarChart() {
  let starIndex = 0
  let lineIndex = 0
  return (
    <svg data-testid="star-chart" className="chart-svg" viewBox="0 0 640 640" aria-hidden="true" focusable="false">
      <defs>
        <filter id="chart-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" /></filter>
        <path id="chart-ring" d="M 52,320 A 268,268 0 1,1 588,320 A 268,268 0 1,1 52,320" />
      </defs>

      <motion.g className="chart-ring" variants={ring} initial="hidden" animate="show" data-reveal="">
        <circle className="chart-grid" cx={C} cy={C} r={304} />
        <circle className="chart-grid chart-grid--soft" cx={C} cy={C} r={296} />
        <circle className="chart-tick" cx={C} cy={C} r={300} style={{ strokeWidth: 8, strokeDasharray: `1.4 ${TICKS_SMALL - 1.4}` }} />
        <circle className="chart-tick chart-tick--big" cx={C} cy={C} r={300} style={{ strokeWidth: 18, strokeDasharray: `1.8 ${TICKS_BIG - 1.8}` }} />
        <circle className="chart-grid chart-grid--dash" cx={C} cy={C} r={250} />
        <circle className="chart-grid chart-grid--dash" cx={C} cy={C} r={200} />
        {Array.from({ length: 12 }, (_, i) => {
          const t = (i * Math.PI) / 6
          return <line key={i} className="chart-meridian" x1={C + 178 * Math.cos(t)} y1={C + 178 * Math.sin(t)} x2={C + 288 * Math.cos(t)} y2={C + 288 * Math.sin(t)} />
        })}
        <ellipse className="chart-ecliptic" cx={C} cy={C} rx={286} ry={112} transform={`rotate(-18 ${C} ${C})`} />
        <text className="chart-ring-text"><textPath href="#chart-ring" startOffset="25%">двенадцатое декабря две тысячи двадцать шестого года</textPath></text>
      </motion.g>

      {FIELD_STARS.map(([x, y], i) => <Star key={`f${i}`} x={x} y={y} size={1.6} warm={false} i={starIndex++} />)}

      {FIGURES.map((f) => (
        <g key={f.id} data-constellation={f.id}>
          {f.lines.map((l) => (
            <motion.line key={l.key} className="chart-line" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              variants={line} custom={lineIndex++} initial="hidden" animate="show" data-reveal="" />
          ))}
          <motion.line className="chart-line chart-line--dash" x1={f.connector.x1} y1={f.connector.y1} x2={f.connector.x2} y2={f.connector.y2}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 0.8 }} data-reveal="" />
          {[...f.stars, ...f.extras].map((s) => <Star key={s.id} x={s.x} y={s.y} size={s.size} warm={s.warm} i={starIndex++} />)}
        </g>
      ))}

      <motion.circle className="chart-moon-halo" cx={C} cy={C} r={CHART.haloR}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1.2 }} data-reveal="" />
    </svg>
  )
}
