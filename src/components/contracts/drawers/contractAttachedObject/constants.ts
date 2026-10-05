export const CONTRACT_ATTACHED_OBJECT_FORM_ID = 'contract-attached-object-drawer-form'

export const CONTRACT_ATTACHED_OBJECT_DRAWER_SUBMIT_TEST_ID =
  'contract-attached-object-drawer-submit'
export const CONTRACT_ATTACHED_OBJECT_DRAWER_CUSTOMER_TEST_ID =
  'contract-attached-object-drawer-customer'
export const CONTRACT_ATTACHED_OBJECT_DRAWER_PLAN_COMBOBOX_TEST_ID =
  'contract-attached-object-drawer-plan-combobox'

export const CONTRACT_ATTACHED_OBJECT_DRAWER_TITLE_KEY = 'text_17907810831379bun2hcgjr6'

export interface ContractAttachedObjectFormValues {
  // Display only: the customer can never be reassigned once the contract exists —
  // `UpdateContractInput` has no `externalCustomerId` argument.
  externalCustomerId: string
  billingEntityId?: string
  planCode: string
  // `planCode` is optional on the API: only a contract edited without a plan may leave it empty.
  isPlanRequired: boolean
}

/** Static shape for `withForm`'s type inference only — the real values come from
 *  `mapContractToAttachedObjectFormValues` at open time. */
export const CONTRACT_ATTACHED_OBJECT_FORM_DEFAULTS: ContractAttachedObjectFormValues = {
  externalCustomerId: '',
  billingEntityId: undefined,
  planCode: '',
  isPlanRequired: true,
}
