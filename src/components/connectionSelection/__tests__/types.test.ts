import { ConnectionBehaviorEnum } from '~/generated/graphql'

import { ConnectionBehavior, deriveConnectionBehavior, toConnectionChoice } from '../types'

describe('connectionSelection types', () => {
  describe('GIVEN a stored connection choice', () => {
    describe('WHEN deriving its behavior', () => {
      it.each([
        ['undefined', undefined, ConnectionBehavior.INHERIT],
        ['null', null, ConnectionBehavior.INHERIT],
        [
          'an inherit behavior',
          { behavior: ConnectionBehaviorEnum.Inherit },
          ConnectionBehavior.INHERIT,
        ],
        ['a skip behavior', { behavior: ConnectionBehaviorEnum.Skip }, ConnectionBehavior.SKIP],
        ['a code', { code: 'stripe_eu' }, ConnectionBehavior.SPECIFIC],
        ['an empty code', { code: '' }, ConnectionBehavior.SPECIFIC],
      ])('THEN should read %s as the expected behavior', (_, value, expected) => {
        expect(deriveConnectionBehavior(value)).toBe(expected)
      })
    })
  })

  describe('GIVEN a picked behavior', () => {
    describe('WHEN building the API choice', () => {
      it.each([
        [ConnectionBehavior.INHERIT, 'stripe_eu', { behavior: ConnectionBehaviorEnum.Inherit }],
        [ConnectionBehavior.SKIP, 'stripe_eu', { behavior: ConnectionBehaviorEnum.Skip }],
        [ConnectionBehavior.SPECIFIC, 'stripe_eu', { code: 'stripe_eu' }],
      ])('THEN should build the %s choice with a single key', (behavior, code, expected) => {
        expect(toConnectionChoice(behavior, code)).toEqual(expected)
      })
    })
  })
})
