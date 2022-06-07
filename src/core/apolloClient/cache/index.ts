import { InMemoryCache, makeVar } from '@apollo/client'

import { authTokenVar } from './authTokenVar'

import { getItemFromLS } from '../utils'

export const AUTH_TOKEN_LS_KEY = 'authToken'

// Initialize reactive variables
export const isAuthenticatedVar = makeVar<boolean>(!!getItemFromLS(AUTH_TOKEN_LS_KEY))
export * from './authTokenVar'
export * from './toastVar'
export * from './currentUserInfosVar'

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
          merge(existing, incoming) {
            if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
              return incoming
            }

            return {
              ...incoming,
              collection: [...(existing?.collection || []), ...(incoming.collection || [])],
            }
          },
        },
        plans: {
          keyArgs: false,
          merge(existing, incoming) {
            if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
              return incoming
            }

            return {
              ...incoming,
              collection: [...(existing?.collection || []), ...(incoming.collection || [])],
            }
          },
        },
        customers: {
          keyArgs: false,
          merge(existing, incoming) {
            if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
              return incoming
            }

            return {
              ...incoming,
              collection: [...(existing?.collection || []), ...(incoming.collection || [])],
            }
          },
        },
        coupons: {
          keyArgs: false,
          merge(existing, incoming) {
            if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
              return incoming
            }

            return {
              ...incoming,
              collection: [...(existing?.collection || []), ...(incoming.collection || [])],
            }
          },
        },
        events: {
          keyArgs: false,
          merge(existing, incoming) {
            if (!incoming?.metadata?.currentPage || incoming?.metadata?.currentPage === 1) {
              return incoming
            }

            return {
              ...incoming,
              collection: [...(existing?.collection || []), ...(incoming.collection || [])],
            }
          },
        },
      },
    },
  },
})
