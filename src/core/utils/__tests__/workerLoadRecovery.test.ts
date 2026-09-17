import { createWorkerLoadErrorHandler } from '../workerLoadRecovery'

const mockAddToast = jest.fn()
const mockReloadWithCacheBust = jest.fn()
const mockCaptureException = jest.fn()
const mockCaptureMessage = jest.fn()

jest.mock('~/core/apolloClient/reactiveVars/toastVar', () => ({
  addToast: mockAddToast,
}))

jest.mock('~/core/utils/reloadWithCacheBust', () => ({
  reloadWithCacheBust: () => mockReloadWithCacheBust(),
}))

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}))

function unrelatedErrorEvent(): ErrorEvent {
  return { message: 'TypeError: Cannot read properties of undefined' } as ErrorEvent
}

function workerLoadErrorEvent(): ErrorEvent {
  return {
    message:
      "Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script failed to load.",
    error: new Error('worker load failed'),
  } as ErrorEvent
}

describe('createWorkerLoadErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
  })

  describe('GIVEN an unrelated error event', () => {
    describe('WHEN the handler runs', () => {
      it('THEN should ignore it', () => {
        const handler = createWorkerLoadErrorHandler()

        handler(unrelatedErrorEvent())

        expect(mockCaptureMessage).not.toHaveBeenCalled()
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the first worker-load failure on this handler', () => {
    describe('WHEN the handler runs', () => {
      it('THEN should report it without reloading, in case it was a transient blip', () => {
        const handler = createWorkerLoadErrorHandler()

        handler(workerLoadErrorEvent())

        expect(mockCaptureMessage).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ tags: { workerLoad: true, phase: 'first-failure' } }),
        )
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a second worker-load failure and no previous reload', () => {
    describe('WHEN the handler runs', () => {
      it('THEN should reload with a cache-busting URL', () => {
        const handler = createWorkerLoadErrorHandler()

        handler(workerLoadErrorEvent())
        handler(workerLoadErrorEvent())

        expect(sessionStorage.getItem('lago_chunk_reload')).not.toBeNull()
        expect(mockReloadWithCacheBust).toHaveBeenCalledTimes(1)
        expect(mockCaptureMessage).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ tags: { workerLoad: true, phase: 'reload' } }),
        )
      })
    })
  })

  describe('GIVEN a second worker-load failure and a reload happened recently', () => {
    describe('WHEN the handler runs', () => {
      it('THEN should report the dead-end and show the persistent toast instead of reloading again', async () => {
        sessionStorage.setItem('lago_chunk_reload', Date.now().toString())

        const handler = createWorkerLoadErrorHandler()

        handler(workerLoadErrorEvent())
        handler(workerLoadErrorEvent())

        // showPersistentToast() resolves the dynamic toastVar import on a microtask
        await Promise.resolve()
        await Promise.resolve()

        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
        expect(mockCaptureException).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({ tags: { workerLoad: true, phase: 'dead-end' } }),
        )
        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'info', autoDismiss: false }),
        )
      })
    })
  })
})
