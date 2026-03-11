import { ReactNode, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useGlobalHeaderReader } from './GlobalHeaderContext'
import { GlobalHeaderTab } from './types'
import { isTabActive } from './utils'

/**
 * Hook to resolve the active tab's content from the GlobalHeader config.
 * Matches the current URL against each tab's link/match patterns.
 * Returns the content of the first matching tab, or null.
 *
 * Safe to use in pages that also mount <GlobalHeader.Configure> because
 * Configure only calls setConfig when its serializable fingerprint changes,
 * preventing the re-render loop structurally. No useMemo required from pages.
 */
export const useGlobalHeaderTabContent = (): ReactNode | null => {
  const { config } = useGlobalHeaderReader()
  const { pathname } = useLocation()

  return useMemo(() => {
    if (!config?.tabs) return null

    const activeTab = config.tabs.find((tab: GlobalHeaderTab) => isTabActive(tab, pathname))

    return activeTab?.content ?? null
  }, [config?.tabs, pathname])
}
