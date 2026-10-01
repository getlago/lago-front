import Decimal from 'decimal.js'

import { RateCardRateModelEnum } from '~/generated/graphql'

export const RATE_TIER_UP_TO_KEY = 'text_17908879231882xquji7dat9'
export const RATE_TIER_FIRST_LABEL_KEY = 'text_1790887923188zkz50zctwn0'
export const RATE_TIER_NEXT_LABEL_KEY = 'text_1790887923188ftf3no9cjov'
export const RATE_TIER_TOTAL_UNITS_LABEL_KEY = 'text_6304e74aab6dbc18d615f3a2'

export const getTierLabelKey = (index: number): string =>
  index === 0 ? RATE_TIER_FIRST_LABEL_KEY : RATE_TIER_NEXT_LABEL_KEY

export const RATE_TIER_LIST_NAMES = [
  'graduatedRanges',
  'volumeRanges',
  'graduatedPercentageRanges',
] as const

export const parseDecimal = (value: string | number | null | undefined): Decimal | undefined => {
  if (value === null || value === undefined || value === '') return undefined

  try {
    const decimal = new Decimal(value)

    return decimal.isFinite() ? decimal : undefined
  } catch {
    return undefined
  }
}

export const RATE_TIER_UP_TO_ERROR_KEY = 'text_6304e74aab6dbc18d615f420'

export type TieredRateModel =
  | RateCardRateModelEnum.Graduated
  | RateCardRateModelEnum.Volume
  | RateCardRateModelEnum.GraduatedPercentage

const TIERED_RATE_MODELS: ReadonlySet<RateCardRateModelEnum> = new Set([
  RateCardRateModelEnum.Graduated,
  RateCardRateModelEnum.Volume,
  RateCardRateModelEnum.GraduatedPercentage,
])

export const isTieredRateModel = (rateModel: RateCardRateModelEnum): rateModel is TieredRateModel =>
  TIERED_RATE_MODELS.has(rateModel)

type RateTierBound = { toValue?: string | null }

export const getTierLowerBound = (tiers: RateTierBound[], index: number): Decimal => {
  if (index === 0) return new Decimal(0)

  return parseDecimal(tiers[index - 1]?.toValue) ?? new Decimal(0)
}

export const getNextTierUpTo = (tiers: RateTierBound[]): string =>
  getTierLowerBound(tiers, Math.max(tiers.length - 1, 0))
    .plus(1)
    .toFixed()
