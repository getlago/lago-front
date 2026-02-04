import { ApolloClient, ApolloLink, Operation, split } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'
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
  updateAuthTokenVar,
} from '~/core/apolloClient/reactiveVars'
import { buildWebSocketUrl } from '~/core/apolloClient/websocketUrl'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
import { LagoApiError } from '~/generated/graphql'

import { cache } from './cache'
import { getItemFromLS, omitDeep } from './cacheUtils'
import { resolvers, typeDefs } from './graphqlResolvers'

const AUTH_ERRORS = [
  LagoApiError.ExpiredJwtToken,
  LagoApiError.TokenEncodingError,
  LagoApiError.Unauthorized,
]

const TIMEOUT = 300000 // 5 minutes timeout
const { apiUrl, appVersion } = envGlobalVar()

const { cableUrl } = buildWebSocketUrl(apiUrl)
const subscriptionLink = new ActionCableLink({
  cable: ActionCable.createConsumer(cableUrl),
  channelName: 'GraphqlChannel',
  actionName: 'execute',
})

const hasSubscriptionOperation = ({ query }: Operation) => {
  const definition = getMainDefinition(query)

  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
}

// Callback for handling auth errors - will be set by the App component
let onAuthError: (() => void) | null = null

export const setAuthErrorHandler = (handler: () => void) => {
  onAuthError = handler
}

export const initializeApolloClient = async () => {
  const authLink = new ApolloLink((operation, forward) => {
    const { headers } = operation.getContext()
    const token = getItemFromLS(AUTH_TOKEN_LS_KEY) || getItemFromLS(TMP_AUTH_TOKEN_LS_KEY)
    const customerPortalToken = getItemFromLS(CUSTOMER_PORTAL_TOKEN_LS_KEY)
    const currentOrganizationId = getItemFromLS(ORGANIZATION_LS_KEY_ID)

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

  // Response interceptor to catch new tokens from backend if a new one is given
  const tokenRefreshLink = new ApolloLink((operation, forward) => {
    return forward(operation).map((response) => {
      const { response: httpResponse } = operation.getContext()

      if (!!httpResponse?.headers) {
        const newToken = httpResponse.headers.get('X-Lago-Token')

        if (newToken) {
          const currentToken = getItemFromLS(AUTH_TOKEN_LS_KEY)

          if (newToken && newToken !== currentToken) {
            updateAuthTokenVar(newToken)
          }
        }
      }

      return response
    })
  })

  const cleanupLink = new ApolloLink((operation, forward) => {
    if (operation.variables && !operation.variables.file) {
      operation.variables = omitDeep(operation.variables, '__typename')
    }
    return forward(operation)
  })

  const timeoutLink = new ApolloLinkTimeout(TIMEOUT)

  const retryLink = new RetryLink({
    delay: {
      initial: 150, // Start with 150ms delay
      max: 5000, // Max delay of 5 seconds
      jitter: true, // Add randomization to prevent thundering herd
    },
    attempts: {
      max: 3, // Retry up to 3 times (4 total attempts including original)
      retryIf: (error, operation) => {
        // Only retry on network errors, not GraphQL errors
        const isNetworkError = !!error && !error.result

        // Don't retry if explicitly disabled via context
        const { disableRetry = false } = operation.getContext()

        if (disableRetry) return false

        // Don't retry AbortErrors (user closed window/tab or navigated away)
        const isAbortError =
          error?.name === 'AbortError' || /signal aborted/i.test(error?.message || '')

        if (isAbortError) return false

        // Retry network errors (connection failures, timeouts, DNS failures)
        // Don't retry GraphQL errors (which have a result)
        return isNetworkError
      },
    },
  })

  const errorLink = onError(({ graphQLErrors, operation }) => {
    const { silentError = false, silentErrorCodes = [] } = operation.getContext()

    // Silent auth and permissions related errors by default
    silentErrorCodes.push(...AUTH_ERRORS, LagoApiError.Forbidden)

    // Get operation type (query/mutation/subscription) for better grouping in Sentry
    const definition = getMainDefinition(operation.query)
    const operationType =
      definition.kind === 'OperationDefinition' ? definition.operation : 'unknown'

    if (graphQLErrors) {
      graphQLErrors.forEach((value) => {
        const { message, path, locations, extensions } = value

        const isUnauthorized = extensions && AUTH_ERRORS.includes(extensions?.code as LagoApiError)

        if (isUnauthorized && onAuthError) {
          onAuthError()
        }

        // Capture non-silent GraphQL errors with Sentry
        if (
          !silentError &&
          !silentErrorCodes.includes(extensions?.code) &&
          !isUnauthorized &&
          message !== 'PersistedQueryNotFound'
        ) {
          // Create proper Error object for better stack traces
          const graphQLError = new Error(`GraphQL Error: ${message}`)

          graphQLError.name = 'GraphQLError'

          // Capture in Sentry with operation details
          captureException(graphQLError, {
            tags: {
              errorType: 'GraphQLError',
              operation: operationType,
              operationName: operation.operationName || 'unknown',
              errorCode: typeof extensions?.code === 'string' ? extensions.code : 'unknown',
            },
            extra: {
              path,
              locations,
              extensions,
              // Stringify and truncate to avoid Sentry size limits (default maxValueLength is 250)
              errorDetails: (() => {
                if (!extensions?.details) return undefined
                const str =
                  typeof extensions.details === 'object'
                    ? JSON.stringify(extensions.details)
                    : String(extensions.details)
                const MAX_LENGTH = 2000
                return str.length > MAX_LENGTH ? `${str.slice(0, MAX_LENGTH)}...[truncated]` : str
              })(),
              value,
              variables: operation.variables,
              operationQuery: operation.query?.loc?.source?.body || 'unknown',
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
          )}, Extensions: ${JSON.stringify(extensions)}`,
        )
      })
    }
  })

  const httpLink = createUploadLink({
    uri: `${apiUrl}/graphql`,
  })

  const splitLink = split(hasSubscriptionOperation, subscriptionLink, httpLink)

  await persistCache({
    cache,
    storage: new LocalForageWrapper(localForage),
    key: `apollo-cache-persist-lago-${appVersion}`,
  })

  const link = ApolloLink.from([
    authLink,
    tokenRefreshLink,
    cleanupLink,
    retryLink,
    timeoutLink,
    errorLink,
    splitLink,
  ])

  const client = new ApolloClient({
    cache,
    link,
    name: 'lago-app',
    version: appVersion,
    typeDefs,
    resolvers,
    devtools: {
      enabled: true,
    },
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

  return client
}
