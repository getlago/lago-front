import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import {
  BillingEntityForIntegrationMapping,
  ItemMappingPerBillingEntity,
} from '~/pages/settings/integrations/common'

export type XeroIntegrationMapItemDrawerProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  billingEntities: Array<BillingEntityForIntegrationMapping>
  itemMappings: ItemMappingPerBillingEntity
}
