import { GraphQLFormattedError } from 'graphql'
import { RefObject } from 'react'

import { AvalaraIntegrationMapItemDrawerRef } from '~/components/settings/integrations/AvalaraIntegrationMapItemDrawer'
import { XeroIntegrationMapItemDrawerRef } from '~/components/settings/integrations/XeroIntegrationMapItemDrawer'
import { PickEnum } from '~/core/types/pickEnum.type'
import {
  AnrokIntegrationItemsListDefaultFragment,
  AvalaraIntegrationItemsListDefaultFragment,
  GetAddOnsForAnrokItemsListQuery,
  GetAddOnsForAvalaraItemsListQuery,
  GetAddOnsForNetsuiteItemsListQuery,
  GetAddOnsForXeroItemsListQuery,
  GetBillableMetricsForAnrokItemsListQuery,
  GetBillableMetricsForAvalaraItemsListQuery,
  GetBillableMetricsForNetsuiteItemsListQuery,
  GetBillableMetricsForXeroItemsListQuery,
  IntegrationTypeEnum,
  NetsuiteIntegrationItemsListDefaultFragment,
  XeroIntegrationItemsListDefaultFragment,
} from '~/generated/graphql'
import { AnrokIntegrationMapItemDrawerRef } from '~/pages/settings/integrations/AnrokIntegrationMapItemDrawer'
import { NetsuiteIntegrationMapItemDrawerRef } from '~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer'

export type FetchableIntegrationItemsListData =
  | GetAddOnsForNetsuiteItemsListQuery['addOns']
  | GetBillableMetricsForNetsuiteItemsListQuery['billableMetrics']
  | GetAddOnsForAnrokItemsListQuery['addOns']
  | GetBillableMetricsForAnrokItemsListQuery['billableMetrics']
  | GetAddOnsForAvalaraItemsListQuery['addOns']
  | GetBillableMetricsForAvalaraItemsListQuery['billableMetrics']
  | GetAddOnsForXeroItemsListQuery['addOns']
  | GetBillableMetricsForXeroItemsListQuery['billableMetrics']
  | undefined

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

export type BillingEntityForIntegrationMapping = {
  id: string | null
  key: string
  name: string
}

export type ItemMappingForTaxMapping = {
  itemId: string | null
  itemExternalId: string | null
  itemExternalName?: string
  itemExternalCode?: string
  taxCode: string | null
  taxNexus: string | null
  taxType: string | null
}

export type ItemMappingForNonTaxMapping = {
  itemId: string | null
  itemExternalId: string | null
  itemExternalName?: string
  itemExternalCode?: string
}

export type ItemMappingForMappable = {
  itemId: string | null
  itemExternalId: string | null
  itemExternalName?: string
  itemExternalCode?: string
  lagoMappableId: string
  lagoMappableName: string
}

export type ItemMappingPerBillingEntity = Record<
  'default' | string,
  ItemMappingForTaxMapping | ItemMappingForNonTaxMapping | ItemMappingForMappable
>

export type CreateUpdateDeleteSuccessAnswer =
  | { success: true }
  | { success: false; errors: readonly GraphQLFormattedError[] }
  | { success: false; reasons: readonly string[] }
