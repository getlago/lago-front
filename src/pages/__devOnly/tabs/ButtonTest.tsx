import { ArrowRight, Copy, Plus } from 'lucide-react'
import { useState } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/ui/button'
import { ColorTheme } from '~/components/ui/color-theme'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, useLocation } from '~/core/router'

const variants = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const
const sizes = ['sm', 'default', 'lg'] as const
const iconSizes = ['icon-sm', 'icon', 'icon-lg'] as const

export const ButtonTest = () => {
  const { pathname } = useLocation()
  const [loading, setLoading] = useState(false)
  const [clicks, setClicks] = useState(0)

  return (
    <section aria-label="Shadcn button showcase" className="space-y-8">
      <h2 className="v2-text-page-title">Buttons</h2>
      <p className="v2-text-body">
        Hover, press, or use Tab to inspect states. Icons stay 14px at every button size.
      </p>
      <label className="v2-text-body flex items-center gap-2">
        <input
          type="checkbox"
          checked={loading}
          onChange={(event) => setLoading(event.target.checked)}
        />
        Show loading — dimensions stay unchanged
      </label>
      <p className="v2-text-body" role="status">
        Actions completed: {clicks}
      </p>
      {(['light', 'dark'] as const).map((mode) => (
        <ColorTheme
          key={mode}
          mode={mode}
          className="space-y-8 rounded-lg bg-canvas p-8 text-text-default"
        >
          <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'} theme</h3>
          {variants.map((variant) => (
            <div key={variant} className="space-y-4">
              <h4 className="v2-text-group-title">{variant === 'default' ? 'Primary' : variant}</h4>
              <div className="flex flex-wrap items-center gap-6">
                {(variant === 'link' ? (['default'] as const) : sizes).map((size) => (
                  <Button
                    key={size}
                    variant={variant}
                    size={size}
                    loading={loading}
                    onClick={() => setClicks((n) => n + 1)}
                  >
                    {variant === 'link' ? 'View customers' : `${size} button`}
                  </Button>
                ))}
                <Button variant={variant} loading={loading}>
                  <Plus aria-hidden="true" />
                  Add customer
                </Button>
                <Button variant={variant} loading={loading}>
                  Continue
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
                <Button variant={variant} loading>
                  Loading example
                </Button>
              </div>
              {variant !== 'link' && (
                <div className="flex items-center gap-6">
                  {iconSizes.map((size) => (
                    <Button
                      key={size}
                      variant={variant}
                      size={size}
                      loading={loading}
                      aria-label={`Copy, ${size}`}
                      onClick={() => setClicks((n) => n + 1)}
                    >
                      <Copy size={14} strokeWidth={2} aria-hidden="true" />
                    </Button>
                  ))}
                  <Button variant={variant} size="icon" disabled aria-label="Copy, disabled">
                    <Copy aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-6">
            <Button variant="link" asChild loading={loading}>
              <a href={`${pathname}#button-navigation-example`}>Navigation link</a>
            </Button>
            <Button variant="link" asChild disabled>
              <a href={`${pathname}#button-navigation-example`}>Disabled navigation link</a>
            </Button>
          </div>
          <p
            id={mode === 'light' ? 'button-navigation-example' : undefined}
            className="v2-text-caption"
          >
            Navigation destination example
          </p>
        </ColorTheme>
      ))}
    </section>
  )
}

export const shadcnButtonTab = {
  title: 'Shadcn-button',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-button' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <ButtonTest />
    </div>
  ),
}
