/**
 * Shared `<ComboBox>` defaults applied by every billing-entity picker
 * (`BillingEntityFilterPicker`, `BillingEntityFormPicker`).
 *
 * Spread last so callers can override per-instance if needed.
 */
export const BILLING_ENTITY_COMBOBOX_DEFAULTS = {
  disableClearable: true,
  sortValues: false,
  PopperProps: { displayInDialog: true },
} as const
