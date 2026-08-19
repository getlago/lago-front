import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'

export const editQuoteAsideSchema = z.object({
  orderTypeLabel: z.string(),
  // Empty means "follow the customer's own billing entity at billing time".
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
