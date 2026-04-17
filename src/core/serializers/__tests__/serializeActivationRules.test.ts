import { ActivationRuleTypeEnum } from '~/generated/graphql'
import { ActivationRuleFormEnum } from '~/pages/subscriptions/types'

import { deserializeActivationRules, serializeActivationRules } from '../serializeActivationRules'

describe('deserializeActivationRules', () => {
  describe('GIVEN activation rules with a payment rule', () => {
    describe('WHEN the rules contain a payment type', () => {
      it('THEN should return OnPayment type with the timeout hours', () => {
        const result = deserializeActivationRules([
          { type: ActivationRuleTypeEnum.Payment, timeoutHours: 48 },
        ])

        expect(result).toEqual({
          activationRuleType: ActivationRuleFormEnum.OnPayment,
          activationRuleTimeoutHours: '48',
        })
      })
    })

    describe('WHEN the payment rule has no timeout hours', () => {
      it('THEN should return default timeout of 24', () => {
        const result = deserializeActivationRules([
          { type: ActivationRuleTypeEnum.Payment, timeoutHours: null },
        ])

        expect(result).toEqual({
          activationRuleType: ActivationRuleFormEnum.OnPayment,
          activationRuleTimeoutHours: '24',
        })
      })
    })

    describe('WHEN the payment rule has timeout hours of 0', () => {
      it('THEN should return "0" as timeout hours', () => {
        const result = deserializeActivationRules([
          { type: ActivationRuleTypeEnum.Payment, timeoutHours: 0 },
        ])

        expect(result).toEqual({
          activationRuleType: ActivationRuleFormEnum.OnPayment,
          activationRuleTimeoutHours: '0',
        })
      })
    })
  })

  describe('GIVEN no activation rules', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['empty array', []],
    ])('WHEN rules are %s THEN should return Immediately with default timeout', (_, rules) => {
      const result = deserializeActivationRules(
        rules as Parameters<typeof deserializeActivationRules>[0],
      )

      expect(result).toEqual({
        activationRuleType: ActivationRuleFormEnum.Immediately,
        activationRuleTimeoutHours: '24',
      })
    })
  })
})

describe('serializeActivationRules', () => {
  describe('GIVEN activation rule type is OnPayment', () => {
    describe('WHEN timeout hours is provided', () => {
      it('THEN should return a payment rule array with the timeout', () => {
        const result = serializeActivationRules(ActivationRuleFormEnum.OnPayment, '48')

        expect(result).toEqual([
          {
            type: ActivationRuleTypeEnum.Payment,
            timeoutHours: 48,
          },
        ])
      })
    })

    describe('WHEN timeout hours is empty string', () => {
      it('THEN should return a payment rule with undefined timeout', () => {
        const result = serializeActivationRules(ActivationRuleFormEnum.OnPayment, '')

        expect(result).toEqual([
          {
            type: ActivationRuleTypeEnum.Payment,
            timeoutHours: undefined,
          },
        ])
      })
    })
  })

  describe('GIVEN activation rule type is Immediately', () => {
    describe('WHEN any timeout value is provided', () => {
      it('THEN should return undefined', () => {
        const result = serializeActivationRules(ActivationRuleFormEnum.Immediately, '48')

        expect(result).toBeUndefined()
      })
    })
  })
})
