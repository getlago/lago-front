import { CurrencyEnum } from '~/generated/graphql'

enum CurrencyDisplay {
  code = 'code',
  symbol = 'symbol',
}

enum AmountStyle {
  currency = 'currency',
  percent = 'percent',
  decimal = 'decimal',
}

export const intlFormatNumber: (
  amount: number,
  options?: {
    currency?: CurrencyEnum
    currencyDisplay?: keyof typeof CurrencyDisplay
    style?: keyof typeof AmountStyle
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
) => string = (amount, options) => {
  let formattedToUnit = amount

  const {
    currencyDisplay = CurrencyDisplay.symbol,
    style = AmountStyle.currency,
    currency = CurrencyEnum.Usd,
    ...otherOptions
  } = options || {}

  return Number(formattedToUnit).toLocaleString('en-US', {
    style,
    currencyDisplay,
    currency,
    ...otherOptions,
  })
}

export const getCurrencySymbol = (currencyCode: CurrencyEnum) => {
  return (1)
    .toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
    })
    .replace(/[\d\., ]/g, '')
}
