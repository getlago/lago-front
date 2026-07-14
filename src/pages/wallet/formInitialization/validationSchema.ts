import { DateTime } from 'luxon'
import { z } from 'zod'

import { dateErrorCodes } from '~/core/constants/form'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { topUpAmountError, walletFormErrorCodes } from '~/pages/wallet/form'
import { TWalletDataForm } from '~/pages/wallet/types'

/**
 * Zod re-map of the legacy Yup `walletFormSchema` (src/pages/wallet/form.ts).
 * Semantics are a 1:1 parity port — do not "fix" behaviours here:
 * - `rateAmount` is the ONLY unconditionally-required top-level field.
 * - `paidTopUpMin/Max` is a two-way cross-field check (BOTH fields error).
 * - rule `paidCredits` bounds run against the TOP-LEVEL wallet values
 *   (was fed via Yup validation context) — here we read them from `data`.
 * - rule `startedAt` is ISO-format-only when trigger=Interval (NOT required,
 *   NOT future-checked) — unlike `expirationAt` which is future-checked.
 * - empty-string messages (`''`) mirror the Yup `required('')` /
 *   message-less `createError()` behaviour: the field turns invalid without
 *   rendering an error text (labels are computed separately in the UI).
 *
 * Rule paths are emitted as `['recurringTransactionRules', index, field]`,
 * matching bracket field names (`recurringTransactionRules[0].field`) the
 * same way `zodMetadataSchema` paths match `metadata[${index}].key` fields
 * in the already-migrated MetadataAccordion.
 */

const addExpirationIssue = (
  ctx: z.RefinementCtx,
  value: string | null | undefined,
  path: (string | number)[],
) => {
  // Value can be undefined
  if (!value) return

  // Make sure value has correct format
  if (!DateTime.fromISO(value).isValid) {
    ctx.addIssue({ code: 'custom', message: dateErrorCodes.wrongFormat, path })
    return
  }

  // Make sure the date is in the future
  if (DateTime.now().diff(DateTime.fromISO(value), 'days').days >= 0) {
    ctx.addIssue({ code: 'custom', message: dateErrorCodes.shouldBeInFuture, path })
  }
}

