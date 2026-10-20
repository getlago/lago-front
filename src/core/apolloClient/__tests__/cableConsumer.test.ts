import { ApolloLink, execute } from '@apollo/client'
import { parse } from 'graphql'

jest.mock('../reactiveVars', () => ({
  AUTH_TOKEN_LS_KEY: 'auth_token',
  TMP_AUTH_TOKEN_LS_KEY: 'tmp_auth_token',
  CUSTOMER_PORTAL_TOKEN_LS_KEY: 'customer_portal_token',
  getCurrentOrganizationId: jest.fn(),
}))

jest.mock('~/hooks/useDeveloperTool', () => ({
  DEVTOOL_AUTO_SAVE_KEY: 'devtool_auto_save',
  resetDevtoolsNavigation: jest.fn(),
}))

const CABLE_URL = 'wss://api.lago.dev/cable'
const ADMIN_PATH = '/acme/customers'
const PORTAL_PATH = '/customer-portal/portal-token-abc'

// Parsed from a string so codegen does not pick it up as an app operation.
const SUBSCRIPTION = parse(`
  subscription onConversation($id: ID!) {
    aiConversationStreamed(id: $id) {
      chunk
    }
  }
`)

const CONNECTING = 0
const OPEN = 1
const CLOSED = 3

type MockSocket = {
  readyState: number
  protocol: string
  send: jest.Mock
  close: jest.Mock
  onopen?: () => void
  onmessage?: (event: { data: string }) => void
  onclose?: (event: object) => void
}

type CableModule = typeof import('../cableConsumer')

type TestSubscription = {
  observer: { next: jest.Mock; error: jest.Mock; complete: jest.Mock }
  unsubscribe: () => void
}

const createMockSocket = (): MockSocket => {
  const socket: MockSocket = {
    readyState: CONNECTING,
    protocol: '',
    send: jest.fn(),
    close: jest.fn(() => {
      socket.readyState = CLOSED
      socket.onclose?.({})
    }),
  }

  return socket
}

const receive = (socket: MockSocket, message: object): void =>
  socket.onmessage?.({ data: JSON.stringify(message) })

const subscribedIdentifier = (socket: MockSocket): string => {
  const commands = socket.send.mock.calls.map(([data]) => JSON.parse(data as string))

  return commands.find((command) => command.command === 'subscribe').identifier
}

// Opens the socket and has the server confirm its subscriptions.
const serverOpens = (socket: MockSocket): void => {
  socket.readyState = OPEN
  socket.protocol = 'actioncable-v1-json'
  socket.onopen?.()
  receive(socket, { type: 'welcome' })
}

