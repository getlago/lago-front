import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

export const createPricingUnitValidationSchema = z.object({
  name: z.string().min(1, REQUIRED_FIELD_MESSAGE),
  code: z.string().min(1, REQUIRED_FIELD_MESSAGE),
  description: z.string().optional(),
  shortName: z.string().min(1, REQUIRED_FIELD_MESSAGE).max(3, 'text_1750424999815o2wik8216ht'),
})

export type CreatePricingUnitValues = z.infer<typeof createPricingUnitValidationSchema>
