import { DateTime } from 'luxon'
import { z } from 'zod'

import { addPurchaseOrderNumberMaxLengthIssue } from '~/components/purchaseOrder/validation'
import { dateErrorCodes } from '~/core/constants/form'
import { zodMetadataSchema } from '~/formValidation/metadataSchema'
import { addUnsupportedDateIssue } from '~/formValidation/zodCustoms'
import {
  RecurringTransactionMethodEnum,
  RecurringTransactionTriggerEnum,
} from '~/generated/graphql'
import { topUpAmountError, walletFormErrorCodes } from '~/pages/wallet/form'
import { TWalletDataForm, TWalletRecurringRule } from '~/pages/wallet/types'

/**
 * Zod re-map of the legacy Yup `walletFormSchema` (removed — see git history
 * of src/pages/wallet/form.ts). Semantics are a 1:1 parity port — do not
 * "fix" behaviours here:
 * - `rateAmount` is the ONLY unconditionally-required top-level field.
 * - `paidTopUpMin/Max` is a two-way cross-field check (BOTH fields error).
 * - rule `paidCredits` bounds run against the TOP-LEVEL wallet values
 *   (was fed via Yup validation context) — here we read them from `data`.
 * - rule `startedAt` is ISO-format-only when trigger=Interval (NOT required,
 *   NOT future-checked) — unlike `expirationAt` which is future-checked.
 * - empty-string messages (`''`) mark the Yup `required('')` /
 *   message-less `createError()` intent: the field turns invalid, the label is
 *   computed separately in the UI. zod v4 replaces `''` with its own
 *   "Invalid input" default, so a field left to render the schema message shows
 *   that raw string — `''` is only safe where the consuming input never renders
 *   it. Audited per remaining `''` path:
 *   - `paidTopUpMin/MaxAmountCents` — SettingsSection passes a translated
 *     bounds label as `errorOverride`, which wins over the field error.
 *   - rule `paidCredits` BOUNDS — RecurringRuleDrawer computes that label
 *     itself (needs translate() + currency formatting) and feeds it the
 *     same way.
 *   - top-level `paidCredits` — unreachable in the wallet form: no input
 *     renders it (the initial top-up lives in its own flow), the value stays
 *     `''` from mapFromApiToForm and `topUpAmountError` bails on `''`.
 *   Every other path carries a real translation key — including two that were
 *   message-less by copy-paste rather than by Yup parity: `code` (added after
 *   this migration, so it never had a `required('')` to mirror) and the rule
 *   "at least one of paid/granted credits". Neither input supplies an
 *   `errorOverride`, so both rendered the raw "Invalid input"; the credits one
 *   had also blocked the submit with nothing rendered under either input.
 *
 * Rule paths are emitted as `['recurringTransactionRules', index, field]`,
 * matching bracket field names (`recurringTransactionRules[0].field`) the
 * same way `zodMetadataSchema` paths match `metadata[${index}].key` fields
 * in the already-migrated MetadataAccordion.
 */

export const WALLET_PRIORITY_MIN = 1
export const WALLET_PRIORITY_MAX = 50

/**
 * Formik ran Yup on `prepareDataForValidation(values)`, which recursively
 * converts every empty string to `undefined`. The checks below that depend on
 * that behaviour emulate it explicitly ('' → undefined → NaN).
 */
const prepared = <T>(value: T): T | undefined =>
  value === ('' as unknown as T) ? undefined : value

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

/** Wallet-level values the rule checks depend on (bounds fed as context). */
export interface RecurringRuleBoundsCtx {
  rateAmount: TWalletDataForm['rateAmount']
  paidTopUpMinAmountCents?: TWalletDataForm['paidTopUpMinAmountCents']
  paidTopUpMaxAmountCents?: TWalletDataForm['paidTopUpMaxAmountCents']
  currency?: TWalletDataForm['currency']
}

/**
 * Args every per-field rule check needs. `rulePath` is what makes the checks
 * reusable across the two surfaces: the wallet form maps a field to
 * ['recurringTransactionRules', index, field], the drawer to [field].
 */
interface RuleIssueArgs {
  rule: TWalletRecurringRule
  ctx: z.RefinementCtx
  rulePath: (field: string) => (string | number)[]
}

const REQUIRED_MESSAGE = 'text_1771342994699klxu2paz7g8'
/** "at least one of paid/granted credits" — see the `''` note in the header. */
const AT_LEAST_ONE_AMOUNT_MESSAGE = 'text_178515906443966dwzkfejqu'

