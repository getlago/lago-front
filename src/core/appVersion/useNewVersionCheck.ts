import { useCallback, useEffect, useRef, useState } from 'react'

import { useLocation } from '~/core/router'

import { fetchDeployedBuild, getRunningBuild } from './buildId'

// Safety net for a tab left on one page. Focus and navigation catch most deploys sooner.
export const CHECK_INTERVAL_MS = 10 * 60 * 1000
// Focus, tab switches and navigation can fire in bursts: one request per minute is enough.
export const MIN_CHECK_GAP_MS = 60 * 1000
// An older build still served this long after first seen is a rollback, not an old pod
// finishing a rollout: a front rollout replaces every pod well within it.
export const ROLLBACK_CONFIRM_MS = 10 * 60 * 1000

type NewVersionCheck = {
  isNewVersionAvailable: boolean
  dismiss: () => void
}

type OlderSighting = { id: string; firstSeenAt: number }

export const useNewVersionCheck = (): NewVersionCheck => {
  // Read once: the build a tab runs never changes until it reloads.
  const [runningBuild] = useState(getRunningBuild)
  const [availableBuildId, setAvailableBuildId] = useState<string | null>(null)
  // Every build the user closed the toast for: during a rolling update, answers can alternate
  // between two of them, and neither may bring the toast back.
  const dismissedBuildIdsRef = useRef(new Set<string>())
  const olderSightingRef = useRef<OlderSighting | null>(null)
  // The page was just served, so the first check can wait for the next trigger.
  const lastCheckAtRef = useRef(Date.now())
  const isCheckingRef = useRef(false)
  const { pathname } = useLocation()

  const check = useCallback(async () => {
    if (!runningBuild || isCheckingRef.current) return
    if (document.visibilityState !== 'visible') return
    if (Date.now() - lastCheckAtRef.current < MIN_CHECK_GAP_MS) return

    isCheckingRef.current = true
    lastCheckAtRef.current = Date.now()

    try {
      const deployed = await fetchDeployedBuild()

      if (!deployed) return

      if (deployed.id === runningBuild.id) {
        olderSightingRef.current = null

        return
      }

      if (dismissedBuildIdsRef.current.has(deployed.id)) return

      // Never cleared by an answer: during a rolling update, requests can still reach a pod
      // serving the old build, and the toast must not flicker.
      if (deployed.builtAt > runningBuild.builtAt) {
        setAvailableBuildId(deployed.id)

        return
      }

      const sighting = olderSightingRef.current

      if (sighting?.id !== deployed.id) {
        olderSightingRef.current = { id: deployed.id, firstSeenAt: Date.now() }
      } else if (Date.now() - sighting.firstSeenAt >= ROLLBACK_CONFIRM_MS) {
        setAvailableBuildId(deployed.id)
      }
    } finally {
      isCheckingRef.current = false
    }
  }, [runningBuild])

  useEffect(() => {
    if (!runningBuild) return

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
  }, [runningBuild, check])

  useEffect(() => {
    void check()
  }, [pathname, check])

  const dismiss = useCallback(() => {
    if (availableBuildId) dismissedBuildIdsRef.current.add(availableBuildId)
    setAvailableBuildId(null)
  }, [availableBuildId])

  return { isNewVersionAvailable: !!availableBuildId, dismiss }
}
