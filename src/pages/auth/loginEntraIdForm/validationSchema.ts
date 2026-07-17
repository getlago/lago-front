import { z } from 'zod'

import { zodRequiredEmail } from '~/formValidation/zodCustoms'

export const loginEntraIdValidationSchema = z.object({
  email: zodRequiredEmail,
})

export type LoginEntraIdFormValues = z.infer<typeof loginEntraIdValidationSchema>

export const loginEntraIdDefaultValues: LoginEntraIdFormValues = {
  email: '',
}
