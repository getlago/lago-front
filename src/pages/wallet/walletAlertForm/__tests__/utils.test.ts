import { AlertTypeEnum, ThresholdInput } from '~/generated/graphql'
import {
  isWalletCreditsAlert,
  isWalletOngoingAlert,
  patchThreshold,
} from '~/pages/wallet/walletAlertForm/utils'

describe('isWalletCreditsAlert', () => {
  describe('GIVEN a wallet alert type', () => {
    it.each([
      [AlertTypeEnum.WalletCreditsBalance, true],
      [AlertTypeEnum.WalletCreditsOngoingBalance, true],
      [AlertTypeEnum.WalletBalanceAmount, false],
      [AlertTypeEnum.WalletOngoingBalanceAmount, false],
    ])('THEN should return %s for %s', (alertType, expected) => {
      expect(isWalletCreditsAlert(alertType)).toBe(expected)
    })
  })

  describe('GIVEN no alert type picked yet', () => {
    it('THEN should return false', () => {
      expect(isWalletCreditsAlert('')).toBe(false)
    })
  })
})

describe('isWalletOngoingAlert', () => {
  describe('GIVEN a wallet alert type', () => {
    it.each([
      [AlertTypeEnum.WalletCreditsOngoingBalance, true],
      [AlertTypeEnum.WalletOngoingBalanceAmount, true],
      [AlertTypeEnum.WalletCreditsBalance, false],
      [AlertTypeEnum.WalletBalanceAmount, false],
    ])('THEN should return %s for %s', (alertType, expected) => {
      expect(isWalletOngoingAlert(alertType)).toBe(expected)
    })
  })

  describe('GIVEN no alert type picked yet', () => {
    it('THEN should return false', () => {
      expect(isWalletOngoingAlert('')).toBe(false)
    })
  })
})

describe('patchThreshold', () => {
  const threshold: ThresholdInput = { code: 'initial-code', recurring: false, value: '100' }

  describe('GIVEN a code cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it and leave the other fields untouched', () => {
        expect(patchThreshold(threshold, 'code', 'new-code')).toEqual({
          code: 'new-code',
          recurring: false,
          value: '100',
        })
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store no code rather than the "undefined" string', () => {
        expect(patchThreshold(threshold, 'code', undefined).code).toBeUndefined()
      })
    })
  })

  describe('GIVEN a value cell', () => {
    describe('WHEN it receives a value', () => {
      it('THEN should store it as a string', () => {
        expect(patchThreshold(threshold, 'value', 250).value).toBe('250')
      })
    })

    describe('WHEN it is emptied', () => {
      it('THEN should store an empty string, as the API type requires one', () => {
        expect(patchThreshold(threshold, 'value', undefined).value).toBe('')
      })
    })
  })

  describe('GIVEN the recurring flag', () => {
    describe('WHEN it is toggled', () => {
      it('THEN should store a real boolean', () => {
        expect(patchThreshold(threshold, 'recurring', true).recurring).toBe(true)
      })
    })
  })

  describe('GIVEN any patch', () => {
    describe('WHEN it is applied', () => {
      it('THEN should not mutate the original threshold', () => {
        patchThreshold(threshold, 'value', '999')

        expect(threshold.value).toBe('100')
      })
    })
  })
})
