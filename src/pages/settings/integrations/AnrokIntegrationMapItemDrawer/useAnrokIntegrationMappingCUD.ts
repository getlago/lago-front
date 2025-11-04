import { addToast } from '~/core/apolloClient'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateAnrokIntegrationCollectionMappingMutation,
  useCreateAnrokIntegrationMappingMutation,
  useDeleteAnrokIntegrationCollectionMappingMutation,
  useDeleteAnrokIntegrationMappingMutation,
  useUpdateAnrokIntegrationCollectionMappingMutation,
  useUpdateAnrokIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useAnrokIntegrationMappingCUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const { translate } = useInternationalization()

  const getRefetchQueries = () => {
    if (formType === MappableTypeEnum.AddOn) return ['getAddOnsForAnrokItemsList']

    if (formType === MappableTypeEnum.BillableMetric) {
      return ['getBillableMetricsForAnrokItemsList']
    }

    return ['getAnrokIntegrationCollectionMappings']
  }

  // Mapping Creation
  const [createCollectionMapping] = useCreateAnrokIntegrationCollectionMappingMutation({
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
  const [createMapping] = useCreateAnrokIntegrationMappingMutation({
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
  const [updateCollectionMapping] = useUpdateAnrokIntegrationCollectionMappingMutation({
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
  const [updateMapping] = useUpdateAnrokIntegrationMappingMutation({
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
  const [deleteCollectionMapping] = useDeleteAnrokIntegrationCollectionMappingMutation({
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
  const [deleteMapping] = useDeleteAnrokIntegrationMappingMutation({
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
