import { ItemMapping } from '~/pages/settings/integrations/common'
import { IntegrationItemData } from '~/pages/settings/integrations/IntegrationItem'

export const findItemMapping = (
  item: IntegrationItemData,
  billingEntityId: string | null,
): ItemMapping | undefined => {
  if (!item.integrationMappings || item.integrationMappings.length === 0) {
    return undefined
  }

  const itemMapping = item.integrationMappings?.find((mapping) => {
    if ('mappingType' in mapping) {
      return mapping.mappingType === item.mappingType && mapping.billingEntityId === billingEntityId
    }

    if ('mappableType' in mapping) {
      return (
        mapping.mappableType === item.mappingType && mapping.billingEntityId === billingEntityId
      )
    }

    return false
  })

  return itemMapping
}
