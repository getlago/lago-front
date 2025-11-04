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
import type {
  BillingEntityForIntegrationMapping,
  ItemMappingForMappable,
  ItemMappingForNonTaxMapping,
  ItemMappingForTaxMapping,
} from '~/pages/settings/integrations/common'
import { CreateUpdateDeleteSuccessAnswer } from '~/pages/settings/integrations/common/types'

import type { FormValuesType } from './types'

type CreateUpdateDeleteFunctions = {
  createCollectionMapping: ReturnType<typeof useCreateAnrokIntegrationCollectionMappingMutation>[0]
  createMapping: ReturnType<typeof useCreateAnrokIntegrationMappingMutation>[0]
  deleteCollectionMapping: ReturnType<typeof useDeleteAnrokIntegrationCollectionMappingMutation>[0]
  deleteMapping: ReturnType<typeof useDeleteAnrokIntegrationMappingMutation>[0]
  updateCollectionMapping: ReturnType<typeof useUpdateAnrokIntegrationCollectionMappingMutation>[0]
  updateMapping: ReturnType<typeof useUpdateAnrokIntegrationMappingMutation>[0]
}

export const handleIntegrationMappingCUD = async (
  inputValues: FormValuesType['values'],
  initialMapping:
    | ItemMappingForTaxMapping
    | ItemMappingForNonTaxMapping
    | ItemMappingForMappable
    | undefined,
  formType: MappingTypeEnum | MappableTypeEnum,
  integrationId: string,
  {
    createCollectionMapping,
    createMapping,
    deleteCollectionMapping,
    deleteMapping,
    updateCollectionMapping,
    updateMapping,
  }: CreateUpdateDeleteFunctions,
  billingEntity: BillingEntityForIntegrationMapping,
): Promise<CreateUpdateDeleteSuccessAnswer> => {
  const isCollectionContext = (type: unknown): type is MappingTypeEnum => {
    return Object.values(MappingTypeEnum).includes(type as MappingTypeEnum)
  }

  const hasItemValues = !!inputValues.externalId && !!inputValues.externalName

  const isTaxContext =
    !!initialMapping &&
    'taxCode' in initialMapping &&
    'taxNexus' in initialMapping &&
    'taxType' in initialMapping
  const hasInitialData = isTaxContext
    ? !!initialMapping.taxCode && !!initialMapping.taxNexus && !!initialMapping.taxType
    : !!initialMapping?.itemExternalId
  const isCreate = !!initialMapping && !initialMapping.itemId && hasItemValues
  const isEdit = !isCreate && hasInitialData && hasItemValues
  const isDelete =
    !isCreate && !isEdit && !hasItemValues && !!initialMapping && initialMapping.itemId

  /**
   * Happens since we launch this function for each billing entity, but some billing entities
   * might not have any data to process (no initial data and no input data) = we want to keep the default mapping
   */
  if (!isCreate && !isEdit && !isDelete) {
    return { success: true }
  }

  if (isDelete) {
    if (!initialMapping?.itemId) return { success: false, reasons: ['No initial mapping ID found'] }

    const answer = isCollectionContext(formType)
      ? await deleteCollectionMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
            },
          },
        })
      : await deleteMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
            },
          },
        })

    const { errors } = answer

    if (!errors || errors.length === 0) {
      return { success: true }
    }

    return { success: false, errors }
  }

  if (isEdit) {
    if (!initialMapping?.itemId) return { success: false, reasons: ['No initial mapping ID found'] }

    const answer = isCollectionContext(formType)
      ? await updateCollectionMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
              externalId: inputValues.externalId,
              externalName: inputValues.externalName,
              integrationId: integrationId,
              mappingType: formType,
            },
          },
        })
      : await updateMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
              externalId: inputValues.externalId,
              externalName: inputValues.externalName,
              integrationId: integrationId as string,
              mappableType: formType,
              // Here we know the typing is correct because we checked with the collection context before
              mappableId: (initialMapping as ItemMappingForMappable).lagoMappableId,
            },
          },
        })

    const { errors } = answer

    if (!errors || errors.length === 0) {
      return { success: true }
    }

    return { success: false, errors }
  }

  // This allows us to add the id only if needed
  const billingEntityObject = billingEntity.id ? { billingEntityId: billingEntity.id } : {}

  const answer = isCollectionContext(formType)
    ? await createCollectionMapping({
        variables: {
          input: {
            externalId: inputValues.externalId,
            externalName: inputValues.externalName,
            integrationId: integrationId,
            mappingType: formType,
            ...billingEntityObject,
          },
        },
      })
    : await createMapping({
        variables: {
          input: {
            externalId: inputValues.externalId,
            externalName: inputValues.externalName,
            integrationId: integrationId,
            mappableType: formType,
            // Here we know the typing is correct because we checked with the collection context before
            mappableId: (initialMapping as ItemMappingForMappable).lagoMappableId,
            ...billingEntityObject,
          },
        },
      })

  const { errors } = answer

  if (!errors || errors.length === 0) {
    return { success: true }
  }

  return { success: false, errors }
}
