import _omit from 'lodash/omit'

import {
  serializeProperties,
  serializeScientificNotation,
} from '~/core/serializers/serializePlanInput'
import {
  Properties,
  RateCardRateModelEnum,
  RatePercentageTierInput,
  RatePropertiesInput,
  RateTierInput,
} from '~/generated/graphql'

import { toChargeModel } from './utils'

import { parseDecimal, RATE_TIER_LIST_NAMES } from '../../rateProperties/tiers/rateTiers'

const serializeUpTo = (toValue: RateTierInput['toValue']): string | null =>
  parseDecimal(toValue)?.toFixed() ?? null

const serializeTiers = (tiers: RateTierInput[] | null | undefined): RateTierInput[] | undefined =>
  tiers?.map(({ toValue, perUnitAmount, flatAmount }) => ({
    toValue: serializeUpTo(toValue),
    perUnitAmount: serializeScientificNotation(perUnitAmount),
    flatAmount: serializeScientificNotation(flatAmount),
  }))

const serializePercentageTiers = (
  tiers: RatePercentageTierInput[] | null | undefined,
): RatePercentageTierInput[] | undefined =>
  tiers?.map(({ toValue, rate, flatAmount }) => ({
    toValue: serializeUpTo(toValue),
    rate: serializeScientificNotation(rate),
    flatAmount: serializeScientificNotation(flatAmount),
  }))

export const serializeRateProperties = (
  properties: RatePropertiesInput | undefined,
  rateModel: RateCardRateModelEnum,
): RatePropertiesInput => ({
  ..._omit(
    serializeProperties(
      _omit(properties, RATE_TIER_LIST_NAMES) as Properties,
      toChargeModel(rateModel),
    ),
    RATE_TIER_LIST_NAMES,
  ),
  graduatedRanges:
    rateModel === RateCardRateModelEnum.Graduated
      ? serializeTiers(properties?.graduatedRanges)
      : undefined,
  volumeRanges:
    rateModel === RateCardRateModelEnum.Volume
      ? serializeTiers(properties?.volumeRanges)
      : undefined,
  graduatedPercentageRanges:
    rateModel === RateCardRateModelEnum.GraduatedPercentage
      ? serializePercentageTiers(properties?.graduatedPercentageRanges)
      : undefined,
})
