import { ApolloClient, FetchResult, NormalizedCacheObject } from '@apollo/client'
import { parse } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

import { initializeApolloClient, setAuthErrorHandler } from '../init'

const mockPendingResponses: Array<(result: FetchResult) => void> = []

jest.mock('apollo-upload-client', () => {
  const { ApolloLink, Observable } = jest.requireActual('@apollo/client')

  return {
    createUploadLink: () =>
      new ApolloLink(
        () =>
          new Observable((observer: { next: (r: FetchResult) => void; complete: () => void }) => {
            mockPendingResponses.push((result) => {
              observer.next(result)
              observer.complete()
            })
          }),
      ),
  }
})

jest.mock('../cachePersistor', () => ({ setupCachePersistor: jest.fn().mockResolvedValue(null) }))
jest.mock('@sentry/react', () => ({ captureException: jest.fn(), captureMessage: jest.fn() }))

const PORTAL_PATH = '/customer-portal/portal-token-abc'
const ADMIN_PATH = '/acme/customers'

// Parsed from a string so codegen does not pick it up as an app operation.
const PING_QUERY = parse(`
  query AuthScopePing {
    ping
  }
`)

const UNAUTHORIZED: FetchResult = {
  errors: [
    Object.assign(new Error('Unauthorized'), {
      message: 'Unauthorized',
      extensions: { code: LagoApiError.Unauthorized },
    }),
  ],
} as unknown as FetchResult

const flushUntilRequestSent = async (): Promise<(result: FetchResult) => void> => {
  for (let attempt = 0; attempt < 20 && mockPendingResponses.length === 0; attempt++) {
    await Promise.resolve()
  }

  const respond = mockPendingResponses.shift()

  if (!respond) throw new Error('the operation never reached the terminating link')

  return respond
}

describe('auth error credential scope', () => {
  let client: ApolloClient<NormalizedCacheObject>
  let onAuthError: jest.Mock

  beforeEach(async () => {
    jest.clearAllMocks()
    mockPendingResponses.length = 0
    localStorage.clear()
    onAuthError = jest.fn()
    client = await initializeApolloClient()
    setAuthErrorHandler(onAuthError)
  })

  afterEach(() => {
    client.stop()
  })

  // The regression: `errorLink` read `window.location` when the response landed,
  // judging a request in flight by the context it arrived in.
  describe('GIVEN a request in flight while the tab crosses the admin/portal boundary', () => {
    it.each([
      {
        label: 'sent from admin, landing on the portal',
        from: ADMIN_PATH,
        to: PORTAL_PATH,
        logsOut: true,
      },
      {
        label: 'sent from the portal, landing on admin',
        from: PORTAL_PATH,
        to: ADMIN_PATH,
        logsOut: false,
      },
      { label: 'sent and landing on admin', from: ADMIN_PATH, to: ADMIN_PATH, logsOut: true },
      {
        label: 'sent and landing on the portal',
        from: PORTAL_PATH,
        to: PORTAL_PATH,
        logsOut: false,
      },
    ])(
      'WHEN it is $label THEN should log the admin out: $logsOut',
      async ({ from, to, logsOut }) => {
        window.history.pushState({}, '', from)

        const pending = client
          .query({ query: PING_QUERY, fetchPolicy: 'network-only' })
          .catch(() => undefined)
        const respond = await flushUntilRequestSent()

        window.history.pushState({}, '', to)
        respond(UNAUTHORIZED)
        await pending

        expect(onAuthError).toHaveBeenCalledTimes(logsOut ? 1 : 0)
      },
    )
  })
})
