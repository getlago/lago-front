/* eslint-disable no-console -- This suite verifies console forwarding and exact exceptions. */
import { runInNewContext } from 'node:vm'

describe('early Jest console diagnostics', () => {
  const originalWarn = console.warn
  const originalError = console.error
  let warn: jest.Mock
  let error: jest.Mock

  beforeEach(() => {
    warn = jest.fn()
    error = jest.fn()
    console.warn = warn
    console.error = error
    jest.isolateModules(() => {
      jest.requireActual('../../../jest-setup-early')
    })
  })

  afterEach(() => {
    console.warn = originalWarn
    console.error = originalError
  })

  describe.each(['warn', 'error'] as const)('console.%s', (method) => {
    it.each([
      ['An error occurred! https://go.apollo.dev/c/err#encoded-diagnostic'],
      ['No more mocked responses for the query: query Customer { customer { id } }'],
      ['Unknown query named %s requested in refetchQueries options.include array', 'Customer'],
      ['Missing field %s while writing result %o', 'id', { name: 'Customer' }],
      ['Cache data may be lost when replacing the customer field of a Query object'],
      ['Warning: fragment with name Customer already exists'],
      ['Warning: An update to %s inside a test was not wrapped in act(...)', 'Customer'],
      ['Warning: The current testing environment is not configured to support act(...)'],
      ['Warning: Function components cannot be given refs'],
      ['unrelated diagnostic', { detail: 'preserved' }],
      ['opaque diagnostic', Object.create(null)],
      [
        'opaque diagnostic',
        {
          toString: () => {
            throw new Error('opaque payload must not be converted')
          },
        },
      ],
    ])('forwards diagnostic arguments: %s', (...args) => {
      console[method](...args)

      expect(method === 'warn' ? warn : error).toHaveBeenCalledTimes(1)
      expect(method === 'warn' ? warn : error).toHaveBeenCalledWith(...args)
    })

    it.each([
      ['[%s]: %s is deprecated', 'MockedProvider', 'addTypename'],
      ['[%s]: %s is deprecated', 'InMemoryCache', 'addTypename'],
      ['[%s]: %s is deprecated', 'useLazyQuery', 'variables'],
      ['[%s]: %s is deprecated', 'cache.diff', 'canonizeResults'],
      ['[%s]: %s is deprecated', 'ApolloLink', 'onError'],
      ['React Router Future Flag Warning: v7_startTransition'],
      ['React Router Future Flag Warning: v7_relativeSplatPath'],
      [new Error('Not implemented: navigation (except hash changes)')],
      [runInNewContext('new Error("Not implemented: navigation (except hash changes)")')],
    ])('filters an identified environment or deprecation message: %s', (...args) => {
      console[method](...args)

      expect(method === 'warn' ? warn : error).not.toHaveBeenCalled()
    })
  })
})
