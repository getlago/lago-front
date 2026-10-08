import { z } from 'zod'

import { serializeAmount } from '~/core/serializers/serializeAmount'
import { validateChargeProperties } from '~/formValidation/chargePropertiesSchema'
import {
  CurrencyEnum,
  PhaseInput,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePropertiesInput,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'
import { serializeRateProperties } from '~/pages/catalog/drawers/rateCardRate/serializeRateProperties'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'
import { validateRateTiers } from '~/pages/catalog/drawers/rateCardRate/validateRateTiers'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import {
  getAvailableRateModels,
  RateModelConfiguration,
} from '~/pages/catalog/utils/rateModelAvailability'

export type DurationType = 'finite' | 'forever'

export interface RatePhaseFormValues {
  code: string
  name: string
  durationType: DurationType
  durationCycleCount: string
  overrideEnabled: boolean
  rateModel: RateCardRateModelEnum
  properties: RatePropertiesInput
  overrideBillingIntervalCount: string
  overrideBillingIntervalUnit: RateCardRateBillingIntervalUnitEnum
  minAmountCents: string
  conversionRate: string
}

export const RATE_PHASE_FORM_DEFAULTS: RatePhaseFormValues = {
  code: '',
  name: '',
  durationType: 'forever',
  durationCycleCount: '',
  overrideEnabled: false,
  rateModel: RateCardRateModelEnum.Standard,
  properties: getRatePropertiesShape(),
  overrideBillingIntervalCount: '1',
  overrideBillingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '',
  conversionRate: '',
}

export interface RatePhaseFormSchemaContext {
  isLastPosition: boolean
  billingTiming: RateCardBillingTimingEnum
  hasPricingUnit: boolean
  rateModelConfiguration: RateModelConfiguration | undefined
}

// No explicit return type: `z.ZodType<RatePhaseFormValues>` widens the input generic to
// `unknown`, which breaks the Standard Schema shape `useAppForm`'s `validators.onDynamic`
// requires (see `buildRateCardRateSchema`, `planFormSchema`, `contractSchema` - none of the
// zod-builder schemas elsewhere in this codebase annotate their return type either).
export const buildRatePhaseFormSchema = (getContext: () => RatePhaseFormSchemaContext) =>
  z.custom<RatePhaseFormValues>().superRefine((values, ctx) => {
    const context = getContext()

    if (!values.code) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: 'text_626162c62f790600f850b76a' })
    }

    if (context.isLastPosition && values.durationType !== 'forever') {
      ctx.addIssue({
        code: 'custom',
        path: ['durationType'],
        message: 'text_17951541055441xojz4p5i83',
      })
    }

    if (!context.isLastPosition && values.durationType !== 'finite') {
      ctx.addIssue({
        code: 'custom',
        path: ['durationType'],
        message: 'text_17951541055441xojz4p5i83',
      })
    }

    if (values.durationType === 'finite') {
      const parsed = Number(values.durationCycleCount)

      if (!values.durationCycleCount || !Number.isInteger(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['durationCycleCount'],
          message: 'text_626162c62f790600f850b76a',
        })
      }
    }

    if (!values.overrideEnabled) return

    const availableRateModels = getAvailableRateModels(context.rateModelConfiguration)

    if (availableRateModels && !availableRateModels.includes(values.rateModel)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rateModel'],
        message: 'text_65201b8216455901fe273de2',
      })
    }

    if (isTieredRateModel(values.rateModel)) {
      validateRateTiers(values.rateModel, values.properties, ctx)
    } else {
      validateChargeProperties(
        toChargeModel(values.rateModel),
        values.properties as Parameters<typeof validateChargeProperties>[1],
        ctx,
        ['properties'],
      )
    }

    if (context.billingTiming === RateCardBillingTimingEnum.Arrears) {
      const parsedMinAmount = Number(values.minAmountCents)

      // `minAmountCents` holds a decimal display amount (e.g. "5.00"), not an integer cents
      // value - `serializeAmount` converts it on submit. Validate it as a finite non-negative
      // number, not an integer.
      if (values.minAmountCents && (!Number.isFinite(parsedMinAmount) || parsedMinAmount < 0)) {
        ctx.addIssue({
          code: 'custom',
          path: ['minAmountCents'],
          message: 'text_626162c62f790600f850b76a',
        })
      }
    } else if (Number(values.minAmountCents) > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['minAmountCents'],
        message: 'text_626162c62f790600f850b76a',
      })
    }

    if (context.hasPricingUnit && Number(values.conversionRate) <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['conversionRate'],
        message: 'text_626162c62f790600f850b76a',
      })
    }
  })

// `minAmountCents` is a decimal display amount in the rate card's currency (same convention as
// `RateCardRateFormValues.minAmountCents` in `useRateCardRateForm.tsx`), not an already-scaled
// integer - `serializeAmount` converts it to the currency's smallest unit here, mirroring that
// file's own `Number(serializeAmount(value.minAmountCents || 0, rateCard.currency))` call.
export const buildPhaseInput = (
  values: RatePhaseFormValues & { position: number },
  currency: CurrencyEnum,
): PhaseInput => ({
  code: values.code,
  name: values.name || undefined,
  position: values.position,
  billingIntervalCycleCount:
    values.durationType === 'forever' ? null : Number(values.durationCycleCount),
  ...(values.overrideEnabled
    ? {
        rateOverride: {
          rateModel: values.rateModel,
          rateProperties: serializeRateProperties(values.properties, values.rateModel),
          billingIntervalCount: Number(values.overrideBillingIntervalCount),
          billingIntervalUnit: values.overrideBillingIntervalUnit,
          minAmountCents: values.minAmountCents
            ? serializeAmount(values.minAmountCents, currency)
            : undefined,
          pricingUnitConversionRate: values.conversionRate
            ? Number(values.conversionRate)
            : undefined,
        },
      }
    : {}),
})
