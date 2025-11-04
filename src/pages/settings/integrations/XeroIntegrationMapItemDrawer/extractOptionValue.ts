import { OPTION_VALUE_SEPARATOR } from './const'

export const extractOptionValue = (optionValue: string) => {
  const [externalId, externalAccountCode, externalName] = optionValue.split(OPTION_VALUE_SEPARATOR)

  return { externalId, externalAccountCode, externalName }
}
