import * as Sentry from '@sentry/react'

import { createWorkerLoadErrorHandler, dropRecoverableWorkerLoadEvent } from '../workerLoadRecovery'

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/reloadWithCacheBust', () => ({
  reloadWithCacheBust: jest.fn(),
}))

const WORKER_LOAD_MESSAGE =
  "Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'blob:https://app.test/1' failed to load."

const sentEvents: Sentry.Event[] = []

function reportUncaughtWorkerLoadError(): void {
  window.onerror?.(WORKER_LOAD_MESSAGE, 'blob:https://app.test/1', 1, 1, undefined)
}

function workerLoadErrorEvent(): ErrorEvent {
  return { message: WORKER_LOAD_MESSAGE, error: null } as ErrorEvent
}

describe('dropRecoverableWorkerLoadEvent wired into a real Sentry client', () => {
  beforeAll(() => {
    Sentry.init({
      dsn: 'https://public@sentry.test/1',
      beforeSend: dropRecoverableWorkerLoadEvent,
      // `Dedupe` would hide a leaked raw event behind an identical one from a previous test.
      integrations: (defaults) => defaults.filter((integration) => integration.name !== 'Dedupe'),
      transport: (options) =>
        Sentry.createTransport(options, () => Promise.resolve({ statusCode: 200 })),
    })
    Sentry.getClient()?.on('afterSendEvent', (event) => {
      sentEvents.push(event)
    })
  })

  afterAll(async () => {
    await Sentry.close()
  })

  beforeEach(() => {
    sentEvents.length = 0
    sessionStorage.clear()
  })

  describe('GIVEN the browser reports an uncaught worker importScripts failure', () => {
    describe('WHEN Sentry global onerror handler captures it', () => {
      it('THEN should not send it, the recovery handles it', async () => {
        reportUncaughtWorkerLoadError()
        await Sentry.flush()

        expect(sentEvents).toHaveLength(0)
      })
    })
  })

  describe('GIVEN the worker recovery already reloaded and the failure repeats', () => {
    describe('WHEN both the global handler and the recovery report it', () => {
      it('THEN should send only the tagged dead-end report', async () => {
        sessionStorage.setItem('lago_chunk_reload', Date.now().toString())
        const handler = createWorkerLoadErrorHandler()

        reportUncaughtWorkerLoadError()
        handler(workerLoadErrorEvent())
        reportUncaughtWorkerLoadError()
        handler(workerLoadErrorEvent())
        await Sentry.flush()

        expect(sentEvents).toHaveLength(1)
        expect(sentEvents[0].tags).toEqual(
          expect.objectContaining({ workerLoad: true, phase: 'dead-end' }),
        )
      })
    })
  })

  describe('GIVEN an unrelated uncaught error', () => {
    describe('WHEN Sentry global onerror handler captures it', () => {
      it('THEN should still send it', async () => {
        window.onerror?.('TypeError: boom', 'https://app.test/main.js', 1, 1, new TypeError('boom'))
        await Sentry.flush()

        expect(sentEvents).toHaveLength(1)
      })
    })
  })
})
