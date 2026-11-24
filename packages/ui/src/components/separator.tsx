import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import * as React from 'react'

import { cn } from '../lib/utils'

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive> & { decorative?: boolean }
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive
    {...props}
    ref={ref}
    role={decorative ? 'presentation' : 'separator'}
    aria-orientation={decorative ? undefined : orientation}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border-divider',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
  />
))
Separator.displayName = 'Separator'
