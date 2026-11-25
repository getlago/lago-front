import { Info } from 'lucide-react'
import * as React from 'react'

import './field.css'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

import { cn } from '../lib/utils'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal'
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation = 'vertical', ...props }, ref): React.ReactElement => (
    <div
      {...props}
      ref={ref}
      data-slot="field"
      data-orientation={orientation}
      className={cn('v2-field min-w-0', orientation === 'vertical' && 'flex flex-col', className)}
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
      className={cn('flex min-w-0 flex-col gap-1', className)}
    />
  ),
)
FieldContent.displayName = 'FieldContent'

export interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'default' | 'compact'
}

export const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ className, spacing = 'default', ...props }, ref): React.ReactElement => (
    <div
      {...props}
      ref={ref}
      data-slot="field-group"
      className={cn('flex min-w-0 flex-col', spacing === 'compact' ? 'gap-2' : 'gap-4', className)}
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

export const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.ComponentPropsWithoutRef<'fieldset'>
>(({ className, ...props }, ref): React.ReactElement => (
  <fieldset
    {...props}
    ref={ref}
    data-slot="field-set"
    className={cn('v2-field-set min-w-0 border-0 p-0', className)}
  />
))
FieldSet.displayName = 'FieldSet'

export const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentPropsWithoutRef<'legend'>
>(({ className, ...props }, ref): React.ReactElement => (
  <legend
    {...props}
    ref={ref}
    data-slot="field-legend"
    className={cn('v2-text-label p-0 text-text-default', className)}
  />
))
FieldLegend.displayName = 'FieldLegend'
