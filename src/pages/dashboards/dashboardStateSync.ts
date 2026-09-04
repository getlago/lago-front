import { EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { debounce } from 'lodash'

export const DASHBOARD_STATE_SEARCH_PARAM = 'dashboard_state'

const DEFAULT_DEBOUNCE_MS = 800
const DEFAULT_POLL_INTERVAL_MS = 1000
const PERMALINK_PATH_MARKER = 'p'

/**
 * Superset hands back a permalink as `<domain>/superset/dashboard/p/<key>/`.
 * Only the key travels in the Lago URL, where it is fed back to the iframe as
 * the `permalink_key` param.
 */
export const extractPermalinkKey = (url: string): string | null => {
  const segments = url.split('#')[0].split('?')[0].split('/').filter(Boolean)
  const markerIndex = segments.lastIndexOf(PERMALINK_PATH_MARKER)

  if (markerIndex === -1 || markerIndex === segments.length - 1) return null

  return segments[markerIndex + 1]
}

type AttachDashboardStateSyncParams = {
  embedded: EmbeddedDashboard
  onStateKey: (key: string) => void
  /**
   * Key the page was loaded with, if any. Seeding it stops a revert back to
   * that state from re-emitting the key already present in the url.
   */
  initialKey?: string | null
  debounceMs?: number
  pollIntervalMs?: number
}

/**
 * Mirrors the embedded dashboard's state (filters + active tab) out to the
 * caller as a Superset permalink key.
 *
 * Two capture channels, because Superset only pushes one of them:
 * - filters arrive through `observeDataMask`
 * - tabs have no event, so they are polled
 *
 * Returns the teardown function. Unmounting the dashboard itself stays the
 * caller's job.
 */
export const attachDashboardStateSync = ({
  embedded,
  onStateKey,
  initialKey = null,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: AttachDashboardStateSyncParams): (() => void) => {
  let disabled = false
  let polling = false
  let pollTimer: ReturnType<typeof setInterval> | undefined
  let lastEmittedKey: string | null = initialKey
  let knownActiveTabs: string | null = null

  function stopPolling(): void {
    if (pollTimer) clearInterval(pollTimer)

    pollTimer = undefined
  }

  function disableSync(): void {
    disabled = true
    syncStateKey.cancel()
    stopPolling()
  }

  const syncStateKey = debounce(async (): Promise<void> => {
    if (disabled) return

    try {
      const key = extractPermalinkKey(await embedded.getDashboardPermalink(''))

      // Teardown may have run while the request was in flight. `.cancel()`
      // only stops a debounce that has not fired yet, it cannot abort an
      // already-running invocation, so this is the only guard against
      // emitting a stale key onto whatever the caller navigated to since.
      if (disabled) return
      if (!key || key === lastEmittedKey) return

      lastEmittedKey = key
      onStateKey(key)
    } catch (error) {
      // The guest role may not carry `can_write on DashboardPermalinkRestApi`,
      // in which case every attempt 403s. Stop rather than retry on each
      // interaction: the dashboard keeps working, it just stops persisting.
      disableSync()
      // eslint-disable-next-line no-console
      console.warn('[superset] dashboard state persistence disabled', error)
    }
  }, debounceMs)

  const pollActiveTabs = async (): Promise<void> => {
    // A poll slower than the interval would otherwise overlap with the next
    // one, and two readings racing on a null baseline make the second look
    // like a user change.
    if (disabled || polling || document.hidden) return

    polling = true

    try {
      // The sdk types this `string[]`, but the value is an unvalidated
      // `postMessage` result: before the dashboard hydrates it can be
      // anything, including undefined.
      const tabs = await embedded.getActiveTabs()
      const activeTabs = Array.isArray(tabs) ? tabs.join(',') : null

      if (activeTabs === null) return

      if (knownActiveTabs === null) {
        // `embedDashboard` resolves on the iframe load event, before the
        // dashboard hydrates, so an empty reading is not a real baseline.
        // Accepting it would make the first hydrated reading look like a
        // user action and write a state key nobody asked for.
        if (!activeTabs) return

        // The first real reading is whatever hydration selected, not a user
        // action either.
        knownActiveTabs = activeTabs

        return
      }

      if (activeTabs === knownActiveTabs) return

      knownActiveTabs = activeTabs
      syncStateKey()
    } catch (error) {
      // Only the pull-only tab channel stops here. Filters keep persisting
      // through `observeDataMask`, which does not depend on this rpc.
      stopPolling()
      // eslint-disable-next-line no-console
      console.warn('[superset] dashboard tab tracking disabled', error)
    } finally {
      polling = false
    }
  }

  pollTimer = setInterval(pollActiveTabs, pollIntervalMs)

  embedded.observeDataMask(({ crossFiltersChanged, nativeFiltersChanged }) => {
    // Superset reports both as false for the initial hydration emission, so a
    // fresh load never writes a state key the user did not ask for.
    if (!crossFiltersChanged && !nativeFiltersChanged) return

    syncStateKey()
  })

  return disableSync
}
