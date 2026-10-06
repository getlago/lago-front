import postcss from 'postcss'

import { v2TailwindColors } from '../tailwindColors'

let css: ReturnType<typeof postcss.parse>

beforeAll(async () => {
  const { readFile } = await import('node:fs/promises')

  css = postcss.parse(await readFile(`${__dirname}/../colors.css`, 'utf8'))
})

const declarationsFor = (selector: string): Record<string, string> => {
  const declarations: Record<string, string> = {}

  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value
    })
  })

  return declarations
}

describe('CSS color foundation', () => {
  it.each(['light', 'dark'])('defines valid aliases and Tailwind mappings in %s mode', (mode) => {
    const primitives = Object.fromEntries(
      Object.entries(declarationsFor(':root')).filter(([name]) => name.startsWith('--v2-')),
    )
    const semantics = declarationsFor(`[data-color-theme='${mode}']`)
    const values = { ...primitives, ...semantics }

    expect(Object.keys(primitives)).toHaveLength(76)
    expect(Object.keys(semantics)).toHaveLength(47)
    expect(Object.keys(v2TailwindColors).sort()).toEqual(
      Object.keys(values)
        .map((name) => name.replace(/^--(?:color-)?/, ''))
        .sort(),
    )
    for (const variable of Object.keys(semantics)) {
      const visited = new Set<string>()
      let current = variable

      while (current.startsWith('--color-')) {
        expect(visited.has(current)).toBe(false)
        if (visited.has(current)) throw new Error(`Circular color alias: ${current}`)
        visited.add(current)
        expect(values[current]).toMatch(/^var\(--[\w-]+\)$/)
        current = values[current].slice(4, -1)
        expect(values).toHaveProperty(current)
      }
      expect(primitives).toHaveProperty(current)
    }
    expect(semantics['--color-selected']).toBe('var(--color-interactive-pressed)')
    expect(semantics['--color-surface']).toBe('var(--color-canvas)')
    expect(semantics['--color-action-primary']).toBe('var(--v2-brand-600)')
  })

  it('redeclares every semantic alias at each local theme boundary', () => {
    expect(Object.keys(declarationsFor("[data-color-theme='light']")).sort()).toEqual(
      Object.keys(declarationsFor("[data-color-theme='dark']")).sort(),
    )
  })
})
