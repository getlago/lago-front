import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

import { extractGraphQLErrors } from './mapBillingItemErrors'

export interface QuoteMutationError {
  /** Already-translated, user-facing sentence. */
  message: string
  /** Form field path, set only for field-targeted errors. */
  field?: string
  /**
   * Untranslated key behind `message`, set alongside `field`. Form fields translate the error
   * they are given (`TextInput` runs it through `translate`, `DatePickerField` asks
   * `useFieldError` for `translateErrors`), so an inline error has to be handed the key —
   * feeding it a translated sentence only works through the missing-key fallback and logs a
   * warning per render.
   */
  messageKey?: string
}

/**
 * Codes the quote pages handle themselves — passed as `context.silentErrorCodes` so the
 * global Apollo error link skips its generic toast and its Sentry report.
 * `forbidden` needs no entry: the link already force-silences it.
 */
export const QUOTE_MUTATION_SILENT_ERROR_CODES = [
  LagoApiError.UnprocessableEntity,
  LagoApiError.NotFound,
  LagoApiError.FeatureUnavailable,
]

/**
 * Codes this module produces a message for — the silenced ones plus `forbidden`, which the
 * error link force-silences. Anything else stays with the global link, which both toasts the
 * generic copy and reports to Sentry; toasting locally too would show the same copy twice
 * (`addToast` only dedupes `message` against `message` and `translateKey` against
 * `translateKey`, and the link toasts by key).
 */
const LOCALLY_HANDLED_ERROR_CODES: unknown[] = [
  ...QUOTE_MUTATION_SILENT_ERROR_CODES,
  LagoApiError.Forbidden,
]

/** Reused app-wide "an error occurred" copy, shown when nothing more precise is known. */
const GENERIC_ERROR_KEY = 'text_622f7a3dc32ce100c46a5154'

const PERMISSION_ERROR_KEY = 'text_17865407897429mqm1fco12j'
const FEATURE_UNAVAILABLE_ERROR_KEY = 'text_1786540789742kokuwxcy86s'

/** `{{prefix}}: {{detail}}` — used to compose a billing item error sentence. */
const COMPOSED_MESSAGE_KEY = 'text_1786540789743pr2fbjucq45'

/**
 * Errors the API reports on the quote version itself, keyed by
 * `${detailKey}.${errorCode}`. Both `single_validation_failure!` and multi-key
 * `validation_failure!` arrive as `unprocessable_entity`, so the code alone is
 * never a discriminator — the detail key is.
 */
export const TOP_LEVEL_ERROR_KEYS: Record<string, string> = {
  'status.not_approvable': 'text_1786540789742thnfvmjlq8a',
  'status.not_voidable': 'text_1786540789742nso5acvqa28',
  'expiresAt.invalid_date': 'text_1786540789742b4ym3200cp6',
  'currency.value_is_mandatory': 'text_17865407897425abgh9dnl45',
  'currency.invalid_currency': 'text_1786540789742i50p3wlht3g',
  'currency.not_supported_for_order_type': 'text_1787216718467e8ca9iw2atm',
  'quoteVersion.not_found': 'text_178654078974209u9bigc6ta',
  'quoteVersion.not_approved': 'text_1786540789742edgippmh4fh',
  'quoteVersionId.value_already_exist': 'text_1786540789742km6ifr1uf63',
  'voidReason.invalid': 'text_1786540789742xzmnw0kbnw2',
  'expiresAt.after_deal_expiration': 'text_17871360906940d0lnf13g0l',
  'status.not_editable': 'text_17871360906941z44i8yw0ac',
  'status.not_clonable': 'text_1787136090694y83z6vb527o',
  'status.active_version_exists': 'text_1787136090694dk5q95wet17',
  'owners.invalid': 'text_17871360906948prsrsrwge1',
  'image.invalid_format': 'text_1787136090694ingmztiheet',
  'image.file_too_large': 'text_1787136090694qc666iqsdq4',
  'subscriptionId.value_is_mandatory': 'text_17871360906949qpqk5in7j2',
  'subscriptionId.subscription_not_active': 'text_1787136090694uz5da4yhddr',
  'billingEntityId.billing_entity_not_found': 'text_1787136090694cr8wvbhalzc',
  'billingEntityId.not_supported_for_order_type': 'text_1787136090694e0p67xtiaqu',
  'base.concurrency_conflict': 'text_17871360906941p1bvt8npaw',
}

/**
 * Order-form failures, keyed the same way. Consulted before `TOP_LEVEL_ERROR_KEYS` when the
 * caller passes the `orderForm` scope, because `status.not_voidable` is reported on both
 * entities and the copy has to name the right one.
 */
