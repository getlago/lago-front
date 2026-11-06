import type { BrowserClient, Event } from '@sentry/react'
import { generatePath } from 'react-router-dom'

import {
  INVITATION_ROUTE,
  INVITATION_ROUTE_FORM,
  RESET_PASSWORD_ROUTE,
} from '~/core/router/AuthRoutes'
import {
  CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
  CUSTOMER_PORTAL_ROUTE,
  CUSTOMER_PORTAL_USAGE_ROUTE,
  CUSTOMER_PORTAL_WALLET_ROUTE,
} from '~/core/router/paths/customerPortal'

import {
  hasUrlToken,
  scrubReplayEventUrlTokensIntegration,
  scrubUrlTokens,
} from '../sentryUrlTokens'

const SECRET = 'tok_s3cr3t-Value_42'

describe('scrubUrlTokens', () => {
  describe('GIVEN a string holding a URL with a token', () => {
    it.each([
      [
        'reset password page',
        `https://app.getlago.com/reset-password/${SECRET}`,
        'https://app.getlago.com/reset-password/[Filtered]',
      ],
      ['invitation page', `/invitation/${SECRET}`, '/invitation/[Filtered]'],
      [
        'invitation form forwarded by the SSO callback',
        `/invitation/${SECRET}/form?oktaCode=${SECRET}&oktaState=${SECRET}`,
        '/invitation/[Filtered]/form?oktaCode=[Filtered]&oktaState=[Filtered]',
      ],
      [
        'invitation form forwarded by the Entra ID callback',
        `/invitation/${SECRET}/form?entraIdCode=${SECRET}&entraIdState=${SECRET}`,
        '/invitation/[Filtered]/form?entraIdCode=[Filtered]&entraIdState=[Filtered]',
      ],
      [
        'customer portal sub-page',
        `/customer-portal/${SECRET}/usage/item_1`,
        '/customer-portal/[Filtered]/usage/item_1',
      ],
      [
        'email verification link',
        `/verify-email?token=${SECRET}`,
        '/verify-email?token=[Filtered]',
      ],
      [
        'SSO callback whose state embeds the invitation token',
        `/auth/okta/callback?code=${SECRET}&state=%7B%22invitationToken%22%3A%22${SECRET}%22%7D`,
        '/auth/okta/callback?code=[Filtered]&state=[Filtered]',
      ],
      [
        'unencoded JSON state',
        `/auth/google/callback?state={"invitationToken":"${SECRET}"}&code=${SECRET}`,
        '/auth/google/callback?state=[Filtered]&code=[Filtered]',
      ],
      [
        'token param followed by a fragment',
        `/sign-up?page=2&code=${SECRET}#top`,
        '/sign-up?page=2&code=[Filtered]#top',
      ],
      [
        'URL inside a message',
        `Failed to load https://app.test/reset-password/${SECRET} (timeout)`,
        'Failed to load https://app.test/reset-password/[Filtered] (timeout)',
      ],
    ])('THEN should redact the token of the %s', (_, input, expected) => {
      expect(scrubUrlTokens(input)).toBe(expected)
    })
  })

  describe('GIVEN a string without token', () => {
    it.each([
      '/acme/customers?page=2',
      '/acme/settings/members/invitations',
      '/login?lago_error_code=user_does_not_exist',
      '/settings/integrations/gocardless?lago_code=gc_prod&lago_name=GoCardless',
      'https://app.test/assets/Invitation-a1b2c3.js',
      '/reset-password',
    ])('THEN should leave %s untouched', (input) => {
      expect(scrubUrlTokens(input)).toBe(input)
    })
  })

  describe('GIVEN every route that carries a token in its path', () => {
    it.each([
      RESET_PASSWORD_ROUTE,
      INVITATION_ROUTE,
      INVITATION_ROUTE_FORM,
      CUSTOMER_PORTAL_ROUTE,
      CUSTOMER_PORTAL_USAGE_ROUTE,
      CUSTOMER_PORTAL_WALLET_ROUTE,
      CUSTOMER_PORTAL_CUSTOMER_EDIT_INFORMATION_ROUTE,
    ])('THEN should redact the token of %s', (route) => {
      const url = `https://app.test${generatePath(route, {
        token: SECRET,
        itemId: 'item_1',
        walletId: 'wallet_1',
      })}`

      expect(scrubUrlTokens(url)).not.toContain(SECRET)
    })
  })

  describe('GIVEN an already redacted string', () => {
    it('THEN should return it unchanged', () => {
      const redacted = scrubUrlTokens(`/invitation/${SECRET}/form?code=${SECRET}`)

      expect(scrubUrlTokens(redacted)).toBe(redacted)
    })
  })

  describe('GIVEN a nested payload', () => {
    const buildPayload = (): Event => ({
      transaction: `/reset-password/${SECRET}`,
      request: { url: `https://app.test/reset-password/${SECRET}`, headers: { Accept: '*/*' } },
      breadcrumbs: [
        { category: 'navigation', data: { from: '/login', to: `/reset-password/${SECRET}` } },
        { category: 'ui.click', message: 'button.submit' },
      ],
      extra: { href: `https://app.test/verify-email?token=${SECRET}`, count: 2, isRetry: false },
      tags: { phase: 'preload' },
    })

    it('THEN should redact every nested string', () => {
      expect(JSON.stringify(scrubUrlTokens(buildPayload()))).not.toContain(SECRET)
    })

    it('THEN should not mutate the input', () => {
      const payload = buildPayload()

      scrubUrlTokens(payload)

      expect(payload).toEqual(buildPayload())
    })

    it('THEN should keep the references of the branches without token', () => {
      const payload = buildPayload()
      const scrubbed = scrubUrlTokens(payload)

      expect(scrubbed).not.toBe(payload)
      expect(scrubbed.request?.headers).toBe(payload.request?.headers)
      expect(scrubbed.breadcrumbs?.[1]).toBe(payload.breadcrumbs?.[1])
      expect(scrubbed.tags).toBe(payload.tags)
    })
  })

  describe('GIVEN a payload without token', () => {
    it('THEN should return the same reference', () => {
      const payload = { request: { url: 'https://app.test/acme/customers' }, urls: ['/login'] }

      expect(scrubUrlTokens(payload)).toBe(payload)
    })
  })

  describe('GIVEN a payload with a circular reference', () => {
    it('THEN should redact it without looping', () => {
      const payload: Record<string, unknown> = { url: `/invitation/${SECRET}` }

      payload.self = payload

      expect(scrubUrlTokens(payload).url).toBe('/invitation/[Filtered]')
    })
  })

  describe('GIVEN a class instance', () => {
    it('THEN should leave it untouched', () => {
      const error = new Error(`/reset-password/${SECRET}`)

      expect(scrubUrlTokens({ error }).error).toBe(error)
    })
  })

  describe('GIVEN a value without strings', () => {
    it.each([null, undefined, 42, true])('THEN should return %s as is', (value) => {
      expect(scrubUrlTokens(value)).toBe(value)
    })
  })
})

