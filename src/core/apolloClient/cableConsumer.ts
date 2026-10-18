import { Consumer, createConsumer } from '@rails/actioncable'

import { buildCableSubprotocols } from './authHeaders'

// The subprotocols are read each time the socket opens, so a reconnect sends the
// current token rather than the one present when the consumer was created.
export const createCableConsumer = (url: string): Consumer => {
  const consumer = createConsumer(url)

  Object.defineProperty(consumer, 'subprotocols', {
    get: () => buildCableSubprotocols(window.location.pathname),
  })

  return consumer
}

let cableConsumer: Consumer | null = null

export const getCableConsumer = (url: string): Consumer => {
  cableConsumer ??= createCableConsumer(url)

  return cableConsumer
}

// The API authenticates the socket once, when it opens. Closing it on logout and login makes
// the next subscription open a new socket with the current user's token.
export const disconnectCableConsumer = () => {
  cableConsumer?.disconnect()
}

// Called when the API renews the token, during the last hour before it expires. An idle socket
// is closed so the next subscription opens one with the renewed token, instead of relying on
// the API closing it at expiry, which reconnects several seconds later and can drop streamed
// chunks. A socket with running subscriptions is left open not to cut an answer in progress.
export const refreshCableConsumerIfIdle = () => {
  if (cableConsumer && !hasSubscriptions(cableConsumer)) {
    cableConsumer.disconnect()
  }
}

// @rails/actioncable keeps the list on `subscriptions.subscriptions`, which its types omit.
type SubscriptionsWithList = Consumer['subscriptions'] & { subscriptions: unknown[] }

const hasSubscriptions = (consumer: Consumer) =>
  (consumer.subscriptions as SubscriptionsWithList).subscriptions.length > 0
