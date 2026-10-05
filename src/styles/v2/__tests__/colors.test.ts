import { readFileSync } from 'node:fs'
import path from 'node:path'

import { colorPrimitives, colorSemantics, generateColorCss, resolveColor } from '../colors'

describe('Figma color foundation', () => {
  it('resolves every mode and keeps semantic aliases intact', () => {
    expect(Object.keys(colorPrimitives)).toHaveLength(77)
    expect(Object.keys(colorSemantics)).toHaveLength(47)
    for (const name of Object.keys(colorSemantics)) {
      for (const mode of ['light', 'dark'] as const) {
        expect(resolveColor(name, mode).primitive).toMatch(/^v2-/)
      }
    }
    expect(colorSemantics.selected).toEqual({
      light: 'interactive-pressed',
      dark: 'interactive-pressed',
    })
    expect(resolveColor('selected', 'light')).toMatchObject({ hex: '#000000', alpha: 0.08 })
    expect(resolveColor('selected', 'dark')).toMatchObject({ hex: '#FFFFFF', alpha: 0.1 })
    expect(resolveColor('action-primary', 'dark').hex).toBe('#0369CC')
    expect(resolveColor('surface', 'dark').hex).toBe('#1A1A1A')
    expect(resolveColor('surface-raised', 'dark').hex).toBe('#232323')
  })

  it('rejects invalid and circular aliases instead of silently producing invalid CSS', () => {
    expect(() => resolveColor('missing', 'light')).toThrow('Unknown color token')
    expect(() =>
      resolveColor('a', 'dark', {
        a: { light: 'v2-white', dark: 'b' },
        b: { light: 'v2-white', dark: 'a' },
      }),
    ).toThrow('Color alias cycle')
  })

  it('ships the current generated CSS and explicitly redeclares aliases for nested themes', () => {
    const css = readFileSync(path.join(__dirname, '../colors.css'), 'utf8')

    expect(css).toBe(generateColorCss())
    expect(css.match(/--color-surface: var\(--color-canvas\)/g)).toHaveLength(2)
    expect(css.match(/--color-selected: var\(--color-interactive-pressed\)/g)).toHaveLength(2)
  })
})
