import { Combobox as Primitive } from '@base-ui/react/combobox'
import * as React from 'react'

import { Combobox } from '../combobox'
import { FreeTextContext } from '../combobox-context'

export interface ComboboxFreeTextProps<Value> extends Omit<
  Primitive.Root.Props<Value, true>,
  | 'multiple'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'inputValue'
  | 'defaultInputValue'
  | 'onInputValueChange'
> {
  inputValue?: string
  onInputValueChange?: (value: string) => void
  value: Value[]
  onValueChange: (value: Value[]) => void
  createItem: (query: string) => Value
  getItemKey: (item: Value) => string
  validate?: (query: string) => string | null
  normalize?: (query: string) => string
  addLabel: (query: string) => string
  duplicateMessage: string
  onValidationChange?: (message: string | null) => void
  errorId?: string
}

export function ComboboxFreeText<Value>({
  value,
  inputValue,
  onInputValueChange,
  onValueChange,
  createItem,
  getItemKey,
  validate = () => null,
  normalize = (query) => query.trim(),
  addLabel,
  duplicateMessage,
  onValidationChange,
  errorId,
  ...props
}: ComboboxFreeTextProps<Value>): React.ReactElement {
  const [internalQuery, setInternalQuery] = React.useState('')
  const query = inputValue ?? internalQuery
  const setQuery = (next: string): void => {
    setInternalQuery(next)
    onInputValueChange?.(next)
  }
  const [error, setError] = React.useState<string | null>(null)
  const highlighted = React.useRef(false)
  const normalized = normalize(query)
  const validation = normalized ? validate(normalized) : null
  const duplicate =
    !!normalized &&
    !validation &&
    value.some((item) => getItemKey(item) === getItemKey(createItem(normalized)))
  const setValidation = (message: string | null): void => {
    setError(message)
    onValidationChange?.(message)
  }
  const commit = (): void => {
    if (!normalized || props.disabled || props.readOnly) return
    const message = validation || (duplicate ? duplicateMessage : null)

    setValidation(message)
    if (message) return
    onValueChange([...value, createItem(normalized)])
    setQuery('')
  }

  return (
    <FreeTextContext.Provider
      value={{
        commit,
        highlighted,
        canAdd: !!normalized && !validation && !duplicate && !props.disabled && !props.readOnly,
        addLabel: addLabel(normalized),
        invalid: !!error,
        errorId: error ? errorId : undefined,
      }}
    >
      <Combobox
        {...props}
        multiple
        value={value}
        inputValue={query}
        onValueChange={(next) => {
          onValueChange(next)
          setValidation(null)
        }}
        onInputValueChange={(next, details) => {
          if (details.reason === 'input-clear' && !details.isItemPress) {
            details.cancel()
            return
          }
          setQuery(next)
          setValidation(null)
        }}
        onItemHighlighted={(item, details) => {
          highlighted.current = item !== undefined
          props.onItemHighlighted?.(item, details)
        }}
      />
    </FreeTextContext.Provider>
  )
}
