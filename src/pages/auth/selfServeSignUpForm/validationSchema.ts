import { z } from 'zod'

import { EMAIL_REGEX, PASSWORD_VALIDATION_ERRORS } from '~/formValidation/zodCustoms'

export const SELF_SERVE_EMAIL_REQUIRED_ERROR = 'text_620bc4d4269a55014d493f98'
export const SELF_SERVE_EMAIL_INVALID_ERROR = 'text_620bc4d4269a55014d493fc3'
export const SELF_SERVE_PASSWORD_ERRORS = {
  TOO_LONG: 'text_1793898059308o6phnqecxsw',
} as const

// bcrypt ignores what follows 72 bytes, so the API refuses longer passwords
const PASSWORD_MAX_BYTES = 72

// Same rules as the API's Signups::PasswordPolicy, which counts Unicode letters and digits
export const getSelfServePasswordErrors = (password: string): string[] => {
  const rules: Array<[boolean, string]> = [
    [[...password].length >= 8, PASSWORD_VALIDATION_ERRORS.MIN],
    [/\p{Ll}/u.test(password), PASSWORD_VALIDATION_ERRORS.LOWERCASE],
    [/\p{Lu}/u.test(password), PASSWORD_VALIDATION_ERRORS.UPPERCASE],
    [/\p{Nd}/u.test(password), PASSWORD_VALIDATION_ERRORS.NUMBER],
    [/[^\p{L}\p{N}\s]/u.test(password), PASSWORD_VALIDATION_ERRORS.SPECIAL],
  ]

  return rules.filter(([isMet]) => !isMet).map(([, error]) => error)
}

export const isSelfServePasswordTooLong = (password: string): boolean =>
  new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES

export const selfServeSignUpEmailSchema = z
  .string()
  .trim()
  .min(1, { message: SELF_SERVE_EMAIL_REQUIRED_ERROR, abort: true })
  .refine((value) => EMAIL_REGEX.test(value), SELF_SERVE_EMAIL_INVALID_ERROR)

export const selfServeSignUpValidationSchema = z.object({
  email: selfServeSignUpEmailSchema,
  password: z
    .string()
    .min(1, { message: PASSWORD_VALIDATION_ERRORS.REQUIRED, abort: true })
    .superRefine((value, ctx) => {
      getSelfServePasswordErrors(value).forEach((message) => {
        ctx.addIssue({ code: 'custom', message })
      })

      if (isSelfServePasswordTooLong(value)) {
        ctx.addIssue({ code: 'custom', message: SELF_SERVE_PASSWORD_ERRORS.TOO_LONG })
      }
    }),
})

type SelfServeSignUpFormValues = z.infer<typeof selfServeSignUpValidationSchema>

export const selfServeSignUpDefaultValues: SelfServeSignUpFormValues = {
  email: '',
  password: '',
}
