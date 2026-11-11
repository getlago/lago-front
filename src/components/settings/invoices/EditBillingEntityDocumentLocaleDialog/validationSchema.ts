import { z } from 'zod'

export const editBillingEntityDocumentLocaleValidationSchema = z.object({
  // The combobox emits `undefined` when cleared, so cover both the missing
  // (invalid_type) and empty-string cases with the same "required" message.
  documentLocale: z
    .string({ message: 'text_624ea7c29103fd010732ab7d' })
    .min(1, { message: 'text_624ea7c29103fd010732ab7d' }),
})
