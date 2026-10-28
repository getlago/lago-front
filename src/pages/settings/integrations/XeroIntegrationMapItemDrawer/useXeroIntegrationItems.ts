import { useCallback, useMemo, useRef } from 'react'

import { BasicComboBoxData, ComboBoxProps } from '~/components/form'
import {
  IntegrationItemTypeEnum,
  MappableTypeEnum,
  MappingTypeEnum,
  useGetXeroIntegrationItemsLazyQuery,
  useTriggerXeroIntegrationAccountsRefetchMutation,
  useTriggerXeroIntegrationItemsRefetchMutation,
} from '~/generated/graphql'

import { stringifyOptionValue } from './stringifyOptionValue'

export type UseXeroIntegrationItemsReturn = {
  comboboxData: BasicComboBoxData[]
  isLoading: boolean
  searchQuery: ComboBoxProps['searchQuery']
  refresh: () => void
}

export const useXeroIntegrationItems = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
  integrationId: string | undefined,
): UseXeroIntegrationItemsReturn => {
  const isAccountContext = formType === MappingTypeEnum.Account

  // Inject the current integrationId at call time: useDebouncedSearch fires searchQuery()
  // on mount with no args, so default variables alone are not reliable.
  const integrationIdRef = useRef(integrationId)

  integrationIdRef.current = integrationId

  const [rawGetXeroIntegrationItems, { loading: itemsFetchLoading, data: itemsFetchData }] =
    useGetXeroIntegrationItemsLazyQuery()

  const getXeroIntegrationItems = useCallback(
    (...args: Parameters<typeof rawGetXeroIntegrationItems>) => {
      const currentIntegrationId = integrationIdRef.current

      if (!currentIntegrationId) return

      return rawGetXeroIntegrationItems({
        ...args[0],
        variables: {
          ...args[0]?.variables,
          limit: 1000,
          integrationId: currentIntegrationId,
          itemType: isAccountContext
            ? IntegrationItemTypeEnum.Account
            : IntegrationItemTypeEnum.Standard,
        },
      })
    },
    [isAccountContext, rawGetXeroIntegrationItems],
  )

  const [triggerAccountItemRefetch, { loading: accountItemsLoading }] =
    useTriggerXeroIntegrationAccountsRefetchMutation({
      ...(integrationId && {
        variables: { input: { integrationId } },
      }),
      refetchQueries: ['getXeroIntegrationItems'],
    })

  const [triggerItemRefetch, { loading: itemsLoading }] =
    useTriggerXeroIntegrationItemsRefetchMutation({
      ...(integrationId && {
        variables: { input: { integrationId } },
      }),
      refetchQueries: ['getXeroIntegrationItems'],
    })

  const comboboxData = useMemo(
    () =>
      (itemsFetchData?.integrationItems?.collection || []).map(
        ({ externalId, externalName, externalAccountCode }) => ({
          label: `${externalName} (${externalAccountCode})`,
          description: externalId,
          value: stringifyOptionValue({
            externalId,
            externalName: externalName || '',
            externalAccountCode: externalAccountCode || '',
          }),
        }),
      ),
    [itemsFetchData?.integrationItems?.collection],
  )

  const refresh = useCallback((): void => {
    if (isAccountContext) {
      void triggerAccountItemRefetch()
      return
    }

    void triggerItemRefetch()
  }, [isAccountContext, triggerAccountItemRefetch, triggerItemRefetch])

  return {
    comboboxData,
    isLoading: itemsFetchLoading || itemsLoading || accountItemsLoading,
    searchQuery: integrationId
      ? (getXeroIntegrationItems as unknown as ComboBoxProps['searchQuery'])
      : undefined,
    refresh,
  }
}
