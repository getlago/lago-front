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
    return Number((Number(fromValue) + step).toFixed(10))
  }

  return Number(toValue || 0)
}
