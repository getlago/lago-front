import { Combobox as Primitive } from '@base-ui/react/combobox'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import * as React from 'react'

import { Badge } from './badge'
import { badgeVariants } from './badge-variants'
import { Button } from './button'
import { ColorThemePortal } from './color-theme'
import './combobox.css'
import { IconButton } from './icon-button'
import { SearchInput } from './input'
import { Separator } from './separator'

import { ComboboxText } from '../lib/combobox-text'
import { cn } from '../lib/utils'

export interface ComboboxOption {
  value: string
  label?: string
  description?: string
  group?: string
  disabled?: boolean
  hidden?: boolean
}

interface ComboboxCommonProps extends Pick<
  React.AriaAttributes,
  'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid'
> {
  id?: string
  name?: string
  options: ComboboxOption[]
  selectedOptions?: ComboboxOption[]
  placeholder: string
  searchLabel: string
  clearSearchLabel: string
  emptyText: string
  loadingText: string
  loading?: boolean
  errorText?: string
  disabled?: boolean
  readOnly?: boolean
  query?: string
  onQueryChange?: (query: string) => void
  filter?: 'local' | 'server'
  onOpenChange?: (open: boolean) => void
  createAction?: { label: string; onClick: () => void; disabled?: boolean; loading?: boolean }
  renderOption?: (option: ComboboxOption) => React.ReactNode
  portalContainer?: HTMLElement | null
  className?: string
}

type SingleSelectionProps = {
  multiple?: false
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
}

type MultipleSelectionProps = {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  placement?: 'inside' | 'above'
  chipsLabel: string
  removeLabel: (label: string) => string
}

export type ComboboxProps = ComboboxCommonProps & (SingleSelectionProps | MultipleSelectionProps)

export interface ComboboxChipProps {
  label: string
  removeLabel: string
  showRemove?: boolean
  disabled?: boolean
  onRemove?: (event: React.SyntheticEvent<HTMLButtonElement>) => void
}

export const ComboboxChip = ({
  label,
  removeLabel,
  showRemove = true,
  disabled,
  onRemove,
}: ComboboxChipProps): React.ReactElement => (
  <Primitive.Chip
    data-slot="combobox-chip"
    className={cn(
      badgeVariants({ variant: disabled ? 'disabled' : 'neutral' }),
      'v2-combobox-chip',
      showRemove && !disabled && 'pr-0.5',
    )}
  >
    <ComboboxText text={label} />
    {showRemove && !disabled && (
      <Primitive.ChipRemove
        render={<IconButton label={removeLabel} size="icon-xs" variant="ghost" />}
        tabIndex={0}
        onClick={onRemove}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onRemove?.(event)
        }}
      >
        <X aria-hidden="true" />
      </Primitive.ChipRemove>
    )}
  </Primitive.Chip>
)

export const ComboboxChips = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Primitive.Chips>
>(({ className, ...props }, ref) => (
  <Primitive.Chips
    {...props}
    ref={ref}
    data-slot="combobox-chips"
    className={cn('v2-combobox-chips', className)}
  />
))
ComboboxChips.displayName = 'ComboboxChips'

