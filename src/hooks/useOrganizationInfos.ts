import { gql } from '@apollo/client'

import { formatDateToTZ, TimezoneConfigObject, TimeZonesConfig } from '~/core/timezone'
import {
  MainOrganizationInfosFragment,
  OrganizationForDatePickerFragmentDoc,
  TimezoneEnum,
  useGetOrganizationInfosQuery,
} from '~/generated/graphql'

gql`
  fragment MainOrganizationInfos on CurrentOrganization {
    id
    name
    logoUrl
    timezone
    defaultCurrency
    premiumIntegrations

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
    nextFetchPolicy: 'cache-first',
    canonizeResults: true,
    notifyOnNetworkStatusChange: true,
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
