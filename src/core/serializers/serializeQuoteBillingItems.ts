import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import type { AddOnItem } from '~/components/designSystem/RichTextEditor/PricingBlock/constants'
import { CurrencyEnum } from '~/generated/graphql'

import { deserializeAmount, serializeAmount } from './serializeAmount'
import { type BillingItemCoupon, fromCoupons } from './serializeQuoteCoupons'
import { type BillingItemPlan, fromPlanBillingItems } from './serializeQuotePlanBillingItems'

// --- Backend contract types (snake_case) ---

export interface AddOnPayload {
  position: number
  code: string
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

// position, code, and tax_codes are not overridable
type OverridableFields = Omit<AddOnPayload, 'position' | 'code' | 'tax_codes'>

interface BillingItemAddon {
  type: 'addon'
  id: string
  localId?: string
  payload: AddOnPayload
  overrides: Partial<OverridableFields>
}

export interface BillingItemsPayload {
  addons?: BillingItemAddon[]
  plans?: BillingItemPlan[]
  coupons?: BillingItemCoupon[]
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
  currency: CurrencyEnum = CurrencyEnum.Usd,
): Required<Pick<BillingItemsPayload, 'addons'>> => {
  const addons: BillingItemAddon[] = addOnItems.map((item, index) => {
    const original = originalPayloads[item.localId] ?? originalPayloads[item.addOnId]
    const payload: AddOnPayload = { ...original, position: index + 1 }

    const overrides: Partial<OverridableFields> = {}

    // Compare each overridable field. The form holds amounts in currency units
    // (e.g. "10" for $10); the payload/overrides store cents per the backend
    // contract, so convert with the quote currency before diffing.
    const formUnits = Number(item.units)
    const formUnitAmountCents = serializeAmount(item.unitAmountCents, currency)
    const formTotalAmountCents = serializeAmount(item.totalAmount, currency)
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

    return { type: 'addon' as const, id: item.addOnId, localId: item.localId, payload, overrides }
  })

  return { addons }
}

// --- Deserialization ---

interface FromBillingItemsResult {
  entities: Record<string, EntityData>
  addOnItems: AddOnItem[]
  originalPayloads: Record<string, AddOnPayload>
}

export const fromBillingItems = (
  billingItems: BillingItemsPayload,
  currency: CurrencyEnum = CurrencyEnum.Usd,
): FromBillingItemsResult => {
  const entities: Record<string, EntityData> = {}
  const addOnItems: AddOnItem[] = []
  const originalPayloads: Record<string, AddOnPayload> = {}

  const sorted = [...(billingItems.addons ?? [])].sort(
    (a, b) => a.payload.position - b.payload.position,
  )

  for (const addon of sorted) {
    const { payload, overrides, id, localId: savedLocalId } = addon
    const localId = savedLocalId ?? crypto.randomUUID()

    // Merge: overrides win over payload
    const effective = {
      name: overrides.name ?? payload.name,
      description: overrides.description ?? payload.description,
      units: overrides.units ?? payload.units,
      unit_amount_cents: overrides.unit_amount_cents ?? payload.unit_amount_cents,
      total_amount_cents: overrides.total_amount_cents ?? payload.total_amount_cents,
      invoice_display_name: overrides.invoice_display_name ?? payload.invoice_display_name,
      from_datetime: overrides.from_datetime ?? payload.from_datetime,
      to_datetime: overrides.to_datetime ?? payload.to_datetime,
    }

    // Payload stores cents; the form and preview expect currency units.
    const unitAmountCents = String(deserializeAmount(effective.unit_amount_cents, currency))
    const totalAmount = String(deserializeAmount(effective.total_amount_cents, currency))

    entities[localId] = {
      entityId: localId,
      entityType: 'addOn',
      name: effective.name,
      invoiceDisplayName: effective.invoice_display_name,
      code: payload.code,
      description: effective.description,
      units: String(effective.units),
      unitAmountCents,
      totalAmount,
      fromDatetime: effective.from_datetime ?? '',
      toDatetime: effective.to_datetime ?? '',
    }

    addOnItems.push({
      localId,
      addOnId: id,
      name: effective.name,
      invoiceDisplayName: effective.invoice_display_name,
      code: payload.code,
      description: effective.description,
      units: String(effective.units),
      unitAmountCents,
      totalAmount,
      fromDatetime: effective.from_datetime ?? '',
      toDatetime: effective.to_datetime ?? '',
    })

    originalPayloads[localId] = payload
  }

  return { entities, addOnItems, originalPayloads }
}

/**
 * Build the entity map used to render a saved quote preview (read-only flows
 * such as ApproveQuote, where the pricing drawer is not mounted).
 *
 * Entries are dual-keyed: by the generated/saved `localId` AND by the catalog
 * `addOnId`. Saved content blocks reference add-ons by `localEntityIds` (newer)
 * or, when those were never persisted, by catalog `entityIds` (legacy). Keying
 * both ways lets the preview resolve either reference — matching the
 * backward-compat behavior of `usePricingDrawer` used by the EditQuote flow.
 */
export const buildPreviewEntities = (
  billingItems: BillingItemsPayload,
  currency: CurrencyEnum = CurrencyEnum.Usd,
): Record<string, EntityData> => {
  const { entities, addOnItems } = fromBillingItems(billingItems, currency)
  const previewEntities: Record<string, EntityData> = { ...entities }

  for (const item of addOnItems) {
    previewEntities[item.addOnId] = entities[item.localId]
  }

  if (billingItems.plans && billingItems.plans.length > 0) {
    const { entityData } = fromPlanBillingItems(billingItems.plans)

    Object.assign(previewEntities, entityData)
  }

  if (billingItems.coupons && billingItems.coupons.length > 0) {
    const { entities: couponEntities } = fromCoupons(billingItems.coupons)

    Object.assign(previewEntities, couponEntities)
    // also key by couponId for legacy entityIds resolution
    for (const c of billingItems.coupons) {
      previewEntities[c.id] = couponEntities[c.localId]
    }
  }

  return previewEntities
}
