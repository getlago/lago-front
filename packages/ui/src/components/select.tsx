import { Select as Primitive } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { ColorThemePortal } from './color-theme'
import './select.css'

import { cn } from '../lib/utils'

type StyledProps<Props> = Omit<Props, 'className'> & { className?: string }
export type SelectProps<Value extends string | number = string> = Omit<
  Primitive.Root.Props<Value, false>,
  'multiple'
>

export function Select<Value extends string | number>({
  readOnly = false,
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: SelectProps<Value>): React.ReactElement {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    if (readOnly) setInternalOpen(false)
  }, [readOnly])

  return (
    <Primitive.Root
      {...props}
      multiple={false}
      readOnly={readOnly}
      open={!readOnly && (open ?? internalOpen)}
      onOpenChange={(next, details) => {
        if (readOnly && next) {
          details.cancel()
          return
        }
        onOpenChange?.(next, details)
        if (!details.isCanceled) setInternalOpen(next)
      }}
    />
  )
}

export type SelectTriggerProps = StyledProps<Primitive.Trigger.Props>
export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <Primitive.Trigger
      {...props}
      ref={ref}
      data-slot="select-trigger"
      className={cn(
        'v2-select-trigger v2-text-body flex h-9 w-full min-w-[min(240px,100%)] items-center gap-2 rounded-lg border px-3 text-left text-text-default outline-none',
        className,
      )}
    >
      {children}
      <Primitive.Icon className="v2-select-icon ml-auto shrink-0 text-icon-muted">
        <ChevronsUpDown size={14} aria-hidden="true" />
      </Primitive.Icon>
    </Primitive.Trigger>
  ),
)
SelectTrigger.displayName = 'SelectTrigger'

export const SelectValue = React.forwardRef<HTMLSpanElement, StyledProps<Primitive.Value.Props>>(
  ({ className, ...props }, ref) => (
    <Primitive.Value
      {...props}
      ref={ref}
      className={cn('min-w-0 flex-1 truncate data-[placeholder]:text-text-subtle', className)}
    />
  ),
)
SelectValue.displayName = 'SelectValue'

export type SelectContentProps = StyledProps<Primitive.Popup.Props> & {
  container?: Primitive.Portal.Props['container']
}
export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, container, ...props }, ref) => (
    <Primitive.Portal container={container}>
      <ColorThemePortal>
        <Primitive.Positioner
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={4}
          className="v2-select-positioner z-[2100] w-[var(--anchor-width)] max-w-[var(--available-width)]"
        >
          <Primitive.Popup
            {...props}
            ref={ref}
            className={cn(
              'v2-select-popup v2-text-body rounded-xl border border-border-divider bg-surface-floating text-text-default shadow-v2-floating outline-none',
              className,
            )}
          >
            <Primitive.List className="v2-select-list p-1">{children}</Primitive.List>
          </Primitive.Popup>
        </Primitive.Positioner>
      </ColorThemePortal>
    </Primitive.Portal>
  ),
)
SelectContent.displayName = 'SelectContent'

export type SelectItemProps = Omit<
  StyledProps<Primitive.Item.Props>,
  'children' | 'label' | 'value'
> & {
  value: string | number
  label: string
  description?: string
}
export const SelectItem = React.forwardRef<HTMLElement, SelectItemProps>(
  ({ className, label, description, ...props }, ref) => {
    const descriptionId = React.useId()

    return (
      <Primitive.Item
        {...props}
        ref={ref}
        label={label}
        aria-labelledby={props['aria-labelledby'] ?? `${descriptionId}-label`}
        aria-describedby={props['aria-describedby'] ?? (description ? descriptionId : undefined)}
        className={cn(
          'v2-select-item flex min-h-9 cursor-default select-none items-center gap-2 rounded-lg p-2 outline-none data-[highlighted]:bg-interactive-hover data-[disabled]:text-disabled-foreground',
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <Primitive.ItemText id={`${descriptionId}-label`} className="block truncate">
            {label}
          </Primitive.ItemText>
          {description && (
            <div id={descriptionId} className="v2-text-caption break-words text-text-muted">
              {description}
            </div>
          )}
        </div>
        <Primitive.ItemIndicator className="shrink-0 text-icon-muted">
          <Check size={14} aria-hidden="true" />
        </Primitive.ItemIndicator>
      </Primitive.Item>
    )
  },
)
SelectItem.displayName = 'SelectItem'

export const SelectGroup = Primitive.Group
export const SelectLabel = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.GroupLabel.Props>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    {...props}
    ref={ref}
    className={cn('v2-text-caption h-7 shrink-0 truncate p-2 text-text-muted', className)}
  />
))
SelectLabel.displayName = 'SelectLabel'

export const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.Separator.Props>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    {...props}
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border-divider', className)}
  />
))
SelectSeparator.displayName = 'SelectSeparator'
