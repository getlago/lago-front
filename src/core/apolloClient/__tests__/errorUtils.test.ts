import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { hasDefinedGQLError, LagoGQLError } from '~/core/apolloClient/errorUtils'

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
})
