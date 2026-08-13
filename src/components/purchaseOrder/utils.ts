import { StatusTypeEnum } from '~/generated/graphql'

export const normalizePurchaseOrderNumber = (value?: string | null) => {
  const trimmed = value?.trim()

  return trimmed || null
}

// The API only accepts a *change* of `purchaseOrderNumber` on
// `updateSubscription` while the subscription is pending or active — any other
// status is rejected with `purchase_order_number_not_editable` (405). The
// mutation input always carries the key; this rule is what disables the field
// in the form so the change is never attempted in the first place.
export const isSubscriptionPurchaseOrderNumberEditable = (
  status?: StatusTypeEnum | null,
): boolean => status === StatusTypeEnum.Pending || status === StatusTypeEnum.Active
