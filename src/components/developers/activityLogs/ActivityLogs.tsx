import { gql } from '@apollo/client'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { AvailableFiltersEnum, Filters } from '~/components/designSystem/Filters'
import { ActivityLogDetails } from '~/components/developers/activityLogs/ActivityLogDetails'
import { ActivityLogTable } from '~/components/developers/activityLogs/ActivityLogTable'
import { ACTIVITY_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { WEBHOOK_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { ActivityItemFragment, useActivityLogsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

gql`
  fragment ActivityItem on ActivityLog {
    activityId
    activityType
    activityObject
    loggedAt
  }

  query activityLogs($page: Int, $limit: Int) {
    activityLogs(page: $page, limit: $limit) {
      collection {
        ...ActivityItem
      }
      metadata {
        currentPage
        totalPages
      }
    }
  }
`

export const ActivityLogs = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { logId } = useParams<{ logId: string }>()
  const { size } = useDeveloperTool()
  const logListRef = useRef<ListSectionRef>(null)

  const getActivityLogsResult = useActivityLogsQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })

  const { data, loading, refetch } = getActivityLogsResult

  const navigateToFirstLog = useCallback(
    (logCollection?: ActivityItemFragment[]) => {
      if (logCollection?.length) {
        const firstLog = logCollection[0]

        if (firstLog && getCurrentBreakpoint() !== 'sm') {
          navigate(generatePath(ACTIVITY_LOG_ROUTE, { logId: firstLog.activityId }), {
            replace: true,
          })
        }
      }
    },
    [navigate],
  )

  // If no logId is provided in params, navigate to the first log
  useEffect(() => {
    if (!logId) {
      navigateToFirstLog(data?.activityLogs?.collection)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.activityLogs?.collection, logId])

  // The table should highlight the selected row when the logId is provided in params
  useLayoutEffect(() => {
    if (logId) {
      logListRef.current?.setActiveRow(logId)
    }
  }, [logId])

  const shouldDisplayLogDetails = !!logId && !!data?.activityLogs?.collection.length

  return (
    <div className="not-last-child:shadow-b">
      <Typography variant="headline" className="p-4">
        {translate('text_1747314141347qq6rasuxisl')}
      </Typography>

      <LogsLayout.CTASection>
        <div>
          {/* TODO: Add filters */}
          <Filters.Provider
            filtersNamePrefix={WEBHOOK_LOGS_FILTER_PREFIX}
            availableFilters={[AvailableFiltersEnum.webhookStatus]}
            displayInDialog
          >
            <Filters.Component />
          </Filters.Provider>
        </div>

        <div className="h-8 w-px shadow-r" />

        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          loading={loading}
          onClick={async () => {
            const result = await refetch()

            navigateToFirstLog(result.data?.activityLogs?.collection)
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>
      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={
          <ActivityLogTable getActivityLogsResult={getActivityLogsResult} logListRef={logListRef} />
        }
        rightSide={<ActivityLogDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
        sectionHeight={
          shouldDisplayLogDetails ? `calc(${Math.floor(size)}vh - 182px)` : '100%' // 182px is the height of the headers (52px+64px+64px+2px of borders)
        }
      />
    </div>
  )
}