export const ORDER_FORM_ERROR_KEYS: Record<string, string> = {
  'orderForm.not_found': 'text_1786610894641duk7n532hdi',
  'status.not_signable': 'text_1786610894641lt5jhzuiulg',
  'status.not_voidable': 'text_1786610894641usymql0rk8r',
  'executionMode.value_is_mandatory': 'text_17866108946411ovi8xqry3n',
  'executionMode.value_is_invalid': 'text_1786610894641m8ffsiodyjw',
  'executeAt.invalid_date': 'text_1786610894641sjyf79n6nny',
  'executeAt.after_deal_expiration': 'text_17871360906947inroyu1jq2',
  'signedDocument.invalid_format': 'text_1786610894641nv1aitlslgu',
  'orderFormId.value_already_exist': 'text_17866108946418951e8uxdcl',
  'base.concurrency_conflict': 'text_17871360906947rld1stpjr6',
}

/**
 * Order execution failures, keyed the same way. `executeOrder` reports on the order itself and on
 * every catalog entity its billing snapshot points at, so a quoted plan/coupon/add-on that has
 * since disappeared surfaces here as a top-level `<resource>.not_found` — unlike the billing-item
 * keys below, which the approve mutation reports positionally.
 */
export const ORDER_ERROR_KEYS: Record<string, string> = {
  'order.not_found': 'text_1786630268015utxlmxzyv6k',
  'orderType.unsupported_order_type': 'text_17866302680156sw8ubyaf72',
  'executionMode.value_is_mandatory': 'text_1786630268015x89z5erp5gc',
  'base.concurrency_conflict': 'text_178663026801526jdrqexzy1',
  'status.not_editable': 'text_1787136090695el9p68o6bbz',
  'executeAt.invalid_date': 'text_1787137341763zuw842lkske',
  'executeAt.after_deal_expiration': 'text_1787137341763nutdwcniihz',
  'subscription.subscription_not_active': 'text_1787136090695a0gmnr8nxim',
  'billingItems.plans.single_plan_expected': 'text_1787136090695y7j822vqoa1',
  'plan.not_found': 'text_1786630268016ukk6fi5u778',
  'coupon.not_found': 'text_1786630268016171ivs0g1kv',
  'addOn.not_found': 'text_1786630268016o1hi9xo2obe',
  'charge.not_found': 'text_1786630268016h9odzv5jjs5',
  'fixedCharge.not_found': 'text_1786630268016t366gcvcago',
  'billableMetric.not_found': 'text_1786630268016qtainhwsys3',
  'chargeModel.charge_model_changed': 'text_1786630268016w264kj4y86j',
  'fixedChargeModel.fixed_charge_model_changed': 'text_1786630268016meyak1nxn9g',
  'customer.not_found': 'text_1786630268016i9hcrwrzkcc',
  'fees.not_found': 'text_1786630268016vpwqdibatsd',
}

/**
 * Which entity the failing mutation targets. `status.not_voidable` and
 * `executionMode.value_is_mandatory` are each reported on two entities, so the scope is what keeps
 * the key sets from silently borrowing each other's copy.
 */
export type QuoteMutationErrorScope = 'quote' | 'orderForm' | 'order'

/**
 * Scope-specific overrides, consulted before `TOP_LEVEL_ERROR_KEYS`. `quote` has no entry: it is
 * the base scope, so it reads `TOP_LEVEL_ERROR_KEYS` directly.
 */
const SCOPED_ERROR_KEYS: Partial<Record<QuoteMutationErrorScope, Record<string, string>>> = {
  orderForm: ORDER_FORM_ERROR_KEYS,
  order: ORDER_ERROR_KEYS,
}

/** Detail keys that map onto a form field, so the error can also be shown inline. */
const FORM_FIELD_BY_DETAIL_KEY: Record<string, string> = {
  expiresAt: 'expiresAt',
  executionMode: 'executionMode',
  executeAt: 'executeAt',
}

/** `billingItems.<entity>` prefixes, interpolated with the 1-based item position. */
const BILLING_ITEM_PREFIX_KEYS: Record<string, string> = {
  plans: 'text_1786540789742q2ym1u6mrwh',
  coupons: 'text_1786540789742ofilmd17tfv',
  addOns: 'text_1786540789742gcenndpbfyl',
  walletCredits: 'text_1786540789742h8g4ew7dzaf',
}

/** Wallet credit prefix variant carrying the nested recurring rule position. */
const RECURRING_RULE_PREFIX_KEY = 'text_1786540789743koa76e679es'

