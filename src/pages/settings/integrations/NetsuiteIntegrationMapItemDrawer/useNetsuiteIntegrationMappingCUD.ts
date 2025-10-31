import { addToast } from '~/core/apolloClient'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateNetsuiteIntegrationCollectionMappingMutation,
  useCreateNetsuiteIntegrationMappingMutation,
  useDeleteNetsuiteIntegrationCollectionMappingMutation,
  useDeleteNetsuiteIntegrationMappingMutation,
  useUpdateNetsuiteIntegrationCollectionMappingMutation,
  useUpdateNetsuiteIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useNetsuiteIntegrationMappingCUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const { translate } = useInternationalization()

  const getRefetchQueries = () => {
    if (formType === MappableTypeEnum.AddOn) return ['getAddOnsForNetsuiteItemsList']

    if (formType === MappableTypeEnum.BillableMetric) {
      return ['getBillableMetricsForNetsuiteItemsList']
    }

    return ['getNetsuiteIntegrationCollectionMappings']
  }

  // Mapping Creation
  const [createCollectionMapping] = useCreateNetsuiteIntegrationCollectionMappingMutation({
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
  const [createMapping] = useCreateNetsuiteIntegrationMappingMutation({
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
  const [updateCollectionMapping] = useUpdateNetsuiteIntegrationCollectionMappingMutation({
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
  const [updateMapping] = useUpdateNetsuiteIntegrationMappingMutation({
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
  const [deleteCollectionMapping] = useDeleteNetsuiteIntegrationCollectionMappingMutation({
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
  const [deleteMapping] = useDeleteNetsuiteIntegrationMappingMutation({
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
    createCollectionMapping,
    createMapping,
    deleteCollectionMapping,
    deleteMapping,
    updateCollectionMapping,
    updateMapping,
  }
}
