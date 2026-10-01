import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import MotionProvider from '@/components/motion/MotionProvider'
import { THEME_COLOR } from '@/lib/theme'
import { WEDDING } from '@/lib/wedding'
import './globals.css'

/*
 * Каллиграфические шрифты подключены локально (урезаны до латиницы и кириллицы, ~139 КБ):
 * Great Vibes — имена и заголовки, Bad Script — остальной текст. Лицензия SIL OFL — app/fonts.
 */
const greatVibes = localFont({
  src: [{ path: './fonts/GreatVibes-Regular.woff2', weight: '400', style: 'normal' }],
  variable: '--font-great-vibes',
  display:  'swap',
  fallback: ['Segoe Script', 'cursive'],
})

const badScript = localFont({
  src: [{ path: './fonts/BadScript-Regular.woff2', weight: '400', style: 'normal' }],
  variable: '--font-bad-script',
  display:  'swap',
  fallback: ['Segoe Print', 'cursive'],
})

const NOSCRIPT_CSS = '[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}' +
  '.chart-line{stroke-dasharray:none!important;stroke-dashoffset:0!important}.chart-line--dash{stroke-dasharray:4 6!important}' +
  '.clock-sweep{transform:none!important}'

const couple = `${WEDDING.partnerA} и ${WEDDING.partnerB}`

export const metadata: Metadata = {
  title:       `${couple} — свадьба ${WEDDING.dateHuman}`,
  description: `Приглашение на свадьбу: ${WEDDING.dateHuman}, начало в ${WEDDING.timeISO}.`,
  openGraph:   { title: `${couple} — ${WEDDING.dateHuman}`, description: 'Вы приглашены на нашу свадьбу', type: 'website' },
  robots:      { index: false, follow: false },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  viewportFit:  'cover',
  themeColor:   THEME_COLOR,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${greatVibes.variable} ${badScript.variable}`}>
      <head>
        {/* Без JavaScript анимации не запустятся — показываем всё сразу в конечном состоянии */}
        <noscript>
          <style>{NOSCRIPT_CSS}</style>
        </noscript>
      </head>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
