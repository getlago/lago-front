import { RefObject, useMemo, useState } from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxSeparator,
  ComboboxTrigger,
} from '../combobox'

export interface CurrencyOption<Currency extends string = string> {
  value: Currency
  label: string
}
export interface CurrencyLabels {
  trigger: string
  search: string
  clear: string
  empty: string
}
interface CurrencyPickerProps<Currency extends string> {
  labels: CurrencyLabels
  currency: Currency
  options: readonly CurrencyOption<Currency>[]
  onChange: (currency: Currency) => void
  disabled?: boolean
  anchor: RefObject<HTMLDivElement>
}

const currencyKey = (value: string): string => value
const currencyRowSize = (): number => 52

export const CurrencyPicker = <Currency extends string>({
  labels,
  currency,
  options,
  onChange,
  disabled,
  anchor,
}: CurrencyPickerProps<Currency>): JSX.Element => {
  const [query, setQuery] = useState('')
  const items = useMemo(() => options.map((option) => option.value), [options])
  const currencyNames = useMemo(
    () => new Map(options.map(({ value, label }) => [value, label])),
    [options],
  )

  return (
    <Combobox<Currency>
      virtualized
      items={items}
      value={currency}
      onValueChange={(value) => {
        if (value !== null) onChange(value)
      }}
      disabled={disabled}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open) => {
        if (!open) setQuery('')
      }}
      filter={(value, search) =>
        `${value} ${currencyNames.get(value) || ''}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())
      }
    >
      <ComboboxTrigger variant="input" className="v2-amount-currency" aria-label={labels.trigger}>
        {currency}
      </ComboboxTrigger>
      <ComboboxContent anchor={anchor}>
        <ComboboxSearch
          aria-label={labels.search}
          placeholder={labels.search}
          showClear={!!query}
          clearLabel={labels.clear}
          onClear={() => setQuery('')}
        />
        <ComboboxSeparator />
        <ComboboxEmpty>{labels.empty}</ComboboxEmpty>
        <ComboboxList<Currency> getItemKey={currencyKey} estimateSize={currencyRowSize}>
          {(value) => (
            <ComboboxItem value={value}>
              <div>{value}</div>
              <div className="v2-text-caption text-text-muted">{currencyNames.get(value)}</div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
