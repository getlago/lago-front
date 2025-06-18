import { Button, Typography } from 'lago-design-system'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

import { ApiLogsAvailableFilters, Filters } from '~/components/designSystem/Filters'
import { ApiLogDetails } from '~/components/developers/apiLogs/ApiLogDetails'
import { ApiLogsTable } from '~/components/developers/apiLogs/ApiLogsTable'
import { ListSectionRef, LogsLayout } from '~/components/developers/LogsLayout'
import { API_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'

export const ApiLogs = () => {
  const { translate } = useInternationalization()
  const logListRef = useRef<ListSectionRef>(null)
  const { logId } = useParams<{ logId: string }>()
  const { size } = useDeveloperTool()

  const hasData = true
  const shouldDisplayLogDetails = !!logId && hasData

  return (
    <div className="not-last-child:shadow-b">
      <Typography variant="headline" className="p-4">
        {translate('text_1749644023729atl2vw7ad3z')}
      </Typography>

      <LogsLayout.CTASection>
        <div>
          <Filters.Provider
            displayInDialog
            filtersNamePrefix={API_LOGS_FILTER_PREFIX}
            availableFilters={ApiLogsAvailableFilters}
          >
            <Filters.Component />
          </Filters.Provider>
        </div>

        <div className="h-8 w-px shadow-r" />

        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          // loading={loading}
          // onClick={async () => {
          //   const result = await refetch()

          //   navigateToFirstLog(result.data?.activityLogs?.collection, searchParams)
          // }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>
      <LogsLayout.ListSection
        ref={logListRef}
        leftSide={<ApiLogsTable logListRef={logListRef} />}
        rightSide={<ApiLogDetails goBack={() => logListRef.current?.updateView('backward')} />}
        shouldDisplayRightSide={shouldDisplayLogDetails}
        sectionHeight={
          shouldDisplayLogDetails ? `calc(${size}vh - 182px)` : '100%' // 182px is the height of the headers (52px+64px+64px+2px of borders)
        }
      />
    </div>
  )
}
