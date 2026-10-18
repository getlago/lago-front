import type { Consumer } from '@rails/actioncable'

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

type CableModule = typeof import('../cableConsumer')
type SubscriptionWithConsumer = { consumer: Consumer; unsubscribe: () => void }

describe('cableConsumer', () => {
  let cable: CableModule
  let webSocketMock: jest.Mock

  const subscribe = (link: Consumer): SubscriptionWithConsumer =>
    link.subscriptions.create({ channel: 'GraphqlChannel' }) as unknown as SubscriptionWithConsumer

  beforeEach(async () => {
    jest.resetModules()
    localStorage.clear()

    const actionCable = await import('@rails/actioncable')

    webSocketMock = jest.fn()
    actionCable.adapters.WebSocket = webSocketMock as unknown as typeof WebSocket
    cable = await import('../cableConsumer')
  })

  describe('createCableConsumer', () => {
    describe('WHEN the socket opens', () => {
      it('THEN should offer the token as a subprotocol and keep it out of the URL', () => {
        localStorage.setItem('auth_token', 'admin-jwt')

        cable.createCableConsumer(CABLE_URL).connect()

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

        const consumer = cable.createCableConsumer(CABLE_URL)

        localStorage.setItem('auth_token', 'renewed-jwt')

        expect(consumer.subprotocols).toEqual(['lago-token.renewed-jwt'])
      })
    })
  })

  describe('refreshCableConsumer', () => {
    describe('WHEN the token is renewed while no subscription runs', () => {
      it('THEN should close the socket and reuse the consumer for the next subscription', () => {
        const link = cable.getCableConsumer(CABLE_URL)
        const first = subscribe(link)
        const disconnectSpy = jest.spyOn(first.consumer, 'disconnect')

        first.unsubscribe()
        cable.refreshCableConsumer()

        expect(disconnectSpy).toHaveBeenCalledTimes(1)
        expect(subscribe(link).consumer).toBe(first.consumer)
      })
    })

    describe('WHEN the token is renewed while an answer is streaming', () => {
      it('THEN should keep the streaming socket and open a new one for new subscriptions', () => {
        localStorage.setItem('auth_token', 'old-jwt')

        const link = cable.getCableConsumer(CABLE_URL)
        const streaming = subscribe(link)
        const disconnectSpy = jest.spyOn(streaming.consumer, 'disconnect')

        localStorage.setItem('auth_token', 'renewed-jwt')
        cable.refreshCableConsumer()

        expect(disconnectSpy).not.toHaveBeenCalled()

        const next = subscribe(link)

        expect(next.consumer).not.toBe(streaming.consumer)
        expect(webSocketMock).toHaveBeenLastCalledWith(CABLE_URL, [
          'actioncable-v1-json',
          'actioncable-unsupported',
          'lago-token.renewed-jwt',
        ])

        streaming.unsubscribe()

        expect(disconnectSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('disconnectCableConsumer', () => {
    describe('WHEN a streaming socket was retired by a renewal', () => {
      it('THEN should close both the active and the retired sockets', () => {
        const link = cable.getCableConsumer(CABLE_URL)
        const streaming = subscribe(link)
        const retiredSpy = jest.spyOn(streaming.consumer, 'disconnect')

        cable.refreshCableConsumer()

        const active = subscribe(link)
        const activeSpy = jest.spyOn(active.consumer, 'disconnect')

        cable.disconnectCableConsumer()

        expect(retiredSpy).toHaveBeenCalledTimes(1)
        expect(activeSpy).toHaveBeenCalledTimes(1)
      })
    })
  })
})
