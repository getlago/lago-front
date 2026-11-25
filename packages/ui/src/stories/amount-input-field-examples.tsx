import { useId, useState } from 'react'

import { acceptValue, currencyLabels, currencyOptions } from './amount-input-data'

import { AmountInput } from '../components/amount-input'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldHelp,
  FieldLabel,
} from '../components/field'

function Example({ selectable, state }: { selectable: boolean; state: string }): JSX.Element {
  const id = useId()
  const [value, setValue] = useState(state === 'Empty' ? '' : '123.45')
  const [currency, setCurrency] = useState('USD')
  const invalid = state === 'Invalid' || state === 'Invalid without message'
  const error = state === 'Invalid' ? 'Enter a valid amount.' : undefined
  const mode = selectable
    ? {
        mode: 'selectable' as const,
        currencyOptions,
        onCurrencyChange: setCurrency,
        currencyLabels: { ...currencyLabels, trigger: `Currency, ${currency}` },
      }
    : { mode: 'fixed' as const }

  return (
    <Field data-disabled={state === 'Disabled' || undefined}>
      <FieldContent>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor={id}>Amount · {state}</FieldLabel>
          <FieldHelp label="About amount">Currency changes preserve the entered amount.</FieldHelp>
        </div>
        <FieldDescription id={`${id}-description`}>
          {selectable ? 'Choose a currency and enter an amount.' : 'Enter an amount in USD.'}
        </FieldDescription>
      </FieldContent>
      <AmountInput
        {...mode}
        formatValue={acceptValue}
        placeholder="0.00"
        id={id}
        currency={currency}
        value={value}
        onChange={setValue}
        disabled={state === 'Disabled'}
        readOnly={state === 'Read-only'}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-description${error ? ` ${id}-error` : ''}`}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  )
}
export function AmountFieldStates({ selectable }: { selectable: boolean }): JSX.Element {
  return (
    <div className="max-w-[400px] space-y-6">
      {['Empty', 'Filled', 'Disabled', 'Read-only', 'Invalid', 'Invalid without message'].map(
        (state) => (
          <Example key={state} state={state} selectable={selectable} />
        ),
      )}
    </div>
  )
}