/** trigger + method are required. */
const addTriggerAndMethodIssues = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  if (!rule.trigger) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: rulePath('trigger') })
  }

  if (!rule.method) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: rulePath('method') })
  }
}

/** interval — required unless trigger is set to something else than Interval. */
const addIntervalIssue = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  const { trigger, interval } = rule

  if ((!trigger || trigger === RecurringTransactionTriggerEnum.Interval) && !interval) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: rulePath('interval') })
  }
}

/**
 * thresholdCredits — required unless trigger is set to something else than
 * Threshold + must be < targetOngoingBalance when method=Target.
 */
const addThresholdCreditsIssue = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  const { trigger, method, thresholdCredits, targetOngoingBalance } = rule

  if (!!trigger && trigger !== RecurringTransactionTriggerEnum.Threshold) return

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

    return
  }

  if (!thresholdCredits) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: rulePath('thresholdCredits') })
  }
}

/** paidCredits / grantedCredits — wallet bounds + the "at least one" rule. */
const addCreditsIssues = ({
  rule,
  ctx,
  rulePath,
  bounds,
}: RuleIssueArgs & { bounds: RecurringRuleBoundsCtx }): void => {
  const {
    method,
    paidCredits: rulePaidCredits,
    grantedCredits: ruleGrantedCredits,
    ignorePaidTopUpLimits,
  } = rule

  // Bounds run against the WALLET-LEVEL values (min/max/rate/currency), the
  // skip flag is the PER-RULE ignorePaidTopUpLimits
  const ruleBoundsError = topUpAmountError({
    skip: !!ignorePaidTopUpLimits,
    paidCredits: (rulePaidCredits ?? undefined) as string | undefined,
    rateAmount: bounds.rateAmount,
    paidTopUpMinAmountCents: (prepared(bounds.paidTopUpMinAmountCents) ?? undefined) as
      string | undefined,
    paidTopUpMaxAmountCents: (prepared(bounds.paidTopUpMaxAmountCents) ?? undefined) as
      string | undefined,
    currency: bounds.currency,
  })?.error

  // method=Fixed → at least one of paidCredits/grantedCredits must be set.
  // Empty strings count as MISSING (old runtime: '' → undefined → NaN),
  // which is what blocked the submit with both credits left empty.
  const missingBothCredits =
    (!method || method === RecurringTransactionMethodEnum.Fixed) &&
    Number.isNaN(Number(prepared(rulePaidCredits))) &&
    Number.isNaN(Number(prepared(ruleGrantedCredits)))

  // Bounds keep the message-less parity: the human-readable label needs
  // translate() + currency formatting, so the drawer computes it itself and
  // feeds it as `errorOverride` (which wins over the field error).
  if (ruleBoundsError) {
    ctx.addIssue({ code: 'custom', message: '', path: rulePath('paidCredits') })
  } else if (missingBothCredits) {
    // Deliberate divergence from the Yup parity: with a message-less issue the
    // submit was blocked with nothing rendered under either input, and no
    // `errorOverride` covers this case (topUpAmountError bails on empty credits).
    ctx.addIssue({
      code: 'custom',
      message: AT_LEAST_ONE_AMOUNT_MESSAGE,
      path: rulePath('paidCredits'),
    })
  }

  // grantedCredits — same "at least one" rule for method=Fixed
  if (missingBothCredits) {
    ctx.addIssue({
      code: 'custom',
      message: AT_LEAST_ONE_AMOUNT_MESSAGE,
      path: rulePath('grantedCredits'),
    })
  }
}

/**
 * targetOngoingBalance — required when method=Target + must be
 * > thresholdCredits when trigger=Threshold.
 */
const addTargetOngoingBalanceIssue = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  const { trigger, method, thresholdCredits, targetOngoingBalance } = rule
  const path = rulePath('targetOngoingBalance')

  if (!!method && method !== RecurringTransactionMethodEnum.Target) return

  if (!targetOngoingBalance && method === RecurringTransactionMethodEnum.Target) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path })

    return
  }

  if (
    !!thresholdCredits &&
    trigger === RecurringTransactionTriggerEnum.Threshold &&
    !!targetOngoingBalance &&
    Number(targetOngoingBalance) < Number(thresholdCredits)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: walletFormErrorCodes.targetOngoingBalanceShouldBeGreaterThanThreshold,
      path,
    })

    return
  }

  if (Number.isNaN(Number(targetOngoingBalance))) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path })
  }
}

