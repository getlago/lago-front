import { z } from 'zod'

export const editBillingEntityGracePeriodValidationSchema = z.object({
  invoiceGracePeriod: z.union([
    z.number().max(365, { message: 'text_63bed78ae69de9cad5c348e4' }),
    z.literal(''),
  ]),
})
