import { useCallback, useMemo, useRef, useState } from 'react'

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

import { stringifyOptionValue } from './stringifyOptionValue'

const ITEMS_LIMIT = 1000

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
  (data?.integrationItems?.collection || []).map(
    ({ externalId, externalName, externalAccountCode }) => ({
      label: `${externalName} (${externalAccountCode})`,
      description: externalId,
      value: stringifyOptionValue({
        externalId,
        externalName: externalName || '',
        externalAccountCode: externalAccountCode || '',
      }),
    }),
  )

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
    isLoading: itemsFetchLoading || refetchItemsLoading || accountItemsLoading,
    refresh,
  }
}

// Owned by each form wrapper: the result of a search belongs to the field that ran it, and dies
// with it, so another field is neither narrowed by it nor left holding it.
export const useXeroIntegrationItemSearch = (
  formType: XeroFormType,
  integrationId: string | undefined,
): UseXeroIntegrationItemSearchReturn => {
  const itemType = getItemType(formType)
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined)

  const [rawSearchItems, { data, loading }] = useGetXeroIntegrationItemsLazyQuery()

  // useDebouncedSearch memoises the first `search` it is given and calls it with no args, so the
  // identifying variables are injected at call time rather than left to defaults.
  const integrationIdRef = useRef(integrationId)

  integrationIdRef.current = integrationId

  const search = useCallback(
    (...args: Parameters<typeof rawSearchItems>) => {
      const currentIntegrationId = integrationIdRef.current

      setSearchTerm(args[0]?.variables?.searchTerm ?? undefined)

      if (!currentIntegrationId) return

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
    [itemType, rawSearchItems],
  )

  return {
    searchResults: useMemo(() => toComboboxData(data), [data]),
    isSearching: !!searchTerm,
    isLoading: loading,
    search: integrationId ? (search as unknown as ComboBoxProps['searchQuery']) : undefined,
  }
}
