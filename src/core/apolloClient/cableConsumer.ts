import { Consumer, createConsumer } from '@rails/actioncable'

import { buildCableSubprotocols } from './authHeaders'

// Read on every socket open, so a reconnect sends the current token.
export const createCableConsumer = (url: string): Consumer => {
  const consumer = createConsumer(url)

  Object.defineProperty(consumer, 'subprotocols', {
    get: () => buildCableSubprotocols(window.location.pathname),
  })

  return consumer
}

// @rails/actioncable's types omit the subscription list and `remove`.
type CableSubscriptions = Consumer['subscriptions'] & {
  subscriptions: unknown[]
  remove: (subscription: unknown) => unknown
}

const subscriptionsOf = (consumer: Consumer): CableSubscriptions =>
  consumer.subscriptions as CableSubscriptions

let cableUrl = ''
let activeConsumer: Consumer | null = null
const retiringConsumers = new Set<Consumer>()

const getActiveConsumer = (): Consumer => {
  activeConsumer ??= createCableConsumer(cableUrl)

  return activeConsumer
}

// ActionCableLink only calls `cable.subscriptions.create`, so new subscriptions always go to
// the socket opened with the latest token.
export const getCableConsumer = (url: string): Consumer => {
  cableUrl = url

  return {
    subscriptions: {
      create: (...args: Parameters<Consumer['subscriptions']['create']>) =>
        getActiveConsumer().subscriptions.create(...args),
    },
  } as unknown as Consumer
}

type ConsumerWithSocket = { connection: { webSocket?: WebSocket } }

// `disconnect()` only closes an open socket: one still in its handshake would stay up and be
// reused by the next subscription with the token it was opened with.
const discard = (consumer: Consumer): void => {
  consumer.disconnect()
  ;(consumer as unknown as ConsumerWithSocket).connection.webSocket?.close()
}

const retireWhenEmpty = (consumer: Consumer): void => {
  const subscriptions = subscriptionsOf(consumer)
  const remove = subscriptions.remove.bind(subscriptions)

  subscriptions.remove = (subscription: unknown): unknown => {
    const removed = remove(subscription)

    if (subscriptions.subscriptions.length === 0) {
      discard(consumer)
      retiringConsumers.delete(consumer)
    }

    return removed
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

export const disconnectCableConsumer = (): void => {
  if (activeConsumer) discard(activeConsumer)

  activeConsumer = null
  retiringConsumers.forEach(discard)
  retiringConsumers.clear()
}
