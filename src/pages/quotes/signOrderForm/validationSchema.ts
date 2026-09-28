import { DateTime } from 'luxon'
import { z } from 'zod'

import { addUnparseableDateIssue } from '~/formValidation/zodCustoms'
import { MarkOrderFormAsSignedInput, OrderExecutionModeEnum } from '~/generated/graphql'

export const signOrderFormValidationSchema = z
  .object({
    executionMode: z.nativeEnum(OrderExecutionModeEnum).optional(),
    executeAt: z.string().optional(),
    signedDocument: z.string().optional(),
  })
  .refine((data) => !!data.executionMode, {
    message: 'text_17816865941254uzl22ixohk',
    path: ['executionMode'],
  })
  // Execution must be scheduled for a future day — today and past are rejected by the backend
  .refine(
    (data) => {
      if (!data.executeAt) return true

      const executeAt = DateTime.fromISO(data.executeAt)

      return !executeAt.isValid || executeAt.startOf('day') > DateTime.now().startOf('day')
    },
    {
      message: 'text_1781698831945d8qod1ugqsu',
      path: ['executeAt'],
    },
  )
  .superRefine((data, ctx) => {
    addUnparseableDateIssue(ctx, data.executeAt, ['executeAt'])
  })

export type SignOrderFormValues = z.infer<typeof signOrderFormValidationSchema>

export const signOrderFormDefaultValues: SignOrderFormValues = {
  executionMode: undefined,
  executeAt: undefined,
  signedDocument: undefined,
}

export const buildSignOrderFormInput = (
  orderFormId: string,
  values: SignOrderFormValues,
): MarkOrderFormAsSignedInput => ({
  id: orderFormId,
  executionMode: values.executionMode,
  executeAt: values.executeAt,
  signedDocument: values.signedDocument || undefined,
})
