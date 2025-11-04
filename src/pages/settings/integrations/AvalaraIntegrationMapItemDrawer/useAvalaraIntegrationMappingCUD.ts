import { addToast } from '~/core/apolloClient'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateAvalaraIntegrationCollectionMappingMutation,
  useCreateAvalaraIntegrationMappingMutation,
  useDeleteAvalaraIntegrationCollectionMappingMutation,
  useDeleteAvalaraIntegrationMappingMutation,
  useUpdateAvalaraIntegrationCollectionMappingMutation,
  useUpdateAvalaraIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const useAvalaraIntegrationMappingCUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const { translate } = useInternationalization()

  const getRefetchQueries = () => {
    if (formType === MappableTypeEnum.AddOn) {
      return ['getAddOnsForAvalaraItemsList']
    }

    if (formType === MappableTypeEnum.BillableMetric) {
      return ['getBillableMetricsForAvalaraItemsList']
    }

    return ['getAvalaraIntegrationCollectionMappings']
  }

  // Mapping Creation
  const [createCollectionMapping] = useCreateAvalaraIntegrationCollectionMappingMutation({
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
  const [createMapping] = useCreateAvalaraIntegrationMappingMutation({
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
  const [updateCollectionMapping] = useUpdateAvalaraIntegrationCollectionMappingMutation({
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
  const [updateMapping] = useUpdateAvalaraIntegrationMappingMutation({
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
  const [deleteCollectionMapping] = useDeleteAvalaraIntegrationCollectionMappingMutation({
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
  const [deleteMapping] = useDeleteAvalaraIntegrationMappingMutation({
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