/** startedAt — ISO-format-only when trigger=Interval (NOT required, NOT future-checked). */
const addStartedAtIssue = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  const { trigger, startedAt } = rule

  if (trigger && trigger !== RecurringTransactionTriggerEnum.Interval) return

  if (!!startedAt && !DateTime.fromISO(startedAt).isValid) {
    ctx.addIssue({
      code: 'custom',
      message: dateErrorCodes.wrongFormat,
      path: rulePath('startedAt'),
    })

    return
  }

  // Unlike expirationAt below, startedAt has no future rule to reject a pre-1970 date.
  addUnsupportedDateIssue(ctx, startedAt, rulePath('startedAt'))
}

/** transactionMetadata — key unique & <= 20 chars, value <= 100 chars. */
const addTransactionMetadataIssues = ({ rule, ctx, rulePath }: RuleIssueArgs): void => {
  if (!rule.transactionMetadata?.length) return

  const metadataResult = zodMetadataSchema().safeParse(rule.transactionMetadata)

  if (metadataResult.success) return

  metadataResult.error.issues.forEach((issue) => {
    ctx.addIssue({
      code: 'custom',
      message: issue.message,
      path: [...rulePath('transactionMetadata'), ...issue.path],
    })
  })
}

/**
 * Shared rule checks: the wallet form's superRefine runs them per array item
 * (paths under recurringTransactionRules[index]) while the rule drawer's own
 * schema runs them on its flat rule form (paths at the root). Single source
 * so both surfaces can never drift.
 */
const addRecurringRuleIssues = (
  rule: TWalletRecurringRule,
  bounds: RecurringRuleBoundsCtx,
  ctx: z.RefinementCtx,
  rulePath: (field: string) => (string | number)[],
): void => {
  // Same invariant as the Array.isArray guard below: superRefine must NEVER
  // throw. Both entry points reach the helpers through a z.custom(), which
  // accepts any value — the drawer schema unguarded, and the wallet schema with
  // a container check that says nothing about the elements. A non-object here
  // (null element, malformed mapper output) would crash the validator and leave
  // the form stuck in isSubmitting, so bail instead: the per-field `required`
  // issues the helpers emit cannot describe a rule that isn't a rule.
  if (typeof rule !== 'object' || rule === null) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: rulePath('method') })

    return
  }

  const args: RuleIssueArgs = { rule, ctx, rulePath }

  addTriggerAndMethodIssues(args)
  addIntervalIssue(args)
  addThresholdCreditsIssue(args)
  addCreditsIssues({ ...args, bounds })
  addTargetOngoingBalanceIssue(args)
  addStartedAtIssue(args)
  // expirationAt — valid ISO + in the future (unlike startedAt)
  addExpirationIssue(ctx, rule.expirationAt, rulePath('expirationAt'))
  addPurchaseOrderNumberMaxLengthIssue(
    ctx,
    rule.purchaseOrderNumber,
    rulePath('purchaseOrderNumber'),
  )
  addTransactionMetadataIssues(args)
}

/**
 * Standalone schema for the recurring-rule drawer form (flat rule paths).
 *
 * The caller rebuilds this schema on every render, so `bounds` tracks the LIVE
 * wallet values — it is not a snapshot. The drawer body, by contrast, is a React
 * element built once when the drawer opens, so it renders the wallet values as
 * they were at that moment. The two agree as long as the wallet form does not
 * re-seed mid-session (it can: TanStack re-seeds on deep-unequal defaultValues
 * while the form is untouched). If they ever disagree, this schema can flag a
 * bounds error the drawer has no label for.
 */
export const recurringRuleValidationSchema = (bounds: RecurringRuleBoundsCtx) =>
  z
    .custom<TWalletRecurringRule>()
    .superRefine((rule, ctx) => addRecurringRuleIssues(rule, bounds, ctx, (field) => [field]))

