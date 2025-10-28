import { IconName } from 'lago-design-system'

import {
  AnrokIntegrationItemsListDefaultFragment,
  AvalaraIntegrationItemsListDefaultFragment,
  MappingTypeEnum,
  NetsuiteIntegrationItemsListDefaultFragment,
  XeroIntegrationItemsListDefaultFragment,
} from '~/generated/graphql'
import {
  MappableIntegrationMapItemDialogRef,
  MappableIntegrationProvider,
} from '~/pages/settings/integrations/common'

export type IntegrationItem = {
  id: string
  icon: IconName
  label: string
  description: string
  mappingType: MappingTypeEnum
}

export type IntegrationItemData = IntegrationItem & {
  id: string
}

export type IntegrationItemDefaultItems =
  | Array<
      | AnrokIntegrationItemsListDefaultFragment
      | NetsuiteIntegrationItemsListDefaultFragment
      | AvalaraIntegrationItemsListDefaultFragment
      | XeroIntegrationItemsListDefaultFragment
    >
  | undefined

export type IntegrationItemsTableProps = {
  integrationId: string
  defaultItems: IntegrationItemDefaultItems
  items: Array<IntegrationItem>
  provider: MappableIntegrationProvider
  integrationMapItemDialogRef: MappableIntegrationMapItemDialogRef
  firstColumnName?: string
}
