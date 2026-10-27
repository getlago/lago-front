import { AUTH_TOKEN_LS_KEY, authTokenVar } from '~/core/apolloClient/reactiveVars'

import { isCustomerPortalPath } from './authHeaders'

// `localStorage.clear()` reports a null key, and `storage` never fires in the tab
// that wrote, so the tab that logged out never re-enters here.
const isAuthTokenRemoved = (event: StorageEvent): boolean => {
  if (event.storageArea !== localStorage) return false

  return event.key === null || (event.key === AUTH_TOKEN_LS_KEY && !event.newValue)
}

export const listenToCrossTabLogOut = (onCrossTabLogOut: () => void): (() => void) => {
  const handler = (event: StorageEvent): void => {
    if (!isAuthTokenRemoved(event)) return
    // Same rule as the error link: the portal is token-scoped and never holds an
    // admin session, so an admin logout elsewhere must not tear its cache down.
    if (isCustomerPortalPath(window.location.pathname)) return
    if (!authTokenVar()) return

    // A token stored again before this event is handled may belong to another
    // account, so the teardown runs regardless. `logOutFromOtherTab` leaves
    // localStorage untouched, which is what keeps that newer session alive.
    onCrossTabLogOut()
  }

  window.addEventListener('storage', handler)

  return (): void => window.removeEventListener('storage', handler)
}
