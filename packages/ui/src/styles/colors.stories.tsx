import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'

import colorCss from './colors.css?raw'
import docs from './colors.md?raw'

import { ColorMode } from '../components/color-theme'

type ColorRow = { variable: string; value: string; resolved: string }

const ColorsShowcase = ({ mode }: { mode: ColorMode }): JSX.Element => {
  const previewRef = useRef<HTMLElement>(null)
  const [rows, setRows] = useState<{ primitives: ColorRow[]; semantics: ColorRow[] }>({
    primitives: [],
    semantics: [],
  })

  useEffect(() => {
    const boundary = previewRef.current

    if (!boundary) return
    const computed = getComputedStyle(boundary)
    const sheet = new CSSStyleSheet()

    sheet.replaceSync(colorCss)
    const primitives: ColorRow[] = []
    const semantics: ColorRow[] = []

    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSStyleRule)) continue
      const isMode = rule.selectorText.includes(`[data-color-theme="${mode}"]`)

      for (const variable of Array.from(rule.style)) {
        const row = {
          variable,
          value: rule.style.getPropertyValue(variable).trim(),
          resolved: computed.getPropertyValue(variable).trim(),
        }

        if (variable.startsWith('--v2-')) primitives.push(row)
        if (isMode && variable.startsWith('--color-')) semantics.push(row)
      }
    }
    setRows({ primitives, semantics })
  }, [mode])

  const primitiveRows = rows.primitives.map(({ variable, value }) => (
    <tr
      key={variable}
      data-color-primitive={variable.slice(2)}
      className="border-b border-border-divider"
    >
      <th scope="row" className="v2-text-code whitespace-nowrap p-3 text-left font-medium">
        {variable.slice(2)}
      </th>
      <td className="p-3">
        <div
          className="h-8 w-16 rounded border border-border-divider"
          style={{ backgroundColor: `var(${variable})` }}
        />
      </td>
      <td className="v2-text-code p-3 text-text-muted">{value}</td>
    </tr>
  ))

  const semanticRows = rows.semantics.map(({ variable, value, resolved }) => (
    <tr
      key={variable}
      data-color-semantic={variable.slice('--color-'.length)}
      className="border-b border-border-divider"
    >
      <th scope="row" className="p-3 text-left font-medium">
        {variable.slice('--color-'.length)}
      </th>
      <td className="p-3">
        <div
          className="h-8 w-16 rounded border border-border-divider"
          style={{ backgroundColor: `var(${variable})` }}
        />
      </td>
      <td className="v2-text-code p-3">{value}</td>
      <td className="v2-text-code p-3 text-text-muted">{resolved}</td>
    </tr>
  ))

  return (
    <section ref={previewRef} aria-label="Color foundation" className="v2-text-body space-y-8">
      <header>
        <h2 className="v2-text-section-title">Colors</h2>
        <p className="text-text-muted">
          {rows.primitives.length} primitives · {rows.semantics.length} semantic roles · {mode}{' '}
          theme
        </p>
      </header>
      <section id="color-primitives" aria-label="Color primitives" className="space-y-4">
        <h3 className="v2-text-group-title">Primitives</h3>
        <div className="overflow-x-auto">
          <table aria-label="Color primitives" className="w-full">
            <thead>
              <tr className="text-left">
                <th scope="col" className="p-3">
                  Token
                </th>
                <th scope="col" className="p-3">
                  Swatch
                </th>
                <th scope="col" className="p-3">
                  CSS value
                </th>
              </tr>
            </thead>
            <tbody>{primitiveRows}</tbody>
          </table>
        </div>
      </section>
      <section aria-label="Color semantics" className="space-y-4">
        <h3 className="v2-text-group-title">Semantic roles</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-3">Role</th>
                <th className="p-3">Swatch</th>
                <th className="p-3">Alias</th>
                <th className="p-3">Resolved value</th>
              </tr>
            </thead>
            <tbody>{semanticRows}</tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

const meta = {
  title: 'Foundations/Colors',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
} satisfies Meta

export default meta

export const Colors: StoryObj<typeof meta> = {
  render: (_args, { globals }) => (
    <ColorsShowcase mode={globals.theme === 'dark' ? 'dark' : 'light'} />
  ),
}
