import { DateTime } from 'luxon'
import { z } from 'zod'

import {
  EventPayload,
  isValidJSON,
  wrappedParseExpression,
} from '~/components/billableMetrics/utils'

export const customExpressionValidationSchema = z.object({
  expression: z.string().refine((value) => wrappedParseExpression(value)),
  eventPayload: z.custom<EventPayload | string>().refine((value) => isValidJSON(value)),
})

export type CustomExpressionFormValues = z.infer<typeof customExpressionValidationSchema>

export const buildCustomExpressionDefaultValues = (
  billableMetricCode?: string | null,
): CustomExpressionFormValues => ({
  expression: '',
  eventPayload: {
    event: {
      transaction_id: 'trx_id_123456789',
      external_subscription_id: 'sub_id_123456789',
      code: billableMetricCode || '__BILLABLE_METRIC_CODE__',
      timestamp: DateTime.now().toMillis(),
      properties: {
        property_name: '__YOUR__VALUE__',
      },
    },
  },
})

export const CUSTOM_EXPRESSION_DEFAULT_VALUES: CustomExpressionFormValues =
  buildCustomExpressionDefaultValues()
