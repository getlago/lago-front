import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import { Config } from 'tailwindcss/types/config'

import config from '../../../../tailwind.config'
import { v2TailwindColors } from '../tailwindColors'

const compile = async (colors: Config['theme'], content: string): Promise<string> => {
  const result = await postcss([
    tailwindcss({ ...config, theme: colors, content: [{ raw: content, extension: 'html' }] }),
  ]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined })

  return result.css
}

describe('legacy color isolation', () => {
  it('keeps legacy utility declarations and base rules unchanged when adding the foundation', async () => {
    const legacyColors = Object.fromEntries(
      Object.entries(config.theme?.extend?.colors ?? {}).filter(
        ([name]) => !(name in v2TailwindColors),
      ),
    )
    const legacyTheme = {
      ...config.theme,
      extend: {
        ...config.theme?.extend,
        colors: {
          ...legacyColors,
          destructive: {
            DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
            foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
          },
        },
      },
    }
    const candidates = [
      'bg-white',
      'bg-blue',
      'bg-blue-600',
      'text-green-600',
      'bg-red-100',
      'text-grey-600',
      'border-grey-300',
      'hover:bg-grey-100',
      'focus:ring-blue-600',
      'bg-primary',
      'text-primary-foreground',
      'bg-secondary',
      'bg-accent',
      'border-input',
      'border-border',
      'ring',
      'ring-ring',
      'bg-background',
    ].join(' ')
    const before = await compile(legacyTheme, candidates)
    const after = await compile(config.theme, candidates)

    expect(after).toBe(before)
    expect(after).toContain('.bg-blue-600')
    expect(after).toContain('.text-grey-600')
  })

  it('generates distinct primitive and semantic utilities without flattening alpha', async () => {
    const css = await compile(
      config.theme,
      'bg-v2-green-600 bg-green-600 bg-selected text-text-default border-border-default',
    )

    expect(css).toContain('background-color: var(--v2-green-600)')
    expect(css).toContain('background-color: var(--color-selected)')
    expect(css).toContain('color: var(--color-text-default)')
    expect(css).toContain('border-color: var(--color-border-default)')
  })

  it.each([
    ['bg-action-primary/50', 'background-color', '--color-action-primary', '0.5'],
    ['bg-interactive-hover/50', 'background-color', '--color-interactive-hover', '0.5'],
    ['bg-selected/50', 'background-color', '--color-selected', '0.5'],
    ['text-text-default/50', 'color', '--color-text-default', '0.5'],
    ['border-border-subtle/50', 'border-color', '--color-border-subtle', '0.5'],
    ['bg-interactive-hover/0', 'background-color', '--color-interactive-hover', '0'],
    ['bg-interactive-hover/100', 'background-color', '--color-interactive-hover', '1'],
    ['bg-interactive-hover/[0.25]', 'background-color', '--color-interactive-hover', '0.25'],
    ['bg-v2-alpha-black-04/50', 'background-color', '--v2-alpha-black-04', '0.5'],
  ])('generates multiplicative opacity for %s', async (candidate, property, variable, alpha) => {
    const css = await compile(config.theme, candidate)
    const values: string[] = []

    postcss.parse(css).walkDecls(property, (declaration) => {
      values.push(declaration.value)
    })

    expect(values).toContain(
      `color-mix(in srgb, var(${variable}) calc(${alpha} * 100%), transparent)`,
    )
  })
})
