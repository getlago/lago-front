import { Button } from 'lago-ui/button'
import { TooltipProvider } from 'lago-ui/tooltip'
import { ComponentType, useState } from 'react'

import { initializeTranslations } from '~/core/apolloClient/reactiveVars/internationalizationVar'
import { CurrencyEnum } from '~/generated/graphql'

import docs from './amount-input.md?raw'
import { AmountInputV2, AmountInputV2Props } from './AmountInputV2'
import { currencyOptions as options } from './currencies.story-data'

export default {
  title: 'Components/AmountInput',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  loaders: [
    async (): Promise<object> => {
      await initializeTranslations()
      return {}
    },
  ],
  decorators: [
    (Story: ComponentType): JSX.Element => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
}

function Example({
  selectable = false,
  ...props
}: Partial<Omit<AmountInputV2Props, 'mode' | 'currencyOptions' | 'onCurrencyChange'>> & {
  selectable?: boolean
}): JSX.Element {
  const [value, setValue] = useState(props.value ?? '123.45')
  const [currency, setCurrency] = useState(props.currency ?? CurrencyEnum.Usd)
  const mode = selectable
    ? { mode: 'selectable' as const, currencyOptions: options, onCurrencyChange: setCurrency }
    : { mode: 'fixed' as const }

  return (
    <AmountInputV2
      {...props}
      {...mode}
      currency={currency}
      value={value}
      onChange={setValue}
      aria-label={props['aria-label'] ?? 'Amount'}
    />
  )
}
function StatesExample({ selectable }: { selectable: boolean }): JSX.Element {
  return (
    <div className="max-w-[400px] space-y-6">
      <Example selectable={selectable} value="" aria-label="Empty amount" />
      <Example selectable={selectable} aria-label="Filled amount" />
      <Example selectable={selectable} disabled aria-label="Disabled amount" />
      <Example selectable={selectable} readOnly aria-label="Read-only amount" />
      <Example selectable={selectable} aria-invalid aria-label="Invalid amount" />
    </div>
  )
}
export const FixedCurrency = {
  render: (): JSX.Element => (
    <div className="w-full max-w-[400px]">
      <Example />
    </div>
  ),
}
export const SelectableCurrency = {
  render: (): JSX.Element => (
    <div className="w-full max-w-[400px]">
      <Example selectable />
    </div>
  ),
}
export const FixedStates = { render: (): JSX.Element => <StatesExample selectable={false} /> }
export const SelectableStates = { render: (): JSX.Element => <StatesExample selectable /> }
export const Precision = {
  render: (): JSX.Element => (
    <div className="max-w-[400px] space-y-6">
      <Example currency={CurrencyEnum.Usd} value="123.45" aria-label="USD two decimals" />
      <Example currency={CurrencyEnum.Jpy} value="123" aria-label="JPY integer" />
      <Example currency={CurrencyEnum.Bhd} value="123.456" aria-label="BHD three decimals" />
      <Example currency={CurrencyEnum.Clf} value="123.4567" aria-label="CLF four decimals" />
      <Example
        currency={CurrencyEnum.Usd}
        value="0.123456789012345"
        beforeChangeFormatter="chargeDecimal"
        aria-label="USD charge price, 15 decimals"
      />
    </div>
  ),
}
export const Units = {
  render: (): JSX.Element => (
    <div className="max-w-[400px] space-y-6">
      <Example prefix="" suffix="credits" aria-label="Credits" />
      <Example prefix="" suffix="%" beforeChangeFormatter="chargeDecimal" aria-label="Percentage" />
      <Example prefix="API call" chargePricingUnitShortName="API call" aria-label="Custom unit" />
      <Example prefix="" value="-12.30" aria-label="Negative amount" />
    </div>
  ),
}
function ResetExample(): JSX.Element {
  const [value, setValue] = useState('123.4567')
  const [currency, setCurrency] = useState(CurrencyEnum.Clf)

  return (
    <div className="max-w-[400px] space-y-6">
      <AmountInputV2
        mode="selectable"
        currencyOptions={options}
        currency={currency}
        onCurrencyChange={setCurrency}
        value={value}
        onChange={setValue}
        aria-label="Amount"
      />
      <output>
        {currency}: {value || '(empty)'}
      </output>
      <Button
        onClick={() => {
          setValue('123.4567')
          setCurrency(CurrencyEnum.Clf)
        }}
      >
        Reset amount and currency
      </Button>
    </div>
  )
}
export const CurrencyChangeAndReset = { render: (): JSX.Element => <ResetExample /> }

export const Widths = {
  render: (): JSX.Element => (
    <div className="space-y-6">
      <div className="w-[320px] max-w-full">
        <Example selectable />
      </div>
      <div className="w-[400px] max-w-full">
        <Example selectable />
      </div>
      <div className="w-[240px] max-w-full">
        <Example selectable />
      </div>
    </div>
  ),
}
