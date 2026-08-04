import { z } from 'zod'

import { AlertTypeEnum, ThresholdInput } from '~/generated/graphql'

/**
 * Zod re-map of the legacy Yup schema that lived inline in `AlertForm.tsx`.
 * Semantics are a 1:1 parity port — do not "fix" behaviours here:
 * - Formik ran Yup on `prepareDataForValidation(values)`, which turns every
 *   empty string into `undefined`, so `''` failed the `required()` rules and a
 *   `number()` cast never saw it. Each rule below rejects `''` explicitly for
 *   the same result.
 * - every rule was declared as `required('')`, i.e. "turn the field invalid
 *   without a visible label". Zod v4 replaces an empty message with its own
 *   "Invalid input" default, which would then render, so each one carries the
 *   generic required key instead. Only `code` and `alertType` can surface it:
 *   the thresholds table is not form-aware, so its errors gate the submit
 *   button without ever being displayed.
 * - `name` is optional.
 * - `billableMetricId` is intentionally optional: the real gate is indirect
 *   (the thresholds table stays hidden until a metric is picked, and the
 *   default threshold `value: ''` keeps the form invalid meanwhile). Making it
 *   required here would change when the submit button unlocks.
 * - the threshold `value` was a `number().required('')`, so a numeric-looking
 *   string passes and anything else fails.
 *
 * The Yup array was additionally `.nullable()`; the form values type guarantees
 * an array (the table always leaves at least one row), so that branch was
 * unreachable and is not carried over.
 */

/** "Field is required" */
const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'

const thresholdSchema = z.object({
  code: z.string().nullish(),
  // `boolean().required('')` — the table always writes a real boolean
  recurring: z
    .boolean()
    .nullish()
    .refine((value) => typeof value === 'boolean', {
      message: REQUIRED_ERROR,
    }),
  // `number().required('')` on a string cell
  value: z.string().refine((value) => value !== '' && !Number.isNaN(Number(value)), {
    message: REQUIRED_ERROR,
  }),
})

export const subscriptionAlertValidationSchema = z.object({
  name: z.string(),
  code: z.string().min(1, { message: REQUIRED_ERROR }),
  // `''` before a type is picked, `undefined` once the combobox is cleared
  alertType: z
    .union([z.enum(AlertTypeEnum), z.literal('')])
    .optional()
    .refine((value) => !!value, { message: REQUIRED_ERROR }),
  billableMetricId: z.string(),
  thresholds: z.array(thresholdSchema),
})

/**
 * Mirrors `CreateSubscriptionAlertInput` minus the enum strictness:
 * `alertType` is empty until the user picks one, exactly like the Formik
 * initial values (which cast `''` to the enum through a `@ts-expect-error`).
 */
export type TSubscriptionAlertForm = {
  name: string
  code: string
  alertType?: AlertTypeEnum | ''
  billableMetricId: string
  thresholds: ThresholdInput[]
}

/**
 * The values once the schema has run: `alertType` is guaranteed to be set, so
 * the mappers building the mutation inputs need no cast.
 */
export type TValidatedSubscriptionAlertForm = TSubscriptionAlertForm & {
  alertType: AlertTypeEnum
}

export const EMPTY_SUBSCRIPTION_ALERT_THRESHOLD: ThresholdInput = {
  code: '',
  recurring: false,
  value: '',
}
