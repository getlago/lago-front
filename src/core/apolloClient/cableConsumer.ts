import { ApolloLink, FetchResult, Observable, Operation } from '@apollo/client'
import { Consumer, createConsumer, Subscription } from '@rails/actioncable'
import { print } from 'graphql'

import { AUTH_TOKEN_LS_KEY } from '~/core/apolloClient/reactiveVars'

import { buildCableConnectionParams, buildCableSubprotocols } from './authHeaders'

// @rails/actioncable's types omit these internals.
type CableSubscriptions = Consumer['subscriptions'] & {
  subscriptions: unknown[]
  forget: (subscription: unknown) => unknown
  notifyAll: (callbackName: string, ...args: unknown[]) => unknown
}
type CableConnection = {
  open: () => boolean
  isActive: () => boolean
  isOpen: () => boolean
  webSocket?: WebSocket
}

const subscriptionsOf = (consumer: Consumer): CableSubscriptions =>
  consumer.subscriptions as CableSubscriptions

const connectionOf = (consumer: Consumer): CableConnection =>
  (consumer as unknown as { connection: CableConnection }).connection

const currentSubprotocols = (): string => buildCableSubprotocols(window.location.pathname).join(',')

const openedWith = new WeakMap<Consumer, string>()

// The route is fixed at creation, so a reconnect keeps the identity but sends the current token.
export const createCableConsumer = (url: string, pathname: string): Consumer => {
  const consumer = createConsumer(url)
  const connection = connectionOf(consumer)
  const open = connection.open

  connection.open = (): boolean => {
    if (!connection.isActive()) {
      const subprotocols = buildCableSubprotocols(pathname)

      // Typed read-only, but `Connection#open` reads it on every open.
      ;(consumer as { subprotocols: string[] }).subprotocols = subprotocols
      openedWith.set(consumer, subprotocols.join(','))
    }

    return open()
  }

  return consumer
}

let cableUrl = ''
let activeConsumer: Consumer | null = null
const retiringConsumers = new Set<Consumer>()

// `disconnect()` only closes an open socket, and only an open socket tells its subscriptions
// it closed. One still in its handshake would otherwise stay up, or leave them waiting.
const discard = (consumer: Consumer): void => {
  const connection = connectionOf(consumer)
  const wasOpen = connection.isOpen()

  consumer.disconnect()

  if (wasOpen) return

  connection.webSocket?.close()
  subscriptionsOf(consumer).notifyAll('disconnected', { willAttemptReconnect: false })
}

// Both `remove` (unsubscribe) and `reject` (refused by the API) go through `forget`.
const retireWhenEmpty = (consumer: Consumer): void => {
  const subscriptions = subscriptionsOf(consumer)
  const forget = subscriptions.forget.bind(subscriptions)

  subscriptions.forget = (subscription: unknown): unknown => {
    const forgotten = forget(subscription)

    if (subscriptions.subscriptions.length === 0) {
      discard(consumer)
      retiringConsumers.delete(consumer)
    }

    return forgotten
  }

  retiringConsumers.add(consumer)
}

// The API authenticates a socket with the token it opened with. A socket streaming an answer
// keeps running until its subscriptions end, and new subscriptions open a new socket.
export const refreshCableConsumer = (): void => {
  if (!activeConsumer) return

  if (subscriptionsOf(activeConsumer).subscriptions.length === 0) {
    discard(activeConsumer)
    activeConsumer = null

    return
  }

  retireWhenEmpty(activeConsumer)
  activeConsumer = null
}

// Covers a token renewed in another tab and a move between admin and customer portal routes.
const refreshIfIdentityChanged = (): void => {
  if (!activeConsumer) return

  const opened = openedWith.get(activeConsumer)

  if (opened !== undefined && opened !== currentSubprotocols()) refreshCableConsumer()
}

const getActiveConsumer = (): Consumer => {
  refreshIfIdentityChanged()
  activeConsumer ??= createCableConsumer(cableUrl, window.location.pathname)

  return activeConsumer
}

export const disconnectCableConsumer = (): void => {
  if (activeConsumer) discard(activeConsumer)

  activeConsumer = null
  retiringConsumers.forEach(discard)
  retiringConsumers.clear()
}

// Only needs to be unique within this page, so ActionCable does not merge two subscriptions.
let channelCount = 0

const createChannelId = (): string => `${Date.now().toString(16)}-${++channelCount}`

type CablePayload = { result?: FetchResult; more?: boolean }

export class CableSubscriptionError extends Error {
  constructor(reason: 'rejected' | 'disconnected') {
    super(`GraphQL subscription ${reason} by the server`)
    this.name = 'CableSubscriptionError'
  }
}

export const createCableLink = (url: string): ApolloLink => {
  cableUrl = url

  // A logout in another tab removes the shared token: sockets opened with it must close too.
  window.addEventListener('storage', (event: StorageEvent): void => {
    const isTokenRemoved =
      event.key === null || (event.key === AUTH_TOKEN_LS_KEY && !event.newValue)

    if (isTokenRemoved) disconnectCableConsumer()
  })

  return new ApolloLink(
    (operation: Operation): Observable<FetchResult> =>
      new Observable<FetchResult>((observer): (() => void) => {
        let isRejected = false

        const subscription: Subscription = getActiveConsumer().subscriptions.create(
          {
            channel: 'GraphqlChannel',
            channelId: createChannelId(),
            ...buildCableConnectionParams(window.location.pathname),
          },
          {
            // Runs again after a reconnect, which re-executes the subscription.
            connected(this: Subscription): void {
              this.perform('execute', {
                query: print(operation.query),
                variables: operation.variables,
                operationName: operation.operationName,
              })
            },
            received(payload: CablePayload): void {
              if (payload?.result?.data || payload?.result?.errors) observer.next(payload.result)
              if (!payload?.more) observer.complete()
            },
            rejected(): void {
              isRejected = true
              observer.error(new CableSubscriptionError('rejected'))
            },
            disconnected({ willAttemptReconnect }: { willAttemptReconnect: boolean }): void {
              if (!willAttemptReconnect) observer.error(new CableSubscriptionError('disconnected'))
            },
          },
        )

        return (): void => {
          if (!isRejected) subscription.unsubscribe()
        }
      }),
  )
}
