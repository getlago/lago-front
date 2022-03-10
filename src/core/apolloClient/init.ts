import { ApolloClient, NormalizedCacheObject, ApolloLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import { persistCache, LocalForageWrapper } from 'apollo3-cache-persist'
import { GraphQLError } from 'graphql'
import localForage from 'localforage'

import { Lago_Api_Error } from '~/generated/graphql'

import { cache, AUTH_TOKEN_LS_KEY, addToast } from './cache'
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
      },
    })

    return forward(operation)
  })

  /** Update token after every request */
  // const afterwareLink = new ApolloLink((operation, forward) => {
  //   return forward(operation).map((response) => {
  //     const context = operation.getContext()
  //     const refrechedToken = context.response.headers.get('x-lago-token')

  //     if (refrechedToken) {
  //       setItemFromLS(AUTH_TOKEN_LS_KEY, refrechedToken)
  //     }

  //     return response
  //   })
  // })

  const links = [
    initialLink.concat(timeoutLink),
    onError(({ graphQLErrors, networkError, operation, forward }) => {
      const { silentError = false } = operation.getContext()

      if (graphQLErrors) {
        // @ts-expect-error
        graphQLErrors.forEach(({ message, locations, path, extensions }: LagoGQLError) => {
          const isUnauthorized = extensions.code === Lago_Api_Error.Unauthorized

          if (isUnauthorized && globalApolloClient) {
            logOut(globalApolloClient)
          }

          !silentError &&
            !isUnauthorized &&
            message !== 'PersistedQueryNotFound' &&
            addToast({
              severity: 'danger',
              translateKey: /* getGQLErrorsKey(code) */ 'TODO', // TODO
            })

          // eslint-disable-next-line no-console
          console.warn(
            `[GraphQL error]: Message: ${message}, Path: ${path}, Location: ${JSON.stringify(
              locations
            )}`
          )
        })
      }

      if (networkError && !silentError) {
        addToast({
          severity: 'danger',
          // i18n-key apollo-client:network:error
          translateKey: 'apollo-client:network:error',
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
