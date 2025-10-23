import { gql } from '@apollo/client'

import {
  intlFormatDateTime,
  IntlFormatDateTimeOptions,
  TimezoneConfigObject,
  TimeZonesConfig,
} from '~/core/timezone'
import {
  MainOrganizationInfosFragment,
  OrganizationForDatePickerFragmentDoc,
  PremiumIntegrationTypeEnum,
  TimezoneEnum,
  useGetOrganizationInfosQuery,
} from '~/generated/graphql'
import { useIsAuthenticated } from '~/hooks/auth/useIsAuthenticated'

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
  hasOrganizationPremiumAddon: (integration: PremiumIntegrationTypeEnum) => boolean
  refetchOrganizationInfos: () => void
  intlFormatDateTimeOrgaTZ: (
    date: string,
    options?: IntlFormatDateTimeOptions,
  ) => { date: string; time: string; timezone: string }
}

export const useOrganizationInfos: UseOrganizationInfos = () => {
  const { isAuthenticated } = useIsAuthenticated()
  const { data, loading, refetch } = useGetOrganizationInfosQuery({
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
    skip: !isAuthenticated,
  })

  const orgaTimezone = data?.organization?.timezone || TimezoneEnum.TzUtc
  const timezoneConfig = TimeZonesConfig[orgaTimezone]

  const premiumIntegrations = data?.organization?.premiumIntegrations

  return {
    loading,
    organization: data?.organization || undefined,
    timezone: orgaTimezone || TimezoneEnum.TzUtc,
    timezoneConfig,
    hasOrganizationPremiumAddon: (integration: PremiumIntegrationTypeEnum) =>
      !!premiumIntegrations?.includes(integration),
    refetchOrganizationInfos: refetch,
    intlFormatDateTimeOrgaTZ: (date: string, options?: IntlFormatDateTimeOptions) => {
      const appliedOptions = options || {}

      return intlFormatDateTime(date, {
        ...appliedOptions,
        timezone: orgaTimezone,
      })
    },
  }
}
