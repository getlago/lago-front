import { ApolloClient, NormalizedCacheObject, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist'
import { GraphQLError } from 'graphql'
import localForage from 'localforage'

import { Lago_Api_Error } from '~/generated/graphql'

import { cache, AUTH_TOKEN_LS_KEY, ORGANIZATION_LS_KEY, addToast } from './cache'
import { logOut, getItemFromLS, omitDeep } from './utils'
import { typeDefs, resolvers } from './graphqlResolvers'

export interface LagoGQLError extends GraphQLError {
  extensions: {
    code: Lago_Api_Error
  }
}

let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null

const TIMEOUT = 300000 // 5 minutes timeout

const timeoutLink = new ApolloLinkTimeout(TIMEOUT)

export const initializeApolloClient = async () => {
  if (globalApolloClient) return globalApolloClient

  const initialLink = new ApolloLink((operation, forward) => {
    const { headers } = operation.getContext()
    const token = getItemFromLS(AUTH_TOKEN_LS_KEY)

    if (operation.variables && !operation.variables.file) {
      // eslint-disable-next-line
      operation.variables = omitDeep(operation.variables, '__typename')
    }

    operation.setContext({
      headers: {
        ...headers,
        ...(!token ? {} : { authorization: `Bearer ${getItemFromLS(AUTH_TOKEN_LS_KEY)}` }),
        'x-lago-organization': getItemFromLS(ORGANIZATION_LS_KEY)?.id,
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
              Lago_Api_Error.Unauthorized,
              Lago_Api_Error.ExpiredJwtToken,
              Lago_Api_Error.TokenEncodingError,
            ].includes(extensions.code)

          if (isUnauthorized && globalApolloClient) {
            logOut(globalApolloClient)
          }

          !silentError &&
            !silentErrorCodes.includes(extensions.code) &&
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
      uri: `${API_URL}/graphql`,
    }) as unknown as ApolloLink,
    // ),
  ]

  await persistCache({
    cache,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storage: new LocalForageWrapper(localForage),
    key: `apollo-cache-persist-${APP_VERSION || '0.0.0'}`,
  })

  const client = new ApolloClient({
    cache,
    link: ApolloLink.from(links),
    name: 'lago-app',
    version: APP_VERSION,
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
