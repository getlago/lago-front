import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { FeatureFlagEnum, MappableTypeEnum } from '~/generated/graphql'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'

export const SelectedItemTypeEnum = {
  Default: 'Default',
  [MappableTypeEnum.AddOn]: 'AddOn',
  [MappableTypeEnum.BillableMetric]: 'BillableMetric',
  [MappableTypeEnum.Product]: 'Product',
} as const

export const SelectedItemTypeEnumTranslation = {
  Default: 'text_65281f686a80b400c8e2f6d1',
  [MappableTypeEnum.AddOn]: 'text_629728388c4d2300e2d3801a',
  [MappableTypeEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
  [MappableTypeEnum.Product]: 'text_17831042398250iwa2xp8pba',
} as const

export const useIntegrationItemsListSelection = () => {
  const { hasFeatureFlag, loading: isOrganizationLoading } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  const { loading: isCurrentUserLoading } = useCurrentUser()
  const hasProductCatalog = hasFeatureFlag(FeatureFlagEnum.ProductCatalog)
  const canViewProducts = hasProductCatalog && hasPermissions(['productsView'])
  const canViewLegacyMappingTypes = !isOrganizationLoading && !hasProductCatalog

  const [searchParams, setSearchParams] = useSearchParams({
    item_type: SelectedItemTypeEnum.Default,
  })
  const itemTypeFromSearchParams = searchParams.get('item_type')
  const initialItemType = Object.values(SelectedItemTypeEnum).includes(
    itemTypeFromSearchParams as keyof typeof SelectedItemTypeEnum,
  )
    ? (itemTypeFromSearchParams as keyof typeof SelectedItemTypeEnum)
    : SelectedItemTypeEnum.Default
  const [selectedItemType, setSelectedItemType] =
    useState<keyof typeof SelectedItemTypeEnum>(initialItemType)

  useEffect(() => {
    // Update url with the search param depending on the selected item type
    setSearchParams({ item_type: selectedItemType })
  }, [selectedItemType, setSearchParams])

  useEffect(() => {
    // `canViewProducts` depends on the membership permissions query, not just org
    // info: resetting before it resolves would bounce a permitted user off a
    // deep-linked Product tab.
    if (isOrganizationLoading || isCurrentUserLoading) return

    const isLegacyMappingType =
      selectedItemType === MappableTypeEnum.AddOn ||
      selectedItemType === MappableTypeEnum.BillableMetric

    if (
      (selectedItemType === MappableTypeEnum.Product && !canViewProducts) ||
      (isLegacyMappingType && hasProductCatalog)
    ) {
      setSelectedItemType(SelectedItemTypeEnum.Default)
    }
  }, [
    canViewProducts,
    hasProductCatalog,
    isOrganizationLoading,
    isCurrentUserLoading,
    selectedItemType,
  ])

  return {
    selectedItemType,
    setSelectedItemType,
    canViewProducts,
    canViewLegacyMappingTypes,
  }
}
