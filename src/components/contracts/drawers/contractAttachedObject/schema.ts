import { z } from 'zod'

import { requireField } from '~/components/contracts/drawers/contract/schema'

import { ContractAttachedObjectFormValues } from './constants'

/**
 * `z.custom` + `superRefine`: the plan combobox publishes `undefined` when cleared, and
 * a field-level `z.string()` would reject that before the required check ever runs —
 * leaving submit disabled with no message.
 */
export const contractAttachedObjectSchema = z
  .custom<ContractAttachedObjectFormValues>()
  .superRefine((data, ctx) => {
    if (data.isPlanRequired) requireField(ctx, data.planCode, ['planCode'])
  })
