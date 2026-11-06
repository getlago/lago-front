import { DateTime } from 'luxon'

import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import {
  getInheritedPaymentTerm,
  INHERIT_UNRESOLVED_LABEL_KEY,
  paymentTermFromFormValues,
  PaymentTermLevels,
} from '~/components/paymentTerms/utils'
import {
  PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS,
  PAYMENT_TERM_INHERIT,
  PAYMENT_TERM_PREVIEW_ISSUING_DATE,
  PAYMENT_TERM_TYPE_DESCRIPTION_KEYS,
  PAYMENT_TERM_TYPE_LABEL_KEYS,
  PAYMENT_TERM_TYPES,
  PAYMENT_TERM_VALUE_KEYS,
} from '~/core/constants/paymentTerm'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import {
  displayedPaymentTerm,
  MaybePaymentTerm,
  normalizedMonthOffset,
  paymentTermDueDate,
  ResolvablePaymentTerm,
  resolvePaymentTerm,
} from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

// The day-of-month copy has one variant per month offset, so the offset drives its plural.
const termCopyData = (
  term: ResolvablePaymentTerm,
): { data: Record<string, number>; plural: number } => {
  switch (term.termType) {
    case PaymentTermTypeEnum.Net:
    case PaymentTermTypeEnum.NetEndOfMonth:
    case PaymentTermTypeEnum.DaysEndOfMonth: {
      const days = term.days ?? 0

      return { data: { days }, plural: days }
    }
    case PaymentTermTypeEnum.DayOfMonth: {
      const monthOffset = normalizedMonthOffset(term)

      return {
        data: { dayOfMonth: term.dayOfMonth ?? 0, monthOffset },
        plural: monthOffset,
      }
    }
    default:
      return { data: {}, plural: 0 }
  }
}

// Anchored to UTC so `endOf('month')` does not render as the 1st in zones west of Greenwich.
const asCalendarDate = (date: DateTime): DateTime => date.setZone('utc', { keepLocalTime: true })

export const usePaymentTerm = () => {
  const { translate } = useInternationalization()

  const formatPaymentTerm = (term: ResolvablePaymentTerm): string => {
    const shownTerm = displayedPaymentTerm(term)
    const { data, plural } = termCopyData(shownTerm)

    return translate(PAYMENT_TERM_VALUE_KEYS[shownTerm.termType], data, plural)
  }

  const getPaymentTermCopy = ({
    ownTerm,
    parentTerm,
  }: {
    ownTerm: MaybePaymentTerm
    parentTerm: MaybePaymentTerm
  }): string => {
    const { term, isInherited } = resolvePaymentTerm({ ownTerm, parentTerm })
    const value = formatPaymentTerm(term)

    if (!isInherited) return value

    return translate('text_1728374331992d2alok9y3kr', { value })
  }

  // The API has no preview endpoint: the date is computed with its finalization rules.
  const getDueDatePreviewCopy = (
    term: ResolvablePaymentTerm,
    issuingDate: DateTime = DateTime.fromISO(PAYMENT_TERM_PREVIEW_ISSUING_DATE, { zone: 'utc' }),
  ): string => {
    const shownTerm = displayedPaymentTerm(term)
    const { data, plural } = termCopyData(shownTerm)
    const issuedOn = asCalendarDate(issuingDate)
    const formatDate = (date: DateTime): string =>
      intlFormatDateTime(date.toISO() ?? '', { formatDate: DateFormat.DATE_MED }).date

    return translate(
      PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS[shownTerm.termType],
      {
        ...data,
        issuingDate: formatDate(issuedOn),
        dueDate: formatDate(paymentTermDueDate(issuedOn, term)),
      },
      plural,
    )
  }

  const formatInheritedPaymentTerm = (
    inheritedFrom: PaymentTermInheritedFrom | undefined,
  ): string =>
    inheritedFrom
      ? translate(inheritedFrom.labelKey, { value: formatPaymentTerm(inheritedFrom.term) })
      : translate(INHERIT_UNRESOLVED_LABEL_KEY)

  // Rendered with `sortValues={false}`, so this order is what the user sees.
  const getTermTypeComboboxData = (options?: {
    canInherit?: boolean
    inheritedFrom?: PaymentTermInheritedFrom
  }): BasicComboBoxData[] => {
    const termTypeOptions = PAYMENT_TERM_TYPES.map((termType) => ({
      value: termType,
      label: translate(PAYMENT_TERM_TYPE_LABEL_KEYS[termType]),
      description: translate(PAYMENT_TERM_TYPE_DESCRIPTION_KEYS[termType]),
    }))

    if (!options?.canInherit && !options?.inheritedFrom) return termTypeOptions

    return [
      { value: PAYMENT_TERM_INHERIT, label: formatInheritedPaymentTerm(options.inheritedFrom) },
      ...termTypeOptions,
    ]
  }

  const getBillingObjectPaymentTermCopy = ({
    ownTerm,
    ...levels
  }: PaymentTermLevels & { ownTerm: MaybePaymentTerm }): string => {
    if (ownTerm) return formatPaymentTerm(ownTerm)

    return formatInheritedPaymentTerm(getInheritedPaymentTerm(levels))
  }

  /** How the editor's current values read in a summary, before they are saved. */
  const getPaymentTermFormValuesCopy = (
    values: PaymentTermFormValues,
    inheritedFrom: PaymentTermInheritedFrom | undefined,
  ): string => {
    const term = paymentTermFromFormValues(values)

    return term ? formatPaymentTerm(term) : formatInheritedPaymentTerm(inheritedFrom)
  }

  return {
    formatPaymentTerm,
    getBillingObjectPaymentTermCopy,
    getDueDatePreviewCopy,
    getPaymentTermCopy,
    getPaymentTermFormValuesCopy,
    getTermTypeComboboxData,
  }
}
