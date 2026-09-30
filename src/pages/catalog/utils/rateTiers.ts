import _omit from 'lodash/omit'

import {
  Properties,
  PropertiesForRateCardRateFragment,
  PropertiesInput,
  RatePropertiesInput,
} from '~/generated/graphql'

type RateTierBound = { __typename?: string; toValue?: string | null }
type RangeBounds = { fromValue?: number | null; toValue?: number | string | null }

// Catalog tiers only carry their upper bound: each starts where the previous one ends, which is
// the touching layout the shared charge tables already use.
const withLowerBounds = <T extends RateTierBound>(tiers?: T[] | null) =>
  tiers?.map((tier, index) => ({
    ..._omit(tier, '__typename'),
    fromValue: index === 0 ? 0 : Number(tiers[index - 1].toValue),
    toValue: tier.toValue === null || tier.toValue === undefined ? null : Number(tier.toValue),
  }))

// The API derives each lower bound itself and rejects one sent along.
const withUpperBoundsOnly = <T extends RangeBounds>(ranges?: T[] | null) =>
  ranges?.map((range) => ({
    ..._omit(range, 'fromValue'),
    toValue: range.toValue === null || range.toValue === undefined ? null : String(range.toValue),
  }))

// The shared charge components read `Properties`, whose tiers name both bounds.
export const toChargeProperties = (
  rateProperties: PropertiesForRateCardRateFragment,
): Properties => ({
  ...rateProperties,
  __typename: 'Properties',
  graduatedRanges: withLowerBounds(rateProperties.graduatedRanges),
  graduatedPercentageRanges: withLowerBounds(rateProperties.graduatedPercentageRanges),
  volumeRanges: withLowerBounds(rateProperties.volumeRanges),
})

export const toRatePropertiesInput = (properties: PropertiesInput): RatePropertiesInput => ({
  ...properties,
  graduatedRanges: withUpperBoundsOnly(properties.graduatedRanges),
  graduatedPercentageRanges: withUpperBoundsOnly(properties.graduatedPercentageRanges),
  volumeRanges: withUpperBoundsOnly(properties.volumeRanges),
})
