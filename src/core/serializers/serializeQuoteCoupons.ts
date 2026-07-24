import type { EntityData } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import { CouponFrequency, CouponTypeEnum, CurrencyEnum } from '~/generated/graphql'

import { deserializeAmount, serializeAmount } from './serializeAmount'

// --- Backend contract (camelCase) ---
export interface CouponPayload {
  position: number
  code: string
  id: string
  name: string
  type: 'fixed_amount' | 'percentage'
  amountCents: number | null
  percentageRate: number | null
  currency: string
  frequency: 'once' | 'recurring' | 'forever'
  frequencyDuration: number | null
  expirationAt: string | null
  limitedPlans: boolean
  planCodes: string[]
  limitedBillableMetrics: boolean
  billableMetricCodes: string[]
  couponOverrides: unknown
  catalogSnapshot: unknown
  resolvedPayload: unknown
}

// Full UI-editable set, ALWAYS written (not Partial). Excludes currency (locked).
export type CouponOverrides = Pick<
  CouponPayload,
  'amountCents' | 'percentageRate' | 'frequency' | 'frequencyDuration'
>

export interface BillingItemCoupon {
  type: 'coupon'
  id: string // catalog coupon id (cpn_)
  localId: string // FE-generated per-line key
  payload: CouponPayload
  overrides: CouponOverrides
}

// --- UI/form shape (camelCase) ---
export interface DiscountFormItem {
  localId: string
  couponId: string
  couponType: CouponTypeEnum
  name: string
  code: string
  currency: CurrencyEnum
  amount: string
  percentageRate?: number | null
  frequency: CouponFrequency
  frequencyDuration?: number | null
}

export const toCoupons = (
  items: DiscountFormItem[],
  originalPayloads: Record<string, CouponPayload>,
): BillingItemCoupon[] =>
  items.map((item, index) => {
    const original = originalPayloads[item.localId]
    const payload: CouponPayload = { ...original, position: index + 1 }

    const isFixed = item.couponType === CouponTypeEnum.FixedAmount

    const overrides: CouponOverrides = {
      amountCents: isFixed ? serializeAmount(Number(item.amount), item.currency) : null,
      percentageRate: isFixed ? null : (item.percentageRate ?? null),
      frequency: item.frequency as CouponPayload['frequency'],
      frequencyDuration:
        item.frequency === CouponFrequency.Recurring ? (item.frequencyDuration ?? null) : null,
    }

    return { type: 'coupon' as const, id: item.couponId, localId: item.localId, payload, overrides }
  })

export const fromCoupons = (
  coupons: BillingItemCoupon[],
): {
  entities: Record<string, EntityData>
  discountItems: DiscountFormItem[]
  originalPayloads: Record<string, CouponPayload>
} => {
  const entities: Record<string, EntityData> = {}
  const discountItems: DiscountFormItem[] = []
  const originalPayloads: Record<string, CouponPayload> = {}

  const sorted = [...coupons].sort((a, b) => a.payload.position - b.payload.position)

  for (const coupon of sorted) {
    const { payload, overrides, id, localId: savedLocalId } = coupon
    const localId = savedLocalId ?? crypto.randomUUID()
    const currency = (payload.currency as CurrencyEnum) ?? CurrencyEnum.Usd

    const effectiveAmountCents = overrides.amountCents ?? payload.amountCents ?? 0
    const couponType =
      payload.type === 'percentage' ? CouponTypeEnum.Percentage : CouponTypeEnum.FixedAmount
    const frequency = (overrides.frequency ?? payload.frequency) as CouponFrequency

    entities[localId] = {
      entityId: localId,
      entityType: 'coupon',
      name: payload.name,
      code: payload.code,
      couponType,
      amountCents: String(effectiveAmountCents),
      amountCurrency: currency,
      percentageRate: overrides.percentageRate ?? payload.percentageRate,
      frequency,
      frequencyDuration: overrides.frequencyDuration ?? payload.frequencyDuration,
    }

    const amountNumber = deserializeAmount(effectiveAmountCents, currency)

    discountItems.push({
      localId,
      couponId: id,
      couponType,
      name: payload.name,
      code: payload.code,
      currency,
      // toString() (not toFixed) so whole amounts show as "90" not "90.00",
      // matching the fresh-coupon-select prefill in useDiscountDrawer.
      amount: amountNumber.toString(),
      percentageRate: overrides.percentageRate ?? payload.percentageRate,
      frequency,
      frequencyDuration: overrides.frequencyDuration ?? payload.frequencyDuration,
    })

    originalPayloads[localId] = payload
  }

  return { entities, discountItems, originalPayloads }
}
