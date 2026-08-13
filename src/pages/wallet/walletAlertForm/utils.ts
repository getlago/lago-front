import { AlertTypeEnum } from '~/generated/graphql'

/** Credits alerts hold units, not amounts: no currency, integer values only. */
export const isWalletCreditsAlert = (alertType: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.WalletCreditsBalance ||
  alertType === AlertTypeEnum.WalletCreditsOngoingBalance

/** Ongoing balances can go below zero, so their thresholds accept negatives. */
export const isWalletOngoingAlert = (alertType: AlertTypeEnum | ''): boolean =>
  alertType === AlertTypeEnum.WalletOngoingBalanceAmount ||
  alertType === AlertTypeEnum.WalletCreditsOngoingBalance
