import { AnyFormApi } from '@tanstack/react-form'
import { z } from 'zod'

import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AlertThreshold, CurrencyEnum, NotifyOnEnum, ThresholdInput } from '~/generated/graphql'

export type SortableThreshold = Pick<AlertThreshold, 'recurring' | 'value'> &
  Partial<Pick<AlertThreshold, 'notifyOn'>>

const RECURRING_CANNOT_NOTIFY_WHEN_RESOLVED_ERROR = 'text_1792439710542gpn287ho1ck'
const CODE_REQUIRED_FOR_RESOLUTION_ERROR = 'text_1792439710542tbnwvrxl0g7'
const CODE_NOT_UNIQUE_FOR_RESOLUTION_ERROR = 'text_17924397105421fihqq5j6ns'

export const notifyOnToBoolean = (notifyOn?: NotifyOnEnum[] | null): boolean =>
  !!notifyOn?.includes(NotifyOnEnum.Resolved)

export const booleanToNotifyOn = (notifyWhenResolved: boolean): NotifyOnEnum[] =>
  notifyWhenResolved ? [NotifyOnEnum.Triggered, NotifyOnEnum.Resolved] : [NotifyOnEnum.Triggered]

/**
 * Per-row code errors (translation keys, by threshold index) mirroring the API
 * `validate_notify_on!`: a threshold notifying when resolved needs a non-blank
 * code that no other threshold of the alert uses.
 */
export const getThresholdCodeErrors = (thresholds: ThresholdInput[]): Record<number, string> => {
  const errors: Record<number, string> = {}

  thresholds.forEach((threshold, index) => {
    if (threshold.recurring || !notifyOnToBoolean(threshold.notifyOn)) return

    if (!threshold.code?.trim()) {
      errors[index] = CODE_REQUIRED_FOR_RESOLUTION_ERROR

      return
    }

    thresholds.forEach((other, otherIndex) => {
      if (otherIndex === index || other.code !== threshold.code) return

      errors[index] = CODE_NOT_UNIQUE_FOR_RESOLUTION_ERROR
      errors[otherIndex] = CODE_NOT_UNIQUE_FOR_RESOLUTION_ERROR
    })
  })

  return errors
}

/**
 * Turns the API thresholds of an alert into the shape the thresholds table
 * expects: amounts deserialized (or truncated to units), non-recurring
 * thresholds first and the recurring one — if any — last, since the table
 * relies on that ordering to map row indexes back to the array.
 */
export const sortAndFormatThresholds = <T extends SortableThreshold>(
  thresholds: T[],
  currency: CurrencyEnum,
  shouldHandleUnits: boolean,
): T[] => {
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

/** Zod `superRefine` of an alert form thresholds array, so the API never rejects a `notifyOn`. */
export const refineThresholdsNotifyOn = (
  thresholds: ThresholdInput[],
  ctx: z.RefinementCtx,
): void => {
  thresholds.forEach((threshold, index) => {
    if (threshold.notifyOn && !threshold.notifyOn.includes(NotifyOnEnum.Triggered)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'notifyOn'],
        message: 'text_1771342994699klxu2paz7g8',
      })
    }

    if (threshold.recurring && notifyOnToBoolean(threshold.notifyOn)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'notifyOn'],
        message: RECURRING_CANNOT_NOTIFY_WHEN_RESOLVED_ERROR,
      })
    }
  })

  Object.entries(getThresholdCodeErrors(thresholds)).forEach(([index, message]) => {
    ctx.addIssue({ code: 'custom', path: [Number(index), 'code'], message })
  })
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
  if (key === 'notifyOn') return { ...threshold, notifyOn: booleanToNotifyOn(!!newValue) }

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

/**
 * Marks the code field with the "value already exists" error and scrolls back
 * to it, as both alert forms do when the API rejects a duplicate code.
 */
export const setCodeAlreadyExistsError = (formApi: AnyFormApi): void => {
  applyExistingCodeError(formApi)

  document.getElementById('root')?.scrollTo({ top: 0 })
}
