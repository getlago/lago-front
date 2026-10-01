import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'

type ChargeDetailsAmountOptions = {
  currency: CurrencyEnum
  pricingUnitShortName?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export const formatChargeDetailsAmount = (
  amount: number,
  {
    currency,
    pricingUnitShortName,
    minimumFractionDigits = 2,
    maximumFractionDigits = 15,
  }: ChargeDetailsAmountOptions,
): string =>
  intlFormatNumber(amount, {
    pricingUnitShortName,
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  })
