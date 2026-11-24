import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxSearch,
  ComboboxSeparator,
  ComboboxTrigger,
} from 'lago-ui/combobox'
import { RefObject, useMemo, useState } from 'react'

import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export interface CurrencyOption {
  value: CurrencyEnum
  label: string
}
interface CurrencyPickerProps {
  currency: CurrencyEnum
  options: readonly CurrencyOption[]
  onChange: (currency: CurrencyEnum) => void
  disabled?: boolean
  anchor: RefObject<HTMLDivElement>
}

const currencyKey = (value: CurrencyEnum): string => value
const currencyRowSize = (): number => 52

export const CurrencyPicker = ({
  currency,
  options,
  onChange,
  disabled,
  anchor,
}: CurrencyPickerProps): JSX.Element => {
  const { translate } = useInternationalization()
  const [query, setQuery] = useState('')
  const items = useMemo(() => options.map((option) => option.value), [options])
  const labels = useMemo(
    () => new Map(options.map(({ value, label }) => [value, label])),
    [options],
  )

  return (
    <Combobox<CurrencyEnum>
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
        `${value} ${labels.get(value) || ''}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())
      }
    >
      <ComboboxTrigger
        variant="input"
        className="v2-amount-currency"
        aria-label={translate('text_1795458691058ndiz7xihicb', { currency })}
      >
        {currency}
      </ComboboxTrigger>
      <ComboboxContent anchor={anchor}>
        <ComboboxSearch
          aria-label={translate('text_1795458691058dmcgdfghi2t')}
          placeholder={translate('text_1795458691058dmcgdfghi2t')}
          showClear={!!query}
          clearLabel={translate('text_1795458691058olq3knc6zqw')}
          onClear={() => setQuery('')}
        />
        <ComboboxSeparator />
        <ComboboxEmpty>{translate('text_1795458691058gq6sghbx4i2')}</ComboboxEmpty>
        <ComboboxList getItemKey={currencyKey} estimateSize={currencyRowSize}>
          {(value) => (
            <ComboboxItem value={value}>
              <div>{value}</div>
              <div className="v2-text-caption text-text-muted">{labels.get(value)}</div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
