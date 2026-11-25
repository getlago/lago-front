import type { Meta } from '@storybook/react-vite'
import { useState } from 'react'

import { AmountInput } from './amount-input'
import docs from './amount-input.md?raw'
import { TooltipProvider } from './tooltip'

import { acceptValue, currencyLabels, currencyOptions } from '../stories/amount-input-data'

export default {
  title: 'Components/AmountInput',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta

function Example({
  selectable = false,
  disabled = false,
  readOnly = false,
  invalid = false,
  initialValue = '123.45',
}: {
  selectable?: boolean
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  initialValue?: string
}): JSX.Element {
  const [value, setValue] = useState(initialValue)
  const [currency, setCurrency] = useState('USD')
  const mode = selectable
    ? {
        mode: 'selectable' as const,
        currencyOptions,
        onCurrencyChange: setCurrency,
        currencyLabels: { ...currencyLabels, trigger: `Currency, ${currency}` },
      }
    : { mode: 'fixed' as const }

  return (
    <AmountInput
      {...mode}
      currency={currency}
      value={value}
      onChange={setValue}
      formatValue={acceptValue}
      placeholder="0.00"
      aria-label="Amount"
      disabled={disabled}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
    />
  )
}
function States({ selectable }: { selectable: boolean }): JSX.Element {
  return (
    <div className="max-w-[400px] space-y-6">
      <Example selectable={selectable} initialValue="" />
      <Example selectable={selectable} />
      <Example selectable={selectable} disabled />
      <Example selectable={selectable} readOnly />
      <Example selectable={selectable} invalid />
    </div>
  )
}
export const FixedCurrency = {
  render: (): JSX.Element => (
    <div className="max-w-[400px]">
      <Example />
    </div>
  ),
}
export const SelectableCurrency = {
  render: (): JSX.Element => (
    <div className="max-w-[400px]">
      <Example selectable />
    </div>
  ),
}
export const FixedStates = { render: (): JSX.Element => <States selectable={false} /> }
export const SelectableStates = { render: (): JSX.Element => <States selectable /> }
