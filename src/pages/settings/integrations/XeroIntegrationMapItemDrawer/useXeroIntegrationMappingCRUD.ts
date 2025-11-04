import { addToast } from '~/core/apolloClient'
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
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useXeroIntegrationMappingCRUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
  integrationId?: string,
) => {
  const { translate } = useInternationalization()

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
    onCompleted(data) {
      if (data && data.createIntegrationCollectionMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
      }
    },
    refetchQueries: getRefetchQueries(),
  })
  const [createMapping] = useCreateXeroIntegrationMappingMutation({
    onCompleted(data) {
      if (data && data.createIntegrationMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
      }
    },
    refetchQueries: getRefetchQueries(),
  })

  // Mapping edition
  const [updateCollectionMapping] = useUpdateXeroIntegrationCollectionMappingMutation({
    onCompleted(data) {
      if (data && data.updateIntegrationCollectionMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190641'),
          severity: 'success',
        })
      }
    },
    refetchQueries: getRefetchQueries(),
  })
  const [updateMapping] = useUpdateXeroIntegrationMappingMutation({
    onCompleted(data) {
      if (data && data.updateIntegrationMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190641'),
          severity: 'success',
        })
      }
    },
    refetchQueries: getRefetchQueries(),
  })

  // Mapping deletion
  const [deleteCollectionMapping] = useDeleteXeroIntegrationCollectionMappingMutation({
    onCompleted(data) {
      if (data && data.destroyIntegrationCollectionMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f19063e'),
          severity: 'success',
        })
      }
    },
    refetchQueries: getRefetchQueries(),
  })
  const [deleteMapping] = useDeleteXeroIntegrationMappingMutation({
    onCompleted(data) {
      if (data && data.destroyIntegrationMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f19063e'),
          severity: 'success',
        })
      }
    },
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
