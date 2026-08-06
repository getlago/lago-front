import { z } from 'zod'

import { EMAIL_REGEX } from '~/formValidation/zodCustoms'

export const loginValidationSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'text_620bc4d4269a55014d493f98' })
    .refine((val) => !val || EMAIL_REGEX.test(val), 'text_620bc4d4269a55014d493fc3'),
  password: z.string().min(1, { message: 'text_620bc4d4269a55014d493fb3' }),
})

export type LoginFormValues = z.infer<typeof loginValidationSchema>

export const loginDefaultValues: LoginFormValues = {
  email: '',
  password: '',
}
