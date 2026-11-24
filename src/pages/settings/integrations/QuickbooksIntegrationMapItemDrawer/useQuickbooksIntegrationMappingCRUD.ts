import { gql, Reference } from '@apollo/client'

import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateQuickbooksIntegrationCollectionMappingMutation,
  useCreateQuickbooksIntegrationMappingMutation,
  useDeleteQuickbooksIntegrationCollectionMappingMutation,
  useDeleteQuickbooksIntegrationMappingMutation,
  useUpdateQuickbooksIntegrationCollectionMappingMutation,
  useUpdateQuickbooksIntegrationMappingMutation,
} from '~/generated/graphql'

gql`
  fragment QuickbooksIntegrationMapItemDrawerCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment QuickbooksIntegrationMapItemDrawerCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Mapping Creation
  mutation createQuickbooksIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...QuickbooksIntegrationMapItemDrawerCollectionMappingItem
    }
  }

  mutation createQuickbooksIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...QuickbooksIntegrationMapItemDrawerCollectionItem
    }
  }

  # Mapping edition
  mutation updateQuickbooksIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateQuickbooksIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteQuickbooksIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteQuickbooksIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`

const MAPPING_CACHE_FRAGMENT = gql`
  fragment QuickbooksMappingCacheFields on Mapping {
    id
    externalId
    externalName
    externalAccountCode
    mappableType
    billingEntityId
    mappableId
  }
`

export const useQuickbooksIntegrationMappingCRUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const isPaginated =
    formType === MappableTypeEnum.AddOn || formType === MappableTypeEnum.BillableMetric

  const parentTypename = formType === MappableTypeEnum.AddOn ? 'AddOn' : 'BillableMetric'

  // Mapping Creation
  const [createCollectionMapping] = useCreateQuickbooksIntegrationCollectionMappingMutation({
    refetchQueries: ['getQuickbooksIntegrationCollectionMappings'],
  })
  const [createMapping] = useCreateQuickbooksIntegrationMappingMutation(
    isPaginated
      ? {
          update(cache, { data }, { variables }) {
            if (!data?.createIntegrationMapping || !variables?.input) return

            const newMapping = data.createIntegrationMapping
            const { mappableId, mappableType, billingEntityId } = variables.input

            cache.modify({
              id: cache.identify({ __typename: parentTypename, id: mappableId }),
              fields: {
                integrationMappings(existingMappings = []) {
                  const newRef = cache.writeFragment({
                    data: {
                      __typename: 'Mapping',
                      id: newMapping.id,
                      externalId: newMapping.externalId,
                      externalName: newMapping.externalName ?? null,
                      externalAccountCode: newMapping.externalAccountCode ?? null,
                      mappableType,
                      billingEntityId: billingEntityId ?? null,
                      mappableId,
                    },
                    fragment: MAPPING_CACHE_FRAGMENT,
                  })

                  return [...existingMappings, newRef]
                },
              },
            })
          },
        }
      : { refetchQueries: ['getQuickbooksIntegrationCollectionMappings'] },
  )

  // Mapping edition
  const [updateCollectionMapping] = useUpdateQuickbooksIntegrationCollectionMappingMutation({
    refetchQueries: ['getQuickbooksIntegrationCollectionMappings'],
  })
  const [updateMapping] = useUpdateQuickbooksIntegrationMappingMutation(
    isPaginated
      ? {
          update(cache, _result, { variables }) {
            if (!variables?.input) return

            const { id, externalId, externalName, externalAccountCode } = variables.input

            cache.modify({
              id: cache.identify({ __typename: 'Mapping', id }),
              fields: {
                ...(externalId !== undefined && { externalId: () => externalId }),
                ...(externalName !== undefined && { externalName: () => externalName }),
                ...(externalAccountCode !== undefined && {
                  externalAccountCode: () => externalAccountCode,
                }),
              },
            })
          },
        }
      : { refetchQueries: ['getQuickbooksIntegrationCollectionMappings'] },
  )

  // Mapping deletion
  const [deleteCollectionMapping] = useDeleteQuickbooksIntegrationCollectionMappingMutation({
    refetchQueries: ['getQuickbooksIntegrationCollectionMappings'],
  })
  const [deleteMapping] = useDeleteQuickbooksIntegrationMappingMutation(
    isPaginated
      ? {
          update(cache, { data }) {
            if (!data?.destroyIntegrationMapping?.id) return

            const deletedId = data.destroyIntegrationMapping.id
            const cacheId = cache.identify({ __typename: 'Mapping', id: deletedId })

            if (!cacheId) return

            const cachedMapping = cache.readFragment<{ mappableId: string }>({
              id: cacheId,
              fragment: gql`
                fragment QuickbooksMappingParentId on Mapping {
                  mappableId
                }
              `,
            })

            if (cachedMapping?.mappableId) {
              cache.modify({
                id: cache.identify({
                  __typename: parentTypename,
                  id: cachedMapping.mappableId,
                }),
                fields: {
                  integrationMappings(
                    existingMappings: readonly Reference[] | undefined,
                    { readField },
                  ) {
                    return (existingMappings ?? []).filter(
                      (ref) => readField('id', ref) !== deletedId,
                    )
                  },
                },
              })
            }

            cache.evict({ id: cacheId })
            cache.gc()
          },
        }
      : { refetchQueries: ['getQuickbooksIntegrationCollectionMappings'] },
  )

  return {
    createCollectionMapping,
    createMapping,
    deleteCollectionMapping,
    deleteMapping,
    updateCollectionMapping,
    updateMapping,
  }
}
