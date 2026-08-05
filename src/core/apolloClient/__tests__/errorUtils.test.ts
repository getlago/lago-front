import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import {
  extractThirdPartyErrorMessage,
  hasDefinedGQLError,
  isSilencedGQLError,
  LagoGQLError,
  PspErrorCode,
} from '~/core/apolloClient/errorUtils'

const createApolloError: (details: Record<string, string | string[]>) => ApolloError = (details) =>
  ({
    graphQLErrors: [
      {
        message: 'Unprocessable Entity',
        locations: [
          {
            line: 2,
            column: 3,
          },
        ],
        path: ['loginUser'],
        extensions: {
          status: 422,
          code: 'unprocessable_entity',
          details,
        },
      },
    ],
  }) as unknown as ApolloError

const createGraphQLError: (
  details: Record<string, string | string[]>,
) => GraphQLFormattedError[] = (details) =>
  [
    {
      message: 'Unprocessable Entity',
      locations: [
        {
          line: 2,
          column: 3,
        },
      ],
      path: ['loginUser'],
      extensions: {
        status: 422,
        code: 'unprocessable_entity',
        details,
      },
    },
  ] as unknown as LagoGQLError[]

describe('Test apollo utils', () => {
  describe('hasDefinedGQLError for ApolloError', () => {
    it('should return false if no error specified', () => {
      expect(hasDefinedGQLError('Forbidden')).toBeFalsy()
    })

    it('should return true if the error with the specified key is present', () => {
      const emailError = createApolloError({ email: ['user_already_exists'] })

      expect(hasDefinedGQLError('UserAlreadyExists', emailError, 'email')).toBeTruthy()
      expect(hasDefinedGQLError('UserAlreadyExists', emailError, 'password')).toBeFalsy()
      expect(hasDefinedGQLError('Forbidden', emailError, 'email')).toBeFalsy()
    })

    it('should return true if the error is present no matter the key', () => {
      const emailError = createApolloError({
        email: ['user_already_exists'],
        password: ['forbidden'],
      })

      expect(hasDefinedGQLError('UserAlreadyExists', emailError)).toBeTruthy()
      expect(hasDefinedGQLError('Forbidden', emailError)).toBeTruthy()
      expect(hasDefinedGQLError('CurrenciesDoesNotMatch', emailError)).toBeFalsy()
    })
  })

  describe('extractThirdPartyErrorMessage', () => {
    const createThirdPartyApolloError = (errorDetail: string | string[]) =>
      ({
        graphQLErrors: [
          {
            message: 'Third Party Error',
            locations: [{ line: 2, column: 3 }],
            path: ['generateCheckoutUrl'],
            extensions: {
              status: 422,
              code: PspErrorCode.ThirdPartyError,
              details: { error: errorDetail },
            },
          },
        ],
      }) as unknown as ApolloError

    it('should return undefined if no error specified', () => {
      expect(extractThirdPartyErrorMessage()).toBeUndefined()
    })

    it('should return the error message from a third_party_error ApolloError', () => {
      const error = createThirdPartyApolloError('Amount must be at least $0.50 usd')

      expect(extractThirdPartyErrorMessage(error)).toBe('Amount must be at least $0.50 usd')
    })

    it('should return the first element when error detail is an array', () => {
      const error = createThirdPartyApolloError(['Amount must be at least $0.50 usd'])

      expect(extractThirdPartyErrorMessage(error)).toBe('Amount must be at least $0.50 usd')
    })

    it('should return undefined for non-third_party_error codes', () => {
      const error = createApolloError({ email: ['user_already_exists'] })

      expect(extractThirdPartyErrorMessage(error)).toBeUndefined()
    })

    it('should return undefined when details has no error key', () => {
      const error = {
        graphQLErrors: [
          {
            message: 'Third Party Error',
            extensions: {
              code: PspErrorCode.ThirdPartyError,
              details: { someOtherKey: ['value'] },
            },
          },
        ],
      } as unknown as ApolloError

      expect(extractThirdPartyErrorMessage(error)).toBeUndefined()
    })
  })

  describe('hasDefinedGQLError for GraphqlErrors', () => {
    it('should return false if no error specified', () => {
      expect(hasDefinedGQLError('Forbidden')).toBeFalsy()
    })

    it('should return true if the error with the specified key is present', () => {
      const emailError = createGraphQLError({ email: ['user_already_exists'] })

      expect(hasDefinedGQLError('UserAlreadyExists', emailError, 'email')).toBeTruthy()
      expect(hasDefinedGQLError('UserAlreadyExists', emailError, 'password')).toBeFalsy()
      expect(hasDefinedGQLError('Forbidden', emailError, 'email')).toBeFalsy()
    })

    it('should return true if the error is present no matter the key', () => {
      const emailError = createGraphQLError({
        email: ['user_already_exists'],
        password: ['forbidden'],
      })

      expect(hasDefinedGQLError('UserAlreadyExists', emailError)).toBeTruthy()
      expect(hasDefinedGQLError('Forbidden', emailError)).toBeTruthy()
      expect(hasDefinedGQLError('CurrenciesDoesNotMatch', emailError)).toBeFalsy()
    })
  })

  describe('isSilencedGQLError', () => {
    const extensionsOf = (
      details?: Record<string, string[]>,
      code = 'unprocessable_entity',
    ): LagoGQLError['extensions'] =>
      ({ status: 422, code, details }) as unknown as LagoGQLError['extensions']

    it('should be silent when the top-level code is listed in silentErrorCodes', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf(undefined, 'not_found'),
        silentErrorCodes: ['not_found'],
        silentErrorDetails: [],
      })

      expect(result).toBe(true)
    })

    it('should not be silent when the top-level code is not listed', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf(undefined, 'internal_error'),
        silentErrorCodes: ['not_found'],
        silentErrorDetails: [],
      })

      expect(result).toBe(false)
    })

    it('should be silent when a detail code is listed in silentErrorDetails', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf({ code: ['value_already_exist'] }),
        silentErrorCodes: [],
        silentErrorDetails: ['value_already_exist'],
      })

      expect(result).toBe(true)
    })

    it('should be silent whichever field holds the listed detail', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf({ name: ['value_already_exist'] }),
        silentErrorCodes: [],
        silentErrorDetails: ['value_already_exist'],
      })

      expect(result).toBe(true)
    })

    it('should not be silent for a 422 carrying a different detail', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf({ value: ['invalid_value'] }),
        silentErrorCodes: [],
        silentErrorDetails: ['value_already_exist'],
      })

      expect(result).toBe(false)
    })

    it('should not be silent when the error has no details', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf(undefined, 'internal_error'),
        silentErrorCodes: [],
        silentErrorDetails: ['value_already_exist'],
      })

      expect(result).toBe(false)
    })

    it('should not be silent when nothing is silenced', () => {
      const result = isSilencedGQLError({
        extensions: extensionsOf({ code: ['value_already_exist'] }),
        silentErrorCodes: [],
        silentErrorDetails: [],
      })

      expect(result).toBe(false)
    })

    it('should not be silent when the error has no extensions', () => {
      const result = isSilencedGQLError({
        extensions: undefined,
        silentErrorCodes: [],
        silentErrorDetails: [],
      })

      expect(result).toBe(false)
    })
  })
})
