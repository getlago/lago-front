import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

export const createCustomSectionValidationSchema = z
  .object({
    name: z.string().min(1, REQUIRED_FIELD_MESSAGE),
    code: z.string().min(1, REQUIRED_FIELD_MESSAGE),
    description: z.string().optional(),
    displayName: z.string().optional(),
    details: z.string().optional(),
  })
  .refine((data) => !!data.details || !!data.displayName, {
    message: REQUIRED_FIELD_MESSAGE,
    path: ['displayName'],
  })

export type CreateCustomSectionValues = z.infer<typeof createCustomSectionValidationSchema>

export const emptyCreateCustomSectionDefaultValues: CreateCustomSectionValues = {
  name: '',
  code: '',
  description: '',
  displayName: '',
  details: '',
}
