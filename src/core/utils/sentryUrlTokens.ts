import type { addIntegration } from '@sentry/react'

// `@sentry/react` does not re-export the `Integration` type
type Integration = Parameters<typeof addIntegration>[0]

const FILTERED = '[Filtered]'

// Prefixes of `RESET_PASSWORD_ROUTE`, `INVITATION_ROUTE` and `CUSTOMER_PORTAL_ROUTE`
const TOKEN_PATH_SEGMENT = /(\/(?:reset-password|invitation|customer-portal)\/)[^/?#\s]+/g

// OAuth `state` embeds the invitation token; `okta*`/`entraId*` are the SSO callback's copies of it
const TOKEN_QUERY_PARAM =
  /([?&#](?:token|code|state|oktaCode|oktaState|entraIdCode|entraIdState)=)[^&#\s]+/g

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) return false

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

const scrubString = (value: string): string =>
  value.replace(TOKEN_PATH_SEGMENT, `$1${FILTERED}`).replace(TOKEN_QUERY_PARAM, `$1${FILTERED}`)

// Copy-on-write: Sentry still holds some of these objects (e.g. rrweb's node mirror),
// so they must never be mutated
const scrubValue = (value: unknown, scrubbedByOriginal: WeakMap<object, unknown>): unknown => {
  if (typeof value === 'string') return scrubString(value)

  if (!Array.isArray(value) && !isPlainObject(value)) return value

  if (scrubbedByOriginal.has(value)) return scrubbedByOriginal.get(value)

  const scrubbed: unknown[] | Record<string, unknown> = Array.isArray(value) ? [] : {}
  let hasChanged = false

  // Registered before it is filled, so shared and circular references resolve to this copy
  scrubbedByOriginal.set(value, scrubbed)

  for (const [key, item] of Object.entries(value)) {
    const scrubbedItem = scrubValue(item, scrubbedByOriginal)

    Reflect.set(scrubbed, key, scrubbedItem)

    if (scrubbedItem !== item) hasChanged = true
  }

  if (hasChanged) return scrubbed

  scrubbedByOriginal.set(value, value)

  return value
}

export const scrubUrlTokens = <T>(value: T): T => scrubValue(value, new WeakMap()) as T

export const hasUrlToken = (url: string): boolean => scrubString(url) !== url

// Replay events skip `beforeSend*`; errors and transactions are scrubbed there, once normalized
export const scrubReplayEventUrlTokensIntegration = (): Integration => ({
  name: 'ScrubReplayEventUrlTokens',
  processEvent: (event) => (event.type === 'replay_event' ? scrubUrlTokens(event) : event),
})
