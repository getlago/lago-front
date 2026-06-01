import type { AddOnItem } from '~/components/designSystem/RichTextEditor/PricingBlock/constants'

// --- Backend contract types (snake_case) ---

export interface AddOnPayload {
  position: number
  add_on_code: string
  name: string
  description: string
  units: number
  unit_amount_cents: number
  total_amount_cents: number
  invoice_display_name: string
  from_datetime: string | null
  to_datetime: string | null
  tax_codes: string[]
}

// position, add_on_code, and tax_codes are not overridable
type OverridableFields = Omit<AddOnPayload, 'position' | 'add_on_code' | 'tax_codes'>

export interface BillingItemAddon {
  type: 'addon'
  id: string
  payload: AddOnPayload
  overrides: Partial<OverridableFields>
}

export interface BillingItemsPayload {
  addons: BillingItemAddon[]
}

// --- Serialization helpers ---

/**
 * Convert form empty string to null for datetime fields to match payload baseline.
 */
const normalizeDateTime = (value: string): string | null => (value === '' ? null : value)

/**
 * Build the billingItems JSON payload from form state and original API payloads.
 */
export const toBillingItems = (
  addOnItems: AddOnItem[],
  originalPayloads: Record<string, AddOnPayload>,
): BillingItemsPayload => {
  const addons: BillingItemAddon[] = addOnItems.map((item, index) => {
    const original = originalPayloads[item.addOnId]
    const payload: AddOnPayload = { ...original, position: index + 1 }

    const overrides: Partial<OverridableFields> = {}

    // Compare each overridable field
    const formUnits = Number(item.units)
    const formUnitAmountCents = Number(item.unitAmountCents)
    const formTotalAmountCents = Number(item.totalAmount)
    const formFromDatetime = normalizeDateTime(item.fromDatetime)
    const formToDatetime = normalizeDateTime(item.toDatetime)

    if (item.name !== original.name) {
      overrides.name = item.name
    }
    if (item.description !== original.description) {
      overrides.description = item.description
    }
    if (formUnits !== original.units) {
      overrides.units = formUnits
    }
    if (formUnitAmountCents !== original.unit_amount_cents) {
      overrides.unit_amount_cents = formUnitAmountCents
    }
    if (formTotalAmountCents !== original.total_amount_cents) {
      overrides.total_amount_cents = formTotalAmountCents
    }
    if (item.invoiceDisplayName !== original.invoice_display_name) {
      overrides.invoice_display_name = item.invoiceDisplayName
    }
    if (formFromDatetime !== original.from_datetime) {
      overrides.from_datetime = formFromDatetime
    }
    if (formToDatetime !== original.to_datetime) {
      overrides.to_datetime = formToDatetime
    }

    return { type: 'addon' as const, id: item.addOnId, payload, overrides }
  })

  return { addons }
}
