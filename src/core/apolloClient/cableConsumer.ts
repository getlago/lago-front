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
