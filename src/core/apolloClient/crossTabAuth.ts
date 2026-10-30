import { ApolloClient } from '@apollo/client'

import { isCustomerPortalPath } from '~/core/router/utils/isCustomerPortalPath'

import { resumePersistence } from './cachePersistor'
import { clearLocalSession } from './cacheUtils'
import {
  AUTH_TOKEN_LS_KEY,
  authTokenVar,
  getStoredAuthToken,
  resetLocationHistoryVar,
} from './reactiveVars'

const getTokenSubject = (token: string | undefined): string | undefined => {
  const payload = token?.split('.')[1]

  if (!payload) return undefined

  try {
    const { sub } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))

    return typeof sub === 'string' ? sub : undefined
  } catch {
    return undefined
  }
}

// `AuthenticableUser#renew_token` rotates the token during its last hour: a new
// token for the same user is still the same session and must not tear it down.
const isSameUser = (sessionToken: string | undefined, storedToken: string | undefined): boolean => {
  const subject = getTokenSubject(sessionToken)

  return !!subject && subject === getTokenSubject(storedToken)
}

let inFlight: Promise<void> | null = null

export const reconcileSession = (client: ApolloClient<object>): Promise<void> => {
  if (inFlight) return inFlight

  const storedToken = getStoredAuthToken()
  const sessionToken = authTokenVar() || undefined

  if (storedToken === sessionToken) return Promise.resolve()

  // The portal is token-scoped and never holds an admin session: sync the
  // variable for the route guard, but never tear its cache down.
  if (isCustomerPortalPath(window.location.pathname) || isSameUser(sessionToken, storedToken)) {
    authTokenVar(storedToken)

    return Promise.resolve()
  }

  inFlight = clearLocalSession(client)
    .then(() => {
      const latestToken = getStoredAuthToken()

      if (latestToken) resumePersistence()
      authTokenVar(latestToken)
      resetLocationHistoryVar()
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}

// `localStorage.clear()` reports a null key, and `storage` never fires in the
// tab that wrote.
const isAuthTokenChange = (event: StorageEvent): boolean =>
  event.storageArea === localStorage && (event.key === null || event.key === AUTH_TOKEN_LS_KEY)

export const listenToSessionChanges = (onChange: () => void): (() => void) => {
  const handleStorage = (event: StorageEvent): void => {
    if (isAuthTokenChange(event)) onChange()
  }
  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') onChange()
  }
  const handlePageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) onChange()
  }

  window.addEventListener('storage', handleStorage)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pageshow', handlePageShow)

  return (): void => {
    window.removeEventListener('storage', handleStorage)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pageshow', handlePageShow)
  }
}
