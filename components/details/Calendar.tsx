import { WEDDING } from '@/lib/wedding'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

/** Календарь месяца свадьбы; день торжества — в красном сердце с цифрой внутри. */
export default function Calendar() {
  const { year, monthIndex, day } = WEDDING
  const lead = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7 // неделя с понедельника
  const total = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()

  return (
    <div className="calendar" data-testid="calendar" aria-hidden="true">
      <p className="cal-month">{WEDDING.monthName}</p>
      <p className="cal-year">{year}</p>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => <span key={w} className="cal-wd">{w}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`e${i}`} className="cal-day" data-empty="" />)}
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1
          const weekend = (lead + i) % 7 >= 5
          if (n === day) {
            return (
              <span key={n} className="cal-day" data-day={n} data-heart="">
                <svg className="cal-heart-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M12 21.2s-7.6-4.7-9.7-9.3C.8 8.5 2.8 4.4 6.6 4.4c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.8 0 5.8 4.1 4.3 7.5-2.1 4.6-9.7 9.3-9.7 9.3z" />
                </svg>
                <span className="cal-heart-num">{n}</span>
              </span>
            )
          }
          return <span key={n} className={weekend ? 'cal-day cal-day--weekend' : 'cal-day'} data-day={n}>{n}</span>
        })}
      </div>
    </div>
  )
}
