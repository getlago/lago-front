import { z } from 'zod'

import { zodRequiredPassword } from '~/formValidation/zodCustoms'

export const resetPasswordValidationSchema = z.object({
  password: zodRequiredPassword,
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordValidationSchema>

export const resetPasswordDefaultValues: ResetPasswordFormValues = {
  password: '',
}
