import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { TranslateData } from '~/core/translations'
import { CurrencyEnum } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

export const walletFormErrorCodes = {
  targetOngoingBalanceShouldBeGreaterThanThreshold:
    'targetOngoingBalanceShouldBeGreaterThanThreshold',
  thresholdShouldBeLessThanTargetOngoingBalance: 'thresholdShouldBeLessThanTargetOngoingBalance',
} as const

enum TopUpAmountError {
  BelowMin = 'top-up-below-min',
  AboveMax = 'top-up-above-max',
  NotBetween = 'top-up-not-between',
}

const buildTopUpErrorLabel = (
  translate: TranslateFunc | undefined,
  key: string,
  variables: TranslateData,
): string => (translate ? translate(key, variables) : '')

export const topUpAmountError = ({
  rateAmount,
  paidCredits,
  paidTopUpMinAmountCents,
  paidTopUpMaxAmountCents,
  currency,
  translate,
  skip,
}: {
  rateAmount?: string
  paidCredits?: string
  paidTopUpMinAmountCents?: string
  paidTopUpMaxAmountCents?: string
  currency?: CurrencyEnum
  translate?: TranslateFunc
  skip?: boolean
}):
  | {
      error: TopUpAmountError
      label: string
    }
  | null
  | undefined => {
  if (skip) return
  if (!rateAmount || typeof paidCredits === 'undefined' || paidCredits === '') return
  if (Number(paidCredits) === 0) return

  const paidCreditsAmount = Number(rateAmount) * Number(paidCredits)
  const minCredits = Number(paidTopUpMinAmountCents) / Number(rateAmount)
  const maxCredits = Number(paidTopUpMaxAmountCents) / Number(rateAmount)
  const minAmount = intlFormatNumber(Number(paidTopUpMinAmountCents), {
    currency,
  })
  const maxAmount = intlFormatNumber(Number(paidTopUpMaxAmountCents), {
    currency,
  })
  const hasMin = typeof paidTopUpMinAmountCents !== 'undefined' && paidTopUpMinAmountCents !== null
  const hasMax = typeof paidTopUpMaxAmountCents !== 'undefined' && paidTopUpMaxAmountCents !== null
  const isBelow = paidCreditsAmount < Number(paidTopUpMinAmountCents)
  const isAbove = paidCreditsAmount > Number(paidTopUpMaxAmountCents)

  if (hasMin && hasMax && (isBelow || isAbove)) {
    return {
      error: TopUpAmountError.NotBetween,
      label: buildTopUpErrorLabel(translate, 'text_1758285686647a868tiok58q', {
        minCredits,
        maxCredits,
        minAmount,
        maxAmount,
      }),
    }
  }

  if (hasMin && isBelow) {
    return {
      error: TopUpAmountError.BelowMin,
      label: buildTopUpErrorLabel(translate, 'text_1758285686647tnf634qa99c', {
        minCredits,
        minAmount,
      }),
    }
  }

  if (hasMax && isAbove) {
    return {
      error: TopUpAmountError.AboveMax,
      label: buildTopUpErrorLabel(translate, 'text_175828568664787kip4pzn8l', {
        maxCredits,
        maxAmount,
      }),
    }
  }

  return null
}
