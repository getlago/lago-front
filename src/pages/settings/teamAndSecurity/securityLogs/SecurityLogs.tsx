import { Button } from '~/components/designSystem/Button'
import { Filters, SecurityLogsAvailableFilters } from '~/components/designSystem/Filters'
import { InfiniteScroll } from '~/components/designSystem/InfiniteScroll'
import { Table, TableColumn } from '~/components/designSystem/Table'
import { Typography } from '~/components/designSystem/Typography'
import { LogsLayout } from '~/components/developers/LogsLayout'
import { SettingsPageHeaderContainer } from '~/components/layouts/Settings'
import { SECURITY_LOGS_FILTER_PREFIX } from '~/core/constants/filters'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { SecurityLogWithId } from './common/securityLogsTypes'
import { useSecurityLogs } from './hooks/useSecurityLogs'
import { useSecurityLogsFormatting } from './hooks/useSecurityLogsFormatting'

export const SECURITY_LOGS_CONTAINER_TEST_ID = 'security-logs-container'

const SecurityLogs = () => {
  const { translate } = useInternationalization()

  const {
    securityLogs,
    securityLogsMetadata,
    isLoadingSecurityLogs,
    fetchMoreSecurityLogs,
    refetchSecurityLogs,
  } = useSecurityLogs()

  const { getFormattedLogEvent, getSecurityLogDescription, getSecurityLogDate } =
    useSecurityLogsFormatting()

  const columns: Array<TableColumn<SecurityLogWithId>> = [
    {
      key: 'logEvent',
      title: translate('text_6560809c38fb9de88d8a52fb'),
      content: ({ logEvent }: SecurityLogWithId) => {
        return <Typography variant="captionCode">{getFormattedLogEvent(logEvent)}</Typography>
      },
    },
    {
      key: 'logEvent',
      title: translate('text_6388b923e514213fed58331c'),
      maxSpace: true,
      content: (securityLog: SecurityLogWithId) => {
        return <Typography color="grey700">{getSecurityLogDescription(securityLog)}</Typography>
      },
    },
    {
      key: 'loggedAt',
      title: translate('text_664cb90097bfa800e6efa3f5'),
      minWidth: 130,
      content: (securityLog: SecurityLogWithId) => {
        return <Typography>{getSecurityLogDate(securityLog)}</Typography>
      },
    },
  ]

  return (
    <div
      className="flex flex-col gap-4 px-12 pb-20 pt-10"
      data-test={SECURITY_LOGS_CONTAINER_TEST_ID}
    >
      <SettingsPageHeaderContainer>
        <Typography variant="headline">{translate('text_1771855827236eqkaiznri70')}</Typography>
        <Typography>{translate('text_1771855926675ji0pee3p6a6')}</Typography>
      </SettingsPageHeaderContainer>

      <LogsLayout.CTASection className="shadow-b">
        <div>
          <Filters.Provider
            displayInDialog
            filtersNamePrefix={SECURITY_LOGS_FILTER_PREFIX}
            availableFilters={SecurityLogsAvailableFilters}
          >
            <Filters.Component />
          </Filters.Provider>
        </div>

        <div className="h-8 w-px shadow-r" />

        <Button
          variant="quaternary"
          size="small"
          startIcon="reload"
          loading={isLoadingSecurityLogs}
          onClick={async () => {
            await refetchSecurityLogs()
          }}
        >
          {translate('text_1738748043939zqoqzz350yj')}
        </Button>
      </LogsLayout.CTASection>
      <InfiniteScroll
        onBottom={async () => {
          const { currentPage = 0, totalPages = 0 } = securityLogsMetadata || {}

          if (currentPage < totalPages && !isLoadingSecurityLogs) {
            await fetchMoreSecurityLogs({
              variables: { page: currentPage + 1 },
            })
          }
        }}
      >
        <Table
          name="security-logs"
          containerSize={{ default: 4 }}
          columns={columns}
          data={securityLogs}
          isLoading={isLoadingSecurityLogs}
        />
      </InfiniteScroll>
    </div>
  )
}

export default SecurityLogs
