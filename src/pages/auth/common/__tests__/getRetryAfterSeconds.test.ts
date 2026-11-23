import { GraphQLFormattedError } from 'graphql'

import { getRetryAfterSeconds } from '../getRetryAfterSeconds'

const buildErrors = (details: unknown): GraphQLFormattedError[] => [
  { message: 'error', extensions: { details } },
]

describe('getRetryAfterSeconds', () => {
  describe('GIVEN the first error carries a numeric retryAfterSeconds', () => {
    describe('WHEN reading the delay', () => {
      it('THEN should return it', () => {
        expect(getRetryAfterSeconds(buildErrors({ retryAfterSeconds: 42 }))).toBe(42)
      })
    })
  })

  describe('GIVEN no usable delay', () => {
    describe('WHEN reading the delay', () => {
      it.each([
        ['no errors', undefined],
        ['an empty list', []],
        ['no details', buildErrors(undefined)],
        ['null details', buildErrors(null)],
        ['string details', buildErrors('soon')],
        ['no retryAfterSeconds', buildErrors({ other: 1 })],
        ['a string retryAfterSeconds', buildErrors({ retryAfterSeconds: '42' })],
      ])('THEN should return 0 for %s', (_, errors) => {
        expect(getRetryAfterSeconds(errors)).toBe(0)
      })
    })
  })
})
