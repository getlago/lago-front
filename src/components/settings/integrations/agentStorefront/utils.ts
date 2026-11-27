import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, getCurrencyPrecision } from '~/core/serializers/serializeAmount'
import {
  AgentStorefrontPlanInput,
  AgentStorefrontSoldPlansFragment,
  CurrencyEnum,
} from '~/generated/graphql'

export type SoldPlan = AgentStorefrontSoldPlansFragment['plans'][number]

export type SoldPlanAmounts = Pick<
  AgentStorefrontPlanInput,
  'minimumTopupCents' | 'maximumTopupCents' | 'freeCreditsCents'
>

export type SoldPlanChange =
  | { type: 'sell'; planCode: string; amounts: SoldPlanAmounts }
  | { type: 'edit'; planCode: string; amounts: SoldPlanAmounts }
  | { type: 'stop'; planCode: string }

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

export const getSoldPlanName = ({ plan, planCode }: SoldPlan): string =>
  plan?.invoiceDisplayName || plan?.name || planCode

const toSoldPlanInput = ({
  planCode,
  minimumTopupCents,
  maximumTopupCents,
  freeCreditsCents,
}: SoldPlan): AgentStorefrontPlanInput => ({
  planCode,
  minimumTopupCents,
  maximumTopupCents,
  freeCreditsCents,
})

export const applySoldPlanChange = (
  soldPlans: SoldPlan[],
  change: SoldPlanChange,
): AgentStorefrontPlanInput[] | null => {
  const inputs = soldPlans.map(toSoldPlanInput)
  const isSold = inputs.some(({ planCode }) => planCode === change.planCode)

  if (change.type === 'sell') {
    if (isSold) return null

    return [...inputs, { planCode: change.planCode, ...change.amounts }]
  }

  if (!isSold) return null

  if (change.type === 'stop') {
    return inputs.filter(({ planCode }) => planCode !== change.planCode)
  }

  return inputs.map((input) =>
    input.planCode === change.planCode ? { ...change.amounts, planCode: input.planCode } : input,
  )
}
