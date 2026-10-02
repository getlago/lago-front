import { z } from 'zod'

import { zodRequiredEmail } from '~/formValidation/zodCustoms'

// Premium integrations / feature flags are selected via MultipleComboBox, whose field value is
// an array of `{ value }` option objects (no label here). Mapped back to `string[]` at submit.
const optionSchema = z.object({ value: z.string() })

export const adminOrganizationCreateValidationSchema = z.object({
  // "Field is required"
  name: z.string().trim().min(1, { message: 'text_1771342994699klxu2paz7g8' }),
  ownerEmail: zodRequiredEmail,
  timezone: z.string().optional(),
  premiumIntegrations: z.array(optionSchema),
  featureFlags: z.array(optionSchema),
})

export type AdminOrganizationCreateFormValues = z.infer<
  typeof adminOrganizationCreateValidationSchema
>
