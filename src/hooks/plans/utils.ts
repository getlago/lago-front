// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formataAnyToValueForChargeFormArrays = (toValue: any, fromValue: string) => {
  if (toValue === null) return null

  if (Number(toValue || 0) <= Number(fromValue)) {
    return String(Number(fromValue) + 1)
  }

  return String(toValue || 0)
}

export const getTrialPeriod = (
  trialPeriod: number | null | undefined,
  isEdition: boolean,
): number | undefined => {
  if (trialPeriod === null || trialPeriod === undefined) {
    return isEdition ? 0 : undefined
  }
  return trialPeriod
}
