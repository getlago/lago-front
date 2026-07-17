import { z } from 'zod'

import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { CurrencyEnum } from '~/generated/graphql'
import { topUpAmountError } from '~/pages/wallet/form'
import { TWalletTopUpDataForm } from '~/pages/wallet/topUp/types'

/**
 * 1:1 parity port of the Yup schema from CreateWalletTopUp.tsx — do NOT
 * tighten rules here. All credit errors are invisible by design (the fields
 * render with silentError; the visible bounds label is computed at component
 * level via topUpAmountError WITH translate) — they only gate submission.
 * priority/name/invoiceRequiresSuccessfulPayment are deliberately unvalidated.
 */

// Ports Yup's message-less test failures (Zod v4 renders an empty message as
// "Invalid input"). Exported so tests don't hardcode keys.
export const topUpFormErrorLabels = {
  required: 'text_1771342994699klxu2paz7g8',
} as const

// The bounds check depends on the TARGET WALLET (not on form values), so the
// schema is a factory: rebuild it when the wallet resolves.
export type TopUpValidationContext = {
  rateAmount: string | undefined
  paidTopUpMinAmountCents: string | undefined
  paidTopUpMaxAmountCents: string | undefined
  currency: CurrencyEnum | undefined
}

// Formik validated prepareDataForValidation(values), which converts '' to
// undefined — so '' must count as absent wherever presence is checked.
const prepared = <T>(value: T): T | undefined =>
  value === ('' as unknown as T) ? undefined : value

export const getTopUpFormValidationSchema = ({
  rateAmount,
  paidTopUpMinAmountCents,
  paidTopUpMaxAmountCents,
  currency,
}: TopUpValidationContext) =>
  z.custom<TWalletTopUpDataForm>().superRefine((data, ctx) => {
    // superRefine must NEVER throw: an exception inside the validation phase
    // leaves the form stuck in isSubmitting forever.
    if (!data || typeof data !== 'object') {
      ctx.addIssue({ code: 'custom', message: topUpFormErrorLabels.required, path: [] })
      return
    }

    const preparedPaidCredits = prepared(data.paidCredits as string | undefined)
    const preparedGrantedCredits = prepared(data.grantedCredits as string | undefined)
    // at least one of the two credit amounts must be a number ('' is absent)
    const missingBothCredits =
      isNaN(Number(preparedPaidCredits)) && isNaN(Number(preparedGrantedCredits))

    const boundsError = topUpAmountError({
      skip: !!data.ignorePaidTopUpLimits,
      paidCredits: preparedPaidCredits === undefined ? undefined : String(preparedPaidCredits),
      rateAmount,
      paidTopUpMinAmountCents,
      paidTopUpMaxAmountCents,
      currency,
    })

    if (boundsError?.error) {
      // invisible marker — the visible label is computed at component level
      ctx.addIssue({ code: 'custom', message: boundsError.error, path: ['paidCredits'] })
    } else if (missingBothCredits) {
      ctx.addIssue({
        code: 'custom',
        message: topUpFormErrorLabels.required,
        path: ['paidCredits'],
      })
    }

    if (missingBothCredits) {
      ctx.addIssue({
        code: 'custom',
        message: topUpFormErrorLabels.required,
        path: ['grantedCredits'],
      })
    }

    if (Array.isArray(data.metadata) && data.metadata.length) {
      const metadataResult = zodMetadataSchema().safeParse(data.metadata)

      if (!metadataResult.success) {
        metadataResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: ['metadata', ...issue.path],
          })
        })
      }
    } else if (
      data.metadata !== null &&
      data.metadata !== undefined &&
      !Array.isArray(data.metadata)
    ) {
      // malformed shape: issue instead of throwing (Yup emitted a typeError)
      ctx.addIssue({ code: 'custom', message: topUpFormErrorLabels.required, path: ['metadata'] })
    }
  })
