// Detects if ranges use the adjacent model (decimal boundaries where from[i+1] === to[i])
// vs the integer-step model (from[i+1] === to[i] + 1)
export const isAdjacentModel = (
  ranges: { toValue?: number | string | null; fromValue?: number | string | null }[],
): boolean => {
  return ranges.some((range) => {
    if (range.toValue === null || range.toValue === undefined) return false
    const num = Number(range.toValue)
    return !Number.isInteger(num)
  })
}

export const formataAnyToValueForChargeFormArrays = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toValue: any,
  fromValue: number | string,
  adjacent?: boolean,
) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    return adjacent ? Number(fromValue) : Number(fromValue) + 1
  }

  return Number(toValue || 0)
}
