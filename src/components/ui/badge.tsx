import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '~/lib/utils'

export const badgeVariants = cva(
  'v2-text-caption inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-solid px-[7px] py-0 [&>svg]:size-3.5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'border-border-subtle bg-surface-inset text-text-default',
        info: 'border-info-border bg-info text-info-foreground',
        success: 'border-success-border bg-success text-success-foreground',
        warning: 'border-warning-border bg-warning text-warning-foreground',
        danger: 'border-danger-border bg-danger text-danger-foreground',
        disabled: 'border-border-subtle bg-surface-inset text-disabled-foreground',
        outline: 'border-border-subtle bg-surface-inset text-text-subtle',
      },
      size: { sm: 'h-5', default: 'h-6' },
    },
    defaultVariants: { variant: 'neutral', size: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

// Seven pixels of padding plus the border preserve Figma's 8px inside inset.
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
  ),
)
Badge.displayName = 'Badge'
