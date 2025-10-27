import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { RefObject } from 'react'

import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForXeroItemsListQuery,
  InputMaybe,
  MappableTypeEnum,
  useGetBillableMetricsForXeroItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'
import { IntegrationItemHeader } from '~/pages/settings/integrations/IntegrationItem'

import { XeroIntegrationMapItemDialogRef } from './XeroIntegrationMapItemDialog'

gql`
  fragment XeroIntegrationItemsListBillableMetrics on BillableMetric {
    id
    name
    code
    integrationMappings(integrationId: $integrationId) {
      id
      externalId
      externalAccountCode
      externalName
      mappableType
    }
  }
`

type XeroIntegrationItemsListBillableMetricsProps = {
  data: GetBillableMetricsForXeroItemsListQuery | undefined
  fetchMoreBillableMetrics: ReturnType<
    typeof useGetBillableMetricsForXeroItemsListLazyQuery
  >[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  xeroIntegrationMapItemDialogRef: RefObject<XeroIntegrationMapItemDialogRef>
}

const XeroIntegrationItemsListBillableMetrics = ({
  data,
  fetchMoreBillableMetrics,
  hasError,
  integrationId,
  isLoading,
  xeroIntegrationMapItemDialogRef,
  searchTerm,
}: XeroIntegrationItemsListBillableMetricsProps) => {
  const { translate } = useInternationalization()

  return (
    <Stack>
      <IntegrationItemHeader columnName={translate('text_6630ea71a6c2ef00bc63006e')} />
      <FetchableIntegrationItemList
        integrationId={integrationId}
        data={data?.billableMetrics}
        fetchMore={fetchMoreBillableMetrics}
        hasError={hasError}
        searchTerm={searchTerm}
        isLoading={isLoading}
        integrationMapItemDialogRef={xeroIntegrationMapItemDialogRef}
        createRoute={CREATE_BILLABLE_METRIC_ROUTE}
        mappableType={MappableTypeEnum.BillableMetric}
        provider="xero"
      />
    </Stack>
  )
}

export default XeroIntegrationItemsListBillableMetrics
