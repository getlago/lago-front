import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import {
  GetXeroIntegrationItemsQuery,
  IntegrationItemTypeEnum,
  MappableTypeEnum,
  MappingTypeEnum,
  useGetXeroIntegrationItemsLazyQuery,
  useGetXeroIntegrationItemsQuery,
  useTriggerXeroIntegrationAccountsRefetchMutation,
  useTriggerXeroIntegrationItemsRefetchMutation,
} from '~/generated/graphql'

import { toXeroOption } from './toXeroOption'

const ITEMS_LIMIT = 1000
const NO_SEARCH_RESULTS: BasicComboBoxData[] = []

type XeroFormType = MappableTypeEnum | MappingTypeEnum | undefined

export type UseXeroIntegrationItemsReturn = {
  items: BasicComboBoxData[]
  isLoading: boolean
  refresh: () => void
}

export type UseXeroIntegrationItemSearchReturn = {
  searchResults: BasicComboBoxData[]
  isSearching: boolean
  isLoading: boolean
  search: ComboBoxProps['searchQuery']
}

const getItemType = (formType: XeroFormType): IntegrationItemTypeEnum =>
  formType === MappingTypeEnum.Account
    ? IntegrationItemTypeEnum.Account
    : IntegrationItemTypeEnum.Standard

const toComboboxData = (data: GetXeroIntegrationItemsQuery | undefined): BasicComboBoxData[] =>
  (data?.integrationItems?.collection || []).map(toXeroOption)

// Owned by the drawer and fetched once: the form wrappers mount and unmount with the billing
// entity tabs, so a query of theirs would re-run on every switch.
export const useXeroIntegrationItems = (
  formType: XeroFormType,
  integrationId: string | undefined,
): UseXeroIntegrationItemsReturn => {
  const itemType = getItemType(formType)

  const { data, loading: itemsFetchLoading } = useGetXeroIntegrationItemsQuery({
    variables: { integrationId: integrationId as string, itemType, limit: ITEMS_LIMIT },
    skip: !integrationId,
  })

  const [triggerAccountItemRefetch, { loading: accountItemsLoading }] =
    useTriggerXeroIntegrationAccountsRefetchMutation({
      ...(integrationId && {
        variables: { input: { integrationId } },
      }),
      refetchQueries: ['getXeroIntegrationItems'],
    })

  const [triggerItemRefetch, { loading: refetchItemsLoading }] =
    useTriggerXeroIntegrationItemsRefetchMutation({
      ...(integrationId && {
        variables: { input: { integrationId } },
      }),
      refetchQueries: ['getXeroIntegrationItems'],
    })

  const items = useMemo(() => toComboboxData(data), [data])

  const refresh = useCallback((): void => {
    if (itemType === IntegrationItemTypeEnum.Account) {
      void triggerAccountItemRefetch()
      return
    }

    void triggerItemRefetch()
  }, [itemType, triggerAccountItemRefetch, triggerItemRefetch])

  return {
    items,
    // Gated on the first load: under cache-and-network a reopened drawer revalidates a cached
    // catalog, and `loading` alone would spin over the list the field is already showing.
    isLoading: (itemsFetchLoading && !data) || refetchItemsLoading || accountItemsLoading,
    refresh,
  }
}

// Owned by each form wrapper: the result of a search belongs to the field that ran it, and dies
// with it, so another field is neither narrowed by it nor left holding it.
export const useXeroIntegrationItemSearch = (
  formType: XeroFormType,
  integrationId: string | undefined,
): UseXeroIntegrationItemSearchReturn => {
  const [searchResults, setSearchResults] = useState<BasicComboBoxData[] | undefined>(undefined)
  const [latestSearchTerm, setLatestSearchTerm] = useState<string | undefined>(undefined)

  const [rawSearchItems, { data, loading, variables }] = useGetXeroIntegrationItemsLazyQuery({
    notifyOnNetworkStatusChange: true,
  })

  // useDebouncedSearch memoises the first `search` it is given: the query params are read from the
  // ref at call time, since a value captured here would never be refreshed.
  const queryParamsRef = useRef({ integrationId, itemType: getItemType(formType) })

  queryParamsRef.current = { integrationId, itemType: getItemType(formType) }

  useEffect(() => {
    if (
      loading ||
      !data ||
      !latestSearchTerm ||
      variables?.searchTerm !== latestSearchTerm ||
      variables.integrationId !== queryParamsRef.current.integrationId ||
      variables.itemType !== queryParamsRef.current.itemType
    ) {
      return
    }

    setSearchResults(toComboboxData(data))
  }, [data, loading, variables, latestSearchTerm])

  const search = useCallback(
    (...args: Parameters<typeof rawSearchItems>): ReturnType<typeof rawSearchItems> | undefined => {
      const { integrationId: currentIntegrationId, itemType } = queryParamsRef.current
      const searchTerm = args[0]?.variables?.searchTerm ?? undefined

      setLatestSearchTerm(searchTerm)

      // Clearing the search falls back to the catalog the drawer already holds, so the 1000-item
      // query would only be run to throw its result away.
      if (!searchTerm) {
        setSearchResults(undefined)
        return undefined
      }

      if (!currentIntegrationId) return undefined

      return rawSearchItems({
        ...args[0],
        variables: {
          ...args[0]?.variables,
          limit: ITEMS_LIMIT,
          integrationId: currentIntegrationId,
          itemType,
        },
      })
    },
    [rawSearchItems],
  )

  return {
    searchResults: searchResults ?? NO_SEARCH_RESULTS,
    isSearching: !!searchResults,
    isLoading: loading,
    search: search as unknown as ComboBoxProps['searchQuery'],
  }
}
