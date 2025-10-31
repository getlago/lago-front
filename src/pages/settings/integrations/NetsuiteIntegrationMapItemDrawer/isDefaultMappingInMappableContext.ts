import type { ItemMappingForMappable } from '~/pages/settings/integrations/common'

import type { NetsuiteIntegrationMapItemDrawerProps } from './types'

export const isDefaultMappingInMappableContext = (
  dataToTest: NetsuiteIntegrationMapItemDrawerProps | undefined,
): dataToTest is NetsuiteIntegrationMapItemDrawerProps & {
  itemMappings: { default: ItemMappingForMappable }
} => {
  if (!dataToTest) return false
  if (!dataToTest.itemMappings) return false
  if (!dataToTest.itemMappings.default) return false
  if (!('lagoMappableId' in dataToTest.itemMappings.default)) return false
  if (!('lagoMappableName' in dataToTest.itemMappings.default)) return false

  return true
}
