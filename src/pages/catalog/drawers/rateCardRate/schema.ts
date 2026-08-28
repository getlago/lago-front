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
  /** The parent card prices in a custom pricing unit, so a conversion rate is mandatory. */
  requiresConversionRate: boolean
  /** `effectiveFrom` of the rate currently in effect, or null when the card has none yet. */
  effectiveFromBoundary: string | null
}

/**
 * The context is read through a getter rather than captured: the schema is built once for the
 * form's lifetime while the card being edited changes on every `openDrawer`.
 */
export const buildRateCardRateSchema = (getContext: () => RateCardRateSchemaContext) =>
  // `z.custom` rather than `z.object`, matching the other form schemas in the app: a strict
  // per-field object aborts before `superRefine` as soon as one field mismatches, and the
  // date picker writes `undefined` when its input is cleared. That would replace every
  // translated message below with zod's own untranslated "Required". TypeScript already
  // pins the shape, so the only checks worth running are the ones it cannot express.
  z.custom<RateCardRateFormValues>().superRefine((values, ctx) => {
    const { requiresConversionRate, effectiveFromBoundary } = getContext()

    if (!values.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveFrom'],
        message: VALUE_REQUIRED_KEY,
      })
    } else if (!isEffectiveFromAppendable(values.effectiveFrom, effectiveFromBoundary)) {
      // The rendered copy interpolates the boundary date, which `translate()` cannot do
      // from a zod message - the drawer body passes it through `errorOverride` instead.
      // This issue exists to block the submit.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effectiveFrom'],
        message: RATE_CARD_RATE_EFFECTIVE_DATE_AFTER_ACTIVE_KEY,
      })
    }

    // Previously `z.string().min(1)` on the object; kept here so it survives an
    // `undefined` on any other field.
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

    // Mandatory as soon as the rate card prices in a custom pricing unit
    // (`RateCardRate#validate_pricing_unit_conversion_rate`).
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
