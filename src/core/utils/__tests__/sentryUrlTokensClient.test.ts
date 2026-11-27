import * as Sentry from '@sentry/react'

import { sentryEventHooks } from '../sentryEventHooks'
import {
  scrubDscUrlTokensIntegration,
  scrubReplayEventUrlTokensIntegration,
} from '../sentryUrlTokens'

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/reloadWithCacheBust', () => ({
  reloadWithCacheBust: jest.fn(),
}))

const SECRET = 'tok_s3cr3t-Value_42'

const WORKER_LOAD_MESSAGE =
  "Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'blob:https://app.test/1' failed to load."

const sentEvents: Sentry.Event[] = []
const sentPayloads: string[] = []

const getSentPayloads = (): string => sentPayloads.join('\n')

describe('URL token scrubbing wired into a real Sentry client', () => {
  beforeAll(() => {
    Sentry.init({
      dsn: 'https://public@sentry.test/1',
      tracesSampleRate: 1,
      traceLifecycle: 'stream',
      // `Dedupe` would hide a leaked event behind an identical one from a previous test.
      integrations: (defaults) => [
        ...defaults.filter((integration) => integration.name !== 'Dedupe'),
        scrubReplayEventUrlTokensIntegration(),
        scrubDscUrlTokensIntegration(),
      ],
      ...sentryEventHooks,
      transport: (options) =>
        Sentry.createTransport(options, (request) => {
          sentPayloads.push(String(request.body))

          return Promise.resolve({ statusCode: 200 })
        }),
    })
    Sentry.getClient()?.on('afterSendEvent', (event) => {
      sentEvents.push(event)
    })
  })

  afterAll(async () => {
    await Sentry.close()
  })

  beforeEach(() => {
    window.history.replaceState({}, '', '/login')
    sentEvents.length = 0
    sentPayloads.length = 0
  })

  describe('GIVEN the user lands on the reset password page', () => {
    describe('WHEN an error is captured', () => {
      it('THEN should redact the token from the request URL, extra and breadcrumbs', async () => {
        window.history.pushState({}, '', `/reset-password/${SECRET}`)

        Sentry.captureException(new Error('boom'), { extra: { href: window.location.href } })
        await Sentry.flush()

        expect(sentEvents).toHaveLength(1)
        expect(sentEvents[0].request?.url).toBe('http://localhost/reset-password/[Filtered]')
        expect(sentEvents[0].extra?.href).toBe('http://localhost/reset-password/[Filtered]')
        expect(sentEvents[0].breadcrumbs).toContainEqual(
          expect.objectContaining({
            category: 'navigation',
            data: expect.objectContaining({ to: '/reset-password/[Filtered]' }),
          }),
        )
        expect(getSentPayloads()).not.toContain(SECRET)
      })
    })
  })

  describe('GIVEN the reset password mutation fails', () => {
    describe('WHEN its GraphQL error is captured with the operation variables', () => {
      it('THEN should redact the token and the new password', async () => {
        Sentry.captureException(new Error('GraphQL Error: unprocessable_entity'), {
          extra: { variables: { input: { token: SECRET, newPassword: SECRET } } },
        })
        await Sentry.flush()

        expect(sentEvents[0].extra?.variables).toEqual({
          input: { token: '[Filtered]', newPassword: '[Filtered]' },
        })
        expect(getSentPayloads()).not.toContain(SECRET)
      })
    })
  })

  describe('GIVEN the SSO callback forwards the user to the invitation form', () => {
    describe('WHEN a pageload span tree is recorded', () => {
      it('THEN should redact the token from the segment name, span attributes, the envelope trace header and the outgoing baggage header', async () => {
        window.history.pushState({}, '', `/invitation/${SECRET}/form?oktaCode=${SECRET}`)

        let traceData: ReturnType<typeof Sentry.getTraceData> = {}

        Sentry.startSpan(
          {
            name: window.location.pathname,
            op: 'pageload',
            attributes: { 'url.full': window.location.href },
          },
          () => {
            traceData = Sentry.getTraceData()
            Sentry.startSpan(
              { name: 'child', op: 'ui.render', attributes: { 'http.url': window.location.href } },
              () => undefined,
            )
          },
        )
        await Sentry.flush()

        // The segment (root) span name, the `url.full`/`http.url` attributes, and the envelope's
        // dynamic sampling context header (`trace.transaction`) all carry the raw path/query
        expect(getSentPayloads()).toContain('"name":"/invitation/[Filtered]/form"')
        expect(getSentPayloads()).toContain(
          'http://localhost/invitation/[Filtered]/form?oktaCode=[Filtered]',
        )
        expect(getSentPayloads()).toContain('"transaction":"/invitation/[Filtered]/form"')
        expect(getSentPayloads()).not.toContain(SECRET)

        // `getTraceData()` is what the app's own instrumented fetch/XHR calls attach as the
        // `baggage`/`sentry-trace` headers on every outgoing request, independent of the envelope
        expect(traceData.baggage).toContain('Filtered')
        expect(traceData.baggage).not.toContain(SECRET)
      })
    })
  })

  describe('GIVEN an interaction on a customer portal page', () => {
    describe('WHEN a standalone span is sent (e.g. INP)', () => {
      it('THEN should redact the token from its attributes', async () => {
        Sentry.startInactiveSpan({
          name: 'click',
          op: 'ui.interaction.click',
          attributes: { transaction: `/customer-portal/${SECRET}/usage/item_1` },
          experimental: { standalone: true },
        }).end()
        await Sentry.flush()

        expect(getSentPayloads()).toContain('/customer-portal/[Filtered]/usage/item_1')
        expect(getSentPayloads()).not.toContain(SECRET)
      })
    })
  })

  describe('GIVEN a recoverable worker load failure on a token page', () => {
    describe('WHEN Sentry global onerror handler captures it', () => {
      it('THEN should still drop it', async () => {
        window.history.pushState({}, '', `/customer-portal/${SECRET}`)

        window.onerror?.(WORKER_LOAD_MESSAGE, 'blob:https://app.test/1', 1, 1, undefined)
        await Sentry.flush()

        expect(sentEvents).toHaveLength(0)
      })
    })
  })

  describe('GIVEN a page without token', () => {
    describe('WHEN an error is captured', () => {
      it('THEN should send its URL untouched', async () => {
        window.history.pushState({}, '', '/acme/customers?page=2')

        Sentry.captureException(new Error('boom'))
        await Sentry.flush()

        expect(sentEvents[0].request?.url).toBe('http://localhost/acme/customers?page=2')
      })
    })
  })
})
