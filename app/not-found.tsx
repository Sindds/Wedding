import Link from 'next/link'
import SpaceBackground from '@/components/sky/SpaceBackground'

export default function NotFound() {
  return (
    <>
      <SpaceBackground />
      <main className="status-page">
        <p className="eyebrow">Ошибка 404</p>
        <h1 className="status-title">Такой страницы нет на нашей карте</h1>
        <p className="status-text">Возможно, ссылка устарела. Приглашение ждёт вас на главной.</p>
        <Link href="/" className="btn">К приглашению</Link>
      </main>
    </>
  )
}
