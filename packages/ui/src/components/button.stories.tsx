import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Copy, Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from './button'
import docs from './button.md?raw'

const variants = ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const
const sizes = ['sm', 'default', 'lg'] as const
const iconSizes = ['icon-sm', 'icon', 'icon-lg'] as const

const meta = {
  title: 'Components/Button',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Button,
  args: { children: 'Button' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

const AllVariantsShowcase = (): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [clicks, setClicks] = useState(0)

  return (
    <div className="space-y-8">
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
        </div>
      ))}
      <div className="flex items-center gap-6">
        <Button variant="link" asChild loading={loading}>
          <a href="#button-navigation-example">Navigation link</a>
        </Button>
        <Button variant="link" asChild disabled>
          <a href="#button-navigation-example">Disabled navigation link</a>
        </Button>
      </div>
      <p id="button-navigation-example" className="v2-text-caption">
        Navigation destination example
      </p>
    </div>
  )
}

export const AllVariants: Story = {
  render: () => <AllVariantsShowcase />,
}
