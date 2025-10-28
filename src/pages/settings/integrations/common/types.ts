import { RefObject } from 'react'

import { AnrokIntegrationMapItemDialogRef } from '~/components/settings/integrations/AnrokIntegrationMapItemDialog'
import { AvalaraIntegrationMapItemDialogRef } from '~/components/settings/integrations/AvalaraIntegrationMapItemDialog'
import { NetsuiteIntegrationMapItemDialogRef } from '~/components/settings/integrations/NetsuiteIntegrationMapItemDialog'
import { XeroIntegrationMapItemDialogRef } from '~/components/settings/integrations/XeroIntegrationMapItemDialog'
import { PickEnum } from '~/core/types/pickEnum.type'
import {
  AnrokIntegrationItemsListDefaultFragment,
  AvalaraIntegrationItemsListDefaultFragment,
  IntegrationTypeEnum,
  NetsuiteIntegrationItemsListDefaultFragment,
  XeroIntegrationItemsListDefaultFragment,
} from '~/generated/graphql'
import { FetchableIntegrationItemsListData } from '~/pages/settings/integrations/FetchableIntegrationItemList/types'

export type MappableIntegrationProvider = PickEnum<
  IntegrationTypeEnum,
  | IntegrationTypeEnum.Anrok
  | IntegrationTypeEnum.Avalara
  | IntegrationTypeEnum.Netsuite
  | IntegrationTypeEnum.Xero
>

export type ItemMapping =
  | NonNullable<
      NonNullable<FetchableIntegrationItemsListData>['collection'][0]['integrationMappings']
    >[0]
  | AnrokIntegrationItemsListDefaultFragment
  | NetsuiteIntegrationItemsListDefaultFragment
  | AvalaraIntegrationItemsListDefaultFragment
  | XeroIntegrationItemsListDefaultFragment

export type MappableIntegrationMapItemDialogRef = RefObject<
  | NetsuiteIntegrationMapItemDialogRef
  | AnrokIntegrationMapItemDialogRef
  | AvalaraIntegrationMapItemDialogRef
  | XeroIntegrationMapItemDialogRef
>
