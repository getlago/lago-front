import { z } from 'zod'

import { PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

export const verifyEmailDefaultValues = { password: '' }

export const verifyEmailPasswordSchema = z.object({
  password: z.string().min(1, { message: PASSWORD_VALIDATION_ERRORS.REQUIRED }),
})

export const verifyEmailSecretSchema = z.object({ password: z.string() })
