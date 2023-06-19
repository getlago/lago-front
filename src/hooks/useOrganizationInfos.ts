import { gql } from '@apollo/client'

import {
  TimezoneEnum,
  useGetOrganizationInfosQuery,
  MainOrganizationInfosFragment,
  OrganizationForTimePickerFragmentDoc,
  OrganizationForDatePickerFragmentDoc,
} from '~/generated/graphql'
import { TimeZonesConfig, TimezoneConfigObject } from '~/core/timezone'
import { formatDateToTZ } from '~/core/timezone'

gql`
  fragment MainOrganizationInfos on Organization {
    id
    name
    logoUrl
    timezone

    ...OrganizationForDatePicker
    ...OrganizationForTimePicker
  }

  query getOrganizationInfos {
    organization {
      ...MainOrganizationInfos
    }
  }

  ${OrganizationForDatePickerFragmentDoc}
  ${OrganizationForTimePickerFragmentDoc}
`

type UseOrganizationInfos = () => {
  organization?: MainOrganizationInfosFragment
  timezone: TimezoneEnum
  timezoneConfig: TimezoneConfigObject
  formatTimeOrgaTZ: (date: string, format?: string) => string
}

export const useOrganizationInfos: UseOrganizationInfos = () => {
  const { data } = useGetOrganizationInfosQuery({
    fetchPolicy: 'cache-first',
    canonizeResults: true,
  })
  const orgaTimezone = data?.organization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  return {
    organization: data?.organization || undefined,
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    formatTimeOrgaTZ: (date, format) =>
      formatDateToTZ(date, orgaTimezone, format || 'LLL. dd, yyyy'),
  }
}
