// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Та же проверка, что делает validate-tokens.cjs из скилла ui-ux-pro-max:design-system:
// в компонентах не должно быть захардкоженных цветов — только токены из app/tokens.css
const ROOTS = ['components', 'app']
const HEX = /#(?:[0-9a-fA-F]{3}){1,2}\b/g
const RGB = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/gi

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return d.name === 'fonts' ? [] : walk(p)
    return /\.(tsx?|css)$/.test(d.name) && d.name !== 'tokens.css' ? [p] : []
  })
}

describe('Дизайн-токены', () => {
  it('в components/ и app/ нет сырых hex/rgb-цветов', () => {
    const offenders: string[] = []
    for (const root of ROOTS) {
      for (const file of walk(path.resolve(root))) {
        const src = fs.readFileSync(file, 'utf-8')
        const found = [...(src.match(HEX) ?? []), ...(src.match(RGB) ?? [])]
        if (found.length) offenders.push(`${path.relative(process.cwd(), file)}: ${found.join(', ')}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('tokens.css содержит три слоя: primitive → semantic → component', () => {
    const css = fs.readFileSync(path.resolve('app/tokens.css'), 'utf-8')
    expect(css).toMatch(/--space-\d+:/)
    expect(css).toMatch(/--color-text:\s*var\(--/)
    expect(css).toMatch(/--button-bg:\s*var\(--/)
  })

  it('R14: каллиграфия — Great Vibes для заголовков, Bad Script для текста', () => {
    const css = fs.readFileSync(path.resolve('app/tokens.css'), 'utf-8')
    expect(css).toMatch(/--font-display:\s*var\(--font-great-vibes\)/)
    expect(css).toMatch(/--font-ui:\s*var\(--font-bad-script\)/)
    const layout = fs.readFileSync(path.resolve('app/layout.tsx'), 'utf-8')
    expect(layout).toMatch(/GreatVibes-Regular\.woff2/)
    expect(layout).toMatch(/BadScript-Regular\.woff2/)
  })
})
