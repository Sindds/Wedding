'use client'

import { motion } from 'motion/react'
import StarChart from '@/components/StarChart'
import { EASE_OUT } from '@/components/motion/tokens'
import { WEDDING } from '@/lib/wedding'

/** Имя проявляется по буквам: из размытия в резкость — как звезда, выходящая из дымки. */
function AnimatedName({ text, testId, className, delay }: { text: string; testId: string; className: string; delay: number }) {
  return (
    <motion.span
      data-testid={testId} className={`name ${className}`} aria-hidden="true" data-reveal=""
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.5 }}
    >
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i} className="name-letter" data-reveal=""
          initial={{ opacity: 0, y: '0.3em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.06, duration: 0.9, ease: EASE_OUT }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  )
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.8, ease: EASE_OUT },
})

export default function HeroSection() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <motion.p className="eyebrow" data-reveal="" {...fadeUp(0.2)}>Приглашение на свадьбу</motion.p>

      {/* Заголовок для скринридеров; визуальные крупные имена ниже — декоративные дубли */}
      <h1 id="hero-title" className="sr-only">{WEDDING.partnerA} и {WEDDING.partnerB}</h1>

      {/* Имена вместе, одной строкой над фото; на узком экране перенос только после «Дмитрий» */}
      <p className="names" data-testid="names" aria-hidden="true">
        <AnimatedName text={WEDDING.partnerA} testId="name-a" className="name-a" delay={0.6} />{' '}
        {/* «и Марина» — единый неразрывный блок: у inline-block браузер разрешает перенос даже после неразрывного пробела */}
        <span className="nowrap">
          <motion.span className="names-amp" data-reveal="" {...fadeUp(0.9)}>и</motion.span>{'\u00a0'}
          <AnimatedName text={WEDDING.partnerB} testId="name-b" className="name-b" delay={1.0} />
        </span>
      </p>

      <div className="hero-stage">
        <div className="chart-wrap">
          <StarChart />
          <motion.div
            className="chart-photo" data-testid="chart-photo" data-reveal=""
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 1, ease: EASE_OUT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={WEDDING.photoSrc} alt={WEDDING.photoAlt} width={900} height={900} decoding="async" />
          </motion.div>
        </div>
      </div>

      {/* сначала приглашение (яркий стиль), под ним дата (приглушённый) */}
      <motion.p className="hero-lead" data-reveal="" {...fadeUp(1.6)}>
        Мы приглашаем Вас на наш свадебный тусич, проведите с нами этот день{'\u00a0'}
        <svg data-testid="heart-inline" className="heart-inline" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="currentColor" d="M12 21.2s-7.6-4.7-9.7-9.3C.8 8.5 2.8 4.4 6.6 4.4c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.8 0 5.8 4.1 4.3 7.5-2.1 4.6-9.7 9.3-9.7 9.3z" />
        </svg>
      </motion.p>
      <motion.p className="hero-sub" data-reveal="" {...fadeUp(1.8)}>
        <time dateTime={`${WEDDING.dateISO}T${WEDDING.timeISO}`}>
          <span className="nowrap">{WEDDING.weekday[0].toUpperCase() + WEDDING.weekday.slice(1)}, {WEDDING.dateHuman},</span>{' '}
          <span className="nowrap">начало в {WEDDING.timeISO}</span>
        </time>
      </motion.p>
    </section>
  )
}
