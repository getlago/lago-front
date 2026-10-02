import * as React from 'react'

import { cn } from '~/lib/utils'

import { useV2ColorTheme } from './v2-theme'

export type InputProps = React.ComponentPropsWithoutRef<'input'>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const colorTheme = useV2ColorTheme()

    return (
      <input
        type={type}
        data-theme={colorTheme}
        className={cn(
          'v2-text-body flex h-9 w-full rounded-md border border-input bg-[transparent] px-3 py-1 transition-colors file:border-0 file:bg-[transparent] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          'v2-theme v2-input',
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
