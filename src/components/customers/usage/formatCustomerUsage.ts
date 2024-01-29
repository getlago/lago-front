import { gql } from '@apollo/client'

import { isTwoDimension, isValidJSON } from '~/core/utils/BMGroupUtils'
import { ChargeUsage, GroupUsage } from '~/generated/graphql'

gql`
  fragment ChargeUsageForFormatCustomerUsage on ChargeUsage {
    billableMetric {
      group
    }
    groupedUsage {
      groupedBy
      groups {
        key
        value
        invoiceDisplayName
      }
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

    const chargeGroupedByDisplayName =
      Object.values(groupedChargeUsage?.groupedBy || {}).length > 0
        ? Object.values(groupedChargeUsage?.groupedBy)
            .map((group) => (!!group ? `${group} • ` : ''))
            .join('')
        : ''

    const parsedGroup =
      typeof usage?.billableMetric?.group === 'string' && isValidJSON(usage?.billableMetric?.group)
        ? JSON.parse(usage?.billableMetric?.group)
        : JSON.parse(JSON.stringify(usage?.billableMetric?.group || '{}'))
    const hasTwoDimension = isTwoDimension(parsedGroup)

    const formatedGroups = groupedChargeUsage?.groups?.map((groupUsage) => {
      return {
        ...groupUsage,
        displayName: `${chargeGroupedByDisplayName}${
          groupUsage.invoiceDisplayName
            ? groupUsage.invoiceDisplayName
            : `${hasTwoDimension && groupUsage.key ? `${groupUsage.key} • ` : ''}${
                groupUsage.value
              }`
        }`,
      }
    })

    !!formatedGroups?.length && result.push(...formatedGroups)
  })

  return result?.sort((a, b) => {
    const aDisplayName = a?.displayName.toLowerCase().replace('•', '')
    const bDisplayName = b?.displayName.toLowerCase().replace('•', '')

    return aDisplayName.localeCompare(bDisplayName)
  })
}
