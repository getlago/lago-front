import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import type {
  BillingEntityForIntegrationMapping,
  ItemMappingPerBillingEntity,
} from '~/pages/settings/integrations/common'

export type NetsuiteIntegrationMapItemDrawerProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  billingEntities: Array<BillingEntityForIntegrationMapping>
  itemMappings: ItemMappingPerBillingEntity
}