describe('hasUrlToken', () => {
  it.each([
    [`https://app.test/customer-portal/${SECRET}`, true],
    [`https://app.test/verify-email?token=${SECRET}`, true],
    ['https://app.test/acme/customers?page=2', false],
  ])('GIVEN %s THEN should return %s', (url, expected) => {
    expect(hasUrlToken(url)).toBe(expected)
  })
})

describe('scrubReplayEventUrlTokensIntegration', () => {
  const integration = scrubReplayEventUrlTokensIntegration()
  const processEvent = (event: Event): unknown =>
    integration.processEvent?.(event, {}, {} as BrowserClient)

  describe('GIVEN a replay event', () => {
    it('THEN should redact its URLs', () => {
      const replayEvent = {
        type: 'replay_event' as const,
        request: { url: `https://app.test/invitation/${SECRET}/form` },
        urls: [`https://app.test/invitation/${SECRET}`, 'https://app.test/login'],
      }

      expect(processEvent(replayEvent)).toEqual({
        type: 'replay_event',
        request: { url: 'https://app.test/invitation/[Filtered]/form' },
        urls: ['https://app.test/invitation/[Filtered]', 'https://app.test/login'],
      })
    })
  })

  describe('GIVEN an error event', () => {
    it('THEN should leave it to beforeSend', () => {
      const errorEvent: Event = { request: { url: `https://app.test/invitation/${SECRET}` } }

      expect(processEvent(errorEvent)).toBe(errorEvent)
    })
  })
})
