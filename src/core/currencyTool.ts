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

export const formatAmountToCurrency: (
  amount: number,
  currency: CurrencyEnum,
  initialUnit?: keyof typeof AmountUnit
) => string = (amount, currency, initialUnit = 'cent') => {
  let formattedToUnit = amount

  if (initialUnit === AmountUnit['cent']) {
    formattedToUnit = amount / 100
  }

  return formattedToUnit.toLocaleString(mapCurrency(currency), {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  })
}
