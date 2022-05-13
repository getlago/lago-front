import { CurrencyEnum } from '~/generated/graphql'

enum AmountUnit {
  cent = 'cent',
  standard = 'standard',
}

enum CurrencyDisplay {
  code = 'code',
  symbol = 'symbol',
}

enum AmountStyle {
  currency = 'currency',
  percent = 'percent',
  decimal = 'decimal',
}

export const formatAmountToCurrency: (
  amount: number,
  options?: {
    currency?: CurrencyEnum
    initialUnit?: keyof typeof AmountUnit
    currencyDisplay?: keyof typeof CurrencyDisplay
    style?: keyof typeof AmountStyle
    minimumFractionDigits?: number
  }
) => string = (amount, options) => {
  let formattedToUnit = amount
  const {
    initialUnit = 'cent',
    currencyDisplay = CurrencyDisplay.code,
    style = AmountStyle.currency,
    ...otherOptions
  } = options || {}

  if (initialUnit === AmountUnit['cent']) {
    formattedToUnit = amount / 100
  }

  return Number(formattedToUnit).toLocaleString('en-US', {
    style,
    currencyDisplay,
    ...otherOptions,
  })
}
