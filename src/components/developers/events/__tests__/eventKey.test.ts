import {
  buildEventLink,
  EVENT_CODE_PARAM,
  EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM,
  EVENT_TIMESTAMP_MS_PARAM,
  EventKey,
  parseEventKeyFromUrl,
  serializeEventKey,
} from '../eventKey'

const EVENTS_PATH = '/devtool/events/'

const baseKey: EventKey = {
  transactionId: 'transaction-1',
  externalSubscriptionId: 'subscription-1',
  timestampMs: '1740000000123',
  code: 'api_calls',
}

// Mirrors the two steps React Router applies on the way out: `decodePath` decodes each
// pathname segment and re-escapes literal slashes, then `matchPath` substitutes those back
// into the splat param.
const parseLink = (link: string): EventKey => {
  const [pathname, search] = link.split('?')
  const decodedPathname = pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment).replace(/\//g, '%2F'))
    .join('/')
  const splat = decodedPathname.replace(EVENTS_PATH, '').replace(/%2F/g, '/')

  return parseEventKeyFromUrl(splat, new URLSearchParams(search))
}

describe('eventKey', () => {
  describe('GIVEN two event keys', () => {
    describe('WHEN the four fields are equal', () => {
      it('THEN should produce the same serialization', () => {
        expect(serializeEventKey({ ...baseKey })).toBe(serializeEventKey({ ...baseKey }))
      })

      it('THEN should treat null and undefined as the same absent value', () => {
        const withNulls: EventKey = {
          transactionId: 'transaction-1',
          externalSubscriptionId: null,
          timestampMs: null,
          code: null,
        }
        const withUndefined: EventKey = { transactionId: 'transaction-1' }

        expect(serializeEventKey(withNulls)).toBe(serializeEventKey(withUndefined))
      })
    })

    describe('WHEN a single field differs', () => {
      it.each([
        ['transactionId', { transactionId: 'transaction-2' }],
        ['externalSubscriptionId', { externalSubscriptionId: 'subscription-2' }],
        ['timestampMs', { timestampMs: '1740000000124' }],
        ['code', { code: 'storage' }],
      ])('THEN should produce a different serialization for %s', (_, override) => {
        expect(serializeEventKey({ ...baseKey, ...override })).not.toBe(serializeEventKey(baseKey))
      })

      it('THEN should distinguish an absent field from an empty string', () => {
        expect(serializeEventKey({ ...baseKey, externalSubscriptionId: null })).not.toBe(
          serializeEventKey({ ...baseKey, externalSubscriptionId: '' }),
        )
      })
    })

    describe('WHEN the values contain the characters used by the serialization', () => {
      it.each([
        ['a slash', 'transaction/1'],
        ['a lone dash, the marker used for an absent field', '-'],
        ['a colon', 'transaction:1'],
        ['a double quote', 'transaction"1'],
        ['a separator', 'transaction|1'],
        ['a percent sign', '50%off'],
      ])('THEN should still serialize %s distinctly', (_, value) => {
        expect(serializeEventKey({ ...baseKey, transactionId: value })).not.toBe(
          serializeEventKey(baseKey),
        )
      })

      it('THEN should not alias two tuples whose values are shifted across fields', () => {
        const shiftedLeft = serializeEventKey({
          ...baseKey,
          transactionId: 'a|b',
          externalSubscriptionId: 'c',
        })
        const shiftedRight = serializeEventKey({
          ...baseKey,
          transactionId: 'a',
          externalSubscriptionId: 'b|c',
        })

        expect(shiftedLeft).not.toBe(shiftedRight)
      })

      it('THEN should escape the characters that would break a data-id selector', () => {
        const serialized = serializeEventKey({ ...baseKey, transactionId: 'transaction"\\1' })

        expect(serialized).not.toContain('"')
        expect(serialized).not.toContain('\\')
      })
    })
  })

  describe('GIVEN an event key to link to', () => {
    describe('WHEN building the link', () => {
      it('THEN should keep the transactionId in the path', () => {
        const link = buildEventLink(baseKey)

        expect(link.split('?')[0]).toBe(`${EVENTS_PATH}transaction-1`)
      })

      it('THEN should percent-encode a transactionId containing a slash', () => {
        const link = buildEventLink({ ...baseKey, transactionId: 'transaction/1' })

        expect(link.split('?')[0]).toBe(`${EVENTS_PATH}transaction%2F1`)
      })

      it('THEN should percent-encode a transactionId containing a question mark', () => {
        const link = buildEventLink({ ...baseKey, transactionId: 'transaction?1' })

        expect(link.split('?')[0]).toBe(`${EVENTS_PATH}transaction%3F1`)
      })

      it('THEN should carry the three remaining key fields as search params', () => {
        const searchParams = new URLSearchParams(buildEventLink(baseKey).split('?')[1])

        expect(searchParams.get(EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM)).toBe('subscription-1')
        expect(searchParams.get(EVENT_TIMESTAMP_MS_PARAM)).toBe('1740000000123')
        expect(searchParams.get(EVENT_CODE_PARAM)).toBe('api_calls')
      })

      it('THEN should preserve search params that were already there', () => {
        const link = buildEventLink(baseKey, new URLSearchParams({ unrelated: 'kept' }))
        const searchParams = new URLSearchParams(link.split('?')[1])

        expect(searchParams.get('unrelated')).toBe('kept')
      })

      it('THEN should drop the params of the previously selected event when a field is absent', () => {
        const link = buildEventLink(
          { transactionId: 'transaction-1' },
          new URLSearchParams({
            [EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM]: 'stale-subscription',
            [EVENT_TIMESTAMP_MS_PARAM]: '1',
            [EVENT_CODE_PARAM]: 'stale_code',
          }),
        )
        const searchParams = new URLSearchParams(link.split('?')[1])

        expect(searchParams.get(EVENT_EXTERNAL_SUBSCRIPTION_ID_PARAM)).toBeNull()
        expect(searchParams.get(EVENT_TIMESTAMP_MS_PARAM)).toBeNull()
        expect(searchParams.get(EVENT_CODE_PARAM)).toBeNull()
      })

      it('THEN should return a bare path when no key field is set', () => {
        expect(buildEventLink({})).toBe('/devtool/events')
      })
    })
  })

  describe('GIVEN a link built from an event key', () => {
    describe('WHEN parsing it back', () => {
      it.each([
        ['a complete key', baseKey],
        ['a key with only a transactionId', { transactionId: 'transaction-1' }],
        [
          'a key whose values contain special characters',
          { ...baseKey, transactionId: 'transaction/1?x', externalSubscriptionId: 'sub&1=2' },
        ],
      ])('THEN should round-trip %s', (_, key) => {
        expect(serializeEventKey(parseLink(buildEventLink(key)))).toBe(serializeEventKey(key))
      })

      it('THEN should read every field back', () => {
        expect(parseLink(buildEventLink(baseKey))).toEqual(baseKey)
      })
    })

    describe('WHEN the url carries no key at all', () => {
      it('THEN should return an empty key', () => {
        expect(parseEventKeyFromUrl(undefined, new URLSearchParams())).toEqual({
          transactionId: null,
          externalSubscriptionId: null,
          timestampMs: null,
          code: null,
        })
      })
    })
  })
})
