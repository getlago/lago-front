import { z } from 'zod'

import { invoiceGracePeriodSchema } from '~/formValidation/invoiceGracePeriodSchema'

export const editBillingEntityGracePeriodValidationSchema = z.object({
  invoiceGracePeriod: invoiceGracePeriodSchema,
})
