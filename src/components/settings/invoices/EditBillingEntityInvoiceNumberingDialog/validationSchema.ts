import { z } from 'zod'

import { BillingEntityDocumentNumberingEnum } from '~/generated/graphql'

export const editBillingEntityInvoiceNumberingValidationSchema = z.object({
  documentNumbering: z.enum(BillingEntityDocumentNumberingEnum),
  documentNumberPrefix: z.string().min(1).max(10, { message: 'text_6566f920a1d6c35693d6cd77' }),
})
