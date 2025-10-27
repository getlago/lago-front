import { RefObject } from 'react'

import { AnrokIntegrationMapItemDialogRef } from '~/components/settings/integrations/AnrokIntegrationMapItemDialog'
import { AvalaraIntegrationMapItemDialogRef } from '~/components/settings/integrations/AvalaraIntegrationMapItemDialog'
import { NetsuiteIntegrationMapItemDialogRef } from '~/components/settings/integrations/NetsuiteIntegrationMapItemDialog'
import { XeroIntegrationMapItemDialogRef } from '~/components/settings/integrations/XeroIntegrationMapItemDialog'
import { PickEnum } from '~/core/types/pickEnum.type'
import {
  GetAddOnsForAnrokItemsListQuery,
  GetAddOnsForAvalaraItemsListQuery,
  GetAddOnsForNetsuiteItemsListQuery,
  GetAddOnsForXeroItemsListQuery,
  GetBillableMetricsForAnrokItemsListQuery,
  GetBillableMetricsForAvalaraItemsListQuery,
  GetBillableMetricsForNetsuiteItemsListQuery,
  GetBillableMetricsForXeroItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetAddOnsForAnrokItemsListLazyQuery,
  useGetAddOnsForAvalaraItemsListLazyQuery,
  useGetAddOnsForNetsuiteItemsListLazyQuery,
  useGetAddOnsForXeroItemsListLazyQuery,
  useGetBillableMetricsForAnrokItemsListLazyQuery,
  useGetBillableMetricsForAvalaraItemsListLazyQuery,
  useGetBillableMetricsForNetsuiteItemsListLazyQuery,
  useGetBillableMetricsForXeroItemsListLazyQuery,
} from '~/generated/graphql'

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

export type FetchMoreFunction = ReturnType<
  | typeof useGetAddOnsForNetsuiteItemsListLazyQuery
  | typeof useGetBillableMetricsForNetsuiteItemsListLazyQuery
  | typeof useGetAddOnsForAnrokItemsListLazyQuery
  | typeof useGetBillableMetricsForAnrokItemsListLazyQuery
  | typeof useGetAddOnsForAvalaraItemsListLazyQuery
  | typeof useGetBillableMetricsForAvalaraItemsListLazyQuery
  | typeof useGetAddOnsForXeroItemsListLazyQuery
  | typeof useGetBillableMetricsForXeroItemsListLazyQuery
>[1]['fetchMore']

export type FetchableIntegrationMapItemDialogRef = RefObject<
  | NetsuiteIntegrationMapItemDialogRef
  | AnrokIntegrationMapItemDialogRef
  | AvalaraIntegrationMapItemDialogRef
  | XeroIntegrationMapItemDialogRef
>

type FetchableIntegrationProvider = PickEnum<
  IntegrationTypeEnum,
  | IntegrationTypeEnum.Anrok
  | IntegrationTypeEnum.Avalara
  | IntegrationTypeEnum.Netsuite
  | IntegrationTypeEnum.Xero
>

export type FetchIntegrationItemsListProps = {
  integrationId: string
  data: FetchableIntegrationItemsListData
  fetchMore: FetchMoreFunction
  hasError: boolean
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  integrationMapItemDialogRef: FetchableIntegrationMapItemDialogRef
  createRoute: string
  mappableType: MappableTypeEnum
  provider: FetchableIntegrationProvider
}

export type FetchableIntegrationItemErrorProps = {
  hasSearchTerm: boolean
}

export type FetchableIntegrationItemEmptyProps = {
  hasSearchTerm: boolean
  type: MappableTypeEnum
  createRoute: string
}
