import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'

export const editQuoteAsideSchema = z.object({
  orderTypeLabel: z.string(),
  billingEntityId: z.string(),
  currency: z.nativeEnum(CurrencyEnum).optional(),
  subscriptionLabel: z.string().optional(),
})

export type EditQuoteAsideFormValues = z.infer<typeof editQuoteAsideSchema>

export const editQuoteAsideDefaultValues: EditQuoteAsideFormValues = {
  orderTypeLabel: '',
  billingEntityId: '',
  currency: undefined,
  subscriptionLabel: undefined,
}