export const walletFormValidationSchema = z.custom<TWalletDataForm>().superRefine((data, ctx) => {
  const {
    currency,
    rateAmount,
    paidCredits,
    paidTopUpMinAmountCents,
    paidTopUpMaxAmountCents,
    ignorePaidTopUpLimitsOnCreation,
    priority,
  } = data

  // rateAmount — the only unconditionally-required top-level field
  if (!rateAmount) {
    ctx.addIssue({ code: 'custom', message: '', path: ['rateAmount'] })
  }

  // expirationAt — valid ISO + in the future
  addExpirationIssue(ctx, data.expirationAt, ['expirationAt'])

  // paidCredits (initial top-up) vs wallet min/max bounds.
  // Values are passed through untouched (null → undefined only), exactly
  // like the Yup test passed `this.parent` values to topUpAmountError.
  if (
    topUpAmountError({
      skip: !!ignorePaidTopUpLimitsOnCreation,
      paidCredits: (paidCredits ?? undefined) as string | undefined,
      rateAmount,
      paidTopUpMinAmountCents: (paidTopUpMinAmountCents ?? undefined) as string | undefined,
      paidTopUpMaxAmountCents: (paidTopUpMaxAmountCents ?? undefined) as string | undefined,
      currency,
    })?.error
  ) {
    ctx.addIssue({ code: 'custom', message: '', path: ['paidCredits'] })
  }

  // paidTopUpMin <= paidTopUpMax — two-way: BOTH fields fail
  if (
    !isNaN(Number(paidTopUpMinAmountCents)) &&
    !isNaN(Number(paidTopUpMaxAmountCents)) &&
    Number(paidTopUpMinAmountCents) > Number(paidTopUpMaxAmountCents)
  ) {
    ctx.addIssue({ code: 'custom', message: '', path: ['paidTopUpMinAmountCents'] })
    ctx.addIssue({ code: 'custom', message: '', path: ['paidTopUpMaxAmountCents'] })
  }

  // priority 1-50 (empty / non-numeric fails, like the Yup number() cast)
  if (priority !== null && priority !== undefined) {
    const priorityNumber = Number(priority)

    if (
      (typeof priority === 'string' && priority === '') ||
      isNaN(priorityNumber) ||
      priorityNumber < 1 ||
      priorityNumber > 50
    ) {
      ctx.addIssue({ code: 'custom', message: '', path: ['priority'] })
    }
  }

  // recurringTransactionRules[] — conditional graph per item
  data.recurringTransactionRules?.forEach((rule, index) => {
    const rulePath = (field: string) => ['recurringTransactionRules', index, field]
    const {
      trigger,
      method,
      interval,
      thresholdCredits,
      targetOngoingBalance,
      startedAt,
      paidCredits: rulePaidCredits,
      grantedCredits: ruleGrantedCredits,
      ignorePaidTopUpLimits,
    } = rule

    // trigger + method are required
    if (!trigger) {
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('trigger') })
    }
    if (!method) {
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('method') })
    }

    // interval — required unless trigger is set to something else than Interval
    if ((!trigger || trigger === RecurringTransactionTriggerEnum.Interval) && !interval) {
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('interval') })
    }

    // thresholdCredits — required unless trigger is set to something else
    // than Threshold + must be < targetOngoingBalance when method=Target
    if (!trigger || trigger === RecurringTransactionTriggerEnum.Threshold) {
      if (
        !!thresholdCredits &&
        method === RecurringTransactionMethodEnum.Target &&
        !!targetOngoingBalance &&
        Number(targetOngoingBalance) < Number(thresholdCredits)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: walletFormErrorCodes.thresholdShouldBeLessThanTargetOngoingBalance,
          path: rulePath('thresholdCredits'),
        })
      } else if (!thresholdCredits) {
        ctx.addIssue({ code: 'custom', message: '', path: rulePath('thresholdCredits') })
      }
    }

    // rule paidCredits — bounds run against the TOP-LEVEL wallet values
    // (min/max/rate/currency), skip flag is the PER-RULE ignorePaidTopUpLimits
    const ruleBoundsError = topUpAmountError({
      skip: !!ignorePaidTopUpLimits,
      paidCredits: (rulePaidCredits ?? undefined) as string | undefined,
      rateAmount,
      paidTopUpMinAmountCents: (paidTopUpMinAmountCents ?? undefined) as string | undefined,
      paidTopUpMaxAmountCents: (paidTopUpMaxAmountCents ?? undefined) as string | undefined,
      currency,
    })?.error

    if (ruleBoundsError) {
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('paidCredits') })
    } else if (
      (!method || method === RecurringTransactionMethodEnum.Fixed) &&
      isNaN(Number(rulePaidCredits)) &&
      isNaN(Number(ruleGrantedCredits))
    ) {
      // method=Fixed → at least one of paidCredits/grantedCredits
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('paidCredits') })
    }

    // grantedCredits — same "at least one" rule for method=Fixed
    if (
      (!method || method === RecurringTransactionMethodEnum.Fixed) &&
      isNaN(Number(ruleGrantedCredits)) &&
      isNaN(Number(rulePaidCredits))
    ) {
      ctx.addIssue({ code: 'custom', message: '', path: rulePath('grantedCredits') })
    }

    // targetOngoingBalance — required when method=Target + must be
    // > thresholdCredits when trigger=Threshold
    if (!method || method === RecurringTransactionMethodEnum.Target) {
      if (!targetOngoingBalance && method === RecurringTransactionMethodEnum.Target) {
        ctx.addIssue({ code: 'custom', message: '', path: rulePath('targetOngoingBalance') })
      } else if (
        !!thresholdCredits &&
        trigger === RecurringTransactionTriggerEnum.Threshold &&
        !!targetOngoingBalance &&
        Number(targetOngoingBalance) < Number(thresholdCredits)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: walletFormErrorCodes.targetOngoingBalanceShouldBeGreaterThanThreshold,
          path: rulePath('targetOngoingBalance'),
        })
      } else if (isNaN(Number(targetOngoingBalance))) {
        ctx.addIssue({ code: 'custom', message: '', path: rulePath('targetOngoingBalance') })
      }
    }

    // startedAt — ISO-format-only when trigger=Interval (NOT required, NOT future-checked)
    if (
      (!trigger || trigger === RecurringTransactionTriggerEnum.Interval) &&
      !!startedAt &&
      !DateTime.fromISO(startedAt).isValid
    ) {
      ctx.addIssue({
        code: 'custom',
        message: dateErrorCodes.wrongFormat,
        path: rulePath('startedAt'),
      })
    }

    // rule expirationAt — valid ISO + in the future (unlike startedAt)
    addExpirationIssue(ctx, rule.expirationAt, rulePath('expirationAt'))

    // transactionMetadata — key unique & <= 20 chars, value <= 100 chars
    if (rule.transactionMetadata?.length) {
      const metadataResult = zodMetadataSchema().safeParse(rule.transactionMetadata)

      if (!metadataResult.success) {
        metadataResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: 'custom',
            message: issue.message,
            path: [...rulePath('transactionMetadata'), ...issue.path],
          })
        })
      }
    }
  })
})
