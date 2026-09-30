import { ContractForContractDrawerFragment, UpdateContractInput } from '~/generated/graphql'

import { ContractAttachedObjectFormValues } from './constants'
import { mapContractToAttachedObjectFormValues } from './mapContractToAttachedObjectFormValues'

// `Contracts::UpdateService` writes only present keys: a cleared value goes as null (Apollo
// strips undefined), an untouched inherited billing entity is omitted so a no-op save does
// not pin it as an override.
export const buildContractAttachedObjectInput = (
  value: ContractAttachedObjectFormValues,
  contract: ContractForContractDrawerFragment,
): UpdateContractInput => {
  const seededValues = mapContractToAttachedObjectFormValues(contract)
  const keepsInheritedBillingEntity =
    !contract.billingEntityId && value.billingEntityId === seededValues.billingEntityId

  return {
    externalId: contract.externalId,
    planCode: value.planCode || undefined,
    billingEntityId: keepsInheritedBillingEntity ? undefined : value.billingEntityId || null,
  }
}
