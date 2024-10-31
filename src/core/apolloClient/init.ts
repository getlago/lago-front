import { ApolloClient, ApolloLink, NormalizedCacheObject } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { LocalForageWrapper, persistCache } from 'apollo3-cache-persist'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import localForage from 'localforage'

// IMPORTANT: Keep reactiveVars import before cacheUtils
import {
  addToast,
  AUTH_TOKEN_LS_KEY,
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
  envGlobalVar,
} from '~/core/apolloClient/reactiveVars'
import { LagoApiError } from '~/generated/graphql'

import { cache } from './cache'
import { getItemFromLS, logOut, omitDeep, ORGANIZATION_LS_KEY_ID } from './cacheUtils'
import { LagoGQLError } from './errorUtils'
import { resolvers, typeDefs } from './graphqlResolvers'

const AUTH_ERRORS = [
  LagoApiError.ExpiredJwtToken,
  LagoApiError.TokenEncodingError,
  LagoApiError.Unauthorized,
]

let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null

const TIMEOUT = 300000 // 5 minutes timeout
const timeoutLink = new ApolloLinkTimeout(TIMEOUT)
const { apiUrl, appVersion } = envGlobalVar()

export const initializeApolloClient = async () => {
  if (globalApolloClient) return globalApolloClient

  const initialLink = new ApolloLink((operation, forward) => {
    const { headers } = operation.getContext()
    const token = getItemFromLS(AUTH_TOKEN_LS_KEY)
    const customerPortalToken = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)
    const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

    if (operation.variables && !operation.variables.file) {
      operation.variables = omitDeep(operation.variables, '__typename')
    }

    operation.setContext({
      headers: {
        ...headers,
        ...(!token ? {} : { authorization: `Bearer ${token}` }),
        ...(!customerPortalToken ? {} : { 'customer-portal-token': customerPortalToken }),
        'x-lago-organization': currentOrganizationId,
      },
    })

    return forward(operation)
  })

  const links = [
    initialLink.concat(timeoutLink),
    onError(({ graphQLErrors, networkError, operation }) => {
      const { silentError = false, silentErrorCodes = [] } = operation.getContext()

      // Silent auth and permissions related errors by default
      silentErrorCodes.push(...AUTH_ERRORS, LagoApiError.Forbidden)

      if (graphQLErrors) {
        // @ts-expect-error
        graphQLErrors.forEach(({ message, locations, path, extensions }: LagoGQLError) => {
          const isUnauthorized = extensions && AUTH_ERRORS.includes(extensions?.code)

          if (isUnauthorized && globalApolloClient) {
            logOut(globalApolloClient)
          }

          !silentError &&
            !silentErrorCodes.includes(extensions?.code) &&
            !isUnauthorized &&
            message !== 'PersistedQueryNotFound' &&
            addToast({
              severity: 'danger',
              translateKey: 'text_622f7a3dc32ce100c46a5154',
            })

          // eslint-disable-next-line no-console
          console.warn(
            `[GraphQL error]: Message: ${message}, Path: ${path}, Location: ${JSON.stringify(
              locations,
            )}`,
          )
        })
      }

      if (networkError) {
        addToast({
          severity: 'danger',
          translateKey: 'text_622f7a3dc32ce100c46a5154',
        })
        // eslint-disable-next-line no-console
        console.warn(`[Network error]: ${JSON.stringify(networkError)}`)
      }
    }),
    // afterwareLink.concat(
    createUploadLink({
      uri: `${apiUrl}/graphql`,
    }) as unknown as ApolloLink,
    // ),
  ]

  await persistCache({
    cache,

    storage: new LocalForageWrapper(localForage),
    key: `apollo-cache-persist-lago-${appVersion}`,
  })

  const client = new ApolloClient({
    cache,
    link: ApolloLink.from(links),
    name: 'lago-app',
    version: appVersion,
    typeDefs,
    resolvers,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  })

  globalApolloClient = client

  return client
}
