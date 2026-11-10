import {
  ApolloClient,
  ApolloLink,
  NormalizedCacheObject,
  Observable,
  Operation,
} from '@apollo/client'
import { parse } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

import { initializeApolloClient, setAuthErrorHandler } from '../init'

const mockOnAuthError = jest.fn()

let mockTerminatingLink: ApolloLink

jest.mock('apollo-upload-client', () => ({
  createUploadLink: () =>
    new (jest.requireActual('@apollo/client').ApolloLink)((operation: Operation) =>
      mockTerminatingLink.request(operation),
    ),
}))

jest.mock('../cachePersistor', () => ({ setupCachePersistor: jest.fn() }))

jest.mock('../cableConsumer', () => ({
  CableSubscriptionError: class CableSubscriptionError extends Error {},
  createCableLink: () => jest.requireActual('@apollo/client').ApolloLink.empty(),
  refreshCableConsumer: jest.fn(),
}))

jest.mock('../reactiveVars', () => ({
  ...jest.requireActual('../reactiveVars'),
  addToast: jest.fn(),
}))

// Parsed from a string so codegen does not pick it up as an app operation.
const SCOPED_QUERY = parse(`
  query ScopedOperation {
    scoped
  }
`)

const ADMIN_PATH = '/acme/customers'
const PORTAL_PATH = '/customer-portal/portal-token-abc'

type Deferred = { resolve: () => void }

// Holds the response until the test has moved the URL, so the operation really is
// in flight across the transition instead of resolving in the scope it left.
const respondWhenReleased = (): Deferred => {
  let release: () => void = () => undefined

  const released = new Promise<void>((resolve) => {
    release = resolve
  })

  mockTerminatingLink = new ApolloLink(
    () =>
      new Observable((observer) => {
        released.then(() => {
          observer.next({
            data: null,
            errors: [
              {
                message: 'Unauthorized',
                extensions: { code: LagoApiError.Unauthorized },
              },
            ],
          })
          observer.complete()
        })
      }),
  )

  return { resolve: release }
}

describe('auth error credential scope', () => {
  let client: ApolloClient<NormalizedCacheObject>

  beforeEach(async () => {
    jest.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('authToken', 'admin-jwt')
    client = await initializeApolloClient()
    setAuthErrorHandler(mockOnAuthError)
  })

  afterEach(() => {
    client.stop()
  })

  const queryFromPath = async (requestPath: string, responsePath: string): Promise<void> => {
    const deferred = respondWhenReleased()

    window.history.pushState({}, '', requestPath)

    const pending = client
      .query({ query: SCOPED_QUERY, fetchPolicy: 'network-only' })
      .catch(() => undefined)

    window.history.pushState({}, '', responsePath)
    deferred.resolve()

    await pending
  }

  describe('GIVEN an admin request is in flight', () => {
    describe('WHEN its auth error arrives after the tab moved to the customer portal', () => {
      // Regression: the error link used to read the URL at response time, so an
      // expired admin session was silently kept alive by the transition.
      it('THEN should still log the admin out', async () => {
        await queryFromPath(ADMIN_PATH, PORTAL_PATH)

        expect(mockOnAuthError).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a customer-portal request is in flight', () => {
    describe('WHEN its auth error arrives after the tab moved back to admin', () => {
      // Regression: a portal token rejection used to tear down the admin session.
      it('THEN should not log the admin out', async () => {
        await queryFromPath(PORTAL_PATH, ADMIN_PATH)

        expect(mockOnAuthError).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a request that never crosses a context', () => {
    it.each([
      ['an admin request stays on admin', ADMIN_PATH, true],
      ['a portal request stays on the portal', PORTAL_PATH, false],
    ])('WHEN %s THEN should keep the existing behaviour', async (_, path, logsOut) => {
      await queryFromPath(path, path)

      expect(mockOnAuthError).toHaveBeenCalledTimes(logsOut ? 1 : 0)
    })
  })
})
