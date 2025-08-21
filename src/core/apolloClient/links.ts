import { ApolloClient, ApolloLink, NormalizedCacheObject } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { captureException } from '@sentry/react'
// IMPORTANT: Keep reactiveVars import before cacheUtils
import ActionCable from 'actioncable'
import ApolloLinkTimeout from 'apollo-link-timeout'
import { createUploadLink } from 'apollo-upload-client'
import ActionCableLink from 'graphql-ruby-client/subscriptions/ActionCableLink'

import {
  addToast,
  AUTH_TOKEN_LS_KEY,
  CUSTOMER_PORTAL_TOKEN_LS_KEY,
  envGlobalVar,
  TMP_AUTH_TOKEN_LS_KEY,
} from '~/core/apolloClient/reactiveVars'
import { ORGANIZATION_LS_KEY_ID } from '~/core/constants/localStorageKeys'
import { LagoApiError } from '~/generated/graphql'

import { getItemFromLS, logOut, omitDeep } from './cacheUtils'
import { LagoGQLError } from './errorUtils'

const AUTH_ERRORS = [
  LagoApiError.ExpiredJwtToken,
  LagoApiError.TokenEncodingError,
  LagoApiError.Unauthorized,
]

const { apiUrl } = envGlobalVar()

export const initialLink = new ApolloLink((operation, forward) => {
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

export const errorLink = (globalApolloClient: ApolloClient<NormalizedCacheObject> | null) =>
  onError(({ graphQLErrors, operation }) => {
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

export const uploadLink = createUploadLink({
  uri: `${apiUrl}/graphql`,
}) as unknown as ApolloLink

const TIMEOUT = 300000 // 5 minutes timeout

export const timeoutLink = new ApolloLinkTimeout(TIMEOUT)

// Use the working WebSocket URL that we tested
const wsUrl = 'wss://api.lago.dev/cable'

// Create ActionCable consumer
const createAuthenticatedCable = () => {
  return ActionCable.createConsumer(wsUrl)
}

export const subscriptionLink = new ActionCableLink({
  cable: createAuthenticatedCable(),
  // Configure for GraphQL-Ruby ActionCable subscriptions
  channelName: 'GraphqlChannel',
  // The ActionCableLink should automatically handle GraphQL subscriptions
  // by sending the query in the ActionCable message format
  actionName: 'execute', // This is the default, but let's be explicit
})
