/**
 * This file defines every types and utils related to the locationHistoryVar (reactive variable)
 * React-router doesn't explicitly give access to the history, not allowing to have fallbacks in case of no previous routes.
 * This var exists to address this problem by allowing to have access to the previous routes.
 */
import { Location } from 'react-router-dom'
import { makeVar, ReactiveVar } from '@apollo/client'

const MAX_HISTORY_KEPT = 5

/** ----------------- VAR ----------------- */
export const locationHistoryVar = makeVar([]) as unknown as ReactiveVar<Location[]>

/** ----------------- UTILS ----------------- */
export const addLocationToHistory = (location: Location) => {
  const current = locationHistoryVar()

  if (location.pathname !== (current || [])[0]?.pathname) {
    locationHistoryVar([location, ...current].slice(0, MAX_HISTORY_KEPT))
  }
}

export const resetLocationHistoryVar = () => {
  locationHistoryVar([])
}
