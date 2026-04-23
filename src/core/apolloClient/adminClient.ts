import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'

import {
  ADMIN_AUTH_TOKEN_LS_KEY,
  updateAdminAuthTokenVar,
} from '~/core/apolloClient/reactiveVars/adminAuthTokenVar'

import { mergePaginatedCollection } from './cacheHelpers'
import { getItemFromLS, omitDeep } from './cacheUtils'

const TIMEOUT = 300000
const apiUrl = API_URL

const authLink = new ApolloLink((operation, forward) => {
  const { headers } = operation.getContext()
  const token = getItemFromLS(ADMIN_AUTH_TOKEN_LS_KEY)

  operation.setContext({
    headers: {
      ...headers,
      ...(!token ? {} : { authorization: `Bearer ${token}` }),
    },
  })

  return forward(operation)
})

const cleanupLink = new ApolloLink((operation, forward) => {
  if (operation.variables && !operation.variables.file) {
    operation.variables = omitDeep(operation.variables, '__typename')
  }
  return forward(operation)
})

const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ extensions }) => {
      const isUnauthorized =
        extensions &&
        ['expired_jwt_token', 'token_encoding_error', 'unauthorized'].includes(
          extensions?.code as string,
        )

      if (isUnauthorized) {
        updateAdminAuthTokenVar(undefined)
      }
    })
  }
})

const timeoutLink = new ApolloLinkTimeout(TIMEOUT)

const httpLink = createUploadLink({
  uri: `${apiUrl}/graphql`,
})

const link = ApolloLink.from([authLink, cleanupLink, timeoutLink, errorLink, httpLink])

const adminCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        adminOrganizations: {
          keyArgs: (args) => {
            if (!args) return false
            return Object.keys(args)
              .filter((key) => !['page', 'limit'].includes(key))
              .sort()
          },
          merge: mergePaginatedCollection,
        },
      },
    },
  },
})

export const adminApolloClient = new ApolloClient({
  cache: adminCache,
  link,
  name: 'lago-admin',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
