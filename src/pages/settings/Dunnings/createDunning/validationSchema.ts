import { z } from 'zod'

import { EMAIL_REGEX } from '~/formValidation/zodCustoms'
import { CurrencyEnum } from '~/generated/graphql'

export const REQUIRED_ERROR = 'text_1771342994699klxu2paz7g8'
export const MIN_ONE_ERROR = 'text_1790576899992jmnfdn9aqrn'
const DUPLICATE_CURRENCY_ERROR = 'text_17905768999923req4vrrdil'
const INVALID_EMAIL_ERROR = 'text_620bc4d4269a55014d493fc3'

// Not `zodMultipleEmails`: `formatPayload` drops blank segments before saving, so a
// trailing comma is a valid intermediate state here and must not block the form.
const commaSeparatedEmails = z.string().refine(
  (value) =>
    value
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
      .every((email) => EMAIL_REGEX.test(email)),
  { message: INVALID_EMAIL_ERROR },
)

// `positiveNumber` keeps the input numeric but the value stays the raw string the
// user typed, so the bound is checked on the cast rather than with `z.number()`.
// '' is skipped so an empty field reports only REQUIRED_ERROR.
const atLeastOne = z
  .string()
  .min(1, { message: REQUIRED_ERROR })
  .refine((value) => value === '' || Number(value) >= 1, { message: MIN_ONE_ERROR })

const thresholdSchema = z.object({
  // Stays optional, with presence enforced by the refine: an added row starts undefined,
  // so a bare `z.enum` would reject it before the user has picked anything.
  currency: z
    .enum(CurrencyEnum)
    .optional()
    .refine((value) => !!value, { message: REQUIRED_ERROR }),
  amountCents: z.string().min(1, { message: REQUIRED_ERROR }),
})

export const dunningCampaignFormSchema = z
  .object({
    name: z.string().min(1, { message: REQUIRED_ERROR }),
    code: z.string().min(1, { message: REQUIRED_ERROR }),
    description: z.string().optional(),
    thresholds: z.array(thresholdSchema).min(1, { message: REQUIRED_ERROR }),
    daysBetweenAttempts: atLeastOne,
    maxAttempts: atLeastOne,
    bccEmails: commaSeparatedEmails,
    appliedToOrganization: z.boolean(),
  })
  .superRefine(({ thresholds }, ctx) => {
    const seenCurrencies = new Set<CurrencyEnum>()

    thresholds.forEach(({ currency }, index) => {
      if (!currency) return

      if (seenCurrencies.has(currency)) {
        ctx.addIssue({
          code: 'custom',
          message: DUPLICATE_CURRENCY_ERROR,
          path: ['thresholds', index, 'currency'],
        })
      }

      seenCurrencies.add(currency)
    })
  })

export type DunningCampaignFormValues = z.infer<typeof dunningCampaignFormSchema>

export type DunningCampaignThresholdFormValues = DunningCampaignFormValues['thresholds'][number]
