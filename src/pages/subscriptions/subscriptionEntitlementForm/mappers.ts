import {
  EntitlementPrivilegeInput,
  GetSubscriptionEntitlementToEditQuery,
  PrivilegeValueTypeEnum,
} from '~/generated/graphql'

import {
  emptySubscriptionEntitlementDefaultValues,
  SubscriptionEntitlementFormValues,
  SubscriptionEntitlementPrivilegeFormValue,
} from './validationSchema'

export const mapPrivilegeConfigToFormValue = (
  config: { selectOptions?: string[] | null } | null | undefined,
): SubscriptionEntitlementPrivilegeFormValue['config'] =>
  config?.selectOptions ? { selectOptions: config.selectOptions } : undefined

export const mapEntitlementToFormValues = (
  entitlement: GetSubscriptionEntitlementToEditQuery['subscriptionEntitlement'] | undefined,
): SubscriptionEntitlementFormValues => {
  if (!entitlement) return emptySubscriptionEntitlementDefaultValues

  return {
    code: entitlement.code || '',
    privileges: (entitlement.privileges || []).map((privilege) => ({
      code: privilege?.code || '',
      name: privilege?.name || '',
      value: privilege?.value || '',
      valueType: privilege?.valueType || PrivilegeValueTypeEnum.Boolean,
      config: mapPrivilegeConfigToFormValue(privilege?.config),
    })),
  }
}

export const mapPrivilegesToApiInput = (
  privileges: SubscriptionEntitlementFormValues['privileges'],
): Array<EntitlementPrivilegeInput> =>
  privileges.map(({ code, value }) => ({ privilegeCode: code, value }))
