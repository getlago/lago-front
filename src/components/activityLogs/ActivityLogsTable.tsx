import { gql, QueryResult } from '@apollo/client'
import { FC, useMemo } from 'react'

import { formatActivityType, getActivityDescription } from '~/components/activityLogs/utils'
import { Table, TableProps, Typography } from '~/components/designSystem'
import { ActivityLogsTableDataFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFormatterDateHelper } from '~/hooks/helpers/useFormatterDateHelper'

gql`
  fragment ActivityLogsTableData on ActivityLog {
    activityId
    activityType
    activityObject
    loggedAt
    externalCustomerId
    externalSubscriptionId
  }
`

interface ActivityLogsTableProps
  extends Pick<
    TableProps<ActivityLogsTableDataFragment>,
    'data' | 'hasError' | 'isLoading' | 'containerSize' | 'onRowActionLink'
  > {
  refetch: QueryResult['refetch']
}

export const ActivityLogsTable: FC<ActivityLogsTableProps> = ({
  data,
  hasError,
  isLoading,
  containerSize = 16,
  onRowActionLink,
  refetch,
}) => {
  const { translate } = useInternationalization()
  const { formattedDateTimeWithSecondsOrgaTZ } = useFormatterDateHelper()

  const logs = useMemo(() => {
    return data.map((log) => ({
      ...log,
      id: log.activityId,
    }))
  }, [data])

  return (
    <Table
      name="activity-logs"
      containerClassName="h-auto"
      containerSize={containerSize}
      rowSize={48}
      data={logs}
      hasError={hasError}
      isLoading={isLoading}
      onRowActionLink={onRowActionLink}
      columns={[
        {
          title: translate('text_6560809c38fb9de88d8a52fb'),
          key: 'activityType',
          content: ({ activityType }) => (
            <Typography color="grey600" variant="captionCode">
              {formatActivityType(activityType)}
            </Typography>
          ),
        },
        {
          title: translate('text_6388b923e514213fed58331c'),
          key: 'activityId',
          maxSpace: true,
          content: ({
            activityType,
            activityObject,
            externalCustomerId,
            externalSubscriptionId,
          }) => {
            const [activityTypeTranslation, parameters] = getActivityDescription(activityType, {
              activityObject,
              externalCustomerId: externalCustomerId ?? undefined,
              externalSubscriptionId: externalSubscriptionId ?? undefined,
            })

            return (
              <Typography color="grey700" variant="bodyHl" noWrap>
                {translate(activityTypeTranslation, parameters)}
              </Typography>
            )
          },
        },
        {
          title: translate('text_664cb90097bfa800e6efa3f5'),
          key: 'loggedAt',
          content: ({ loggedAt }) => (
            <Typography noWrap>{formattedDateTimeWithSecondsOrgaTZ(loggedAt)}</Typography>
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
  )
}
