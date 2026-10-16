import {
  mapRateToRateFieldValues,
  RateFieldValues,
} from '~/pages/catalog/drawers/rateCardRate/mapRateToFormValues'

import {
  getInsertIndex,
  getPositionDefaults,
  RATE_PHASE_FORM_DEFAULTS,
  RatePhaseFormSchemaContext,
  RatePhaseFormValues,
  RatePhaseReference,
} from './ratePhaseFormSchema'
import { RateCardForRatePhaseFields } from './types'

const {
  billingIntervalCount,
  billingIntervalUnit,
  conversionRate,
  rateModel,
  properties,
  minAmountCents,
} = RATE_PHASE_FORM_DEFAULTS

const DEFAULT_RATE_FIELD_VALUES: RateFieldValues = {
  billingIntervalCount,
  billingIntervalUnit,
  conversionRate,
  rateModel,
  properties,
  minAmountCents,
}

export const getActiveRateFieldValues = (rateCard: RateCardForRatePhaseFields): RateFieldValues =>
  rateCard.activeRate
    ? mapRateToRateFieldValues(rateCard.activeRate, rateCard.currency)
    : DEFAULT_RATE_FIELD_VALUES

export const buildCreatePhaseSeed = (
  otherPhases: RatePhaseReference[],
  rateCard: RateCardForRatePhaseFields,
): RatePhaseFormValues => ({
  ...RATE_PHASE_FORM_DEFAULTS,
  ...getActiveRateFieldValues(rateCard),
  ...getPositionDefaults(otherPhases),
  durationType: otherPhases.length > 0 ? 'finite' : 'forever',
})

export const insertPhaseReference = (
  otherPhases: RatePhaseReference[],
  values: RatePhaseFormValues,
): RatePhaseReference[] =>
  otherPhases.toSpliced(getInsertIndex(values, otherPhases), 0, {
    code: values.code,
    name: values.name,
  })

export const buildRatePhaseSchemaContext = (
  otherPhases: RatePhaseReference[],
  rateCard: RateCardForRatePhaseFields,
): RatePhaseFormSchemaContext => ({
  otherPhases,
  billingTiming: rateCard.billingTiming,
  hasPricingUnit: !!rateCard.appliedPricingUnitCode,
  rateModelConfiguration: rateCard,
})
