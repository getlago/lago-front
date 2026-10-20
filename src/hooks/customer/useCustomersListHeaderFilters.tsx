import { ReactNode } from 'react'

import {
  AvailableFiltersEnum,
  AvailableQuickFilters,
  CustomerAvailableFilters,
  Filters,
} from '~/components/Filters'
import { SearchInput } from '~/components/SearchInput'
import { CUSTOMER_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { FeatureFlagEnum, PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

interface UseCustomersListFiltersSectionParams {
  debouncedSearch?: (value: string) => void
}

export function useCustomersListHeaderFilters({
  debouncedSearch,
}: UseCustomersListFiltersSectionParams): ReactNode {
  const { translate } = useInternationalization()
  const { hasOrganizationPremiumAddon, hasFeatureFlag } = useOrganizationInfos()
  const isProductCatalogEnabled = hasFeatureFlag(FeatureFlagEnum.ProductCatalog)

  const hasAccessToRevenueShare = hasOrganizationPremiumAddon(
    PremiumIntegrationTypeEnum.RevenueShare,
  )

  const getAvailableFilters = (): AvailableFiltersEnum[] => {
    if (isProductCatalogEnabled) {
      return CustomerAvailableFilters.filter(
        (filter) =>
          filter !== AvailableFiltersEnum.customerAccountType &&
          filter !== AvailableFiltersEnum.activeSubscriptions,
      )
    }

    if (hasAccessToRevenueShare) return CustomerAvailableFilters

    return CustomerAvailableFilters.filter(
      (filter) => filter !== AvailableFiltersEnum.customerAccountType,
    )
  }

  const availableFilters = getAvailableFilters()
  const quickFiltersType = isProductCatalogEnabled
    ? undefined
    : AvailableQuickFilters.customerAccountType

  return (
    <Filters.Provider
      filtersNamePrefix={CUSTOMER_LIST_FILTER_PREFIX}
      quickFiltersType={quickFiltersType}
      availableFilters={availableFilters}
    >
      <div className="flex flex-col gap-4">
        <Filters.QuickFilters />
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63befc65efcd9374da45b801')}
            data-test="search-customers"
          />
          <Filters.Component />
        </div>
      </div>
    </Filters.Provider>
  )
}
