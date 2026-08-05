import { act } from '@testing-library/react'

import { lazyLoad } from '../utils'

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

const DummyComponent = () => <div>loaded</div>

function triggerLazy(LazyComponent: any): Promise<void> {
  const payload = LazyComponent._payload
  const init = LazyComponent._init

  try {
    init(payload)
  } catch (thrown) {
    if (thrown && typeof (thrown as any).then === 'function') {
      return thrown as Promise<void>
    }
  }

  return Promise.resolve()
}

describe('lazyLoad / retry', () => {
  const FAKE_NOW = 1700000000000

  beforeEach(() => {
    jest.useFakeTimers({ now: FAKE_NOW })
    jest.clearAllMocks()
    sessionStorage.clear()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('GIVEN the chunk loads successfully on first try', () => {
    describe('WHEN lazyLoad is called', () => {
      it('THEN should resolve without triggering reload or toast', async () => {
        const loader = () => Promise.resolve({ default: DummyComponent })
        const LazyComponent = lazyLoad(loader)
        let resolved = false

        act(() => {
          triggerLazy(LazyComponent).then(() => {
            resolved = true
          })
        })

        await act(async () => {
          await jest.runAllTimersAsync()
        })

        expect(resolved).toBe(true)
        expect(sessionStorage.getItem('lago_chunk_reload')).toBeNull()
        expect(mockAddToast).not.toHaveBeenCalled()
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
        expect(mockCaptureMessage).not.toHaveBeenCalled()
        expect(mockCaptureException).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the chunk fails then succeeds on retry', () => {
    describe('WHEN the first attempt fails', () => {
      it('THEN should retry and resolve without reload', async () => {
        let callCount = 0
        const loader = () => {
          callCount++

          return callCount === 1
            ? Promise.reject(new Error('chunk failed'))
            : Promise.resolve({ default: DummyComponent })
        }

        const LazyComponent = lazyLoad(loader)
        let resolved = false

        act(() => {
          triggerLazy(LazyComponent).then(() => {
            resolved = true
          })
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(1500)
        })

        expect(resolved).toBe(true)
        expect(sessionStorage.getItem('lago_chunk_reload')).toBeNull()
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN all retries fail and no previous reload', () => {
    describe('WHEN retries are exhausted', () => {
      it('THEN should mark the reload flag and navigate with a cache-busting URL', async () => {
        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent)
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        // sessionStorage timestamp proves the reload branch was taken.
        // Clock advanced 2s (retries), so markReloaded() wrote FAKE_NOW + 2000.
        expect(sessionStorage.getItem('lago_chunk_reload')).toBe(String(FAKE_NOW + 2000))
        expect(mockReloadWithCacheBust).toHaveBeenCalledTimes(1)
        expect(mockAddToast).not.toHaveBeenCalled()
      })

      it('THEN should report the reload to Sentry', async () => {
        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent)
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        expect(mockCaptureMessage).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            level: 'warning',
            tags: { chunkLoad: true, phase: 'reload' },
            fingerprint: ['chunk-load-failure'],
          }),
        )
        expect(mockCaptureException).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN all retries fail and a reload happened recently', () => {
    describe('WHEN retries are exhausted within the cooldown window', () => {
      it('THEN should show a persistent toast instead of reloading again', async () => {
        sessionStorage.setItem('lago_chunk_reload', Date.now().toString())

        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent).catch(() => {})
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'info',
            autoDismiss: false,
          }),
        )
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
      })

      it('THEN should reject with the original error so the boundary can render', async () => {
        sessionStorage.setItem('lago_chunk_reload', Date.now().toString())

        const chunkError = new Error('chunk failed')
        const loader = () => Promise.reject(chunkError)
        const LazyComponent = lazyLoad(loader)
        let rejection: unknown

        act(() => {
          triggerLazy(LazyComponent).catch((error) => {
            rejection = error
          })
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        expect(rejection).toBe(chunkError)
      })

      it('THEN should report the dead-end to Sentry', async () => {
        sessionStorage.setItem('lago_chunk_reload', Date.now().toString())

        const chunkError = new Error('chunk failed')
        const loader = () => Promise.reject(chunkError)
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent).catch(() => {})
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        expect(mockCaptureException).toHaveBeenCalledWith(
          chunkError,
          expect.objectContaining({
            tags: { chunkLoad: true, phase: 'dead-end' },
            fingerprint: ['chunk-load-failure'],
            extra: expect.objectContaining({ appVersion: '1.0.0' }),
          }),
        )
      })
    })
  })

  describe('GIVEN a reload happened but the cooldown has expired', () => {
    describe('WHEN retries are exhausted after cooldown', () => {
      it('THEN should reload again instead of showing toast', async () => {
        // Set a timestamp older than the 10s cooldown
        sessionStorage.setItem('lago_chunk_reload', String(FAKE_NOW - 15_000))

        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent)
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        // Should take the reload branch — markReloaded() wrote a fresh timestamp
        expect(sessionStorage.getItem('lago_chunk_reload')).toBe(String(FAKE_NOW + 2000))
        expect(mockReloadWithCacheBust).toHaveBeenCalledTimes(1)
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN sessionStorage.getItem throws', () => {
    describe('WHEN retries are exhausted', () => {
      it('THEN should skip reload and show toast to avoid infinite loop', async () => {
        jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
          throw new DOMException('Storage blocked')
        })

        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent).catch(() => {})
        })

        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        expect(mockAddToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'info',
            autoDismiss: false,
          }),
        )
        expect(mockReloadWithCacheBust).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN sessionStorage.setItem throws', () => {
    describe('WHEN markReloaded is called during reload path', () => {
      it('THEN should not throw and still reach the reload branch', async () => {
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
        jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new DOMException('Storage full')
        })

        const loader = () => Promise.reject(new Error('chunk failed'))
        const LazyComponent = lazyLoad(loader)

        act(() => {
          triggerLazy(LazyComponent)
        })

        // Should not throw — markReloaded catches the error
        await act(async () => {
          await jest.advanceTimersByTimeAsync(3000)
        })

        // Toast should NOT be called — we took the reload path, not the toast path
        expect(mockAddToast).not.toHaveBeenCalled()
        expect(mockReloadWithCacheBust).toHaveBeenCalledTimes(1)
      })
    })
  })
})
