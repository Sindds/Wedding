import type { Config } from 'tailwindcss'

/** Tailwind ссылается только на семантические токены из app/tokens.css. */
const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs:   '375px',
      sm:   '640px',
      md:   '768px',
      lg:   '1024px',
      xl:   '1280px',
      '2xl':'1536px',
    },
    extend: {
      colors: {
        ink:     { DEFAULT: 'var(--color-ink)', soft: 'var(--color-ink-soft)' },
        accent:  { DEFAULT: 'var(--color-accent)', soft: 'var(--color-accent-soft)' },
        frost:   'var(--color-frost)',
        danger:  'var(--color-danger)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        ui:      ['var(--font-ui)'],
      },
      borderRadius: {
        arch: 'var(--radius-arch)',
        card: 'var(--card-radius)',
      },
    },
  },
  plugins: [],
}

export default config
