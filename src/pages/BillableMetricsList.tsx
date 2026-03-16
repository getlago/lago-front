import { gql } from '@apollo/client'
import { Icon, tw } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  DeleteBillableMetricDialog,
  DeleteBillableMetricDialogRef,
} from '~/components/billableMetrics/DeleteBillableMetricDialog'
import { Avatar } from '~/components/designSystem/Avatar'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table } from '~/components/designSystem/Table/Table'
import { ActionItem } from '~/components/designSystem/Table/types'
import { Typography } from '~/components/designSystem/Typography'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SearchInput } from '~/components/SearchInput'
import { BillableMetricDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  BILLABLE_METRIC_DETAILS_ROUTE,
  CREATE_BILLABLE_METRIC_ROUTE,
  UPDATE_BILLABLE_METRIC_ROUTE,
} from '~/core/router'
import { useBillableMetricsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

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
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
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

  const canUpdateBillableMetrics = hasPermissions(['billableMetricsUpdate'])
  const canDeleteBillableMetrics = hasPermissions(['billableMetricsDelete'])

  return (
    <>
      <MainHeader.Configure
        entity={{ viewName: translate('text_623b497ad05b960101be3438') }}
        actions={[
          ...(hasPermissions(['billableMetricsCreate'])
            ? [
                {
                  type: 'action' as const,
                  label: translate('text_623b497ad05b960101be343a'),
                  variant: 'primary' as const,
                  onClick: () => navigate(CREATE_BILLABLE_METRIC_ROUTE),
                  dataTest: 'create-bm',
                },
              ]
            : []),
        ]}
        filtersSection={
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63ba9ee977a67c9693f50aea')}
          />
        }
      />

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
          containerClassName={tw('h-[calc(100%-theme(space.nav))] border-t border-grey-300')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          onRowActionLink={({ id }) =>
            generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
              billableMetricId: id,
              tab: BillableMetricDetailsTabsOptionsEnum.overview,
            })
          }
          columns={[
            {
              key: 'name',
              title: translate('text_623b497ad05b960101be343e'),
              minWidth: 200,
              maxSpace: true,
              content: ({ name, code }) => (
                <div className="flex items-center gap-3">
                  <Avatar size="big" variant="connector">
                    <Icon name="pulse" color="dark" />
                  </Avatar>
                  <div>
                    <Typography color="textSecondary" variant="bodyHl" noWrap>
                      {name}
                    </Typography>
                    <Typography variant="caption" noWrap>
                      {code}
                    </Typography>
                  </div>
                </div>
              ),
            },
            {
              key: 'createdAt',
              title: translate('text_623b497ad05b960101be3440'),
              minWidth: 140,
              content: ({ createdAt }) => (
                <Typography variant="body" color="grey600">
                  {intlFormatDateTimeOrgaTZ(createdAt).date}
                </Typography>
              ),
            },
          ]}
          actionColumnTooltip={
            canUpdateBillableMetrics && canDeleteBillableMetrics
              ? () => translate('text_6256de3bba111e00b3bfa51b')
              : undefined
          }
          actionColumn={(billableMetric) => {
            const { id } = billableMetric
            const actions: ActionItem<typeof billableMetric>[] = []

            if (canUpdateBillableMetrics) {
              actions.push({
                startIcon: 'pen',
                title: translate('text_6256de3bba111e00b3bfa531'),
                onAction: () =>
                  navigate(
                    generatePath(UPDATE_BILLABLE_METRIC_ROUTE, {
                      billableMetricId: id,
                    }),
                  ),
              })
            }

            if (canDeleteBillableMetrics) {
              actions.push({
                startIcon: 'trash',
                title: translate('text_6256de3bba111e00b3bfa533'),
                onAction: () => {
                  deleteDialogRef.current?.openDialog({ billableMetricId: id })
                },
              })
            }

            return actions
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

export default BillableMetricsList
