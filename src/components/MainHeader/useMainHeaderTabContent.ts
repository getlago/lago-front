import { ReactNode, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { useMainHeaderReader } from './MainHeaderContext'
import { MainHeaderTab } from './types'
import { isTabActive } from './utils'

/**
 * Hook to resolve the active tab's content from the MainHeader config.
 * Matches the current URL against each tab's link/match patterns.
 * Returns the content of the first matching tab, or null.
 *
 * Safe to use in pages that also mount <MainHeader.Configure> because
 * Configure only calls setConfig when its serializable fingerprint changes,
 * preventing the re-render loop structurally. No useMemo required from pages.
 */
export const useMainHeaderTabContent = (): ReactNode | null => {
  const { config } = useMainHeaderReader()
  const { pathname } = useLocation()

  return useMemo(() => {
    if (!config?.tabs) return null

    const activeTab = config.tabs.find((tab: MainHeaderTab) => isTabActive(tab, pathname))

    return activeTab?.content ?? null
  }, [config?.tabs, pathname])
}
