import { z } from 'zod'

import { zodOneOfPermissions } from '~/formValidation/zodCustoms'

export const validationSchema = z.object({
  name: z.string().min(1, 'text_1766155139328b95i4fjkwe9'),
  code: z.string(),
  description: z.string(),
  permissions: z.record(zodOneOfPermissions, z.boolean()).refine((data) => {
    return Object.values(data).includes(true)
  }, 'text_1767969448650g3wwpvy5f9g'),
})

export type RoleCreateEditFormValues = z.infer<typeof validationSchema>
