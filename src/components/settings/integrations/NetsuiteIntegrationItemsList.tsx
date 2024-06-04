import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { Button, Popper, Typography } from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import {
  MappableTypeEnum,
  NetsuiteIntegrationItemsListAddonsFragmentDoc,
  NetsuiteIntegrationItemsListBillableMetricsFragmentDoc,
  NetsuiteIntegrationItemsListDefaultFragmentDoc,
  useGetAddOnsForNetsuiteItemsListLazyQuery,
  useGetBillableMetricsForNetsuiteItemsListLazyQuery,
  useGetIntegrationCollectionMappingsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { MenuPopper, NAV_HEIGHT, theme } from '~/styles'

import NetsuiteIntegrationItemsListAddons from './NetsuiteIntegrationItemsListAddons'
import NetsuiteIntegrationItemsListBillableMetrics from './NetsuiteIntegrationItemsListBillableMetrics'
import NetsuiteIntegrationItemsListDefault from './NetsuiteIntegrationItemsListDefault'
import { NetsuiteMapItemDialog, NetsuiteMapItemDialogRef } from './NetsuiteMapItemDialog'

const SelectedItemTypeEnum = {
  Default: 'Default',
  [MappableTypeEnum.AddOn]: 'AddOn',
  [MappableTypeEnum.BillableMetric]: 'BillableMetric',
} as const

const SelectedItemTypeEnumTranslation = {
  Default: 'text_65281f686a80b400c8e2f6d1',
  [MappableTypeEnum.AddOn]: 'text_629728388c4d2300e2d3801a',
  [MappableTypeEnum.BillableMetric]: 'text_623b497ad05b960101be3438',
} as const

gql`
  fragment NetsuiteIntegrationItems on NetsuiteIntegration {
    id # integrationId received in props
  }

  query getIntegrationCollectionMappings($integrationId: ID!) {
    integrationCollectionMappings(integrationId: $integrationId) {
      collection {
        id
        ...NetsuiteIntegrationItemsListDefault
      }
    }
  }

  query getAddOnsForNetsuiteItemsList(
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
      }
      collection {
        id
        ...NetsuiteIntegrationItemsListAddons
      }
    }
  }

  query getBillableMetricsForNetsuiteItemsList(
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
      }
      collection {
        id
        ...NetsuiteIntegrationItemsListBillableMetrics
      }
    }
  }

  ${NetsuiteIntegrationItemsListDefaultFragmentDoc}
  ${NetsuiteIntegrationItemsListAddonsFragmentDoc}
  ${NetsuiteIntegrationItemsListBillableMetricsFragmentDoc}
`

const NetsuiteIntegrationItemsList = ({ integrationId }: { integrationId: string }) => {
  const { translate } = useInternationalization()
  const netsuiteMapItemDialogRef = useRef<NetsuiteMapItemDialogRef>(null)
  let [searchParams, setSearchParams] = useSearchParams({ item_type: SelectedItemTypeEnum.Default })
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
  ] = useGetIntegrationCollectionMappingsLazyQuery({
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
  ] = useGetAddOnsForNetsuiteItemsListLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: 20,
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
  ] = useGetBillableMetricsForNetsuiteItemsListLazyQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      limit: 20,
      integrationId,
    },
  })

  const { debouncedSearch: debouncedSearchAddons, isLoading: isLoaddingAddons } =
    useDebouncedSearch(getAddonList, addonLoading)

  const { debouncedSearch: debouncedSearchBillableMetrics, isLoading: isLoaddingBillableMetrics } =
    useDebouncedSearch(getBillableMetricsList, billableMetricsLoading)

  // handeling data fetching
  useEffect(() => {
    if (selectedItemType === SelectedItemTypeEnum.Default) {
      getDefaultItems()
    } else if (selectedItemType === MappableTypeEnum.AddOn) {
      getAddonList()
    } else if (selectedItemType === MappableTypeEnum.BillableMetric) {
      getBillableMetricsList()
    }
  }, [selectedItemType, getAddonList, getDefaultItems, getBillableMetricsList])

  return (
    <>
      <ItemTypeSelectorLine>
        <Stack direction="row" gap={3} alignItems="center">
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
              </MenuPopper>
            )}
          </Popper>
        </Stack>

        {selectedItemType === MappableTypeEnum.AddOn ? (
          <SearchInput
            onChange={debouncedSearchAddons}
            placeholder={translate('text_63bee4e10e2d53912bfe4db8')}
          />
        ) : selectedItemType === MappableTypeEnum.BillableMetric ? (
          <SearchInput
            onChange={debouncedSearchBillableMetrics}
            placeholder={translate('text_63ba9ee977a67c9693f50aea')}
          />
        ) : null}
      </ItemTypeSelectorLine>

      {selectedItemType === SelectedItemTypeEnum.Default ? (
        <NetsuiteIntegrationItemsListDefault
          defaultItems={collectionMappingData?.integrationCollectionMappings?.collection}
          integrationId={integrationId}
          isLoading={collectionMappingLoading}
          hasError={!!collectionMappingError}
          netsuiteMapItemDialogRef={netsuiteMapItemDialogRef}
        />
      ) : selectedItemType === MappableTypeEnum.AddOn ? (
        <NetsuiteIntegrationItemsListAddons
          data={addonData}
          fetchMoreAddons={fetchMoreAddons}
          integrationId={integrationId}
          isLoading={isLoaddingAddons}
          hasError={!!addonError}
          netsuiteMapItemDialogRef={netsuiteMapItemDialogRef}
          searchTerm={addonVariables?.searchTerm}
        />
      ) : selectedItemType === MappableTypeEnum.BillableMetric ? (
        <NetsuiteIntegrationItemsListBillableMetrics
          data={billableMetricsData}
          fetchMoreBillableMetrics={fetchMoreBillableMetrics}
          integrationId={integrationId}
          isLoading={isLoaddingBillableMetrics}
          hasError={!!billableMetricsError}
          netsuiteMapItemDialogRef={netsuiteMapItemDialogRef}
          searchTerm={billableMetricsVariables?.searchTerm}
        />
      ) : null}

      <NetsuiteMapItemDialog ref={netsuiteMapItemDialogRef} />
    </>
  )
}

export default NetsuiteIntegrationItemsList

const ItemTypeSelectorLine = styled.div`
  height: ${NAV_HEIGHT}px;
  padding: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
`
