import { Typography } from 'lago-design-system'
import { FC, RefObject, useMemo } from 'react'
import { generatePath } from 'react-router-dom'

import { Status, StatusType, Table } from '~/components/designSystem'
import { HTTPMethod, variantByHTTPMethod } from '~/components/developers/apiLogs/mapping'
import { API_LOG_ROUTE } from '~/components/developers/DevtoolsRouter'
import { ListSectionRef } from '~/components/developers/LogsLayout'
import { getCurrentBreakpoint } from '~/core/utils/getCurrentBreakpoint'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

interface ApiLogsTableProps {
  logListRef: RefObject<ListSectionRef>
}

const fakeData = [
  {
    requestId: 'dfbf53fe-34c6-4721-885f-0b68300b4fee',
    userEmail: 'mario@getlago.com',
    status: 'succeeded',
    httpMethod: HTTPMethod.POST,
    httpStatus: 200,
    path: 'api/v1/invoices',
    origin: 'https://api.getlago.com/',
    client: 'LagoRubySDKv1',
    apiKey: '*************-*****fbfd',
    apiVersion: 'v1',
    loggedAt: '2025-03-31T12:31:44Z',
    createdAt: '2025-03-31T12:35:00Z',
  },
  {
    requestId: 'dfbf53fe-34c6-4721-885f-0b68300b4fee',
    userEmail: 'mario@getlago.com',
    status: 'succeeded',
    httpMethod: HTTPMethod.DELETE,
    httpStatus: 400,
    path: 'api/v1/invoices',
    origin: 'https://api.getlago.com/',
    client: 'LagoRubySDKv1',
    apiKey: '*************-*****fbfd',
    apiVersion: 'v1',
    loggedAt: '2025-03-31T12:31:44Z',
    createdAt: '2025-03-31T12:35:00Z',
  },
  {
    requestId: 'dfbf53fe-34c6-4721-885f-0b68300b4fee',
    userEmail: 'mario@getlago.com',
    status: 'succeeded',
    httpMethod: HTTPMethod.PUT,
    httpStatus: 200,
    path: 'api/v1/invoices',
    origin: 'https://api.getlago.com/',
    client: 'LagoRubySDKv1',
    apiKey: '*************-*****fbfd',
    apiVersion: 'v1',
    loggedAt: '2025-03-31T12:31:44Z',
    createdAt: '2025-03-31T12:35:00Z',
  },
]

const error = false
const loading = false

export const ApiLogsTable: FC<ApiLogsTableProps> = ({ logListRef }) => {
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  const apiLogs = useMemo(() => {
    return fakeData.map((log) => ({
      ...log,
      id: log.requestId,
    }))
  }, [])

  return (
    <Table
      name="api-logs"
      containerClassName="h-auto"
      containerSize={16}
      rowSize={48}
      data={apiLogs}
      hasError={!!error}
      isLoading={loading}
      onRowActionLink={({ id }) => {
        if (getCurrentBreakpoint() === 'sm') {
          logListRef.current?.updateView('forward')
        }

        return generatePath(API_LOG_ROUTE, { logId: id as string })
      }}
      columns={[
        {
          title: translate('text_62865498824cc10126ab296f'),
          key: 'httpStatus',
          content: ({ httpStatus }) => {
            if (httpStatus >= 200 && httpStatus < 400) {
              return <Status type={StatusType.success} label={httpStatus} />
            }

            return <Status type={StatusType.danger} label={httpStatus} />
          },
        },
        {
          title: translate('text_1749819996843c2c5f1j8e0n'),
          key: 'path',
          maxSpace: true,
          content: ({ path, httpMethod }) => (
            <Typography variant="captionCode">
              <Typography component="span" color={variantByHTTPMethod(httpMethod)}>
                {httpMethod}
              </Typography>
              <Typography component="span" color="grey700" noWrap>
                {' '}
                {path}
              </Typography>
            </Typography>
          ),
        },
        {
          title: translate('text_664cb90097bfa800e6efa3f5'),
          key: 'createdAt',
          content: ({ createdAt }) => (
            <Typography noWrap>{formatTimeOrgaTZ(createdAt, 'LLL dd, hh:mm:ss a')}</Typography>
          ),
        },
      ]}
      placeholder={{
        emptyState: {
          title: translate('text_1749819999030bazlbkouub6'),
          subtitle: translate('text_1749819999030hztj7r8w5rg'),
        },
        errorState: {
          title: translate('text_1747058197364dm3no1jnete'),
          subtitle: translate('text_63e27c56dfe64b846474ef3b'),
          buttonTitle: translate('text_63e27c56dfe64b846474ef3c'),
          // buttonAction: () => refetch(),
        },
      }}
    />
  )
}
