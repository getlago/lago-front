import { z } from 'zod'

import { isMultipleEmailsValid } from '~/formValidation/zodCustoms'
import { PaymentMethodTypeEnum } from '~/generated/graphql'

export const requestOverduePaymentValidationSchema = z.object({
  // `zodMultipleEmails` carries the same rule, but its message is worded for a
  // single address — this field takes a comma-separated list.
  emails: z
    .string()
    .min(1, { message: 'text_620bc4d4269a55014d493f3d' })
    .refine(isMultipleEmailsValid, 'text_66b258f62100490d0eb5ca8b'),
  paymentMethod: z.object({
    paymentMethodId: z.string().nullish(),
    paymentMethodType: z.enum(PaymentMethodTypeEnum).nullish(),
  }),
})

export type CustomerRequestOverduePaymentForm = z.infer<
  typeof requestOverduePaymentValidationSchema
>

export const requestOverduePaymentDefaultValues: CustomerRequestOverduePaymentForm = {
  emails: '',
  paymentMethod: {
    paymentMethodId: undefined,
    paymentMethodType: undefined,
  },
}
