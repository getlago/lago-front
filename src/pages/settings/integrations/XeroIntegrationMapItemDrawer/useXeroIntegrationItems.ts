import { useCallback, useMemo, useRef } from 'react'

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

export type UseXeroIntegrationItemsReturn = {
  items: BasicComboBoxData[]
  searchResults: BasicComboBoxData[]
  isLoading: boolean
  search: ComboBoxProps['searchQuery']
  refresh: () => void
}

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

export const useXeroIntegrationItems = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
  integrationId: string | undefined,
): UseXeroIntegrationItemsReturn => {
  const itemType =
    formType === MappingTypeEnum.Account
      ? IntegrationItemTypeEnum.Account
      : IntegrationItemTypeEnum.Standard

  // The unfiltered list is owned by the drawer and fetched once: the form wrappers mount and
  // unmount with the billing entity tabs, so a query of theirs would re-run on every switch.
  const { data: itemsData, loading: itemsFetchLoading } = useGetXeroIntegrationItemsQuery({
    variables: { integrationId: integrationId as string, itemType, limit: ITEMS_LIMIT },
    skip: !integrationId,
  })

  // Searching is a separate query so its narrowed result never replaces the unfiltered list.
  const [rawSearchItems, { data: searchData, loading: searchLoading }] =
    useGetXeroIntegrationItemsLazyQuery()

  // useDebouncedSearch calls the search with no args, so the identifying variables are injected
  // at call time rather than left to defaults.
  const integrationIdRef = useRef(integrationId)

  integrationIdRef.current = integrationId

  const searchItems = useCallback(
    (...args: Parameters<typeof rawSearchItems>) => {
      const currentIntegrationId = integrationIdRef.current

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

  const items = useMemo(() => toComboboxData(itemsData), [itemsData])
  const searchResults = useMemo(() => toComboboxData(searchData), [searchData])

  const refresh = useCallback((): void => {
    if (itemType === IntegrationItemTypeEnum.Account) {
      void triggerAccountItemRefetch()
      return
    }

    void triggerItemRefetch()
  }, [itemType, triggerAccountItemRefetch, triggerItemRefetch])

  return {
    items,
    searchResults,
    isLoading: itemsFetchLoading || searchLoading || refetchItemsLoading || accountItemsLoading,
    search: integrationId ? (searchItems as unknown as ComboBoxProps['searchQuery']) : undefined,
    refresh,
  }
}
