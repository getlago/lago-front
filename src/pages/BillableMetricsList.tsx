import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  DeleteBillableMetricDialog,
  DeleteBillableMetricDialogRef,
} from '~/components/billableMetrics/DeleteBillableMetricDialog'
import { ButtonLink, InfiniteScroll, Table, Typography } from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { CREATE_BILLABLE_METRIC_ROUTE, UPDATE_BILLABLE_METRIC_ROUTE } from '~/core/router'
import { useBillableMetricsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader, theme } from '~/styles'

gql`
  fragment BillableMetricItem on BillableMetric {
    id
    name
    code
    createdAt
  }

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
`

const BillableMetricsList = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
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

  return (
    <>
      <Header withSide>
        <Typography variant="bodyHl" color="textSecondary">
          {translate('text_623b497ad05b960101be3438')}
        </Typography>
        <HeaderRigthBlock>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63ba9ee977a67c9693f50aea')}
          />
          {hasPermissions(['billableMetricsCreate']) && (
            <ButtonLink data-test="create-bm" type="button" to={CREATE_BILLABLE_METRIC_ROUTE}>
              {translate('text_623b497ad05b960101be343a')}
            </ButtonLink>
          )}
        </HeaderRigthBlock>
      </Header>

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
        <Table
          name="billable-metrics-list"
          data={list}
          containerSize={{
            default: 16,
            md: 48,
          }}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          onRowAction={({ id }) =>
            navigate(generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { billableMetricId: id }))
          }
          columns={[
            {
              key: 'name',
              title: translate('text_623b497ad05b960101be343e'),
              minWidth: 200,
              maxSpace: true,
              content: ({ name, code }) => (
                <>
                  <Typography color="textSecondary" variant="bodyHl" noWrap>
                    {name}
                  </Typography>
                  <Typography variant="caption" noWrap>
                    {code}
                  </Typography>
                </>
              ),
            },
            {
              key: 'createdAt',
              title: translate('text_623b497ad05b960101be3440'),
              minWidth: 140,
              content: ({ createdAt }) => (
                <Typography variant="body" color="grey600">
                  {formatTimeOrgaTZ(createdAt)}
                </Typography>
              ),
            },
          ]}
          actionColumnTooltip={() => translate('text_6256de3bba111e00b3bfa51b')}
          actionColumn={({ id }) => {
            return [
              hasPermissions(['billableMetricsUpdate'])
                ? {
                    startIcon: 'pen',
                    title: translate('text_6256de3bba111e00b3bfa531'),
                    onAction: () =>
                      navigate(
                        generatePath(UPDATE_BILLABLE_METRIC_ROUTE, { billableMetricId: id }),
                      ),
                  }
                : null,
              hasPermissions(['billableMetricsDelete'])
                ? {
                    startIcon: 'trash',
                    title: translate('text_6256de3bba111e00b3bfa533'),
                    onAction: () => deleteDialogRef.current?.openDialog(id),
                  }
                : null,
            ]
          }}
          placeholder={{
            errorState: !!variables?.searchTerm
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_623b53fea66c76017eaebb76'),
                  buttonTitle: translate('text_623b53fea66c76017eaebb7a'),
                  buttonAction: () => location.reload(),
                  buttonVariant: 'primary',
                },
            emptyState: !!variables?.searchTerm
              ? {
                  title: translate('text_63bab307a61c62af497e05a2'),
                  subtitle: translate('text_63bab307a61c62af497e05a4'),
                }
              : {
                  title: translate('text_623b53fea66c76017eaebb70'),
                  subtitle: translate('text_623b53fea66c76017eaebb78'),
                  buttonTitle: translate('text_623b53fea66c76017eaebb7c'),
                  buttonAction: () => navigate(CREATE_BILLABLE_METRIC_ROUTE),
                  buttonVariant: 'primary',
                },
          }}
        />
      </InfiniteScroll>

      <DeleteBillableMetricDialog ref={deleteDialogRef} />
    </>
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

export default BillableMetricsList
