import { AmountInput, AmountInputProps } from 'lago-ui/amount-input'
import { Button } from 'lago-ui/button'
import { TooltipProvider } from 'lago-ui/tooltip'
import { ComponentType, useState } from 'react'

import {
  AmountFormattingOptions,
  definedDefaultPlaceholder,
  defineNewBeforeChangeFormatter,
} from '~/components/form/AmountInput/formatting'
import { formatValue } from '~/components/form/TextInput/formatValue'
import { initializeTranslations } from '~/core/apolloClient/reactiveVars/internationalizationVar'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { currencyOptions as options } from './currencies.story-data'

export default {
  title: 'Components/AmountInput/App integration',
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
  beforeChangeFormatter,
  chargePricingUnitShortName,
  ...props
}: Partial<
  Omit<
    AmountInputProps<CurrencyEnum>,
    'mode' | 'currencyOptions' | 'onCurrencyChange' | 'currencyLabels' | 'formatValue'
  >
> &
  Partial<AmountFormattingOptions> & {
    selectable?: boolean
  }): JSX.Element {
  const { translate } = useInternationalization()
  const [value, setValue] = useState(props.value ?? '123.45')
  const [currency, setCurrency] = useState(props.currency ?? CurrencyEnum.Usd)
  const mode = selectable
    ? {
        mode: 'selectable' as const,
        currencyOptions: options,
        onCurrencyChange: setCurrency,
        currencyLabels: {
          trigger: translate('text_1795458691058ndiz7xihicb', { currency }),
          search: translate('text_1795458691058dmcgdfghi2t'),
          clear: translate('text_1795458691058olq3knc6zqw'),
          empty: translate('text_1795458691058gq6sghbx4i2'),
        },
      }
    : { mode: 'fixed' as const }

  return (
    <AmountInput
      {...props}
      formatValue={(raw) =>
        formatValue(
          raw,
          defineNewBeforeChangeFormatter({
            currency,
            beforeChangeFormatter,
            chargePricingUnitShortName,
          }),
        )
      }
      placeholder={
        props.placeholder ??
        definedDefaultPlaceholder({ currency, chargePricingUnitShortName, translate })
      }
      {...mode}
      currency={currency}
      value={value}
      onChange={setValue}
      aria-label={props['aria-label'] ?? 'Amount'}
    />
  )
}
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
  const { translate } = useInternationalization()
  const [value, setValue] = useState('123.4567')
  const [currency, setCurrency] = useState(CurrencyEnum.Clf)

  return (
    <div className="max-w-[400px] space-y-6">
      <AmountInput
        formatValue={(raw) => formatValue(raw, defineNewBeforeChangeFormatter({ currency }))}
        placeholder={definedDefaultPlaceholder({ currency, translate })}
        currencyLabels={{
          trigger: translate('text_1795458691058ndiz7xihicb', { currency }),
          search: translate('text_1795458691058dmcgdfghi2t'),
          clear: translate('text_1795458691058olq3knc6zqw'),
          empty: translate('text_1795458691058gq6sghbx4i2'),
        }}
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
