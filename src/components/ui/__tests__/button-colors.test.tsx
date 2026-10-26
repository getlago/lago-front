/* eslint-disable import/order -- prettier groups node builtins with externals, conflicting with builtin-first ordering */
import { render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

import { Button } from '../button'

it.each([false, true])(
  'preserves caller color utilities in the CSS cascade with asChild=%s',
  async (asChild) => {
    const result = await postcss([
      tailwindcss({
        content: [{ raw: 'bg-red-500 text-green-500', extension: 'html' }],
        corePlugins: { preflight: false, backgroundOpacity: false, textOpacity: false },
      }),
    ]).process('@tailwind utilities;', { from: undefined })
    const buttonCss = readFileSync(path.join(__dirname, '../button.css'), 'utf8')
    const compiledButton = await postcss([
      tailwindcss({ content: [], theme: { extend: { colors: { 'focus-ring': '#123456' } } } }),
    ]).process(buttonCss, { from: undefined })
    const style = document.createElement('style')

    style.textContent = `${result.css}\n${compiledButton.css}`
    document.head.appendChild(style)
    try {
      render(
        <Button asChild={asChild} className="bg-red-500 text-green-500">
          {asChild ? <a href="#target">Custom colors</a> : 'Custom colors'}
        </Button>,
      )
      const target = screen.getByRole(asChild ? 'link' : 'button', { name: 'Custom colors' })
      const computed = getComputedStyle(target)

      expect(computed.backgroundColor).toBe('rgb(239, 68, 68)')
      expect(computed.color).toBe('rgb(34, 197, 94)')
    } finally {
      style.remove()
    }
  },
)
