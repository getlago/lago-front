import { captureException, type ErrorEvent as SentryErrorEvent } from '@sentry/react'

import { envGlobalVar } from '~/core/apolloClient/reactiveVars/envGlobalVar'
import { reloadWithCacheBust } from '~/core/utils/reloadWithCacheBust'
import {
  hasReloadedRecently,
  markReloaded,
  showPersistentToast,
} from '~/core/utils/staleAssetRecovery'

const WORKER_IMPORT_SCRIPTS_FAILURE = /Failed to execute 'importScripts' on 'WorkerGlobalScope'/
const WORKER_LOAD_FINGERPRINT = 'worker-load-failure'
// A single failure could be a transient network blip, not a stale deploy -
// only reload once it repeats.
const WORKER_LOAD_RELOAD_THRESHOLD = 2

export function createWorkerLoadErrorHandler(): (event: ErrorEvent) => void {
  let workerLoadFailureCount = 0

  return (event: ErrorEvent): void => {
    if (!WORKER_IMPORT_SCRIPTS_FAILURE.test(event.message)) return

    workerLoadFailureCount += 1

    if (workerLoadFailureCount < WORKER_LOAD_RELOAD_THRESHOLD) return

    if (hasReloadedRecently()) {
      captureException(event.error ?? new Error(event.message), {
        tags: { workerLoad: true, phase: 'dead-end' },
        extra: { href: window.location.href, appVersion: envGlobalVar().appVersion },
        fingerprint: [WORKER_LOAD_FINGERPRINT],
      })
      showPersistentToast()

      return
    }

    markReloaded()
    reloadWithCacheBust()
  }
}

// Sentry's global `onerror` handler reports the raw worker failure before this
// recovery runs, so drop it unless it is our tagged dead-end report.
export function dropRecoverableWorkerLoadEvent(event: SentryErrorEvent): SentryErrorEvent | null {
  if (event.tags?.workerLoad) return event

  const isWorkerLoadFailure = !!event.exception?.values?.some(
    (exception) => !!exception.value && WORKER_IMPORT_SCRIPTS_FAILURE.test(exception.value),
  )

  return isWorkerLoadFailure ? null : event
}
