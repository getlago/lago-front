import { z } from 'zod'

import { serializeAmount } from '~/core/serializers/serializeAmount'
import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'
import { CreatePaymentInput, CurrencyEnum } from '~/generated/graphql'

// Ports the message-less yup failures (`required('')`): every one of them is hidden at
// component level, and Zod v4 renders an empty message as a raw "Invalid input".
const HIDDEN_ERROR_MESSAGE = 'text_1771342994699klxu2paz7g8'

const REFERENCE_MAX_LENGTH = 40

const createPaymentFormShape = z.object({
  invoiceId: z.string().optional(),
  amountCents: z.union([z.string(), z.number()]).optional(),
  reference: z.string(),
  createdAt: z.string().optional(),
})

export type CreatePaymentFormValues = z.infer<typeof createPaymentFormShape>

export const createPaymentDefaultValues = (
  invoiceId: string,
  createdAt: string,
): CreatePaymentFormValues => ({
  invoiceId,
  amountCents: '',
  reference: '',
  createdAt,
})

// Formik validated prepareDataForValidation(values), which turns every '' into undefined,
// so '' counts as absent wherever presence or a numeric cast is checked.
const prepared = (value: string | number | undefined): string | number | undefined =>
  value === '' ? undefined : value

const addHiddenIssue = (ctx: z.RefinementCtx, path: (string | number)[]): void => {
  ctx.addIssue({ code: 'custom', message: HIDDEN_ERROR_MESSAGE, path })
}

/**
 * `maxAmount` is the invoice's deserialized total due, which lives on the async-loaded
 * invoice instead of in form state, so the schema is rebuilt whenever it moves.
 */
export const buildCreatePaymentValidationSchema = (maxAmount: number) =>
  createPaymentFormShape.superRefine((data, ctx) => {
    if (!data.invoiceId) {
      addHiddenIssue(ctx, ['invoiceId'])
    }

    const amountCents = prepared(data.amountCents)
    const amount = Number(amountCents)

    if (amountCents === undefined || !(amount > 0 && amount <= maxAmount)) {
      addHiddenIssue(ctx, ['amountCents'])
    }

    if (!data.reference || data.reference.length > REFERENCE_MAX_LENGTH) {
      addHiddenIssue(ctx, ['reference'])
    }

    if (!data.createdAt) {
      addHiddenIssue(ctx, ['createdAt'])
      return
    }

    addUnsupportedDateIssue(ctx, data.createdAt, ['createdAt'])
  })

export const buildCreatePaymentInput = (
  values: CreatePaymentFormValues,
  currency: CurrencyEnum,
): CreatePaymentInput => ({
  invoiceId: values.invoiceId ?? '',
  reference: values.reference,
  createdAt: values.createdAt,
  amountCents: serializeAmount(values.amountCents ?? '', currency),
})
