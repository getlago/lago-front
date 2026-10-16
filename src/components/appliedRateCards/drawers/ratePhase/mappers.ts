import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  PhaseInput,
  RateCardBillingTimingEnum,
  RateOverrideInput,
  RatePhaseForDrawerFragment,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'
import { serializeRateProperties } from '~/pages/catalog/drawers/rateCardRate/serializeRateProperties'

import { RATE_PHASE_FORM_DEFAULTS, RatePhaseFormValues } from './ratePhaseFormSchema'
import { getActiveRateFieldValues } from './ratePhaseSeeds'
import { RateCardForRatePhaseFields } from './types'

// `minAmountCents` renders on `arrears` only: a value saved before the card switched to
// `advance` is dropped, or it would fail validation on a field the form no longer shows.
export const mapFromApiToForm = (
  phase: RatePhaseForDrawerFragment,
  rateCard: RateCardForRatePhaseFields,
): RatePhaseFormValues => {
  const override = phase.rateOverride
  const duration: Pick<RatePhaseFormValues, 'durationType' | 'durationCycleCount'> =
    phase.billingIntervalCycleCount
      ? { durationType: 'finite', durationCycleCount: String(phase.billingIntervalCycleCount) }
      : { durationType: 'forever', durationCycleCount: '' }

  const base: RatePhaseFormValues = {
    ...RATE_PHASE_FORM_DEFAULTS,
    ...getActiveRateFieldValues(rateCard),
    ...duration,
    code: phase.code,
    name: phase.name || '',
  }

  if (!override) return base

  return {
    ...base,
    overrideEnabled: true,
    rateModel: override.rateModel,
    properties: getRatePropertiesShape(override.rateProperties),
    billingIntervalCount: override.billingIntervalCount
      ? String(override.billingIntervalCount)
      : base.billingIntervalCount,
    billingIntervalUnit: override.billingIntervalUnit ?? base.billingIntervalUnit,
    minAmountCents:
      rateCard.billingTiming === RateCardBillingTimingEnum.Arrears &&
      Number(override.minAmountCents)
        ? String(deserializeAmount(override.minAmountCents, rateCard.currency))
        : RATE_PHASE_FORM_DEFAULTS.minAmountCents,
    conversionRate: override.pricingUnitConversionRate
      ? String(override.pricingUnitConversionRate)
      : RATE_PHASE_FORM_DEFAULTS.conversionRate,
  }
}

// `minAmountCents` is a decimal display amount; `serializeAmount` scales it to the smallest unit.
export const mapRateOverrideFromFormToApi = (
  values: RatePhaseFormValues,
  currency: CurrencyEnum,
): RateOverrideInput => ({
  rateModel: values.rateModel,
  rateProperties: serializeRateProperties(values.properties, values.rateModel),
  billingIntervalCount: Number(values.billingIntervalCount),
  billingIntervalUnit: values.billingIntervalUnit,
  minAmountCents: values.minAmountCents
    ? serializeAmount(values.minAmountCents, currency)
    : undefined,
  pricingUnitConversionRate: values.conversionRate ? Number(values.conversionRate) : undefined,
})

export const mapFromFormToApi = (
  values: RatePhaseFormValues & { position: number },
  currency: CurrencyEnum,
): PhaseInput => ({
  code: values.code,
  // `null`, not `undefined`: Apollo drops `undefined`, so an update could never clear the name.
  name: values.name || null,
  position: values.position,
  billingIntervalCycleCount:
    values.durationType === 'forever' ? null : Number(values.durationCycleCount),
  ...(values.overrideEnabled
    ? { rateOverride: mapRateOverrideFromFormToApi(values, currency) }
    : {}),
})
