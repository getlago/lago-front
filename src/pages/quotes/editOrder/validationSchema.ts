import { z } from 'zod'

import { OrderExecutionModeEnum, UpdateOrderInput } from '~/generated/graphql'
import { addExecuteAtIssue } from '~/pages/quotes/common/addExecuteAtIssue'

export const editOrderValidationSchema = z
  .object({
    executionMode: z.nativeEnum(OrderExecutionModeEnum).optional(),
    executeAt: z.string().optional(),
  })
  .refine((data) => !!data.executionMode, {
    message: 'text_17816865941254uzl22ixohk',
    path: ['executionMode'],
  })
  .superRefine((data, ctx) => {
    addExecuteAtIssue(ctx, data.executeAt)
  })

export type EditOrderFormValues = z.infer<typeof editOrderValidationSchema>

export const buildUpdateOrderInput = (
  orderId: string,
  values: EditOrderFormValues,
): UpdateOrderInput => ({
  id: orderId,
  executionMode: values.executionMode,
  executeAt: values.executeAt ?? null,
})
