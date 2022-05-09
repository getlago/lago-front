import { CurrencyEnum } from '~/generated/graphql'

const mapCurrency: (currency: CurrencyEnum) => string = (currency) => {
  switch (currency) {
    case CurrencyEnum.Usd:
      return 'en-US'
    default:
      return 'fr-FR'
  }
}

enum AmountUnit {
  cent = 'cent',
  standard = 'standard',
}

enum CurrencyDisplay {
  code = 'code',
  symbol = 'symbol',
}

export const formatAmountToCurrency: (
  amount: number,
  currency: CurrencyEnum,
  options?: {
    initialUnit?: keyof typeof AmountUnit
    currencyDisplay?: keyof typeof CurrencyDisplay
  }
) => string = (amount, currency, options) => {
  let formattedToUnit = amount
  const { initialUnit = 'cent', currencyDisplay = CurrencyDisplay.code } = options || {}

  if (initialUnit === AmountUnit['cent']) {
    formattedToUnit = amount / 100
  }

  return formattedToUnit.toLocaleString(mapCurrency(currency), {
    style: 'currency',
    currency,
    currencyDisplay,
  })
}
