/**
 * This file defines every types and utils related to the locationHistoryVar (reactive variable)
 * React-router doesn't explicitly give access to the history, not allowing to have fallbacks in case of no previous routes.
 * This var exists to address this problem by allowing to have access to the previous routes.
 */
import { makeVar } from '@apollo/client'
import { Location } from 'react-router-dom'

const MAX_HISTORY_KEPT = 10

export const locationHistoryVar = makeVar<Location[]>([])

export const addLocationToHistory = (location: Location) => {
  const current = locationHistoryVar()
  const currentPathname = (current || [])[0]?.pathname
  const currentSearchParams = (current || [])[0]?.search

  if (location.pathname !== currentPathname || location.search !== currentSearchParams) {
    locationHistoryVar([location, ...current].slice(0, MAX_HISTORY_KEPT))
  }
}

export const resetLocationHistoryVar = () => {
  locationHistoryVar([])
}
