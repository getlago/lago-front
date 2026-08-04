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
