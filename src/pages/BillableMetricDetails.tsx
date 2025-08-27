import { gql } from '@apollo/client'
import { Button, Popper, Skeleton, Typography } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { BillableMetricDetailsActivityLogs } from '~/components/billableMetrics/BillableMetricDetailsActivityLogs'
import { BillableMetricDetailsOverview } from '~/components/billableMetrics/BillableMetricDetailsOverview'
import {
  DeleteBillableMetricDialog,
  DeleteBillableMetricDialogRef,
} from '~/components/billableMetrics/DeleteBillableMetricDialog'
import { NavigationTab } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast } from '~/core/apolloClient'
import { BillableMetricDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import {
  BILLABLE_METRIC_DETAILS_ROUTE,
  BILLABLE_METRICS_ROUTE,
  DUPLICATE_BILLABLE_METRIC_ROUTE,
  UPDATE_BILLABLE_METRIC_ROUTE,
} from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useGetBillableMetricForHeaderDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  query getBillableMetricForHeaderDetails($id: ID!) {
    billableMetric(id: $id) {
      id
      name
      code
    }
  }
`

const BillableMetricDetails = () => {
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { billableMetricId } = useParams()
  const { isPremium } = useCurrentUser()

  const deleteBillableMetricDialogRef = useRef<DeleteBillableMetricDialogRef>(null)

  const { data, loading } = useGetBillableMetricForHeaderDetailsQuery({
    variables: {
      id: billableMetricId as string,
    },
    skip: !billableMetricId,
  })

  const billableMetric = data?.billableMetric

  const shouldShowActions = hasPermissions([
    'billableMetricsCreate',
    'billableMetricsUpdate',
    'billableMetricsDelete',
  ])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => navigate(generatePath(BILLABLE_METRICS_ROUTE))}
          />
          {loading && !billableMetric ? (
            <Skeleton variant="text" className="w-50" />
          ) : (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {billableMetric?.name}
            </Typography>
          )}
        </PageHeader.Group>

        {shouldShowActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(
                      generatePath(UPDATE_BILLABLE_METRIC_ROUTE, {
                        billableMetricId: billableMetricId as string,
                      }),
                    )
                    closePopper()
                  }}
                >
                  {translate('text_1748440972215b2bo0i27zg4')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    copyToClipboard(billableMetricId as string)
                    addToast({
                      message: translate('text_1748441335808ev2ygtkq66n'),
                      severity: 'success',
                    })
                  }}
                >
                  {translate('text_1748440972215htw8rqfn3tu')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(
                      generatePath(DUPLICATE_BILLABLE_METRIC_ROUTE, {
                        billableMetricId: billableMetricId as string,
                      }),
                    )
                  }}
                >
                  {translate('text_1748447578763m2i8k8djc4r')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    deleteBillableMetricDialogRef.current?.openDialog({
                      billableMetricId: billableMetricId as string,
                      callback: () => {
                        navigate(generatePath(BILLABLE_METRICS_ROUTE))
                      },
                    })
                    closePopper()
                  }}
                >
                  {translate('text_1748440972215btigjp0mowx')}
                </Button>
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={loading}
        icon="board"
        title={billableMetric?.name || ''}
        description={billableMetric?.code || ''}
      />

      <NavigationTab
        className="px-4 md:px-12"
        loading={loading}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
              billableMetricId: billableMetricId as string,
              tab: BillableMetricDetailsTabsOptionsEnum.overview,
            }),

            component: (
              <DetailsPage.Container>
                <BillableMetricDetailsOverview />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(BILLABLE_METRIC_DETAILS_ROUTE, {
              billableMetricId: billableMetricId as string,
              tab: BillableMetricDetailsTabsOptionsEnum.activityLogs,
            }),
            component: (
              <div className="px-12 py-6">
                <BillableMetricDetailsActivityLogs billableMetricId={billableMetricId as string} />
              </div>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      <DeleteBillableMetricDialog ref={deleteBillableMetricDialogRef} />
    </>
  )
}

export default BillableMetricDetails
