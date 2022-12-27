import { gql } from '@apollo/client'

import { TimezoneEnum, useGetOrganizationTimezoneQuery } from '~/generated/graphql'
import { TimeZonesConfig, TimezoneConfigObject } from '~/core/timezone'
import { formatDateToTZ } from '~/core/timezone'

gql`
  fragment OrganizationWithTimezone on Organization {
    id
    timezone
  }

  query getOrganizationTimezone {
    organization {
      id
      timezone
    }
  }
`

type UseOrganizationTimezone = () => {
  timezone: TimezoneEnum
  timezoneConfig: TimezoneConfigObject
  formatTimeOrgaTZ: (date: string, format?: string) => string
}

export const useOrganizationTimezone: UseOrganizationTimezone = () => {
  const { data } = useGetOrganizationTimezoneQuery({
    fetchPolicy: 'cache-first',
  })
  const orgaTimezone = data?.organization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  return {
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    formatTimeOrgaTZ: (date, format) =>
      formatDateToTZ(date, orgaTimezone, format || 'LLL. dd, yyyy'),
  }
}
