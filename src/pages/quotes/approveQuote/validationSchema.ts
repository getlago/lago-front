import { DateTime } from 'luxon'
import { z } from 'zod'

import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'
import { ApproveQuoteVersionInput } from '~/generated/graphql'

export const approveQuoteValidationSchema = z
  .object({
    expiresAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    addUnsupportedDateIssue(ctx, data.expiresAt, ['expiresAt'])
  })

export type ApproveQuoteFormValues = z.infer<typeof approveQuoteValidationSchema>

export const approveQuoteDefaultValues: ApproveQuoteFormValues = {
  expiresAt: undefined,
}

export const buildApproveQuoteVersionInput = (
  versionId: string,
  values: ApproveQuoteFormValues,
): ApproveQuoteVersionInput => ({
  id: versionId,
  expiresAt: values.expiresAt
    ? (DateTime.fromISO(values.expiresAt, { zone: 'utc' }).endOf('day').toISO() ?? undefined)
    : undefined,
})
