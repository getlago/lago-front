import { Combobox as Primitive } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from './badge'
import { badgeVariants } from './badge-variants'
import { Button } from './button'
import { ColorThemePortal } from './color-theme'
import './combobox.css'
import { ComboboxContext, FreeTextContext } from './combobox/context'
import { ComboboxText } from './combobox/text'
import { IconButton } from './icon-button'
import { Input, SearchInput } from './input'

import { cn } from '../lib/utils'

type StyledProps<Props> = Omit<Props, 'className'> & { className?: string }

export { ComboboxText } from './combobox/text'
export { ComboboxList } from './combobox/list'

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: Primitive.Root.Props<Value, Multiple>,
): React.ReactElement {
  const [internalOpen, setInternalOpen] = React.useState(props.defaultOpen ?? false)
  const scrollToIndex = React.useRef<((index: number) => void) | undefined>(undefined)
  const highlightedIndex = React.useRef<number | undefined>(undefined)
  const context = React.useMemo(
    () => ({
      disabled: !!props.disabled,
      readOnly: !!props.readOnly,
      virtualized: !!props.virtualized,
      scrollToIndex,
      highlightedIndex,
    }),
    [props.disabled, props.readOnly, props.virtualized],
  )

  return (
    <ComboboxContext.Provider value={context}>
      <Primitive.Root
        {...props}
        open={props.multiple ? (props.open ?? internalOpen) : props.open}
        onInputValueChange={(value, details) => {
          if (!props.multiple && details.reason === 'escape-key') {
            details.cancel()
            details.allowPropagation()
            return
          }
          props.onInputValueChange?.(value, details)
        }}
        onValueChange={(value, details) => {
          if (details.reason === 'escape-key') {
            details.cancel()
            details.allowPropagation()
            return
          }
          props.onValueChange?.(value, details)
        }}
        onItemHighlighted={(value, details) => {
          highlightedIndex.current = details.index
          props.onItemHighlighted?.(value, details)
          if (value !== undefined && details.index !== undefined && details.reason !== 'pointer') {
            const index = details.index

            queueMicrotask(() => scrollToIndex.current?.(index))
          }
        }}
        onOpenChange={(open, details) => {
          if (props.multiple && !open && details.reason === 'item-press') return
          props.onOpenChange?.(open, details)
          if (!details.isCanceled) setInternalOpen(open)
        }}
      />
    </ComboboxContext.Provider>
  )
}

export const ComboboxControl = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.InputGroup.Props>
>(({ className, ...props }, ref) => (
  <Primitive.InputGroup
    {...props}
    ref={ref}
    data-slot="combobox-control"
    className={cn('v2-combobox-control v2-text-body', className)}
  />
))
ComboboxControl.displayName = 'ComboboxControl'

export const ComboboxInput = React.forwardRef<HTMLInputElement, StyledProps<Primitive.Input.Props>>(
  ({ className, onKeyDown, render = <Input />, ...props }, ref) => {
    const freeText = React.useContext(FreeTextContext)
    const composing = React.useRef(false)

    return (
      <Primitive.Input
        {...props}
        ref={ref}
        render={render}
        className={cn('v2-combobox-input', className)}
        onCompositionStart={(event) => {
          composing.current = true
          props.onCompositionStart?.(event)
        }}
        onCompositionEnd={(event) => {
          composing.current = false
          props.onCompositionEnd?.(event)
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (
            event.key === 'Enter' &&
            (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)
          ) {
            event.preventBaseUIHandler()
            return
          }
          if (
            !event.defaultPrevented &&
            event.key === 'Enter' &&
            freeText?.hasQuery &&
            !freeText.highlighted.current
          ) {
            event.preventDefault()
            freeText.commit(event)
          }
        }}
      />
    )
  },
)
ComboboxInput.displayName = 'ComboboxInput'

export interface ComboboxTriggerProps extends StyledProps<Primitive.Trigger.Props> {
  variant?: 'icon' | 'input'
}

export const ComboboxTrigger = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  ({ className, children, variant = 'icon', ...props }, ref) => (
    <Primitive.Trigger
      {...props}
      ref={ref}
      data-variant={variant}
      className={cn(
        'v2-combobox-trigger flex shrink-0 items-center justify-center text-icon-default disabled:text-disabled-foreground',
        variant === 'input' &&
          'v2-text-body h-9 justify-between gap-2 rounded-lg border border-border-control bg-surface px-3 text-text-default focus-visible:border-focus-border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring hover:enabled:bg-surface-subtle disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled disabled:text-disabled-foreground',
        className,
      )}
    >
      {children}
      {(variant === 'input' || !children) && <ChevronsUpDown aria-hidden="true" size={14} />}
    </Primitive.Trigger>
  ),
)
ComboboxTrigger.displayName = 'ComboboxTrigger'

export interface ComboboxSearchProps extends Omit<StyledProps<Primitive.Input.Props>, 'render'> {
  clearLabel: string
  onClear: () => void
  showClear: boolean
}

export const ComboboxSearch = React.forwardRef<HTMLInputElement, ComboboxSearchProps>(
  ({ clearLabel, onClear, showClear, className, ...props }, ref) => (
    <div className="relative min-w-0">
      <ComboboxInput
        {...props}
        ref={ref}
        render={<SearchInput />}
        className={cn('pr-10', className)}
      />
      {showClear && (
        <IconButton
          label={clearLabel}
          size="icon-xs"
          className="absolute right-3 top-1/2 -translate-y-1/2"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
        >
          <X aria-hidden="true" />
        </IconButton>
      )}
    </div>
  ),
)
ComboboxSearch.displayName = 'ComboboxSearch'

export const ComboboxValue = Primitive.Value

