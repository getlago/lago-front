import { FC } from 'react'

import { ProviderTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Adyen from '~/public/images/adyen.svg'
import Gocardless from '~/public/images/gocardless.svg'
import Stripe from '~/public/images/stripe.svg'
import { tw } from '~/styles/utils'

import { Avatar, Typography } from './designSystem'

interface PaymentProviderChipProps {
  paymentProvider: ProviderTypeEnum
  className?: string
}

const providers: Record<ProviderTypeEnum, { icon: JSX.Element; label: string }> = {
  [ProviderTypeEnum.Stripe]: {
    icon: <Stripe />,
    label: 'text_62b1edddbf5f461ab971277d',
  },
  [ProviderTypeEnum.Adyen]: {
    icon: <Adyen />,
    label: 'text_645d071272418a14c1c76a6d',
  },
  [ProviderTypeEnum.Gocardless]: {
    icon: <Gocardless />,
    label: 'text_634ea0ecc6147de10ddb6625',
  },
}

export const PaymentProviderChip: FC<PaymentProviderChipProps> = ({
  paymentProvider,
  className,
}) => {
  const { translate } = useInternationalization()

  return (
    <div className={tw('flex flex-nowrap items-center gap-2', className)}>
      <Avatar variant="connector" size="small">
        {providers[paymentProvider].icon}
      </Avatar>
      <Typography variant="body" color="textSecondary">
        {translate(providers[paymentProvider].label)}
      </Typography>
    </div>
  )
}
