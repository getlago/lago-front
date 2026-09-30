import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  PropertiesInput,
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
} from '~/generated/graphql'

import { RateCardRateFormValues } from './constants'

import { toChargeProperties } from '../../utils/rateTiers'

// Range rows arrive carrying `__typename`, which `PropertiesInput` rejects on the way back in.
export const toFormProperties = (
  rateProperties: RateCardRateForDrawerFragment['rateProperties'],
): PropertiesInput => {
  const properties = toChargeProperties(rateProperties)

  return {
    ...getPropertyShape(properties),
    graduatedRanges: properties.graduatedRanges?.map(
      ({ fromValue, toValue, flatAmount, perUnitAmount }) => ({
        fromValue,
        toValue,
        flatAmount,
        perUnitAmount,
      }),
    ),
    graduatedPercentageRanges: properties.graduatedPercentageRanges?.map(
      ({ fromValue, toValue, flatAmount, rate }) => ({ fromValue, toValue, flatAmount, rate }),
    ),
    volumeRanges: properties.volumeRanges?.map(
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
