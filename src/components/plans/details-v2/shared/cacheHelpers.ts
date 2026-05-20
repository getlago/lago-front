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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [field]: (existing: any, { toReference }: { toReference: (o: any) => Reference | undefined }) => {
        const list = (existing as readonly unknown[] | undefined) ?? []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ref = toReference(newItem as any)
        return [...list, ref ?? newItem]
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [field]: (existing: any, { readField }: { readField: (k: string, ref: any) => unknown }) => {
        const list = (existing as readonly Reference[] | undefined) ?? []
        return list.filter((ref) => readField('id', ref) !== itemId)
      },
    },
  })
  cache.evict({ id: cache.identify({ __typename: itemTypename, id: itemId }) })
  cache.gc()
}
