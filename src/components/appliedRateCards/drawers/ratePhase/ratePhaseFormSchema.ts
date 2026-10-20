import { z } from 'zod'

import { validateChargeProperties } from '~/formValidation/chargePropertiesSchema'
import {
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
  RatePropertiesInput,
} from '~/generated/graphql'
import { getRatePropertiesShape } from '~/pages/catalog/drawers/rateCardRate/getRatePropertiesShape'
import { toChargeModel } from '~/pages/catalog/drawers/rateCardRate/utils'
import { validateRateTiers } from '~/pages/catalog/drawers/rateCardRate/validateRateTiers'
import { isTieredRateModel } from '~/pages/catalog/rateProperties/tiers/rateTiers'
import {
  getAvailableRateModels,
  RATE_MODEL_UNAVAILABLE_KEY,
  RateModelConfiguration,
} from '~/pages/catalog/utils/rateModelAvailability'

export type DurationType = 'finite' | 'forever'

export type PositionMode = 'before' | 'after'

export type RatePhaseReference = { code: string; name: string }

export interface RatePhaseFormValues {
  code: string
  name: string
  positionMode: PositionMode | ''
  positionReferenceCode: string
  durationType: DurationType
  durationCycleCount: string
  overrideEnabled: boolean
  rateModel: RateCardRateModelEnum
  properties: RatePropertiesInput
  billingIntervalCount: string
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum
  minAmountCents: string
  conversionRate: string
}

export const RATE_PHASE_FORM_DEFAULTS: RatePhaseFormValues = {
  code: '',
  name: '',
  positionMode: '',
  positionReferenceCode: '',
  durationType: 'forever',
  durationCycleCount: '',
  overrideEnabled: false,
  rateModel: RateCardRateModelEnum.Standard,
  properties: getRatePropertiesShape(),
  billingIntervalCount: '1',
  billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Month,
  minAmountCents: '',
  conversionRate: '',
}

// A live save is one mutation and `RatePhases::{Create,Update}Service` validate the whole
// sequence: the forever tail stays last, every other phase stays finite and before it.
export type RatePhaseSequenceLock = 'none' | 'tail' | 'beforeTail'

export interface RatePhaseFormSchemaContext {
  otherPhases: RatePhaseReference[]
  billingTiming: RateCardBillingTimingEnum
  hasPricingUnit: boolean
  rateModelConfiguration: RateModelConfiguration | undefined
  sequenceLock: RatePhaseSequenceLock
}

type PositionValues = Pick<RatePhaseFormValues, 'positionMode' | 'positionReferenceCode'>

export const isPlacedLast = (values: PositionValues, otherPhases: RatePhaseReference[]): boolean =>
  otherPhases.length === 0 ||
  (values.positionMode === 'after' && values.positionReferenceCode === otherPhases.at(-1)?.code)

export const getInsertIndex = (
  values: PositionValues,
  otherPhases: RatePhaseReference[],
): number => {
  const referenceIndex = otherPhases.findIndex(
    (phase) => phase.code === values.positionReferenceCode,
  )

  if (referenceIndex === -1) return otherPhases.length

  return values.positionMode === 'after' ? referenceIndex + 1 : referenceIndex
}

// A new phase defaults to just before the current last one, which runs forever.
export const getPositionDefaults = (
  otherPhases: RatePhaseReference[],
  editedIndex?: number,
): PositionValues => {
  if (otherPhases.length === 0) return { positionMode: '', positionReferenceCode: '' }

  if (editedIndex === undefined) {
    return { positionMode: 'before', positionReferenceCode: otherPhases.at(-1)?.code ?? '' }
  }

  if (editedIndex === 0) {
    return { positionMode: 'before', positionReferenceCode: otherPhases[0].code }
  }

  return { positionMode: 'after', positionReferenceCode: otherPhases[editedIndex - 1].code }
}

// No return type: `z.ZodType<RatePhaseFormValues>` widens the input to `unknown`, which
// `validators.onDynamic` rejects.
export const buildRatePhaseFormSchema = (getContext: () => RatePhaseFormSchemaContext) =>
  z.custom<RatePhaseFormValues>().superRefine((values, ctx) => {
    const context = getContext()

    if (!values.code) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: 'text_1771342994699klxu2paz7g8' })
    } else if (context.otherPhases.some((phase) => phase.code === values.code)) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: 'text_1791835259930kkfcgn2aa50' })
    }

    if (context.otherPhases.length > 0) {
      if (!values.positionMode) {
        ctx.addIssue({
          code: 'custom',
          path: ['positionMode'],
          message: 'text_1771342994699klxu2paz7g8',
        })
      }

      if (!context.otherPhases.some((phase) => phase.code === values.positionReferenceCode)) {
        ctx.addIssue({
          code: 'custom',
          path: ['positionReferenceCode'],
          message: 'text_1771342994699klxu2paz7g8',
        })
      }
    }

    const isLast = isPlacedLast(values, context.otherPhases)
    const isForever = values.durationType === 'forever'

    if (isForever && (!isLast || context.sequenceLock === 'beforeTail')) {
      ctx.addIssue({
        code: 'custom',
        path: ['durationType'],
        message: 'text_17918352599305ihwwvq7fyq',
      })
    }

    if (context.sequenceLock === 'tail') {
      if (!isForever) {
        ctx.addIssue({
          code: 'custom',
          path: ['durationType'],
          message: 'text_1791485670326e1zbmola1n3',
        })
      }

      if (!isLast) {
        ctx.addIssue({
          code: 'custom',
          path: ['positionReferenceCode'],
          message: 'text_17918352599305ihwwvq7fyq',
        })
      }
    }

    if (context.sequenceLock === 'beforeTail' && isLast) {
      ctx.addIssue({
        code: 'custom',
        path: ['positionReferenceCode'],
        message: 'text_1791485670326e1zbmola1n3',
      })
    }

    if (values.durationType === 'finite') {
      const parsed = Number(values.durationCycleCount)

      if (!values.durationCycleCount || !Number.isInteger(parsed) || parsed <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['durationCycleCount'],
          message: 'text_1771342994699klxu2paz7g8',
        })
      }
    }

    if (!values.overrideEnabled) return

    const billingIntervalCount = Number(values.billingIntervalCount)

    if (!Number.isInteger(billingIntervalCount) || billingIntervalCount < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['billingIntervalCount'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }

    const availableRateModels = getAvailableRateModels(context.rateModelConfiguration)

    if (availableRateModels && !availableRateModels.includes(values.rateModel)) {
      ctx.addIssue({
        code: 'custom',
        path: ['rateModel'],
        message: RATE_MODEL_UNAVAILABLE_KEY,
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

      // A decimal display amount (e.g. "5.00"), not integer cents: `serializeAmount` scales it.
      if (values.minAmountCents && (!Number.isFinite(parsedMinAmount) || parsedMinAmount < 0)) {
        ctx.addIssue({
          code: 'custom',
          path: ['minAmountCents'],
          message: 'text_1771342994699klxu2paz7g8',
        })
      }
    } else if (Number(values.minAmountCents) > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['minAmountCents'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }

    if (context.hasPricingUnit && Number(values.conversionRate) <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['conversionRate'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }
  })
