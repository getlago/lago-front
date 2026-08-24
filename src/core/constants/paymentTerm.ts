import { PaymentTermTypeEnum } from '~/generated/graphql'

/**
 * Display order of the term types. The combo box renders with `sortValues={false}`,
 * so this array is the order the user sees.
 */
export const PAYMENT_TERM_TYPES = [
  PaymentTermTypeEnum.DueOnReceipt,
  PaymentTermTypeEnum.Net,
  PaymentTermTypeEnum.EndOfMonth,
  PaymentTermTypeEnum.NetEndOfMonth,
  PaymentTermTypeEnum.DaysEndOfMonth,
  PaymentTermTypeEnum.DayOfMonth,
] as const

export type PaymentTermField = 'days' | 'dayOfMonth' | 'monthOffset'

/**
 * The API validates the term as a discriminated union: each type accepts only its own
 * fields, anything extra is rejected. This map is the single source of that truth — it
 * drives both which inputs are rendered and which fields are sent, so the two can't drift.
 */
export const PAYMENT_TERM_FIELDS_BY_TYPE: Record<PaymentTermTypeEnum, readonly PaymentTermField[]> =
  {
    [PaymentTermTypeEnum.DueOnReceipt]: [],
    [PaymentTermTypeEnum.Net]: ['days'],
    [PaymentTermTypeEnum.EndOfMonth]: [],
    [PaymentTermTypeEnum.NetEndOfMonth]: ['days'],
    [PaymentTermTypeEnum.DaysEndOfMonth]: ['days'],
    [PaymentTermTypeEnum.DayOfMonth]: ['dayOfMonth', 'monthOffset'],
  }

/** Applied when nothing is set at any level of the resolution chain. */
export const DEFAULT_PAYMENT_TERM = { termType: PaymentTermTypeEnum.DueOnReceipt } as const

/** `monthOffset` is optional on the API and defaults to the following month. */
export const PAYMENT_TERM_DEFAULT_MONTH_OFFSET = 1

export const PAYMENT_TERM_DAY_OF_MONTH_MIN = 1
export const PAYMENT_TERM_DAY_OF_MONTH_MAX = 31
export const PAYMENT_TERM_MONTH_OFFSET_MIN = 0
export const PAYMENT_TERM_MONTH_OFFSET_MAX = 12

export const PAYMENT_TERM_TYPE_LABEL_KEYS: Record<PaymentTermTypeEnum, string> = {
  [PaymentTermTypeEnum.DueOnReceipt]: 'text_1787603382161xaxwe5zqq8v',
  [PaymentTermTypeEnum.Net]: 'text_1787603382161pnfut1av7i8',
  [PaymentTermTypeEnum.EndOfMonth]: 'text_1787603382161b03j81v3cwa',
  [PaymentTermTypeEnum.NetEndOfMonth]: 'text_17876033821623pem67pzal2',
  [PaymentTermTypeEnum.DaysEndOfMonth]: 'text_1787603382162nrjsytserkp',
  [PaymentTermTypeEnum.DayOfMonth]: 'text_1787603382162ka0vp4znz0g',
}

export const PAYMENT_TERM_TYPE_DESCRIPTION_KEYS: Record<PaymentTermTypeEnum, string> = {
  [PaymentTermTypeEnum.DueOnReceipt]: 'text_1787603382162qam878le998',
  [PaymentTermTypeEnum.Net]: 'text_1787603382162zbdxi2lf4t4',
  [PaymentTermTypeEnum.EndOfMonth]: 'text_1787603382162oe82rajdnrr',
  [PaymentTermTypeEnum.NetEndOfMonth]: 'text_1787603382162ev1x6fip64w',
  [PaymentTermTypeEnum.DaysEndOfMonth]: 'text_1787603382162ozv765m1cmp',
  [PaymentTermTypeEnum.DayOfMonth]: 'text_1787603382162h7k3eb21qar',
}

/**
 * How a resolved term reads as a settings-row value. The two types that carry no
 * numeric field reuse their option label — the string is identical.
 */
export const PAYMENT_TERM_VALUE_KEYS: Record<PaymentTermTypeEnum, string> = {
  [PaymentTermTypeEnum.DueOnReceipt]: 'text_1787603382161xaxwe5zqq8v',
  [PaymentTermTypeEnum.Net]: 'text_1787603382162gxbjpls4kad',
  [PaymentTermTypeEnum.EndOfMonth]: 'text_1787603382161b03j81v3cwa',
  [PaymentTermTypeEnum.NetEndOfMonth]: 'text_17876033821620cp0it1gsrf',
  [PaymentTermTypeEnum.DaysEndOfMonth]: 'text_17876033821620tzeqh1iaoi',
  [PaymentTermTypeEnum.DayOfMonth]: 'text_1787603382162bnh3dfktlyn',
}

/**
 * One self-contained sentence per type rather than a shared sentence with the term name
 * interpolated — article agreement ("a Net 30" vs "an End of month") doesn't survive
 * interpolation across locales.
 */
export const PAYMENT_TERM_DUE_DATE_PREVIEW_KEYS: Record<PaymentTermTypeEnum, string> = {
  [PaymentTermTypeEnum.DueOnReceipt]: 'text_1787603382162jezn6k1k4y1',
  [PaymentTermTypeEnum.Net]: 'text_17876033821620tl738mv7ss',
  [PaymentTermTypeEnum.EndOfMonth]: 'text_1787603382162xpefkgz56l4',
  [PaymentTermTypeEnum.NetEndOfMonth]: 'text_1787603382162om3x6x6a12g',
  [PaymentTermTypeEnum.DaysEndOfMonth]: 'text_1787603382162ixat544of53',
  [PaymentTermTypeEnum.DayOfMonth]: 'text_17876033821624en7b3ophhj',
}