const normalize = (value: string): string =>
  value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (props, forwardedRef) => {
    const {
      options,
      selectedOptions = [],
      placeholder,
      searchLabel,
      clearSearchLabel,
      emptyText,
      loadingText,
      loading = false,
      errorText,
      disabled = false,
      readOnly = false,
      query: controlledQuery,
      onQueryChange,
      filter = 'local',
      onOpenChange,
      createAction,
      renderOption,
      portalContainer,
      className,
      id,
      name,
    } = props
    const [localQuery, setLocalQuery] = React.useState('')
    const [open, setOpen] = React.useState(false)
    const initialValue = React.useRef(props.defaultValue ?? (props.multiple ? [] : null))
    const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue.current)
    const query = controlledQuery ?? localQuery
    const triggerRef = React.useRef<HTMLButtonElement | null>(null)
    const surfaceRef = React.useRef<HTMLDivElement>(null)
    const searchRef = React.useRef<HTMLInputElement>(null)
    const placement = props.multiple ? (props.placement ?? 'inside') : 'inside'
    const labelFor = (value: string): string => {
      const option =
        options.find((item) => item.value === value) ??
        selectedOptions.find((item) => item.value === value)

      return option?.label ?? value
    }
    const changeQuery = (next: string): void => {
      setLocalQuery(next)
      onQueryChange?.(next)
    }
    const visibleOptions = options.filter(
      (option) =>
        !option.hidden &&
        (filter === 'server' ||
          normalize(`${option.label ?? option.value} ${option.value}`).includes(
            normalize(query.trim()),
          )),
    )
    const resultOptions = loading || errorText ? [] : visibleOptions
    const groups = new Map<string, ComboboxOption[]>()

    for (const option of resultOptions) {
      const key = option.group ?? ''
      const group = groups.get(key) ?? []

      group.push(option)
      groups.set(key, group)
    }

    const associations = {
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      'aria-describedby': props['aria-describedby'],
      'aria-invalid': props['aria-invalid'],
    }
    const focusAfterRemoval = (event: React.SyntheticEvent<HTMLButtonElement>): void => {
      const chips = surfaceRef.current?.querySelectorAll<HTMLButtonElement>(
        '[data-slot="combobox-chip"] button',
      )
      const index = chips ? Array.from(chips).indexOf(event.currentTarget) : -1
      const next = chips?.[index + 1] ?? chips?.[index - 1] ?? triggerRef.current

      queueMicrotask(() => next?.focus())
    }

    React.useEffect(() => {
      const form = surfaceRef.current?.closest('form')
      const reset = (event: Event): void => {
        queueMicrotask(() => {
          if (event.defaultPrevented) return
          setUncontrolledValue(initialValue.current)
          setOpen(false)
          setLocalQuery('')
        })
      }

      form?.addEventListener('reset', reset)

      return (): void => form?.removeEventListener('reset', reset)
    }, [])
    const renderChips = (values: string[]): React.ReactNode => {
      if (!props.multiple || values.length === 0) return null

      return (
        <ComboboxChips aria-label={props.chipsLabel}>
          {values.map((value) => (
            <ComboboxChip
              key={value}
              label={labelFor(value)}
              removeLabel={props.removeLabel(labelFor(value))}
              disabled={disabled}
              onRemove={focusAfterRemoval}
            />
          ))}
        </ComboboxChips>
      )
    }
    const renderSurface = (selection: string | string[] | null): React.ReactElement => {
      const values = Array.isArray(selection) ? selection : []
      const insideChips = props.multiple && placement === 'inside' && values.length > 0

      if (readOnly && props.multiple)
        return (
          <div
            ref={surfaceRef}
            {...associations}
            id={id}
            data-slot="combobox"
            role="group"
            className={cn('v2-combobox-readonly', className)}
          >
            {values.map((value) => (
              <Badge key={value} className="max-w-full shrink">
                <ComboboxText text={labelFor(value)} />
              </Badge>
            ))}
            {values.length === 0 && (
              <span className="v2-text-body text-text-subtle">{placeholder}</span>
            )}
          </div>
        )

      const triggerText =
        !props.multiple && typeof selection === 'string' ? labelFor(selection) : placeholder

      return (
        <div
          ref={surfaceRef}
          data-slot="combobox"
          data-placement={placement}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          className={cn('v2-combobox v2-text-body', className)}
        >
          {props.multiple && placement === 'above' && renderChips(values)}
          <div
            className="v2-combobox-control"
            data-invalid={props['aria-invalid']}
            data-open={open || undefined}
          >
            {insideChips && renderChips(values)}
            <Primitive.Trigger
              {...associations}
              id={id}
              ref={(node) => {
                triggerRef.current = node
                if (typeof forwardedRef === 'function') forwardedRef(node)
                else if (forwardedRef) forwardedRef.current = node
              }}
              className={cn('v2-combobox-trigger', insideChips && 'v2-combobox-trigger-overlay')}
            >
              {!insideChips && (
                <span className={cn('min-w-0 flex-1 text-left', !selection && 'text-text-subtle')}>
                  <ComboboxText text={triggerText} />
                </span>
              )}
              {insideChips && (
                <span className="sr-only">
                  {placeholder}: {values.map(labelFor).join(', ')}
                </span>
              )}
              {!readOnly && (
                <ChevronsUpDown
                  aria-hidden="true"
                  size={14}
                  className="ml-auto shrink-0 text-icon-muted"
                />
              )}
            </Primitive.Trigger>
          </div>
        </div>
      )
    }
    const renderItem = (option: ComboboxOption): React.ReactElement => (
      <Primitive.Item
        key={option.value}
        value={option.value}
        disabled={option.disabled}
        className="v2-combobox-item"
        aria-label={option.label ?? option.value}
      >
        <span className="min-w-0 flex-1">
          {renderOption ? (
            renderOption(option)
          ) : (
            <ComboboxText text={option.label ?? option.value} />
          )}
          {option.description && (
            <span className="v2-text-caption block text-text-muted">
              <ComboboxText text={option.description} />
            </span>
          )}
        </span>
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          <Primitive.ItemIndicator>
            <Check size={14} aria-hidden="true" />
          </Primitive.ItemIndicator>
        </span>
      </Primitive.Item>
    )
    const renderStatus = (): React.ReactNode => {
      if (loading)
        return (
          <div role="status" className="v2-combobox-status">
            {loadingText}
          </div>
        )
      if (errorText)
        return (
          <div role="alert" className="v2-combobox-status">
            {errorText}
          </div>
        )
      if (resultOptions.length === 0)
        return (
          <div role="status" className="v2-combobox-status">
            {emptyText}
          </div>
        )

      return null
    }
    const renderResults = (): React.ReactNode => {
      return Array.from(groups, ([group, items]) => {
        if (!group) return items.map(renderItem)

        return (
          <Primitive.Group key={group}>
            <Primitive.GroupLabel className="v2-combobox-group-label v2-text-caption">
              {group}
            </Primitive.GroupLabel>
            {items.map(renderItem)}
          </Primitive.Group>
        )
      })
    }

    return (
      <Primitive.Root<string, boolean>
        multiple={props.multiple}
        value={props.value === undefined ? uncontrolledValue : props.value}
        onValueChange={(value) => {
          if (props.value === undefined) setUncontrolledValue(value)
          if (props.multiple) props.onValueChange?.(Array.isArray(value) ? [...new Set(value)] : [])
          else props.onValueChange?.(typeof value === 'string' ? value : null)
        }}
        name={name}
        disabled={disabled}
        readOnly={readOnly}
        items={resultOptions.map((option) => option.value)}
        filter={null}
        itemToStringLabel={labelFor}
        inputValue={query}
        onInputValueChange={(value, details) => {
          if (props.multiple && details.isItemPress) {
            details.cancel()
            return
          }
          changeQuery(value)
        }}
        open={open && !disabled && !readOnly}
        onOpenChange={(next, details) => {
          if (props.multiple && !next && details.reason === 'item-press') {
            details.cancel()
            return
          }
          setOpen(next)
          onOpenChange?.(next)
          if (!next) changeQuery('')
        }}
      >
        <Primitive.Value>{renderSurface}</Primitive.Value>
        <Primitive.Portal container={portalContainer}>
          <ColorThemePortal asChild>
            <Primitive.Positioner
              anchor={placement === 'above' ? triggerRef : surfaceRef}
              sideOffset={8}
              align="start"
              className="v2-combobox-positioner"
            >
              <Primitive.Popup
                aria-label={searchLabel}
                className="v2-combobox-popup v2-text-body"
                initialFocus={searchRef}
              >
                <div className="v2-combobox-search">
                  <Primitive.Input
                    ref={searchRef}
                    aria-label={searchLabel}
                    placeholder={searchLabel}
                    render={<SearchInput />}
                    className="pr-11"
                  />
                  {query && (
                    <IconButton
                      label={clearSearchLabel}
                      size="icon-sm"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        changeQuery('')
                        searchRef.current?.focus()
                      }}
                    >
                      <X aria-hidden="true" />
                    </IconButton>
                  )}
                </div>
                <Separator className="v2-combobox-separator" />
                {renderStatus()}
                <Primitive.List className="v2-combobox-list" aria-busy={loading}>
                  {renderResults()}
                </Primitive.List>
                {createAction && (
                  <div className="v2-combobox-footer">
                    <Separator className="v2-combobox-separator" />
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      disabled={createAction.disabled}
                      loading={createAction.loading}
                      onClick={() => {
                        setOpen(false)
                        changeQuery('')
                        onOpenChange?.(false)
                        createAction.onClick()
                      }}
                    >
                      <Plus aria-hidden="true" />
                      {createAction.label}
                    </Button>
                  </div>
                )}
              </Primitive.Popup>
            </Primitive.Positioner>
          </ColorThemePortal>
        </Primitive.Portal>
      </Primitive.Root>
    )
  },
)
Combobox.displayName = 'Combobox'