const RECURRING_RULES_SEGMENT = 'recurringTransactionRules'

/**
 * Billing item details, keyed by `${field}.${errorCode}` — only the pairs where
 * naming the field says more than the code alone. Anything else falls back to
 * `BILLING_ITEM_CODE_KEYS`.
 */
export const BILLING_ITEM_FIELD_ERROR_KEYS: Record<string, string> = {
  'startDate.value_is_mandatory': 'text_1787146745141l1kczsx39v9',
  'startDate.invalid_date': 'text_1787146745141j3ktrzyti2x',
  'endDate.invalid_date': 'text_1787146745141wjbnbx6qx0k',
  'endDate.invalid_date_range': 'text_17871467451419agn4aantij',
  'amountCents.value_is_mandatory': 'text_17865407897439beomgnzd95',
  'percentageRate.value_is_mandatory': 'text_17865407897434vmamhdvweo',
  'frequencyDuration.value_is_mandatory': 'text_17865407897437dnip7coe05',
  'fromDatetime.value_is_mandatory': 'text_1786540789743pa0vg8lwqrp',
  'toDatetime.value_is_mandatory': 'text_17865407897435i1str1tcqg',
  'interval.value_is_mandatory': 'text_1786540789743w37crn5u26h',
  'thresholdCredits.value_is_mandatory': 'text_17865407897439005gzhq9uj',
  'thresholdCredits.invalid_value': 'text_17865407897438j9ox2gyjtz',
  'targetOngoingBalance.value_is_mandatory': 'text_1786540789743ij3hcudi4o2',
  'targetOngoingBalance.invalid_value': 'text_17865407897436vdq9qrmt5g',
  'rateAmount.invalid_value': 'text_1786540789743un4zkfyvap6',
  'units.value_is_mandatory': 'text_178654078974339ax12dmn1b',
  'units.invalid_value': 'text_1786540789743exobcbk3bup',
  'unitAmountCents.value_is_mandatory': 'text_1786540789743wiyora70qjc',
  'unitAmountCents.invalid_value': 'text_17865407897432o3ig68pgdf',
  'totalAmountCents.invalid_value': 'text_17865407897438uuwti3vbdw',
}

/** Billing item details, keyed by error code alone. */
export const BILLING_ITEM_CODE_KEYS: Record<string, string> = {
  value_is_mandatory: 'text_17865407897435dxgs25b9ms',
  invalid_value: 'text_17865407897439bwyh8wzimz',
  invalid_date: 'text_1786540789743k1lgh3v3l3b',
  invalid_date_range: 'text_1786540789743debdwenpnih',
  currencies_does_not_match: 'text_1786540789743zvj7xtx1x6j',
  plan_not_found: 'text_1786540789743r5ldiuhgw6f',
  coupon_not_found: 'text_1786540789744tkiprawg3ox',
  add_on_not_found: 'text_17865407897449q82lvgyi80',
  charge_not_found: 'text_1786540789744p6nciq805zz',
  fixed_charge_not_found: 'text_17865407897442v23iz20ll2',
  coupon_type_does_not_match: 'text_1786540789744nuvqoh8xq1x',
  invalid_type: 'text_1786540789744rjcjizkivyf',
  unsupported_key: 'text_1786540789744du1ls5xbtq0',
  invalid_count: 'text_1786540789744jmwmrvskazb',
  invalid_format: 'text_1786540789744zpvrqniktq5',
  is_invalid: 'text_1786540789744i4c9sozn2qh',
}

/** At most three toasts, so a multi-key validation failure cannot flood the screen. */
const MAX_DISPLAYED_ERRORS = 3

interface ParsedBillingItemKey {
  entity: string
  /** 0-based position of the item within its collection, `null` on coarse keys. */
  index: number | null
  /** 0-based position of the nested recurring transaction rule, when the key targets one. */
  ruleIndex: number | null
  /** Last path segment, `null` when the key stops at a collection or an index. */
  field: string | null
}

const isNumeric = (segment: string | undefined): boolean => !!segment && /^\d+$/.test(segment)

// Backend detail keys look like `billingItems.<entity>.<index>.<section>.<field>`, with
// `section` a structural wrapper (`payload`, `overrides`) and, for wallet credits, an
// optional `recurringTransactionRules.<ruleIndex>` level. Only the entity, the positions
// and the trailing field carry meaning.
const parseBillingItemKey = (rawKey: string): ParsedBillingItemKey | null => {
  const segments = rawKey.split('.')

  if (segments[0] !== 'billingItems' || segments.length < 2) return null

  const [, entity, ...rest] = segments
  const lastSegment = rest.at(-1)
  const rulesSegmentIndex = rest.indexOf(RECURRING_RULES_SEGMENT)
  const rawRuleIndex = rulesSegmentIndex === -1 ? undefined : rest[rulesSegmentIndex + 1]

  return {
    entity,
    index: isNumeric(rest[0]) ? Number(rest[0]) : null,
    ruleIndex: isNumeric(rawRuleIndex) ? Number(rawRuleIndex) : null,
    field: !lastSegment || isNumeric(lastSegment) ? null : lastSegment,
  }
}

