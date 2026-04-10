// Decimal precision for tier boundary arithmetic, used to prevent floating-point noise.
// Intentionally lower than chargeDecimal's 15-digit INPUT limit because IEEE 754
// doubles produce noise at ~16 significant digits (e.g. 5.3 + 0.1 = 5.399999999999999).
const CHARGE_DECIMAL_PRECISION = 10

const toFixedNumber = (value: number): number => Number(value.toFixed(CHARGE_DECIMAL_PRECISION))

// Returns the number of decimal places in a number
const getDecimalPlaces = (value: number | string): number => {
  const str = String(value)
  const dotIndex = str.indexOf('.')

  if (dotIndex === -1) return 0
  return str.length - dotIndex - 1
}

// Computes the gap between consecutive tier ranges based on the backend's two models:
// - Adjacent model (any decimal toValue present): from[i+1] = to[i], gap = 0
// - Integer model (all toValues are integers): from[i+1] = to[i] + 1, gap = 1
// Only considers toValue (user input), not fromValue (derived/computed).
export const getDecimalStep = (
  ranges: { toValue?: number | string | null; fromValue?: number | string | null }[],
): number => {
  for (const range of ranges) {
    if (range.toValue !== null && range.toValue !== undefined) {
      if (getDecimalPlaces(range.toValue) > 0) return 0
    }
  }

  return 1
}

export const formataAnyToValueForChargeFormArrays = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toValue: any,
  fromValue: number | string,
  step: number = 1,
) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    return toFixedNumber(Number(fromValue) + step)
  }

  return Number(toValue || 0)
}

// --- Shared tier range manipulation logic ---
type BaseRange = {
  fromValue: number
  toValue?: number | null
}

export const buildRangesForAdd = <T extends BaseRange>(
  ranges: T[],
  newRangeDefaults: Partial<T>,
): Partial<T>[] => {
  const addIndex = ranges.length - 1
  const step = getDecimalStep(ranges)
  // For new range defaults: adjacent model uses +1 for toValue since from==to is invalid
  const defaultStep = step === 0 ? 1 : step

  return ranges.reduce<Partial<T>[]>((acc, range, i) => {
    if (i < addIndex) {
      acc.push(range)
    } else if (i === addIndex) {
      const newFromValue =
        addIndex === 0 ? 0 : toFixedNumber(Number(ranges[addIndex - 1]?.toValue || 0) + step)

      acc.push({
        ...newRangeDefaults,
        fromValue: newFromValue,
        toValue: toFixedNumber(newFromValue + defaultStep),
      } as Partial<T>)
      acc.push({
        ...range,
        fromValue: toFixedNumber(
          Number(range.fromValue || 0) <= newFromValue + defaultStep
            ? newFromValue + defaultStep + step
            : Number(range.fromValue),
        ),
      })
    }

    return acc
  }, [])
}

export const buildRangesForToValueUpdate = <T extends BaseRange>(
  ranges: T[],
  rangeIndex: number,
  value: number | string | undefined,
): T[] => {
  const updatedRanges = ranges.map((range, i) =>
    i === rangeIndex ? { ...range, toValue: Number(value || 0) } : range,
  )
  const step = getDecimalStep(updatedRanges)

  return ranges.reduce<T[]>((acc, range, i) => {
    // fromValue: range 0 always 0, all others recomputed from previous toValue + step
    const fromValue =
      i === 0 ? range.fromValue : toFixedNumber(Number(acc[i - 1].toValue || 0) + step)

    if (rangeIndex === i) {
      // Edited range: accept raw user value (no validation, avoids auto-fill on clear)
      acc.push({ ...range, fromValue: i === 0 ? 0 : fromValue, toValue: Number(value || 0) })
    } else {
      // Non-edited range: validate toValue against (possibly recomputed) fromValue
      const formattedToValue = formataAnyToValueForChargeFormArrays(range.toValue, fromValue, step)

      acc.push({ ...range, fromValue, toValue: formattedToValue })
    }

    return acc
  }, [])
}

export const buildRangesForDelete = <T extends BaseRange>(ranges: T[], rangeIndex: number): T[] => {
  const remainingRanges = ranges.filter((_, i) => i !== rangeIndex)
  const step = getDecimalStep(remainingRanges)

  const newRanges = ranges.reduce<T[]>((acc, range, i) => {
    if (i < rangeIndex) acc.push({ ...range })
    if (i > rangeIndex) {
      const { toValue } = acc[acc.length - 1]

      acc.push({
        ...range,
        fromValue: toFixedNumber(Number(toValue || 0) + step),
      })
    }
    return acc
  }, [])

  newRanges[newRanges.length - 1].toValue = null

  return newRanges
}
