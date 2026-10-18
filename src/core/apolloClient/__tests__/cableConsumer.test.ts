import { adapters } from '@rails/actioncable'

import { createCableConsumer } from '../cableConsumer'

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

describe('createCableConsumer', () => {
  const originalWebSocket = adapters.WebSocket
  const webSocketMock = jest.fn()

  beforeEach(() => {
    localStorage.clear()
    webSocketMock.mockReset()
    adapters.WebSocket = webSocketMock as unknown as typeof WebSocket
  })

  afterAll(() => {
    adapters.WebSocket = originalWebSocket
  })

  describe('WHEN the socket opens', () => {
    it('THEN should offer the token as a subprotocol and keep it out of the URL', () => {
      localStorage.setItem('auth_token', 'admin-jwt')

      const consumer = createCableConsumer(CABLE_URL)

      consumer.connect()

      expect(webSocketMock).toHaveBeenCalledWith(CABLE_URL, [
        'actioncable-v1-json',
        'actioncable-unsupported',
        'lago-token.admin-jwt',
      ])
    })
  })

  describe('WHEN the token changes after the consumer is created', () => {
    it('THEN should send the current token', () => {
      localStorage.setItem('auth_token', 'old-jwt')

      const consumer = createCableConsumer(CABLE_URL)

      localStorage.setItem('auth_token', 'renewed-jwt')

      expect(consumer.subprotocols).toEqual(['lago-token.renewed-jwt'])
    })
  })
})
