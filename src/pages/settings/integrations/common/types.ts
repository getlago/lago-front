import { RefObject } from 'react'

import { AnrokIntegrationMapItemDrawerRef } from '~/components/settings/integrations/AnrokIntegrationMapItemDrawer'
import { AvalaraIntegrationMapItemDrawerRef } from '~/components/settings/integrations/AvalaraIntegrationMapItemDrawer'
import { NetsuiteIntegrationMapItemDrawerRef } from '~/components/settings/integrations/NetsuiteIntegrationMapItemDrawer'
import { XeroIntegrationMapItemDrawerRef } from '~/components/settings/integrations/XeroIntegrationMapItemDrawer'
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

export type MappableIntegrationMapItemDrawerRef = RefObject<
  | NetsuiteIntegrationMapItemDrawerRef
  | AnrokIntegrationMapItemDrawerRef
  | AvalaraIntegrationMapItemDrawerRef
  | XeroIntegrationMapItemDrawerRef
>
