import _omit from 'lodash/omit'

import getPropertyShape from '~/core/serializers/getPropertyShape'
import { PropertiesForRateCardRateFragment, RatePropertiesInput } from '~/generated/graphql'

import { RATE_TIER_LIST_NAMES } from '../../rateProperties/tiers/rateTiers'

export const getRatePropertiesShape = (
  rateProperties?: PropertiesForRateCardRateFragment,
): RatePropertiesInput => ({
  ..._omit(
    getPropertyShape(_omit(rateProperties, [...RATE_TIER_LIST_NAMES, '__typename'] as const)),
    RATE_TIER_LIST_NAMES,
  ),
  graduatedRanges: rateProperties?.graduatedRanges?.map(
    ({ toValue, perUnitAmount, flatAmount }) => ({
      toValue,
      perUnitAmount,
      flatAmount,
    }),
  ),
  graduatedPercentageRanges: rateProperties?.graduatedPercentageRanges?.map(
    ({ toValue, rate, flatAmount }) => ({ toValue, rate, flatAmount }),
  ),
  volumeRanges: rateProperties?.volumeRanges?.map(({ toValue, perUnitAmount, flatAmount }) => ({
    toValue,
    perUnitAmount,
    flatAmount,
  })),
})
