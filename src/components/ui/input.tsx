import * as React from 'react'

import { cn } from '~/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- named interface (not a type alias) is required for react/prop-types to resolve InputHTMLAttributes through forwardRef
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'bg-transparent file:bg-transparent aria-invalid:border-destructive aria-invalid:ring-destructive/20 flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm transition-colors file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
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
