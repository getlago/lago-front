import { ApolloClient, gql, LazyQueryExecFunction, useApolloClient } from '@apollo/client'
import { useCallback, useMemo, useReducer, useRef } from 'react'

import { getIntegrationItemLabel } from '~/components/customerConnections/getIntegrationItemLabel'
import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import { addToast, isSilencedGQLError } from '~/core/apolloClient'
import {
  GetQuickbooksCustomerItemsQuery,
  GetQuickbooksCustomerItemsQueryVariables,
  IntegrationItemTypeEnum,
  LagoApiError,
  QuickbooksCustomerItemFragment,
  useFetchQuickbooksCustomerItemsMutation,
  useGetQuickbooksCustomerItemsCountQuery,
  useGetQuickbooksCustomerItemsLazyQuery,
} from '~/generated/graphql'
import { usePermissions } from '~/hooks/usePermissions'

// The sync mutation selects ids only: its errors are read, and refetchQueries reloads the list.
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
        id
      }
    }
  }
`

export const QUICKBOOKS_CUSTOMER_ITEMS_LIMIT = 100

// Keyed by client so each Apollo store, a test's included, starts with nothing synced.
const syncedIntegrations = new WeakMap<ApolloClient, Set<string>>()
// Integrations whose last sync hit the API's customer cap, so a reopened drawer still knows
const tooLargeIntegrations = new WeakMap<ApolloClient, Set<string>>()

const REFETCH_QUERIES = ['getQuickbooksCustomerItems', 'getQuickbooksCustomerItemsCount']

// The codes the error link leaves without a toast: the ones passed below, plus forbidden
const SILENCED_ERROR_CODES = [LagoApiError.UnprocessableEntity, LagoApiError.Forbidden]

const TOO_MANY_CUSTOMERS_ERROR = 'too_many_customers'

export const toQuickbooksCustomerOption = ({
  externalId,
  externalName,
}: QuickbooksCustomerItemFragment): BasicComboBoxData => ({
  value: externalId,
  label: getIntegrationItemLabel({ externalId, externalName }),
})

type UseQuickbooksCustomerItemsReturn = {
  options: BasicComboBoxData[]
  hasStoredCustomers: boolean
  isLoading: boolean
  isRefreshing: boolean
  isListTooLarge: boolean
  canRefresh: boolean
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
  const { hasPermissions } = usePermissions()
  // The stored list needs the integrations view permission, a sync the update one
  const canListCustomers = hasPermissions(['organizationIntegrationsView'])
  const canRefresh = hasPermissions(['organizationIntegrationsUpdate'])

  const { data: countData, loading: countLoading } = useGetQuickbooksCustomerItemsCountQuery({
    variables: {
      integrationId: integrationId ?? '',
      itemType: IntegrationItemTypeEnum.Customer,
    },
    skip: !integrationId || !canListCustomers,
  })

  const [getItems, { data, loading: itemsLoading }] = useGetQuickbooksCustomerItemsLazyQuery({
    notifyOnNetworkStatusChange: true,
  })

  const [fetchCustomers, { loading: isRefreshing }] = useFetchQuickbooksCustomerItemsMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    errorPolicy: 'all',
    refetchQueries: REFETCH_QUERIES,
  })

  // useDebouncedSearch memoises the first `search` it is given: the integration is read at call
  // time, since a value captured here would never be refreshed.
  const integrationIdRef = useRef(integrationId)

  integrationIdRef.current = integrationId

  const search = useCallback<
    LazyQueryExecFunction<GetQuickbooksCustomerItemsQuery, GetQuickbooksCustomerItemsQueryVariables>
  >(
    (options) =>
      getItems({
        ...options,
        variables: {
          ...options?.variables,
          integrationId: integrationIdRef.current ?? '',
          itemType: IntegrationItemTypeEnum.Customer,
          limit: QUICKBOOKS_CUSTOMER_ITEMS_LIMIT,
        },
      }),
    [getItems],
  )

  // The API replaces the whole list on each fetch, so two at once collide on its unique index.
  const isRefreshingRef = useRef(false)

  // The flag lives outside React (see `tooLargeIntegrations`): a change re-renders explicitly.
  const [, rerender] = useReducer((count: number) => count + 1, 0)
  const isListTooLarge = !!integrationId && !!tooLargeIntegrations.get(client)?.has(integrationId)

  const setListTooLarge = useCallback(
    (id: string, isTooLarge: boolean): void => {
      const tooLarge = tooLargeIntegrations.get(client) ?? new Set<string>()

      if (isTooLarge) tooLarge.add(id)
      else tooLarge.delete(id)

      tooLargeIntegrations.set(client, tooLarge)
      rerender()
    },
    [client],
  )

  const sync = useCallback(
    (notifyOnError: boolean): boolean => {
      if (!integrationId || !canRefresh || isRefreshingRef.current) return false

      isRefreshingRef.current = true

      void fetchCustomers({ variables: { input: { integrationId } } })
        .then(({ errors }) => {
          // Past the API's customer cap, the stored list is left as it was: the field asks for
          // a typed id instead, since that list can miss the customer.
          const hasTooManyCustomers = !!errors?.some(({ extensions }) =>
            isSilencedGQLError({
              extensions,
              silentErrorCodes: [],
              silentErrorDetails: [TOO_MANY_CUSTOMERS_ERROR],
            }),
          )

          if (hasTooManyCustomers || !errors?.length) {
            setListTooLarge(integrationId, hasTooManyCustomers)
          }

          // Other codes already get the global error toast from the error link. The automatic
          // sync stays quiet: the plain id input remains usable without the list.
          const isSilenced = !!errors?.some(({ extensions }) =>
            isSilencedGQLError({
              extensions,
              silentErrorCodes: SILENCED_ERROR_CODES,
              silentErrorDetails: [],
            }),
          )

          if (!isSilenced || !notifyOnError) return

          addToast({
            severity: 'danger',
            translateKey: hasTooManyCustomers
              ? 'text_179551175424115ckjscs7o7'
              : 'text_62b31e1f6a5b8b1b745ece48',
          })
        })
        // The error link only toasts GraphQL errors: a network failure needs its own toast
        .catch(() => {
          if (notifyOnError) {
            addToast({ severity: 'danger', translateKey: 'text_62b31e1f6a5b8b1b745ece48' })
          }
        })
        .finally(() => {
          isRefreshingRef.current = false
        })

      return true
    },
    [canRefresh, fetchCustomers, integrationId, setListTooLarge],
  )

  const refresh = useCallback((): void => {
    sync(true)
  }, [sync])

  // Nango syncs asynchronously: sync each integration once per session, so StrictMode's double
  // effect and every reopened drawer leave later syncs to the reload button.
  const refreshOnce = useCallback((): void => {
    const synced = syncedIntegrations.get(client) ?? new Set<string>()

    if (!integrationId || synced.has(integrationId)) return

    // Marked only once its sync starts: one skipped behind another integration's sync runs later
    if (sync(false)) syncedIntegrations.set(client, synced.add(integrationId))
  }, [client, integrationId, sync])

  const options = useMemo(
    () => (data?.integrationItems?.collection || []).map(toQuickbooksCustomerOption),
    [data],
  )

  return {
    options,
    hasStoredCustomers: (countData?.integrationItems?.metadata.totalCount ?? 0) > 0,
    isLoading: (countLoading && !countData) || itemsLoading,
    isRefreshing,
    isListTooLarge,
    canRefresh,
    search,
    refresh,
    refreshOnce,
  }
}
