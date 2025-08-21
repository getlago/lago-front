import { ApolloClient, ApolloLink, NormalizedCacheObject, Operation, split } from '@apollo/client'
import { LocalForageWrapper, persistCache } from 'apollo3-cache-persist'
import localForage from 'localforage'

import {
  errorLink,
  initialLink,
  subscriptionLink,
  timeoutLink,
  uploadLink,
} from '~/core/apolloClient/links'
// IMPORTANT: Keep reactiveVars import before cacheUtils
import { envGlobalVar } from '~/core/apolloClient/reactiveVars'

import { cache } from './cache'
import { resolvers, typeDefs } from './graphqlResolvers'

let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null

const { appVersion } = envGlobalVar()

const hasSubscriptionOperation = ({ query }: Operation) => {
  const definitions = query.definitions

  const hasSub = definitions.some(
    (definition) =>
      definition.kind === 'OperationDefinition' &&
      'operation' in definition &&
      definition.operation === 'subscription',
  )

  // Debug: Check browser console for subscription operation detection
  if (hasSub) {
    // eslint-disable-next-line no-console
    console.log('🔍 Subscription operation detected:', {
      operationName: query.definitions
        .filter((def) => def.kind === 'OperationDefinition')
        .map((def) => 'operation' in def && def.operation)
        .filter(Boolean),
      definitions: query.definitions,
    })
  }

  return hasSub
}

export const initializeApolloClient = async () => {
  if (globalApolloClient) return globalApolloClient

  const splitLink = split(
    hasSubscriptionOperation,
    subscriptionLink as unknown as ApolloLink,
    uploadLink,
  )

  // Debug: Log the split configuration
  // eslint-disable-next-line no-console
  console.log('🔧 Apollo Client split configuration:', {
    hasSubscriptionOperation: hasSubscriptionOperation.toString(),
    subscriptionLink: !!subscriptionLink,
    uploadLink: !!uploadLink,
  })

  const links = ApolloLink.from([
    initialLink.concat(timeoutLink),
    errorLink(globalApolloClient),
    splitLink,
  ])

  await persistCache({
    cache,
    storage: new LocalForageWrapper(localForage),
    key: `apollo-cache-persist-lago-${appVersion}`,
  })

  const client = new ApolloClient({
    cache,
    link: links,
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
