import { gql } from '@apollo/client'

import { TimezoneConfigObject, TimeZonesConfig } from '~/core/timezone'
import { formatDateToTZ } from '~/core/timezone'
import {
  MainOrganizationInfosFragment,
  OrganizationForDatePickerFragmentDoc,
  TimezoneEnum,
  useGetOrganizationInfosQuery,
} from '~/generated/graphql'

gql`
  fragment MainOrganizationInfos on Organization {
    id
    name
    logoUrl
    timezone
    defaultCurrency

    ...OrganizationForDatePicker
  }

  query getOrganizationInfos {
    organization {
      ...MainOrganizationInfos
    }
  }

  ${OrganizationForDatePickerFragmentDoc}
`

type UseOrganizationInfos = () => {
  loading: boolean
  organization?: MainOrganizationInfosFragment
  timezone: TimezoneEnum
  timezoneConfig: TimezoneConfigObject
  formatTimeOrgaTZ: (date: string, format?: string) => string
}

export const useOrganizationInfos: UseOrganizationInfos = () => {
  const { data, loading } = useGetOrganizationInfosQuery({
    fetchPolicy: 'cache-first',
    canonizeResults: true,
  })
  const orgaTimezone = data?.organization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  return {
    loading,
    organization: data?.organization || undefined,
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    formatTimeOrgaTZ: (date, format) =>
      formatDateToTZ(date, orgaTimezone, format || 'LLL. dd, yyyy'),
  }
}
