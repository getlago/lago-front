import { Info } from 'lucide-react'
import * as React from 'react'

import './field.css'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

import { cn } from '../lib/utils'

export const Field = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      data-slot="field"
      className={cn('v2-field flex min-w-0 flex-col', className)}
    />
  ),
)
Field.displayName = 'Field'

export const FieldContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      data-slot="field-content"
      className={cn('flex flex-col gap-1', className)}
    />
  ),
)
FieldContent.displayName = 'FieldContent'

export const FieldGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      {...props}
      ref={ref}
      data-slot="field-group"
      className={cn('flex flex-col gap-4', className)}
    />
  ),
)
FieldGroup.displayName = 'FieldGroup'

export const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, htmlFor, children, ...props }: React.ComponentPropsWithoutRef<'label'>, ref) => (
  <label
    {...props}
    ref={ref}
    htmlFor={htmlFor}
    data-slot="field-label"
    className={cn('v2-text-label inline-flex items-center gap-1 text-text-default', className)}
  >
    {children}
  </label>
))
FieldLabel.displayName = 'FieldLabel'

export const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    {...props}
    ref={ref}
    data-slot="field-description"
    className={cn('v2-text-caption text-text-muted', className)}
  />
))
FieldDescription.displayName = 'FieldDescription'

export const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) =>
  children ? (
    <p
      {...props}
      ref={ref}
      data-slot="field-error"
      className={cn('v2-text-caption whitespace-pre-line text-danger-foreground', className)}
    >
      {children}
    </p>
  ) : null,
)
FieldError.displayName = 'FieldError'

export interface FieldHelpProps {
  label: string
  children: React.ReactNode
}

/** Render beside FieldLabel, outside the label element. Share a TooltipProvider above the form. */
export const FieldHelp = ({ label, children }: FieldHelpProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        aria-label={label}
        className="v2-field-help relative inline-flex size-5 shrink-0 items-center justify-center rounded-lg text-icon-default"
      >
        <Info aria-hidden="true" size={14} strokeWidth={2} />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" align="start">
      {children}
    </TooltipContent>
  </Tooltip>
)
