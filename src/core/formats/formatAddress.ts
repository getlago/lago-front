export const formatCityStateZipcodeString = ({
  city,
  state,
  zipcode,
}: {
  city: string | null | undefined
  state: string | null | undefined
  zipcode: string | null | undefined
}): string => {
  const cleanCity = city?.trim()
  const cleanState = state?.trim()
  const cleanZipcode = zipcode?.trim()
  const remainingPartsString = [cleanState, cleanZipcode].filter(Boolean).join(' ')

  if (!!cleanCity && !!remainingPartsString) {
    return `${cleanCity}, ${remainingPartsString}`
  }

  return cleanCity || remainingPartsString
}
