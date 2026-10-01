import { z } from 'zod'

import { PrivilegeValueTypeEnum } from '~/generated/graphql'

export const REQUIRED_FIELD_ERROR = 'text_1771342994699klxu2paz7g8'

const privilegeSchema = z.object({
  code: z.string().min(1, REQUIRED_FIELD_ERROR),
  name: z.string(),
  value: z.string().min(1, REQUIRED_FIELD_ERROR),
  valueType: z.enum(PrivilegeValueTypeEnum),
  config: z
    .object({
      selectOptions: z.array(z.string()).nullable().optional(),
    })
    .optional(),
})

export const subscriptionEntitlementValidationSchema = z.object({
  // `z.string()` also carries the message: clearing the feature combobox stores
  // `undefined`, which would otherwise surface Zod's untranslated "Invalid input".
  code: z.string(REQUIRED_FIELD_ERROR).min(1, REQUIRED_FIELD_ERROR),
  privileges: z.array(privilegeSchema),
})

export type SubscriptionEntitlementFormValues = z.infer<
  typeof subscriptionEntitlementValidationSchema
>

export type SubscriptionEntitlementPrivilegeFormValue =
  SubscriptionEntitlementFormValues['privileges'][number]

export const emptySubscriptionEntitlementDefaultValues: SubscriptionEntitlementFormValues = {
  code: '',
  privileges: [],
}
