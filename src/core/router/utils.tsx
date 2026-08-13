import { captureException, captureMessage } from '@sentry/react'
import { ComponentType, lazy, LazyExoticComponent } from 'react'

import { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { reloadWithCacheBust } from '~/core/utils/reloadWithCacheBust'

const CHUNK_RELOAD_KEY = 'lago_chunk_reload'
const RELOAD_COOLDOWN_MS = 10_000
const CHUNK_LOAD_FINGERPRINT = 'chunk-load-failure'

function hasReloadedRecently(): boolean {
  try {
    const timestamp = sessionStorage.getItem(CHUNK_RELOAD_KEY)

    if (!timestamp) return false

    return Date.now() - parseInt(timestamp, 10) < RELOAD_COOLDOWN_MS
  } catch {
    // Storage unavailable (blocked, partitioned, sandboxed iframe)
    // Assume already reloaded to avoid infinite reload loop
    return true
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, Date.now().toString())
  } catch {
    // Storage became unavailable after hasAlreadyReloaded() check.
    // In environments where sessionStorage is always unavailable,
    // hasAlreadyReloaded() returns true and we never reach the reload path,
    // so users see the fallback toast instead of an automatic reload.
  }
}

function showPersistentToast(): void {
  import('~/core/apolloClient/reactiveVars/toastVar')
    .then(({ addToast }) => {
      addToast({
        severity: 'info',
        message:
          'Something went wrong while loading the page. Please try refreshing or clearing your cache.',
        autoDismiss: false,
      })
    })
    .catch((error) => {
      // Toast module also failed to load, nothing more we can do.
      // The rejected import is already surfaced by the route error boundary.
      // eslint-disable-next-line no-console
      console.error('Failed to load fallback toast module', error)
    })
}

const retry = (
  fn: () => Promise<{ default: ComponentType<Record<string, never>> }>,
  retriesLeft = 2,
  interval = 1000,
): Promise<{ default: ComponentType<Record<string, never>> }> => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        if (retriesLeft > 0) {
          setTimeout(() => {
            retry(fn, retriesLeft - 1, interval)
              .then(resolve)
              .catch(reject)
          }, interval)

          return
        }

        if (!hasReloadedRecently()) {
          // All retries exhausted — reload silently to get fresh HTML
          markReloaded()
          captureMessage('Chunk load failed - reloading with cache-bust', {
            level: 'warning',
            tags: { chunkLoad: true, phase: 'reload' },
            fingerprint: [CHUNK_LOAD_FINGERPRINT],
          })
          reloadWithCacheBust()

          return
        }

        // Already reloaded recently and still failing. Report it, keep the
        // persistent toast, and reject so the route error boundary renders a
        // recoverable placeholder instead of a spinner that never resolves.
        captureException(error, {
          tags: { chunkLoad: true, phase: 'dead-end' },
          extra: {
            href: window.location.href,
            appVersion: envGlobalVar().appVersion,
          },
          fingerprint: [CHUNK_LOAD_FINGERPRINT],
        })

        showPersistentToast()

        reject(error)
      })
  })
}

export const lazyLoad = (
  fn: () => Promise<{ default: ComponentType<Record<string, never>> }>,
): LazyExoticComponent<ComponentType<Record<string, never>>> => lazy(() => retry(fn))
