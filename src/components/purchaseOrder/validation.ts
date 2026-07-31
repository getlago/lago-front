import { z } from 'zod'

import { PURCHASE_ORDER_NUMBER_MAX_LENGTH, PURCHASE_ORDER_TRANSLATIONS } from './constants'

/**
 * purchaseOrderNumber — optional, bounded length. Shared by every form schema
 * embedding the field so the bound and the message key live in one place.
 * PurchaseOrderFormBlock renders its own inline max-length error (it is a
 * plain value/onChange input, not an AppField), so this issue only gates the
 * submit.
 */
export const addPurchaseOrderNumberMaxLengthIssue = (
  ctx: z.RefinementCtx,
  value: string | null | undefined,
  path: (string | number)[],
): void => {
  if ((value?.length ?? 0) > PURCHASE_ORDER_NUMBER_MAX_LENGTH) {
    ctx.addIssue({ code: 'custom', message: PURCHASE_ORDER_TRANSLATIONS.maxLength, path })
  }
}
