import { DefaultContext, gql, Operation } from '@apollo/client'
import { ErrorResponse } from '@apollo/client/link/error'
import { captureException } from '@sentry/react'
import { GraphQLFormattedError } from 'graphql'

import { addToast } from '~/core/apolloClient/reactiveVars'
import { LagoApiError } from '~/generated/graphql'

import { initializeApolloClient } from '../init'

type ErrorHandler = (response: ErrorResponse) => void

const mockErrorHandler: { current: ErrorHandler | null } = { current: null }

jest.mock('@apollo/client/link/error', () => {
  const { ApolloLink } = jest.requireActual('@apollo/client')

  return {
    onError: (handler: ErrorHandler) => {
      mockErrorHandler.current = handler

      return new ApolloLink()
    },
  }
})

jest.mock('~/core/apolloClient/reactiveVars', () => ({
  ...jest.requireActual('~/core/apolloClient/reactiveVars'),
  addToast: jest.fn(),
}))

jest.mock('../cachePersistor', () => ({
  setupCachePersistor: jest.fn(),
}))

jest.mock('../cableConsumer', () => {
  const { ApolloLink } = jest.requireActual('@apollo/client')

  return {
    CableSubscriptionError: class CableSubscriptionError extends Error {},
    createCableLink: () => new ApolloLink(),
    refreshCableConsumer: jest.fn(),
  }
})

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

const SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE = 'sandbox_managed_by_production'

const QUERY = gql`
  mutation updateSomething {
    updateSomething
  }
`

const buildOperation = (context: DefaultContext = {}): Operation =>
  ({
    query: QUERY,
    operationName: 'updateSomething',
    variables: {},
    getContext: () => context,
  }) as unknown as Operation

const triggerGraphQLError = (code: string, context?: DefaultContext): void => {
  const graphQLErrors: GraphQLFormattedError[] = [{ message: 'Error', extensions: { code } }]

  mockErrorHandler.current?.({
    graphQLErrors,
    operation: buildOperation(context),
    forward: jest.fn(),
  } as unknown as ErrorResponse)
}

const getLastToastTranslateKey = (): string | undefined =>
  (jest.mocked(addToast).mock.lastCall?.[0] as { translateKey?: string } | undefined)?.translateKey

describe('initializeApolloClient error link', () => {
  beforeAll(async () => {
    await initializeApolloClient()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN the client is initialized', () => {
    it('THEN should register an error handler', () => {
      expect(mockErrorHandler.current).toEqual(expect.any(Function))
    })
  })

  describe('GIVEN a GraphQL error with the sandbox managed by production code', () => {
    describe('WHEN the operation does not silence it', () => {
      it('THEN should show a single danger toast', () => {
        triggerGraphQLError(SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE)

        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })

      it('THEN should not report the error to Sentry', () => {
        triggerGraphQLError(SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE)

        expect(captureException).not.toHaveBeenCalled()
      })

      it('THEN should use a dedicated message instead of the generic error toast', () => {
        triggerGraphQLError(LagoApiError.InternalError)

        const genericTranslateKey = getLastToastTranslateKey()

        jest.mocked(addToast).mockClear()
        triggerGraphQLError(SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE)

        expect(addToast).toHaveBeenCalledTimes(1)

        const sandboxTranslateKey = getLastToastTranslateKey()

        expect(sandboxTranslateKey).toEqual(expect.any(String))
        expect(sandboxTranslateKey).not.toBe(genericTranslateKey)
      })
    })

    describe('WHEN the operation sets silentError', () => {
      it('THEN should neither toast nor report the error', () => {
        triggerGraphQLError(SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE, { silentError: true })

        expect(addToast).not.toHaveBeenCalled()
        expect(captureException).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the operation lists the code in silentErrorCodes', () => {
      it('THEN should neither toast nor report the error', () => {
        triggerGraphQLError(SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE, {
          silentErrorCodes: [SANDBOX_MANAGED_BY_PRODUCTION_ERROR_CODE as LagoApiError],
        })

        expect(addToast).not.toHaveBeenCalled()
        expect(captureException).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a GraphQL error with another code', () => {
    describe('WHEN the operation does not silence it', () => {
      it('THEN should report the error to Sentry and show the generic danger toast', () => {
        triggerGraphQLError(LagoApiError.InternalError)

        expect(captureException).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      })
    })
  })
})
