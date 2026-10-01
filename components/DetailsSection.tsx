'use client'

import { motion, type Variants } from 'motion/react'
import Calendar from '@/components/details/Calendar'
import CelestialClock from '@/components/details/CelestialClock'
import { IconCamera, IconMapPin } from '@/components/icons'
import { EASE_OUT } from '@/components/motion/tokens'
import { WEDDING } from '@/lib/wedding'

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.8, ease: EASE_OUT } }),
}
const reveal = (i: number) => ({ variants: item, custom: i, initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-10% 0px' }, 'data-reveal': '' })

export default function DetailsSection() {
  const weekday = WEDDING.weekday[0].toUpperCase() + WEDDING.weekday.slice(1)
  return (
    <section id="details" className="section" aria-labelledby="details-title">
      <div className="container">
        <motion.h2 id="details-title" className="section-title" data-reveal=""
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.7, ease: EASE_OUT }}>
          Когда и где
        </motion.h2>
        <dl className="details-list">
          <motion.div className="detail" {...reveal(0)}>
            <dt className="detail-label">Дата</dt>
            <dd><Calendar /></dd>
            <dd className="detail-value">{weekday}, {WEDDING.dateHuman}</dd>
          </motion.div>

          <motion.div className="detail" {...reveal(1)}>
            <dt className="detail-label">Место</dt>
            <dd className="house-photo" data-testid="house-photo">
              {WEDDING.housePhotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={WEDDING.housePhotoSrc} alt={WEDDING.housePhotoAlt} width={WEDDING.housePhotoWidth} height={WEDDING.housePhotoHeight} loading="lazy" decoding="async" />
              ) : (
                <><IconCamera size={30} /><span>Здесь будет фото дома</span></>
              )}
            </dd>
            <dd className="detail-value">{WEDDING.venue}</dd>
            <dd className="detail-sub">{WEDDING.address}</dd>
            <dd>
              <a className="map-link" href={WEDDING.mapUrl} target="_blank" rel="noopener noreferrer">
                <IconMapPin size={18} /> Открыть на карте
              </a>
            </dd>
          </motion.div>

          <motion.div className="detail" {...reveal(2)}>
            <dt className="detail-label">Начало</dt>
            <dd><CelestialClock /></dd>
            <dd className="detail-value">Начало мероприятия в {WEDDING.timeISO}</dd>
          </motion.div>
        </dl>
      </div>
    </section>
  )
}
