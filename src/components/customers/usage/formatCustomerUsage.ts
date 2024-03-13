import { gql } from '@apollo/client'

import { ChargeUsage, GroupUsage } from '~/generated/graphql'

gql`
  fragment ChargeUsageForFormatCustomerUsage on ChargeUsage {
    groupedUsage {
      groupedBy
    }
  }
`

type TExtendedGroupUsage = GroupUsage & {
  displayName: string
}

export const formatGroupedUsage = (
  usage: ChargeUsage | undefined,
): TExtendedGroupUsage[] | undefined => {
  const groupedChargesUsage = usage?.groupedUsage

  if (!groupedChargesUsage?.length) {
    return undefined
  }

  const result = [] as TExtendedGroupUsage[]

  groupedChargesUsage.forEach((groupedChargeUsage) => {
    if (groupedChargeUsage?.groups?.length === 0) {
      return
    }

    return Object.values(groupedChargeUsage?.groupedBy || {}).length > 0
      ? Object.values(groupedChargeUsage?.groupedBy)
          .map((group) => (!!group ? `${group} • ` : ''))
          .join('')
      : ''
  })

  return result?.sort((a, b) => {
    const aDisplayName = a?.displayName.toLowerCase().replace('•', '')
    const bDisplayName = b?.displayName.toLowerCase().replace('•', '')

    return aDisplayName.localeCompare(bDisplayName)
  })
}
