import { gql } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  AvalaraIntegrationItemsListAddonsFragmentDoc,
  AvalaraIntegrationItemsListBillableMetricsFragmentDoc,
  AvalaraIntegrationItemsListDefaultFragmentDoc,
  AvalaraIntegrationItemsListProductsFragmentDoc,
  FeatureFlagEnum,
  MappableTypeEnum,
  useGetAddOnsForAvalaraItemsListLazyQuery,
  useGetAvalaraIntegrationCollectionMappingsLazyQuery,
  useGetBillableMetricsForAvalaraItemsListLazyQuery,
  useGetProductsForAvalaraItemsListLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import {
  AvalaraIntegrationMapItemDrawer,
  AvalaraIntegrationMapItemDrawerRef,
} from '~/pages/settings/integrations/AvalaraIntegrationMapItemDrawer'
import { MenuPopper } from '~/styles'

import AvalaraIntegrationItemsListAddons from './AvalaraIntegrationItemsListAddons'
import AvalaraIntegrationItemsListBillableMetrics from './AvalaraIntegrationItemsListBillableMetrics'
import AvalaraIntegrationItemsListDefault from './AvalaraIntegrationItemsListDefault'
import AvalaraIntegrationItemsListProducts from './AvalaraIntegrationItemsListProducts'

const SelectedItemTypeEnum = {
  Default: 'Default',
  [MappableTypeEnum.AddOn]: 'AddOn',
  [MappableTypeEnum.BillableMetric]: 'BillableMetric',
  [MappableTypeEnum.Product]: 'Product',
} as const

