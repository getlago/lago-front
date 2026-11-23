import { gql, Reference } from '@apollo/client'

import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateXeroIntegrationCollectionMappingMutation,
  useCreateXeroIntegrationMappingMutation,
  useDeleteXeroIntegrationCollectionMappingMutation,
  useDeleteXeroIntegrationMappingMutation,
  useUpdateXeroIntegrationCollectionMappingMutation,
  useUpdateXeroIntegrationMappingMutation,
} from '~/generated/graphql'

const MAPPING_CACHE_FRAGMENT = gql`
  fragment XeroMappingCacheFields on Mapping {
    id
    externalId
    externalName
    externalAccountCode
    mappableType
    billingEntityId
    mappableId
  }
`

export const useXeroIntegrationMappingCRUD = (
  formType: MappableTypeEnum | MappingTypeEnum | undefined,
) => {
  const isPaginated =
    formType === MappableTypeEnum.AddOn || formType === MappableTypeEnum.BillableMetric

  const parentTypename = formType === MappableTypeEnum.AddOn ? 'AddOn' : 'BillableMetric'

  // Mapping Creation
  const [createCollectionMapping] = useCreateXeroIntegrationCollectionMappingMutation({
    refetchQueries: ['getXeroIntegrationCollectionMappings'],
  })
  const [createMapping] = useCreateXeroIntegrationMappingMutation(
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
                      __typename: 'Mapping' as const,
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
      : { refetchQueries: ['getXeroIntegrationCollectionMappings'] },
  )

  // Mapping edition
  const [updateCollectionMapping] = useUpdateXeroIntegrationCollectionMappingMutation({
    refetchQueries: ['getXeroIntegrationCollectionMappings'],
  })
  const [updateMapping] = useUpdateXeroIntegrationMappingMutation(
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
      : { refetchQueries: ['getXeroIntegrationCollectionMappings'] },
  )

  // Mapping deletion
  const [deleteCollectionMapping] = useDeleteXeroIntegrationCollectionMappingMutation({
    refetchQueries: ['getXeroIntegrationCollectionMappings'],
  })
  const [deleteMapping] = useDeleteXeroIntegrationMappingMutation(
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
                fragment MappingParentId on Mapping {
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
                  integrationMappings(existingMappings: readonly Reference[] = [], { readField }) {
                    return existingMappings.filter((ref) => readField('id', ref) !== deletedId)
                  },
                },
              })
            }

            cache.evict({ id: cacheId })
            cache.gc()
          },
        }
      : { refetchQueries: ['getXeroIntegrationCollectionMappings'] },
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
