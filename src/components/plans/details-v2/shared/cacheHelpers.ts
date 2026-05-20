import { ApolloCache, Reference } from '@apollo/client'

type ParentEntity = { __typename: string; id: string }

export const cacheArrayInsert = (
  cache: ApolloCache<unknown>,
  parent: ParentEntity,
  field: string,
  newItem: Reference | object,
) => {
  cache.modify({
    id: cache.identify(parent),
    fields: {
      [field]: (existing: Reference[] = [], { toReference }) => {
        const ref = toReference(newItem as Reference)
        return [...existing, ref ?? newItem]
      },
    },
  })
}

export const cacheArrayRemove = (
  cache: ApolloCache<unknown>,
  parent: ParentEntity,
  field: string,
  itemId: string,
  itemTypename: string,
) => {
  cache.modify({
    id: cache.identify(parent),
    fields: {
      [field]: (existing: Reference[] = [], { readField }) =>
        existing.filter((ref) => readField('id', ref) !== itemId),
    },
  })
  cache.evict({ id: cache.identify({ __typename: itemTypename, id: itemId }) })
  cache.gc()
}
