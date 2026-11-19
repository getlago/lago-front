import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import { AgentStorefrontIntegrationDetailsFragment, CurrencyEnum } from '~/generated/graphql'

type SoldPlan = AgentStorefrontIntegrationDetailsFragment['plans'][number]

type AmountCents = string | number | null | undefined

const hasAmount = (cents: AmountCents): cents is string | number =>
  cents !== null && cents !== undefined

const formatAmount = (cents: AmountCents, currency: CurrencyEnum): string => {
  if (!hasAmount(cents)) return '-'

  return intlFormatNumber(Number(deserializeAmount(cents, currency) || 0), {
    currency,
    minimumFractionDigits: getCurrencyPrecision(currency),
    currencyDisplay: 'symbol',
  })
}

export const formatTopupRange = ({
  plan,
  minimumTopupCents,
  maximumTopupCents,
}: SoldPlan): string => {
  if (!plan) return '-'
  if (!hasAmount(minimumTopupCents) && !hasAmount(maximumTopupCents)) return '-'

  return `${formatAmount(minimumTopupCents, plan.amountCurrency)} – ${formatAmount(maximumTopupCents, plan.amountCurrency)}`
}

export const formatFreeCredits = ({ plan, freeCreditsCents }: SoldPlan): string => {
  if (!plan) return '-'

  return formatAmount(freeCreditsCents, plan.amountCurrency)
}
