import { Eye, EyeOff, Search } from 'lucide-react'
import * as React from 'react'

import './input.css'

import { cn } from '../lib/utils'

export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  variant?: 'default' | 'search' | 'borderless'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', type = 'text', ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(
        'v2-input v2-text-body h-9 w-full min-w-0 rounded-lg border px-3 py-0 text-text-default placeholder:text-text-subtle',
        className,
      )}
    />
  ),
)
Input.displayName = 'Input'

export const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'variant'>>(
  ({ className, disabled, ...props }, ref) => (
    <div className="relative w-full min-w-0">
      <Input
        {...props}
        ref={ref}
        type="search"
        variant="search"
        disabled={disabled}
        className={cn('pl-[33px]', className)}
      />
      <Search
        aria-hidden="true"
        size={14}
        strokeWidth={2}
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-icon-muted',
          disabled && 'text-disabled-foreground',
        )}
      />
    </div>
  ),
)
SearchInput.displayName = 'SearchInput'

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showPasswordLabel: string
  hidePasswordLabel: string
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, showPasswordLabel, hidePasswordLabel, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    const Icon = visible ? EyeOff : Eye

    return (
      <div data-slot="password-input" className="relative w-full min-w-0">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          disabled={disabled}
          className={cn('pr-11', className)}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={visible ? hidePasswordLabel : showPasswordLabel}
          className="v2-input-action absolute right-[13px] top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-icon-muted disabled:text-disabled-foreground"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((value) => !value)}
        >
          <Icon aria-hidden="true" size={14} strokeWidth={2} />
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
