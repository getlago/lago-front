/**
 * Generic localStorage helpers — not Apollo-specific. Kept as a leaf module
 * (zero imports) so reactive vars can use them at module-init time without
 * forming a `cacheUtils ↔ reactiveVars` import cycle through the Apollo
 * module graph.
 *
 * This file MUST NOT import from `@apollo/client`, `~/core/apolloClient`,
 * or anything that transitively pulls them in. That invariant is what makes
 * it safe to import from any reactive var.
 *
 * Every storage access is wrapped: `localStorage` itself throws in Safari
 * private mode, with "block all cookies" enabled, and in sandboxed iframes.
 * The module-init callers (`authTokenVar`, `customerPortalTokenVar`,
 * `duplicatePlanVar`, `internationalizationVar`) run during import evaluation,
 * before React mounts — an escaping error there is a blank page with no error
 * boundary and no Sentry event, so these helpers degrade silently instead.
 */
export const getItemFromLS = (key: string) => {
  if (typeof window === 'undefined') return ''

  let data: string | null

  try {
    data = localStorage.getItem(key)
  } catch {
    return undefined
  }

  // Keys poisoned by an older version that persisted the string "undefined"
  // still exist in users' browsers and must keep reading back as `undefined`.
  if (data === 'undefined') return undefined

  try {
    return !!data ? JSON.parse(data) : data
  } catch {
    return data
  }
}

export const removeItemFromLS = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage unavailable — nothing to remove, nothing to report.
  }
}

export const setItemFromLS = (key: string, value: unknown): void => {
  // `JSON.stringify(undefined)` returns the *value* `undefined`, which
  // `Storage.setItem` coerces to the string "undefined" through its WebIDL
  // `DOMString` argument. Removing the key is the only correct persistence of
  // a nullish value.
  if (value === undefined || value === null) return removeItemFromLS(key)

  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    // Storage unavailable or quota exceeded — the value stays in memory only.
  }
}
