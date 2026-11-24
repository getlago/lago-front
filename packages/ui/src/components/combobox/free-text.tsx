import { Combobox as Primitive } from '@base-ui/react/combobox'
import * as React from 'react'

import { FreeTextContext } from './context'

import { Combobox } from '../combobox'

export interface ComboboxFreeTextProps<Value> extends Omit<
  Primitive.Root.Props<Value, true>,
  'multiple' | 'value' | 'defaultValue' | 'onValueChange' | 'defaultInputValue' | 'inputValue'
> {
  inputValue?: string
  value: Value[]
  onValueChange: (value: Value[]) => void
  createItem: (query: string) => Value
  getItemKey: (item: Value) => string
  validate?: (query: string, values: readonly Value[]) => string | null
  normalize?: (query: string) => string
  addLabel: (query: string) => string
  onValidationChange?: (message: string | null) => void
}

const normalizeQuery = (query: string): string => query.trim()

export function ComboboxFreeText<Value>({
  value,
  inputValue,
  onInputValueChange,
  onValueChange,
  createItem,
  getItemKey,
  validate,
  normalize = normalizeQuery,
  addLabel,
  onValidationChange,
  ...props
}: Readonly<ComboboxFreeTextProps<Value>>): React.ReactElement {
  const [internalQuery, setInternalQuery] = React.useState('')
  const query = inputValue ?? internalQuery
  const highlighted = React.useRef(false)
  const normalized = normalize(query)
  const validation = normalized ? validate?.(normalized, value) : null
  const setQuery = React.useCallback(
    (next: string, details: Primitive.Root.ChangeEventDetails): void => {
      onInputValueChange?.(next, details)
      if (details.isCanceled) return
      setInternalQuery(next)
      onValidationChange?.(null)
    },
    [onInputValueChange, onValidationChange],
  )
  const commit = React.useCallback(
    (event: React.SyntheticEvent): void => {
      if (!normalized || props.disabled || props.readOnly) return
      const message = validate?.(normalized, value) ?? null

      onValidationChange?.(message)
      if (message) return
      const details: Primitive.Root.ChangeEventDetails = {
        reason: 'input-clear',
        event: event.nativeEvent,
        trigger: event.currentTarget,
        isItemPress: true,
        isCanceled: false,
        isPropagationAllowed: false,
        cancel(): void {
          details.isCanceled = true
        },
        allowPropagation(): void {
          details.isPropagationAllowed = true
        },
      }

      onValueChange([...value, createItem(normalized)])
      setQuery('', details)
    },
    [
      normalized,
      props.disabled,
      props.readOnly,
      validate,
      value,
      onValidationChange,
      onValueChange,
      createItem,
      setQuery,
    ],
  )
  const context = React.useMemo(
    () => ({
      commit,
      hasQuery: !!normalized && !props.disabled && !props.readOnly,
      highlighted,
      canAdd: !!normalized && !validation && !props.disabled && !props.readOnly,
      addLabel: addLabel(normalized),
    }),
    [commit, normalized, props.disabled, props.readOnly, validation, addLabel],
  )

  return (
    <FreeTextContext.Provider value={context}>
      <Combobox
        {...props}
        multiple
        isItemEqualToValue={
          props.isItemEqualToValue ??
          ((item, selected) => getItemKey(item) === getItemKey(selected))
        }
        value={value}
        inputValue={query}
        onValueChange={(next, details) => {
          const added = next.find(
            (item) => !value.some((selected) => getItemKey(item) === getItemKey(selected)),
          )
          const message =
            added === undefined
              ? null
              : (validate?.(normalize(props.itemToStringLabel?.(added) ?? String(added)), value) ??
                null)

          onValidationChange?.(message)
          if (message) {
            details.cancel()
            return
          }
          onValueChange(next)
        }}
        onInputValueChange={(next, details) => {
          if (details.reason === 'input-clear' && !details.isItemPress) {
            details.cancel()
            return
          }
          setQuery(next, details)
        }}
        onItemHighlighted={(item, details) => {
          highlighted.current = item !== undefined
          props.onItemHighlighted?.(item, details)
        }}
      />
    </FreeTextContext.Provider>
  )
}
