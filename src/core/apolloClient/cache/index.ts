import { InMemoryCache, makeVar } from '@apollo/client'
import { relayStylePagination } from '@apollo/client/utilities'

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
        audience__list: relayStylePagination(['order']),
      },
    },
  },
})
