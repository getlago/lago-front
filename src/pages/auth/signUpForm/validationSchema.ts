import { z } from 'zod'

import { EMAIL_REGEX } from '~/formValidation/zodCustoms'

// Password validation error messages
export const PASSWORD_VALIDATION_ERRORS = {
  REQUIRED: 'text_620bc4d4269a55014d493f61',
  MIN: 'text_620bc4d4269a55014d493fac',
  LOWERCASE: 'text_620bc4d4269a55014d493f57',
  UPPERCASE: 'text_620bc4d4269a55014d493f7b',
  NUMBER: 'text_620bc4d4269a55014d493f8d',
  SPECIAL: 'text_620bc4d4269a55014d493fa0',
} as const

// Only the validation keys shown in the UI feedback (excludes REQUIRED)
export const PASSWORD_VALIDATION_KEYS = [
  PASSWORD_VALIDATION_ERRORS.MIN,
  PASSWORD_VALIDATION_ERRORS.LOWERCASE,
  PASSWORD_VALIDATION_ERRORS.UPPERCASE,
  PASSWORD_VALIDATION_ERRORS.NUMBER,
  PASSWORD_VALIDATION_ERRORS.SPECIAL,
] as const

const SPECIAL_CHARS_REGEX = /[/_!@#$%^&*(),.?":{}|<>-]/

// Single source of truth for password validation
export const validatePassword = (password: string): string[] => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push(PASSWORD_VALIDATION_ERRORS.MIN)
  }
  if (!/[a-z]/.test(password)) {
    errors.push(PASSWORD_VALIDATION_ERRORS.LOWERCASE)
  }
  if (!/[A-Z]/.test(password)) {
    errors.push(PASSWORD_VALIDATION_ERRORS.UPPERCASE)
  }
  if (!/\d/.test(password)) {
    errors.push(PASSWORD_VALIDATION_ERRORS.NUMBER)
  }
  if (!SPECIAL_CHARS_REGEX.test(password)) {
    errors.push(PASSWORD_VALIDATION_ERRORS.SPECIAL)
  }

  return errors
}

export const getPasswordValidationErrorKey = (
  errorKey: (typeof PASSWORD_VALIDATION_KEYS)[number],
): string => {
  const keyMap: Record<string, string> = {
    [PASSWORD_VALIDATION_ERRORS.MIN]: 'MIN',
    [PASSWORD_VALIDATION_ERRORS.LOWERCASE]: 'LOWERCASE',
    [PASSWORD_VALIDATION_ERRORS.UPPERCASE]: 'UPPERCASE',
    [PASSWORD_VALIDATION_ERRORS.NUMBER]: 'NUMBER',
    [PASSWORD_VALIDATION_ERRORS.SPECIAL]: 'SPECIAL',
  }

  return keyMap[errorKey] || errorKey
}

export const zodRequiredEmail = z
  .string()
  .min(1, { message: 'text_620bc4d4269a55014d493f3d' })
  .refine((val) => EMAIL_REGEX.test(val), 'text_620bc4d4269a55014d493f43')

export const zodRequiredPassword = z
  .string()
  .min(1, { message: PASSWORD_VALIDATION_ERRORS.REQUIRED })
  .superRefine((val, ctx) => {
    validatePassword(val).forEach((error) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
      })
    })
  })

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
