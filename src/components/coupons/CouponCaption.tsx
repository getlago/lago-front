import { memo } from 'react'
import { gql } from '@apollo/client'
import { TypographyProps } from '@mui/material'

import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CouponItemFragment, CouponTypeEnum, CouponFrequency } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography } from '~/components/designSystem'

gql`
  fragment CouponCaption on Coupon {
    id
    amountCurrency
    amountCents
    couponType
    percentageRate
    frequency
    frequencyDuration
  }

  fragment AppliedCouponCaption on AppliedCoupon {
    id
    amountCurrency
    amountCents
    amountCentsRemaining
    percentageRate
    frequency
    frequencyDuration
    frequencyDurationRemaining
  }
`

export interface CouponMixedType extends CouponItemFragment {
  amountCentsRemaining?: number
  frequencyDurationRemaining?: number
}

interface CouponCaptionProps {
  coupon: CouponMixedType
  variant?: TypographyProps['variant']
}

export const CouponCaption = memo(({ coupon, variant = 'caption' }: CouponCaptionProps) => {
  const { translate } = useInternationalization()

  const getCaption = () => {
    const {
      amountCurrency,
      amountCents,
      amountCentsRemaining,
      percentageRate,
      frequency,
      frequencyDuration,
      frequencyDurationRemaining,
    } = coupon
    let couponType = amountCents ? CouponTypeEnum.FixedAmount : CouponTypeEnum.Percentage

    if (couponType === CouponTypeEnum.FixedAmount && frequency === CouponFrequency.Once) {
      return translate(
        amountCentsRemaining ? 'text_637b4da08cd0118cd0c4486f' : 'text_632d68358f1fedc68eed3e70',
        {
          amount: intlFormatNumber(amountCentsRemaining || amountCents || 0, {
            currencyDisplay: 'symbol',
            currency: amountCurrency || undefined,
          }),
        }
      )
    } else if (couponType === CouponTypeEnum.Percentage && frequency === CouponFrequency.Once) {
      return translate('text_632d68358f1fedc68eed3eb5', {
        rate: intlFormatNumber(Number(percentageRate) || 0, {
          minimumFractionDigits: 2,
          style: 'percent',
        }),
      })
    } else if (
      couponType === CouponTypeEnum.FixedAmount &&
      frequency === CouponFrequency.Recurring
    ) {
      return translate(
        'text_632d68358f1fedc68eed3ede',
        {
          amount: intlFormatNumber(amountCentsRemaining || amountCents || 0, {
            currencyDisplay: 'symbol',
            currency: amountCurrency || undefined,
          }),
          duration: frequencyDurationRemaining || frequencyDuration,
        },
        frequencyDurationRemaining || frequencyDuration || 1
      )
    } else if (
      couponType === CouponTypeEnum.Percentage &&
      frequency === CouponFrequency.Recurring
    ) {
      return translate(
        'text_632d68358f1fedc68eed3ef9',
        {
          rate: intlFormatNumber(Number(percentageRate) || 0, {
            minimumFractionDigits: 2,
            style: 'percent',
          }),
          duration: frequencyDurationRemaining || frequencyDuration,
        },
        frequencyDurationRemaining || frequencyDuration || 1
      )
    }
  }

  return (
    <Typography variant={variant} color="grey600" noWrap>
      {getCaption()}
    </Typography>
  )
})

CouponCaption.displayName = 'CouponCaption'