const getBillingItemPrefix = (
  parsed: ParsedBillingItemKey,
  translate: TranslateFunc,
): string | null => {
  const prefixKey = BILLING_ITEM_PREFIX_KEYS[parsed.entity]

  if (!prefixKey || parsed.index === null) return null

  if (parsed.ruleIndex !== null) {
    return translate(RECURRING_RULE_PREFIX_KEY, {
      index: parsed.index + 1,
      ruleIndex: parsed.ruleIndex + 1,
    })
  }

  return translate(prefixKey, { index: parsed.index + 1 })
}

const getBillingItemMessage = (
  rawKey: string,
  code: string,
  translate: TranslateFunc,
): string | null => {
  const parsed = parseBillingItemKey(rawKey)

  if (!parsed) return null

  const prefix = getBillingItemPrefix(parsed, translate)
  const detailKey =
    (parsed.field ? BILLING_ITEM_FIELD_ERROR_KEYS[`${parsed.field}.${code}`] : undefined) ??
    BILLING_ITEM_CODE_KEYS[code]

  // Without a prefix the detail is a bare lowercase fragment ("a value is invalid"),
  // which reads as a broken sentence on its own — fall back to the generic copy.
  if (!prefix || !detailKey) return null

  return translate(COMPOSED_MESSAGE_KEY, { prefix, detail: translate(detailKey) })
}

const getDetailError = (
  rawKey: string,
  code: string,
  translate: TranslateFunc,
  scope: QuoteMutationErrorScope,
): QuoteMutationError => {
  const detailKey = `${rawKey}.${code}`
  const topLevelKey = SCOPED_ERROR_KEYS[scope]?.[detailKey] ?? TOP_LEVEL_ERROR_KEYS[detailKey]

  if (topLevelKey) {
    const field = FORM_FIELD_BY_DETAIL_KEY[rawKey]

    return {
      message: translate(topLevelKey),
      field,
      messageKey: field ? topLevelKey : undefined,
    }
  }

  const billingItemMessage = getBillingItemMessage(rawKey, code, translate)

  if (billingItemMessage) return { message: billingItemMessage }

  return { message: translate(GENERIC_ERROR_KEY) }
}

/**
 * Turns a failed quote, order-form or order mutation into user-facing messages.
 *
 * The API answers through `ExecutionErrorResponder`, which exposes
 * `extensions.code` plus a camelized `extensions.details` map of
 * `field -> [errorCode]`. Returns at least one message whenever the failure is this
 * module's to report — a failure must never be silent — and an empty list only when the
 * global error link already toasted the generic copy for a code handled nowhere here.
 */
export const getQuoteMutationErrors = (
  errorObject: ApolloError | readonly GraphQLFormattedError[] | undefined,
  translate: TranslateFunc,
  scope: QuoteMutationErrorScope = 'quote',
): QuoteMutationError[] => {
  const genericError: QuoteMutationError[] = [{ message: translate(GENERIC_ERROR_KEY) }]
  const extensions = extractGraphQLErrors(errorObject)[0]?.extensions
  const code = extensions?.code
  const details = extensions?.details

  if (code === LagoApiError.Forbidden) return [{ message: translate(PERMISSION_ERROR_KEY) }]
  if (code === LagoApiError.FeatureUnavailable) {
    return [{ message: translate(FEATURE_UNAVAILABLE_ERROR_KEY) }]
  }

  // The global error link owns this one: it already toasted the generic copy and reported it.
  if (code && !LOCALLY_HANDLED_ERROR_CODES.includes(code)) return []

  if (!details) return genericError

  const errors: QuoteMutationError[] = []
  const seenMessages = new Set<string>()

  for (const [rawKey, codes] of Object.entries(details)) {
    const detailCode = Array.isArray(codes) ? codes[0] : String(codes)
    const error = getDetailError(rawKey, detailCode, translate, scope)

    if (seenMessages.has(error.message)) continue

    seenMessages.add(error.message)
    errors.push(error)
  }

  if (!errors.length) return genericError

  return errors.slice(0, MAX_DISPLAYED_ERRORS)
}
