import { Check } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

import { Button as LegacyButton } from '~/components/designSystem/Button'
import { Button, ButtonProps } from '~/components/ui/button'
import { ColorTheme, ColorThemePortal } from '~/components/ui/color-theme'
import { Input } from '~/components/ui/input'
import {
  ColorMode,
  colorPrimitives,
  colorSemantics,
  colorToCss,
  colorVariable,
  resolveColor,
} from '~/styles/v2/colors'

const variants: NonNullable<ButtonProps['variant']>[] = [
  'default',
  'secondary',
  'outline',
  'ghost',
  'link',
  'destructive',
]

export const ColorTest = (): JSX.Element => {
  const [mode, setMode] = useState<ColorMode>('light')
  const [showPortal, setShowPortal] = useState(false)
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
  const controls = variants.map((variant) => (
    <div key={variant} className="flex items-center gap-4">
      <span className="v2-text-caption w-24 text-text-muted">{variant}</span>
      <Button variant={variant}>{variant}</Button>
      <Button variant={variant} disabled>
        {variant} disabled
      </Button>
    </div>
  ))
  const alphaExamples = ['canvas', 'surface-raised', 'surface-inset'].map((surface) => (
    <div
      key={surface}
      className="space-y-3 rounded-md p-4"
      style={{ backgroundColor: `var(${colorVariable(surface)})` }}
    >
      <p className="v2-text-label">On {surface}</p>
      <div className="rounded p-3" style={{ backgroundColor: 'var(--color-interactive-hover)' }}>
        Hover
      </div>
      <div className="rounded bg-selected p-3 text-selected-foreground">Selected / pressed</div>
    </div>
  ))
  const portal =
    showPortal &&
    createPortal(
      <ColorThemePortal
        role="region"
        aria-label="Portalled color preview"
        className="fixed bottom-8 right-8 z-[1500] rounded-md border border-border-default bg-surface-raised p-6 text-text-default shadow-lg"
      >
        <p className="v2-text-label mb-4">Portal theme: {mode}</p>
        <Button variant="outline" onClick={() => setShowPortal(false)}>
          Close portal preview
        </Button>
      </ColorThemePortal>,
      document.body,
    )

  return (
    <section aria-label="Color foundation" className="mb-12">
      <div className="mb-6 flex items-center gap-4">
        <span>Legacy comparison — outside the preview theme</span>
        <LegacyButton>Legacy button</LegacyButton>
        <input
          aria-label="Legacy color reference"
          className="rounded border border-grey-300 bg-white px-3 py-2 text-grey-700"
          placeholder="Legacy colors"
        />
      </div>
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
        <section aria-label="Component color states" className="space-y-4">
          <h3 className="v2-text-group-title">Component states</h3>
          <p className="text-text-muted">Hover, press, and use Tab to inspect keyboard focus.</p>
          {controls}
          <Button asChild variant="secondary">
            <a href="#color-primitives">Secondary as a link</a>
          </Button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input aria-label="Default color input" placeholder="Default input" />
            <Input aria-label="Invalid color input" aria-invalid defaultValue="Invalid value" />
            <Input aria-label="Disabled color input" disabled defaultValue="Disabled value" />
          </div>
          <div className="flex gap-6">
            <Check aria-label="Default icon" className="text-icon-default" />
            <Check aria-label="Muted icon" className="text-icon-muted" />
            <Check aria-label="Subtle icon" className="text-icon-subtle" />
          </div>
          <Button variant="outline" onClick={() => setShowPortal(true)}>
            Open portal preview
          </Button>
          <ColorTheme
            mode={mode === 'light' ? 'dark' : 'light'}
            className="rounded bg-surface p-4 text-text-default"
            aria-label="Nested opposite theme"
          >
            Nested {mode === 'light' ? 'dark' : 'light'} boundary — surface follows canvas
          </ColorTheme>
          {portal}
        </section>
        <section aria-label="Alpha blending" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {alphaExamples}
        </section>
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
