import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import HomePage from '@/app/page'

describe('Главная страница', () => {
  it('R1: хэдера нет совсем (ни header, ни роли banner, ни навигации)', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('header')).toBeNull()
    expect(screen.queryByRole('banner')).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('R2: раздела подарков и фразы про цветы нет', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('#gifts')).toBeNull()
    expect(container.textContent).not.toMatch(/подарк/i)
    expect(container.textContent).not.toMatch(/вместо цветов/i)
  })

  it('R3: нет упоминания «второй половинки»', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toMatch(/второй половинк/i)
  })

  it('секции идут в порядке: приглашение → детали → ответ', () => {
    const { container } = render(<HomePage />)
    const ids = Array.from(container.querySelectorAll('main > section[id]')).map((s) => s.id)
    expect(ids).toEqual(['hero', 'details', 'rsvp'])
  })

  it('все id уникальны', () => {
    const { container } = render(<HomePage />)
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('h1 содержит оба имени, каждое — отдельный измеряемый элемент (для R4)', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Дмитрий.*Марина/)
    expect(screen.getByTestId('name-a')).toHaveTextContent('Дмитрий')
    expect(screen.getByTestId('name-b')).toHaveTextContent('Марина')
  })

  it('дата и время на месте', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).toMatch(/12 декабря 2026/)
    expect(container.textContent).toMatch(/16:00/)
  })

  it('карта неба и космический фон декоративны (скрыты от скринридера), фото подписано', () => {
    render(<HomePage />)
    expect(screen.getByTestId('star-chart')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('sky')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('img', { name: /фото/i })).toBeInTheDocument()
  })

  it('без эмодзи в роли иконок', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u)
  })

  it('R13: в центре карты — настоящее фото пары', () => {
    render(<HomePage />)
    const img = screen.getByRole('img', { name: /фото/i })
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toMatch(/photo\.webp/)
  })

  it('R16: календарь декабря 2026 — 31 день, начинается со вторника, 12-е в сердце', () => {
    render(<HomePage />)
    const cal = screen.getByTestId('calendar')
    const days = cal.querySelectorAll('[data-day]')
    expect(days).toHaveLength(31)
    expect(cal.querySelectorAll('[data-empty]')).toHaveLength(1) // пн пустой, 1-е — вторник
    const heart = cal.querySelector('[data-day="12"]')!
    expect(heart).toHaveAttribute('data-heart')
    expect(heart.textContent).toContain('12')
    expect(within(cal.closest('.detail') as HTMLElement).getByText(/суббота, 12 декабря 2026/i)).toBeInTheDocument()
  })

  it('R17: без значков в подписях, место под фото дома, адрес и ссылка на карту', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelectorAll('.detail-label svg')).toHaveLength(0)
    expect(screen.getByTestId('house-photo')).toBeInTheDocument()
    expect(container.textContent).toMatch(/Саратов, ул\. Волновая, 18/)
    expect(container.textContent).not.toMatch(/адрес пришлём/i)
    const link = screen.getByRole('link', { name: /открыть на карте/i })
    expect(link.getAttribute('href')).toContain('yandex.ru/maps')
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Волновая')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('R18: часы и подпись «Начало мероприятия в 16:00»', () => {
    render(<HomePage />)
    expect(screen.getByTestId('clock')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Начало мероприятия в 16:00')).toBeInTheDocument()
  })

  it('R19: у блока ответа человеческое название', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toMatch(/подтвердите присутствие/i)
    expect(screen.getByRole('heading', { level: 2, name: /будете с нами/i })).toBeInTheDocument()
  })

  it('R20: в космосе есть падающие звёзды и вращающееся небо', () => {
    render(<HomePage />)
    expect(screen.getAllByTestId('meteor').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByTestId('sky').querySelector('.sky-rotor')).not.toBeNull()
  })

  it('имена вместе, одним блоком НАД фото', () => {
    render(<HomePage />)
    const names = screen.getByTestId('names')
    expect(names).toContainElement(screen.getByTestId('name-a'))
    expect(names).toContainElement(screen.getByTestId('name-b'))
    expect(names.textContent).toMatch(/Дмитрий\s*и\s*Марина/)
    const chart = screen.getByTestId('star-chart')
    expect(names.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(document.querySelector('.name-amp')).toBeNull()
  })

  it('новый текст приглашения с сердечком', () => {
    const { container } = render(<HomePage />)
    expect(screen.getByText('Мы приглашаем Вас на наш свадебный тусич, проведите с нами этот день', { exact: false })).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/мы счастливы пригласить/i)
    expect(screen.getByTestId('heart-inline')).toHaveAttribute('aria-hidden', 'true')
  })

  it('пояснение к форме — две строки', () => {
    render(<HomePage />)
    expect(screen.getByText('Расскажите, что вы любите пить, — и мы подготовим всё к вашему приходу.').tagName).toBe('P')
    expect(screen.getByText('Если не успеете дописать, ответ сохранится: к нему можно вернуться позже.').tagName).toBe('P')
  })

  it('раздела пожеланий нет на странице', () => {
    const { container } = render(<HomePage />)
    expect(container.textContent).not.toMatch(/пожелания/i)
    expect(container.querySelector('textarea, #guest-wishes')).toBeNull()
  })

  it('внизу — «Приходите к нам в отличном настроении!»', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('footer')).toHaveTextContent('Приходите к нам в отличном настроении!')
  })

  it('в рамке — фото дома', () => {
    render(<HomePage />)
    const img = screen.getByTestId('house-photo').querySelector('img')!
    expect(img.getAttribute('src')).toMatch(/house\.webp/)
    expect(img.getAttribute('alt')).toMatch(/дом/i)
  })

  it('в первом экране сначала приглашение, потом дата', () => {
    render(<HomePage />)
    const invite = screen.getByText(/Мы приглашаем Вас на наш свадебный тусич/).closest('p')!
    const date = screen.getByText(/начало в 16:00/).closest('p')!
    expect(invite).not.toBe(date)
    expect(invite.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // обе фразы — под фото
    expect(screen.getByTestId('star-chart').compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('у фото — созвездия Водолея (слева) и Тельца (справа), без значков зодиака', () => {
    const { container } = render(<HomePage />)
    const aqr = container.querySelector('[data-constellation="aquarius"]')!
    const tau = container.querySelector('[data-constellation="taurus"]')!
    expect(aqr.querySelectorAll('.chart-star')).toHaveLength(15)
    expect(tau.querySelectorAll('.chart-star').length).toBeGreaterThanOrEqual(12 + 6) // фигура + Плеяды
    expect(aqr.querySelectorAll('.chart-line').length).toBeGreaterThanOrEqual(14)
    expect(container.innerHTML).not.toMatch(/[\u2648-\u2653]/) // ♈…♓ — знаков зодиака нет
  })
})
