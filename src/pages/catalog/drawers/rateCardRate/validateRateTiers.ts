import { z } from 'zod'

import {
  isInvalidAmount,
  isInvalidRate,
  isNonEmptyNaN,
} from '~/formValidation/chargePropertiesSchema'
import {
  RateCardRateModelEnum,
  RatePercentageTierInput,
  RatePropertiesInput,
  RateTierInput,
} from '~/generated/graphql'

import { VALUE_REQUIRED_KEY } from './constants'

import {
  getTierLowerBound,
  parseDecimal,
  RATE_TIER_UP_TO_ERROR_KEY,
  TieredRateModel,
} from '../../rateProperties/tiers/rateTiers'

type IssuePath = (string | number)[]

const addIssue = (ctx: z.RefinementCtx, path: IssuePath, message: string): void => {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message })
}

const validateUpToValues = (
  tiers: Array<{ toValue?: string | null }>,
  ctx: z.RefinementCtx,
  path: IssuePath,
): void => {
  tiers.forEach((tier, index) => {
    if (index === tiers.length - 1) return

    const upTo = parseDecimal(tier.toValue)

    if (!upTo || upTo.lte(getTierLowerBound(tiers, index))) {
      addIssue(ctx, [...path, index, 'toValue'], RATE_TIER_UP_TO_ERROR_KEY)
    }
  })
}

const validateTierAmounts = (
  tiers: RateTierInput[],
  ctx: z.RefinementCtx,
  path: IssuePath,
): void => {
  tiers.forEach(({ perUnitAmount, flatAmount }, index) => {
    if (isInvalidAmount(perUnitAmount) && isInvalidAmount(flatAmount)) {
      addIssue(ctx, [...path, index, 'perUnitAmount'], VALUE_REQUIRED_KEY)
      addIssue(ctx, [...path, index, 'flatAmount'], VALUE_REQUIRED_KEY)

      return
    }

    if (isNonEmptyNaN(perUnitAmount)) {
      addIssue(ctx, [...path, index, 'perUnitAmount'], VALUE_REQUIRED_KEY)
    }

    if (isNonEmptyNaN(flatAmount)) {
      addIssue(ctx, [...path, index, 'flatAmount'], VALUE_REQUIRED_KEY)
    }
  })
}

const validateTierRates = (
  tiers: RatePercentageTierInput[],
  ctx: z.RefinementCtx,
  path: IssuePath,
): void => {
  tiers.forEach(({ rate }, index) => {
    if (isInvalidRate(rate)) addIssue(ctx, [...path, index, 'rate'], VALUE_REQUIRED_KEY)
  })
}

export const validateRateTiers = (
  rateModel: TieredRateModel,
  properties: RatePropertiesInput | undefined,
  ctx: z.RefinementCtx,
): void => {
  if (rateModel === RateCardRateModelEnum.GraduatedPercentage) {
    const tiers = properties?.graduatedPercentageRanges
    const path = ['properties', 'graduatedPercentageRanges']

    if (!tiers?.length) {
      addIssue(ctx, path, VALUE_REQUIRED_KEY)

      return
    }

    validateUpToValues(tiers, ctx, path)
    validateTierRates(tiers, ctx, path)

    return
  }

  const name = rateModel === RateCardRateModelEnum.Graduated ? 'graduatedRanges' : 'volumeRanges'
  const tiers = properties?.[name]
  const path = ['properties', name]

  if (!tiers?.length) {
    addIssue(ctx, path, VALUE_REQUIRED_KEY)

    return
  }

  validateUpToValues(tiers, ctx, path)
  validateTierAmounts(tiers, ctx, path)
}
