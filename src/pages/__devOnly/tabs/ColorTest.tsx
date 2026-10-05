import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { ColorTheme } from '~/components/ui/color-theme'
import {
  ColorMode,
  colorPrimitives,
  colorSemantics,
  colorToCss,
  colorVariable,
  resolveColor,
} from '~/styles/v2/colors'

export const ColorTest = (): JSX.Element => {
  const [mode, setMode] = useState<ColorMode>('light')
  const primitiveRows = Object.entries(colorPrimitives).map(([name, value]) => (
    <tr key={name} data-color-primitive={name} className="border-b border-border-subtle">
      <th scope="row" className="v2-text-code whitespace-nowrap p-3 text-left font-medium">
        {name}
      </th>
      <td className="p-3">
        <div
          className="h-8 w-16 rounded border border-border-subtle"
          style={{ backgroundColor: `var(${colorVariable(name)})` }}
        />
      </td>
      <td className="v2-text-code p-3 text-text-muted">{value.hex}</td>
      <td className="v2-text-number p-3 text-text-muted">{Math.round(value.alpha * 100)}%</td>
    </tr>
  ))

  const semanticRows = Object.entries(colorSemantics).map(([name, aliases]) => {
    const resolved = resolveColor(name, mode)

    return (
      <tr key={name} data-color-semantic={name} className="border-b border-border-subtle">
        <th scope="row" className="p-3 text-left font-medium">
          {name}
        </th>
        <td className="p-3">
          <div
            className="h-8 w-16 rounded border border-border-subtle"
            style={{ backgroundColor: `var(${colorVariable(name)})` }}
          />
        </td>
        <td className="v2-text-code p-3">{aliases[mode]}</td>
        <td className="v2-text-code p-3 text-text-muted">
          {resolved.primitive}
          <br />
          {colorToCss(resolved)}
        </td>
      </tr>
    )
  })

  return (
    <section aria-label="Color foundation" className="mb-12">
      <ColorTheme
        mode={mode}
        className="v2-text-body space-y-8 rounded-lg border border-border-subtle bg-canvas p-6 text-text-default"
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="v2-text-section-title">Colors</h2>
            <p className="text-text-muted">
              {Object.keys(colorPrimitives).length} primitives ·{' '}
              {Object.keys(colorSemantics).length} semantic roles · {mode} theme
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
                    Hex
                  </th>
                  <th scope="col" className="p-3">
                    Opacity
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
