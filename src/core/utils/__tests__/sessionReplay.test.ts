import * as Sentry from '@sentry/react'

import { getInitialReplayIntegrations, startSessionReplayOnceUrlIsSafe } from '../sessionReplay'

const TOKEN_URL = '/reset-password/tok_s3cr3t'

const isReplayInstalled = (): boolean => !!Sentry.getClient()?.getIntegrationByName('Replay')

describe('sessionReplay', () => {
  describe('GIVEN Sentry is not initialized', () => {
    it('THEN startSessionReplayOnceUrlIsSafe should do nothing', () => {
      window.history.replaceState({}, '', '/login')

      expect(() => startSessionReplayOnceUrlIsSafe()).not.toThrow()
      expect(Sentry.getClient()).toBeUndefined()
    })
  })

  describe('getInitialReplayIntegrations', () => {
    describe('GIVEN the page URL holds a token', () => {
      it('THEN should hold Replay back', () => {
        window.history.replaceState({}, '', TOKEN_URL)

        expect(getInitialReplayIntegrations()).toEqual([])
      })
    })

    describe('GIVEN the page URL holds no token', () => {
      it('THEN should return Replay', () => {
        window.history.replaceState({}, '', '/acme/customers')

        expect(getInitialReplayIntegrations().map(({ name }) => name)).toEqual(['Replay'])
      })
    })
  })

  describe('GIVEN Sentry started on a token page without Replay', () => {
    beforeAll(() => {
      window.history.replaceState({}, '', TOKEN_URL)

      Sentry.init({
        dsn: 'https://public@sentry.test/1',
        defaultIntegrations: false,
        integrations: getInitialReplayIntegrations(),
        transport: (options) =>
          Sentry.createTransport(options, () => Promise.resolve({ statusCode: 200 })),
      })
    })

    afterAll(async () => {
      await Sentry.close()
    })

    describe('WHEN the user is still on the token page', () => {
      it('THEN should not start Replay', () => {
        startSessionReplayOnceUrlIsSafe()

        expect(isReplayInstalled()).toBe(false)
      })
    })

    describe('WHEN the user navigates away from the token page', () => {
      it('THEN should start Replay once', () => {
        window.history.pushState({}, '', '/login')

        startSessionReplayOnceUrlIsSafe()
        const replay = Sentry.getClient()?.getIntegrationByName('Replay')

        startSessionReplayOnceUrlIsSafe()

        expect(replay).toBeDefined()
        expect(Sentry.getClient()?.getIntegrationByName('Replay')).toBe(replay)
      })
    })
  })
})
