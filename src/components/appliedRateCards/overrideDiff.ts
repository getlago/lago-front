import isEqual from 'lodash/isEqual'

import {
  RateCardRate,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RateOverrideInput,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'
import { serializeRateProperties } from '~/pages/catalog/drawers/rateCardRate/serializeRateProperties'

import { mapRateOverrideFromFormToApi } from './drawers/ratePhase/mappers'
import { RatePhaseFormValues } from './drawers/ratePhase/ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './drawers/ratePhase/types'

export type OverrideDiffField =
  | 'rateModel'
  | 'rateProperties'
  | 'billingIntervalCount'
  | 'billingIntervalUnit'
  | 'minAmountCents'
  | 'pricingUnitConversionRate'

export type ActiveRateForDiff = Pick<
  RateCardRate,
  | 'rateModel'
  | 'rateProperties'
  | 'billingIntervalCount'
  | 'billingIntervalUnit'
  | 'minAmountCents'
  | 'appliedPricingUnitConversionRate'
>

type ComparableRate = {
  rateModel: RateCardRateModelEnum
  rateProperties: unknown
  billingIntervalCount: number | null
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum | null
  minAmountCents: number
  pricingUnitConversionRate: number | null
}

// Apollo returns numbers and `__typename`, the form keeps numeric strings: compare values only.
const toComparableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(toComparableValue)

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => key !== '__typename' && entry !== null && entry !== undefined)
        .map(([key, entry]) => [key, toComparableValue(entry)]),
    )
  }

  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }

  return value
}

const toNumberOrNull = (value: number | string | null | undefined): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value)

export const toComparableRate = (rate: RateOverrideInput): ComparableRate => ({
  rateModel: rate.rateModel,
  rateProperties: toComparableValue(rate.rateProperties),
  billingIntervalCount: toNumberOrNull(rate.billingIntervalCount),
  billingIntervalUnit: rate.billingIntervalUnit ?? null,
  minAmountCents: Number(rate.minAmountCents ?? 0),
  pricingUnitConversionRate: toNumberOrNull(rate.pricingUnitConversionRate),
})

export const activeRateToOverrideInput = (activeRate: ActiveRateForDiff): RateOverrideInput => ({
  rateModel: activeRate.rateModel,
  rateProperties: serializeRateProperties(
    getRatePropertiesShape(activeRate.rateProperties),
    activeRate.rateModel,
  ),
  billingIntervalCount: activeRate.billingIntervalCount,
  billingIntervalUnit: activeRate.billingIntervalUnit,
  minAmountCents: activeRate.minAmountCents,
  pricingUnitConversionRate: activeRate.appliedPricingUnitConversionRate,
})

export function getOverriddenFields(
  activeRate: ActiveRateForDiff,
  override: RateOverrideInput | null | undefined,
): Set<OverrideDiffField> {
  const diff = new Set<OverrideDiffField>()

  if (!override) return diff

  const base = toComparableRate(activeRateToOverrideInput(activeRate))
  const candidate = toComparableRate(override)

  if (candidate.rateModel !== base.rateModel) diff.add('rateModel')
  if (!isEqual(candidate.rateProperties, base.rateProperties)) diff.add('rateProperties')
  if (
    candidate.billingIntervalCount !== null &&
    candidate.billingIntervalCount !== base.billingIntervalCount
  ) {
    diff.add('billingIntervalCount')
  }
  if (
    candidate.billingIntervalUnit !== null &&
    candidate.billingIntervalUnit !== base.billingIntervalUnit
  ) {
    diff.add('billingIntervalUnit')
  }
  if (candidate.minAmountCents !== base.minAmountCents) diff.add('minAmountCents')
  if (candidate.pricingUnitConversionRate !== base.pricingUnitConversionRate) {
    diff.add('pricingUnitConversionRate')
  }

  return diff
}

// An override identical to the active rate changes nothing: the phase runs on the active rate.
export const hasRateOverride = (
  values: RatePhaseFormValues,
  rateCard: RateCardForRatePhaseFields,
): boolean => {
  if (!values.overrideEnabled) return false
  if (!rateCard.activeRate) return true

  const override = mapRateOverrideFromFormToApi(values, rateCard.currency)

  return getOverriddenFields(rateCard.activeRate, override).size > 0
}
