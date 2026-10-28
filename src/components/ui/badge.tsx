import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '~/lib/utils'

export const badgeVariants = cva(
  'v2-text-caption inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-solid py-0 text-center font-medium [&>svg]:size-3.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'border-border-divider bg-surface-subtle text-text-default',
        info: 'border-info-border bg-info text-info-foreground',
        success: 'border-success-border bg-success text-success-foreground',
        warning: 'border-warning-border bg-warning text-warning-foreground',
        danger: 'border-danger-border bg-danger text-danger-foreground',
        disabled: 'border-border-divider bg-surface-subtle text-disabled-foreground',
        outline: 'border-border-divider bg-surface-subtle text-text-subtle',
      },
      size: { sm: 'h-5 min-w-5 px-1', default: 'h-6 min-w-6 px-2' },
    },
    defaultVariants: { variant: 'neutral', size: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {React.Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <span className="min-w-px flex-1 text-center">{child}</span>
        ) : (
          child
        ),
      )}
    </span>
  ),
)
Badge.displayName = 'Badge'