describe('cableConsumer', () => {
  let cable: CableModule
  let webSocketMock: jest.Mock
  let sockets: MockSocket[]

  const subscribe = (link: ApolloLink): TestSubscription => {
    const observer = { next: jest.fn(), error: jest.fn(), complete: jest.fn() }
    const subscription = execute(link, { query: SUBSCRIPTION, variables: { id: '1' } }).subscribe(
      observer,
    )

    return { observer, unsubscribe: (): void => subscription.unsubscribe() }
  }

  const expectLastSocketOpenedWith = (token: string | null): void => {
    expect(webSocketMock).toHaveBeenLastCalledWith(CABLE_URL, [
      'actioncable-v1-json',
      'actioncable-unsupported',
      ...(token ? [`lago-token.${token}`] : []),
    ])
  }

  beforeEach(async () => {
    jest.resetModules()
    localStorage.clear()
    window.history.pushState({}, '', ADMIN_PATH)

    const actionCable = await import('@rails/actioncable')

    sockets = []
    webSocketMock = jest.fn(() => {
      const socket = createMockSocket()

      sockets.push(socket)

      return socket
    })
    Object.assign(webSocketMock, { CONNECTING, OPEN, CLOSING: 2, CLOSED })
    actionCable.adapters.WebSocket = webSocketMock as unknown as typeof WebSocket
    cable = await import('../cableConsumer')
  })

  describe('createCableConsumer', () => {
    describe('WHEN the socket opens', () => {
      it('THEN should offer the token as a subprotocol and keep it out of the URL', () => {
        localStorage.setItem('auth_token', 'admin-jwt')

        cable.createCableConsumer(CABLE_URL, ADMIN_PATH).connect()

        expectLastSocketOpenedWith('admin-jwt')
      })
    })

    describe('WHEN the socket reopens after the token changed', () => {
      it('THEN should send the current token', () => {
        localStorage.setItem('auth_token', 'old-jwt')

        const consumer = cable.createCableConsumer(CABLE_URL, ADMIN_PATH)

        consumer.connect()
        sockets[0].readyState = CLOSED
        localStorage.setItem('auth_token', 'renewed-jwt')
        consumer.connect()

        expectLastSocketOpenedWith('renewed-jwt')
      })
    })

    describe('WHEN the socket reopens after navigating to a customer portal route', () => {
      it('THEN should keep the identity it was created with', () => {
        localStorage.setItem('auth_token', 'admin-jwt')

        const consumer = cable.createCableConsumer(CABLE_URL, ADMIN_PATH)

        consumer.connect()
        sockets[0].readyState = CLOSED
        window.history.pushState({}, '', PORTAL_PATH)
        consumer.connect()

        expectLastSocketOpenedWith('admin-jwt')
      })
    })

    describe('WHEN a subprotocol is added', () => {
      it('THEN should not throw', () => {
        const consumer = cable.createCableConsumer(CABLE_URL, ADMIN_PATH)

        expect(() => consumer.addSubProtocol('custom')).not.toThrow()
      })
    })
  })

  describe('createCableLink', () => {
    describe('WHEN the server streams a result', () => {
      it('THEN should forward it and complete on the last payload', () => {
        const link = cable.createCableLink(CABLE_URL)
        const { observer } = subscribe(link)

        serverOpens(sockets[0])

        const identifier = subscribedIdentifier(sockets[0])
        const result = { data: { aiConversationStreamed: { chunk: 'Hi' } } }

        receive(sockets[0], { identifier, message: { result, more: true } })
        receive(sockets[0], { identifier, message: { result, more: false } })

        expect(observer.next).toHaveBeenCalledTimes(2)
        expect(observer.next).toHaveBeenCalledWith(result)
        expect(observer.complete).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the subscription is confirmed', () => {
      it('THEN should execute the query on the channel', () => {
        const link = cable.createCableLink(CABLE_URL)

        subscribe(link)
        serverOpens(sockets[0])

        const identifier = subscribedIdentifier(sockets[0])

        receive(sockets[0], { identifier, type: 'confirm_subscription' })

        const commands = sockets[0].send.mock.calls.map(([data]) => JSON.parse(data as string))
        const executeCommand = commands.find((command) => command.command === 'message')

        expect(JSON.parse(executeCommand.data)).toEqual(
          expect.objectContaining({
            action: 'execute',
            operationName: 'onConversation',
            variables: { id: '1' },
          }),
        )
      })
    })

    describe('WHEN the server rejects the subscription', () => {
      it('THEN should error the observer', () => {
        const link = cable.createCableLink(CABLE_URL)
        const { observer } = subscribe(link)

        serverOpens(sockets[0])
        receive(sockets[0], {
          identifier: subscribedIdentifier(sockets[0]),
          type: 'reject_subscription',
        })

        expect(observer.error).toHaveBeenCalledWith(expect.any(cable.CableSubscriptionError))
      })
    })

    describe('WHEN the server disconnects without reconnecting', () => {
      it('THEN should error the observer', () => {
        const link = cable.createCableLink(CABLE_URL)
        const { observer } = subscribe(link)

        serverOpens(sockets[0])
        receive(sockets[0], { type: 'disconnect', reason: 'unauthorized', reconnect: false })

        expect(observer.error).toHaveBeenCalledWith(expect.any(cable.CableSubscriptionError))
      })
    })
  })

  describe('refreshCableConsumer', () => {
    describe('WHEN the token is renewed while no subscription runs', () => {
      it('THEN should close the socket and open a new one with the renewed token', () => {
        localStorage.setItem('auth_token', 'old-jwt')

        const link = cable.createCableLink(CABLE_URL)

        subscribe(link).unsubscribe()
        localStorage.setItem('auth_token', 'renewed-jwt')
        cable.refreshCableConsumer()
        subscribe(link)

        expect(sockets[0].close).toHaveBeenCalled()
        expect(sockets).toHaveLength(2)
        expectLastSocketOpenedWith('renewed-jwt')
      })
    })

    describe('WHEN the token is renewed while an answer is streaming', () => {
      it('THEN should keep the streaming socket until its subscription ends', () => {
        localStorage.setItem('auth_token', 'old-jwt')

        const link = cable.createCableLink(CABLE_URL)
        const streaming = subscribe(link)

        localStorage.setItem('auth_token', 'renewed-jwt')
        cable.refreshCableConsumer()
        subscribe(link)

        expect(sockets[0].close).not.toHaveBeenCalled()
        expect(sockets).toHaveLength(2)
        expectLastSocketOpenedWith('renewed-jwt')

        streaming.unsubscribe()

        expect(sockets[0].close).toHaveBeenCalled()
      })
    })

    describe('WHEN the streaming subscription of a retired socket is rejected', () => {
      it('THEN should close the retired socket', () => {
        const link = cable.createCableLink(CABLE_URL)

        subscribe(link)
        serverOpens(sockets[0])
        cable.refreshCableConsumer()
        receive(sockets[0], {
          identifier: subscribedIdentifier(sockets[0]),
          type: 'reject_subscription',
        })

        expect(sockets[0].close).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN another tab renewed the token', () => {
    it('THEN should open a new socket with that token for the next subscription', () => {
      localStorage.setItem('auth_token', 'old-jwt')

      const link = cable.createCableLink(CABLE_URL)

      subscribe(link)
      localStorage.setItem('auth_token', 'renewed-in-another-tab-jwt')
      subscribe(link)

      expect(sockets[0].close).not.toHaveBeenCalled()
      expect(sockets).toHaveLength(2)
      expectLastSocketOpenedWith('renewed-in-another-tab-jwt')
    })
  })

  describe('WHEN a subscription starts on a customer portal route', () => {
    it('THEN should open a socket without the admin token', () => {
      localStorage.setItem('auth_token', 'admin-jwt')

      const link = cable.createCableLink(CABLE_URL)

      subscribe(link)
      window.history.pushState({}, '', PORTAL_PATH)
      subscribe(link)

      expect(sockets).toHaveLength(2)
      expectLastSocketOpenedWith(null)
    })
  })

  describe('WHEN the token did not change', () => {
    it('THEN should keep using the same socket', () => {
      const link = cable.createCableLink(CABLE_URL)

      subscribe(link)
      subscribe(link)

      expect(sockets).toHaveLength(1)
    })
  })

  describe('WHEN another tab logs out', () => {
    it('THEN should close the sockets opened with the removed token', () => {
      localStorage.setItem('auth_token', 'admin-jwt')

      const link = cable.createCableLink(CABLE_URL)

      subscribe(link)
      window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null }))

      expect(sockets[0].close).toHaveBeenCalled()
    })
  })

  describe('disconnectCableConsumer', () => {
    describe('WHEN the user logs out while the socket is still connecting', () => {
      it('THEN should close it and open a new socket with the next token', () => {
        localStorage.setItem('auth_token', 'previous-user-jwt')

        const link = cable.createCableLink(CABLE_URL)

        subscribe(link)
        cable.disconnectCableConsumer()
        localStorage.setItem('auth_token', 'next-user-jwt')
        subscribe(link)

        expect(sockets[0].close).toHaveBeenCalled()
        expect(sockets).toHaveLength(2)
        expectLastSocketOpenedWith('next-user-jwt')
      })
    })

    describe('WHEN a streaming socket was retired by a renewal', () => {
      it('THEN should close both the active and the retired sockets', () => {
        const link = cable.createCableLink(CABLE_URL)

        subscribe(link)
        cable.refreshCableConsumer()
        subscribe(link)
        cable.disconnectCableConsumer()

        expect(sockets[0].close).toHaveBeenCalled()
        expect(sockets[1].close).toHaveBeenCalled()
      })
    })
  })
})
