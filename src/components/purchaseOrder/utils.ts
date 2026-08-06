import { StatusTypeEnum } from '~/generated/graphql'

export const normalizePurchaseOrderNumber = (value?: string | null) => {
  const trimmed = value?.trim()

  return trimmed || null
}

// The API only accepts the `purchaseOrderNumber` key on `updateSubscription`
// while the subscription is pending or active — otherwise it rejects the whole
// update with `purchase_order_number_not_editable` (405), on key presence alone
// and not on an actual value change. Consumers use this both to disable the
// field and to omit the key from the mutation input.
export const isSubscriptionPurchaseOrderNumberEditable = (
  status?: StatusTypeEnum | null,
): boolean => status === StatusTypeEnum.Pending || status === StatusTypeEnum.Active
