import { AlertTypeEnum } from '~/generated/graphql'
import { isWalletCreditsAlert, isWalletOngoingAlert } from '~/pages/wallet/walletAlertForm/utils'

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
