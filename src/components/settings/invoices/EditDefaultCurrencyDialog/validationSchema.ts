import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'

export const editDefaultCurrencyValidationSchema = z.object({
  defaultCurrency: z.enum(CurrencyEnum),
})
