import { useCallback, useEffect, useRef, useState } from 'react'

import { useLocation } from '~/core/router'

import { fetchDeployedBuildId, getRunningBuildId } from './buildId'

// Safety net for a tab left on one page. Focus and navigation catch most deploys sooner.
export const CHECK_INTERVAL_MS = 10 * 60 * 1000
// Focus, tab switches and navigation can fire in bursts: one request per minute is enough.
export const MIN_CHECK_GAP_MS = 60 * 1000

type NewVersionCheck = {
  isNewVersionAvailable: boolean
  dismiss: () => void
}

export const useNewVersionCheck = (): NewVersionCheck => {
  // Read once: the build a tab runs never changes until it reloads.
  const [runningBuildId] = useState(getRunningBuildId)
  const [availableBuildId, setAvailableBuildId] = useState<string | null>(null)
  // Every build the user closed the toast for: during a rolling update, answers can alternate
  // between two of them, and neither may bring the toast back.
  const dismissedBuildIdsRef = useRef(new Set<string>())
  // The page was just loaded, so the first check can wait for the next trigger.
  const lastCheckAtRef = useRef(Date.now())
  const isCheckingRef = useRef(false)
  const { pathname } = useLocation()

  const check = useCallback(async () => {
    if (!runningBuildId || isCheckingRef.current) return
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return

    isCheckingRef.current = true
    lastCheckAtRef.current = Date.now()

    try {
      const deployedBuildId = await fetchDeployedBuildId()

      // Never cleared by an answer: during a rolling update, requests can still reach a pod
      // serving the old build, and the toast must not flicker.
      if (
        deployedBuildId &&
        deployedBuildId !== runningBuildId &&
        !dismissedBuildIdsRef.current.has(deployedBuildId)
      ) {
        setAvailableBuildId(deployedBuildId)
      }
    } finally {
      isCheckingRef.current = false
    }
  }, [runningBuildId])

  useEffect(() => {
    if (!runningBuildId) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }
    const onFocus = () => void check()
    const interval = setInterval(() => void check(), CHECK_INTERVAL_MS)

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [runningBuildId, check])

  useEffect(() => {
    void check()
  }, [pathname, check])

  // A dismissed build stays quiet. A later deploy shows the toast again.
  const dismiss = useCallback(() => {
    if (availableBuildId) dismissedBuildIdsRef.current.add(availableBuildId)
    setAvailableBuildId(null)
  }, [availableBuildId])

  return { isNewVersionAvailable: !!availableBuildId, dismiss }
}
