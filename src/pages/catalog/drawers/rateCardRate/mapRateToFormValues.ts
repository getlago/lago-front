import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { RateCardForRateDrawerFragment, RateCardRateForDrawerFragment } from '~/generated/graphql'

import { RateCardRateFormValues } from './constants'
import { getRatePropertiesShape } from './getRatePropertiesShape'

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
  properties: getRatePropertiesShape(rate.rateProperties),
  // Stored in the currency's smallest unit; the form edits a decimal amount.
  minAmountCents: Number(rate.minAmountCents)
    ? String(deserializeAmount(rate.minAmountCents, currency))
    : '',
})
