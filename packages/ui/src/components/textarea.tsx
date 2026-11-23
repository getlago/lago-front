import * as React from 'react'

import './textarea.css'

import { cn } from '../lib/utils'

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea
      {...props}
      ref={ref}
      rows={rows}
      data-slot="textarea"
      className={cn(
        'v2-textarea v2-text-body block min-h-[78px] w-full min-w-0 rounded-lg border px-3 py-2 text-text-default placeholder:text-text-subtle',
        className,
      )}
    />
  ),
)
Textarea.displayName = 'Textarea'
