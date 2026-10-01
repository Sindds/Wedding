import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RsvpForm from '@/components/forms/RsvpForm'

function mockFetchOk(id = 'abc') {
  const fn = vi.fn(async () => new Response(JSON.stringify({ success: true, id }), { status: 201 }))
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('RsvpForm', () => {
  it('раздел про «вторую половинку» удалён полностью', () => {
    render(<RsvpForm />)
    expect(screen.queryByText(/второй половинкой/i)).toBeNull()
    expect(screen.queryByText(/с партнёром/i)).toBeNull()
    expect(screen.queryByText(/один\(а\)/i)).toBeNull()
    expect(screen.queryByText(/не смогу/i)).toBeNull()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('раздела «Пожелания или вопросы» и поля ввода нет', () => {
    render(<RsvpForm />)
    expect(screen.queryByText(/пожелания/i)).toBeNull()
    expect(screen.queryByRole('textbox', { name: /пожелания|вопрос/i })).toBeNull()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('напитки — группа с подписью (fieldset/legend)', () => {
    render(<RsvpForm />)
    expect(screen.getByRole('group', { name: /что предпочитаете пить/i })).toBeInTheDocument()
  })

  it('пустая отправка: ошибки у полей и фокус на первом ошибочном поле', async () => {
    const user = userEvent.setup()
    const fetchFn = mockFetchOk()
    render(<RsvpForm />)
    await user.click(screen.getByRole('button', { name: /отправить ответ/i }))
    expect(await screen.findByText(/введите имя/i)).toBeInTheDocument()
    expect(screen.getByText(/выберите хотя бы один/i)).toBeInTheDocument()
    const nameInput = screen.getByLabelText(/имя и фамилия/i)
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(nameInput).toHaveFocus())
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('«Свой вариант» раскрывает поле ввода', async () => {
    const user = userEvent.setup()
    render(<RsvpForm />)
    expect(screen.queryByLabelText(/ваш вариант напитка/i)).toBeNull()
    await user.click(screen.getByRole('button', { name: /свой вариант/i }))
    expect(await screen.findByLabelText(/ваш вариант напитка/i)).toBeInTheDocument()
  })

  it('успешная отправка: тело без attendance и экран благодарности', async () => {
    const user = userEvent.setup()
    const fetchFn = mockFetchOk()
    render(<RsvpForm />)
    await user.type(screen.getByLabelText(/имя и фамилия/i), 'Иван Петров')
    await user.click(screen.getByRole('button', { name: /шампанское/i }))
    await user.click(screen.getByRole('button', { name: /отправить ответ/i }))
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1))
    const body = JSON.parse((fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).toEqual({ name: 'Иван Петров', drinks: ['champagne'], customDrink: '' })
    expect(await screen.findByText(/спасибо, иван!/i)).toBeInTheDocument()
  })

  it('черновик со старым полем attendance не протаскивает его в запрос', async () => {
    window.localStorage.setItem('wedding_rsvp_draft', JSON.stringify({ name: 'Ольга', attendance: 'yes_partner', drinks: ['beer'] }))
    const user = userEvent.setup()
    const fetchFn = mockFetchOk()
    render(<RsvpForm />)
    await waitFor(() => expect(screen.getByLabelText(/имя и фамилия/i)).toHaveValue('Ольга'))
    await user.click(screen.getByRole('button', { name: /отправить ответ/i }))
    await waitFor(() => expect(fetchFn).toHaveBeenCalled())
    const body = JSON.parse((fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('attendance')
  })

  it('сетевая ошибка показывается и не теряет введённые данные', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    render(<RsvpForm />)
    await user.type(screen.getByLabelText(/имя и фамилия/i), 'Иван')
    await user.click(screen.getByRole('button', { name: /вино/i }))
    await user.click(screen.getByRole('button', { name: /отправить ответ/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/соединени/i)
    expect(screen.getByLabelText(/имя и фамилия/i)).toHaveValue('Иван')
  })
})
