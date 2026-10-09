import { gql } from '@apollo/client'

import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForNetsuiteItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetBillableMetricsForNetsuiteItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OpenMappableIntegrationMapItemDrawer } from '~/pages/settings/integrations/common'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

gql`
  fragment NetsuiteIntegrationItemsListBillableMetrics on BillableMetric {
    id
    name
    code
    integrationMappings(integrationId: $integrationId) {
      id
      externalId
      externalAccountCode
      externalName
      mappableType
      billingEntityId
    }
  }
`

type NetsuiteIntegrationItemsListBillableMetricsProps = {
  data: GetBillableMetricsForNetsuiteItemsListQuery | undefined
  fetchMoreBillableMetrics: ReturnType<
    typeof useGetBillableMetricsForNetsuiteItemsListLazyQuery
  >[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  openIntegrationMapItemDrawer: OpenMappableIntegrationMapItemDrawer
}

const NetsuiteIntegrationItemsListBillableMetrics = ({
  data,
  fetchMoreBillableMetrics,
  hasError,
  integrationId,
  isLoading,
  openIntegrationMapItemDrawer,
  searchTerm,
}: NetsuiteIntegrationItemsListBillableMetricsProps) => {
  const { translate } = useInternationalization()

  return (
    <FetchableIntegrationItemList
      integrationId={integrationId}
      data={data?.billableMetrics}
      fetchMore={fetchMoreBillableMetrics}
      hasError={hasError}
      searchTerm={searchTerm}
      isLoading={isLoading}
      openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
      createRoute={CREATE_BILLABLE_METRIC_ROUTE}
      mappableType={MappableTypeEnum.BillableMetric}
      provider={IntegrationTypeEnum.Netsuite}
      firstColumnName={translate('text_6630ea71a6c2ef00bc63006e')}
    />
  )
}

export default NetsuiteIntegrationItemsListBillableMetrics
