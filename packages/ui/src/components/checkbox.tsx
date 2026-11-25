import { Checkbox as Primitive } from '@base-ui/react/checkbox'
import * as React from 'react'

import './choice-control.css'

import { useFormResetValue } from '../lib/use-form-reset-value'
import { cn } from '../lib/utils'

export type CheckboxProps = Omit<
  Primitive.Root.Props,
  'className' | 'children' | 'render' | 'nativeButton'
> & {
  className?: string
}

export const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(
  (
    {
      className,
      indeterminate,
      checked,
      defaultChecked = false,
      onCheckedChange,
      inputRef,
      ...props
    },
    ref,
  ): React.ReactElement => {
    const selection = useFormResetValue(checked, defaultChecked, inputRef, props.form)

    return (
      <Primitive.Root
        {...props}
        ref={ref}
        checked={selection.value}
        inputRef={selection.inputRef}
        onCheckedChange={(value, details): void => {
          onCheckedChange?.(value, details)
          if (!details.isCanceled) selection.setValue(value)
        }}
        indeterminate={indeterminate}
        nativeButton
        render={<button type="button" />}
        data-slot="checkbox"
        className={cn('v2-choice-control v2-checkbox', className)}
      >
        <Primitive.Indicator className="pointer-events-none flex items-center justify-center">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d={indeterminate ? 'M3 6h6' : 'M3 6l2 2 4-4'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Primitive.Indicator>
      </Primitive.Root>
    )
  },
)
Checkbox.displayName = 'Checkbox'
