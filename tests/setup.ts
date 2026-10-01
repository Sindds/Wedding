import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  try { window.localStorage.clear() } catch {}
})

if (typeof window !== 'undefined') {
  // jsdom не реализует эти API — даём минимальные заглушки
  class IO {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
    constructor(private cb: IntersectionObserverCallback) {}
    observe = (el: Element) => {
      this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver)
    }
    unobserve = () => {}
    disconnect = () => {}
    takeRecords = () => []
  }
  window.IntersectionObserver = IO as unknown as typeof IntersectionObserver
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
  // canvas в jsdom не реализован: компонент снега должен это переживать
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
}
