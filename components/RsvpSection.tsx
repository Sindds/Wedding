'use client'

import { motion } from 'motion/react'
import RsvpForm from '@/components/forms/RsvpForm'
import { EASE_OUT } from '@/components/motion/tokens'

export default function RsvpSection() {
  return (
    <section id="rsvp" className="section" aria-labelledby="rsvp-title">
      <div className="container rsvp-layout">
        <motion.div className="rsvp-intro" data-reveal=""
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.7, ease: EASE_OUT }}>
          <p className="eyebrow">Нам очень важно знать</p>
          <h2 id="rsvp-title" className="section-title">Затусите с нами?</h2>
          <p className="rsvp-lead">Расскажите, чем вы желаете напиться в этот день?</p>
          <p className="rsvp-lead rsvp-lead--next">Если не успеете дописать, ответ сохранится: к нему можно вернуться позже.</p>
        </motion.div>
        <motion.div className="panel" data-testid="rsvp-panel" data-reveal=""
          initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.8, delay: 0.1, ease: EASE_OUT }}>
          <RsvpForm />
        </motion.div>
      </div>
    </section>
  )
}
