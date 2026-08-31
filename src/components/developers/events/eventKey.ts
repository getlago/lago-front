import { generatePath } from 'react-router-dom'

import { EVENT_LOG_ROUTE } from '~/components/developers/devtoolsRoutes'

export const EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM = 'externalSubscriptionId'
export const EVENT_TIMESTAMP_MS_PARAM = 'timestampMs'
export const EVENT_CODE_PARAM = 'code'

/**
 * The four fields that identify one event.
 *
 * `transactionId` alone is not an identity: it is unique only within a subscription on
 * Postgres and not constrained at all on Clickhouse, where `events_raw` is a plain
 * MergeTree. `Event.id` is no better — Clickhouse synthesizes it as
 * `"#{organization_id}-#{external_subscription_id}-#{transaction_id}-#{ingested_at.to_i}"`,
 * so it truncates to whole seconds and carries no `code`. `code` matters because the
 * aggregation stores run once per billable metric and bill those rows separately.
 *
 * All four are nullable here because that is what the callers hold: three come from
 * `URLSearchParams.get`, which returns `string | null`, and `transactionId` and
 * `externalSubscriptionId` are nullable in the schema too. (`code` is not — it is nullable here
 * only because of the URL round trip.)
 */
export type EventKey = {
  transactionId?: string | null
  externalSubscriptionId?: string | null
  /**
   * `timestampMs` is a GraphQL `BigInt`: it arrives as a string and must be passed back
   * untouched. Parsing it into a JS number is what loses the millisecond precision that
   * makes the key an identity in the first place.
   */
  timestampMs?: string | null
  code?: string | null
}

const SEGMENT_SEPARATOR = '|'
const NULLISH_SEGMENT = '-'
const VALUE_SEGMENT_PREFIX = '.'

/**
 * Encodes one field so that no two distinct tuples can produce the same serialization:
 * the leading marker separates "absent" from "present", `encodeURIComponent` escapes the
 * separator (`|` -> `%7C`) so splitting stays unambiguous, and it also escapes `"` and
 * `\`, which matters because the result ends up in a `data-id` attribute read back with
 * `querySelector('tr[data-id="…"]')`.
 */
const serializeSegment = (value?: string | null): string => {
  if (value === null || value === undefined) return NULLISH_SEGMENT

  return `${VALUE_SEGMENT_PREFIX}${encodeURIComponent(value)}`
}

export const serializeEventKey = (key: EventKey): string =>
  [key.transactionId, key.externalSubscriptionId, key.timestampMs, key.code]
    .map(serializeSegment)
    .join(SEGMENT_SEPARATOR)

const setOrDeleteParam = (
  searchParams: URLSearchParams,
  name: string,
  value?: string | null,
): void => {
  if (value === null || value === undefined) {
    // Dropping the param is what makes switching from an event that has the field to one
    // that does not produce the right key instead of inheriting the previous selection's.
    searchParams.delete(name)

    return
  }

  searchParams.set(name, value)
}

/**
 * Builds the link to one event: `transactionId` stays in the `*` catchall of
 * `EVENT_LOG_ROUTE`, the three remaining key fields ride along as search params.
 *
 * The catchall can only absorb one value, and every field may contain a `/`. The
 * `transactionId` is percent-encoded because `generatePath` interpolates the splat raw:
 * an unencoded `?` or `#` would otherwise truncate the path and swallow the key params.
 * React Router decodes it back on the way out, so `useParams()['*']` reads the original —
 * verified for `/ ? # % space | " \`. Known limitation: the router substitutes `%2F` back to
 * `/` after decoding, so a `transactionId` containing that literal sequence arrives as a
 * slash. No known ingestion produces one.
 */
export const buildEventLink = (key: EventKey, currentSearchParams?: URLSearchParams): string => {
  const searchParams = new URLSearchParams(currentSearchParams)

  setOrDeleteParam(searchParams, EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM, key.externalSubscriptionId)
  setOrDeleteParam(searchParams, EVENT_TIMESTAMP_MS_PARAM, key.timestampMs)
  setOrDeleteParam(searchParams, EVENT_CODE_PARAM, key.code)

  const pathname = generatePath(EVENT_LOG_ROUTE, {
    '*': key.transactionId ? encodeURIComponent(key.transactionId) : '',
  })
  const search = searchParams.toString()

  return search ? `${pathname}?${search}` : pathname
}

export const parseEventKeyFromUrl = (
  transactionId: string | undefined,
  searchParams: URLSearchParams,
): EventKey => ({
  transactionId: transactionId || null,
  externalSubscriptionId: searchParams.get(EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM),
  timestampMs: searchParams.get(EVENT_TIMESTAMP_MS_PARAM),
  code: searchParams.get(EVENT_CODE_PARAM),
})
