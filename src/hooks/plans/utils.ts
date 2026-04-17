export const formataAnyToValueForChargeFormArrays = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toValue: any,
  fromValue: number | string,
  step: number = 1,
) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    // toFixed(2) neutralises float drift when cascading decimal steps (e.g. 10.01 + 0.01)
    return Number((Number(fromValue) + step).toFixed(2))
  }

  return Number(toValue || 0)
}
