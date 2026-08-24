import { DateTime } from 'luxon'

import {
  DEFAULT_PAYMENT_TERM,
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_FIELDS_BY_TYPE,
} from '~/core/constants/paymentTerm'
import { PaymentTermInput, PaymentTermTypeEnum } from '~/generated/graphql'

/**
 * The shape shared by the API object and the API input — enough to compute a due date
 * and to render a label, without caring which of the two we were handed.
 */
export type ResolvablePaymentTerm = {
  termType: PaymentTermTypeEnum
  days?: number | null
  dayOfMonth?: number | null
  monthOffset?: number | null
}

/** A term as read off a query result: absent means "inherit from the level above". */
export type MaybePaymentTerm = ResolvablePaymentTerm | null | undefined

/**
 * `monthOffset` is optional on the API, which fills in the default server-side. Mirror
 * that here so a term read back before it was ever saved previews the same date.
 */
export const normalizedMonthOffset = (term: ResolvablePaymentTerm): number =>
  term.monthOffset ?? PAYMENT_TERM_DEFAULT_MONTH_OFFSET

/**
 * Clamp the configured day to the target month so a day-31 term never spills into the
 * next month: day 31 in September is Sep 30, in February 2026 it is Feb 28.
 */
const anchoredToDayOfMonth = (date: DateTime, dayOfMonth: number): DateTime =>
  date.set({ day: Math.min(dayOfMonth, date.daysInMonth ?? dayOfMonth) })

const dayOfMonthDueDate = (issuingDate: DateTime, term: ResolvablePaymentTerm): DateTime => {
  const dayOfMonth = term.dayOfMonth

  if (typeof dayOfMonth !== 'number') return issuingDate

  let dueDate = anchoredToDayOfMonth(
    issuingDate.plus({ months: normalizedMonthOffset(term) }),
    dayOfMonth,
  )

  // Only reachable with a zero month offset: roll forward whole months, re-clamping each
  // time, until the due date is no longer in the past.
  while (dueDate.startOf('day') < issuingDate.startOf('day')) {
    dueDate = anchoredToDayOfMonth(dueDate.plus({ months: 1 }), dayOfMonth)
  }

  return dueDate
}

/**
 * Mirrors `PaymentTerm#due_date_for` on the API. Plain calendar arithmetic: the timezone
 * is applied once upstream to derive the issuing date, never again here.
 *
 * Note that `netEndOfMonth` (US) and `daysEndOfMonth` (EU) take the same `days` and give
 * different dates — the order of operations is what distinguishes them.
 */
export const paymentTermDueDate = (
  issuingDate: DateTime,
  term: ResolvablePaymentTerm,
): DateTime => {
  const days = term.days ?? 0

  switch (term.termType) {
    case PaymentTermTypeEnum.DueOnReceipt:
      return issuingDate
    case PaymentTermTypeEnum.Net:
      return issuingDate.plus({ days })
    case PaymentTermTypeEnum.EndOfMonth:
      return issuingDate.endOf('month')
    case PaymentTermTypeEnum.NetEndOfMonth:
      return issuingDate.endOf('month').plus({ days })
    case PaymentTermTypeEnum.DaysEndOfMonth:
      return issuingDate.plus({ days }).endOf('month')
    case PaymentTermTypeEnum.DayOfMonth:
      return dayOfMonthDueDate(issuingDate, term)
    default:
      return issuingDate
  }
}

/**
 * Build the mutation payload carrying only the fields the chosen type accepts. Sending
 * a field that doesn't belong to the type is a validation error on the API, so this is
 * the only place a `PaymentTermInput` should be assembled.
 */
export const buildPaymentTermInput = (term: ResolvablePaymentTerm): PaymentTermInput => {
  const fields = PAYMENT_TERM_FIELDS_BY_TYPE[term.termType] ?? []
  const input: PaymentTermInput = { termType: term.termType }

  if (fields.includes('days')) {
    input.days = Number(term.days ?? 0)
  }

  if (fields.includes('dayOfMonth')) {
    input.dayOfMonth = Number(term.dayOfMonth)
  }

  if (fields.includes('monthOffset')) {
    input.monthOffset = normalizedMonthOffset(term)
  }

  return input
}

/**
 * First level of the chain that carries a term wins — no merging. Returns whether the
 * term came from the level asked about or was inherited, so callers can say so.
 */
export const resolvePaymentTerm = ({
  ownTerm,
  parentTerm,
}: {
  ownTerm: MaybePaymentTerm
  parentTerm: MaybePaymentTerm
}): { term: ResolvablePaymentTerm; isInherited: boolean } => {
  if (ownTerm) return { term: ownTerm, isInherited: false }

  return {
    term: parentTerm ?? DEFAULT_PAYMENT_TERM,
    isInherited: true,
  }
}
