import { z } from 'zod'

export const INVOICE_FOOTER_MAX_CHAR_LIMIT = 600

export const editBillingEntityInvoiceTemplateValidationSchema = z.object({
  invoiceFooter: z
    .string()
    .max(INVOICE_FOOTER_MAX_CHAR_LIMIT, { message: 'text_62bb10ad2a10bd182d00203b' }),
})
