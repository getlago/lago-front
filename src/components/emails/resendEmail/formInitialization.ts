import { z } from 'zod'

import { EMAIL_REGEX } from '~/formValidation/zodCustoms'

const emailRecipientSchema = z.looseObject({
  value: z.string().regex(EMAIL_REGEX, 'text_620bc4d4269a55014d493fc3'),
})

export const resendEmailFormValidationSchema = z.object({
  to: z.array(emailRecipientSchema).min(1).optional(),
  cc: z.array(emailRecipientSchema).optional(),
  bcc: z.array(emailRecipientSchema).optional(),
})

export type ResendEmailFormDefaultValues = z.infer<typeof resendEmailFormValidationSchema>

export const resendEmailFormDefaultValues: ResendEmailFormDefaultValues = {
  to: undefined,
  cc: undefined,
  bcc: undefined,
}
