import { z } from 'zod'

import { CountryCode } from '~/generated/graphql'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

export const billingEntityCreateEditValidationSchema = z.object({
  name: z.string().min(1, REQUIRED_FIELD_MESSAGE),
  code: z.string().min(1, REQUIRED_FIELD_MESSAGE),
  legalName: z.string().optional(),
  legalNumber: z.string().optional(),
  taxIdentificationNumber: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  zipcode: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.enum(CountryCode).optional(),
  logo: z.string().nullish(),
  einvoicing: z.boolean().optional(),
})

export type BillingEntityCreateEditValues = z.infer<typeof billingEntityCreateEditValidationSchema>
