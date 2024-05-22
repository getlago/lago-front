import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  BillableMetricItem,
  BillableMetricItemSkeleton,
} from '~/components/billableMetrics/BillableMetricItem'
import {
  DeleteBillableMetricDialog,
  DeleteBillableMetricDialogRef,
} from '~/components/billableMetrics/DeleteBillableMetricDialog'
import { ButtonLink, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { SearchInput } from '~/components/SearchInput'
import { CREATE_BILLABLE_METRIC_ROUTE, UPDATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { BillableMetricItemFragmentDoc, useBillableMetricsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useListKeysNavigation } from '~/hooks/ui/useListKeyNavigation'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { usePermissions } from '~/hooks/usePermissions'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'
import { ListContainer, ListHeader, PageHeader, theme } from '~/styles'

gql`
  query billableMetrics($page: Int, $limit: Int, $searchTerm: String) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        ...BillableMetricItem
      }
    }
  }

  ${BillableMetricItemFragmentDoc}
`

const BillableMetricsList = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const deleteDialogRef = useRef<DeleteBillableMetricDialogRef>(null)
  const [getBillableMetrics, { data, error, loading, fetchMore, variables }] =
    useBillableMetricsLazyQuery({
      variables: { limit: 20 },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'network-only',
      nextFetchPolicy: 'network-only',
    })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getBillableMetrics, loading)
  const list = data?.billableMetrics?.collection || []
  const { onKeyDown } = useListKeysNavigation({
    getElmId: (i) => `billable-metric-item-${i}`,
    navigate: (id) =>
      navigate(generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { billableMetricId: String(id) })),
  })
  let index = -1

  return (
    <div role="grid" tabIndex={-1} onKeyDown={onKeyDown}>
      <Header $withSide>
        <Typography variant="bodyHl" color="textSecondary">
          {translate('text_623b497ad05b960101be3438')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63ba9ee977a67c9693f50aea')}
          />
          {hasPermissions(['billableMetricsCreate']) && (
            <StyledButton data-test="create-bm" type="button" to={CREATE_BILLABLE_METRIC_ROUTE}>
              {translate('text_623b497ad05b960101be343a')}
            </StyledButton>
          )}
        </HeaderRigthBlock>
      </Header>

      <ListContainer>
        <ListHead $withActions>
          <Typography color="disabled" variant="bodyHl">
            {translate('text_623b497ad05b960101be343e')}
          </Typography>
          <CellSmall align="right" color="disabled" variant="bodyHl">
            {translate('text_623b497ad05b960101be3440')}
          </CellSmall>
        </ListHead>
        {!!isLoading && variables?.searchTerm ? (
          <>
            {isLoading &&
              [0, 1, 2].map((i) => (
                <BillableMetricItemSkeleton key={`billable-metric-item-skeleton-${i}`} />
              ))}
          </>
        ) : !isLoading && !!error ? (
          <>
            {!!variables?.searchTerm ? (
              <GenericPlaceholder
                title={translate('text_623b53fea66c76017eaebb6e')}
                subtitle={translate('text_63bab307a61c62af497e0599')}
                image={<ErrorImage width="136" height="104" />}
              />
            ) : (
              <GenericPlaceholder
                title={translate('text_623b53fea66c76017eaebb6e')}
                subtitle={translate('text_623b53fea66c76017eaebb76')}
                buttonTitle={translate('text_623b53fea66c76017eaebb7a')}
                buttonVariant="primary"
                buttonAction={() => location.reload()}
                image={<ErrorImage width="136" height="104" />}
              />
            )}
          </>
        ) : !isLoading && (!list || !list.length) ? (
          <>
            {!!variables?.searchTerm ? (
              <GenericPlaceholder
                title={translate('text_63bab307a61c62af497e05a2')}
                subtitle={translate('text_63bab307a61c62af497e05a4')}
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
                fetchMore({
                  variables: { page: currentPage + 1 },
                })
            }}
          >
            {!!list &&
              list.map((billableMetric) => {
                index += 1

                return (
                  <BillableMetricItem
                    key={billableMetric.id}
                    billableMetric={billableMetric}
                    deleteDialogRef={deleteDialogRef}
                    navigationProps={{
                      id: `billable-metric-item-${index}`,
                      'data-id': billableMetric.id,
                    }}
                  />
                )
              })}
            {isLoading &&
              [0, 1, 2].map((i) => (
                <BillableMetricItemSkeleton key={`billable-metric-item-skeleton-${i}`} />
              ))}
          </InfiniteScroll>
        )}
      </ListContainer>

      <DeleteBillableMetricDialog ref={deleteDialogRef} />
    </div>
  )
}

const Header = styled(PageHeader)`
  > * {
    white-space: pre;

    &:first-child {
      margin-right: ${theme.spacing(4)};
    }
  }
`

const HeaderRigthBlock = styled.div`
  display: flex;
  align-items: center;

  > :first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const ListHead = styled(ListHeader)`
  > *:first-child {
    flex: 1;
  }
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const CellSmall = styled(Typography)`
  width: 112px;
`

const StyledButton = styled(ButtonLink)`
  min-width: 179px;
`

export default BillableMetricsList
