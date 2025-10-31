import type { ItemMappingForTaxMapping } from '~/pages/settings/integrations/common'

import type { NetsuiteIntegrationMapItemDrawerProps } from './types'

export const isDefaultMappingInTaxContext = (
  dataToTest: NetsuiteIntegrationMapItemDrawerProps | undefined,
): dataToTest is NetsuiteIntegrationMapItemDrawerProps & {
  itemMappings: { default: ItemMappingForTaxMapping }
} => {
  if (!dataToTest) return false
  if (!dataToTest.itemMappings) return false
  if (!dataToTest.itemMappings.default) return false
  if (!('taxCode' in dataToTest.itemMappings.default)) return false
  if (!('taxNexus' in dataToTest.itemMappings.default)) return false
  if (!('taxType' in dataToTest.itemMappings.default)) return false

  return true
}
