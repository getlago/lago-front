import { ApolloClient, ApolloLink, NormalizedCacheObject, split } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { getMainDefinition } from '@apollo/client/utilities'
import { captureException } from '@sentry/react'
import ActionCable from 'actioncable'
import { LocalForageWrapper, persistCache } from 'apollo3-cache-persist'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'
import localForage from 'localforage'

// IMPORTANT: Keep reactiveVars import before cacheUtils
import {
  addToast,
  AUTH_TOKEN_LS_KEY,
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
  envGlobalVar,
  TMP_AUTH_TOKEN_LS_KEY,
} from '~/core/apolloClient/reactiveVars'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
import { LagoApiError } from '~/generated/graphql'

import { cache } from './cache'
import { getItemFromLS, logOut, omitDeep } from './cacheUtils'
import { LagoGQLError } from './errorUtils'
import { resolvers, typeDefs } from './graphqlResolvers'

const AUTH_ERRORS = [
  LagoApiError.ExpiredJwtToken,
  LagoApiError.TokenEncodingError,
  LagoApiError.Unauthorized,
]

let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null

// Get environment variables
const { apiUrl, appVersion } = envGlobalVar()

// Create WebSocket URL from HTTP API URL
const wsUrl = `wss://api.lago.dev/cable`

const TIMEOUT = 300000 // 5 minutes timeout
const timeoutLink = new ApolloLinkTimeout(TIMEOUT)

export const initializeApolloClient = async () => {
  if (globalApolloClient) return globalApolloClient

  const initialLink = new ApolloLink((operation, forward) => {
    const { headers } = operation.getContext()
    const token = getItemFromLS(AUTH_TOKEN_LS_KEY) || getItemFromLS(TMP_AUTH_TOKEN_LS_KEY)
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

  // Create ActionCable link with proper configuration
  const cable = ActionCable.createConsumer(wsUrl)
  // @ts-expect-error TODO: fix this
  const actionCableLink = new ActionCableLink({ cable })

  // Create upload link for file uploads
  const uploadLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
  }) as unknown as ApolloLink

  // Split link to handle subscriptions vs queries/mutations
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)

      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
    },
    actionCableLink, // Use ActionCable for subscriptions
    uploadLink, // Use upload link for queries/mutations
  )

  // Error handling link
  const errorLink = onError(({ graphQLErrors, operation }) => {
    const { silentError = false, silentErrorCodes = [] } = operation.getContext()

    // Silent auth and permissions related errors by default
    silentErrorCodes.push(...AUTH_ERRORS, LagoApiError.Forbidden)

    if (graphQLErrors) {
      graphQLErrors.forEach((value) => {
        const { message, path, locations, extensions } = value as LagoGQLError

        const isUnauthorized = extensions && AUTH_ERRORS.includes(extensions?.code)

        if (isUnauthorized && globalApolloClient) {
          logOut(globalApolloClient)
        }

        // Capture non-silent GraphQL errors with Sentry
        if (
          !silentError &&
          !silentErrorCodes.includes(extensions?.code) &&
          !isUnauthorized &&
          message !== 'PersistedQueryNotFound'
        ) {
          // Capture in Sentry with operation details
          captureException(message, {
            tags: {
              errorType: 'GraphQLError',
              operationName: operation.operationName,
            },
            extra: {
              path,
              locations,
              extensions,
              value,
              variables: operation.variables,
            },
          })

          addToast({
            severity: 'danger',
            translateKey: 'text_622f7a3dc32ce100c46a5154',
          })
        }

        // eslint-disable-next-line no-console
        console.warn(
          `[GraphQL error]: Message: ${message}, Path: ${path}, Location: ${JSON.stringify(
            locations,
          )}`,
        )
      })
    }
  })

  // Combine all links in the correct order
  const link = ApolloLink.from([initialLink, timeoutLink, errorLink, splitLink])

  await persistCache({
    cache,
    storage: new LocalForageWrapper(localForage),
    key: `apollo-cache-persist-lago-${appVersion}`,
  })

  const client = new ApolloClient({
    cache,
    link,
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
