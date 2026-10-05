import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/ui/button'
import { ColorMode, ColorTheme } from '~/components/ui/color-theme'
import colorCss from '~/styles/v2/colors.css?raw'

type ColorRow = { variable: string; value: string; resolved: string }

export const ColorTest = (): JSX.Element => {
  const [mode, setMode] = useState<ColorMode>('light')
  const previewRef = useRef<HTMLElement>(null)
  const [rows, setRows] = useState<{ primitives: ColorRow[]; semantics: ColorRow[] }>({
    primitives: [],
    semantics: [],
  })

  useEffect(() => {
    const boundary = previewRef.current?.querySelector('[data-color-theme]')

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
      className="border-b border-border-subtle"
    >
      <th scope="row" className="v2-text-code whitespace-nowrap p-3 text-left font-medium">
        {variable.slice(2)}
      </th>
      <td className="p-3">
        <div
          className="h-8 w-16 rounded border border-border-subtle"
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
      className="border-b border-border-subtle"
    >
      <th scope="row" className="p-3 text-left font-medium">
        {variable.slice('--color-'.length)}
      </th>
      <td className="p-3">
        <div
          className="h-8 w-16 rounded border border-border-subtle"
          style={{ backgroundColor: `var(${variable})` }}
        />
      </td>
      <td className="v2-text-code p-3">{value}</td>
      <td className="v2-text-code p-3 text-text-muted">{resolved}</td>
    </tr>
  ))

  return (
    <section ref={previewRef} aria-label="Color foundation" className="mb-12">
      <ColorTheme
        mode={mode}
        className="v2-text-body space-y-8 rounded-lg border border-border-subtle bg-canvas p-6 text-text-default"
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="v2-text-section-title">Colors</h2>
            <p className="text-text-muted">
              {rows.primitives.length} primitives · {rows.semantics.length} semantic roles · {mode}{' '}
              theme
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Preview theme">
            <Button
              variant="outline"
              aria-pressed={mode === 'light'}
              onClick={() => setMode('light')}
            >
              Light
            </Button>
            <Button
              variant="outline"
              aria-pressed={mode === 'dark'}
              onClick={() => setMode('dark')}
            >
              Dark
            </Button>
          </div>
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
      </ColorTheme>
    </section>
  )
}
