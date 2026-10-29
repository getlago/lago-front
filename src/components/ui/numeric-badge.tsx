import * as React from 'react'

import { cn } from '~/lib/utils'

import { Badge } from './badge'

export interface NumericBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  value: number | string
  selected?: boolean
  disabled?: boolean
}

export const NumericBadge = React.forwardRef<HTMLSpanElement, NumericBadgeProps>(
  ({ value, selected = false, disabled = false, className, ...props }, ref) => {
    let foreground = 'text-text-muted'

    if (selected) foreground = 'text-text-default'
    if (disabled) foreground = 'text-disabled-foreground'

    return (
      <Badge
        {...props}
        ref={ref}
        size="sm"
        className={cn(
          'v2-text-number-small rounded-full border-0 bg-selected font-normal shadow-none',
          foreground,
          className,
        )}
      >
        {value}
      </Badge>
    )
  },
)
NumericBadge.displayName = 'NumericBadge'
