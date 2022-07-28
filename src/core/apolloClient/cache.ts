import { InMemoryCache } from '@apollo/client'

import { CollectionMetadata } from '~/generated/graphql'

type PaginatedCollection = { metadata: CollectionMetadata; collection: Record<string, unknown>[] }

const mergePaginatedCollection = (existing: PaginatedCollection, incoming: PaginatedCollection) => {
  if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
    return incoming
  }

  return {
    ...incoming,
    collection: [...(existing?.collection || []), ...(incoming.collection || [])],
  }
}

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        billableMetrics: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        plans: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        customers: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        coupons: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        events: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        addOns: {
          keyArgs: false,
          merge: mergePaginatedCollection,
        },
        wallets: {
          keyArgs: ['customerId'],
          merge: mergePaginatedCollection,
        },
        walletTransactions: {
          keyArgs: ['walletId'],
          merge: mergePaginatedCollection,
        },
      },
    },
  },
})
