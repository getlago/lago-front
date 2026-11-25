import { gql } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import {
  MappableTypeEnum,
  QuickbooksIntegrationItemsListAddonsFragmentDoc,
  QuickbooksIntegrationItemsListBillableMetricsFragmentDoc,
  QuickbooksIntegrationItemsListDefaultFragmentDoc,
  useGetAddOnsForQuickbooksItemsListLazyQuery,
  useGetBillableMetricsForQuickbooksItemsListLazyQuery,
  useGetQuickbooksIntegrationCollectionMappingsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useQuickbooksIntegrationMapItemDrawer } from '~/pages/settings/integrations/QuickbooksIntegrationMapItemDrawer/useQuickbooksIntegrationMapItemDrawer'
import { MenuPopper } from '~/styles'

import QuickbooksIntegrationItemsListAddons from './QuickbooksIntegrationItemsListAddons'
import QuickbooksIntegrationItemsListBillableMetrics from './QuickbooksIntegrationItemsListBillableMetrics'
import QuickbooksIntegrationItemsListDefault from './QuickbooksIntegrationItemsListDefault'

const DEFAULT_ITEM_TYPE = 'Default'

type SelectedItemType =
  typeof DEFAULT_ITEM_TYPE | MappableTypeEnum.AddOn | MappableTypeEnum.BillableMetric

const SELECTED_ITEM_TYPE_TRANSLATIONS: Record<SelectedItemType, string> = {
  [DEFAULT_ITEM_TYPE]: 'text_65281f686a80b400c8e2f6d1',
  [MappableTypeEnum.AddOn]: 'text_629728388c4d2300e2d3801a',
  [MappableTypeEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
}

const SELECTED_ITEM_TYPES: SelectedItemType[] = [
  DEFAULT_ITEM_TYPE,
  MappableTypeEnum.AddOn,
  MappableTypeEnum.BillableMetric,
]

const isSelectedItemType = (value: string | null): value is SelectedItemType =>
  SELECTED_ITEM_TYPES.some((itemType) => itemType === value)

gql`
  fragment QuickbooksIntegrationItems on QuickbooksIntegration {
    id # integrationId received in props
  }

  query getQuickbooksIntegrationCollectionMappings($integrationId: ID!) {
    integrationCollectionMappings(integrationId: $integrationId) {
      collection {
        id
        ...QuickbooksIntegrationItemsListDefault
      }
    }
  }

  query getAddOnsForQuickbooksItemsList(
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
        ...QuickbooksIntegrationItemsListAddons
      }
    }
  }

  query getBillableMetricsForQuickbooksItemsList(
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
        ...QuickbooksIntegrationItemsListBillableMetrics
      }
    }
  }

  ${QuickbooksIntegrationItemsListDefaultFragmentDoc}
  ${QuickbooksIntegrationItemsListAddonsFragmentDoc}
  ${QuickbooksIntegrationItemsListBillableMetricsFragmentDoc}
`

const QuickbooksIntegrationItemsList = ({ integrationId }: { integrationId: string }) => {
  const { translate } = useInternationalization()
  const { openDrawer: openIntegrationMapItemDrawer } = useQuickbooksIntegrationMapItemDrawer()
  const [searchParams, setSearchParams] = useSearchParams()
  const itemTypeFromSearchParams = searchParams.get('item_type')
  const [selectedItemType, setSelectedItemType] = useState<SelectedItemType>(
    isSelectedItemType(itemTypeFromSearchParams) ? itemTypeFromSearchParams : DEFAULT_ITEM_TYPE,
  )

  // Replaces the history entry, so Back leaves the page instead of re-selecting the tab.
  useEffect(() => {
    setSearchParams({ item_type: selectedItemType }, { replace: true })
  }, [selectedItemType, setSearchParams])

  const [
    getDefaultItems,
    {
      data: collectionMappingData,
      loading: collectionMappingLoading,
      error: collectionMappingError,
    },
  ] = useGetQuickbooksIntegrationCollectionMappingsLazyQuery({
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
  ] = useGetAddOnsForQuickbooksItemsListLazyQuery({
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
  ] = useGetBillableMetricsForQuickbooksItemsListLazyQuery({
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

  // handling data fetching
  useEffect(() => {
    if (!integrationId) return

    if (selectedItemType === DEFAULT_ITEM_TYPE) {
      getDefaultItems()
    } else if (selectedItemType === MappableTypeEnum.AddOn) {
      getAddonList()
    } else if (selectedItemType === MappableTypeEnum.BillableMetric) {
      getBillableMetricsList()
    }
  }, [integrationId, selectedItemType, getAddonList, getDefaultItems, getBillableMetricsList])

  return (
    <>
      <div className="flex h-nav items-center justify-between px-12 shadow-b">
        <Stack direction="row" gap={3} alignItems="center">
          <Typography variant="body" color="grey600">
            {translate('text_6630e3210c13c500cd398e95')}
          </Typography>
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down" variant="secondary">
                {translate(SELECTED_ITEM_TYPE_TRANSLATIONS[selectedItemType])}
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
                    setSelectedItemType(DEFAULT_ITEM_TYPE)
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
              </MenuPopper>
            )}
          </Popper>
        </Stack>

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
      </div>

      {selectedItemType === DEFAULT_ITEM_TYPE ? (
        <QuickbooksIntegrationItemsListDefault
          defaultItems={collectionMappingData?.integrationCollectionMappings?.collection}
          integrationId={integrationId}
          isLoading={collectionMappingLoading}
          hasError={!!collectionMappingError}
          openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
        />
      ) : (
        <>
          {selectedItemType === MappableTypeEnum.AddOn && (
            <QuickbooksIntegrationItemsListAddons
              data={addonData}
              fetchMoreAddons={fetchMoreAddons}
              integrationId={integrationId}
              isLoading={isLoadingAddons}
              hasError={!!addonError}
              openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
              searchTerm={addonVariables?.searchTerm}
            />
          )}
          {selectedItemType === MappableTypeEnum.BillableMetric && (
            <QuickbooksIntegrationItemsListBillableMetrics
              data={billableMetricsData}
              fetchMoreBillableMetrics={fetchMoreBillableMetrics}
              integrationId={integrationId}
              isLoading={isLoadingBillableMetrics}
              hasError={!!billableMetricsError}
              openIntegrationMapItemDrawer={openIntegrationMapItemDrawer}
              searchTerm={billableMetricsVariables?.searchTerm}
            />
          )}
        </>
      )}
    </>
  )
}

export default QuickbooksIntegrationItemsList
