import * as React from 'react'

import { cn } from '~/lib/utils'

export type InputProps = React.ComponentPropsWithoutRef<'input'>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'v2-text-body flex h-9 w-full rounded-md border border-border-default bg-surface px-3 py-1 text-text-default transition-colors file:border-0 file:bg-[transparent] file:text-text-default placeholder:text-text-subtle focus-visible:border-focus-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground disabled:placeholder:text-disabled-foreground aria-invalid:border-danger-border aria-invalid:focus-visible:border-danger-border aria-invalid:focus-visible:ring-danger-border',
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
