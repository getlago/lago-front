import { DateTime } from 'luxon'

import {
  DEFAULT_PAYMENT_TERM,
  PAYMENT_TERM_DEFAULT_MONTH_OFFSET,
  PAYMENT_TERM_FIELDS_BY_TYPE,
} from '~/core/constants/paymentTerm'
import { PaymentTermInput, PaymentTermTypeEnum } from '~/generated/graphql'

export type ResolvablePaymentTerm = {
  termType: PaymentTermTypeEnum
  days?: number | null
  dayOfMonth?: number | null
  monthOffset?: number | null
}

/** A term as read off a query result: absent means "inherit from the level above". */
export type MaybePaymentTerm = ResolvablePaymentTerm | null | undefined

const ZERO_DAY_EQUIVALENTS: Partial<Record<PaymentTermTypeEnum, ResolvablePaymentTerm>> = {
  [PaymentTermTypeEnum.Net]: DEFAULT_PAYMENT_TERM,
  [PaymentTermTypeEnum.NetEndOfMonth]: { termType: PaymentTermTypeEnum.EndOfMonth },
  [PaymentTermTypeEnum.DaysEndOfMonth]: { termType: PaymentTermTypeEnum.EndOfMonth },
}

/**
 * A zero-day term reads as the term it equals, the way the PDF labels it. The stored term is
 * untouched.
 */
export const displayedPaymentTerm = (term: ResolvablePaymentTerm): ResolvablePaymentTerm =>
  (!term.days && ZERO_DAY_EQUIVALENTS[term.termType]) || term

// Mirrors the API's server-side default for an absent `monthOffset`.
export const normalizedMonthOffset = (term: ResolvablePaymentTerm): number =>
  term.monthOffset ?? PAYMENT_TERM_DEFAULT_MONTH_OFFSET

// Clamps the day to the target month so a day-31 term never spills into the next one.
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

// Mirrors `PaymentTerm#due_date_for` on the API; the timezone is applied upstream, not here.
// `netEndOfMonth` (US) and `daysEndOfMonth` (EU) share `days` but differ in operation order.
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

// The API rejects fields that don't belong to the type, so only the chosen type's are sent.
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

// First level of the chain that carries a term wins, with no merging.
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