export const walletFormValidationSchema = z.custom<TWalletDataForm>().superRefine((data, ctx) => {
  const {
    currency,
    code,
    rateAmount,
    paidCredits,
    paidTopUpMinAmountCents,
    paidTopUpMaxAmountCents,
    ignorePaidTopUpLimitsOnCreation,
    priority,
  } = data

  // rateAmount — unconditionally-required top-level field
  if (!rateAmount) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: ['rateAmount'] })
  }

  // code — required: it reaches the API through the mappers' `...values` rest
  // spread, so a blank one would be stored as is rather than omitted.
  // NOT a Yup parity case despite what the neighbours below look like — this
  // field was added after the zod migration, so it never had a `required('')`
  // to mirror. It shipped message-less by copy-paste, and since
  // NameAndCodeGroup renders it as a plain TextInputField with no
  // `errorOverride`, that surfaced zod's raw "Invalid input" under the input.
  // Same "Field is required" key as rateAmount.
  if (!code) {
    ctx.addIssue({ code: 'custom', message: REQUIRED_MESSAGE, path: ['code'] })
  }

  // expirationAt — valid ISO + in the future
  addExpirationIssue(ctx, data.expirationAt, ['expirationAt'])

  addPurchaseOrderNumberMaxLengthIssue(ctx, data.purchaseOrderNumber, ['purchaseOrderNumber'])

  // paidCredits (initial top-up) vs wallet min/max bounds.
  // Values are passed through untouched (null → undefined only), exactly
  // like the Yup test passed `this.parent` values to topUpAmountError.
  // The message-less issue is safe here because it is unreachable: the wallet
  // form has no paidCredits input (initial top-up is its own flow), so the
  // value stays `''` and topUpAmountError returns early on `''`. Kept for
  // parity — add a real message if an input for it ever comes back.
  if (
    topUpAmountError({
      skip: !!ignorePaidTopUpLimitsOnCreation,
      paidCredits: (paidCredits ?? undefined) as string | undefined,
      rateAmount,
      // emptied bounds ('') count as absent (old runtime: '' → undefined),
      // otherwise Number('') = 0 turns any amount into a false "above-max"
      paidTopUpMinAmountCents: (prepared(paidTopUpMinAmountCents) ?? undefined) as
        string | undefined,
      paidTopUpMaxAmountCents: (prepared(paidTopUpMaxAmountCents) ?? undefined) as
        string | undefined,
      currency,
    })?.error
  ) {
    ctx.addIssue({ code: 'custom', message: '', path: ['paidCredits'] })
  }

  // paidTopUpMin <= paidTopUpMax — two-way: BOTH fields fail.
  // An emptied side ('') skips the check (old runtime: '' → undefined → NaN).
  // Message-less on purpose: SettingsSection renders both inputs with
  // `errorOverride={hasError ? input.errorLabel : false}`, so the translated
  // per-side label wins and zod's "Invalid input" default never shows.
  if (
    !Number.isNaN(Number(prepared(paidTopUpMinAmountCents))) &&
    !Number.isNaN(Number(prepared(paidTopUpMaxAmountCents))) &&
    Number(paidTopUpMinAmountCents) > Number(paidTopUpMaxAmountCents)
  ) {
    ctx.addIssue({ code: 'custom', message: '', path: ['paidTopUpMinAmountCents'] })
    ctx.addIssue({ code: 'custom', message: '', path: ['paidTopUpMaxAmountCents'] })
  }

  // priority 1-50 — an emptied field ('') counted as absent in the old
  // Formik runtime (prepareDataForValidation) and falls back to the default
  const preparedPriority = prepared(priority)

  if (preparedPriority !== null && preparedPriority !== undefined) {
    const priorityNumber = Number(preparedPriority)

    if (
      Number.isNaN(priorityNumber) ||
      priorityNumber < WALLET_PRIORITY_MIN ||
      priorityNumber > WALLET_PRIORITY_MAX
    ) {
      ctx.addIssue({ code: 'custom', message: 'text_1784022064201xi14v3sglp1', path: ['priority'] })
    }
  }

  // recurringTransactionRules[] — conditional graph per item.
  // Guard with Array.isArray: superRefine must NEVER throw (a throwing
  // validator leaves the form stuck in isSubmitting), and a malformed value
  // (e.g. a {0: rule} object from an index-set on an undefined base) would
  // crash .forEach.
  const rules = Array.isArray(data.recurringTransactionRules) ? data.recurringTransactionRules : []

  rules.forEach((rule, index) =>
    addRecurringRuleIssues(
      rule,
      { rateAmount, paidTopUpMinAmountCents, paidTopUpMaxAmountCents, currency },
      ctx,
      (field) => ['recurringTransactionRules', index, field],
    ),
  )
})
