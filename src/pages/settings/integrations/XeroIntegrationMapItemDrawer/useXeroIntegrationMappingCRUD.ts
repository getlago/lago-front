import {
  IntegrationItemTypeEnum,
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateXeroIntegrationCollectionMappingMutation,
  useCreateXeroIntegrationMappingMutation,
  useDeleteXeroIntegrationCollectionMappingMutation,
  useDeleteXeroIntegrationMappingMutation,
  useGetXeroIntegrationItemsLazyQuery,
  useTriggerXeroIntegrationAccountsRefetchMutation,
  useTriggerXeroIntegrationItemsRefetchMutation,
  useUpdateXeroIntegrationCollectionMappingMutation,
  useUpdateXeroIntegrationMappingMutation,
} from '~/generated/graphql'

export const useXeroIntegrationMappingCRUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
  integrationId?: string,
) => {
  const isAccountContext = formType === MappingTypeEnum.Account

  const getRefetchQueries = () => {
    if (formType === MappableTypeEnum.AddOn) return ['getAddOnsForXeroItemsList']

    if (formType === MappableTypeEnum.BillableMetric) {
      return ['getBillableMetricsForXeroItemsList']
    }

    return ['getXeroIntegrationCollectionMappings']
  }

  // Item fetch
  const [
    getXeroIntegrationItems,
    { loading: initialItemFetchLoading, data: initialItemFetchData },
  ] = useGetXeroIntegrationItemsLazyQuery({
    variables: {
      limit: 1000,
      integrationId: integrationId as string,
      itemType: isAccountContext
        ? IntegrationItemTypeEnum.Account
        : IntegrationItemTypeEnum.Standard,
    },
  })

  const [triggerAccountItemRefetch, { loading: accountItemsLoading }] =
    useTriggerXeroIntegrationAccountsRefetchMutation({
      variables: { input: { integrationId: integrationId as string } },
      refetchQueries: ['getXeroIntegrationItems'],
    })

  const [triggerItemRefetch, { loading: itemsLoading }] =
    useTriggerXeroIntegrationItemsRefetchMutation({
      variables: { input: { integrationId: integrationId as string } },
      refetchQueries: ['getXeroIntegrationItems'],
    })

  // Mapping Creation
  const [createCollectionMapping] = useCreateXeroIntegrationCollectionMappingMutation({
    refetchQueries: getRefetchQueries(),
  })
  const [createMapping] = useCreateXeroIntegrationMappingMutation({
    refetchQueries: getRefetchQueries(),
  })

  // Mapping edition
  const [updateCollectionMapping] = useUpdateXeroIntegrationCollectionMappingMutation({
    refetchQueries: getRefetchQueries(),
  })
  const [updateMapping] = useUpdateXeroIntegrationMappingMutation({
    refetchQueries: getRefetchQueries(),
  })

  // Mapping deletion
  const [deleteCollectionMapping] = useDeleteXeroIntegrationCollectionMappingMutation({
    refetchQueries: getRefetchQueries(),
  })
  const [deleteMapping] = useDeleteXeroIntegrationMappingMutation({
    refetchQueries: getRefetchQueries(),
  })

  return {
    getXeroIntegrationItems,
    initialItemFetchLoading,
    initialItemFetchData,
    accountItemsLoading,
    itemsLoading,
    triggerAccountItemRefetch,
    triggerItemRefetch,
    createCollectionMapping,
    createMapping,
    deleteCollectionMapping,
    deleteMapping,
    updateCollectionMapping,
    updateMapping,
  }
}
