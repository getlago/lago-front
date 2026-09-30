export const CONTRACT_SETTINGS_FORM_ID = 'contract-settings-drawer-form'

export const CONTRACT_SETTINGS_DRAWER_SUBMIT_TEST_ID = 'contract-settings-drawer-submit'
export const CONTRACT_SETTINGS_DRAWER_EXTERNAL_ID_TEST_ID = 'contract-settings-drawer-external-id'
export const CONTRACT_SETTINGS_DRAWER_SHOW_NAME_TEST_ID = 'contract-settings-drawer-show-name'
export const CONTRACT_SETTINGS_DRAWER_REMOVE_NAME_TEST_ID = 'contract-settings-drawer-remove-name'

export const CONTRACT_SETTINGS_DRAWER_TITLE_KEY = 'text_1790781083137p7hptflpk49'

export interface ContractSettingsFormValues {
  // Display only, always locked: `UpdateContractInput.externalId` is the lookup key, not
  // an editable field — `Mutations::Contracts::Update` uses it to find the contract.
  externalId: string
  name: string
  startedAt: string
  endedAt?: string
  // The stored end date: `Contracts::UpdateService` accepts it resent unchanged, even once passed.
  initialEndedAt?: string
  billingAnchorDate: string
  purchaseOrderNumber?: string | null
}

/** Static shape for `withForm`'s type inference only — the real values come from
 *  `mapContractToContractSettingsFormValues` at open time. */
export const CONTRACT_SETTINGS_FORM_DEFAULTS: ContractSettingsFormValues = {
  externalId: '',
  name: '',
  startedAt: '2026-01-01',
  endedAt: undefined,
  initialEndedAt: undefined,
  billingAnchorDate: '2026-01-01',
  purchaseOrderNumber: undefined,
}
