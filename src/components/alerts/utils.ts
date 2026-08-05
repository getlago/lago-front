import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AlertThreshold, CurrencyEnum, ThresholdInput } from '~/generated/graphql'

/**
 * Turns the API thresholds of an alert into the shape the thresholds table
 * expects: amounts deserialized (or truncated to units), non-recurring
 * thresholds first and the recurring one — if any — last, since the table
 * relies on that ordering to map row indexes back to the array.
 */
export const sortAndFormatThresholds = (
  thresholds: AlertThreshold[],
  currency: CurrencyEnum,
  shouldHandleUnits: boolean,
): AlertThreshold[] => {
  const formattedThresholds = thresholds.map((threshold) => ({
    ...threshold,
    value: shouldHandleUnits
      ? threshold.value.split('.')[0]
      : String(deserializeAmount(threshold.value, currency)),
  }))

  const recurringThreshold = formattedThresholds.find((threshold) => threshold.recurring)
  const nonRecurringThresholds = formattedThresholds.filter((threshold) => !threshold.recurring)

  // Sort the non-recurring thresholds by value
  const sortedNonRecurringThresholds = nonRecurringThresholds.sort((a, b) => {
    if (a.value && !b.value) return -1
    if (!a.value && b.value) return 1
    return 0
  })

  // Combine the recurring threshold with the sorted non-recurring thresholds
  return [...sortedNonRecurringThresholds, ...(!!recurringThreshold ? [recurringThreshold] : [])]
}

/**
 * The thresholds table is form-library agnostic: it patches a single cell with
 * an untyped value. This is the one boundary where that value is turned back
 * into a typed threshold, one key at a time.
 *
 * An emptied cell arrives as `undefined`; `value` is stored as `''` instead
 * since the API type requires a string, and both are equally empty for the
 * validation, the inputs and the serialized payload.
 */
export const patchThreshold = (
  threshold: ThresholdInput,
  key: keyof ThresholdInput,
  newValue: unknown,
): ThresholdInput => {
  const asString = newValue === undefined || newValue === null ? undefined : String(newValue)

  if (key === 'code') return { ...threshold, code: asString }
  if (key === 'recurring') return { ...threshold, recurring: !!newValue }

  return { ...threshold, value: asString ?? '' }
}

/** The slice of an alert form the thresholds table adapter relies on. */
type ThresholdsFormApi = {
  setFieldValue: (
    field: 'thresholds',
    updater: ThresholdInput[] | ((current: ThresholdInput[]) => ThresholdInput[]),
  ) => void
}

type ThresholdSetters = {
  setThresholds: (newThresholds: ThresholdInput[]) => void
  setThresholdValue: (params: {
    index: number
    key: keyof ThresholdInput
    newValue: unknown
  }) => void
}

/**
 * The two callbacks the form-library-agnostic thresholds table needs, bound to
 * an alert form. The per-cell patch always rewrites the whole array: a
 * bracket-index write would turn it into a plain object if the base value were
 * ever missing.
 */
export const createThresholdSetters = (form: ThresholdsFormApi): ThresholdSetters => ({
  setThresholds: (newThresholds) => {
    form.setFieldValue('thresholds', newThresholds)
  },
  setThresholdValue: ({ index, key, newValue }) => {
    form.setFieldValue('thresholds', (currentThresholds) =>
      currentThresholds.map((threshold, i) =>
        i === index ? patchThreshold(threshold, key, newValue) : threshold,
      ),
    )
  },
})

/** The slice of an alert form the duplicate-code error handler relies on. */
type CodeErrorFormApi = {
  setErrorMap: (errorMap: {
    onDynamic: { fields: { code: { message: string; path: ['code'] } } }
  }) => void
}

/**
 * Marks the code field with the "value already exists" error and scrolls back
 * to it, as both alert forms do when the API rejects a duplicate code.
 */
export const setCodeAlreadyExistsError = (formApi: CodeErrorFormApi): void => {
  formApi.setErrorMap({
    onDynamic: {
      fields: { code: { message: 'text_632a2d437e341dcc76817556', path: ['code'] } },
    },
  })

  document.getElementById('root')?.scrollTo({ top: 0 })
}
