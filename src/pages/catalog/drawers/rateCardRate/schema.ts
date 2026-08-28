import { z } from 'zod'

import {
  PropertiesZodInput,
  validateChargeProperties,
} from '~/formValidation/chargePropertiesSchema'

import {
  RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
  RateCardRateFormValues,
  VALUE_REQUIRED_KEY,
} from './constants'
import { isEffectiveFromAppendable, toChargeModel } from './utils'

export type RateCardRateSchemaContext = {
  requiresConversionRate: boolean
  /** `effectiveFrom` of the rate currently in effect, null when the card has none yet. */
  effectiveFromBoundary: string | null
}

// A getter, not a value: the schema is built once for the form's lifetime while the card being
// edited changes on every `openDrawer`.
export const buildRateCardRateSchema = (getContext: () => RateCardRateSchemaContext) =>
  // `z.custom` not `z.object`: a strict object aborts before `superRefine` on the first
  // mismatch, replacing every translated message below with zod's untranslated "Required".
  z.custom<RateCardRateFormValues>().superRefine((values, ctx) => {
    const { requiresConversionRate, effectiveFromBoundary } = getContext()

    if (!values.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveFrom'],
        message: VALUE_REQUIRED_KEY,
      })
    } else if (!isEffectiveFromAppendable(values.effectiveFrom, effectiveFromBoundary)) {
      // Only blocks the submit: the copy interpolates the boundary date, so the drawer body
      // renders it through `errorOverride` instead.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveFrom'],
        message: RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
      })
    }

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
