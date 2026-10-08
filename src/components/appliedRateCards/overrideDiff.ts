import isEqual from 'lodash/isEqual'

import { RateCardRate, RateOverride } from '~/generated/graphql'

export type OverrideDiffField =
  | 'rateModel'
  | 'rateProperties'
  | 'billingIntervalCount'
  | 'billingIntervalUnit'
  | 'minAmountCents'
  | 'pricingUnitConversionRate'

type ActiveRateForDiff = Pick<
  RateCardRate,
  | 'rateModel'
  | 'rateProperties'
  | 'billingIntervalCount'
  | 'billingIntervalUnit'
  | 'minAmountCents'
  | 'appliedPricingUnitConversionRate'
>

type OverrideForDiff = Pick<
  RateOverride,
  | 'rateModel'
  | 'rateProperties'
  | 'billingIntervalCount'
  | 'billingIntervalUnit'
  | 'minAmountCents'
  | 'pricingUnitConversionRate'
>

export function getOverriddenFields(
  activeRate: ActiveRateForDiff,
  override: OverrideForDiff | null | undefined,
): Set<OverrideDiffField> {
  const diff = new Set<OverrideDiffField>()

  if (!override) return diff

  if (override.rateModel !== activeRate.rateModel) diff.add('rateModel')
  if (!isEqual(override.rateProperties, activeRate.rateProperties)) diff.add('rateProperties')
  if (override.billingIntervalCount !== activeRate.billingIntervalCount) {
    diff.add('billingIntervalCount')
  }
  if (override.billingIntervalUnit !== activeRate.billingIntervalUnit) {
    diff.add('billingIntervalUnit')
  }
  if (override.minAmountCents !== activeRate.minAmountCents) diff.add('minAmountCents')
  if (override.pricingUnitConversionRate !== activeRate.appliedPricingUnitConversionRate) {
    diff.add('pricingUnitConversionRate')
  }

  return diff
}
