import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CouponTypeEnum, CurrencyEnum } from '~/generated/graphql'

export function formatCouponValue(params: {
  couponType?: CouponTypeEnum | null
  percentageRate?: number | string | null
  amountCents?: number | null
  amountCurrency?: CurrencyEnum | null
}): string {
  const { couponType, percentageRate, amountCents, amountCurrency } = params

  if (couponType === CouponTypeEnum.Percentage) {
    // Format as percent
    return intlFormatNumber(Number(percentageRate) / 100 || 0, {
      style: 'percent',
    })
  }
  // Format as amount with currency
  return intlFormatNumber(
    deserializeAmount(amountCents ?? 0, amountCurrency || CurrencyEnum.Usd) || 0,
    {
      currencyDisplay: 'symbol',
      currency: amountCurrency || CurrencyEnum.Usd,
      minimumFractionDigits: 2,
      maximumFractionDigits: 15,
    },
  )
}
