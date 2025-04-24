import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'

import { InfiniteScroll } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { CREATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import {
  GetBillableMetricsForAvalaraItemsListQuery,
  InputMaybe,
  MappableTypeEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AvalaraIntegrationMapItemDialogRef } from './AvalaraIntegrationMapItemDialog'
import IntegrationItemHeader from './IntegrationItemHeader'
import IntegrationItemLine from './IntegrationItemLine'

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
  fetchMoreBillableMetrics: Function
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
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const billableMetrics = data?.billableMetrics?.collection || []

  return (
    <div className="flex flex-col">
      <IntegrationItemHeader columnName={translate('text_6630ea71a6c2ef00bc63006e')} />
      {!!isLoading && !billableMetrics.length && searchTerm ? (
        <>
          {[0, 1, 2].map((i) => (
            <IntegrationItemLine
              key={`billable-metric-item-skeleton-${i}`}
              icon="pulse"
              label={''}
              description={''}
              loading={true}
            />
          ))}
        </>
      ) : !isLoading && !!hasError ? (
        <>
          {!!searchTerm ? (
            <GenericPlaceholder
              title={translate('text_623b53fea66c76017eaebb6e')}
              subtitle={translate('text_63bab307a61c62af497e0599')}
              image={<ErrorImage width="136" height="104" />}
            />
          ) : (
            <GenericPlaceholder
              title={translate('text_629728388c4d2300e2d380d5')}
              subtitle={translate('text_629728388c4d2300e2d380eb')}
              buttonTitle={translate('text_629728388c4d2300e2d38110')}
              buttonVariant="primary"
              buttonAction={() => location.reload()}
              image={<ErrorImage width="136" height="104" />}
            />
          )}
        </>
      ) : !isLoading && (!billableMetrics || !billableMetrics.length) ? (
        <>
          {!!searchTerm ? (
            <GenericPlaceholder
              title={translate('text_63bab307a61c62af497e05a2')}
              subtitle={translate('text_63bee4e10e2d53912bfe4da7')}
              image={<EmptyImage width="136" height="104" />}
            />
          ) : (
            <GenericPlaceholder
              title={translate('text_623b53fea66c76017eaebb70')}
              subtitle={translate('text_623b53fea66c76017eaebb78')}
              buttonTitle={translate('text_623b53fea66c76017eaebb7c')}
              buttonVariant="primary"
              buttonAction={() => navigate(CREATE_BILLABLE_METRIC_ROUTE)}
              image={<EmptyImage width="136" height="104" />}
            />
          )}
        </>
      ) : (
        <InfiniteScroll
          onBottom={() => {
            const { currentPage = 0, totalPages = 0 } = data?.billableMetrics?.metadata || {}

            currentPage < totalPages &&
              !isLoading &&
              fetchMoreBillableMetrics({
                variables: { page: currentPage + 1 },
              })
          }}
        >
          <>
            {!!billableMetrics.length &&
              billableMetrics.map((billableMetric) => {
                const billableMetricMapping = billableMetric.integrationMappings?.find(
                  (mapping) => mapping.mappableType === MappableTypeEnum.BillableMetric,
                )

                return (
                  <IntegrationItemLine
                    key={`billableMetric-item-${billableMetric.id}`}
                    icon="pulse"
                    label={billableMetric.name}
                    description={billableMetric.code}
                    loading={false}
                    onMappingClick={() => {
                      avalaraIntegrationMapItemDialogRef.current?.openDialog({
                        integrationId,
                        type: MappableTypeEnum.BillableMetric,
                        itemId: billableMetricMapping?.id,
                        itemExternalId: billableMetricMapping?.externalId,
                        itemExternalName: billableMetricMapping?.externalName || undefined,
                        lagoMappableId: billableMetric.id,
                        lagoMappableName: billableMetric.name,
                      })
                    }}
                    mappingInfos={
                      !!billableMetricMapping?.id
                        ? {
                            id: billableMetricMapping.externalId,
                            name: billableMetricMapping.externalName || '',
                          }
                        : undefined
                    }
                  />
                )
              })}
            {isLoading &&
              [0, 1, 2].map((i) => (
                <IntegrationItemLine
                  key={`billable-metric-item-skeleton-${i}`}
                  icon="pulse"
                  label={''}
                  description={''}
                  loading={true}
                />
              ))}
          </>
        </InfiniteScroll>
      )}
    </div>
  )
}

export default AvalaraIntegrationItemsListBillableMetrics
