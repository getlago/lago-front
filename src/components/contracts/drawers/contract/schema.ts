import { DateTime } from 'luxon'
import { z } from 'zod'

import { addPurchaseOrderNumberMaxLengthIssue } from '~/components/purchaseOrder/validation'
import { addEndDateAfterStartIssue, addUnsupportedDateIssue } from '~/formValidation/zodCustoms'

import { ContractFormValues, VALUE_REQUIRED_KEY } from './constants'

/** "End date can't be in the past and should be greater than start date" */
export const END_DATE_INVALID_KEY = 'text_64ef55a730b88e3d2117b3d4'

export const requireField = (
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

type ContractDateAndPurchaseOrderFields = Pick<
  ContractFormValues,
  'startedAt' | 'endedAt' | 'initialEndedAt' | 'billingAnchorDate' | 'purchaseOrderNumber'
>

/**
 * Shared by every drawer that carries the contract's start/end/anchor dates and PO
 * number — today the create drawer and the contract-settings edit drawer. Ported from
 * `subscriptionFormSchema`, which is the behaviour the contract dates are specified to
 * match.
 */
export const addContractDateAndPurchaseOrderIssues = (
  ctx: z.RefinementCtx,
  data: ContractDateAndPurchaseOrderFields,
): void => {
  requireDate(ctx, data.startedAt, ['startedAt'])
  // Optional: `Contracts::CreateService`/`UpdateService` anchor billing to
  // `startedAt` when left empty — only validate the format if the user set one.
  addUnsupportedDateIssue(ctx, data.billingAnchorDate, ['billingAnchorDate'])

  addPurchaseOrderNumberMaxLengthIssue(ctx, data.purchaseOrderNumber, ['purchaseOrderNumber'])

  if (!data.endedAt) return
  if (addUnsupportedDateIssue(ctx, data.endedAt, ['endedAt'])) return
  if (data.endedAt === data.initialEndedAt) {
    if (DateTime.fromISO(data.endedAt) <= DateTime.fromISO(data.startedAt)) {
      ctx.addIssue({ code: 'custom', message: END_DATE_INVALID_KEY, path: ['endedAt'] })
    }
    return
  }

  addEndDateAfterStartIssue(ctx, data.startedAt, data.endedAt, ['endedAt'], END_DATE_INVALID_KEY)
}

/**
 * `z.custom` + `superRefine` rather than a `z.object`: the two comboboxes publish
 * `undefined` when cleared, and a field-level `z.string()` would reject that before
 * the required check ever runs — leaving submit disabled with no message.
 */
export const contractSchema = z.custom<ContractFormValues>().superRefine((data, ctx) => {
  requireField(ctx, data.externalCustomerId, ['externalCustomerId'])
  if (data.isPlanRequired) requireField(ctx, data.planCode, ['planCode'])

  addContractDateAndPurchaseOrderIssues(ctx, data)
})
