import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForAvalaraItemsListQuery,
  InputMaybe,
  MappableTypeEnum,
  useGetBillableMetricsForAvalaraItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'
import { IntegrationItemHeader } from '~/pages/settings/integrations/IntegrationItem'

import { AvalaraIntegrationMapItemDialogRef } from './AvalaraIntegrationMapItemDialog'

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
  avalaraIntegrationMapItemDialogRef: RefObject<AvalaraIntegrationMapItemDialogRef>
}

const AvalaraIntegrationItemsListBillableMetrics = ({
  data,
  fetchMoreBillableMetrics,
  hasError,
  integrationId,
  isLoading,
  avalaraIntegrationMapItemDialogRef,
  searchTerm,
}: AvalaraIntegrationItemsListBillableMetricsProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col">
      <IntegrationItemHeader columnName={translate('text_6630ea71a6c2ef00bc63006e')} />
      <FetchableIntegrationItemList
        integrationId={integrationId}
        data={data?.billableMetrics}
        fetchMore={fetchMoreBillableMetrics}
        hasError={hasError}
        searchTerm={searchTerm}
        isLoading={isLoading}
        integrationMapItemDialogRef={avalaraIntegrationMapItemDialogRef}
        createRoute={CREATE_BILLABLE_METRIC_ROUTE}
        mappableType={MappableTypeEnum.BillableMetric}
        provider="avalara"
      />
    </div>
  )
}

export default AvalaraIntegrationItemsListBillableMetrics
