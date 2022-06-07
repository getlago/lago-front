import { InMemoryCache, makeVar } from '@apollo/client'

import { CollectionMetadata } from '~/generated/graphql'

import { authTokenVar } from './authTokenVar'

import { getItemFromLS } from '../utils'

export const AUTH_TOKEN_LS_KEY = 'authToken'

// Initialize reactive variables
export const isAuthenticatedVar = makeVar<boolean>(!!getItemFromLS(AUTH_TOKEN_LS_KEY))
export * from './authTokenVar'
export * from './toastVar'
export * from './currentUserInfosVar'

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
        token: {
          read() {
            return authTokenVar()
          },
        },
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
      },
    },
  },
})
