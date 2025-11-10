import { MappingTypeEnum } from '~/generated/graphql'
import {
  ItemMappingForCurrenciesMapping,
  ItemMappingPerBillingEntity,
} from '~/pages/settings/integrations/common/types'

import { IntegrationItemData } from './types'

export const isDefaultItemMappingForCurrenciesMapping = (
  item: IntegrationItemData,
  itemMapping: ItemMappingPerBillingEntity,
): itemMapping is ItemMappingPerBillingEntity & { default: ItemMappingForCurrenciesMapping } => {
  return (
    item.mappingType === MappingTypeEnum.Currencies &&
    !!itemMapping &&
    'default' in itemMapping &&
    typeof itemMapping.default === 'object' &&
    'currencies' in itemMapping.default
  )
}