const SelectedItemTypeEnumTranslation = {
  Default: 'text_65281f686a80b400c8e2f6d1',
  [MappableTypeEnum.AddOn]: 'text_629728388c4d2300e2d3801a',
  [MappableTypeEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
  [MappableTypeEnum.Product]: 'text_17831042398250iwa2xp8pba',
} as const

gql`
  fragment AvalaraIntegrationItems on AvalaraIntegration {
    id # integrationId received in props
  }

  query getAvalaraIntegrationCollectionMappings($integrationId: ID!) {
    integrationCollectionMappings(integrationId: $integrationId) {
      collection {
        id
        ...AvalaraIntegrationItemsListDefault
      }
    }
  }

  query getAddOnsForAvalaraItemsList(
    $page: Int
    $limit: Int
    $searchTerm: String
    # integrationId used in item list fragment
    $integrationId: ID!
  ) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...AvalaraIntegrationItemsListAddons
      }
    }
  }

  query getBillableMetricsForAvalaraItemsList(
    $page: Int
    $limit: Int
    $searchTerm: String
    # integrationId used in item list fragment
    $integrationId: ID!
  ) {
    billableMetrics(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...AvalaraIntegrationItemsListBillableMetrics
      }
    }
  }

  query getProductsForAvalaraItemsList(
    $page: Int
    $limit: Int
    $searchTerm: String
    # integrationId used in item list fragment
    $integrationId: ID!
  ) {
    products(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
        totalCount
      }
      collection {
        id
        ...AvalaraIntegrationItemsListProducts
      }
    }
  }

  ${AvalaraIntegrationItemsListDefaultFragmentDoc}
  ${AvalaraIntegrationItemsListAddonsFragmentDoc}
  ${AvalaraIntegrationItemsListBillableMetricsFragmentDoc}
  ${AvalaraIntegrationItemsListProductsFragmentDoc}
`

const AvalaraIntegrationItemsList = ({ integrationId }: { integrationId: string }) => {
  const { translate } = useInternationalization()
  const { hasFeatureFlag, loading: isOrganizationLoading } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  const avalaraIntegrationMapItemDrawerRef = useRef<AvalaraIntegrationMapItemDrawerRef>(null)
  const canViewProducts =
    hasFeatureFlag(FeatureFlagEnum.ProductCatalog) && hasPermissions(['productsView'])
  const [searchParams, setSearchParams] = useSearchParams({
    item_type: SelectedItemTypeEnum.Default,
  })
  const [selectedItemType, setSelectedItemType] = useState<keyof typeof SelectedItemTypeEnum>(
    searchParams.get('item_type') as keyof typeof SelectedItemTypeEnum,
  )

  useEffect(() => {
    // Update url with the search param depending on the selected item type
    setSearchParams({ item_type: selectedItemType })
  }, [selectedItemType, setSearchParams])

  const [
    getDefaultItems,
    {
      data: collectionMappingData,
      loading: collectionMappingLoading,
      error: collectionMappingError,
    },
  ] = useGetAvalaraIntegrationCollectionMappingsLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      integrationId,
    },
  })

  const [
    getAddonList,
    {
      data: addonData,
      loading: addonLoading,
      error: addonError,
      variables: addonVariables,
      fetchMore: fetchMoreAddons,
    },
  ] = useGetAddOnsForAvalaraItemsListLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: DEFAULT_PAGE_SIZE,
      integrationId,
    },
  })

  const [
    getBillableMetricsList,
    {
      data: billableMetricsData,
      loading: billableMetricsLoading,
      error: billableMetricsError,
      variables: billableMetricsVariables,
      fetchMore: fetchMoreBillableMetrics,
    },
  ] = useGetBillableMetricsForAvalaraItemsListLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: DEFAULT_PAGE_SIZE,
      integrationId,
    },
  })

  const [
    getProductsList,
    {
      data: productsData,
      loading: productsLoading,
      error: productsError,
      variables: productsVariables,
      fetchMore: fetchMoreProducts,
    },
  ] = useGetProductsForAvalaraItemsListLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: DEFAULT_PAGE_SIZE,
      integrationId,
    },
  })

  const { debouncedSearch: debouncedSearchAddons, isLoading: isLoadingAddons } = useDebouncedSearch(
    getAddonList,
    addonLoading,
  )

  const { debouncedSearch: debouncedSearchBillableMetrics, isLoading: isLoadingBillableMetrics } =
    useDebouncedSearch(getBillableMetricsList, billableMetricsLoading)
  const { debouncedSearch: debouncedSearchProducts, isLoading: isLoadingProducts } =
    useDebouncedSearch(getProductsList, productsLoading)

  useEffect(() => {
    if (
      !isOrganizationLoading &&
      selectedItemType === MappableTypeEnum.Product &&
      !canViewProducts
    ) {
      setSelectedItemType(SelectedItemTypeEnum.Default)
    }
  }, [canViewProducts, isOrganizationLoading, selectedItemType])

  // handeling data fetching
  useEffect(() => {
    if (selectedItemType === SelectedItemTypeEnum.Default) {
      getDefaultItems()
    } else if (selectedItemType === MappableTypeEnum.AddOn) {
      getAddonList()
    } else if (selectedItemType === MappableTypeEnum.BillableMetric) {
      getBillableMetricsList()
    } else if (selectedItemType === MappableTypeEnum.Product && canViewProducts) {
      getProductsList()
    }
  }, [
    selectedItemType,
    canViewProducts,
    getAddonList,
    getDefaultItems,
    getBillableMetricsList,
    getProductsList,
  ])

  return (
    <>
      <div className="flex h-nav items-center justify-between px-12 shadow-b">
        <div className="flex items-center gap-3">
          <Typography variant="body" color="grey600">
            {translate('text_6630e3210c13c500cd398e95')}
          </Typography>
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down" variant="secondary">
                {translate(SelectedItemTypeEnumTranslation[selectedItemType])}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  variant="quaternary"
                  fullWidth
                  align="left"
                  onClick={() => {
                    setSelectedItemType(SelectedItemTypeEnum.Default)
                    closePopper()
                  }}
                >
                  {translate('text_65281f686a80b400c8e2f6d1')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={() => {
                    setSelectedItemType(MappableTypeEnum.AddOn)
                    closePopper()
                  }}
                >
                  {translate('text_629728388c4d2300e2d3801a')}
                </Button>
                <Button
                  variant="quaternary"
                  align="left"
                  fullWidth
                  onClick={() => {
                    setSelectedItemType(MappableTypeEnum.BillableMetric)
                    closePopper()
                  }}
                >
                  {translate('text_623b497ad05b960101be3438')}
                </Button>
                {canViewProducts && (
                  <Button
                    variant="quaternary"
                    align="left"
                    fullWidth
                    onClick={() => {
                      setSelectedItemType(MappableTypeEnum.Product)
                      closePopper()
                    }}
                  >
                    {translate('text_17831042398250iwa2xp8pba')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        </div>

        {selectedItemType === MappableTypeEnum.AddOn && (
          <SearchInput
            onChange={debouncedSearchAddons}
            placeholder={translate('text_63bee4e10e2d53912bfe4db8')}
          />
        )}
        {selectedItemType === MappableTypeEnum.BillableMetric && (
          <SearchInput
            onChange={debouncedSearchBillableMetrics}
            placeholder={translate('text_63ba9ee977a67c9693f50aea')}
          />
        )}
        {selectedItemType === MappableTypeEnum.Product && canViewProducts && (
          <SearchInput
            onChange={debouncedSearchProducts}
            placeholder={translate('text_1783980718114714izppxdwq')}
          />
        )}
      </div>

      {selectedItemType === SelectedItemTypeEnum.Default && (
        <AvalaraIntegrationItemsListDefault
          defaultItems={collectionMappingData?.integrationCollectionMappings?.collection}
          integrationId={integrationId}
          isLoading={collectionMappingLoading}
          hasError={!!collectionMappingError}
          avalaraIntegrationMapItemDrawerRef={avalaraIntegrationMapItemDrawerRef}
        />
      )}
      {selectedItemType === MappableTypeEnum.AddOn && (
        <AvalaraIntegrationItemsListAddons
          data={addonData}
          fetchMoreAddons={fetchMoreAddons}
          integrationId={integrationId}
          isLoading={isLoadingAddons}
          hasError={!!addonError}
          avalaraIntegrationMapItemDrawerRef={avalaraIntegrationMapItemDrawerRef}
          searchTerm={addonVariables?.searchTerm}
        />
      )}
      {selectedItemType === MappableTypeEnum.BillableMetric && (
        <AvalaraIntegrationItemsListBillableMetrics
          data={billableMetricsData}
          fetchMoreBillableMetrics={fetchMoreBillableMetrics}
          integrationId={integrationId}
          isLoading={isLoadingBillableMetrics}
          hasError={!!billableMetricsError}
          avalaraIntegrationMapItemDrawerRef={avalaraIntegrationMapItemDrawerRef}
          searchTerm={billableMetricsVariables?.searchTerm}
        />
      )}
      {selectedItemType === MappableTypeEnum.Product && canViewProducts && (
        <AvalaraIntegrationItemsListProducts
          data={productsData}
          fetchMoreProducts={fetchMoreProducts}
          integrationId={integrationId}
          isLoading={isLoadingProducts}
          hasError={!!productsError}
          avalaraIntegrationMapItemDrawerRef={avalaraIntegrationMapItemDrawerRef}
          searchTerm={productsVariables?.searchTerm}
        />
      )}

      <AvalaraIntegrationMapItemDrawer ref={avalaraIntegrationMapItemDrawerRef} />
    </>
  )
}

export default AvalaraIntegrationItemsList
