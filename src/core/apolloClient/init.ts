import { ApolloClient, NormalizedCacheObject, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist'
import localForage from 'localforage'

import { LagoApiError } from '~/generated/graphql'

import { cache } from './cache'
import {
  AUTH_TOKEN_LS_KEY,
  ORGANIZATION_LS_KEY_ID,
  addToast,
  envGlobalVar,
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
} from './reactiveVars'
import { logOut, getItemFromLS, omitDeep } from './cacheUtils'
import { LagoGQLError } from './errorUtils'
import { typeDefs, resolvers } from './graphqlResolvers'

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

    if (operation.variables && !operation.variables.file) {
      // eslint-disable-next-line
      operation.variables = omitDeep(operation.variables, '__typename')
    }

    operation.setContext({
      headers: {
        ...headers,
        ...(!token ? {} : { authorization: `Bearer ${getItemFromLS(AUTH_TOKEN_LS_KEY)}` }),
        ...(!customerPortalToken ? {} : { 'customer-portal-token': customerPortalToken }),
        'x-lago-organization': getItemFromLS(ORGANIZATION_LS_KEY_ID),
      },
    })

    return forward(operation)
  })

  const links = [
    initialLink.concat(timeoutLink),
    onError(({ graphQLErrors, networkError, operation, forward }) => {
      const { silentError = false, silentErrorCodes = [] } = operation.getContext()

      if (graphQLErrors) {
        // @ts-expect-error
        graphQLErrors.forEach(({ message, locations, path, extensions }: LagoGQLError) => {
          const isUnauthorized =
            extensions &&
            [
              LagoApiError.Unauthorized,
              LagoApiError.ExpiredJwtToken,
              LagoApiError.TokenEncodingError,
            ].includes(extensions?.code)

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
              locations
            )}`
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
      return forward(operation)
    }),
    // afterwareLink.concat(
    createUploadLink({
      uri: `${apiUrl}/graphql`,
    }) as unknown as ApolloLink,
    // ),
  ]

  await persistCache({
    cache,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
