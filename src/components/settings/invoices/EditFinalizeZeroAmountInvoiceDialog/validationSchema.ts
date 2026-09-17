import { z } from 'zod'

export const editFinalizeZeroAmountInvoiceValidationSchema = z.object({
  finalizeZeroAmountInvoice: z.string().min(1),
})
