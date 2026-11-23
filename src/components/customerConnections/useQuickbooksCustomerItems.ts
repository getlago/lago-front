import { ApolloClient, gql, useApolloClient } from '@apollo/client'
import { useCallback, useMemo, useRef } from 'react'

import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import {
  IntegrationItemTypeEnum,
  QuickbooksCustomerItemFragment,
  useFetchQuickbooksCustomerItemsMutation,
  useGetQuickbooksCustomerItemsCountQuery,
  useGetQuickbooksCustomerItemsLazyQuery,
} from '~/generated/graphql'

gql`
  fragment QuickbooksCustomerItem on IntegrationItem {
    id
    externalId
    externalName
  }

  query getQuickbooksCustomerItems(
    $integrationId: ID!
    $itemType: IntegrationItemTypeEnum
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    integrationItems(
      integrationId: $integrationId
      itemType: $itemType
      page: $page
      limit: $limit
      searchTerm: $searchTerm
    ) {
      collection {
        ...QuickbooksCustomerItem
      }
    }
  }

  query getQuickbooksCustomerItemsCount($integrationId: ID!, $itemType: IntegrationItemTypeEnum) {
    integrationItems(integrationId: $integrationId, itemType: $itemType, limit: 1) {
      metadata {
        totalCount
      }
    }
  }

  mutation fetchQuickbooksCustomerItems($input: FetchIntegrationCustomersInput!) {
    fetchIntegrationCustomers(input: $input) {
      collection {
        ...QuickbooksCustomerItem
      }
    }
  }
`

export const QUICKBOOKS_CUSTOMER_ITEMS_LIMIT = 100

// Keyed by client so each Apollo store, a test's included, starts with nothing synced.
const syncedIntegrations = new WeakMap<ApolloClient, Set<string>>()

const REFETCH_QUERIES = ['getQuickbooksCustomerItems', 'getQuickbooksCustomerItemsCount']

export const toQuickbooksCustomerOption = ({
  externalId,
  externalName,
}: QuickbooksCustomerItemFragment): BasicComboBoxData => ({
  value: externalId,
  label: externalName ? `${externalName} (${externalId})` : externalId,
})

type UseQuickbooksCustomerItemsReturn = {
  options: BasicComboBoxData[]
  hasStoredCustomers: boolean
  isLoading: boolean
  isRefreshing: boolean
  search: ComboBoxProps['searchQuery']
  refresh: () => void
  refreshOnce: () => void
}

// A count picks the picker or the plain id input, the picker searches the stored list on the
// server, and a refresh asks Lago to sync the list from QuickBooks again.
export const useQuickbooksCustomerItems = (
  integrationId: string | undefined,
): UseQuickbooksCustomerItemsReturn => {
  const client = useApolloClient()

  const { data: countData, loading: countLoading } = useGetQuickbooksCustomerItemsCountQuery({
    variables: {
      integrationId: integrationId as string,
      itemType: IntegrationItemTypeEnum.Customer,
    },
    skip: !integrationId,
  })

  const [getItems, { data, loading: itemsLoading }] = useGetQuickbooksCustomerItemsLazyQuery({
    notifyOnNetworkStatusChange: true,
  })

  const [fetchCustomers, { loading: isRefreshing }] = useFetchQuickbooksCustomerItemsMutation({
    refetchQueries: REFETCH_QUERIES,
  })

  // useDebouncedSearch memoises the first `search` it is given: the integration is read at call
  // time, since a value captured here would never be refreshed.
  const integrationIdRef = useRef(integrationId)

  integrationIdRef.current = integrationId

  const search = useCallback(
    (...args: Parameters<typeof getItems>): ReturnType<typeof getItems> | undefined => {
      if (!integrationIdRef.current) return undefined

      return getItems({
        ...args[0],
        variables: {
          ...args[0]?.variables,
          integrationId: integrationIdRef.current,
          itemType: IntegrationItemTypeEnum.Customer,
          limit: QUICKBOOKS_CUSTOMER_ITEMS_LIMIT,
        },
      })
    },
    [getItems],
  )

  // The API replaces the whole list on each fetch, so two at once collide on its unique index.
  const isRefreshingRef = useRef(false)

  const refresh = useCallback((): void => {
    if (!integrationId || isRefreshingRef.current) return

    isRefreshingRef.current = true

    void fetchCustomers({ variables: { input: { integrationId } } }).finally(() => {
      isRefreshingRef.current = false
    })
  }, [fetchCustomers, integrationId])

  // Nango syncs asynchronously: sync each integration once per session, so StrictMode's double
  // effect and every reopened drawer leave later syncs to the reload button.
  const refreshOnce = useCallback((): void => {
    const synced = syncedIntegrations.get(client) ?? new Set<string>()

    if (!integrationId || synced.has(integrationId)) return

    syncedIntegrations.set(client, synced.add(integrationId))
    refresh()
  }, [client, integrationId, refresh])

  const options = useMemo(
    () => (data?.integrationItems?.collection || []).map(toQuickbooksCustomerOption),
    [data],
  )

  return {
    options,
    hasStoredCustomers: (countData?.integrationItems?.metadata.totalCount ?? 0) > 0,
    isLoading: (countLoading && !countData) || itemsLoading,
    isRefreshing,
    search: search as unknown as ComboBoxProps['searchQuery'],
    refresh,
    refreshOnce,
  }
}
