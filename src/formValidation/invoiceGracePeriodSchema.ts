import { z } from 'zod'

const MAX_INVOICE_GRACE_PERIOD_DAYS = 365

// Shared by the customer and billing entity grace-period dialogs. An empty
// input is allowed and submits as 0.
export const invoiceGracePeriodSchema = z
  .string()
  .refine((value) => Number(value) <= MAX_INVOICE_GRACE_PERIOD_DAYS, {
    message: 'text_63bed78ae69de9cad5c348e4',
  })
