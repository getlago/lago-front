import { gql } from '@apollo/client'

import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForAvalaraItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetBillableMetricsForAvalaraItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { OpenMappableIntegrationMapItemDrawer } from '~/pages/settings/integrations/common'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

gql`
  fragment AvalaraIntegrationItemsListBillableMetrics on BillableMetric {
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

type AvalaraIntegrationItemsListBillableMetricsProps = {
  data: GetBillableMetricsForAvalaraItemsListQuery | undefined
  fetchMoreBillableMetrics: ReturnType<
    typeof useGetBillableMetricsForAvalaraItemsListLazyQuery
  >[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  openIntegrationMapItemDrawer: OpenMappableIntegrationMapItemDrawer
}

const AvalaraIntegrationItemsListBillableMetrics = ({
  data,
  fetchMoreBillableMetrics,
  hasError,
  integrationId,
  isLoading,
  openIntegrationMapItemDrawer,
  searchTerm,
}: AvalaraIntegrationItemsListBillableMetricsProps) => {
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
      provider={IntegrationTypeEnum.Avalara}
      firstColumnName={translate('text_6630ea71a6c2ef00bc63006e')}
    />
  )
}

export default AvalaraIntegrationItemsListBillableMetrics
