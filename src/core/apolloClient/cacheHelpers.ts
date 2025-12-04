import { FieldPolicy } from '@apollo/client'

import { CollectionMetadata } from '~/generated/graphql'

type PaginatedCollection = {
  metadata: CollectionMetadata
  collection: Record<string, unknown>[]
}

/**
 * Merges paginated collection results.
 * - If incoming is page 1, replace existing data
 * - Otherwise, append incoming items to existing collection
 */
export const mergePaginatedCollection = (
  existing: PaginatedCollection,
  incoming: PaginatedCollection,
) => {
  if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
    return incoming
  }

  return {
    ...incoming,
    collection: [...(existing?.collection || []), ...(incoming.collection || [])],
  }
}

/**
 * Creates a standard field policy for paginated queries.
 *
 * This policy automatically includes all query arguments in the cache key,
 * EXCEPT pagination parameters (page, limit, offset). This means:
 * - Different filters create separate cache entries
 * - Developers don't need to manually specify which args to track
 * - New query arguments are automatically included
 *
 * @param additionalExclusions - Additional argument names to exclude from cache key
 *
 * @example
 * ```typescript
 * // In cache.ts
 * invoices: createPaginatedFieldPolicy()
 * // Automatically caches separately for different status, searchTerm, currency, etc.
 * // But shares cache for different pages of the same filters
 * ```
 */
export const createPaginatedFieldPolicy = (additionalExclusions: string[] = []): FieldPolicy => ({
  keyArgs(args) {
    // If no args, return false to use single shared cache entry
    if (!args) return false

    // Standard pagination args that should NOT affect cache key
    const excludedArgs = new Set(['page', 'limit', 'offset', ...additionalExclusions])

    // Return sorted array of arg keys to include in cache key
    // Sorting ensures consistent cache keys regardless of argument order
    // Apollo will automatically hash the values
    return Object.keys(args)
      .filter((key) => !excludedArgs.has(key))
      .sort((a, b) => a.localeCompare(b))
  },
  merge: mergePaginatedCollection,
})
