import { DateTime } from 'luxon'

import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import {
  PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS,
  PAYMENT_TERM_TYPE_DESCRIPTION_KEYS,
  PAYMENT_TERM_TYPE_LABEL_KEYS,
  PAYMENT_TERM_TYPES,
  PAYMENT_TERM_VALUE_KEYS,
} from '~/core/constants/paymentTerm'
import { DateFormat, intlFormatDateTime } from '~/core/timezone'
import {
  MaybePaymentTerm,
  normalizedMonthOffset,
  paymentTermDueDate,
  ResolvablePaymentTerm,
  resolvePaymentTerm,
} from '~/core/utils/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

/**
 * The count handed to `translate` as the plural selector, and the interpolations the
 * value and preview copy expect. Kept together so a term is described in exactly one way
 * wherever it is rendered.
 */
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

export const usePaymentTerm = () => {
  const { translate } = useInternationalization()

  /**
   * How a resolved term reads as a settings-row value, e.g. `Net 30 days`.
   */
  const formatPaymentTerm = (term: ResolvablePaymentTerm): string => {
    const { data, plural } = termCopyData(term)

    return translate(PAYMENT_TERM_VALUE_KEYS[term.termType], data, plural)
  }

  /**
   * The value shown on a settings row that can inherit from its parent level: the
   * effective term, marked as inherited when it did not come from this level.
   */
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

  /**
   * Previews the due date the term would produce, so the two end-of-month conventions
   * can be told apart before saving. The API has no preview endpoint — the date is
   * computed with the same calendar rules the API applies at finalization.
   */
  const getDueDatePreviewCopy = (
    term: ResolvablePaymentTerm,
    issuingDate: DateTime = DateTime.now(),
  ): string => {
    const { data, plural } = termCopyData(term)
    const formatDate = (date: DateTime): string =>
      intlFormatDateTime(date.toISO() ?? '', { formatDate: DateFormat.DATE_MED }).date

    return translate(
      PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS[term.termType],
      {
        ...data,
        issuingDate: formatDate(issuingDate),
        dueDate: formatDate(paymentTermDueDate(issuingDate, term)),
      },
      plural,
    )
  }

  /**
   * The six term types, in the spec's order. Rendered with `sortValues={false}` so this
   * order is what the user sees.
   *
   * `inheritedFrom` prepends the inherit choice for a level that can fall back to its
   * parent, labelled with the value it would inherit — selecting it clears the override.
   */
  const getTermTypeComboboxData = (options?: {
    inheritedFrom?: { term: ResolvablePaymentTerm; labelKey: string }
  }): BasicComboBoxData[] => {
    const termTypeOptions = PAYMENT_TERM_TYPES.map((termType) => ({
      value: termType,
      label: translate(PAYMENT_TERM_TYPE_LABEL_KEYS[termType]),
      description: translate(PAYMENT_TERM_TYPE_DESCRIPTION_KEYS[termType]),
    }))

    if (!options?.inheritedFrom) return termTypeOptions

    return [
      {
        value: '',
        label: translate(options.inheritedFrom.labelKey, {
          value: formatPaymentTerm(options.inheritedFrom.term),
        }),
      },
      ...termTypeOptions,
    ]
  }

  return {
    formatPaymentTerm,
    getDueDatePreviewCopy,
    getPaymentTermCopy,
    getTermTypeComboboxData,
  }
}
