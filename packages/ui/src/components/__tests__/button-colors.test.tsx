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

describe('link button dimensions', () => {
  let style: HTMLStyleElement
  beforeAll(async () => {
    const css = readFileSync(path.join(__dirname, '../button.css'), 'utf8')
    const result = await postcss([
      tailwindcss({
        content: [
          { raw: 'size-8 size-9 size-10 h-8 h-9 h-10 px-3 px-4 px-5 py-0 p-0', extension: 'html' },
        ],
        corePlugins: { preflight: false },
        theme: { extend: { colors: { 'focus-ring': '#123456' } } },
      }),
    ]).process('@tailwind utilities;\n' + css, { from: undefined })
    style = document.createElement('style')
    style.textContent = result.css
    document.head.appendChild(style)
  })
  afterAll(() => style.remove())

  it.each([
    ['icon-sm', '2rem'],
    ['icon', '2.25rem'],
    ['icon-lg', '2.5rem'],
  ] as const)('keeps %s square, including loading and slotted links', (size, dimension) => {
    const { rerender } = render(
      <Button variant="link" size={size} aria-label="Copy">
        <svg />
      </Button>,
    )
    for (const asChild of [false, true]) {
      for (const loading of [false, true]) {
        rerender(
          <Button variant="link" size={size} asChild={asChild} loading={loading} aria-label="Copy">
            {asChild ? (
              <a href="#target">
                <svg />
              </a>
            ) : (
              <svg />
            )}
          </Button>,
        )
        const computed = getComputedStyle(
          screen.getByRole(asChild ? 'link' : 'button', { name: 'Copy' }),
        )
        expect(computed.width).toBe(dimension)
        expect(computed.height).toBe(dimension)
        expect(computed.padding).toBe('0px')
      }
    }
  })

  it.each(['sm', 'default', 'lg'] as const)('keeps %s text links content-hugging', (size) => {
    const { rerender } = render(
      <Button variant="link" size={size}>
        View customer
      </Button>,
    )
    for (const loading of [false, true]) {
      rerender(
        <Button variant="link" size={size} loading={loading}>
          View customer
        </Button>,
      )
      const computed = getComputedStyle(screen.getByRole('button', { name: 'View customer' }))
      expect(computed.width).toBe('auto')
      expect(computed.height).toBe('auto')
      expect(computed.padding).toBe('0px')
    }
  })
})
