import { FC, RefObject } from 'react'
import { generatePath } from 'react-router-dom'

import { InfiniteScroll, Table, Typography } from '~/components/designSystem'
import { ACTIVITY_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ListSectionRef } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { ActivityLogsQueryResult } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

interface ActivityLogTableProps {
  getActivityLogsResult: ActivityLogsQueryResult
  logListRef: RefObject<ListSectionRef>
}

export const ActivityLogTable: FC<ActivityLogTableProps> = ({
  getActivityLogsResult,
  logListRef,
}) => {
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  const { data, error, loading, fetchMore, refetch } = getActivityLogsResult

  return (
    <InfiniteScroll
      mode="element"
      onBottom={async () => {
        const { currentPage = 0, totalPages = 0 } = data?.activityLogs?.metadata || {}

        if (currentPage < totalPages && !loading) {
          await fetchMore({
            variables: { page: currentPage + 1 },
          })
        }
      }}
    >
      <Table
        name="activity-logs"
        containerClassName="h-auto"
        containerSize={16}
        rowSize={48}
        data={(data?.activityLogs?.collection ?? []).map((log) => ({
          ...log,
          id: log.activityId,
        }))}
        hasError={!!error}
        isLoading={loading}
        onRowActionLink={({ id }) => {
          if (getCurrentBreakpoint() === 'sm') {
            logListRef.current?.updateView('forward')
          }

          return generatePath(ACTIVITY_LOG_ROUTE, {
            logId: id,
          })
        }}
        columns={[
          {
            title: translate('text_6560809c38fb9de88d8a52fb'),
            key: 'activityType',
            content: ({ activityType }) => (
              <Typography color="grey600" variant="captionCode">
                {activityType}
              </Typography>
            ),
          },
          {
            title: translate('text_6388b923e514213fed58331c'),
            key: 'activityType',
            content: ({ activityType }) => {
              return (
                <Typography color="grey700" variant="bodyHl" noWrap>
                  {activityType}
                </Typography>
              )
            },
            maxSpace: true,
          },
          {
            title: translate('text_664cb90097bfa800e6efa3f5'),
            key: 'loggedAt',
            content: ({ loggedAt }) => (
              <Typography noWrap>{formatTimeOrgaTZ(loggedAt, 'LLL dd, hh:mm:ss a')}</Typography>
            ),
          },
        ]}
        placeholder={{
          emptyState: {
            title: translate('text_1747314141347sfeoozf86o7'),
            subtitle: translate('text_1747314141347gs3g2lpln2h'),
          },
          errorState: {
            title: translate('text_1747058197364dm3no1jnete'),
            subtitle: translate('text_63e27c56dfe64b846474ef3b'),
            buttonTitle: translate('text_63e27c56dfe64b846474ef3c'),
            buttonAction: () => refetch(),
          },
        }}
      />
    </InfiniteScroll>
  )
}
