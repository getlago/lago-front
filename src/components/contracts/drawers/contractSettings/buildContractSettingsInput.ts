import { normalizePurchaseOrderNumber } from '~/components/purchaseOrder/PO'
import { ContractForContractDrawerFragment, UpdateContractInput } from '~/generated/graphql'

import { ContractSettingsFormValues } from './constants'
import { mapContractToContractSettingsFormValues } from './mapContractToContractSettingsFormValues'

import { toUtcCalendarDay, toUtcDateTime } from '../contract/buildContractInput'

// `Contracts::UpdateService` writes only present keys: a cleared value goes as null (Apollo
// strips undefined), an untouched inherited billing anchor is omitted so a no-op save does
// not pin it as an override.
export const buildContractSettingsInput = (
  value: ContractSettingsFormValues,
  contract: ContractForContractDrawerFragment,
): UpdateContractInput => {
  const seededValues = mapContractToContractSettingsFormValues(contract)
  const keepsInheritedBillingAnchor =
    !contract.billingAnchorDate && value.billingAnchorDate === seededValues.billingAnchorDate

  return {
    id: contract.id,
    name: value.name || null,
    startedAt: toUtcDateTime(value.startedAt),
    endedAt: value.endedAt ? toUtcDateTime(value.endedAt) : null,
    billingAnchorDate: keepsInheritedBillingAnchor
      ? undefined
      : toUtcCalendarDay(value.billingAnchorDate),
    purchaseOrderNumber: normalizePurchaseOrderNumber(value.purchaseOrderNumber),
  }
}
