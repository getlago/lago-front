import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { badgeVariants } from './badge-variants'

import { cn } from '../lib/utils'

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