export const ComboboxClear = React.forwardRef<
  HTMLButtonElement,
  Omit<Primitive.Clear.Props, 'render'> & { label: string }
>(({ label, ...props }, ref) => (
  <Primitive.Clear {...props} ref={ref} render={<IconButton label={label} size="icon-xs" />}>
    <X aria-hidden="true" />
  </Primitive.Clear>
))
ComboboxClear.displayName = 'ComboboxClear'

export const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.Popup.Props> & {
    anchor?: Primitive.Positioner.Props['anchor']
    container?: Primitive.Portal.Props['container']
  }
>(({ className, anchor, container, ...props }, ref) => (
  <Primitive.Portal container={container}>
    <ColorThemePortal>
      <Primitive.Positioner
        anchor={anchor}
        sideOffset={8}
        className="v2-combobox-positioner z-[2100] w-[var(--anchor-width)] max-w-[var(--available-width)]"
      >
        <Primitive.Popup
          {...props}
          ref={ref}
          className={cn(
            'v2-combobox-popup v2-text-body flex max-h-[var(--available-height)] flex-col overflow-hidden rounded-xl border border-border-divider bg-surface-floating p-1 text-text-default shadow-v2-floating',
            className,
          )}
        />
      </Primitive.Positioner>
    </ColorThemePortal>
  </Primitive.Portal>
))
ComboboxContent.displayName = 'ComboboxContent'

export const ComboboxItem = React.forwardRef<HTMLDivElement, StyledProps<Primitive.Item.Props>>(
  ({ className, children, ...props }, ref) => (
    <Primitive.Item
      {...props}
      ref={ref}
      className={cn(
        'v2-combobox-item flex min-h-9 cursor-default items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-interactive-hover data-[disabled]:text-disabled-foreground',
        className,
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <Primitive.ItemIndicator className="shrink-0">
        <Check size={14} aria-hidden="true" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  ),
)
ComboboxItem.displayName = 'ComboboxItem'

export const ComboboxEmpty = React.forwardRef<HTMLDivElement, StyledProps<Primitive.Empty.Props>>(
  ({ className, ...props }, ref) => (
    <Primitive.Empty
      ref={ref}
      {...props}
      className={cn('v2-text-body px-3 py-2 text-text-subtle empty:p-0', className)}
    />
  ),
)
ComboboxEmpty.displayName = 'ComboboxEmpty'
export const ComboboxStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    role="status"
    className={cn('v2-text-body px-3 py-2 text-text-subtle', className)}
  />
))
ComboboxStatus.displayName = 'ComboboxStatus'
export const ComboboxGroup = Primitive.Group
export const ComboboxLabel = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.GroupLabel.Props>
>(({ className, ...props }, ref) => (
  <Primitive.GroupLabel
    ref={ref}
    {...props}
    className={cn('v2-text-caption px-2 py-1 text-text-muted', className)}
  />
))
ComboboxLabel.displayName = 'ComboboxLabel'
export const ComboboxSeparator = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.Separator.Props>
>(({ className, ...props }, ref) => (
  <Primitive.Separator
    ref={ref}
    {...props}
    data-slot="combobox-separator"
    className={cn('-mx-1 my-1 h-px shrink-0 bg-border-divider', className)}
  />
))
ComboboxSeparator.displayName = 'ComboboxSeparator'

export const ComboboxChips = React.forwardRef<HTMLDivElement, StyledProps<Primitive.Chips.Props>>(
  ({ className, ...props }, ref) => (
    <Primitive.Chips {...props} ref={ref} className={cn('v2-combobox-chips', className)} />
  ),
)
ComboboxChips.displayName = 'ComboboxChips'
export const ComboboxChipsInput = ComboboxInput

export const ComboboxChip = React.forwardRef<
  HTMLDivElement,
  StyledProps<Primitive.Chip.Props> & { label: string; removeLabel: string }
>(({ label, removeLabel, className, ...props }, ref) => {
  const context = React.useContext(ComboboxContext)

  if (context?.readOnly)
    return (
      <Badge className="max-w-full">
        <ComboboxText>{label}</ComboboxText>
      </Badge>
    )
  return (
    <Primitive.Chip
      {...props}
      ref={ref}
      aria-label={label}
      className={cn(
        cn(
          badgeVariants({ variant: context?.disabled ? 'disabled' : 'neutral' }),
          'v2-combobox-chip',
          !context?.disabled && 'pr-0.5',
        ),
        className,
      )}
    >
      <ComboboxText>{label}</ComboboxText>
      {!context?.disabled && (
        <Primitive.ChipRemove render={<IconButton label={removeLabel} size="icon-xs" />}>
          <X aria-hidden="true" />
        </Primitive.ChipRemove>
      )}
    </Primitive.Chip>
  )
})
ComboboxChip.displayName = 'ComboboxChip'

export const ComboboxAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ children, className, ...props }, ref) => (
  <div className="v2-combobox-footer -mx-1 -mb-1 mt-1 shrink-0 border-t border-border-divider p-1 only:mt-0 only:border-t-0">
    <Button
      ref={ref}
      {...props}
      type="button"
      variant="ghost"
      className={cn('w-full justify-start', className)}
    >
      <Plus aria-hidden="true" size={14} />
      {children}
    </Button>
  </div>
))
ComboboxAction.displayName = 'ComboboxAction'

export const ComboboxAdd = (): React.ReactElement | null => {
  const context = React.useContext(FreeTextContext)

  if (!context?.canAdd) return null
  return (
    <ComboboxAction onMouseDown={(event) => event.preventDefault()} onClick={context.commit}>
      {context.addLabel}
    </ComboboxAction>
  )
}

export { ComboboxFreeText } from './combobox/free-text'
export type { ComboboxFreeTextProps } from './combobox/free-text'
export type { ComboboxListProps } from './combobox/list'
