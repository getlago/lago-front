// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatAnyToValueForChargeFormArrays = (toValue: any, fromValue: number | string) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    return Number(fromValue) + 1
  }

  return Number(toValue || 0)
}
