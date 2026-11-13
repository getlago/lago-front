import * as React from 'react'

import { cn } from '../lib/utils'

export type InputProps = React.ComponentPropsWithoutRef<'input'>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'v2-text-body border-input placeholder:text-muted-foreground focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex h-9 w-full rounded-md border bg-[transparent] px-3 py-1 transition-colors file:border-0 file:bg-[transparent] focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
