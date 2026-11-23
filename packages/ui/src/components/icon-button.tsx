import * as React from 'react'

import { Button, ButtonProps } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

export interface IconButtonProps extends Omit<
  ButtonProps,
  'size' | 'asChild' | 'aria-label' | 'aria-labelledby'
> {
  label: string
  size?: 'icon-sm' | 'icon' | 'icon-lg'
}

/** Requires a shared TooltipProvider around the containing shadcn region. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'icon', variant = 'ghost', children, ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} ref={ref} variant={variant} size={size} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ),
)

IconButton.displayName = 'IconButton'
