import { NormalizedCacheObject } from '@apollo/client'
import { CachePersistor, LocalForageWrapper } from 'apollo3-cache-persist'
import localForage from 'localforage'

import { isCustomerPortalPath } from '~/core/router/utils/isCustomerPortalPath'

import { cache } from './cache'

const KEY_PREFIX = 'apollo-cache-persist-lago-'

let persistor: CachePersistor<NormalizedCacheObject> | null = null
let persistenceKey: string | undefined
let persistencePaused = false

const createPersistor = (key: string): CachePersistor<NormalizedCacheObject> =>
  new CachePersistor({ cache, storage: new LocalForageWrapper(localForage), key })

// storage.purge() only removes the current key. Blobs left by previous app
// versions (different version suffix) must be cleaned manually so old deploys
// don't leave org data at rest forever. Best-effort — never block boot on it.
const purgeStaleVersionedCaches = async (currentKey: string) => {
  try {
    const keys = await localForage.keys()

    await Promise.all(
      keys
        .filter((key) => key.startsWith(KEY_PREFIX) && key !== currentKey)
        .map((key) => localForage.removeItem(key)),
    )
  } catch {
    // ignore — stale-cache cleanup must never prevent the app from starting
  }
}

// Called once at client init. In customer-portal context we skip persistence
// entirely: the portal is public, token-scoped and single-customer, and must
// never restore the shared admin blob into memory nor write into it. The
// in-memory cache still works normally for the portal session.
export const setupCachePersistor = async (appVersion: string) => {
  if (isCustomerPortalPath(window.location.pathname)) {
    return null
  }

  const currentKey = `${KEY_PREFIX}${appVersion}`

  await purgeStaleVersionedCaches(currentKey)

  persistenceKey = currentKey
  persistencePaused = false
  persistor = createPersistor(currentKey)

  // The constructor does not restore (unlike the persistCache helper), so we
  // restore explicitly.
  await persistor.restore()

  return persistor
}

// Wipe the persisted blob from IndexedDB. No-op if setup was skipped (portal).
export const purgePersistedCache = async () => {
  await persistor?.purge()
}

// Stop persisting without deleting the blob. Used when a portal is entered via
// same-tab client-side navigation (persistor already live with the admin key):
// prevents portal data from leaking into the admin blob while leaving that blob
// intact.
export const pausePersistence = (): void => {
  // remove() keeps the old trigger's pending debounce paused even after persistence resumes.
  persistor?.remove()
  persistencePaused = true
}

export const resumePersistence = (): void => {
  if (!persistencePaused || !persistenceKey || isCustomerPortalPath(window.location.pathname))
    return

  persistor = createPersistor(persistenceKey)
  persistencePaused = false
}
