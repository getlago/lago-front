import { z } from 'zod'

import {
  PASSWORD_VALIDATION_ERRORS,
  zodRequiredEmail,
  zodRequiredPassword,
} from '~/formValidation/zodCustoms'

// Only the validation keys shown in the UI feedback (excludes REQUIRED)
export const PASSWORD_VALIDATION_KEYS = [
  PASSWORD_VALIDATION_ERRORS.MIN,
  PASSWORD_VALIDATION_ERRORS.LOWERCASE,
  PASSWORD_VALIDATION_ERRORS.UPPERCASE,
  PASSWORD_VALIDATION_ERRORS.NUMBER,
  PASSWORD_VALIDATION_ERRORS.SPECIAL,
] as const

export const signUpValidationSchema = z.object({
  organizationName: z.string().min(1, { message: 'text_620bc4d4269a55014d493f4d' }),
  email: zodRequiredEmail,
  password: zodRequiredPassword,
})

// Google register only requires organization name, but has same shape as signUpValidationSchema
export const googleRegisterValidationSchema = z.object({
  organizationName: z.string().min(1, {
    message: 'text_620bc4d4269a55014d493f4d',
  }),
  email: z.string(),
  password: z.string(),
})

export type SignUpFormValues = z.infer<typeof signUpValidationSchema>

export const signUpDefaultValues: SignUpFormValues = {
  organizationName: '',
  email: '',
  password: '',
}
