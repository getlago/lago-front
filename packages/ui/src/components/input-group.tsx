import * as React from 'react'

import { Input, InputProps } from './input'
import './input-group.css'

import { cn } from '../lib/utils'

export const InputGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, onMouseDown, ...props }, ref) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Delegates pointer focus to the native input, the only keyboard focus target.
    <div
      role="group"
      {...props}
      ref={ref}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        if (event.defaultPrevented || event.button !== 0) return
        const input = event.currentTarget.querySelector<HTMLInputElement>(
          ':scope > .v2-input-group-control',
        )

        if (!input || event.target === input || input.matches(':disabled')) return
        event.preventDefault()
        input.focus()
      }}
      data-slot="input-group"
      className={cn(
        'v2-input-group flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border px-3',
        className,
      )}
    />
  ),
)
InputGroup.displayName = 'InputGroup'

export type InputGroupInputProps = Omit<InputProps, 'variant'>

export const InputGroupInput = React.forwardRef<HTMLInputElement, InputGroupInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      variant="default"
      className={cn(
        'v2-input-group-control order-1 h-full flex-1 rounded-none border-0 px-0',
        className,
      )}
    />
  ),
)
InputGroupInput.displayName = 'InputGroupInput'

export interface InputGroupAddonProps extends React.ComponentPropsWithoutRef<'div'> {
  align?: 'inline-start' | 'inline-end'
}

export const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'inline-start', ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        'v2-text-body flex shrink-0 items-center gap-2 whitespace-nowrap text-text-muted [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-icon-muted',
        align === 'inline-start' ? 'order-first' : 'order-last',
        className,
      )}
    />
  ),
)
InputGroupAddon.displayName = 'InputGroupAddon'

export const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    {...props}
    ref={ref}
    data-slot="input-group-text"
    className={cn('v2-text-body', className)}
  />
))
InputGroupText.displayName = 'InputGroupText'
