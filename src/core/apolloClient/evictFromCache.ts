import { ApolloClient, DocumentNode } from '@apollo/client'
import { OperationDefinitionNode } from 'graphql'

/**
 * Evicts a deleted entity from the Apollo cache and removes it from paginated list fields.
 *
 * Uses `cache.batch` with selective `onWatchUpdated` to suppress notifications to detail page
 * query watchers (preventing 404 refetches), while still allowing list query watchers to
 * receive the update and re-render with the item removed.
 *
 * **Why this exists:** After a delete mutation, `cache.evict()` broadcasts to all active
 * `watchQuery` subscriptions. If a detail page query is still mounted, it refires, gets a
 * 404 from the server, and the global error link shows a danger toast. This helper solves
 * the problem by batching the eviction and only allowing specified list watchers through.
 *
 * @param client - The Apollo Client instance (from `useApolloClient()`)
 * @param options - Configuration for the eviction
 * @param options.id - The entity ID returned by the delete mutation
 * @param options.__typename - The GraphQL `__typename` of the entity (e.g. `'FeatureObject'`, `'Coupon'`)
 * @param options.listFieldName - Root query field name(s) to clean up. Accepts a single string
 *   or an array for entities that appear in multiple lists.
 *   Each field is expected to follow the paginated `{ collection, metadata }` structure
 *   from `createPaginatedFieldPolicy`.
 * @param options.listQueryDocument - The `DocumentNode`(s) of the list query/queries whose watchers
 *   should be allowed to proceed. All other watchers are suppressed. Accepts a single document
 *   or an array.
 *
 * @example
 * ```typescript
 * // In a delete mutation's onCompleted callback:
 * import { GetFeaturesListDocument } from '~/generated/graphql'
 *
 * const client = useApolloClient()
 *
 * evictFromCache(client, {
 *   id: destroyedFeature.id,
 *   __typename: 'FeatureObject',
 *   listFieldName: 'features',
 *   listQueryDocument: GetFeaturesListDocument,
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Entity appearing in multiple lists:
 * evictFromCache(client, {
 *   id: destroyedCoupon.id,
 *   __typename: 'Coupon',
 *   listFieldName: ['coupons', 'activeCoupons'],
 *   listQueryDocument: [CouponsDocument, ActiveCouponsDocument],
 * })
 * ```
 */
export const evictFromCache = (
  client: ApolloClient<object>,
  options: {
    id: string
    __typename: string
    listFieldName: string | string[]
    listQueryDocument: DocumentNode | DocumentNode[]
  },
) => {
  const cacheId = client.cache.identify({
    id: options.id,
    __typename: options.__typename,
  })

  if (!cacheId) return

  const listFieldNames = Array.isArray(options.listFieldName)
    ? options.listFieldName
    : [options.listFieldName]

  const listQueryDocuments = Array.isArray(options.listQueryDocument)
    ? options.listQueryDocument
    : [options.listQueryDocument]

  // Extract operation names from the provided documents for fallback comparison.
  // Apollo may transform/clone documents internally, so reference equality can fail.
  const listQueryNames = new Set(
    listQueryDocuments.flatMap((doc) =>
      doc.definitions
        .filter(
          (def): def is OperationDefinitionNode =>
            def.kind === 'OperationDefinition' && !!def.name?.value,
        )
        .map((def) => def.name?.value as string),
    ),
  )

  client.cache.batch({
    update(cache) {
      // Remove the entity from each paginated list field
      for (const fieldName of listFieldNames) {
        cache.modify({
          fields: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [fieldName](existing: any) {
              if (!existing?.collection) return existing

              return {
                ...existing,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                collection: existing.collection.filter((ref: any) => {
                  return cache.identify(ref) !== cacheId
                }),
              }
            },
          },
        })
      }

      // Evict the normalized entity entry
      cache.evict({ id: cacheId })
      cache.gc()
    },
    // Only allow the specified list query watchers to proceed.
    // All other watchers (detail page queries) are suppressed to prevent 404 refetches.
    onWatchUpdated(watch) {
      const isAllowedQuery =
        listQueryDocuments.includes(watch.query) ||
        watch.query.definitions.some(
          (def) => 'name' in def && def.name && listQueryNames.has(def.name.value),
        )

      if (!isAllowedQuery) return false
    },
  })
}
