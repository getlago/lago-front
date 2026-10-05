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
})
