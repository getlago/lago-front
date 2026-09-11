import { z } from 'zod'

import {
  PropertiesZodInput,
  validateChargeProperties,
} from '~/formValidation/chargePropertiesSchema'
import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'
import { RateCardRateModelEnum } from '~/generated/graphql'

import {
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RateCardRateFormValues,
  VALUE_REQUIRED_KEY,
} from './constants'
import { isEffectiveFromAppendable, toChargeModel } from './utils'

import {
  getAvailableRateModels,
  NO_AVAILABLE_RATE_MODELS_KEY,
  RATE_MODEL_AVAILABILITY_LOADING_KEY,
  RATE_MODEL_UNAVAILABLE_KEY,
  RateModelConfiguration,
} from '../../utils/rateModelAvailability'

export type RateCardRateSchemaContext = {
  requiresConversionRate: boolean
  rateModelConfiguration: RateModelConfiguration | undefined
  lockedRateModel: RateCardRateModelEnum | undefined
  /** `effectiveFrom` of the rate currently in effect, null when the card has none yet. */
  effectiveFromBoundary: string | null
}

const addEffectiveFromIssues = (
  effectiveFrom: string,
  boundary: string | null,
  ctx: z.RefinementCtx,
): void => {
  const path = ['effectiveFrom']

  if (!effectiveFrom) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: VALUE_REQUIRED_KEY })

    return
  }

  // A card with no active rate has no boundary, so the check below cannot catch a date the
  // API refuses.
  if (addUnsupportedDateIssue(ctx, effectiveFrom, path)) return

  if (!isEffectiveFromAppendable(effectiveFrom, boundary)) {
    // Only blocks the submit: the copy interpolates the boundary date, so the drawer body
    // renders it through `errorOverride` instead.
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
    })
  }
}

// A getter, not a value: the schema is built once for the form's lifetime while the card being
// edited changes on every `openDrawer`.
export const buildRateCardRateSchema = (getContext: () => RateCardRateSchemaContext) =>
  // `z.custom` not `z.object`: a strict object aborts before `superRefine` on the first
  // mismatch, replacing every translated message below with zod's untranslated "Required".
  z.custom<RateCardRateFormValues>().superRefine((values, ctx) => {
    const {
      requiresConversionRate,
      effectiveFromBoundary,
      rateModelConfiguration,
      lockedRateModel,
    } = getContext()
    const availableRateModels = getAvailableRateModels(rateModelConfiguration)
    let rateModelError: string | undefined

    if (lockedRateModel !== undefined) {
      if (values.rateModel !== lockedRateModel) rateModelError = RATE_MODEL_UNAVAILABLE_KEY
    } else if (availableRateModels === undefined) {
      rateModelError = RATE_MODEL_AVAILABILITY_LOADING_KEY
    } else if (availableRateModels.length === 0) {
      rateModelError = NO_AVAILABLE_RATE_MODELS_KEY
    } else if (!availableRateModels.includes(values.rateModel)) {
      rateModelError = RATE_MODEL_UNAVAILABLE_KEY
    }

    if (rateModelError) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rateModel'], message: rateModelError })
    }

    addEffectiveFromIssues(values.effectiveFrom, effectiveFromBoundary, ctx)

    if (!values.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: VALUE_REQUIRED_KEY,
      })
    }

    const billingIntervalCount = Number(values.billingIntervalCount)

    if (!Number.isInteger(billingIntervalCount) || billingIntervalCount < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['billingIntervalCount'],
        message: VALUE_REQUIRED_KEY,
      })
    }

    // `RateCardRate#validate_pricing_unit_conversion_rate`.
    if (requiresConversionRate && Number(values.conversionRate) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversionRate'],
        message: VALUE_REQUIRED_KEY,
      })
    }

    validateChargeProperties(
      toChargeModel(values.rateModel),
      values.properties as PropertiesZodInput | undefined,
      ctx,
      ['properties'],
    )
  })
