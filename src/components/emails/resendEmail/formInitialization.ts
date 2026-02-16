import { z } from 'zod'

import { EMAIL_REGEX } from '~/formValidation/zodCustoms'

const emailRecipientsSchema = z
  .array(z.looseObject({ value: z.string() }))
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return
    for (const item of val) {
      if (!EMAIL_REGEX.test(item.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'text_620bc4d4269a55014d493fc3',
        })
        return
      }
    }
  })

export const resendEmailFormValidationSchema = z.object({
  to: emailRecipientsSchema,
  cc: emailRecipientsSchema,
  bcc: emailRecipientsSchema,
})

export type ResendEmailFormDefaultValues = z.infer<typeof resendEmailFormValidationSchema>

export const resendEmailFormDefaultValues: ResendEmailFormDefaultValues = {
  to: undefined,
  cc: undefined,
  bcc: undefined,
}
