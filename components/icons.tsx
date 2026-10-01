/**
 * SVG-иконки вместо эмодзи (правило ui-ux-pro-max: «No emojis as icons»).
 * Все декоративные — aria-hidden, цвет наследуют через currentColor.
 */
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 20): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, focusable: false,
})

export const IconCalendar = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
)

export const IconHouse = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9.5h12V10" /><rect x="10" y="13.5" width="4" height="3.5" rx="0.6" /></svg>
)

export const IconCheck = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} strokeWidth={2} {...p}><path d="M5 12.5l4 4 10-10" /></svg>
)

export const IconSparkle = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z" /></svg>
)

export const IconLogout = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" /></svg>
)

export const IconMapPin = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>
)

export const IconCamera = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
)

export const IconArrowUp = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></svg>
)

export const IconChevronDown = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="m6 9 6 6 6-6" /></svg>
)

export const IconAlert = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>
)

export const IconRefresh = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M20 12a8 8 0 1 1-2.35-5.65M20 4v4.5h-4.5" /></svg>
)

export const IconDownload = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
)

export const IconTrash = ({ size, ...p }: IconProps) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></svg>
)

export const Spinner = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="animate-spin">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity=".25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
