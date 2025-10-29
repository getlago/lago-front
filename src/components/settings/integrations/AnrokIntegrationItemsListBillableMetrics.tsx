import { gql } from '@apollo/client'
import { RefObject } from 'react'

import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForAnrokItemsListQuery,
  InputMaybe,
  IntegrationTypeEnum,
  MappableTypeEnum,
  useGetBillableMetricsForAnrokItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import FetchableIntegrationItemList from '~/pages/settings/integrations/FetchableIntegrationItemList'

import { AnrokIntegrationMapItemDialogRef } from './AnrokIntegrationMapItemDialog'

gql`
  fragment AnrokIntegrationItemsListBillableMetrics on BillableMetric {
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

type AnrokIntegrationItemsListBillableMetricsProps = {
  data: GetBillableMetricsForAnrokItemsListQuery | undefined
  fetchMoreBillableMetrics: ReturnType<
    typeof useGetBillableMetricsForAnrokItemsListLazyQuery
  >[1]['fetchMore']
  hasError: boolean
  integrationId: string
  searchTerm: InputMaybe<string> | undefined
  isLoading: boolean
  anrokIntegrationMapItemDialogRef: RefObject<AnrokIntegrationMapItemDialogRef>
}

const AnrokIntegrationItemsListBillableMetrics = ({
  data,
  fetchMoreBillableMetrics,
  hasError,
  integrationId,
  isLoading,
  anrokIntegrationMapItemDialogRef,
  searchTerm,
}: AnrokIntegrationItemsListBillableMetricsProps) => {
  const { translate } = useInternationalization()

  return (
    <FetchableIntegrationItemList
      integrationId={integrationId}
      data={data?.billableMetrics}
      fetchMore={fetchMoreBillableMetrics}
      hasError={hasError}
      searchTerm={searchTerm}
      isLoading={isLoading}
      integrationMapItemDialogRef={anrokIntegrationMapItemDialogRef}
      createRoute={CREATE_BILLABLE_METRIC_ROUTE}
      mappableType={MappableTypeEnum.BillableMetric}
      provider={IntegrationTypeEnum.Anrok}
      firstColumnName={translate('text_6630ea71a6c2ef00bc63006e')}
    />
  )
}

export default AnrokIntegrationItemsListBillableMetrics
