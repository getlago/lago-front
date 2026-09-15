import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'

import { VALUE_REQUIRED_KEY } from './constants'

export const catalogPlanSchema = z.object({
  name: z.string().min(1, { message: VALUE_REQUIRED_KEY }),
  code: z.string().min(1, { message: VALUE_REQUIRED_KEY }),
  currency: z.enum(CurrencyEnum, { message: VALUE_REQUIRED_KEY }),
  description: z.string(),
  invoiceDisplayName: z.string(),
})
