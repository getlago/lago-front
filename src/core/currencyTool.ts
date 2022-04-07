import { CurrencyEnum } from '~/generated/graphql'

const mapCurrency: (currency: CurrencyEnum) => string = (currency) => {
  switch (currency) {
    case CurrencyEnum.Usd:
      return 'en-US'
    default:
      return 'fr-FR'
  }
}

export const formatAmount: (amount: number, currency: CurrencyEnum) => string = (
  amount,
  currency
) => {
  return amount.toLocaleString(mapCurrency(currency), {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  })
}
