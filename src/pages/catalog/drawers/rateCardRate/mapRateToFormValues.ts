import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  Properties,
  PropertiesInput,
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
} from '~/generated/graphql'

import { RateCardRateFormValues } from './constants'

// Range rows come back from the API carrying `__typename`, which the typed PropertiesInput
// rejects on the way back in - rebuild them from the fields the form owns.
export const toFormProperties = (
  rateProperties: RateCardRateForDrawerFragment['rateProperties'],
): PropertiesInput => {
  const shape = getPropertyShape(rateProperties as Properties)

  return {
    ...shape,
    graduatedRanges: rateProperties.graduatedRanges?.map(
      ({ fromValue, toValue, flatAmount, perUnitAmount }) => ({
        fromValue,
        toValue,
        flatAmount,
        perUnitAmount,
      }),
    ),
    graduatedPercentageRanges: rateProperties.graduatedPercentageRanges?.map(
      ({ fromValue, toValue, flatAmount, rate }) => ({ fromValue, toValue, flatAmount, rate }),
    ),
    volumeRanges: rateProperties.volumeRanges?.map(
      ({ fromValue, toValue, flatAmount, perUnitAmount }) => ({
        fromValue,
        toValue,
        flatAmount,
        perUnitAmount,
      }),
    ),
  }
}

export const mapRateToFormValues = (
  rate: RateCardRateForDrawerFragment,
  currency: RateCardForRateDrawerFragment['currency'],
): RateCardRateFormValues => ({
  effectiveFrom: rate.effectiveFrom,
  code: rate.code,
  billingIntervalCount: String(rate.billingIntervalCount),
  billingIntervalUnit: rate.billingIntervalUnit,
  conversionRate:
    rate.appliedPricingUnitConversionRate === null ||
    rate.appliedPricingUnitConversionRate === undefined
      ? ''
      : String(rate.appliedPricingUnitConversionRate),
  rateModel: rate.rateModel,
  properties: toFormProperties(rate.rateProperties),
  // Stored in the currency's smallest unit; the form edits a decimal amount.
  minAmountCents: Number(rate.minAmountCents)
    ? String(deserializeAmount(rate.minAmountCents, currency))
    : '',
})
