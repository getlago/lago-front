import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { SelectedPaymentMethod } from '~/components/paymentMethodSelection/types'
import { getTodayAtUtcMidnight } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'

export const CONTRACT_FORM_ID = 'contract-drawer-form'

export const CONTRACT_DRAWER_SUBMIT_TEST_ID = 'contract-drawer-submit'
export const CONTRACT_DRAWER_SHOW_NAME_TEST_ID = 'contract-drawer-show-name'
export const CONTRACT_DRAWER_SHOW_EXTERNAL_ID_TEST_ID = 'contract-drawer-show-external-id'
export const CONTRACT_DRAWER_REMOVE_EXTERNAL_ID_TEST_ID = 'contract-drawer-remove-external-id'
export const CONTRACT_DRAWER_REMOVE_NAME_TEST_ID = 'contract-drawer-remove-name'
export const CONTRACT_DRAWER_CUSTOMER_COMBOBOX_TEST_ID = 'contract-drawer-customer-combobox'
export const CONTRACT_DRAWER_PLAN_COMBOBOX_TEST_ID = 'contract-drawer-plan-combobox'

/** "Please fill this input to move forward" — the copy the designs show under the
 *  two required comboboxes. */
export const VALUE_REQUIRED_KEY = 'text_620bc4d4269a55014d493f98'

export const CONTRACT_DRAWER_TITLE_CREATE_KEY = 'text_1789552637140uev14bbwspq'

/**
 * `externalCustomerId` and `planCode` mirror `CreateContractInput`, which is keyed on
 * the customer's EXTERNAL id and the plan's CODE — not the internal ids the
 * subscription form stores. Keeping the form field names identical to the input
 * fields is what stops the two being swapped at the mutation boundary.
 */
export interface ContractFormValues {
  externalCustomerId: string
  externalId: string
  planCode: string
  // `planCode` is optional on the API: only a contract edited without a plan may leave it empty.
  isPlanRequired: boolean
  name: string
  billingEntityId?: string
  consolidateInvoice: boolean
  invoiceCustomSection: InvoiceCustomSectionInput
  paymentMethod?: SelectedPaymentMethod
  purchaseOrderNumber?: string | null
  startedAt: string
  endedAt?: string
  // The stored end date: `Contracts::UpdateService` accepts it resent unchanged, even once passed.
  initialEndedAt?: string
  billingAnchorDate?: string
}

export interface ContractDrawerCustomer {
  id?: string
  externalId: string
  displayName?: string | null
  applicableTimezone?: TimezoneEnum | null
  billingEntityId?: string
}

export interface ContractDrawerPlan {
  code: string
  name: string
}

export const buildContractFormDefaults = (
  customer?: ContractDrawerCustomer,
): ContractFormValues => {
  const today = getTodayAtUtcMidnight()

  return {
    externalCustomerId: customer?.externalId ?? '',
    externalId: '',
    planCode: '',
    isPlanRequired: true,
    name: '',
    billingEntityId: customer?.billingEntityId,
    consolidateInvoice: true,
    invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
    paymentMethod: undefined,
    purchaseOrderNumber: undefined,
    startedAt: today,
    endedAt: undefined,
    initialEndedAt: undefined,
    // Left empty: `Contracts::CreateService` anchors billing to `startedAt` when
    // omitted, which a client default of `today` would silently override.
    billingAnchorDate: undefined,
  }
}

/** Static shape for `withForm`'s type inference only — the real values come from
 *  `buildContractFormDefaults` at open time. The frozen date mirrors
 *  `TYPING_PLACEHOLDER_DATE` in the subscription form sections: it keeps this
 *  module free of a `DateTime.now()` evaluated at import. */
export const CONTRACT_FORM_DEFAULTS: ContractFormValues = {
  externalCustomerId: '',
  externalId: '',
  planCode: '',
  isPlanRequired: true,
  name: '',
  billingEntityId: undefined,
  consolidateInvoice: true,
  invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
  paymentMethod: undefined,
  purchaseOrderNumber: undefined,
  startedAt: '2026-01-01',
  endedAt: undefined,
  initialEndedAt: undefined,
  billingAnchorDate: undefined,
}
