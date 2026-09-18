import { DateTime } from 'luxon'
import { z } from 'zod'

import { addPurchaseOrderNumberMaxLengthIssue } from '~/components/purchaseOrder/validation'
import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'

import { ContractFormValues, VALUE_REQUIRED_KEY } from './constants'

/** "End date can't be in the past and should be greater than start date" */
const END_DATE_INVALID_KEY = 'text_64ef55a730b88e3d2117b3d4'

/**
 * `z.custom` + `superRefine` rather than a `z.object`: the two comboboxes publish
 * `undefined` when cleared, and a field-level `z.string()` would reject that before
 * the required check ever runs — leaving submit disabled with no message.
 *
 * The date rules are ported from `subscriptionFormSchema`, which is the behaviour
 * the contract dates are specified to match.
 */
export const contractSchema = z.custom<ContractFormValues>().superRefine((data, ctx) => {
  if (!data.externalCustomerId) {
    ctx.addIssue({
      code: 'custom',
      message: VALUE_REQUIRED_KEY,
      path: ['externalCustomerId'],
    })
  }

  if (!data.planCode) {
    ctx.addIssue({
      code: 'custom',
      message: VALUE_REQUIRED_KEY,
      path: ['planCode'],
    })
  }

  if (!data.startedAt) {
    ctx.addIssue({
      code: 'custom',
      message: VALUE_REQUIRED_KEY,
      path: ['startedAt'],
    })
  } else {
    addUnsupportedDateIssue(ctx, data.startedAt, ['startedAt'])
  }

  if (!data.billingAnchorDate) {
    ctx.addIssue({
      code: 'custom',
      message: VALUE_REQUIRED_KEY,
      path: ['billingAnchorDate'],
    })
  } else {
    addUnsupportedDateIssue(ctx, data.billingAnchorDate, ['billingAnchorDate'])
  }

  addPurchaseOrderNumberMaxLengthIssue(ctx, data.purchaseOrderNumber, ['purchaseOrderNumber'])

  if (!data.endedAt) return

  if (addUnsupportedDateIssue(ctx, data.endedAt, ['endedAt'])) return

  if (data.startedAt) {
    const startedAt = DateTime.fromISO(data.startedAt)
    const endedAt = DateTime.fromISO(data.endedAt)

    if (endedAt <= startedAt || DateTime.now().diff(endedAt, 'days').days >= 0) {
      ctx.addIssue({
        code: 'custom',
        message: END_DATE_INVALID_KEY,
        path: ['endedAt'],
      })
    }
  }
})
