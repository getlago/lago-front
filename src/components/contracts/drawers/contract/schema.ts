import { z } from 'zod'

import { addPurchaseOrderNumberMaxLengthIssue } from '~/components/purchaseOrder/validation'
import { addEndDateAfterStartIssue, addUnsupportedDateIssue } from '~/formValidation/zodCustoms'

import { ContractFormValues, VALUE_REQUIRED_KEY } from './constants'

/** "End date can't be in the past and should be greater than start date" */
const END_DATE_INVALID_KEY = 'text_64ef55a730b88e3d2117b3d4'

const requireField = (
  ctx: z.RefinementCtx,
  value: string | undefined,
  path: (string | number)[],
): void => {
  if (!value) {
    ctx.addIssue({ code: 'custom', message: VALUE_REQUIRED_KEY, path })
  }
}

const requireDate = (
  ctx: z.RefinementCtx,
  value: string | undefined,
  path: (string | number)[],
): void => {
  if (!value) {
    ctx.addIssue({ code: 'custom', message: VALUE_REQUIRED_KEY, path })
    return
  }

  addUnsupportedDateIssue(ctx, value, path)
}

/**
 * `z.custom` + `superRefine` rather than a `z.object`: the two comboboxes publish
 * `undefined` when cleared, and a field-level `z.string()` would reject that before
 * the required check ever runs — leaving submit disabled with no message.
 *
 * The date rules are ported from `subscriptionFormSchema`, which is the behaviour
 * the contract dates are specified to match.
 */
export const contractSchema = z.custom<ContractFormValues>().superRefine((data, ctx) => {
  requireField(ctx, data.externalCustomerId, ['externalCustomerId'])
  if (data.isPlanRequired) requireField(ctx, data.planCode, ['planCode'])
  requireDate(ctx, data.startedAt, ['startedAt'])
  requireDate(ctx, data.billingAnchorDate, ['billingAnchorDate'])

  addPurchaseOrderNumberMaxLengthIssue(ctx, data.purchaseOrderNumber, ['purchaseOrderNumber'])

  if (!data.endedAt) return
  if (addUnsupportedDateIssue(ctx, data.endedAt, ['endedAt'])) return

  addEndDateAfterStartIssue(ctx, data.startedAt, data.endedAt, ['endedAt'], END_DATE_INVALID_KEY)
})
