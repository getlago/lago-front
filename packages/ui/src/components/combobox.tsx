import { Combobox as Primitive } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from './badge'
import { badgeVariants } from './badge-variants'
import { Button } from './button'
import { ColorThemePortal } from './color-theme'
import { ComboboxContext, FreeTextContext } from './combobox-context'
import './combobox.css'
import { comboboxClassName } from './combobox/class-name'
import { ComboboxText } from './combobox/text'
import { IconButton } from './icon-button'
import { Input } from './input'

import { cn } from '../lib/utils'

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

export const ComboboxControl = React.forwardRef<HTMLDivElement, Primitive.InputGroup.Props>(
  ({ className, ...props }, ref) => (
    <Primitive.InputGroup
      {...props}
      ref={ref}
      data-slot="combobox-control"
      className={comboboxClassName('v2-combobox-control v2-text-body', className)}
    />
  ),
)
ComboboxControl.displayName = 'ComboboxControl'

export const ComboboxInput = React.forwardRef<HTMLInputElement, Primitive.Input.Props>(
  ({ className, onKeyDown, ...props }, ref) => {
    const freeText = React.useContext(FreeTextContext)
    const composing = React.useRef(false)

    return (
      <Primitive.Input
        {...props}
        ref={ref}
        render={<Input />}
        aria-invalid={props['aria-invalid'] || freeText?.invalid || undefined}
        aria-describedby={
          [props['aria-describedby'], freeText?.errorId].filter(Boolean).join(' ') || undefined
        }
        className={comboboxClassName('v2-combobox-input', className)}
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
            freeText.commit()
          }
        }}
      />
    )
  },
)
ComboboxInput.displayName = 'ComboboxInput'

export const ComboboxTrigger = React.forwardRef<HTMLButtonElement, Primitive.Trigger.Props>(
  ({ className, children, ...props }, ref) => (
    <Primitive.Trigger
      {...props}
      ref={ref}
      className={comboboxClassName('v2-combobox-trigger', className)}
    >
      {children || <ChevronsUpDown aria-hidden="true" size={14} />}
    </Primitive.Trigger>
  ),
)
ComboboxTrigger.displayName = 'ComboboxTrigger'
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
  Primitive.Popup.Props & {
    anchor?: Primitive.Positioner.Props['anchor']
    container?: Primitive.Portal.Props['container']
  }
>(({ className, anchor, container, ...props }, ref) => (
  <Primitive.Portal container={container}>
    <ColorThemePortal>
      <Primitive.Positioner anchor={anchor} sideOffset={8} className="v2-combobox-positioner">
        <Primitive.Popup
          {...props}
          ref={ref}
          className={comboboxClassName('v2-combobox-popup v2-text-body', className)}
        />
      </Primitive.Positioner>
    </ColorThemePortal>
  </Primitive.Portal>
))
ComboboxContent.displayName = 'ComboboxContent'

export const ComboboxItem = React.forwardRef<HTMLDivElement, Primitive.Item.Props>(
  ({ className, children, ...props }, ref) => (
    <Primitive.Item
      {...props}
      ref={ref}
      className={comboboxClassName('v2-combobox-item', className)}
    >
      <span className="min-w-0 flex-1">{children}</span>
      <Primitive.ItemIndicator className="shrink-0">
        <Check size={14} aria-hidden="true" />
      </Primitive.ItemIndicator>
    </Primitive.Item>
  ),
)
ComboboxItem.displayName = 'ComboboxItem'

export const ComboboxEmpty = ({
  className,
  ...props
}: Primitive.Empty.Props): React.ReactElement => (
  <Primitive.Empty
    {...props}
    className={comboboxClassName('v2-text-body px-3 py-2 text-text-subtle empty:p-0', className)}
  />
)
export const ComboboxStatus = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
  <div
    {...props}
    role="status"
    className={cn('v2-text-body px-3 py-2 text-text-subtle', className)}
  />
)
export const ComboboxGroup = Primitive.Group
export const ComboboxLabel = ({
  className,
  ...props
}: Primitive.GroupLabel.Props): React.ReactElement => (
  <Primitive.GroupLabel
    {...props}
    className={comboboxClassName('v2-text-caption px-2 py-1 text-text-muted', className)}
  />
)
export const ComboboxSeparator = ({
  className,
  ...props
}: Primitive.Separator.Props): React.ReactElement => (
  <Primitive.Separator
    {...props}
    data-slot="combobox-separator"
    className={comboboxClassName('-mx-1 my-1 h-px shrink-0 bg-border-divider', className)}
  />
)

export const ComboboxChips = React.forwardRef<HTMLDivElement, Primitive.Chips.Props>(
  ({ className, ...props }, ref) => (
    <Primitive.Chips
      {...props}
      ref={ref}
      className={comboboxClassName('v2-combobox-chips', className)}
    />
  ),
)
ComboboxChips.displayName = 'ComboboxChips'
export const ComboboxChipsInput = ComboboxInput

export const ComboboxChip = React.forwardRef<
  HTMLDivElement,
  Primitive.Chip.Props & { label: string; removeLabel: string }
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
      className={comboboxClassName(
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

export const ComboboxAction = ({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>): React.ReactElement => (
  <div className="v2-combobox-footer">
    <Button
      {...props}
      type="button"
      variant="ghost"
      className={cn('w-full justify-start', className)}
    >
      <Plus aria-hidden="true" size={14} />
      {children}
    </Button>
  </div>
)

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
