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

// Computes the step size based on the maximum decimal precision found in toValue fields.
// Only considers toValue (user input), not fromValue (derived/computed).
// Integer ranges → step 1, decimal ranges → smallest unit (e.g. 0.1, 0.01, 0.001)
export const getDecimalStep = (
  ranges: { toValue?: number | string | null; fromValue?: number | string | null }[],
): number => {
  let maxDecimals = 0

  for (const range of ranges) {
    if (range.toValue !== null && range.toValue !== undefined) {
      maxDecimals = Math.max(maxDecimals, getDecimalPlaces(range.toValue))
    }
  }

  if (maxDecimals === 0) return 1
  return Number((10 ** -maxDecimals).toFixed(maxDecimals))
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

  return ranges.reduce<Partial<T>[]>((acc, range, i) => {
    if (i < addIndex) {
      acc.push(range)
    } else if (i === addIndex) {
      const newToValue =
        addIndex === 0 ? 0 : toFixedNumber(Number(ranges[addIndex - 1]?.toValue || 0) + step)

      acc.push({
        ...newRangeDefaults,
        fromValue: newToValue,
        toValue: toFixedNumber(newToValue + step),
      } as Partial<T>)
      acc.push({
        ...range,
        fromValue: toFixedNumber(
          Number(range.fromValue || 0) <= newToValue + step
            ? newToValue + step + step
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
    if (rangeIndex === i) {
      acc.push({ ...range, toValue: Number(value || 0) })
    } else if (i > rangeIndex) {
      const { toValue } = acc[i - 1]
      const fromValue = toFixedNumber(Number(toValue || 0) + step)
      const formattedToValue = formataAnyToValueForChargeFormArrays(range.toValue, fromValue, step)

      acc.push({ ...range, fromValue, toValue: formattedToValue })
    } else {
      acc.push(range)
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
