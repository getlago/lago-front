import { gql } from '@apollo/client'

import { formatDateToTZ, TimezoneConfigObject, TimeZonesConfig } from '~/core/timezone'
import {
  MainOrganizationInfosFragment,
  OrganizationForDatePickerFragmentDoc,
  PremiumIntegrationTypeEnum,
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
    canCreateBillingEntity
    authenticationMethods
    authenticatedMethod

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
  /**
   * @deprecated Use `intlFormatDateTime` instead.
   */
  formatTimeOrgaTZ: (date: string, format?: string) => string
  hasOrganizationPremiumAddon: (integration: PremiumIntegrationTypeEnum) => boolean
  refetchOrganizationInfos: () => void
}

export const useOrganizationInfos: UseOrganizationInfos = () => {
  const { data, loading, refetch } = useGetOrganizationInfosQuery({
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  })

  const orgaTimezone = data?.organization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  const premiumIntegrations = data?.organization?.premiumIntegrations

  return {
    loading,
    organization: data?.organization || undefined,
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    formatTimeOrgaTZ: (date, format) =>
      formatDateToTZ(date, orgaTimezone, format || 'LLL. dd, yyyy'),
    hasOrganizationPremiumAddon: (integration: PremiumIntegrationTypeEnum) =>
      !!premiumIntegrations?.includes(integration),
    refetchOrganizationInfos: refetch,
  }
}
