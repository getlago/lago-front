import { z } from 'zod'

import { PASSWORD_VALIDATION_ERRORS, zodRequiredPassword } from '~/formValidation/zodCustoms'

export const invitationValidationSchema = z.object({
  password: zodRequiredPassword,
})

/**
 * The password of an existing account is verified, not created: an existing password can be older
 * than the creation rules.
 */
export const invitationLogInValidationSchema = z.object({
  password: z.string().min(1, { message: PASSWORD_VALIDATION_ERRORS.REQUIRED }),
})

export type InvitationFormValues = z.infer<typeof invitationValidationSchema>

export const invitationDefaultValues: InvitationFormValues = {
  password: '',
}
