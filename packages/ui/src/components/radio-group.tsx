import { Radio as Primitive } from '@base-ui/react/radio'
import { RadioGroup as GroupPrimitive } from '@base-ui/react/radio-group'
import * as React from 'react'

import './choice-control.css'

import { useFormResetValue } from '../lib/use-form-reset-value'
import { cn } from '../lib/utils'

export type RadioGroupProps = Omit<
  GroupPrimitive.Props<string | number | boolean | null>,
  'className'
> & {
  className?: string
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    { className, value, defaultValue = null, onValueChange, inputRef, ...props },
    ref,
  ): React.ReactElement => {
    const selection = useFormResetValue(value, defaultValue, inputRef, props.form)

    return (
      <GroupPrimitive
        {...props}
        ref={ref}
        value={selection.value}
        inputRef={selection.inputRef}
        onValueChange={(nextValue, details): void => {
          onValueChange?.(nextValue, details)
          if (!details.isCanceled) selection.setValue(nextValue)
        }}
        data-slot="radio-group"
        className={cn('flex min-w-0 flex-col gap-2', className)}
      />
    )
  },
)

export type RadioGroupItemProps = Omit<
  Primitive.Root.Props<string | number | boolean>,
  'className' | 'children' | 'render' | 'nativeButton'
> & {
  className?: string
}

export const RadioGroupItem = React.forwardRef<HTMLElement, RadioGroupItemProps>(
  ({ className, ...props }, ref): React.ReactElement => {
    return (
      <Primitive.Root
        {...props}
        ref={ref}
        nativeButton
        render={<button type="button" />}
        data-slot="radio-group-item"
        className={cn('v2-choice-control v2-radio', className)}
      >
        <Primitive.Indicator className="v2-radio-indicator pointer-events-none size-2 rounded-full" />
      </Primitive.Root>
    )
  },
)
RadioGroup.displayName = 'RadioGroup'
RadioGroupItem.displayName = 'RadioGroupItem'
