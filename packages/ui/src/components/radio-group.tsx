import { Radio as Primitive } from '@base-ui/react/radio'
import { RadioGroup as GroupPrimitive } from '@base-ui/react/radio-group'
import * as React from 'react'

import './choice-control.css'

import { cn } from '../lib/utils'

export type RadioGroupProps = Omit<
  GroupPrimitive.Props<string | number | boolean | null>,
  'className'
> & {
  className?: string
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, ...props }, ref): React.ReactElement => {
    return (
      <GroupPrimitive
        {...props}
        ref={ref}
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
        <Primitive.Indicator className="bg-current pointer-events-none size-2 rounded-full" />
      </Primitive.Root>
    )
  },
)
RadioGroup.displayName = 'RadioGroup'
RadioGroupItem.displayName = 'RadioGroupItem'
