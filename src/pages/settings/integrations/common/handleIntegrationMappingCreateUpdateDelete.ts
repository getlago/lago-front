import { NonNullableFields } from '~/core/types/nonNullableFields'
import { IntegrationTypeEnum, MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'

import { getParametersFromProvider } from './getParametersFromProvider'
import type {
  AvalaraAndAnrokParameters,
  BillingEntityForIntegrationMapping,
  CreateUpdateDeleteFunctions,
  CreateUpdateDeleteSuccessAnswer,
  ItemMappingForMappable,
  MappableIntegrationProvider,
  MappableItemMapping,
  NetsuiteParameters,
  XeroParameters,
} from './types'

const isCollectionContext = (type: unknown): type is MappingTypeEnum => {
  return Object.values(MappingTypeEnum).includes(type as MappingTypeEnum)
}

const isNetsuiteParameters = (
  parameters: AvalaraAndAnrokParameters | NetsuiteParameters | XeroParameters,
): parameters is NetsuiteParameters => {
  return 'taxCode' in parameters && 'taxNexus' in parameters && 'taxType' in parameters
}

const getHasItemValues = (
  parameters: AvalaraAndAnrokParameters | NetsuiteParameters | XeroParameters,
  provider: MappableIntegrationProvider,
  formType: MappingTypeEnum | MappableTypeEnum,
): parameters is NonNullableFields<typeof parameters> => {
  if (provider === IntegrationTypeEnum.Netsuite && isNetsuiteParameters(parameters)) {
    if (formType === MappingTypeEnum.Tax) {
      return !!parameters.taxCode && !!parameters.taxNexus && !!parameters.taxType
    }

    return !!parameters.externalId && !!parameters.externalName && !!parameters.externalAccountCode
  }

  return Object.values(parameters).every((value) => !!value)
}

const getParameterKeyFromInitialMappingKey = (
  key: string,
):
  keyof AvalaraAndAnrokParameters | keyof NetsuiteParameters | keyof XeroParameters | undefined => {
  switch (key) {
    case 'itemExternalId':
      return 'externalId'
    case 'itemExternalName':
      return 'externalName'
    case 'itemExternalCode':
      return 'externalAccountCode'
    case 'taxCode':
    case 'taxNexus':
    case 'taxType':
      return key
    default:
      return undefined
  }
}

type MappingParameters = AvalaraAndAnrokParameters | NetsuiteParameters | XeroParameters

// Rebuilds the snapshot entry from what the mutation applied, so a retry derives
// create/update/delete from the new server state. Null `parameters` means a delete.
const applyParametersToMapping = (
  initialMapping: MappableItemMapping,
  itemId: string | null,
  parameters: MappingParameters | null,
): MappableItemMapping => {
  // Only the keys the snapshot already carries are written: a key added here would be
  // compared against `parameters` on the next submit and force a pointless update.
  const applied = { ...initialMapping, itemId, itemExternalId: parameters?.externalId ?? null }

  if ('itemExternalName' in applied) {
    applied.itemExternalName = parameters?.externalName
  }

  if ('itemExternalCode' in applied) {
    applied.itemExternalCode =
      parameters && 'externalAccountCode' in parameters ? parameters.externalAccountCode : undefined
  }

  if ('taxCode' in applied) {
    const taxParameters = parameters && 'taxCode' in parameters ? parameters : null

    applied.taxCode = taxParameters?.taxCode ?? null
    applied.taxNexus = taxParameters?.taxNexus ?? null
    applied.taxType = taxParameters?.taxType ?? null
  }

  return applied
}

export const handleIntegrationMappingCreateUpdateDelete = async <FormValues>(
  inputValues: FormValues,
  initialMapping: MappableItemMapping | undefined,
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
  integrationProvider: MappableIntegrationProvider,
): Promise<CreateUpdateDeleteSuccessAnswer> => {
  const { success, parameters } = getParametersFromProvider<FormValues>(
    inputValues,
    integrationProvider,
  )

  if (!success) {
    return { success: false, reasons: ['Invalid input values'] }
  }

  const hasInitialData =
    initialMapping &&
    Object.entries(initialMapping).some(([key, value]) => {
      // Those are always given when working on billable metrics mapping or add ons mapping
      if (key === 'lagoMappableId' || key === 'lagoMappableName') return false

      return value !== null && value !== undefined
    })

  const hasItemValues = getHasItemValues(parameters, integrationProvider, formType)

  const isCreate = !!initialMapping && !initialMapping.itemId && hasItemValues
  const isEdit = !isCreate && hasInitialData && hasItemValues
  const isDelete =
    !isCreate && !isEdit && !hasItemValues && !!initialMapping && initialMapping.itemId

  /**
   * Happens since we launch this function for each billing entity, but some billing entities
   * might not have any data to process (no initial data and no input data) = we want to keep the default mapping
   */
  if (!hasItemValues && !hasInitialData) {
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
      return { success: true, appliedMapping: applyParametersToMapping(initialMapping, null, null) }
    }

    return { success: false, errors }
  }

  if (isEdit) {
    if (!initialMapping?.itemId) return { success: false, reasons: ['No initial mapping ID found'] }

    const initialMappingAndParametersAreEqual =
      hasInitialData &&
      Object.entries(initialMapping).every(([key, initialValue]) => {
        const parameterKey = getParameterKeyFromInitialMappingKey(key)

        // Skip the key if there are no matching (itemId for example)
        if (!parameterKey) {
          return true
        }

        return parameterKey in parameters
          ? // Cast typing because we already checked the key existence
            parameters[parameterKey as keyof typeof parameters] === initialValue
          : false
      })

    // Skip update if data hasn't changed
    if (initialMappingAndParametersAreEqual) {
      return { success: true }
    }

    const answer = isCollectionContext(formType)
      ? await updateCollectionMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
              integrationId: integrationId,
              mappingType: formType,
              ...parameters,
            },
          },
        })
      : await updateMapping({
          variables: {
            input: {
              id: initialMapping.itemId as string,
              integrationId: integrationId as string,
              mappableType: formType,
              // Here we know the typing is correct because we checked with the collection context before
              mappableId: (initialMapping as ItemMappingForMappable).lagoMappableId,
              ...parameters,
            },
          },
        })

    const { errors } = answer

    if (!errors || errors.length === 0) {
      return {
        success: true,
        appliedMapping: applyParametersToMapping(initialMapping, initialMapping.itemId, parameters),
      }
    }

    return { success: false, errors }
  }

  if (!isCreate) {
    return { success: false, reasons: ['Could not determine action to perform'] }
  }

  // This allows us to add the id only if needed
  const billingEntityObject = billingEntity.id ? { billingEntityId: billingEntity.id } : {}

  const created = isCollectionContext(formType)
    ? await createCollectionMapping({
        variables: {
          input: {
            integrationId: integrationId,
            mappingType: formType,
            ...billingEntityObject,
            ...parameters,
          },
        },
      }).then((answer) => ({
        errors: answer.errors,
        itemId: answer.data?.createIntegrationCollectionMapping?.id ?? null,
      }))
    : await createMapping({
        variables: {
          input: {
            integrationId: integrationId,
            mappableType: formType,
            // Here we know the typing is correct because we checked with the collection context before
            mappableId: (initialMapping as ItemMappingForMappable).lagoMappableId,
            ...billingEntityObject,
            ...parameters,
          },
        },
      }).then((answer) => ({
        errors: answer.errors,
        itemId: answer.data?.createIntegrationMapping?.id ?? null,
      }))

  const { errors, itemId } = created

  if (!errors || errors.length === 0) {
    return {
      success: true,
      appliedMapping: applyParametersToMapping(initialMapping, itemId, parameters),
    }
  }

  return { success: false, errors }
}
