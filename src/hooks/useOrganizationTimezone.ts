import { gql } from '@apollo/client'

import { TimezoneEnum } from '~/generated/graphql'
import { TimeZonesConfig, TimezoneConfigObject } from '~/core/timezone'
import { useCurrentUserInfosVar } from '~/core/apolloClient'
import { formatDateToTZ } from '~/core/timezone'

gql`
  fragment OrganizationWithTimezone on Organization {
    id
    timezone
  }
`

type UseOrganizationTimezone = () => {
  timezone: TimezoneEnum
  timezoneConfig: TimezoneConfigObject
  formatTimeOrgaTZ: (date: string, format?: string) => string
}

export const useOrganizationTimezone: UseOrganizationTimezone = () => {
  const { currentOrganization } = useCurrentUserInfosVar()
  const orgaTimezone = currentOrganization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  return {
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    formatTimeOrgaTZ: (date, format) =>
      formatDateToTZ(date, orgaTimezone, format || 'LLL. dd, yyyy'),
  }
}
